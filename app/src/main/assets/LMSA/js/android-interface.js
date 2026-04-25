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

let restorePurchasesPending = false;

function restorePurchases() {
    if (window.AndroidBilling && typeof window.AndroidBilling.restorePurchases === 'function') {
        if (restorePurchasesPending) {
            return;
        }

        restorePurchasesPending = true;
        console.log('Calling AndroidBilling.restorePurchases()');
        window.AndroidBilling.restorePurchases();
    } else {
        console.log('Billing interface not available. This is not an Android app environment.');
        alert('This feature is only available in the Android app.');
    }
}

window.onRestorePurchasesResult = function (success, message) {
    restorePurchasesPending = false;
    console.log('onRestorePurchasesResult called: success=' + success + ', message=' + message);

    if (typeof message === 'string' && message.trim().length > 0) {
        alert(message);
        return;
    }

    if (success) {
        alert('Purchase restored successfully. Premium is now active.');
    } else {
        alert('No previous purchase was found for this account.');
    }
};

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
    const isDebugEnabled = !!window.isDebugMode || !!(window.AndroidBilling && typeof window.AndroidBilling.checkDebugMode === 'function' && window.AndroidBilling.checkDebugMode());
    if (knownState.updatedAt > 0) {
        return knownState.isPremium && !isDebugEnabled;
    }

    if (window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function') {
        return !!window.AndroidBilling.checkPremiumStatus() && !isDebugEnabled;
    }

    return false;
}

window.hasPremiumAccess = hasPremiumAccess;

// Updated UI function to manage premium status
function updateUiForPremium(isPremium) {
    const premiumState = setPremiumState(isPremium);
    const isDebugEnabled = !!window.isDebugMode || !!(window.AndroidBilling && typeof window.AndroidBilling.checkDebugMode === 'function' && window.AndroidBilling.checkDebugMode());
    isPremium = premiumState.isPremium && !isDebugEnabled;
    console.log('Premium status updated:', isPremium, '(debug:', isDebugEnabled, ')');
    const removeAdsBtn = document.getElementById('remove-ads-button');
    if (removeAdsBtn) {
        removeAdsBtn.style.display = isPremium ? 'none' : 'block';
    }

    const premiumActivatedBtn = document.getElementById('premium-activated-button');
    if (premiumActivatedBtn) {
        premiumActivatedBtn.style.display = isPremium ? 'block' : 'none';
    }

    const restorePurchasesBtn = document.getElementById('restore-purchases-button');
    if (restorePurchasesBtn) {
        restorePurchasesBtn.style.display = isPremium ? 'none' : 'block';
    }

    const legacyAccessBtn = document.getElementById('legacy-access-btn');
    if (legacyAccessBtn) {
        legacyAccessBtn.style.display = isPremium ? 'none' : 'block';
    }

    // Keep the welcome premium banner visible, but switch to activated state for premium users.
    const removeAdsBanner = document.getElementById('remove-ads-banner');
    if (removeAdsBanner) {
        removeAdsBanner.style.display = 'flex';
    }

    const removeAdsBannerButton = document.getElementById('remove-ads-banner-button');
    if (removeAdsBannerButton) {
        removeAdsBannerButton.classList.toggle('premium-activated', isPremium);
        removeAdsBannerButton.disabled = isPremium;
        removeAdsBannerButton.setAttribute('aria-label', isPremium ? 'Premium Activated' : 'Unlock Premium');
        removeAdsBannerButton.setAttribute('aria-disabled', isPremium ? 'true' : 'false');
        removeAdsBannerButton.tabIndex = isPremium ? -1 : 0;

        const buttonLabel = removeAdsBannerButton.querySelector('span');
        if (buttonLabel) {
            buttonLabel.textContent = isPremium ? 'Premium Activated' : 'Unlock Premium';
        }

        const buttonIcon = removeAdsBannerButton.querySelector('i');
        if (buttonIcon) {
            buttonIcon.classList.toggle('fa-crown', !isPremium);
            buttonIcon.classList.toggle('fa-check-circle', isPremium);
            buttonIcon.style.color = isPremium ? '#34d399' : '#fbbf24';
        }
    }
}

window.showPostAppOpenPremiumCta = function() { console.log('Post-ad CTA disabled.'); };
window.hidePostAppOpenPremiumCta = function() { };



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
