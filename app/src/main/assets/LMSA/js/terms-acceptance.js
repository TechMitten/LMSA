/**
 * Terms of Service Acceptance System
 * Forces users to accept terms before using any app features
 */

// Constants
const TERMS_ACCEPTED_KEY = 'lmsa_terms_accepted';
const TERMS_VERSION_KEY = 'lmsa_terms_version';
const CURRENT_TERMS_VERSION = '2026-05-06'; // Matches effective date in legal/terms.md
import { termsContentString } from './components/modals/terms-modal.js';

/**
 * Renders terms markdown content into the modal
 * @param {Object} marked - The marked library instance
 */
const renderTerms = (marked) => {
    if (!termsContent || !termsContentString) return;

    try {
        // Handle different versions of marked API
        const html = (typeof marked.parse === 'function') 
            ? marked.parse(termsContentString) 
            : (typeof marked === 'function' ? marked(termsContentString) : null);

        if (html) {
            termsContent.innerHTML = html;
            
            // Add listener for the Privacy Policy link if it exists in the rendered HTML
            // This allows opening the local privacy modal from the terms modal
            const privacyLink = termsContent.querySelector('a[href*="privacy"]');
            if (privacyLink) {
                privacyLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Find and click the privacy policy button in the sidebar or trigger its handler
                    const privacyBtn = document.getElementById('privacy-policy-btn');
                    if (privacyBtn) {
                        privacyBtn.click();
                    }
                });
            }
        } else {
            throw new Error('Marked parser failed to produce HTML');
        }
    } catch (err) {
        console.error('Error parsing terms markdown:', err);
        termsContent.innerHTML = '<p class="text-red-400">Error rendering terms of service. Please contact support.</p>';
    }
};

// DOM Elements
let termsModal;
let termsContent;
let acceptButton;
let scrollIndicator;
let mainAppContainer;

// State
let hasScrolledToBottom = false;
let isInitialized = false;

/**
 * Initialize the terms acceptance system
 */
function initializeTermsAcceptance() {
    if (isInitialized) return;

    // Get DOM elements
    termsModal = document.getElementById('terms-modal');
    termsContent = document.getElementById('terms-content');
    acceptButton = document.getElementById('accept-terms-btn');
    scrollIndicator = document.getElementById('scroll-indicator');
    mainAppContainer = document.getElementById('main-app-container');

    if (!termsModal || !termsContent || !acceptButton || !mainAppContainer) {
        console.error('Terms acceptance system: Required DOM elements not found');
        return;
    }

    // Check if terms need to be accepted
    if (hasAcceptedCurrentTerms()) {
        hideTermsModal();
        showMainApp();
        return;
    }

    // Show terms modal
    showTermsModal();
    setupEventListeners();
    isInitialized = true;
}

/**
 * Check if user has accepted the current version of terms
 */
function hasAcceptedCurrentTerms() {
    const acceptedVersion = localStorage.getItem(TERMS_VERSION_KEY);
    const hasAccepted = localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true';
    return hasAccepted && acceptedVersion === CURRENT_TERMS_VERSION;
}

/**
 * Show the terms modal and prevent body scroll
 */
function showTermsModal() {
    if (!termsModal || !termsContent) {
        console.error('Terms modal elements not found');
        return;
    }

    termsModal.classList.remove('hidden');
    termsModal.classList.add('flex');
    document.body.classList.add('terms-modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Show loading state initially
    termsContent.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';

    // Load and render terms
    if (window.marked) {
        renderTerms(window.marked);
    } else if (window.loadMarkedLibrary) {
        window.loadMarkedLibrary().then(renderTerms).catch(err => {
            console.error('Failed to load marked for terms acceptance:', err);
            termsContent.innerHTML = '<p class="text-red-400">Error loading terms of service content. Please check your internet connection.</p>';
        });
    } else {
        termsContent.innerHTML = '<p class="text-red-400">Markdown renderer unavailable.</p>';
    }
    
    // Prevent any app interactions
    hideMainApp();
}

/**
 * Hide the terms modal
 */
function hideTermsModal() {
    termsModal.classList.add('hidden');
    termsModal.classList.remove('flex');
    document.body.classList.remove('terms-modal-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
}

/**
 * Show the main application
 */
function showMainApp() {
    mainAppContainer.classList.remove('hidden');
}

/**
 * Hide the main application
 */
function hideMainApp() {
    mainAppContainer.classList.add('hidden');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Accept button click
    acceptButton.addEventListener('click', handleAcceptTerms);

    // Prevent escape key from closing modal
    document.addEventListener('keydown', handleKeyDown);

    // Prevent click outside modal from closing it
    termsModal.addEventListener('click', handleModalClick);

    // Touch move prevention on body
    document.body.addEventListener('touchmove', preventBodyScroll, { passive: false });
}

/**
 * Handle accept terms button click
 */
async function handleAcceptTerms() {
    // Show loading state
    acceptButton.classList.add('loading');
    acceptButton.disabled = true;

    try {
        // Simulate processing delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        // Save acceptance
        localStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
        localStorage.setItem(TERMS_VERSION_KEY, CURRENT_TERMS_VERSION);

        // Hide modal and show app
        hideTermsModal();
        showMainApp();

        // Clean up event listeners
        cleanupEventListeners();

        console.log('Terms of Service accepted successfully');

        // Initialize the main app now that terms are accepted
        initializeMainApp();

        // Auto-reload the page after terms acceptance to ensure clean state
        setTimeout(() => {
            window.location.reload();
        }, 100);

    } catch (error) {
        console.error('Error accepting terms:', error);
        // Reset button state on error
        acceptButton.classList.remove('loading');
        acceptButton.disabled = false;
    }
}

/**
 * Handle keyboard events
 */
function handleKeyDown(event) {
    // Prevent escape key from closing modal
    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
    }

    // Prevent tabbing outside modal
    if (event.key === 'Tab') {
        const focusableElements = termsModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
}

/**
 * Handle clicks on modal overlay
 */
function handleModalClick(event) {
    // Prevent clicks outside content from closing modal
    if (event.target === termsModal) {
        event.preventDefault();
        event.stopPropagation();
    }
}

/**
 * Prevent body scroll when modal is open, but allow scrolling in terms content
 */
function preventBodyScroll(event) {
    if (termsModal && !termsModal.classList.contains('hidden')) {
        // Allow touch events on terms content
        if (termsContent && termsContent.contains(event.target)) {
            return;
        }
        // Prevent touch events elsewhere (body, modal overlay, etc.)
        event.preventDefault();
    }
}

/**
 * Clean up event listeners
 */
function cleanupEventListeners() {
    if (acceptButton) {
        acceptButton.removeEventListener('click', handleAcceptTerms);
    }

    document.removeEventListener('keydown', handleKeyDown);
    document.body.removeEventListener('touchmove', preventBodyScroll);

    if (termsModal) {
        termsModal.removeEventListener('click', handleModalClick);
    }
}

/**
 * Force re-show terms (for testing or when terms are updated)
 */
function forceShowTerms() {
    localStorage.removeItem(TERMS_ACCEPTED_KEY);
    localStorage.removeItem(TERMS_VERSION_KEY);

    if (isInitialized) {
        cleanupEventListeners();
        isInitialized = false;
    }

    initializeTermsAcceptance();
}

/**
 * Get current terms acceptance status
 */
function getTermsStatus() {
    return {
        hasAccepted: localStorage.getItem(TERMS_ACCEPTED_KEY) === 'true',
        acceptedVersion: localStorage.getItem(TERMS_VERSION_KEY),
        currentVersion: CURRENT_TERMS_VERSION,
        needsAcceptance: !hasAcceptedCurrentTerms()
    };
}

/**
 * Initialize the main app after terms are accepted
 */
function initializeMainApp() {
    // Import and call the main app initialization
    import('./main.js').then(module => {
        // The main.js file already has its own DOMContentLoaded handler
        // that checks for terms acceptance, so we just need to trigger it
        if (typeof module.initializeApp === 'function') {
            module.initializeApp();
        } else {
            // Fallback: try to access the global initializeApp function
            if (typeof window.initializeApp === 'function') {
                window.initializeApp();
            }
        }
    }).catch(error => {
        console.error('Error initializing main app after terms acceptance:', error);
    });
}

/**
 * Reset terms acceptance (for testing purposes)
 */
function resetTermsAcceptance() {
    localStorage.removeItem(TERMS_ACCEPTED_KEY);
    localStorage.removeItem(TERMS_VERSION_KEY);
}

// Export functions for use in other modules
export {
    initializeTermsAcceptance,
    forceShowTerms,
    getTermsStatus,
    resetTermsAcceptance,
    hasAcceptedCurrentTerms
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTermsAcceptance);
} else {
    // DOM is already loaded
    initializeTermsAcceptance();
}