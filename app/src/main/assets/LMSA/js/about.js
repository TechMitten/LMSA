// Import the checkAndShowWelcomeMessage function
import { checkAndShowWelcomeMessage } from './ui-manager.js';
import { showExternalSiteModal } from './external-site-confirmation-modal.js';
import { setDebugEnabled } from './utils.js';

// Get DOM elements
const aboutButtonElement = document.getElementById('about-btn');
const aboutModal = document.getElementById('about-modal');
const closeAboutButton = document.getElementById('close-about');
const sidebarElement = document.getElementById('sidebar');
const modalContent = aboutModal ? aboutModal.querySelector('.modal-content') : null;
const openHelpLink = document.getElementById('open-help-link');
const helpModal = document.getElementById('help-modal');

// Function to close sidebar
function closeSidebar() {
    if (sidebarElement) {
        sidebarElement.classList.add('hidden');
        sidebarElement.classList.remove('active');
        document.body.classList.remove('sidebar-open');

        // Also close the options container
        const optionsContainer = document.getElementById('options-container');
        if (optionsContainer) {
            optionsContainer.classList.add('hidden');
            optionsContainer.classList.remove('animate-fade-in');
        }

        // Remove the sidebar overlay
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
            sidebarOverlay.classList.add('hidden');
        }

        // Collapse all sections when sidebar is closed
        const sectionHeaders = sidebarElement.querySelectorAll('.section-header');
        const chatHistorySection = sidebarElement.querySelector('.sidebar-section:last-child');
        sectionHeaders.forEach(header => {
            header.classList.remove('active');
            const content = header.nextElementSibling;
            if (content && content.classList.contains('collapsible-content')) {
                content.classList.remove('show');
            }
        });

        // Ensure chat history is visible when sidebar is closed
        if (chatHistorySection) {
            chatHistorySection.classList.remove('chat-history-hidden');
        }
    }
}

// About button click handler is now managed in js/event-handlers.js
// This prevents duplicate event handlers and conflicts

// Close About modal button handler
if (closeAboutButton) {
    const handleClose = () => {
        if (aboutModal) {
            if (modalContent) {
                aboutModal.classList.remove('show');
                aboutModal.classList.add('hide');
                modalContent.classList.add('animate-modal-out');
                setTimeout(() => {
                    aboutModal.classList.add('hidden');
                    aboutModal.classList.remove('hide');
                    modalContent.classList.remove('animate-modal-out');

                    // Check if welcome message should be shown
                    checkAndShowWelcomeMessage();
                }, 400);
            } else {
                // Fallback if modalContent is null
                aboutModal.classList.remove('show');
                aboutModal.classList.add('hide');
                setTimeout(() => {
                    aboutModal.classList.add('hidden');
                    aboutModal.classList.remove('hide');
                    checkAndShowWelcomeMessage();
                }, 400);
            }
        }
    };

    // Add click event listener
    closeAboutButton.addEventListener('click', handleClose);
    
    // Add touch event listener for better mobile experience
    closeAboutButton.addEventListener('touchend', (e) => {
        e.preventDefault(); // Prevent default behavior
        e.stopPropagation(); // Stop event bubbling
        handleClose();
    }, { passive: false });
}

// Open help link click handler
if (openHelpLink && helpModal) {
    openHelpLink.addEventListener('click', (e) => {
        e.preventDefault();

        // Close the about modal first
        if (aboutModal) {
            aboutModal.classList.remove('show');
            aboutModal.classList.add('hide');

            if (modalContent) {
                modalContent.classList.add('animate-modal-out');
            }

            setTimeout(() => {
                aboutModal.classList.add('hidden');
                aboutModal.classList.remove('hide');
                if (modalContent) {
                    modalContent.classList.remove('animate-modal-out');
                }

                // Then open the help modal via the shared open handler.
                if (typeof window.openHelpModal === 'function') {
                    window.openHelpModal();
                } else {
                    helpModal.classList.remove('hidden');
                }
            }, 400);
        }
    });
}

// Debug Mode Trigger logic
const versionBadge = document.querySelector('.version-badge');
const DEBUG_MODE_STORAGE_KEY = 'lmsaDebugMode';
const DEBUG_TAP_ARM_COUNT = 7;
const DEBUG_TAP_TRIGGER_COUNT = 11;
const DEBUG_TAP_TIMEOUT_MS = 450;
let debugClickCount = 0;
let debugClickTimer = null;
let debugGestureArmed = false;

// Initialize global debug state if not exists
if (typeof window.isDebugMode === 'undefined') {
    window.isDebugMode = false;
}

function clearDebugTapProgress() {
    debugClickCount = 0;
    debugGestureArmed = false;
    if (debugClickTimer) {
        clearTimeout(debugClickTimer);
        debugClickTimer = null;
    }
}

function scheduleDebugTapReset() {
    if (debugClickTimer) {
        clearTimeout(debugClickTimer);
    }
    debugClickTimer = setTimeout(() => {
        clearDebugTapProgress();
    }, DEBUG_TAP_TIMEOUT_MS);
}

function confirmEnableDebugMode() {
    if (typeof window.confirm === 'function') {
        return window.confirm('Enable Debug Mode? This unlocks testing behavior intended for development use only.');
    }
    return true;
}

function updateWelcomeDebugIndicator(isEnabled) {
    const indicator = document.getElementById('welcome-debug-indicator');
    if (!indicator) {
        return;
    }
    indicator.style.display = isEnabled ? 'block' : 'none';
}

function applyDebugModeState(enabled, syncNative = true) {
    const isEnabled = !!enabled;
    window.isDebugMode = isEnabled;
    setDebugEnabled(isEnabled);
    updateWelcomeDebugIndicator(isEnabled);

    if (syncNative && window.AndroidBilling && typeof window.AndroidBilling.toggleDebugMode === 'function') {
        window.AndroidBilling.toggleDebugMode(isEnabled);
    } else if (!window.AndroidBilling || typeof window.AndroidBilling.toggleDebugMode !== 'function') {
        localStorage.setItem(DEBUG_MODE_STORAGE_KEY, isEnabled ? 'true' : 'false');
        if (typeof window.updateUiForPremium === 'function') {
            window.updateUiForPremium(!isEnabled);
        }
    }

    if (isEnabled) {
        // Removed resetWelcomeSettingsFirstTapState();
    }
}

function hydrateDebugModeState() {
    let hydratedDebugMode = false;

    if (window.AndroidBilling && typeof window.AndroidBilling.checkDebugMode === 'function') {
        hydratedDebugMode = !!window.AndroidBilling.checkDebugMode();
    } else {
        hydratedDebugMode = localStorage.getItem(DEBUG_MODE_STORAGE_KEY) === 'true';
        if (typeof window.updateUiForPremium === 'function') {
            window.updateUiForPremium(!hydratedDebugMode);
        }
    }

    window.isDebugMode = hydratedDebugMode;
    setDebugEnabled(hydratedDebugMode);
    updateWelcomeDebugIndicator(hydratedDebugMode);
}

hydrateDebugModeState();



if (versionBadge) {
    const processVersionBadgeTap = (e) => {
        e.preventDefault();
        e.stopPropagation();

        debugClickCount++;
        if (debugClickCount >= DEBUG_TAP_ARM_COUNT) {
            debugGestureArmed = true;
        }

        if (debugGestureArmed && debugClickCount >= DEBUG_TAP_TRIGGER_COUNT) {
            const nextState = !window.isDebugMode;
            if (nextState && !confirmEnableDebugMode()) {
                clearDebugTapProgress();
                return;
            }
            applyDebugModeState(nextState, true);
            clearDebugTapProgress();
            return;
        }

        scheduleDebugTapReset();
    };

    versionBadge.addEventListener('click', processVersionBadgeTap);
    versionBadge.addEventListener('touchend', processVersionBadgeTap, { passive: false });
}

if (modalContent) {
    const disableDebugByModalTap = (e) => {
        if (!window.isDebugMode) {
            return;
        }

        const target = e.target;
        if (versionBadge && versionBadge.contains(target)) {
            return;
        }

        applyDebugModeState(false, true);
        clearDebugTapProgress();
    };

    modalContent.addEventListener('click', disableDebugByModalTap);
    modalContent.addEventListener('touchend', disableDebugByModalTap, { passive: true });
}
