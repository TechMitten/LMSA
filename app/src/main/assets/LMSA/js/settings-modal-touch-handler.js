// Touch handler for settings modal scrolling
import { settingsModal } from './dom-elements.js';
import { debugLog } from './utils.js';

/**
 * Initializes touch handling for the settings modal scrollable areas
 * Ensures touch scrolling works properly on touchscreens
 * 
 * NOTE: The key to enabling touch scrolling is to NOT interfere with
 * the default touch behavior. We only add handlers where absolutely
 * necessary (like for navigation buttons) and ensure the scrollable
 * container is left alone to handle scrolling natively.
 */
export function initializeSettingsModalTouchHandler() {
    if (!settingsModal) return;

    // Get the scrollable elements in the settings modal
    const settingsContentWrapper = document.getElementById('settings-content-wrapper');

    // IMPORTANT: Do NOT add touch event listeners to the settings content wrapper
    // that call stopPropagation() or preventDefault(). The browser needs to handle
    // touch scrolling natively. The CSS properties (touch-action: pan-y, 
    // -webkit-overflow-scrolling: touch, overflow-y: auto) handle everything.

    // Only ensure the wrapper has the correct styles applied programmatically
    // in case CSS isn't loading properly
    if (settingsContentWrapper) {
        // Apply touch scrolling styles programmatically as a backup
        settingsContentWrapper.style.overflowY = 'auto';
        settingsContentWrapper.style.touchAction = 'pan-x pan-y';
        settingsContentWrapper.style.overscrollBehavior = 'contain';

        debugLog('Settings content wrapper touch styles applied');
    }

    // Add specific touch event handlers for navigation buttons ONLY
    // These buttons need special handling to work properly on touch devices
    const navigationButtons = [
        'to-prompt-step-btn',
        'back-to-connection-btn',
        'to-options-step-btn',
        'back-to-prompt-btn',
        'to-actions-step-btn',
        'back-to-options-btn',
        'to-font-step-btn',
        'back-to-font-btn',
        'to-sidebar-step-btn',
        'back-to-sidebar-btn',
        'configure-local-server-btn',
        'configure-lmstudio-token-btn',
        'configure-lmstudio-mcp-btn',
        'configure-openrouter-key-btn',
        'configure-openai-compatible-btn',
        'edit-system-prompt-btn',
        'save-system-prompt-btn',
        'reset-sidebar-layout-btn',
        'select-local-server',
        'select-lmstudio-token',
        'select-lmstudio-mcp',
        'select-openrouter',
        'select-openai-compatible',
        'save-connection-preset-btn',
        'clear-max-tokens-btn',
        'add-lmstudio-mcp-integration-btn',
        'close-lmstudio-mcp-builder-btn',
        'add-lmstudio-mcp-tool-btn',
        'cancel-lmstudio-mcp-builder-btn',
        'save-lmstudio-mcp-builder-btn'
    ];

    // Add touch event handlers to each navigation button
    navigationButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            // Remove any existing event listeners by cloning and replacing
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);

            // Add click event - this works for both mouse and touch after touchend
            newButton.addEventListener('click', function (e) {
                debugLog(`Navigation button ${buttonId} clicked`);
                // Don't stop propagation - let the click bubble normally
            });

            // Add touchend handler with preventDefault to ensure the button action fires
            // This is necessary because touch devices sometimes have issues with click events
            newButton.addEventListener('touchend', function (e) {
                debugLog(`Navigation button ${buttonId} touchend`);
                // Prevent the default to avoid any ghost clicks (only when cancelable)
                if (e.cancelable) {
                    e.preventDefault();
                }
                // Trigger a click event to ensure the button action is performed
                newButton.click();
            }, { passive: false });
        }
    });

    // Apply touch styles to active settings steps when they become visible
    // This is done via a MutationObserver to ensure new steps get the styles
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('settings-step') && target.classList.contains('active')) {
                    // Apply touch scrolling styles to active steps
                    target.style.touchAction = 'pan-x pan-y';
                    target.style.webkitOverflowScrolling = 'touch';
                    target.style.overscrollBehavior = 'contain';
                }
            }
        });
    });

    // Observe all settings steps for class changes
    const settingsSteps = settingsModal.querySelectorAll('.settings-step');
    settingsSteps.forEach(step => {
        observer.observe(step, { attributes: true });

        // Also apply initial styles to active steps
        if (step.classList.contains('active')) {
            step.style.touchAction = 'pan-x pan-y';
            step.style.webkitOverflowScrolling = 'touch';
            step.style.overscrollBehavior = 'contain';
        }
    });

    debugLog('Settings modal touch handler initialized - using native scrolling');
}
