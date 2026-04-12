function removeAds() {
    if (window.AndroidBilling && typeof window.AndroidBilling.purchaseAdRemoval === 'function') {
        window.AndroidBilling.purchaseAdRemoval();
    } else {
        console.log('Billing interface not available or incorrect function name.');
    }
}

function watchRewardedPremiumAd() {
    if (window.AndroidBilling && typeof window.AndroidBilling.showRewardedPremiumAd === 'function') {
        window.AndroidBilling.showRewardedPremiumAd();
    } else {
        console.log('Rewarded ad interface not available.');
        alert('Rewarded ads are only available in the Android app.');
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
function formatRewardedPremiumRemaining(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function stopRewardedPremiumCountdown() {
    if (window._rewardedPremiumCountdownInterval) {
        clearInterval(window._rewardedPremiumCountdownInterval);
        window._rewardedPremiumCountdownInterval = null;
    }
}

function updateUiForPremium(isPremium, hasRewardedPremium = false, rewardedPremiumRemainingMs = 0) {
    console.log('Premium status updated:', isPremium);
    const removeAdsBtn = document.getElementById('remove-ads-button');
    if (removeAdsBtn) {
        removeAdsBtn.style.display = isPremium && !hasRewardedPremium ? 'none' : 'block';
    }

    // Hide the Remove Ads banner for premium users
    const removeAdsBanner = document.getElementById('remove-ads-banner');
    if (removeAdsBanner) {
        removeAdsBanner.style.display = isPremium ? 'none' : 'flex';
    }

    const rewardedPremiumButton = document.getElementById('rewarded-premium-button');
    if (rewardedPremiumButton) {
        rewardedPremiumButton.style.display = isPremium ? 'none' : 'block';
    }

    const rewardedPremiumStatus = document.getElementById('rewarded-premium-status');
    const rewardedPremiumStatusText = document.getElementById('rewarded-premium-status-text');
    stopRewardedPremiumCountdown();

    if (rewardedPremiumStatus && rewardedPremiumStatusText) {
        if (hasRewardedPremium && rewardedPremiumRemainingMs > 0) {
            const rewardEndsAt = Date.now() + rewardedPremiumRemainingMs;
            rewardedPremiumStatus.classList.remove('hidden');

            const renderRemaining = () => {
                const remainingMs = rewardEndsAt - Date.now();
                if (remainingMs <= 0) {
                    rewardedPremiumStatus.classList.add('hidden');
                    if (rewardedPremiumButton) {
                        rewardedPremiumButton.style.display = 'block';
                    }
                    stopRewardedPremiumCountdown();
                    return;
                }

                rewardedPremiumStatusText.textContent = `Premium active: ${formatRewardedPremiumRemaining(remainingMs)} left`;
            };

            renderRemaining();
            window._rewardedPremiumCountdownInterval = setInterval(renderRemaining, 1000);
        } else {
            rewardedPremiumStatus.classList.add('hidden');
        }
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

/**
 * Triggers device haptic feedback
 * @param {string|boolean} type - Semantic haptic type or legacy boolean light flag
 */
function triggerHapticFeedback(type = 'light') {
    if (!window.AndroidHaptics) {
        return;
    }

    if (typeof type === 'boolean') {
        type = type ? 'light' : 'button';
    }

    if (typeof window.AndroidHaptics.perform === 'function') {
        window.AndroidHaptics.perform(type);
        return;
    }

    if (type === 'light' && typeof window.AndroidHaptics.triggerLightHaptic === 'function') {
        window.AndroidHaptics.triggerLightHaptic();
        return;
    }

    if (typeof window.AndroidHaptics.triggerHapticFeedback === 'function') {
        window.AndroidHaptics.triggerHapticFeedback();
    }
}
