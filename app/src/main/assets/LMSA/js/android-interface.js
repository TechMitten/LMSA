function removeAds() {
    if (window.AndroidBilling && typeof window.AndroidBilling.purchaseAdRemoval === 'function') {
        window.AndroidBilling.purchaseAdRemoval();
    } else {
        console.log('Billing interface not available or incorrect function name.');
    }
}

function openExternalUrl(url) {
    const normalizedUrl = typeof url === 'string' ? url.trim() : '';
    if (!/^(https?:\/\/|mailto:)/i.test(normalizedUrl)) {
        return false;
    }

    if (window.AndroidExternalLinks && typeof window.AndroidExternalLinks.openUrl === 'function') {
        window.AndroidExternalLinks.openUrl(normalizedUrl);
        return true;
    }

    if (/^mailto:/i.test(normalizedUrl)) {
        window.location.href = normalizedUrl;
        return true;
    }

    window.open(normalizedUrl, '_blank', 'noopener');
    return true;
}

window.openExternalUrl = openExternalUrl;

let restorePurchasesPending = false;

function restorePurchases() {
    if (window.AndroidBilling && typeof window.AndroidBilling.restorePurchases === 'function') {
        if (restorePurchasesPending) {
            return;
        }

        restorePurchasesPending = true;
        console.log('Calling AndroidBilling.restorePurchases()');
        window.AndroidBilling.restorePurchases();
    } else {
        console.log('Billing interface not available. This is not an Android app environment.');
        alert('This feature is only available in the Android app.');
    }
}

window.onRestorePurchasesResult = function (success, message) {
    restorePurchasesPending = false;
    console.log('onRestorePurchasesResult called: success=' + success + ', message=' + message);

    if (typeof message === 'string' && message.trim().length > 0) {
        alert(message);
        return;
    }

    if (success) {
        alert('Purchase restored successfully. Premium is now active.');
    } else {
        alert('No previous purchase was found for this account.');
    }
};

function getPremiumStateSnapshot() {
    return window.LMSAPremiumState || {
        isPremium: false,
        updatedAt: 0
    };
}

function setPremiumState(isPremium) {
    const nextState = {
        isPremium: !!isPremium,
        updatedAt: Date.now()
    };

    const previousState = getPremiumStateSnapshot();
    const changed = previousState.isPremium !== nextState.isPremium;

    window.LMSAPremiumState = nextState;

    if (changed) {
        document.dispatchEvent(new CustomEvent('premium-status-changed', {
            detail: nextState
        }));
    }

    return nextState;
}

function hasPremiumAccess() {
    const knownState = getPremiumStateSnapshot();
    const isDebugEnabled = !!window.isDebugMode || !!(window.AndroidBilling && typeof window.AndroidBilling.checkDebugMode === 'function' && window.AndroidBilling.checkDebugMode());
    if (knownState.updatedAt > 0) {
        return knownState.isPremium && !isDebugEnabled;
    }

    if (window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function') {
        return !!window.AndroidBilling.checkPremiumStatus() && !isDebugEnabled;
    }

    return false;
}

window.hasPremiumAccess = hasPremiumAccess;

function syncPremiumMenuState(isPremium) {
    const premiumContainer = document.getElementById('premium-container');
    if (premiumContainer) {
        premiumContainer.dataset.premiumState = isPremium ? 'premium' : 'free';
    }
}

function syncPremiumHeaderState(isPremium) {
    const premiumHeaderButton = document.getElementById('premium-header-button');
    if (!premiumHeaderButton) {
        return;
    }

    premiumHeaderButton.dataset.premiumState = isPremium ? 'premium' : 'free';
    premiumHeaderButton.hidden = !!isPremium;
    premiumHeaderButton.style.setProperty('display', isPremium ? 'none' : 'flex', 'important');
    premiumHeaderButton.title = isPremium ? 'View Premium Status' : 'Open Premium';
    premiumHeaderButton.setAttribute('aria-label', isPremium ? 'View Premium Status' : 'Open Premium');
}

// Updated UI function to manage premium status
function updateUiForPremium(isPremium) {
    const premiumState = setPremiumState(isPremium);
    const isDebugEnabled = !!window.isDebugMode || !!(window.AndroidBilling && typeof window.AndroidBilling.checkDebugMode === 'function' && window.AndroidBilling.checkDebugMode());
    isPremium = premiumState.isPremium && !isDebugEnabled;
    console.log('Premium status updated:', isPremium, '(debug:', isDebugEnabled, ')');
    syncPremiumMenuState(isPremium);
    syncPremiumHeaderState(isPremium);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const isPremium = hasPremiumAccess();
        syncPremiumMenuState(isPremium);
        syncPremiumHeaderState(isPremium);
    }, { once: true });
} else {
    const isPremium = hasPremiumAccess();
    syncPremiumMenuState(isPremium);
    syncPremiumHeaderState(isPremium);
}

/**
 * Keeps the screen on or allows it to turn off
 * @param {boolean} enabled - True to keep screen on, false to allow it to turn off
 */
function keepScreenOn(enabled) {
    if (window.AndroidPower && typeof window.AndroidPower.keepScreenOn === 'function') {
        window.AndroidPower.keepScreenOn(enabled);
    }
}

/**
 * Triggers device haptic feedback
 * @param {string|boolean} type - Semantic haptic type or legacy boolean light flag
 */
function triggerHapticFeedback(type = 'light') {
    if (!window.AndroidHaptics) {
        return;
    }

    if (typeof type === 'boolean') {
        type = type ? 'light' : 'button';
    }

    if (typeof window.AndroidHaptics.perform === 'function') {
        window.AndroidHaptics.perform(type);
        return;
    }

    if (type === 'light' && typeof window.AndroidHaptics.triggerLightHaptic === 'function') {
        window.AndroidHaptics.triggerLightHaptic();
        return;
    }

    if (typeof window.AndroidHaptics.triggerHapticFeedback === 'function') {
        window.AndroidHaptics.triggerHapticFeedback();
    }
}

let nativeBridgeRequestCounter = 0;
const nativeBridgePendingRequests = new Map();

function createDeferred() {
    let resolve;
    let reject;

    const promise = new Promise((nextResolve, nextReject) => {
        resolve = nextResolve;
        reject = nextReject;
    });

    return { promise, resolve, reject };
}

function createAbortError() {
    if (typeof DOMException === 'function') {
        return new DOMException('The operation was aborted.', 'AbortError');
    }

    const error = new Error('The operation was aborted.');
    error.name = 'AbortError';
    return error;
}

function normalizeHeaderEntries(headers) {
    if (!headers) {
        return [];
    }

    if (headers instanceof Headers) {
        return Array.from(headers.entries());
    }

    if (Array.isArray(headers)) {
        return headers
            .filter(entry => Array.isArray(entry) && entry.length >= 2)
            .map(([key, value]) => [String(key), String(value)]);
    }

    return Object.entries(headers).map(([key, value]) => [String(key), String(value)]);
}

function normalizeHeadersObject(headers) {
    return normalizeHeaderEntries(headers).reduce((accumulator, [key, value]) => {
        if (key) {
            accumulator[key] = value;
        }
        return accumulator;
    }, {});
}

function normalizeRequestBody(body) {
    if (body == null) {
        return null;
    }

    if (typeof body === 'string') {
        return body;
    }

    if (body instanceof URLSearchParams) {
        return body.toString();
    }

    if (body instanceof Blob || body instanceof FormData || body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
        return null;
    }

    if (typeof body === 'object') {
        try {
            return JSON.stringify(body);
        } catch (error) {
            console.warn('Failed to serialize native bridge request body:', error);
            return null;
        }
    }

    return String(body);
}

function sanitizeBrowserFetchOptions(options = {}) {
    const { timeoutMs, stream, followRedirects, ...fetchOptions } = options;
    return fetchOptions;
}

function base64ToUint8Array(base64Value) {
    if (!base64Value) {
        return new Uint8Array(0);
    }

    const binary = window.atob(base64Value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
}

function mergeUint8ArrayChunks(chunks, totalLength) {
    const merged = new Uint8Array(totalLength);
    let offset = 0;

    chunks.forEach(chunk => {
        merged.set(chunk, offset);
        offset += chunk.length;
    });

    return merged;
}

function createNativeRequestError(payload) {
    if (payload?.code === 'ABORTED') {
        return createAbortError();
    }

    const error = new Error(payload?.message || 'Native request failed.');
    error.name = payload?.code || 'NativeRequestError';
    error.code = payload?.code || 'NETWORK_ERROR';
    return error;
}

class NativeBridgeHeaders {
    constructor(initialHeaders = {}) {
        this.headerMap = new Map();
        normalizeHeaderEntries(initialHeaders).forEach(([key, value]) => {
            if (key) {
                this.headerMap.set(key.toLowerCase(), String(value));
            }
        });
    }

    get(name) {
        return this.headerMap.get(String(name || '').toLowerCase()) ?? null;
    }

    has(name) {
        return this.headerMap.has(String(name || '').toLowerCase());
    }

    entries() {
        return this.headerMap.entries();
    }

    [Symbol.iterator]() {
        return this.headerMap[Symbol.iterator]();
    }
}

class NativeBridgeResponse {
    constructor(meta, state) {
        this._meta = meta;
        this._state = state;
        this.url = meta.url || '';
        this.status = meta.status || 0;
        this.statusText = meta.statusText || '';
        this.ok = this.status >= 200 && this.status < 300;
        this.headers = new NativeBridgeHeaders(meta.headers || {});
        this.redirected = false;
        this.body = state.readableStream;
    }

    async arrayBuffer() {
        const bytes = await this._state.completion.promise;
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }

    async text() {
        const bytes = await this._state.completion.promise;
        return new TextDecoder('utf-8').decode(bytes);
    }

    async json() {
        return JSON.parse(await this.text());
    }

    async blob() {
        const bytes = await this._state.completion.promise;
        return new Blob([bytes], {
            type: this.headers.get('content-type') || ''
        });
    }

    clone() {
        return new NativeBridgeResponse(this._meta, this._state);
    }
}

function cleanupNativeBridgeRequest(requestId) {
    const pending = nativeBridgePendingRequests.get(requestId);
    if (!pending) {
        return;
    }

    if (pending.abortSignal && pending.abortListener) {
        pending.abortSignal.removeEventListener('abort', pending.abortListener);
    }

    nativeBridgePendingRequests.delete(requestId);
}

function canUseNativeRequestBridge(url, options = {}) {
    if (!window.AndroidNetwork || typeof window.AndroidNetwork.startRequest !== 'function') {
        return false;
    }

    if (typeof ReadableStream !== 'function') {
        return false;
    }

    const normalizedUrl = typeof url === 'string' ? url.trim() : String(url || '').trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
        return false;
    }

    if (options.body != null && normalizeRequestBody(options.body) == null) {
        return false;
    }

    return true;
}

function nativeBridgeFetch(url, options = {}) {
    if (!canUseNativeRequestBridge(url, options)) {
        return Promise.reject(new Error('Native request bridge is unavailable for this request.'));
    }

    const requestId = `native-request-${Date.now()}-${++nativeBridgeRequestCounter}`;
    const responseDeferred = createDeferred();
    const completionDeferred = createDeferred();
    completionDeferred.promise.catch(() => {});
    const bodyChunks = [];
    let totalLength = 0;
    let streamController = null;
    const requestBody = normalizeRequestBody(options.body);
    const method = String(options.method || 'GET').trim().toUpperCase() || 'GET';
    const requestPayload = {
        requestId,
        url: typeof url === 'string' ? url : String(url),
        method,
        headers: normalizeHeadersObject(options.headers),
        body: requestBody,
        timeoutMs: Number.isFinite(options.timeoutMs) ? Math.max(1000, Math.trunc(options.timeoutMs)) : 30000,
        stream: options.stream !== false,
        followRedirects: options.followRedirects !== false
    };

    const readableStream = new ReadableStream({
        start(controller) {
            streamController = controller;
        },
        cancel() {
            if (window.AndroidNetwork && typeof window.AndroidNetwork.cancelRequest === 'function') {
                try {
                    window.AndroidNetwork.cancelRequest(requestId);
                } catch (error) {
                    console.warn('Failed to cancel native request stream:', error);
                }
            }
        }
    });

    const pending = {
        requestId,
        responseDeferred,
        completion: completionDeferred,
        readableStream,
        streamController: () => streamController,
        bodyChunks,
        getTotalLength: () => totalLength,
        addChunk(chunk) {
            bodyChunks.push(chunk);
            totalLength += chunk.length;
        },
        responseStarted: false,
        completed: false,
        abortSignal: options.signal || null,
        abortListener: null
    };

    if (pending.abortSignal) {
        if (pending.abortSignal.aborted) {
            return Promise.reject(createAbortError());
        }

        pending.abortListener = () => {
            if (window.AndroidNetwork && typeof window.AndroidNetwork.cancelRequest === 'function') {
                try {
                    window.AndroidNetwork.cancelRequest(requestId);
                } catch (error) {
                    console.warn('Failed to cancel native request:', error);
                }
            }
        };

        pending.abortSignal.addEventListener('abort', pending.abortListener, { once: true });
    }

    nativeBridgePendingRequests.set(requestId, pending);

    try {
        window.AndroidNetwork.startRequest(JSON.stringify(requestPayload));
    } catch (error) {
        cleanupNativeBridgeRequest(requestId);
        responseDeferred.reject(error instanceof Error ? error : new Error('Failed to start native request.'));
        completionDeferred.reject(error instanceof Error ? error : new Error('Failed to start native request.'));
    }

    return responseDeferred.promise;
}

async function fetchWithNativeBridge(url, options = {}) {
    if (canUseNativeRequestBridge(url, options)) {
        return nativeBridgeFetch(url, options);
    }

    return fetch(url, sanitizeBrowserFetchOptions(options));
}

window.onNativeRequestEvent = function (eventPayload) {
    let payload = eventPayload;

    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (error) {
            console.error('Invalid native request event payload:', error);
            return;
        }
    }

    const requestId = typeof payload?.requestId === 'string' ? payload.requestId : '';
    if (!requestId) {
        return;
    }

    const pending = nativeBridgePendingRequests.get(requestId);
    if (!pending) {
        return;
    }

    if (payload.type === 'responseStarted') {
        if (pending.responseStarted) {
            return;
        }

        pending.responseStarted = true;
        pending.responseDeferred.resolve(new NativeBridgeResponse({
            url: payload.url,
            status: payload.status,
            statusText: payload.statusText,
            headers: payload.headers || {}
        }, pending));
        return;
    }

    if (payload.type === 'responseChunk') {
        const chunk = base64ToUint8Array(payload.dataBase64 || '');
        if (chunk.length === 0) {
            return;
        }

        pending.addChunk(chunk);

        const controller = pending.streamController();
        if (controller) {
            controller.enqueue(chunk);
        }
        return;
    }

    if (payload.type === 'responseComplete') {
        if (pending.completed) {
            return;
        }

        pending.completed = true;
        const controller = pending.streamController();
        if (controller) {
            controller.close();
        }

        pending.completion.resolve(mergeUint8ArrayChunks(pending.bodyChunks, pending.getTotalLength()));
        cleanupNativeBridgeRequest(requestId);
        return;
    }

    if (payload.type === 'responseError') {
        if (pending.completed) {
            return;
        }

        pending.completed = true;
        const error = createNativeRequestError(payload);
        const controller = pending.streamController();

        if (pending.responseStarted) {
            if (controller) {
                controller.error(error);
            }
        } else {
            pending.responseDeferred.reject(error);
        }

        pending.completion.reject(error);
        cleanupNativeBridgeRequest(requestId);
    }
};

window.nativeFetch = nativeBridgeFetch;
window.fetchWithNativeBridge = fetchWithNativeBridge;

let localModelServerScanPending = null;
let localModelServerScanTimer = null;

function cleanupLocalModelServerScanPending() {
    if (localModelServerScanTimer) {
        clearTimeout(localModelServerScanTimer);
        localModelServerScanTimer = null;
    }
    localModelServerScanPending = null;
}

function normalizeLocalModelServerScanOptions(options = {}) {
    const candidatePorts = Array.isArray(options.candidatePorts)
        ? options.candidatePorts
            .map(value => String(value || '').trim())
            .filter(value => /^\d{1,5}$/.test(value))
        : [];

    return {
        candidatePorts: Array.from(new Set([...candidatePorts, '1234', '11434']))
    };
}

function scanLocalModelServers(options = {}) {
    if (!window.AndroidNetwork || typeof window.AndroidNetwork.scanLocalModelServers !== 'function') {
        return Promise.reject(new Error('Local network scanning is only available in the Android app.'));
    }

    if (localModelServerScanPending) {
        return Promise.reject(new Error('A local network scan is already in progress.'));
    }

    const payload = JSON.stringify(normalizeLocalModelServerScanOptions(options));

    return new Promise((resolve, reject) => {
        localModelServerScanPending = { resolve, reject };
        localModelServerScanTimer = setTimeout(() => {
            const pending = localModelServerScanPending;
            cleanupLocalModelServerScanPending();
            pending?.reject(new Error('Local network scan timed out.'));
        }, 30000);

        try {
            window.AndroidNetwork.scanLocalModelServers(payload);
        } catch (error) {
            cleanupLocalModelServerScanPending();
            reject(error instanceof Error ? error : new Error('Failed to start local network scan.'));
        }
    });
}

window.scanLocalModelServers = scanLocalModelServers;

window.onNativeLocalServerScanResult = function (result) {
    const pending = localModelServerScanPending;
    cleanupLocalModelServerScanPending();

    if (!pending) {
        return;
    }

    let payload = result;
    if (typeof result === 'string') {
        try {
            payload = JSON.parse(result);
        } catch (error) {
            pending.reject(new Error('Invalid local network scan response.'));
            return;
        }
    }

    pending.resolve(payload || { ok: false, discoveries: [], message: 'Empty local network scan response.' });
};
