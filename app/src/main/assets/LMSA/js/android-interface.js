function removeAds() {
    if (window.AndroidBilling && typeof window.AndroidBilling.purchaseAdRemoval === 'function') {
        window.AndroidBilling.purchaseAdRemoval();
    } else {
        console.log('Billing interface not available or incorrect function name.');
    }
}

function watchRewardedPremiumAd() {
    console.log('Rewarded ads have been removed.');
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

function getPremiumStateSnapshot() {
    return window.LMSAPremiumState || {
        isPremium: false,
        updatedAt: 0
    };
}

function setPremiumState(isPremium) {
    const nextState = {
        isPremium: !!isPremium,
        updatedAt: Date.now()
    };

    const previousState = getPremiumStateSnapshot();
    const changed = previousState.isPremium !== nextState.isPremium;

    window.LMSAPremiumState = nextState;

    if (changed) {
        document.dispatchEvent(new CustomEvent('premium-status-changed', {
            detail: nextState
        }));
    }

    return nextState;
}

function hasPremiumAccess() {
    const knownState = getPremiumStateSnapshot();
    if (knownState.updatedAt > 0) {
        return knownState.isPremium;
    }

    if (window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function') {
        return !!window.AndroidBilling.checkPremiumStatus();
    }

    return false;
}

window.hasPremiumAccess = hasPremiumAccess;

// Updated UI function to manage premium status
function updateUiForPremium(isPremium) {
    const premiumState = setPremiumState(isPremium);
    isPremium = premiumState.isPremium;
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
}

let postAppOpenPremiumCtaTimeout = null;

function ensurePostAppOpenPremiumCta() {
    let banner = document.getElementById('post-app-open-premium-cta');
    if (banner) {
        return banner;
    }

    banner = document.createElement('div');
    banner.id = 'post-app-open-premium-cta';
    banner.style.cssText = [
        'position: fixed',
        'left: 16px',
        'right: 16px',
        'bottom: 20px',
        'z-index: 10000',
        'display: none',
        'align-items: center',
        'justify-content: space-between',
        'gap: 12px',
        'padding: 14px 16px',
        'border-radius: 16px',
        'background: rgba(9, 16, 28, 0.94)',
        'border: 1px solid rgba(59, 130, 246, 0.28)',
        'box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35)',
        'backdrop-filter: blur(10px)',
        '-webkit-backdrop-filter: blur(10px)'
    ].join(';');

    const copy = document.createElement('div');
    copy.style.cssText = 'min-width: 0; display: flex; flex-direction: column; gap: 2px; text-align: left;';

    const title = document.createElement('div');
    title.textContent = 'Upgrade to Premium';
    title.style.cssText = 'color: #f8fafc; font-size: 13px; font-weight: 700; letter-spacing: 0.01em;';

    const subtitle = document.createElement('div');
    subtitle.textContent = 'Remove ads and unlock premium features.';
    subtitle.style.cssText = 'color: rgba(226, 232, 240, 0.82); font-size: 12px; line-height: 1.35;';

    const action = document.createElement('button');
    action.type = 'button';
    action.textContent = 'Go Premium';
    action.style.cssText = [
        'flex: 0 0 auto',
        'border: 0',
        'border-radius: 999px',
        'padding: 10px 14px',
        'background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
        'color: #111827',
        'font-size: 12px',
        'font-weight: 800',
        'letter-spacing: 0.02em'
    ].join(';');

    action.addEventListener('click', () => {
        hidePostAppOpenPremiumCta();
        if (typeof window.openPremiumModal === 'function') {
            window.openPremiumModal();
            return;
        }
        if (typeof window.removeAds === 'function') {
            window.removeAds();
        }
    });

    copy.appendChild(title);
    copy.appendChild(subtitle);
    banner.appendChild(copy);
    banner.appendChild(action);
    document.body.appendChild(banner);

    return banner;
}

function hidePostAppOpenPremiumCta() {
    const banner = document.getElementById('post-app-open-premium-cta');
    if (!banner) {
        return;
    }
    banner.style.display = 'none';
    if (postAppOpenPremiumCtaTimeout) {
        clearTimeout(postAppOpenPremiumCtaTimeout);
        postAppOpenPremiumCtaTimeout = null;
    }
}

function showPostAppOpenPremiumCta() {
    if (hasPremiumAccess()) {
        return;
    }

    const banner = ensurePostAppOpenPremiumCta();
    banner.style.display = 'flex';

    if (postAppOpenPremiumCtaTimeout) {
        clearTimeout(postAppOpenPremiumCtaTimeout);
    }

    postAppOpenPremiumCtaTimeout = setTimeout(() => {
        hidePostAppOpenPremiumCta();
    }, 5000);
}

window.showPostAppOpenPremiumCta = showPostAppOpenPremiumCta;
window.hidePostAppOpenPremiumCta = hidePostAppOpenPremiumCta;

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
    if (hasPremiumAccess()) {
        return false; // Premium user, no ads
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

/**
 * Performs a network fetch via the Android native bridge (bypasses CORS).
 * @param {string} url - The URL to fetch.
 * @returns {Promise<string|null>} - The response text or null if it failed.
 */
async function nativeFetch(url) {
    if (window.AndroidNetwork && typeof window.AndroidNetwork.fetch === 'function') {
        try {
            console.log('Using native bridge for fetch:', url);
            return window.AndroidNetwork.fetch(url);
        } catch (error) {
            console.error('Native fetch failed:', error);
            return null;
        }
    }
    return null;
}

window.nativeFetch = nativeFetch;
