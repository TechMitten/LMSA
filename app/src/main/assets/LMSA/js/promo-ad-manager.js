import { showPromoAdModal } from './components/modals/promo-ad-modal.js';

// Constants
const MIN_DAYS_BETWEEN_SHOWS = 7;
const MAX_DISMISSALS_BEFORE_STOP = 3;
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

// localStorage keys
const PROMO_LAST_SHOWN = 'promoAdLastShown';
const PROMO_DISMISS_COUNT = 'promoAdDismissCount';
const PROMO_LAST_DISMISSED = 'promoAdLastDismissed';

/**
 * Check if the user should see the promo ad
 * @returns {boolean} - True if the ad should be shown
 */
export function shouldShowPromoAd() {
    // Check 1: Premium users never see the ad
    if (window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function') {
        try {
            if (window.AndroidBilling.checkPremiumStatus()) {
                console.log('Promo ad: User is premium, not showing');
                return false;
            }
        } catch (e) {
            console.error('Error checking premium status:', e);
            // Continue with other checks if this fails
        }
    }

    // Check 3: Check if user has dismissed 3+ times
    const dismissCount = getDismissCount();
    if (dismissCount >= MAX_DISMISSALS_BEFORE_STOP) {
        console.log('Promo ad: User has dismissed 3+ times, not showing');
        return false;
    }

    // Check 4: Check if enough time has passed since last shown
    const lastShown = getLastShownTimestamp();
    if (lastShown) {
        const daysSinceLastShown = (Date.now() - lastShown) / MILLISECONDS_IN_DAY;
        if (daysSinceLastShown < MIN_DAYS_BETWEEN_SHOWS) {
            console.log(`Promo ad: Only ${daysSinceLastShown.toFixed(1)} days since last shown, not showing`);
            return false;
        }
    }

    // All checks passed
    console.log('Promo ad: All checks passed, ad should be shown');
    return true;
}

/**
 * Check if promo ad should be shown and show it if appropriate
 */
export function checkAndShowPromoAd() {
    if (shouldShowPromoAd()) {
        console.log('Promo ad: Showing promo ad modal');
        markPromoAdShown();
        showPromoAdModal();
    } else {
        console.log('Promo ad: Conditions not met, not showing');
    }
}

/**
 * Force show the promo ad (bypasses all checks)
 * Used for debugging/testing
 */
export function forceShowPromoAd() {
    console.log('Promo ad: Force showing promo ad (debug mode)');
    showPromoAdModal();
}

/**
 * Mark that the promo ad has been shown
 */
export function markPromoAdShown() {
    localStorage.setItem(PROMO_LAST_SHOWN, Date.now().toString());
    console.log('Promo ad: Marked as shown');
}

/**
 * Mark that the promo ad has been dismissed
 */
export function markPromoAdDismissed() {
    const currentCount = getDismissCount();
    const newCount = currentCount + 1;
    localStorage.setItem(PROMO_DISMISS_COUNT, newCount.toString());
    localStorage.setItem(PROMO_LAST_DISMISSED, Date.now().toString());
    console.log(`Promo ad: Marked as dismissed (count: ${newCount})`);
}

/**
 * Get the timestamp when the promo ad was last shown
 * @returns {number|null} - Timestamp in milliseconds, or null if never shown
 */
function getLastShownTimestamp() {
    const lastShown = localStorage.getItem(PROMO_LAST_SHOWN);
    return lastShown ? parseInt(lastShown, 10) : null;
}

/**
 * Get the number of times the promo ad has been dismissed
 * @returns {number} - Dismissal count
 */
function getDismissCount() {
    const count = localStorage.getItem(PROMO_DISMISS_COUNT);
    return count ? parseInt(count, 10) : 0;
}

/**
 * Reset all promo ad tracking data
 * Useful for testing
 */
export function resetPromoAdTracking() {
    localStorage.removeItem(PROMO_LAST_SHOWN);
    localStorage.removeItem(PROMO_DISMISS_COUNT);
    localStorage.removeItem(PROMO_LAST_DISMISSED);
    console.log('Promo ad: Tracking data reset');
}

/**
 * Get promo ad statistics (for debugging)
 * @returns {Object} - Statistics object
 */
export function getPromoAdStats() {
    return {
        lastShown: getLastShownTimestamp(),
        dismissCount: getDismissCount(),
        lastDismissed: localStorage.getItem(PROMO_LAST_DISMISSED),
        daysSinceLastShown: getLastShownTimestamp() ? (Date.now() - getLastShownTimestamp()) / MILLISECONDS_IN_DAY : null,
        canShow: shouldShowPromoAd()
    };
}

/**
 * Initialize the promo ad manager
 */
export function initializePromoAdManager() {
    console.log('Promo ad: Manager initialized');
    // No special initialization needed at this time
    // The modal will be initialized when first shown
}

// For backward compatibility, make functions available globally
window.promoAdManager = {
    shouldShow: shouldShowPromoAd,
    checkAndShow: checkAndShowPromoAd,
    forceShow: forceShowPromoAd,
    resetTracking: resetPromoAdTracking,
    getStats: getPromoAdStats
};
