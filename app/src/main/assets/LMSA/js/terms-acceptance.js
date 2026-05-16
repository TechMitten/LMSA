/**
 * Terms of Service Acceptance System
 * Forces users to accept terms before using any app features
 */

// Constants
const TERMS_ACCEPTED_KEY = 'lmsa_terms_accepted';
const TERMS_VERSION_KEY = 'lmsa_terms_version';
import { termsContentString, TERMS_CONTENT_VERSION } from './components/modals/terms-modal.js';
const CURRENT_TERMS_VERSION = TERMS_CONTENT_VERSION;

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
            // Check scroll completion once terms are parsed and inserted into the DOM
            setTimeout(checkScrollCompletion, 200);
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
let termsAlertModal;
let termsAlertCloseBtn;
let mainAppContainer;

// State
let hasScrolledToBottom = false;
let isInitialized = false;

/**
 * Shows the Terms of Service reading requirement alert modal
 */
function showTermsAlertModal() {
    if (termsAlertModal) {
        termsAlertModal.classList.remove('hidden');
        termsAlertModal.classList.add('flex');
    }
}

/**
 * Hides the Terms of Service reading requirement alert modal
 */
function hideTermsAlertModal() {
    if (termsAlertModal) {
        termsAlertModal.classList.add('hidden');
        termsAlertModal.classList.remove('flex');
    }
}

/**
 * Checks if the user has scrolled to the bottom of the terms container
 */
function checkScrollCompletion() {
    if (hasScrolledToBottom) return;

    const panel = termsModal ? termsModal.querySelector('.terms-modal-panel') : null;
    const scrollContainers = [termsContent, panel].filter(Boolean);
    
    let isScrollable = false;
    let reachedBottom = false;
    let hasValidContainer = false;
    const threshold = 20; //px threshold from bottom

    for (const container of scrollContainers) {
        const clientH = container.clientHeight;
        const scrollH = container.scrollHeight;
        
        // Only evaluate containers that are actively rendered with non-zero dimensions
        if (clientH > 0) {
            hasValidContainer = true;
            if (scrollH > clientH) {
                isScrollable = true;
                // Check if user has scrolled to bottom of this container
                const diff = scrollH - container.scrollTop - clientH;
                if (diff <= threshold) {
                    reachedBottom = true;
                    break;
                }
            }
        }
    }

    // Only commit scroll completion if we have at least one successfully rendered container
    if (hasValidContainer) {
        // If the container is not scrollable (content fits on screen) or they reached the bottom
        if (!isScrollable || reachedBottom) {
            hasScrolledToBottom = true;
        }
    }
}

/**
 * Initialize the terms acceptance system
 */
function initializeTermsAcceptance() {
    if (isInitialized) return;

    // Get DOM elements
    termsModal = document.getElementById('terms-modal');
    termsContent = document.getElementById('terms-content');
    acceptButton = document.getElementById('accept-terms-btn');
    termsAlertModal = document.getElementById('terms-alert-modal');
    termsAlertCloseBtn = document.getElementById('terms-alert-close-btn');
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

    // Reset scroll completion state
    hasScrolledToBottom = false;

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

    // Scroll listeners to detect when user reaches the bottom
    if (termsContent) {
        termsContent.addEventListener('scroll', checkScrollCompletion);
    }
    const panel = termsModal ? termsModal.querySelector('.terms-modal-panel') : null;
    if (panel) {
        panel.addEventListener('scroll', checkScrollCompletion);
    }

    // Resize listener for fluid responsive layout adjustments
    window.addEventListener('resize', checkScrollCompletion);

    // Close ToS alert modal click
    if (termsAlertCloseBtn) {
        termsAlertCloseBtn.addEventListener('click', hideTermsAlertModal);
    }

    // Clicking outside ToS alert modal panel closes it
    if (termsAlertModal) {
        termsAlertModal.addEventListener('click', (event) => {
            if (event.target === termsAlertModal) {
                hideTermsAlertModal();
            }
        });
    }
}

/**
 * Handle accept terms button click
 */
async function handleAcceptTerms() {
    // Check if the user has scrolled to the bottom (read the TOS) first
    // If not, show the elegant Alert Modal instead of accepting!
    if (!hasScrolledToBottom) {
        showTermsAlertModal();
        return;
    }

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
    if (event.key === 'Escape') {
        // If ToS Alert Modal is visible, close it
        if (termsAlertModal && !termsAlertModal.classList.contains('hidden')) {
            event.preventDefault();
            event.stopPropagation();
            hideTermsAlertModal();
            return;
        }
        // Prevent escape key from closing ToS modal itself
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

    if (termsContent) {
        termsContent.removeEventListener('scroll', checkScrollCompletion);
    }
    const panel = termsModal ? termsModal.querySelector('.terms-modal-panel') : null;
    if (panel) {
        panel.removeEventListener('scroll', checkScrollCompletion);
    }

    window.removeEventListener('resize', checkScrollCompletion);

    if (termsAlertCloseBtn) {
        termsAlertCloseBtn.removeEventListener('click', hideTermsAlertModal);
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