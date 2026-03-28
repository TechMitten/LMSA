plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

kotlin {
    jvmToolchain(17)
}

android {
    namespace = "com.lmsa.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.lmsa.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 256
        versionName = "10.5"

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
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    implementation("com.google.android.gms:play-services-ads:23.6.0")
    implementation("com.android.billingclient:billing-ktx:7.0.0")
}

tasks.matching { it.name == "produceReleaseBundleIdeListingFile" }.configureEach { enabled = false }
tasks.matching { it.name == "createReleaseBundleListingFileRedirect" }.configureEach { enabled = false }

tasks.register("modifyHtmlAndJs") {
    doLast {
        val htmlFile = file("src/main/assets/LMSA/index.html")
        var htmlContent = htmlFile.readText()
        
        val htmlRegex = Regex("""(<div id="remove-ads-banner" class="w-full">.*?</div>)\s*<div id="native-ad-placeholder" class="w-full mt-6 rounded-xl border border-white/5" style="height: 120px; display: none;"></div>""", RegexOption.DOT_MATCHES_ALL)
        
        val htmlNew = """$1
                                
                                <!-- Elegant Divider -->
                                <div id="native-ad-divider" class="w-[85%] mx-auto h-px bg-gradient-to-r from-transparent via-gray-400/30 to-transparent mt-8 mb-8" style="display: none;"></div>
                                
                                <div id="native-ad-placeholder" class="w-full rounded-xl border border-white/5" style="height: 120px; display: none;"></div>"""
        
        if (htmlRegex.containsMatchIn(htmlContent)) {
            htmlContent = htmlContent.replace(htmlRegex, htmlNew)
            htmlFile.writeText(htmlContent)
            println("index.html updated successfully")
        } else {
            println("Target string not found in index.html")
        }
        
        val jsFile = file("src/main/assets/LMSA/js/android-interface.js")
        var jsContent = jsFile.readText()
        
        val jsRegex = Regex("""(    // Manage Native Ad placeholder\s+const nativeAdPlaceholder = document\.getElementById\('native-ad-placeholder'\);\s+if \(nativeAdPlaceholder\) \{\s+nativeAdPlaceholder\.style\.display = isPremium \? 'none' : 'block';\s+\})""")
        
        val jsNew = """$1
    
    // Manage Native Ad divider
    const nativeAdDivider = document.getElementById('native-ad-divider');
    if (nativeAdDivider) {
        nativeAdDivider.style.display = isPremium ? 'none' : 'block';
    }"""
        
        if (jsRegex.containsMatchIn(jsContent)) {
            jsContent = jsContent.replace(jsRegex, jsNew)
            jsFile.writeText(jsContent)
            println("android-interface.js updated successfully")
        } else {
            println("Target string not found in android-interface.js")
        }
    }
}