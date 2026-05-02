const SAVED_CONNECTION_PRESETS_KEY = 'savedConnectionPresets';

function canUseNativeStorage() {
    return !!(
        window.AndroidFileOps &&
        typeof window.AndroidFileOps.loadData === 'function' &&
        typeof window.AndroidFileOps.saveData === 'function'
    );
}

function loadStoredData(key) {
    let savedData = '';
    let usingNativeStorage = false;

    if (canUseNativeStorage()) {
        try {
            savedData = window.AndroidFileOps.loadData(key);
            if (savedData && savedData.trim() !== '') {
                usingNativeStorage = true;
            }
        } catch (_) {
            savedData = '';
        }
    }

    const localStorageData = localStorage.getItem(key);
    if (!usingNativeStorage && localStorageData) {
        savedData = localStorageData;

        if (canUseNativeStorage()) {
            try {
                const migrationSucceeded = window.AndroidFileOps.saveData(key, localStorageData);
                if (migrationSucceeded) {
                    localStorage.removeItem(key);
                }
            } catch (_) {
                // Ignore migration failure and keep local fallback.
            }
        }
    }

    return savedData || '';
}

function saveStoredData(key, data) {
    if (canUseNativeStorage()) {
        try {
            const success = window.AndroidFileOps.saveData(key, data);
            if (success) {
                localStorage.removeItem(key);
                return true;
            }
        } catch (_) {
            // Fall back to localStorage below.
        }
    }

    try {
        localStorage.setItem(key, data);
        return true;
    } catch (_) {
        return false;
    }
}

function createPresetId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeLocalPresetData(data = {}) {
    return {
        serverIp: normalizeString(data.serverIp),
        serverPort: normalizeString(data.serverPort),
        lmStudioApiToken: normalizeString(data.lmStudioApiToken),
        lmStudioMcpIntegrations: typeof data.lmStudioMcpIntegrations === 'string'
            ? data.lmStudioMcpIntegrations.trim()
            : ''
    };
}

function normalizeOpenRouterPresetData(data = {}) {
    return {
        openRouterApiKey: normalizeString(data.openRouterApiKey)
    };
}

function normalizeOpenAICompatiblePresetData(data = {}) {
    return {
        endpoint: normalizeString(data.endpoint),
        apiKey: normalizeString(data.apiKey),
        manualModel: normalizeString(data.manualModel)
    };
}

function normalizeEndpointForComparison(endpoint) {
    const normalizedEndpoint = normalizeString(endpoint);
    if (!normalizedEndpoint) {
        return '';
    }

    try {
        const url = new URL(normalizedEndpoint);
        url.hash = '';

        if (url.pathname && url.pathname !== '/') {
            url.pathname = url.pathname.replace(/\/+$/, '');
        }

        return url.toString().replace(/\/+$/, '');
    } catch (_) {
        return normalizedEndpoint.replace(/\/+$/, '');
    }
}

function normalizePresetType(type) {
    if (type === 'openrouter' || type === 'openai-compatible' || type === 'local') {
        return type;
    }

    return null;
}

function normalizePresetData(type, data) {
    if (type === 'openrouter') {
        return normalizeOpenRouterPresetData(data);
    }

    if (type === 'openai-compatible') {
        return normalizeOpenAICompatiblePresetData(data);
    }

    return normalizeLocalPresetData(data);
}

function normalizeSavedConnectionPreset(preset) {
    if (!preset || typeof preset !== 'object' || Array.isArray(preset)) {
        return null;
    }

    const type = normalizePresetType(preset.type);
    const name = normalizeString(preset.name);
    if (!type || !name) {
        return null;
    }

    const createdAt = normalizeString(preset.createdAt) || new Date().toISOString();
    const updatedAt = normalizeString(preset.updatedAt) || createdAt;

    return {
        id: normalizeString(preset.id) || createPresetId(),
        name,
        type,
        data: normalizePresetData(type, preset.data || {}),
        createdAt,
        updatedAt
    };
}

function sortPresetsByRecent(presets) {
    return [...presets].sort((left, right) => {
        const rightTime = Date.parse(right.updatedAt) || 0;
        const leftTime = Date.parse(left.updatedAt) || 0;
        return rightTime - leftTime;
    });
}

export function getSavedConnectionPresets() {
    try {
        const rawPresets = loadStoredData(SAVED_CONNECTION_PRESETS_KEY);
        if (!rawPresets || rawPresets.trim() === '') {
            return [];
        }

        const parsed = JSON.parse(rawPresets);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return sortPresetsByRecent(
            parsed
                .map(normalizeSavedConnectionPreset)
                .filter(Boolean)
        );
    } catch (_) {
        return [];
    }
}

function persistSavedConnectionPresets(presets) {
    return saveStoredData(SAVED_CONNECTION_PRESETS_KEY, JSON.stringify(sortPresetsByRecent(presets)));
}

export function saveConnectionPreset(preset) {
    const normalizedPreset = normalizeSavedConnectionPreset(preset);
    if (!normalizedPreset) {
        throw new Error('Invalid connection preset payload.');
    }

    const existingPresets = getSavedConnectionPresets();
    const duplicateEndpointPreset = normalizedPreset.type === 'openai-compatible'
        ? existingPresets.find(existingPreset =>
            existingPreset.type === 'openai-compatible' &&
            existingPreset.id !== normalizedPreset.id &&
            normalizeEndpointForComparison(existingPreset.data?.endpoint) === normalizeEndpointForComparison(normalizedPreset.data?.endpoint)
        )
        : null;

    if (duplicateEndpointPreset) {
        throw new Error(`A saved preset already uses this endpoint URL${duplicateEndpointPreset.name ? ` (${duplicateEndpointPreset.name})` : ''}.`);
    }

    const matchingIndex = existingPresets.findIndex(existingPreset =>
        existingPreset.id === normalizedPreset.id || (
            existingPreset.type === normalizedPreset.type &&
            existingPreset.name.toLowerCase() === normalizedPreset.name.toLowerCase()
        )
    );

    const now = new Date().toISOString();
    const nextPreset = {
        ...normalizedPreset,
        createdAt: matchingIndex >= 0 ? existingPresets[matchingIndex].createdAt : normalizedPreset.createdAt || now,
        updatedAt: now
    };

    const nextPresets = [...existingPresets];
    if (matchingIndex >= 0) {
        nextPreset.id = existingPresets[matchingIndex].id;
        nextPresets[matchingIndex] = nextPreset;
    } else {
        nextPresets.push(nextPreset);
    }

    if (!persistSavedConnectionPresets(nextPresets)) {
        throw new Error('Failed to save connection preset.');
    }

    return nextPreset;
}

export function deleteConnectionPreset(presetId) {
    const nextPresets = getSavedConnectionPresets().filter(preset => preset.id !== presetId);
    return persistSavedConnectionPresets(nextPresets);
}