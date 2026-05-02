// Chat Service for handling chat functionality
import { messagesContainer, userInput, loadedModelDisplay } from './dom-elements.js';
import { appendMessage, showLoadingIndicator, hideLoadingIndicator, toggleSendStopButton, hideWelcomeMessage, showWelcomeMessage, toggleSidebar, showConfirmationModal, hideConfirmationModal, updateChatHistoryScroll, renderSmartReplies, hideSmartReplies, showSmartRepliesLoading, addWebSearchIndicator } from './ui-manager.js';
import { openHelpModal } from './help.js';
import { getApiUrl, getAvailableModels, isServerRunning, fetchAvailableModels } from './api-service.js';
import { getSystemPrompt, getTemperature, isSystemPromptSet, getAutoGenerateTitles, isUserCreatedPrompt, getHideThinking, getReasoningTimeout, getAutoScrollEnabled, getAutoSmartReply, getUseOpenRouter, getUseOpenAICompatible, getUseOllama, getOpenRouterApiKey, getOpenAICompatibleApiKey, getLMStudioApiToken, getLMStudioMcpIntegrations, hasLMStudioMcpIntegrations, getWebSearchEnabled, getConfiguredMaxTokens } from './settings-manager.js';
import { sanitizeInput, basicSanitizeInput, initializeCodeMirror, scrollToBottom, handleScroll, debugLog, debugError, filterToEnglishCharacters, processCodeBlocks, decodeHtmlEntities, refreshAllCodeBlocks, containsCodeBlocks, containsCodeBlocksOutsideThinkTags, saveCurrentChatBeforeRefresh, removeThinkTags, hideScrollToBottomButton, getReasoningStreamState, stripReasoningSections, normalizeReasoningTags, normalizeMalformedCodeFences, isAndroidWebView } from './utils.js';
import { setActionToPerform } from './shared-state.js';
import { canSendCompletion, recordCompletion, canSendOpenRouterCompletion, recordOpenRouterCompletion, canUseWebSearch, recordWebSearch } from './usage-limiter.js';


let currentChatId = Date.now();
let chatHistoryData = {};
let isFirstMessage = true;
let chatToDelete = null;
let abortController = null;
let smartReplyAbortController = null;
let isGenerating = false;
let isNewTopic = false;
let chatToRename = null;
let renameModalEscapeHandler = null;
let renameModalTouchMoveHandler = null;
let renameModalViewportCleanup = null;
let renameModalHideTimer = null;
let suppressChatHistoryClickUntil = 0;
const lmStudioThinkingCompatibilityCache = new Map();

// Maximum number of historical web search results to include in context (legacy)
// This is deprecated - web search results are now scoped to current turn only
const MAX_HISTORICAL_SEARCHES = 3;
const WEB_SEARCH_QUERY_MAX_LENGTH = 220;
const WEB_SEARCH_CONTEXT_MAX_LENGTH = 96;
const WEB_SEARCH_SHORT_QUERY_WORDS = 5;
const WEB_SEARCH_FETCH_TIMEOUT_MS = 8000;
const WEB_SEARCH_RECENT_CONTEXT_TURNS = 3;
const WEB_SEARCH_RECENT_TOPIC_TURNS = 4;
const WEB_SEARCH_CONTEXT_KEYWORD_LIMIT = 10;
const WEB_SEARCH_TOPIC_OVERLAP_MIN_RATIO = 0.34;
const WEB_SEARCH_REUSE_MAX_WORDS = 12;
const CHAT_IMAGE_STORE_KEY = 'chatImageStore';
const CHAT_IMAGE_STORE_VERSION = 1;
const ACTIVE_TEMPLATE_CHARACTER_CARD_KEY = 'activeTemplateCharacterCard';
const PENDING_TEMPLATE_CHARACTER_CARD_KEY = 'pendingTemplateCharacterCard';

const IMAGE_FILE_EXTENSION_PATTERN = /\.(?:apng|avif|bmp|gif|jpe?g|png|svg|webp)$/i;
const WEB_SEARCH_STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'because', 'briefly', 'by', 'can', 'could', 'do', 'does',
    'for', 'from', 'give', 'i', 'if', 'in', 'into', 'is', 'it', 'just', 'me', 'my', 'of', 'on', 'or', 'our',
    'please', 'show', 'summarize', 'tell', 'than', 'that', 'the', 'their', 'them', 'then', 'these', 'they',
    'this', 'those', 'to', 'use', 'using', 'via', 'want', 'what', 'when', 'where', 'which', 'who', 'why',
    'with', 'would', 'you', 'your'
]);
const WEB_SEARCH_FOLLOW_UP_PATTERN = /\b(it|its|they|them|their|this|that|these|those|he|she|him|her|former|latter)\b/i;
const WEB_SEARCH_AMBIGUOUS_LEAD_PATTERN = /^(and|also|so|then|what about|how about|what else|when|where|why|who|which|is it|are they|does it|do they|did it|can it|could it|would it|should it)\b/i;
const WEB_SEARCH_ERROR_PATTERN = /\b(error|exception|traceback|stack trace|typeerror|referenceerror|syntaxerror|rangeerror|failed|failure|cannot|can't|undefined|null|not found|http\s*\d{3}|\d{3}\s+error)\b/i;
const WEB_SEARCH_RETRY_PATTERN = /^(try again|retry|again|search again|look again|check again|one more time|refresh|update it|update this)$/i;
const WEB_SEARCH_FORCE_SKIP_PATTERN = /\b(?:don't|do not|dont|skip|avoid|without|no)\s+(?:use\s+)?(?:web\s+search|search(?:ing)?(?:\s+the\s+web)?|the\s+web|online\s+search)\b|\b(?:answer|respond|reply)\s+(?:from|using)\s+(?:chat|context|memory|what you already know|existing context)\s+only\b|\bno\s+need\s+to\s+(?:search|look\s+up|check\s+online)\b/i;
const WEB_SEARCH_EXPLICIT_REQUEST_PATTERN = /\b(?:search(?:\s+the\s+web)?|look\s+up|find(?:\s+out)?|check\s+online|web\s+search)\b/i;
const WEB_SEARCH_FORCE_FRESH_PATTERN = /\b(?:latest|current|today|recent|newest|breaking|up[- ]?to[- ]?date|right now|currently|news|price|pricing|availability|release date|weather|forecast|stock)\b/i;
const WEB_SEARCH_TOOL_NAME = 'web_search';
const WEB_SEARCH_DECISION_MAX_TOKENS = 96;
const WEB_SEARCH_DECISION_MAX_MESSAGES = 6;
const WEB_SEARCH_DECISION_MAX_CHARS_PER_MESSAGE = 700;
const WEB_SEARCH_PROVIDERS = [
    { name: 'SearXNG TechMitten', type: 'searxng', url: 'https://searxng.techmitten.com/search' },
    { name: 'SearXNG Inetol', type: 'searxng', url: 'https://search.inetol.net/search' },
    { name: 'SearXNG Tiekoetter', type: 'searxng', url: 'https://searx.tiekoetter.com/search' },
    { name: 'DuckDuckGo Instant Answer', type: 'duckduckgo', url: 'https://api.duckduckgo.com/' }
];
const WEB_SEARCH_SKIP_WORDS = new Set([
    'thanks', 'thank', 'ty', 'thnx', 'thx', 'thankyou', 'thank you',
    'ok', 'okay', 'k', 'kk', 'got it', 'understood', 'understood', 'yes', 'yep', 'yup', 'yeah', 'no', 'nope',
    'great', 'nice', 'cool', 'good', 'perfect', 'awesome', 'wonderful', 'excellent',
    'see', 'seen', 'got', 'right', 'correct', 'true', 'makes sense', 'exactly',
    'i see', 'i understand', 'i got it', 'i see it', 'makes sense',
    'sure', 'certainly', 'absolutely', 'of course', 'indeed', 'true that'
]);
let cachedChatImageStore = createEmptyChatImageStore();

// Export state variables only
export {
    chatHistoryData,
    currentChatId,
    isNewTopic,
    isFirstMessage // Export as a value, not a function
};

// Function to set isFirstMessage
export function setIsFirstMessage(value) {
    isFirstMessage = value;
}

// Expose regenerateLastResponse globally so inline onclick handlers in error messages can call it
window.regenerateLastResponse = (...args) => regenerateLastResponse(...args);

/**
 * Ensures isFirstMessage is properly initialized
 */
function ensureFirstMessageInitialized() {
    // This function makes sure the first message flag is properly set
    // It doesn't need to do anything if the flag is already initialized
    if (typeof isFirstMessage === 'undefined') {
        isFirstMessage = true;
    }
}

function getHttpErrorFallback(response) {
    return `HTTP Error: ${response.status} ${response.statusText}`;
}

function isLocalLmStudioProvider() {
    return !getUseOpenRouter() && !getUseOpenAICompatible() && !getUseOllama();
}



function applyReasoningOptions(requestBody) {
    if (!requestBody || typeof requestBody !== 'object') {
        return requestBody;
    }

    if (getUseOpenRouter()) {
        requestBody.include_reasoning = true;
    }

    if (!isLocalLmStudioProvider()) {
        return requestBody;
    }

    const modelId = typeof requestBody.model === 'string' ? requestBody.model : '';
    if (modelId && lmStudioThinkingCompatibilityCache.get(modelId) === false) {
        return requestBody;
    }

    if (!requestBody.thinking || typeof requestBody.thinking !== 'object') {
        requestBody.thinking = {
            type: 'enabled'
        };
    }

    return requestBody;
}

function shouldRetryWithoutThinking(response, errorText) {
    if (!response || !isLocalLmStudioProvider()) {
        return false;
    }

    if (response.status !== 400 && response.status !== 422) {
        return false;
    }

    const message = String(errorText || '').toLowerCase();
    if (!message) {
        return false;
    }

    return (
        message.includes('thinking') ||
        message.includes('budget_tokens') ||
        message.includes('additional properties') ||
        message.includes('unknown field') ||
        message.includes('unknown parameter') ||
        message.includes('schema')
    );
}

async function postChatCompletionWithReasoningFallback(url, headers, requestBody, signal) {
    const firstAttemptBody = applyReasoningOptions({ ...requestBody });
    const firstAttemptModel = typeof firstAttemptBody.model === 'string' ? firstAttemptBody.model : '';
    let response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(firstAttemptBody),
        signal
    });

    if (response.ok) {
        if (firstAttemptModel && firstAttemptBody.thinking && typeof firstAttemptBody.thinking === 'object') {
            lmStudioThinkingCompatibilityCache.set(firstAttemptModel, true);
        }
        return { response, requestBody: firstAttemptBody };
    }

    if (!firstAttemptBody.thinking || typeof firstAttemptBody.thinking !== 'object') {
        return { response, requestBody: firstAttemptBody };
    }

    const errorText = await response.clone().text().catch(() => '');
    if (!shouldRetryWithoutThinking(response, errorText)) {
        return { response, requestBody: firstAttemptBody };
    }

    const fallbackBody = { ...firstAttemptBody };
    delete fallbackBody.thinking;
    if (firstAttemptModel) {
        lmStudioThinkingCompatibilityCache.set(firstAttemptModel, false);
    }

    debugLog(`Retrying request without LM Studio thinking payload for model: ${firstAttemptModel || 'unknown model'}`);
    response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(fallbackBody),
        signal
    });

    return { response, requestBody: fallbackBody };
}

async function parseApiErrorResponse(response) {
    const fallback = getHttpErrorFallback(response);

    try {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error('Error data from API:', errorData);

            const rawError = errorData.error || errorData.message || errorData.detail;
            if (rawError && typeof rawError === 'object') {
                return rawError.message || rawError.detail || fallback;
            }

            if (typeof rawError === 'string' && rawError.trim()) {
                return rawError.trim();
            }
        } else {
            const errorText = await response.text();
            if (errorText && errorText.trim()) {
                return errorText.trim();
            }
        }
    } catch (error) {
        console.error('Failed to parse error response:', error);
    }

    if (response.status === 429 && getUseOpenAICompatible()) {
        return 'The configured OpenAI-compatible endpoint rate-limited this request (429 Too Many Requests).';
    }

    return fallback;
}

async function throwForApiErrorResponse(response) {
    const errorText = await parseApiErrorResponse(response);

    if (response.status === 429 && getUseOpenRouter()) {
        throw new Error('OPENROUTER_RATE_LIMITED');
    }

    throw new Error(errorText);
}

function readCompleteSseLines(lineBuffer, chunkText = '', flush = false) {
    lineBuffer.value += chunkText;

    const lines = lineBuffer.value.split(/\r?\n/);
    if (flush) {
        lineBuffer.value = '';
        return lines;
    }

    lineBuffer.value = lines.pop() || '';
    return lines;
}

function parseOpenAiCompatibleSseLines(lines) {
    const parsedEvents = [];

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]' || trimmedLine === 'data:' || trimmedLine === 'data: ' || trimmedLine.startsWith(':')) {
            return;
        }

        if (!line.startsWith('data:')) {
            return;
        }

        const jsonData = line.replace(/^data:\s?/, '');
        if (!jsonData.trim() || jsonData.trim() === '[DONE]') {
            return;
        }

        try {
            parsedEvents.push(JSON.parse(jsonData));
        } catch (error) {
            debugLog('Error parsing complete SSE JSON line:', error);
        }
    });

    return parsedEvents;
}

function extractReasoningDeltaText(delta) {
    if (!delta || typeof delta !== 'object') {
        return '';
    }

    const candidates = [
        delta.reasoning,
        delta.reasoning_content,
        delta.reasoningContent,
        delta.thinking,
        delta.thinking_content,
        delta.thinkingContent
    ];

    for (const value of candidates) {
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
    }

    return '';
}

function extractContentDeltaText(delta) {
    if (!delta || typeof delta !== 'object') {
        return '';
    }

    if (typeof delta.content === 'string' && delta.content.length > 0) {
        return delta.content;
    }

    return '';
}

function createEmptyChatImageStore() {
    return {
        version: CHAT_IMAGE_STORE_VERSION,
        images: {}
    };
}

function loadStoredData(key) {
    let savedData = '';
    let usingNativeStorage = false;

    if (window.AndroidFileOps && typeof window.AndroidFileOps.loadData === 'function') {
        savedData = window.AndroidFileOps.loadData(key);
        if (savedData && savedData.trim() !== '') {
            usingNativeStorage = true;
        }
    }

    const localStorageData = localStorage.getItem(key);
    if (!usingNativeStorage && localStorageData) {
        savedData = localStorageData;

        if (window.AndroidFileOps && typeof window.AndroidFileOps.saveData === 'function') {
            const migrationSucceeded = window.AndroidFileOps.saveData(key, localStorageData);
            if (migrationSucceeded) {
                localStorage.removeItem(key);
            }
        }
    }

    return savedData || '';
}

function saveStoredData(key, data) {
    if (window.AndroidFileOps && typeof window.AndroidFileOps.saveData === 'function') {
        const success = window.AndroidFileOps.saveData(key, data);
        if (success) {
            localStorage.removeItem(key);
            return true;
        }
    }

    try {
        localStorage.setItem(key, data);
        return true;
    } catch (error) {
        debugError(`Error saving ${key} to localStorage:`, error);
        return false;
    }
}

function deleteStoredData(key) {
    localStorage.removeItem(key);

    if (window.AndroidFileOps && typeof window.AndroidFileOps.deleteData === 'function') {
        return window.AndroidFileOps.deleteData(key);
    }

    return true;
}

function loadChatImageStore() {
    try {
        const rawStore = loadStoredData(CHAT_IMAGE_STORE_KEY);
        if (!rawStore || rawStore.trim() === '') {
            cachedChatImageStore = createEmptyChatImageStore();
            return cachedChatImageStore;
        }

        const parsedStore = JSON.parse(rawStore);
        cachedChatImageStore = {
            version: CHAT_IMAGE_STORE_VERSION,
            images: parsedStore && typeof parsedStore === 'object' && parsedStore.images && typeof parsedStore.images === 'object'
                ? parsedStore.images
                : {}
        };
    } catch (error) {
        debugError('Error loading chat image store:', error);
        cachedChatImageStore = createEmptyChatImageStore();
    }

    return cachedChatImageStore;
}

function persistChatImageStore(images) {
    if (!images || Object.keys(images).length === 0) {
        cachedChatImageStore = createEmptyChatImageStore();
        deleteStoredData(CHAT_IMAGE_STORE_KEY);
        return;
    }

    const nextStore = {
        version: CHAT_IMAGE_STORE_VERSION,
        images
    };

    const saveSucceeded = saveStoredData(CHAT_IMAGE_STORE_KEY, JSON.stringify(nextStore));
    if (saveSucceeded) {
        cachedChatImageStore = nextStore;
    } else {
        debugError('Failed to persist chat image store');
    }
}

function parseStoredTemplateCharacterCard(key) {
    const rawCharacterCard = localStorage.getItem(key);
    if (!rawCharacterCard) {
        return null;
    }

    try {
        const parsedCharacterCard = JSON.parse(rawCharacterCard);
        if (!parsedCharacterCard || typeof parsedCharacterCard !== 'object') {
            localStorage.removeItem(key);
            return null;
        }

        return parsedCharacterCard;
    } catch (error) {
        debugError(`Failed to parse stored template character card for ${key}:`, error);
        localStorage.removeItem(key);
        return null;
    }
}

function getActiveTemplateCharacterCardActivation() {
    const activeCharacterCard = parseStoredTemplateCharacterCard(ACTIVE_TEMPLATE_CHARACTER_CARD_KEY);
    if (!activeCharacterCard) {
        return null;
    }

    return {
        templateName: localStorage.getItem('activeTemplateName') || '',
        characterCard: activeCharacterCard
    };
}

function isImageAttachment(file) {
    if (!file || typeof file !== 'object') {
        return false;
    }

    if (file.isImage === true) {
        return true;
    }

    if (typeof file.imageStorageId === 'string' && file.imageStorageId.trim() !== '') {
        return true;
    }

    const fileType = typeof file.type === 'string' ? file.type.toLowerCase() : '';
    if (fileType.startsWith('image/')) {
        return true;
    }

    const fileName = typeof file.name === 'string' ? file.name : '';
    return IMAGE_FILE_EXTENSION_PATTERN.test(fileName);
}

function normalizeImageDataUrl(dataUrl) {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        return '';
    }

    const separatorIndex = dataUrl.indexOf(',');
    if (separatorIndex === -1) {
        return '';
    }

    const header = dataUrl.slice(0, separatorIndex);
    const payload = dataUrl.slice(separatorIndex + 1).replace(/\s/g, '');
    if (!payload) {
        return '';
    }

    return `${header},${payload}`;
}

function createChatImageStorageId(chatId, messageIndex, fileIndex) {
    return `chat-${chatId}-msg-${messageIndex}-file-${fileIndex}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeFilesForStorage(files, chatId, messageIndex, nextImageEntries) {
    if (!Array.isArray(files) || files.length === 0) {
        return [];
    }

    return files.map((file, fileIndex) => {
        if (!file || typeof file !== 'object') {
            return null;
        }

        const serializedFile = {
            name: file.name || `attachment-${fileIndex + 1}`,
            type: file.type || '',
        };

        if (typeof file.id !== 'undefined') {
            serializedFile.id = file.id;
        }
        if (typeof file.size !== 'undefined') {
            serializedFile.size = file.size;
        }
        if (typeof file.lastModified !== 'undefined') {
            serializedFile.lastModified = file.lastModified;
        }

        if (isImageAttachment(file)) {
            const imageStorageId = file.imageStorageId || createChatImageStorageId(chatId, messageIndex, fileIndex);
            const existingImage = cachedChatImageStore.images?.[imageStorageId];
            const dataUrl = normalizeImageDataUrl(file.content) || existingImage?.dataUrl || '';

            serializedFile.isImage = true;
            serializedFile.imageStorageId = imageStorageId;

            if (dataUrl) {
                nextImageEntries[imageStorageId] = {
                    chatId: String(chatId),
                    name: serializedFile.name,
                    type: serializedFile.type || existingImage?.type || '',
                    dataUrl
                };
            }

            return serializedFile;
        }

        if (typeof file.content === 'string') {
            serializedFile.content = file.content;
        }

        return serializedFile;
    }).filter(Boolean);
}

function hydrateFilesFromImageStore(files, imageStore) {
    if (!Array.isArray(files) || files.length === 0) {
        return [];
    }

    return files.map(file => {
        if (!file || typeof file !== 'object') {
            return file;
        }

        if (!isImageAttachment(file)) {
            return file;
        }

        const imageStorageId = typeof file.imageStorageId === 'string' ? file.imageStorageId : '';
        const storedImage = imageStorageId ? imageStore.images?.[imageStorageId] : null;
        const dataUrl = normalizeImageDataUrl(file.content) || storedImage?.dataUrl || '';

        return {
            ...file,
            isImage: true,
            imageStorageId: imageStorageId || undefined,
            name: storedImage?.name || file.name || 'image',
            type: storedImage?.type || file.type || '',
            content: dataUrl
        };
    });
}

function syncLatestUserMessageFiles(fileContents) {
    if (!Array.isArray(fileContents) || fileContents.length === 0) {
        return;
    }

    const currentChat = chatHistoryData[currentChatId];
    if (!currentChat) {
        return;
    }

    const messages = Array.isArray(currentChat) ? currentChat : currentChat.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        return;
    }

    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i]?.role === 'user') {
            messages[i].files = fileContents.map(file => ({ ...file }));
            return;
        }
    }
}

function cloneContentForRequest(content) {
    if (!Array.isArray(content)) {
        return content;
    }

    return content.map(part => {
        if (!part || typeof part !== 'object') {
            return part;
        }

        if (part.type === 'image_url') {
            return {
                ...part,
                image_url: part.image_url ? { ...part.image_url } : part.image_url
            };
        }

        return { ...part };
    });
}

function cloneMessageForRequest(message) {
    if (!message || typeof message !== 'object') {
        return message;
    }

    // Keep only API-relevant keys so internal metadata (e.g. webSearchResults,
    // hadWebSearch, UI flags) is never sent back to the model.
    const clonedMessage = {
        role: message.role,
        content: cloneContentForRequest(message.content)
    };

    if (typeof message.name === 'string' && message.name.trim()) {
        clonedMessage.name = message.name;
    }

    if (typeof message.tool_call_id === 'string' && message.tool_call_id.trim()) {
        clonedMessage.tool_call_id = message.tool_call_id;
    }

    if (Array.isArray(message.tool_calls)) {
        clonedMessage.tool_calls = message.tool_calls.map(toolCall => {
            if (!toolCall || typeof toolCall !== 'object') {
                return toolCall;
            }

            const clonedToolCall = {
                id: toolCall.id,
                type: toolCall.type,
                function: toolCall.function
                    ? {
                        name: toolCall.function.name,
                        arguments: toolCall.function.arguments
                    }
                    : toolCall.function
            };

            return clonedToolCall;
        });
    }

    return clonedMessage;
}

function getDisplayTextFromMessageContent(content) {
    if (Array.isArray(content)) {
        return content
            .map(part => part?.type === 'text' ? (part.text || '') : '')
            .filter(Boolean)
            .join('\n\n')
            .trim();
    }

    if (typeof content === 'string') {
        return content;
    }

    if (content == null) {
        return '';
    }

    return String(content);
}

/**
 * Gets the currently selected model from the available models list
 * @returns {string} - The ID of the selected model
 */
function getSelectedModel() {
    // Use the user-selected model stored in the global variable
    if (window.currentLoadedModel) {
        return window.currentLoadedModel;
    }
    if (getUseOpenRouter()) {
        const persistedOpenRouterModel = localStorage.getItem('openRouterSelectedModel');
        if (persistedOpenRouterModel) {
            return persistedOpenRouterModel;
        }
    }
    if (getUseOpenAICompatible()) {
        const persistedOpenAICompatibleModel = localStorage.getItem('openAICompatibleSelectedModel');
        if (persistedOpenAICompatibleModel) {
            return persistedOpenAICompatibleModel;
        }
    }
    const availableModels = getAvailableModels();
    // Return the first available model or a default value if none available
    return availableModels.length > 0 ? availableModels[0] : 'unknown_model';
}

function getLocalConnectionErrorHtml() {
    if (getUseOllama()) {
        return '<div class="error-message-content">' +
            '<div class="error-title">Unable to connect to Ollama</div>' +
            '<div class="error-body">' +
            'Please check that:<br>' +
            '• Ollama is running on the server or computer you entered<br>' +
            '• The configured IP address and port are correct in <a href="#" onclick="event.preventDefault(); window.showSettingsModal && window.showSettingsModal();">Settings</a><br>' +
            '• Ollama is listening on the network interface you expect (default local port is 11434)' +
            '</div>' +
            '<div class="error-help-link">' +
            '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for setup instructions' +
            '</div>' +
            '</div>';
    }

    return '<div class="error-message-content">' +
        '<div class="error-title">Unable to connect to LM Studio</div>' +
        '<div class="error-body">' +
        'Please check that:<br>' +
        '• LM Studio application is running<br>' +
        '• The server is started (green toggle switch in LM Studio)<br>' +
        '• Correct IP address and port are configured in <a href="#" onclick="event.preventDefault(); window.showSettingsModal && window.showSettingsModal();">Settings</a>' +
        '</div>' +
        '<div class="error-help-link">' +
        '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for detailed setup instructions' +
        '</div>' +
        '</div>';
}

function getNoModelsErrorHtml() {
    if (getUseOllama()) {
        return '<div class="error-message-content">' +
            '<div class="error-title">No Ollama model selected</div>' +
            '<div class="error-body">' +
            'Click the <strong>Models</strong> button in the sidebar to select a model. ' +
            'If the list is empty, pull one first on your Ollama server, for example <code>ollama pull llama3.2</code>.' +
            '</div>' +
            '<div class="error-help-link">' +
            '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for more information' +
            '</div>' +
            '</div>';
    }

    return '<div class="error-message-content">' +
        '<div class="error-title">No models loaded</div>' +
        '<div class="error-body">' +
        'Click the <strong>Models</strong> button in the sidebar to load a model. ' +
        'You need to load at least one model in LM Studio before sending messages.' +
        '</div>' +
        '<div class="error-help-link">' +
        '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for more information' +
        '</div>' +
        '</div>';
}


/**
 * Normalises a leading <tool_call>…<tool_call> block into <think>…</think>
 * so all existing thinking-tag logic handles it identically.
 * The block starts when the response begins with <tool_call> (ignoring any
 * leading whitespace) and ends at the next occurrence of the same token.
 */
function normalizeToolCallTags(text) {
    if (!text) return text;

    // Case 1: Raw opening <tool_call> is still present at the start of the response.
    const firstIdx = text.indexOf('<tool_call>');
    if (firstIdx !== -1 && text.substring(0, firstIdx).trim() === '') {
        const secondIdx = text.indexOf('<tool_call>', firstIdx + 11);
        if (secondIdx !== -1) {
            // Both opening and closing present in accumulated text — convert both.
            return text.substring(0, firstIdx) + '<think>' +
                   text.substring(firstIdx + 11, secondIdx) +
                   '</think>' +
                   text.substring(secondIdx + 11);
        }
        // Only opening present — thinking content is still streaming.
        return text.substring(0, firstIdx) + '<think>' + text.substring(firstIdx + 11);
    }

    // Case 2: The opening <tool_call> was already converted to <think> by a previous
    // call (streaming chunk boundary), but the closing <tool_call> has not been
    // processed yet.  When the closing token finally arrives the text looks like:
    //   "<think>...thinking content...<tool_call>...actual response..."
    // We need to replace that lone <tool_call> with </think>.
    const thinkOpenIdx = text.indexOf('<think>');
    if (thinkOpenIdx !== -1 && text.substring(0, thinkOpenIdx).trim() === '') {
        // Only act when the <think> block is still open (no </think> written yet).
        if (!text.includes('</think>')) {
            const closingIdx = text.indexOf('<tool_call>', thinkOpenIdx + 7);
            if (closingIdx !== -1) {
                return text.substring(0, closingIdx) + '</think>' +
                       text.substring(closingIdx + 11);
            }
        }
    }

    return text;
}

const INLINE_CHAT_TITLE_PREFIX = '[[LMSA_CHAT_TITLE::';
const INLINE_CHAT_TITLE_SUFFIX = '::END_LMSA_CHAT_TITLE]]';
const INLINE_CHAT_TITLE_OPEN_TAG = '<lmsa_chat_title>';
const INLINE_CHAT_TITLE_CLOSE_TAG = '</lmsa_chat_title>';
const INLINE_CHAT_TITLE_REGEX = /\[\[LMSA_CHAT_TITLE::([\s\S]*?)::END_LMSA_CHAT_TITLE\]\]/gi;
const INLINE_CHAT_TITLE_TAG_REGEX = /<lmsa_chat_title>\s*([\s\S]*?)\s*<\/lmsa_chat_title>/gi;
const INLINE_CHAT_TITLE_INSTRUCTION =
    'For this response only, after your normal answer, you MUST append one final line exactly in the format ' +
    `${INLINE_CHAT_TITLE_OPEN_TAG}Short Title Here${INLINE_CHAT_TITLE_CLOSE_TAG}. ` +
    'This final line is required for the app. The title must be plain text only, 2-4 words, describe the user request or chat topic, and contain no markdown. ' +
    'Do not mention the tag, do not explain it, and do not omit it.';

function stripTrailingPartialToken(text, token) {
    if (!text || !token) return text;

    for (let i = token.length - 1; i > 0; i--) {
        const partialToken = token.slice(0, i);
        if (text.endsWith(partialToken)) {
            return text.slice(0, -i);
        }
    }

    return text;
}

function removeInlineChatTitleMarkup(text) {
    if (!text) return '';

    let cleanedText = String(text)
        .replace(INLINE_CHAT_TITLE_TAG_REGEX, '')
        .replace(INLINE_CHAT_TITLE_REGEX, '');

    const tagStartIndex = cleanedText.indexOf(INLINE_CHAT_TITLE_OPEN_TAG);
    if (tagStartIndex !== -1) {
        const tagEndIndex = cleanedText.indexOf(
            INLINE_CHAT_TITLE_CLOSE_TAG,
            tagStartIndex + INLINE_CHAT_TITLE_OPEN_TAG.length
        );

        if (tagEndIndex === -1) {
            cleanedText = cleanedText.slice(0, tagStartIndex);
        } else {
            cleanedText = cleanedText.slice(0, tagStartIndex) +
                cleanedText.slice(tagEndIndex + INLINE_CHAT_TITLE_CLOSE_TAG.length);
        }
    }

    const markerStartIndex = cleanedText.indexOf(INLINE_CHAT_TITLE_PREFIX);

    if (markerStartIndex !== -1) {
        const markerEndIndex = cleanedText.indexOf(
            INLINE_CHAT_TITLE_SUFFIX,
            markerStartIndex + INLINE_CHAT_TITLE_PREFIX.length
        );

        if (markerEndIndex === -1) {
            cleanedText = cleanedText.slice(0, markerStartIndex);
        } else {
            cleanedText = cleanedText.slice(0, markerStartIndex) +
                cleanedText.slice(markerEndIndex + INLINE_CHAT_TITLE_SUFFIX.length);
        }
    }

    cleanedText = stripTrailingPartialToken(cleanedText, INLINE_CHAT_TITLE_PREFIX);
    cleanedText = stripTrailingPartialToken(cleanedText, INLINE_CHAT_TITLE_OPEN_TAG);
    cleanedText = stripTrailingPartialToken(cleanedText, INLINE_CHAT_TITLE_CLOSE_TAG);

    return cleanedText;
}

function sanitizeGeneratedChatTitle(title, fallbackSource = '') {
    let cleanTitle = filterToEnglishCharacters(
        removeThinkTags(removeInlineChatTitleMarkup(String(title || '')))
    ).trim();

    cleanTitle = cleanTitle.replace(/\*\*(.+?)\*\*/g, '$1');
    cleanTitle = cleanTitle.replace(/\*(.+?)\*/g, '$1');
    cleanTitle = cleanTitle.replace(/_(.+?)_/g, '$1');
    cleanTitle = cleanTitle.replace(/`(.+?)`/g, '$1');
    cleanTitle = cleanTitle.replace(/\[(.+?)\]\(.+?\)/g, '$1');
    cleanTitle = cleanTitle.replace(/^#+\s+(.+)$/gm, '$1');
    cleanTitle = cleanTitle.replace(/["']/g, '');
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    if (cleanTitle) {
        const words = cleanTitle.split(/\s+/);
        if (words.length > 3) {
            cleanTitle = words.slice(0, 3).join(' ');
        }
    }

    return cleanTitle || null;
}

function extractInlineChatTitle(text, fallbackSource = '') {
    if (!text) {
        return null;
    }

    let tagMatch = null;
    for (const match of String(text).matchAll(INLINE_CHAT_TITLE_TAG_REGEX)) {
        tagMatch = match;
    }
    if (tagMatch && typeof tagMatch[1] === 'string') {
        return sanitizeGeneratedChatTitle(tagMatch[1], fallbackSource);
    }

    let markerMatch = null;
    for (const match of String(text).matchAll(INLINE_CHAT_TITLE_REGEX)) {
        markerMatch = match;
    }
    if (markerMatch && typeof markerMatch[1] === 'string') {
        return sanitizeGeneratedChatTitle(markerMatch[1], fallbackSource);
    }

    return null;
}

function prepareAssistantResponseForStorage(aiMessage, userMessage, shouldExtractTitle = false) {
    const normalizedMessage = normalizeMalformedCodeFences(normalizeReasoningTags(aiMessage));
    const cleanMessage = removeInlineChatTitleMarkup(normalizedMessage);

    return {
        cleanMessage,
        title: shouldExtractTitle ? extractInlineChatTitle(normalizedMessage, userMessage) : null,
    };
}

function cloneWebSearchSources(sources) {
    if (!Array.isArray(sources)) {
        return [];
    }

    return sources
        .filter(source => source && typeof source === 'object')
        .map(source => ({
            title: typeof source.title === 'string' ? source.title : '',
            url: typeof source.url === 'string' ? source.url : '',
            hostname: typeof source.hostname === 'string' ? source.hostname : ''
        }))
        .filter(source => source.url);
}

function shouldRequestInlineChatTitle(chatMessages) {
    return getAutoGenerateTitles()
        && Array.isArray(chatMessages)
        && chatMessages.length === 1
        && chatMessages[0]?.role === 'user';
}

function appendRequestSystemPrompts(targetMessages, baseSystemPrompt, shouldInlineChatTitle) {
    if (baseSystemPrompt && baseSystemPrompt.trim() !== '') {
        targetMessages.push({ role: 'system', content: baseSystemPrompt.trim() });
    }

    if (shouldInlineChatTitle) {
        targetMessages.push({ role: 'system', content: INLINE_CHAT_TITLE_INSTRUCTION });
    }
}

function shouldUseLmStudioNativeMcpChat() {
    return !getUseOpenRouter() && !getUseOpenAICompatible() && !getUseOllama() && hasLMStudioMcpIntegrations();
}

function buildNativeSystemPrompt(shouldInlineChatTitle) {
    const promptParts = [];

    if (getSystemPrompt() && getSystemPrompt().trim() !== '') {
        promptParts.push(getSystemPrompt().trim());
    }

    if (shouldInlineChatTitle) {
        promptParts.push(INLINE_CHAT_TITLE_INSTRUCTION);
    }

    return promptParts.join('\n\n').trim();
}

function getMessageTextForNativeInput(content, role = 'user') {
    if (Array.isArray(content)) {
        return content.map(part => {
            if (part?.type === 'text') {
                return part.text || '';
            }
            if (part?.type === 'image_url') {
                return '[Image attachment]';
            }
            return '';
        }).filter(Boolean).join('\n');
    }

    const rawText = typeof content === 'string' ? content : String(content || '');

    if (role === 'assistant') {
        return stripReasoningSections(removeInlineChatTitleMarkup(normalizeReasoningTags(rawText))).trim();
    }

    return rawText;
}

function buildNativeTranscriptPrefix(messages, lastUserMessageIndex) {
    const earlierMessages = messages.slice(0, lastUserMessageIndex).filter(msg => !msg?.isTopicBoundary);
    if (earlierMessages.length === 0) {
        return '';
    }

    const transcriptLines = ['Conversation so far:'];

    earlierMessages.forEach(msg => {
        if (!msg || typeof msg !== 'object') {
            return;
        }

        const label = msg.role === 'assistant'
            ? 'Assistant'
            : msg.role === 'system'
                ? 'System'
                : 'User';
        const text = getMessageTextForNativeInput(msg.content, msg.role);
        if (text) {
            transcriptLines.push(`${label}: ${text}`);
        }
    });

    transcriptLines.push('', 'Continue the same conversation using the new user message below.', '');
    return transcriptLines.join('\n');
}

function buildNativeInputFromContent(content, transcriptPrefix = '') {
    if (Array.isArray(content)) {
        const items = [];
        let hasTextItem = false;

        content.forEach(part => {
            if (part?.type === 'text') {
                const textValue = part.text || '';
                if (textValue || transcriptPrefix) {
                    items.push({
                        type: 'message',
                        content: hasTextItem || !transcriptPrefix
                            ? textValue
                            : `${transcriptPrefix}${textValue ? `\n${textValue}` : ''}`.trim()
                    });
                    hasTextItem = true;
                }
            } else if (part?.type === 'image_url' && part.image_url?.url) {
                items.push({
                    type: 'image',
                    data_url: part.image_url.url
                });
            }
        });

        if (!hasTextItem && transcriptPrefix) {
            items.unshift({
                type: 'message',
                content: transcriptPrefix.trim()
            });
        }

        return items;
    }

    const messageText = typeof content === 'string' ? content : String(content || '');
    if (!transcriptPrefix) {
        return messageText;
    }

    return `${transcriptPrefix}${messageText ? `\n${messageText}` : ''}`.trim();
}

function getLatestLmStudioResponseId(messages, upToIndex = messages.length - 1) {
    for (let i = Math.min(upToIndex, messages.length - 1); i >= 0; i--) {
        const message = messages[i];
        if (message?.role === 'assistant' && message.lmStudioResponseId) {
            return message.lmStudioResponseId;
        }
    }

    return null;
}

function sanitizeLmStudioMcpIntegration(entry) {
    if (typeof entry === 'string') {
        return entry;
    }

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
    }

    const sanitizedEntry = {};

    Object.entries(entry).forEach(([key, value]) => {
        if (key.startsWith('_')) {
            return;
        }

        sanitizedEntry[key] = value;
    });

    return sanitizedEntry;
}

function sanitizeLmStudioMcpIntegrations(entries) {
    if (!Array.isArray(entries)) {
        return [];
    }

    return entries
        .map(sanitizeLmStudioMcpIntegration)
        .filter(entry => typeof entry === 'string' || (entry && typeof entry === 'object' && !Array.isArray(entry)));
}

function buildLmStudioMcpRequest(messages, shouldInlineChatTitle) {
    const lastUserMessageIndex = messages.length - 1;
    const lastUserMessage = messages[lastUserMessageIndex];
    const previousResponseId = getLatestLmStudioResponseId(messages, lastUserMessageIndex - 1);
    const transcriptPrefix = previousResponseId ? '' : buildNativeTranscriptPrefix(messages, lastUserMessageIndex);
    const requestBody = {
        model: getSelectedModel(),
        input: buildNativeInputFromContent(lastUserMessage?.content, transcriptPrefix),
        integrations: sanitizeLmStudioMcpIntegrations(getLMStudioMcpIntegrations()),
        temperature: getTemperature(),
        stream: false,
        store: true,
        context_length: 8000
    };

    const systemPrompt = buildNativeSystemPrompt(shouldInlineChatTitle);
    if (systemPrompt) {
        requestBody.system_prompt = systemPrompt;
    }

    if (previousResponseId) {
        requestBody.previous_response_id = previousResponseId;
    }

    const maxTokens = getConfiguredMaxTokens();
    if (maxTokens > 0) {
        requestBody.options = {
            ...(requestBody.options || {}),
            max_tokens: maxTokens
        };
    }

    return requestBody;
}

function formatLmStudioMcpProvider(providerInfo) {
    if (!providerInfo || typeof providerInfo !== 'object') {
        return 'LM Studio MCP';
    }

    if (providerInfo.type === 'plugin' && providerInfo.plugin_id) {
        return providerInfo.plugin_id;
    }

    if (providerInfo.type === 'ephemeral_mcp' && providerInfo.server_label) {
        return providerInfo.server_label;
    }

    return 'LM Studio MCP';
}

function buildLmStudioMcpDisplayMessage(outputItems = []) {
    const reasoningSections = [];
    const messageSections = [];

    outputItems.forEach(item => {
        if (!item || typeof item !== 'object') {
            return;
        }

        if (item.type === 'reasoning' && item.content) {
            reasoningSections.push(item.content.trim());
            return;
        }

        if (item.type === 'tool_call') {
            const providerLabel = formatLmStudioMcpProvider(item.provider_info);
            let toolSummary = `Used MCP tool: ${item.tool || 'unknown'} (${providerLabel})`;
            if (item.arguments && Object.keys(item.arguments).length > 0) {
                try {
                    toolSummary += `\nArguments: ${JSON.stringify(item.arguments)}`;
                } catch (_) {
                    // Ignore JSON stringification issues and keep the summary concise.
                }
            }
            reasoningSections.push(toolSummary);
            return;
        }

        if (item.type === 'invalid_tool_call') {
            reasoningSections.push(`MCP tool call failed: ${item.reason || 'Unknown tool-call error'}`);
            return;
        }

        if (item.type === 'message' && item.content) {
            messageSections.push(item.content);
        }
    });

    const outputParts = [];

    if (reasoningSections.length > 0) {
        outputParts.push(`<think>\n${reasoningSections.join('\n\n')}\n</think>`);
    }

    if (messageSections.length > 0) {
        outputParts.push(messageSections.join('\n\n'));
    }

    return outputParts.join('\n\n').trim();
}

async function sendLmStudioMcpRequest(requestBody, signal) {
    const requestHeaders = {
        'Content-Type': 'application/json',
    };

    const lmToken = getLMStudioApiToken();
    if (lmToken) {
        requestHeaders['Authorization'] = `Bearer ${lmToken}`;
    }

    const response = await fetch(getApiUrl({ preferNativeLmStudio: true }), {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
        signal
    });

    if (!response.ok) {
        let errorText = `HTTP Error: ${response.status} ${response.statusText}`;

        try {
            const errorData = await response.json();
            const rawError = errorData?.error || errorData?.message;
            if (rawError && typeof rawError === 'object') {
                errorText = rawError.message || errorText;
            } else if (typeof rawError === 'string' && rawError.trim()) {
                errorText = rawError;
            }
        } catch (_) {
            // Fall back to the HTTP status text when the body is not JSON.
        }

        throw new Error(errorText);
    }

    const result = await response.json();
    return {
        responseId: result?.response_id || null,
        aiMessage: buildLmStudioMcpDisplayMessage(result?.output || []),
        rawResult: result
    };
}

/**
 * Checks if the server supports file uploads
 * @returns {boolean} - True if file uploads are supported
 */
function supportsFileUploads() {
    // This is a placeholder - implement actual detection logic if needed
    return false;
}

/**
 * Generates an AI response with retry logic for reasoning models
 * @param {string} userMessage - The user's message
 * @param {Array} fileContents - Optional array of file contents
 * @param {number} retryCount - Current retry attempt (internal use)
 */
async function generateAIResponseWithRetry(userMessage, fileContents = [], retryCount = 0) {
    const maxRetries = 2; // Allow up to 2 retries for reasoning models

    try {
        return await generateAIResponseInternal(userMessage, fileContents);
    } catch (error) {
        // Check if this is a timeout error and we haven't exceeded max retries
        if (error.message.includes('timed out') && retryCount < maxRetries) {
            debugLog(`Streaming timed out, attempting retry ${retryCount + 1}/${maxRetries}`);

            // Show user that we're retrying
            appendMessage('system', `Connection timed out during reasoning process. Retrying... (${retryCount + 1}/${maxRetries})`);

            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Retry with incremented count
            return await generateAIResponseWithRetry(userMessage, fileContents, retryCount + 1);
        } else {
            // Re-throw the error if it's not a timeout or we've exceeded retries
            throw error;
        }
    }
}

function normalizeWebSearchText(text) {
    const displayText = getDisplayTextFromMessageContent(text);
    if (typeof displayText !== 'string') {
        return '';
    }

    return stripInjectedWebSearchContext(displayText)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripSearchInstructionPhrases(text) {
    if (!text) {
        return '';
    }

    let cleaned = text.trim();
    cleaned = cleaned.replace(/^(?:hey|hi|hello)\b[\s,!.-]*/i, '');
    cleaned = cleaned.replace(/^(?:can|could|would|will)\s+you\s+/i, '');
    cleaned = cleaned.replace(/^(?:please\s+)?(?:search(?:\s+the\s+web)?\s+for|look\s+up|find\s+information\s+about|find\s+out\s+about|tell\s+me\s+about|give\s+me\s+information\s+about|i\s+want\s+to\s+know\s+about|i\s+need\s+information\s+about)\s+/i, '');
    cleaned = cleaned.replace(/\b(?:using|with)\s+web\s+search\b/gi, ' ');
    cleaned = cleaned.replace(/\b(?:please|thanks|thank you)\b/gi, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}

function stripPresentationDirectives(text) {
    if (!text) {
        return '';
    }

    return text
        .replace(/(?:^|[\s,;])(?:in\s+simple\s+terms|step\s+by\s+step|briefly|keep\s+it\s+short|keep\s+it\s+brief|with\s+sources|cite\s+sources|with\s+citations|without\s+tables|no\s+tables|in\s+bullet\s+points|as\s+bullet\s+points)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractErrorFocusedQuery(text) {
    if (!text || !WEB_SEARCH_ERROR_PATTERN.test(text)) {
        return '';
    }

    const errorTokens = text.match(/[A-Za-z0-9_./:#+\-]+/g) || [];
    const filteredTokens = errorTokens.filter(token => {
        if (!token) {
            return false;
        }

        const lowerToken = token.toLowerCase();
        if (WEB_SEARCH_STOP_WORDS.has(lowerToken)) {
            return false;
        }

        return token.length > 1 || /\d/.test(token);
    });

    return filteredTokens.slice(0, 16).join(' ').trim();
}

function extractKeywordQuery(text, maxTerms = 14) {
    if (!text) {
        return '';
    }

    const tokens = text.match(/[A-Za-z0-9][A-Za-z0-9_./:#+\-]*/g) || [];
    const seen = new Set();
    const keywords = [];

    for (const token of tokens) {
        const lowerToken = token.toLowerCase();
        const isStructuredToken = /[A-Z]/.test(token) || /\d/.test(token) || /[._/#:+-]/.test(token);

        if (!isStructuredToken && WEB_SEARCH_STOP_WORDS.has(lowerToken)) {
            continue;
        }

        if (token.length <= 1 && !/\d/.test(token)) {
            continue;
        }

        if (seen.has(lowerToken)) {
            continue;
        }

        seen.add(lowerToken);
        keywords.push(token);

        if (keywords.length >= maxTerms) {
            break;
        }
    }

    return keywords.join(' ').trim();
}

function buildKeywordSet(text, maxTerms = 10) {
    const keywordText = extractKeywordQuery(text, maxTerms);
    if (!keywordText) {
        return new Set();
    }

    return new Set(
        keywordText
            .toLowerCase()
            .split(/\s+/)
            .map(token => token.trim())
            .filter(Boolean)
    );
}

function countWords(text) {
    if (!text) {
        return 0;
    }

    return text.split(/\s+/).filter(Boolean).length;
}

function sanitizeWebSearchQuery(query) {
    let normalizedQuery = normalizeWebSearchText(query);
    if (!normalizedQuery) {
        return '';
    }

    if (normalizedQuery.length > WEB_SEARCH_QUERY_MAX_LENGTH) {
        debugLog('Trimming web search query to max length.');
        normalizedQuery = normalizedQuery.slice(0, WEB_SEARCH_QUERY_MAX_LENGTH).trim();
    }

    return normalizedQuery;
}

function normalizeWebSearchPromptForPolicy(text) {
    const normalizedText = normalizeWebSearchText(text);
    if (!normalizedText) {
        return '';
    }

    return stripPresentationDirectives(
        stripSearchInstructionPhrases(normalizedText)
    ) || normalizedText;
}

function getPriorUserMessages(chatMessages = []) {
    if (!Array.isArray(chatMessages)) {
        return [];
    }

    return chatMessages
        .filter(message => message?.role === 'user')
        .slice(0, -1);
}

function getNormalizedUserMessageText(message) {
    return normalizeWebSearchPromptForPolicy(message?.content || '');
}

function getTopicOverlapStats(currentText, referenceText) {
    const currentKeywords = buildKeywordSet(currentText, 10);
    const referenceKeywords = buildKeywordSet(referenceText, 10);

    if (currentKeywords.size === 0 || referenceKeywords.size === 0) {
        return {
            overlapCount: 0,
            minRatio: 0,
            currentSize: currentKeywords.size,
            referenceSize: referenceKeywords.size
        };
    }

    let overlapCount = 0;
    for (const keyword of currentKeywords) {
        if (referenceKeywords.has(keyword)) {
            overlapCount += 1;
        }
    }

    return {
        overlapCount,
        minRatio: overlapCount / Math.min(currentKeywords.size, referenceKeywords.size),
        currentSize: currentKeywords.size,
        referenceSize: referenceKeywords.size
    };
}

function areWebSearchTopicsRelated(currentText, referenceText) {
    if (!currentText || !referenceText) {
        return false;
    }

    if (currentText === referenceText) {
        return true;
    }

    const overlapStats = getTopicOverlapStats(currentText, referenceText);
    if (overlapStats.currentSize < 2 || overlapStats.referenceSize < 2) {
        return false;
    }

    return overlapStats.overlapCount >= 2
        || (overlapStats.overlapCount >= 1 && overlapStats.minRatio >= WEB_SEARCH_TOPIC_OVERLAP_MIN_RATIO);
}

function isExplicitWebSearchSkipRequest(text) {
    const normalizedText = normalizeWebSearchText(text).toLowerCase();
    return Boolean(normalizedText) && WEB_SEARCH_FORCE_SKIP_PATTERN.test(normalizedText);
}

function isExplicitWebSearchRequest(text) {
    return WEB_SEARCH_EXPLICIT_REQUEST_PATTERN.test(normalizeWebSearchText(text));
}

function isFreshnessSensitiveWebSearch(text) {
    return WEB_SEARCH_FORCE_FRESH_PATTERN.test(normalizeWebSearchText(text));
}

function getStoredWebSearchPayload(message) {
    if (!message || message.role !== 'user' || !message.hadWebSearch) {
        return null;
    }

    const searchContext = typeof message.webSearchResults === 'string' ? message.webSearchResults.trim() : '';
    if (!searchContext) {
        return null;
    }

    const clonedSources = cloneWebSearchSources(message.webSearchSources);
    return {
        context: searchContext,
        sources: clonedSources.length > 0 ? clonedSources : extractWebSearchSourcesFromContext(searchContext),
        query: typeof message.webSearchQuery === 'string' ? message.webSearchQuery : '',
        providerName: typeof message.webSearchProviderName === 'string' ? message.webSearchProviderName : '',
        mode: message.webSearchMode === 'reuse' ? 'reuse' : 'fresh'
    };
}

function getLatestWebSearchEntry(chatMessages = []) {
    const priorUserMessages = getPriorUserMessages(chatMessages);

    for (let index = priorUserMessages.length - 1; index >= 0; index -= 1) {
        const message = priorUserMessages[index];
        const payload = getStoredWebSearchPayload(message);
        if (!payload) {
            continue;
        }

        return {
            message,
            text: getNormalizedUserMessageText(message),
            payload
        };
    }

    return null;
}

function buildRecentSearchContext(chatMessages, referenceText = '') {
    const priorUserMessages = getPriorUserMessages(chatMessages);
    if (priorUserMessages.length === 0) {
        return '';
    }

    const collectedTexts = [];
    for (let index = priorUserMessages.length - 1; index >= 0 && collectedTexts.length < WEB_SEARCH_RECENT_CONTEXT_TURNS; index -= 1) {
        const priorText = getNormalizedUserMessageText(priorUserMessages[index]);
        if (!priorText || isSkipWorthyWebSearchQuery(priorText)) {
            continue;
        }

        if (!referenceText || shouldUseRecentContext(referenceText) || areWebSearchTopicsRelated(referenceText, priorText)) {
            collectedTexts.unshift(priorText);
            continue;
        }

        if (collectedTexts.length > 0) {
            break;
        }
    }

    const combinedContext = collectedTexts.join(' ');
    const keywordContext = extractKeywordQuery(combinedContext, WEB_SEARCH_CONTEXT_KEYWORD_LIMIT) || combinedContext;

    return keywordContext.slice(0, WEB_SEARCH_CONTEXT_MAX_LENGTH).trim();
}

function shouldUseRecentContext(text) {
    if (!text) {
        return false;
    }

    const wordCount = countWords(text);
    const hasFollowUpIndicator = WEB_SEARCH_FOLLOW_UP_PATTERN.test(text) || 
                                 WEB_SEARCH_AMBIGUOUS_LEAD_PATTERN.test(text);

    // If the follow-up explicitly references prior context (it/that/these/etc.),
    // allow a broader length limit because users often ask full-sentence follow-ups.
    if (hasFollowUpIndicator) {
        return wordCount <= 12;
    }

    // Handle follow-ups that omit prior topic words (e.g., "what are the side effects?").
    // If the query is short and semantically sparse, prepend recent context to ground search.
    const keywordCount = extractKeywordQuery(text, 6).split(/\s+/).filter(Boolean).length;
    const startsWithQuestionWord = /^(what|when|where|why|how|which|who|is|are|can|could|would|should|did|do|does)\b/i.test(text);
    const isLikelyContextDependent = startsWithQuestionWord && keywordCount <= 3 && wordCount <= 10;

    if (isLikelyContextDependent) {
        return true;
    }

    return false;
}

function isSkipWorthyWebSearchQuery(text) {
    if (!text) {
        return true;
    }

    const normalized = normalizeWebSearchText(text).toLowerCase().trim();
    if (!normalized) {
        return true;
    }

    const words = normalized.split(/\s+/);
    
    // If message is just 1-2 words, check if it's an acknowledgment
    if (words.length <= 2) {
        for (const word of words) {
            if (WEB_SEARCH_SKIP_WORDS.has(word)) {
                return true;
            }
        }
        // Phrases like "that's right" or "no problem"
        if (WEB_SEARCH_SKIP_WORDS.has(normalized)) {
            return true;
        }
    }

    // Check for multi-word acknowledgment phrases
    const skipPhrases = [
        'got it', 'make sense', 'got that', 'i see', 'i understand', 'no problem',
        'all good', 'no worries', 'that works', 'that\'s right', 'that\'s correct',
        'sounds good', 'thank you', 'thanks for', 'appreciate it'
    ];
    
    for (const phrase of skipPhrases) {
        if (normalized.includes(phrase)) {
            return true;
        }
    }

    // If the cleaned prompt (after removing filler) is too short, skip search
    const cleanedPrompt = stripPresentationDirectives(
        stripSearchInstructionPhrases(normalized)
    );
    
    if (countWords(cleanedPrompt) <= 1) {
        return true;
    }

    return false;
}

function isFirstUserMessage(chatMessages) {
    if (!Array.isArray(chatMessages)) {
        return true;
    }
    return chatMessages.filter(m => m.role === 'user').length <= 1;
}

function getPreviousUserMessage(chatMessages = []) {
    if (!Array.isArray(chatMessages)) {
        return null;
    }

    const userMessages = chatMessages.filter(message => message?.role === 'user');
    if (userMessages.length < 2) {
        return null;
    }

    return userMessages[userMessages.length - 2];
}

function buildRetryWebSearchQuery(userMessage, chatMessages = []) {
    const normalizedPrompt = normalizeWebSearchText(userMessage || '').toLowerCase();
    if (!WEB_SEARCH_RETRY_PATTERN.test(normalizedPrompt)) {
        return '';
    }

    const latestWebSearchEntry = getLatestWebSearchEntry(chatMessages);
    if (latestWebSearchEntry?.payload?.query) {
        return latestWebSearchEntry.payload.query;
    }

    const previousUserMessage = getPreviousUserMessage(chatMessages);
    const previousContent = getDisplayTextFromMessageContent(previousUserMessage?.content || '');
    if (!previousContent || isSkipWorthyWebSearchQuery(previousContent)) {
        return '';
    }

    return buildWebSearchQuery(previousContent, chatMessages);
}

function isLikelyTopicSwitch(userMessage, chatMessages = []) {
    const normalizedCurrent = normalizeWebSearchPromptForPolicy(userMessage || '');
    if (!normalizedCurrent || shouldUseRecentContext(normalizedCurrent)) {
        return false;
    }

    const priorUserTexts = getPriorUserMessages(chatMessages)
        .slice(-WEB_SEARCH_RECENT_TOPIC_TURNS)
        .map(getNormalizedUserMessageText)
        .filter(text => text && !isSkipWorthyWebSearchQuery(text));

    if (priorUserTexts.length === 0) {
        return false;
    }

    const currentKeywords = buildKeywordSet(normalizedCurrent, 10);
    const previousKeywords = buildKeywordSet(priorUserTexts.join(' '), 12);

    if (currentKeywords.size < 3 || previousKeywords.size < 3) {
        return false;
    }

    let overlapCount = 0;
    for (const keyword of currentKeywords) {
        if (previousKeywords.has(keyword)) {
            overlapCount += 1;
        }
    }

    // Strong topic switch signal: substantial keywords on both turns with no overlap.
    return overlapCount === 0;
}

function buildWebSearchQuery(userMessage, chatMessages = []) {
    const normalizedPrompt = normalizeWebSearchPromptForPolicy(userMessage);
    if (!normalizedPrompt) {
        return '';
    }

    // Light cleanup: remove conversational filler and presentation directives.
    // We deliberately avoid aggressive keyword stripping here because SearXNG
    // handles natural language well, and over-stripping causes 'hit or miss' searches.
    const cleanedPrompt = stripPresentationDirectives(
        stripSearchInstructionPhrases(normalizedPrompt)
    ) || normalizedPrompt;

    let finalQuery;

    if (WEB_SEARCH_ERROR_PATTERN.test(cleanedPrompt)) {
        // Error/code debugging: extract focused tokens to avoid sending large code blocks
        finalQuery = extractErrorFocusedQuery(cleanedPrompt) || cleanedPrompt;
    } else if (!isFirstUserMessage(chatMessages) && shouldUseRecentContext(cleanedPrompt)) {
        // Short, ambiguous follow-up on a non-first turn: prepend prior context
        const recentContext = buildRecentSearchContext(chatMessages, cleanedPrompt);
        finalQuery = recentContext ? `${recentContext} ${cleanedPrompt}` : cleanedPrompt;
    } else {
        // All other cases (including the first message): use the cleaned prompt as-is.
        // This is the most reliable path — don't over-process.
        finalQuery = cleanedPrompt;
    }

    return sanitizeWebSearchQuery(finalQuery.replace(/\s+/g, ' ').trim());
}

function buildUsableWebSearchPayload(query, providerName, results) {
    if (!Array.isArray(results) || results.length === 0) {
        return null;
    }

    const usableResults = results
        .map(item => ({
            title: normalizeSearchResultText(item?.title),
            content: normalizeSearchResultText(item?.content),
            url: normalizeSearchResultText(item?.url)
        }))
        .filter(item => item.title && (item.content || item.url))
        .slice(0, 5);

    const sources = buildWebSearchSourceList(usableResults);
    const hasMeaningfulSnippet = usableResults.some(item => item.content.length >= 24);

    if (usableResults.length === 0 || sources.length === 0 || !hasMeaningfulSnippet) {
        return null;
    }

    return {
        context: buildWebSearchContext(query, providerName, usableResults),
        query,
        providerName,
        sources
    };
}

async function performWebSearch(query) {
    if (!query) return null;
    for (const provider of WEB_SEARCH_PROVIDERS) {
        try {
            debugLog(`Searching the web for context via ${provider.name}...`);
            const results = await fetchWebSearchProviderResults(provider, query);
            if (results.length > 0) {
                const searchPayload = buildUsableWebSearchPayload(query, provider.name, results);
                if (searchPayload?.context) {
                    debugLog('Injecting search context:', searchPayload.context.substring(0, 200));
                    return searchPayload;
                }

                console.warn(`${provider.name} returned low-signal results for query:`, query);
                continue;
            }

            console.warn(`${provider.name} returned no results for query:`, query);
        } catch (error) {
            console.warn(`${provider.name} search failed:`, error?.message || error);
        }
    }

    console.warn('All web search providers returned no usable results for query:', query);
    return null;
}

async function fetchWebSearchProviderResults(provider, query) {
    const searchUrl = new URL(provider.url);

    if (provider.type === 'duckduckgo') {
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('no_html', '1');
        searchUrl.searchParams.set('skip_disambig', '1');
    } else {
        searchUrl.searchParams.set('q', query);
        searchUrl.searchParams.set('format', 'json');
        searchUrl.searchParams.set('categories', 'general');
    }

    const resultData = await fetchJsonWithNativeFallback(searchUrl.toString());
    if (!resultData) {
        return [];
    }

    if (provider.type === 'duckduckgo') {
        return extractDuckDuckGoResults(resultData);
    }

    return extractSearxngResults(resultData);
}

async function fetchJsonWithNativeFallback(urlString) {
    if (window.nativeFetch && typeof window.nativeFetch === 'function') {
        const nativeResult = await window.nativeFetch(urlString);
        if (nativeResult) {
            try {
                return JSON.parse(nativeResult);
            } catch (error) {
                console.warn('Failed to parse native fetch result:', error);
            }
        }
    }

    try {
        const response = await fetchWithTimeout(urlString, WEB_SEARCH_FETCH_TIMEOUT_MS);
        if (response.ok) {
            return await response.json();
        }

        console.warn(`Direct web search HTTP error: ${response.status}`);
    } catch (error) {
        if (error.name !== 'TypeError' || window.location.protocol === 'file:') {
            throw error;
        }

        debugLog('Direct search failed, attempting CORS proxy fallback...');
    }

    if (window.location.protocol !== 'file:') {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlString)}`;
        const proxyResponse = await fetchWithTimeout(proxyUrl, WEB_SEARCH_FETCH_TIMEOUT_MS);
        if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            if (proxyData?.contents) {
                return JSON.parse(proxyData.contents);
            }
        }
    }

    return null;
}

async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

function extractSearxngResults(resultData) {
    if (!Array.isArray(resultData?.results)) {
        return [];
    }

    return resultData.results
        .map(item => ({
            title: normalizeSearchResultText(item?.title),
            content: normalizeSearchResultText(item?.content || item?.url),
            url: normalizeSearchResultText(item?.url)
        }))
        .filter(item => item.title && (item.content || item.url));
}

function extractDuckDuckGoResults(resultData) {
    const results = [];
    const abstractText = normalizeSearchResultText(resultData?.AbstractText || resultData?.Abstract);
    const abstractTitle = normalizeSearchResultText(resultData?.Heading || 'DuckDuckGo result');

    if (abstractText) {
        results.push({
            title: abstractTitle,
            content: abstractText,
            url: normalizeSearchResultText(resultData?.AbstractURL)
        });
    }

    appendDuckDuckGoRelatedTopics(results, resultData?.RelatedTopics);
    return results;
}

function appendDuckDuckGoRelatedTopics(results, topics) {
    if (!Array.isArray(topics)) {
        return;
    }

    for (const topic of topics) {
        if (results.length >= 5) {
            return;
        }

        if (Array.isArray(topic?.Topics)) {
            appendDuckDuckGoRelatedTopics(results, topic.Topics);
            continue;
        }

        const text = normalizeSearchResultText(topic?.Text);
        if (!text) {
            continue;
        }

        results.push({
            title: text.split(' - ')[0].slice(0, 120),
            content: text,
            url: normalizeSearchResultText(topic?.FirstURL)
        });
    }
}

function normalizeSearchResultText(text) {
    if (text == null) {
        return '';
    }

    return String(text).replace(/\s+/g, ' ').trim();
}

function normalizeWebSearchHostname(url) {
    const normalizedUrl = normalizeSearchResultText(url);
    if (!normalizedUrl) {
        return '';
    }

    try {
        return new URL(normalizedUrl).hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
        return '';
    }
}

function truncateWebSearchSourceLabel(text, maxLength = 96) {
    const normalizedText = normalizeSearchResultText(text);
    if (normalizedText.length <= maxLength) {
        return normalizedText;
    }

    return `${normalizedText.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function buildWebSearchSourceList(results) {
    if (!Array.isArray(results)) {
        return [];
    }

    const seenHosts = new Set();
    const sources = [];

    for (const item of results) {
        const url = normalizeSearchResultText(item?.url);
        if (!url) {
            continue;
        }

        const hostname = normalizeWebSearchHostname(url);
        const dedupeKey = hostname || url;
        if (seenHosts.has(dedupeKey)) {
            continue;
        }

        seenHosts.add(dedupeKey);
        sources.push({
            title: truncateWebSearchSourceLabel(item?.title || hostname || url),
            url,
            hostname
        });

        if (sources.length >= 5) {
            break;
        }
    }

    return sources;
}

function extractWebSearchSourcesFromContext(searchContext) {
    if (typeof searchContext !== 'string' || !searchContext.trim()) {
        return [];
    }

    const parsedResults = [];
    const lines = searchContext.split('\n');

    for (const line of lines) {
        const match = line.match(/^\s*\d+\.\s*(.+?):.*\((https?:\/\/[^)\s]+)\)\s*$/i);
        if (!match) {
            continue;
        }

        parsedResults.push({
            title: normalizeSearchResultText(match[1]),
            url: normalizeSearchResultText(match[2])
        });
    }

    return buildWebSearchSourceList(parsedResults);
}

function appendWebSearchSourcesSection(message, sources) {
    if (typeof message !== 'string') {
        return message;
    }

    // Preserve legacy call sites but intentionally suppress source injection in assistant text.
    return message.trimEnd();
}

function buildWebSearchContext(query, providerName, results) {
    let searchContext = `${WEB_SEARCH_CONTEXT_HEADER}\n`;
    searchContext += `Query: ${query}\n`;
    searchContext += `Provider: ${providerName}\n`;

    results.slice(0, 5).forEach((item, index) => {
        const snippet = item.content || item.url || '';
        const urlSuffix = item.url ? ` (${item.url})` : '';
        searchContext += `${index + 1}. ${item.title}: ${snippet}${urlSuffix}\n`;
    });

    return searchContext;
}

function getChatCompletionHeaders() {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (getUseOpenRouter()) {
        headers['Authorization'] = `Bearer ${getOpenRouterApiKey()}`;
        headers['HTTP-Referer'] = 'https://lmsa.app';
        headers['X-Title'] = 'LMSA';
    } else if (getUseOpenAICompatible()) {
        const apiKey = getOpenAICompatibleApiKey();
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
    } else if (!getUseOllama()) {
        const lmToken = getLMStudioApiToken();
        if (lmToken) {
            headers['Authorization'] = `Bearer ${lmToken}`;
        }
    }

    return headers;
}

function buildWebSearchToolDefinition() {
    return [
        {
            type: 'function',
            function: {
                name: WEB_SEARCH_TOOL_NAME,
                description: 'Call this only when the latest user request needs fresh or external factual information from the web. Do not call this for acknowledgments, gratitude, or conversational follow-ups that can be answered from the existing chat context.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'A standalone web-search query for the latest user request.'
                        }
                    },
                    required: ['query'],
                    additionalProperties: false
                }
            }
        }
    ];
}

function extractWebSearchQueryFromToolCalls(responseData) {
    const toolCalls = responseData?.choices?.[0]?.message?.tool_calls;
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        return '';
    }

    for (const toolCall of toolCalls) {
        if (!toolCall || toolCall.type !== 'function' || toolCall.function?.name !== WEB_SEARCH_TOOL_NAME) {
            continue;
        }

        const rawArgs = toolCall.function?.arguments;
        if (typeof rawArgs !== 'string' || !rawArgs.trim()) {
            continue;
        }

        try {
            const parsedArgs = JSON.parse(rawArgs);
            const candidateQuery = typeof parsedArgs?.query === 'string' ? parsedArgs.query : '';
            const normalizedQuery = sanitizeWebSearchQuery(candidateQuery);
            if (normalizedQuery) {
                return normalizedQuery;
            }
        } catch (_) {
            const normalizedQuery = sanitizeWebSearchQuery(rawArgs);
            if (normalizedQuery) {
                return normalizedQuery;
            }
        }
    }

    return '';
}

function normalizeWebSearchDecisionContent(content) {
    const displayText = getDisplayTextFromMessageContent(content);
    const cleaned = stripInjectedWebSearchContext(displayText || '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) {
        return '';
    }

    if (cleaned.length <= WEB_SEARCH_DECISION_MAX_CHARS_PER_MESSAGE) {
        return cleaned;
    }

    return cleaned.slice(-WEB_SEARCH_DECISION_MAX_CHARS_PER_MESSAGE).trim();
}

function buildWebSearchDecisionMessages(requestMessages) {
    if (!Array.isArray(requestMessages) || requestMessages.length === 0) {
        return [];
    }

    const decisionMessages = [];
    const systemMessages = requestMessages.filter(m => m && m.role === 'system');
    const latestSystem = systemMessages.length > 0 ? systemMessages[systemMessages.length - 1] : null;

    if (latestSystem) {
        const systemContent = normalizeWebSearchDecisionContent(latestSystem.content);
        if (systemContent) {
            decisionMessages.push({ role: 'system', content: systemContent });
        }
    }

    const nonSystemMessages = requestMessages.filter(m => m && m.role !== 'system');
    const recentMessages = nonSystemMessages.slice(-WEB_SEARCH_DECISION_MAX_MESSAGES);

    for (const message of recentMessages) {
        const normalizedContent = normalizeWebSearchDecisionContent(message.content);
        if (!normalizedContent) {
            continue;
        }

        decisionMessages.push({
            role: message.role,
            content: normalizedContent
        });
    }

    return decisionMessages;
}

async function decideWebSearchQueryWithModel(requestMessages, signal) {
    if (!Array.isArray(requestMessages) || requestMessages.length === 0) {
        return { state: 'skip', query: '' };
    }

    const decisionMessages = buildWebSearchDecisionMessages(requestMessages);
    if (decisionMessages.length === 0) {
        return { state: 'fallback', query: '' };
    }

    const decisionBody = {
        model: getSelectedModel(),
        messages: decisionMessages,
        temperature: 0,
        stream: false,
        max_tokens: WEB_SEARCH_DECISION_MAX_TOKENS,
        tools: buildWebSearchToolDefinition(),
        tool_choice: 'auto'
    };

    try {
        const fetchResult = await postChatCompletionWithReasoningFallback(
            getApiUrl(),
            getChatCompletionHeaders(),
            decisionBody,
            signal
        );

        if (!fetchResult.response.ok) {
            const errorText = await parseApiErrorResponse(fetchResult.response);
            debugLog('Web-search tool decision unavailable, using fallback heuristics:', errorText);
            return { state: 'fallback', query: '' };
        }

        const decisionData = await fetchResult.response.json();
        const toolQuery = extractWebSearchQueryFromToolCalls(decisionData);

        if (toolQuery) {
            return { state: 'search', query: toolQuery };
        }

        // Some providers/models accept the request but ignore tool-calling and return
        // a normal assistant message with no tool calls. In that case, fall back to
        // heuristic decisioning instead of force-skipping web search.
        const finishReason = decisionData?.choices?.[0]?.finish_reason;
        if (finishReason !== 'tool_calls') {
            debugLog('Web-search decision returned no tool call, using fallback heuristics.');
            return { state: 'fallback', query: '' };
        }

        return { state: 'skip', query: '' };
    } catch (error) {
        debugLog('Web-search tool decision failed, using fallback heuristics:', error?.message || error);
        return { state: 'fallback', query: '' };
    }
}

async function resolveWebSearchQuery(userMessage, requestMessages, chatMessages, signal) {
    const normalizedPrompt = normalizeWebSearchPromptForPolicy(userMessage);
    if (!normalizedPrompt) {
        return { action: 'skip', reason: 'empty', query: '' };
    }

    if (isExplicitWebSearchSkipRequest(userMessage)) {
        return { action: 'skip', reason: 'explicit-skip', query: '' };
    }

    const retryQuery = buildRetryWebSearchQuery(userMessage, chatMessages);
    if (retryQuery) {
        return {
            action: 'search',
            query: retryQuery,
            reason: 'retry-fresh-search'
        };
    }

    const latestWebSearchEntry = getLatestWebSearchEntry(chatMessages);
    const explicitFreshSearch = isExplicitWebSearchRequest(userMessage) || isFreshnessSensitiveWebSearch(userMessage);
    const topicSwitch = isLikelyTopicSwitch(userMessage, chatMessages);

    if (latestWebSearchEntry?.payload?.context) {
        const sameTopicAsLatestSearch = areWebSearchTopicsRelated(normalizedPrompt, latestWebSearchEntry.text)
            || (shouldUseRecentContext(normalizedPrompt) && Boolean(latestWebSearchEntry.text));
        const shouldReuseLatestSearch = sameTopicAsLatestSearch
            && !explicitFreshSearch
            && !topicSwitch
            && (shouldUseRecentContext(normalizedPrompt) || countWords(normalizedPrompt) <= WEB_SEARCH_REUSE_MAX_WORDS);

        if (shouldReuseLatestSearch) {
            return {
                action: 'reuse',
                reason: 'reuse-stored-context',
                query: latestWebSearchEntry.payload.query,
                context: latestWebSearchEntry.payload.context,
                sources: cloneWebSearchSources(latestWebSearchEntry.payload.sources),
                providerName: latestWebSearchEntry.payload.providerName
            };
        }
    }

    // For clear topic switches, avoid over-relying on prior conversation context
    // and force a fresh, standalone web search query.
    if (topicSwitch && !isSkipWorthyWebSearchQuery(userMessage)) {
        const topicSwitchQuery = buildWebSearchQuery(userMessage, []);
        if (topicSwitchQuery) {
            return {
                action: 'search',
                query: topicSwitchQuery,
                reason: 'topic-switch-fresh-search'
            };
        }
    }

    const isFirstMsg = isFirstUserMessage(chatMessages);
    if (isFirstMsg || explicitFreshSearch || !isSkipWorthyWebSearchQuery(userMessage)) {
        const fallbackQuery = buildWebSearchQuery(userMessage, chatMessages);
        if (fallbackQuery) {
            return {
                action: 'search',
                query: fallbackQuery,
                reason: isFirstMsg
                    ? 'first-message-fresh-search'
                    : explicitFreshSearch
                        ? 'explicit-fresh-search'
                        : 'heuristic-fresh-search'
            };
        }
    }

    return {
        action: 'skip',
        query: '',
        reason: 'heuristic-skip'
    };
}

function isInternetAvailableForWebSearch() {
    if (window.AndroidNetwork && typeof window.AndroidNetwork.isInternetAvailable === 'function') {
        try {
            return !!window.AndroidNetwork.isInternetAvailable();
        } catch (error) {
            console.warn('Failed to read Android network availability for web search:', error);
        }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
        return navigator.onLine;
    }

    return true;
}

function prependWebSearchContextToContent(content, searchContext) {
    if (Array.isArray(content)) {
        return [{ type: 'text', text: `${searchContext}\n\n` }, ...cloneContentForRequest(content)];
    }

    if (typeof content === 'string') {
        return `${searchContext}\n\n${content}`;
    }

    if (content == null) {
        return searchContext;
    }

    return `${searchContext}\n\n${String(content)}`;
}

function injectWebSearchContextIntoMessages(requestMessages, searchContext) {
    if (!Array.isArray(requestMessages) || !searchContext) {
        return false;
    }

    let lastUserMessageIndex = -1;
    for (let index = requestMessages.length - 1; index >= 0; index -= 1) {
        if (requestMessages[index]?.role === 'user') {
            lastUserMessageIndex = index;
            break;
        }
    }

    if (lastUserMessageIndex === -1) {
        return false;
    }

    if (getUseOpenRouter()) {
        const lastUserMessage = requestMessages[lastUserMessageIndex];
        requestMessages[lastUserMessageIndex] = {
            ...lastUserMessage,
            content: prependWebSearchContextToContent(lastUserMessage.content, searchContext)
        };
    } else {
        requestMessages.splice(lastUserMessageIndex, 0, { role: 'system', content: searchContext });
    }

    return true;
}

function persistTurnWebSearchMetadata(historyMessages, userMessageIndex, searchPayload, mode = 'fresh') {
    if (!Array.isArray(historyMessages) || userMessageIndex < 0 || !searchPayload?.context) {
        return;
    }

    const targetMessage = historyMessages[userMessageIndex];
    if (!targetMessage || targetMessage.role !== 'user') {
        return;
    }

    targetMessage.webSearchResults = searchPayload.context;
    targetMessage.webSearchSources = cloneWebSearchSources(searchPayload.sources);
    targetMessage.webSearchQuery = typeof searchPayload.query === 'string' ? searchPayload.query : '';
    targetMessage.webSearchProviderName = typeof searchPayload.providerName === 'string' ? searchPayload.providerName : '';
    targetMessage.webSearchMode = mode === 'reuse' ? 'reuse' : 'fresh';
    targetMessage.hadWebSearch = true;
}

function addWebSearchIndicatorToLatestUserMessage() {
    const userMessages = messagesContainer.querySelectorAll('.user');
    if (userMessages.length > 0) {
        addWebSearchIndicator(userMessages[userMessages.length - 1]);
    }
}

async function prepareWebSearchForRequest({
    userMessage,
    requestMessages,
    chatMessages,
    historyMessages,
    historyUserMessageIndex,
    storedPayload = null,
    signal,
    logLabel = 'Web search'
}) {
    const currentTurnPayload = storedPayload?.context
        ? {
            ...storedPayload,
            sources: (() => {
                const clonedSources = cloneWebSearchSources(storedPayload.sources);
                return clonedSources.length > 0
                    ? clonedSources
                    : extractWebSearchSourcesFromContext(storedPayload.context);
            })()
        }
        : getStoredWebSearchPayload(historyMessages?.[historyUserMessageIndex]);

    if (currentTurnPayload?.context) {
        injectWebSearchContextIntoMessages(requestMessages, currentTurnPayload.context);
        persistTurnWebSearchMetadata(historyMessages, historyUserMessageIndex, currentTurnPayload, currentTurnPayload.mode);
        saveChatHistory();
        addWebSearchIndicatorToLatestUserMessage();
        return {
            usedWebSearch: true,
            blockedByQuota: false,
            reason: 'stored-current-turn-context',
            payload: currentTurnPayload,
            sources: cloneWebSearchSources(currentTurnPayload.sources)
        };
    }

    if (!getWebSearchEnabled() || !Array.isArray(requestMessages) || requestMessages.length === 0) {
        return {
            usedWebSearch: false,
            blockedByQuota: false,
            reason: 'disabled',
            payload: null,
            sources: []
        };
    }

    const webSearchDecision = await resolveWebSearchQuery(userMessage, requestMessages, chatMessages, signal);
    debugLog(`${logLabel}:`, webSearchDecision.reason, webSearchDecision.query ? `query=${webSearchDecision.query}` : 'no-query');

    if (webSearchDecision.action === 'reuse' && webSearchDecision.context) {
        const reusedPayload = {
            context: webSearchDecision.context,
            query: webSearchDecision.query,
            providerName: webSearchDecision.providerName,
            sources: cloneWebSearchSources(webSearchDecision.sources)
        };

        injectWebSearchContextIntoMessages(requestMessages, reusedPayload.context);
        persistTurnWebSearchMetadata(historyMessages, historyUserMessageIndex, reusedPayload, 'reuse');
        saveChatHistory();
        addWebSearchIndicatorToLatestUserMessage();

        return {
            usedWebSearch: true,
            blockedByQuota: false,
            reason: webSearchDecision.reason,
            payload: reusedPayload,
            sources: reusedPayload.sources
        };
    }

    if (webSearchDecision.action !== 'search' || !webSearchDecision.query) {
        return {
            usedWebSearch: false,
            blockedByQuota: false,
            reason: webSearchDecision.reason,
            payload: null,
            sources: []
        };
    }

    if (!isInternetAvailableForWebSearch()) {
        debugLog(`${logLabel}: offline-blocked`);
        return {
            usedWebSearch: false,
            blockedByQuota: false,
            reason: 'offline-blocked',
            payload: null,
            sources: []
        };
    }

    if (!canUseWebSearch()) {
        document.dispatchEvent(new CustomEvent('webSearchLimitReached'));
        return {
            usedWebSearch: false,
            blockedByQuota: true,
            reason: 'quota-blocked',
            payload: null,
            sources: []
        };
    }

    const searchResults = await performWebSearch(webSearchDecision.query);
    if (!searchResults?.context) {
        debugLog(`${logLabel}: fresh-search-no-results`, webSearchDecision.query);
        return {
            usedWebSearch: false,
            blockedByQuota: false,
            reason: 'fresh-search-no-results',
            payload: null,
            sources: []
        };
    }

    recordWebSearch();
    injectWebSearchContextIntoMessages(requestMessages, searchResults.context);
    persistTurnWebSearchMetadata(historyMessages, historyUserMessageIndex, searchResults, 'fresh');
    saveChatHistory();
    addWebSearchIndicatorToLatestUserMessage();

    return {
        usedWebSearch: true,
        blockedByQuota: false,
        reason: webSearchDecision.reason,
        payload: searchResults,
        sources: cloneWebSearchSources(searchResults.sources)
    };
}

const WEB_SEARCH_CONTEXT_HEADER = [
    "Internal factual context for the assistant:",
    "- Use this information to improve accuracy.",
    "- Do not mention web search, search results, or that external context was provided.",
    "- Respond directly to the user.",
    "Context:"
].join('\n');
const LEGACY_WEB_SEARCH_CONTEXT_HEADER = "Web Search Results (Use this to augment your knowledge to answer the user's latest query):\n";

function stripInjectedWebSearchContext(content) {
    if (typeof content !== 'string') {
        return content;
    }

    let headerLength = null;
    if (content.startsWith(WEB_SEARCH_CONTEXT_HEADER)) {
        headerLength = WEB_SEARCH_CONTEXT_HEADER.length;
    } else if (content.startsWith(LEGACY_WEB_SEARCH_CONTEXT_HEADER)) {
        headerLength = LEGACY_WEB_SEARCH_CONTEXT_HEADER.length;
    } else {
        return content;
    }

    const separatorIndex = content.indexOf('\n\n', headerLength);
    if (separatorIndex === -1) {
        return content;
    }

    return content.slice(separatorIndex + 2).replace(/^\n+/, '');
}

/**
 * Generates an AI response to a user message
 * @param {string} userMessage - The user's message
 * @param {Array} fileContents - Optional array of file contents
 */
export async function generateAIResponse(userMessage, fileContents = []) {
    const isUsingHostedProvider = getUseOpenRouter() || getUseOpenAICompatible();

    if (isUsingHostedProvider) {
        if (!canSendOpenRouterCompletion()) {
            document.dispatchEvent(new CustomEvent('openRouterLimitReached'));
            hideLoadingIndicator();
            const stopButton = document.getElementById('stop-button');
            if (stopButton && !stopButton.classList.contains('hidden')) {
                toggleSendStopButton();
            }
            return;
        }
        recordOpenRouterCompletion();
    } else {
        if (!canSendCompletion()) {
            document.dispatchEvent(new CustomEvent('completionLimitReached'));
            hideLoadingIndicator();
            const stopButton = document.getElementById('stop-button');
            if (stopButton && !stopButton.classList.contains('hidden')) {
                toggleSendStopButton();
            }
            return;
        }
        recordCompletion();
    }

    return await generateAIResponseWithRetry(userMessage, fileContents);
}

/**
 * Internal function that performs the actual AI response generation
 * @param {string} userMessage - The user's message
 * @param {Array} fileContents - Optional array of file contents
 */
async function generateAIResponseInternal(userMessage, fileContents = []) {
    showLoadingIndicator();
    hideSmartReplies();
    ensureFirstMessageInitialized();

    // Reset the flags
    isGenerating = true;

    if (window.keepScreenOn && typeof window.keepScreenOn === 'function') {
        window.keepScreenOn(true);
    }

    // Abort any ongoing smart replies generation to free up concurrent connection limits
    if (smartReplyAbortController) {
        debugLog('Aborting pending smart replies for new generation');
        smartReplyAbortController.abort();
        smartReplyAbortController = null;
    }

    // Create a new AbortController instance for this request
    abortController = new AbortController();
    const signal = abortController.signal;

    // Prepare variables for the AI message (will be created when first content arrives)
    let aiMessageElement = null;
    let contentContainer = null;

    let aiMessage = '';
    let hasCodeBlock = false; // Track if we detected a code block
    let currentTurnWebSearchSources = [];

    // Declare timeout variables outside try block to ensure they're accessible in finally block
    let streamingTimeoutId;
    let chunkTimeoutId;

    try {
        if (!(await isServerRunning())) {
            throw new Error('LM_STUDIO_SERVER_NOT_RUNNING');
        }

        // Get the latest available models
        const availableModels = getAvailableModels();

        if (availableModels.length === 0) {
            // Try to fetch models if none are available
            await fetchAvailableModels();

            // Get the updated list of models
            const updatedModels = getAvailableModels();

            if (updatedModels.length === 0) {
                throw new Error('No models available');
            }
        }

        // Get the selected model
        const selectedModel = getSelectedModel();

        // Create the messages array
        const messages = [];

        // Note: Smart reply instructions are NOT added to the system prompt.
        // Embedding smart reply XML tags in the system prompt causes reasoning models
        // to stop mid-think on the first prompt. Smart replies are generated via a
        // separate lightweight API call after the main response completes instead.

        // Get the current chat history messages
        const chatMessages = chatHistoryData[currentChatId]
            ? (Array.isArray(chatHistoryData[currentChatId])
                ? chatHistoryData[currentChatId]
                : chatHistoryData[currentChatId].messages)
            : [];

        if (fileContents && fileContents.length > 0) {
            syncLatestUserMessageFiles(fileContents);
            saveChatHistory();
        }

        const shouldInlineChatTitle = shouldRequestInlineChatTitle(chatMessages);

        // Add the system prompt only if one is explicitly set by the user or we need
        // to inject the hidden title instruction for the first assistant response.
        appendRequestSystemPrompts(messages, getSystemPrompt(), shouldInlineChatTitle);
        // Note: No default system prompt is added to allow reasoning models to behave naturally

        // Add chat history from previous messages (without historical search context)
        // Only inject current-turn search results, not old ones, to avoid context confusion
        for (const msg of chatMessages) {
            messages.push(cloneMessageForRequest(msg));
        }

        if (getWebSearchEnabled() && messages.length > 0) {
            const historyMessages = chatHistoryData[currentChatId] && chatHistoryData[currentChatId].messages
                ? chatHistoryData[currentChatId].messages
                : [];
            const preparedWebSearch = await prepareWebSearchForRequest({
                userMessage,
                requestMessages: messages,
                chatMessages,
                historyMessages,
                historyUserMessageIndex: historyMessages.length - 1,
                signal,
                logLabel: 'Web search decision'
            });

            if (preparedWebSearch.blockedByQuota) {
                hideLoadingIndicator();
                const stopButton = document.getElementById('stop-button');
                if (stopButton && !stopButton.classList.contains('hidden')) {
                    toggleSendStopButton();
                }
                return;
            }

            currentTurnWebSearchSources = cloneWebSearchSources(preparedWebSearch.sources);
        }

        // If files are attached, enhance the last user message in the messages array
        // (which was already added to chat history and included above)
        if (fileContents && fileContents.length > 0 && messages.length > 0) {
            const lastMessageIndex = messages.length - 1;
            const lastMessage = messages[lastMessageIndex];

            // Only enhance if the last message is from the user
            if (lastMessage.role === 'user') {
                const fileCount = fileContents.length;
                const fileNames = fileContents.map(f => f.name).join(', ');
                const fileTypes = fileContents.map(f => {
                    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) return 'PDF';
                    if (f.type.includes('word') || f.name.toLowerCase().includes('doc')) return 'Word document';
                    if (f.type.includes('text')) return 'text file';
                    return 'document';
                });
                const uniqueFileTypes = [...new Set(fileTypes)].join(' and ');

                // Add clear context about attached files to the user message
                lastMessage.content = `[USER HAS ATTACHED ${fileCount} FILE(S): ${fileNames} - These are ${uniqueFileTypes}(s) that need to be analyzed]\n\n${lastMessage.content}`;
            }
        }

        // Add file contents as attachments or embedded in the message
        if (fileContents && fileContents.length > 0) {
            console.log('Processing file contents for AI request, count:', fileContents.length);
            // Check if this is a vision model that can handle images
            let isVisionModel = false;
            try {
                const { isVisionModel: checkVisionModel } = await import('./file-upload.js');
                isVisionModel = await checkVisionModel();
                console.log('Vision model check result:', isVisionModel);
            } catch (error) {
                console.error('Error checking vision model capability:', error);
            }

            // If the server supports file uploads, add them as attachments
            // Otherwise, we'll embed the file contents in the message
            if (supportsFileUploads()) {
                // Add files as attachments in the last user message
                const lastUserMessageIndex = messages.length - 1;
                messages[lastUserMessageIndex].file_ids = fileContents.map(file => file.id);
            } else if (isVisionModel) {
                // For vision models, use the proper content format with images
                const lastUserMessageIndex = messages.length - 1;
                const imageFiles = fileContents.filter(file => file.isImage);
                const nonImageFiles = fileContents.filter(file => !file.isImage);

                // Create content array starting with the text
                const content = [
                    {
                        type: "text",
                        text: messages[lastUserMessageIndex].content
                    }
                ];

                // Add images to the content array
                for (const imageFile of imageFiles) {
                    if (imageFile.content && imageFile.content.startsWith('data:')) {
                        // Handle WebP images by converting them to PNG if needed
                        let imageUrl = imageFile.content;

                        // Check if this is a WebP image
                        if (imageFile.content.startsWith('data:image/webp')) {
                            try {
                                // Import the conversion function
                                const { convertWebPToPNG } = await import('./file-upload.js');
                                // Convert WebP to PNG for better compatibility
                                imageUrl = await convertWebPToPNG(imageFile.content);
                                console.log(`Converted WebP image ${imageFile.name} to PNG for API compatibility`);
                            } catch (conversionError) {
                                console.warn(`Failed to convert WebP image ${imageFile.name}, using original:`, conversionError);
                                // Fall back to original WebP if conversion fails
                                imageUrl = imageFile.content;
                            }
                        }

                        // Validate and clean the base64 data URL
                        try {
                            const { validateBase64DataURL } = await import('./file-upload.js');
                            imageUrl = validateBase64DataURL(imageUrl);
                        } catch (validationError) {
                            console.warn(`Failed to validate base64 data URL for ${imageFile.name}:`, validationError);
                        }

                        // Final validation before adding to request
                        if (!imageUrl || !imageUrl.startsWith('data:')) {
                            console.error(`Invalid image URL for ${imageFile.name}:`, imageUrl?.substring(0, 100));
                            continue; // Skip this image
                        }

                        content.push({
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        });
                        console.log(`Added image to vision model request: ${imageFile.name} (${imageUrl.startsWith('data:image/png') ? 'PNG' : imageUrl.startsWith('data:image/webp') ? 'WebP' : 'other'} format, ${imageUrl.length} chars)`);
                    }
                }

                // Add non-image files as text if any
                if (nonImageFiles.length > 0) {
                    try {
                        const { prepareFilesForLLM } = await import('./file-upload.js');
                        const formattedFileContent = await prepareFilesForLLM(nonImageFiles);

                        if (formattedFileContent.trim()) {
                            content[0].text += `\n\n${formattedFileContent}`;
                        }
                    } catch (importError) {
                        console.warn('Could not import prepareFilesForLLM for non-image files:', importError);
                    }
                }

                // Replace the content with the new format
                messages[lastUserMessageIndex].content = content;

                console.log(`Vision model message prepared with ${imageFiles.length} image(s) and ${nonImageFiles.length} text file(s)`);
            } else {
                // For non-vision models, embed all file contents as text
                const lastUserMessageIndex = messages.length - 1;

                // Import the prepareFilesForLLM function to format files properly
                try {
                    const { prepareFilesForLLM } = await import('./file-upload.js');
                    const formattedFileContent = await prepareFilesForLLM(fileContents);

                    // Log the formatted content length for debugging
                    console.log(`Formatted file content length: ${formattedFileContent.length} characters`);

                    // Append the properly formatted file contents to the user message
                    messages[lastUserMessageIndex].content += `\n\n${formattedFileContent}`;
                } catch (importError) {
                    console.warn('Could not import prepareFilesForLLM, using fallback formatting:', importError);

                    // Fallback to simple formatting with length limits
                    let fileContent = '';

                    for (const file of fileContents) {
                        // Conservative length limit for safety
                        const maxLength = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 25000 : 40000;

                        let content = file.content;
                        if (content.length > maxLength) {
                            content = content.substring(0, maxLength) + `\n\n[Content truncated. Original length: ${file.content.length} characters]`;
                        }

                        fileContent += `\n\nFile: ${file.name}\n\`\`\`\n${content}\n\`\`\`\n`;
                    }

                    console.log(`Fallback formatted file content length: ${fileContent.length} characters`);
                    messages[lastUserMessageIndex].content += fileContent;
                }
            }
        }

        if (shouldUseLmStudioNativeMcpChat()) {
            const requestBody = buildLmStudioMcpRequest(messages, shouldInlineChatTitle);
            const nativeTimeoutMs = getReasoningTimeout() * 1000;
            const timeoutPromise = new Promise((_, reject) => {
                streamingTimeoutId = setTimeout(() => {
                    if (abortController) {
                        abortController.abort();
                    }
                    reject(new Error('LM Studio MCP request timed out. Please try again.'));
                }, nativeTimeoutMs);
            });

            debugLog('Sending LM Studio native MCP request:', requestBody);

            const nativeResult = await Promise.race([
                sendLmStudioMcpRequest(requestBody, signal),
                timeoutPromise
            ]);

            if (streamingTimeoutId) {
                clearTimeout(streamingTimeoutId);
            }

            aiMessage = nativeResult.aiMessage || 'LM Studio completed the MCP request but returned no visible text.';

            if (!aiMessageElement) {
                hideLoadingIndicator();
                aiMessageElement = appendMessage('ai', '');
                contentContainer = aiMessageElement.querySelector('.message-content');

                if (!contentContainer) {
                    debugError('Could not find message content container for LM Studio MCP response');
                    isGenerating = false;
                    return;
                }
            }

            const responsePayload = prepareAssistantResponseForStorage(aiMessage, userMessage, shouldInlineChatTitle);
            aiMessage = appendWebSearchSourcesSection(responsePayload.cleanMessage, currentTurnWebSearchSources);
            if (responsePayload.title && chatHistoryData[currentChatId]) {
                chatHistoryData[currentChatId].title = responsePayload.title;
            }

            const hideThinking = getHideThinking();
            const finalReasoningState = getReasoningStreamState(aiMessage);

            if (finalReasoningState.hasThinking) {
                if (hideThinking) {
                    contentContainer.innerHTML = basicSanitizeInput(stripReasoningSections(aiMessage));
                } else {
                    contentContainer.innerHTML = sanitizeInput(aiMessage);
                }
            } else {
                contentContainer.innerHTML = basicSanitizeInput(aiMessage);
            }

            if (aiMessageElement && containsCodeBlocksOutsideThinkTags(aiMessage)) {
                setTimeout(() => {
                    initializeCodeMirror(aiMessageElement);
                }, 100);
            }

            if (containsCodeBlocksOutsideThinkTags(aiMessage)) {
                await fastUpdateChatHistoryBeforeReload(userMessage, aiMessage, fileContents, {
                    lmStudioResponseId: nativeResult.responseId,
                    webSearchSources: currentTurnWebSearchSources
                });
            } else {
                await updateChatHistory(userMessage, aiMessage, fileContents, {
                    lmStudioResponseId: nativeResult.responseId,
                    webSearchSources: currentTurnWebSearchSources
                });
            }

            if (getAutoSmartReply()) {
                showSmartRepliesLoading();
                generateSmartReplies(userMessage, aiMessage).catch(err => {
                    debugLog('Smart reply generation failed (non-critical):', err);
                });
            } else {
                hideSmartReplies();
            }

            if (isFirstMessage) {
                debugLog('First LM Studio MCP message processed successfully, updating isFirstMessage flag');
                setIsFirstMessage(false);
            }

            if (getAutoScrollEnabled()) {
                scrollToBottom(messagesContainer, true);
            }
            return;
        }

        // Create request body
        const requestBody = {
            model: getSelectedModel(),
            messages: messages,
            temperature: getTemperature(),
            stream: true,
        };

        // Add max_tokens only if it's set to a valid value
        const maxTokens = getConfiguredMaxTokens();
        if (maxTokens > 0) {
            requestBody.max_tokens = maxTokens;
        }

        applyReasoningOptions(requestBody);

        console.log('Preparing to send API request...');
        console.log('Request body messages count:', requestBody.messages.length);
        console.log('Last message structure:', JSON.stringify(requestBody.messages[requestBody.messages.length - 1], null, 2).substring(0, 500));
        debugLog('Sending API request with body:', requestBody);

        // Create decoder for handling streamed UTF-8 data
        const decoder = new TextDecoder('utf-8');
        let incompleteChunk = new Uint8Array();
        const sseLineBuffer = { value: '' };

        // Determine the API URL based on server type
        const apiUrl = getApiUrl();

        // Monaco Editor removed - no need to track initialization
        // to avoid unnecessary repeated initializations during streaming
        let hasInitializedCodeBlocks = false;

        const renderStreamingHtml = (html) => {
            if (!contentContainer) return;

            // Streaming rewrites can briefly collapse/re-expand code blocks,
            // which causes visible vertical jumping in the chat viewport.
            const shouldStabilizeHeight = hasCodeBlock;
            const previousHeight = shouldStabilizeHeight
                ? contentContainer.getBoundingClientRect().height
                : 0;

            contentContainer.innerHTML = html;

            if (!shouldStabilizeHeight) {
                if (contentContainer.style.minHeight) {
                    contentContainer.style.minHeight = '';
                }
                return;
            }

            const nextHeight = contentContainer.getBoundingClientRect().height;
            if (previousHeight > 0 && nextHeight + 1 < previousHeight) {
                contentContainer.style.minHeight = `${Math.ceil(previousHeight)}px`;
                requestAnimationFrame(() => {
                    if (contentContainer) {
                        contentContainer.style.minHeight = '';
                    }
                });
            } else if (contentContainer.style.minHeight) {
                contentContainer.style.minHeight = '';
            }
        };

        // Create a timeout for the streaming response (configurable for reasoning models)
        const streamingTimeoutMs = getReasoningTimeout() * 1000; // Convert seconds to milliseconds

        // Create a promise that rejects after the timeout
        const timeoutPromise = new Promise((_, reject) => {
            streamingTimeoutId = setTimeout(() => {
                if (abortController) {
                    abortController.abort();
                }
                reject(new Error('Streaming response timed out. This may happen with reasoning models during long thinking processes. Please try again.'));
            }, streamingTimeoutMs);
        });

        // Send the request to the API with timeout protection
        console.log('Sending fetch request to:', apiUrl);
        const requestHeaders = getChatCompletionHeaders();
        const fetchPromise = postChatCompletionWithReasoningFallback(apiUrl, requestHeaders, requestBody, signal);

        // Race between fetch and timeout
        console.log('Waiting for API response...');
        const fetchResult = await Promise.race([fetchPromise, timeoutPromise]);
        const response = fetchResult.response;
        console.log('Received response, status:', response.status, response.statusText);

        if (!response.ok) {
            console.error('API request failed with status:', response.status, response.statusText);
            await throwForApiErrorResponse(response);
        }

        const reader = response.body.getReader();

        // Clear the initial timeout since we got a response
        if (streamingTimeoutId) {
            clearTimeout(streamingTimeoutId);
        }

        // Track streaming progress for reasoning models
        let lastChunkTime = Date.now();
        let isInThinkingProcess = false;
        let thinkingStartTime = null;
        let lastThinkingUiUpdateTime = 0;
        let isHandlingOpenRouterReasoning = false;

        // Streaming progress tracking for reasoning models

        // Create a new timeout for the streaming process (reset on each chunk)
        const resetChunkTimeout = () => {
            if (chunkTimeoutId) {
                clearTimeout(chunkTimeoutId);
            }
            // 2 minutes timeout between chunks (reasoning models may pause during thinking)
            chunkTimeoutId = setTimeout(() => {
                debugLog('No data received for 2 minutes, aborting stream');
                if (abortController) {
                    abortController.abort();
                }
            }, 120000); // 2 minutes
        };

        resetChunkTimeout();

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                // Ensure we close any OpenRouter reasoning tags
                if (isHandlingOpenRouterReasoning) {
                    aiMessage += '\n</think>\n';
                    isHandlingOpenRouterReasoning = false;
                }

                // Clear chunk timeout when stream is complete
                if (chunkTimeoutId) {
                    clearTimeout(chunkTimeoutId);
                }

                // Immediately terminate the connection when done is true
                if (abortController) {
                    debugLog('Terminating connection as stream is complete');
                    try {
                        // Store reference and clear global reference immediately
                        const controller = abortController;
                        abortController = null;

                        // Abort the controller to ensure connection is closed
                        controller.abort();

                        // Force UI state reset immediately
                        hideLoadingIndicator();
                        const stopButton = document.getElementById('stop-button');
                        if (stopButton && !stopButton.classList.contains('hidden')) {
                            toggleSendStopButton();
                        }
                    } catch (abortError) {
                        debugLog('Error when closing connection:', abortError);
                    }
                }

                break;
            }

            // Reset timeout since we received data
            lastChunkTime = Date.now();
            resetChunkTimeout();

            // If we have an incomplete chunk from a previous iteration, combine it with the new value
            let processedChunk;
            if (incompleteChunk.length > 0) {
                // Combine the incomplete chunk with the new chunk
                processedChunk = new Uint8Array(incompleteChunk.length + value.length);
                processedChunk.set(incompleteChunk);
                processedChunk.set(value, incompleteChunk.length);
                // Reset the incomplete chunk
                incompleteChunk = new Uint8Array();
            } else {
                processedChunk = value;
            }

            // Try to decode the chunk as UTF-8
            let chunkText;
            try {
                // Decode the chunk, keeping incomplete sequences in the buffer
                chunkText = decoder.decode(processedChunk, { stream: true });
            } catch (e) {
                // If decoding fails, store the chunk for the next iteration
                incompleteChunk = processedChunk;
                debugLog('UTF-8 decoding error, storing chunk for next iteration:', e);
                continue;
            }

            // Buffer SSE lines across network chunks before JSON parsing. Providers
            // can split a single `data: {...}` line anywhere, including inside code.
            {
                const events = parseOpenAiCompatibleSseLines(readCompleteSseLines(sseLineBuffer, chunkText));

                for (const data of events) {

                            // Check if this is a valid chunk with content
                            if (data.choices && data.choices[0] && data.choices[0].delta) {
                                const delta = data.choices[0].delta;

                                let chunkContent = '';
                                const reasoningDeltaText = extractReasoningDeltaText(delta);
                                if (reasoningDeltaText) {
                                    if (!isHandlingOpenRouterReasoning) {
                                        chunkContent += '<think>\n';
                                        isHandlingOpenRouterReasoning = true;
                                    }
                                    chunkContent += reasoningDeltaText;
                                }

                                const contentDeltaText = extractContentDeltaText(delta);
                                if (contentDeltaText) {
                                    if (isHandlingOpenRouterReasoning) {
                                        chunkContent += '\n</think>\n';
                                        isHandlingOpenRouterReasoning = false;
                                    }
                                    chunkContent += contentDeltaText;
                                }

                                // Add content if it exists in this chunk
                                if (chunkContent) {
                                    // Create the AI message bubble on first content arrival
                                    if (!aiMessageElement) {
                                        // Hide loading indicator before showing the message
                                        hideLoadingIndicator();

                                        aiMessageElement = appendMessage('ai', '');
                                        contentContainer = aiMessageElement.querySelector('.message-content');

                                        // If we couldn't find a container, log error and stop
                                        if (!contentContainer) {
                                            debugError('Could not find message content container for AI message');
                                            isGenerating = false;
                                            return;
                                        }
                                    }

                                    aiMessage += chunkContent;
                                    aiMessage = normalizeMalformedCodeFences(normalizeToolCallTags(aiMessage));

                                    const reasoningState = getReasoningStreamState(aiMessage);
                                    const hasThinkTags = reasoningState.hasThinking;
                                    const currentlyInThinking = reasoningState.inThinkingSection;

                                    // Detect start of thinking process
                                    if (!isInThinkingProcess && currentlyInThinking) {
                                        isInThinkingProcess = true;
                                        thinkingStartTime = Date.now();
                                        debugLog('Reasoning model started thinking process');
                                    }

                                    // Detect end of thinking process
                                    if (isInThinkingProcess && !currentlyInThinking && aiMessage.includes('</think>')) {
                                        isInThinkingProcess = false;
                                        const thinkingDuration = Date.now() - thinkingStartTime;
                                        debugLog(`Reasoning model completed thinking process in ${thinkingDuration}ms`);
                                    }

                                    // Check if this is a code block outside of think tags
                                    if (!hasCodeBlock &&
                                        (chunkContent.includes('```') ||
                                            aiMessage.includes('```'))) {

                                        // Only trigger reload for code blocks outside think tags
                                        if (containsCodeBlocksOutsideThinkTags(aiMessage)) {
                                            hasCodeBlock = true;

                                            // Special handling for first message - detect code blocks early
                                            if (isFirstMessage) {
                                                // Check if we have a complete code block already (outside think tags)
                                                const contentWithoutThinkTags = aiMessage.replace(/<think>[\s\S]*?<\/think>/g, '');
                                                const codeBlockStart = contentWithoutThinkTags.indexOf('```');
                                                const codeBlockEnd = contentWithoutThinkTags.indexOf('```', codeBlockStart + 3);

                                                // If we have a complete code block in first message (outside think tags),
                                                // prepare for faster reload by setting up flag
                                                if (codeBlockStart !== -1 && codeBlockEnd !== -1) {
                                                    debugLog('Complete code block detected outside think tags in first message, preparing for fast reload');
                                                    hasInitializedCodeBlocks = true; // Mark as detected for reload

                                                    // Code block detected - no longer triggering reload
                                                }
                                            }
                                        }
                                    }

                                    // Apply the appropriate sanitization based on hide-thinking setting
                                    const hideThinking = getHideThinking();
                                    // hasThinkTags already declared above, reuse it

                                    // Check if we're in a thinking section (between <think> and </think>)
                                    // No smart_replies stripping needed during streaming since we no longer embed them.
                                    const visibleStreamingMessage = removeInlineChatTitleMarkup(reasoningState.normalizedText).trim();
                                    const inThinkingSection = reasoningState.inThinkingSection;
                                    const contentAfterThink = reasoningState.contentAfterThink;

                                    // Apply the appropriate sanitization based on message type and hide thinking setting (only if container exists)
                                    if (hasThinkTags && contentContainer) {
                                        if (hideThinking) {
                                            // When hide thinking is enabled, always hide thinking tags and content
                                            if (contentAfterThink !== "") {
                                                // We have content after </think>, show ONLY that content (streaming)
                                                const processedContent = stripReasoningSections(visibleStreamingMessage);
                                                renderStreamingHtml(basicSanitizeInput(processedContent));

                                                // Remove any thinking indicator that might exist
                                                const thinkingIndicator = contentContainer.querySelector('.thinking-indicator');
                                                if (thinkingIndicator) {
                                                    thinkingIndicator.remove();
                                                }
                                            } else if (inThinkingSection) {
                                                // We're in thinking section and hide thinking is enabled, show indicator
                                                let thinkingIndicator = contentContainer.querySelector('.thinking-indicator');

                                                // Create thinking indicator if it doesn't exist
                                                if (!thinkingIndicator) {
                                                    thinkingIndicator = document.createElement('div');
                                                    thinkingIndicator.className = 'thinking-indicator';

                                                    // Enhanced thinking indicator with progress
                                                    const thinkingDuration = thinkingStartTime ? Date.now() - thinkingStartTime : 0;
                                                    const durationText = thinkingDuration > 1000 ? ` (${Math.round(thinkingDuration / 1000)}s)` : '';

                                                    thinkingIndicator.innerHTML = `<i class="fas fa-brain"></i>${durationText}`;
                                                    thinkingIndicator.setAttribute('data-thinking-content', '');

                                                    // Clear the container and add the indicator
                                                    contentContainer.innerHTML = '';
                                                    contentContainer.appendChild(thinkingIndicator);
                                                } else {
                                                    // Update existing indicator with duration (throttled to avoid too frequent updates)
                                                    const now = Date.now();
                                                    if (!lastThinkingUiUpdateTime || now - lastThinkingUiUpdateTime > 100) {
                                                        lastThinkingUiUpdateTime = now;
                                                        const thinkingDuration = thinkingStartTime ? Date.now() - thinkingStartTime : 0;
                                                        const durationText = thinkingDuration > 1000 ? ` (${Math.round(thinkingDuration / 1000)}s)` : '';
                                                        thinkingIndicator.innerHTML = `<i class="fas fa-brain"></i>${durationText}`;
                                                    }
                                                }

                                                // Update the data attribute with current thinking content
                                                if (reasoningState.activeThinkingContent) {
                                                    thinkingIndicator.setAttribute('data-thinking-content', reasoningState.activeThinkingContent);
                                                }
                                            } else {
                                                // Hide thinking is enabled but we're not in thinking section and no content after think
                                                // This means thinking tags are complete but no content after them yet
                                                const processedContent = stripReasoningSections(visibleStreamingMessage);
                                                renderStreamingHtml(basicSanitizeInput(processedContent));
                                            }
                                        } else {
                                            // Hide thinking is disabled, show everything including thinking tags (streaming)
                                            renderStreamingHtml(sanitizeInput(visibleStreamingMessage));
                                        }

                                        // Mark this message as having thinking
                                        aiMessageElement.dataset.hasThinking = 'true';
                                    } else if (contentContainer) {
                                        // For non-reasoning models, apply basic sanitization
                                        renderStreamingHtml(basicSanitizeInput(visibleStreamingMessage));
                                        // Mark this message as a non-reasoning model response
                                        aiMessageElement.dataset.hasThinking = 'false';
                                    }

                                    // Initialize code blocks once we detect a completed code block
                                    // and only if we haven't already initialized them
                                    if (hasCodeBlock && aiMessage.includes('```') && aiMessage.lastIndexOf('```') > aiMessage.indexOf('```') + 3 && !hasInitializedCodeBlocks) {
                                        // Just mark that we've detected code blocks but don't initialize yet
                                        // Monaco Editor removed - code initialization no longer needed
                                        hasInitializedCodeBlocks = true;
                                    }

                                    // Scroll to bottom during streaming if auto-scroll is enabled
                                    if (getAutoScrollEnabled()) {
                                        scrollToBottom(messagesContainer, false);
                                    }
                                }
                            }
                }
            }
        }

        parseOpenAiCompatibleSseLines(readCompleteSseLines(sseLineBuffer, '', true)).forEach(data => {
            const delta = data.choices && data.choices[0] && data.choices[0].delta;
            if (!delta) return;

            let chunkContent = '';
            const reasoningDeltaText = extractReasoningDeltaText(delta);
            if (reasoningDeltaText) {
                if (!isHandlingOpenRouterReasoning) {
                    chunkContent += '<think>\n';
                    isHandlingOpenRouterReasoning = true;
                }
                chunkContent += reasoningDeltaText;
            }

            const contentDeltaText = extractContentDeltaText(delta);
            if (contentDeltaText) {
                if (isHandlingOpenRouterReasoning) {
                    chunkContent += '\n</think>\n';
                    isHandlingOpenRouterReasoning = false;
                }
                chunkContent += contentDeltaText;
            }

            if (chunkContent) {
                aiMessage += chunkContent;
                aiMessage = normalizeMalformedCodeFences(normalizeToolCallTags(aiMessage));
            }
        });

        // Final decoding to ensure all UTF-8 sequences are properly handled
        try {
            // Flush the decoder to handle any remaining bytes
            if (incompleteChunk.length > 0) {
                const finalChunk = decoder.decode(incompleteChunk);
                aiMessage += finalChunk;
                aiMessage = normalizeMalformedCodeFences(normalizeToolCallTags(aiMessage));
            }
        } catch (e) {
            debugLog('Final UTF-8 decoding error:', e);
        }

        // Immediately terminate the connection to ensure proper cleanup
        if (abortController) {
            debugLog('Terminating connection after streaming completion');
            try {
                abortController.abort();
                abortController = null;
            } catch (abortError) {
                debugLog('Error when closing connection:', abortError);
            }
        }

        // Smart replies are now generated via a separate post-response call (see generateSmartReplies below).
        // No extraction from the main aiMessage is needed.

        // Apply final content processing based on thinking tags/settings and strip the
        // hidden inline title marker before rendering or saving the response.
        const responsePayload = prepareAssistantResponseForStorage(aiMessage, userMessage, shouldInlineChatTitle);
        aiMessage = appendWebSearchSourcesSection(responsePayload.cleanMessage, currentTurnWebSearchSources);
        if (responsePayload.title && chatHistoryData[currentChatId]) {
            chatHistoryData[currentChatId].title = responsePayload.title;
        }

        const hideThinking = getHideThinking();
        const finalReasoningState = getReasoningStreamState(aiMessage);
        const hasThinkTags = finalReasoningState.hasThinking;

        if (hasThinkTags) {
            if (contentContainer) {
                if (hideThinking) {
                    // Hide thinking tags when hide thinking is enabled
                    const processedContent = stripReasoningSections(aiMessage);
                    contentContainer.innerHTML = basicSanitizeInput(processedContent);
                } else {
                    // Show everything including thinking tags when hide thinking is disabled
                    contentContainer.innerHTML = sanitizeInput(aiMessage);
                }
            }
        } else if (contentContainer) {
            // No thinking tags, show content normally
            contentContainer.innerHTML = basicSanitizeInput(aiMessage);
        }

        // Match the regeneration path so newly generated code blocks are
        // highlighted immediately instead of waiting for a reload/refresh.
        if (aiMessageElement && containsCodeBlocksOutsideThinkTags(aiMessage)) {
            setTimeout(() => {
                initializeCodeMirror(aiMessageElement);
            }, 100);
        }

        // Update chat history first but don't wait for UI updates if we're going to reload
        // This makes the reload happen faster
        if (containsCodeBlocksOutsideThinkTags(aiMessage)) {
            // Fast path for code blocks outside think tags - minimal chat update without UI refresh
            await fastUpdateChatHistoryBeforeReload(userMessage, aiMessage, fileContents, {
                webSearchSources: currentTurnWebSearchSources
            });
        } else {
            // Normal path for non-code blocks or code blocks only in think tags - full history update with UI refresh
            await updateChatHistory(userMessage, aiMessage, fileContents, {
                webSearchSources: currentTurnWebSearchSources
            });
        }

        // Review trigger removed

        // Generate smart replies via a separate lightweight call if enabled
        if (getAutoSmartReply()) {
            showSmartRepliesLoading();                               // show placeholder immediately
            generateSmartReplies(userMessage, aiMessage).catch(err => {
                debugLog('Smart reply generation failed (non-critical):', err);
            });
        } else {
            hideSmartReplies();
        }

        // Set isFirstMessage to false after first successful message
        if (isFirstMessage) {
            debugLog('First message processed successfully, updating isFirstMessage flag');
            setIsFirstMessage(false);
        }

        // Handle code blocks if present (only those outside think tags)
        if (containsCodeBlocksOutsideThinkTags(aiMessage)) {
            // Check if Monaco is already having issues before deciding to reload
            const hasMonacoIssues = window.monacoHasErrors ||
                (window.monacoLoaded === false &&
                    Date.now() - (window.monacoLoadStartTime || 0) > 5000);

            if (hasMonacoIssues) {
                // Don't reload if Monaco is having issues - just render with fallback
                debugLog('Monaco appears to have loading issues - skipping reload and using fallback');

                // Don't do a second updateChatHistory - redundant with the one above
                // Initialize with fallback code display
                if (!hasInitializedCodeBlocks) {
                    queueMicrotask(() => {
                        refreshAllCodeBlocks();
                    });
                }
                if (getAutoScrollEnabled()) {
                    scrollToBottom(messagesContainer, true);
                }
                return;
            }

            // Code blocks detected - no longer triggering reload, just continue normally
            if (getAutoScrollEnabled()) {
                scrollToBottom(messagesContainer, true);
            }
        } else {
            if (getAutoScrollEnabled()) {
                scrollToBottom(messagesContainer, true);
            }
        }
    } catch (error) {
        // Clean up timeouts on error
        if (streamingTimeoutId) {
            clearTimeout(streamingTimeoutId);
        }
        if (chunkTimeoutId) {
            clearTimeout(chunkTimeoutId);
        }

        if (error.name === 'AbortError') {
            debugLog('Fetch aborted');
            // Ensure UI is reset even when the stream is aborted
            hideLoadingIndicator();
            const stopButton = document.getElementById('stop-button');
            if (stopButton && !stopButton.classList.contains('hidden')) {
                toggleSendStopButton();
            }
        } else {
            debugError('Error:', error);

            // Special handling for specific error messages
            if (error.message === 'OPENROUTER_RATE_LIMITED') {
                appendMessage('error',
                    '<div class="error-message-content">' +
                    '<div class="error-title">Rate limit reached</div>' +
                    '<div class="error-body">' +
                    'OpenRouter has rate-limited this request (429 Too Many Requests).<br>' +
                    'This usually means you\'ve exceeded the free-tier limit for this model. You can:<br>' +
                    '• Wait a moment, then tap <strong>Try again</strong> below<br>' +
                    '• Switch to a different model in the <strong>Models</strong> menu<br>' +
                    '• Add credits to your OpenRouter account at openrouter.ai/credits' +
                    '</div>' +
                    '<div class="error-help-link">' +
                    '<a href="#" onclick="event.preventDefault(); window.regenerateLastResponse && window.regenerateLastResponse();">Try again</a>' +
                    '</div>' +
                    '</div>'
                );
            } else if (error.message === 'LM_STUDIO_SERVER_NOT_RUNNING') {
                appendMessage('error',
                    '<div class="error-message-content">' +
                    '<div class="error-title">Unable to connect to LM Studio</div>' +
                    '<div class="error-body">' +
                    'Please check that:<br>' +
                    '• LM Studio application is running<br>' +
                    '• The server is started (green toggle switch in LM Studio)<br>' +
                    '• Correct IP address and port are configured in <a href="#" onclick="event.preventDefault(); window.showSettingsModal && window.showSettingsModal();">Settings</a>' +
                    '</div>' +
                    '<div class="error-help-link">' +
                    '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for detailed setup instructions' +
                    '</div>' +
                    '</div>'
                );
            } else if (error.message === 'No models available') {
                // Don't show any error message during initial startup
                if (!window.isInitialStartup) {
                    appendMessage('error',
                        '<div class="error-message-content">' +
                        '<div class="error-title">No models loaded</div>' +
                        '<div class="error-body">' +
                        'Click the <strong>Models</strong> button in the sidebar to load a model. ' +
                        'You need to load at least one model in LM Studio before sending messages.' +
                        '</div>' +
                        '<div class="error-help-link">' +
                        '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for more information' +
                        '</div>' +
                        '</div>'
                    );
                } else {
                    debugLog('Suppressing "No models available" error during initial startup');
                }
            } else {
                appendMessage('error', `An error occurred: ${error.message}`);
            }

            // Show send button again in case of error
            hideLoadingIndicator();
            toggleSendStopButton();
        }
    } finally {
        debugLog('Finalizing text generation...');

        if (window.keepScreenOn && typeof window.keepScreenOn === 'function') {
            window.keepScreenOn(false);
        }

        // Clean up all timeouts
        if (streamingTimeoutId) {
            clearTimeout(streamingTimeoutId);
        }
        if (chunkTimeoutId) {
            clearTimeout(chunkTimeoutId);
        }

        // Reset the generation status flag
        isGenerating = false;

        // Ensure proper cleanup regardless of how we got here (success, error, or abort)
        // Save reference to controller before clearing it
        const controller = abortController;

        // Immediately clear the global reference first to prevent race conditions
        abortController = null;

        // Then try to abort the controller if it exists
        if (controller) {
            try {
                debugLog('Final connection cleanup in finally block');
                controller.abort();

                // Second abort attempt for additional safety
                setTimeout(() => {
                    try {
                        controller.abort();
                        debugLog('Second abort completed successfully');
                    } catch (e) {
                        // Ignore errors on second abort
                    }
                }, 50);
            } catch (finallyAbortError) {
                debugLog('Error during final connection cleanup:', finallyAbortError);
            }
        }

        // Extra safety measure for first message - ensure UI is reset
        if (isFirstMessage) {
            // Force reset UI for first message immediately
            debugLog('First message cleanup in finally - forcing full UI reset');

            // Make sure loading indicator is hidden
            hideLoadingIndicator();

            // Make sure we toggle the button back to send when complete
            const stopButton = document.getElementById('stop-button');
            if (stopButton && !stopButton.classList.contains('hidden')) {
                toggleSendStopButton();
            }
        } else {
            // Standard cleanup for subsequent messages
            // Make sure loading indicator is hidden
            hideLoadingIndicator();

            // Make sure we toggle the button back to send when complete
            debugLog('Ensuring send button is visible...');
            // Only toggle if we're currently showing the stop button
            const stopButton = document.getElementById('stop-button');
            if (stopButton && !stopButton.classList.contains('hidden')) {
                toggleSendStopButton();
            }
        }

        // Final check to ensure hide thinking is applied correctly
        if (getHideThinking()) {
            // Apply the thinking visibility setting to all messages
            import('./ui-manager.js').then(module => {
                module.applyThinkingVisibility();
            });

            // Also ensure any thinking indicators are properly handled
            import('./settings-manager.js').then(module => {
                module.removeVisibleThinkTags();
            });
        }
    }
}

/**
 * Updates the chat history with a new AI response
 * The user message should already be in the history via addUserMessageToHistory
 * @param {string} userMessage - The user's message (for validation)
 * @param {string} aiMessage - The AI's response
 * @param {Array} fileContents - Optional array of file contents (for validation)
 */
export async function updateChatHistory(userMessage, aiMessage, fileContents = [], options = {}) {
    // Ensure chatHistoryData is initialized
    if (!chatHistoryData) {
        chatHistoryData = {};
    }

    // Initialize chat data structure if it doesn't exist
    if (!chatHistoryData[currentChatId]) {
        // Create a proper structure for the chat with messages array and metadata
        chatHistoryData[currentChatId] = {
            messages: [],
            title: null, // Initialize with no title
        };
    }

    // If the chat data is still in the old format (just an array), convert it
    if (Array.isArray(chatHistoryData[currentChatId])) {
        // Save the old messages
        const oldMessages = [...chatHistoryData[currentChatId]]; // Create a proper copy
        // Get the title if it exists and clean any <think> tags
        const oldTitle = oldMessages.title ? removeThinkTags(oldMessages.title) : null;
        // Convert to new format
        chatHistoryData[currentChatId] = {
            messages: oldMessages,
            title: oldTitle,
        };
    }

    // Ensure messages array exists
    if (!chatHistoryData[currentChatId].messages) {
        chatHistoryData[currentChatId].messages = [];
    }

    // Get a reference to the messages array
    const messages = chatHistoryData[currentChatId].messages;

    // Verify the user message is already in the history
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    // If the last message is not the expected user message, add it
    // This handles cases where the user message wasn't added via addUserMessageToHistory
    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== userMessage) {
        debugLog('User message not found in history, adding it now');

        // Create user message object
        const userMsg = { role: 'user', content: userMessage };

        // Store file attachments separately without modifying the user message content
        if (fileContents && fileContents.length > 0) {
            debugLog(`Adding ${fileContents.length} files to chat history`);
            userMsg.files = fileContents;
            debugLog(`Files added to chat history: ${fileContents.map(f => f.name).join(', ')}`);
        }

        messages.push(userMsg);
    }

    const shouldCaptureInlineTitle = messages.length === 1 && getAutoGenerateTitles();
    const responsePayload = prepareAssistantResponseForStorage(aiMessage, userMessage, shouldCaptureInlineTitle);

    if (responsePayload.title) {
        chatHistoryData[currentChatId].title = responsePayload.title;
        debugLog('Stored inline-generated chat title:', responsePayload.title);
    }

    const assistantMessage = { role: 'assistant', content: responsePayload.cleanMessage, model: getSelectedModel() };
    if (options.lmStudioResponseId) {
        assistantMessage.lmStudioResponseId = options.lmStudioResponseId;
    }
    if (Array.isArray(options.webSearchSources) && options.webSearchSources.length > 0) {
        assistantMessage.webSearchSources = cloneWebSearchSources(options.webSearchSources);
    }

    // Add the AI response
    messages.push(assistantMessage);

    // Log the current chat history for debugging
    debugLog('Updated chat history:',
        messages.map(msg => msg.role).join(', '));
    debugLog('Chat title:', chatHistoryData[currentChatId].title);

    // Log file attachments if any
    if (fileContents && fileContents.length > 0) {
        debugLog('Chat includes file attachments:', fileContents.map(f => f.name).join(', '));
    }

    // Make sure to save to localStorage before updating the UI
    // This ensures the chat is saved even if there's an issue with the UI update
    saveChatHistory();

    // Update the UI after saving
    updateChatHistoryUI();
}

/**
 * Adds a topic boundary marker to the chat history
 */
export function addTopicBoundary() {
    // Initialize chat data structure if it doesn't exist
    if (!chatHistoryData[currentChatId]) {
        chatHistoryData[currentChatId] = {
            messages: [],
            title: null,
        };
    }

    // If the chat data is still in the old format (just an array), convert it
    if (Array.isArray(chatHistoryData[currentChatId])) {
        // Save the old messages
        const oldMessages = chatHistoryData[currentChatId];
        // Get the title if it exists and clean any <think> tags
        const oldTitle = oldMessages.title ? removeThinkTags(oldMessages.title) : null;
        // Convert to new format
        chatHistoryData[currentChatId] = {
            messages: oldMessages,
            title: oldTitle,
        };
    }

    // Create a topic boundary marker in the UI
    const boundaryElement = document.createElement('div');
    boundaryElement.classList.add('topic-boundary');
    boundaryElement.innerHTML = '<span class="topic-boundary-text"><i class="fas fa-exchange-alt mr-2"></i>New Topic</span>';
    messagesContainer.appendChild(boundaryElement);

    // Add a topic boundary marker to the chat history
    chatHistoryData[currentChatId].messages.push({
        role: 'system',
        content: '--- New Topic ---',
        isTopicBoundary: true
    });

    // Set the new topic flag to true
    isNewTopic = true;

    // Save the updated chat history
    saveChatHistory();

    // Scroll to the bottom to show the new topic marker
    scrollToBottom(messagesContainer);
}

/**
 * Updates the chat history UI
 */
export function updateChatHistoryUI() {
    try {
        debugLog('Updating chat history UI');

        const chatHistory = document.getElementById('chat-history');
        if (!chatHistory) {
            debugError('Chat history element not found');
            return;
        }

        chatHistory.innerHTML = '';

        // Make sure chatHistoryData is valid
        if (!chatHistoryData || typeof chatHistoryData !== 'object') {
            debugError('Invalid chatHistoryData:', chatHistoryData);
            return;
        }

        // Log the number of chats in the history
        debugLog(`Updating UI with ${Object.keys(chatHistoryData).length} chats`);

        // Convert to array, sort by chat ID (newest first), then create buttons
        const sortedChats = Object.entries(chatHistoryData).sort((a, b) => {
            // Parse IDs as numbers and sort in descending order (newest first)
            return parseInt(b[0]) - parseInt(a[0]);
        });

        sortedChats.forEach(([id, chatData]) => {
            try {
                // Handle both old format (array) and new format (object with messages and title)
                const messages = Array.isArray(chatData) ? chatData : chatData.messages;
                if (!messages || messages.length === 0) {
                    debugLog(`Skipping empty chat ${id}`);
                    return; // Skip empty chats
                }

                const button = document.createElement('button');
                button.classList.add('chat-item', 'w-full', 'text-left', 'py-2', 'px-3', 'focus:outline-none',
                    'rounded-md', 'flex', 'items-center', 'justify-between', 'transition-all', 'duration-200');

                // Highlight current chat
                if (id === currentChatId) {
                    button.classList.add('active');
                }

                // Add the chat ID as a data attribute for the touch handler
                button.dataset.chatId = id;

                // Create a wrapper for the chat title and icon
                const titleWrapper = document.createElement('div');
                titleWrapper.classList.add('flex', 'items-center', 'overflow-hidden', 'flex-grow');

                // Add chat icon
                const chatIcon = document.createElement('i');
                chatIcon.classList.add('fas', 'fa-comment-alt', 'mr-3', 'flex-shrink-0');

                // Set icon color based on theme and active state
                chatIcon.style.color = 'var(--button-primary-bg)';

                titleWrapper.appendChild(chatIcon);

                const chatTitle = document.createElement('span');
                chatTitle.classList.add('truncate', 'text-sm');

                // Check if this chat has a generated title
                // Handle both old format (title on array) and new format (title in object)
                const title = Array.isArray(chatData) ? chatData.title : chatData.title;

                if (title) {
                    // Always ensure the title is clean of <think> tags
                    // This is critical for ensuring titles are clean regardless of hide-thinking setting
                    const cleanTitle = removeThinkTags(title);

                    // Log the original and cleaned title for debugging
                    debugLog('Original title:', title);
                    debugLog('Cleaned title for display:', cleanTitle);

                    // Set the cleaned title in the UI
                    chatTitle.textContent = cleanTitle;

                    // Add a title attribute to show the full title on hover
                    button.title = cleanTitle;

                    // Update the stored title to ensure it's clean
                    // This ensures the clean title persists in the chat history data
                    if (Array.isArray(chatData)) {
                        chatData.title = cleanTitle;
                    } else {
                        chatData.title = cleanTitle;
                    }
                } else {
                    const shouldUseNeutralFallback = getAutoGenerateTitles() && messages.length <= 2;

                    if (shouldUseNeutralFallback) {
                        chatTitle.textContent = 'New Chat';
                        button.title = 'New Chat';
                    } else {
                        // Fall back to using the first message content, but remove any <think> tags
                        const cleanContent = removeThinkTags(messages[0].content);

                        // Log the fallback content for debugging
                        debugLog('Using fallback title from first message:', cleanContent.substring(0, 30));

                        // Set the fallback title in the UI
                        chatTitle.textContent = cleanContent.substring(0, 30) + (cleanContent.length > 30 ? '...' : '');

                        // Add a title attribute to show more of the message on hover
                        button.title = cleanContent;
                    }
                }
                titleWrapper.appendChild(chatTitle);
                button.appendChild(titleWrapper);

                // Create action buttons wrapper
                const actionWrapper = document.createElement('div');
                actionWrapper.classList.add('action-wrapper', 'flex-shrink-0');

                // Create rename icon button and place it before delete
                const renameContainer = document.createElement('button');
                renameContainer.classList.add('rename-icon-container');
                renameContainer.setAttribute('aria-label', 'Rename chat');
                renameContainer.setAttribute('title', 'Rename this chat');
                renameContainer.style.cssText = `
                    background: transparent;
                    border: none;
                    padding: 8px;
                    margin: 0 4px 0 0;
                    cursor: pointer;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 44px;
                    min-height: 44px;
                    transition: all 0.2s ease;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                `;

                const renameIcon = document.createElement('i');
                renameIcon.classList.add('fas', 'fa-edit');

                const getRenameIconColor = () => '#60a5fa';

                renameIcon.style.cssText = `
                    color: ${getRenameIconColor()};
                    font-size: 14px;
                    transition: all 0.2s ease;
                    pointer-events: none;
                `;

                renameContainer.addEventListener('mouseenter', () => {
                    renameContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                    renameIcon.style.color = 'var(--button-primary-bg)';
                    renameIcon.style.transform = 'scale(1.1)';
                });

                renameContainer.addEventListener('mouseleave', () => {
                    renameContainer.style.backgroundColor = 'transparent';
                    renameIcon.style.color = getRenameIconColor();
                    renameIcon.style.transform = 'scale(1)';
                });

                renameContainer.addEventListener('focus', () => {
                    renameContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.12)';
                    renameContainer.style.outline = '2px solid rgba(59, 130, 246, 0.45)';
                    renameContainer.style.outlineOffset = '2px';
                });

                renameContainer.addEventListener('blur', () => {
                    renameContainer.style.backgroundColor = 'transparent';
                    renameContainer.style.outline = 'none';
                    renameContainer.style.outlineOffset = '0';
                });

                renameContainer.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    renameContainer.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                    renameIcon.style.transform = 'scale(0.95)';
                }, { passive: true });

                renameContainer.addEventListener('touchend', () => {
                    setTimeout(() => {
                        renameContainer.style.backgroundColor = 'transparent';
                        renameIcon.style.transform = 'scale(1)';
                    }, 150);
                }, { passive: true });

                renameContainer.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    renameChatTitle(id);
                });

                renameContainer.appendChild(renameIcon);
                actionWrapper.appendChild(renameContainer);

                // Create trash icon container for better touch target
                const trashContainer = document.createElement('button');
                trashContainer.classList.add('trash-icon-container');
                trashContainer.setAttribute('aria-label', 'Delete chat');
                trashContainer.setAttribute('title', 'Delete this chat');
                trashContainer.style.cssText = `
                    background: transparent;
                    border: none;
                    padding: 8px;
                    margin: 0;
                    cursor: pointer;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 44px;
                    min-height: 44px;
                    transition: all 0.2s ease;
                    -webkit-tap-highlight-color: transparent;
                    touch-action: manipulation;
                `;

                const trashIcon = document.createElement('i');
                trashIcon.classList.add('fas', 'fa-trash');

                // Function to get the appropriate trash icon color based on theme
                const getTrashIconColor = () => '#b91c1c';

                trashIcon.style.cssText = `
                    color: ${getTrashIconColor()};
                    font-size: 14px;
                    transition: all 0.2s ease;
                    pointer-events: none;
                `;

                // Add hover/focus styles programmatically for better control
                trashContainer.addEventListener('mouseenter', () => {
                    trashContainer.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                    trashIcon.style.color = 'var(--button-danger-bg)';
                    trashIcon.style.transform = 'scale(1.1)';
                });

                trashContainer.addEventListener('mouseleave', () => {
                    trashContainer.style.backgroundColor = 'transparent';
                    trashIcon.style.color = getTrashIconColor();
                    trashIcon.style.transform = 'scale(1)';
                });

                // Add focus styles
                trashContainer.addEventListener('focus', () => {
                    trashContainer.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                    trashContainer.style.outline = '2px solid rgba(220, 38, 38, 0.5)';
                    trashContainer.style.outlineOffset = '2px';
                });

                trashContainer.addEventListener('blur', () => {
                    trashContainer.style.backgroundColor = 'transparent';
                    trashContainer.style.outline = 'none';
                    trashContainer.style.outlineOffset = '0';
                });

                // Add touch feedback for mobile
                trashContainer.addEventListener('touchstart', (e) => {
                    e.stopPropagation(); // Prevent chat item touch handling
                    trashContainer.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                    trashIcon.style.transform = 'scale(0.95)';
                }, { passive: true });

                trashContainer.addEventListener('touchend', () => {
                    setTimeout(() => {
                        trashContainer.style.backgroundColor = 'transparent';
                        trashIcon.style.transform = 'scale(1)';
                    }, 150);
                }, { passive: true });

                trashContainer.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    suppressChatHistoryClickUntil = Date.now() + 500;
                    showDeleteConfirmation(id);
                });

                trashContainer.appendChild(trashIcon);
                actionWrapper.appendChild(trashContainer);
                button.appendChild(actionWrapper);

                button.addEventListener('click', () => {
                    if (Date.now() < suppressChatHistoryClickUntil) {
                        return;
                    }
                    loadChat(id);
                });
                chatHistory.appendChild(button);
            } catch (chatError) {
                debugError(`Error processing chat ${id}:`, chatError);
                // Continue with the next chat
            }
        });

        // Update scrolling behavior after updating the chat history
        updateChatHistoryScroll();

        // Final pass to ensure all titles are clean of <think> tags
        // This is especially important when "Hide thinking text" is disabled
        Object.entries(chatHistoryData).forEach(([chatId, chatData]) => {
            try {
                if (Array.isArray(chatData)) {
                    // Old format - ensure title is clean
                    if (chatData.title) {
                        chatData.title = removeThinkTags(chatData.title);
                    }
                } else if (chatData && typeof chatData === 'object') {
                    // New format - ensure title is clean
                    if (chatData.title) {
                        chatData.title = removeThinkTags(chatData.title);
                    }
                }
            } catch (cleanError) {
                debugError(`Error cleaning title for chat ${chatId}:`, cleanError);
            }
        });

        // Save the chat history to ensure any title cleaning is persisted
        // This is critical for ensuring clean titles are saved to storage
        saveChatHistory();
        debugLog('Chat history saved with clean titles');

        debugLog('Chat history UI updated successfully');
    } catch (error) {
        debugError('Error updating chat history UI:', error);
    }
}

/**
 * Shows the delete confirmation modal for a chat
 * @param {string} id - The ID of the chat to delete
 */
export function showDeleteConfirmation(id) {
    chatToDelete = id;
    setActionToPerform('deleteChat');
    showConfirmationModal('Are you sure you want to delete this chat? This action cannot be undone.');
}

function ensureRenameChatModal() {
    let modal = document.getElementById('chat-rename-modal');
    if (modal) {
        const existingInput = modal.querySelector('#chat-rename-input');
        if (existingInput) {
            existingInput.removeAttribute('maxlength');
            existingInput.placeholder = 'Enter a new title';
        }
        return modal;
    }

    modal = document.createElement('div');
    modal.id = 'chat-rename-modal';
    modal.className = 'modal-container fixed inset-0 bg-black/70 dark:bg-black/70 light:bg-gray-900/50 backdrop-blur-sm items-center justify-center hidden z-[2100]';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'chat-rename-title');

    modal.innerHTML = `
        <div class="chat-rename-modal-box bg-linear-to-b from-[#0a192f] to-[#0d1f3d] dark:from-[#0a192f] dark:to-[#0d1f3d] light:from-[#f8fafc] light:to-[#f1f5f9] p-6 rounded-xl w-[420px] max-w-[90%] shadow-2xl modal-content border border-blue-900/30 dark:border-blue-900/30 light:border-blue-200 overflow-x-hidden overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 id="chat-rename-title" class="text-xl font-bold flex items-center text-blue-400 dark:text-blue-400 light:text-blue-700">
                    <i class="fas fa-edit mr-3"></i>Rename Chat
                </h3>
                <button id="close-chat-rename-modal"
                    class="text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white light:text-gray-600 light:hover:text-gray-800 focus:outline-none rounded-full w-8 h-8 flex items-center justify-center hover:bg-blue-900/20 dark:hover:bg-blue-900/20 light:hover:bg-blue-200/50"
                    aria-label="Close rename modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mb-4">
                <label for="chat-rename-input" class="block text-sm font-medium text-gray-300 dark:text-gray-300 light:text-gray-700 mb-2">Chat Title</label>
                <input id="chat-rename-input" type="text"
                    class="w-full px-3 py-2 rounded-lg border border-blue-800/40 dark:border-blue-800/40 light:border-blue-300 bg-[#0b1a30] dark:bg-[#0b1a30] light:bg-white text-gray-200 dark:text-gray-200 light:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                    placeholder="Enter a new title" />
                <p id="chat-rename-error" class="hidden text-sm text-red-400 dark:text-red-400 light:text-red-600 mt-2">Title cannot be blank.</p>
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancel-chat-rename" class="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white">Cancel</button>
                <button id="confirm-chat-rename" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    return modal;
}

function closeRenameChatModal() {
    const modal = document.getElementById('chat-rename-modal');
    if (!modal) return;

    if (renameModalHideTimer) {
        clearTimeout(renameModalHideTimer);
        renameModalHideTimer = null;
    }

    if (renameModalViewportCleanup) {
        renameModalViewportCleanup();
        renameModalViewportCleanup = null;
    }

    if (renameModalTouchMoveHandler) {
        modal.removeEventListener('touchmove', renameModalTouchMoveHandler);
        renameModalTouchMoveHandler = null;
    }

    modal.classList.remove('show');
    modal.classList.add('hide');
    chatToRename = null;

    renameModalHideTimer = setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('hide');
        modal.classList.remove('flex');
        renameModalHideTimer = null;
    }, 400);

    if (renameModalEscapeHandler) {
        document.removeEventListener('keydown', renameModalEscapeHandler);
        renameModalEscapeHandler = null;
    }
}

function getRenameModalViewportMetrics() {
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

function clearRenameModalViewportStyles(modal) {
    if (!modal) {
        return;
    }

    modal.classList.remove('keyboard-visible');
    modal.style.height = '';
    modal.style.maxHeight = '';
    modal.style.width = '';
    modal.style.maxWidth = '';
    modal.style.position = '';
    modal.style.top = '';
    modal.style.left = '';
    modal.style.right = '';
    modal.style.bottom = '';
    modal.style.alignItems = '';
    modal.style.justifyContent = '';
    modal.style.padding = '';
    modal.style.overflow = '';
    modal.style.touchAction = '';

    const modalBox = modal.querySelector('.chat-rename-modal-box');
    if (modalBox) {
        modalBox.style.maxHeight = '';
        modalBox.style.margin = '';
        modalBox.style.transform = '';
        modalBox.style.touchAction = '';
    }
}

function syncRenameModalViewport(modal, baselineHeightRef) {
    if (!modal || modal.classList.contains('hidden')) {
        return;
    }

    // Native (WebViewActivity.applySystemBarInsets) consumes the IME inset and
    // shrinks the WebView above the keyboard with a small breathing-room gap.
    // The modal is position:fixed and naturally fits the visible area, so any
    // extra inline sizing or bottom padding here would push it too high.
    // Keep this function as a no-op cleanup to clear any stale styles from
    // older code paths.
    void baselineHeightRef;
    clearRenameModalViewportStyles(modal);
}

function setupRenameModalViewportHandling(modal) {
    if (!modal || !isAndroidWebView() || !window.visualViewport) {
        return null;
    }

    const baselineHeightRef = {
        value: getRenameModalViewportMetrics().height
    };

    const handleViewportChange = () => {
        syncRenameModalViewport(modal, baselineHeightRef);
    };

    window.visualViewport.addEventListener('resize', handleViewportChange, { passive: true });
    window.visualViewport.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });

    handleViewportChange();

    return () => {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
        window.removeEventListener('resize', handleViewportChange);
        clearRenameModalViewportStyles(modal);
    };
}

function confirmRenameChatModal() {
    if (!chatToRename || !chatHistoryData[chatToRename]) {
        closeRenameChatModal();
        return;
    }

    const modal = document.getElementById('chat-rename-modal');
    const input = modal ? modal.querySelector('#chat-rename-input') : null;
    const errorText = modal ? modal.querySelector('#chat-rename-error') : null;
    if (!input) {
        closeRenameChatModal();
        return;
    }

    const cleanTitle = removeThinkTags(input.value).replace(/\s+/g, ' ').trim();
    if (!cleanTitle) {
        if (errorText) {
            errorText.textContent = 'Title cannot be blank.';
            errorText.classList.remove('hidden');
        }
        input.focus();
        return;
    }

    if (errorText) {
        errorText.classList.add('hidden');
    }

    const chatData = chatHistoryData[chatToRename];
    chatData.title = cleanTitle;

    // Prevent synthetic/click-through events from triggering chat selection
    // (which would close the sidebar on mobile via loadChat).
    suppressChatHistoryClickUntil = Date.now() + 500;

    saveChatHistory();
    updateChatHistoryUI();
    closeRenameChatModal();
}

function openRenameChatModal(id, currentTitle) {
    const modal = ensureRenameChatModal();
    const input = modal.querySelector('#chat-rename-input');
    const errorText = modal.querySelector('#chat-rename-error');
    const saveButton = modal.querySelector('#confirm-chat-rename');
    const cancelButton = modal.querySelector('#cancel-chat-rename');
    const closeButton = modal.querySelector('#close-chat-rename-modal');

    if (!input || !saveButton || !cancelButton || !closeButton || !errorText) {
        return;
    }

    chatToRename = id;
    input.removeAttribute('maxlength');
    input.value = currentTitle;
    errorText.classList.add('hidden');

    if (renameModalHideTimer) {
        clearTimeout(renameModalHideTimer);
        renameModalHideTimer = null;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.classList.remove('hide');
    // Force reflow so the fade transition starts from opacity 0.
    void modal.offsetHeight;
    modal.classList.add('show');

    if (renameModalViewportCleanup) {
        renameModalViewportCleanup();
    }
    renameModalViewportCleanup = setupRenameModalViewportHandling(modal);

    if (!renameModalTouchMoveHandler) {
        renameModalTouchMoveHandler = (e) => {
            const modalBox = modal.querySelector('.chat-rename-modal-box');
            if (!modalBox || e.target === modal || !modalBox.contains(e.target)) {
                e.preventDefault();
            }
        };
    }

    modal.addEventListener('touchmove', renameModalTouchMoveHandler, { passive: false });

    if (!modal.dataset.handlersAttached) {
        saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            confirmRenameChatModal();
        });
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeRenameChatModal();
        });
        closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeRenameChatModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRenameChatModal();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmRenameChatModal();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeRenameChatModal();
            }
        });

        input.addEventListener('input', () => {
            const cleanTitle = removeThinkTags(input.value).replace(/\s+/g, ' ').trim();
            if (cleanTitle) {
                errorText.classList.add('hidden');
            }
        });

        modal.dataset.handlersAttached = 'true';
    }

    renameModalEscapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeRenameChatModal();
        }
    };
    document.addEventListener('keydown', renameModalEscapeHandler);

    requestAnimationFrame(() => {
        input.focus();
        const titleLength = input.value.length;
        input.setSelectionRange(titleLength, titleLength);
    });
}

/**
 * Renames a chat title from the chat history list
 * @param {string} id - The ID of the chat to rename
 */
export function renameChatTitle(id) {
    if (!chatHistoryData[id]) {
        return;
    }

    const chatData = chatHistoryData[id];
    const messages = Array.isArray(chatData) ? chatData : chatData.messages;
    const currentTitle = removeThinkTags((chatData && chatData.title) || (messages && messages[0] && messages[0].content) || 'New Chat');

    openRenameChatModal(id, currentTitle);
}

/**
 * Deletes a chat from the chat history
 * @param {string} id - The ID of the chat to delete
 */
export function deleteChatHistory(id) {
    suppressChatHistoryClickUntil = Date.now() + 500;
    delete chatHistoryData[id];
    updateChatHistoryUI(); // This will also call updateChatHistoryScroll()
    saveChatHistory();
    if (id === currentChatId) {
        // Stop any ongoing TTS playback
        if (window.TTSService && typeof window.TTSService.stop === 'function') {
            window.TTSService.stop('delete-current-chat', true);
        }

        messagesContainer.innerHTML = '';
        showWelcomeMessage();
        currentChatId = Date.now();

        // Check if the system prompt was user-created before clearing the active character
        const isUserCreated = isUserCreatedPrompt();
        const savedPrompt = localStorage.getItem('systemPrompt');


        // If the system prompt was user-created, restore it
        if (isUserCreated && savedPrompt) {
            console.log('System prompt was user-created, restoring it after deleting chat');
            // Set the system prompt
            import('./settings-manager.js').then(module => {
                module.setSystemPrompt(savedPrompt, false);
            });

            // Update the UI to show the system prompt
            const systemPromptInput = document.getElementById('system-prompt');
            if (systemPromptInput) {
                systemPromptInput.value = savedPrompt;
            }

            // Update the system prompt display
            const systemPromptDisplay = document.getElementById('system-prompt-display');
            if (systemPromptDisplay) {
                systemPromptDisplay.textContent = savedPrompt;
            }

            // Update the system prompt preview
            const systemPromptPreview = document.getElementById('system-prompt-preview');
            if (systemPromptPreview) {
                systemPromptPreview.textContent = savedPrompt;
            }

            // Force update any CodeMirror editor that might be showing the system prompt
            if (window.systemPromptEditor && typeof window.systemPromptEditor.setValue === 'function') {
                window.systemPromptEditor.setValue(savedPrompt);
            }
        }
    }
    hideConfirmationModal();
}

/**
 * Loads a chat from history
 * @param {string} id - The ID of the chat to load
 * @param {boolean} isFirstMessageReload - Optional: Whether this is a first message reload
 */
export function loadChat(id, isFirstMessageReload = false) {
    if (!chatHistoryData[id]) {
        debugError(`Chat with ID ${id} not found in history`);
        return;
    }

    // Always stop active generation before switching to another chat.
    abortGenerationForChatSwitch('load-chat');

    // Check if this is an explicit first message reload or if the flag is set in localStorage
    isFirstMessageReload = isFirstMessageReload || localStorage.getItem('isFirstMessageReload') === 'true';

    // Update the current chat ID
    setCurrentChatId(id);

    // Stop any ongoing TTS playback
    if (window.TTSService && typeof window.TTSService.stop === 'function') {
        window.TTSService.stop('load-chat', true);
    }

    const chatData = chatHistoryData[id];

    // Ensure chat data is in the proper format
    if (Array.isArray(chatData)) {
        // Convert old format to new format
        const oldMessages = [...chatData]; // Create a proper copy
        const oldTitle = oldMessages.title ? removeThinkTags(oldMessages.title) : null;
        chatHistoryData[id] = {
            messages: oldMessages,
            title: oldTitle,
        };
    }

    // Ensure messages property exists and is an array
    if (!chatHistoryData[id].messages) {
        chatHistoryData[id].messages = [];
    }

    // Get messages
    const messages = chatHistoryData[id].messages;

    // First hide the welcome message completely, then load the chat
    // This prevents the welcome screen from showing through during the transition
    hideWelcomeMessage();

    // Hide the scroll-to-bottom button when switching chats
    hideScrollToBottomButton();

    // Check if the system prompt was user-created
    const isUserCreated = isUserCreatedPrompt();
    const savedPrompt = localStorage.getItem('systemPrompt');

    // If the system prompt was user-created, restore it
    if (isUserCreated && savedPrompt) {
        console.log('System prompt was user-created, restoring it after loading chat');
        // Set the system prompt
        import('./settings-manager.js').then(module => {
            module.setSystemPrompt(savedPrompt, false);
        });

        // Update the UI to show the system prompt
        const systemPromptInput = document.getElementById('system-prompt');
        if (systemPromptInput) {
            systemPromptInput.value = savedPrompt;
        }

        // Update the system prompt display
        const systemPromptDisplay = document.getElementById('system-prompt-display');
        if (systemPromptDisplay) {
            systemPromptDisplay.textContent = savedPrompt;
        }

        // Update the system prompt preview
        const systemPromptPreview = document.getElementById('system-prompt-preview');
        if (systemPromptPreview) {
            systemPromptPreview.textContent = savedPrompt;
        }

        // Force update any CodeMirror editor that might be showing the system prompt
        if (window.systemPromptEditor && typeof window.systemPromptEditor.setValue === 'function') {
            window.systemPromptEditor.setValue(savedPrompt);
        }
    }

    // Close the sidebar if it's open - skip for first message reloads to improve speed
    if (!isFirstMessageReload) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    }

    // For first message reloads, we load the messages immediately with minimal animation
    if (isFirstMessageReload) {
        debugLog('Fast-loading chat for first message reload');
        // Clear the messages container immediately
        messagesContainer.innerHTML = '';

        // Load messages directly without animation delay
        lazyLoadMessages(messages, 0, 50); // Load more messages at once

        // Make sure the chat is saved to localStorage
        saveChatHistory();

        // Update UI display and sidebar
        updateChatHistoryUI();
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === id) {
                item.classList.add('active');
            }
        });

        // Refresh all code blocks immediately
        setTimeout(() => {
            refreshAllCodeBlocks();
            // Force scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);

        // Clear the first message reload flag
        localStorage.removeItem('isFirstMessageReload');

        return; // Skip the standard loading process
    }

    // Standard loading process for regular messages
    // Wait for the welcome message to be fully hidden before loading messages
    setTimeout(() => {
        // Clear the messages container
        messagesContainer.innerHTML = '';

        // Lazily load messages to avoid UI freezing with large chats
        lazyLoadMessages(messages, 0);

        // Make sure the chat is saved to localStorage after loading
        // This ensures any format conversions are persisted
        saveChatHistory();

        // Update UI display and sidebar
        updateChatHistoryUI();
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === id) {
                item.classList.add('active');
            }
        });

        // Ensure chat is visible in sidebar if on mobile
        if (window.innerWidth < 768) {
            document.querySelectorAll('.chat-item.active')[0]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }

        // Refresh all code blocks to ensure proper styling
        refreshAllCodeBlocks();

        // Scroll messages container to bottom after code blocks are refreshed
        scrollToBottom(messagesContainer, true);
    }, 350); // Wait slightly longer than the welcome message transition (300ms)
}

/**
 * Lazy loads messages
 * @param {Array} messages - Array of messages to load
 * @param {number} startIndex - Starting index
 * @param {number} chunkSize - Number of messages to load at once
 */
export function lazyLoadMessages(messages, startIndex, chunkSize = 10) {
    // If messages is not an array (could be undefined or null), return
    if (!Array.isArray(messages)) {
        debugError('Invalid messages format:', messages);
        return;
    }

    // Clear any existing messages if this is the first batch
    if (startIndex === 0) {
        messagesContainer.innerHTML = '';

        // Ensure the messages container is properly displayed
        if (messagesContainer.style.display === 'none') {
            messagesContainer.style.display = 'flex';
            messagesContainer.style.height = '100%';
            messagesContainer.style.opacity = '1';
            messagesContainer.style.visibility = 'visible';
        }
    }

    const endIndex = Math.min(startIndex + chunkSize, messages.length);

    // Load messages in chronological order
    for (let i = startIndex; i < endIndex; i++) {
        const message = messages[i];

        // Check if this is a topic boundary marker
        if (message.isTopicBoundary) {
            // Create a topic boundary marker in the UI
            const boundaryElement = document.createElement('div');
            boundaryElement.classList.add('topic-boundary');
            boundaryElement.innerHTML = '<span class="topic-boundary-text"><i class="fas fa-exchange-alt mr-2"></i>New Topic</span>';
            messagesContainer.appendChild(boundaryElement);
            continue; // Skip to the next message
        }

        let contentDisplay = message.role === 'assistant'
            ? removeInlineChatTitleMarkup(getDisplayTextFromMessageContent(message.content))
            : getDisplayTextFromMessageContent(message.content);

        const messageFiles = Array.isArray(message.files) && message.files.length > 0
            ? message.files
            : null;

        // Add file attachment indicator if present
        if (!messageFiles && message.has_files) {
            contentDisplay += ' [File attached]';
        }

        // Use appendMessage to ensure proper message formatting and controls
        const messageElement = appendMessage(message.role === 'user' ? 'user' : 'ai', contentDisplay, messageFiles, false, message.model);
        
        // If this is a user message with web search metadata, add the indicator
        if (message.role === 'user' && message.hadWebSearch && messageElement) {
            addWebSearchIndicator(messageElement);
        }
    }

    // If there are more messages to load, schedule the next chunk
    if (endIndex < messages.length) {
        setTimeout(() => {
            lazyLoadMessages(messages, endIndex, chunkSize);
        }, 0);
    } else {
        // Scroll to bottom after all messages are loaded
        // Force scroll to bottom to ensure messages are visible
        scrollToBottom(messagesContainer, true);
    }
}

/**
 * Clears all chats
 */
export function clearAllChats() {
    // Stop any ongoing TTS playback
    if (window.TTSService && typeof window.TTSService.stop === 'function') {
        window.TTSService.stop('clear-all-chats', true);
    }

    messagesContainer.innerHTML = '';
    showWelcomeMessage();
    chatHistoryData = {};
    updateChatHistoryUI();

    // Hide the scroll-to-bottom button when clearing all chats
    hideScrollToBottomButton();

    // Character functionality has been removed - no character clearing needed
    // System prompt remains unchanged when clearing chats

    // Import the settings modal manager to properly hide the settings modal
    import('./settings-modal-manager.js').then(module => {
        if (typeof module.hideSettingsModal === 'function') {
            module.hideSettingsModal();
        } else {
            // Fallback if the import fails
            const settingsModal = document.getElementById('settings-modal');
            if (settingsModal) {
                settingsModal.classList.add('hidden');
                settingsModal.style.display = 'none';
                settingsModal.style.opacity = '0';
                settingsModal.style.pointerEvents = 'none';
                settingsModal.style.zIndex = '-1';
            }
        }
    }).catch(() => {
        // Fallback if the import fails
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.classList.add('hidden');
            settingsModal.style.display = 'none';
            settingsModal.style.opacity = '0';
            settingsModal.style.pointerEvents = 'none';
            settingsModal.style.zIndex = '-1';
        }
    });

    // Make sure the deprecated delete-all-confirmation-modal is hidden
    const deleteAllConfirmationModal = document.getElementById('delete-all-confirmation-modal');
    if (deleteAllConfirmationModal) {
        deleteAllConfirmationModal.classList.add('hidden');
        deleteAllConfirmationModal.style.display = 'none';
        deleteAllConfirmationModal.style.visibility = 'hidden';
    }

    // Clear local storage and native storage
    localStorage.removeItem('chatHistory');
    if (window.AndroidFileOps && typeof window.AndroidFileOps.deleteData === 'function') {
        window.AndroidFileOps.deleteData('chatHistory');
        debugLog('Cleared chat history from Android internal storage');
    }

    deleteStoredData(CHAT_IMAGE_STORE_KEY);
    cachedChatImageStore = createEmptyChatImageStore();

    // Reset current chat ID
    currentChatId = Date.now();
}

/**
 * Creates a new chat
 * @returns {string} - The ID of the new chat
 */
export function createNewChat(options = {}) {
    const {
        skipActiveTemplateGreeting = false
    } = options;

    // Always stop active generation before creating a new chat.
    abortGenerationForChatSwitch('create-new-chat');

    // Stop any ongoing TTS playback
    if (window.TTSService && typeof window.TTSService.stop === 'function') {
        window.TTSService.stop('create-new-chat', true);
    }

    // Generate a new chat ID
    const newChatId = Date.now().toString();

    // Initialize the new chat with the proper structure
    // Ensure the title is explicitly set to null (not undefined or containing <think> tags)
    chatHistoryData[newChatId] = {
        messages: [],
        title: null, // Explicitly set to null to avoid any issues with <think> tags
    };

    // Update the current chat ID
    setCurrentChatId(newChatId);

    // Clear the messages container and show the welcome message
    messagesContainer.innerHTML = '';
    showWelcomeMessage();

    // Hide the scroll-to-bottom button when starting a new chat
    hideScrollToBottomButton();

    // Clear smart replies from previous chat
    hideSmartReplies();

    // Update UI
    updateChatHistoryUI();
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === newChatId) {
            item.classList.add('active');
        }
    });

    // Reset the first message flag
    setIsFirstMessage(true);

    // Check if there's a user-created system prompt that should be preserved
    const savedPrompt = localStorage.getItem('systemPrompt');
    const isUserCreated = localStorage.getItem('isUserCreatedSystemPrompt') === 'true';

    if (isUserCreated && savedPrompt) {
        console.log('Preserving user-created system prompt for new chat:', savedPrompt);

        // Set the system prompt
        getSystemPrompt(); // This is just to ensure the function is properly imported
        import('./settings-manager.js').then(module => {
            module.setSystemPrompt(savedPrompt, false);
        });

        // Update the UI to show the system prompt
        const systemPromptInput = document.getElementById('system-prompt');
        if (systemPromptInput) {
            systemPromptInput.value = savedPrompt;
        }

        // Update the system prompt display
        const systemPromptDisplay = document.getElementById('system-prompt-display');
        if (systemPromptDisplay) {
            systemPromptDisplay.textContent = savedPrompt;
        }
        // Update the system prompt preview
        const systemPromptPreview = document.getElementById('system-prompt-preview');
        if (systemPromptPreview) {
            systemPromptPreview.textContent = savedPrompt;
        }

        // Force update any CodeMirror editor that might be showing the system prompt
        if (window.systemPromptEditor && typeof window.systemPromptEditor.setValue === 'function') {
            window.systemPromptEditor.setValue(savedPrompt);
        }
    }

    // Save the empty chat to localStorage first to ensure it's saved
    // even if there's an issue with subsequent operations
    debugLog(`Saving new empty chat with ID ${newChatId} to localStorage`);
    saveChatHistory();

    // Hide the scroll-to-bottom button if it's visible
    const scrollButton = document.getElementById('scroll-to-bottom');
    if (scrollButton) {
        scrollButton.classList.remove('visible');
        scrollButton.classList.add('hidden');
    }

    // Close the sidebar if it's open (especially important on mobile)
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('active')) {
        toggleSidebar();
    }

    if (!skipActiveTemplateGreeting) {
        const activeCharacterCardActivation = getActiveTemplateCharacterCardActivation();
        const activeCardData = activeCharacterCardActivation?.characterCard?.data;
        const openingMessage = getCharacterCardActivationGreeting(activeCardData);

        if (activeCardData && openingMessage) {
            const currentChat = chatHistoryData[newChatId];
            if (currentChat && Array.isArray(currentChat.messages)) {
                currentChat.messages.push({
                    role: 'assistant',
                    content: openingMessage,
                    model: getSelectedModel()
                });

                const preferredTitle = typeof activeCharacterCardActivation.templateName === 'string' && activeCharacterCardActivation.templateName.trim()
                    ? activeCharacterCardActivation.templateName.trim()
                    : (typeof activeCardData.name === 'string' && activeCardData.name.trim() ? activeCardData.name.trim() : null);

                if (preferredTitle) {
                    currentChat.title = preferredTitle;
                }

                saveChatHistory();
                hideWelcomeMessage();
                loadChat(newChatId, true);
            }
        }
    }

    return newChatId;
}

function getPendingTemplateCharacterCardActivation() {
    const rawActivation = localStorage.getItem(PENDING_TEMPLATE_CHARACTER_CARD_KEY);
    if (!rawActivation) {
        return null;
    }

    try {
        const parsedActivation = JSON.parse(rawActivation);
        if (!parsedActivation || typeof parsedActivation !== 'object') {
            localStorage.removeItem(PENDING_TEMPLATE_CHARACTER_CARD_KEY);
            return null;
        }

        return parsedActivation;
    } catch (error) {
        debugError('Failed to parse pending template character card activation:', error);
        localStorage.removeItem(PENDING_TEMPLATE_CHARACTER_CARD_KEY);
        return null;
    }
}

function getCharacterCardActivationGreeting(cardData) {
    if (!cardData || typeof cardData !== 'object') {
        return '';
    }

    if (typeof cardData.first_mes === 'string' && cardData.first_mes.trim()) {
        return cardData.first_mes.trim();
    }

    if (Array.isArray(cardData.alternate_greetings)) {
        const alternateGreeting = cardData.alternate_greetings.find(greeting => typeof greeting === 'string' && greeting.trim());
        if (alternateGreeting) {
            return alternateGreeting.trim();
        }
    }

    return '';
}

export function activatePendingTemplateCharacterCard() {
    const pendingActivation = getPendingTemplateCharacterCardActivation();
    if (!pendingActivation) {
        return false;
    }

    const characterCard = pendingActivation.characterCard;
    const cardData = characterCard && typeof characterCard === 'object' ? characterCard.data : null;
    const openingMessage = getCharacterCardActivationGreeting(cardData);

    localStorage.removeItem(PENDING_TEMPLATE_CHARACTER_CARD_KEY);

    if (!cardData || !openingMessage) {
        return false;
    }

    const newChatId = createNewChat({ skipActiveTemplateGreeting: true });
    const currentChat = chatHistoryData[newChatId];

    if (!currentChat || !Array.isArray(currentChat.messages)) {
        return false;
    }

    currentChat.messages.push({
        role: 'assistant',
        content: openingMessage,
        model: getSelectedModel()
    });

    const preferredTitle = typeof pendingActivation.templateName === 'string' && pendingActivation.templateName.trim()
        ? pendingActivation.templateName.trim()
        : (typeof cardData.name === 'string' && cardData.name.trim() ? cardData.name.trim() : null);

    if (preferredTitle) {
        currentChat.title = preferredTitle;
    }

    saveChatHistory();
    hideWelcomeMessage();
    loadChat(newChatId, true);

    return true;
}


/**
 * Saves the chat history to localStorage
 */
export function saveChatHistory() {
    try {
        debugLog('Starting to save chat history to localStorage');

        // Make a deep copy of the chat history to avoid reference issues
        const chatHistoryToSave = JSON.parse(JSON.stringify(chatHistoryData));
        const nextImageEntries = {};

        // Log the number of chats being saved
        debugLog(`Saving ${Object.keys(chatHistoryToSave).length} chats to localStorage`);

        // Ensure all chat entries have the proper structure
        Object.keys(chatHistoryToSave).forEach(chatId => {
            let chatData = chatHistoryToSave[chatId];
            const sourceChatData = chatHistoryData[chatId];

            // Log the chat being processed
            debugLog(`Processing chat ${chatId} for saving`);

            // Convert any array-formatted chats to object format
            if (Array.isArray(chatData)) {
                debugLog(`Converting chat ${chatId} from array format to object format`);
                const oldMessages = [...chatData];
                const oldTitle = oldMessages.title ? removeThinkTags(oldMessages.title) : null;
                chatHistoryToSave[chatId] = {
                    messages: oldMessages,
                    title: oldTitle,
                };
                chatData = chatHistoryToSave[chatId];
            }

            // Ensure messages property exists and is an array
            if (!chatData.messages) {
                debugLog(`Chat ${chatId} has no messages array, creating empty array`);
                chatData.messages = [];
            }

            // Ensure title property exists and clean any <think> tags
            if (!('title' in chatData)) {
                debugLog(`Chat ${chatId} has no title property, setting to null`);
                chatData.title = null;
            } else if (chatData.title) {
                // Make sure any <think> tags are removed from the title
                // This is critical for ensuring titles are clean regardless of hide-thinking setting
                const originalTitle = chatData.title;
                chatData.title = removeThinkTags(chatData.title);
                if (originalTitle !== chatData.title) {
                    debugLog(`Removed think tags from title for chat ${chatId}`);
                }

                // Double-check to ensure all <think> tags are completely removed
                // This is especially important when "Hide thinking text" is disabled
                if (chatData.title.includes('<think>') || chatData.title.includes('</think>') ||
                    chatData.title.includes('&lt;think&gt;') || chatData.title.includes('&lt;/think&gt;')) {
                    debugLog(`Found remaining think tags in title for chat ${chatId}, applying aggressive cleaning`);
                    // Apply more aggressive cleaning
                    chatData.title = removeThinkTags(removeThinkTags(chatData.title));
                }
            }

            // Process each message to ensure code blocks are properly encoded
            if (Array.isArray(chatData.messages)) {
                const sourceMessages = Array.isArray(sourceChatData)
                    ? sourceChatData
                    : Array.isArray(sourceChatData?.messages)
                        ? sourceChatData.messages
                        : [];

                chatData.messages.forEach((message, messageIndex) => {
                    const sourceMessage = sourceMessages[messageIndex];

                    if (Array.isArray(sourceMessage?.files) && sourceMessage.files.length > 0) {
                        message.files = serializeFilesForStorage(sourceMessage.files, chatId, messageIndex, nextImageEntries);
                    } else if (Array.isArray(message.files) && message.files.length > 0) {
                        message.files = serializeFilesForStorage(message.files, chatId, messageIndex, nextImageEntries);
                    }

                    if (message.content && typeof message.content === 'string') {
                        if (message.role === 'assistant') {
                            if (!chatData.title) {
                                const extractedTitle = extractInlineChatTitle(message.content);
                                if (extractedTitle) {
                                    chatData.title = extractedTitle;
                                }
                            }
                            message.content = removeInlineChatTitleMarkup(message.content);
                        }

                        // For messages with code blocks, use a simple but effective preservation method
                        if (message.content.includes('```')) {
                            debugLog('Saving message with code blocks - preserving format');

                            // Process code blocks with minimal modification to preserve format
                            const codeBlocks = [];
                            let processedContent = message.content;

                            // First locate and tag all code blocks
                            processedContent = processedContent.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (match, languageInfo, code) => {
                                const languageToken = String(languageInfo || '').trim().split(/\s+/)[0] || '';
                                const isHtmlCode = languageToken === 'html' || languageToken === 'xml';
                                codeBlocks.push({
                                    language: languageToken,
                                    code: code.trim(),
                                    isHtml: isHtmlCode
                                });
                                return `[CODE_BLOCK_${codeBlocks.length - 1}]`;
                            });

                            // Then restore them with special markers for HTML
                            for (let i = 0; i < codeBlocks.length; i++) {
                                const block = codeBlocks[i];
                                let preservedCode;

                                if (block.isHtml) {
                                    // For HTML code, add preservation markers
                                    preservedCode = `[HTML_CODE_BLOCK_START]${block.code}[HTML_CODE_BLOCK_END]`;
                                } else {
                                    // For non-HTML, preserve as-is
                                    preservedCode = block.code;
                                }

                                // Replace the placeholder with the preserved code
                                processedContent = processedContent.replace(
                                    `[CODE_BLOCK_${i}]`,
                                    `\`\`\`${block.language}\n${preservedCode}\`\`\``
                                );
                            }

                            // Update the message content
                            message.content = processedContent;
                            debugLog('Preserved code blocks with minimal processing');
                        }
                    }
                });
            }
        });

        // Convert the chat history to a JSON string
        const chatHistoryJSON = JSON.stringify(chatHistoryToSave);

        // Log the size of the JSON string
        debugLog(`Chat history JSON size: ${chatHistoryJSON.length} characters`);

        // Save using Android native interface if available, fallback to localStorage
        if (window.AndroidFileOps && typeof window.AndroidFileOps.saveData === 'function') {
            const success = window.AndroidFileOps.saveData('chatHistory', chatHistoryJSON);
            if (success) {
                debugLog('Successfully saved chat history to Android internal storage');
            } else {
                debugError('Failed to save chat history to Android internal storage, falling back to localStorage');
                localStorage.setItem('chatHistory', chatHistoryJSON);
            }
        } else {
            // Fallback for non-Android environments
            localStorage.setItem('chatHistory', chatHistoryJSON);
        }

        persistChatImageStore(nextImageEntries);

        // Verify the data was saved correctly by reading it back
        let savedData;
        if (window.AndroidFileOps && typeof window.AndroidFileOps.loadData === 'function') {
            savedData = window.AndroidFileOps.loadData('chatHistory');
            if (!savedData) {
                savedData = localStorage.getItem('chatHistory');
            }
        } else {
            savedData = localStorage.getItem('chatHistory');
        }

        if (savedData) {
            debugLog(`Verified chat history was saved successfully (${savedData.length} characters)`);

            // Parse the saved data to ensure it's valid JSON
            try {
                const parsedData = JSON.parse(savedData);
                const chatCount = Object.keys(parsedData).length;
                debugLog(`Successfully parsed saved chat history, contains ${chatCount} chats`);
            } catch (parseError) {
                debugError('Error parsing saved chat history:', parseError);
            }
        } else {
            debugError('Failed to verify chat history was saved - storage returned null or empty');
        }
    } catch (error) {
        debugError('Error saving chat history:', error);
    }
}

/**
 * Loads the chat history from localStorage or Android internal storage
 */
export function loadChatHistory() {
    let savedHistory = loadStoredData('chatHistory');
    const imageStore = loadChatImageStore();

    if (savedHistory && savedHistory.trim() !== '') {
        debugLog('Loaded chat history from persistent storage');
    }

    if (savedHistory && savedHistory.trim() !== "") {
        try {
            // Debug: Log the raw saved history
            debugLog('Raw saved history:', savedHistory);

            const loadedChatHistory = JSON.parse(savedHistory);

            // Initialize chatHistoryData as an empty object if not already initialized
            if (!chatHistoryData) {
                chatHistoryData = {};
            }

            // Process each chat entry
            Object.keys(loadedChatHistory).forEach(chatId => {
                const chatData = loadedChatHistory[chatId];

                // Convert old format (array with title property) to new format (object with messages and title)
                if (Array.isArray(chatData)) {
                    // Save the old messages
                    const oldMessages = [...chatData]; // Create a proper copy

                    // Get the title if it exists and clean any <think> tags with double cleaning
                    let oldTitle = null;
                    if (oldMessages.title) {
                        // First cleaning pass
                        oldTitle = removeThinkTags(oldMessages.title);

                        // Check if any tags remain and apply a second pass if needed
                        if (oldTitle.includes('<think>') || oldTitle.includes('</think>') ||
                            oldTitle.includes('&lt;think&gt;') || oldTitle.includes('&lt;/think&gt;')) {
                            debugLog(`Found remaining think tags in title for chat ${chatId} during format conversion, applying second cleaning`);
                            oldTitle = removeThinkTags(oldTitle);
                        }
                    }

                    // Convert to new format
                    chatHistoryData[chatId] = {
                        messages: oldMessages,
                        title: oldTitle,
                    };
                    debugLog(`Converted chat ${chatId} to new format`);
                } else {
                    // For already converted chats, ensure proper structure
                    // Apply double cleaning to ensure titles are completely free of <think> tags
                    let cleanTitle = null;
                    if (chatData.title) {
                        // First cleaning pass
                        cleanTitle = removeThinkTags(chatData.title);

                        // Check if any tags remain and apply a second pass if needed
                        if (cleanTitle.includes('<think>') || cleanTitle.includes('</think>') ||
                            cleanTitle.includes('&lt;think&gt;') || cleanTitle.includes('&lt;/think&gt;')) {
                            debugLog(`Found remaining think tags in title for chat ${chatId} during load, applying second cleaning`);
                            cleanTitle = removeThinkTags(cleanTitle);
                        }
                    }

                    chatHistoryData[chatId] = {
                        messages: Array.isArray(chatData.messages) ? [...chatData.messages] : [],
                        title: cleanTitle,
                    };
                }

                // Get the messages array (now guaranteed to be in the new format)
                const messages = chatHistoryData[chatId].messages;

                // Process each message for backward compatibility and code block handling
                messages.forEach(msg => {
                    if (Array.isArray(msg.content)) {
                        msg.content = getDisplayTextFromMessageContent(msg.content);
                    }

                    // If this is a system message with the topic boundary marker text
                    // but doesn't have the isTopicBoundary flag, add it
                    if (msg.role === 'system' &&
                        msg.content === '--- New Topic ---' &&
                        !msg.hasOwnProperty('isTopicBoundary')) {
                        msg.isTopicBoundary = true;
                    }

                    // Process code blocks but preserve their exact content
                    if (msg.content && typeof msg.content === 'string' && msg.content.includes('```')) {
                        // Clean up any visible HTML markers that may have been incorrectly added
                        // These markers should only be used internally during save/load, not displayed to users
                        if (msg.content.includes('][HTML_CODE_BLOCK_START]') ||
                            msg.content.includes('[HTML_CODE_BLOCK_END]') ||
                            msg.content.includes('[HTML_CODE_BLOCK_START]')) {

                            // Clean up various forms of visible markers
                            msg.content = msg.content.replace(/\]\[HTML_CODE_BLOCK_START\]/g, '');
                            msg.content = msg.content.replace(/\[HTML_CODE_BLOCK_START\]/g, '');
                            msg.content = msg.content.replace(/\[HTML_CODE_BLOCK_END\]/g, '');
                            debugLog('Cleaned up visible HTML markers from message content');
                        }

                        // Only preserve the original content during load - don't add any markers
                        // HTML markers should only be added during save operations, not load operations
                        debugLog('Preserved original code block content on load');
                    }

                    if (Array.isArray(msg.files) && msg.files.length > 0) {
                        msg.files = hydrateFilesFromImageStore(msg.files, imageStore);
                    }
                });

                // Debug: Log if this chat has a title
                if (chatHistoryData[chatId].title) {
                    debugLog(`Chat ${chatId} has title: ${chatHistoryData[chatId].title}`);
                } else {
                    debugLog(`Chat ${chatId} has no title`);
                }
            });

            debugLog('Chat history loaded successfully');
            updateChatHistoryUI();
        } catch (error) {
            debugError('Error loading chat history:', error);
            // If there's an error, initialize with empty chat history
            chatHistoryData = {};
        }
    }
}

/**
 * Checks if text is currently being generated
 * @returns {boolean} - True if text is being generated, false otherwise
 */
export function isGeneratingText() {
    return isGenerating;
}

/**
 * Sets the global abort controller (for external access)
 * @param {AbortController} controller - The abort controller
 */
export function setAbortController(controller) {
    abortController = controller;
}

/**
 * Cleans up incomplete AI responses when generation is cancelled
 */
function cleanupIncompleteAIResponse() {
    // Find the last AI message in the UI
    const aiMessages = messagesContainer.querySelectorAll('.ai');
    if (aiMessages.length > 0) {
        const lastAIMessage = aiMessages[aiMessages.length - 1];
        const contentContainer = lastAIMessage.querySelector('.message-content');

        // If the AI message is empty or only contains whitespace, remove it
        if (contentContainer && (!contentContainer.textContent.trim() || contentContainer.textContent.trim() === '')) {
            debugLog('Removing empty AI message after cancellation');
            lastAIMessage.remove();
        }
    }
}

/**
 * Silently aborts active generation when switching chat context.
 * This avoids cross-chat streaming without adding a "Generation stopped by user" message.
 */
function abortGenerationForChatSwitch(reason = 'chat-switch') {
    if (smartReplyAbortController) {
        try {
            smartReplyAbortController.abort();
        } catch (error) {
            debugLog('Error aborting smart reply generation during chat switch:', error);
        }
        smartReplyAbortController = null;
    }

    if (abortController) {
        debugLog(`Aborting active generation due to ${reason}`);

        const controller = abortController;
        abortController = null;

        try {
            controller.abort();
            setTimeout(() => {
                try {
                    controller.abort();
                } catch (e) {
                    // Ignore second abort errors
                }
            }, 50);
        } catch (error) {
            debugLog('Error aborting active generation during chat switch:', error);
        }
    }

    if (isGenerating) {
        isGenerating = false;
    }

    hideLoadingIndicator();

    const stopButton = document.getElementById('stop-button');
    if (stopButton && !stopButton.classList.contains('hidden')) {
        toggleSendStopButton();
    }

    cleanupIncompleteAIResponse();
}

/**
 * Aborts the current AI response generation
 */
export function abortGeneration() {
    if (abortController) {
        debugLog('Aborting generation...');

        // Save reference to the controller before nullifying it
        const controller = abortController;

        // Immediately set the abort controller to null to prevent any race conditions
        abortController = null;

        // Now abort the controller
        try {
            controller.abort();

            // Second abort attempt for additional safety
            setTimeout(() => {
                try {
                    controller.abort();
                    debugLog('Second abort completed for abort generation');
                } catch (e) {
                    // Ignore any errors on second abort
                }
            }, 50);
        } catch (error) {
            debugLog('Error during abort generation:', error);
        }

        // Reset the generation status flag first
        isGenerating = false;

        // Ensure UI immediately reflects that generation is stopped
        hideLoadingIndicator();
        debugLog('Toggling button back to send...');

        // Only toggle if we're currently showing the stop button
        const stopButton = document.getElementById('stop-button');
        if (stopButton && !stopButton.classList.contains('hidden')) {
            toggleSendStopButton(); // Switch back to send button
        }

        // Clean up any incomplete AI responses
        cleanupIncompleteAIResponse();

        // Add a message to indicate generation was stopped
        appendMessage('system', 'Generation stopped by user');

        debugLog('Text generation aborted successfully');
    } else {
        debugLog('No abort controller found when trying to abort generation');

        // Ensure the UI is reset even if no abort controller exists
        isGenerating = false;
        hideLoadingIndicator();

        // Only toggle if we're currently showing the stop button
        const stopButton = document.getElementById('stop-button');
        if (stopButton && !stopButton.classList.contains('hidden')) {
            toggleSendStopButton(); // Make sure we switch back to send button
        }
    }
}

/**
 * Gets the current chat ID
 * @returns {string} - The current chat ID
 */
export function getCurrentChatId() {
    return currentChatId;
}

/**
 * Sets the current chat ID
 * @param {string} id - The chat ID to set
 */
export function setCurrentChatId(id) {
    currentChatId = id;
}

/**
 * Gets the chat history data
 * @returns {Object} - The chat history data
 */
export function getChatHistoryData() {
    return chatHistoryData;
}

/**
 * Sets the chat to delete
 * @param {string} id - The ID of the chat to delete
 */
export function setChatToDelete(id) {
    chatToDelete = id;
}

/**
 * Gets the chat to delete
 * @returns {string} - The ID of the chat to delete
 */
export function getChatToDelete() {
    return chatToDelete;
}

// Track regeneration attempts to handle browser-specific issues
let regenerationAttemptCount = 0;
let regenerationAttemptTimer = null;

/**
 * Regenerates the last AI response
 * @param {boolean} isRetry - Whether this is a retry attempt
 */
export async function regenerateLastResponse(isRetry = false) {
    try {
        // Clear smart replies before regenerating
        hideSmartReplies();

        // Clear any existing timer
        if (regenerationAttemptTimer) {
            clearTimeout(regenerationAttemptTimer);
        }

        // Reset attempt counter after 5 seconds
        regenerationAttemptTimer = setTimeout(() => {
            regenerationAttemptCount = 0;
        }, 5000);

        debugLog(`Regeneration attempt #${regenerationAttemptCount}`);

        // Force reset isGenerating flag if this is a retry or multiple attempts
        if (isRetry || regenerationAttemptCount > 1) {
            debugLog('Forcing reset of isGenerating flag due to retry or multiple attempts');
            isGenerating = false;
        }

        // Set the generation flag
        isGenerating = true;

        // Ensure first message flag is initialized
        ensureFirstMessageInitialized();

        // Check if there is an active chat
        if (!currentChatId || !chatHistoryData[currentChatId]) {
            appendMessage('error', 'No chat available to regenerate');
            isGenerating = false;
            return;
        }

        // Usage limits check
        if (getUseOpenRouter() || getUseOpenAICompatible()) {
            if (!canSendOpenRouterCompletion()) {
                document.dispatchEvent(new CustomEvent('openRouterLimitReached'));
                isGenerating = false;
                return;
            }
            recordOpenRouterCompletion();
        } else {
            if (!canSendCompletion()) {
                document.dispatchEvent(new CustomEvent('completionLimitReached'));
                isGenerating = false;
                return;
            }
            recordCompletion();
        }

        // Get the chat messages
        const messages = Array.isArray(chatHistoryData[currentChatId])
            ? chatHistoryData[currentChatId]
            : chatHistoryData[currentChatId].messages;

        if (!messages || messages.length === 0) {
            appendMessage('error', 'No messages to regenerate');
            return;
        }

        // Find the last user message
        let lastUserMessageIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMessageIndex = i;
                break;
            }
        }

        if (lastUserMessageIndex === -1) {
            appendMessage('error', 'No user message found to regenerate a response for');
            return;
        }

        // Get the last user message
        const lastUserMsg = messages[lastUserMessageIndex];
        const lastUserMessage = lastUserMsg.content;
        let fileContents = lastUserMsg.files || [];
        
        // Check if the message had web search results stored
        const hadStoredWebSearch = lastUserMsg.hadWebSearch && lastUserMsg.webSearchResults;
        const storedWebSearchResults = hadStoredWebSearch ? lastUserMsg.webSearchResults : null;
        const storedWebSearchSources = hadStoredWebSearch
            ? (() => {
                const clonedSources = cloneWebSearchSources(lastUserMsg.webSearchSources);
                return clonedSources.length > 0
                    ? clonedSources
                    : extractWebSearchSourcesFromContext(storedWebSearchResults);
            })()
            : [];
        let currentTurnWebSearchSources = storedWebSearchSources;

        // Set the generation flag
        isGenerating = true;

        // Create a new abort controller for this request
        abortController = new AbortController();
        const signal = abortController.signal;

        // Clear any AI messages after the last user message
        const filteredMessages = messages.slice(0, lastUserMessageIndex + 1);
        const shouldInlineChatTitle = shouldRequestInlineChatTitle(filteredMessages);
        
        // Build context messages (current turn only, no historical search accumulation)
        const contextMessages = filteredMessages.map(cloneMessageForRequest);

        // Remove existing AI messages from the DOM after the last user message
        const messageElements = Array.from(messagesContainer.children);
        let lastUserMessageElementIndex = -1;

        // Find the last user message element in the DOM
        for (let i = messageElements.length - 1; i >= 0; i--) {
            if (messageElements[i].classList.contains('user')) {
                lastUserMessageElementIndex = i;
                break;
            }
        }

        // Remove all AI messages after the last user message
        if (lastUserMessageElementIndex !== -1) {
            for (let i = messageElements.length - 1; i > lastUserMessageElementIndex; i--) {
                if (messageElements[i].classList.contains('ai')) {
                    debugLog('Removing existing AI message during regeneration');
                    messageElements[i].remove();
                }
            }
        }

        // Show loading indicator and toggle to stop button
        showLoadingIndicator();
        toggleSendStopButton();

        // Prepare variables for the AI message (will be created when first content arrives)
        let aiMessageElement = null;
        let contentContainer = null;

        let aiMessage = '';
        let hasCodeBlock = false; // Track if we detected a code block

        // Declare timeout variables outside try block to ensure they're accessible in finally block
        let streamingTimeoutId;
        let chunkTimeoutId;

        try {
            // Check if the server is running
            if (!(await isServerRunning())) {
                throw new Error('LM Studio server is not running');
            }

            // Get the model to use
            const availableModels = getAvailableModels();
            if (availableModels.length === 0) {
                throw new Error('No models available');
            }

            // Get the system prompt
            // Note: Smart reply instructions are NOT added to the system prompt.
            // They are generated via a separate post-response call instead.

            // Create messages array for the API request
            const apiMessages = [];

            // Add system prompt only if one is explicitly set by the user or we need
            // to request the hidden inline title on the first assistant response.
            appendRequestSystemPrompts(apiMessages, getSystemPrompt(), shouldInlineChatTitle);
            // Note: No default system prompt is added to allow reasoning models to behave naturally


            // Add context messages (current turn only, no historical search accumulation)
            for (const msg of contextMessages) {
                apiMessages.push(cloneMessageForRequest(msg));
            }

            const preparedWebSearch = await prepareWebSearchForRequest({
                userMessage: lastUserMessage,
                requestMessages: apiMessages,
                chatMessages: filteredMessages,
                historyMessages: messages,
                historyUserMessageIndex: lastUserMessageIndex,
                storedPayload: hadStoredWebSearch && storedWebSearchResults
                    ? {
                        context: storedWebSearchResults,
                        sources: storedWebSearchSources,
                        query: typeof lastUserMsg.webSearchQuery === 'string' ? lastUserMsg.webSearchQuery : '',
                        providerName: typeof lastUserMsg.webSearchProviderName === 'string' ? lastUserMsg.webSearchProviderName : '',
                        mode: lastUserMsg.webSearchMode === 'reuse' ? 'reuse' : 'fresh'
                    }
                    : null,
                signal,
                logLabel: 'Regeneration web search decision'
            });

            if (preparedWebSearch.blockedByQuota) {
                return;
            }

            currentTurnWebSearchSources = cloneWebSearchSources(preparedWebSearch.sources);

            if (shouldUseLmStudioNativeMcpChat()) {
                const nativeRequestBody = buildLmStudioMcpRequest(apiMessages, shouldInlineChatTitle);
                const nativeTimeoutMs = getReasoningTimeout() * 1000;
                const timeoutPromise = new Promise((_, reject) => {
                    streamingTimeoutId = setTimeout(() => {
                        if (abortController) {
                            abortController.abort();
                        }
                        reject(new Error('LM Studio MCP regeneration timed out. Please try again.'));
                    }, nativeTimeoutMs);
                });

                debugLog('Regenerating via LM Studio native MCP request:', nativeRequestBody);

                const nativeResult = await Promise.race([
                    sendLmStudioMcpRequest(nativeRequestBody, signal),
                    timeoutPromise
                ]);

                if (streamingTimeoutId) {
                    clearTimeout(streamingTimeoutId);
                }

                aiMessage = nativeResult.aiMessage || 'LM Studio completed the MCP request but returned no visible text.';

                hideLoadingIndicator();
                aiMessageElement = appendMessage('ai', '');
                contentContainer = aiMessageElement.querySelector('.message-content');

                if (!contentContainer) {
                    debugError('Could not find message content container for regenerated LM Studio MCP response');
                    isGenerating = false;
                    return;
                }

                const responsePayload = prepareAssistantResponseForStorage(aiMessage, lastUserMessage, shouldInlineChatTitle);
                aiMessage = appendWebSearchSourcesSection(responsePayload.cleanMessage, currentTurnWebSearchSources);
                if (responsePayload.title && chatHistoryData[currentChatId]) {
                    chatHistoryData[currentChatId].title = responsePayload.title;
                }

                const hideThinking = getHideThinking();
                const finalReasoningState = getReasoningStreamState(aiMessage);

                if (finalReasoningState.hasThinking) {
                    if (hideThinking) {
                        contentContainer.innerHTML = basicSanitizeInput(stripReasoningSections(aiMessage));
                    } else {
                        contentContainer.innerHTML = sanitizeInput(aiMessage);
                    }
                } else {
                    contentContainer.innerHTML = basicSanitizeInput(aiMessage);
                }

                if (containsCodeBlocksOutsideThinkTags(aiMessage)) {
                    setTimeout(() => {
                        initializeCodeMirror(aiMessageElement);
                    }, 100);
                }

                if (getAutoScrollEnabled()) {
                    scrollToBottom(messagesContainer, true);
                }

                if (Array.isArray(chatHistoryData[currentChatId])) {
                    chatHistoryData[currentChatId] = {
                        messages: chatHistoryData[currentChatId].slice(0, lastUserMessageIndex + 1),
                        title: chatHistoryData[currentChatId].title || null,
                    };
                } else {
                    chatHistoryData[currentChatId].messages = chatHistoryData[currentChatId].messages.slice(0, lastUserMessageIndex + 1);
                }

                const assistantMessage = { role: 'assistant', content: aiMessage, model: getSelectedModel() };
                if (nativeResult.responseId) {
                    assistantMessage.lmStudioResponseId = nativeResult.responseId;
                }
                if (currentTurnWebSearchSources.length > 0) {
                    assistantMessage.webSearchSources = cloneWebSearchSources(currentTurnWebSearchSources);
                }
                chatHistoryData[currentChatId].messages.push(assistantMessage);

                saveChatHistory();

                if (isFirstMessage) {
                    debugLog('Setting isFirstMessage to false during LM Studio MCP regeneration');
                    setIsFirstMessage(false);
                }

                updateChatHistoryUI();

                if (getAutoSmartReply()) {
                    showSmartRepliesLoading();
                    generateSmartReplies(lastUserMessage, aiMessage).catch(err => {
                        debugLog('Smart reply generation failed (non-critical):', err);
                    });
                } else {
                    hideSmartReplies();
                }

                if (getHideThinking()) {
                    const thinkingIndicators = document.querySelectorAll('.thinking-indicator');
                    thinkingIndicators.forEach(indicator => {
                        indicator.remove();
                    });

                    import('./settings-manager.js').then(module => {
                        module.removeVisibleThinkTags();
                    });

                    import('./ui-manager.js').then(module => {
                        module.applyThinkingVisibility();
                    });
                }

                debugLog('LM Studio MCP regeneration completed successfully');
                return;
            }

            // Create request body
            const requestBody = {
                model: getSelectedModel(),
                messages: apiMessages,
                temperature: getTemperature(),
                stream: true,
            };

            // Add max_tokens if set
            const maxTokens = getConfiguredMaxTokens();
            if (maxTokens > 0) {
                requestBody.max_tokens = maxTokens;
            }

            applyReasoningOptions(requestBody);

            debugLog('Regenerating with request:', requestBody);

            // Create decoder for handling streamed data
            const decoder = new TextDecoder('utf-8');
            let incompleteChunk = new Uint8Array();
            const sseLineBuffer = { value: '' };

            // Track whether we've already initialized code blocks
            let hasInitializedCodeBlocks = false;

            // Create a timeout for the streaming response (configurable for reasoning models)
            const streamingTimeoutMs = getReasoningTimeout() * 1000; // Convert seconds to milliseconds

            // Create a promise that rejects after the timeout
            const timeoutPromise = new Promise((_, reject) => {
                streamingTimeoutId = setTimeout(() => {
                    if (abortController) {
                        abortController.abort();
                    }
                    reject(new Error('Streaming response timed out during regeneration. This may happen with reasoning models during long thinking processes. Please try again.'));
                }, streamingTimeoutMs);
            });

            // Send request to API with timeout protection
            const regenHeaders = getChatCompletionHeaders();
            const fetchPromise = postChatCompletionWithReasoningFallback(getApiUrl(), regenHeaders, requestBody, signal);

            // Race between fetch and timeout
            const fetchResult = await Promise.race([fetchPromise, timeoutPromise]);
            const response = fetchResult.response;

            // Clear the initial timeout since we got a response
            if (streamingTimeoutId) {
                clearTimeout(streamingTimeoutId);
            }

            if (!response.ok) {
                await throwForApiErrorResponse(response);
            }

            const reader = response.body.getReader();

            // Create a new timeout for the streaming process (reset on each chunk)
            const resetChunkTimeout = () => {
                if (chunkTimeoutId) {
                    clearTimeout(chunkTimeoutId);
                }
                // 2 minutes timeout between chunks (reasoning models may pause during thinking)
                chunkTimeoutId = setTimeout(() => {
                    debugLog('No data received for 2 minutes during regeneration, aborting stream');
                    if (abortController) {
                        abortController.abort();
                    }
                }, 120000); // 2 minutes
            };

            resetChunkTimeout();

            // Track streaming progress for reasoning models (same as initial generation)
            let lastChunkTime = Date.now();
            let isInThinkingProcess = false;
            let thinkingStartTime = null;
            let lastThinkingUiUpdateTime = 0;
            let isHandlingOpenRouterReasoning = false;

            // Process the streaming response
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    if (isHandlingOpenRouterReasoning) {
                        aiMessage += '\n</think>\n';
                        isHandlingOpenRouterReasoning = false;
                    }

                    // Clear chunk timeout when stream is complete
                    if (chunkTimeoutId) {
                        clearTimeout(chunkTimeoutId);
                    }
                    break;
                }

                // Reset timeout since we received data
                resetChunkTimeout();

                // Handle partial UTF-8 sequences
                let processedChunk;
                if (incompleteChunk.length > 0) {
                    processedChunk = new Uint8Array(incompleteChunk.length + value.length);
                    processedChunk.set(incompleteChunk);
                    processedChunk.set(value, incompleteChunk.length);
                    incompleteChunk = new Uint8Array();
                } else {
                    processedChunk = value;
                }

                // Decode the chunk
                let chunkText;
                try {
                    chunkText = decoder.decode(processedChunk, { stream: true });
                } catch (e) {
                    incompleteChunk = processedChunk;
                    debugLog('UTF-8 decoding error, storing chunk for next iteration:', e);
                    continue;
                }

                const events = parseOpenAiCompatibleSseLines(readCompleteSseLines(sseLineBuffer, chunkText));

                for (const data of events) {

                                if (data.choices && data.choices[0] && data.choices[0].delta) {
                                    const delta = data.choices[0].delta;
                                    let chunkContent = '';

                                    const reasoningDeltaText = extractReasoningDeltaText(delta);
                                    if (reasoningDeltaText) {
                                        if (!isHandlingOpenRouterReasoning) {
                                            chunkContent += '<think>\n';
                                            isHandlingOpenRouterReasoning = true;
                                        }
                                        chunkContent += reasoningDeltaText;
                                    }

                                    const contentDeltaText = extractContentDeltaText(delta);
                                    if (contentDeltaText) {
                                        if (isHandlingOpenRouterReasoning) {
                                            chunkContent += '\n</think>\n';
                                            isHandlingOpenRouterReasoning = false;
                                        }
                                        chunkContent += contentDeltaText;
                                    }

                                    if (chunkContent) {
                                        // Create the AI message bubble on first content arrival
                                        if (!aiMessageElement) {
                                            // Hide loading indicator before showing the message
                                            hideLoadingIndicator();

                                            aiMessageElement = appendMessage('ai', '');
                                            contentContainer = aiMessageElement.querySelector('.message-content');

                                            // If we couldn't find a container, log error and stop
                                            if (!contentContainer) {
                                                debugError('Could not find message content container for regenerated AI message');
                                                isGenerating = false;
                                                return;
                                            }
                                        }

                                        aiMessage += chunkContent;
                                        aiMessage = normalizeMalformedCodeFences(normalizeToolCallTags(aiMessage));

                                        // Track thinking process for progress indication (same as initial generation)
                                        const reasoningState = getReasoningStreamState(aiMessage);
                                        const hasThinkTagsNow = reasoningState.hasThinking;
                                        const currentlyInThinking = reasoningState.inThinkingSection;

                                        // Detect start of thinking process
                                        if (!isInThinkingProcess && currentlyInThinking) {
                                            isInThinkingProcess = true;
                                            thinkingStartTime = Date.now();
                                            debugLog('Reasoning model started thinking process during regeneration');
                                        }

                                        // Detect end of thinking process
                                        if (isInThinkingProcess && !currentlyInThinking && aiMessage.includes('</think>')) {
                                            isInThinkingProcess = false;
                                            const thinkingDuration = Date.now() - thinkingStartTime;
                                            debugLog(`Reasoning model completed thinking process in ${thinkingDuration}ms during regeneration`);
                                        }

                                        // Track thinking tags (recalculate each time like in regular function)
                                        const hasThinkTags = reasoningState.hasThinking;

                                        // Check if this is a code block outside of think tags
                                        if (!hasCodeBlock &&
                                            (chunkContent.includes('```') ||
                                                aiMessage.includes('```'))) {

                                            // Only trigger reload for code blocks outside think tags
                                            if (containsCodeBlocksOutsideThinkTags(aiMessage)) {
                                                hasCodeBlock = true;

                                                // Special handling for first message - detect code blocks early
                                                if (isFirstMessage) {
                                                    // Check if we have a complete code block already (outside think tags)
                                                    const contentWithoutThinkTags = aiMessage.replace(/<think>[\s\S]*?<\/think>/g, '');
                                                    const codeBlockStart = contentWithoutThinkTags.indexOf('```');
                                                    const codeBlockEnd = contentWithoutThinkTags.indexOf('```', codeBlockStart + 3);

                                                    // If we have a complete code block in first message (outside think tags),
                                                    // prepare for faster reload by setting up flag
                                                    if (codeBlockStart !== -1 && codeBlockEnd !== -1) {
                                                        debugLog('Complete code block detected outside think tags in first message, preparing for fast reload');
                                                        hasInitializedCodeBlocks = true; // Mark as detected for reload

                                                        // Code block detected - no longer triggering reload
                                                    }
                                                }
                                            }
                                        }

                                        // Apply appropriate sanitization - check if we have content after </think> tags first
                                        const hideThinking = getHideThinking();
                                        const inThinkingSection = reasoningState.inThinkingSection;
                                        const contentAfterThink = reasoningState.contentAfterThink;
                                        const visibleStreamingMessage = removeInlineChatTitleMarkup(reasoningState.normalizedText);

                                        if (hasThinkTags && contentContainer) {
                                            if (hideThinking) {
                                                // When hide thinking is enabled, always hide thinking tags and content
                                                if (contentAfterThink !== "") {
                                                    // We have content after </think>, show ONLY that content (streaming)
                                                    const processedContent = stripReasoningSections(visibleStreamingMessage);
                                                    renderStreamingHtml(basicSanitizeInput(processedContent));

                                                    // Remove any thinking indicator that might exist
                                                    const thinkingIndicator = contentContainer.querySelector('.thinking-indicator');
                                                    if (thinkingIndicator) {
                                                        thinkingIndicator.remove();
                                                    }
                                                } else if (inThinkingSection) {
                                                    // We're in thinking section and hide thinking is enabled, show indicator
                                                    let thinkingIndicator = contentContainer.querySelector('.thinking-indicator');

                                                    // Create thinking indicator if it doesn't exist
                                                    if (!thinkingIndicator) {
                                                        thinkingIndicator = document.createElement('div');
                                                        thinkingIndicator.className = 'thinking-indicator';

                                                        // Enhanced thinking indicator with progress (same as initial generation)
                                                        const thinkingDuration = thinkingStartTime ? Date.now() - thinkingStartTime : 0;
                                                        const durationText = thinkingDuration > 1000 ? ` (${Math.round(thinkingDuration / 1000)}s)` : '';

                                                        thinkingIndicator.innerHTML = `<i class="fas fa-brain"></i>${durationText}`;
                                                        thinkingIndicator.setAttribute('data-thinking-content', '');

                                                        // Clear the container and add the indicator
                                                        contentContainer.innerHTML = '';
                                                        contentContainer.appendChild(thinkingIndicator);
                                                    } else {
                                                        // Update existing indicator with duration (throttled to avoid too frequent updates)
                                                        const now = Date.now();
                                                        if (!lastThinkingUiUpdateTime || now - lastThinkingUiUpdateTime > 100) {
                                                            lastThinkingUiUpdateTime = now;
                                                            const thinkingDuration = thinkingStartTime ? Date.now() - thinkingStartTime : 0;
                                                            const durationText = thinkingDuration > 1000 ? ` (${Math.round(thinkingDuration / 1000)}s)` : '';
                                                            thinkingIndicator.innerHTML = `<i class="fas fa-brain"></i>${durationText}`;
                                                        }
                                                    }

                                                    // Update the data attribute with current thinking content
                                                    if (reasoningState.activeThinkingContent) {
                                                        thinkingIndicator.setAttribute('data-thinking-content', reasoningState.activeThinkingContent);
                                                    }
                                                } else {
                                                    // Hide thinking is enabled but we're not in thinking section and no content after think
                                                    // This means thinking tags are complete but no content after them yet
                                                    const processedContent = stripReasoningSections(visibleStreamingMessage);
                                                    renderStreamingHtml(basicSanitizeInput(processedContent));
                                                }
                                            } else {
                                                // Hide thinking is disabled, show everything including thinking tags (streaming)
                                                renderStreamingHtml(sanitizeInput(visibleStreamingMessage));
                                            }

                                            // Mark this message as having thinking
                                            aiMessageElement.dataset.hasThinking = 'true';
                                        } else if (contentContainer) {
                                            // For non-reasoning models, apply basic sanitization
                                            renderStreamingHtml(basicSanitizeInput(visibleStreamingMessage));
                                            // Mark this message as a non-reasoning model response
                                            aiMessageElement.dataset.hasThinking = 'false';
                                        }

                                        // Only mark code blocks as detected once we see a completed code block
                                        // But don't initialize them yet - defer initialization until after connection is closed
                                        if (hasCodeBlock && aiMessage.includes('```') &&
                                            aiMessage.lastIndexOf('```') > aiMessage.indexOf('```') + 3 &&
                                            !hasInitializedCodeBlocks) {

                                            // Just mark that we've detected code blocks
                                            hasInitializedCodeBlocks = true;
                                        }

                                        // Scroll to bottom during streaming if auto-scroll is enabled
                                        if (getAutoScrollEnabled()) {
                                            scrollToBottom(messagesContainer, true);
                                        }
                                    }
                                }
                }
            }

            parseOpenAiCompatibleSseLines(readCompleteSseLines(sseLineBuffer, '', true)).forEach(data => {
                const delta = data.choices && data.choices[0] && data.choices[0].delta;
                if (!delta) {
                    return;
                }

                let chunkContent = '';
                const reasoningDeltaText = extractReasoningDeltaText(delta);
                if (reasoningDeltaText) {
                    if (!isHandlingOpenRouterReasoning) {
                        chunkContent += '<think>\n';
                        isHandlingOpenRouterReasoning = true;
                    }
                    chunkContent += reasoningDeltaText;
                }

                const contentDeltaText = extractContentDeltaText(delta);
                if (contentDeltaText) {
                    if (isHandlingOpenRouterReasoning) {
                        chunkContent += '\n</think>\n';
                        isHandlingOpenRouterReasoning = false;
                    }
                    chunkContent += contentDeltaText;
                }

                if (chunkContent) {
                    aiMessage += chunkContent;
                    aiMessage = normalizeMalformedCodeFences(normalizeToolCallTags(aiMessage));
                }
            });

            // Handle any remaining UTF-8 data
            if (incompleteChunk.length > 0) {
                const finalChunk = decoder.decode(incompleteChunk);
                aiMessage += finalChunk;
                aiMessage = normalizeMalformedCodeFences(normalizeToolCallTags(aiMessage));
            }

            // Immediately terminate the connection to ensure proper cleanup
            if (abortController) {
                debugLog('Terminating connection after regeneration completion');
                try {
                    abortController.abort();
                    abortController = null;
                } catch (abortError) {
                    debugLog('Error when closing connection during regeneration:', abortError);
                }
            }

            // Smart replies are now generated via a separate post-response call.
            // No extraction from the main aiMessage is needed.

            // Apply final content processing based on thinking tags/settings and strip the
            // hidden inline title marker before rendering or saving the response.
            const responsePayload = prepareAssistantResponseForStorage(aiMessage, lastUserMessage, shouldInlineChatTitle);
            aiMessage = appendWebSearchSourcesSection(responsePayload.cleanMessage, currentTurnWebSearchSources);
            if (responsePayload.title && chatHistoryData[currentChatId]) {
                chatHistoryData[currentChatId].title = responsePayload.title;
            }

            const hideThinking = getHideThinking();
            const finalReasoningState = getReasoningStreamState(aiMessage);
            const hasThinkTags = finalReasoningState.hasThinking;

            if (hasThinkTags) {
                if (contentContainer) {
                    if (hideThinking) {
                        // Hide thinking tags when hide thinking is enabled
                        const processedContent = stripReasoningSections(aiMessage);
                        contentContainer.innerHTML = basicSanitizeInput(processedContent);
                    } else {
                        // Show everything including thinking tags when hide thinking is disabled
                        contentContainer.innerHTML = sanitizeInput(aiMessage);
                    }
                }
            } else if (contentContainer) {
                // No thinking tags, show content normally
                contentContainer.innerHTML = basicSanitizeInput(aiMessage);
            }

            // Only initialize code blocks if they exist outside think tags and we haven't initialized them already
            // Schedule code block initialization after connection is closed
            if (containsCodeBlocksOutsideThinkTags(aiMessage)) {
                setTimeout(() => {
                    initializeCodeMirror(aiMessageElement);
                }, 100);
            }

            if (getAutoScrollEnabled()) {
                scrollToBottom(messagesContainer, true);
            }

            // Update chat history: remove messages after the last user message and add new AI response
            if (Array.isArray(chatHistoryData[currentChatId])) {
                // Convert to new format if needed
                chatHistoryData[currentChatId] = {
                    messages: chatHistoryData[currentChatId].slice(0, lastUserMessageIndex + 1),
                    title: chatHistoryData[currentChatId].title || null,
                };
            } else {
                chatHistoryData[currentChatId].messages = chatHistoryData[currentChatId].messages.slice(0, lastUserMessageIndex + 1);
            }

            // Add the new AI response
            const regeneratedAssistantMessage = { role: 'assistant', content: aiMessage, model: getSelectedModel() };
            if (currentTurnWebSearchSources.length > 0) {
                regeneratedAssistantMessage.webSearchSources = cloneWebSearchSources(currentTurnWebSearchSources);
            }
            chatHistoryData[currentChatId].messages.push(regeneratedAssistantMessage);

            // Make sure to save to localStorage before any other operations
            // This ensures the chat is saved even if there's an issue with subsequent operations
            saveChatHistory();

            // Since this is a regeneration, ensure isFirstMessage is set to false
            if (isFirstMessage) {
                debugLog('Setting isFirstMessage to false during regeneration');
                setIsFirstMessage(false);
            }

            // Update the UI to reflect the changes
            updateChatHistoryUI();

            // Generate smart replies via a separate lightweight call if enabled
            if (getAutoSmartReply()) {
                showSmartRepliesLoading();                               // show placeholder immediately
                generateSmartReplies(lastUserMessage, aiMessage).catch(err => {
                    debugLog('Smart reply generation failed (non-critical):', err);
                });
            } else {
                hideSmartReplies();
            }

            // Final processing for thinking tags
            if (getHideThinking()) {
                // Remove any remaining thinking indicators
                const thinkingIndicators = document.querySelectorAll('.thinking-indicator');
                thinkingIndicators.forEach(indicator => {
                    indicator.remove();
                });

                // Import the removeVisibleThinkTags function to ensure thinking tags are hidden
                import('./settings-manager.js').then(module => {
                    module.removeVisibleThinkTags();
                });

                // Apply the thinking visibility setting to all messages
                import('./ui-manager.js').then(module => {
                    module.applyThinkingVisibility();
                });
            }

            debugLog('Regeneration completed successfully');
        } catch (error) {
            // Clean up timeouts on error
            if (streamingTimeoutId) {
                clearTimeout(streamingTimeoutId);
            }
            if (chunkTimeoutId) {
                clearTimeout(chunkTimeoutId);
            }

            if (error.name === 'AbortError') {
                debugLog('Fetch aborted');
            } else if (error.message === 'OPENROUTER_RATE_LIMITED') {
                appendMessage('error',
                    '<div class="error-message-content">' +
                    '<div class="error-title">Rate limit reached</div>' +
                    '<div class="error-body">' +
                    'OpenRouter has rate-limited this request (429 Too Many Requests).<br>' +
                    'This usually means you\'ve exceeded the free-tier limit for this model. You can:<br>' +
                    '\u2022 Wait a moment, then tap <strong>Try again</strong> below<br>' +
                    '\u2022 Switch to a different model in the <strong>Models</strong> menu<br>' +
                    '\u2022 Add credits to your OpenRouter account at openrouter.ai/credits' +
                    '</div>' +
                    '<div class="error-help-link">' +
                    '<a href="#" onclick="event.preventDefault(); window.regenerateLastResponse && window.regenerateLastResponse();">Try again</a>' +
                    '</div>' +
                    '</div>'
                );
            } else {
                debugError('Error during regeneration:', error);
                appendMessage('error', 'An error occurred while regenerating the response: ' + error.message);
            }
        } finally {
            debugLog('Finalizing regeneration...');

            // Clean up all timeouts
            if (streamingTimeoutId) {
                clearTimeout(streamingTimeoutId);
            }
            if (chunkTimeoutId) {
                clearTimeout(chunkTimeoutId);
            }

            isGenerating = false;

            // Make sure the connection is closed by explicitly aborting
            if (abortController) {
                try {
                    debugLog('Ensuring LLM connection is closed in finally block during regeneration');

                    // Save a reference to the controller before nullifying it
                    const controller = abortController;

                    // Immediately set to null to prevent any further operations on it
                    abortController = null;

                    // Now abort the controller
                    controller.abort();
                } catch (finallyAbortError) {
                    debugLog('Error when ensuring connection closure during regeneration:', finallyAbortError);
                }
            }

            hideLoadingIndicator();

            const stopButton = document.getElementById('stop-button');
            if (stopButton && !stopButton.classList.contains('hidden')) {
                toggleSendStopButton();
            }

            abortController = null;

            // Final check to ensure hide thinking is applied correctly
            if (getHideThinking()) {
                // Remove any remaining thinking indicators
                const thinkingIndicators = document.querySelectorAll('.thinking-indicator');
                thinkingIndicators.forEach(indicator => {
                    indicator.remove();
                });

                // Apply the thinking visibility setting to all messages
                import('./ui-manager.js').then(module => {
                    module.applyThinkingVisibility();
                });

                // Also ensure any thinking indicators are properly handled
                import('./settings-manager.js').then(module => {
                    module.removeVisibleThinkTags();
                });
            }
        }
    } catch (error) {
        debugError('Error in regenerateLastResponse:', error);

        // Special handling for specific error messages
        if (error.message === 'LM_STUDIO_SERVER_NOT_RUNNING') {
            appendMessage('error',
                '<div class="error-message-content">' +
                '<div class="error-title">Unable to connect to LM Studio</div>' +
                '<div class="error-body">' +
                'Please check that:<br>' +
                '• LM Studio application is running<br>' +
                '• The server is started (green play button in LM Studio)<br>' +
                '• Correct IP address and port are configured in Settings' +
                '</div>' +
                '<div class="error-help-link">' +
                '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for detailed setup instructions' +
                '</div>' +
                '</div>'
            );
        } else if (error.message === 'No models available') {
            // Don't show any error message during initial startup
            if (!window.isInitialStartup) {
                appendMessage('error',
                    '<div class="error-message-content">' +
                    '<div class="error-title">No models loaded</div>' +
                    '<div class="error-body">' +
                    'Click the <strong>Models</strong> button in the sidebar to load a model. ' +
                    'You need to load at least one model in LM Studio before sending messages.' +
                    '</div>' +
                    '<div class="error-help-link">' +
                    '<a href="#" onclick="event.preventDefault(); window.openHelpModal && window.openHelpModal();">View Help Guide</a> for more information' +
                    '</div>' +
                    '</div>'
                );
            } else {
                debugLog('Suppressing "No models available" error during initial startup');
            }
        } else {
            appendMessage('error', 'An error occurred: ' + error.message);
        }

        // Reset generation flag
        isGenerating = false;

        // Hide loading indicator
        hideLoadingIndicator();

        // Reset UI state
        const stopButton = document.getElementById('stop-button');
        if (stopButton && !stopButton.classList.contains('hidden')) {
            toggleSendStopButton();
        }
    }
}

/**
 * Strips any preamble/reasoning text that appears before the pipe-separated replies.
 * Handles cases where a model outputs "Here are some suggestions: Reply A | Reply B"
 * without using <think> tags -- the colon-prefixed preamble is detected and removed.
 * @param {string} text - Cleaned text (think-tags already removed)
 * @returns {string}
 */
function stripSmartReplyPreamble(text) {
    if (!text.includes('|')) return text;
    const firstPipe = text.indexOf('|');
    const beforePipe = text.substring(0, firstPipe);
    const lastColon = beforePipe.lastIndexOf(':');
    if (lastColon !== -1) {
        const afterColon = beforePipe.substring(lastColon + 1).trim();
        if (afterColon.length === 0) {
            // Nothing between the colon and the first pipe — the preamble is everything
            // before the first pipe, so skip it and start from the next reply.
            return text.substring(firstPipe + 1).trim();
        }
        const preColon = beforePipe.substring(0, lastColon).trim();
        if (preColon.length > 10) {
            // There is a meaningful preamble before the colon; keep only what follows it.
            return afterColon + text.substring(firstPipe);
        }
    }
    return text;
}

/**
 * Returns true if a reply candidate looks like reasoning/meta-commentary rather than
 * a genuine short user reply.
 *
 * Structural approach: instead of enumerating every possible leaked phrase, we ask:
 *   (a) Is it too long to be a chat message?
 *   (b) Does it contain leftover markup?
 *   (c) Does it contain "meta-words" — words that indicate the text is ABOUT generating
 *       replies rather than BEING a reply?
 *   (d) Does it end with ':' (a header/label line)?
 *   (e) Does it start with a gerund that narrates the user's action rather than voicing it?
 * @param {string} reply
 * @returns {boolean}
 */
function isReasoningText(reply) {
    if (!reply) return true;
    const t = reply.trim();

    // (a) Length guard — prompt asks ≤8 words; allow up to 15 for safety.
    if (t.split(/\s+/).length > 15) return true;
    if (t.length > 100) return true;

    // (b) Leftover tag fragments mean think-tag stripping didn't fully clean this candidate.
    if (/<[a-z\/]/i.test(t)) return true;

    // (b2) Any remaining parenthetical means the candidate still has a meta-annotation.
    if (/\([^)]*\)/.test(t)) return true;

    // (d) Ends with ':' — a label/header line, not a sendable message.
    if (/:\s*$/.test(t)) return true;

    const lower = t.toLowerCase();

    // (c) Meta-word check: does the text talk ABOUT the task rather than being a reply?
    // These terms appear in the model's reasoning about generating replies, not in real
    // user messages. We check them in context to avoid false positives on innocuous uses.
    const META_WORDS = [
        // Task/output framing
        /\b(generat|creat|provid|suggest|craft|formulat)(ing|e|ed)?\s+(a |the |some |these )?(reply|replies|suggestion|response|option)/i,
        // Self-referential commentary about what the user "would" do
        /\b(the user|the human|the person|a user|a person|someone)\s+(would|might|could|should|wants? to|is likely|may)/i,
        // Explicit list/section labels
        /^(possible|suggested?|sample|example|potential|here are|these are)\s+(replies|reply|suggestions?|options?|responses?|messages?)/i,
        // Reasoning-process phrases
        /^(let me|i need to|i should|i will|i('ll| am going to))\s+(think|consider|analyze|generat|provid|come up)/i,
        /^(based on|looking at|considering|given (the|this)|taking into account)/i,
        /^(alright|okay|ok|right|so|well)[,.]?\s+(let('s| me)|i('ll| need| should| will)|the (user|human))/i,
        /^(step \d|first[,:]|now[,:]|next[,:]|finally[,:])/i,
        // Narrating the context or the conversation
        /^(the conversation|the context|the question|the topic|the message|the request|the ai|the model|the assistant|the response)/i,
    ];
    for (const re of META_WORDS) {
        if (re.test(lower)) return true;
    }

    // (e) Gerund narration: present-participle + object describing what the user would do,
    // rather than being the message itself.
    // e.g. "Asking for more jokes", "Expressing appreciation", "Requesting an example"
    // Distinguishable from real messages because a real message would start with a pronoun,
    // interjection, verb, or question word — not a bare -ing word describing an action.
    if (/^[A-Z][a-z]+(ing)\s+(for|about|if|that|to|a|an|the|another|more|with|on|in|my|his|her|their|this|which|how|whether)/.test(t)) return true;

    return false;
}

/**
 * Generates smart reply suggestions via a separate lightweight API call.
 * Called after the main AI response stream has fully completed.
 * This avoids embedding instructions into the main system prompt which
 * causes reasoning models to stop mid-think on their first prompt.
 *
 * @param {string} userMessage - The user's last message
 * @param {string} aiMessage - The AI's raw completed response (may contain think/reasoning tags — stripped internally)
 */
async function generateSmartReplies(userMessage, aiMessage) {
    try {
        if (!(await isServerRunning())) return;

        const availableModels = getAvailableModels();
        if (availableModels.length === 0) return;

        // Use the clean AI message (without think tags) as context.
        // Truncate to keep the call fast — we only need enough context for relevant replies.
        const originalLength = aiMessage.length;
        const cleanAiMessage = removeThinkTags(aiMessage).trim();

        // Debug logging to track think tag removal
        debugLog(`Smart reply context: original=${originalLength} chars, cleaned=${cleanAiMessage.length} chars, removed=${originalLength - cleanAiMessage.length} chars`);

        // Validate that we have meaningful content after removing think tags
        if (!cleanAiMessage) {
            debugLog('Smart reply generation skipped: no content after removing think tags');
            return;
        }

        // Check if the cleaning was too aggressive (removed more than 90% of content),
        // which likely means the model wrapped its entire output in a single reasoning block
        // with malformed or non-standard tags.  Try to extract whatever comes after the last
        // closing reasoning tag of any supported variant.
        if (cleanAiMessage.length < originalLength * 0.1) {
            debugLog('Smart reply generation skipped: think tag removal was too aggressive, likely malformed tags');
            // Find the position of the last closing reasoning tag across all supported variants
            const closingTags = ['</think>', '</thinking>', '</reason>', '</reasoning>'];
            let lastTagEnd = -1;
            for (const tag of closingTags) {
                const idx = aiMessage.toLowerCase().lastIndexOf(tag);
                if (idx !== -1) {
                    const end = idx + tag.length;
                    if (end > lastTagEnd) lastTagEnd = end;
                }
            }
            if (lastTagEnd !== -1) {
                const fallbackContent = aiMessage.substring(lastTagEnd).trim();
                if (fallbackContent.length > 10) {
                    debugLog('Using fallback: extracting content after last closing reasoning tag');
                    const contextSnippet = fallbackContent.length > 800
                        ? fallbackContent.slice(-800)
                        : fallbackContent;
                    await generateSmartRepliesAPI(userMessage, contextSnippet, availableModels[0]);
                    return;
                }
            }
            return;
        }

        const contextSnippet = cleanAiMessage.length > 800
            ? cleanAiMessage.slice(-800)   // last 800 chars gives the final/relevant portion
            : cleanAiMessage;

        const smartReplySystemPrompt =
            'You are generating quick-reply button text for a chat app. ' +
            'You will be given a conversation: the human\'s message followed by the AI assistant\'s response. ' +
            'Output 3 short messages the human would type next — actual words they would send, not a description of what they might say. ' +
            'WRONG (description): "Asking for another joke" — RIGHT (actual message): "Tell me another one!" ' +
            'WRONG (description): "Expressing that they enjoyed it" — RIGHT (actual message): "Ha, that was great!" ' +
            'Each reply must feel like a real, natural follow-up given both the original question and the AI\'s answer. ' +
            'Keep each reply under 8 words. No trailing parentheses, no labels, no explanations. ' +
            'Output exactly 3 replies separated by "|" and nothing else.';

        const requestBody = {
            model: availableModels[0],
            messages: [
                { role: 'system', content: smartReplySystemPrompt },
                { role: 'user', content: userMessage },
                { role: 'assistant', content: contextSnippet },
                { role: 'user', content: '3 replies I could send next, pipe-separated:' }
            ],
            temperature: 0.7,
            stream: false,
            // Generous token budget: reasoning models need room to think before outputting
            // replies. 80 was too small — the model would exhaust its budget inside <think>.
            max_tokens: 500,
        };

        applyReasoningOptions(requestBody);

        const requestHeaders = { 'Content-Type': 'application/json' };
        if (!getUseOpenRouter() && !getUseOpenAICompatible() && !getUseOllama()) {
            const lmToken = getLMStudioApiToken();
            if (lmToken) {
                requestHeaders['Authorization'] = `Bearer ${lmToken}`;
            }
        }

        const { response } = await postChatCompletionWithReasoningFallback(getApiUrl(), requestHeaders, requestBody);

        if (!response.ok) return;

        const data = await response.json();
        const rawText = data?.choices?.[0]?.message?.content?.trim();
        if (!rawText) return;

        // Strip any think tags the model may have generated
        const cleanText = removeThinkTags(rawText).trim();
        if (!cleanText) return;

        // Strip any preamble the model may have prepended before the actual replies
        // (e.g. "Here are 3 suggestions: Reply A | Reply B | Reply C")
        const replyText = stripSmartReplyPreamble(cleanText);

        // --- Robust multi-format parsing ---
        // Helper: strip label prefixes, trailing annotations, and spurious trailing punctuation
        // that a reasoning model may add.
        // e.g. "Reply 1: ...", "Option 2- ...", "... (4 words)", "... (~3 words)"
        // Also removes a trailing "?" from replies that don't actually start with a question
        // word — the model often appends "?" to statements/requests as well as questions.
        const QUESTION_START = /^(what|when|where|who|which|why|how|is|are|was|were|do|does|did|can|could|would|should|will|have|has|had|may|might)\b/i;
        const stripLabel = r => {
            let s = r
                .replace(/^(?:reply|option|suggestion)\s*\d*\s*[:.-]\s*/i, '')
                // Strip ALL trailing parentheticals — word counts, reasoning notes, etc.
                // e.g. "(4 words)", "(since they asked)", "(follow-up)"
                .replace(/\s*\([^)]*\)\s*$/i, '')
                .trim();
            // Remove trailing '?' only when the reply is not a genuine question
            if (s.endsWith('?') && !QUESTION_START.test(s)) {
                s = s.slice(0, -1).trimEnd();
            }
            return s;
        };

        // Primary: pipe-separated  "Reply one|Reply two|Reply three"
        let replies = replyText
            .split('|')
            .map(r => stripLabel(r.trim()))
            .filter(r => r.length > 0 && !isReasoningText(r));

        // Fallback: newline-separated (numbered "1. X", bulleted "- X", or plain)
        if (replies.length < 2) {
            replies = replyText
                .split(/\n/)
                .map(r => stripLabel(r.replace(/^[\d]+[.)]\s*/, '').replace(/^[-*•]\s*/, '').trim()))
                .filter(r => r.length > 0 && !isReasoningText(r));
        }

        // Fallback: semicolons
        if (replies.length < 2) {
            replies = replyText
                .split(';')
                .map(r => stripLabel(r.trim()))
                .filter(r => r.length > 0 && !isReasoningText(r));
        }

        // Keep at most 3 suggestions
        replies = replies.slice(0, 3);

        if (replies.length > 0) {
            renderSmartReplies(replies);
        } else {
            hideSmartReplies();
        }
    } catch (err) {
        debugLog('generateSmartReplies error (non-critical):', err);
        hideSmartReplies();
    }
}


/**
 * Helper function to make the actual API call for smart reply generation
 * @param {string} userMessage - The user's last message
 * @param {string} contextSnippet - The context snippet to use
 * @param {string} model - The model to use for generation
 */
async function generateSmartRepliesAPI(userMessage, contextSnippet, model) {
    try {
        const smartReplySystemPrompt =
            'You are generating quick-reply button text for a chat app. ' +
            'You will be given a conversation: the human\'s message followed by the AI assistant\'s response. ' +
            'Output 3 short messages the human would type next — actual words they would send, not a description of what they might say. ' +
            'WRONG (description): "Asking for another joke" — RIGHT (actual message): "Tell me another one!" ' +
            'WRONG (description): "Expressing that they enjoyed it" — RIGHT (actual message): "Ha, that was great!" ' +
            'Each reply must feel like a real, natural follow-up given both the original question and the AI\'s answer. ' +
            'Keep each reply under 8 words. No trailing parentheses, no labels, no explanations. ' +
            'Output exactly 3 replies separated by "|" and nothing else.';

        const requestBody = {
            model: model,
            messages: [
                { role: 'system', content: smartReplySystemPrompt },
                { role: 'user', content: userMessage },
                { role: 'assistant', content: contextSnippet },
                { role: 'user', content: '3 replies I could send next, pipe-separated:' }
            ],
            temperature: 0.7,
            stream: false,
            // Generous token budget: reasoning models need room to think before outputting
            // replies. 80 was too small — the model would exhaust its budget inside </think>.
            max_tokens: 500,
        };

        applyReasoningOptions(requestBody);

        smartReplyAbortController = new AbortController();

        const requestHeaders = { 'Content-Type': 'application/json' };
        if (!getUseOpenRouter() && !getUseOpenAICompatible() && !getUseOllama()) {
            const lmToken = getLMStudioApiToken();
            if (lmToken) {
                requestHeaders['Authorization'] = `Bearer ${lmToken}`;
            }
        }

        const { response } = await postChatCompletionWithReasoningFallback(
            getApiUrl(),
            requestHeaders,
            requestBody,
            smartReplyAbortController.signal
        );

        if (!response.ok) {
            smartReplyAbortController = null;
            return;
        }

        const data = await response.json();
        smartReplyAbortController = null;

        const rawText = data?.choices?.[0]?.message?.content?.trim();
        if (!rawText) return;

        // Strip any think tags the model may have generated
        const cleanText = removeThinkTags(rawText).trim();
        if (!cleanText) return;

        // Strip any preamble the model may have prepended before the actual replies
        // (e.g. "Here are 3 suggestions: Reply A | Reply B | Reply C")
        const replyText = stripSmartReplyPreamble(cleanText);

        // --- Robust multi-format parsing ---
        // Helper: strip label prefixes, trailing annotations, and spurious trailing punctuation
        // that a reasoning model may add.
        // e.g. "Reply 1: ...", "Option 2- ...", "... (4 words)", "... (~3 words)"
        // Also removes a trailing "?" from replies that don't actually start with a question
        // word — the model often appends "?" to statements/requests as well as questions.
        const QUESTION_START = /^(what|when|where|who|which|why|how|is|are|was|were|do|does|did|can|could|would|should|will|have|has|had|may|might)\b/i;
        const stripLabel = r => {
            let s = r
                .replace(/^(?:reply|option|suggestion)\s*\d*\s*[:.-]\s*/i, '')
                // Strip ALL trailing parentheticals — word counts, reasoning notes, etc.
                // e.g. "(4 words)", "(since they asked)", "(follow-up)"
                .replace(/\s*\([^)]*\)\s*$/i, '')
                .trim();
            // Remove trailing '?' only when the reply is not a genuine question
            if (s.endsWith('?') && !QUESTION_START.test(s)) {
                s = s.slice(0, -1).trimEnd();
            }
            return s;
        };

        // Primary: pipe-separated  "Reply one|Reply two|Reply three"
        let replies = replyText
            .split('|')
            .map(r => stripLabel(r.trim()))
            .filter(r => r.length > 0 && !isReasoningText(r));

        // Fallback: newline-separated (numbered "1. X", bulleted "- X", or plain)
        if (replies.length < 2) {
            replies = replyText
                .split(/\n/)
                .map(r => stripLabel(r.replace(/^[\d]+[.)]\s*/, '').replace(/^[-*•]\s*/, '').trim()))
                .filter(r => r.length > 0 && !isReasoningText(r));
        }

        // Fallback: semicolons
        if (replies.length < 2) {
            replies = replyText
                .split(';')
                .map(r => stripLabel(r.trim()))
                .filter(r => r.length > 0 && !isReasoningText(r));
        }

        // Keep at most 3 suggestions
        replies = replies.slice(0, 3);

        if (replies.length > 0) {
            renderSmartReplies(replies);
        } else {
            hideSmartReplies();
        }
    } catch (err) {
        debugLog('generateSmartRepliesAPI error (non-critical):', err);
        hideSmartReplies();
    }
}


// Add this new function for faster chat history updates before reload
/**
 * Updates the chat history without UI updates for faster reloads
 * @param {string} userMessage - The user's message
 * @param {string} aiMessage - The AI's response
 * @param {Array} fileContents - Optional array of file contents
 */
async function fastUpdateChatHistoryBeforeReload(userMessage, aiMessage, fileContents = [], options = {}) {
    debugLog('Fast update of chat history before reload');

    // Ensure chatHistoryData is initialized
    if (!chatHistoryData) {
        chatHistoryData = {};
    }

    // Initialize chat data structure if it doesn't exist
    if (!chatHistoryData[currentChatId]) {
        // Create a proper structure for the chat with messages array and metadata
        chatHistoryData[currentChatId] = {
            messages: [],
            title: null,
            characterId: null
        };
    }

    // If the chat data is still in the old format (just an array), convert it
    if (Array.isArray(chatHistoryData[currentChatId])) {
        // Save the old messages
        const oldMessages = [...chatHistoryData[currentChatId]];
        // Get the title if it exists and clean any <think> tags
        const oldTitle = oldMessages.title ? removeThinkTags(oldMessages.title) : null;
        // Convert to new format
        chatHistoryData[currentChatId] = {
            messages: oldMessages,
            title: oldTitle,
            characterId: null
        };
    }

    // Get a reference to the messages array
    const messages = chatHistoryData[currentChatId].messages || [];

    // Make sure messages array exists
    if (!chatHistoryData[currentChatId].messages) {
        chatHistoryData[currentChatId].messages = messages;
    }

    // Create user message object
    const userMsg = { role: 'user', content: userMessage };

    // Store file attachments if any
    if (fileContents && fileContents.length > 0) {
        userMsg.files = fileContents;
    }

    // Check if we're adding a duplicate message
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    // Only add the user message if it's not already the last message in the history
    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== userMessage) {
        messages.push(userMsg);
    }

    const shouldCaptureInlineTitle = messages.length === 1 && getAutoGenerateTitles();
    const responsePayload = prepareAssistantResponseForStorage(aiMessage, userMessage, shouldCaptureInlineTitle);

    if (responsePayload.title) {
        chatHistoryData[currentChatId].title = responsePayload.title;
        debugLog('Stored inline-generated chat title during fast save:', responsePayload.title);
    }

    const assistantMessage = { role: 'assistant', content: responsePayload.cleanMessage, model: getSelectedModel() };
    if (options.lmStudioResponseId) {
        assistantMessage.lmStudioResponseId = options.lmStudioResponseId;
    }
    if (Array.isArray(options.webSearchSources) && options.webSearchSources.length > 0) {
        assistantMessage.webSearchSources = cloneWebSearchSources(options.webSearchSources);
    }

    // Add the AI response
    messages.push(assistantMessage);

    // Just save to localStorage quickly without UI updates
    try {
        const chatHistoryJSON = JSON.stringify(chatHistoryData);
        localStorage.setItem('chatHistory', chatHistoryJSON);
        debugLog('Fast chat history save complete before reload');
    } catch (error) {
        debugError('Error saving chat history before reload:', error);
    }
}

/**
 * Adds a user message to the chat history immediately
 * @param {string} userMessage - The user's message
 * @param {Array} fileContents - Optional array of file contents
 */
export async function addUserMessageToHistory(userMessage, fileContents = []) {
    // Ensure chatHistoryData is initialized
    if (!chatHistoryData) {
        chatHistoryData = {};
    }

    // Initialize chat data structure if it doesn't exist
    if (!chatHistoryData[currentChatId]) {
        // Create a proper structure for the chat with messages array and metadata
        chatHistoryData[currentChatId] = {
            messages: [],
            title: null, // Initialize with no title
        };
    }

    // If the chat data is still in the old format (just an array), convert it
    if (Array.isArray(chatHistoryData[currentChatId])) {
        // Save the old messages
        const oldMessages = [...chatHistoryData[currentChatId]]; // Create a proper copy
        // Get the title if it exists and clean any <think> tags
        const oldTitle = oldMessages.title ? removeThinkTags(oldMessages.title) : null;
        // Convert to new format
        chatHistoryData[currentChatId] = {
            messages: oldMessages,
            title: oldTitle,
        };
    }

    // Ensure messages array exists
    if (!chatHistoryData[currentChatId].messages) {
        chatHistoryData[currentChatId].messages = [];
    }

    // Get a reference to the messages array
    const messages = chatHistoryData[currentChatId].messages;

    // Create user message object
    const userMsg = { role: 'user', content: userMessage };

    // Store file attachments separately without modifying the user message content
    if (fileContents && fileContents.length > 0) {
        debugLog(`Adding ${fileContents.length} files to chat history`);
        userMsg.files = fileContents;
        debugLog(`Files added to chat history: ${fileContents.map(f => f.name).join(', ')}`);
    }

    // Check if we're adding a duplicate message (can happen with regeneration)
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    // Only add the user message if it's not already the last message in the history
    // This prevents duplicate user messages when regenerating responses
    if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== userMessage) {
        messages.push(userMsg);

        // Save the updated chat history
        saveChatHistory();

        // Update the UI after saving
        updateChatHistoryUI();
    }
}

