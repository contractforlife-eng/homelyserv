package com.homelyserv.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.KeyProperties;
import android.security.keystore.UserNotAuthenticatedException;
import android.util.Base64;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.Key;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "HomelyServBiometricUnlock")
public class HomelyServBiometricUnlockPlugin extends Plugin {

    private static final String KEY_ALIAS = "homelyserv_biometric_unlock_key";
    private static final String PREFS_NAME = "homelyserv_biometric_unlock";
    private static final String PREF_CIPHERTEXT = "ciphertext";
    private static final String PREF_IV = "iv";
    private static final String PREF_ENABLED = "enabled";
    private static final int GCM_TAG_LENGTH_BITS = 128;

    private final Executor biometricExecutor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void isAvailable(PluginCall call) {
        BiometricManager biometricManager = BiometricManager.from(getContext());
        int result = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);

        JSObject response = new JSObject();
        response.put("available", result == BiometricManager.BIOMETRIC_SUCCESS);
        response.put("hardwareAvailable", result != BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE);
        response.put("enrolled", result == BiometricManager.BIOMETRIC_SUCCESS);
        response.put("strongAvailable", result == BiometricManager.BIOMETRIC_SUCCESS);
        response.put("code", availabilityCode(result));
        call.resolve(response);
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject response = new JSObject();
        response.put("enabled", false);

        SharedPreferences preferences = preferences();
        if (!preferences.getBoolean(PREF_ENABLED, false)
            || !preferences.contains(PREF_CIPHERTEXT)
            || !preferences.contains(PREF_IV)) {
            response.put("reason", "SECURE_TOKEN_MISSING");
            call.resolve(response);
            return;
        }

        try {
            SecretKey key = getKey();
            if (key == null || !isKeyUsable(key)) {
                response.put("reason", "KEY_INVALIDATED");
                call.resolve(response);
                return;
            }

            response.put("enabled", true);
            response.put("reason", "ENABLED");
            call.resolve(response);
        } catch (KeyPermanentlyInvalidatedException exception) {
            clearStoredEnrollment();
            response.put("reason", "KEY_INVALIDATED");
            call.resolve(response);
        } catch (GeneralSecurityException exception) {
            response.put("reason", "CRYPTOGRAPHIC_FAILURE");
            call.resolve(response);
        }
    }

    @PluginMethod
    public void enable(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.isEmpty()) {
            reject(call, "SECURE_TOKEN_MISSING", "An existing authenticated token is required.");
            return;
        }

        int availability = BiometricManager.from(getContext())
            .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
        if (availability != BiometricManager.BIOMETRIC_SUCCESS) {
            reject(call, availabilityCode(availability), "Strong biometric authentication is unavailable.");
            return;
        }

        Cipher cipher;
        try {
            SecretKey key = getOrCreateKey();
            cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key);
        } catch (KeyPermanentlyInvalidatedException exception) {
            deleteKey();
            try {
                SecretKey key = createKey();
                cipher = Cipher.getInstance("AES/GCM/NoPadding");
                cipher.init(Cipher.ENCRYPT_MODE, key);
            } catch (GeneralSecurityException retryException) {
                reject(call, "CRYPTOGRAPHIC_FAILURE", "Unable to prepare secure biometric storage.");
                return;
            }
        } catch (GeneralSecurityException exception) {
            reject(call, "CRYPTOGRAPHIC_FAILURE", "Unable to prepare secure biometric storage.");
            return;
        }

        authenticate(call, cipher, true, token);
    }

    @PluginMethod
    public void unlock(PluginCall call) {
        SharedPreferences preferences = preferences();
        if (!preferences.getBoolean(PREF_ENABLED, false)
            || !preferences.contains(PREF_CIPHERTEXT)
            || !preferences.contains(PREF_IV)) {
            reject(call, "SECURE_TOKEN_MISSING", "No biometric session is enrolled.");
            return;
        }

        final Cipher cipher;
        try {
            SecretKey key = getKey();
            if (key == null) {
                clearStoredEnrollment();
                reject(call, "KEY_INVALIDATED", "Biometric enrollment must be enabled again.");
                return;
            }

            byte[] iv = Base64.decode(preferences.getString(PREF_IV, ""), Base64.NO_WRAP);
            cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
        } catch (KeyPermanentlyInvalidatedException exception) {
            clearStoredEnrollment();
            reject(call, "KEY_INVALIDATED", "Biometric enrollment must be enabled again.");
            return;
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            reject(call, "CRYPTOGRAPHIC_FAILURE", "Unable to prepare secure biometric unlock.");
            return;
        }

        authenticate(call, cipher, false, null);
    }

    @PluginMethod
    public void disable(PluginCall call) {
        clearStoredEnrollment();
        call.resolve();
    }

    private void authenticate(PluginCall call, Cipher cipher, boolean encrypt, String token) {
        call.setKeepAlive(true);
        AtomicBoolean completed = new AtomicBoolean(false);

        BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                try {
                    Cipher authenticatedCipher = result.getCryptoObject() == null
                        ? null
                        : result.getCryptoObject().getCipher();
                    if (authenticatedCipher == null) {
                        finishReject(call, completed, "CRYPTOGRAPHIC_FAILURE", "Biometric cipher was not available.");
                        return;
                    }

                    if (encrypt) {
                        byte[] ciphertext = authenticatedCipher.doFinal(token.getBytes(StandardCharsets.UTF_8));
                        preferences().edit()
                            .putString(PREF_CIPHERTEXT, Base64.encodeToString(ciphertext, Base64.NO_WRAP))
                            .putString(PREF_IV, Base64.encodeToString(authenticatedCipher.getIV(), Base64.NO_WRAP))
                            .putBoolean(PREF_ENABLED, true)
                            .apply();

                        JSObject response = new JSObject();
                        response.put("enabled", true);
                        finishResolve(call, completed, response);
                    } else {
                        byte[] ciphertext = Base64.decode(
                            preferences().getString(PREF_CIPHERTEXT, ""),
                            Base64.NO_WRAP
                        );
                        String decryptedToken = new String(authenticatedCipher.doFinal(ciphertext), StandardCharsets.UTF_8);
                        JSObject response = new JSObject();
                        response.put("token", decryptedToken);
                        finishResolve(call, completed, response);
                    }
                } catch (GeneralSecurityException | IllegalArgumentException exception) {
                    finishReject(call, completed, "CRYPTOGRAPHIC_FAILURE", "Biometric secure storage could not be used.");
                }
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                finishReject(call, completed, biometricErrorCode(errorCode), "Biometric authentication was not completed.");
            }

            @Override
            public void onAuthenticationFailed() {
                // Keep the prompt active so the user can retry. No secret is exposed here.
            }
        };

        try {
            if (getActivity() == null || getActivity().isFinishing() || getActivity().isDestroyed()) {
                finishReject(call, completed, "BIOMETRIC_PROMPT_UNAVAILABLE", "Biometric prompt is unavailable.");
                return;
            }

            getActivity().runOnUiThread(() -> {
                try {
                    BiometricPrompt prompt = new BiometricPrompt(getActivity(), biometricExecutor, callback);
                    BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle("HomelyServ biometric unlock")
                        .setSubtitle(encrypt ? "Confirm to enable biometric unlock" : "Confirm to unlock HomelyServ")
                        .setNegativeButtonText("Use normal login")
                        .build();

                    // Keep this exact cipher instance bound to the prompt. The
                    // authenticated CryptoObject performs the token operation.
                    prompt.authenticate(promptInfo, new BiometricPrompt.CryptoObject(cipher));
                } catch (IllegalStateException exception) {
                    finishReject(call, completed, "BIOMETRIC_PROMPT_UNAVAILABLE", "Biometric prompt is unavailable.");
                } catch (IllegalArgumentException exception) {
                    finishReject(call, completed, "BIOMETRIC_PROMPT_INVALID", "Biometric prompt could not be started.");
                }
            });
        } catch (IllegalStateException exception) {
            finishReject(call, completed, "BIOMETRIC_PROMPT_UNAVAILABLE", "Biometric prompt is unavailable.");
        } catch (IllegalArgumentException exception) {
            finishReject(call, completed, "BIOMETRIC_PROMPT_INVALID", "Biometric prompt could not be started.");
        }
    }

    private SecretKey getOrCreateKey() throws GeneralSecurityException {
        SecretKey existingKey = getKey();
        return existingKey != null ? existingKey : createKey();
    }

    private SecretKey createKey() throws GeneralSecurityException {
        KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setUserAuthenticationRequired(true)
            .setInvalidatedByBiometricEnrollment(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
        } else {
            builder.setUserAuthenticationValidityDurationSeconds(-1);
        }

        keyGenerator.init(builder.build());
        return keyGenerator.generateKey();
    }

    private SecretKey getKey() throws GeneralSecurityException {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        try {
            keyStore.load(null);
        } catch (Exception exception) {
            throw new GeneralSecurityException("Unable to load Android Keystore", exception);
        }
        Key key = keyStore.getKey(KEY_ALIAS, null);
        return key instanceof SecretKey ? (SecretKey) key : null;
    }

    private boolean isKeyUsable(SecretKey key) throws GeneralSecurityException {
        try {
            Cipher probe = Cipher.getInstance("AES/GCM/NoPadding");
            probe.init(Cipher.ENCRYPT_MODE, key);
            return true;
        } catch (UserNotAuthenticatedException exception) {
            // The key is valid; this expected state only means BiometricPrompt
            // must authenticate before the cipher can be used.
            return true;
        } catch (KeyPermanentlyInvalidatedException exception) {
            clearStoredEnrollment();
            return false;
        }
    }

    private void deleteKey() {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            if (keyStore.containsAlias(KEY_ALIAS)) {
                keyStore.deleteEntry(KEY_ALIAS);
            }
        } catch (Exception ignored) {
            // Deletion is best effort; no secret is logged or returned.
        }
    }

    private void clearStoredEnrollment() {
        preferences().edit().clear().apply();
        deleteKey();
    }

    private SharedPreferences preferences() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private void reject(PluginCall call, String code, String message) {
        call.reject(message, code);
    }

    private void finishResolve(PluginCall call, AtomicBoolean completed, JSObject response) {
        if (completed.compareAndSet(false, true)) {
            call.setKeepAlive(false);
            call.resolve(response);
        }
    }

    private void finishReject(PluginCall call, AtomicBoolean completed, String code, String message) {
        if (completed.compareAndSet(false, true)) {
            call.setKeepAlive(false);
            call.reject(message, code);
        }
    }

    private String availabilityCode(int result) {
        switch (result) {
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                return "NO_BIOMETRIC_HARDWARE";
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return "NO_ENROLLED_BIOMETRIC";
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return "BIOMETRIC_HARDWARE_UNAVAILABLE";
            case BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED:
                return "BIOMETRIC_SECURITY_UPDATE_REQUIRED";
            case BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED:
                return "BIOMETRIC_NOT_SUPPORTED";
            case BiometricManager.BIOMETRIC_SUCCESS:
                return "AVAILABLE";
            default:
                return "BIOMETRIC_UNAVAILABLE";
        }
    }

    private String biometricErrorCode(int errorCode) {
        switch (errorCode) {
            case BiometricPrompt.ERROR_USER_CANCELED:
            case BiometricPrompt.ERROR_NEGATIVE_BUTTON:
            case BiometricPrompt.ERROR_CANCELED:
                return "USER_CANCELLED";
            case BiometricPrompt.ERROR_LOCKOUT:
            case BiometricPrompt.ERROR_LOCKOUT_PERMANENT:
                return "BIOMETRIC_LOCKOUT";
            case BiometricPrompt.ERROR_NO_BIOMETRICS:
                return "NO_ENROLLED_BIOMETRIC";
            case BiometricPrompt.ERROR_HW_NOT_PRESENT:
                return "NO_BIOMETRIC_HARDWARE";
            case BiometricPrompt.ERROR_HW_UNAVAILABLE:
                return "BIOMETRIC_HARDWARE_UNAVAILABLE";
            default:
                return "BIOMETRIC_AUTHENTICATION_FAILED";
        }
    }
}
