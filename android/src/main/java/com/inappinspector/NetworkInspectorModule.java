package com.inappinspector;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.PrintWriter;
import java.io.StringWriter;

public class NetworkInspectorModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "NetworkInspectorModule";
    private static final String TAG = "NetworkInspector";
    private final ReactApplicationContext reactContext;
    private Thread.UncaughtExceptionHandler defaultHandler;
    private boolean isProtectionEnabled = false;

    public NetworkInspectorModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    private void setupNativeCrashProtection() {
        if (isProtectionEnabled) {
            return;
        }
        defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((thread, throwable) -> {
            try {
                handleNativeCrash(thread, throwable);
            } catch (Exception e) {
                Log.e(TAG, "Error in native crash handler", e);
            } finally {
                if (defaultHandler != null) {
                    defaultHandler.uncaughtException(thread, throwable);
                }
            }
        });
        isProtectionEnabled = true;
        Log.i(TAG, "Native crash protection enabled");
    }

    private void handleNativeCrash(Thread thread, Throwable throwable) {
        try {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            throwable.printStackTrace(pw);
            String stackTrace = sw.toString();

            WritableMap params = Arguments.createMap();
            params.putString("error", throwable.getMessage() != null ? throwable.getMessage() : "Unknown native crash");
            params.putString("name", throwable.getClass().getName());
            params.putString("stack", stackTrace);
            params.putDouble("timestamp", System.currentTimeMillis());

            if (reactContext.hasActiveReactInstance()) {
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit("onNativeCrash", params);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to emit onNativeCrash to JS", e);
        }
    }

    @ReactMethod
    public void enableNativeCrashProtection(Promise promise) {
        setupNativeCrashProtection();
        promise.resolve(true);
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built-in Event Emitter
    }

    @ReactMethod
    public void removeListeners(double count) {
        // Required for RN built-in Event Emitter
    }
}
