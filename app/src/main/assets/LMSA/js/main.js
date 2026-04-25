// Main entry point for the application
import { loadServerSettings, fetchAvailableModels } from './api-service.js';
import { loadSettings, getRequireBiometric } from './settings-manager.js';
import { loadChatHistory, loadChat, chatHistoryData, activatePendingTemplateCharacterCard } from './chat-service.js';
import { initializeFileUpload } from './file-upload.js';
import { initializeEventHandlers } from './event-handlers.js';
import { hideLoadingIndicatorOnLoad, ensureWelcomeMessagePosition, initializeCollapsibleSections } from './ui-manager.js';
import { initializeTouchHandlers } from './touch-handlers.js';
import { initializeChatHistoryTouchHandler } from './chat-history-touch-handler.js';
import { initializeSettingsModalTouchHandler } from './settings-modal-touch-handler.js';
import { initializeSidebarTouchHandler } from './sidebar-touch-handler.js';
// File preview touch handler removed
import { handleScroll, setDebugEnabled, getDebugEnabled, wasRefreshDueToCodeGeneration, getLastActiveChatId, clearRefreshDueToCodeGenerationFlag, isAndroidWebView } from './utils.js';
import { initializeExportImport } from './export-import.js';
import { initializeModelManager } from './model-manager.js';
import { initializeWhatsNew } from './whats-new.js';
import { initializeSettingsModal } from './settings-modal-manager.js';
import { initializeIpPortConfirmationModal } from './ip-port-confirmation-modal.js';
import { initializeChatScrollbar, refreshChatScrollbar } from './chat-scrollbar.js';
import { closePremiumModal, initPremiumModal, isPremiumModalLocked, openPremiumModal } from './components/modals/premium-modal.js';
import { initSmartReplyWarningModal } from './components/modals/smart-reply-warning-modal.js';
import { initOpenRouterWarningModal } from './components/modals/openrouter-warning-modal.js';
import { initWebSearchWarningModal } from './components/modals/web-search-warning-modal.js';
import { initBiometricUnavailableModal, showBiometricUnavailableModal } from './components/modals/biometric-unavailable-modal.js';
import { initializeTemplateIndicator } from './template-indicator.js';
import { initializeHapticFeedback } from './haptics.js';
import { updateConfirmationModalTheme, updateExportImportModalsTheme } from './confirmation-modal-fix.js';
import { ensureOnboardingCompleted, openOnboarding } from './intro-screen.js';
import './about.js';

// Android WebView keyboard overlap fix
let initialViewportHeight = window.innerHeight;
let androidKeyboardHeight = 0;

// Import terms acceptance for checking
import { hasAcceptedCurrentTerms } from './terms-acceptance.js';

let isAppInitialized = false;
let offlineAccessPolicyBound = false;
let latestOfflineGateInternetAvailability = null;
let offlineGateInternetProbePending = false;
let offlineGatePendingOverlayShowTimeout = null;
let offlineGatePendingOverlayHideTimeout = null;
let offlineGatePendingOverlayVisible = false;

const OFFLINE_ACCESS_LOCK_REASON = 'offline-access';
const OFFLINE_ACCESS_NOTICE_HTML = 'Only premium users can use the app offline. Free users need an active internet connection.';
const OFFLINE_GATE_PENDING_OVERLAY_DELAY_MS = 420;
const OFFLINE_GATE_PENDING_OVERLAY_FADE_MS = 220;

function ensureOfflineGatePendingOverlay() {
    let overlay = document.getElementById('offline-gate-pending-overlay');
    if (overlay) {
        return overlay;
    }

    overlay = document.createElement('div');
    overlay.id = 'offline-gate-pending-overlay';
    overlay.style.cssText = [
        'position: fixed',
        'inset: 0',
        'display: none',
        'opacity: 0',
        `transition: opacity ${OFFLINE_GATE_PENDING_OVERLAY_FADE_MS}ms ease`,
        'align-items: center',
        'justify-content: center',
        'background: rgba(3, 7, 18, 0.98)',
        'pointer-events: none',
        'z-index: 2050'
    ].join(';');

    const content = document.createElement('div');
    content.style.cssText = [
        'display: flex',
        'flex-direction: column',
        'align-items: center',
        'gap: 14px',
        'padding: 24px',
        'text-align: center'
    ].join(';');

    const spinner = document.createElement('div');
    spinner.style.cssText = [
        'width: 28px',
        'height: 28px',
        'border-radius: 999px',
        'border: 3px solid rgba(148, 163, 184, 0.2)',
        'border-top-color: #fbbf24',
        'animation: offlineGateSpin 0.8s linear infinite'
    ].join(';');

    const label = document.createElement('div');
    label.textContent = 'Checking internet connection...';
    label.style.cssText = 'color: #e2e8f0; font-size: 14px; font-weight: 600; letter-spacing: 0.01em;';

    const style = document.createElement('style');
    style.textContent = '@keyframes offlineGateSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';

    content.appendChild(spinner);
    content.appendChild(label);
    overlay.appendChild(content);
    overlay.appendChild(style);
    document.body.appendChild(overlay);

    return overlay;
}

function shouldShowOfflineGatePendingOverlay() {
    if (isAppInitialized) {
        return false;
    }

    const isPremiumUser = typeof window.hasPremiumAccess === 'function'
        ? window.hasPremiumAccess()
        : false;

    return !isPremiumUser && offlineGateInternetProbePending && latestOfflineGateInternetAvailability === null;
}

function syncOfflineGatePendingOverlay() {
    const overlay = ensureOfflineGatePendingOverlay();
    const shouldShow = shouldShowOfflineGatePendingOverlay();

    if (shouldShow) {
        if (offlineGatePendingOverlayHideTimeout) {
            clearTimeout(offlineGatePendingOverlayHideTimeout);
            offlineGatePendingOverlayHideTimeout = null;
        }
        if (offlineGatePendingOverlayVisible || offlineGatePendingOverlayShowTimeout) {
            return;
        }

        offlineGatePendingOverlayShowTimeout = setTimeout(() => {
            offlineGatePendingOverlayShowTimeout = null;
            if (!shouldShowOfflineGatePendingOverlay()) {
                return;
            }

            overlay.style.display = 'flex';
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
            });
            offlineGatePendingOverlayVisible = true;
        }, OFFLINE_GATE_PENDING_OVERLAY_DELAY_MS);
        return;
    }

    if (offlineGatePendingOverlayShowTimeout) {
        clearTimeout(offlineGatePendingOverlayShowTimeout);
        offlineGatePendingOverlayShowTimeout = null;
    }

    if (!offlineGatePendingOverlayVisible) {
        overlay.style.display = 'none';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        return;
    }

    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    if (offlineGatePendingOverlayHideTimeout) {
        clearTimeout(offlineGatePendingOverlayHideTimeout);
    }
    offlineGatePendingOverlayHideTimeout = setTimeout(() => {
        offlineGatePendingOverlayHideTimeout = null;
        if (!shouldShowOfflineGatePendingOverlay()) {
            overlay.style.display = 'none';
            offlineGatePendingOverlayVisible = false;
        }
    }, OFFLINE_GATE_PENDING_OVERLAY_FADE_MS);
}

window.pendingBiometricResolve = null;
window.pendingBiometricReject = null;
window.activeBiometricRequest = null;

const BIOMETRIC_AUTH_SESSION_KEY = 'biometric_authenticated';
let shouldAutoPromptForBiometricUnlock = false;
let biometricLockHideTimeout = null;

function getBiometricBridge() {
    // Kotlin registers AndroidBiometrics; keep singular fallback for compatibility.
    if (typeof AndroidBiometrics !== 'undefined') {
        return AndroidBiometrics;
    }

    if (typeof window.AndroidBiometrics !== 'undefined') {
        return window.AndroidBiometrics;
    }

    if (typeof AndroidBiometric !== 'undefined') {
        return AndroidBiometric;
    }

    if (typeof window.AndroidBiometric !== 'undefined') {
        return window.AndroidBiometric;
    }

    return null;
}

function isBiometricSupported() {
    try {
        const biometricBridge = getBiometricBridge();
        if (!biometricBridge) {
            return false;
        }
        if (typeof biometricBridge.isBiometricSupported !== 'function') {
            return false;
        }
        return !!biometricBridge.isBiometricSupported();
    } catch (error) {
        console.warn('Biometric support check failed:', error);
        return false;
    }
}

function shouldRequireBiometricUnlock() {
    return isBiometricSupported() && getRequireBiometric() && !getDebugEnabled();
}

function isBiometricAuthenticated() {
    return sessionStorage.getItem(BIOMETRIC_AUTH_SESSION_KEY) === 'true';
}

function setBiometricAuthenticated(isAuthenticated) {
    if (isAuthenticated) {
        sessionStorage.setItem(BIOMETRIC_AUTH_SESSION_KEY, 'true');
    } else {
        sessionStorage.removeItem(BIOMETRIC_AUTH_SESSION_KEY);
    }
}

function getBiometricLockOverlay() {
    return document.getElementById('app-lock-overlay');
}

function setBiometricOverlayPresentation(mode = 'manual') {
    const lockPanel = document.getElementById('app-lock-panel');
    if (!lockPanel) {
        return;
    }

    if (mode === 'auto') {
        lockPanel.style.opacity = '0';
        lockPanel.style.pointerEvents = 'none';
        lockPanel.style.visibility = 'hidden';
    } else {
        lockPanel.style.opacity = '1';
        lockPanel.style.pointerEvents = '';
        lockPanel.style.visibility = 'visible';
    }
}

function showBiometricLockOverlay(mode = 'manual') {
    const lockOverlay = getBiometricLockOverlay();
    if (!lockOverlay) {
        return;
    }

    if (biometricLockHideTimeout) {
        clearTimeout(biometricLockHideTimeout);
        biometricLockHideTimeout = null;
    }

    lockOverlay.classList.remove('hidden');
    lockOverlay.classList.add('flex');
    lockOverlay.style.display = 'flex';
    lockOverlay.style.opacity = '1';
    setBiometricOverlayPresentation(mode);
}

function hideBiometricLockOverlay(immediate = false) {
    const lockOverlay = getBiometricLockOverlay();
    if (!lockOverlay) {
        return;
    }

    if (biometricLockHideTimeout) {
        clearTimeout(biometricLockHideTimeout);
        biometricLockHideTimeout = null;
    }

    if (immediate) {
        lockOverlay.style.opacity = '0';
        lockOverlay.classList.add('hidden');
        lockOverlay.classList.remove('flex');
        lockOverlay.style.display = 'none';
        setBiometricOverlayPresentation('manual');
        return;
    }

    lockOverlay.style.opacity = '0';
    biometricLockHideTimeout = setTimeout(() => {
        lockOverlay.classList.add('hidden');
        lockOverlay.classList.remove('flex');
        lockOverlay.style.display = 'none';
        setBiometricOverlayPresentation('manual');
        biometricLockHideTimeout = null;
    }, 300);
}

function ensureBiometricUnlockButton() {
    const unlockBtn = document.getElementById('biometric-unlock-btn');
    if (!unlockBtn || unlockBtn.dataset.biometricBound === 'true') {
        return;
    }

    unlockBtn.dataset.biometricBound = 'true';
    unlockBtn.addEventListener('click', () => {
        void promptForBiometricUnlock();
    });
}

function lockAppForBiometricReentry() {
    if (!shouldRequireBiometricUnlock()) {
        hideBiometricLockOverlay();
        return;
    }

    setBiometricAuthenticated(false);
    shouldAutoPromptForBiometricUnlock = true;
    showBiometricLockOverlay('auto');
}

async function promptForBiometricUnlock(autoPrompt = false) {
    if (!shouldRequireBiometricUnlock()) {
        hideBiometricLockOverlay();
        return true;
    }

    if (isBiometricAuthenticated()) {
        hideBiometricLockOverlay();
        return true;
    }

    showBiometricLockOverlay(autoPrompt ? 'auto' : 'manual');
    shouldAutoPromptForBiometricUnlock = false;

    try {
        await window.requestBiometricAuth('App Locked', 'Authenticate to access LMSA');
        return true;
    } catch (error) {
        setBiometricOverlayPresentation('manual');
        if (!autoPrompt) {
            console.warn('Biometric unlock failed', error);
        }
        return false;
    }
}

window.onAppBackgrounded = function() {
    lockAppForBiometricReentry();
};

window.onAppForegrounded = function() {
    if (!shouldRequireBiometricUnlock()) {
        hideBiometricLockOverlay();
        return;
    }

    if (!isBiometricAuthenticated()) {
        showBiometricLockOverlay(shouldAutoPromptForBiometricUnlock ? 'auto' : 'manual');
        if (shouldAutoPromptForBiometricUnlock) {
            void promptForBiometricUnlock(true);
        }
    }
};

window.onBiometricSuccess = function() {
    setBiometricAuthenticated(true);
    hideBiometricLockOverlay(true);

    if (window.pendingBiometricResolve) {
        const resolve = window.pendingBiometricResolve;
        window.pendingBiometricResolve = null;
        window.pendingBiometricReject = null;
        resolve(true);
    }
};

window.onBiometricFailure = function(errorMsg) {
    console.error("Biometric failure:", errorMsg);
    if (window.pendingBiometricReject) {
        const reject = window.pendingBiometricReject;
        window.pendingBiometricResolve = null;
        window.pendingBiometricReject = null;
        reject(new Error(errorMsg || "Authentication failed"));
    }
};

window.requestBiometricAuth = function(title, subtitle) {
    if (!isBiometricSupported()) {
        return Promise.resolve(true);
    }

    const biometricBridge = getBiometricBridge();
    if (!biometricBridge || typeof biometricBridge.authenticate !== 'function') {
        return Promise.reject(new Error('Biometric bridge unavailable'));
    }

    if (window.activeBiometricRequest) {
        return window.activeBiometricRequest;
    }

    window.activeBiometricRequest = new Promise((resolve, reject) => {
        try {
            window.pendingBiometricResolve = resolve;
            window.pendingBiometricReject = reject;
            biometricBridge.authenticate(title, subtitle);
        } catch (error) {
            window.pendingBiometricResolve = null;
            window.pendingBiometricReject = null;
            reject(error);
        }
    }).finally(() => {
        window.activeBiometricRequest = null;
        window.pendingBiometricResolve = null;
        window.pendingBiometricReject = null;
    });

    return window.activeBiometricRequest;
};

function getQuickInternetSignal() {
    if (window.AndroidNetwork && typeof window.AndroidNetwork.isInternetAvailable === 'function') {
        try {
            return !!window.AndroidNetwork.isInternetAvailable();
        } catch (error) {
            console.warn('Native internet check failed, falling back to navigator.onLine:', error);
        }
    }

    return navigator.onLine;
}

function requestOfflineGateInternetProbe() {
    if (offlineGateInternetProbePending) {
        syncOfflineGatePendingOverlay();
        return;
    }

    if (window.AndroidNetwork && typeof window.AndroidNetwork.probeInternetAvailability === 'function') {
        offlineGateInternetProbePending = true;
        syncOfflineGatePendingOverlay();
        try {
            window.AndroidNetwork.probeInternetAvailability();
            return;
        } catch (error) {
            offlineGateInternetProbePending = false;
            syncOfflineGatePendingOverlay();
            console.warn('Async offline gate internet probe failed to start:', error);
        }
    }

    latestOfflineGateInternetAvailability = getQuickInternetSignal();
    syncOfflineGatePendingOverlay();
}

window.onNativeOfflineInternetProbeResult = function(hasInternet) {
    offlineGateInternetProbePending = false;
    latestOfflineGateInternetAvailability = !!hasInternet;
    syncOfflineGatePendingOverlay();
    console.log(`[Offline Gate Probe] internet=${latestOfflineGateInternetAvailability}`);
    evaluateOfflineAccessPolicy({ initializeIfNeeded: true });
};

function hasActiveInternetConnection() {
    if (typeof latestOfflineGateInternetAvailability === 'boolean') {
        return latestOfflineGateInternetAvailability;
    }

    return getQuickInternetSignal();
}

function shouldDeferOfflineAccessDecision() {
    const isPremiumUser = typeof window.hasPremiumAccess === 'function'
        ? window.hasPremiumAccess()
        : false;

    return !isPremiumUser && offlineGateInternetProbePending && latestOfflineGateInternetAvailability === null;
}

function showOfflineAccessPremiumGate() {
    syncOfflineGatePendingOverlay();
    if (window.AndroidNetwork && typeof window.AndroidNetwork.dismissStartupSplash === 'function') {
        try {
            window.AndroidNetwork.dismissStartupSplash();
        } catch (error) {
            console.warn('Unable to dismiss native startup splash for offline gate:', error);
        }
    }

    openPremiumModal('Offline Access', {
        noticeHtml: OFFLINE_ACCESS_NOTICE_HTML,
        locked: true,
        lockReason: OFFLINE_ACCESS_LOCK_REASON,
        hideUpgradeButton: true
    });
}

function clearOfflineAccessPremiumGate() {
    syncOfflineGatePendingOverlay();
    if (isPremiumModalLocked(OFFLINE_ACCESS_LOCK_REASON)) {
        closePremiumModal(true);
    }
}

function isOfflineAccessBlocked() {
    const isPremiumUser = typeof window.hasPremiumAccess === 'function'
        ? window.hasPremiumAccess()
        : false;
    const hasInternet = hasActiveInternetConnection();
    const blocked = !isPremiumUser && !hasInternet;

    console.log(`[Offline Gate] premium=${isPremiumUser} internet=${hasInternet} blocked=${blocked}`);

    return blocked;
}

function evaluateOfflineAccessPolicy(options = {}) {
    if (shouldDeferOfflineAccessDecision()) {
        syncOfflineGatePendingOverlay();
        console.log('[Offline Gate] awaiting async internet probe before startup');
        return false;
    }

    const blocked = isOfflineAccessBlocked();

    if (blocked) {
        showOfflineAccessPremiumGate();
        return false;
    }

    clearOfflineAccessPremiumGate();

    if (options.initializeIfNeeded && !isAppInitialized && hasAcceptedCurrentTerms()) {
        void initializeApp();
    }

    return true;
}

function bindOfflineAccessPolicy() {
    if (offlineAccessPolicyBound) {
        return;
    }

    offlineAccessPolicyBound = true;

    const reevaluateAndInitialize = () => {
        requestOfflineGateInternetProbe();
        evaluateOfflineAccessPolicy({ initializeIfNeeded: true });
    };

    window.addEventListener('online', reevaluateAndInitialize);
    window.addEventListener('offline', () => {
        latestOfflineGateInternetAvailability = false;
        offlineGateInternetProbePending = false;
        syncOfflineGatePendingOverlay();
        evaluateOfflineAccessPolicy();
    });
    document.addEventListener('premium-status-changed', reevaluateAndInitialize);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            reevaluateAndInitialize();
        }
    });
}

export async function initializeApp() {
    if (isAppInitialized) return;
    
    // Wait for terms acceptance check before proceeding
    if (!hasAcceptedCurrentTerms()) {
        console.log('Terms not accepted, skipping app initialization');
        return;
    }

    if (!evaluateOfflineAccessPolicy()) {
        console.log('Offline access blocked for free user until internet or premium access is available');
        return;
    }

    isAppInitialized = true;

    setDebugEnabled(false);

    // Set up math rendering (KaTeX auto-render for $...$ and $$...$$)
    if (typeof window.setupMathRendering === 'function') {
        window.setupMathRendering();
    }

    // Initialize Android WebView keyboard fix
    initializeAndroidKeyboardFix();
    initializeHapticFeedback();

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
    setTimeout(() => {
        try {
            loadServerSettings(); // This will also fetch available models
        } catch (error) {
            console.warn('Server settings load failed (non-blocking):', error);
        }
    }, 0);
    loadSettings();
    ensureBiometricUnlockButton();

    // Check biometric requirement right after loading settings
    const biometricSupported = isBiometricSupported();
    const requireBiometric = getRequireBiometric();
    
    // Check premium status - premium users should always see the biometric option
    const isPremiumUser = typeof window.hasPremiumAccess === 'function'
        ? window.hasPremiumAccess()
        : (window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus());
    
    // Check if biometric setting exists in DOM to toggle visibility based on support
    const biometricContainer = document.getElementById('biometric-setting-container');
    if (biometricContainer) {
        // Show biometric setting if:
        // 1. Device supports biometrics, OR
        // 2. User is premium (they paid for the feature), OR
        // 3. Debug mode is enabled (for testing)
        if (biometricSupported || isPremiumUser || window.isDebugMode || getDebugEnabled()) {
            biometricContainer.style.display = 'block';
        } else {
            biometricContainer.style.display = 'none';
        }
    }
    
    const alreadyAuthenticated = isBiometricAuthenticated();
    if (biometricSupported && requireBiometric && !getDebugEnabled() && !alreadyAuthenticated) {
        lockAppForBiometricReentry();
        setTimeout(() => {
            void promptForBiometricUnlock(true);
        }, 100);
    } else if (!shouldRequireBiometricUnlock()) {
        hideBiometricLockOverlay();
    }

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
    document.addEventListener('webSearchLimitReached', () => openPremiumModal('Web Search'));
    // OpenRouter is currently unmetered by app tier; keep listener for forward compatibility.
    document.addEventListener('openRouterLimitReached', () => openPremiumModal('OpenRouter Messages'));
    initSmartReplyWarningModal();
    initOpenRouterWarningModal();
    initWebSearchWarningModal();
    initBiometricUnavailableModal();
    window.showBiometricUnavailableModal = showBiometricUnavailableModal;
    initializeTemplateIndicator();

    const onboardingCompleted = await ensureOnboardingCompleted();
    if (!onboardingCompleted) {
        console.log('Onboarding not completed, app initialization paused');
        return;
    }

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

    activatePendingTemplateCharacterCard();

    initializeExportImport();
    initializeWhatsNew();

    updateConfirmationModalTheme();
    updateExportImportModalsTheme();


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

    const mainAppContainer = document.getElementById('main-app-container');
    if (mainAppContainer) {
        mainAppContainer.classList.add('android-webview');
    }

    // With adjustResize, both window.innerHeight and visualViewport.height shrink
    // together when the keyboard opens, so the only reliable detection is comparing
    // window.innerHeight against the original baseline captured before any keyboard input.
    window.androidKeyboardVisible = false;

    // Track orientation changes so we can reset the baseline after rotation
    let baselineHeight = initialViewportHeight;
    let lastAppliedKeyboardState = false;
    let viewportRafId = null;
    window.addEventListener('orientationchange', () => {
        // After rotation settles, recapture the baseline
        setTimeout(() => {
            if (!window.androidKeyboardVisible) {
                baselineHeight = window.innerHeight;
                initialViewportHeight = baselineHeight;
            }
        }, 500);
    });

    function getVisibleViewportMetrics() {
        const visualViewport = window.visualViewport;
        if (visualViewport && typeof visualViewport.height === 'number' && visualViewport.height > 0) {
            return {
                height: Math.round(Math.min(window.innerHeight, visualViewport.height)),
                width: Math.round(Math.min(window.innerWidth, visualViewport.width || window.innerWidth)),
                offsetTop: Math.max(0, Math.round(visualViewport.offsetTop || 0)),
                offsetLeft: Math.max(0, Math.round(visualViewport.offsetLeft || 0))
            };
        }

        return {
            height: window.innerHeight,
            width: window.innerWidth,
            offsetTop: 0,
            offsetLeft: 0
        };
    }

    function isVisibleTextEntryField(element) {
        if (!(element instanceof HTMLElement)) {
            return false;
        }

        if (element.disabled || element.readOnly) {
            return false;
        }

        if (element instanceof HTMLInputElement) {
            const type = (element.type || 'text').toLowerCase();
            const allowedTypes = new Set(['text', 'password', 'search', 'url', 'email', 'tel', 'number']);
            if (!allowedTypes.has(type)) {
                return false;
            }
        } else if (!(element instanceof HTMLTextAreaElement)) {
            return false;
        }

        const styles = window.getComputedStyle(element);
        if (styles.display === 'none' || styles.visibility === 'hidden') {
            return false;
        }

        return true;
    }

    function modalSupportsKeyboardFit(modal) {
        const candidates = modal.querySelectorAll('input, textarea');
        return Array.from(candidates).some(isVisibleTextEntryField);
    }

    function modalHasFocusedTextEntry(modal) {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement) || !modal.contains(active)) {
            return false;
        }

        return isVisibleTextEntryField(active);
    }

    function syncVisibleModalContainers(keyboardOpen) {
        // Native (WebViewActivity.applySystemBarInsets) consumes the IME inset and
        // shrinks the WebView above the keyboard, so the visual viewport already
        // represents the keyboard-free area. Modal containers are position:fixed and
        // naturally fit that area — applying extra inline sizing or the
        // `.keyboard-visible` overrides (align-items: stretch + top padding) would
        // push the modal too high. Just clear any previously-applied inline styles.
        const visibleModalContainers = document.querySelectorAll('.modal-container:not(.hidden)');
        visibleModalContainers.forEach((modal) => {
            if (!(modal instanceof HTMLElement)) {
                return;
            }
            if (modal.id === 'system-prompt-overlay') {
                return;
            }
            modal.classList.remove('keyboard-visible');
            modal.classList.remove('modal-input-keyboard-fit');
            modal.style.height = '';
            modal.style.maxHeight = '';
            modal.style.width = '';
            modal.style.maxWidth = '';
            modal.style.position = '';
            modal.style.top = '';
            modal.style.left = '';
            modal.style.right = '';
            modal.style.bottom = '';

            if (!keyboardOpen) {
                return;
            }

            if (!modalSupportsKeyboardFit(modal) || !modalHasFocusedTextEntry(modal)) {
                return;
            }

            modal.classList.add('modal-input-keyboard-fit');
        });
    }

    function applyKeyboardState(keyboardOpen) {
        if (keyboardOpen === lastAppliedKeyboardState) {
            return;
        }

        lastAppliedKeyboardState = keyboardOpen;
        window.androidKeyboardVisible = keyboardOpen;
        syncVisibleModalContainers(keyboardOpen);
        if (keyboardOpen) {
            document.body.classList.add('keyboard-visible');
            if (mainAppContainer) {
                mainAppContainer.classList.add('keyboard-visible');
            }

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
            const visibleModal = document.querySelector('.modal-container:not(.hidden)');
            if (userInput && document.activeElement === userInput && !visibleModal) {
                requestAnimationFrame(() => {
                    userInput.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
                });
            }
        } else {
            document.body.classList.remove('keyboard-visible');
            if (mainAppContainer) {
                mainAppContainer.classList.remove('keyboard-visible');
            }
        }
    }

    function handleKeyboardViewportChangeNow() {
        const currentHeight = window.innerHeight;
        const keyboardHeight = baselineHeight - currentHeight;
        androidKeyboardHeight = Math.max(0, keyboardHeight);

        // Use hysteresis to avoid rapid open/close flips while the IME animates.
        const openThresholdPx = 150;
        const closeThresholdPx = 110;
        const isKeyboardOpen = lastAppliedKeyboardState
            ? keyboardHeight > closeThresholdPx
            : keyboardHeight > openThresholdPx;

        applyKeyboardState(isKeyboardOpen);

        if (!isKeyboardOpen) {
            // Keep baseline updated when keyboard is not open (e.g. after rotation)
            baselineHeight = Math.max(baselineHeight, currentHeight);
        }
    }

    function handleKeyboardViewportChange() {
        if (viewportRafId !== null) {
            cancelAnimationFrame(viewportRafId);
        }

        viewportRafId = requestAnimationFrame(() => {
            viewportRafId = null;
            handleKeyboardViewportChangeNow();
        });
    }

    // Window resize handles the Android adjustResize change for shared modals.
    window.addEventListener('resize', handleKeyboardViewportChange);

    // Keep modal keyboard-fit state synchronized when focus moves between fields.
    document.addEventListener('focusin', handleKeyboardViewportChange, true);
    document.addEventListener('focusout', () => {
        requestAnimationFrame(handleKeyboardViewportChange);
    }, true);
}

// Initialize the application when the DOM is loaded and terms are accepted
document.addEventListener('DOMContentLoaded', function () {
    // Make initializeApp globally available
    window.initializeApp = initializeApp;
    window.openOnboarding = () => openOnboarding(true);
    window.openPremiumModal = openPremiumModal;

    initPremiumModal();
    ensureOfflineGatePendingOverlay();
    bindOfflineAccessPolicy();
    requestOfflineGateInternetProbe();

    // Check terms acceptance first, then initialize app if passed
    if (hasAcceptedCurrentTerms()) {
        evaluateOfflineAccessPolicy({ initializeIfNeeded: true });
    } else {
        console.log('Terms not accepted - app initialization paused until terms are accepted');
    }
});
