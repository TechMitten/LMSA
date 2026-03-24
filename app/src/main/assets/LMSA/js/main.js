// Main entry point for the application
import { loadServerSettings, fetchAvailableModels } from './api-service.js';
import { loadSettings } from './settings-manager.js';
import { loadChatHistory, loadChat, chatHistoryData } from './chat-service.js';
import { initializeFileUpload } from './file-upload.js';
import { initializeEventHandlers } from './event-handlers.js';
import { hideLoadingIndicatorOnLoad, ensureWelcomeMessagePosition, initializeCollapsibleSections } from './ui-manager.js';
import { initializeTouchHandlers } from './touch-handlers.js';
import { initializeChatHistoryTouchHandler } from './chat-history-touch-handler.js';
import { initializeSettingsModalTouchHandler } from './settings-modal-touch-handler.js';
import { initializeSidebarTouchHandler } from './sidebar-touch-handler.js';
// File preview touch handler removed
import { handleScroll, setDebugEnabled, wasRefreshDueToCodeGeneration, getLastActiveChatId, clearRefreshDueToCodeGenerationFlag, isAndroidWebView } from './utils.js';
import { initializeExportImport } from './export-import.js';
import { initializeModelManager } from './model-manager.js';
import { initializeWhatsNew } from './whats-new.js';
import { initializeSettingsModal } from './settings-modal-manager.js';
import { initializeIpPortConfirmationModal } from './ip-port-confirmation-modal.js';
import { initializeChatScrollbar, refreshChatScrollbar } from './chat-scrollbar.js';
import { initPremiumModal, openPremiumModal } from './components/modals/premium-modal.js';
import { initSmartReplyWarningModal } from './components/modals/smart-reply-warning-modal.js';
import { initOpenRouterWarningModal } from './components/modals/openrouter-warning-modal.js';
import { initializeTemplateIndicator } from './template-indicator.js';

// Optimization modules removed


import { updateConfirmationModalTheme, updateExportImportModalsTheme } from './confirmation-modal-fix.js';
// Memory leak detector removed
import { animationOptimizer } from './optimized-utils.js';
// Import help.js to ensure help modal buttons work immediately
import './help.js';
// Import about.js to ensure about modal buttons work immediately
import './about.js';

// Android WebView keyboard overlap fix
let initialViewportHeight = window.innerHeight;
let androidKeyboardHeight = 0;

// Import terms acceptance for checking
import { hasAcceptedCurrentTerms } from './terms-acceptance.js';

let isAppInitialized = false;


/**
 * Initializes the application
 */
export async function initializeApp() {
    if (isAppInitialized) {
        return;
    }

    // Wait for terms acceptance check before proceeding


    if (!hasAcceptedCurrentTerms()) {
        console.log('Terms not accepted, skipping app initialization');
        return;
    }

    isAppInitialized = true;

    // Disable debug logging by default
    setDebugEnabled(false);

    // Set up math rendering (KaTeX auto-render for $...$ and $$...$$)
    if (typeof window.setupMathRendering === 'function') {
        window.setupMathRendering();
    }

    // Initialize Android WebView keyboard fix
    initializeAndroidKeyboardFix();

    // Initialize the model banner state based on localStorage
    initializeModelBannerState();

    // Ensure settings modal is hidden on startup
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
        settingsModal.classList.remove('show');
    }

    // Ensure system prompt overlay is hidden on startup
    const systemPromptOverlay = document.getElementById('system-prompt-overlay');
    if (systemPromptOverlay) {
        systemPromptOverlay.classList.add('hidden');
        systemPromptOverlay.style.display = 'none';
    }

    // Ensure the About button is properly initialized
    const aboutButton = document.getElementById('about-btn');

    // Load critical settings first
    loadServerSettings(); // This will also fetch available models
    loadSettings();
    loadChatHistory();

    // Check if refresh was triggered by code generation
    if (wasRefreshDueToCodeGeneration()) {

        // Get the last active chat ID
        const lastActiveChatId = getLastActiveChatId();

        // Immediately clear the reload flag to prevent any future accidental reloads
        clearRefreshDueToCodeGenerationFlag();

        // Check if this is a first message reload (special optimization case)
        const isFirstMessageReload = localStorage.getItem('isFirstMessageReload') === 'true';
        localStorage.removeItem('isFirstMessageReload');

        if (lastActiveChatId && chatHistoryData && chatHistoryData[lastActiveChatId]) {
            // Load the chat immediately with no delay
            loadChat(lastActiveChatId, isFirstMessageReload);

            // Force immediate scroll
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }

    // Make sure file upload is initialized before other components
    // This ensures file upload handlers are ready when event handlers are set up
    try {
        initializeFileUpload();
    } catch (error) {
        console.error('Error initializing file upload:', error);
    }

    hideLoadingIndicatorOnLoad();
    ensureWelcomeMessagePosition();
    initializeChatScrollbar();

    // Initialize critical components first
    initializeEventHandlers();

    // Initialize components in a simpler order
    initializeTouchHandlers();
    initializeChatHistoryTouchHandler();
    initializeSettingsModalTouchHandler();
    initializeSidebarTouchHandler();
    // File preview touch handler removed
    // File upload already initialized above
    initializeModelManager();

    // Update file upload capabilities after model manager is initialized
    try {
        const { updateFileUploadCapabilities } = await import('./file-upload.js');
        await updateFileUploadCapabilities();
    } catch (error) {
        console.error('Error updating initial file upload capabilities:', error);
    }

    initializeCollapsibleSections();
    initializeSettingsModal();
    initializeIpPortConfirmationModal();
    initPremiumModal();
    window.openPremiumModal = openPremiumModal;
    document.addEventListener('completionLimitReached', () => openPremiumModal('Chat Messages'));
    initSmartReplyWarningModal();
    initOpenRouterWarningModal();
    initializeTemplateIndicator();

    // Pre-initialize TTS service to prevent double-tap issues
    try {
        if (window.TTSService && !window.TTSService.isInitialized()) {
            console.log('Pre-initializing TTS service...');
            await window.TTSService.initialize();
        }
    } catch (error) {
        console.error('Error pre-initializing TTS service:', error);
    }



    // Initialize saved system prompts functionality
    try {
        const { initializeSavedSystemPrompts } = await import('./saved-system-prompts.js');
        initializeSavedSystemPrompts();
    } catch (error) {
        console.error('Error initializing saved system prompts:', error);
    }

    initializeExportImport();
    initializeWhatsNew();

    updateConfirmationModalTheme();
    updateExportImportModalsTheme();

    // Preload interstitial ad for faster display
    preloadInterstitialAd();

    // Initialize scroll button state - ensure it's hidden on startup
    const messagesContainer = document.getElementById('messages');
    const scrollButton = document.getElementById('scroll-to-bottom');

    if (scrollButton) {
        // Explicitly hide the button on startup
        scrollButton.classList.remove('visible', 'show');
        scrollButton.classList.add('hidden');
        // Remove any inline styles that might interfere with CSS classes
        scrollButton.style.opacity = '';
        scrollButton.style.visibility = '';
        scrollButton.style.pointerEvents = '';
    }

    if (messagesContainer) {
        // Use requestAnimationFrame to avoid redundant synchronous layout work on startup.
        requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            handleScroll(messagesContainer);
            refreshChatScrollbar();
        });
    }

    // Add window resize event listener
    window.addEventListener('resize', () => {
        // Handle welcome message positioning
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage && welcomeMessage.style.display === 'flex') {
            ensureWelcomeMessagePosition();
        }
    });

    // Initialize memory optimizations
    // Memory optimizations removed


    // Initialize performance optimizations
    // Performance monitoring removed



    // Performance monitoring removed for production/staging
}

/**
 * Initializes the model banner state - always hidden
 */
function initializeModelBannerState() {
    const loadedModelDisplay = document.getElementById('loaded-model');
    const modelWrapper = document.getElementById('loaded-model-wrapper');

    // Always hide the banner
    if (loadedModelDisplay && modelWrapper) {
        // Set the hidden properties
        loadedModelDisplay.style.maxHeight = '0';
        loadedModelDisplay.style.opacity = '0';
        loadedModelDisplay.style.transform = 'translateY(-100%)';
        loadedModelDisplay.style.visibility = 'hidden';
        loadedModelDisplay.classList.add('hidden');

        // Hide the wrapper
        modelWrapper.style.display = 'none';
        document.documentElement.style.setProperty('--loaded-model-height', '0px');

        // Add a class to the body to indicate the banner is hidden
        document.body.classList.add('model-banner-hidden-by-user');

        // Store the preference in localStorage
        localStorage.setItem('modelBannerVisible', 'false');
    }
}

/**
 * Initializes Android WebView keyboard fix
 * This function handles the issue where the Android keyboard overlaps content
 * instead of pushing it up in WebView environments
 */
function initializeAndroidKeyboardFix() {
    // Only apply fix for Android WebView
    if (!isAndroidWebView()) {
        return;
    }

    // With adjustResize, both window.innerHeight and visualViewport.height shrink
    // together when the keyboard opens, so the only reliable detection is comparing
    // window.innerHeight against the original baseline captured before any keyboard input.
    window.androidKeyboardVisible = false;

    // Track orientation changes so we can reset the baseline after rotation
    let baselineHeight = initialViewportHeight;
    window.addEventListener('orientationchange', () => {
        // After rotation settles, recapture the baseline
        setTimeout(() => {
            if (!window.androidKeyboardVisible) {
                baselineHeight = window.innerHeight;
                initialViewportHeight = baselineHeight;
            }
        }, 500);
    });

    function applyKeyboardState(keyboardOpen) {
        window.androidKeyboardVisible = keyboardOpen;
        if (keyboardOpen) {
            document.body.classList.add('keyboard-visible');

            // Hide scroll-to-bottom button immediately
            const scrollBtn = document.getElementById('scroll-to-bottom');
            if (scrollBtn) {
                scrollBtn.classList.remove('visible', 'show');
                scrollBtn.classList.add('hidden');
                scrollBtn.style.visibility = 'hidden';
                scrollBtn.style.pointerEvents = 'none';
            }

            // Scroll to input field
            const userInput = document.getElementById('user-input');
            if (userInput) {
                setTimeout(() => {
                    userInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        } else {
            document.body.classList.remove('keyboard-visible');
        }
    }

    // Use window resize — works correctly with adjustResize since innerHeight shrinks
    window.addEventListener('resize', function () {
        const currentHeight = window.innerHeight;
        const keyboardHeight = baselineHeight - currentHeight;

        if (keyboardHeight > 150) {
            applyKeyboardState(true);
        } else {
            applyKeyboardState(false);
            // Keep baseline updated when keyboard is not open (e.g. after rotation)
            baselineHeight = Math.max(baselineHeight, currentHeight);
        }
    });
}

// Initialize the application when the DOM is loaded and terms are accepted
document.addEventListener('DOMContentLoaded', function () {
    // Make initializeApp globally available
    window.initializeApp = initializeApp;

    // Check terms acceptance first, then initialize app if passed
    if (hasAcceptedCurrentTerms()) {
        initializeApp();
    } else {
        console.log('Terms not accepted - app initialization paused until terms are accepted');
    }
});