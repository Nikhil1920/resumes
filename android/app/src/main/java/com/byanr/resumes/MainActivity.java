package com.byanr.resumes;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SilentPDFPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
