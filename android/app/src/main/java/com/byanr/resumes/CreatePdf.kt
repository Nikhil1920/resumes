package com.byanr.resumes

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.print.PdfPrint
import android.print.PrintAttributes
import android.print.PrintDocumentAdapter
import android.print.PrintManager
import android.util.Log
import android.webkit.WebView
import android.webkit.WebViewClient
import java.io.File
import org.jetbrains.annotations.NotNull
import org.jetbrains.annotations.Nullable

open class CreatePdf(private val mContext: Context) {

    private var MimeType = "text/html"
    private var ENCODING = "utf-8"

    private var mBaseURL: String? = ""
    private var mPdfName: String = ""
    private var mCallbacks: PdfCallbackListener? = null
    private var mContent: String = ""
    private var doPrint: Boolean = false
    private var mPdfFilePath: String = ""
    private var mWebView: WebView? = null
    private var mMediaSize: PrintAttributes.MediaSize? = null
    private var mDelay: Long = 0
    private var mUrlToPrint: String? = null

    /** file will be saved as : pdfName */
    fun setPdfName(@NotNull pdfName: String): CreatePdf {
        var cleanPdfName = pdfName.trim()
        // replace any invalid characters in file name like /, \, ?, %, *, :, |, ", <, > with _
        val invalidChars = arrayOf("/", "\\", "?", "%", "*", ":", "|", "\"", "<", ">")
        for (char in invalidChars) {
            if (pdfName.contains(char)) {
                cleanPdfName = pdfName.replace(char, "_")
            }
        }
        Log.d("PDF", "Cleaned PDF Name: $cleanPdfName")
        this.mPdfName = "$cleanPdfName"
        return this
    }

    /** if content going to be load from assets or from other source */
    fun setContentBaseUrl(baseUrl: String?): CreatePdf {
        this.mBaseURL = baseUrl
        return this
    }

    fun setContent(@NotNull content: String): CreatePdf {
        this.mContent = content
        return this
    }

    fun openPrintDialog(doPrint: Boolean): CreatePdf {
        this.doPrint = doPrint
        return this
    }

    fun setFilePath(pdfFilePath: String): CreatePdf {
        this.mPdfFilePath = pdfFilePath
        return this
    }

    fun setPageSize(@NotNull size: PrintAttributes.MediaSize): CreatePdf {
        this.mMediaSize = size
        return this
    }

    fun setCallbackListener(@NotNull callbacks: PdfCallbackListener): CreatePdf {
        this.mCallbacks = callbacks
        return this
    }

    fun setDelay(delay: Long): CreatePdf {
        if (delay < 0) {
            throw IllegalArgumentException("Delay must be non-negative")
        }
        this.mDelay = delay
        return this
    }

    fun setUrlToPrint(@NotNull urlToPrint: String): CreatePdf {
        this.mUrlToPrint = urlToPrint
        return this
    }

    fun setWebView(webView: WebView): CreatePdf {
        this.mWebView = webView
        return this
    }

    @SuppressLint("SetJavaScriptEnabled")
    fun create() {
        if (mPdfName.isEmpty()) {
            mCallbacks?.onFailure("Pdf name must not be empty.")
            return
        }

        if (mMediaSize == null) {
            mCallbacks?.onFailure("Page Size must not be empty.")
            return
        }

        if (mWebView == null) {
        mWebView = WebView(mContext)
        if (mUrlToPrint != null) {
            mWebView?.loadUrl(mUrlToPrint!!)
        } else if (mContent.isNotEmpty()) {
            mWebView?.loadDataWithBaseURL(mBaseURL, mContent, MimeType, ENCODING, null)
        } else {
            mCallbacks?.onFailure("No content or URL provided.")
            return
        }
        mWebView?.settings?.javaScriptEnabled = true
        mWebView?.settings?.domStorageEnabled = true
        mWebView?.settings?.textZoom = 100
        mWebView?.clearCache(true)

        var generated = false
        val handler = Handler(Looper.getMainLooper())

        mWebView?.webViewClient =
                object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String?) {
                        handler.postDelayed(
                                {
                                    if (!generated) {
                                        // Get a print adapter instance
                                        val printAdapter: PrintDocumentAdapter =
                                                view.createPrintDocumentAdapter(mPdfName)
                                        // generate pdf from adapter
                                        savePdf(printAdapter)
                                        generated = true
                                    }
                                },
                                mDelay
                        )
                    }
                }
        } else {
            // If webView is already set, use it to create the print document adapter
            val printAdapter: PrintDocumentAdapter =
                    mWebView!!.createPrintDocumentAdapter(mPdfName)
            // generate pdf from adapter
            savePdf(printAdapter)
        }
    }

    private fun savePdf(printAdapter: PrintDocumentAdapter) {
        // user filePath provided by user, if not use default cache dir.
        var filePath: String =
                if (mPdfFilePath.isEmpty()) {
                    mContext.cacheDir.absolutePath
                } else {
                    mPdfFilePath
                }

        Log.d("PDF", "Final File Path: $filePath")

        // create dir if not exists
        val file = File(filePath)
        if (!file.exists()) {
            file.mkdirs()
        }

        // save pdf
        val printAttributes =
                PrintAttributes.Builder()
                        .setMediaSize(mMediaSize!!)
                        .setResolution(PrintAttributes.Resolution("pdf", "pdf", 600, 600))
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build()

        PdfPrint(printAttributes)
                .print(
                        printAdapter,
                        file,
                        mPdfName,
                        object : PdfPrint.CallbackPrint {
                            override fun success(path: String) {
                                mCallbacks?.onSuccess(path)

                                // if true, open print job dialog
                                if (doPrint) {
                                    // Get a PrintManager instance
                                    val printManager =
                                            mContext.getSystemService(Context.PRINT_SERVICE) as
                                                    PrintManager
                                    // Create a print job with name and adapter instance
                                    printManager.print(
                                            mPdfName,
                                            printAdapter,
                                            PrintAttributes.Builder().build()
                                    )
                                }
                                mWebView = null
                            }

                            override fun onFailure(errorMsg: String) {
                                mCallbacks?.onFailure(errorMsg)
                                mWebView = null
                            }
                        }
                )
    }

    interface PdfCallbackListener {
        fun onFailure(errorMsg: String)
        fun onSuccess(filePath: String)
    }
}
