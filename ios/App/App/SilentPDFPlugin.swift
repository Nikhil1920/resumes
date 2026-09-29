//
//  SilentPDFPlugin.swift
//  App
//
//  Created by Nikhil Reddy Avuthu on 06/05/25.
//

import Capacitor
import UIKit
import WebKit

@objc(SilentPDFPlugin)
public class SilentPDFPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate {
    public let identifier = "SilentPDFPlugin"
    public let jsName = "SilentPDF"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "download", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise),
    ]

    @objc func download(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        let title = call.getString("title") ?? "Resume"

        createPDFUsingPrintRenderer(title: title, pageSize: call.getString("pageSize") ?? "A4") { pdfURL in
            guard let pdfURL = pdfURL else {
                print("Failed to create PDF")
                return
            }

            DispatchQueue.main.async {
                let documentPicker = UIDocumentPickerViewController(forExporting: [pdfURL])
                documentPicker.shouldShowFileExtensions = true
                documentPicker.delegate = self
                self.bridge?.viewController?.present(
                    documentPicker, animated: true,
                    completion: {
                        call.resolve()
                    })
            }

            call.resolve(["value": value])
        }
    }

    @objc func share(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        let title = call.getString("title") ?? "Resume"

        createPDFUsingPrintRenderer(title: title, pageSize: call.getString("pageSize") ?? "A4") { pdfURL in
            guard let pdfURL = pdfURL else {
                print("Failed to create PDF")
                return
            }

            DispatchQueue.main.async {
                // Create and present UIActivityViewController on main thread
                let message =
                    "Made with Resume Maker 9000. Make your own Resume for free at https://resumes.byanr.com?from=mobile"
                let activityViewController = UIActivityViewController(
                    activityItems: [pdfURL, message],
                    applicationActivities: nil
                )

                // Configure popover for iPad
                if let popoverController = activityViewController.popoverPresentationController {
                    popoverController.sourceView = self.bridge?.viewController?.view
                    popoverController.sourceRect = CGRect(
                        x: self.bridge?.viewController?.view.bounds.midX ?? 0,
                        y: self.bridge?.viewController?.view.bounds.midY ?? 0, width: 0, height: 0)
                }

                self.bridge?.viewController?.present(
                    activityViewController, animated: true, completion: nil)
            }
        }

        call.resolve(["value": value])
    }

    // Using UIPrintPageRenderer for better quality PDFs
    func createPDFUsingPrintRenderer(title: String, pageSize: String = "A4", completion: @escaping (URL?) -> Void) {
        guard let webView = self.bridge?.webView else {
            completion(nil)
            return
        }
        let printPageRenderer = UIPrintPageRenderer()
        let printFormatter = webView.viewPrintFormatter()
        printPageRenderer.addPrintFormatter(printFormatter, startingAtPageAt: 0)

        let paperRect = pageSize == "Letter"
            ? CGRect(x: 0, y: 0, width: 612, height: 792)
            : CGRect(x: 0, y: 0, width: 595.2, height: 841.8)
        let printableRect = paperRect.insetBy(dx: 0, dy: 0)

        printPageRenderer.setValue(paperRect, forKey: "paperRect")
        printPageRenderer.setValue(printableRect, forKey: "printableRect")

        let tempDir = FileManager.default.temporaryDirectory
        let invalidCharacters = CharacterSet(charactersIn: "/\\?%*:|\"<>")
            .union(.controlCharacters)
        let cleanedTitle = title.components(separatedBy: invalidCharacters)
            .joined(separator: "_")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let fileStem = cleanedTitle.isEmpty ? "Resume" : cleanedTitle
        let fileName = fileStem.hasSuffix(".pdf") ? fileStem : "\(fileStem).pdf"
        let fileURL = tempDir.appendingPathComponent(fileName)

        // Create PDF data
        let pdfData = NSMutableData()
        UIGraphicsBeginPDFContextToData(pdfData, paperRect, nil)

        for i in 0..<printPageRenderer.numberOfPages {
            UIGraphicsBeginPDFPage()
            printPageRenderer.drawPage(at: i, in: UIGraphicsGetPDFContextBounds())
        }

        UIGraphicsEndPDFContext()

        // Write to file
        do {
            try pdfData.write(to: fileURL, options: .atomic)
            completion(fileURL)
        } catch {
            print("Failed to save PDF: \(error)")
            completion(nil)
        }
    }
}
