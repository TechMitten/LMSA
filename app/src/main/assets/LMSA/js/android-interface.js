function removeAds() {
    if (window.AndroidBilling && typeof window.AndroidBilling.purchaseAdRemoval === 'function') {
        window.AndroidBilling.purchaseAdRemoval();
    } else {
        console.log('Billing interface not available or incorrect function name.');
    }
}

function restorePurchases() {
    // Check if the AndroidBilling interface is available
    if (window.AndroidBilling && typeof window.AndroidBilling.restorePurchases === 'function') {
        console.log('Calling AndroidBilling.restorePurchases()');
        window.AndroidBilling.restorePurchases();
        // You can optionally show a message to the user, like an alert.
        alert('Attempting to restore purchases. If you have a valid purchase, your premium status will be updated shortly.');
    } else {
        console.log('Billing interface not available. This is not an Android app environment.');
        alert('This feature is only available in the Android app.');
    }
}

// Updated UI function to manage premium status
function updateUiForPremium(isPremium) {
    console.log('Premium status updated:', isPremium);
    const removeAdsBtn = document.getElementById('remove-ads-button');
    if (removeAdsBtn) {
        removeAdsBtn.style.display = isPremium ? 'none' : 'block';
    }

    // Hide the Remove Ads banner for premium users
    const removeAdsBanner = document.getElementById('remove-ads-banner');
    if (removeAdsBanner) {
        removeAdsBanner.style.display = isPremium ? 'none' : 'flex';
    }

    // Manage Native Ad placeholder
    const nativeAdPlaceholder = document.getElementById('native-ad-placeholder');
    if (nativeAdPlaceholder) {
        nativeAdPlaceholder.style.display = isPremium ? 'none' : 'block';
    }
    
    // Manage Native Ad divider
    const nativeAdDivider = document.getElementById('native-ad-divider');
    if (nativeAdDivider) {
        nativeAdDivider.style.display = isPremium ? 'none' : 'block';
    }
}

/**
 * Shows interstitial ad and executes callback when dismissed
 * @param {string} action - The action to perform after ad (e.g., 'newChat')
 * @param {Function} callback - Function to call after ad is dismissed
 */
function showInterstitialAd(action, callback) {
    // Globably stop any playing TTS audio before showing a fullscreen ad
    if (window.TTSService && typeof window.TTSService.stop === 'function') {
        window.TTSService.stop('before-interstitial-ad', true);
    }

    // We no longer show interstitial ads, just execute callback
    console.log('Ad interface requested interstitial, but they are removed. Proceeding directly.');
    if (callback) callback();
}

/**
 * Preloads interstitial ad for faster display
 */
function preloadInterstitialAd() {
    // No-op since interstitial ads are removed
}

/**
 * Callback function called by Android after ad is dismissed
 */
function createNewChatAfterAd() {
    if (window._pendingAdCallback) {
        window._pendingAdCallback();
        window._pendingAdCallback = null;
    }
}

/**
 * Checks if user should see ads (non-premium)
 * @returns {boolean} - True if ads should be shown
 */
function shouldShowAds() {
    // First check: Premium users never see ads
    if (window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function') {
        if (window.AndroidBilling.checkPremiumStatus()) {
            return false; // Premium user, no ads
        }
    }

    // All checks passed - show ads
    return true;
}

/**
 * Checks if a model is currently loaded
 * @returns {boolean} - True if a model is loaded
 */
function isModelLoadedForAds() {
    // Check the global currentLoadedModel variable (set by api-service.js)
    return window.currentLoadedModel && window.currentLoadedModel !== null;
}

/**
 * Keeps the screen on or allows it to turn off
 * @param {boolean} enabled - True to keep screen on, false to allow it to turn off
 */
function keepScreenOn(enabled) {
    if (window.AndroidPower && typeof window.AndroidPower.keepScreenOn === 'function') {
        window.AndroidPower.keepScreenOn(enabled);
    }
}