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
        versionCode = 306
        versionName = "10.15"

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
    implementation("androidx.browser:browser:1.8.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.1")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("com.google.android.play:review:2.0.2")
    implementation("com.google.android.play:review-ktx:2.0.2")

    // Billing dependencies
    implementation("com.android.billingclient:billing-ktx:7.0.0")
    implementation("androidx.biometric:biometric:1.1.0")

    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}

// Disable specific bundle listing tasks as per your original config
tasks.matching { it.name == "produceReleaseBundleIdeListingFile" }.configureEach { enabled = false }
tasks.matching { it.name == "createReleaseBundleListingFileRedirect" }.configureEach { enabled = false }