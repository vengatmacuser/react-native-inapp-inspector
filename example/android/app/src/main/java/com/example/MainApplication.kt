package com.example

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)

    if (BuildConfig.DEBUG) {
      val isEmulator = android.os.Build.FINGERPRINT.startsWith("generic")
              || android.os.Build.FINGERPRINT.startsWith("unknown")
              || android.os.Build.MODEL.contains("google_sdk")
              || android.os.Build.MODEL.contains("Emulator")
              || android.os.Build.MODEL.contains("Android SDK built for x86")
              || android.os.Build.MANUFACTURER.contains("Genymotion")
              || android.os.Build.HARDWARE.contains("goldfish")
              || android.os.Build.HARDWARE.contains("ranchu")
      if (!isEmulator) {
        try {
          val ipResId = resources.getIdentifier("developer_ip_address", "string", packageName)
          if (ipResId != 0) {
            val ip = getString(ipResId)
            if (ip.isNotEmpty() && ip != "10.0.2.2") {
              val preferences = getSharedPreferences("${packageName}_preferences", MODE_PRIVATE)
              preferences.edit().putString("debug_http_host", "$ip:8081").apply()
            }
          }
        } catch (e: Exception) {
          e.printStackTrace()
        }
      }
    }
  }
}
