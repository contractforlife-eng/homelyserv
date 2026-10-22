package com.homelyserv.app;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.cert.Certificate;
import java.security.spec.ECGenParameterSpec;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;

@CapacitorPlugin(
    name = "HomelyServFamilyTracking",
    permissions = {
        @Permission(alias = "foregroundLocation", strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }),
        @Permission(alias = "backgroundLocation", strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION }),
        @Permission(alias = "activityRecognition", strings = { Manifest.permission.ACTIVITY_RECOGNITION }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class HomelyServFamilyTrackingPlugin extends Plugin {
    private static final String SIGNING_KEY_ALIAS = "homelyserv_family_tracking_native_proof";
    private static final String PROOF_VERSION = "android-native-v1";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getStatus(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(FamilyTrackingService.PREFS, android.content.Context.MODE_PRIVATE);
        JSObject result = new JSObject();
        result.put("supported", true);
        result.put("foregroundPermission", hasForegroundPermission());
        result.put("backgroundPermission", hasBackgroundPermission());
        result.put("notificationPermission", hasNotificationPermission());
        result.put("activityRecognitionPermission", hasActivityRecognitionPermission());
        result.put("configured", prefs.contains("studentId") && prefs.contains("token"));
        result.put("queueSize", new FamilyTrackingQueue(getContext()).size());
        call.resolve(result);
    }

    @PluginMethod
    public void requestForegroundPermissions(PluginCall call) {
        requestPermissionForAlias("foregroundLocation", call, "foregroundPermissionCallback");
    }

    @PermissionCallback
    private void foregroundPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("foregroundPermission", hasForegroundPermission());
        call.resolve(result);
    }

    @PluginMethod
    public void requestSupportingPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "supportingPermissionCallback");
            return;
        }
        if (Build.VERSION.SDK_INT >= 29 && getPermissionState("activityRecognition") != PermissionState.GRANTED) {
            requestPermissionForAlias("activityRecognition", call, "supportingPermissionCallback");
            return;
        }
        supportingPermissionCallback(call);
    }

    @PermissionCallback
    private void supportingPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("notificationPermission", hasNotificationPermission());
        result.put("activityRecognitionPermission", hasActivityRecognitionPermission());
        call.resolve(result);
    }

    @PluginMethod
    public void openBackgroundPermissionSettings(PluginCall call) {
        if (!hasForegroundPermission()) {
            call.reject("Foreground location permission is required first.", "FOREGROUND_PERMISSION_REQUIRED");
            return;
        }
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", getContext().getPackageName(), null));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void activate(PluginCall call) {
        String studentId = call.getString("studentId");
        String token = call.getString("token");
        String apiBase = call.getString("apiBase");
        String challenge = call.getString("challenge");
        if (studentId == null || token == null || apiBase == null || challenge == null) {
            call.reject("Activation data is incomplete.", "ACTIVATION_DATA_REQUIRED");
            return;
        }
        if (!hasForegroundPermission() || !hasBackgroundPermission() || !hasNotificationPermission()) {
            call.reject("Required Android permissions are not granted.", "PERMISSION_REQUIRED");
            return;
        }
        executor.execute(() -> completeActivation(call, studentId, token, trimTrailingSlash(apiBase), challenge));
    }

    private void completeActivation(PluginCall call, String studentId, String token, String apiBase, String challenge) {
        HttpURLConnection connection = null;
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            if (!keyStore.containsAlias(SIGNING_KEY_ALIAS)) {
                KeyPairGenerator generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");
                generator.initialize(new KeyGenParameterSpec.Builder(SIGNING_KEY_ALIAS, KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
                    .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .build());
                generator.generateKeyPair();
            }
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(SIGNING_KEY_ALIAS, null);
            Certificate certificate = keyStore.getCertificate(SIGNING_KEY_ALIAS);
            String permissionStatus = "GRANTED_BACKGROUND";
            String payload = PROOF_VERSION + "\n" + studentId + "\n" + challenge + "\n" + permissionStatus;
            Signature signer = Signature.getInstance("SHA256withECDSA");
            signer.initSign(privateKey);
            signer.update(payload.getBytes(StandardCharsets.UTF_8));
            String signature = Base64.encodeToString(signer.sign(), Base64.NO_WRAP);
            String publicKey = pemPublicKey(certificate.getPublicKey().getEncoded());

            JSONObject requestBody = new JSONObject();
            requestBody.put("proofVersion", PROOF_VERSION);
            requestBody.put("challenge", challenge);
            requestBody.put("permissionStatus", permissionStatus);
            requestBody.put("publicKey", publicKey);
            requestBody.put("signature", signature);
            connection = (HttpURLConnection) new URL(apiBase + "/api/parent-students/" + studentId + "/tracking/activation/native-complete").openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(20_000);
            connection.setRequestProperty("Authorization", "Bearer " + token);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("X-Client-Platform", "android");
            connection.setDoOutput(true);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(requestBody.toString().getBytes(StandardCharsets.UTF_8));
            }
            int status = connection.getResponseCode();
            String responseBody = readBody(status >= 400 ? connection.getErrorStream() : connection.getInputStream());
            if (status < 200 || status >= 300) {
                call.reject("Server did not activate tracking.", "ACTIVATION_REJECTED", new Exception(responseBody));
                return;
            }
            getContext().getSharedPreferences(FamilyTrackingService.PREFS, android.content.Context.MODE_PRIVATE).edit()
                .putString("studentId", studentId)
                .putString("apiBase", apiBase)
                .putString("token", FamilyTrackingCrypto.encrypt(token))
                .apply();
            ContextCompat.startForegroundService(getContext(), new Intent(getContext(), FamilyTrackingService.class));
            JSObject result = new JSObject();
            result.put("active", true);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Native activation could not be completed.", "NATIVE_ACTIVATION_FAILED");
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent stop = new Intent(getContext(), FamilyTrackingService.class).setAction(FamilyTrackingService.ACTION_STOP);
        getContext().startService(stop);
        new FamilyTrackingQueue(getContext()).clear();
        getContext().getSharedPreferences(FamilyTrackingService.PREFS, android.content.Context.MODE_PRIVATE).edit().clear().apply();
        call.resolve();
    }

    private boolean hasForegroundPermission() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasBackgroundPermission() {
        return Build.VERSION.SDK_INT < 29
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasNotificationPermission() {
        return Build.VERSION.SDK_INT < 33
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasActivityRecognitionPermission() {
        return Build.VERSION.SDK_INT < 29
            || ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
    }

    private String pemPublicKey(byte[] encoded) {
        String base64 = Base64.encodeToString(encoded, Base64.NO_WRAP);
        StringBuilder body = new StringBuilder();
        for (int index = 0; index < base64.length(); index += 64) {
            body.append(base64, index, Math.min(index + 64, base64.length())).append('\n');
        }
        return "-----BEGIN PUBLIC KEY-----\n" + body + "-----END PUBLIC KEY-----\n";
    }

    private String readBody(InputStream stream) throws Exception {
        if (stream == null) return "";
        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) result.append(line);
        }
        return result.toString();
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    @Override
    protected void handleOnDestroy() {
        executor.shutdownNow();
        super.handleOnDestroy();
    }
}
