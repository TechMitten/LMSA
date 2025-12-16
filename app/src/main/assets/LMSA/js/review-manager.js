/**
 * Manager for handling Google Play In-App Review requests
 * Tracks user interactions and triggers the review flow based on usage criteria
 */

import { debugLog, debugError } from './utils.js';

class ReviewManager {
    constructor() {
        this.STORAGE_KEY_COUNT = 'lmsa_interaction_count';
        this.STORAGE_KEY_LAST_REQUEST = 'lmsa_last_review_request';
        this.INTERACTION_THRESHOLD = 10;
        this.initialized = false;
    }

    /**
     * Increment the interaction count and check if review should be requested
     */
    trackInteraction() {
        try {
            let count = parseInt(localStorage.getItem(this.STORAGE_KEY_COUNT) || '0');
            count++;
            localStorage.setItem(this.STORAGE_KEY_COUNT, count.toString());
            debugLog(`Interaction count updated: ${count}`);

            this.checkAndRequestReview(count);
        } catch (error) {
            debugError('Error tracking interaction for review manager:', error);
        }
    }

    /**
     * Check criteria and trigger review if met
     * @param {number} currentCount - Current interaction count
     */
    checkAndRequestReview(currentCount) {
        // 1. Check if running in Android app and interface exists
        if (typeof AndroidReview === 'undefined') {
            debugLog('AndroidReview interface not available - skipping review request');
            return;
        }

        // 2. Check if threshold reached
        if (currentCount < this.INTERACTION_THRESHOLD) {
            return;
        }

        // 3. Check if we've already requested it recently (optional, but good practice)
        // For this implementation, we'll simple trigger it once when hitting the threshold
        // or every N interactions if we wanted. 
        // Let's strictly follow: Trigger AFTER 10 interactions. 
        // To avoid spamming, we can check if we already requested it. 
        // However, the Google Play API handles quotas internally, so calling it multiple times is 'safe' 
        // but we should be polite.
        // Let's trigger it exactly at 10, 50, 100? Or just at 10?
        // The instructions implied "after 10 successful AI interactions".
        
        if (currentCount === this.INTERACTION_THRESHOLD) {
             this.triggerReview();
        } else if (currentCount > this.INTERACTION_THRESHOLD && currentCount % 50 === 0) {
            // Optional: Retry periodically if they didn't review, or for future prompt opportunities
            // But for now, let's stick to the primary trigger.
             this.triggerReview();
        }
    }

    /**
     * Trigger the native review flow
     */
    triggerReview() {
        debugLog('Triggering In-App Review flow');
        try {
            AndroidReview.requestInAppReview();
            // Record timestamp
            localStorage.setItem(this.STORAGE_KEY_LAST_REQUEST, Date.now().toString());
        } catch (e) {
            debugError('Failed to call AndroidReview.requestInAppReview', e);
        }
    }
}

// Create singleton instance
export const reviewManager = new ReviewManager();
