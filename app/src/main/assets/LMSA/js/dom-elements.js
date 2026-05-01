// DOM Elements - Optimized with lazy loading and memory management
class DOMElementCache {
    constructor() {
        this.cache = new Map();
        this.observer = null;
        this.isObserving = false;
        this.setupObserver();
        this.setupCleanup();
    }

    get(id) {
        if (this.cache.has(id)) {
            const element = this.cache.get(id);
            // Check if element is still in DOM
            if (element && document.contains(element)) {
                return element;
            } else {
                // Element was removed, clean up cache
                this.cache.delete(id);
            }
        }

        // Get fresh element
        const element = document.getElementById(id);
        if (element) {
            this.cache.set(id, element);
        }
        return element;
    }

    setupObserver() {
        if (!window.MutationObserver) return;

        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    this.pruneDetachedElements();
                    break;
                }
            }
        });

        const startObserving = () => {
            if (!document.body || this.isObserving) return;
            this.observer.observe(document.body, { childList: true, subtree: true });
            this.isObserving = true;
        };

        startObserving();
        if (!this.isObserving) {
            document.addEventListener('DOMContentLoaded', startObserving, { once: true });
        }
    }

    pruneDetachedElements() {
        const keysToDelete = [];
        for (const [id, element] of this.cache) {
            if (!element || !document.contains(element)) {
                keysToDelete.push(id);
            }
        }
        keysToDelete.forEach((id) => {
            this.cache.delete(id);
        });
    }

    setupCleanup() {
        // Clean up cache periodically
        setInterval(() => {
            this.pruneDetachedElements();
        }, 60000); // Clean up every minute
    }

    clear() {
        this.cache.clear();
        if (this.observer) {
            this.observer.disconnect();
            this.isObserving = false;
        }
    }
}

const domCache = new DOMElementCache();

// Core elements that are always needed
export const chatContainer = domCache.get('chat-container');
export const messagesContainer = domCache.get('messages');
export const chatForm = domCache.get('chat-form');
export const userInput = domCache.get('user-input');
export const chatInputArea = domCache.get('chat-input-area');
export const loadingIndicator = domCache.get('loading-indicator');
export const sidebar = domCache.get('sidebar');

// Lazy-loaded elements that may not always be present
export const serverIpInput = domCache.get('server-ip');
export const serverPortInput = domCache.get('server-port');
export const systemPromptInput = domCache.get('system-prompt');
export const clearChatButton = domCache.get('clear-chat');
export const newTopicButton = null; // Explicitly null as noted
export const newChatButton = domCache.get('new-chat');
export const chatHistory = domCache.get('chat-history');
export const settingsButton = domCache.get('settings-btn');
export const settingsIconButton = domCache.get('settings-icon-button');
export const settingsModal = domCache.get('settings-modal');
export const closeSettingsButton = domCache.get('close-settings');
export const closeSettingsXButton = domCache.get('close-settings-x');
export const welcomeMessage = domCache.get('welcome-message');
export const sidebarToggle = domCache.get('sidebar-toggle');
export const closeSidebarButton = domCache.get('close-sidebar');
export const loadedModelDisplay = domCache.get('loaded-model');
export const hideThinkingCheckbox = domCache.get('hide-thinking');
export const autoGenerateTitlesCheckbox = domCache.get('auto-generate-titles');
export const openRouterToggleCheckbox = domCache.get('openrouter-toggle');
export const openRouterApiKeyInput = domCache.get('openrouter-api-key');
export const openAICompatibleToggleCheckbox = domCache.get('openai-compatible-toggle');
export const openAICompatibleEndpointInput = domCache.get('openai-compatible-endpoint');
export const openAICompatibleApiKeyInput = domCache.get('openai-compatible-api-key');
export const autoSmartReplyCheckbox = domCache.get('auto-smart-reply');
export const smartRepliesContainer = domCache.get('smart-replies-container');
export const ollamaToggleCheckbox = domCache.get('ollama-toggle');
export const showModelLabelCheckbox = domCache.get('show-model-label');

export const refreshButton = document.getElementById('refresh-button');
export const modelToggleButton = document.getElementById('model-toggle-button');
export const helpButton = document.getElementById('help-btn');
export const whatsNewButton = document.getElementById('whats-new-btn');
export const aboutButton = document.getElementById('about-btn');
export const modelButton = document.getElementById('model-btn');
export const newChatHeaderButton = document.getElementById('new-chat-header-button');
export const webSearchHeaderButton = document.getElementById('web-search-header-button');
export const webSearchHeaderIcon = document.getElementById('web-search-header-icon');
export const modeIndicator = document.getElementById('mode-indicator');
export const dashboardButton = domCache.get('dashboard-btn');

// Import/Export group elements
export const importExportGroupButton = document.getElementById('import-export-group-btn');
export const importExportContainer = document.getElementById('import-export-container');

// Export/Import elements
export const exportChatsButton = document.getElementById('export-chats-btn');
export const importChatsButton = document.getElementById('import-chats-btn');
export const importChatsInput = document.getElementById('import-chats-input');
export const importModal = document.getElementById('import-modal');
export const cancelImportButton = document.getElementById('cancel-import');
export const confirmImportButton = document.getElementById('confirm-import');
export const importStatusContainer = document.getElementById('import-status');
export const importStatusMessage = document.getElementById('import-status-message');

// Import Success modal elements
export const importSuccessModal = document.getElementById('import-success-modal');
export const importSuccessMessage = document.getElementById('import-success-message');
export const closeImportSuccessButton = document.getElementById('close-import-success');

// Export Confirmation modal elements
export const exportConfirmationModal = document.getElementById('export-confirmation-modal');
export const exportConfirmationMessage = document.getElementById('export-confirmation-message');
export const confirmExportButton = document.getElementById('confirm-export');
export const cancelExportButton = document.getElementById('cancel-export');

// Export Success modal elements
export const exportSuccessModal = document.getElementById('export-success-modal');
export const exportSuccessMessage = document.getElementById('export-success-message');
export const closeExportSuccessButton = document.getElementById('close-export-success');

// File upload elements
export const fileUploadButton = document.getElementById('file-upload-button');
export const paperclipButton = document.getElementById('paperclip-button');
export const fileUploadInput = document.getElementById('file-upload-input');

// Send and stop buttons
export const sendButton = document.getElementById('send-button');
export const stopButton = document.getElementById('stop-button');

// Confirmation modal elements
export const confirmationModal = document.getElementById('confirmation-modal');
export const confirmActionButton = document.getElementById('confirm-action');
export const cancelActionButton = document.getElementById('cancel-action');
export const confirmationMessage = document.getElementById('confirmation-message');

// Context menu elements
export const contextMenu = document.getElementById('context-menu');
export const copyTextButton = document.getElementById('copy-text');
export const regenerateTextButton = document.getElementById('regenerate-text');

// Send button context menu elements
export const sendContextMenu = document.getElementById('send-context-menu');
export const newTopicMenuButton = document.getElementById('new-topic-menu-button');
export const scrollToBottomMenuButton = document.getElementById('scroll-to-bottom-menu-button');

// Exit button
export const exitButton = document.getElementById('exit-btn');

// Model modal elements
export const modelModal = document.getElementById('model-modal');
export const closeModelButton = document.getElementById('close-model');
export const currentModelDisplay = document.getElementById('current-model');
export const availableModelsList = document.getElementById('available-models-list');
export const refreshModelsButton = document.getElementById('refresh-models-btn');

// Full Model Name modal elements
export const fullModelNameModal = document.getElementById('full-model-name-modal');
export const closeFullModelNameButton = document.getElementById('close-full-model-name');
export const fullModelNameDisplay = document.getElementById('full-model-name');
export const modelHeaderIcon = document.getElementById('model-header-icon');

// Model Loading modal elements
export const modelLoadingModal = document.getElementById('model-loading-modal');
export const modelLoadingTitle = document.getElementById('model-loading-title');
export const modelLoadingMessage = document.getElementById('model-loading-message');
export const modelLoadingName = document.getElementById('model-loading-name');

// Welcome screen buttons
export const getStartedBtn = document.getElementById('get-started-btn');
export const welcomeModelsBtn = document.getElementById('welcome-models-btn');
export const welcomeNewChatBtn = document.getElementById('welcome-new-chat-btn');
export const welcomeHelpBtn = document.getElementById('welcome-help-btn');

// Saved System Prompts Elements
export const savedPromptsButton = document.getElementById('saved-prompts-btn');
export const saveSystemPromptButton = document.getElementById('save-system-prompt-btn');
export const savedPromptsModal = document.getElementById('saved-prompts-modal');
export const closeSavedPromptsModal = document.getElementById('close-saved-prompts-modal');
// Confirm Default Model Modal Elements
export const confirmDefaultModelModal = document.getElementById('confirm-default-model-modal');
export const confirmDefaultModelTitle = document.getElementById('confirm-default-model-title');
export const confirmDefaultModelName = document.getElementById('confirm-default-model-name');
export const confirmDefaultModelBtn = document.getElementById('confirm-default-model-btn');
export const cancelDefaultModelBtn = document.getElementById('cancel-default-model-btn');
