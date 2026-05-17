import { 
    serverIpInput, 
    serverPortInput, 
    loadedModelDisplay 
} from './dom-elements.js';
import { showToastNotice } from './toast-notice.js';

import {
    getLMStudioApiToken,
    getUseOllama,
    getUseOpenRouter,
    getUseOpenAICompatible,
    getContextLength
} from './settings-manager.js';

// Configuration keys
const LOCAL_SELECTED_MODEL_KEY = 'localSelectedModel';

// Global state
let availableModels = [];
let lastFetchPromise = null;
let fetchModelsLock = false;

// Cache for API version detection
let apiVersionCache = {
    version: null,
    ip: null,
    port: null,
    timestamp: 0,
    ttl: 30000 // 30 seconds
};

let apiVersionDetectionPromise = null;

// Cache for model info to reduce API calls
let modelInfoCache = {
    data: null,
    timestamp: 0,
    ttl: 15000 // 15 seconds
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

function isCloudProviderActive() {
    return getUseOpenRouter() || getUseOpenAICompatible();
}

function getCloudSelectedModelKey() {
    if (getUseOpenRouter()) {
        return 'openRouterSelectedModel';
    } else if (getUseOpenAICompatible()) {
        return 'customOpenAISelectedModel';
    }
    return null;
}

/**
 * Detects if the LM Studio server is using the modern v1 Native API
 * or the legacy OpenAI-compatible API.
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

    if (apiVersionDetectionPromise) {
        return apiVersionDetectionPromise;
    }

    apiVersionDetectionPromise = (async () => {
        try {
            console.log(`Detecting LM Studio API version at http://${ip}:${port}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const response = await fetch(`http://${ip}:${port}/api/v1/models`, {
                signal: controller.signal,
                headers: getLMStudioAuthHeaders()
            }).catch(err => {
                console.warn(`Native API check failed (fetch): ${err.message}`);
                return { ok: false };
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json().catch(() => null);
                console.log('Native API probe response:', data);
                if (data && (Array.isArray(data.models) || Array.isArray(data.data))) {
                    apiVersionCache = { version: 'v1native', ip, port, timestamp: Date.now(), ttl: 60000 };
                    console.log('LM Studio native v1 API confirmed (/api/v1/*)');
                    return 'v1native';
                }
            }
        } catch (e) {
            console.warn(`Error during API version detection: ${e.message}`);
        } finally {
            apiVersionDetectionPromise = null;
        }

        apiVersionCache = { version: 'legacy', ip, port, timestamp: Date.now(), ttl: 30000 };
        console.log('LM Studio legacy API assumed (/v1/*)');
        return 'legacy';
    })();

    return apiVersionDetectionPromise;
}

/**
 * Fetches the absolute max context and currently active context for the loaded LM Studio model.
 * Uses the user-configured IP/port — never localhost.
 * Only meaningful when LM Studio is the active provider.
 * @returns {Promise<{maxLimit: number|null, currentActive: number|null}|null>}
 */
export async function getLMStudioContextSpecs() {
    // Fall back to localStorage so the section shows even when the DOM inputs
    // haven't been hydrated yet (e.g. first settings open before any model view).
    const ip = serverIpInput?.value.trim() || localStorage.getItem('serverIp') || '';
    const port = serverPortInput?.value.trim() || localStorage.getItem('serverPort') || '';
    if (!ip || !port || isCloudProviderActive() || getUseOllama()) return null;

    try {
        // Always probe the native endpoint directly — bypassing detectApiVersion avoids
        // a stale 'legacy' cache entry from blocking the section on first settings open.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        let response;
        try {
            response = await fetch(`http://${ip}:${port}/api/v1/models`, {
                signal: controller.signal,
                headers: getLMStudioAuthHeaders()
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (response.ok) {
            const data = await response.json();
            const models = data.models || data.data || [];
            if (Array.isArray(models)) {
                const loaded = models.find(m =>
                    Array.isArray(m.loaded_instances) && m.loaded_instances.length > 0
                );
                if (!loaded) return { maxLimit: null, currentActive: null };

                // max_context_length = model's absolute training max (e.g. 131072)
                // context_length at model level = what was actually loaded (e.g. 4096)
                const maxLimit = loaded.max_context_length ?? null;
                const instance = loaded.loaded_instances[0];

                // Try every known field name — LM Studio uses camelCase internally but
                // REST responses have varied across versions (snake_case vs camelCase).
                // Final fallback: model-level context_length when it differs from maxLimit.
                const currentActive =
                    instance?.context_length ??
                    instance?.contextLength ??
                    instance?.config?.context_length ??
                    instance?.config?.contextLength ??
                    (loaded.context_length != null && loaded.context_length !== maxLimit
                        ? loaded.context_length
                        : null);

                console.log('[ContextSpecs] loaded instance:', JSON.stringify(instance));
                console.log('[ContextSpecs] model-level context_length:', loaded.context_length, '| maxLimit:', maxLimit, '| currentActive:', currentActive);
                return { maxLimit, currentActive };
            }
        }

        // Legacy API: try well-known model info endpoints
        for (const path of ['/v1/internal/model/info', '/v1/model/info']) {
            try {
                const resp = await fetch(`http://${ip}:${port}${path}`, {
                    headers: getLMStudioAuthHeaders()
                });
                if (resp.ok) {
                    const info = await resp.json();
                    const maxLimit = info.max_context_length ?? info.context_length ?? null;
                    return { maxLimit, currentActive: null };
                }
            } catch (_) {}
        }
        return null;
    } catch (e) {
        console.warn('[ContextSpecs] fetch failed:', e.message);
        return null;
    }
}

/**
 * Detects the currently loaded model in LM Studio using a completion probe.
 * This is used when the models list API doesn't clearly indicate which model is active.
 * @param {string} ip - Server IP
 * @param {string} port - Server port
 * @param {Array} modelsList - List of available models to match against
 * @returns {Promise<Object|null>} - The loaded model object or null
 */
async function detectLmStudioLoadedModelViaCompletionProbe(ip, port, modelsList = []) {
    try {
        const apiVer = await detectApiVersion(ip, port);
        const useNative = apiVer === 'v1native';
        
        // Optimized detection for Native API: check models list first
        if (useNative) {
            try {
                const resp = await fetch(`http://${ip}:${port}/api/v1/models`, {
                    headers: getLMStudioAuthHeaders()
                });
                if (resp.ok) {
                    const data = await resp.json();
                    if (data && Array.isArray(data.models)) {
                        const loaded = data.models.find(m => Array.isArray(m.loaded_instances) && m.loaded_instances.length > 0);
                        if (loaded) {
                            const instanceId = loaded.loaded_instances[0].id;
                            console.log('Detected loaded model (native) via models list:', instanceId);
                            return modelsList.find(m => m.id === instanceId) || { id: instanceId };
                        }
                    }
                }
            } catch (_) { /* fallback to completion probe */ }
        }

        const probeCtrl = new AbortController();
        const probeTimer = setTimeout(() => probeCtrl.abort(), 3000);

        const endpoint = useNative ? `http://${ip}:${port}/api/v1/chat` : `http://${ip}:${port}/v1/chat/completions`;
        const ctxLen = getContextLength();

        const probeModel = modelsList[0]?.id ?? window.currentLoadedModel ?? '';
        const requestBody = useNative ? {
            model: probeModel,
            input: 'Respond with exactly: ok',
            stream: false
        } : {
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Respond with exactly: ok' }
            ],
            max_tokens: 1,
            stream: false
        };

        const chatResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getLocalServerAuthHeaders()
            },
            body: JSON.stringify(requestBody),
            signal: probeCtrl.signal
        }).catch(() => ({ ok: false }));

        clearTimeout(probeTimer);

        if (!chatResponse.ok) {
            return null;
        }

        const result = await chatResponse.json().catch(() => null);
        const detectedModelId = result?.model;
        if (!detectedModelId) {
            return null;
        }

        return modelsList.find(model => model.id === detectedModelId) || {
            id: detectedModelId,
            display_name: detectedModelId
        };
    } catch (_) {
        return null;
    }
}

/**
 * Fetches available models from the configured local server or cloud provider
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} - List of model objects
 */
export async function fetchAvailableModels(options = {}) {
    if (fetchModelsLock) {
        console.log('fetchAvailableModels already in progress, returning existing promise');
        return lastFetchPromise || [];
    }
    
    fetchModelsLock = true;
    lastFetchPromise = (async () => {
        try {
            const ip = serverIpInput?.value.trim();
            const port = serverPortInput?.value.trim();

            // Ollama support
            if (getUseOllama() && ip && port) {
                try {
                    const ollamaModels = await fetchOllamaModels(ip, port);
                    availableModels = ollamaModels.map(m => m.id);
                    return ollamaModels;
                } catch (error) {
                    console.error('Failed to fetch Ollama models:', error);
                    return [];
                }
            }

            // Hosted providers (OpenRouter / Custom OpenAI)
            if (isCloudProviderActive()) {
                try {
                    const cloudModels = await fetchCloudModels();
                    const selectedModel = getPersistedLocalSelectedModel();
                    if (selectedModel) {
                        availableModels = [selectedModel];
                    }
                    return cloudModels;
                } catch (error) {
                    console.error('Failed to fetch cloud models:', error);
                    return [];
                }
            }

            // Local LM Studio
            if (!ip || !port) return [];

            try {
                const apiVer = await detectApiVersion(ip, port);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                let modelsList = [];
                let loadedModelInfo = null;

                if (apiVer === 'v1native') {
                    const response = await fetch(`http://${ip}:${port}/api/v1/models`, {
                        signal: controller.signal,
                        headers: getLMStudioAuthHeaders()
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        const rawModels = data.models || data.data || [];
                        modelsList = rawModels.map(m => ({
                            ...m,
                            id: m.key || m.id,
                            display_name: m.display_name || m.key || m.id
                        }));

                        const loadedNative = modelsList.find(m => 
                            (Array.isArray(m.loaded_instances) && m.loaded_instances.length > 0) || m.loaded === true
                        );
                        if (loadedNative) {
                            const instanceId = loadedNative.loaded_instances?.[0]?.id || loadedNative.id;
                            loadedModelInfo = modelsList.find(m => m.id === instanceId) || loadedNative;
                            if (loadedModelInfo) loadedModelInfo._instanceId = instanceId;
                        }
                    }
                } else {
                    const response = await fetch(`http://${ip}:${port}/v1/models`, {
                        signal: controller.signal,
                        headers: getLocalServerAuthHeaders()
                    });
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        modelsList = data.data || [];
                        loadedModelInfo = modelsList.find(m => m.ready || m.loaded || m.active);
                        
                        if (!loadedModelInfo) {
                            for (const path of ['/v1/internal/model/info', '/v1/model/info']) {
                                try {
                                    const infoResp = await fetch(`http://${ip}:${port}${path}`, { headers: getLocalServerAuthHeaders() });
                                    if (infoResp.ok) {
                                        const info = await infoResp.json();
                                        if (info?.id) {
                                            loadedModelInfo = modelsList.find(m => m.id === info.id);
                                            if (loadedModelInfo) break;
                                        }
                                    }
                                } catch (_) {}
                            }
                        }
                    }
                }

                if (!loadedModelInfo && modelsList.length > 0) {
                    loadedModelInfo = await detectLmStudioLoadedModelViaCompletionProbe(ip, port, modelsList);
                }

                if (!loadedModelInfo && options.confirmedLoadedModelId) {
                    const cId = options.confirmedLoadedModelId;
                    loadedModelInfo = modelsList.find(m => m.id === cId) || { id: cId };
                }

                if (loadedModelInfo) {
                    availableModels = [loadedModelInfo.id];
                    window.currentLoadedModel = loadedModelInfo.id;
                    setPersistedLocalSelectedModel(loadedModelInfo.id);
                    updateLoadedModelDisplay(loadedModelInfo.id);
                    
                    try {
                        const { updateFileUploadCapabilities } = await import('./file-upload.js');
                        await updateFileUploadCapabilities();
                    } catch (_) {}
                } else {
                    availableModels = [];
                    window.currentLoadedModel = null;
                }

                return modelsList;
            } catch (error) {
                console.error('Error fetching available models:', error);
                return [];
            }
        } finally {
            fetchModelsLock = false;
        }
    })();

    return lastFetchPromise;
}

/**
 * Fetches models from Ollama
 * @param {string} ip
 * @param {string} port
 * @returns {Promise<Array>}
 */
async function fetchOllamaModels(ip, port) {
    const response = await fetch(`http://${ip}:${port}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch from Ollama');
    
    const data = await response.json();
    return (data.models || []).map(m => ({
        id: m.name,
        display_name: m.name,
        size: m.size,
        details: m.details
    }));
}

/**
 * Fetches models from cloud providers
 * @returns {Promise<Array>}
 */
async function fetchCloudModels() {
    if (getUseOpenRouter()) {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) throw new Error('Failed to fetch from OpenRouter');
        const data = await response.json();
        return (data.data || []).map(m => ({
            id: m.id,
            display_name: m.name || m.id,
            context_length: m.context_length
        }));
    } else if (getUseOpenAICompatible()) {
        const baseUrl = localStorage.getItem('customOpenAIBaseUrl') || '';
        const apiKey = localStorage.getItem('customOpenAIApiKey') || '';
        if (!baseUrl) return [];
        
        const response = await fetch(`${baseUrl}/models`, {
            headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
        });
        if (!response.ok) throw new Error('Failed to fetch from custom OpenAI endpoint');
        const data = await response.json();
        return (data.data || []).map(m => ({
            id: m.id,
            display_name: m.id
        }));
    }
    return [];
}

/**
 * Returns the list of currently available/loaded models
 * @returns {Array}
 */
export function getAvailableModels() {
    return availableModels;
}

/**
 * Checks if the local server is running
 * @returns {Promise<boolean>}
 */
export async function isServerRunning() {
    const ip = serverIpInput?.value.trim();
    const port = serverPortInput?.value.trim();
    if (!ip || !port) return false;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`http://${ip}:${port}/v1/models`, {
            signal: controller.signal,
            headers: getLocalServerAuthHeaders()
        }).catch(() => ({ ok: false }));
        clearTimeout(timeoutId);
        return response.ok;
    } catch (_) {
        return false;
    }
}

/**
 * Tries different known LM Studio API endpoints for an operation
 */
async function tryEndpoints(ip, port, operation, endpoints, requestData = null, options = {}) {
    const timeoutMs = options.timeoutMs || 5000;
    for (const endpoint of endpoints) {
        try {
            console.log(`Trying ${operation} with endpoint: ${endpoint.path}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const fetchOptions = {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json', ...getLMStudioAuthHeaders() },
                signal: controller.signal
            };

            if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
                fetchOptions.body = JSON.stringify(requestData || {});
            }

            const response = await fetch(`http://${ip}:${port}${endpoint.path}`, fetchOptions).catch(() => ({ ok: false }));
            clearTimeout(timeoutId);
            if (response.ok) return true;
        } catch (_) {}
    }
    return false;
}

/**
 * Waits for a model to be fully loaded and responding
 */
async function waitForModelLoad(ip, port, modelId, maxAttempts = 15) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const apiVer = await detectApiVersion(ip, port);
            const useNative = apiVer === 'v1native';
            const endpoint = useNative ? `http://${ip}:${port}/api/v1/chat` : `http://${ip}:${port}/v1/chat/completions`;
            const ctxLen = getContextLength();

            const requestBody = useNative ? {
                model: modelId,
                input: "test",
                context_length: ctxLen > 0 ? ctxLen : undefined
            } : {
                model: modelId,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            };

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getLMStudioAuthHeaders() },
                body: JSON.stringify(requestBody)
            });

            if (resp.ok) {
                window.currentLoadedModel = modelId;
                window.currentLoadedContextLength = ctxLen;
                return true;
            }
        } catch (_) {}
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

/**
 * Force load a model in LM Studio
 */
async function forceLoadModel(ip, port, modelId) {
    try {
        const apiVer = await detectApiVersion(ip, port);
        const useNative = apiVer === 'v1native';
        const endpoint = useNative ? `http://${ip}:${port}/api/v1/chat` : `http://${ip}:${port}/v1/chat/completions`;
        const ctxLen = getContextLength();

        const requestBody = useNative ? {
            model: modelId,
            input: 'LOAD',
            context_length: ctxLen > 0 ? ctxLen : undefined
        } : {
            model: modelId,
            messages: [{ role: 'user', content: 'LOAD' }],
            max_tokens: 10
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getLMStudioAuthHeaders() },
            body: JSON.stringify(requestBody)
        });
        return response.ok;
    } catch (_) {
        return false;
    }
}

/**
 * Loads a model in LM Studio
 */
export async function loadModel(modelId) {
    if (isCloudProviderActive()) {
        window.currentLoadedModel = modelId;
        availableModels = [modelId];
        const key = getCloudSelectedModelKey();
        if (key) localStorage.setItem(key, modelId);
        updateLoadedModelDisplay(modelId);
        return true;
    }

    const ip = serverIpInput?.value.trim();
    const port = serverPortInput?.value.trim();
    if (!ip || !port) return false;

    if (getUseOllama()) {
        window.currentLoadedModel = modelId;
        availableModels = [modelId];
        updateLoadedModelDisplay(modelId);
        return true;
    }

    const desiredCtx = getContextLength();
    if (window.currentLoadedModel === modelId && window.currentLoadedContextLength === desiredCtx) return true;

    // Unload current model if needed
    if (window.currentLoadedModel) {
        const apiVer = await detectApiVersion(ip, port);
        if (apiVer === 'v1native') {
            await tryEndpoints(ip, port, 'Unload', [{ path: '/api/v1/models/unload', method: 'POST' }], { instance_id: window.currentLoadedModel });
        } else {
            await tryEndpoints(ip, port, 'Unload', [{ path: '/v1/models/unload', method: 'POST' }, { path: '/v1/model/unload', method: 'POST' }]);
        }
        apiVersionCache.timestamp = 0;
    }

    const apiVer = await detectApiVersion(ip, port);
    let success = false;

    if (apiVer === 'v1native') {
        const loadBody = { model: modelId };
        const ctxLen = getContextLength();
        if (ctxLen > 0) loadBody.context_length = ctxLen;

        success = await tryEndpoints(ip, port, 'Load', [{ path: '/api/v1/models/load', method: 'POST' }], loadBody, { timeoutMs: 60000 });
        apiVersionCache.timestamp = 0;
    }

    if (!success) {
        success = await tryEndpoints(ip, port, 'Load legacy', [{ path: '/v1/models/load', method: 'POST' }], { model_id: modelId }, { timeoutMs: 60000 });
    }

    if (success) {
        const verified = await waitForModelLoad(ip, port, modelId);
        if (verified) {
            await fetchAvailableModels({ forceRefresh: true, confirmedLoadedModelId: modelId });
            return true;
        }
    }

    return await forceLoadModel(ip, port, modelId);
}

/**
 * Updates the loaded model display UI
 */
export function updateLoadedModelDisplay(modelName) {
    if (loadedModelDisplay) {
        window.currentLoadedModel = modelName;
        if (!isCloudProviderActive()) setPersistedLocalSelectedModel(modelName);
        loadedModelDisplay.textContent = `Loaded Model: ${modelName}`;
        loadedModelDisplay.dataset.hasLoadedModel = 'true';
        document.documentElement.style.setProperty('--loaded-model-height', '0px');
    }
}

export function hideLoadedModelDisplay() {
    if (loadedModelDisplay) {
        loadedModelDisplay.classList.add('hidden');
        loadedModelDisplay.dataset.hasLoadedModel = 'false';
        document.documentElement.style.setProperty('--loaded-model-height', '0px');
    }
}

function getPersistedLocalSelectedModel() {
    return localStorage.getItem(LOCAL_SELECTED_MODEL_KEY);
}

function setPersistedLocalSelectedModel(modelId) {
    if (modelId) {
        localStorage.setItem(LOCAL_SELECTED_MODEL_KEY, modelId);
    } else {
        localStorage.removeItem(LOCAL_SELECTED_MODEL_KEY);
    }
}

/**
 * Returns the base API URL for the current provider
 * @param {Object} options - Optional parameters
 * @param {boolean} options.preferNativeLmStudio - Force LM Studio native endpoint
 */
export function getApiUrl(options = {}) {
    if (getUseOpenRouter()) {
        return 'https://openrouter.ai/api/v1/chat/completions';
    }
    if (getUseOpenAICompatible()) {
        const url = localStorage.getItem('customOpenAIBaseUrl') || '';
        return url.includes('/chat/completions') ? url : `${url}/chat/completions`.replace(/\/\/chat/, '/chat');
    }
    const ipInput = serverIpInput || document.getElementById('server-ip');
    const portInput = serverPortInput || document.getElementById('server-port');
    const ip = ipInput?.value?.trim();
    const port = portInput?.value?.trim();
    if (!ip || !port) return '';

    // Ollama uses the OpenAI-compatible endpoint
    if (getUseOllama()) {
        return `http://${ip}:${port}/v1/chat/completions`;
    }

    // Only use native endpoint when explicitly requested (e.g. MCP integrations, vision)
    if (options.preferNativeLmStudio) {
        return `http://${ip}:${port}/api/v1/chat`;
    }

    return `http://${ip}:${port}/v1/chat/completions`;
}



/**
 * Validates the IP and Port inputs
 */
export function validateIpPort(ip, port) {
    const finalIp = ip || serverIpInput?.value.trim();
    const finalPort = port || serverPortInput?.value.trim();

    if (!finalIp || !finalPort) {
        if (!ip && !port) {
            showToastNotice({ message: 'IP and Port are required.', tone: 'error' });
        }
        return false;
    }

    const portNum = parseInt(finalPort, 10);
    const isValid = portNum > 0 && portNum <= 65535;

    if (!isValid && !ip && !port) {
        showToastNotice({ message: 'Invalid Port number (1-65535).', tone: 'error' });
    }

    return isValid;
}


/**
 * Saves server settings to localStorage
 */
export function saveServerSettings() {
    const ipInput = serverIpInput || document.getElementById('server-ip');
    const portInput = serverPortInput || document.getElementById('server-port');
    
    const ip = ipInput?.value?.trim();
    const port = portInput?.value?.trim();
    
    if (ip) localStorage.setItem('serverIp', ip);
    if (port) localStorage.setItem('serverPort', port);
}

/**
 * Loads server settings from localStorage into the UI
 */
export function loadServerSettings() {
    const ip = localStorage.getItem('serverIp');
    const port = localStorage.getItem('serverPort');
    
    const ipInput = serverIpInput || document.getElementById('server-ip');
    const portInput = serverPortInput || document.getElementById('server-port');
    
    if (ip && ipInput) ipInput.value = ip;
    if (port && portInput) portInput.value = port;
    
    // Initial fetch to populate model list
    fetchAvailableModels().catch(() => {});
}



