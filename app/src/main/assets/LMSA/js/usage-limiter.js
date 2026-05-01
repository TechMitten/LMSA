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

/**
 * Returns true if the user is allowed to trigger a web search.
 * Premium users always receive true.
 */
export function canUseWebSearch() {
    if (window.AndroidUsageLimiter && typeof window.AndroidUsageLimiter.canUseWebSearch === 'function') {
        return window.AndroidUsageLimiter.canUseWebSearch();
    }
    return true;
}

/**
 * Records one web search attempt against today's quota.
 * Should be called immediately before firing the web search request.
 */
export function recordWebSearch() {
    if (window.AndroidUsageLimiter && typeof window.AndroidUsageLimiter.recordWebSearch === 'function') {
        window.AndroidUsageLimiter.recordWebSearch();
    }
}

/**
 * Returns today's free-tier usage counters and limits.
 * Source of truth is the Android native bridge.
 */
export function getUsageStats() {
    const fallback = {
        chatCount: 0,
        chatLimit: 15,
        webSearchCount: 0,
        webSearchLimit: 2
    };

    if (!window.AndroidUsageLimiter || typeof window.AndroidUsageLimiter.getUsageStats !== 'function') {
        return fallback;
    }

    try {
        const rawStats = window.AndroidUsageLimiter.getUsageStats();
        if (!rawStats || typeof rawStats !== 'string') {
            return fallback;
        }

        const parsedStats = JSON.parse(rawStats);
        return {
            chatCount: Number.isFinite(parsedStats.chatCount) ? parsedStats.chatCount : fallback.chatCount,
            chatLimit: Number.isFinite(parsedStats.chatLimit) ? parsedStats.chatLimit : fallback.chatLimit,
            webSearchCount: Number.isFinite(parsedStats.webSearchCount) ? parsedStats.webSearchCount : fallback.webSearchCount,
            webSearchLimit: Number.isFinite(parsedStats.webSearchLimit) ? parsedStats.webSearchLimit : fallback.webSearchLimit
        };
    } catch (error) {
        console.warn('Failed to parse usage stats from Android bridge:', error);
        return fallback;
    }
}

/**
 * Returns true if the user is allowed to send an OpenRouter completion request.
 * OpenRouter completions are not tier-limited in the app.
 */
export function canSendOpenRouterCompletion() {
    return true;
}

/**
 * No-op: OpenRouter completions are not quota-tracked by app tier.
 */
export function recordOpenRouterCompletion() {
    // Intentionally empty.
}
