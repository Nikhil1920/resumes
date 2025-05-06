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
        CAPPluginMethod(name: "share", returnType: CAPPluginReturnPromise)
    ]

    @objc func download(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        
        createPDFUsingPrintRenderer { pdfURL in
            guard let pdfURL = pdfURL else {
                print("Failed to create PDF")
                return
            }
            
            DispatchQueue.main.async {
                let documentPicker = UIDocumentPickerViewController(forExporting: [pdfURL])
                documentPicker.shouldShowFileExtensions = true
                documentPicker.delegate = self
                self.bridge?.viewController?.present(documentPicker, animated: true, completion: {
                    call.resolve()
                })
            }
            
            call.resolve(["value": value])
        }
    }
    
        @objc func share(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        
        createPDFUsingPrintRenderer { pdfURL in
                    guard let pdfURL = pdfURL else {
                        print("Failed to create PDF")
                        return
                    }
                    
            DispatchQueue.main.async {
                                // Create and present UIActivityViewController on main thread
                                let activityViewController = UIActivityViewController(
                                    activityItems: [pdfURL],
                                    applicationActivities: nil
                                )
                                
                                // Configure popover for iPad
                                if let popoverController = activityViewController.popoverPresentationController {
                                    popoverController.sourceView = self.bridge?.viewController?.view
                                    popoverController.sourceRect = CGRect(x: self.bridge?.viewController?.view.bounds.midX ?? 0, y: self.bridge?.viewController?.view.bounds.midY ?? 0, width: 0, height: 0)
                                }
                                
                self.bridge?.viewController?.present(activityViewController, animated: true, completion: nil)
                            }
                }
        
        call.resolve(["value": value])
    }
    
    // Using UIPrintPageRenderer for better quality PDFs
        func createPDFUsingPrintRenderer(completion: @escaping (URL?) -> Void) {
            guard let webView = self.bridge?.webView else { completion(nil); return }
            let printPageRenderer = UIPrintPageRenderer()
            let printFormatter = webView.viewPrintFormatter()
            printPageRenderer.addPrintFormatter(printFormatter, startingAtPageAt: 0)
            
            let paperRect = CGRect(x: 0, y: 0, width: 595.2, height: 841.8) // A4 size in points
            let printableRect = paperRect.insetBy(dx: 0, dy: 0)
            
            printPageRenderer.setValue(paperRect, forKey: "paperRect")
            printPageRenderer.setValue(printableRect, forKey: "printableRect")
            
            let tempDir = FileManager.default.temporaryDirectory
            let date = Date()
            let formatter = DateFormatter()
            formatter.dateFormat = "dd-MM-yyyy hh-mm a"
            let formattedDate = formatter.string(from: date)
            let fileName = "Resume-\(formattedDate).pdf"
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
        
    
    @available(iOS 14.0, *)
    func createPDFUsingModernAPI(completion: @escaping (URL?) -> Void) {
        let tempDir = FileManager.default.temporaryDirectory
        let fileName = "webpage-\(Date().timeIntervalSince1970).pdf"
        let fileURL = tempDir.appendingPathComponent(fileName)
        
        let configuration = WKPDFConfiguration()
        guard let webView = self.bridge?.webView else { completion(nil); return }
        webView.createPDF(configuration: configuration) { result in
            switch result {
            case .success(let data):
                do {
                    try data.write(to: fileURL)
                    completion(fileURL)
                } catch {
                    print("Failed to write PDF data: \(error)")
                    completion(nil)
                }
            case .failure(let error):
                print("PDF creation failed: \(error)")
                completion(nil)
            }
        }
        completion(nil)
    }
    
}
