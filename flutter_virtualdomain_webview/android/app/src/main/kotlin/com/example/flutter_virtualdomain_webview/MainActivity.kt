package com.example.flutter_virtualdomain_webview

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity(){
    private val CHANNEL = "samples.flutter.dev/native"//호출할 패키지 이름
    
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                if (call.method == "getMessage") {//호출할 메서드 이름
                    val args = call.arguments as? Map<String, Any> ?: ""
                    result.success("Hello from Android Native!"+args)
                } else {
                    result.notImplemented()
                }
            }
    }
}