// Settings Modal Manager
// This module centralizes all settings modal functionality

import { settingsModal, getStartedBtn } from './dom-elements.js';
import { debugLog, getDebugEnabled, isAndroidWebView } from './utils.js';
import { showToastNotice } from './toast-notice.js';
import { checkAndShowWelcomeMessage } from './ui-manager.js';
import { getApiUrl, getAvailableModels, isServerRunning, validateIpPort, saveServerSettings, fetchAvailableModels } from './api-service.js';
import { openPremiumModal } from './components/modals/premium-modal.js';
import {
    getUseOpenRouter,
    getOpenRouterApiKey,
    getUseOpenAICompatible,
    getOpenAICompatibleApiKey,
    requireSystemPromptPremiumAccess,
    updateSystemPromptPremiumState,
    applyConnectionProviderSelection,
    setOpenRouterApiKey,
    setOpenAICompatibleEndpoint,
    setOpenAICompatibleApiKey,
    setLMStudioApiToken
} from './settings-manager.js';
import { interceptIpPortChanges } from './ip-port-confirmation-modal.js';
import { getSavedConnectionPresets, saveConnectionPreset, deleteConnectionPreset } from './saved-connection-presets.js';

// Holds a reference to the internal showStep function once the modal is initialised
let _navigateToStep = null;
let _currentSettingsStep = 'connection';
let _openModelInfoAfterSettingsClose = false;
let _openRouterKeyBeforeEditing = '';
let _pendingConnectionPresetDeletion = null;
let _showConnectionPresetEditModal = null;

const CONNECTION_PRESET_TYPE_LABELS = {
    local: 'Local Server',
    openrouter: 'OpenRouter',
    'openai-compatible': 'Custom Endpoint'
};

function hasPremiumAccess() {
    if (typeof window.hasPremiumAccess === 'function') {
        return !!window.hasPremiumAccess();
    }

    return !!(window.AndroidBilling &&
        typeof window.AndroidBilling.checkPremiumStatus === 'function' &&
        window.AndroidBilling.checkPremiumStatus());
}

function requiresPremiumForConnectionPreset(type) {
    return type === 'openrouter' || type === 'openai-compatible';
}

function requestConnectionPresetPremiumAccess(type) {
    if (!requiresPremiumForConnectionPreset(type) || hasPremiumAccess()) {
        return false;
    }

    openPremiumModal('Connection Presets');
    return true;
}

function getBiometricBridge() {
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

function getActiveConnectionProvider() {
    if (getUseOpenRouter()) {
        return 'openrouter';
    }

    if (getUseOpenAICompatible()) {
        return 'openai-compatible';
    }

    return 'local';
}

function maskSecret(secret, leading = 6, trailing = 4) {
    const normalizedSecret = typeof secret === 'string' ? secret.trim() : '';
    if (!normalizedSecret) {
        return 'Not saved';
    }

    if (normalizedSecret.length <= leading + trailing) {
        return 'Saved';
    }

    return `${normalizedSecret.slice(0, leading)}...${normalizedSecret.slice(-trailing)}`;
}

function countSavedMcpIntegrations(rawValue) {
    const normalizedValue = typeof rawValue === 'string' ? rawValue.trim() : '';
    if (!normalizedValue) {
        return 0;
    }

    try {
        const parsed = JSON.parse(normalizedValue);
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        return entries.filter(entry => entry && typeof entry === 'object').length;
    } catch (_) {
        return 0;
    }
}

function getCurrentConnectionPresetDraft() {
    const provider = getActiveConnectionProvider();

    if (provider === 'openrouter') {
        return {
            type: provider,
            data: {
                openRouterApiKey: localStorage.getItem('openRouterApiKey') || ''
            }
        };
    }

    if (provider === 'openai-compatible') {
        return {
            type: provider,
            data: {
                endpoint: localStorage.getItem('openAICompatibleEndpoint') || '',
                apiKey: localStorage.getItem('openAICompatibleApiKey') || '',
                manualModel: localStorage.getItem('openAICompatibleManualModel') || ''
            }
        };
    }

    return {
        type: provider,
        data: {
            serverIp: localStorage.getItem('serverIp') || '',
            serverPort: localStorage.getItem('serverPort') || '',
            lmStudioApiToken: localStorage.getItem('lmStudioApiToken') || '',
            lmStudioMcpIntegrations: localStorage.getItem('lmStudioMcpIntegrations') || ''
        }
    };
}

function hasSavableConnectionPresetData(presetDraft) {
    if (!presetDraft || !presetDraft.data) {
        return false;
    }

    if (presetDraft.type === 'openrouter') {
        return !!presetDraft.data.openRouterApiKey;
    }

    if (presetDraft.type === 'openai-compatible') {
        return !!presetDraft.data.endpoint;
    }

    return !!(presetDraft.data.serverIp && presetDraft.data.serverPort);
}

function buildDefaultConnectionPresetName(provider) {
    const label = CONNECTION_PRESET_TYPE_LABELS[provider] || 'Connection';
    return `${label} ${new Date().toLocaleDateString()}`;
}

function summarizeConnectionPreset(preset) {
    if (preset.type === 'openrouter') {
        return `API key ${maskSecret(preset.data.openRouterApiKey, 8, 4)}`;
    }

    if (preset.type === 'openai-compatible') {
        const endpoint = preset.data.endpoint || 'No endpoint';
        const modelSuffix = preset.data.manualModel ? `, model ${preset.data.manualModel}` : '';
        const keySuffix = preset.data.apiKey ? ', key saved' : ', no key';
        return `${endpoint}${modelSuffix}${keySuffix}`;
    }

    const address = preset.data.serverIp && preset.data.serverPort
        ? `${preset.data.serverIp}:${preset.data.serverPort}`
        : 'No address';
    const tokenSuffix = preset.data.lmStudioApiToken ? ', token saved' : ', no token';
    const mcpCount = countSavedMcpIntegrations(preset.data.lmStudioMcpIntegrations);
    const mcpSuffix = mcpCount > 0 ? `, ${mcpCount} MCP ${mcpCount === 1 ? 'integration' : 'integrations'}` : '';
        return `${address}${tokenSuffix}${mcpSuffix}`;
}

function isPresetCurrentlyApplied(preset) {
    if (!preset) {
        return false;
    }

    if (preset.type !== getActiveConnectionProvider()) {
        return false;
    }

    if (preset.type === 'openrouter') {
        return (localStorage.getItem('openRouterApiKey') || '') === preset.data.openRouterApiKey;
    }

    if (preset.type === 'openai-compatible') {
        return (localStorage.getItem('openAICompatibleEndpoint') || '') === preset.data.endpoint &&
            (localStorage.getItem('openAICompatibleApiKey') || '') === preset.data.apiKey &&
            (localStorage.getItem('openAICompatibleManualModel') || '') === preset.data.manualModel;
    }

    return (localStorage.getItem('serverIp') || '') === preset.data.serverIp &&
        (localStorage.getItem('serverPort') || '') === preset.data.serverPort &&
        (localStorage.getItem('lmStudioApiToken') || '') === preset.data.lmStudioApiToken &&
        (localStorage.getItem('lmStudioMcpIntegrations') || '') === preset.data.lmStudioMcpIntegrations;
}

function showConnectionPresetNotice(message, tone = 'success') {
    showToastNotice({ message, tone, duration: 2400 });
}

function setConnectionPresetsSectionExpanded(isExpanded) {
    const toggleButton = document.getElementById('settings-connection-presets-toggle');
    const content = document.getElementById('settings-connection-presets-content');

    if (!toggleButton || !content) {
        return;
    }

    toggleButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    toggleButton.setAttribute('aria-label', isExpanded ? 'Collapse saved presets' : 'Expand saved presets');
    content.classList.toggle('hidden', !isExpanded);
    content.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');
}

function initializeConnectionPresetsSectionToggle() {
    const toggleButton = document.getElementById('settings-connection-presets-toggle');
    if (!toggleButton || toggleButton.dataset.bound === 'true') {
        return;
    }

    toggleButton.addEventListener('click', () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
        setConnectionPresetsSectionExpanded(!isExpanded);
    });

    toggleButton.dataset.bound = 'true';
    setConnectionPresetsSectionExpanded(false);
}

function updateConnectionPresetSaveState() {
    const saveButton = document.getElementById('save-connection-preset-btn');
    const nameInput = document.getElementById('settings-connection-preset-name');
    const nameHint = document.getElementById('settings-connection-preset-name-hint');

    if (!saveButton || !nameInput) {
        return false;
    }

    const hasName = !!nameInput.value.trim();
    const shouldShowMissingState = nameInput.dataset.touched === 'true' && !hasName;

    saveButton.disabled = !hasName;
    saveButton.setAttribute('aria-disabled', hasName ? 'false' : 'true');

    nameInput.classList.toggle('is-missing', shouldShowMissingState);
    nameInput.setAttribute('aria-invalid', shouldShowMissingState ? 'true' : 'false');

    if (nameHint) {
        nameHint.textContent = shouldShowMissingState
            ? 'Preset name is required before saving.'
            : 'Enter a preset name to enable saving.';
    }

    return hasName;
}

function syncConnectionPresetComposer() {
    const activeTypeLabel = document.getElementById('settings-connection-presets-active-type');
    const helper = document.getElementById('settings-connection-preset-helper');
    const nameInput = document.getElementById('settings-connection-preset-name');
    const saveLabel = document.getElementById('save-connection-preset-label');
    const provider = getActiveConnectionProvider();
    const providerLabel = CONNECTION_PRESET_TYPE_LABELS[provider] || 'Connection';

    if (activeTypeLabel) {
        activeTypeLabel.textContent = providerLabel;
    }

    if (helper) {
        helper.textContent = `Save the active ${providerLabel} setup and reuse it later from this shared list.`;
    }

    if (nameInput) {
        nameInput.placeholder = `Name this ${providerLabel} preset`;
    }

    if (saveLabel) {
        saveLabel.textContent = `Save ${providerLabel}`;
    }

    updateConnectionPresetSaveState();
}

function renderConnectionPresetList() {
    syncConnectionPresetComposer();

    const list = document.getElementById('settings-connection-presets-list');
    const emptyState = document.getElementById('settings-connection-presets-empty-state');
    if (!list || !emptyState) {
        return;
    }

    const presets = getSavedConnectionPresets();
    list.replaceChildren();

    if (presets.length === 0) {
        emptyState.classList.remove('hidden');
        list.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    list.classList.remove('hidden');

    presets.forEach(preset => {
        const item = document.createElement('article');
        item.className = `connection-preset-item${isPresetCurrentlyApplied(preset) ? ' is-current' : ''}`;

        const header = document.createElement('div');
        header.className = 'connection-preset-item-header';

        const titleGroup = document.createElement('div');
        const title = document.createElement('h4');
        title.className = 'connection-preset-item-title';
        title.textContent = preset.name;
        titleGroup.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'connection-preset-item-meta';

        const typeTag = document.createElement('span');
        typeTag.className = 'connection-preset-item-tag';
        typeTag.textContent = CONNECTION_PRESET_TYPE_LABELS[preset.type] || 'Connection';
        meta.appendChild(typeTag);

        if (isPresetCurrentlyApplied(preset)) {
            const currentTag = document.createElement('span');
            currentTag.className = 'connection-preset-item-tag connection-preset-item-tag--current';
            currentTag.textContent = 'Current';
            meta.appendChild(currentTag);
        }

        titleGroup.appendChild(meta);
        header.appendChild(titleGroup);

        const actions = document.createElement('div');
        actions.className = 'connection-preset-actions connection-preset-actions--inline';

        const applyButton = document.createElement('button');
        applyButton.type = 'button';
        applyButton.className = 'connection-preset-action-btn connection-preset-action-btn--compact';
        applyButton.textContent = 'Use';
        applyButton.addEventListener('click', () => {
            applySavedConnectionPreset(preset).catch(error => {
                showConnectionPresetNotice(error?.message || 'Failed to apply preset.', 'error');
            });
        });
        actions.appendChild(applyButton);

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'connection-preset-action-btn connection-preset-action-btn--compact';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            if (typeof _showConnectionPresetEditModal === 'function') {
                _showConnectionPresetEditModal(preset);
                return;
            }

            showConnectionPresetNotice('Preset editor is unavailable right now.', 'error');
        });
        actions.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'connection-preset-action-btn connection-preset-action-btn--danger connection-preset-action-btn--compact';
        deleteButton.textContent = 'Del';
        deleteButton.addEventListener('click', () => {
            showDeleteConnectionPresetModal(preset);
        });
        actions.appendChild(deleteButton);

        header.appendChild(actions);
        item.appendChild(header);

        const summary = document.createElement('p');
        summary.className = 'connection-preset-summary';
        summary.textContent = summarizeConnectionPreset(preset);
        item.appendChild(summary);

        list.appendChild(item);
    });
}

function showDeleteConnectionPresetModal(preset) {
    const modal = document.getElementById('delete-connection-preset-modal');
    const message = document.getElementById('delete-connection-preset-message');
    if (!modal || !preset || !preset.id) {
        return;
    }

    _pendingConnectionPresetDeletion = preset;

    if (message) {
        const safeName = typeof preset.name === 'string' && preset.name.trim()
            ? preset.name.trim()
            : 'this preset';
        message.textContent = `Delete \"${safeName}\"? This cannot be undone.`;
    }

    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function hideDeleteConnectionPresetModal() {
    const modal = document.getElementById('delete-connection-preset-modal');
    if (!modal) {
        _pendingConnectionPresetDeletion = null;
        return;
    }

    modal.classList.add('hidden');
    modal.style.display = 'none';
    _pendingConnectionPresetDeletion = null;
}

function confirmDeleteConnectionPreset() {
    const targetPreset = _pendingConnectionPresetDeletion;
    if (!targetPreset || !targetPreset.id) {
        hideDeleteConnectionPresetModal();
        return;
    }

    const deleted = deleteConnectionPreset(targetPreset.id);
    hideDeleteConnectionPresetModal();

    if (!deleted) {
        showConnectionPresetNotice('Failed to delete preset.', 'error');
        return;
    }

    renderConnectionPresetList();
    showConnectionPresetNotice(`Deleted ${targetPreset.name}.`);
}

function initializeDeleteConnectionPresetModal() {
    const modal = document.getElementById('delete-connection-preset-modal');
    const cancelButton = document.getElementById('cancel-delete-connection-preset');
    const closeButton = document.getElementById('close-delete-connection-preset-modal');
    const confirmButton = document.getElementById('confirm-delete-connection-preset');

    if (!modal || !cancelButton || !closeButton || !confirmButton) {
        return;
    }

    cancelButton.addEventListener('click', event => {
        event.preventDefault();
        hideDeleteConnectionPresetModal();
    });

    closeButton.addEventListener('click', event => {
        event.preventDefault();
        hideDeleteConnectionPresetModal();
    });

    confirmButton.addEventListener('click', event => {
        event.preventDefault();
        confirmDeleteConnectionPreset();
    });

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            hideDeleteConnectionPresetModal();
        }
    });
}

function revealConnectionPresetList() {
    const wrapper = document.getElementById('settings-content-wrapper');
    const list = document.getElementById('settings-connection-presets-list');
    if (!wrapper || !list || list.classList.contains('hidden')) {
        return;
    }

    requestAnimationFrame(() => {
        const wrapperRect = wrapper.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        const footerTop = document.getElementById('settings-navigation-buttons')?.getBoundingClientRect().top ?? wrapperRect.bottom;
        const visibleBottom = Math.min(wrapperRect.bottom, footerTop) - 12;

        if (listRect.top < wrapperRect.top + 12) {
            wrapper.scrollTop -= wrapperRect.top + 12 - listRect.top;
        } else if (listRect.top > visibleBottom || listRect.bottom > visibleBottom) {
            wrapper.scrollTop += listRect.top - wrapperRect.top - 12;
        }
    });
}

async function applySavedConnectionPreset(preset, { showNotice = true } = {}) {
    if (!preset || !preset.type || !preset.data) {
        throw new Error('The selected preset is invalid.');
    }

    if (preset.type === 'local') {
        const ipInput = document.getElementById('server-ip');
        const portInput = document.getElementById('server-port');
        const tokenInput = document.getElementById('lmstudio-api-token');

        if (ipInput) {
            ipInput.value = preset.data.serverIp || '';
        }
        if (portInput) {
            portInput.value = preset.data.serverPort || '';
        }
        if (tokenInput) {
            tokenInput.value = preset.data.lmStudioApiToken || '';
        }

        localStorage.setItem('serverIp', preset.data.serverIp || '');
        localStorage.setItem('serverPort', preset.data.serverPort || '');
        if (preset.data.lmStudioMcpIntegrations) {
            localStorage.setItem('lmStudioMcpIntegrations', preset.data.lmStudioMcpIntegrations);
        } else {
            localStorage.removeItem('lmStudioMcpIntegrations');
        }

        setLMStudioApiToken(preset.data.lmStudioApiToken || '');
        applyConnectionProviderSelection('local');
        saveServerSettings();
    } else if (preset.type === 'openrouter') {
        setOpenRouterApiKey(preset.data.openRouterApiKey || '');
        applyConnectionProviderSelection('openrouter');
        await fetchAvailableModels().catch(() => []);
    } else {
        const endpointInput = document.getElementById('openai-compatible-endpoint');
        const keyInput = document.getElementById('openai-compatible-api-key');
        const modelInput = document.getElementById('openai-compatible-model-name');

        if (endpointInput) {
            endpointInput.value = preset.data.endpoint || '';
        }
        if (keyInput) {
            keyInput.value = preset.data.apiKey || '';
        }
        if (modelInput) {
            modelInput.value = preset.data.manualModel || '';
        }

        setOpenAICompatibleEndpoint(preset.data.endpoint || '');
        setOpenAICompatibleApiKey(preset.data.apiKey || '');

        if (preset.data.manualModel) {
            localStorage.setItem('openAICompatibleManualModel', preset.data.manualModel);
            localStorage.setItem('openAICompatibleSelectedModel', preset.data.manualModel);
            window.currentLoadedModel = preset.data.manualModel;
        } else {
            localStorage.removeItem('openAICompatibleManualModel');
            localStorage.removeItem('openAICompatibleSelectedModel');
        }

        applyConnectionProviderSelection('openai-compatible');
        await fetchAvailableModels().catch(() => []);
    }

    updateConnectionStatusDisplays();
    renderConnectionPresetList();
    if (showNotice) {
        showConnectionPresetNotice(`Applied ${preset.name}.`);
    }
}

function initializeConnectionPresetList() {
    initializeConnectionPresetsSectionToggle();

    const saveButton = document.getElementById('save-connection-preset-btn');
    const nameInput = document.getElementById('settings-connection-preset-name');
    const providerButtons = [
        document.getElementById('select-local-server'),
        document.getElementById('select-openrouter'),
        document.getElementById('select-openai-compatible')
    ].filter(Boolean);

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const presetDraft = getCurrentConnectionPresetDraft();

            if (requestConnectionPresetPremiumAccess(presetDraft.type)) {
                return;
            }

            if (!hasSavableConnectionPresetData(presetDraft)) {
                showConnectionPresetNotice(`Configure the active ${CONNECTION_PRESET_TYPE_LABELS[presetDraft.type] || 'connection'} before saving a preset.`, 'error');
                return;
            }

            try {
                const presetName = nameInput?.value.trim() || '';
                if (!presetName) {
                    if (nameInput) {
                        nameInput.dataset.touched = 'true';
                        updateConnectionPresetSaveState();
                        nameInput.focus();
                    }
                    showConnectionPresetNotice('Preset name is required before saving.', 'error');
                    return;
                }

                const savedPreset = saveConnectionPreset({
                    name: presetName,
                    type: presetDraft.type,
                    data: presetDraft.data
                });

                if (nameInput) {
                    nameInput.dataset.touched = 'false';
                    nameInput.value = '';
                }

                updateConnectionPresetSaveState();

                renderConnectionPresetList();
                revealConnectionPresetList();
                showConnectionPresetNotice(`Saved ${savedPreset.name}.`);
            } catch (error) {
                showConnectionPresetNotice(error?.message || 'Failed to save preset.', 'error');
            }
        });
    }

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            nameInput.dataset.touched = 'true';
            updateConnectionPresetSaveState();
        });

        nameInput.addEventListener('blur', () => {
            nameInput.dataset.touched = 'true';
            updateConnectionPresetSaveState();
        });

        nameInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                nameInput.dataset.touched = 'true';
                if (!updateConnectionPresetSaveState()) {
                    showConnectionPresetNotice('Preset name is required before saving.', 'error');
                    nameInput.focus();
                    return;
                }
                saveButton?.click();
            }
        });
    }

    providerButtons.forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(() => {
                renderConnectionPresetList();
            }, 0);
        });
    });

    renderConnectionPresetList();
    updateConnectionPresetSaveState();
}



/**
 * Shows the LM Studio MCP integration modal
 */
export function showLmMcpModal() {
    const lmMcpModal = document.getElementById('lmstudio-mcp-input-modal');
    const addMcpIntegrationBtn = document.getElementById('add-lmstudio-mcp-integration-btn');
    if (lmMcpModal) {
        // We need to ensure loadWorkingMcpIntegrations and showInputModal are accessible
        // They are currently defined inside initializeSettingsModal, which is problematic.
        // Actually, for now, I will just trigger the click on the button if it exists,
        // or I will have to refactor those functions to be top-level as well.
        
        const configBtn = document.getElementById('configure-lmstudio-mcp-btn');
        if (configBtn) {
            configBtn.click();
        }
    }
}

/**
 * Shows the settings modal
 */
export async function showSettingsModal() {
    if (!settingsModal) return;

    _currentSettingsStep = 'connection';

    debugLog('Opening settings modal');

    // Initialize TTS voice selection
    import('./settings-manager.js').then(module => {
        module.initializeTTSVoiceSelection().catch(error => {
            console.error('Error initializing TTS voice selection:', error);
        });
        // Ensure biometric setting event listener is attached
        // This is needed because the checkbox may not exist in DOM during initial loadSettings()
        module.loadBiometricSetting();
    });

    // Dynamically update biometric setting visibility based on current support, debug mode, and premium status
    const biometricContainer = document.getElementById('biometric-setting-container');
    if (biometricContainer) {
        let isBiometricSupported = false;
        const biometricBridge = getBiometricBridge();
        
        // Check premium status - premium users should always see the biometric option
        const isPremium = typeof window.hasPremiumAccess === 'function'
            ? window.hasPremiumAccess()
            : (window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus());
        
        // Detailed logging to diagnose visibility issue
        console.log('[Biometric Debug] Settings modal opened');
        console.log('[Biometric Debug] Bridge found:', !!biometricBridge);
        console.log('[Biometric Debug] window.isDebugMode:', window.isDebugMode);
        console.log('[Biometric Debug] getDebugEnabled():', getDebugEnabled());
        console.log('[Biometric Debug] isPremium:', isPremium);
        
        try {
            if (biometricBridge && typeof biometricBridge.isBiometricSupported === 'function') {
                isBiometricSupported = !!biometricBridge.isBiometricSupported();
                console.log('[Biometric Debug] isBiometricSupported() returned:', isBiometricSupported);
            } else {
                console.log('[Biometric Debug] Bridge missing or isBiometricSupported not a function');
            }
        } catch (error) {
            console.warn('[Biometric Debug] isBiometricSupported check failed:', error);
        }
        
        // Show biometric setting if:
        // 1. Device supports biometrics, OR
        // 2. User is premium (they paid for the feature), OR  
        // 3. Debug mode is enabled (for testing)
        const shouldShow = isBiometricSupported || isPremium || window.isDebugMode || getDebugEnabled();
        console.log('[Biometric Debug] Should show biometric container:', shouldShow);
        
        if (shouldShow) {
            biometricContainer.style.display = 'block';
        } else {
            biometricContainer.style.display = 'none';
        }
    }

    // Blur any active element to prevent keyboard from showing
    if (document.activeElement) {
        document.activeElement.blur();
    }

    // Add modal-open class to html and body to help with touch handling
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // Reset the modal state to ensure it opens correctly
    resetModalState();

    // Initialize step indicators for the first step
    updateStepIndicators('connection');
    updateSystemPromptPremiumState();

    // Ensure any previous hide animation is canceled
    settingsModal.classList.remove('hide');

    // Remove hidden class first to start the transition
    settingsModal.classList.remove('hidden');

    // Prevent scrolling of the body
    document.body.style.overflow = 'hidden';

    // Get both modal container and content and ensure styles don't conflict
    const modalContent = settingsModal.querySelector('.modal-content');
    
    // Clean up any inline styles on the modal container itself
    ['position', 'top', 'left', 'right', 'bottom', 'transform', 'width', 'height', 'margin', 'display', 'align-items', 'justify-content'].forEach(prop => {
        settingsModal.style.removeProperty(prop);
    });
    
    if (modalContent) {
        // Remove any inline styles that might be overriding our CSS
        ['background-color', 'position', 'z-index', 'opacity', 'transform', 'transition', 
         'width', 'max-width', 'height', 'max-height', 'top', 'left', 'right', 'bottom', 'margin'].forEach(prop => {
            modalContent.style.removeProperty(prop);
        });
        
        // Remove any mobile-specific classes that might conflict
        modalContent.classList.remove('mobile-modal');
    }



    // Add show class for animation (force reflow first so fade-in transition fires)
    void settingsModal.offsetHeight;
    settingsModal.classList.add('show');

    // Refresh the connection status displays with current saved values
    updateConnectionStatusDisplays();
    setConnectionPresetsSectionExpanded(false);
    renderConnectionPresetList();

    // Always use mobile/tablet stepped navigation for all device types
    {
            // Mobile/tablet view - show first step and its navigation buttons
            const connectionStep = document.getElementById('settings-step-connection');
            if (connectionStep) {
                connectionStep.classList.remove('hidden');
                connectionStep.classList.add('active');
            }

            // Make sure all other steps are hidden
            const promptStep = document.getElementById('settings-step-prompt');
            const optionsStep = document.getElementById('settings-step-options');
            const fontStep = document.getElementById('settings-step-font');
            const actionsStep = document.getElementById('settings-step-actions');

            [promptStep, optionsStep, fontStep, actionsStep].forEach(step => {
                if (step) {
                    step.classList.add('hidden');
                    step.classList.remove('active', 'slide-in-right', 'slide-in-left');
                }
            });

            // Show connection step buttons
            const connectionButtons = document.getElementById('connection-step-buttons');
            const promptButtons = document.getElementById('prompt-step-buttons');
            const optionsButtons = document.getElementById('options-step-buttons');
            const fontButtons = document.getElementById('font-step-buttons');
            const actionsButtons = document.getElementById('actions-step-buttons');

            // Hide all button containers first
            [promptButtons, optionsButtons, fontButtons, actionsButtons].forEach(container => {
                if (container) {
                    container.classList.add('hidden');
                }
            });

        // Show connection buttons
        if (connectionButtons) {
            connectionButtons.classList.remove('hidden');
        }
    }
}

/**
 * Hides the settings modal
 */
export function hideSettingsModal() {
    if (!settingsModal) return;

    proceedWithHideSettingsModal();
}

/**
 * Proceeds with hiding the settings modal after all validations are complete.
 * Handles the animation and cleanup.
 */
function proceedWithHideSettingsModal() {
    // Get the modal content for animation
    const modalContent = settingsModal.querySelector('.modal-content');

    // Add hide class for animation
    settingsModal.classList.remove('show');
    settingsModal.classList.add('hide');

    // Remove modal-open class from html and body
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');

    // Re-enable scrolling
    document.body.style.overflow = 'auto';

    // After animation completes, hide the modal
    setTimeout(() => {
        settingsModal.classList.add('hidden');

        // Reset the modal state for next opening
        resetModalState();

        // Reset any inline styles that might have been added
        if (modalContent) {
            ['opacity', 'transform', 'transition', 'position', 'top', 'left', 'right', 'bottom', 'width', 'max-width', 'height', 'max-height', 'margin'].forEach(prop => {
                modalContent.style.removeProperty(prop);
            });
            modalContent.classList.remove('mobile-modal');
        }
        
        // Also clean the modal container
        ['position', 'top', 'left', 'right', 'bottom', 'transform', 'width', 'height', 'margin', 'display', 'align-items', 'justify-content'].forEach(prop => {
            settingsModal.style.removeProperty(prop);
        });

        // Check if welcome message should be shown
        checkAndShowWelcomeMessage();

        if (_openModelInfoAfterSettingsClose) {
            _openModelInfoAfterSettingsClose = false;
            import('./model-manager.js').then(module => {
                if (typeof module.showModelModal === 'function') {
                    module.showModelModal();
                }
            }).catch(error => {
                console.error('Failed to open Model Information modal after OpenRouter key update:', error);
            });
        }
    }, 400);
}

/**
 * Updates the step indicators in the settings modal
 * @param {string} currentStep - The current active step ('connection', 'prompt', 'options', or 'actions')
 */
export function updateStepIndicators(currentStep) {
    // Get all step indicators
    const stepIndicators = {
        connection: document.getElementById('step-indicator-1'),
        options: document.getElementById('step-indicator-2'),
        prompt: document.getElementById('step-indicator-3'),
        font: document.getElementById('step-indicator-4'),
        actions: document.getElementById('step-indicator-5')
    };

    // Reset all indicators to gray
    Object.values(stepIndicators).forEach(indicator => {
        if (indicator) {
            indicator.classList.remove('bg-blue-500');
            indicator.classList.add('bg-gray-600');
        }
    });

    // Set the current step indicator to blue
    if (stepIndicators[currentStep]) {
        stepIndicators[currentStep].classList.remove('bg-gray-600');
        stepIndicators[currentStep].classList.add('bg-blue-500');
    }

    // Update the page subtitle
    const subtitleEl = document.getElementById('settings-step-subtitle');
    if (subtitleEl) {
        const subtitles = {
            connection: 'Server Connection',
            options: 'Options',
            prompt: 'System Prompt',
            font: 'Font & Layout',
            actions: 'Actions'
        };
        subtitleEl.textContent = subtitles[currentStep] || '';
    }
}

/**
 * Initializes the settings modal navigation for mobile/tablet and desktop
 */
export function initializeSettingsModalNavigation() {
    // Get all step navigation buttons
    const toPromptBtn = document.getElementById('to-prompt-step-btn');
    const backToConnectionBtn = document.getElementById('back-to-connection-btn');
    const toOptionsBtn = document.getElementById('to-options-step-btn');
    const backToPromptBtn = document.getElementById('back-to-prompt-btn');
    const toFontBtn = document.getElementById('to-font-step-btn');
    const backToOptionsBtn = document.getElementById('back-to-options-btn');
    const toActionsBtn = document.getElementById('to-actions-step-btn');
    const backToFontBtn = document.getElementById('back-to-font-btn');

    // Get all steps
    const steps = {
        connection: document.getElementById('settings-step-connection'),
        prompt: document.getElementById('settings-step-prompt'),
        options: document.getElementById('settings-step-options'),
        font: document.getElementById('settings-step-font'),
        actions: document.getElementById('settings-step-actions')
    };

    // We'll handle desktop view directly in the steps

    // Function to show a specific step
    function showStep(stepName, direction = null) {
        // Expose to module scope so hideSettingsModal can use it
        _navigateToStep = showStep;
        _currentSettingsStep = stepName;
        // Get current active step
        const currentActiveStep = document.querySelector('.settings-step.active');
        const currentStepName = currentActiveStep ? currentActiveStep.getAttribute('data-step-name').toLowerCase() : '';

        // Always use stepped navigation regardless of screen size
        // Removed desktop-specific logic that showed all steps at once

        // For mobile/tablet view, show only the selected step
        // Hide all steps
        Object.values(steps).forEach(step => {
            if (step) {
                step.classList.add('hidden');
                step.classList.remove('active', 'slide-in-right', 'slide-in-left');
            }
        });

        // Show the requested step with animation
        if (steps[stepName]) {
            steps[stepName].classList.remove('hidden');
            steps[stepName].classList.add('active');

            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) {
                settingsModal.classList.toggle('settings-actions-compact', stepName === 'actions');
            }

            if (direction === 'right') {
                steps[stepName].classList.add('slide-in-right');
            } else if (direction === 'left') {
                steps[stepName].classList.add('slide-in-left');
            }

            // Update navigation buttons visibility
            updateNavigationButtons(stepName);

            // Update step indicators
            updateStepIndicators(stepName);

            // Removed automatic focus on inputs to prevent mobile keyboard from appearing
            // This prevents the keyboard from automatically showing up on mobile devices
        }
    }

    // Function to update step indicators
    function updateStepIndicators(currentStep) {
        // Get all step indicators
        const stepIndicators = {
            connection: document.getElementById('step-indicator-1'),
            options: document.getElementById('step-indicator-2'),
            prompt: document.getElementById('step-indicator-3'),
            font: document.getElementById('step-indicator-4'),
            actions: document.getElementById('step-indicator-5')
        };

        // Reset all indicators to gray
        Object.values(stepIndicators).forEach(indicator => {
            if (indicator) {
                indicator.classList.remove('bg-blue-500');
                indicator.classList.add('bg-gray-600');
            }
        });

        // Set the current step indicator to blue
        if (stepIndicators[currentStep]) {
            stepIndicators[currentStep].classList.remove('bg-gray-600');
            stepIndicators[currentStep].classList.add('bg-blue-500');
        }

        // Update the page subtitle
        const subtitleEl = document.getElementById('settings-step-subtitle');
        if (subtitleEl) {
            const subtitles = {
                connection: 'Server Connection',
                options: 'Options',
                prompt: 'System Prompt',
                font: 'Font & Layout',
                actions: 'Actions'
            };
            subtitleEl.textContent = subtitles[currentStep] || '';
        }
    }

    // Function to update navigation buttons visibility based on current step
    function updateNavigationButtons(currentStep) {
        // Get all navigation button containers
        const connectionButtons = document.getElementById('connection-step-buttons');
        const promptButtons = document.getElementById('prompt-step-buttons');
        const optionsButtons = document.getElementById('options-step-buttons');
        const fontButtons = document.getElementById('font-step-buttons');
        const actionsButtons = document.getElementById('actions-step-buttons');

        // Hide all button containers first
        [connectionButtons, promptButtons, optionsButtons, fontButtons, actionsButtons].forEach(container => {
            if (container) {
                container.classList.add('hidden');
            }
        });

        // Show the appropriate button container based on current step
        switch (currentStep) {
            case 'connection':
                if (connectionButtons) connectionButtons.classList.remove('hidden');
                break;
            case 'prompt':
                if (promptButtons) promptButtons.classList.remove('hidden');
                break;
            case 'options':
                if (optionsButtons) optionsButtons.classList.remove('hidden');
                break;
            case 'font':
                if (fontButtons) fontButtons.classList.remove('hidden');
                break;
            case 'actions':
                if (actionsButtons) actionsButtons.classList.remove('hidden');
                break;
        }
    }

    // Add event listeners for navigation buttons with improved handling for tablets
    const addButtonEventListener = (button, stepName, direction) => {
        if (!button) return;

        // Remove any existing event listeners by cloning and replacing
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        // Function to handle navigation
        const navigateToStep = (e) => {
            // Only prevent default if the event is cancelable
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();

            // Blur any active element to prevent keyboard from showing
            if (document.activeElement) {
                document.activeElement.blur();
            }

            debugLog(`Navigation to step: ${stepName}, direction: ${direction}`);
            showStep(stepName, direction);

            // Add a small delay to ensure the DOM updates before allowing next click
            disableNavigation();
            setTimeout(enableNavigation, 300);
        };

        // Add click event with proper handling
        newButton.addEventListener('click', navigateToStep);

        // Add touchstart event for better tablet support
        newButton.addEventListener('touchstart', (e) => {
            // Mark this element as touched to prevent duplicate events
            newButton.dataset.touched = 'true';
        }, { passive: true });

        // Add touchend event for better tablet support
        newButton.addEventListener('touchend', (e) => {
            // Only proceed if this was the element that received touchstart
            if (newButton.dataset.touched === 'true') {
                // Reset the touched state
                newButton.dataset.touched = 'false';
                navigateToStep(e);
            }
        }, { passive: false });

        // Add keyboard event for better accessibility
        newButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateToStep(e);
            }
        });

        // Return the new button reference
        return newButton;
    };

    // Apply the improved event listeners to all navigation buttons
    addButtonEventListener(toOptionsBtn, 'options', 'right');
    addButtonEventListener(backToConnectionBtn, 'connection', 'left');
    addButtonEventListener(toPromptBtn, 'prompt', 'right');
    addButtonEventListener(backToOptionsBtn, 'options', 'left');
    addButtonEventListener(toFontBtn, 'font', 'right');
    addButtonEventListener(backToPromptBtn, 'prompt', 'left');
    addButtonEventListener(toActionsBtn, 'actions', 'right');
    addButtonEventListener(backToFontBtn, 'font', 'left');

    // Initialize with stepped navigation for all screen sizes
    showStep('connection');

    // Handle window resize to toggle between mobile and desktop views
    window.addEventListener('resize', () => {
        const navButtons = document.getElementById('settings-navigation-buttons');
        const activeStep = document.querySelector('#settings-modal .settings-step.active');
        const stepToShow = activeStep?.getAttribute('data-step-name')?.toLowerCase() || _currentSettingsStep || 'connection';
        
        // Clear any conflicting inline styles on resize
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            // Clean modal container styles
            ['position', 'top', 'left', 'right', 'bottom', 'transform', 'width', 'height', 'margin', 'display', 'align-items', 'justify-content'].forEach(prop => {
                settingsModal.style.removeProperty(prop);
            });
            
            const modalContent = settingsModal.querySelector('.modal-content');
            if (modalContent) {
                // Remove any inline styles that might interfere with CSS responsive design
                ['position', 'top', 'left', 'right', 'bottom', 'transform', 'width', 'max-width', 'height', 'max-height', 'margin'].forEach(prop => {
                    modalContent.style.removeProperty(prop);
                });
                modalContent.classList.remove('mobile-modal');
            }
        }

        // Preserve the current step across viewport changes such as Android IME open/close.
        showStep(stepToShow);

        // Show navigation buttons on all screen sizes
        if (navButtons) {
            navButtons.classList.remove('hidden');
        }
    });
}

export function navigateSettingsModalToStep(stepName = 'connection') {
    if (typeof _navigateToStep === 'function') {
        _navigateToStep(stepName);
        return true;
    }

    _currentSettingsStep = stepName;
    return false;
}

/**
 * Navigates the settings modal directly to the TTS voice selection section
 */
export function navigateToTTS() {
    // Navigate to options step where TTS settings reside
    navigateSettingsModalToStep('options');

    // Small delay to ensure the DOM is updated and visible before scrolling
    setTimeout(() => {
        const ttsSelect = document.getElementById('tts-voice-select');
        const optionsStep = document.getElementById('settings-step-options');
        
        if (ttsSelect && optionsStep) {
            // Scroll the settings item into view
            const settingsItem = ttsSelect.closest('.settings-item');
            if (settingsItem) {
                settingsItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Add a brief highlight effect
                settingsItem.style.transition = 'background-color 0.5s ease';
                settingsItem.style.backgroundColor = 'rgba(96, 165, 250, 0.15)';
                setTimeout(() => {
                    settingsItem.style.backgroundColor = '';
                }, 2000);
            }
        }
    }, 400);
}

// Helper functions to disable/enable navigation
function disableNavigation() {
    // Disable all navigation buttons to prevent accidental navigation
    const navigationButtons = document.querySelectorAll('[id^="to-"], [id^="back-to-"]');
    navigationButtons.forEach(btn => {
        btn.setAttribute('disabled', 'true');
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
    });
}

function enableNavigation() {
    // Re-enable all navigation buttons
    const navigationButtons = document.querySelectorAll('[id^="to-"], [id^="back-to-"]');
    navigationButtons.forEach(btn => {
        btn.removeAttribute('disabled');
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
    });
}

/**
 * Resets the modal state to ensure it opens correctly next time
 */
function resetModalState() {
    _currentSettingsStep = 'connection';

    if (settingsModal) {
        settingsModal.classList.remove('settings-actions-compact');
    }

    // Get all steps
    const steps = {
        connection: document.getElementById('settings-step-connection'),
        prompt: document.getElementById('settings-step-prompt'),
        options: document.getElementById('settings-step-options'),
        font: document.getElementById('settings-step-font'),
        actions: document.getElementById('settings-step-actions')
    };

    // Get all navigation button containers
    const connectionButtons = document.getElementById('connection-step-buttons');
    const promptButtons = document.getElementById('prompt-step-buttons');
    const optionsButtons = document.getElementById('options-step-buttons');
    const fontButtons = document.getElementById('font-step-buttons');
    const actionsButtons = document.getElementById('actions-step-buttons');

    // For mobile/tablet view, reset to first step
    if (window.innerWidth < 1024) {
        // Hide all steps except the first one
        Object.entries(steps).forEach(([key, step]) => {
            if (step) {
                if (key === 'connection') {
                    // First step should be visible
                    step.classList.remove('hidden');
                    step.classList.add('active');
                } else {
                    // Other steps should be hidden
                    step.classList.add('hidden');
                    step.classList.remove('active', 'slide-in-right', 'slide-in-left');
                }
            }
        });

        // Hide all button containers except the first one
        [promptButtons, optionsButtons, fontButtons, actionsButtons].forEach(container => {
            if (container) {
                container.classList.add('hidden');
            }
        });

        // Show connection buttons
        if (connectionButtons) {
            connectionButtons.classList.remove('hidden');
        }
    }
}

/**
 * Handles manual focus for input fields to prevent automatic keyboard popup on mobile
 */
function initializeManualInputFocus() {
    if (!settingsModal) return;

    // Function to set up input field focus handling
    const setupInputFocusHandling = () => {
        // Get all text input fields, textareas, and selects in the settings modal
        const textInputs = settingsModal.querySelectorAll('input[type="text"], input[type="number"], input[type="email"], input[type="password"], textarea, select');

        // Find system prompt textarea specifically
        const systemPromptTextarea = document.getElementById('system-prompt');

        // Add special handling for system prompt textarea
        if (systemPromptTextarea && !systemPromptTextarea.dataset.focusHandlerAttached) {
            systemPromptTextarea.dataset.focusHandlerAttached = 'true';

            // Handle both touchstart and mousedown events to capture all interactions
            ['touchstart', 'mousedown', 'focus'].forEach(eventType => {
                systemPromptTextarea.addEventListener(eventType, function(e) {
                    // Only prevent default if the event is cancelable
                    if (e.cancelable) {
                        e.preventDefault();
                    }
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    // Disable navigation before showing keyboard
                    disableNavigation();

                    // Save current scroll positions
                    const modalScrollTop = this.closest('.settings-step').scrollTop;
                    const windowScrollTop = window.scrollY;

                    // Enable user interaction by adding the focus-enabled class
                    this.classList.add('focus-enabled');

                    // Focus the textarea after a very short delay
                    setTimeout(() => {
                        this.focus();

                        // Restore scroll positions to prevent jumps
                        this.closest('.settings-step').scrollTop = modalScrollTop;
                        window.scrollTo(0, windowScrollTop);
                    }, 10);
                }, { passive: false, capture: true });
            });

            // Re-enable navigation when focus is lost
            systemPromptTextarea.addEventListener('blur', function() {
                // Remove the focus-enabled class
                this.classList.remove('focus-enabled');

                // Re-enable navigation after a small delay
                setTimeout(enableNavigation, 300);
            }, { passive: false, capture: true });
        }

        // Process all other input fields with standard handling
        textInputs.forEach(input => {
            // Skip if this input already has our custom handler
            if (input.dataset.focusHandlerAttached === 'true') return;

            // Skip the system prompt as it has special handling
            if (input.id === 'system-prompt') return;

            // Skip checkboxes completely to ensure toggle switches work
            if (input.type === 'checkbox') return;

            // Mark this input as having our handler attached
            input.dataset.focusHandlerAttached = 'true';

            // Add click event to manually handle focus
            input.addEventListener('click', function(e) {
                // Prevent default behavior
                e.preventDefault();
                e.stopPropagation();

                // Add the focus-enabled class to allow focus
                this.classList.add('focus-enabled');

                // Use setTimeout to focus the element after adding the class
                setTimeout(() => {
                    this.focus();
                }, 10);

                // Set a timeout to remove the class after the user has finished interacting
                setTimeout(() => {
                    this.classList.remove('focus-enabled');
                }, 10000); // 10 seconds should be enough time for user input
            });

            // Add focus event listener for mobile scroll handling
            input.addEventListener('focus', function(e) {
                // On mobile, scroll the input into view when keyboard appears
                if (window.matchMedia('(max-width: 767px)').matches) {
                    setTimeout(() => {
                        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300); // Wait for keyboard to appear
                }
            });
        });
    };

    // Initial setup
    setupInputFocusHandling();

    // Also set up a mutation observer to handle dynamically added inputs
    const observer = new MutationObserver(setupInputFocusHandling);

    // Start observing the modal for DOM changes
    observer.observe(settingsModal, {
        childList: true,
        subtree: true
    });
}

/**
 * Initialize and handle the system prompt overlay editor
 */
function initializeSystemPromptOverlay() {
    // Get all elements
    const overlay = document.getElementById('system-prompt-overlay');
    const modalContent = overlay?.querySelector('.modal-content');
    const editButton = document.getElementById('edit-system-prompt-btn');
    const cancelButton = document.getElementById('cancel-system-prompt-edit');
    const saveButton = document.getElementById('save-system-prompt-edit');
    const closeButton = document.getElementById('close-system-prompt-overlay');
    const editor = document.getElementById('system-prompt-editor');
    const hiddenTextarea = document.getElementById('system-prompt');
    const previewDiv = document.getElementById('system-prompt-preview');
    const placeholderSpan = document.getElementById('prompt-placeholder');
    const improveButton = document.getElementById('improve-system-prompt-btn');
    const editorSection = editor?.closest('.mb-6.flex-1.flex.flex-col');
    const footerSection = saveButton?.closest('.flex.justify-between');


    if (!overlay || !editButton || !cancelButton || !saveButton || !editor || !hiddenTextarea || !previewDiv) {
        debugLog('System prompt overlay elements not found');
        return;
    }

    let overlayHideTimer = null;

    // Ensure the overlay is hidden on initialization
    overlay.classList.add('hidden');
    overlay.style.display = 'none';



    function getVisibleOverlayViewportMetrics() {
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

    function getVisibleOverlayViewportHeight() {
        return getVisibleOverlayViewportMetrics().height;
    }

    function applyOverlayKeyboardLayout(keyboardVisible, viewportMetrics = getVisibleOverlayViewportMetrics()) {
        if (!overlay || !modalContent || !editor) {
            return;
        }

        const {
            height: currentHeight,
            width: currentWidth,
            offsetTop,
            offsetLeft
        } = viewportMetrics;

        if (keyboardVisible) {
            const verticalPadding = currentHeight < 520 ? 12 : 16;
            const modalHeight = Math.max(220, currentHeight - verticalPadding);

            overlay.classList.add('keyboard-visible');
            overlay.style.height = `${currentHeight}px`;
            overlay.style.maxHeight = `${currentHeight}px`;
            overlay.style.width = `${currentWidth}px`;
            overlay.style.maxWidth = `${currentWidth}px`;
            overlay.style.position = 'fixed';
            overlay.style.top = `${offsetTop}px`;
            overlay.style.left = `${offsetLeft}px`;
            overlay.style.right = 'auto';
            overlay.style.bottom = 'auto';
            overlay.style.alignItems = 'stretch';
            overlay.style.justifyContent = 'flex-start';

            modalContent.style.height = `${modalHeight}px`;
            modalContent.style.maxHeight = `${modalHeight}px`;
            modalContent.style.margin = '0 auto auto';
            modalContent.style.flex = '0 1 auto';

            if (editorSection) {
                editorSection.style.minHeight = '0';
                editorSection.style.flex = '1 1 auto';
                editorSection.style.overflow = 'hidden';
            }

            if (footerSection) {
                footerSection.style.flexShrink = '0';
            }

            editor.style.flex = '1 1 auto';
            editor.style.height = 'auto';
            editor.style.minHeight = '96px';
            editor.style.maxHeight = 'none';
            editor.style.overflowY = 'auto';
        } else {
            overlay.classList.remove('keyboard-visible');
            overlay.style.height = '';
            overlay.style.maxHeight = '';
            overlay.style.width = '';
            overlay.style.maxWidth = '';
            overlay.style.position = '';
            overlay.style.top = '';
            overlay.style.left = '';
            overlay.style.right = '';
            overlay.style.bottom = '';
            overlay.style.alignItems = '';
            overlay.style.justifyContent = '';

            modalContent.style.height = '';
            modalContent.style.maxHeight = '';
            modalContent.style.margin = '';
            modalContent.style.flex = '';

            if (editorSection) {
                editorSection.style.minHeight = '';
                editorSection.style.flex = '';
                editorSection.style.overflow = '';
            }

            if (footerSection) {
                footerSection.style.flexShrink = '';
            }

            editor.style.flex = '';
            editor.style.minHeight = '';
            editor.style.maxHeight = '';
            editor.style.overflowY = '';
        }
    }

    // Function to detect mobile keyboard visibility with improved handling
    function setupMobileKeyboardDetection() {
        if (!isAndroidWebView() && !window.matchMedia('(max-width: 767px)').matches) {
            return; // Only apply on mobile-sized layouts or Android WebView
        }

        let keyboardVisible = false;
        let initialViewportHeight = window.innerHeight;
        let resizeTimeout;

        function handleViewportChange() {
            // Clear any existing timeout
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            // Add a small delay to ensure we get the final viewport size
            resizeTimeout = setTimeout(() => {
                const viewportMetrics = getVisibleOverlayViewportMetrics();
                const currentHeight = viewportMetrics.height;
                const heightDifference = initialViewportHeight - currentHeight;

                // Consider keyboard visible if viewport height decreased by more than 150px
                const shouldShowKeyboard = heightDifference > 150;

                if (shouldShowKeyboard !== keyboardVisible) {
                    keyboardVisible = shouldShowKeyboard;

                    if (keyboardVisible) {
                        applyOverlayKeyboardLayout(true, viewportMetrics);
                    } else {
                        applyOverlayKeyboardLayout(false, viewportMetrics);
                    }
                } else if (keyboardVisible) {
                    applyOverlayKeyboardLayout(true, viewportMetrics);
                }

                adjustTextareaHeight();
            }, 100);
        }

        // Use Visual Viewport API if available (better for mobile)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        } else {
            // Fallback to window resize
            window.addEventListener('resize', handleViewportChange);
        }

        // Clean up function
        return function cleanup() {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
                window.visualViewport.removeEventListener('scroll', handleViewportChange);
            } else {
                window.removeEventListener('resize', handleViewportChange);
            }
        };
    }

    // Function to show the overlay
    function showOverlay() {
        if (!requireSystemPromptPremiumAccess()) {
            return;
        }

        if (overlayHideTimer) {
            clearTimeout(overlayHideTimer);
            overlayHideTimer = null;
        }

        // Copy content from hidden textarea to editor
        editor.value = hiddenTextarea.value || '';

        // Show the overlay with proper display flex for centering
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        overlay.style.zIndex = '2100'; // Ensure it's above the settings modal

            // Setup mobile keyboard detection
            const cleanupKeyboardDetection = setupMobileKeyboardDetection();

            // Store cleanup function for later use
            overlay._keyboardCleanup = cleanupKeyboardDetection;

        if (window.androidKeyboardVisible === true) {
            applyOverlayKeyboardLayout(true);
        } else {
            applyOverlayKeyboardLayout(false);
        }

        // Force reflow so the fade starts from opacity: 0.
        void overlay.offsetHeight;

        requestAnimationFrame(() => {
            // Add a class to indicate the overlay is active (for potential animations)
            overlay.classList.add('active');

            // Focus the editor after the overlay is visible
            editor.focus();
        });

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Disable scrolling on body
    document.body.style.overflow = 'hidden';

        // Adjust textarea height based on content
        adjustTextareaHeight();
    }

    // Function to adjust textarea height based on content and screen size
    function adjustTextareaHeight() {
        const viewportHeight = getVisibleOverlayViewportHeight();
        const isSmallScreen = viewportHeight < 600;
        const keyboardVisible = overlay.classList.contains('keyboard-visible') || window.androidKeyboardVisible === true;

        if (keyboardVisible) {
            editor.style.height = 'auto';
            editor.style.maxHeight = 'none';
            editor.style.flex = '1 1 auto';
            return;
        }

        // Reserve space for the overlay header, labels and footer buttons.
        const reservedHeight = keyboardVisible ? 220 : 180;
        const baseHeight = keyboardVisible ? 96 : (isSmallScreen ? 120 : 200);
        const maxHeight = Math.max(baseHeight, viewportHeight - reservedHeight);

        const contentHeight = editor.scrollHeight;
        const desiredHeight = Math.max(baseHeight, Math.min(contentHeight, maxHeight));

        editor.style.height = `${desiredHeight}px`;
        editor.style.maxHeight = `${maxHeight}px`;
    }

    // Function to hide the overlay
    function hideOverlay() {
        if (overlayHideTimer) {
            clearTimeout(overlayHideTimer);
            overlayHideTimer = null;
        }

        // Remove active class first (for animations if needed)
        overlay.classList.remove('active');
        applyOverlayKeyboardLayout(false);

        // Clean up keyboard detection
        if (overlay._keyboardCleanup) {
            overlay._keyboardCleanup();
            overlay._keyboardCleanup = null;
        }

        // Delay hiding until fade-out animation completes.
        overlayHideTimer = setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';

            // Reset any inline styles
            editor.style.height = '';
            overlay.style.height = '';
            overlay.style.position = '';
            overlay.style.top = '';
            overlay.style.left = '';
            overlay.style.right = '';
            overlay.style.bottom = '';
            overlayHideTimer = null;
        }, 400);

        // Re-enable scrolling
        document.body.style.overflow = '';

        // Remove keyboard event listener
        document.removeEventListener('keydown', handleKeyDown);
    }

    // Function to save the edited content
    function saveChanges() {
        if (!requireSystemPromptPremiumAccess()) {
            return;
        }

        // Save to hidden textarea
        hiddenTextarea.value = editor.value;

        // Mark this as a user-created prompt
        localStorage.setItem('isUserCreatedSystemPrompt', 'true');

        // Update the preview
        updatePreview();

        // Trigger change event on hidden textarea
        const event = new Event('change', { bubbles: true });
        hiddenTextarea.dispatchEvent(event);

        // Ensure the prompt is saved to localStorage
        localStorage.setItem('systemPrompt', editor.value);
        debugLog('Saved system prompt from editor:', editor.value);
        debugLog('isUserCreatedSystemPrompt:', localStorage.getItem('isUserCreatedSystemPrompt'));

        // Hide the overlay
        hideOverlay();
    }

    // Function to update the preview div
    function updatePreview() {
        const value = hiddenTextarea.value;

        if (value && value.trim()) {
            // If there's content, show it in the preview
            previewDiv.textContent = value;

            // Hide the placeholder
            if (placeholderSpan) {
                placeholderSpan.style.display = 'none';
            }
        } else {
            // If empty, clear the preview and show placeholder
            if (placeholderSpan) {
                // Set innerHTML directly to avoid any whitespace issues
                previewDiv.innerHTML = '';
                previewDiv.appendChild(placeholderSpan);
            } else {
                previewDiv.textContent = '';
            }
        }
    }

    // Initial setup - update preview based on current value
    updatePreview();

    // Setup event listeners
    editButton.addEventListener('click', function(e) {
        e.preventDefault();
        showOverlay();
    });

    if (improveButton) {
        improveButton.addEventListener('click', async function(e) {
            e.preventDefault();

            if (!requireSystemPromptPremiumAccess()) {
                return;
            }

            const currentPrompt = editor.value.trim();
            if (!currentPrompt) {
                // Shake the editor to indicate input is needed
                editor.classList.add('shake-animation');
                setTimeout(() => editor.classList.remove('shake-animation'), 500);
                return;
            }

            // Check if server is running
            if (!(await isServerRunning())) {
                const originalText = improveButton.innerHTML;
                improveButton.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Server Offline';
                setTimeout(() => {
                    improveButton.innerHTML = originalText;
                }, 2000);
                return;
            }

            // Show loading state
            const originalText = improveButton.innerHTML;
            improveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Improving...</span>';
            improveButton.disabled = true;
            editor.disabled = true;
            
            // Add skeleton loading effect to editor
            editor.classList.add('animate-pulse');

            try {
                // Get available models to ensure we have one
                const models = getAvailableModels();
                let modelToUse = models.length > 0 ? models[0] : null;
                
                // If we have a currently loaded model global, use that
                if (window.currentLoadedModel) {
                    modelToUse = window.currentLoadedModel;
                }

                if (!modelToUse && !getUseOpenRouter() && !getUseOpenAICompatible()) {
                    await fetchAvailableModels({
                        forceRefresh: true,
                        disableSelectionFallback: true
                    }).catch(() => []);

                    const refreshedModels = getAvailableModels();
                    if (window.currentLoadedModel) {
                        modelToUse = window.currentLoadedModel;
                    } else if (refreshedModels.length > 0) {
                        modelToUse = refreshedModels[0];
                    }
                }

                const apiUrl = getApiUrl();

                if (!modelToUse) {
                    throw new Error('No models available');
                }

                debugLog('Improving system prompt with model:', modelToUse);

                const requestHeaders = {
                    'Content-Type': 'application/json'
                };
                if (getUseOpenRouter()) {
                    const apiKey = getOpenRouterApiKey();
                    if (apiKey) requestHeaders['Authorization'] = `Bearer ${apiKey}`;
                } else if (getUseOpenAICompatible()) {
                    const apiKey = getOpenAICompatibleApiKey();
                    if (apiKey) requestHeaders['Authorization'] = `Bearer ${apiKey}`;
                }

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: JSON.stringify({
                        model: modelToUse,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert prompt engineer. Your goal is to optimize the user\'s system prompt to be more detailed, robust, and effective. You should expand on the original intent to provide clearer instructions and better persona definition. Return ONLY the improved prompt text. Do not include any explanations, markdown formatting (like ```), or conversational text.'
                            },
                            {
                                role: 'user',
                                content: `Experimental System Prompt to improve:\n\n${currentPrompt}`
                            }
                        ],
                        temperature: 0.7,
                        stream: false
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                        let improvedPrompt = data.choices[0].message.content.trim();
                        
                        // Clean up any potential markdown code blocks if the model ignored instructions
                        improvedPrompt = improvedPrompt.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
                        
                        editor.value = improvedPrompt;
                        // Trigger resize
                        adjustTextareaHeight();
                        
                        // Flash success
                         improveButton.innerHTML = '<i class="fas fa-check"></i> <span>Done!</span>';
                         setTimeout(() => {
                             improveButton.innerHTML = originalText;
                             improveButton.disabled = false;
                         }, 1500);
                    } else {
                         throw new Error('Invalid response format');
                    }
                } else {
                    console.error('Failed to improve prompt:', response.status);
                    improveButton.innerHTML = '<i class="fas fa-times"></i> <span>Error</span>';
                    setTimeout(() => {
                        improveButton.innerHTML = originalText;
                        improveButton.disabled = false;
                    }, 2000);
                }

            } catch (error) {
                console.error('Error improving prompt:', error);
                improveButton.innerHTML = '<i class="fas fa-times"></i> <span>Error</span>';
                 setTimeout(() => {
                     improveButton.innerHTML = originalText;
                     improveButton.disabled = false;
                 }, 2000);
            } finally {
                // Restore state if not handling success/error timeout
                if (!improveButton.innerHTML.includes('Done') && !improveButton.innerHTML.includes('Error')) {
                    improveButton.innerHTML = originalText;
                    improveButton.disabled = false;
                }
                editor.disabled = false;
                editor.classList.remove('animate-pulse');
                editor.focus();
            }
        });
    }

    cancelButton.addEventListener('click', function(e) {
        e.preventDefault();
        hideOverlay();
    });

    saveButton.addEventListener('click', function(e) {
        e.preventDefault();
        saveChanges();
    });

    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        hideOverlay();
    });

    // Handle ESC key to close modal
    function handleKeyDown(e) {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            e.preventDefault();
            hideOverlay();
        }
    }

    // Handle backdrop click to close modal
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideOverlay();
        }
    });

    // Setup clear button event listener (the button is inside the overlay)
    const clearButton = document.getElementById('clear-system-prompt-btn');
    if (clearButton) {
        clearButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (!requireSystemPromptPremiumAccess()) {
                return;
            }
            showClearSystemPromptModal();
        });
    }

    // Handle outside click to close overlay
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideOverlay();
        }
    });

    // Prevent bubbling from the edit dialog
    overlay.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Update preview whenever the hidden textarea changes (from other code)
    hiddenTextarea.addEventListener('change', function() {
        updatePreview();
    });

    // Handle window resize to adjust textarea height
    window.addEventListener('resize', function() {
        // Only adjust if the overlay is visible
        if (!overlay.classList.contains('hidden')) {
            adjustTextareaHeight();
        }
    });

    // Handle escape key to close the overlay
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
            hideOverlay();
        }
    });
}

/**
 * Show the clear system prompt confirmation modal
 */
function showClearSystemPromptModal() {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    const modal = document.getElementById('clear-system-prompt-modal');
    if (modal) {
        if (modal._hideTimer) {
            clearTimeout(modal._hideTimer);
            modal._hideTimer = null;
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.zIndex = '2200'; // Ensure it's above the system prompt overlay (2100)

        // Find the modal content and ensure it's also on top
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.zIndex = '2201'; // Higher than the modal background
        }

        void modal.offsetHeight;
        requestAnimationFrame(() => {
            modal.classList.add('is-open');
        });
    }
}

/**
 * Hide the clear system prompt confirmation modal
 */
function hideClearSystemPromptModal() {
    const modal = document.getElementById('clear-system-prompt-modal');
    if (modal) {
        modal.classList.remove('is-open');

        if (modal._hideTimer) {
            clearTimeout(modal._hideTimer);
        }

        modal._hideTimer = setTimeout(() => {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            modal._hideTimer = null;
        }, 220);
    }
}

/**
 * Clear the system prompt
 */
function clearSystemPrompt() {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    // Import the settings manager to use the setSystemPrompt function
    import('./settings-manager.js').then(module => {
        // Clear the system prompt by setting it to empty string
        module.setSystemPrompt('', false);

        // Update the UI elements
        const hiddenTextarea = document.getElementById('system-prompt');
        const previewDiv = document.getElementById('system-prompt-preview');
        const placeholderSpan = document.getElementById('prompt-placeholder');
        const editor = document.getElementById('system-prompt-editor');

        if (hiddenTextarea) {
            hiddenTextarea.value = '';
            // Trigger change event to update the preview
            const changeEvent = new Event('change', { bubbles: true });
            hiddenTextarea.dispatchEvent(changeEvent);
        }

        // Clear the editor as well
        if (editor) {
            editor.value = '';
        }

        // Update the preview to show placeholder (this should also be handled by the change event above)
        if (previewDiv && placeholderSpan) {
            previewDiv.innerHTML = '';
            previewDiv.appendChild(placeholderSpan);
            placeholderSpan.style.display = '';
        }

        // Clear localStorage
        localStorage.setItem('systemPrompt', '');
        localStorage.removeItem('isUserCreatedSystemPrompt');

        debugLog('System prompt cleared successfully');
    });

    // Hide the confirmation modal
    hideClearSystemPromptModal();

    // Also hide the system prompt overlay since the user is done
    const overlay = document.getElementById('system-prompt-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        // Fade out first, then hide after the transition duration.
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            }, 400);
        }, 100); // Small delay to let the confirmation modal close first
    }
}

/**
 * Initialize the clear system prompt modal
 */
function initializeClearSystemPromptModal() {
    const modal = document.getElementById('clear-system-prompt-modal');
    const cancelButton = document.getElementById('cancel-clear-system-prompt');
    const confirmButton = document.getElementById('confirm-clear-system-prompt');
    const closeButton = document.getElementById('close-clear-system-prompt-modal');

    if (!modal || !cancelButton || !confirmButton || !closeButton) {
        debugLog('Clear system prompt modal elements not found');
        return;
    }

    // Cancel button
    cancelButton.addEventListener('click', function(e) {
        e.preventDefault();
        hideClearSystemPromptModal();
    });

    // Close button (X)
    closeButton.addEventListener('click', function(e) {
        e.preventDefault();
        hideClearSystemPromptModal();
    });

    // Confirm button
    confirmButton.addEventListener('click', function(e) {
        e.preventDefault();
        clearSystemPrompt();
    });

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideClearSystemPromptModal();
        }
    });

    // Prevent bubbling from the modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Handle escape key to close the modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hideClearSystemPromptModal();
        }
    });
}

/**
 * Updates the status display text in the connection panels inside the settings modal.
 * Called on modal open and after saving from an input sub-modal.
 */
export function updateConnectionStatusDisplays() {
    const localStatusEl = document.getElementById('local-server-status-text');
    const orKeyStatusEl = document.getElementById('openrouter-key-status-text');
    const openAIEndpointStatusEl = document.getElementById('openai-compatible-endpoint-status-text');
    const lmTokenStatusEl = document.getElementById('lmstudio-token-status-text');
    const lmMcpStatusEl = document.getElementById('lmstudio-mcp-status-text');

    if (localStatusEl) {
        const ip = localStorage.getItem('serverIp') || '';
        const port = localStorage.getItem('serverPort') || '';
        if (ip && port) {
            localStatusEl.textContent = `${ip}:${port}`;
            localStatusEl.style.color = 'var(--accent-green, #10b981)';
        } else {
            localStatusEl.textContent = 'Not configured';
            localStatusEl.style.color = '';
        }
    }

    if (orKeyStatusEl) {
        const key = localStorage.getItem('openRouterApiKey') || '';
        if (key) {
            const masked = key.length > 14
                ? key.substring(0, 10) + '\u2026' + key.slice(-4)
                : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
            orKeyStatusEl.textContent = `Key saved (${masked})`;
            orKeyStatusEl.style.color = 'var(--accent-green, #10b981)';
        } else {
            orKeyStatusEl.textContent = 'No API key saved';
            orKeyStatusEl.style.color = '';
        }
    }

    if (openAIEndpointStatusEl) {
        const endpoint = (localStorage.getItem('openAICompatibleEndpoint') || '').trim();
        const key = (localStorage.getItem('openAICompatibleApiKey') || '').trim();
        if (endpoint) {
            const endpointDisplay = endpoint.length > 42 ? `${endpoint.slice(0, 39)}...` : endpoint;
            openAIEndpointStatusEl.textContent = key ? `${endpointDisplay} (key set)` : `${endpointDisplay} (no key)`;
            openAIEndpointStatusEl.style.color = 'var(--accent-green, #10b981)';
        } else {
            openAIEndpointStatusEl.textContent = 'No endpoint configured';
            openAIEndpointStatusEl.style.color = '';
        }
    }

    if (lmTokenStatusEl) {
        const token = localStorage.getItem('lmStudioApiToken') || '';
        if (token) {
            const masked = token.length > 12
                ? token.substring(0, 8) + '\u2026' + token.slice(-4)
                : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
            lmTokenStatusEl.textContent = `Token saved (${masked})`;
            lmTokenStatusEl.style.color = 'var(--accent-green, #10b981)';
        } else {
            lmTokenStatusEl.textContent = 'No token (optional)';
            lmTokenStatusEl.style.color = '';
        }
    }

    if (lmMcpStatusEl) {
        const rawIntegrations = localStorage.getItem('lmStudioMcpIntegrations') || '';
        if (!rawIntegrations.trim()) {
            lmMcpStatusEl.textContent = 'No MCP integrations configured';
            lmMcpStatusEl.style.color = '';
        } else {
            try {
                const parsed = JSON.parse(rawIntegrations);
                const entries = Array.isArray(parsed) ? parsed : [parsed];
                const validEntries = entries.filter(entry =>
                    typeof entry === 'string' ||
                    (entry && typeof entry === 'object' && !Array.isArray(entry))
                );
                const label = validEntries.length === 1 ? 'integration' : 'integrations';
                lmMcpStatusEl.textContent = `${validEntries.length} MCP ${label} configured`;
                lmMcpStatusEl.style.color = 'var(--accent-green, #10b981)';
            } catch (_) {
                lmMcpStatusEl.textContent = 'Invalid MCP JSON';
                lmMcpStatusEl.style.color = 'var(--accent-red, #ef4444)';
            }
        }
    }
}

/**
 * Initialises the IP/Port and OpenRouter-key input sub-modals that appear
 * on top of the settings modal, keeping the main settings modal unaffected
 * by the Android native keyboard.
 */
function initializeConnectionInputModals() {
    const ipPortModal = document.getElementById('ip-port-input-modal');
    const orKeyModal = document.getElementById('openrouter-key-input-modal');
    const openAICompatibleModal = document.getElementById('openai-compatible-input-modal');
    const lmTokenModal = document.getElementById('lmstudio-token-input-modal');
    const lmMcpModal = document.getElementById('lmstudio-mcp-input-modal');
    const presetEditModal = document.getElementById('edit-connection-preset-modal');

    if (!ipPortModal || !orKeyModal || !openAICompatibleModal) {
        debugLog('Connection input modals not found');
        return;
    }

    // ----- helpers -----

    function findFirstVisibleModalInput(modal) {
        const candidates = modal.querySelectorAll('input[type="text"], input[type="password"], textarea, input');
        return Array.from(candidates).find((input) => {
            if (!input || input.disabled) {
                return false;
            }

            if (input.closest('.hidden')) {
                return false;
            }

            return input.offsetParent !== null;
        }) || null;
    }

    function modalHasTextEntryInput(modal) {
        if (!modal) {
            return false;
        }

        return !!findFirstVisibleModalInput(modal);
    }

    function keepModalInputVisible(modal, input) {
        if (!modal || !input) {
            return;
        }

        const box = modal.querySelector('.connection-input-modal-box');
        if (!box) {
            return;
        }

        const boxRect = box.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();
        const padding = 16;

        if (inputRect.bottom > boxRect.bottom - padding) {
            box.scrollTop += inputRect.bottom - boxRect.bottom + padding;
        } else if (inputRect.top < boxRect.top + padding) {
            box.scrollTop -= boxRect.top + padding - inputRect.top;
        }
    }

    /**
     * Sets up keyboard handling for connection input modals on Android.
     *
     * The global Android keyboard fix now resizes any visible modal container to
     * the actual viewport height. This helper keeps the focused field visible
     * within the modal box after that relayout completes.
     */
    function setupInputModalKeyboardHandling(modal) {
        if (!modal || !isAndroidWebView()) {
            return null;
        }

        const box = modal.querySelector('.connection-input-modal-box');
        if (!box) {
            return null;
        }

        let pendingScrollTimeout = null;

        const scrollFocusedInputIntoView = () => {
            if (modal.classList.contains('hidden')) {
                return;
            }

            const active = document.activeElement;
            if (!active || !box.contains(active)) return;

            // Small delay lets the viewport finish resizing before measuring.
            if (pendingScrollTimeout !== null) {
                clearTimeout(pendingScrollTimeout);
            }

            pendingScrollTimeout = setTimeout(() => {
                keepModalInputVisible(modal, active);
                pendingScrollTimeout = null;
            }, 120);
        };

        const onFocusIn = () => scrollFocusedInputIntoView();

        modal.addEventListener('focusin', onFocusIn);

        return () => {
            modal.removeEventListener('focusin', onFocusIn);

            if (pendingScrollTimeout !== null) {
                clearTimeout(pendingScrollTimeout);
                pendingScrollTimeout = null;
            }
        };
    }

    function showInputModal(modal) {
        if (modal._hideTimer) {
            clearTimeout(modal._hideTimer);
            modal._hideTimer = null;
        }

        modal.classList.remove('hidden');
        modal.classList.remove('hide');
        modal.style.display = 'flex';

        // Force reflow so fade-in transition starts from opacity 0.
        void modal.offsetHeight;
        modal.classList.add('show');

        const box = modal.querySelector('.connection-input-modal-box');
        const shouldAnimateModalIn = !(isAndroidWebView() && modalHasTextEntryInput(modal));
        if (box) {
            box.classList.remove('animate-modal-out');
            if (shouldAnimateModalIn) {
                box.classList.add('animate-modal-in');
            } else {
                box.classList.remove('animate-modal-in');
            }
        }

        if (typeof modal._keyboardCleanup === 'function') {
            modal._keyboardCleanup();
        }
        modal._keyboardCleanup = setupInputModalKeyboardHandling(modal);

        // On Android, when the keyboard appears, focus events may be delayed.
        // Use a small timeout to allow the modal to render, then focus the first input.
        setTimeout(() => {
            const firstInput = findFirstVisibleModalInput(modal);
            if (firstInput) {
                firstInput.focus();
                keepModalInputVisible(modal, firstInput);
            }
        }, 90);
    }

    function hideInputModal(modal) {
        if (modal._hideTimer) {
            clearTimeout(modal._hideTimer);
            modal._hideTimer = null;
        }

        modal.classList.remove('show');
        modal.classList.add('hide');

        const box = modal.querySelector('.connection-input-modal-box');
        if (box) {
            box.classList.remove('animate-modal-in');
            box.classList.add('animate-modal-out');
            modal._hideTimer = setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.classList.remove('hide');
                box.classList.remove('animate-modal-out');
                modal._hideTimer = null;
            }, 400);
        } else {
            modal._hideTimer = setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                modal.classList.remove('hide');
                modal._hideTimer = null;
            }, 400);
        }
        // Blur any focused input so the keyboard dismisses
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }

        if (typeof modal._keyboardCleanup === 'function') {
            modal._keyboardCleanup();
            delete modal._keyboardCleanup;
        }
    }

    // Seed status displays with current saved values
    updateConnectionStatusDisplays();

    // ----- IP / Port modal -----

    const configLocalBtn = document.getElementById('configure-local-server-btn');
    if (configLocalBtn) {
        configLocalBtn.addEventListener('click', () => showInputModal(ipPortModal));
    }

    const closeIpPortBtnX = document.getElementById('close-ip-port-input-modal');
    const cancelIpPortBtn = document.getElementById('cancel-ip-port-input-modal');
    const saveIpPortBtn = document.getElementById('save-ip-port-input-modal');

    const dismissIpPortModal = () => {
        // Restore inputs to last-saved values on dismiss
        const ipInput = document.getElementById('server-ip');
        const portInput = document.getElementById('server-port');
        if (ipInput) ipInput.value = localStorage.getItem('serverIp') || '';
        if (portInput) portInput.value = localStorage.getItem('serverPort') || '';
        hideInputModal(ipPortModal);
    };

    if (closeIpPortBtnX) closeIpPortBtnX.addEventListener('click', dismissIpPortModal);
    if (cancelIpPortBtn) cancelIpPortBtn.addEventListener('click', dismissIpPortModal);

    if (saveIpPortBtn) {
        saveIpPortBtn.addEventListener('click', () => {
            if (!validateIpPort()) return; // error modal shown by validateIpPort
            interceptIpPortChanges(() => {
                saveServerSettings();
                updateConnectionStatusDisplays();
                hideInputModal(ipPortModal);
            });
        });
    }

    // Close on backdrop tap
    ipPortModal.addEventListener('click', e => {
        if (e.target === ipPortModal) dismissIpPortModal();
    });

    // Ensure inputs scroll into view when focused (helps with Android keyboard)
    const ipPortInputs = ipPortModal.querySelectorAll('input');
    ipPortInputs.forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(() => keepModalInputVisible(ipPortModal, input), 50);
        });
    });

    // ----- OpenRouter Key modal -----

    const configOrKeyBtn = document.getElementById('configure-openrouter-key-btn');
    if (configOrKeyBtn) {
        configOrKeyBtn.addEventListener('click', () => {
            _openRouterKeyBeforeEditing = (localStorage.getItem('openRouterApiKey') || '').trim();
            showInputModal(orKeyModal);
        });
    }

    const closeOrKeyBtnX = document.getElementById('close-openrouter-key-input-modal');
    const cancelOrKeyBtn = document.getElementById('cancel-openrouter-key-input-modal');
    const saveOrKeyBtn = document.getElementById('save-openrouter-key-input-modal');

    const dismissOrKeyModal = () => {
        // Restore input to last-saved value on dismiss
        const keyInput = document.getElementById('openrouter-api-key');
        if (keyInput) {
            keyInput.value = localStorage.getItem('openRouterApiKey') || '';
        }
        hideInputModal(orKeyModal);
    };

    if (closeOrKeyBtnX) closeOrKeyBtnX.addEventListener('click', dismissOrKeyModal);
    if (cancelOrKeyBtn) cancelOrKeyBtn.addEventListener('click', dismissOrKeyModal);

    if (saveOrKeyBtn) {
        saveOrKeyBtn.addEventListener('click', () => {
            const keyInput = document.getElementById('openrouter-api-key');
            const key = keyInput ? keyInput.value.trim() : '';
            const isNewKeyApplied = key.length > 0 && key !== _openRouterKeyBeforeEditing;
            localStorage.setItem('openRouterApiKey', key);
            // Fire input event so settings-manager.js picks up the new value
            if (keyInput) keyInput.dispatchEvent(new Event('input', { bubbles: true }));
            updateConnectionStatusDisplays();
            hideInputModal(orKeyModal);
            _openModelInfoAfterSettingsClose = isNewKeyApplied;
            _openRouterKeyBeforeEditing = key;
        });
    }

    // Close on backdrop tap
    orKeyModal.addEventListener('click', e => {
        if (e.target === orKeyModal) dismissOrKeyModal();
    });

    // Ensure input scrolls into view when focused (helps with Android keyboard)
    const orKeyInput = orKeyModal.querySelector('input[type="password"]') || 
                       orKeyModal.querySelector('input[type="text"]');
    if (orKeyInput) {
        orKeyInput.addEventListener('focus', () => {
            setTimeout(() => keepModalInputVisible(orKeyModal, orKeyInput), 50);
        });
    }

    // ----- LM Studio API Token modal -----

    // ----- OpenAI-compatible endpoint modal -----

    const configOpenAICompatibleBtn = document.getElementById('configure-openai-compatible-btn');
    if (configOpenAICompatibleBtn) {
        configOpenAICompatibleBtn.addEventListener('click', () => {
            if (!hasPremiumAccess()) {
                openPremiumModal('Custom Endpoint');
                return;
            }

            const endpointInput = document.getElementById('openai-compatible-endpoint');
            const keyInput = document.getElementById('openai-compatible-api-key');
            const modelInput = document.getElementById('openai-compatible-model-name');
            if (endpointInput) endpointInput.value = localStorage.getItem('openAICompatibleEndpoint') || '';
            if (keyInput) {
                keyInput.value = localStorage.getItem('openAICompatibleApiKey') || '';
                keyInput.type = 'password';
            }
            if (modelInput) {
                modelInput.value = localStorage.getItem('openAICompatibleManualModel') || '';
            }
            const revealBtn = document.getElementById('openai-compatible-api-key-reveal');
            if (revealBtn) revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
            showInputModal(openAICompatibleModal);
        });
    }

    const closeOpenAICompatibleBtnX = document.getElementById('close-openai-compatible-input-modal');
    const cancelOpenAICompatibleBtn = document.getElementById('cancel-openai-compatible-input-modal');
    const saveOpenAICompatibleBtn = document.getElementById('save-openai-compatible-input-modal');

    const dismissOpenAICompatibleModal = () => {
        const endpointInput = document.getElementById('openai-compatible-endpoint');
        const keyInput = document.getElementById('openai-compatible-api-key');
        const modelInput = document.getElementById('openai-compatible-model-name');
        if (endpointInput) endpointInput.value = localStorage.getItem('openAICompatibleEndpoint') || '';
        if (keyInput) {
            keyInput.value = localStorage.getItem('openAICompatibleApiKey') || '';
            keyInput.type = 'password';
        }
        if (modelInput) {
            modelInput.value = localStorage.getItem('openAICompatibleManualModel') || '';
        }
        const revealBtn = document.getElementById('openai-compatible-api-key-reveal');
        if (revealBtn) revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
        hideInputModal(openAICompatibleModal);
    };

    if (closeOpenAICompatibleBtnX) closeOpenAICompatibleBtnX.addEventListener('click', dismissOpenAICompatibleModal);
    if (cancelOpenAICompatibleBtn) cancelOpenAICompatibleBtn.addEventListener('click', dismissOpenAICompatibleModal);

    if (saveOpenAICompatibleBtn) {
        saveOpenAICompatibleBtn.addEventListener('click', () => {
            const endpointInput = document.getElementById('openai-compatible-endpoint');
            const keyInput = document.getElementById('openai-compatible-api-key');
            const modelInput = document.getElementById('openai-compatible-model-name');
            const endpoint = endpointInput ? endpointInput.value.trim() : '';
            const apiKey = keyInput ? keyInput.value.trim() : '';
            const manualModel = modelInput ? modelInput.value.trim() : '';

            localStorage.setItem('openAICompatibleEndpoint', endpoint);
            localStorage.setItem('openAICompatibleApiKey', apiKey);

            if (manualModel) {
                localStorage.setItem('openAICompatibleManualModel', manualModel);
                localStorage.setItem('openAICompatibleSelectedModel', manualModel);
                window.currentLoadedModel = manualModel;
            } else {
                localStorage.removeItem('openAICompatibleManualModel');
            }

            if (endpointInput) endpointInput.dispatchEvent(new Event('input', { bubbles: true }));
            if (keyInput) keyInput.dispatchEvent(new Event('input', { bubbles: true }));
            if (modelInput) modelInput.dispatchEvent(new Event('input', { bubbles: true }));

            updateConnectionStatusDisplays();
            hideInputModal(openAICompatibleModal);
        });
    }

    openAICompatibleModal.addEventListener('click', e => {
        if (e.target === openAICompatibleModal) dismissOpenAICompatibleModal();
    });

    const openAICompatibleInputs = openAICompatibleModal.querySelectorAll('input');
    openAICompatibleInputs.forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(() => keepModalInputVisible(openAICompatibleModal, input), 50);
        });
    });

    // ----- Saved preset edit modal -----

    if (presetEditModal) {
        const accent = document.getElementById('edit-connection-preset-accent');
        const typePill = document.getElementById('edit-connection-preset-type-pill');
        const helperText = document.getElementById('edit-connection-preset-helper');
        const errorBox = document.getElementById('edit-connection-preset-error');
        const closePresetEditBtn = document.getElementById('close-edit-connection-preset-modal');
        const cancelPresetEditBtn = document.getElementById('cancel-edit-connection-preset-modal');
        const savePresetEditBtn = document.getElementById('save-edit-connection-preset-modal');
        const presetNameInput = document.getElementById('edit-connection-preset-name');

        const localFields = document.getElementById('edit-connection-preset-local-fields');
        const localIpInput = document.getElementById('edit-connection-preset-local-ip');
        const localPortInput = document.getElementById('edit-connection-preset-local-port');
        const localTokenInput = document.getElementById('edit-connection-preset-local-token');
        const localMcpInput = document.getElementById('edit-connection-preset-local-mcp');

        const openRouterFields = document.getElementById('edit-connection-preset-openrouter-fields');
        const openRouterKeyInput = document.getElementById('edit-connection-preset-openrouter-key');

        const openAIFields = document.getElementById('edit-connection-preset-openai-compatible-fields');
        const openAIEndpointInput = document.getElementById('edit-connection-preset-openai-endpoint');
        const openAIKeyInput = document.getElementById('edit-connection-preset-openai-key');
        const openAIModelInput = document.getElementById('edit-connection-preset-openai-model');

        const providerDescriptions = {
            local: 'Update the saved local server address, token, or MCP integrations without changing the connection currently in use.',
            openrouter: 'Update the saved OpenRouter preset here without touching the active connection until you tap Use.',
            'openai-compatible': 'Update the saved custom endpoint details here without changing the active connection until you tap Use.'
        };

        const secretToggleButtons = Array.from(presetEditModal.querySelectorAll('[data-edit-preset-secret-toggle]'));

        const clearPresetEditError = () => {
            if (!errorBox) {
                return;
            }

            errorBox.textContent = '';
            errorBox.classList.add('hidden');
        };

        const showPresetEditError = (message) => {
            if (!errorBox) {
                return;
            }

            errorBox.textContent = message;
            errorBox.classList.remove('hidden');
        };

        const resetSecretToggleButtons = () => {
            secretToggleButtons.forEach(button => {
                const targetId = button.dataset.editPresetSecretToggle;
                const targetInput = targetId ? document.getElementById(targetId) : null;
                if (targetInput) {
                    targetInput.type = 'password';
                }
                button.innerHTML = '<i class="fas fa-eye"></i>';
            });
        };

        const setVisiblePresetSection = (type) => {
            [localFields, openRouterFields, openAIFields].forEach(section => {
                if (section) {
                    section.classList.add('hidden');
                }
            });

            if (type === 'local' && localFields) {
                localFields.classList.remove('hidden');
            } else if (type === 'openrouter' && openRouterFields) {
                openRouterFields.classList.remove('hidden');
            } else if (type === 'openai-compatible' && openAIFields) {
                openAIFields.classList.remove('hidden');
            }
        };

        const resetPresetEditModal = () => {
            presetEditModal.dataset.presetId = '';
            presetEditModal.dataset.presetType = '';

            if (presetNameInput) presetNameInput.value = '';
            if (localIpInput) localIpInput.value = '';
            if (localPortInput) localPortInput.value = '';
            if (localTokenInput) localTokenInput.value = '';
            if (localMcpInput) localMcpInput.value = '';
            if (openRouterKeyInput) openRouterKeyInput.value = '';
            if (openAIEndpointInput) openAIEndpointInput.value = '';
            if (openAIKeyInput) openAIKeyInput.value = '';
            if (openAIModelInput) openAIModelInput.value = '';

            if (typePill) {
                typePill.textContent = 'Local Server';
            }

            if (helperText) {
                helperText.textContent = 'Update this preset without changing your current active connection.';
            }

            if (accent) {
                accent.classList.remove('connection-input-modal-accent--purple');
                accent.classList.add('connection-input-modal-accent--blue');
            }

            setVisiblePresetSection('');
            resetSecretToggleButtons();
            clearPresetEditError();
        };

        const hidePresetEditModal = () => {
            resetPresetEditModal();
            hideInputModal(presetEditModal);
        };

        const populatePresetEditModal = (preset) => {
            if (!preset || !preset.id || !preset.type) {
                throw new Error('The selected preset is invalid.');
            }

            presetEditModal.dataset.presetId = preset.id;
            presetEditModal.dataset.presetType = preset.type;

            if (presetNameInput) {
                presetNameInput.value = preset.name || '';
            }

            if (typePill) {
                typePill.textContent = CONNECTION_PRESET_TYPE_LABELS[preset.type] || 'Connection';
            }

            if (helperText) {
                helperText.textContent = providerDescriptions[preset.type] || 'Update this preset without changing your current active connection.';
            }

            if (accent) {
                accent.classList.toggle('connection-input-modal-accent--purple', preset.type === 'openrouter');
                accent.classList.toggle('connection-input-modal-accent--blue', preset.type !== 'openrouter');
            }

            if (preset.type === 'local') {
                if (localIpInput) localIpInput.value = preset.data.serverIp || '';
                if (localPortInput) localPortInput.value = preset.data.serverPort || '';
                if (localTokenInput) localTokenInput.value = preset.data.lmStudioApiToken || '';
                if (localMcpInput) localMcpInput.value = preset.data.lmStudioMcpIntegrations || '';
            } else if (preset.type === 'openrouter') {
                if (openRouterKeyInput) openRouterKeyInput.value = preset.data.openRouterApiKey || '';
            } else if (preset.type === 'openai-compatible') {
                if (openAIEndpointInput) openAIEndpointInput.value = preset.data.endpoint || '';
                if (openAIKeyInput) openAIKeyInput.value = preset.data.apiKey || '';
                if (openAIModelInput) openAIModelInput.value = preset.data.manualModel || '';
            }

            setVisiblePresetSection(preset.type);
            resetSecretToggleButtons();
            clearPresetEditError();
        };

        const buildPresetEditPayload = () => {
            const presetId = presetEditModal.dataset.presetId || '';
            const type = presetEditModal.dataset.presetType || '';
            const name = presetNameInput?.value.trim() || '';

            if (!presetId || !type) {
                throw new Error('This preset could not be loaded for editing.');
            }

            if (!name) {
                throw new Error('Preset name is required.');
            }

            if (type === 'local') {
                const serverIp = localIpInput?.value.trim() || '';
                const serverPort = localPortInput?.value.trim() || '';
                const lmStudioApiToken = localTokenInput?.value.trim() || '';
                const lmStudioMcpIntegrations = localMcpInput?.value.trim() || '';

                if (!serverIp || !serverPort) {
                    throw new Error('Hostname/IP and port are required for Local Server presets.');
                }

                if (!/^\d+$/.test(serverPort)) {
                    throw new Error('Port must contain digits only.');
                }

                if (lmStudioMcpIntegrations) {
                    try {
                        JSON.parse(lmStudioMcpIntegrations);
                    } catch (_) {
                        throw new Error('MCP integrations must contain valid JSON.');
                    }
                }

                return {
                    id: presetId,
                    name,
                    type,
                    data: {
                        serverIp,
                        serverPort,
                        lmStudioApiToken,
                        lmStudioMcpIntegrations
                    }
                };
            }

            if (type === 'openrouter') {
                const openRouterApiKey = openRouterKeyInput?.value.trim() || '';

                if (!openRouterApiKey) {
                    throw new Error('OpenRouter API key is required for this preset.');
                }

                return {
                    id: presetId,
                    name,
                    type,
                    data: {
                        openRouterApiKey
                    }
                };
            }

            if (type === 'openai-compatible') {
                const endpoint = openAIEndpointInput?.value.trim() || '';
                const apiKey = openAIKeyInput?.value.trim() || '';
                const manualModel = openAIModelInput?.value.trim() || '';

                if (!endpoint) {
                    throw new Error('Endpoint URL is required for this preset.');
                }

                return {
                    id: presetId,
                    name,
                    type,
                    data: {
                        endpoint,
                        apiKey,
                        manualModel
                    }
                };
            }

            throw new Error('Unsupported preset type.');
        };

        secretToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.editPresetSecretToggle;
                const targetInput = targetId ? document.getElementById(targetId) : null;
                if (!targetInput) {
                    return;
                }

                const shouldReveal = targetInput.type === 'password';
                targetInput.type = shouldReveal ? 'text' : 'password';
                button.innerHTML = shouldReveal
                    ? '<i class="fas fa-eye-slash"></i>'
                    : '<i class="fas fa-eye"></i>';
            });
        });

        _showConnectionPresetEditModal = (preset) => {
            try {
                populatePresetEditModal(preset);
                showInputModal(presetEditModal);
            } catch (error) {
                showConnectionPresetNotice(error?.message || 'Failed to open preset editor.', 'error');
            }
        };

        if (closePresetEditBtn) {
            closePresetEditBtn.addEventListener('click', hidePresetEditModal);
        }

        if (cancelPresetEditBtn) {
            cancelPresetEditBtn.addEventListener('click', hidePresetEditModal);
        }

        if (savePresetEditBtn) {
            savePresetEditBtn.addEventListener('click', () => {
                clearPresetEditError();

                const presetPayload = buildPresetEditPayload();

                if (requestConnectionPresetPremiumAccess(presetPayload.type)) {
                    return;
                }

                try {
                    const savedPreset = saveConnectionPreset(presetPayload);
                    hidePresetEditModal();
                    renderConnectionPresetList();
                    showConnectionPresetNotice(`Updated ${savedPreset.name}.`);
                } catch (error) {
                    showPresetEditError(error?.message || 'Failed to update preset.');
                }
            });
        }

        presetEditModal.addEventListener('click', event => {
            if (event.target === presetEditModal) {
                hidePresetEditModal();
            }
        });

        presetEditModal.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('focus', () => {
                setTimeout(() => keepModalInputVisible(presetEditModal, input), 50);
            });
        });
    } else {
        _showConnectionPresetEditModal = null;
    }

    // ----- LM Studio API Token modal -----

    if (lmTokenModal) {
        const configLmTokenBtn = document.getElementById('configure-lmstudio-token-btn');
        if (configLmTokenBtn) {
            configLmTokenBtn.addEventListener('click', () => {
                // Seed input with current saved value
                const tokenInput = document.getElementById('lmstudio-api-token');
                if (tokenInput) tokenInput.value = localStorage.getItem('lmStudioApiToken') || '';
                showInputModal(lmTokenModal);
            });
        }

        const closeLmTokenBtnX = document.getElementById('close-lmstudio-token-input-modal');
        const cancelLmTokenBtn = document.getElementById('cancel-lmstudio-token-input-modal');
        const clearLmTokenBtn = document.getElementById('clear-lmstudio-token-input-modal');
        const saveLmTokenBtn = document.getElementById('save-lmstudio-token-input-modal');

        const dismissLmTokenModal = () => {
            const tokenInput = document.getElementById('lmstudio-api-token');
            if (tokenInput) {
                tokenInput.value = localStorage.getItem('lmStudioApiToken') || '';
                tokenInput.type = 'password';
                const revealBtn = document.getElementById('lmstudio-api-token-reveal');
                if (revealBtn) revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
            }
            hideInputModal(lmTokenModal);
        };

        if (closeLmTokenBtnX) closeLmTokenBtnX.addEventListener('click', dismissLmTokenModal);
        if (cancelLmTokenBtn) cancelLmTokenBtn.addEventListener('click', dismissLmTokenModal);
        if (clearLmTokenBtn) {
            clearLmTokenBtn.addEventListener('click', () => {
                const tokenInput = document.getElementById('lmstudio-api-token');
                if (tokenInput) {
                    tokenInput.value = '';
                    tokenInput.type = 'password';
                    const revealBtn = document.getElementById('lmstudio-api-token-reveal');
                    if (revealBtn) revealBtn.innerHTML = '<i class="fas fa-eye"></i>';
                }

                localStorage.removeItem('lmStudioApiToken');
                import('./settings-manager.js').then(m => {
                    if (typeof m.clearLMStudioApiToken === 'function') {
                        m.clearLMStudioApiToken();
                    } else if (typeof m.setLMStudioApiToken === 'function') {
                        m.setLMStudioApiToken('');
                    }
                }).catch(() => {});

                updateConnectionStatusDisplays();
                hideInputModal(lmTokenModal);
            });
        }

        if (saveLmTokenBtn) {
            saveLmTokenBtn.addEventListener('click', () => {
                const tokenInput = document.getElementById('lmstudio-api-token');
                const token = tokenInput ? tokenInput.value.trim() : '';
                if (token) {
                    localStorage.setItem('lmStudioApiToken', token);
                } else {
                    localStorage.removeItem('lmStudioApiToken');
                }
                // Sync in-memory value via settings-manager
                import('./settings-manager.js').then(m => {
                    if (typeof m.setLMStudioApiToken === 'function') m.setLMStudioApiToken(token);
                }).catch(() => {});
                updateConnectionStatusDisplays();
                hideInputModal(lmTokenModal);
            });
        }

        // Close on backdrop tap
        lmTokenModal.addEventListener('click', e => {
            if (e.target === lmTokenModal) dismissLmTokenModal();
        });

        // Ensure input scrolls into view when focused
        const lmTokenInput = lmTokenModal.querySelector('input[type="password"]') ||
                             lmTokenModal.querySelector('input[type="text"]');
        if (lmTokenInput) {
            lmTokenInput.addEventListener('focus', () => {
                setTimeout(() => keepModalInputVisible(lmTokenModal, lmTokenInput), 50);
            });
        }
    }

    if (lmMcpModal) {
        const configLmMcpBtn = document.getElementById('configure-lmstudio-mcp-btn');
        const mcpError = document.getElementById('lmstudio-mcp-input-error');
        const mcpListSummary = document.getElementById('lmstudio-mcp-list-summary');
        const mcpEmptyState = document.getElementById('lmstudio-mcp-empty-state');
        const mcpIntegrationsList = document.getElementById('lmstudio-mcp-integrations-list');
        const addMcpIntegrationBtn = document.getElementById('add-lmstudio-mcp-integration-btn');
        const mcpBuilderPanel = document.getElementById('lmstudio-mcp-builder-panel');
        const mcpBuilderTitle = document.getElementById('lmstudio-mcp-builder-title');
        const mcpTypeSelect = document.getElementById('lmstudio-mcp-type');
        const mcpTargetLabel = document.getElementById('lmstudio-mcp-target-label');
        const mcpTargetInput = document.getElementById('lmstudio-mcp-target');
        const mcpTargetHelp = document.getElementById('lmstudio-mcp-target-help');
        const mcpLabelInput = document.getElementById('lmstudio-mcp-label');
        const mcpToolInput = document.getElementById('lmstudio-mcp-tool-input');
        const addMcpToolBtn = document.getElementById('add-lmstudio-mcp-tool-btn');
        const mcpSelectedTools = document.getElementById('lmstudio-mcp-selected-tools');
        const closeMcpBuilderBtn = document.getElementById('close-lmstudio-mcp-builder-btn');
        const cancelMcpBuilderBtn = document.getElementById('cancel-lmstudio-mcp-builder-btn');
        const saveMcpBuilderBtn = document.getElementById('save-lmstudio-mcp-builder-btn');
        const mcpTemplateButtons = Array.from(lmMcpModal.querySelectorAll('[data-mcp-template]'));
        const mcpToolSuggestionButtons = Array.from(lmMcpModal.querySelectorAll('[data-mcp-tool-suggestion]'));

        let workingMcpIntegrations = [];
        let editingMcpIndex = null;
        let selectedMcpTools = [];
        let originalMcpEntry = null;

        const clearMcpError = () => {
            if (mcpError) {
                mcpError.textContent = '';
                mcpError.classList.add('hidden');
            }
        };

        const showMcpError = (message) => {
            if (mcpError) {
                mcpError.textContent = message;
                mcpError.classList.remove('hidden');
            }
        };

        const cloneMcpValue = (value, fallback = []) => {
            if (value === null || typeof value === 'undefined') {
                return fallback;
            }

            try {
                return JSON.parse(JSON.stringify(value));
            } catch (_) {
                return fallback;
            }
        };

        const normalizeMcpTools = (tools) => {
            if (!Array.isArray(tools)) {
                return [];
            }

            return [...new Set(tools
                .map(tool => typeof tool === 'string' ? tool.trim() : '')
                .filter(Boolean))];
        };

        const readSavedMcpIntegrations = () => {
            const rawValue = localStorage.getItem('lmStudioMcpIntegrations') || '';
            if (!rawValue.trim()) {
                return [];
            }

            try {
                const parsedValue = JSON.parse(rawValue);
                const normalized = Array.isArray(parsedValue) ? parsedValue : [parsedValue];
                return normalized.filter(entry =>
                    typeof entry === 'string' ||
                    (entry && typeof entry === 'object' && !Array.isArray(entry))
                );
            } catch (_) {
                return [];
            }
        };

        const getMcpEntryType = (entry) => {
            if (typeof entry === 'string') {
                return 'plugin';
            }

            if (entry?.type === 'ephemeral_mcp' || entry?.server_url) {
                return 'ephemeral_mcp';
            }

            if (entry?.type === 'plugin' || entry?.id || entry?.plugin_id) {
                return 'plugin';
            }

            return 'ephemeral_mcp';
        };

        const deriveDefaultMcpLabel = (type, target) => {
            const trimmedTarget = (target || '').trim();
            if (!trimmedTarget) {
                return '';
            }

            if (type === 'ephemeral_mcp') {
                try {
                    return new URL(trimmedTarget).hostname.replace(/^www\./i, '');
                } catch (_) {
                    return trimmedTarget
                        .replace(/^https?:\/\//i, '')
                        .split('/')[0]
                        .trim();
                }
            }

            const pluginTail = trimmedTarget.split('/').filter(Boolean).pop();
            return pluginTail || trimmedTarget;
        };

        const getMcpEditorModel = (entry) => {
            const type = getMcpEntryType(entry);

            if (typeof entry === 'string') {
                return {
                    type,
                    target: entry,
                    label: '',
                    allowedTools: [],
                    original: entry
                };
            }

            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                return {
                    type: 'ephemeral_mcp',
                    target: '',
                    label: '',
                    allowedTools: [],
                    original: null
                };
            }

            if (type === 'plugin') {
                return {
                    type,
                    target: entry.id || entry.plugin_id || '',
                    label: entry._lmsaLabel || '',
                    allowedTools: normalizeMcpTools(entry.allowed_tools),
                    original: cloneMcpValue(entry, null)
                };
            }

            return {
                type: 'ephemeral_mcp',
                target: entry.server_url || '',
                label: entry.server_label || '',
                allowedTools: normalizeMcpTools(entry.allowed_tools),
                original: cloneMcpValue(entry, null)
            };
        };

        const updateMcpTargetCopy = () => {
            const isPlugin = mcpTypeSelect?.value === 'plugin';

            if (mcpTargetLabel) {
                mcpTargetLabel.textContent = isPlugin ? 'Server ID' : 'Server URL';
            }

            if (mcpTargetInput) {
                mcpTargetInput.placeholder = isPlugin ? 'mcp/playwright' : 'https://huggingface.co/mcp';
            }

            if (mcpTargetHelp) {
                mcpTargetHelp.textContent = isPlugin
                    ? 'Use the MCP server id from LM Studio mcp.json, for example mcp/playwright.'
                    : 'Use the remote MCP server URL for ephemeral integrations.';
            }
        };

        const renderSelectedMcpTools = () => {
            if (!mcpSelectedTools) {
                return;
            }

            mcpSelectedTools.innerHTML = '';
            selectedMcpTools = normalizeMcpTools(selectedMcpTools);

            if (selectedMcpTools.length === 0) {
                mcpSelectedTools.classList.remove('flex');
                mcpSelectedTools.classList.add('hidden');
                return;
            }

            selectedMcpTools.forEach(tool => {
                const chip = document.createElement('span');
                chip.className = 'inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs';
                chip.style.color = 'var(--settings-title-color, #f1f5f9)';

                const chipLabel = document.createElement('span');
                chipLabel.textContent = tool;
                chip.appendChild(chipLabel);

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'text-[11px] opacity-80 hover:opacity-100';
                removeBtn.dataset.removeMcpTool = tool;
                removeBtn.setAttribute('aria-label', `Remove ${tool}`);
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                chip.appendChild(removeBtn);

                mcpSelectedTools.appendChild(chip);
            });

            mcpSelectedTools.classList.add('flex');
            mcpSelectedTools.classList.remove('hidden');
        };

        const getMcpCardTitle = (entryModel) => {
            if (entryModel.type === 'ephemeral_mcp') {
                return entryModel.label || deriveDefaultMcpLabel(entryModel.type, entryModel.target) || 'Ephemeral MCP';
            }

            return entryModel.label || deriveDefaultMcpLabel(entryModel.type, entryModel.target) || 'Plugin MCP';
        };

        const renderMcpIntegrationsList = () => {
            if (!mcpIntegrationsList) {
                return;
            }

            mcpIntegrationsList.innerHTML = '';
            const count = workingMcpIntegrations.length;

            if (mcpListSummary) {
                mcpListSummary.textContent = count === 0
                    ? 'No integrations added yet.'
                    : `${count} integration${count === 1 ? '' : 's'} ready for LM Studio.`;
            }

            if (mcpEmptyState) {
                mcpEmptyState.classList.toggle('hidden', count > 0);
            }
            mcpIntegrationsList.classList.toggle('hidden', count === 0);

            workingMcpIntegrations.forEach((entry, index) => {
                const entryModel = getMcpEditorModel(entry);
                const card = document.createElement('div');
                card.className = 'rounded-xl border border-white/10 bg-white/5 p-3';

                const topRow = document.createElement('div');
                topRow.className = 'flex items-start justify-between gap-3';

                const textWrap = document.createElement('div');
                textWrap.className = 'min-w-0';

                const title = document.createElement('p');
                title.className = 'text-sm font-semibold truncate';
                title.style.color = 'var(--settings-title-color, #f1f5f9)';
                title.textContent = getMcpCardTitle(entryModel);
                textWrap.appendChild(title);

                const subtitle = document.createElement('p');
                subtitle.className = 'text-xs mt-1 break-all';
                subtitle.style.color = 'var(--settings-help-text, #9ca3af)';
                subtitle.textContent = entryModel.target || 'Missing target';
                textWrap.appendChild(subtitle);

                const badge = document.createElement('span');
                badge.className = 'shrink-0 rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em]';
                badge.style.color = 'var(--settings-help-text, #9ca3af)';
                badge.textContent = entryModel.type === 'plugin' ? 'Plugin' : 'Ephemeral';

                topRow.appendChild(textWrap);
                topRow.appendChild(badge);
                card.appendChild(topRow);

                const toolsMeta = document.createElement('p');
                toolsMeta.className = 'text-xs mt-3';
                toolsMeta.style.color = 'var(--settings-help-text, #6b7280)';
                toolsMeta.textContent = entryModel.allowedTools.length > 0
                    ? `Allowed tools: ${entryModel.allowedTools.join(', ')}`
                    : 'Allowed tools: All tools';
                card.appendChild(toolsMeta);

                const actionRow = document.createElement('div');
                actionRow.className = 'flex gap-2 mt-3';

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'professional-button flex-1 h-[38px]';
                editBtn.dataset.mcpAction = 'edit';
                editBtn.dataset.mcpIndex = String(index);
                editBtn.innerHTML = '<i class="fas fa-pen mr-2"></i>Edit';
                actionRow.appendChild(editBtn);

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'professional-button flex-1 h-[38px]';
                removeBtn.dataset.mcpAction = 'remove';
                removeBtn.dataset.mcpIndex = String(index);
                removeBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Remove';
                actionRow.appendChild(removeBtn);

                card.appendChild(actionRow);
                mcpIntegrationsList.appendChild(card);
            });
        };

        const resetMcpBuilderState = () => {
            editingMcpIndex = null;
            originalMcpEntry = null;
            selectedMcpTools = [];

            if (mcpTypeSelect) {
                mcpTypeSelect.value = 'ephemeral_mcp';
            }
            if (mcpTargetInput) {
                mcpTargetInput.value = '';
            }
            if (mcpLabelInput) {
                mcpLabelInput.value = '';
            }
            if (mcpToolInput) {
                mcpToolInput.value = '';
            }
            if (mcpBuilderTitle) {
                mcpBuilderTitle.textContent = 'Add MCP Integration';
            }

            updateMcpTargetCopy();
            renderSelectedMcpTools();
            clearMcpError();
        };

        const closeMcpBuilder = () => {
            resetMcpBuilderState();
            if (mcpBuilderPanel) {
                mcpBuilderPanel.classList.add('hidden');
            }
        };

        const isMcpBuilderOpen = () => !!(mcpBuilderPanel && !mcpBuilderPanel.classList.contains('hidden'));

        const focusMcpBuilder = () => {
            setTimeout(() => {
                if (!mcpBuilderPanel || mcpBuilderPanel.classList.contains('hidden') || !mcpTargetInput) {
                    return;
                }

                const modalBox = lmMcpModal?.querySelector('.connection-input-modal-box');
                if (modalBox instanceof HTMLElement) {
                    const panelTop = Math.max(0, mcpBuilderPanel.offsetTop - 16);
                    modalBox.scrollTop = panelTop;
                }

                const focusTargetInput = () => {
                    try {
                        mcpTargetInput.focus({ preventScroll: true });
                    } catch (_) {
                        mcpTargetInput.focus();
                    }

                    if (isAndroidWebView()) {
                        setTimeout(() => keepModalInputVisible(lmMcpModal, mcpTargetInput), 140);
                    }
                };

                if (isAndroidWebView()) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(focusTargetInput);
                    });
                    return;
                }

                focusTargetInput();
            }, 80);
        };

        const openMcpBuilder = (entryModel = null, index = null) => {
            const model = entryModel || {
                type: 'ephemeral_mcp',
                target: '',
                label: '',
                allowedTools: [],
                original: null
            };

            editingMcpIndex = Number.isInteger(index) ? index : null;
            originalMcpEntry = cloneMcpValue(model.original, null);
            selectedMcpTools = normalizeMcpTools(model.allowedTools);

            if (mcpTypeSelect) {
                mcpTypeSelect.value = model.type === 'plugin' ? 'plugin' : 'ephemeral_mcp';
            }
            updateMcpTargetCopy();

            if (mcpTargetInput) {
                mcpTargetInput.value = model.target || '';
            }
            if (mcpLabelInput) {
                mcpLabelInput.value = model.label || '';
            }
            if (mcpToolInput) {
                mcpToolInput.value = '';
            }
            if (mcpBuilderTitle) {
                mcpBuilderTitle.textContent = editingMcpIndex === null ? 'Add MCP Integration' : 'Edit MCP Integration';
            }

            renderSelectedMcpTools();
            clearMcpError();
            if (mcpBuilderPanel) {
                mcpBuilderPanel.classList.remove('hidden');
            }
            focusMcpBuilder();
        };

        const getPreservedMcpFields = (entry) => {
            if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
                return {};
            }

            const preserved = {};
            Object.entries(entry).forEach(([key, value]) => {
                if (key.startsWith('_')) {
                    return;
                }
                if (['type', 'server_url', 'server_label', 'allowed_tools', 'id', 'plugin_id'].includes(key)) {
                    return;
                }
                preserved[key] = cloneMcpValue(value, value);
            });

            return preserved;
        };

        const buildMcpIntegrationFromForm = () => {
            const type = mcpTypeSelect?.value === 'plugin' ? 'plugin' : 'ephemeral_mcp';
            const target = (mcpTargetInput?.value || '').trim();
            const label = (mcpLabelInput?.value || '').trim();
            const allowedTools = normalizeMcpTools(selectedMcpTools);
            const preserved = getPreservedMcpFields(originalMcpEntry);

            if (!target) {
                showMcpError(type === 'plugin' ? 'Enter a server id, for example mcp/playwright.' : 'Enter a valid server URL.');
                return null;
            }

            if (type === 'ephemeral_mcp') {
                try {
                    const parsedUrl = new URL(target);
                    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                        showMcpError('Server URL must start with http:// or https://.');
                        return null;
                    }
                } catch (_) {
                    showMcpError('Enter a valid server URL, for example https://huggingface.co/mcp.');
                    return null;
                }
            }

            if (type === 'plugin') {
                if (!label && allowedTools.length === 0 && Object.keys(preserved).length === 0) {
                    return target;
                }

                const integration = {
                    ...preserved,
                    type: 'plugin',
                    id: target
                };

                if (allowedTools.length > 0) {
                    integration.allowed_tools = allowedTools;
                }
                if (label) {
                    integration._lmsaLabel = label;
                }

                return integration;
            }

            const integration = {
                ...preserved,
                type: 'ephemeral_mcp',
                server_url: target,
                server_label: label || deriveDefaultMcpLabel(type, target) || 'mcp-server'
            };

            if (allowedTools.length > 0) {
                integration.allowed_tools = allowedTools;
            } else {
                delete integration.allowed_tools;
            }

            return integration;
        };

        const loadWorkingMcpIntegrations = () => {
            workingMcpIntegrations = cloneMcpValue(readSavedMcpIntegrations(), []);
            closeMcpBuilder();
            renderMcpIntegrationsList();
        };

        const persistMcpIntegrations = async (integrations) => {
            try {
                const settingsManager = await import('./settings-manager.js');
                if (integrations.length === 0 && typeof settingsManager.clearLMStudioMcpIntegrations === 'function') {
                    settingsManager.clearLMStudioMcpIntegrations();
                    return;
                }

                if (typeof settingsManager.setLMStudioMcpIntegrations === 'function') {
                    settingsManager.setLMStudioMcpIntegrations(integrations);
                    return;
                }
            } catch (_) {
                // Fall back to direct localStorage persistence below.
            }

            if (integrations.length > 0) {
                localStorage.setItem('lmStudioMcpIntegrations', JSON.stringify(integrations, null, 2));
            } else {
                localStorage.removeItem('lmStudioMcpIntegrations');
            }
        };

        const addMcpToolFromInput = (value = '') => {
            const normalizedTool = value.trim();
            if (!normalizedTool) {
                return;
            }

            selectedMcpTools = normalizeMcpTools([...selectedMcpTools, normalizedTool]);
            renderSelectedMcpTools();
            clearMcpError();

            if (mcpToolInput) {
                mcpToolInput.value = '';
                mcpToolInput.focus();
            }
        };

        const applyMcpTemplate = (templateName) => {
            const templates = {
                huggingface: {
                    type: 'ephemeral_mcp',
                    target: 'https://huggingface.co/mcp',
                    label: 'huggingface',
                    allowedTools: ['model_search']
                },
                brave: {
                    type: 'ephemeral_mcp',
                    target: 'https://api.search.brave.com/res/v1/mcp?key=YOUR_BRAVE_API_KEY',
                    label: 'brave-search',
                    allowedTools: ['search']
                },
                serpapi: {
                    type: 'ephemeral_mcp',
                    target: 'https://mcp.serpapi.com/YOUR_SERPAPI_API_KEY/mcp',
                    label: 'serpapi',
                    allowedTools: ['search']
                },
                playwright: {
                    type: 'plugin',
                    target: 'mcp/playwright',
                    label: 'Playwright',
                    allowedTools: ['browser_navigate']
                }
            };

            const template = templates[templateName];
            if (!template) {
                return;
            }

            openMcpBuilder(template, null);
        };

        if (configLmMcpBtn) {
            configLmMcpBtn.addEventListener('click', () => {
                loadWorkingMcpIntegrations();
                showInputModal(lmMcpModal);
                setTimeout(() => {
                    addMcpIntegrationBtn?.focus();
                }, 150);
            });
        }

        const closeLmMcpBtnX = document.getElementById('close-lmstudio-mcp-input-modal');
        const cancelLmMcpBtn = document.getElementById('cancel-lmstudio-mcp-input-modal');
        const clearLmMcpBtn = document.getElementById('clear-lmstudio-mcp-input-modal');
        const saveLmMcpBtn = document.getElementById('save-lmstudio-mcp-input-modal');

        const dismissLmMcpModal = () => {
            loadWorkingMcpIntegrations();
            hideInputModal(lmMcpModal);
        };

        if (closeLmMcpBtnX) closeLmMcpBtnX.addEventListener('click', dismissLmMcpModal);
        if (cancelLmMcpBtn) cancelLmMcpBtn.addEventListener('click', dismissLmMcpModal);

        if (mcpTypeSelect) {
            mcpTypeSelect.addEventListener('change', () => {
                updateMcpTargetCopy();
                clearMcpError();
            });
        }

        if (addMcpIntegrationBtn) {
            addMcpIntegrationBtn.addEventListener('click', () => {
                if (isMcpBuilderOpen()) {
                    showMcpError('Save or cancel the current integration before starting another one.');
                    return;
                }

                openMcpBuilder();
            });
        }

        mcpTemplateButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (isMcpBuilderOpen()) {
                    showMcpError('Save or cancel the current integration before applying a preset.');
                    return;
                }

                applyMcpTemplate(button.dataset.mcpTemplate || '');
            });
        });

        if (addMcpToolBtn && mcpToolInput) {
            addMcpToolBtn.addEventListener('click', () => addMcpToolFromInput(mcpToolInput.value));
            mcpToolInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    addMcpToolFromInput(mcpToolInput.value);
                }
            });
        }

        mcpToolSuggestionButtons.forEach(button => {
            button.addEventListener('click', () => addMcpToolFromInput(button.dataset.mcpToolSuggestion || ''));
        });

        if (mcpSelectedTools) {
            mcpSelectedTools.addEventListener('click', (event) => {
                const removeBtn = event.target.closest('[data-remove-mcp-tool]');
                if (!removeBtn) {
                    return;
                }

                const toolToRemove = removeBtn.dataset.removeMcpTool || '';
                selectedMcpTools = selectedMcpTools.filter(tool => tool !== toolToRemove);
                renderSelectedMcpTools();
            });
        }

        if (mcpIntegrationsList) {
            mcpIntegrationsList.addEventListener('click', (event) => {
                const actionBtn = event.target.closest('[data-mcp-action]');
                if (!actionBtn) {
                    return;
                }

                const action = actionBtn.dataset.mcpAction;
                const index = Number.parseInt(actionBtn.dataset.mcpIndex || '', 10);
                if (!Number.isInteger(index) || index < 0 || index >= workingMcpIntegrations.length) {
                    return;
                }

                if (isMcpBuilderOpen()) {
                    showMcpError('Save or cancel the current integration before editing the list.');
                    return;
                }

                if (action === 'remove') {
                    workingMcpIntegrations.splice(index, 1);
                    renderMcpIntegrationsList();
                    return;
                }

                if (action === 'edit') {
                    openMcpBuilder(getMcpEditorModel(workingMcpIntegrations[index]), index);
                }
            });
        }

        if (closeMcpBuilderBtn) closeMcpBuilderBtn.addEventListener('click', closeMcpBuilder);
        if (cancelMcpBuilderBtn) cancelMcpBuilderBtn.addEventListener('click', closeMcpBuilder);

        if (saveMcpBuilderBtn) {
            saveMcpBuilderBtn.addEventListener('click', () => {
                clearMcpError();
                const integration = buildMcpIntegrationFromForm();
                if (!integration) {
                    return;
                }

                if (editingMcpIndex === null) {
                    workingMcpIntegrations.push(integration);
                } else {
                    workingMcpIntegrations[editingMcpIndex] = integration;
                }

                renderMcpIntegrationsList();
                closeMcpBuilder();
            });
        }

        [mcpTargetInput, mcpLabelInput, mcpToolInput].forEach(input => {
            if (input) {
                input.addEventListener('input', clearMcpError);
            }
        });

        if (clearLmMcpBtn) {
            clearLmMcpBtn.addEventListener('click', async () => {
                workingMcpIntegrations = [];
                closeMcpBuilder();
                renderMcpIntegrationsList();
                await persistMcpIntegrations([]);
                updateConnectionStatusDisplays();
                hideInputModal(lmMcpModal);
            });
        }

        if (saveLmMcpBtn) {
            saveLmMcpBtn.addEventListener('click', async () => {
                clearMcpError();

                if (mcpBuilderPanel && !mcpBuilderPanel.classList.contains('hidden')) {
                    showMcpError('Save or cancel the current integration before closing.');
                    return;
                }

                await persistMcpIntegrations(workingMcpIntegrations);
                updateConnectionStatusDisplays();
                hideInputModal(lmMcpModal);
            });
        }

        lmMcpModal.addEventListener('click', e => {
            if (e.target === lmMcpModal) dismissLmMcpModal();
        });

        updateMcpTargetCopy();
        renderSelectedMcpTools();
        renderMcpIntegrationsList();
    }
}

/**
 * Initializes the settings modal
 */
export function initializeSettingsModal() {

    // Close modal when clicking outside
    if (settingsModal) {
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                hideSettingsModal();
            }
        });
    }

    // Initialize mobile navigation
    initializeSettingsModalNavigation();

    // Initialize manual input focus handling
    initializeManualInputFocus();

    // Initialize collapse connection input sub-modals (IP/Port and OpenRouter key)
    initializeConnectionInputModals();

    // Initialize Saved Presets list
    initializeConnectionPresetList();

    // Initialize delete confirmation modal for Saved Presets
    initializeDeleteConnectionPresetModal();

    // Initialize the system prompt overlay editor
    initializeSystemPromptOverlay();

    // Initialize the clear system prompt modal
    initializeClearSystemPromptModal();

    // Initialize help link from settings
    initializeSettingsHelpLink();
}

/**
 * Initialize the help link in the settings modal
 */
function initializeSettingsHelpLink() {
    const openHelpFromSettingsLink = document.getElementById('open-help-from-settings-link');
    const helpModal = document.getElementById('help-modal');

    if (openHelpFromSettingsLink && helpModal) {
        openHelpFromSettingsLink.addEventListener('click', (e) => {
            e.preventDefault();

            // Close the settings modal first
            const settingsModalContent = settingsModal?.querySelector('.modal-content');
            if (settingsModal) {
                if (settingsModalContent) {
                    settingsModalContent.classList.add('animate-modal-out');
                    setTimeout(() => {
                        settingsModal.classList.add('hidden');
                        settingsModalContent.classList.remove('animate-modal-out');

                        // Then open the help modal
                        helpModal.classList.remove('hidden');
                        const helpModalContent = helpModal.querySelector('.modal-content');
                        if (helpModalContent) {
                            helpModalContent.classList.add('animate-modal-in');

                            // Reset scroll position to top
                            const scrollableContent = helpModal.querySelector('.overflow-y-auto');
                            if (scrollableContent) {
                                scrollableContent.scrollTop = 0;
                            }

                            setTimeout(() => {
                                helpModalContent.classList.remove('animate-modal-in');
                            }, 300);
                        }
                    }, 300);
                } else {
                    // Fallback if modalContent is null
                    settingsModal.classList.add('hidden');
                    helpModal.classList.remove('hidden');
                }
            }
        });
    }
}
