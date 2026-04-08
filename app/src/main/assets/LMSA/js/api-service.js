// API Service for handling server communication
import { serverIpInput, serverPortInput, loadedModelDisplay } from './dom-elements.js';
import { getLightThemeEnabled, getUseOllama, getUseOpenRouter, getOpenRouterApiKey, getLMStudioApiToken } from './settings-manager.js';
import { showIpPortErrorModal, hideIpPortErrorModal } from './ui-manager.js';

let API_URL = '';
let availableModels = [];
const LOCAL_SELECTED_MODEL_KEY = 'localSelectedModel';

// Add global model tracking declaration to make TypeScript/linting happy
// window.currentLoadedModel tracks the currently loaded model name
// Add a flag to track if this is the initial startup
window.isInitialStartup = true;

// Cache for model info to reduce API calls
let modelInfoCache = {
    data: null,
    timestamp: 0,
    ttl: 5000 // 5 second cache
};

// Cache for API version detection: 'v1native' | 'legacy' | null (unknown)
let apiVersionCache = {
    version: null,       // 'v1native' = /api/v1/* works; 'legacy' = only /v1/* works
    ip: null,
    port: null,
    timestamp: 0,
    ttl: 30000           // Re-detect every 30 s in case LM Studio is updated
};

/**
 * Returns headers for LM Studio API requests, including an Authorization Bearer
 * token when the user has configured one (required for auth-enabled LM Studio servers).
 * @returns {Object}
 */
function getLMStudioAuthHeaders() {
    const token = getLMStudioApiToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function getLocalServerAuthHeaders() {
    return getUseOllama() ? {} : getLMStudioAuthHeaders();
}

/**
 * Detect which API version the connected LM Studio instance supports.
 * Tries /api/v1/models (native v1, LM Studio ≥ 0.3.6) first;
 * falls back to /v1/models (legacy OpenAI-compat).
 * @param {string} ip
 * @param {string} port
 * @returns {Promise<'v1native'|'legacy'>}
 */
async function detectApiVersion(ip, port) {
    const now = Date.now();
    if (
        apiVersionCache.version &&
        apiVersionCache.ip === ip &&
        apiVersionCache.port === port &&
        (now - apiVersionCache.timestamp) < apiVersionCache.ttl
    ) {
        return apiVersionCache.version;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`http://${ip}:${port}/api/v1/models`, {
            signal: controller.signal,
            headers: getLMStudioAuthHeaders()
        }).catch(() => ({ ok: false }));
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json().catch(() => null);
            // Native v1 API returns { models: [...] } or { data: [...] } (OpenAI-compat format)
            if (data && (Array.isArray(data.models) || Array.isArray(data.data))) {
                apiVersionCache = { version: 'v1native', ip, port, timestamp: now, ttl: 30000 };
                console.log('LM Studio native v1 API detected (/api/v1/*)');
                return 'v1native';
            }
        }
    } catch (_) { /* fall through */ }

    apiVersionCache = { version: 'legacy', ip, port, timestamp: now, ttl: 30000 };
    console.log('LM Studio legacy API detected (/v1/*)');
    return 'legacy';
}

// Debounce timer for fetchAvailableModels
let fetchModelsDebounceTimer = null;
let lastFetchPromise = null;

function getPersistedLocalSelectedModel() {
    const savedModel = localStorage.getItem(LOCAL_SELECTED_MODEL_KEY);
    return savedModel && savedModel.trim() !== '' ? savedModel : null;
}

function setPersistedLocalSelectedModel(modelId) {
    if (modelId && modelId.trim() !== '') {
        localStorage.setItem(LOCAL_SELECTED_MODEL_KEY, modelId);
    } else {
        localStorage.removeItem(LOCAL_SELECTED_MODEL_KEY);
    }
}

/**
 * Updates the server URL based on IP and port inputs
 */
/**
 * Validates the IP and Port fields
 * @returns {boolean} - True if valid, false if invalid
 */
export function validateIpPort() {
    const serverIpInput = document.getElementById('server-ip');
    const serverPortInput = document.getElementById('server-port');

    // Return false if elements are not found
    if (!serverIpInput || !serverPortInput) {
        console.error('Server IP or Port input element not found');
        return false;
    }

    const ip = serverIpInput.value.trim();
    const port = serverPortInput.value.trim();

    // Clear any previous validation errors
    clearValidationErrors();

    // If either field has content, both must be filled
    if ((ip && !port) || (!ip && port)) {
        showValidationError();
        return false;
    }
    return true;
}

/**
 * Saves the server settings and fetches models
 */
export function saveServerSettings() {
    const serverIpInput = document.getElementById('server-ip');
    const serverPortInput = document.getElementById('server-port');

    if (!serverIpInput || !serverPortInput) {
        console.error('Server IP or Port input element not found');
        return;
    }

    const ip = serverIpInput.value.trim();
    const port = serverPortInput.value.trim();

    if (ip && port) {
        API_URL = `http://${ip}:${port}/v1/chat/completions`;
        localStorage.setItem('serverIp', ip);
        localStorage.setItem('serverPort', port);
        fetchAvailableModels();
    }
}

/**
 * Updates the server URL based on IP and port inputs
 * Kept for backward compatibility if needed
 */
export function updateServerUrl() {
    if (validateIpPort()) {
        saveServerSettings();
        return true;
    }
    return false;
}

/**
 * Shows validation error for IP/Port fields
 */
function showValidationError() {
    const serverIpInput = document.getElementById('server-ip');
    const serverPortInput = document.getElementById('server-port');

    if (!serverIpInput || !serverPortInput) {
        console.error('Server IP or Port input element not found');
        return;
    }

    const ip = serverIpInput.value.trim();
    const port = serverPortInput.value.trim();

    // Add error styling to both fields
    serverIpInput.style.borderColor = '#ef4444';
    serverPortInput.style.borderColor = '#ef4444';

    // Determine the error message
    let message = '';
    if (ip && !port) {
        message = 'Port is required when a hostname or IP address is specified';
    } else if (!ip && port) {
        message = 'A hostname or IP address is required when a port is specified';
    }

    // Show the error modal if there is a message
    if (message) {
        showIpPortErrorModal(message);
    }
}

/**
 * Clears validation errors for IP/Port fields
 */
function clearValidationErrors() {
    const serverIpInput = document.getElementById('server-ip');
    const serverPortInput = document.getElementById('server-port');

    if (serverIpInput) {
        serverIpInput.style.borderColor = '';
    }
    if (serverPortInput) {
        serverPortInput.style.borderColor = '';
    }

    // Ensure the error modal is hidden
    hideIpPortErrorModal();

    // Remove legacy error message if it still exists
    const errorContainer = document.getElementById('ip-port-error');
    if (errorContainer) {
        errorContainer.remove();
    }
}

/**
 * Fetches available models from the server
 * @returns {Promise<Array>} - Array of available model objects
 */
export async function fetchAvailableModels(options = {}) {
    try {
        // OpenRouter branch: fetch cloud models using API key
        if (getUseOpenRouter()) {
            const apiKey = getOpenRouterApiKey();
            if (!apiKey) {
                console.error('OpenRouter API key is not set');
                availableModels = [];
                return [];
            }
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                const response = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    console.error('OpenRouter models fetch failed:', response.status, response.statusText);
                    availableModels = [];
                    return [];
                }
                const data = await response.json();
                if (!data || !data.data || !Array.isArray(data.data)) {
                    console.error('Unexpected OpenRouter models response:', data);
                    availableModels = [];
                    return [];
                }
                const allModelIds = data.data.map(m => m.id);
                const modelObjects = data.data.map(m => ({ id: m.id }));
                console.log('OpenRouter models loaded:', allModelIds.length);

                // Dummy model to show "No model selected" state - not an actual API model
                const DUMMY_NO_MODEL = 'dummy/no-model-selected';

                // Check if user has a saved selection from previous manual choice
                const savedSelection = localStorage.getItem('openRouterSelectedModel');
                const activeModel = (savedSelection && allModelIds.includes(savedSelection))
                    ? savedSelection
                    : DUMMY_NO_MODEL;

                // Always include the dummy model in the list if we're using it
                if (activeModel === DUMMY_NO_MODEL) {
                    modelObjects.unshift({ id: DUMMY_NO_MODEL });
                    window.currentLoadedModel = null; // null indicates no model loaded
                    availableModels = [];
                } else {
                    // User has a saved selection - use it
                    window.currentLoadedModel = activeModel;
                    availableModels = [activeModel];
                }

                // Clean up stale saved selection if it no longer exists
                if (savedSelection && !allModelIds.includes(savedSelection)) {
                    localStorage.removeItem('openRouterSelectedModel');
                }

                console.log('OpenRouter models loaded - active model:', activeModel);
                return modelObjects;
            } catch (err) {
                console.error('Error fetching OpenRouter models:', err);
                availableModels = [];
                return [];
            }
        }

        if (!serverIpInput || !serverPortInput) {
            console.error('Server IP or port input elements not found');
            return [];
        }

        const ip = serverIpInput.value.trim();
        const port = serverPortInput.value.trim();

        if (!ip || !port) {
            console.error('Server IP or port is empty');
            return [];
        }

        // Check cache first (unless caller explicitly requests a fresh status read)
        const now = Date.now();
        if (!options.forceRefresh && modelInfoCache.data && (now - modelInfoCache.timestamp) < modelInfoCache.ttl) {
            console.log('Returning cached model info');
            return modelInfoCache.data;
        }

        if (getUseOllama()) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
                const modelsResponse = await fetch(`http://${ip}:${port}/api/tags`, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!modelsResponse.ok) {
                    console.error('Failed to fetch Ollama models:', modelsResponse.status, modelsResponse.statusText);
                    availableModels = [];
                    if (loadedModelDisplay) loadedModelDisplay.classList.add('hidden');
                    return [];
                }

                const data = await modelsResponse.json();
                const rawModels = Array.isArray(data?.models) ? data.models : [];
                const modelsList = rawModels.map(model => ({
                    ...model,
                    id: model.name || model.model,
                    display_name: model.name || model.model
                })).filter(model => Boolean(model.id));

                let selectedModelInfo = null;

                try {
                    const runningController = new AbortController();
                    const runningTimeoutId = setTimeout(() => runningController.abort(), 3000);
                    const runningResponse = await fetch(`http://${ip}:${port}/api/ps`, {
                        signal: runningController.signal
                    }).catch(() => ({ ok: false }));
                    clearTimeout(runningTimeoutId);

                    if (runningResponse.ok) {
                        const runningData = await runningResponse.json();
                        const runningModelId = runningData?.models?.[0]?.name || runningData?.models?.[0]?.model;
                        if (runningModelId) {
                            selectedModelInfo = modelsList.find(model => model.id === runningModelId) || { id: runningModelId };
                        }
                    }
                } catch (_) {
                    // Ignore running-model detection errors and fall back to persisted selection.
                }

                if (!selectedModelInfo) {
                    const persistedModelId = window.currentLoadedModel || getPersistedLocalSelectedModel();
                    if (persistedModelId) {
                        selectedModelInfo = modelsList.find(model => model.id === persistedModelId) || null;
                    }
                }

                if (selectedModelInfo) {
                    availableModels = [selectedModelInfo.id];
                    window.currentLoadedModel = selectedModelInfo.id;
                    setPersistedLocalSelectedModel(selectedModelInfo.id);

                    try {
                        const { updateFileUploadCapabilities } = await import('./file-upload.js');
                        await updateFileUploadCapabilities();
                    } catch (error) {
                        console.error('Failed to update file upload capabilities after Ollama model detection:', error);
                    }

                    updateLoadedModelDisplay(selectedModelInfo.id);
                    if (loadedModelDisplay) {
                        loadedModelDisplay.classList.remove('hidden');
                    }
                } else {
                    availableModels = [];
                    window.currentLoadedModel = null;

                    const persistedModel = getPersistedLocalSelectedModel();
                    if (persistedModel && !modelsList.some(model => model.id === persistedModel)) {
                        setPersistedLocalSelectedModel(null);
                    }

                    hideLoadedModelDisplay();
                }

                modelInfoCache.data = modelsList;
                modelInfoCache.timestamp = Date.now();

                return modelsList;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                const errorMessage = fetchError.message || fetchError.toString();
                const isUnsafePortError = errorMessage.includes('ERR_UNSAFE_PORT') ||
                    errorMessage.includes('Failed to fetch') ||
                    errorMessage.includes('net::ERR_');

                if (!isUnsafePortError) {
                    console.error('Error fetching Ollama models:', fetchError);
                }

                availableModels = [];
                if (loadedModelDisplay) {
                    loadedModelDisplay.classList.add('hidden');
                }
                return [];
            }
        }

        // Debounce rapid calls - if a fetch is already in progress, return that promise
        if (lastFetchPromise) {
            console.log('Fetch already in progress, returning existing promise');
            return lastFetchPromise;
        }

        // Create the fetch promise
        lastFetchPromise = (async () => {
            // Add a timeout to the fetch request to prevent long waits
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            try {
                // ── Detect API version then fetch the model list ─────────────────────
                const apiVersion = await detectApiVersion(ip, port);

                let modelsList = [];
                let loadedModelInfo = null;

                if (apiVersion === 'v1native') {
                    // ── Modern LM Studio native API (≥ 0.3.6) ────────────────────────
                    // GET /api/v1/models → { models: [ { key, display_name, loaded_instances: [...] } ] }
                    const modelsResponse = await fetch(`http://${ip}:${port}/api/v1/models`, {
                        signal: controller.signal,
                        headers: getLocalServerAuthHeaders()
                    });

                    clearTimeout(timeoutId);

                    if (!modelsResponse.ok) {
                        console.error('Failed to fetch models (v1native):', modelsResponse.status, modelsResponse.statusText);
                        availableModels = [];
                        if (loadedModelDisplay) loadedModelDisplay.classList.add('hidden');
                        return [];
                    }

                    const nativeData = await modelsResponse.json();

                    // Support both { models: [...] } and { data: [...] } response formats
                    const rawModels = nativeData && (
                        Array.isArray(nativeData.models) ? nativeData.models :
                        Array.isArray(nativeData.data)   ? nativeData.data   : null
                    );

                    if (!rawModels) {
                        console.error('Invalid /api/v1/models response:', nativeData);
                        availableModels = [];
                        if (loadedModelDisplay) loadedModelDisplay.classList.add('hidden');
                        return [];
                    }

                    // Normalise model objects to have an `id` field.
                    // Native API uses `key`; OpenAI-compat format uses `id`.
                    modelsList = rawModels
                        .filter(m => m.type === 'llm' || m.type == null) // skip pure embedding models for chat
                        .map(m => ({
                            ...m,
                            id: m.key || m.id,          // normalise to `id`
                            display_name: m.display_name || m.key || m.id
                        }));

                    // Detect loaded model: check loaded_instances (native format) OR state field (newer format)
                    const loadedNative = rawModels.find(
                        m => (Array.isArray(m.loaded_instances) && m.loaded_instances.length > 0) ||
                             m.state === 'loaded' || m.state === 'running'
                    );
                    if (loadedNative) {
                        // Use the instance_id from the first loaded instance as the canonical id
                        const instanceId = loadedNative.loaded_instances?.[0]?.id ||
                                           loadedNative.key || loadedNative.id;
                        loadedModelInfo = modelsList.find(m => m.id === instanceId) ||
                                          modelsList.find(m => m.id === (loadedNative.key || loadedNative.id)) ||
                                          modelsList[0];
                        if (loadedModelInfo) {
                            // Store the instance_id so unload uses the right value
                            loadedModelInfo._instanceId = instanceId;
                            console.log('Native v1 API: loaded model detected:', loadedModelInfo.id);
                        }
                    }
                } else {
                    // ── Legacy OpenAI-compat API (/v1/*) ─────────────────────────────
                    const modelsResponse = await fetch(`http://${ip}:${port}/v1/models`, {
                        signal: controller.signal,
                        headers: getLocalServerAuthHeaders()
                    });

                    clearTimeout(timeoutId);

                    if (!modelsResponse.ok) {
                        console.error('Failed to fetch models (legacy):', modelsResponse.status, modelsResponse.statusText);
                        availableModels = [];
                        if (loadedModelDisplay) loadedModelDisplay.classList.add('hidden');
                        return [];
                    }

                    const data = await modelsResponse.json();

                    if (!data || !data.data || !Array.isArray(data.data)) {
                        console.error('Invalid /v1/models response:', data);
                        availableModels = [];
                        if (loadedModelDisplay) loadedModelDisplay.classList.add('hidden');
                        return [];
                    }

                    modelsList = data.data;

                    // Legacy Method 1: Look for status flags in the API response
                    loadedModelInfo = modelsList.find(model =>
                        model.ready === true ||
                        model.loaded === true ||
                        model.active === true ||
                        model.current === true ||
                        model.status === 'loaded' ||
                        model.status === 'ready' ||
                        model.state === 'loaded' ||
                        model.state === 'ready' ||
                        model.status === 'active' ||
                        model.state === 'active'
                    );

                    // Legacy Method 2: Try additional info endpoints
                    if (!loadedModelInfo) {
                        const infoEndpoints = [
                            '/v1/internal/model/info',
                            '/v1/model/info'
                        ];
                        for (const endpoint of infoEndpoints) {
                            try {
                                const infoCtrl = new AbortController();
                                const infoTimer = setTimeout(() => infoCtrl.abort(), 2000);
                                const infoResp = await fetch(`http://${ip}:${port}${endpoint}`, {
                                    method: 'GET',
                                    headers: getLocalServerAuthHeaders(),
                                    signal: infoCtrl.signal
                                }).catch(() => ({ ok: false }));
                                clearTimeout(infoTimer);
                                if (infoResp.ok) {
                                    const modelInfo = await infoResp.json();
                                    if (modelInfo && modelInfo.id) {
                                        loadedModelInfo = modelsList.find(m => m.id === modelInfo.id);
                                        if (loadedModelInfo) {
                                            console.log('Found loaded model via legacy info endpoint:', loadedModelInfo.id);
                                            break;
                                        }
                                    }
                                }
                            } catch (_) { /* suppress */ }
                        }
                    }
                }

                // Method: Optional legacy completion probe (disabled by default to avoid noisy 400s)
                const apiVersion2 = apiVersionCache.version; // already resolved above
                const enableLegacyCompletionProbe =
                    apiVersion2 !== 'v1native' && // skip if we already have reliable detection
                    (options.enableCompletionProbe === true ||
                     localStorage.getItem('enableLegacyCompletionProbe') === 'true');

                if (enableLegacyCompletionProbe && !loadedModelInfo && modelsList.length > 0 && !window.currentLoadedModel) {
                    try {
                        const probeCtrl = new AbortController();
                        const probeTimer = setTimeout(() => probeCtrl.abort(), 3000);

                        const chatResponse = await fetch(`http://${ip}:${port}/v1/chat/completions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...getLocalServerAuthHeaders()
                            },
                            body: JSON.stringify({
                                messages: [
                                    { role: 'system', content: 'You are a helpful assistant.' },
                                    { role: 'user', content: 'test' }
                                ],
                                max_tokens: 1,
                                stream: false
                            }),
                            signal: probeCtrl.signal
                        }).catch(() => ({ ok: false }));

                        clearTimeout(probeTimer);

                        if (chatResponse.ok) {
                            const result = await chatResponse.json();
                            if (result && result.model) {
                                loadedModelInfo = modelsList.find(m => m.id === result.model);
                                if (!loadedModelInfo && modelsList.length > 0) {
                                    loadedModelInfo = modelsList[0];
                                }
                            }
                        }
                    } catch (_) { /* suppress probe errors */ }
                }

                // Method 4: Optional fallback to previously selected model.
                // Disabled for strict status checks (e.g. when opening the Models modal),
                // so we never show stale "last switched" model names.
                if (!loadedModelInfo && options.disableSelectionFallback !== true) {
                    const fallbackModelId = window.currentLoadedModel || getPersistedLocalSelectedModel();
                    const matchingModel = fallbackModelId
                        ? modelsList.find(model => model.id === fallbackModelId)
                        : null;
                    if (matchingModel) {
                        console.log('Using previously stored loaded model:', fallbackModelId);
                        loadedModelInfo = matchingModel;
                    }
                }

                if (loadedModelInfo) {
                    // We found a loaded model
                    availableModels = [loadedModelInfo.id];

                    // Store the loaded model name in a global variable for easy access
                    window.currentLoadedModel = loadedModelInfo.id;
                    setPersistedLocalSelectedModel(loadedModelInfo.id);

                    // Update file upload capabilities now that we have a model
                    try {
                        const { updateFileUploadCapabilities } = await import('./file-upload.js');
                        await updateFileUploadCapabilities();
                    } catch (error) {
                        console.error('Failed to update file upload capabilities after model detection:', error);
                    }

                    // Check saved banner visibility preference before showing
                    const modelBannerVisible = localStorage.getItem('modelBannerVisible');

                    if (modelBannerVisible !== 'false') {
                        // Only show the banner if it wasn't explicitly hidden by the user
                        updateLoadedModelDisplay(loadedModelInfo.id);

                        // Ensure the model banner is visible
                        if (loadedModelDisplay) {
                            loadedModelDisplay.classList.remove('hidden');
                        }
                    } else {
                        // Remove the banner completely from DOM
                        const modelWrapper = document.getElementById('loaded-model-wrapper');
                        if (modelWrapper) {
                            modelWrapper.remove();
                            // Reset the CSS variable to 0
                            document.documentElement.style.setProperty('--loaded-model-height', '0px');
                        }
                    }
                } else {
                    // No loaded model found in the API response
                    console.log('No loaded model found after all detection methods');
                    availableModels = []; // No model is truly loaded
                    window.currentLoadedModel = null; // Clear the global variable
                    console.log('Cleared global currentLoadedModel');

                    // Clean up stale persisted model if it no longer exists in the server list.
                    const persistedModel = getPersistedLocalSelectedModel();
                    if (persistedModel && !modelsList.some(model => model.id === persistedModel)) {
                        setPersistedLocalSelectedModel(null);
                    }

                    // Check if the banner was manually shown by the user
                    const manuallyShown = loadedModelDisplay &&
                        (loadedModelDisplay.dataset.manuallyShown === 'true');

                    // Check if the banner was shown recently (within the last 10 seconds)
                    const manuallyShownAt = localStorage.getItem('modelBannerManuallyShownAt');
                    const recentlyShown = manuallyShownAt &&
                        (Date.now() - parseInt(manuallyShownAt)) < 10000; // 10 seconds

                    // Only hide the model banner if it wasn't manually shown by user
                    if (!manuallyShown && !recentlyShown) {
                        hideLoadedModelDisplay();
                    } else {
                        console.log('Banner was manually shown by user, keeping it visible even with no model loaded');
                        // If the banner is already showing, make sure it still shows "No model loaded"
                        if (loadedModelDisplay && !loadedModelDisplay.classList.contains('hidden')) {
                            loadedModelDisplay.textContent = 'No model loaded';
                            loadedModelDisplay.dataset.hasLoadedModel = 'false';
                        }
                    }
                }

                // Return the full model data for UI display
                // Update cache before returning
                modelInfoCache.data = modelsList;
                modelInfoCache.timestamp = Date.now();

                return modelsList;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                // Suppress console errors for unsafe ports and common fetch failures
                const errorMessage = fetchError.message || fetchError.toString();
                const isUnsafePortError = errorMessage.includes('ERR_UNSAFE_PORT') ||
                    errorMessage.includes('Failed to fetch') ||
                    errorMessage.includes('net::ERR_');

                if (!isUnsafePortError) {
                    console.error('Error fetching models:', fetchError);
                }
                availableModels = []; // Ensure availableModels is empty
                if (loadedModelDisplay) {
                    loadedModelDisplay.classList.add('hidden');
                }
                return [];
            } finally {
                // Clear the promise reference when done
                lastFetchPromise = null;
            }
        })();

        return lastFetchPromise;
    } catch (error) {
        // Suppress console errors for unsafe ports and common fetch failures
        const errorMessage = error.message || error.toString();
        const isUnsafePortError = errorMessage.includes('ERR_UNSAFE_PORT') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('net::ERR_');

        if (!isUnsafePortError) {
            console.error('Unexpected error in fetchAvailableModels:', error);
        }
        availableModels = []; // Ensure availableModels is empty
        if (loadedModelDisplay) {
            loadedModelDisplay.classList.add('hidden');
        }
        lastFetchPromise = null;
        return [];
    }
}

/**
 * Updates the loaded model display
 * @param {string} modelName - The name of the loaded model
 * @param {boolean} forceShow - Whether to force showing the banner regardless of settings (no longer used)
 */
export function updateLoadedModelDisplay(modelName, forceShow = false) {
    if (loadedModelDisplay) {
        // Always update global variable with current model name
        window.currentLoadedModel = modelName;
        if (!getUseOpenRouter()) {
            setPersistedLocalSelectedModel(modelName);
        }

        // Update the text content (even though it's hidden)
        loadedModelDisplay.textContent = `Loaded Model: ${modelName}`;

        // Set data attribute to indicate a model is loaded
        loadedModelDisplay.dataset.hasLoadedModel = 'true';

        // Banner is always hidden now, so we don't need to show it
        // Just ensure the CSS variable is set to 0
        document.documentElement.style.setProperty('--loaded-model-height', '0px');

        // Update welcome message position (with banner hidden)
        import('./ui-manager.js').then(module => {
            // Check if welcome message is visible before adjusting its position
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage && welcomeMessage.style.display !== 'none') {
                module.ensureWelcomeMessagePosition();
            }
        });
    }
}

/**
 * Removes the loaded model display completely
 */
export function hideLoadedModelDisplay(saveState = true) {
    // Remove the wrapper completely from DOM
    const modelWrapper = document.getElementById('loaded-model-wrapper');
    if (modelWrapper) {
        modelWrapper.remove();
        // Reset the CSS variable to 0
        document.documentElement.style.setProperty('--loaded-model-height', '0px');
    }

    // Always store banner state as hidden
    localStorage.setItem('modelBannerVisible', 'false');

    // Update welcome message position
    import('./ui-manager.js').then(module => {
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage && welcomeMessage.style.display !== 'none') {
            module.ensureWelcomeMessagePosition();
        }
    });

    // Don't clear the global model variable when hiding the banner
    // This ensures the models modal still recognizes the loaded model even when the banner is hidden
}

/**
 * Checks if the server is running
 * @returns {Promise<boolean>} - True if server is running, false otherwise
 */
export async function isServerRunning() {
    try {
        // OpenRouter: server is "running" when a non-empty API key is configured
        if (getUseOpenRouter()) {
            return getOpenRouterApiKey().trim().length > 0;
        }

        if (!serverIpInput || !serverPortInput) {
            console.error('Server IP or port input elements not found');
            return false;
        }

        const ip = serverIpInput.value.trim();
        const port = serverPortInput.value.trim();

        if (!ip || !port) {
            console.error('Server IP or port is empty');
            return false;
        }

        // Add a timeout to the fetch request to prevent long waits
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
            if (getUseOllama()) {
                const response = await fetch(`http://${ip}:${port}/api/tags`, {
                    method: 'GET',
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                return response.ok;
            }

            // Try the modern native v1 endpoint first, fall back to legacy
            const apiVer = await detectApiVersion(ip, port);
            const checkUrl = apiVer === 'v1native'
                ? `http://${ip}:${port}/api/v1/models`
                : `http://${ip}:${port}/v1/models`;

            const response = await fetch(checkUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: getLocalServerAuthHeaders()
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error('Error checking server status:', fetchError);
            return false;
        }
    } catch (error) {
        console.error('Unexpected error in isServerRunning:', error);
        return false;
    }
}

/**
 * Try different known LM Studio API endpoints for an operation
 * @param {string} ip - Server IP
 * @param {string} port - Server port
 * @param {string} operation - Operation name for logging
 * @param {Array} endpoints - Array of endpoint objects with path and method
 * @param {Object} requestData - Request data to send
 * @returns {Promise<boolean>} - True if any endpoint succeeds
 */
async function tryEndpoints(ip, port, operation, endpoints, requestData = null) {
    for (const endpoint of endpoints) {
        try {
            console.log(`Trying ${operation} with endpoint: ${endpoint.path}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const options = {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getLMStudioAuthHeaders()
                },
                signal: controller.signal
            };

            // Always include a body for POST/PUT methods, even if it's an empty object
            if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
                options.body = JSON.stringify(requestData || {});
            }

            const response = await fetch(`http://${ip}:${port}${endpoint.path}`, options)
                .catch(err => {
                    console.log(`Network error with ${endpoint.path}: ${err.name === 'AbortError' ? 'timeout' : 'connection failed'}`);
                    return { ok: false };
                });

            clearTimeout(timeoutId);

            if (response.ok) {
                console.log(`${operation} successful with endpoint: ${endpoint.path}`);
                return true;
            } else if (response.status) {
                console.log(`${operation} failed with endpoint ${endpoint.path}: HTTP ${response.status}`);
            } else {
                console.log(`${operation} failed with endpoint ${endpoint.path}: Network error`);
            }
        } catch (error) {
            console.log(`Error trying ${endpoint.path} for ${operation}: ${error.message || 'Unknown error'}`);
        }
    }

    return false;
}

/**
 * Wait for a model to be loaded (with timeout)
 * @param {string} ip - Server IP
 * @param {string} port - Server port
 * @param {string} modelId - Model ID to check
 * @param {number} maxAttempts - Maximum number of attempts
 * @returns {Promise<boolean>} - True if model is loaded
 */
async function waitForModelLoad(ip, port, modelId, maxAttempts = 10) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            console.log(`Checking if model is loaded (attempt ${attempt + 1}/${maxAttempts})...`);

            // Make a simple test completion to see if the model responds
            const testResponse = await fetch(`http://${ip}:${port}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getLMStudioAuthHeaders()
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: 'test' }
                    ],
                    max_tokens: 1,
                    stream: false
                }),
                timeout: 2000
            });

            if (testResponse.ok) {
                // Read the completed text - this confirms the model is actually loaded
                const response = await testResponse.json();
                console.log(`Model ${modelId} is now loaded and responding:`, response);

                // Store the current loaded model in a global variable for easy access
                window.currentLoadedModel = modelId;

                return true;
            }
        } catch (error) {
            console.log(`Model not loaded yet, waiting...`, error);
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.error(`Model ${modelId} failed to load after ${maxAttempts} attempts`);
    return false;
}

/**
 * Force load a model in LM Studio
 * This bypasses the API endpoints and uses the completion API itself
 * @param {string} ip - Server IP
 * @param {string} port - Server port
 * @param {string} modelId - Model ID to load
 * @returns {Promise<boolean>} - True if successful
 */
async function forceLoadModel(ip, port, modelId) {
    try {
        console.log(`Force loading model ${modelId} via completion API...`);

        // Make a special completion request that forces model loading
        // The long prompt forces LM Studio to fully load the model
        const response = await fetch(`http://${ip}:${port}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getLMStudioAuthHeaders()
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful AI assistant. Please respond with a single word: "LOADED" to indicate you are working properly.'
                    },
                    {
                        role: 'user',
                        content: 'Please respond with exactly one word: "LOADED". This is to verify you are working correctly.'
                    }
                ],
                temperature: 0.1,
                max_tokens: 10,
                stream: false
            }),
            timeout: 60000 // Long timeout to give the model time to load
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`Force load response:`, result);
            return true;
        } else {
            console.error(`Force load failed with status ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`Error during force load:`, error);
        return false;
    }
}

/**
 * Loads a model in LM Studio
 * @param {string} modelId - The ID of the model to load
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function loadModel(modelId) {
    try {
        // OpenRouter: no model loading needed — models are cloud-resident
        if (getUseOpenRouter()) {
            window.currentLoadedModel = modelId;
            availableModels = [modelId]; // keep getAvailableModels() in sync with selection
            localStorage.setItem('openRouterSelectedModel', modelId);
            updateLoadedModelDisplay(modelId);
            try {
                const { updateFileUploadCapabilities } = await import('./file-upload.js');
                await updateFileUploadCapabilities();
            } catch (error) {
                console.error('Failed to update file upload capabilities:', error);
            }
            return true;
        }

        if (!serverIpInput || !serverPortInput) {
            console.error('Server IP or port input elements not found');
            return false;
        }

        const ip = serverIpInput.value.trim();
        const port = serverPortInput.value.trim();

        if (!ip || !port) {
            console.error('Server IP or port is empty');
            return false;
        }

        // If using Ollama, we don't need to explicitly load models
        // Ollama loads them on demand
        if (getUseOllama()) {
            console.log(`Ollama mode enabled: Skipping explicit load for ${modelId}`);
            // Update the UI to show this model as loaded
            window.currentLoadedModel = modelId;
            availableModels = [modelId];
            setPersistedLocalSelectedModel(modelId);
            updateLoadedModelDisplay(modelId);
            
            // Allow file uploads if model is selected
            try {
                const { updateFileUploadCapabilities } = await import('./file-upload.js');
                await updateFileUploadCapabilities();
            } catch (error) {
                console.error('Failed to update file upload capabilities:', error);
            }
            
            return true;
        }

        console.log(`Attempting to load model: ${modelId}`);

        // ── Unload the currently loaded model before loading a new one ──────
        // This is required for LM Studio to actually switch models.
        const currentlyLoaded = window.currentLoadedModel;
        if (currentlyLoaded && currentlyLoaded !== modelId) {
            console.log(`Unloading current model "${currentlyLoaded}" before loading "${modelId}"...`);
            const apiVerUnload = await detectApiVersion(ip, port);
            let unloadSuccess = false;

            if (apiVerUnload === 'v1native') {
                unloadSuccess = await tryEndpoints(ip, port, 'Pre-load unload (native)', [
                    { path: '/api/v1/models/unload', method: 'POST' }
                ], { instance_id: currentlyLoaded });
            }

            if (!unloadSuccess) {
                // Legacy fallback
                unloadSuccess = await tryEndpoints(ip, port, 'Pre-load unload (legacy)', [
                    { path: '/v1/internal/model/unload', method: 'POST' },
                    { path: '/v1/model/unload', method: 'POST' },
                    { path: '/v1/models/unload', method: 'POST' }
                ], {});
            }

            if (unloadSuccess) {
                console.log(`Successfully unloaded "${currentlyLoaded}"`);
                window.currentLoadedModel = null;
                setPersistedLocalSelectedModel(null);
                // Give LM Studio a moment to finish unloading
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.warn(`Could not unload "${currentlyLoaded}" — proceeding with load anyway`);
            }

            // Invalidate the API version / model-info caches
            apiVersionCache.timestamp = 0;
            modelInfoCache.timestamp = 0;
        }

        // Determine API version and try the appropriate load endpoint first
        const apiVer = await detectApiVersion(ip, port);

        let directSuccess = false;

        if (apiVer === 'v1native') {
            // Modern LM Studio (≥ 0.3.6): POST /api/v1/models/load  { model: modelId }
            console.log(`Using native v1 API to load model: ${modelId}`);
            directSuccess = await tryEndpoints(ip, port, 'Load model (native)', [
                { path: '/api/v1/models/load', method: 'POST' }
            ], { model: modelId });

            // Invalidate the version cache so the next fetchAvailableModels re-reads loaded_instances
            apiVersionCache.timestamp = 0;

            if (!directSuccess) {
                // Unexpected — fall through to legacy endpoints
                console.log('Native /api/v1/models/load failed, trying legacy endpoints...');
            }
        }

        if (!directSuccess) {
            // Legacy fallback endpoints (older LM Studio versions)
            const loadEndpoints = [
                { path: '/v1/internal/model/load', method: 'POST' },
                { path: '/v1/model/load', method: 'POST' },
                { path: '/v1/models/load', method: 'POST' },
                { path: `/v1/models/${modelId}/load`, method: 'POST' }
            ];
            directSuccess = await tryEndpoints(ip, port, 'Load model (legacy)', loadEndpoints, { model_id: modelId });
        }

        // If the endpoint call succeeds, verify the model is actually loaded by making a test request
        if (directSuccess) {
            console.log(`API endpoint reported success, verifying model is actually loaded...`);
            const verified = await waitForModelLoad(ip, port, modelId, 5);

            if (verified) {
                console.log(`Successfully verified ${modelId} is loaded via endpoint method`);
                setPersistedLocalSelectedModel(modelId);
                await fetchAvailableModels();
                return true;
            } else {
                console.log(`API endpoint succeeded but model is not actually loaded, trying force load...`);
            }
        }

        // If direct loading failed or verification failed, use the force load method
        // This is the most reliable method to make LM Studio actually switch models
        const forceSuccess = await forceLoadModel(ip, port, modelId);

        if (forceSuccess) {
            console.log(`Successfully loaded ${modelId} via force load method`);
            setPersistedLocalSelectedModel(modelId);
            await fetchAvailableModels();
            return true;
        }

        console.error(`All methods failed to load model ${modelId}`);
        return false;
    } catch (error) {
        console.error('Error loading model:', error);
        return false;
    }
}

/**
 * Ejects (unloads) the current model from LM Studio
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function ejectModel() {
    try {
        // OpenRouter: nothing to eject
        if (getUseOpenRouter()) {
            return true;
        }

        if (!serverIpInput || !serverPortInput) {
            console.error('Server IP or port input elements not found');
            return false;
        }

        const ip = serverIpInput.value.trim();
        const port = serverPortInput.value.trim();

        if (!ip || !port) {
            console.error('Server IP or port is empty');
            return false;
        }

        // If using Ollama, we don't need to explicitly eject models
        if (getUseOllama()) {
            console.log('Ollama mode enabled: Skipping explicit eject');
            availableModels = [];
            window.currentLoadedModel = null;
            setPersistedLocalSelectedModel(null);
            if (loadedModelDisplay) {
                loadedModelDisplay.classList.add('hidden');
                loadedModelDisplay.dataset.hasLoadedModel = 'false';
                loadedModelDisplay.textContent = 'No model loaded';
            }
            try {
                const { updateFileUploadCapabilities } = await import('./file-upload.js');
                await updateFileUploadCapabilities();
            } catch (error) {
                console.error('Failed to update file upload capabilities after Ollama deselect:', error);
            }
            return true;
        }

        console.log('Attempting to eject model');

        // Determine API version and try the appropriate unload endpoint
        const apiVerEject = await detectApiVersion(ip, port);
        let success = false;

        if (apiVerEject === 'v1native') {
            // Modern LM Studio (≥ 0.3.6): POST /api/v1/models/unload  { instance_id: instanceId }
            // The instance_id is typically the model key (same as model id for most models)
            const instanceId = window.currentLoadedModel || '';
            console.log(`Using native v1 API to unload model instance: ${instanceId}`);
            if (instanceId) {
                success = await tryEndpoints(ip, port, 'Eject model (native)', [
                    { path: '/api/v1/models/unload', method: 'POST' }
                ], { instance_id: instanceId });
            }

            // Invalidate version cache to force re-fetch
            apiVersionCache.timestamp = 0;
        }

        if (!success) {
            // Legacy fallback endpoints
            const ejectEndpoints = [
                { path: '/v1/internal/model/unload', method: 'POST' },
                { path: '/v1/model/unload', method: 'POST' },
                { path: '/v1/models/unload', method: 'POST' }
            ];
            success = await tryEndpoints(ip, port, 'Eject model (legacy)', ejectEndpoints, {});
        }

        // If all attempts failed, try model-specific legacy path as last resort
        if (!success) {
            console.log('Standard eject endpoints failed, trying model-specific legacy path...');
            try {
                const legacyCtrl = new AbortController();
                const legacyTimer = setTimeout(() => legacyCtrl.abort(), 3000);
                const legacyResp = await fetch(`http://${ip}:${port}/v1/models`, {
                    signal: legacyCtrl.signal,
                    headers: getLMStudioAuthHeaders()
                }).catch(() => ({ ok: false }));
                clearTimeout(legacyTimer);

                if (legacyResp.ok) {
                    const data = await legacyResp.json();
                    const modelList = data?.data || [];
                    const loadedModel = modelList.find(m =>
                        m.ready === true || m.loaded === true ||
                        m.status === 'loaded' || m.status === 'ready' ||
                        m.state === 'loaded' || m.state === 'ready'
                    );
                    if (loadedModel) {
                        console.log(`Found loaded model: ${loadedModel.id}, trying model-specific eject...`);
                        success = await tryEndpoints(ip, port, 'Model-specific eject',
                            [{ path: `/v1/models/${loadedModel.id}/unload`, method: 'POST' }], {});
                    }
                }
            } catch (e) {
                console.log('Error in model-specific eject fallback:', e.message || 'Unknown error');
            }
        }

        if (success) {
            console.log('Successfully ejected model');
            // Clear the available models list and hide the model display
            availableModels = [];
            // This is where we SHOULD clear the global variable as the model is actually being ejected
            window.currentLoadedModel = null;
            setPersistedLocalSelectedModel(null);

            // Since we're actually ejecting the model, we need to update the UI
            // Call hideLoadedModelDisplay but prevent it from clearing currentLoadedModel again
            if (loadedModelDisplay) {
                loadedModelDisplay.classList.add('hidden');
                loadedModelDisplay.dataset.hasLoadedModel = 'false';
            }

            // Verify the model was actually ejected
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchAvailableModels();

            return true;
        } else {
            console.log('All eject endpoints failed - the model may still be loaded');

            // Force a refresh of the models list to update the UI regardless
            await fetchAvailableModels();

            return false;
        }
    } catch (error) {
        console.log('Error in ejectModel:', error.message || 'Unknown error');

        // Try to refresh the models list to at least update the UI
        try {
            await fetchAvailableModels();
        } catch (refreshError) {
            console.log('Failed to refresh models after eject error');
        }

        return false;
    }
}

/**
 * Gets the API URL
 * @returns {string} - The current API URL
 */
export function getApiUrl() {
    if (getUseOpenRouter()) {
        return 'https://openrouter.ai/api/v1/chat/completions';
    }
    if (!API_URL && serverIpInput && serverPortInput) {
        const ip = serverIpInput.value.trim();
        const port = serverPortInput.value.trim();

        if (ip && port) {
            API_URL = `http://${ip}:${port}/v1/chat/completions`;
            console.log('API URL was not set, creating from inputs:', API_URL);
        }
    }

    return API_URL;
}

/**
 * Gets the available models
 * @returns {Array} - Array of available model IDs
 */
export function getAvailableModels() {
    // Since availableModels contains string IDs, not objects, just return the array directly
    return [...availableModels]; // Return a copy of the array
}

/**
 * Loads saved server settings from localStorage
 */
export function loadServerSettings() {
    const savedIp = localStorage.getItem('serverIp');
    const savedPort = localStorage.getItem('serverPort');

    if (serverIpInput && serverPortInput) {
        if (savedIp) serverIpInput.value = savedIp;
        if (savedPort) serverPortInput.value = savedPort;

        if (savedIp && savedPort) {
            API_URL = `http://${savedIp}:${savedPort}/v1/chat/completions`;
            // Fetch models after setting the API URL, but set a flag to indicate this is the initial load
            window.isInitialStartup = true;
            setTimeout(() => fetchAvailableModels(), 500);



            // Reset the flag after a delay to allow for normal operation later
            setTimeout(() => {
                window.isInitialStartup = false;
            }, 2000);
        }

        // Event listeners for IP and port inputs removed to prevent validation on blur/change
        // Validation now happens only when closing settings or accepting changes

        // serverIpInput.addEventListener('change', updateServerUrl);
        // serverPortInput.addEventListener('change', updateServerUrl);

        // Apply to both input fields
        [serverIpInput, serverPortInput].forEach(input => {
            // Remove any inline styles to allow CSS variables to work
            input.style.removeProperty('background-color');
            input.style.removeProperty('color');

            // Add classes to ensure proper styling
            input.classList.add('theme-aware-input');
        });
    }
}
