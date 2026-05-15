# TensorFlow Lite / TFJS keep rules - prevent model class obfuscation
-keep class org.tensorflow.lite.** { *; }
-keep class org.tensorflow.lite.gpu.** { *; }
-keep class org.tensorflow.lite.nnapi.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn org.tensorflow.lite.**

# Keep WebView JS interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
