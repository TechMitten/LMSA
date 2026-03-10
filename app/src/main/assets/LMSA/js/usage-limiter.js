/**
 * Usage limiter — delegates to the Android native layer (SharedPreferences)
 * so the quota survives WebView cache/storage clears.
 *
 * Falls back to permissive (true) in browser environments where the
 * AndroidUsageLimiter interface is not present.
 */

/**
 * Returns true if the user is allowed to send a completion request.
 * Handles the daily reset at midnight local time on the native side.
 * Premium users always receive true.
 */
export function canSendCompletion() {
    if (window.AndroidUsageLimiter && typeof window.AndroidUsageLimiter.canSendCompletion === 'function') {
        return window.AndroidUsageLimiter.canSendCompletion();
    }
    return true; // permissive fallback for non-Android environments
}

/**
 * Records one completion attempt against today's quota.
 * Should be called immediately before firing the API request.
 */
export function recordCompletion() {
    if (window.AndroidUsageLimiter && typeof window.AndroidUsageLimiter.recordCompletion === 'function') {
        window.AndroidUsageLimiter.recordCompletion();
    }
}
