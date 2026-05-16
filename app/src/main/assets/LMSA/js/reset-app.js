// Reset App functionality
import { clearAllChats } from './chat-service.js';
import { debugLog, debugError } from './utils.js';
import { showConfirmationModal } from './ui-manager.js';
import { setActionToPerform } from './shared-state.js';

// Keep free-tier usage counters across app reset so reset cannot bypass daily limits.
const PRESERVED_USAGE_KEYS = new Set([
    'lmsa_completion_date',
    'lmsa_completion_count',
    'lmsa_web_search_date',
    'lmsa_web_search_count',
    // Legacy localStorage key variants kept for backward compatibility.
    'completion_date',
    'completion_count',
    'web_search_date',
    'web_search_count',
    'dailyCompletionCount',
    'dailyWebSearchCount'
]);

function isUsageLimitKey(key) {
    if (!key || typeof key !== 'string') {
        return false;
    }

    if (PRESERVED_USAGE_KEYS.has(key)) {
        return true;
    }

    const normalizedKey = key.toLowerCase();
    return (
        (normalizedKey.includes('usage') && normalizedKey.includes('count')) ||
        (normalizedKey.includes('completion') && normalizedKey.includes('count')) ||
        (normalizedKey.includes('web_search') && normalizedKey.includes('count')) ||
        (normalizedKey.includes('daily') && normalizedKey.includes('limit'))
    );
}

/**
 * Resets the entire application to its default state
 * - Deletes all chats
 * - Clears all saved settings including server connection settings
 * - Resets the app to its default state
 */
export function resetApp() {
    try {
        console.log('RESET APP: Starting app reset to default state');

        // 1. Clear all chats first
        try {
            clearAllChats();
            console.log('RESET APP: Cleared all chats successfully');
        } catch (error) {
            console.error('RESET APP: Error clearing chats:', error);
        }

        // 2. Clear all saved settings - comprehensive localStorage clear
        console.log('RESET APP: Clearing localStorage items...');
        try {
            const allKeys = Object.keys(localStorage);
            console.log('RESET APP: All localStorage keys before cleanup:', allKeys);
            
            allKeys.forEach(key => {
                if (isUsageLimitKey(key)) {
                    console.log(`RESET APP: Preserved usage key: ${key}`);
                    return;
                }
                try {
                    localStorage.removeItem(key);
                    console.log(`RESET APP: Removed key: ${key}`);
                } catch (error) {
                    console.error(`RESET APP: Error removing ${key}:`, error);
                }
            });
        } catch (error) {
            console.error('RESET APP: Error clearing localStorage keys:', error);
        }

        // 3. Clear native storage
        try {
            if (window.AndroidFileOps && typeof window.AndroidFileOps.deleteData === 'function') {
                window.AndroidFileOps.deleteData('chatHistory');
                window.AndroidFileOps.deleteData('savedSystemPrompts');
                window.AndroidFileOps.deleteData('savedConnectionPresets');
                console.log('RESET APP: Cleared app data from Android internal storage');
            }
        } catch (error) {
            console.error('RESET APP: Error clearing native app data:', error);
        }

        console.log('RESET APP: LocalStorage clearing complete, initiating page reload...');
        
        // 5. Force reload the page after a short delay to ensure all operations complete
        setTimeout(() => {
            console.log('RESET APP: Reloading page now...');
            window.location.reload(true); // Force reload from server
        }, 100);

        debugLog('App reset complete');
    } catch (error) {
        console.error('RESET APP: Critical error during reset:', error);
        debugError('Error resetting app:', error);
        
        // Force reload even if there was an error
        setTimeout(() => {
            console.log('RESET APP: Force reloading due to error...');
            window.location.reload(true);
        }, 500);
    }
}

/**
 * Shows the reset app confirmation modal
 */
export function showResetAppConfirmation() {
    console.log('RESET APP: Showing confirmation modal');
    // Import and close settings modal first to avoid conflicts
    import('./settings-modal-manager.js').then(module => {
        module.hideSettingsModal();
        
        // Small delay to let settings modal close completely
        setTimeout(() => {
            setActionToPerform('resetApp');
            showConfirmationModal('Are you sure you want to reset the app? This will delete all chats, clear all saved settings (including server connection settings), and delete all saved characters. This action cannot be undone.');
            console.log('RESET APP: Confirmation modal should now be visible');
        }, 100);
    });
}

/**
 * Initializes the reset app button event listener
 */
export function initializeResetAppButton() {
    // Try to find the button immediately
    let resetAppButton = document.getElementById('reset-app');
    
    if (resetAppButton) {
        // Remove any existing event listeners to prevent duplicates by cloning the node
        const newResetAppButton = resetAppButton.cloneNode(true);
        resetAppButton.parentNode.replaceChild(newResetAppButton, resetAppButton);
        
        // Add event listener to the new button
        newResetAppButton.addEventListener('click', (e) => {
            debugLog('Reset app button clicked');
            e.preventDefault();
            e.stopPropagation();
            showResetAppConfirmation();
        });
        debugLog('Reset app button event listener initialized');
    } else {
        // If button not found immediately, try again after DOM is fully loaded
        debugLog('Reset app button not found immediately, trying with delay...');
        setTimeout(() => {
            resetAppButton = document.getElementById('reset-app');
            if (resetAppButton) {
                // Remove any existing event listeners
                const newResetAppButton = resetAppButton.cloneNode(true);
                resetAppButton.parentNode.replaceChild(newResetAppButton, resetAppButton);
                
                // Add event listener
                newResetAppButton.addEventListener('click', (e) => {
                    debugLog('Reset app button clicked (delayed init)');
                    e.preventDefault();
                    e.stopPropagation();
                    showResetAppConfirmation();
                });
                debugLog('Reset app button event listener initialized after delay');
            } else {
                debugLog('Reset app button still not found after delay - check HTML structure');
            }
        }, 100);
    }
}
