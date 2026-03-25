import java.io.File

tasks.register("modifyActivity") {
    doLast {
        val file = File("src/main/java/com/lmsa/app/WebViewActivity.kt")
        var content = file.readText()

        // 1. Imports
        val imports = """
import com.google.android.gms.ads.nativead.NativeAd
import com.google.android.gms.ads.nativead.NativeAdOptions
import com.google.android.gms.ads.AdLoader
import com.google.android.gms.ads.nativead.NativeAdView
import android.widget.ImageView
import android.widget.TextView
        """.trimIndent()
        if (!content.contains("import com.google.android.gms.ads.nativead.NativeAd")) {
            content = content.replace("import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback", 
                "import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback\n" + imports)
        }

        // 2. Remove interstitial variables and add native ad variables
        val nativeVars = """
    private var nativeAd: NativeAd? = null
    private val NATIVE_AD_UNIT_ID = "ca-app-pub-1388425042154340/5848689323"
        """.trimIndent()
        content = content.replace("private var mInterstitialAd: InterstitialAd? = null", nativeVars)
        content = content.replace("private var isInterstitialAdLoading = false\n", "")
        content = content.replace("private var isInterstitialAdShowing = false\n", "")
        content = content.replace("private val INTERSTITIAL_AD_UNIT_ID = \"ca-app-pub-1388425042154340/3976255369\"\n", "")

        // 3. Remove loadInterstitialAd and showInterstitialAd
        val regexLoadShow = Regex("private fun loadInterstitialAd\\(.*?\\}.*?private fun showInterstitialAd\\(.*?\\}", RegexOption.DOT_MATCHES_ALL)
        
        val nativeAdMethods = """
    private fun loadNativeAd() {
        val effectivePremium = isPremium && !isDebugMode
        if (effectivePremium) return

        val adLoader = AdLoader.Builder(this, NATIVE_AD_UNIT_ID)
            .forNativeAd { ad : NativeAd ->
                if (isDestroyed) {
                    ad.destroy()
                    return@forNativeAd
                }
                nativeAd?.destroy()
                nativeAd = ad
                populateNativeAdView(ad)
            }
            .withAdListener(object : com.google.android.gms.ads.AdListener() {
                override fun onAdFailedToLoad(adError: LoadAdError) {
                    Log.e(TAG, "Native ad failed to load: ${"$"}{adError.message}")
                }
            })
            .withNativeAdOptions(NativeAdOptions.Builder().build())
            .build()

        adLoader.loadAd(AdRequest.Builder().build())
    }

    private fun populateNativeAdView(nativeAd: NativeAd) {
        val adView = layoutInflater.inflate(R.layout.native_ad_layout, null) as NativeAdView
        
        val headlineView = adView.findViewById<TextView>(R.id.ad_headline)
        val bodyView = adView.findViewById<TextView>(R.id.ad_body)
        val iconView = adView.findViewById<ImageView>(R.id.ad_app_icon)
        val ctaView = adView.findViewById<Button>(R.id.ad_call_to_action)

        headlineView.text = nativeAd.headline
        adView.headlineView = headlineView

        if (nativeAd.body == null) {
            bodyView.visibility = View.INVISIBLE
        } else {
            bodyView.visibility = View.VISIBLE
            bodyView.text = nativeAd.body
        }
        adView.bodyView = bodyView

        if (nativeAd.icon == null) {
            iconView.visibility = View.GONE
        } else {
            iconView.setImageDrawable(nativeAd.icon?.drawable)
            iconView.visibility = View.VISIBLE
        }
        adView.iconView = iconView

        if (nativeAd.callToAction == null) {
            ctaView.visibility = View.INVISIBLE
        } else {
            ctaView.visibility = View.VISIBLE
            ctaView.text = nativeAd.callToAction
        }
        adView.callToActionView = ctaView

        adView.setNativeAd(nativeAd)

        val adContainer = findViewById<FrameLayout>(R.id.nativeAdContainer)
        adContainer.removeAllViews()
        adContainer.addView(adView)
    }
        """.trimIndent()
        
        content = content.replace(regexLoadShow, nativeAdMethods)

        // 4. Update the javascript interface
        val regexInterface = Regex("@JavascriptInterface\\s+fun showInterstitialAdAndExecute\\(.*?\\}.*?@JavascriptInterface\\s+fun preloadInterstitialAd\\(\\).*?\\}", RegexOption.DOT_MATCHES_ALL)
        
        val nativeJsInterface = """
        @JavascriptInterface
        fun updateNativeAdPosition(left: Int, top: Int, width: Int, height: Int) {
            runOnUiThread {
                val effectivePremium = isPremium && !isDebugMode
                if (effectivePremium) {
                    hideNativeAd()
                    return@runOnUiThread
                }
                
                if (nativeAd == null) {
                    loadNativeAd()
                }

                val adContainer = findViewById<FrameLayout>(R.id.nativeAdContainer)
                adContainer.visibility = View.VISIBLE
                
                val layoutParams = adContainer.layoutParams as androidx.constraintlayout.widget.ConstraintLayout.LayoutParams
                layoutParams.width = width
                layoutParams.height = height
                layoutParams.leftMargin = left
                layoutParams.topMargin = top
                adContainer.layoutParams = layoutParams
            }
        }

        @JavascriptInterface
        fun hideNativeAd() {
            runOnUiThread {
                val adContainer = findViewById<FrameLayout>(R.id.nativeAdContainer)
                adContainer.visibility = View.GONE
            }
        }
        """.trimIndent()
        
        content = content.replace(regexInterface, nativeJsInterface)

        // 5. Remove remaining mInterstitialAd?. references in onDestroy
        content = content.replace("mInterstitialAd?.fullScreenContentCallback = null\n", "")
        content = content.replace("mInterstitialAd = null\n", "")
        if (!content.contains("nativeAd?.destroy()")) {
            content = content.replace("super.onDestroy()", "nativeAd?.destroy()\n        super.onDestroy()")
        }

        file.writeText(content)
        println("File updated successfully")
    }
}
