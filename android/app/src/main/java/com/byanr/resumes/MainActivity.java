package com.byanr.resumes;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
                registerPlugin(SilentPDFPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
