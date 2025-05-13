package com.byanr.resumes;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

import android.content.res.Configuration;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class MainActivity extends BridgeActivity {
    private void updateSystemBarAppearance() {
        // Detect if the device is in dark mode
        boolean isDarkMode = (getResources().getConfiguration().uiMode &
                Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;

        // Get the InsetsController to modify appearance
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());

        // Update status bar icons based on mode
        insetsController.setAppearanceLightStatusBars(!isDarkMode); // Light icons in dark mode, dark icons in light mode

        // Update navigation bar icons based on mode
        insetsController.setAppearanceLightNavigationBars(!isDarkMode); // Light icons in dark mode, dark icons in light mode

        // Set transparent bars for edge-to-edge effect
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
                registerPlugin(SilentPDFPlugin.class);
        super.onCreate(savedInstanceState);

        updateSystemBarAppearance();
    }
}
