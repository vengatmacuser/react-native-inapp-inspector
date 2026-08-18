package com.inappinspector;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
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
        setupNativeCrashProtection();
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    private void setupNativeCrashProtection() {
        if (isProtectionEnabled) return;
        isProtectionEnabled = true;

        try {
            defaultHandler = Thread.getDefaultUncaughtExceptionHandler();
            Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
                @Override
                public void uncaughtException(@NonNull Thread thread, @NonNull Throwable throwable) {
                    try {
                        StringWriter sw = new StringWriter();
                        PrintWriter pw = new PrintWriter(sw);
                        throwable.printStackTrace(pw);
                        String stackTrace = sw.toString();
                        String message = throwable.getMessage() != null ? throwable.getMessage() : throwable.toString();

                        Log.e(TAG, "Intercepted Android Native Crash: " + message, throwable);

                        sendCrashEventToJS(message, stackTrace, thread.getName());
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to dispatch native crash event", e);
                    }

                    // Keep main looper processing to prevent instant process exit
                    if (Looper.myLooper() != null) {
                        while (true) {
                            try {
                                Looper.loop();
                            } catch (Throwable inner) {
                                Log.e(TAG, "Caught inner loop exception", inner);
                            }
                        }
                    }
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error installing uncaught exception handler", e);
        }
    }

    private void sendCrashEventToJS(String message, String stackTrace, String threadName) {
        try {
            if (reactContext != null && reactContext.hasActiveReactInstance()) {
                WritableMap params = Arguments.createMap();
                params.putString("platform", "android");
                params.putString("message", message);
                params.putString("stack", stackTrace);
                params.putString("thread", threadName);
                params.putDouble("timestamp", System.currentTimeMillis());

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
    public void copyToClipboard(String text, Promise promise) {
        try {
            Handler mainHandler = new Handler(Looper.getMainLooper());
            mainHandler.post(() -> {
                try {
                    ClipboardManager clipboard = (ClipboardManager) reactContext.getSystemService(Context.CLIPBOARD_SERVICE);
                    if (clipboard != null) {
                        ClipData clip = ClipData.newPlainText("NetworkInspector", text != null ? text : "");
                        clipboard.setPrimaryClip(clip);
                        if (promise != null) {
                            promise.resolve(true);
                        }
                        return;
                    }
                    if (promise != null) {
                        promise.resolve(false);
                    }
                } catch (Exception e) {
                    if (promise != null) {
                        promise.reject("CLIPBOARD_ERROR", e.getMessage(), e);
                    }
                }
            });
        } catch (Exception e) {
            if (promise != null) {
                promise.reject("CLIPBOARD_ERROR", e.getMessage(), e);
            }
        }
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
