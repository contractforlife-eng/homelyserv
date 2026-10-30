package com.homelyserv.app;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import android.webkit.MimeTypeMap;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "HomelyServFileOpener")
public class HomelyServFileOpenerPlugin extends Plugin {

    @PluginMethod
    public void openBase64File(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType");

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("MISSING_DATA", "Base64 data is required");
            return;
        }

        if (filename == null || filename.trim().isEmpty()) {
            filename = "document.pdf";
        }

        // Clean filename to prevent path traversal
        filename = new File(filename).getName();
        if (filename.isEmpty()) {
            filename = "document.pdf";
        }

        if (mimeType == null || mimeType.trim().isEmpty()) {
            String extension = MimeTypeMap.getFileExtensionFromUrl(filename);
            if (extension != null && !extension.isEmpty()) {
                mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension.toLowerCase());
            }
            if (mimeType == null || mimeType.isEmpty()) {
                mimeType = "application/pdf";
            }
        }

        Context context = getContext();
        if (context == null) {
            call.reject("CONTEXT_UNAVAILABLE", "Android context is unavailable");
            return;
        }

        try {
            // Write to app-specific cache directory (internal cache: getCacheDir() -> cache-path)
            File cacheDir = context.getCacheDir();
            File cvDir = new File(cacheDir, "cv_downloads");
            if (!cvDir.exists() && !cvDir.mkdirs()) {
                // If subfolder fails, fallback directly to cacheDir
                cvDir = cacheDir;
            }

            File targetFile = new File(cvDir, filename);

            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            try (FileOutputStream fos = new FileOutputStream(targetFile)) {
                fos.write(decodedBytes);
                fos.flush();
            }

            // Generate content URI via FileProvider
            String authority = context.getPackageName() + ".fileprovider";
            Uri contentUri = FileProvider.getUriForFile(context, authority, targetFile);

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(contentUri, mimeType);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            try {
                // Check if any activity can handle this intent before starting
                if (intent.resolveActivity(context.getPackageManager()) == null) {
                    call.reject("NO_VIEWER", "No compatible viewer app installed to open this file format");
                    return;
                }

                context.startActivity(intent);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("filename", filename);
                call.resolve(ret);
            } catch (ActivityNotFoundException e) {
                call.reject("NO_VIEWER", "No compatible viewer app installed to open this file format");
            } catch (SecurityException e) {
                call.reject("SECURITY_ERROR", "Security violation opening file: " + e.getMessage());
            }

        } catch (IllegalArgumentException e) {
            call.reject("INVALID_BASE64", "Invalid base64 encoding: " + e.getMessage());
        } catch (IOException e) {
            call.reject("IO_ERROR", "Failed to save file: " + e.getMessage());
        } catch (Exception e) {
            call.reject("UNKNOWN_ERROR", "Unexpected error: " + e.getMessage());
        }
    }
}
