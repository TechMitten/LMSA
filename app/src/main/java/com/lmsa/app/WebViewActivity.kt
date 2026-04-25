package com.lmsa.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.graphics.Rect
import android.view.HapticFeedbackConstants
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.ConsoleMessage
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.RenderProcessGoneDetail
import kotlin.math.roundToInt
import java.io.IOException
import android.util.Base64
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.media.AudioManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import java.io.File
import java.util.Locale
import java.text.SimpleDateFormat
import java.util.Date
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import java.util.concurrent.Executor
import java.net.HttpURLConnection
import java.net.URL

import android.widget.Toast
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.google.android.play.core.review.ReviewManagerFactory
import org.json.JSONObject

import android.widget.FrameLayout
import com.android.billingclient.api.*

class WebViewActivity : AppCompatActivity() {

    private val TAG = "LMSA_WebView"

    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private lateinit var fileChooserLauncher: ActivityResultLauncher<Intent>
    private lateinit var fileSaverLauncher: ActivityResultLauncher<Intent>
    private lateinit var systemPromptImportLauncher: ActivityResultLauncher<Intent>
    private var pendingFileContent: String? = null
    private var pendingFileName: String? = null
    private var isImageFile: Boolean = false
    private var exitConfirmationDialog: AlertDialog? = null
    
    private var isSplashOverlayVisible = true
    private var hasStartupPageFinished = false
    private var hasCompletedInitialResume = false
    private var hasBackgroundedSinceInitialLaunch = false
    private val STARTUP_BILLING_TIMEOUT_MS = 3000L
    private enum class StartupEntitlementResolution { UNKNOWN, RESOLVED, TIMED_OUT }
    private var startupEntitlementResolution = StartupEntitlementResolution.UNKNOWN
    private val mainHandler = Handler(Looper.getMainLooper())
    private var startupBillingTimeoutRunnable: Runnable? = null



    private var textToSpeech: TextToSpeech? = null
    private var isTTSInitialized = false
    private lateinit var audioManager: AudioManager
    private var audioFocusChangeListener: AudioManager.OnAudioFocusChangeListener? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var currentChunks: List<String> = emptyList()
    private var currentChunkIndex: Int = 0
    private var isSpeakingChunks: Boolean = false
    private val ttsWatchdogHandler = Handler(Looper.getMainLooper())
    private var ttsWatchdogRunnable: Runnable? = null
    private var ttsStartCallbackReceived: Boolean = false
    private var pendingTTSText: String? = null
    private var pendingTTSRequestId: String? = null
    private var currentTTSRequestId: String? = null
    private var preferredTTSVoiceName: String? = null
    private var defaultTTSVoice: android.speech.tts.Voice? = null
    private var ttsRecoveryAttempts: Int = 0
    private var ttsAutoRecovering: Boolean = false
    private var hasNotifiedTTSStart: Boolean = false
    private var ttsRequestCounter: Long = 0L
    private val maxTTSRecoveryAttempts = 1
    private var ttsInitInProgress: Boolean = false
    private var ttsInitStartedAtMs: Long = 0L
    private var ttsInitWatchdogRunnable: Runnable? = null
    private val pendingTTSReadyCallbacks = mutableListOf<() -> Unit>()

    // Billing Client
    private lateinit var billingClient: BillingClient
    private val PRODUCT_ID = "ad_removal"
    private val PREFS_NAME = "LMSA_PREFS"
    private val PREF_IS_PREMIUM = "is_premium"
    private val PREF_IS_DEBUG_MODE = "is_debug_mode"
    private val PREF_ONBOARDING_COMPLETED = "onboarding_completed"
    private var isPremium = false
    private var isDebugMode = false
    private var biometricPromptShowing = false
    private var shouldRequireBiometricReentryOnResume = false
    private var suppressBiometricReentryForExternalPicker = false


    private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                handlePurchase(purchase)
            }
        } else if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            Log.d(TAG, "User canceled purchase")
        } else {
            Log.e(TAG, "Purchase error: ${billingResult.responseCode}")
        }
    }

    companion object {
        private const val STORAGE_PERMISSION_CODE = 101

    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        // Draw app content behind system bars without calling deprecated bar color APIs.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        hideSystemBars()
        setContentView(R.layout.activity_webview)
        applySystemBarInsets()

        // Set up global exception handler
        val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e(TAG, "Uncaught exception in thread ${thread.name}", throwable)
            defaultHandler?.uncaughtException(thread, throwable)
        }

        // Initialize BillingClient
        billingClient = BillingClient.newBuilder(this)
            .setListener(purchasesUpdatedListener)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build()

        startStartupEntitlementResolution()
        startBillingConnection()
        
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        isPremium = prefs.getBoolean(PREF_IS_PREMIUM, false)
        isDebugMode = prefs.getBoolean(PREF_IS_DEBUG_MODE, false)
        
        updatePremiumUiState()

        // Initialize AudioManager for TTS audio focus management
        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
            when (focusChange) {
                AudioManager.AUDIOFOCUS_LOSS -> {
                    val interruptedRequestId = currentTTSRequestId ?: pendingTTSRequestId
                    resetTTSPlaybackState(
                        stopPlayback = true,
                        shutdownEngine = false,
                        clearPendingRequest = true,
                        releaseAudioFocus = true
                    )
                    notifyTTSPlaybackError(interruptedRequestId, "TTS stopped because audio focus was lost")
                }
                AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                    // Don't stop on transient loss - just pause if needed
                    // This prevents stopping TTS when notifications or other brief audio events occur
                }
                AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                    // Continue playing at lower volume if needed
                }
                AudioManager.AUDIOFOCUS_GAIN -> {
                    // Resume normal playback if needed
                }
            }
        }
        
        // Create AudioFocusRequest for API 26+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
            
            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(audioFocusChangeListener!!)
                .build()
        }

        fileChooserLauncher =
            registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                val callback = filePathCallback
                if (callback == null) return@registerForActivityResult
                var results: Array<Uri>? = null
                if (result.resultCode == Activity.RESULT_OK) {
                    val data = result.data
                    if (data != null) {
                        if (data.clipData != null) {
                            results = Array(data.clipData!!.itemCount) { i ->
                                data.clipData!!.getItemAt(i).uri
                            }
                        } else if (data.data != null) {
                            results = arrayOf(data.data!!)
                        }
                    }
                }
                callback.onReceiveValue(results)
                filePathCallback = null
            }

        fileSaverLauncher =
            registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                if (result.resultCode == Activity.RESULT_OK) {
                    val uri = result.data?.data
                    if (uri != null && pendingFileContent != null) {
                        try {
                            contentResolver.openOutputStream(uri)?.use { outputStream ->
                                if (isImageFile) {
                                    // Handle binary image data
                                    val imageBytes = Base64.decode(pendingFileContent!!, Base64.DEFAULT)
                                    outputStream.write(imageBytes)
                                    Log.d(TAG, "Image file saved successfully to: $uri")
                                    // Notify JavaScript that the image was saved successfully
                                    val webView: WebView = findViewById(R.id.webView)
                                    webView.post {
                                        webView.evaluateJavascript(
                                            "if (window.onImageSaved) window.onImageSaved(true);",
                                            null
                                        )
                                    }
                                } else {
                                    // Handle text data
                                    outputStream.write(pendingFileContent!!.toByteArray())
                                    Log.d(TAG, "Text file saved successfully to: $uri")
                                    // Notify JavaScript that the file was saved successfully
                                    val webView: WebView = findViewById(R.id.webView)
                                    webView.post {
                                        webView.evaluateJavascript(
                                            "if (window.onFileSaved) window.onFileSaved(true);",
                                            null
                                        )
                                    }
                                }
                            }
                        } catch (e: IOException) {
                            Log.e(TAG, "Error saving file", e)
                            // Notify JavaScript that the file save failed
                            val webView: WebView = findViewById(R.id.webView)
                            webView.post {
                                if (isImageFile) {
                                    webView.evaluateJavascript(
                                        "if (window.onImageSaved) window.onImageSaved(false);",
                                        null
                                    )
                                } else {
                                    webView.evaluateJavascript(
                                        "if (window.onFileSaved) window.onFileSaved(false);",
                                        null
                                    )
                                }
                            }
                        }
                    } else {
                        Log.e(TAG, "File save cancelled or no content to save")
                        // Notify JavaScript that the file save was cancelled
                        val webView: WebView = findViewById(R.id.webView)
                        webView.post {
                            if (isImageFile) {
                                webView.evaluateJavascript(
                                    "if (window.onImageSaved) window.onImageSaved(false);",
                                    null
                                )
                            } else {
                                webView.evaluateJavascript(
                                    "if (window.onFileSaved) window.onFileSaved(false);",
                                    null
                                )
                            }
                        }
                    }
                } else {
                    Log.d(TAG, "File save cancelled by user")
                    // Notify JavaScript that the file save was cancelled
                    val webView: WebView = findViewById(R.id.webView)
                    webView.post {
                        if (isImageFile) {
                            webView.evaluateJavascript(
                                "if (window.onImageSaved) window.onImageSaved(false);",
                                null
                            )
                        } else {
                            webView.evaluateJavascript(
                                "if (window.onFileSaved) window.onFileSaved(false);",
                                null
                            )
                        }
                    }
                }
                // Clear pending data
                pendingFileContent = null
                pendingFileName = null
                isImageFile = false
            }

        systemPromptImportLauncher =
            registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                if (result.resultCode != Activity.RESULT_OK) {
                    notifyLmStudioSystemPromptImportResult(
                        success = false,
                        errorMessage = "cancelled"
                    )
                    return@registerForActivityResult
                }

                val uri = result.data?.data
                if (uri == null) {
                    notifyLmStudioSystemPromptImportResult(
                        success = false,
                        errorMessage = "No file was selected."
                    )
                    return@registerForActivityResult
                }

                try {
                    val fileContent = readTextFromUri(uri)
                    val fileName = getDisplayNameFromUri(uri) ?: "lm-studio-prompt.json"

                    notifyLmStudioSystemPromptImportResult(
                        success = true,
                        fileName = fileName,
                        content = fileContent
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Error importing LM Studio prompt", e)
                    notifyLmStudioSystemPromptImportResult(
                        success = false,
                        errorMessage = e.message ?: "Failed to read the selected file."
                    )
                }
            }

        syncWebContentsDebuggingState()

        val webView: WebView = findViewById(R.id.webView)
        val webSettings: WebSettings = webView.settings
        webView.isHapticFeedbackEnabled = true

        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true
        @Suppress("DEPRECATION")
        webSettings.allowFileAccessFromFileURLs = true
        // Required so that file:// pages can make cross-origin fetch() calls (e.g. to SearXNG).
        // Without this, WebView CORS blocks all network requests from file:// origin.
        @Suppress("DEPRECATION")
        webSettings.allowUniversalAccessFromFileURLs = true
        // This app uses a responsive layout with a viewport meta tag, so avoid
        // overview scaling that can shrink text on some Android devices.
        webSettings.useWideViewPort = false
        webSettings.loadWithOverviewMode = false
        // Do not override font settings by Android accessibility font scale, rely on app's internal settings
        webSettings.textZoom = 100
        webSettings.setSupportZoom(false)
        webSettings.builtInZoomControls = false
        webSettings.displayZoomControls = false
        // Use normal cache policy so WebView can reuse cached assets without forcing stale content.
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        @Suppress("DEPRECATION")
        webSettings.databaseEnabled = false
        // Allow mixed content for ads (HTTP content in HTTPS pages)
        @Suppress("DEPRECATION")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        // Ensure a dedicated cache directory exists and preserve cache across launches.
        val webViewCacheDir = File(cacheDir, "webview_cache")
        if (!webViewCacheDir.exists()) {
            webViewCacheDir.mkdirs()
        }

        if (BuildConfig.DEBUG) {
            // Keep debug runs deterministic, but avoid clearing cache in release for faster startups.
            webView.clearCache(true)
            webView.clearHistory()
        }

        // Add JavaScript interface for file operations
        webView.addJavascriptInterface(FileOperationInterface(), "AndroidFileOps")
        webView.addJavascriptInterface(ReviewInterface(), "AndroidReview")
        // Add JavaScript interface for TTS
        webView.addJavascriptInterface(TTSInterface(), "AndroidTTS")
        webView.addJavascriptInterface(BillingInterface(), "AndroidBilling")
        webView.addJavascriptInterface(UsageLimiterInterface(), "AndroidUsageLimiter")
        webView.addJavascriptInterface(PowerManagementInterface(), "AndroidPower")
        webView.addJavascriptInterface(HapticInterface(), "AndroidHaptics")
        webView.addJavascriptInterface(BiometricInterface(), "AndroidBiometrics")

        // Register native bridge for network requests (bypasses CORS)
        webView.addJavascriptInterface(NetworkInterface(), "AndroidNetwork")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                super.onPageStarted(view, url, favicon)
            }

            override fun onPageCommitVisible(view: WebView?, url: String?) {
                super.onPageCommitVisible(view, url)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                hasStartupPageFinished = true
                maybeHideStartupSplash("onPageFinished")
                // Now that the page is loaded, update the UI with the persisted premium status
                updatePremiumUiState()
                updateOnboardingUiState()
            }

            // Handle renderer crashes (e.g., from ad errors)
            override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
                Log.w(TAG, "Renderer crashed, recovering...")
                // Don't destroy the activity, just return true to indicate we handled it
                // The WebView will automatically recover
                return true
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                // Log JavaScript errors but don't let them crash the app
                if (consoleMessage.messageLevel() == ConsoleMessage.MessageLevel.ERROR) {
                    val sourceId = consoleMessage.sourceId()
                    val lineNumber = consoleMessage.lineNumber()

                    // Filter out ad-related errors that are common in test mode
                    if (sourceId.contains("2mdn.net") ||
                        sourceId.contains("googleads") ||
                        sourceId.contains("doubleclick") ||
                        consoleMessage.message().contains("setRushSimulatedLocalEvents")) {
                        Log.w(TAG, "Ad JS error (ignored): ${consoleMessage.message()} at $sourceId:$lineNumber")
                        return true // Suppress the error
                    }

                    Log.e(TAG, "JS Error: ${consoleMessage.message()} at $sourceId:$lineNumber")
                }
                return false
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallbackIn: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                val effectivePremium = hasEffectivePremium()
                if (!effectivePremium) {
                    filePathCallbackIn?.onReceiveValue(null)
                    webView?.post {
                        webView.evaluateJavascript(
                            "if (typeof window.openPremiumModal === 'function') { window.openPremiumModal('File Attachments'); }",
                            null
                        )
                    }
                    return false
                }

                if (filePathCallback != null) {
                    filePathCallback!!.onReceiveValue(null)
                    filePathCallback = null
                }
                filePathCallback = filePathCallbackIn

                val intent =
                    fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = "*/*"
                    }

                if (fileChooserParams?.isCaptureEnabled == true) {
                    // Handle capture intent
                }
                if (fileChooserParams != null && fileChooserParams.acceptTypes.isNotEmpty() && fileChooserParams.acceptTypes.first()
                        .isNotBlank()
                ) {
                    intent.type = fileChooserParams.acceptTypes.joinToString(",")
                }
                if (fileChooserParams?.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                }

                try {
                    if (intent.resolveActivity(packageManager) != null) {
                        markExternalPickerLaunch()
                        fileChooserLauncher.launch(intent)
                    } else {
                        val fallbackIntent =
                            Intent(Intent.ACTION_GET_CONTENT).apply {
                                addCategory(Intent.CATEGORY_OPENABLE)
                                type = "*/*"
                            }
                        if (fallbackIntent.resolveActivity(packageManager) != null) {
                            markExternalPickerLaunch()
                            fileChooserLauncher.launch(fallbackIntent)
                        } else {
                            Log.e(TAG, "No app available to handle file selection")
                            clearExternalPickerLaunchMarker()
                            filePathCallback?.onReceiveValue(null)
                            filePathCallback = null
                            return false
                        }
                    }
                } catch (e: Exception) {
                    clearExternalPickerLaunchMarker()
                    Log.e(TAG, "Cannot open file chooser", e)
                    filePathCallback?.onReceiveValue(null)
                    filePathCallback = null
                    return false
                }
                return true
            }
        }

        checkAndRequestStoragePermissions()
        setupBackPressHandler()
        webView.loadUrl("file:///android_asset/LMSA/index.html")
        
        // Add layout listener to update gesture exclusion rects when layout changes
        webView.addOnLayoutChangeListener { _, _, _, _, _, _, _, _, _ ->
            updateGestureExclusionRects()
        }
    }

    private fun updateGestureExclusionRects() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val webView: WebView = findViewById(R.id.webView)
            val density = resources.displayMetrics.density
            
            // Reverting to a strict 200dp height cap, as providing a full-height rect 
            // can cause some Android versions (especially on Pixel/Samsung) to reject 
            // the exclusion entirely for the back gesture.
            val exclusionWidth = (40 * density).toInt()
            val exclusionHeightLimit = (200 * density).toInt()
            val actualExclusionHeight = Math.min(webView.height, exclusionHeightLimit)
            val topOffset = (webView.height - actualExclusionHeight) / 2
            
            val exclusionRect = Rect(0, topOffset, exclusionWidth, topOffset + actualExclusionHeight)
            webView.systemGestureExclusionRects = listOf(exclusionRect)
            Log.d(TAG, "Updated system gesture exclusion rects: $exclusionRect")
        }
    }



    private fun updatePremiumUiState() {
        runOnUiThread {
            val effectivePremium = hasEffectivePremium()
            val webView: WebView = findViewById(R.id.webView)

            val jsCommand = "if(typeof updateUiForPremium === 'function') { updateUiForPremium($effectivePremium); }"
            webView.evaluateJavascript(jsCommand, null)
            syncCurrentTTSVoiceToAccessLevel()
        }
    }

    private fun hasEffectivePremium(): Boolean {
        return isPremium && !isDebugMode
    }

    private fun syncWebContentsDebuggingState() {
        runOnUiThread {
            WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG || isDebugMode)
        }
    }

    private fun syncCurrentTTSVoiceToAccessLevel() {
        val tts = textToSpeech ?: return
        if (!isTTSInitialized) return

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            if (!hasEffectivePremium()) {
                tts.setLanguage(Locale.US)
            }
            return
        }

        if (!hasEffectivePremium()) {
            val restoredVoice = defaultTTSVoice
            if (restoredVoice != null) {
                if (tts.voice?.name != restoredVoice.name) {
                    tts.voice = restoredVoice
                    Log.d(TAG, "Reset TTS voice to the default voice for the free tier")
                }
            } else {
                tts.setLanguage(Locale.US)
                Log.d(TAG, "Reset TTS voice to the default language for the free tier")
            }
            return
        }

        val preferredVoiceName = preferredTTSVoiceName
        if (!preferredVoiceName.isNullOrBlank()) {
            val preferredVoice = tts.voices?.find { it.name == preferredVoiceName }
            if (preferredVoice != null && tts.voice?.name != preferredVoiceName) {
                tts.voice = preferredVoice
                Log.d(TAG, "Reapplied preferred premium TTS voice: $preferredVoiceName")
            }
        }
    }

    private fun maybeHideStartupSplash(source: String) {
        if (!isSplashOverlayVisible) return
        if (!hasStartupPageFinished) return
        if (startupEntitlementResolution == StartupEntitlementResolution.UNKNOWN) return
        Log.d(TAG, "Hiding splash early from $source (billing resolved)")
        hideSplash()
    }

    private fun hideSplash() {
        if (!isSplashOverlayVisible) return
        isSplashOverlayVisible = false

        val splashImage = findViewById<android.widget.ImageView>(R.id.splashImageView)
        splashImage.animate()
            .alpha(0f)
            .setDuration(350)
            .withEndAction { splashImage.visibility = View.GONE }
            .start()
    }

    private fun isOnboardingCompleted(): Boolean {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        return prefs.getBoolean(PREF_ONBOARDING_COMPLETED, false)
    }

    private fun setOnboardingCompleted(completed: Boolean) {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putBoolean(PREF_ONBOARDING_COMPLETED, completed).apply()
        updateOnboardingUiState()
    }

    private fun updateOnboardingUiState() {
        runOnUiThread {
            val webView: WebView = findViewById(R.id.webView)
            val completed = isOnboardingCompleted()
            val jsCommand = "if(typeof window.updateOnboardingStateFromNative === 'function') { window.updateOnboardingStateFromNative($completed); }"
            webView.evaluateJavascript(jsCommand, null)
        }
    }

    private fun hideSystemBars() {
        val controller = WindowCompat.getInsetsController(window, window.decorView)
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
    }

    private fun showSystemBars() {
        WindowCompat.getInsetsController(window, window.decorView)
            .show(WindowInsetsCompat.Type.systemBars())
    }

    private fun applySystemBarInsets() {
        val rootContainer = findViewById<View>(R.id.rootContainer)
        val bottomSpacer = findViewById<View>(R.id.bottomSpacer)

        // Small gap between the keyboard and the WebView content so the chat input
        // (and other focused fields) aren't visually flush against the IME.
        val imeBreathingRoomPx = (resources.displayMetrics.density * 8f).toInt().coerceAtLeast(1)

        ViewCompat.setOnApplyWindowInsetsListener(rootContainer) { _, insets ->
            val navigationInsets = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
            val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
            // When the IME is visible, expand the bottom spacer to absorb the keyboard
            // height so the WebView shrinks above it. On Android 15+ (targetSdk 35),
            // edge-to-edge is enforced and adjustResize no longer shrinks the content
            // automatically — we must consume the ime inset ourselves.
            val imeBottom = if (imeInsets.bottom > 0) imeInsets.bottom + imeBreathingRoomPx else 0
            val targetHeight = maxOf(navigationInsets.bottom, imeBottom).coerceAtLeast(1)

            if (bottomSpacer.layoutParams.height != targetHeight) {
                bottomSpacer.layoutParams = bottomSpacer.layoutParams.apply {
                    height = targetHeight
                }
            }

            insets
        }
        ViewCompat.requestApplyInsets(rootContainer)
    }


    private fun checkAndRequestStoragePermissions() {
        val permissionsToRequest = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.READ_EXTERNAL_STORAGE
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
        }

        if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.P) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                permissionsToRequest.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                STORAGE_PERMISSION_CODE
            )
        } else {
            Log.d(TAG, "Storage permissions already granted or not applicable.")
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == STORAGE_PERMISSION_CODE) {
            permissions.forEachIndexed { index, permission ->
                if (grantResults.getOrNull(index) == PackageManager.PERMISSION_GRANTED) {
                    if (permission == Manifest.permission.READ_EXTERNAL_STORAGE) {
                        Log.d(TAG, "READ_EXTERNAL_STORAGE permission granted.")
                    }
                    if (permission == Manifest.permission.WRITE_EXTERNAL_STORAGE && android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.P) {
                        Log.d(TAG, "WRITE_EXTERNAL_STORAGE permission granted on API <= 28.")
                    }
                }
            }
        }
    }

    private fun setupBackPressHandler() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView: WebView = findViewById(R.id.webView)
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    handleAppExitBackPress()
                }
            }
        })
    }

    private fun handleAppExitBackPress() {
        showExitConfirmationDialog()
    }

    private fun showExitConfirmationDialog() {
        val activeDialog = exitConfirmationDialog
        if (activeDialog?.isShowing == true) {
            return
        }

        exitConfirmationDialog = AlertDialog.Builder(this)
            .setTitle(R.string.exit_confirmation_title)
            .setMessage(R.string.exit_confirmation_message)
            .setNegativeButton(R.string.exit_confirmation_stay, null)
            .setPositiveButton(R.string.exit_confirmation_close) { _, _ -> finish() }
            .setOnDismissListener { exitConfirmationDialog = null }
            .show()
    }

    override fun onPause() {
        super.onPause()
        val webView: WebView = findViewById(R.id.webView)
        webView.onPause()
        // Stop any ongoing TTS cleanly so audio doesn't bleed into the background.
        if (isSpeakingChunks || textToSpeech?.isSpeaking == true) {
            val interruptedRequestId = currentTTSRequestId ?: pendingTTSRequestId
            resetTTSPlaybackState(
                stopPlayback = true,
                shutdownEngine = false,
                clearPendingRequest = true,
                releaseAudioFocus = true
            )
            notifyTTSPlaybackError(interruptedRequestId, "TTS stopped because the app was paused")
        }
    }

    override fun onStop() {
        if (!isChangingConfigurations && !biometricPromptShowing && !suppressBiometricReentryForExternalPicker) {
            shouldRequireBiometricReentryOnResume = true
            hasBackgroundedSinceInitialLaunch = true
            notifyAppBackgrounded()
        }
        super.onStop()
    }

    override fun onResume() {
        super.onResume()
        hideSystemBars()

        if (billingClient.isReady) {
            queryPurchases()
        } else {
            startBillingConnection()
        }
        updatePremiumUiState()
        val webView: WebView = findViewById(R.id.webView)
        webView.onResume()
        hasCompletedInitialResume = true
        
        // Only re-initialize TTS if it's null or the connection was lost.
        // This prevents main-thread jank on simple resume events.
        if (textToSpeech == null || !isTTSInitialized) {
            resetTTSPlaybackState(
                stopPlayback = false,
                shutdownEngine = true,
                clearPendingRequest = true,
                releaseAudioFocus = true
            )
            notifyTTSInitialized(false)
            // Immediately begin re-initialization — the success callback will flip
            // TTSService.initialized back to true without requiring a JS-side trigger.
            startTTSEngine()
            Log.d(TAG, "TTS engine re-initialization started on resume")
        }

        if (suppressBiometricReentryForExternalPicker) {
            suppressBiometricReentryForExternalPicker = false
            shouldRequireBiometricReentryOnResume = false
            return
        }

        if (shouldRequireBiometricReentryOnResume && !biometricPromptShowing) {
            shouldRequireBiometricReentryOnResume = false
            notifyAppForegrounded()
        }
    }

    override fun onDestroy() {
        startupBillingTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        startupBillingTimeoutRunnable = null
        textToSpeech?.shutdown()
        textToSpeech = null
        isTTSInitialized = false
        super.onDestroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            hideSystemBars()
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
            val hasSupportedTransport = activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ||
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
            val hasInternetCapability = activeNetwork.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            val hasValidatedInternet = activeNetwork.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)

            return hasSupportedTransport && hasInternetCapability && hasValidatedInternet
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            @Suppress("DEPRECATION")
            return networkInfo.isConnected
        }
    }

    private fun isInternetReachableForOfflineGate(): Boolean {
        if (!hasInternetCapableTransportForOfflineGateProbe()) {
            Log.d(TAG, "Offline gate internet probe skipped: no internet-capable network transport")
            return false
        }

        val probeUrls = listOf(
            "https://connectivitycheck.gstatic.com/generate_204",
            "https://clients3.google.com/generate_204"
        )

        for (probeUrl in probeUrls) {
            try {
                val connection = (URL(probeUrl).openConnection() as HttpURLConnection).apply {
                    instanceFollowRedirects = false
                    requestMethod = "GET"
                    connectTimeout = 1500
                    readTimeout = 1500
                    useCaches = false
                    setRequestProperty("Cache-Control", "no-cache")
                    setRequestProperty("Pragma", "no-cache")
                    setRequestProperty("User-Agent", "LMSA-Internet-Probe")
                }

                connection.connect()
                val responseCode = connection.responseCode
                connection.disconnect()

                if (responseCode == HttpURLConnection.HTTP_NO_CONTENT) {
                    Log.d(TAG, "Offline gate internet probe succeeded via $probeUrl with HTTP $responseCode")
                    return true
                }

                Log.d(TAG, "Offline gate internet probe returned HTTP $responseCode via $probeUrl")
            } catch (e: Exception) {
                Log.d(TAG, "Offline gate internet probe failed via $probeUrl: ${e.message}")
            }
        }

        Log.d(TAG, "Offline gate internet probe failed for all endpoints")
        return false
    }

    private fun hasInternetCapableTransportForOfflineGateProbe(): Boolean {
        val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val activeNetwork = connectivityManager.getNetworkCapabilities(network) ?: return false
            val hasSupportedTransport = activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ||
                activeNetwork.hasTransport(NetworkCapabilities.TRANSPORT_VPN)
            val hasInternetCapability = activeNetwork.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)

            return hasSupportedTransport && hasInternetCapability
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo ?: return false
            @Suppress("DEPRECATION")
            return networkInfo.isConnected
        }
    }

    private fun dispatchOfflineGateInternetProbeResult(hasInternet: Boolean) {
        runOnUiThread {
            val webView: WebView = findViewById(R.id.webView)
            webView.evaluateJavascript(
                "if (typeof window.onNativeOfflineInternetProbeResult === 'function') { window.onNativeOfflineInternetProbeResult($hasInternet); }",
                null
            )
        }
    }

    private fun launchInAppReview() {
        val manager = ReviewManagerFactory.create(this)
        val request = manager.requestReviewFlow()
        request.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                // We got the ReviewInfo object
                val reviewInfo = task.result
                val flow = manager.launchReviewFlow(this, reviewInfo)
                flow.addOnCompleteListener { _ ->
                    // The flow has finished
                    Log.d(TAG, "In-app review flow completed")
                }
            } else {
                // There was some problem, log the error
                Log.e(TAG, "Error requesting review flow: ${task.exception}")
            }
        }
    }

    private fun startStartupEntitlementResolution() {
        startupEntitlementResolution = StartupEntitlementResolution.UNKNOWN
        startupBillingTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        startupBillingTimeoutRunnable = Runnable {
            if (startupEntitlementResolution != StartupEntitlementResolution.UNKNOWN) {
                return@Runnable
            }
            startupEntitlementResolution = StartupEntitlementResolution.TIMED_OUT
            startupBillingTimeoutRunnable = null
            Log.w(TAG, "Startup billing entitlement resolution timed out after ${STARTUP_BILLING_TIMEOUT_MS}ms")
            hideSplash()
        }
        mainHandler.postDelayed(startupBillingTimeoutRunnable!!, STARTUP_BILLING_TIMEOUT_MS)
    }

    private fun markStartupEntitlementResolved(source: String) {
        if (startupEntitlementResolution != StartupEntitlementResolution.UNKNOWN) {
            return
        }
        startupEntitlementResolution = StartupEntitlementResolution.RESOLVED
        startupBillingTimeoutRunnable?.let { mainHandler.removeCallbacks(it) }
        startupBillingTimeoutRunnable = null
        Log.d(TAG, "Startup billing entitlement resolved via $source")
        runOnUiThread {
            maybeHideStartupSplash("billingResolved:$source")
        }
    }

    private fun requestAudioFocus(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.requestAudioFocus(audioFocusRequest!!)
        } else {
            @Suppress("DEPRECATION")
            audioManager.requestAudioFocus(
                audioFocusChangeListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN
            )
        }
    }

    private fun abandonAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest!!)
        } else {
            @Suppress("DEPRECATION")
            audioManager.abandonAudioFocus(audioFocusChangeListener)
        }
    }

    private fun nextTTSRequestId(): String {
        ttsRequestCounter += 1
        return "tts_${System.currentTimeMillis()}_$ttsRequestCounter"
    }

    private fun escapeJsString(value: String): String {
        return value
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\r", "\\r")
            .replace("\n", "\\n")
            .replace("</", "<\\/")
    }

    private fun runTTSJavascript(script: String) {
        val webView: WebView = findViewById(R.id.webView)
        webView.post {
            webView.evaluateJavascript(script, null)
        }
    }

    private fun runLifecycleJavascript(script: String) {
        val webView: WebView = findViewById(R.id.webView)
        webView.post {
            webView.evaluateJavascript(script, null)
        }
    }

    private fun notifyAppBackgrounded() {
        runLifecycleJavascript("if (window.onAppBackgrounded) window.onAppBackgrounded();")
    }

    private fun notifyAppForegrounded() {
        runLifecycleJavascript("if (window.onAppForegrounded) window.onAppForegrounded();")
    }

    private fun notifyTTSInitialized(success: Boolean) {
        runTTSJavascript(
            "window.__nativeTtsReady = ${if (success) "true" else "false"};" +
                "if (${if (success) "window.onNativeTtsReady" else "window.onNativeTtsInitFailed"}) { " +
                "${if (success) "window.onNativeTtsReady()" else "window.onNativeTtsInitFailed()"}; }" +
                "if (window.onTTSInitialized) window.onTTSInitialized(${if (success) "true" else "false"});" +
                "if (window.TTSService) { window.TTSService.initialized = ${if (success) "true" else "false"}; window.TTSService.isInitializing = false; }"
        )
    }

    private fun notifyTTSPlaybackStarted(requestId: String?) {
        if (requestId.isNullOrBlank()) return
        runTTSJavascript(
            "if (window.TTSService && window.TTSService._handleNativePlaybackStarted) { " +
                "window.TTSService._handleNativePlaybackStarted('${escapeJsString(requestId)}'); }"
        )
    }

    private fun notifyTTSPlaybackCompleted(requestId: String?) {
        if (requestId.isNullOrBlank()) return
        runTTSJavascript(
            "if (window.TTSService && window.TTSService._handleNativePlaybackCompleted) { " +
                "window.TTSService._handleNativePlaybackCompleted('${escapeJsString(requestId)}'); }"
        )
    }

    private fun notifyTTSPlaybackError(requestId: String?, message: String) {
        val escapedMessage = escapeJsString(message)
        if (requestId.isNullOrBlank()) {
            runTTSJavascript(
                "if (window.TTSService && window.TTSService._notifyPlaybackFailed) { " +
                    "window.TTSService._notifyPlaybackFailed('$escapedMessage'); }"
            )
            return
        }

        runTTSJavascript(
            "if (window.TTSService && window.TTSService._handleNativePlaybackError) { " +
                "window.TTSService._handleNativePlaybackError('${escapeJsString(requestId)}', '$escapedMessage'); }"
        )
    }

    private fun resetTTSPlaybackState(
        stopPlayback: Boolean,
        shutdownEngine: Boolean,
        clearPendingRequest: Boolean,
        releaseAudioFocus: Boolean
    ) {
        clearTTSWatchdog()
        if (stopPlayback) {
            try {
                textToSpeech?.stop()
            } catch (stopError: Exception) {
                Log.w(TAG, "Error stopping TTS during reset: ${stopError.message}")
            }
        }

        isSpeakingChunks = false
        currentChunks = emptyList()
        currentChunkIndex = 0
        ttsStartCallbackReceived = false
        hasNotifiedTTSStart = false
        currentTTSRequestId = null

        if (shutdownEngine) {
            clearTTSInitWatchdog()
            ttsInitInProgress = false
            ttsInitStartedAtMs = 0L
            isTTSInitialized = false
            try {
                textToSpeech?.shutdown()
            } catch (shutdownError: Exception) {
                Log.w(TAG, "Error shutting down TTS during reset: ${shutdownError.message}")
            }
            textToSpeech = null
        }

        if (clearPendingRequest) {
            pendingTTSText = null
            pendingTTSRequestId = null
            ttsRecoveryAttempts = 0
            ttsAutoRecovering = false
        }

        if (releaseAudioFocus) {
            abandonAudioFocus()
        }
    }

    private fun clearTTSInitWatchdog() {
        ttsInitWatchdogRunnable?.let { ttsWatchdogHandler.removeCallbacks(it) }
        ttsInitWatchdogRunnable = null
    }

    private fun readTextFromUri(uri: Uri): String {
        return contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8).use { reader ->
            reader?.readText() ?: throw IOException("Unable to open selected file")
        }
    }

    private fun markExternalPickerLaunch() {
        suppressBiometricReentryForExternalPicker = true
    }

    private fun clearExternalPickerLaunchMarker() {
        suppressBiometricReentryForExternalPicker = false
    }

    private fun getDisplayNameFromUri(uri: Uri): String? {
        return contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            val columnIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (columnIndex != -1 && cursor.moveToFirst()) {
                cursor.getString(columnIndex)
            } else {
                null
            }
        }
    }

    private fun notifyLmStudioSystemPromptImportResult(
        success: Boolean,
        fileName: String? = null,
        content: String? = null,
        errorMessage: String? = null
    ) {
        val webView: WebView = findViewById(R.id.webView)
        val jsCommand = buildString {
            append("if (window.onLmStudioSystemPromptImportResult) window.onLmStudioSystemPromptImportResult({")
            append("success:")
            append(if (success) "true" else "false")

            if (fileName != null) {
                append(",fileName:")
                append(JSONObject.quote(fileName))
            }

            if (content != null) {
                append(",content:")
                append(JSONObject.quote(content))
            }

            if (errorMessage != null) {
                append(",errorMessage:")
                append(JSONObject.quote(errorMessage))
            }

            append("});")
        }

        webView.post {
            webView.evaluateJavascript(jsCommand, null)
        }
    }

    inner class FileOperationInterface {
        @JavascriptInterface
        fun saveData(key: String, data: String): Boolean {
            return try {
                val file = java.io.File(filesDir, "$key.json")
                file.writeText(data)
                Log.d(TAG, "Successfully saved data to internal storage: $key")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Error saving data to internal storage: $key", e)
                false
            }
        }

        @JavascriptInterface
        fun loadData(key: String): String {
            return try {
                val file = java.io.File(filesDir, "$key.json")
                if (file.exists()) {
                    file.readText()
                } else {
                    ""
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading data from internal storage: $key", e)
                ""
            }
        }

        @JavascriptInterface
        fun deleteData(key: String): Boolean {
            return try {
                val file = java.io.File(filesDir, "$key.json")
                if (file.exists()) {
                    file.delete()
                } else {
                    true
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error deleting data from internal storage: $key", e)
                false
            }
        }

        @JavascriptInterface
        fun saveFile(content: String, filename: String) {
            Log.d(TAG, "JavaScript requested to save file: $filename")

            // Store the content and filename for later use
            pendingFileContent = content
            pendingFileName = filename
            isImageFile = false

            // Create an intent to open the Storage Access Framework
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/json"
                putExtra(Intent.EXTRA_TITLE, filename)
            }

            try {
                markExternalPickerLaunch()
                fileSaverLauncher.launch(intent)
            } catch (e: Exception) {
                clearExternalPickerLaunchMarker()
                Log.e(TAG, "Error launching file saver", e)
                // Notify JavaScript that the save failed
                val webView: WebView = findViewById(R.id.webView)
                webView.post {
                    webView.evaluateJavascript(
                        "if (window.onFileSaved) window.onFileSaved(false);",
                        null
                    )
                }
            }
        }

        @JavascriptInterface
        fun saveImageFile(base64Data: String, filename: String) {
            Log.d(TAG, "JavaScript requested to save image file: $filename")

            try {
                // Remove data URL prefix if present (data:image/jpeg;base64,)
                val cleanBase64 = if (base64Data.contains(",")) {
                    base64Data.substring(base64Data.indexOf(",") + 1)
                } else {
                    base64Data
                }

                // Store the content and filename for later use
                pendingFileContent = cleanBase64
                pendingFileName = filename
                isImageFile = true

                // Determine MIME type based on file extension
                val mimeType = when {
                    filename.lowercase().endsWith(".jpg") || filename.lowercase().endsWith(".jpeg") -> "image/jpeg"
                    filename.lowercase().endsWith(".png") -> "image/png"
                    filename.lowercase().endsWith(".gif") -> "image/gif"
                    filename.lowercase().endsWith(".webp") -> "image/webp"
                    else -> "image/jpeg" // Default to JPEG
                }

                // Create an intent to open the Storage Access Framework for images
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = mimeType
                    putExtra(Intent.EXTRA_TITLE, filename)
                }

                markExternalPickerLaunch()
                fileSaverLauncher.launch(intent)
            } catch (e: Exception) {
                clearExternalPickerLaunchMarker()
                Log.e(TAG, "Error launching image file saver", e)
                // Notify JavaScript that the save failed
                val webView: WebView = findViewById(R.id.webView)
                webView.post {
                    webView.evaluateJavascript(
                        "if (window.onImageSaved) window.onImageSaved(false);",
                        null
                    )
                }
            }
        }

        @JavascriptInterface
        fun isAndroidApp(): Boolean {
            return true
        }

        @JavascriptInterface
        fun importLmStudioSystemPrompt() {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/json"
                putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/json", "text/plain"))
            }

            try {
                markExternalPickerLaunch()
                systemPromptImportLauncher.launch(intent)
            } catch (e: Exception) {
                clearExternalPickerLaunchMarker()
                Log.e(TAG, "Error launching LM Studio prompt picker", e)
                notifyLmStudioSystemPromptImportResult(
                    success = false,
                    errorMessage = e.message ?: "Unable to open the file picker."
                )
            }
        }
    }



    inner class ReviewInterface {
        @JavascriptInterface
        fun requestInAppReview() {
            Log.d(TAG, "JavaScript requested in-app review")
            runOnUiThread {
                launchInAppReview()
            }
        }
    }

    private fun startBillingConnection(queryOnConnected: Boolean = true, onConnected: (() -> Unit)? = null) {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    if (queryOnConnected) {
                        queryPurchases()
                    }
                    onConnected?.invoke()
                }
            }
            override fun onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected, attempting reconnect")
                startBillingConnection(queryOnConnected, onConnected)
            }
        })
    }

    private fun notifyRestorePurchasesResult(success: Boolean, message: String) {
        runOnUiThread {
            val webView: WebView = findViewById(R.id.webView)
            val escapedMessage = escapeJsString(message)
            val jsCommand = "if (window.onRestorePurchasesResult) window.onRestorePurchasesResult(${if (success) "true" else "false"}, '$escapedMessage');"
            webView.evaluateJavascript(jsCommand, null)
        }
    }

    private fun queryPurchases(notifyRestoreResult: Boolean = false) {
        if (!billingClient.isReady) {
            if (notifyRestoreResult) {
                notifyRestorePurchasesResult(false, "Billing is not ready yet. Please try again in a moment.")
            }
            return
        }
        
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.INAPP)
            .build()
            
        billingClient.queryPurchasesAsync(params) { billingResult, purchasesList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                var hasPremium = false
                for (purchase in purchasesList) {
                    if (purchase.products.contains(PRODUCT_ID) && purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                        hasPremium = true
                        if (!purchase.isAcknowledged) {
                            handlePurchase(purchase)
                        }
                    }
                }
                
                if (hasPremium != isPremium) {
                    setPremiumStatus(hasPremium)
                }

                markStartupEntitlementResolved("queryPurchases")

                if (notifyRestoreResult) {
                    if (hasPremium) {
                        notifyRestorePurchasesResult(true, "Purchase restored successfully. Premium is now active.")
                    } else {
                        notifyRestorePurchasesResult(false, "No previous purchase was found for this Google account.")
                    }
                }
            } else {
                Log.w(TAG, "queryPurchases failed during startup: ${billingResult.responseCode} ${billingResult.debugMessage}")
                if (notifyRestoreResult) {
                    notifyRestorePurchasesResult(false, "Unable to check purchases right now. Please try again.")
                }
            }
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged) {
                val acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
                billingClient.acknowledgePurchase(acknowledgePurchaseParams) { billingResult ->
                    if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                         setPremiumStatus(true)
                    }
                }
            } else {
                setPremiumStatus(true)
            }
        }
    }

    private fun setPremiumStatus(premium: Boolean) {
        isPremium = premium
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        prefs.edit().putBoolean(PREF_IS_PREMIUM, isPremium).apply()
        
        updatePremiumUiState()

        if (startupEntitlementResolution == StartupEntitlementResolution.UNKNOWN) {
            markStartupEntitlementResolved("setPremiumStatus")
        }
    }

    inner class BillingInterface {
        @JavascriptInterface
        fun purchaseAdRemoval() {
            if (isPremium) {
                runOnUiThread {
                    Toast.makeText(this@WebViewActivity, "You already have Premium!", Toast.LENGTH_SHORT).show()
                }
                return
            }

            if (!billingClient.isReady) {
                Log.w(TAG, "Billing client not ready, attempting reconnect before purchase")
                startBillingConnection()
                runOnUiThread {
                    Toast.makeText(this@WebViewActivity, "Billing is reconnecting. Please try again in a moment.", Toast.LENGTH_SHORT).show()
                }
                return
            }
            
            val productList = listOf(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(PRODUCT_ID)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            )
            
            val params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build()
                
            billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    if (productDetailsList.isNotEmpty()) {
                        val productDetails = productDetailsList[0]
                        val productDetailsParamsList = listOf(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(productDetails)
                                .build()
                        )
                        val billingFlowParams = BillingFlowParams.newBuilder()
                            .setProductDetailsParamsList(productDetailsParamsList)
                            .build()
                        billingClient.launchBillingFlow(this@WebViewActivity, billingFlowParams)
                    } else {
                        Log.e(TAG, "Product not found: $PRODUCT_ID")
                        runOnUiThread {
                            Toast.makeText(this@WebViewActivity, "Product details not found", Toast.LENGTH_SHORT).show()
                        }
                    }
                } else {
                    Log.e(TAG, "Failed to query product details: ${billingResult.debugMessage}")
                }
            }
        }
        
        @JavascriptInterface
        fun restorePurchases() {
            runOnUiThread {
                Toast.makeText(this@WebViewActivity, "Checking for purchases...", Toast.LENGTH_SHORT).show()
            }

            if (billingClient.isReady) {
                queryPurchases(notifyRestoreResult = true)
                return
            }

            Log.w(TAG, "Billing client not ready, reconnecting before restore")
            startBillingConnection(queryOnConnected = false) {
                queryPurchases(notifyRestoreResult = true)
            }
        }

        @JavascriptInterface
        fun checkPremiumStatus(): Boolean {
            return hasEffectivePremium()
        }

        @JavascriptInterface
        fun checkDebugMode(): Boolean {
            return isDebugMode
        }

        @JavascriptInterface
        fun isOnboardingCompleted(): Boolean {
            return this@WebViewActivity.isOnboardingCompleted()
        }

        @JavascriptInterface
        fun setOnboardingCompleted(completed: Boolean) {
            this@WebViewActivity.setOnboardingCompleted(completed)
        }

        @JavascriptInterface
        fun toggleDebugMode(enable: Boolean) {
            isDebugMode = enable
            val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            prefs.edit().putBoolean(PREF_IS_DEBUG_MODE, enable).apply()
            syncWebContentsDebuggingState()

            runOnUiThread {
                Toast.makeText(this@WebViewActivity, "Debug Mode: ${if(enable) "Enabled" else "Disabled"}", Toast.LENGTH_SHORT).show()
            }
            updatePremiumUiState()
        }
    }

    inner class UsageLimiterInterface {
        private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        private fun today(): String = dateFormat.format(Date())

        private fun getUsageCountForToday(dateKey: String, countKey: String): Int {
            val prefs = getSharedPreferences("LMSA_PREFS", MODE_PRIVATE)
            val todayStr = today()
            val storedDate = prefs.getString(dateKey, "") ?: ""

            if (storedDate.isEmpty() || storedDate != todayStr) {
                prefs.edit()
                    .putString(dateKey, todayStr)
                    .putInt(countKey, 0)
                    .apply()
                return 0
            }

            return prefs.getInt(countKey, 0)
        }

        private fun recordUsage(dateKey: String, countKey: String) {
            val prefs = getSharedPreferences("LMSA_PREFS", MODE_PRIVATE)
            val todayStr = today()
            val count = getUsageCountForToday(dateKey, countKey)

            prefs.edit()
                .putString(dateKey, todayStr)
                .putInt(countKey, count + 1)
                .apply()
        }

        @JavascriptInterface
        fun canSendCompletion(): Boolean {
            if (hasEffectivePremium()) return true
            return getUsageCountForToday("lmsa_completion_date", "lmsa_completion_count") < 15
        }

        @JavascriptInterface
        fun recordCompletion() {
            if (hasEffectivePremium()) return
            recordUsage("lmsa_completion_date", "lmsa_completion_count")
        }

        @JavascriptInterface
        fun canUseWebSearch(): Boolean {
            if (hasEffectivePremium()) return true
            return getUsageCountForToday("lmsa_web_search_date", "lmsa_web_search_count") < 2
        }

        @JavascriptInterface
        fun recordWebSearch() {
            if (hasEffectivePremium()) return
            recordUsage("lmsa_web_search_date", "lmsa_web_search_count")
        }

        @JavascriptInterface
        fun canSendOpenRouterCompletion(): Boolean {
            return true
        }

        @JavascriptInterface
        fun recordOpenRouterCompletion() {
            // OpenRouter completions are no longer quota-limited by app tier.
        }
    }

    /**
     * Resets all TTS state and shuts down the broken engine so the next speak()
     * call triggers a clean re-initialization via initializeTTS().
     * Also notifies JavaScript so TTSService.initialized is cleared.
     */
    private fun handleTTSEngineFailure(errorMessage: String = "Android TTS engine failed") {
        val textToRetry = pendingTTSText
        val requestIdToRetry = pendingTTSRequestId ?: currentTTSRequestId
        val canRetry = !textToRetry.isNullOrBlank() &&
            !requestIdToRetry.isNullOrBlank() &&
            ttsRecoveryAttempts < maxTTSRecoveryAttempts

        resetTTSPlaybackState(
            stopPlayback = false,
            shutdownEngine = true,
            clearPendingRequest = false,
            releaseAudioFocus = true
        )
        notifyTTSInitialized(false)

        Log.w(
            TAG,
            "TTS engine failure: requestId=$requestIdToRetry, canRetry=$canRetry, attempts=$ttsRecoveryAttempts"
        )

        if (canRetry) {
            ttsAutoRecovering = true
            ttsRecoveryAttempts += 1
            Log.d(TAG, "TTS auto-recovery: reinitializing engine and retrying speak")
            startTTSEngine(onReady = {
                runOnUiThread {
                    val retryText = pendingTTSText
                    val retryRequestId = pendingTTSRequestId
                    if (retryText.isNullOrBlank() || retryRequestId.isNullOrBlank()) {
                        ttsAutoRecovering = false
                        ttsRecoveryAttempts = 0
                        notifyTTSPlaybackError(requestIdToRetry, errorMessage)
                        return@runOnUiThread
                    }

                    TTSInterface().speakInternal(retryText, retryRequestId)
                }
            })
        } else {
            pendingTTSText = null
            pendingTTSRequestId = null
            currentTTSRequestId = null
            ttsRecoveryAttempts = 0
            ttsAutoRecovering = false
            notifyTTSPlaybackError(requestIdToRetry, errorMessage)
        }
    }

    private fun scheduleTTSWatchdog(chunkIndex: Int, chunkText: String) {
        clearTTSWatchdog()
        ttsStartCallbackReceived = false

        // Fast check: if onStart hasn't fired within 2s, the engine is likely dead.
        val startCheckRunnable = Runnable {
            if (isSpeakingChunks && currentChunkIndex == chunkIndex && !ttsStartCallbackReceived) {
                Log.e(TAG, "TTS onStart never fired for chunk $chunkIndex — engine is dead, recovering")
                handleTTSEngineFailure()
            }
        }
        ttsWatchdogHandler.postDelayed(startCheckRunnable, 2000L)

        // Rough upper bound: 240ms per character plus a 6s floor, capped at 25s.
        val timeoutMs = (chunkText.length * 240L).coerceAtLeast(6000L).coerceAtMost(25000L)
        ttsWatchdogRunnable = Runnable {
            // Remove the start check too
            ttsWatchdogHandler.removeCallbacks(startCheckRunnable)
            if (isSpeakingChunks && currentChunkIndex == chunkIndex) {
                Log.e(TAG, "TTS watchdog timed out on chunk $chunkIndex after ${timeoutMs}ms")
                handleTTSEngineFailure()
            }
        }
        ttsWatchdogHandler.postDelayed(ttsWatchdogRunnable!!, timeoutMs)
    }

    private fun clearTTSWatchdog() {
        ttsWatchdogRunnable?.let { ttsWatchdogHandler.removeCallbacks(it) }
        ttsWatchdogRunnable = null
    }

    /**
     * Starts a fresh TTS engine. Must be called on the UI thread.
     * Shared by TTSInterface.initializeTTS() and the proactive re-init in onResume().
     */
    private fun startTTSEngine(onReady: (() -> Unit)? = null) {
        onReady?.let { pendingTTSReadyCallbacks.add(it) }

        if (textToSpeech != null && isTTSInitialized) {
            if (pendingTTSReadyCallbacks.isNotEmpty()) {
                val callbacks = pendingTTSReadyCallbacks.toList()
                pendingTTSReadyCallbacks.clear()
                callbacks.forEach { callback -> callback.invoke() }
            }
            return
        }

        if (ttsInitInProgress) {
            val initAgeMs = SystemClock.elapsedRealtime() - ttsInitStartedAtMs
            if (initAgeMs < 15000L) {
                Log.d(TAG, "TTS initialization already in progress for ${initAgeMs}ms; keeping current attempt")
                return
            }

            Log.w(TAG, "TTS initialization appears stale after ${initAgeMs}ms; resetting and retrying")
            resetTTSPlaybackState(
                stopPlayback = false,
                shutdownEngine = true,
                clearPendingRequest = false,
                releaseAudioFocus = false
            )
            notifyTTSInitialized(false)
        }

        if (textToSpeech != null && !isTTSInitialized) {
            textToSpeech?.shutdown()
            textToSpeech = null
        }

        ttsInitInProgress = true
        ttsInitStartedAtMs = SystemClock.elapsedRealtime()
        clearTTSInitWatchdog()
        Log.d(TAG, "Creating TextToSpeech instance")

        ttsInitWatchdogRunnable = Runnable {
            if (!ttsInitInProgress || isTTSInitialized) {
                return@Runnable
            }

            Log.e(TAG, "TTS initialization watchdog timed out after 15000ms")
            pendingTTSReadyCallbacks.clear()
            resetTTSPlaybackState(
                stopPlayback = false,
                shutdownEngine = true,
                clearPendingRequest = false,
                releaseAudioFocus = false
            )
            notifyTTSInitialized(false)

            val failedRequestId = pendingTTSRequestId
            if (failedRequestId != null) {
                notifyTTSPlaybackError(failedRequestId, "Android TTS initialization timed out")
                pendingTTSText = null
                pendingTTSRequestId = null
                currentTTSRequestId = null
                ttsRecoveryAttempts = 0
                ttsAutoRecovering = false
            }
        }
        ttsWatchdogHandler.postDelayed(ttsInitWatchdogRunnable!!, 15000L)

        textToSpeech = TextToSpeech(this) { status ->
            // Post the init work back onto the main queue after constructor assignment
            // completes. This avoids racing a second initializeTTS() call against the
            // window where ttsInitInProgress is true but textToSpeech has not been stored.
            ttsWatchdogHandler.post {
                clearTTSInitWatchdog()
                ttsInitInProgress = false
                ttsInitStartedAtMs = 0L

                val tts = textToSpeech
                if (status == TextToSpeech.SUCCESS && tts != null) {
                    val result = tts.setLanguage(Locale.US)
                    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Log.e(TAG, "TTS language not supported, falling back to device default")
                        tts.setLanguage(Locale.getDefault())
                    }

                    tts.setSpeechRate(0.9f)
                    tts.setPitch(1.0f)

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        if (defaultTTSVoice == null) {
                            defaultTTSVoice = tts.voice
                        }

                        val audioAttributes = AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build()
                        tts.setAudioAttributes(audioAttributes)
                        Log.d(TAG, "Audio attributes set for TTS with USAGE_MEDIA/CONTENT_TYPE_SPEECH")

                        val preferredVoiceName = preferredTTSVoiceName
                        if (!preferredVoiceName.isNullOrBlank() && hasEffectivePremium()) {
                            val preferredVoice = tts.voices?.find { it.name == preferredVoiceName }
                            if (preferredVoice != null) {
                                tts.voice = preferredVoice
                                Log.d(TAG, "Reapplied preferred TTS voice after init: $preferredVoiceName")
                            } else {
                                Log.w(TAG, "Preferred TTS voice no longer available after init: $preferredVoiceName")
                                preferredTTSVoiceName = null
                            }
                        } else if (!preferredVoiceName.isNullOrBlank()) {
                            Log.d(TAG, "Skipping preferred premium TTS voice while premium access is unavailable")
                        }
                    }

                    Log.d(TAG, "TTS initialized successfully with optimized settings and audio attributes")
                    isTTSInitialized = true
                    notifyTTSInitialized(true)

                    if (pendingTTSReadyCallbacks.isNotEmpty()) {
                        val callbacks = pendingTTSReadyCallbacks.toList()
                        pendingTTSReadyCallbacks.clear()
                        callbacks.forEach { callback -> callback.invoke() }
                    }
                } else {
                    Log.e(TAG, "TTS initialization failed with status=$status")

                    pendingTTSReadyCallbacks.clear()
                    isTTSInitialized = false
                    textToSpeech?.shutdown()
                    textToSpeech = null
                    notifyTTSInitialized(false)

                    val failedRequestId = pendingTTSRequestId
                    if (failedRequestId != null) {
                        notifyTTSPlaybackError(failedRequestId, "Android TTS initialization failed")
                        pendingTTSText = null
                        pendingTTSRequestId = null
                        currentTTSRequestId = null
                        ttsRecoveryAttempts = 0
                        ttsAutoRecovering = false
                    }
                }
            }
        }
    }

    inner class TTSInterface {
        @JavascriptInterface
        fun initializeTTS() {
            runOnUiThread {
                if (textToSpeech != null && isTTSInitialized) {
                    Log.d(TAG, "initializeTTS called while engine already ready; notifying JavaScript immediately")
                    notifyTTSInitialized(true)
                    return@runOnUiThread
                }
                startTTSEngine()
            }
        }

        @JavascriptInterface
        fun speak(text: String) {
            speakWithRequestId(nextTTSRequestId(), text)
        }

        @JavascriptInterface
        fun speakWithRequestId(requestId: String, text: String) {
            runOnUiThread {
                speakInternal(text, requestId.ifBlank { nextTTSRequestId() })
            }
        }

        fun speakInternal(text: String, requestId: String) {
            if (textToSpeech == null || !isTTSInitialized) {
                Log.w(TAG, "TTS not ready for request $requestId, initializing and queueing playback")
                pendingTTSText = text
                pendingTTSRequestId = requestId
                currentTTSRequestId = requestId
                startTTSEngine(onReady = {
                    runOnUiThread {
                        val retryText = pendingTTSText
                        val retryRequestId = pendingTTSRequestId
                        if (!retryText.isNullOrBlank() && !retryRequestId.isNullOrBlank()) {
                            speakInternal(retryText, retryRequestId)
                        }
                    }
                })
                return
            }

            val result = requestAudioFocus()
            if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                Log.w(TAG, "Audio focus request denied for request $requestId")
                notifyTTSPlaybackError(requestId, "Audio focus request denied")
                resetTTSPlaybackState(
                    stopPlayback = false,
                    shutdownEngine = false,
                    clearPendingRequest = true,
                    releaseAudioFocus = true
                )
                return
            }

            if (pendingTTSRequestId != requestId) {
                ttsRecoveryAttempts = 0
            }

            pendingTTSText = text
            pendingTTSRequestId = requestId
            currentTTSRequestId = requestId
            hasNotifiedTTSStart = false

            val cleanText = text
                .replace(Regex("<think>[\\s\\S]*?</think>"), "")
                .replace(Regex("<[^>]*>"), "")
                .replace(Regex("\\*\\*([^*]+)\\*\\*"), "$1")
                .replace(Regex("\\*([^*]+)\\*"), "$1")
                .replace(Regex("```[\\s\\S]*?```"), " Code block. ")
                .replace(Regex("`([^`]+)`"), "$1")
                .replace(Regex("#{1,6}\\s*"), "")
                .replace(Regex("\\[([^\\]]+)\\]\\([^)]+\\)"), "$1")
                .replace(Regex("[\\p{So}\\p{Sk}\\p{Cn}]"), " ")
                .replace(Regex("[^\\p{L}\\p{N}\\s.,!?;:()\\-'\" ]"), " ")
                .replace(Regex("\\bAPI\\b"), "A P I")
                .replace(Regex("\\bURL\\b"), "U R L")
                .replace(Regex("\\bHTML\\b"), "H T M L")
                .replace(Regex("\\bCSS\\b"), "C S S")
                .replace(Regex("\\bJS\\b"), "JavaScript")
                .replace(Regex("\\bJSON\\b"), "J S O N")
                .replace(Regex("\\bXML\\b"), "X M L")
                .replace(Regex("\\bSQL\\b"), "S Q L")
                .replace(Regex("(\\d+)\\.(\\d+)"), "$1 point $2")
                .replace(Regex("\\b(\\d+)%"), "$1 percent")
                .replace(Regex("\\$(\\d+)"), "$1 dollars")
                .replace(Regex("([.!?])\\s*([.!?])"), "$1 ")
                .replace(Regex("([,;:])\\s*([,;:])"), "$1 ")
                .replace(Regex("\\.\\s+"), ". ")
                .replace(Regex("!\\s+"), "! ")
                .replace(Regex("\\?\\s+"), "? ")
                .replace(Regex(":\\s+"), ": ")
                .replace(Regex(";\\s+"), "; ")
                .replace(Regex("\\s+"), " ")
                .trim()

            if (cleanText.isEmpty()) {
                notifyTTSPlaybackError(requestId, "No speakable text was available")
                resetTTSPlaybackState(
                    stopPlayback = false,
                    shutdownEngine = false,
                    clearPendingRequest = true,
                    releaseAudioFocus = true
                )
                return
            }

            val maxChunkLength = 200
            val chunks = if (cleanText.length <= maxChunkLength) {
                listOf(cleanText)
            } else {
                chunkText(cleanText, maxChunkLength)
            }

            speakChunks(chunks, 0)
        }
        
        private fun chunkText(text: String, maxLength: Int): List<String> {
            val chunks = mutableListOf<String>()
            var currentChunk = ""
            val sentences = text.split(Regex("(?<=[.!?])\\s+"))
            
            for (sentence in sentences) {
                if (currentChunk.length + sentence.length + 1 <= maxLength) {
                    currentChunk += if (currentChunk.isEmpty()) sentence else " $sentence"
                } else {
                    if (currentChunk.isNotEmpty()) {
                        chunks.add(currentChunk.trim())
                        currentChunk = sentence
                    } else {
                        // If a single sentence is too long, split it by words
                        val words = sentence.split(" ")
                        var wordChunk = ""
                        for (word in words) {
                            if (wordChunk.length + word.length + 1 <= maxLength) {
                                wordChunk += if (wordChunk.isEmpty()) word else " $word"
                            } else {
                                if (wordChunk.isNotEmpty()) {
                                    chunks.add(wordChunk.trim())
                                    wordChunk = word
                                } else {
                                    // If a single word is too long, just add it
                                    chunks.add(word)
                                }
                            }
                        }
                        if (wordChunk.isNotEmpty()) {
                            currentChunk = wordChunk
                        }
                    }
                }
            }
            
            if (currentChunk.isNotEmpty()) {
                chunks.add(currentChunk.trim())
            }
            
            return chunks
        }
        
        private fun speakChunks(chunks: List<String>, index: Int) {
            if (index >= chunks.size || textToSpeech == null) {
                isSpeakingChunks = false
                return
            }

            // Set up the utterance listener only once for the entire sequence
            if (index == 0) {
                currentChunks = chunks
                currentChunkIndex = 0
                isSpeakingChunks = true

                textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        ttsStartCallbackReceived = true
                        Log.d(TAG, "TTS started chunk: $utteranceId")
                        if (!hasNotifiedTTSStart) {
                            hasNotifiedTTSStart = true
                            ttsAutoRecovering = false
                            notifyTTSPlaybackStarted(currentTTSRequestId)
                        }
                    }

                    override fun onDone(utteranceId: String?) {
                        runOnUiThread {
                            clearTTSWatchdog()
                            Log.d(TAG, "TTS done callback for: $utteranceId, current index: $currentChunkIndex, total chunks: ${currentChunks.size}")
                            if (utteranceId?.contains("_chunk_") == true && isSpeakingChunks) {
                                val completedIndex = utteranceId.substringAfterLast("_chunk_").toIntOrNull()
                                Log.d(TAG, "Completed chunk index: $completedIndex")

                                // Check if this is the last utterance in the queue
                                if (completedIndex != null) {
                                    // Move to the next chunk
                                    val nextIndex = completedIndex + 1
                                    if (nextIndex < currentChunks.size) {
                                        Log.d(TAG, "Preparing next chunk: $nextIndex")
                                        // Continue with next chunk immediately
                                        Handler(Looper.getMainLooper()).postDelayed({
                                            if (isSpeakingChunks) {
                                                currentChunkIndex = nextIndex
                                                speakNextChunk()
                                            }
                                        }, 50) // Minimal delay for smooth transitions
                                    } else {
                                        // All chunks completed
                                        Log.d(TAG, "All chunks completed")
                                        val completedRequestId = currentTTSRequestId
                                        notifyTTSPlaybackCompleted(completedRequestId)
                                        resetTTSPlaybackState(
                                            stopPlayback = false,
                                            shutdownEngine = false,
                                            clearPendingRequest = true,
                                            releaseAudioFocus = true
                                        )
                                    }
                                }
                            }
                        }
                    }

                    override fun onError(utteranceId: String?) {
                        runOnUiThread {
                            Log.e(TAG, "TTS engine error for chunk: $utteranceId — triggering full recovery")
                            // An engine error means the TTS service has likely died or entered a
                            // bad state. Reset everything and let the JS layer re-initialize on the
                            // next speak() call rather than trying to continue with more chunks
                            // (which would all fail too).
                            handleTTSEngineFailure("Android TTS engine error")
                        }
                    }
                })
            }

            val chunk = chunks[index]
            currentChunkIndex = index
            val params = Bundle()
            val requestId = currentTTSRequestId ?: pendingTTSRequestId ?: nextTTSRequestId()
            val utteranceId = "${requestId}_chunk_$index"
            params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)

            // Always use QUEUE_FLUSH to ensure clean playback
            val ttsResult = textToSpeech?.speak(chunk, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
            if (ttsResult == TextToSpeech.ERROR) {
                Log.e(TAG, "TTS speak() returned ERROR for chunk $index, initiating recovery")
                handleTTSEngineFailure("Android TTS failed to start playback")
                return
            }
            scheduleTTSWatchdog(index, chunk)
            Log.d(TAG, "TTS speaking chunk $index of ${chunks.size}: ${chunk.take(50)}...")
        }
        
        private fun speakNextChunk() {
            if (currentChunkIndex < currentChunks.size && isSpeakingChunks) {
                val chunk = currentChunks[currentChunkIndex]
                val params = Bundle()
                val requestId = currentTTSRequestId ?: pendingTTSRequestId ?: nextTTSRequestId()
                val utteranceId = "${requestId}_chunk_$currentChunkIndex"
                params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId)
                params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)

                // Use QUEUE_FLUSH for clean playback of each chunk
                val ttsResult = textToSpeech?.speak(chunk, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
                if (ttsResult == TextToSpeech.ERROR) {
                    Log.e(TAG, "TTS speak() returned ERROR for next chunk $currentChunkIndex, initiating recovery")
                    handleTTSEngineFailure("Android TTS failed during chunk playback")
                    return
                }
                scheduleTTSWatchdog(currentChunkIndex, chunk)
                Log.d(TAG, "TTS speaking next chunk $currentChunkIndex of ${currentChunks.size}: ${chunk.take(50)}...")
            }
        }

        @JavascriptInterface
        fun stop() {
            stopInternal("unspecified")
        }

        @JavascriptInterface
        fun stopWithReason(reason: String) {
            stopInternal(reason.ifBlank { "unspecified" })
        }

        private fun stopInternal(reason: String) {
            runOnUiThread {
                val stoppedRequestId = currentTTSRequestId ?: pendingTTSRequestId
                resetTTSPlaybackState(
                    stopPlayback = true,
                    shutdownEngine = false,
                    clearPendingRequest = true,
                    releaseAudioFocus = true
                )
                notifyTTSPlaybackCompleted(stoppedRequestId)

                Log.d(TAG, "TTS stopped (reason: $reason)")
            }
        }

        @JavascriptInterface
        fun isSpeaking(): Boolean {
            return (textToSpeech?.isSpeaking ?: false) || isSpeakingChunks
        }

        @JavascriptInterface
        fun isAvailable(): Boolean {
            return textToSpeech != null && isTTSInitialized
        }

        @JavascriptInterface
        fun setLanguage(languageCode: String) {
            runOnUiThread {
                textToSpeech?.let { tts ->
                    val locale = when (languageCode.lowercase()) {
                        "en" -> Locale.ENGLISH
                        "es" -> Locale.forLanguageTag("es")
                        "fr" -> Locale.FRENCH
                        "de" -> Locale.GERMAN
                        "it" -> Locale.ITALIAN
                        "pt" -> Locale.forLanguageTag("pt")
                        "zh" -> Locale.CHINESE
                        "ja" -> Locale.JAPANESE
                        "ko" -> Locale.KOREAN
                        else -> Locale.US
                    }
                    val result = tts.setLanguage(locale)
                    if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                        Log.w(TAG, "Language $languageCode not supported, using default")
                        tts.setLanguage(Locale.getDefault())
                    }
                }
            }
        }

        @JavascriptInterface
        fun setSpeechRate(rate: Float) {
            runOnUiThread {
                textToSpeech?.setSpeechRate(rate.coerceIn(0.1f, 3.0f))
            }
        }

        @JavascriptInterface
        fun setPitch(pitch: Float) {
            runOnUiThread {
                textToSpeech?.setPitch(pitch.coerceIn(0.1f, 2.0f))
            }
        }






        
        @JavascriptInterface
        fun isReady(): Boolean {
            return isTTSInitialized
        }

        @JavascriptInterface
        fun getAvailableVoices(): String {
            return try {
                if (textToSpeech == null || !isTTSInitialized) {
                    "[]"
                } else {
                    val voices = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        textToSpeech?.voices?.mapNotNull { voice ->
                            try {
                                // Extract gender and network info from the voice name
                                val voiceName = voice.name.lowercase()
                                val isMale = voiceName.contains("male") && !voiceName.contains("female")
                                val isFemale = voiceName.contains("female")
                                val isNetwork = voiceName.contains("network") || voice.isNetworkConnectionRequired

                                // Determine gender string
                                val gender = when {
                                    isMale -> "male"
                                    isFemale -> "female"
                                    else -> ""
                                }

                                // Create a JSON object for each voice with extracted metadata
                                """{"name":"${voice.name.replace("\"", "'")}","locale":"${voice.locale}","quality":"${if (voice.quality == android.speech.tts.Voice.QUALITY_VERY_HIGH) "Very High" else if (voice.quality == android.speech.tts.Voice.QUALITY_HIGH) "High" else if (voice.quality == android.speech.tts.Voice.QUALITY_NORMAL) "Normal" else "Low"}","isNetworkConnectionRequired":${isNetwork},"gender":"${gender}"}"""
                            } catch (e: Exception) {
                                Log.e(TAG, "Error processing voice: ${e.message}")
                                null
                            }
                        } ?: emptyList()
                    } else {
                        // For API levels below 21, we can't get detailed voice info
                        emptyList()
                    }

                    val jsonArray = voices.joinToString(",", "[", "]")
                    Log.d(TAG, "Available TTS voices: $jsonArray")
                    jsonArray
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error getting available voices: ${e.message}")
                "[]"
            }
        }

        @JavascriptInterface
        fun setVoice(voiceName: String): Boolean {
            return try {
                if (textToSpeech == null) {
                    Log.w(TAG, "TTS not initialized, cannot set voice")
                    false
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    if (!hasEffectivePremium()) {
                        Log.w(TAG, "Ignoring premium TTS voice selection for non-premium user")
                        syncCurrentTTSVoiceToAccessLevel()
                        false
                    } else {
                    val voices = textToSpeech?.voices
                    val selectedVoice = voices?.find { it.name == voiceName }

                    if (selectedVoice != null) {
                        textToSpeech?.voice = selectedVoice
                        preferredTTSVoiceName = voiceName
                        Log.d(TAG, "Voice set to: $voiceName")
                        true
                    } else {
                        Log.w(TAG, "Voice not found: $voiceName")
                        false
                    }
                    }
                } else {
                    Log.w(TAG, "Voice selection not supported on API level < 21")
                    false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error setting voice: ${e.message}")
                false
            }
        }

        @JavascriptInterface
        fun resetVoice(): Boolean {
            return try {
                if (textToSpeech == null) {
                    Log.w(TAG, "TTS not initialized, cannot reset voice")
                    false
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    preferredTTSVoiceName = null
                    val restoredVoice = defaultTTSVoice
                    if (restoredVoice != null) {
                        textToSpeech?.voice = restoredVoice
                        Log.d(TAG, "TTS voice reset to engine default: ${restoredVoice.name}")
                    } else {
                        textToSpeech?.setLanguage(Locale.US)
                        Log.d(TAG, "TTS voice reset by restoring default language")
                    }
                    true
                } else {
                    textToSpeech?.setLanguage(Locale.US)
                    preferredTTSVoiceName = null
                    true
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error resetting voice: ${e.message}")
                false
            }
        }
    }

    inner class PowerManagementInterface {
        @JavascriptInterface
        fun keepScreenOn(enabled: Boolean) {
            runOnUiThread {
                if (enabled) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    Log.d(TAG, "Keep screen on: enabled")
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                    Log.d(TAG, "Keep screen on: disabled")
                }
            }
        }

        @JavascriptInterface
        fun closeApp() {
            runOnUiThread {
                Log.d(TAG, "AndroidPower.closeApp requested from WebView")
                try {
                    finishAndRemoveTask()
                } catch (error: Exception) {
                    Log.e(TAG, "finishAndRemoveTask failed, falling back to finish", error)
                    finish()
                }
            }
        }
    }

    inner class HapticInterface {
        private fun performHaptic(type: String) {
            runOnUiThread {
                val webView: WebView = findViewById(R.id.webView)
                webView.isHapticFeedbackEnabled = true

                val feedbackConstant = when (type.lowercase(Locale.US)) {
                    "light" -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                            HapticFeedbackConstants.KEYBOARD_TAP
                        } else {
                            HapticFeedbackConstants.VIRTUAL_KEY
                        }
                    }
                    "selection", "option" -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                            HapticFeedbackConstants.SEGMENT_TICK
                        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                            HapticFeedbackConstants.KEYBOARD_TAP
                        } else {
                            HapticFeedbackConstants.VIRTUAL_KEY
                        }
                    }
                    "toggle-on", "toggle_on" -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                            HapticFeedbackConstants.TOGGLE_ON
                        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                            HapticFeedbackConstants.KEYBOARD_TAP
                        } else {
                            HapticFeedbackConstants.VIRTUAL_KEY
                        }
                    }
                    "toggle-off", "toggle_off" -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                            HapticFeedbackConstants.TOGGLE_OFF
                        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                            HapticFeedbackConstants.KEYBOARD_TAP
                        } else {
                            HapticFeedbackConstants.VIRTUAL_KEY
                        }
                    }
                    "confirm", "success" -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                            HapticFeedbackConstants.CONFIRM
                        } else {
                            HapticFeedbackConstants.VIRTUAL_KEY
                        }
                    }
                    "reject", "error", "warning" -> {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                            HapticFeedbackConstants.REJECT
                        } else {
                            HapticFeedbackConstants.LONG_PRESS
                        }
                    }
                    else -> HapticFeedbackConstants.VIRTUAL_KEY
                }

                webView.performHapticFeedback(feedbackConstant)
            }
        }

        @JavascriptInterface
        fun triggerHapticFeedback() {
            performHaptic("button")
        }
        
        @JavascriptInterface
        fun triggerLightHaptic() {
            performHaptic("light")
        }

        @JavascriptInterface
        fun perform(type: String) {
            performHaptic(type)
        }
    }
    inner class BiometricInterface {
        @JavascriptInterface
        fun isBiometricSupported(): Boolean {
            val biometricManager = BiometricManager.from(this@WebViewActivity)
            // We want to support at least Strong Biometrics or Device Credentials
            val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG or
                                BiometricManager.Authenticators.DEVICE_CREDENTIAL
            return biometricManager.canAuthenticate(authenticators) == BiometricManager.BIOMETRIC_SUCCESS
        }

        @JavascriptInterface
        fun authenticate(title: String? = null, subtitle: String? = null) {
            runOnUiThread {
                biometricPromptShowing = true
                val executor: Executor = ContextCompat.getMainExecutor(this@WebViewActivity)
                val biometricPrompt = BiometricPrompt(this@WebViewActivity, executor,
                    object : BiometricPrompt.AuthenticationCallback() {
                        override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                            super.onAuthenticationError(errorCode, errString)
                            biometricPromptShowing = false
                            Log.e(TAG, "Biometric auth error: $errString")
                            // You might want to notify JS here, depending on needs. Let's send a failure call
                            val webView: WebView = findViewById(R.id.webView)
                            webView.evaluateJavascript("if(window.onBiometricFailure) window.onBiometricFailure('$errString');", null)
                        }

                        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                            super.onAuthenticationSucceeded(result)
                            biometricPromptShowing = false
                            Log.d(TAG, "Biometric auth succeeded")
                            val webView: WebView = findViewById(R.id.webView)
                            webView.evaluateJavascript("if(window.onBiometricSuccess) window.onBiometricSuccess();", null)
                        }

                        override fun onAuthenticationFailed() {
                            super.onAuthenticationFailed()
                            Log.w(TAG, "Biometric auth failed")
                        }
                    })

                val promptInfo = BiometricPrompt.PromptInfo.Builder()
                    .setTitle(title ?: "App Locked")
                    .setSubtitle(subtitle ?: "Authenticate to access LMSA")
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL)
                    .build()

                biometricPrompt.authenticate(promptInfo)
            }
        }
    }

    inner class NetworkInterface {
        @JavascriptInterface
        fun isInternetAvailable(): Boolean {
            return isNetworkAvailable()
        }

        @JavascriptInterface
        fun isInternetReachable(): Boolean {
            return isInternetReachableForOfflineGate()
        }

        @JavascriptInterface
        fun probeInternetAvailability() {
            Thread {
                val hasInternet = isInternetReachableForOfflineGate()
                dispatchOfflineGateInternetProbeResult(hasInternet)
            }.start()
        }

        @JavascriptInterface
        fun dismissStartupSplash() {
            runOnUiThread {
                hideSplash()
            }
        }

        @JavascriptInterface
        fun fetch(url: String): String? {
            if (!isNetworkAvailable()) {
                Log.d(TAG, "NetworkInterface skipped because network is unavailable")
                return null
            }

            return try {
                val connection = java.net.URL(url).openConnection() as java.net.HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 3000
                connection.readTimeout = 3000
                connection.setRequestProperty("Accept", "application/json")
                connection.setRequestProperty("User-Agent", "LMSA-Android-App")

                val responseCode = connection.responseCode
                if (responseCode == java.net.HttpURLConnection.HTTP_OK) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    Log.e(TAG, "NetworkInterface error: HTTP $responseCode")
                    null
                }
            } catch (e: Exception) {
                Log.e(TAG, "NetworkInterface exception: ${e.message}")
                null
            }
        }
    }
}
