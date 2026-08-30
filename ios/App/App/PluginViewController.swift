//
//  PluginViewController.swift
//  App
//
//  Created by Nikhil Reddy Avuthu on 06/05/25.
//

import UIKit
import Capacitor

class PluginViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SilentPDFPlugin())
    }
    
    override open func viewDidLoad() {
        super.viewDidLoad()

        // Setup padding after the view has been added to the view hierarchy
        DispatchQueue.main.async {
            self.setupWebViewPadding()
        }
    }

    override open func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)

        // Setup padding each time the view appears
        DispatchQueue.main.async {
            self.setupWebViewPadding()
        }
    }

    override open func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        // Setup padding whenever the view's layout changes (e.g., orientation changes)
        setupWebViewPadding()
    }

    private func setupWebViewPadding() {
        guard let webView = self.webView else { return }

        // Resolve the key window through scenes, falling back to the view's own window
        let window = view.window ?? UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }

        let topPadding = window?.safeAreaInsets.top ?? 0
        let bottomPadding = window?.safeAreaInsets.bottom ?? 0
        let leftPadding = window?.safeAreaInsets.left ?? 0
        let rightPadding = window?.safeAreaInsets.right ?? 0

        webView.frame.origin = CGPoint(x: leftPadding, y: topPadding)
        webView.frame.size = CGSize(width: UIScreen.main.bounds.width - leftPadding - rightPadding, height: UIScreen.main.bounds.height - topPadding - bottomPadding)
    }
}

