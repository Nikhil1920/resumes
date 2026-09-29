package android.print;

import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import java.io.File;

public class PdfPrint {
    private static final String TAG = PdfPrint.class.getSimpleName();
    private final PrintAttributes printAttributes;

    public PdfPrint(PrintAttributes printAttributes) {
        this.printAttributes = printAttributes;
    }

    public void print(final PrintDocumentAdapter printAdapter, final File path, final String fileName,
            final CallbackPrint callback) {
        printAdapter.onLayout(null, printAttributes, null, new PrintDocumentAdapter.LayoutResultCallback() {
            @Override
            public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                ParcelFileDescriptor outputFileDescriptor = getOutputFile(path, fileName);
                if (outputFileDescriptor == null) {
                    callback.onFailure("Failed to create output file");
                    return;
                }
                printAdapter.onWrite(new PageRange[] { PageRange.ALL_PAGES }, outputFileDescriptor,
                        new CancellationSignal(), new PrintDocumentAdapter.WriteResultCallback() {
                            @Override
                            public void onWriteFinished(PageRange[] pages) {
                                super.onWriteFinished(pages);
                                if (pages.length > 0) {
                                    File file = new File(path, fileName);
                                    String path = file.getAbsolutePath();
                                    callback.success(path);
                                } else {
                                    callback.onFailure("Pages length not found");
                                }

                            }
                        });
            }
        }, null);
    }

    private ParcelFileDescriptor getOutputFile(File path, String fileName) {
        try {
            if (!path.exists()) {
                if (!path.mkdirs()) {
                    Log.e(TAG, "Unable to Create required folder");
                }
            }
            File file = new File(path, fileName);
            file.createNewFile();
            return ParcelFileDescriptor.open(file,
                    ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_TRUNCATE);
        } catch (Exception e) {
            Log.e(TAG, "Failed to open ParcelFileDescriptor", e);
        }
        return null;
    }

    public interface CallbackPrint {
        void success(String path);

        void onFailure(String errorMsg);
    }
}