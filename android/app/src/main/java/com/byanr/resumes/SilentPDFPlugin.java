package com.byanr.resumes;

import android.Manifest;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.print.PrintAttributes;
import android.provider.MediaStore;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import android.app.DownloadManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;

@CapacitorPlugin(name = "SilentPDF")
public class SilentPDFPlugin extends Plugin {

    private static final int REQUEST_STORAGE_PERMISSION = 100;

    @PluginMethod()
    public void download(PluginCall call) {
        String value = call.getString("value");

        getActivity().runOnUiThread(() -> {
            File tempDir = getContext().getCacheDir();
            String finalFileName = getPdfFileName(call);

            new CreatePdf(getContext())
                    .setFilePath(tempDir.toString())
                    .setPdfName(finalFileName)
                    .openPrintDialog(false)
                    .setContentBaseUrl(null)
                    .setWebView(this.bridge.getWebView())
                    .setPageSize(PrintAttributes.MediaSize.ISO_A4)
                    .setCallbackListener(new CreatePdf.PdfCallbackListener() {
                        @Override
                        public void onFailure(@NonNull String errorMsg) {
                            Toast.makeText(getContext(), errorMsg, Toast.LENGTH_SHORT).show();
                        }

                        @Override
                        public void onSuccess(@NonNull String filePath) {
                            File tempFile = new File(filePath);
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) { // Android 10 and above
                                try {
                                    ContentValues values = new ContentValues();
                                    values.put(MediaStore.Downloads.DISPLAY_NAME, finalFileName);
                                    values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                                    values.put(MediaStore.Downloads.RELATIVE_PATH,
                                            Environment.DIRECTORY_DOWNLOADS + "/Resume Maker 9000");

                                    Uri uri = getContext().getContentResolver()
                                            .insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                                    if (uri != null) {
                                        try (FileInputStream in = new FileInputStream(tempFile);
                                                OutputStream out = getContext().getContentResolver()
                                                        .openOutputStream(uri)) {
                                            byte[] buffer = new byte[1024];
                                            int length;
                                            while ((length = in.read(buffer)) > 0) {
                                                out.write(buffer, 0, length);
                                            }
                                        }
                                    }
                                    Toast.makeText(getContext(), "Resume PDF saved to Downloads", Toast.LENGTH_SHORT)
                                            .show();

                                    Intent openIntent = new Intent(Intent.ACTION_VIEW);
                                    openIntent.setDataAndType(uri, "application/pdf");
                                    openIntent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                                    getContext().startActivity(Intent.createChooser(openIntent, "Open PDF with"));
                                } catch (IOException e) {
                                    Toast.makeText(getContext(), "Failed to save Resume: " + e.getMessage(),
                                            Toast.LENGTH_SHORT).show();
                                }
                            } else { // Android 9 and below
                                if (!checkStoragePermission()) {
                                    Toast.makeText(getContext(), "Storage permission required", Toast.LENGTH_SHORT)
                                            .show();
                                    return;
                                }
                                File downloadsDir = Environment
                                        .getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

                                File destinationFile = new File(downloadsDir, finalFileName);
                                try {
                                    copyFile(tempFile, destinationFile);
                                    Toast.makeText(getContext(), "Resume PDF saved to Downloads", Toast.LENGTH_SHORT)
                                            .show();

                                    // Optionally open the PDF
                                    Intent openIntent = new Intent(Intent.ACTION_VIEW);
                                    Uri uri = Uri.fromFile(destinationFile);
                                    openIntent.setDataAndType(uri, "application/pdf");
                                    openIntent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                                    getContext().startActivity(Intent.createChooser(openIntent, "Open PDF with"));
                                } catch (IOException e) {
                                    Toast.makeText(getContext(), "Failed to save Resume: " + e.getMessage(),
                                            Toast.LENGTH_SHORT).show();
                                }
                            }
                        }
                    })
                    .create();
        });

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }

    @PluginMethod()
    public void share(PluginCall call) {
        String value = call.getString("value");

        getActivity().runOnUiThread(() -> {
            File tempDir = getContext().getCacheDir();
            String finalFileName = getPdfFileName(call);

            new CreatePdf(getContext())
                    .setFilePath(tempDir.toString())
                    .setPdfName(finalFileName)
                    .openPrintDialog(false)
                    .setContentBaseUrl(null)
                    .setWebView(this.bridge.getWebView())
                    .setPageSize(PrintAttributes.MediaSize.ISO_A4)
                    .setCallbackListener(new CreatePdf.PdfCallbackListener() {
                        @Override
                        public void onFailure(@NonNull String errorMsg) {
                            Toast.makeText(getContext(), errorMsg, Toast.LENGTH_SHORT).show();
                        }

                        @Override
                        public void onSuccess(@NonNull String filePath) {
                            File file = new File(filePath);
                            Uri uri = FileProvider.getUriForFile(
                                    getContext(),
                                    "com.byanr.resumes.fileprovider",
                                    file);

                            Intent shareIntent = new Intent(Intent.ACTION_SEND);
                            shareIntent.setType("application/pdf");
                            shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
                            shareIntent.putExtra(Intent.EXTRA_TEXT,
                                    "Made with Resume Maker 9000. Make your own Resume for free at https://resumes.byanr.com?from=mobile");
                            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            getContext().startActivity(Intent.createChooser(shareIntent, "Share PDF via"));
                        }
                    })
                    .create();
        });

        JSObject ret = new JSObject();
        ret.put("value", value);
        call.resolve(ret);
    }

    private boolean checkStoragePermission() {
        if (ContextCompat.checkSelfPermission(getContext(),
                android.Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(),
                    new String[] { Manifest.permission.WRITE_EXTERNAL_STORAGE },
                    REQUEST_STORAGE_PERMISSION);
            return false;
        } else {
            return true;
        }
    }

    private String getPdfFileName(PluginCall call) {
        String title = call.getString("title", "Resume").trim();
        String cleanedTitle = title.replaceAll("[\\\\/\\?%\\*:\\|\\\"<>\\p{Cntrl}]", "_").trim();
        if (cleanedTitle.isEmpty()) {
            cleanedTitle = "Resume";
        }
        return cleanedTitle.endsWith(".pdf") ? cleanedTitle : cleanedTitle + ".pdf";
    }

    private void copyFile(File source, File destination) throws IOException {
        try (FileInputStream in = new FileInputStream(source);
                FileOutputStream out = new FileOutputStream(destination)) {
            byte[] buffer = new byte[1024];
            int length;
            while ((length = in.read(buffer)) > 0) {
                out.write(buffer, 0, length);
            }
        }
    }

}
