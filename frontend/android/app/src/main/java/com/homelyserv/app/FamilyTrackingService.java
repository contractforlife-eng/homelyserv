package com.homelyserv.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Network;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Handler;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class FamilyTrackingService extends Service implements SensorEventListener {
    static final String PREFS = "homelyserv_family_tracking";
    static final String ACTION_STOP = "com.homelyserv.app.familytracking.STOP";
    static final String ACTION_PAUSE_CLICK = "com.homelyserv.app.familytracking.PAUSE_CLICK";
    private static final String CHANNEL_ID = "family_tracking_active";
    private static final int NOTIFICATION_ID = 8104;

    private final ExecutorService networkExecutor = Executors.newSingleThreadExecutor();
    private FusedLocationProviderClient locationClient;
    private FamilyTrackingQueue queue;
    private LocationCallback callback;
    private boolean moving = true;
    private Location previousLocation;
    private SensorManager sensorManager;
    private final Handler handler = new Handler(android.os.Looper.getMainLooper());
    private final Runnable markStationary = () -> setMoving(false);
    private final Runnable permissionAudit = new Runnable() {
        @Override public void run() {
            if (!hasRequiredPermissions()) networkExecutor.execute(FamilyTrackingService.this::reportRevokedAndStop);
            else handler.postDelayed(this, 60_000L);
        }
    };
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;

    @Override
    public void onCreate() {
        super.onCreate();
        queue = new FamilyTrackingQueue(this);
        locationClient = LocationServices.getFusedLocationProviderClient(this);
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        Sensor stepDetector = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR);
        if (stepDetector != null && (Build.VERSION.SDK_INT < 29
            || ContextCompat.checkSelfPermission(this, Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED)) {
            sensorManager.registerListener(this, stepDetector, SensorManager.SENSOR_DELAY_NORMAL);
        }
        createNotificationChannel();
        connectivityManager = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override public void onAvailable(Network network) { networkExecutor.execute(FamilyTrackingService.this::flushQueue); }
        };
        connectivityManager.registerDefaultNetworkCallback(networkCallback);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && (ACTION_STOP.equals(intent.getAction()) || ACTION_PAUSE_CLICK.equals(intent.getAction()))) {
            networkExecutor.execute(this::pauseServerAndStop);
            return START_NOT_STICKY;
        }
        if (!hasRequiredPermissions()) {
            stopTracking(true);
            return START_NOT_STICKY;
        }
        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification(),
            Build.VERSION.SDK_INT >= 29 ? android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION : 0);
        requestAdaptiveUpdates();
        handler.removeCallbacks(permissionAudit);
        handler.postDelayed(permissionAudit, 60_000L);
        networkExecutor.execute(this::flushQueue);
        return START_NOT_STICKY;
    }

    private void requestAdaptiveUpdates() {
        if (callback != null) locationClient.removeLocationUpdates(callback);
        long interval = FamilyTrackingPolicy.interval(moving);
        float distance = FamilyTrackingPolicy.distance(moving);
        LocationRequest request = new LocationRequest.Builder(Priority.PRIORITY_BALANCED_POWER_ACCURACY, interval)
            .setMinUpdateIntervalMillis(interval)
            .setMinUpdateDistanceMeters(distance)
            .setMaxUpdateDelayMillis(interval * 2)
            .build();
        callback = new LocationCallback() {
            @Override public void onLocationResult(LocationResult result) {
                for (Location location : result.getLocations()) handleLocation(location);
            }
        };
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            locationClient.requestLocationUpdates(request, callback, getMainLooper());
        }
    }

    private void handleLocation(Location location) {
        float displacement = previousLocation == null ? 0f : location.distanceTo(previousLocation);
        boolean nowMoving = FamilyTrackingPolicy.indicatesMovement(location.hasSpeed(), location.getSpeed(), displacement);
        previousLocation = location;
        try {
            JSONObject observation = new JSONObject();
            observation.put("observationId", UUID.randomUUID().toString());
            observation.put("latitude", location.getLatitude());
            observation.put("longitude", location.getLongitude());
            observation.put("accuracy", (double) location.getAccuracy());
            SimpleDateFormat timestampFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            timestampFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
            observation.put("recordedAt", timestampFormat.format(new Date(location.getTime())));
            if (location.hasSpeed()) observation.put("speed", (double) location.getSpeed());
            if (location.hasBearing()) observation.put("heading", (double) location.getBearing());
            queue.enqueue(observation.toString());
        } catch (Exception ignored) {
            return;
        }
        networkExecutor.execute(this::flushQueue);
        if (nowMoving) setMoving(true);
        else handler.postDelayed(markStationary, FamilyTrackingPolicy.STATIONARY_AFTER_MS);
    }

    private void flushQueue() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
            String apiBase = prefs.getString("apiBase", "");
            String studentId = prefs.getString("studentId", "");
            String encryptedToken = prefs.getString("token", "");
            if (apiBase.isEmpty() || studentId.isEmpty() || encryptedToken.isEmpty()) return;
            String token = FamilyTrackingCrypto.decrypt(encryptedToken);
            List<FamilyTrackingQueue.Entry> entries = queue.peek(20);
            if (entries.isEmpty()) return;
            JSONArray observations = new JSONArray();
            for (FamilyTrackingQueue.Entry entry : entries) observations.put(new JSONObject(entry.json));
            JSONObject body = new JSONObject().put("observations", observations);
            HttpURLConnection connection = (HttpURLConnection) new URL(
                apiBase + "/api/parent-students/" + studentId + "/tracking/observations"
            ).openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(20_000);
            connection.setRequestProperty("Authorization", "Bearer " + token);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("X-Client-Platform", "android");
            connection.setDoOutput(true);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
            int status = connection.getResponseCode();
            connection.disconnect();
            if (status >= 200 && status < 300) queue.removeThrough(entries.get(entries.size() - 1).id);
            if (status == 401 || status == 403 || status == 409) stopTracking(true);
        } catch (Exception ignored) {
            // Offline and transient failures retain the encrypted bounded queue for a later retry.
        }
    }

    private boolean hasRequiredPermissions() {
        boolean foreground = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean background = Build.VERSION.SDK_INT < 29
            || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return foreground && background;
    }

    private void setMoving(boolean value) {
        handler.removeCallbacks(markStationary);
        if (moving != value) {
            moving = value;
            requestAdaptiveUpdates();
        }
        if (value) handler.postDelayed(markStationary, FamilyTrackingPolicy.STATIONARY_AFTER_MS);
    }

    @Override public void onSensorChanged(SensorEvent event) { setMoving(true); }
    @Override public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    private void pauseServerAndStop() {
        HttpURLConnection connection = null;
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
            String apiBase = prefs.getString("apiBase", "");
            String studentId = prefs.getString("studentId", "");
            String encryptedToken = prefs.getString("token", "");
            if (!apiBase.isEmpty() && !studentId.isEmpty() && !encryptedToken.isEmpty()) {
                connection = (HttpURLConnection) new URL(apiBase + "/api/parent-students/" + studentId + "/tracking/pause").openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(10_000);
                connection.setReadTimeout(10_000);
                connection.setRequestProperty("Authorization", "Bearer " + FamilyTrackingCrypto.decrypt(encryptedToken));
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                try (OutputStream output = connection.getOutputStream()) { output.write("{}".getBytes(StandardCharsets.UTF_8)); }
                connection.getResponseCode();
            }
        } catch (Exception ignored) {
            // Collection still stops locally even if the pause acknowledgement cannot reach the server.
        } finally {
            if (connection != null) connection.disconnect();
            stopTracking(true);
        }
    }

    private void reportRevokedAndStop() {
        HttpURLConnection connection = null;
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
            String apiBase = prefs.getString("apiBase", "");
            String studentId = prefs.getString("studentId", "");
            String encryptedToken = prefs.getString("token", "");
            if (!apiBase.isEmpty() && !studentId.isEmpty() && !encryptedToken.isEmpty()) {
                connection = (HttpURLConnection) new URL(apiBase + "/api/parent-students/" + studentId + "/tracking/status").openConnection();
                connection.setRequestMethod("PUT");
                connection.setConnectTimeout(10_000);
                connection.setReadTimeout(10_000);
                connection.setRequestProperty("Authorization", "Bearer " + FamilyTrackingCrypto.decrypt(encryptedToken));
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write("{\"permissionStatus\":\"DENIED\",\"platform\":\"android\"}".getBytes(StandardCharsets.UTF_8));
                }
                connection.getResponseCode();
            }
        } catch (Exception ignored) {
        } finally {
            if (connection != null) connection.disconnect();
            stopTracking(true);
        }
    }

    private Notification notification() {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent content = PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Intent stopIntent = new Intent(this, FamilyTrackingService.class).setAction(ACTION_PAUSE_CLICK);
        PendingIntent stop = PendingIntent.getService(this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("HomelyServ Family Tracking is active")
            .setContentText("Your location is being recorded for your approved guardian.")
            .setOngoing(true).setOnlyAlertOnce(true).setContentIntent(content)
            .addAction(0, "Pause tracking", stop).build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Family Tracking", NotificationManager.IMPORTANCE_LOW);
            channel.setDescription("Visible while student-authorized family location collection is active.");
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    private void stopTracking(boolean clearAuthorization) {
        if (callback != null) locationClient.removeLocationUpdates(callback);
        handler.removeCallbacksAndMessages(null);
        if (sensorManager != null) sensorManager.unregisterListener(this);
        if (connectivityManager != null && networkCallback != null) {
            try { connectivityManager.unregisterNetworkCallback(networkCallback); } catch (IllegalArgumentException ignored) {}
        }
        if (clearAuthorization) {
            queue.clear();
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().clear().apply();
        }
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Nullable @Override public IBinder onBind(Intent intent) { return null; }

    @Override public void onDestroy() {
        if (callback != null) locationClient.removeLocationUpdates(callback);
        networkExecutor.shutdownNow();
        super.onDestroy();
    }
}
