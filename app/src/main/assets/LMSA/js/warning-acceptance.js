/**
 * Unencrypted Communication Warning Acceptance System
 * Forces users to accept security warning before using the app
 */

// Constants
const WARNING_ACCEPTED_KEY = 'lmsa_unencrypted_warning_accepted';

// DOM Elements
let warningModal;
let acceptButton;
let mainAppContainer;
let isInitialized = false;

/**
 * Initialize the warning acceptance system
 */
export function initializeWarningAcceptance() {
    if (isInitialized) return;

    // Get DOM elements
    warningModal = document.getElementById('unencrypted-warning-modal');
    acceptButton = document.getElementById('accept-unencrypted-warning-btn');
    mainAppContainer = document.getElementById('main-app-container');

    if (!warningModal || !acceptButton || !mainAppContainer) {
        // Warning modal might not be in DOM yet or strictly required if we are just checking status
        // But for this flow, we expect it to be there.
        // If not found, fall back to showing main app to avoid softlock
        console.warn('Warning acceptance system: Required DOM elements not found. Showing main app.');
        showMainApp();
        return;
    }

    // Check if warning needs to be accepted
    if (hasAcceptedWarning()) {
        hideWarningModal();
        showMainApp();
        return;
    }

    // Show warning modal
    showWarningModal();
    setupEventListeners();
    isInitialized = true;
}

/**
 * Check if user has accepted the warning
 */
export function hasAcceptedWarning() {
    return localStorage.getItem(WARNING_ACCEPTED_KEY) === 'true';
}

/**
 * Show the warning modal and prevent body scroll
 */
function showWarningModal() {
    warningModal.classList.remove('hidden');
    warningModal.classList.add('flex');
    document.body.classList.add('warning-modal-open');
    document.body.style.overflow = 'hidden';

    // Ensure it's on top
    warningModal.style.zIndex = '9999';

    // Prevent any app interactions
    hideMainApp();
}

/**
 * Hide the warning modal
 */
function hideWarningModal() {
    if (warningModal) {
        warningModal.classList.add('hidden');
        warningModal.classList.remove('flex');
    }
    document.body.classList.remove('warning-modal-open');
    document.body.style.overflow = '';
}

/**
 * Show the main application
 */
function showMainApp() {
    if (mainAppContainer) {
        mainAppContainer.classList.remove('hidden');
    }

    // Initialize main app modules if needed
    // Mirroring terms-acceptance.js behavior
    import('./main.js').then(module => {
        if (typeof module.initializeApp === 'function') {
            module.initializeApp();
        } else if (typeof window.initializeApp === 'function') {
            window.initializeApp();
        }
    }).catch(error => {
        console.error('Error initializing main app after warning acceptance:', error);
    });
}

/**
 * Hide the main application
 */
function hideMainApp() {
    if (mainAppContainer) {
        mainAppContainer.classList.add('hidden');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (acceptButton) {
        acceptButton.addEventListener('click', handleAcceptWarning);
    }
}

/**
 * Handle accept warning button click
 */
function handleAcceptWarning() {
    // Save acceptance
    localStorage.setItem(WARNING_ACCEPTED_KEY, 'true');

    // Hide modal and show app
    hideWarningModal();
    showMainApp();

    console.log('Unencrypted warning accepted successfully');
}
