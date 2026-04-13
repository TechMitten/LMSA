plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

kotlin {
    jvmToolchain(17)
}

android {
    namespace = "com.lmsa.app"
    // Set to 36 to satisfy the androidx.core:core-ktx:1.17.0 requirement
    compileSdk = 36

    defaultConfig {
        applicationId = "com.lmsa.app"
        // Keep this at 23 so your app still runs on older Android versions
        minSdk = 23
        // Target 36 to stay current with Play Store 2026 requirements
        targetSdk = 36
        versionCode = 276
        versionName = "10.11"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "**/LMSA/.git/**"
            excludes += "**/.vscode/**"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("com.google.android.play:review:2.0.2")
    implementation("com.google.android.play:review-ktx:2.0.2")

    // Ad and Billing dependencies
    implementation("com.google.android.gms:play-services-ads:23.6.0")
    implementation("com.android.billingclient:billing-ktx:7.0.0")
    implementation("androidx.biometric:biometric:1.1.0")

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}

// Disable specific bundle listing tasks as per your original config
tasks.matching { it.name == "produceReleaseBundleIdeListingFile" }.configureEach { enabled = false }
tasks.matching { it.name == "createReleaseBundleListingFileRedirect" }.configureEach { enabled = false }

// Custom task for modifying your WebView assets
tasks.register("modifyHtmlAndJs") {
    doLast {
        val htmlFile = file("src/main/assets/LMSA/index.html")
        if (htmlFile.exists()) {
            var htmlContent = htmlFile.readText()
            val htmlRegex = Regex("""(<div id="remove-ads-banner" class="w-full">.*?</div>)\s*<div id="native-ad-placeholder" class="w-full mt-6 rounded-xl border border-white/5" style="height: 120px; display: none;"></div>""", RegexOption.DOT_MATCHES_ALL)
            val htmlNew = """$1
                                
                                <div id="native-ad-divider" class="w-[85%] mx-auto h-px bg-gradient-to-r from-transparent via-gray-400/30 to-transparent mt-8 mb-8" style="display: none;"></div>
                                
                                <div id="native-ad-placeholder" class="w-full rounded-xl border border-white/5" style="height: 120px; display: none;"></div>"""

            if (htmlRegex.containsMatchIn(htmlContent)) {
                htmlFile.writeText(htmlContent.replace(htmlRegex, htmlNew))
                println("index.html updated successfully")
            }
        }

        val jsFile = file("src/main/assets/LMSA/js/android-interface.js")
        if (jsFile.exists()) {
            var jsContent = jsFile.readText()
            val jsRegex = Regex("""(    // Manage Native Ad placeholder\s+const nativeAdPlaceholder = document\.getElementById\('native-ad-placeholder'\);\s+if \(nativeAdPlaceholder\) \{\s+nativeAdPlaceholder\.style\.display = isPremium \? 'none' : 'block';\s+\})""")
            val jsNew = """$1
    
    // Manage Native Ad divider
    const nativeAdDivider = document.getElementById('native-ad-divider');
    if (nativeAdDivider) {
        nativeAdDivider.style.display = isPremium ? 'none' : 'block';
    }"""

            if (jsRegex.containsMatchIn(jsContent)) {
                jsFile.writeText(jsContent.replace(jsRegex, jsNew))
                println("android-interface.js updated successfully")
            }
        }
    }
}