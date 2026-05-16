// Touch handler for settings modal scrolling
import { settingsModal } from './dom-elements.js';
import { debugLog } from './utils.js';
import { navigateSettingsModalToStep } from './settings-modal-manager.js';

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

        // Initialize horizontal swipe gesture navigation
        initializeHorizontalSwipeNavigation(settingsContentWrapper);
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
                // If currently swiping, do not trigger click action!
                if (settingsContentWrapper && settingsContentWrapper.classList.contains('swiping')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                debugLog(`Navigation button ${buttonId} clicked`);
                // Don't stop propagation - let the click bubble normally
            });

            // Add touchend handler with preventDefault to ensure the button action fires
            // This is necessary because touch devices sometimes have issues with click events
            newButton.addEventListener('touchend', function (e) {
                // Ignore touchend if a swipe drag is currently in progress to prevent accidental activations
                if (settingsContentWrapper && settingsContentWrapper.classList.contains('swiping')) {
                    debugLog(`Navigation button ${buttonId} touchend ignored due to swipe`);
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    return;
                }

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

/**
 * Configures the horizontal swipe gesture navigation for the settings modal steps.
 * Swiping left goes to the next step, swiping right goes to the previous step.
 * Excludes elements like horizontal sliders (type="range") and text fields to prevent clashing.
 */
function initializeHorizontalSwipeNavigation(settingsContentWrapper) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwipeIgnored = false;
    let dragStarted = false;
    let adjacentStepName = '';
    let adjacentStepEl = null;
    let currentStepEl = null;
    let currentStepName = '';
    let direction = ''; // 'next' or 'prev'
    let navButtons = null;
    let confirmContainer = null;
    
    // Pixel-perfect translation dimensions
    let stepWidth = 0;
    let paddingLeft = 0;
    let paddingTop = 0;

    // Race condition guard for rapid swiping
    let transitionTimeout = null;

    const stepOrder = ['connection', 'options', 'prompt', 'font', 'sidebar', 'actions'];

    const isInsideSliderOrInput = (target) => {
        if (!target) return false;
        return !!target.closest([
            'input[type="range"]',
            'input[type="text"]',
            'input[type="number"]',
            'input[type="password"]',
            'textarea',
            'select',
            'option',
            '.settings-slider',
            '.settings-slider-container',
            '.no-swipe'
        ].join(','));
    };

    const cleanupStyles = () => {
        if (currentStepEl) {
            currentStepEl.style.position = '';
            currentStepEl.style.left = '';
            currentStepEl.style.top = '';
            currentStepEl.style.width = '';
            currentStepEl.style.transform = '';
            currentStepEl.style.transition = '';
        }
        if (adjacentStepEl) {
            adjacentStepEl.style.position = '';
            adjacentStepEl.style.left = '';
            adjacentStepEl.style.top = '';
            adjacentStepEl.style.width = '';
            adjacentStepEl.style.transform = '';
            adjacentStepEl.style.transition = '';
        }
        if (settingsContentWrapper) {
            settingsContentWrapper.style.overflowX = '';
            // Remove 'swiping' class after a tiny delay so that trailing click events on release are captured
            setTimeout(() => {
                settingsContentWrapper.classList.remove('swiping');
            }, 80);
        }

        // Fade in buttons beautifully at the end of transition when they are back in normal flow
        if (navButtons) {
            navButtons.style.pointerEvents = '';
            navButtons.style.transition = 'opacity 150ms ease';
            navButtons.style.opacity = '1';
            setTimeout(() => {
                navButtons.style.opacity = '';
                navButtons.style.transition = '';
            }, 150);
        }
        if (confirmContainer) {
            confirmContainer.style.pointerEvents = '';
            confirmContainer.style.transition = 'opacity 150ms ease';
            confirmContainer.style.opacity = '1';
            setTimeout(() => {
                confirmContainer.style.opacity = '';
                confirmContainer.style.transition = '';
            }, 150);
        }
    };

    settingsContentWrapper.addEventListener('touchstart', (e) => {
        // Clear any pending transition timeout to avoid race conditions
        if (transitionTimeout) {
            clearTimeout(transitionTimeout);
            transitionTimeout = null;
            cleanupStyles();
        }

        if (e.touches.length > 1) {
            isSwipeIgnored = true;
            return;
        }

        const target = e.target;
        if (isInsideSliderOrInput(target)) {
            isSwipeIgnored = true;
            return;
        }

        isSwipeIgnored = false;
        dragStarted = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        
        // Find current step
        currentStepEl = document.querySelector('.settings-step.active');
        if (currentStepEl) {
            currentStepName = currentStepEl.getAttribute('data-step-name')?.toLowerCase() || 'connection';
        }
        navButtons = document.getElementById('settings-navigation-buttons');
        confirmContainer = document.getElementById('close-settings')?.parentElement;
        adjacentStepEl = null;
        adjacentStepName = '';
    }, { passive: true });

    settingsContentWrapper.addEventListener('touchmove', (e) => {
        if (isSwipeIgnored) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = currentY - touchStartY;

        if (!dragStarted) {
            // Trigger drag when moving primarily horizontally beyond a small noise threshold
            if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                const currentIndex = stepOrder.indexOf(currentStepName);
                if (currentIndex === -1) {
                    isSwipeIgnored = true;
                    return;
                }

                if (deltaX < 0) {
                    // Swiping left -> next page
                    if (currentIndex < stepOrder.length - 1) {
                        adjacentStepName = stepOrder[currentIndex + 1];
                        direction = 'next';
                    } else {
                        isSwipeIgnored = true;
                        return;
                    }
                } else {
                    // Swiping right -> prev page
                    if (currentIndex > 0) {
                        adjacentStepName = stepOrder[currentIndex - 1];
                        direction = 'prev';
                    } else {
                        isSwipeIgnored = true;
                        return;
                    }
                }

                adjacentStepEl = document.getElementById('settings-step-' + adjacentStepName);
                if (!adjacentStepEl || !currentStepEl) {
                    isSwipeIgnored = true;
                    return;
                }

                dragStarted = true;
                settingsContentWrapper.classList.add('swiping');
                
                // Show the adjacent step to render it
                adjacentStepEl.classList.remove('hidden');
                adjacentStepEl.classList.add('active');

                // Prepare wrapper and calculate pixel-perfect translation layout dimensions
                settingsContentWrapper.style.overflowX = 'hidden';
                
                const computedStyle = window.getComputedStyle(settingsContentWrapper);
                paddingLeft = parseFloat(computedStyle.paddingLeft) || 20;
                paddingTop = parseFloat(computedStyle.paddingTop) || 16;
                const paddingRight = parseFloat(computedStyle.paddingRight) || 20;
                
                const clientW = settingsContentWrapper.clientWidth;
                stepWidth = clientW ? (clientW - paddingLeft - paddingRight) : (currentStepEl.offsetWidth || 360);

                // Instantly hide action buttons with zero delay so they never jump or flash at the start
                if (navButtons) {
                    navButtons.style.transition = 'none';
                    navButtons.style.opacity = '0';
                    navButtons.style.pointerEvents = 'none';
                }
                if (confirmContainer) {
                    confirmContainer.style.transition = 'none';
                    confirmContainer.style.opacity = '0';
                    confirmContainer.style.pointerEvents = 'none';
                }
            }
        }

        if (dragStarted) {
            if (e.cancelable) {
                e.preventDefault();
            }

            // Drag steps horizontally with absolute pixel accuracy to prevent any crossover gaps
            currentStepEl.style.position = 'absolute';
            currentStepEl.style.left = paddingLeft + 'px';
            currentStepEl.style.top = paddingTop + 'px';
            currentStepEl.style.width = stepWidth + 'px';
            currentStepEl.style.transition = 'none';
            currentStepEl.style.transform = `translate3d(${deltaX}px, 0, 0)`;

            adjacentStepEl.style.position = 'absolute';
            adjacentStepEl.style.left = paddingLeft + 'px';
            adjacentStepEl.style.top = paddingTop + 'px';
            adjacentStepEl.style.width = stepWidth + 'px';
            adjacentStepEl.style.transition = 'none';

            if (direction === 'next') {
                adjacentStepEl.style.transform = `translate3d(${stepWidth + deltaX}px, 0, 0)`;
            } else {
                adjacentStepEl.style.transform = `translate3d(${-stepWidth + deltaX}px, 0, 0)`;
            }
        }
    }, { passive: false });

    settingsContentWrapper.addEventListener('touchend', (e) => {
        if (isSwipeIgnored) return;
        if (!dragStarted || !currentStepEl || !adjacentStepEl) return;

        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartX;
        const elapsedTime = Date.now() - touchStartTime;

        // Snap thresholds: swipe more than 120px, or quick swipe more than 40px in under 300ms
        const shouldComplete = Math.abs(deltaX) > 120 || (Math.abs(deltaX) > 40 && elapsedTime < 300);

        if (shouldComplete) {
            // Animate transition to finish line with exact pixel snap bounds
            currentStepEl.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            adjacentStepEl.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            if (direction === 'next') {
                currentStepEl.style.transform = `translate3d(${-stepWidth}px, 0, 0)`;
                adjacentStepEl.style.transform = 'translate3d(0, 0, 0)';
            } else {
                currentStepEl.style.transform = `translate3d(${stepWidth}px, 0, 0)`;
                adjacentStepEl.style.transform = 'translate3d(0, 0, 0)';
            }

            // Perform actual step state change after animation completes
            transitionTimeout = setTimeout(() => {
                transitionTimeout = null;
                // Navigate without direction to prevent conflict CSS animations!
                navigateSettingsModalToStep(adjacentStepName, null);
                cleanupStyles();
            }, 200);
        } else {
            // Animate snap back to original positions
            currentStepEl.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            adjacentStepEl.style.transition = 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';

            currentStepEl.style.transform = 'translate3d(0, 0, 0)';
            if (direction === 'next') {
                adjacentStepEl.style.transform = `translate3d(${stepWidth}px, 0, 0)`;
            } else {
                adjacentStepEl.style.transform = `translate3d(${-stepWidth}px, 0, 0)`;
            }

            // Restore hidden state and clean up styles after animation completes
            transitionTimeout = setTimeout(() => {
                transitionTimeout = null;
                if (adjacentStepEl) {
                    adjacentStepEl.classList.add('hidden');
                    adjacentStepEl.classList.remove('active');
                }
                cleanupStyles();
            }, 200);
        }
    }, { passive: true });

    // Capturing click listener to suppress all click activations during active swipe
    settingsContentWrapper.addEventListener('click', (e) => {
        if (settingsContentWrapper.classList.contains('swiping')) {
            e.preventDefault();
            e.stopPropagation();
            debugLog('Click event suppressed during active swipe');
        }
    }, { capture: true });
}

