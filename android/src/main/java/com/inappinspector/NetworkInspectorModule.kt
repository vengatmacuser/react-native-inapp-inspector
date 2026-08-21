package com.inappinspector

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.os.Debug
import android.os.Environment
import android.os.StatFs
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.PrintWriter
import java.io.StringWriter
import java.util.concurrent.Executors

class NetworkInspectorModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "NetworkInspectorModule"
        private const val TAG = "NetworkInspector"
    }

    private val networkExecutor = Executors.newSingleThreadExecutor { Thread(it, "InAppInspector-NetworkWorker") }
    private val consoleExecutor = Executors.newSingleThreadExecutor { Thread(it, "InAppInspector-ConsoleWorker") }
    private val analyticsExecutor = Executors.newSingleThreadExecutor { Thread(it, "InAppInspector-AnalyticsWorker") }
    private val reduxExecutor = Executors.newSingleThreadExecutor { Thread(it, "InAppInspector-ReduxWorker") }
    private val crashExecutor = Executors.newSingleThreadExecutor { Thread(it, "InAppInspector-CrashWorker") }
    private val metricsExecutor = Executors.newSingleThreadExecutor { Thread(it, "InAppInspector-MetricsWorker") }

    private var defaultHandler: Thread.UncaughtExceptionHandler? = null
    private var isProtectionEnabled = false

    override fun getName(): String {
        return MODULE_NAME
    }

    private fun setupNativeCrashProtection() {
        if (isProtectionEnabled) return

        defaultHandler = Thread.getDefaultUncaughtExceptionHandler()

        // 1. Intercept all uncaught exceptions on background/worker threads (prevents OS force-close)
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            try {
                handleNativeCrash(thread, throwable)
            } catch (e: Exception) {
                Log.e(TAG, "Error in native crash handler", e)
            }
            // Suppress defaultHandler?.uncaughtException() to prevent OS killing the process
        }

        // 2. Main Looper Crash Shield: Protects UI thread from dying on uncaught exceptions
        try {
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                while (true) {
                    try {
                        android.os.Looper.loop()
                    } catch (e: Throwable) {
                        try {
                            handleNativeCrash(Thread.currentThread(), e)
                        } catch (ex: Exception) {
                            Log.e(TAG, "Error in Main Looper crash protection", ex)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to start Looper crash protection", e)
        }

        isProtectionEnabled = true
        Log.i(TAG, "Native Android Crash Shield enabled (Process kill prevention active)")
    }

    private fun handleNativeCrash(thread: Thread, throwable: Throwable) {
        try {
            val sw = StringWriter()
            val pw = PrintWriter(sw)
            throwable.printStackTrace(pw)
            val stackTrace = sw.toString()

            val params = Arguments.createMap().apply {
                putString("platform", "android")
                putString("error", throwable.message ?: "Unknown native exception")
                putString("name", throwable.javaClass.name)
                putString("stack", stackTrace)
                putString("threadName", thread.name)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }

            if (reactContext.hasActiveReactInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onNativeCrash", params)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to emit onNativeCrash to JS", e)
        }
    }

    @ReactMethod
    fun enableNativeCrashProtection(promise: Promise) {
        try {
            setupNativeCrashProtection()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CRASH_PROTECTION_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getDeviceMetrics(promise: Promise) {
        try {
            val map = Arguments.createMap()

            // 1. RAM / Memory Metrics
            val actManager = reactContext.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            if (actManager != null) {
                val memInfo = ActivityManager.MemoryInfo()
                actManager.getMemoryInfo(memInfo)
                map.putDouble("totalRAM", memInfo.totalMem.toDouble())
                map.putDouble("freeRAM", memInfo.availMem.toDouble())
                map.putDouble("usedRAM", (memInfo.totalMem - memInfo.availMem).toDouble())
                map.putBoolean("isLowMemory", memInfo.lowMemory)
            }

            // 2. Native Heap Allocation
            map.putDouble("nativeHeapAllocated", Debug.getNativeHeapAllocatedSize().toDouble())
            map.putDouble("nativeHeapSize", Debug.getNativeHeapSize().toDouble())
            map.putDouble("nativeHeapFree", Debug.getNativeHeapFreeSize().toDouble())

            // 3. Storage Space
            try {
                val statFs = StatFs(Environment.getDataDirectory().path)
                val freeStorage = statFs.availableBlocksLong * statFs.blockSizeLong
                val totalStorage = statFs.blockCountLong * statFs.blockSizeLong
                map.putDouble("freeStorage", freeStorage.toDouble())
                map.putDouble("totalStorage", totalStorage.toDouble())
            } catch (e: Exception) {
                // Storage stat optional fallback
            }

            // 4. Battery Level & State
            try {
                val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
                val batteryStatus = reactContext.registerReceiver(null, ifilter)
                if (batteryStatus != null) {
                    val level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
                    val scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
                    if (level >= 0 && scale > 0) {
                        map.putDouble("batteryPercent", (level * 100.0 / scale))
                    }
                    val status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
                    val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                            status == BatteryManager.BATTERY_STATUS_FULL
                    map.putBoolean("isCharging", isCharging)
                }
            } catch (e: Exception) {
                // Battery status optional fallback
            }

            // 5. Hardware & OS Identifiers
            map.putString("deviceModel", Build.MODEL)
            map.putString("deviceBrand", Build.MANUFACTURER)
            map.putString("osVersion", Build.VERSION.RELEASE)
            map.putInt("apiLevel", Build.VERSION.SDK_INT)
            val cpuAbi = if (Build.SUPPORTED_ABIS.isNotEmpty()) Build.SUPPORTED_ABIS[0] else "unknown"
            map.putString("cpuAbi", cpuAbi)

            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("DEVICE_METRICS_ERROR", e.message, e)
        }
    }

    private var floatingButton: InAppInspectorFloatingView? = null

    private fun emitFloatingButtonPress() {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onFloatingButtonPress", null)
        }
    }

    @ReactMethod
    fun showFloatingButton(options: com.facebook.react.bridge.ReadableMap?, promise: Promise) {
        val activity = currentActivity ?: run {
            promise.resolve(false)
            return
        }

        activity.runOnUiThread {
            try {
                val decorView = activity.window.decorView as? android.view.ViewGroup
                if (decorView == null) {
                    promise.resolve(false)
                    return@runOnUiThread
                }

                val density = activity.resources.displayMetrics.density
                val sizeDp = if (options != null && options.hasKey("size")) options.getDouble("size").toFloat() else 64f
                val sizePx = (sizeDp * density).toInt()

                if (floatingButton == null) {
                    floatingButton = InAppInspectorFloatingView(activity) {
                        emitFloatingButtonPress()
                    }
                    val params = android.widget.FrameLayout.LayoutParams(sizePx, sizePx)
                    val initialX = if (options != null && options.hasKey("x")) {
                        (options.getDouble("x") * density).toFloat()
                    } else {
                        (decorView.width - sizePx - (20 * density)).coerceAtLeast(20 * density)
                    }
                    val initialY = if (options != null && options.hasKey("y")) {
                        (options.getDouble("y") * density).toFloat()
                    } else {
                        (decorView.height - sizePx - (110 * density)).coerceAtLeast(110 * density)
                    }
                    floatingButton?.x = initialX
                    floatingButton?.y = initialY
                    decorView.addView(floatingButton, params)
                } else {
                    if (floatingButton?.parent == null) {
                        val params = android.widget.FrameLayout.LayoutParams(sizePx, sizePx)
                        decorView.addView(floatingButton, params)
                    } else {
                        decorView.bringChildToFront(floatingButton)
                    }
                }

                floatingButton?.visibility = android.view.View.VISIBLE
                floatingButton?.alpha = 0f
                floatingButton?.animate()?.alpha(1f)?.setDuration(200)?.start()

                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error showing floating button", e)
                promise.reject("FLOATING_BTN_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun hideFloatingButton(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.resolve(false)
            return
        }

        activity.runOnUiThread {
            try {
                floatingButton?.animate()?.alpha(0f)?.setDuration(150)?.withEndAction {
                    floatingButton?.visibility = android.view.View.GONE
                }?.start()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("FLOATING_BTN_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun setFloatingButtonBadge(hasBadge: Boolean, promise: Promise) {
        val activity = currentActivity ?: run {
            promise.resolve(false)
            return
        }

        activity.runOnUiThread {
            floatingButton?.setBadgeVisible(hasBadge)
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun setFloatingButtonPosition(x: Double, y: Double, promise: Promise) {
        val activity = currentActivity ?: run {
            promise.resolve(false)
            return
        }

        activity.runOnUiThread {
            val density = activity.resources.displayMetrics.density
            floatingButton?.x = (x * density).toFloat()
            floatingButton?.y = (y * density).toFloat()
            promise.resolve(true)
        }
    }

    private var sensorManager: android.hardware.SensorManager? = null
    private var lastShakeTime = 0L
    private var isFpsMonitoring = false
    private var lastFrameTimeNanos = 0L
    private var frameCount = 0
    private var currentCalculatedFps = 60.0

    private val frameCallback = object : android.view.Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
            if (!isFpsMonitoring) return
            if (lastFrameTimeNanos == 0L) {
                lastFrameTimeNanos = frameTimeNanos
            } else {
                frameCount++
                val elapsedNanos = frameTimeNanos - lastFrameTimeNanos
                if (elapsedNanos >= 500_000_000L) {
                    currentCalculatedFps = (frameCount * 1_000_000_000.0) / elapsedNanos
                    frameCount = 0
                    lastFrameTimeNanos = frameTimeNanos
                }
            }
            android.view.Choreographer.getInstance().postFrameCallback(this)
        }
    }

    private val shakeListener = object : android.hardware.SensorEventListener {
        override fun onSensorChanged(event: android.hardware.SensorEvent) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]
            val gX = x / android.hardware.SensorManager.GRAVITY_EARTH
            val gY = y / android.hardware.SensorManager.GRAVITY_EARTH
            val gZ = z / android.hardware.SensorManager.GRAVITY_EARTH
            val gForce = Math.sqrt((gX * gX + gY * gY + gZ * gZ).toDouble()).toFloat()
            if (gForce > 2.7f) {
                val now = System.currentTimeMillis()
                if (now - lastShakeTime > 1000) {
                    lastShakeTime = now
                    emitDeviceShake()
                }
            }
        }
        override fun onAccuracyChanged(sensor: android.hardware.Sensor?, accuracy: Int) {}
    }

    init {
        try {
            sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as? android.hardware.SensorManager
            val accelerometer = sensorManager?.getDefaultSensor(android.hardware.Sensor.TYPE_ACCELEROMETER)
            if (accelerometer != null) {
                sensorManager?.registerListener(shakeListener, accelerometer, android.hardware.SensorManager.SENSOR_DELAY_UI)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to register shake sensor listener", e)
        }
    }

    private fun emitDeviceShake() {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onDeviceShake", null)
        }
    }

    @ReactMethod
    fun startFpsMonitoring(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.resolve(false)
            return
        }

        activity.runOnUiThread {
            if (!isFpsMonitoring) {
                isFpsMonitoring = true
                lastFrameTimeNanos = 0L
                frameCount = 0
                currentCalculatedFps = 60.0
                android.view.Choreographer.getInstance().postFrameCallback(frameCallback)
            }
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun stopFpsMonitoring(promise: Promise) {
        val activity = currentActivity ?: run {
            promise.resolve(false)
            return
        }

        activity.runOnUiThread {
            isFpsMonitoring = false
            android.view.Choreographer.getInstance().removeFrameCallback(frameCallback)
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun getFpsMetrics(promise: Promise) {
        val map = Arguments.createMap()
        map.putDouble("fps", if (currentCalculatedFps > 0) currentCalculatedFps else 60.0)
        map.putDouble("targetFps", 60.0)
        promise.resolve(map)
    }

    @ReactMethod
    fun getNativeStorageItem(key: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("inapp_inspector_prefs", Context.MODE_PRIVATE)
            val value = prefs.getString("inapp_inspector_$key", null)
            promise.resolve(value)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun setNativeStorageItem(key: String, value: String?, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("inapp_inspector_prefs", Context.MODE_PRIVATE)
            if (value == null) {
                prefs.edit().remove("inapp_inspector_$key").apply()
            } else {
                prefs.edit().putString("inapp_inspector_$key", value).apply()
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun triggerHaptic(style: String, promise: Promise) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = reactContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? android.os.VibratorManager
                vibratorManager?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                reactContext.getSystemService(Context.VIBRATOR_SERVICE) as? android.os.Vibrator
            }

            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val effect = when (style.lowercase()) {
                        "medium" -> android.os.VibrationEffect.createOneShot(20, android.os.VibrationEffect.DEFAULT_AMPLITUDE)
                        "heavy" -> android.os.VibrationEffect.createOneShot(35, android.os.VibrationEffect.DEFAULT_AMPLITUDE)
                        "success" -> {
                            val timings = longArrayOf(0, 15, 60, 20)
                            android.os.VibrationEffect.createWaveform(timings, -1)
                        }
                        "warning" -> {
                            val timings = longArrayOf(0, 25, 40, 25)
                            android.os.VibrationEffect.createWaveform(timings, -1)
                        }
                        "error" -> {
                            val timings = longArrayOf(0, 30, 40, 30, 40, 30)
                            android.os.VibrationEffect.createWaveform(timings, -1)
                        }
                        else -> android.os.VibrationEffect.createOneShot(10, 120)
                    }
                    vibrator.vibrate(effect)
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(15)
                }
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getNativeSystemMetrics(promise: Promise) {
        metricsExecutor.execute {
            try {
                val map = Arguments.createMap()

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    val powerManager = reactContext.getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
                    val status = powerManager?.currentThermalStatus ?: 0
                    val statusStr = when (status) {
                        android.os.PowerManager.THERMAL_STATUS_NONE -> "nominal"
                        android.os.PowerManager.THERMAL_STATUS_LIGHT -> "fair"
                        android.os.PowerManager.THERMAL_STATUS_MODERATE -> "fair"
                        android.os.PowerManager.THERMAL_STATUS_SEVERE -> "serious"
                        android.os.PowerManager.THERMAL_STATUS_CRITICAL -> "critical"
                        android.os.PowerManager.THERMAL_STATUS_EMERGENCY -> "critical"
                        android.os.PowerManager.THERMAL_STATUS_SHUTDOWN -> "critical"
                        else -> "nominal"
                    }
                    map.putString("thermalState", statusStr)
                } else {
                    map.putString("thermalState", "nominal")
                }

                val memInfo = Debug.MemoryInfo()
                Debug.getMemoryInfo(memInfo)
                val residentRamMb = (memInfo.totalPss / 1024.0)
                map.putDouble("residentRamMb", residentRamMb)

                val actManager = reactContext.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
                val actMemInfo = ActivityManager.MemoryInfo()
                actManager?.getMemoryInfo(actMemInfo)
                map.putDouble("totalPhysicalRamMb", (actMemInfo.totalMem / (1024.0 * 1024.0)))

                map.putDouble("fps", if (currentCalculatedFps > 0) currentCalculatedFps else 60.0)
                map.putInt("activeCpuCores", Runtime.getRuntime().availableProcessors())

                promise.resolve(map)
            } catch (e: Exception) {
                promise.reject("METRICS_ERROR", e.message, e)
            }
        }
    }

    private val nativeNetworkLogs = java.util.Collections.synchronizedList(mutableListOf<String>())
    private val nativeConsoleLogs = java.util.Collections.synchronizedList(mutableListOf<String>())
    private val nativeAnalyticsEvents = java.util.Collections.synchronizedList(mutableListOf<String>())
    private val nativeCrashRecords = java.util.Collections.synchronizedList(mutableListOf<String>())

    @ReactMethod
    fun pushNativeLogRecord(pageKey: String, jsonPayload: String, promise: Promise) {
        if (jsonPayload.isBlank()) {
            promise.resolve(false)
            return
        }
        val (executor, store) = when (pageKey) {
            "logs" -> consoleExecutor to nativeConsoleLogs
            "analytics" -> analyticsExecutor to nativeAnalyticsEvents
            "crash" -> crashExecutor to nativeCrashRecords
            else -> networkExecutor to nativeNetworkLogs
        }
        executor.execute {
            try {
                var updated = false
                val idStr = try {
                    val jsonObj = org.json.JSONObject(jsonPayload)
                    if (jsonObj.has("id")) jsonObj.get("id").toString() else null
                } catch (e: Exception) {
                    null
                }

                synchronized(store) {
                    if (idStr != null) {
                        val idPattern = "\"id\":$idStr"
                        val idStrPattern = "\"id\":\"$idStr\""
                        for (i in 0 until store.size) {
                            val existing = store[i]
                            if (existing.contains(idPattern) || existing.contains(idStrPattern)) {
                                store[i] = jsonPayload
                                updated = true
                                break
                            }
                        }
                    }

                    if (!updated) {
                        store.add(0, jsonPayload)
                        if (store.size > 2000) {
                            store.removeAt(store.size - 1)
                        }
                    }
                }
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun getNativeCachedPage(pageKey: String, offset: Int, limit: Int, query: String?, promise: Promise) {
        val (executor, store) = when (pageKey) {
            "logs" -> consoleExecutor to nativeConsoleLogs
            "analytics" -> analyticsExecutor to nativeAnalyticsEvents
            "crash" -> crashExecutor to nativeCrashRecords
            else -> networkExecutor to nativeNetworkLogs
        }
        executor.execute {
            try {
                val cleanQuery = query?.trim()?.lowercase() ?: ""
                val startIndex = Math.max(0, offset)
                val actualLimit = if (limit > 0) limit else 50
                val results = mutableListOf<String>()

                synchronized(store) {
                    var itemsCollected = 0
                    for (i in startIndex until store.size) {
                        if (itemsCollected >= actualLimit) break
                        val itemJson = store[i]
                        if (cleanQuery.isNotEmpty()) {
                            if (itemJson.lowercase().contains(cleanQuery)) {
                                results.add(itemJson)
                                itemsCollected++
                            }
                        } else {
                            results.add(itemJson)
                            itemsCollected++
                        }
                    }

                    val jsonResult = org.json.JSONObject().apply {
                        put("pageKey", pageKey)
                        put("total", store.size)
                        put("offset", offset)
                        val jsonArr = org.json.JSONArray()
                        results.forEach { jsonArr.put(it) }
                        put("items", jsonArr)
                    }.toString()

                    promise.resolve(jsonResult)
                }
            } catch (e: Exception) {
                promise.resolve("{\"items\":[],\"total\":0}")
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for React Native NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Double) {
        // Required for React Native NativeEventEmitter
    }
}

/**
 * 100% Native Main-Thread Draggable Floating Button
 * All touch processing and layout coordinates run directly in Android's UI Event Loop,
 * completely decoupled and immune from JavaScript thread stalls.
 */
class InAppInspectorFloatingView(
    context: Context,
    private val onTap: () -> Unit
) : android.widget.FrameLayout(context) {

    private var initialX = 0f
    private var initialY = 0f
    private var touchDownX = 0f
    private var touchDownY = 0f
    private var touchDownTime = 0L
    private var isDragging = false

    init {
        val density = context.resources.displayMetrics.density

        // 1. Circular Background with Glow
        val bgDrawable = android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setColor(android.graphics.Color.parseColor("#0F172A"))
            setStroke((2.2f * density).toInt(), android.graphics.Color.parseColor("#38BDF8"))
        }
        background = bgDrawable
        elevation = 16f * density

        // 2. Center Icon (Inspector Owl Vector)
        val iconView = object : android.view.View(context) {
            private val bodyPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#202E55")
                style = android.graphics.Paint.Style.FILL
            }
            private val beamPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#38BDF8")
                style = android.graphics.Paint.Style.STROKE
                strokeWidth = 4.2f
                strokeJoin = android.graphics.Paint.Join.ROUND
                strokeCap = android.graphics.Paint.Cap.ROUND
            }
            private val wingPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#1A2545")
                style = android.graphics.Paint.Style.FILL
            }
            private val bellyPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#33477A")
                style = android.graphics.Paint.Style.FILL
            }
            private val screenBgPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#0C1426")
                style = android.graphics.Paint.Style.FILL
            }
            private val codeLinePaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#8FD0EC")
                style = android.graphics.Paint.Style.STROKE
                strokeWidth = 3f
                strokeCap = android.graphics.Paint.Cap.ROUND
                strokeJoin = android.graphics.Paint.Join.ROUND
            }
            private val eyeIrisPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#FBBF24")
                style = android.graphics.Paint.Style.FILL
            }
            private val eyePupilPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#0A0E18")
                style = android.graphics.Paint.Style.FILL
            }
            private val eyeGlintPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.WHITE
                style = android.graphics.Paint.Style.FILL
            }
            private val beakPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#FB923C")
                style = android.graphics.Paint.Style.FILL
            }
            private val lensHandlePaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#38BDF8")
                style = android.graphics.Paint.Style.STROKE
                strokeWidth = 8.5f
                strokeCap = android.graphics.Paint.Cap.ROUND
            }
            private val lensRingPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#38BDF8")
                style = android.graphics.Paint.Style.STROKE
                strokeWidth = 7f
            }
            private val blushPaint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                color = android.graphics.Color.parseColor("#80FB7185")
                style = android.graphics.Paint.Style.FILL
            }

            private val path = android.graphics.Path()

            override fun onDraw(canvas: android.graphics.Canvas) {
                super.onDraw(canvas)
                val w = width.toFloat()
                val scale = (w * 0.94f) / 256f
                val offset = (w - (w * 0.94f)) / 2f

                canvas.save()
                canvas.translate(offset, offset)
                canvas.scale(scale, scale)

                // 1. Owl Body with Ears
                path.reset()
                path.moveTo(62f, 150f)
                path.cubicTo(58f, 104f, 70f, 70f, 90f, 58f)
                path.lineTo(98f, 42f)
                path.lineTo(116f, 62f)
                path.quadTo(128f, 57f, 140f, 62f)
                path.lineTo(158f, 42f)
                path.lineTo(166f, 58f)
                path.cubicTo(186f, 70f, 198f, 104f, 194f, 150f)
                path.cubicTo(198f, 180f, 184f, 204f, 152f, 212f)
                path.cubicTo(140f, 216f, 116f, 216f, 104f, 212f)
                path.cubicTo(72f, 204f, 58f, 180f, 62f, 150f)
                path.close()
                canvas.drawPath(path, bodyPaint)
                canvas.drawPath(path, beamPaint)

                // 2. Wings
                path.reset()
                path.moveTo(74f, 124f)
                path.cubicTo(58f, 154f, 60f, 190f, 86f, 204f)
                path.cubicTo(79f, 176f, 77f, 148f, 88f, 126f)
                path.close()
                canvas.drawPath(path, wingPaint)

                path.reset()
                path.moveTo(182f, 124f)
                path.cubicTo(198f, 154f, 196f, 190f, 170f, 204f)
                path.cubicTo(177f, 176f, 179f, 148f, 168f, 126f)
                path.close()
                canvas.drawPath(path, wingPaint)

                // 3. Belly Plate
                path.reset()
                path.moveTo(128f, 126f)
                path.cubicTo(151f, 126f, 164f, 148f, 162f, 174f)
                path.cubicTo(160f, 198f, 146f, 212f, 128f, 212f)
                path.cubicTo(110f, 212f, 96f, 198f, 94f, 174f)
                path.cubicTo(92f, 148f, 105f, 126f, 128f, 126f)
                path.close()
                canvas.drawPath(path, bellyPaint)

                // 4. Chest Screen `< / >`
                val rectF = android.graphics.RectF(107f, 161f, 149f, 193f)
                canvas.drawRoundRect(rectF, 8f, 8f, screenBgPaint)
                val screenStroke = android.graphics.Paint(beamPaint).apply { strokeWidth = 2f }
                canvas.drawRoundRect(rectF, 8f, 8f, screenStroke)

                path.reset()
                path.moveTo(122f, 170f); path.lineTo(115f, 177f); path.lineTo(122f, 184f)
                path.moveTo(134f, 170f); path.lineTo(141f, 177f); path.lineTo(134f, 184f)
                path.moveTo(130f, 168f); path.lineTo(126f, 186f)
                canvas.drawPath(path, codeLinePaint)

                // 5. Normal Right Eye
                canvas.drawCircle(153f, 107f, 17f, eyeIrisPaint)
                canvas.drawCircle(153f, 108f, 8.2f, eyePupilPaint)
                canvas.drawCircle(156.2f, 104f, 3.1f, eyeGlintPaint)

                // 6. Beak
                path.reset()
                path.moveTo(123.5f, 123f)
                path.quadTo(128f, 121f, 132.5f, 123f)
                path.quadTo(131f, 132f, 128f, 134.5f)
                path.quadTo(125f, 132f, 123.5f, 123f)
                path.close()
                canvas.drawPath(path, beakPaint)

                // 7. Magnifier Debug Left Eye
                canvas.drawCircle(95f, 103f, 20f, eyeIrisPaint)
                canvas.drawCircle(95f, 104f, 10f, eyePupilPaint)
                canvas.drawCircle(98.6f, 100f, 3.4f, eyeGlintPaint)

                // Magnifier Lens Ring & Handle
                canvas.drawLine(75f, 123f, 54f, 147f, lensHandlePaint)
                canvas.drawCircle(95f, 103f, 28f, lensRingPaint)

                // Rosy Cheeks
                canvas.drawOval(android.graphics.RectF(74f, 121f, 92f, 133f), blushPaint)
                canvas.drawOval(android.graphics.RectF(158f, 116f, 176f, 128f), blushPaint)

                canvas.restore()
            }
        }.apply {
            isClickable = false
            isFocusable = false
        }
        addView(iconView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    fun setBadgeVisible(visible: Boolean) {
        // Active badge dot removed
    }

    override fun onTouchEvent(event: android.view.MotionEvent): Boolean {
        val parentView = parent as? android.view.ViewGroup ?: return super.onTouchEvent(event)
        val density = context.resources.displayMetrics.density

        when (event.actionMasked) {
            android.view.MotionEvent.ACTION_DOWN -> {
                parentView.bringChildToFront(this)
                initialX = x
                initialY = y
                touchDownX = event.rawX
                touchDownY = event.rawY
                touchDownTime = System.currentTimeMillis()
                isDragging = false
                animate().scaleX(0.92f).scaleY(0.92f).setDuration(100).start()
                return true
            }
            android.view.MotionEvent.ACTION_MOVE -> {
                val dx = event.rawX - touchDownX
                val dy = event.rawY - touchDownY

                val dist = Math.hypot(dx.toDouble(), dy.toDouble())
                if (!isDragging && dist > 16 * density) {
                    isDragging = true
                }

                if (isDragging) {
                    val minX = 10f * density
                    val maxX = (parentView.width - width - 10f * density).coerceAtLeast(minX)
                    val minY = 36f * density
                    val maxY = (parentView.height - height - 36f * density).coerceAtLeast(minY)

                    x = (initialX + dx).coerceIn(minX, maxX)
                    y = (initialY + dy).coerceIn(minY, maxY)
                }
                return true
            }
            android.view.MotionEvent.ACTION_UP -> {
                animate().scaleX(1.0f).scaleY(1.0f).setDuration(100).start()
                val elapsed = System.currentTimeMillis() - touchDownTime
                val totalDist = Math.hypot((event.rawX - touchDownX).toDouble(), (event.rawY - touchDownY).toDouble())

                if (!isDragging && totalDist < 24 * density && elapsed < 850) {
                    onTap()
                } else if (isDragging) {
                    // Smooth native snap to nearest horizontal side
                    val minX = 10f * density
                    val maxX = (parentView.width - width - 10f * density).coerceAtLeast(minX)
                    val targetX = if (x < parentView.width / 2f) minX else maxX
                    animate().x(targetX).setDuration(220).setInterpolator(android.view.animation.DecelerateInterpolator()).start()
                }
                return true
            }
            android.view.MotionEvent.ACTION_CANCEL -> {
                animate().scaleX(1.0f).scaleY(1.0f).setDuration(100).start()
                return true
            }
        }
        return super.onTouchEvent(event)
    }
}
