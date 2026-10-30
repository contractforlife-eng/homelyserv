package com.homelyserv.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "HomelyServFileOpener")
public class HomelyServFileOpenerPlugin extends Plugin {

    private static final String MIME_OCTET_STREAM = "application/octet-stream";

    /**
     * Helper to resolve canonical MIME type from extension or input MIME type.
     */
    private String resolveMimeType(String filename, String rawMimeType) {
        String ext = "";
        int dotIdx = filename.lastIndexOf('.');
        if (dotIdx >= 0 && dotIdx < filename.length() - 1) {
            ext = filename.substring(dotIdx + 1).toLowerCase();
        }

        switch (ext) {
            case "pdf":
                return "application/pdf";
            case "doc":
                return "application/msword";
            case "docx":
                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "webp":
                return "image/webp";
            default:
                if (rawMimeType != null && !rawMimeType.trim().isEmpty() && !rawMimeType.equalsIgnoreCase(MIME_OCTET_STREAM)) {
                    return rawMimeType;
                }
                String guessed = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
                return (guessed != null && !guessed.isEmpty()) ? guessed : MIME_OCTET_STREAM;
        }
    }

    /**
     * Sanitizes filename while preserving Arabic and Unicode characters.
     */
    private String sanitizeFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return "Applicant_CV.pdf";
        }
        // Take basename to prevent directory traversal
        String name = new File(filename).getName();
        // Replace reserved characters / \ ? % * : | " < > and control chars
        name = name.replaceAll("[/\\\\?%*:|\"<>\\x00-\\x1F]", "_").trim();
        return name.isEmpty() ? "Applicant_CV.pdf" : name;
    }

    /**
     * Downloads and permanently saves a base64 file to the user's Downloads folder.
     */
    @PluginMethod
    public void downloadFile(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String rawFilename = call.getString("filename");
        String rawMimeType = call.getString("mimeType");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("MISSING_DATA", "Base64 data is required");
            return;
        }

        String filename = sanitizeFilename(rawFilename);
        String mimeType = resolveMimeType(filename, rawMimeType);

        byte[] decodedBytes;
        try {
            decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
        } catch (IllegalArgumentException e) {
            call.reject("INVALID_BASE64", "Invalid base64 payload: " + e.getMessage());
            return;
        }

        Context context = getContext();
        if (context == null) {
            call.reject("CONTEXT_UNAVAILABLE", "Android context is unavailable");
            return;
        }

        // On Android 10+ (API 29+), use MediaStore.Downloads (Scoped Storage compliant, no permissions needed)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveViaMediaStore(call, context, filename, mimeType, decodedBytes);
        } else {
            // Android 9 and below: Fallback to ACTION_CREATE_DOCUMENT system SAF picker
            saveViaCreateDocumentPicker(call, filename, mimeType, base64Data);
        }
    }

    /**
     * Saves file via MediaStore.Downloads (API 29+).
     * Handles duplicate filenames automatically (Android appends (1), (2), etc.)
     * Rolls back / deletes if partial write fails.
     */
    private void saveViaMediaStore(PluginCall call, Context context, String filename, String mimeType, byte[] bytes) {
        ContentResolver resolver = context.getContentResolver();
        ContentValues contentValues = new ContentValues();
        contentValues.put(MediaStore.Downloads.DISPLAY_NAME, filename);
        contentValues.put(MediaStore.Downloads.MIME_TYPE, mimeType);
        contentValues.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
        contentValues.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri uri = null;
        try {
            uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
            if (uri == null) {
                call.reject("SAVE_FAILED", "Failed to create MediaStore entry in Downloads");
                return;
            }

            try (OutputStream os = resolver.openOutputStream(uri)) {
                if (os == null) {
                    throw new IOException("Unable to open output stream for MediaStore URI");
                }
                os.write(bytes);
                os.flush();
            }

            // Mark as complete so other apps and file managers can read it
            contentValues.clear();
            contentValues.put(MediaStore.Downloads.IS_PENDING, 0);
            resolver.update(uri, contentValues, null, null);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("filename", filename);
            ret.put("uri", uri.toString());
            ret.put("mimeType", mimeType);
            call.resolve(ret);
        } catch (Exception e) {
            // Cleanup partial write
            if (uri != null) {
                try {
                    resolver.delete(uri, null, null);
                } catch (Exception ignored) {}
            }
            call.reject("IO_ERROR", "Failed to save file to Downloads: " + e.getMessage());
        }
    }

    /**
     * Saves via ACTION_CREATE_DOCUMENT system picker (Android 9 and below, or manual fallback).
     */
    private void saveViaCreateDocumentPicker(PluginCall call, String filename, String mimeType, String base64Data) {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, filename);

        // Store base64 data in bridge call state for the activity callback
        call.save();
        startActivityForResult(call, intent, "handleCreateDocumentResult");
    }

    @ActivityCallback
    private void handleCreateDocumentResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("CANCELLED", "File save was cancelled by the user");
            return;
        }

        Uri uri = result.getData().getData();
        String base64Data = call.getString("base64Data");
        String filename = sanitizeFilename(call.getString("filename"));
        String mimeType = resolveMimeType(filename, call.getString("mimeType"));

        Context context = getContext();
        if (context == null) {
            call.reject("CONTEXT_UNAVAILABLE", "Android context is unavailable");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            try (OutputStream os = context.getContentResolver().openOutputStream(uri)) {
                if (os == null) throw new IOException("Cannot open output stream for selected URI");
                os.write(bytes);
                os.flush();
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("filename", filename);
            ret.put("uri", uri.toString());
            ret.put("mimeType", mimeType);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("IO_ERROR", "Failed to write file to selected location: " + e.getMessage());
        }
    }

    /**
     * Opens a file via content URI or cached copy using Intent.ACTION_VIEW with temporary read permission.
     * Crucially does NOT rely on resolveActivity preflight (which returns null on Android 11+ due to package visibility).
     */
    @PluginMethod
    public void openFile(PluginCall call) {
        String uriString = call.getString("uri");
        String filename = sanitizeFilename(call.getString("filename"));
        String mimeType = resolveMimeType(filename, call.getString("mimeType"));
        String base64Data = call.getString("base64Data");

        Context context = getContext();
        if (context == null) {
            call.reject("CONTEXT_UNAVAILABLE", "Android context is unavailable");
            return;
        }

        Uri contentUri = null;

        if (uriString != null && !uriString.trim().isEmpty()) {
            try {
                contentUri = Uri.parse(uriString);
            } catch (Exception ignored) {}
        }

        // If no URI or content URI unavailable, save to cache and get FileProvider URI
        if (contentUri == null) {
            if (base64Data == null || base64Data.isEmpty()) {
                call.reject("MISSING_DATA", "No URI or base64 data available to open file");
                return;
            }
            try {
                File cacheDir = context.getCacheDir();
                File cvDir = new File(cacheDir, "cv_downloads");
                if (!cvDir.exists() && !cvDir.mkdirs()) {
                    cvDir = cacheDir;
                }
                File targetFile = new File(cvDir, filename);
                byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
                try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                    fos.write(decodedBytes);
                    fos.flush();
                }
                String authority = context.getPackageName() + ".fileprovider";
                contentUri = FileProvider.getUriForFile(context, authority, targetFile);
            } catch (Exception e) {
                call.reject("IO_ERROR", "Failed to prepare file for viewing: " + e.getMessage());
                return;
            }
        }

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(contentUri, mimeType);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            // Attempt to start viewer directly without resolveActivity (safe on Android 11+ API 30+)
            context.startActivity(intent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("filename", filename);
            call.resolve(ret);
        } catch (ActivityNotFoundException e) {
            // True launch failure: no app registered to handle this intent/MIME
            call.reject("NO_VIEWER", "No compatible viewer app installed to open this file format");
        } catch (SecurityException e) {
            call.reject("SECURITY_ERROR", "Permission denied opening file: " + e.getMessage());
        } catch (Exception e) {
            call.reject("OPEN_ERROR", "Failed to open file: " + e.getMessage());
        }
    }
}
