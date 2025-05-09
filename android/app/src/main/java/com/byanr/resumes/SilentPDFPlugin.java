package com.byanr.resumes;

import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.print.PrintAttributes;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "SilentPDF")
public class SilentPDFPlugin extends Plugin {

    @PluginMethod()
    public void download(PluginCall call) {
        String value = call.getString("value");

        getActivity().runOnUiThread(() -> {
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            String finalFileName = "Resume_" + System.currentTimeMillis() + ".pdf";

            new CreatePdf(getContext())
                    .setFilePath(downloadsDir.toString())
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
                            Toast.makeText(getContext(), "Pdf Saved to Downloads", Toast.LENGTH_SHORT).show();

                            File file = new File(filePath);
                            Uri uri = FileProvider.getUriForFile(
                                    getContext(),
                                    "com.byanr.resumes.fileprovider",
                                    file);

                            Intent openIntent = new Intent(Intent.ACTION_VIEW);
                            openIntent.setDataAndType(uri, "application/pdf");
                            openIntent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            getContext().startActivity(Intent.createChooser(openIntent, "Open PDF with"));
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

        getActivity().runOnUiThread(()-> {
                    File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    String finalFileName = "Resume_" + System.currentTimeMillis() + ".pdf";

                    new CreatePdf(getContext())
                            .setFilePath(downloadsDir.toString())
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
                                    Toast.makeText(getContext(), "Pdf Saved to Downloads", Toast.LENGTH_SHORT).show();

                                    File file = new File(filePath);
                                    Uri uri = FileProvider.getUriForFile(
                                            getContext(),
                                            "com.byanr.resumes.fileprovider",
                                            file);

                                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                                    shareIntent.setType("application/pdf");
                                    shareIntent.putExtra(Intent.EXTRA_STREAM, uri);
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

}