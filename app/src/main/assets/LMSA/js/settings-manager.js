// Settings Manager for handling application settings
import {
  systemPromptInput,
  hideThinkingCheckbox,
  autoGenerateTitlesCheckbox,
  autoSmartReplyCheckbox,
  ollamaToggleCheckbox,
  openRouterToggleCheckbox,
  openRouterApiKeyInput,
  openAICompatibleToggleCheckbox,
  openAICompatibleEndpointInput,
  openAICompatibleApiKeyInput,
  showModelLabelCheckbox,
  swipeNavigationCheckbox,
  modeIndicator,
  serverIpInput,
  serverPortInput,
  contextLengthInput,
  contextLengthValue
} from "./dom-elements.js";


import { applyThinkingVisibility, refreshAllMessages, applyModelLabelVisibility } from "./ui-manager.js";
import { refreshChatScrollbar } from "./chat-scrollbar.js";
import { debugLog, refreshAllCodeBlocks } from "./utils.js";
import { showSmartReplyWarningModal } from "./components/modals/smart-reply-warning-modal.js";
import { showOpenRouterWarningModal } from "./components/modals/openrouter-warning-modal.js";
import { showWebSearchWarningModal } from "./components/modals/web-search-warning-modal.js";
import { showToastNotice } from "./toast-notice.js";



// Helper to get biometric bridge (supports both AndroidBiometrics and AndroidBiometric names)
function getBiometricBridge() {
  if (typeof AndroidBiometrics !== 'undefined') return AndroidBiometrics;
  if (typeof window.AndroidBiometrics !== 'undefined') return window.AndroidBiometrics;
  if (typeof AndroidBiometric !== 'undefined') return AndroidBiometric;
  if (typeof window.AndroidBiometric !== 'undefined') return window.AndroidBiometric;
  return null;
}

// Check if device supports biometric authentication
function isBiometricSupported() {
  try {
    const bridge = getBiometricBridge();
    if (!bridge || typeof bridge.isBiometricSupported !== 'function') return false;
    return !!bridge.isBiometricSupported();
  } catch (e) {
    console.warn('[Biometric] Support check failed:', e);
    return false;
  }
}

// Default system prompt is empty unless user explicitly sets one
const DEFAULT_SYSTEM_PROMPT = "";

let systemPrompt = DEFAULT_SYSTEM_PROMPT;
let isUserCreatedSystemPrompt = false; // Flag to track if the system prompt was created by the user
let temperature = 0.3;
let maxTokens = 0;
let hideThinking = false;
let autoGenerateTitles = false;
let autoSmartReply = false;
let useOllama = false;
let autoScrollEnabled = false; // Auto-scroll to bottom during LLM streaming
let enterSendsNewline = false; // If true, Enter creates a new line, Shift+Enter sends
let reasoningTimeout = 300; // Default 5 minutes for reasoning models (in seconds)
let defaultModelId = null; // Default model to auto-select when models load
let selectedTTSVoice = null; // Selected TTS voice name
let contextLength = 0; // Saved app-managed context length override value
let contextLengthOverrideEnabled = false;
let pendingResetCallback = null; // Pending callback for reset-to-default confirmation modal
let useOpenRouter = false; // Use OpenRouter cloud API
let openRouterApiKey = ''; // OpenRouter API key
let useOpenAICompatible = false; // Use custom OpenAI-compatible endpoint
let openAICompatibleEndpoint = ''; // Base URL or chat completions URL
let openAICompatibleApiKey = ''; // Optional API key for custom endpoint
let lmStudioApiToken = ''; // Optional LM Studio API token for authenticated servers
let lmStudioMcpIntegrations = []; // Optional LM Studio native chat integrations payload
let reasoningLevel = 'default'; // Thinking effort level (default, disabled, low, medium, high)
let otterBurrowMap = ''; // Web search provider key map
let resetTemperatureLockState = null;
let resetContextLengthLockState = null;

const CONTEXT_LENGTH_OVERRIDE_STORAGE_KEY = 'contextLengthOverrideEnabled';
const MIN_CONTEXT_LENGTH_OVERRIDE = 256;
const MAX_CONTEXT_LENGTH_OVERRIDE = 200000;
const CONTEXT_LENGTH_TOUCH_INTENT_THRESHOLD = 12;
const CONTEXT_LENGTH_VERTICAL_SCROLL_BIAS = 1.2;
const CONTEXT_LENGTH_PRESET_VALUES = [
  256,
  512,
  1024,
  2048,
  4096,
  8192,
  16384,
  32768,
  65536,
  131072,
  200000
];
let contextLengthSliderPresets = [...CONTEXT_LENGTH_PRESET_VALUES];

const IMAGE_GENERATION_COUNT_KEY = 'imageGenerationCount';
export const FREE_IMAGE_GENERATION_LIMIT = 2;

export function resetSettingsModalLocks() {
  if (typeof resetTemperatureLockState === 'function') {
    resetTemperatureLockState();
  }

  if (typeof resetContextLengthLockState === 'function') {
    resetContextLengthLockState();
  }
}

/**
 * Checks if the application has a valid connection configuration
 * @returns {boolean}
 */
export function isAppConfigured() {
  if (useOpenRouter) {
    return !!openRouterApiKey && openRouterApiKey.trim().length > 0;
  }
  
  if (useOpenAICompatible) {
    return !!openAICompatibleEndpoint && openAICompatibleEndpoint.trim().length > 0;
  }
  
  // Local server mode
  const serverIp = localStorage.getItem('serverIp');
  const serverPort = localStorage.getItem('serverPort');
  return !!(serverIp && serverPort);
}

let showModelLabel = true; // Show model name on AI message bubbles
let showChatScrollbar = false; // Show scrollbar in chat message area
let showScrollToBottom = true; // Show scroll to bottom button in chat
let chatFontFamily = 'system-ui, sans-serif'; // Font family for chat message bubbles
let chatFontSize = '16px'; // Font size for chat message bubbles
let requireBiometric = false; // Require biometric unlock on app start
let webSearchEnabled = false;
let swipeNavigationEnabled = false; // Swipe navigation is disabled by default
const MODE_ACTIVITY_STORAGE_KEY = 'modeActivityByProvider';

const ALLOWED_CHAT_FONT_SIZES = ['12px', '14px', '16px', '20px', '24px'];

function initializeSettingsToggleCards() {
  const toggleCards = document.querySelectorAll('#settings-modal .settings-item-toggle[data-toggle-checkbox]');

  toggleCards.forEach((card) => {
    if (card.dataset.toggleCardBound === 'true') {
      return;
    }

    card.addEventListener('click', (event) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.closest('a, button, select, textarea, label.settings-item-label, input:not(.settings-checkbox)')) {
        return;
      }

      const checkboxId = card.dataset.toggleCheckbox;
      if (!checkboxId) {
        return;
      }

      const checkbox = document.getElementById(checkboxId);
      if (!(checkbox instanceof HTMLInputElement) || checkbox.disabled) {
        return;
      }

      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    card.dataset.toggleCardBound = 'true';
  });
}

function parseStoredMaxTokens(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    return 0;
  }

  if (!/^\d+$/.test(rawValue.trim())) {
    return 0;
  }

  const parsedValue = parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function setContextLengthValidationState(textInput, isInvalid, { pulse = false } = {}) {
  const warning = document.getElementById('context-length-warning');

  if (!textInput) {
    if (warning) {
      warning.classList.toggle('visible', isInvalid);
    }
    return;
  }

  textInput.classList.toggle('context-length-invalid', isInvalid);

  if (warning) {
    warning.classList.toggle('visible', isInvalid);
  }

  if (!pulse) {
    return;
  }

  textInput.classList.remove('context-length-invalid-pulse');
  textInput.offsetHeight;
  textInput.classList.add('context-length-invalid-pulse');
  textInput.addEventListener('animationend', () => {
    textInput.classList.remove('context-length-invalid-pulse');
  }, { once: true });
}

function sanitizeMaxTokensInputValue(rawValue) {
  return String(rawValue || "").replace(/\D+/g, "");
}

function normalizeMaxTokensInputValue(maxTokensInput) {
  if (!maxTokensInput) {
    return "";
  }

  const sanitizedValue = sanitizeMaxTokensInputValue(maxTokensInput.value);

  if (maxTokensInput.value !== sanitizedValue) {
    maxTokensInput.value = sanitizedValue;
  }

  return sanitizedValue;
}

function handleMaxTokensBeforeInput(event) {
  if (event.inputType && event.inputType.startsWith("delete")) {
    return;
  }

  if (typeof event.data === "string" && /\D/.test(event.data)) {
    event.preventDefault();
  }
}

function handleMaxTokensPaste(event) {
  const pastedText = event.clipboardData?.getData("text") || "";
  const sanitizedPaste = sanitizeMaxTokensInputValue(pastedText);

  if (pastedText !== sanitizedPaste) {
    event.preventDefault();
    const maxTokensInput = event.target;

    if (!(maxTokensInput instanceof HTMLInputElement)) {
      return;
    }

    const selectionStart = maxTokensInput.selectionStart ?? maxTokensInput.value.length;
    const selectionEnd = maxTokensInput.selectionEnd ?? maxTokensInput.value.length;

    maxTokensInput.value =
      maxTokensInput.value.slice(0, selectionStart) +
      sanitizedPaste +
      maxTokensInput.value.slice(selectionEnd);
    saveMaxTokensSetting();
  }
}

function updateMaxTokensUI(maxTokensInput, maxTokensValue) {
  const effectiveInput = maxTokensInput || document.getElementById("max-tokens-input");
  const effectiveValue = maxTokensValue || document.getElementById("max-tokens-value");
  const hasCustomValue = Number.isInteger(maxTokens) && maxTokens > 0;

  if (effectiveInput) {
    effectiveInput.value = hasCustomValue ? String(maxTokens) : "";
  }

  if (effectiveValue) {
    effectiveValue.textContent = hasCustomValue ? String(maxTokens) : "Server Default";
  }
}

function updateMaxTokensPremiumState(
  maxTokensInput = document.getElementById("max-tokens-input"),
  maxTokensValue = document.getElementById("max-tokens-value"),
  clearMaxTokensButton = document.getElementById("clear-max-tokens-btn")
) {
  if (!maxTokensInput) {
    return;
  }

  maxTokensInput.dataset.premiumLocked = "false";
  maxTokensInput.readOnly = false;
  maxTokensInput.title = "Set max output tokens for chat requests";

  if (maxTokensValue) {
    maxTokensValue.title = "";
  }

  if (clearMaxTokensButton) {
    clearMaxTokensButton.dataset.premiumLocked = "false";
    clearMaxTokensButton.title = "Reset max output tokens to server default";
  }
}

function syncMaxTokensForAccess(
  maxTokensInput = document.getElementById("max-tokens-input"),
  maxTokensValue = document.getElementById("max-tokens-value"),
  clearMaxTokensButton = document.getElementById("clear-max-tokens-btn")
) {
  updateMaxTokensUI(maxTokensInput, maxTokensValue);
  updateMaxTokensPremiumState(maxTokensInput, maxTokensValue, clearMaxTokensButton);
}

/**
 * Initializes temperature settings
 */
export function initializeTemperature() {
  const temperatureInput = document.getElementById("temperature");
  const temperatureValue = document.getElementById("temperature-value");
  const temperatureLock = document.getElementById("temperature-lock");

  if (temperatureInput && temperatureValue && temperatureLock) {
    // Add comprehensive event prevention for disabled state
    const preventInteractionWhenDisabled = (e) => {
      if (temperatureInput.disabled) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Block all interaction events when disabled
    [
      "mousedown",
      "mouseup",
      "click",
      "touchstart",
      "touchend",
      "touchmove",
      "keydown",
      "keyup",
      "focus",
    ].forEach((eventType) => {
      temperatureInput.addEventListener(
        eventType,
        preventInteractionWhenDisabled,
        { capture: true, passive: false }
      );
    });

    temperatureInput.addEventListener("input", (e) => {
      // Prevent processing input events when slider is disabled
      if (temperatureInput.disabled) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const inputValue = temperatureInput.value;
      const parsedValue = parseFloat(inputValue);

      if (
        !isNaN(parsedValue) &&
        parsedValue >= 0 &&
        parsedValue <= 2.0 &&
        /^\d*\.?\d{0,1}$/.test(inputValue)
      ) {
        temperature = parsedValue;
        temperatureValue.textContent = temperature.toFixed(1);
        localStorage.setItem("temperature", temperature);
      } else {
        temperatureInput.value = temperature.toFixed(1);
      }
    });

    // Track lock state explicitly to avoid browser confusion
    let isLocked = true; // Start locked

    const pulseLock = () => {
      temperatureLock.classList.remove("lock-nudge");
      temperatureLock.offsetHeight; // reflow to restart animation
      temperatureLock.classList.add("lock-nudge");
      temperatureLock.addEventListener("animationend", () => temperatureLock.classList.remove("lock-nudge"), { once: true });
    };

    // Overlay captures taps on the slider area when pointer-events:none blocks direct events
    const sliderContainer = temperatureInput.closest('.temperature-slider-container');
    const overlay = document.createElement('div');
    overlay.className = 'temperature-slider-overlay';
    ['mousedown', 'touchstart'].forEach((evt) => {
      overlay.addEventListener(evt, (e) => { e.preventDefault(); pulseLock(); }, { passive: false });
    });
    if (sliderContainer) sliderContainer.appendChild(overlay);

    // Helper function to apply locked state
    const applyLockedState = () => {
      temperatureInput.disabled = true;
      temperatureInput.style.pointerEvents = "none";
      temperatureInput.style.cursor = "not-allowed";
      temperatureInput.style.opacity = "0.6";
      temperatureInput.style.background = "#6b7280";
      temperatureInput.setAttribute("readonly", "true");
      overlay.style.display = 'block';
      temperatureLock.innerHTML = '<i class="fas fa-lock text-red-400"></i>';
      temperatureLock.title = "Temperature is locked (click to unlock)";
    };

    // Helper function to apply unlocked state
    const applyUnlockedState = () => {
      temperatureInput.disabled = false;
      temperatureInput.style.pointerEvents = "auto";
      temperatureInput.style.cursor = "pointer";
      temperatureInput.style.opacity = "";
      temperatureInput.style.background = "";
      temperatureInput.removeAttribute("readonly");
      overlay.style.display = 'none';
      temperatureLock.innerHTML = '<i class="fas fa-unlock" style="color: #10b981;"></i>';
      temperatureLock.title = "Temperature is unlocked (click to lock)";
    };

    // Add event listener
    temperatureLock.addEventListener("click", () => {
      if (isLocked) {
        // Currently locked, unlock it
        isLocked = false;
        applyUnlockedState();
      } else {
        // Currently unlocked, lock it
        isLocked = true;
        applyLockedState();
      }

      // Force a repaint
      temperatureInput.offsetHeight;
    });

    // Load saved temperature
    const savedTemperature = localStorage.getItem("temperature");
    if (savedTemperature) {
      const parsedTemperature = parseFloat(savedTemperature);
      if (
        !isNaN(parsedTemperature) &&
        parsedTemperature >= 0 &&
        parsedTemperature <= 2.0
      ) {
        temperatureInput.value = parsedTemperature.toFixed(1);
        temperature = parsedTemperature;
        temperatureValue.textContent = temperature.toFixed(1);
      } else {
        // If saved temperature is invalid, set to default
        temperatureInput.value = "0.3";
        temperature = 0.3;
        temperatureValue.textContent = "0.3";
      }
    } else {
      // Set default temperature to 0.3
      temperatureInput.value = "0.3";
      temperature = 0.3;
      temperatureValue.textContent = "0.3";
    }

    // Apply initial locked state after value is set
    setTimeout(() => {
      applyLockedState();
      // Force a repaint to ensure styles are applied
      temperatureInput.offsetHeight;
    }, 50); // Longer delay to ensure DOM is fully ready

    resetTemperatureLockState = () => {
      isLocked = true;
      applyLockedState();
      temperatureInput.offsetHeight;
    };
  }
}

export function loadMaxTokensSetting() {
  const maxTokensInput = document.getElementById("max-tokens-input");
  const maxTokensValue = document.getElementById("max-tokens-value");
  const clearMaxTokensButton = document.getElementById("clear-max-tokens-btn");

  if (!maxTokensInput) {
    return;
  }

  const savedMaxTokens = localStorage.getItem("maxTokens");
  maxTokens = parseStoredMaxTokens(savedMaxTokens);

  if (savedMaxTokens !== null && maxTokens === 0) {
    localStorage.removeItem("maxTokens");
  }

  updateMaxTokensUI(maxTokensInput, maxTokensValue);
  updateMaxTokensPremiumState(maxTokensInput, maxTokensValue, clearMaxTokensButton);

  if (maxTokensInput.dataset.maxTokensListenerAttached !== "true") {
    maxTokensInput.addEventListener("beforeinput", handleMaxTokensBeforeInput);
    maxTokensInput.addEventListener("paste", handleMaxTokensPaste);
    maxTokensInput.addEventListener("input", saveMaxTokensSetting);
    maxTokensInput.addEventListener("change", saveMaxTokensSetting);
    maxTokensInput.dataset.maxTokensListenerAttached = "true";
  }

  if (clearMaxTokensButton && clearMaxTokensButton.dataset.maxTokensClearListenerAttached !== "true") {
    clearMaxTokensButton.addEventListener("click", () => {
      showResetConfirmModal(
        "Reset Max Output Tokens to the server default? Your current value will be cleared.",
        () => {
          maxTokens = 0;
          localStorage.removeItem("maxTokens");
          updateMaxTokensUI(maxTokensInput, maxTokensValue);
        }
      );
    });
    clearMaxTokensButton.dataset.maxTokensClearListenerAttached = "true";
  }
}

export function saveMaxTokensSetting() {
  const maxTokensInput = document.getElementById("max-tokens-input");
  const maxTokensValue = document.getElementById("max-tokens-value");
  const clearMaxTokensButton = document.getElementById("clear-max-tokens-btn");

  if (!maxTokensInput) {
    return;
  }

  const rawValue = normalizeMaxTokensInputValue(maxTokensInput).trim();

  if (rawValue === "") {
    maxTokens = 0;
    localStorage.removeItem("maxTokens");
    updateMaxTokensUI(maxTokensInput, maxTokensValue);
    return;
  }

  const parsedValue = parseStoredMaxTokens(rawValue);

  if (parsedValue === 0) {
    updateMaxTokensUI(maxTokensInput, maxTokensValue);
    return;
  }

  maxTokens = parsedValue;
  localStorage.setItem("maxTokens", String(maxTokens));
  updateMaxTokensUI(maxTokensInput, maxTokensValue);
}

export function getConfiguredMaxTokens() {
  return maxTokens;
}

export function getContextLength() {
  if (useOpenAICompatible || !contextLengthOverrideEnabled) return 0;
  return contextLength;
}

export function isContextLengthOverrideEnabled() {
  return !useOpenAICompatible && contextLengthOverrideEnabled;
}

/**
 * Shows or hides the context length settings section based on the current provider.
 */
export function updateContextLengthVisibility() {
  const section = document.querySelector('.context-length-setting');
  if (!section) return;
  section.style.display = useOpenAICompatible ? 'none' : '';
}


/**
 * Gets the current image generation count for free tier users.
 * @returns {number}
 */
export function getImageGenerationCount() {
  const savedCount = localStorage.getItem(IMAGE_GENERATION_COUNT_KEY);
  if (savedCount === null) {
    return 0;
  }
  const parsedCount = parseInt(savedCount, 10);
  return isNaN(parsedCount) ? 0 : parsedCount;
}

/**
 * Increments the image generation count for free tier users.
 */
export function incrementImageGenerationCount() {
  const currentCount = getImageGenerationCount();
  localStorage.setItem(IMAGE_GENERATION_COUNT_KEY, String(currentCount + 1));
  debugLog("Incremented image generation count:", currentCount + 1);
}

/**
 * Initializes system prompt settings
 */
export function initializeSystemPrompt() {
  if (systemPromptInput) {
    // Get the display element
    const systemPromptDisplay = document.getElementById(
      "system-prompt-display"
    );

    // Set up event listeners for both the original textarea and the display element
    systemPromptInput.addEventListener("change", () => {
      if (!canEditSystemPrompt()) {
        systemPromptInput.value = systemPrompt;

        if (systemPromptDisplay) {
          systemPromptDisplay.textContent = systemPrompt;
        }

        const systemPromptPreview = document.getElementById("system-prompt-preview");
        const placeholderSpan = document.getElementById("prompt-placeholder");
        if (systemPromptPreview) {
          if (systemPrompt && systemPrompt.trim()) {
            systemPromptPreview.textContent = systemPrompt;
            if (placeholderSpan) {
              placeholderSpan.style.display = "none";
            }
          } else if (placeholderSpan) {
            systemPromptPreview.innerHTML = "";
            systemPromptPreview.appendChild(placeholderSpan);
            placeholderSpan.style.display = "";
          } else {
            systemPromptPreview.textContent = "";
          }
        }

        requestSystemPromptPremiumAccess();
        return;
      }

      systemPrompt = systemPromptInput.value;

      // Mark the system prompt as user-created when explicitly set
      isUserCreatedSystemPrompt = true;
      // Save both the prompt and the flag
      localStorage.setItem("systemPrompt", systemPrompt);
      localStorage.setItem("isUserCreatedSystemPrompt", "true");

      // Clear the active template since the user is manually editing
      localStorage.removeItem("activeTemplateName");
      localStorage.removeItem("activeTemplateCharacterCard");
      localStorage.removeItem("pendingTemplateCharacterCard");

      debugLog("Saved user-created system prompt:", systemPrompt);

      // Sync the display element if it exists
      if (systemPromptDisplay) {
        systemPromptDisplay.textContent = systemPrompt;
      }

      // Update the template indicator
      try {
        import("./template-indicator.js").then((module) => {
          module.hideTemplateIndicator();
        });
      } catch (error) {
        debugLog("Error hiding template indicator:", error);
      }
    });

    // Load saved system prompt
    const savedPrompt = localStorage.getItem("systemPrompt");
    const savedIsUserCreated =
      localStorage.getItem("isUserCreatedSystemPrompt") === "true";

    debugLog("Loading system prompt - Saved prompt:", savedPrompt);
    debugLog("Is user-created:", savedIsUserCreated);

    if (savedPrompt && savedPrompt.trim() !== "") {
      // If we have a saved prompt, always load it
      systemPromptInput.value = savedPrompt;
      systemPrompt = savedPrompt;
      // Keep track of whether this is user-created
      isUserCreatedSystemPrompt = savedIsUserCreated;

      debugLog(
        "Loaded system prompt:",
        systemPrompt,
        "User-created:",
        isUserCreatedSystemPrompt
      );

      // Update the display element if it exists
      if (systemPromptDisplay) {
        systemPromptDisplay.textContent = savedPrompt;
      }

      // If the prompt is user-created, make sure the flag is set properly
      if (savedIsUserCreated) {
        localStorage.setItem("isUserCreatedSystemPrompt", "true");
      }
    } else {
      // Use the default prompt if none is saved
      systemPromptInput.value = DEFAULT_SYSTEM_PROMPT;
      systemPrompt = DEFAULT_SYSTEM_PROMPT;
      isUserCreatedSystemPrompt = false;
      localStorage.setItem("systemPrompt", DEFAULT_SYSTEM_PROMPT);
      localStorage.removeItem("isUserCreatedSystemPrompt");

      // Update the display element if it exists
      if (systemPromptDisplay) {
        systemPromptDisplay.textContent = DEFAULT_SYSTEM_PROMPT;
      }

      debugLog("Using default system prompt");
    }

    // Force update any CodeMirror editor that might be showing the system prompt
    if (
      window.systemPromptEditor &&
      typeof window.systemPromptEditor.setValue === "function"
    ) {
      window.systemPromptEditor.setValue(systemPrompt);
    }

    updateSystemPromptPremiumState();
  }
}

function isPremiumUser() {
  if (typeof window.hasPremiumAccess === "function") {
    return window.hasPremiumAccess();
  }

  return !!(
    window.AndroidBilling &&
    typeof window.AndroidBilling.checkPremiumStatus === "function" &&
    window.AndroidBilling.checkPremiumStatus()
  );
}

function requestTTSVoicePremiumAccess() {
  if (typeof window.openPremiumModal === "function") {
    window.openPremiumModal("TTS Voices");
  } else {
    alert("Alternate TTS voices are reserved for premium users.");
  }
}

function updateTTSVoicePremiumState(voiceSelect = document.getElementById("tts-voice-select")) {
  if (!voiceSelect) {
    return;
  }

  const isPremium = isPremiumUser();
  voiceSelect.dataset.premiumLocked = isPremium ? "false" : "true";
  voiceSelect.title = isPremium
    ? "Select the text-to-speech voice for AI responses"
    : "Free users can use only the default TTS voice";
}

async function syncTTSVoiceSelectionForAccess(
  voiceSelect = document.getElementById("tts-voice-select")
) {
  updateTTSVoicePremiumState(voiceSelect);

  if (isPremiumUser()) {
    return;
  }

  selectedTTSVoice = null;

  if (voiceSelect) {
    voiceSelect.value = "";
  }

  if (window.TTSService) {
    await window.TTSService.setVoice("");
  }
}

export function canEditSystemPrompt() {
  return isPremiumUser();
}

export function requestSystemPromptPremiumAccess() {
  if (typeof window.openPremiumModal === "function") {
    window.openPremiumModal("System Prompt");
  } else {
    alert("System prompt changes are reserved for premium users.");
  }
}

export function requireSystemPromptPremiumAccess() {
  if (canEditSystemPrompt()) {
    return true;
  }

  requestSystemPromptPremiumAccess();
  return false;
}

export function updateSystemPromptPremiumState() {
  const isPremium = canEditSystemPrompt();
  const editButton = document.getElementById("edit-system-prompt-btn");
  const saveButton = document.getElementById("save-system-prompt-btn");
  const preview = document.getElementById("system-prompt-preview");

  if (editButton) {
    editButton.dataset.premiumLocked = isPremium ? "false" : "true";
    editButton.title = isPremium
      ? "Edit your system prompt"
      : "Premium required to edit the system prompt";
  }

  if (saveButton) {
    saveButton.dataset.premiumLocked = isPremium ? "false" : "true";
    saveButton.title = isPremium
      ? "Save the current system prompt to your saved prompts list"
      : "Premium required to save system prompts";
  }

  if (preview) {
    preview.dataset.premiumLocked = isPremium ? "false" : "true";
    preview.title = isPremium
      ? ""
      : "Premium required to change the system prompt";
  }

  if (systemPromptInput) {
    if (isPremium) {
      systemPromptInput.removeAttribute("readonly");
    } else {
      systemPromptInput.setAttribute("readonly", "true");
    }
  }
}

document.addEventListener("premium-status-changed", () => {
  updateSystemPromptPremiumState();
  void syncTTSVoiceSelectionForAccess();
  syncMaxTokensForAccess();
  loadBiometricSetting();
});

/**
 * Loads the hide thinking setting from localStorage
 */
export function loadHideThinkingSetting() {
  if (hideThinkingCheckbox) {
    const savedHideThinking = localStorage.getItem("hideThinking");
    if (savedHideThinking === null) {
      // Default for first-time users: keep thinking text hidden.
      hideThinkingCheckbox.checked = true;
      hideThinking = true;
      localStorage.setItem("hideThinking", "true");
    } else if (savedHideThinking === "true") {
      hideThinkingCheckbox.checked = true;
      hideThinking = true;
    } else {
      hideThinkingCheckbox.checked = false;
      hideThinking = false;
    }
    applyThinkingVisibility();

    // After loading settings, ensure removal of any visible think tags
    if (hideThinking) {
      setTimeout(() => {
        removeVisibleThinkTags();
      }, 100);
    }

    // Add event listener for the checkbox
    hideThinkingCheckbox.addEventListener("change", saveHideThinkingSetting);
  }
}

export function loadContextLengthSetting() {
  const input = contextLengthInput || document.getElementById('context-length-input');
  const valueDisplay = contextLengthValue || document.getElementById('context-length-value');

  if (!input) {
    return;
  }

  const savedContextLength = localStorage.getItem("contextLength");
  contextLength = parseStoredMaxTokens(savedContextLength);
  contextLengthOverrideEnabled = localStorage.getItem(CONTEXT_LENGTH_OVERRIDE_STORAGE_KEY) === 'true';

  setContextLengthSliderRange(input);

  updateContextLengthUI(input, valueDisplay);

  if (input.dataset.contextLengthListenerAttached !== "true") {
    const touchIntentState = {
      isTouchActive: false,
      horizontalDragConfirmed: false,
      startX: 0,
      startY: 0,
      startValue: parseInt(input.value, 10)
    };

    const resetTouchIntent = () => {
      touchIntentState.isTouchActive = false;
      touchIntentState.horizontalDragConfirmed = false;
    };

    input.addEventListener("input", () => {
      const parsedValue = getContextLengthFromSliderInput(input);

      // Touch interactions should only change the slider when horizontal intent is clear.
      // This avoids accidental context changes while users are vertically scrolling.
      if (
        touchIntentState.isTouchActive
        && !touchIntentState.horizontalDragConfirmed
        && Number.isFinite(touchIntentState.startValue)
      ) {
        input.value = String(touchIntentState.startValue);
        updateContextLengthUI(input, valueDisplay, getContextLengthFromSliderIndex(touchIntentState.startValue));
        return;
      }

      updateContextLengthUI(input, valueDisplay, parsedValue);
    });

    input.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) {
        resetTouchIntent();
        return;
      }

      touchIntentState.isTouchActive = true;
      touchIntentState.horizontalDragConfirmed = false;
      touchIntentState.startX = e.touches[0].clientX;
      touchIntentState.startY = e.touches[0].clientY;
      touchIntentState.startValue = parseInt(input.value, 10);
    }, { passive: true });

    input.addEventListener("touchmove", (e) => {
      if (!touchIntentState.isTouchActive || e.touches.length !== 1) {
        return;
      }

      const deltaX = e.touches[0].clientX - touchIntentState.startX;
      const deltaY = e.touches[0].clientY - touchIntentState.startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (
        !touchIntentState.horizontalDragConfirmed
        && absDeltaX >= CONTEXT_LENGTH_TOUCH_INTENT_THRESHOLD
        && absDeltaX > absDeltaY * CONTEXT_LENGTH_VERTICAL_SCROLL_BIAS
      ) {
        touchIntentState.horizontalDragConfirmed = true;
        return;
      }

      if (
        !touchIntentState.horizontalDragConfirmed
        && absDeltaY >= CONTEXT_LENGTH_TOUCH_INTENT_THRESHOLD
        && absDeltaY > absDeltaX * CONTEXT_LENGTH_VERTICAL_SCROLL_BIAS
        && Number.isFinite(touchIntentState.startValue)
      ) {
        input.value = String(touchIntentState.startValue);
        updateContextLengthUI(input, valueDisplay, getContextLengthFromSliderIndex(touchIntentState.startValue));
      }
    }, { passive: true });

    input.addEventListener("touchend", resetTouchIntent, { passive: true });
    input.addEventListener("touchcancel", resetTouchIntent, { passive: true });

    input.addEventListener("change", saveContextLengthSetting);
    input.dataset.contextLengthListenerAttached = "true";
  }

  const textInput = document.getElementById('context-length-text-input');
  if (textInput && textInput.dataset.contextLengthTextListenerAttached !== "true") {
    textInput.addEventListener("input", () => {
      const rawValue = textInput.value.trim();

      // Allow the field to be temporarily blank while the user edits.
      // Minimum enforcement (256+) happens on change/save.
      if (rawValue === "") {
        setContextLengthValidationState(textInput, false);
        return;
      }

      const parsed = parseInt(rawValue, 10);
      if (!Number.isFinite(parsed)) {
        return;
      }

      if (parsed > 0 && parsed < MIN_CONTEXT_LENGTH_OVERRIDE) {
        setContextLengthValidationState(textInput, true);
        return;
      }

      setContextLengthValidationState(textInput, false);

      const clamped = Math.min(parsed, MAX_CONTEXT_LENGTH_OVERRIDE);
      setSliderToNearestContextPreset(input, clamped);
      updateContextLengthUI(input, valueDisplay, clamped);
    });
    textInput.addEventListener("change", () => {
      saveContextLengthSetting();
    });
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        textInput.blur();
      }
    });
    textInput.dataset.contextLengthTextListenerAttached = "true";
  }

  const overrideToggle = document.getElementById('context-length-override-toggle');
  const toggleControl = overrideToggle?.closest('.context-length-override-toggle');
  if (overrideToggle && toggleControl && overrideToggle.dataset.contextLengthToggleInitialized !== "true") {
    const sliderContainer = input.closest('.settings-slider-container');
    let overlay = sliderContainer?.querySelector('.context-length-slider-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'context-length-slider-overlay';
      if (sliderContainer) {
        sliderContainer.appendChild(overlay);
      }
    }

    if (textInput) {
      textInput.addEventListener("focus", (e) => {
        if (!contextLengthOverrideEnabled) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, { capture: true, passive: false });
    }

    const applyOverrideState = () => {
      const overrideEnabled = !!overrideToggle.checked;
      contextLengthOverrideEnabled = overrideEnabled;
      localStorage.setItem(CONTEXT_LENGTH_OVERRIDE_STORAGE_KEY, String(overrideEnabled));

      if (overrideEnabled && contextLength < MIN_CONTEXT_LENGTH_OVERRIDE) {
        contextLength = MIN_CONTEXT_LENGTH_OVERRIDE;
        localStorage.setItem("contextLength", String(contextLength));
      }

      input.disabled = !overrideEnabled;
      input.style.pointerEvents = overrideEnabled ? "auto" : "none";
      input.style.cursor = overrideEnabled ? "pointer" : "not-allowed";
      input.style.opacity = overrideEnabled ? "" : "0.6";
      input.style.background = overrideEnabled ? "" : "#6b7280";
      if (overrideEnabled) {
        input.removeAttribute("readonly");
      } else {
        input.setAttribute("readonly", "true");
      }

      if (overlay) {
        overlay.style.display = overrideEnabled ? 'none' : 'block';
      }

      if (sliderContainer) {
        sliderContainer.style.display = overrideEnabled ? '' : 'none';
      }

      if (textInput) {
        textInput.disabled = !overrideEnabled;
        textInput.style.opacity = overrideEnabled ? "" : "0.6";
        textInput.style.cursor = overrideEnabled ? "" : "not-allowed";
      }

      const title = overrideEnabled
        ? 'App context length override is enabled'
        : 'Server context length is in control. Enable override to use the app value';
      toggleControl.title = title;
      overrideToggle.title = title;
      overrideToggle.setAttribute(
        'aria-label',
        overrideEnabled ? 'Disable server context length override' : 'Enable server context length override'
      );

      updateContextLengthUI(input, valueDisplay);
    };

    overrideToggle.addEventListener("change", () => {
      applyOverrideState();
      input.offsetHeight;
    });

    resetContextLengthLockState = () => {
      overrideToggle.checked = contextLengthOverrideEnabled;
      applyOverrideState();
      input.offsetHeight;
    };

    overrideToggle.dataset.contextLengthToggleInitialized = "true";
  }

  if (typeof resetContextLengthLockState === 'function') {
    resetContextLengthLockState();
  }
}

/**
 * Saves the context length setting to localStorage
 */
export function saveContextLengthSetting() {
  const input = contextLengthInput || document.getElementById('context-length-input');
  const textInput = document.getElementById('context-length-text-input');
  if (!input) {
    return;
  }
  
  let parsedValue = 0;
  const textInputValue = textInput ? textInput.value.trim() : "";

  if (textInputValue !== "") {
    parsedValue = parseInt(textInputValue, 10) || 0;
  } else {
    parsedValue = getContextLengthFromSliderInput(input);
  }

  if (parsedValue > 0 && parsedValue < MIN_CONTEXT_LENGTH_OVERRIDE) {
    setContextLengthValidationState(textInput, true, { pulse: true });
    return;
  }

  setContextLengthValidationState(textInput, false);

  if (parsedValue > MAX_CONTEXT_LENGTH_OVERRIDE) {
    parsedValue = MAX_CONTEXT_LENGTH_OVERRIDE;
    if (textInput) {
      textInput.value = String(MAX_CONTEXT_LENGTH_OVERRIDE);
    }
  }
  
  contextLength = parsedValue;
  localStorage.setItem("contextLength", String(contextLength));
  
  const valueDisplay = contextLengthValue || document.getElementById('context-length-value');
  updateContextLengthUI(input, valueDisplay);
  
  // Removed automatic reload. Context length will be sent with chat requests instead.
  // triggerModelReloadIfPossible();
}


function updateContextLengthUI(input, valueDisplay, overrideValue) {
  const showingOverrideValue = contextLengthOverrideEnabled || overrideValue !== undefined;
  const effectiveValue = overrideValue !== undefined
    ? overrideValue
    : (contextLengthOverrideEnabled ? contextLength : 0);
  const hasCustomValue = showingOverrideValue && effectiveValue > 0;

  if (input) {
    const sliderValue = hasCustomValue ? effectiveValue : MIN_CONTEXT_LENGTH_OVERRIDE;
    setSliderToNearestContextPreset(input, sliderValue);
  }

  if (valueDisplay) {
    valueDisplay.textContent = hasCustomValue ? String(effectiveValue) : "Set by provider";
  }

  const textInput = document.getElementById('context-length-text-input');
  if (textInput) {
    setContextLengthValidationState(textInput, false);
    textInput.value = hasCustomValue ? String(effectiveValue) : "";
  }
}


/**
 * Updates the UI with context specs fetched live from LM Studio:
 * dynamically adjusts the slider maximum and shows model max / active context values.
 * @param {number|null} maxLimit - Model's absolute maximum context length
 * @param {number|null} currentActive - Context length currently active in LM Studio
 */
export function setModelContextSpecs(maxLimit, currentActive) {
  const input = contextLengthInput || document.getElementById('context-length-input');
  const infoEl = document.getElementById('lmstudio-context-info');
  const maxEl  = document.getElementById('lmstudio-ctx-max');
  const activeEl = document.getElementById('lmstudio-ctx-active');
  const refreshBtn = document.getElementById('refresh-ctx-specs-btn');
  const shouldMirrorActiveContextIntoSlider = !useOpenRouter && !useOpenAICompatible;

  if (refreshBtn) {
    refreshBtn.title = useOllama ? "Refresh from Ollama" : "Refresh from LM Studio";
  }

  if (input && maxLimit && maxLimit > 0) {
    setContextLengthSliderRange(input, maxLimit);
  }

  // Mirror the active LM Studio context into the slider and text input, but only
  // when the user has not manually set a value (contextLength === 0 means "provider default"),
  // AND the loaded model is not currently running with a stale custom context length.
  // For provider/default mode we still keep stored contextLength at 0, while the slider
  // itself uses the configured minimum floor value for visual consistency.
  if (shouldMirrorActiveContextIntoSlider && currentActive && currentActive > 0 && !contextLengthOverrideEnabled) {
    const isStaleCustomContext = window.currentLoadedContextLength && window.currentLoadedContextLength > 0;
    if (!isStaleCustomContext) {
      if (input) {
        setSliderToNearestContextPreset(input, currentActive);
      }
      const textInput = document.getElementById('context-length-text-input');
      if (textInput) textInput.value = String(currentActive);
      const valueDisplay = contextLengthValue || document.getElementById('context-length-value');
      if (valueDisplay) valueDisplay.textContent = String(currentActive);
    }
  }

  const hasData = !!(maxLimit || currentActive || window.currentLoadedModel);
  if (infoEl) infoEl.style.display = hasData ? 'block' : 'none';
  if (maxEl)    maxEl.textContent    = maxLimit     ? _fmtCtx(maxLimit)     : '—';
  if (activeEl) activeEl.textContent = currentActive ? _fmtCtx(currentActive) : '—';

  const providerEl = document.getElementById('lmstudio-ctx-provider');
  if (providerEl) {
    let providerName = 'LM Studio';
    if (useOpenRouter) {
      providerName = 'OpenRouter';
    } else if (useOpenAICompatible) {
      providerName = 'Custom Endpoint';
    } else if (useOllama) {
      providerName = 'Ollama';
    }
    providerEl.textContent = providerName;
  }

  const modelEl = document.getElementById('lmstudio-ctx-model');
  if (modelEl) {
    if (window.currentLoadedModel) {
      modelEl.textContent = _cleanModelName(window.currentLoadedModel);
      modelEl.title = window.currentLoadedModel;
    } else {
      modelEl.textContent = '—';
      modelEl.title = '';
    }
  }
}

function _cleanModelName(modelId) {
  if (!modelId || modelId === 'dummy/no-model-selected') {
    return 'None';
  }
  const isCloud = modelId.includes('/');
  const namePart = isCloud ? modelId.split('/').pop() : modelId;
  
  return namePart
    .split(/[-_]/)
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

function _fmtCtx(n) {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

function getContextLengthSliderLabels(input) {
  const container = input?.closest('.settings-slider-container');
  if (!container) {
    return { minLabel: null, maxLabel: null };
  }

  return {
    minLabel: container.querySelector('.settings-slider-labels span:first-child'),
    maxLabel: container.querySelector('.settings-slider-labels span:last-child')
  };
}

function getContextLengthPresetListForLimit(maxLimit = MAX_CONTEXT_LENGTH_OVERRIDE) {
  const numericLimit = Number.isFinite(maxLimit) && maxLimit > 0
    ? Math.min(maxLimit, MAX_CONTEXT_LENGTH_OVERRIDE)
    : MAX_CONTEXT_LENGTH_OVERRIDE;

  const filteredPresets = CONTEXT_LENGTH_PRESET_VALUES.filter((value) => value <= numericLimit);
  const presetSet = new Set(filteredPresets);

  if (!presetSet.has(MIN_CONTEXT_LENGTH_OVERRIDE) && numericLimit >= MIN_CONTEXT_LENGTH_OVERRIDE) {
    presetSet.add(MIN_CONTEXT_LENGTH_OVERRIDE);
  }

  if (!presetSet.has(numericLimit) && numericLimit >= MIN_CONTEXT_LENGTH_OVERRIDE) {
    presetSet.add(numericLimit);
  }

  const sortedPresets = Array.from(presetSet)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (sortedPresets.length === 0) {
    return [MIN_CONTEXT_LENGTH_OVERRIDE];
  }

  return sortedPresets;
}

function setContextLengthSliderRange(input, maxLimit = MAX_CONTEXT_LENGTH_OVERRIDE) {
  if (!input) {
    return;
  }

  contextLengthSliderPresets = getContextLengthPresetListForLimit(maxLimit);

  input.min = '0';
  input.max = String(contextLengthSliderPresets.length - 1);
  input.step = '1';

  const { minLabel, maxLabel } = getContextLengthSliderLabels(input);
  if (minLabel) {
    minLabel.textContent = String(contextLengthSliderPresets[0]);
  }
  if (maxLabel) {
    maxLabel.textContent = _fmtCtx(contextLengthSliderPresets[contextLengthSliderPresets.length - 1]);
  }

  if (!Number.isFinite(parseInt(input.value, 10))) {
    input.value = '0';
  }
}

function getContextLengthFromSliderIndex(index) {
  const presets = contextLengthSliderPresets.length > 0
    ? contextLengthSliderPresets
    : [MIN_CONTEXT_LENGTH_OVERRIDE];
  const clampedIndex = Math.min(Math.max(index || 0, 0), presets.length - 1);
  return presets[clampedIndex];
}

function getContextLengthFromSliderInput(input) {
  const sliderIndex = parseInt(input?.value, 10);
  return getContextLengthFromSliderIndex(Number.isFinite(sliderIndex) ? sliderIndex : 0);
}

function setSliderToNearestContextPreset(input, desiredValue) {
  if (!input) {
    return;
  }

  const presets = contextLengthSliderPresets.length > 0
    ? contextLengthSliderPresets
    : [MIN_CONTEXT_LENGTH_OVERRIDE];
  const target = Number.isFinite(desiredValue) && desiredValue > 0
    ? desiredValue
    : presets[0];

  let nearestIndex = 0;
  let nearestDistance = Math.abs(presets[0] - target);

  for (let i = 1; i < presets.length; i++) {
    const distance = Math.abs(presets[i] - target);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = i;
    }
  }

  input.value = String(nearestIndex);
}

// Global callbacks for Android bridge
window.onModelReloadSuccess = function(ctx) {
    console.log(`Model successfully reloaded with ${ctx} context`);
    const loadingModal = document.getElementById('model-loading-modal');
    if (loadingModal) {
        loadingModal.classList.add('hidden');
        loadingModal.classList.remove('flex');
    }
    showToastNotice({ message: `Context length updated to ${ctx} tokens.`, tone: 'success' });
};

window.onModelReloadFailure = function(error) {
    console.error(`Model reload failed: ${error}`);
    const loadingModal = document.getElementById('model-loading-modal');
    if (loadingModal) {
        loadingModal.classList.add('hidden');
        loadingModal.classList.remove('flex');
    }
    showToastNotice({ message: `Failed to update context: ${error}`, tone: 'error' });
};

function triggerModelReloadIfPossible() {
  const isCloud = typeof getUseOpenRouter === 'function' ? getUseOpenRouter() : false;
  const isCustom = typeof getUseOpenAICompatible === 'function' ? getUseOpenAICompatible() : false;

  if (isCloud || isCustom) {
    const provider = isCloud ? 'OpenRouter' : 'Custom Endpoint';
    console.log(`${provider} context limit set to: ${contextLength}`);
    showToastNotice({ message: `${provider} context limit set to ${contextLength} tokens.`, tone: 'success' });
    return;
  }

  if (window.AndroidLMStudio && window.currentLoadedModel) {
    const ipInput = serverIpInput || document.getElementById('server-ip');
    const portInput = serverPortInput || document.getElementById('server-port');
    const ip = ipInput?.value?.trim();
    const port = portInput?.value?.trim();
    if (ip && port) {
        // Show loading modal
        const loadingModal = document.getElementById('model-loading-modal');
        if (loadingModal) {
            const title = document.getElementById('model-loading-title');
            const message = document.getElementById('model-loading-message');
            const name = document.getElementById('model-loading-name');
            if (title) title.textContent = 'Updating Context';
            if (message) message.textContent = 'Reconfiguring model with new context length...';
            if (name) name.textContent = window.currentLoadedModel;
            loadingModal.classList.remove('hidden');
            loadingModal.classList.add('flex');
        }

        console.log(`Triggering model reload for ${window.currentLoadedModel} with context ${contextLength}`);
        window.AndroidLMStudio.updateModelContext(ip, port, window.currentLoadedModel, contextLength);
    }
  }
}




/**
 * Saves the hide thinking setting to localStorage
 */

export function saveHideThinkingSetting() {
  if (hideThinkingCheckbox) {
    hideThinking = hideThinkingCheckbox.checked;
    localStorage.setItem("hideThinking", hideThinking);
    applyThinkingVisibility();
    refreshAllMessages(); // Refresh all messages when setting changes

    if (hideThinking) {
      removeVisibleThinkTags(); // Remove any visible think tags

      // Find all thinking indicators and automatically show content after </think> tags
      const thinkingIndicators = document.querySelectorAll(
        ".thinking-indicator"
      );
      thinkingIndicators.forEach((indicator) => {
        // Call toggleThinkingVisibility with null to automatically show content after </think> tags
        if (window.toggleThinkingVisibility) {
          window.toggleThinkingVisibility(null);
        }
      });
    }
  }
}

/**
 * Loads the reasoning level setting from localStorage
 */
export function loadReasoningLevelSetting() {
  const select = document.getElementById("reasoning-level-select");
  if (select) {
    const saved = localStorage.getItem("reasoningLevel");
    if (saved) {
      reasoningLevel = saved;
      select.value = saved;
    } else {
      reasoningLevel = "default";
      select.value = "default";
      localStorage.setItem("reasoningLevel", "default");
    }

    // Add event listener for the select
    select.addEventListener("change", (e) => {
      reasoningLevel = e.target.value;
      localStorage.setItem("reasoningLevel", reasoningLevel);
    });
  }
}

/**
 * Removes visible think tags from messages
 */
export function removeVisibleThinkTags() {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return;

  const allParagraphs = messagesContainer.querySelectorAll("p");

  allParagraphs.forEach((p) => {
    // Check if paragraph contains raw think tags
    if (
      p.innerHTML.includes("&lt;think&gt;") &&
      p.innerHTML.includes("&lt;/think&gt;")
    ) {
      // Only remove the content between think tags, preserve content after </think>
      let content = p.innerHTML;

      // Extract content after the last </think> tag
      const afterThinkMatch = content.match(/&lt;\/think&gt;([\s\S]*)$/);
      let afterThinkContent = "";

      if (afterThinkMatch && afterThinkMatch[1]) {
        afterThinkContent = afterThinkMatch[1];
      }

      // Remove the think tags and their content
      content = content.replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, "");

      // If there was content after the </think> tag, wrap it in a visible div
      if (afterThinkContent.trim() !== "") {
        content = `<div class="visible-after-think" style="display: block !important; visibility: visible !important; opacity: 1 !important;">${afterThinkContent}</div>`;
      }

      // If the paragraph only contained think tags and nothing else, hide it
      if (content.trim() === "") {
        p.style.display = "none";
      } else {
        p.innerHTML = content;
        p.style.display = ""; // Ensure paragraph is visible if it has content
      }
    }

    // In case the literal tags got through
    if (p.innerHTML.includes("<think>") && p.innerHTML.includes("</think>")) {
      // Only remove the content between think tags, preserve content after </think>
      let content = p.innerHTML;

      // Extract content after the last </think> tag
      const afterThinkMatch = content.match(/<\/think>([\s\S]*)$/);
      let afterThinkContent = "";

      if (afterThinkMatch && afterThinkMatch[1]) {
        afterThinkContent = afterThinkMatch[1];
      }

      // Remove the think tags and their content
      content = content.replace(/<think>[\s\S]*?<\/think>/g, "");

      // If there was content after the </think> tag, wrap it in a visible div
      if (afterThinkContent.trim() !== "") {
        content = `<div class="visible-after-think" style="display: block !important; visibility: visible !important; opacity: 1 !important;">${afterThinkContent}</div>`;
      }

      // If the paragraph only contained think tags and nothing else, hide it
      if (content.trim() === "") {
        p.style.display = "none";
      } else {
        p.innerHTML = content;
        p.style.display = ""; // Ensure paragraph is visible if it has content
      }
    }
  });
}

/**
 * Loads the auto-generate titles setting from localStorage
 */
export function loadAutoGenerateTitlesSetting() {
  if (autoGenerateTitlesCheckbox) {
    const savedAutoGenerateTitles = localStorage.getItem("autoGenerateTitles");
    if (savedAutoGenerateTitles === "true") {
      autoGenerateTitlesCheckbox.checked = true;
      autoGenerateTitles = true;
    } else {
      autoGenerateTitlesCheckbox.checked = false;
      autoGenerateTitles = false;
    }

    // Add event listener for the checkbox
    autoGenerateTitlesCheckbox.addEventListener(
      "change",
      saveAutoGenerateTitlesSetting
    );

    syncAutoGenerateTitlesUI();
  }
}

/**
 * Initializes the web search setting to default off
 */
export function loadWebSearchSetting() {
  const webSearchToggle = document.getElementById("web-search-toggle");
  if (webSearchToggle) {
    localStorage.removeItem("webSearchPersistentEnabled");
    webSearchToggle.checked = false;
    webSearchEnabled = false;

    // Add event listener for the checkbox with warning modal
    webSearchToggle.addEventListener("change", handleWebSearchToggle);
    
    // Sync the header UI
    syncWebSearchHeaderUI();
  }
}

/**
 * Updates the web search state in memory
 */
export function saveWebSearchSetting() {
  const webSearchToggle = document.getElementById("web-search-toggle");
  if (webSearchToggle) {
    webSearchEnabled = webSearchToggle.checked;
  }
}

/**
 * Gets the current Web Search setting
 * @returns {boolean} - The current web search setting
 */
export function getWebSearchEnabled() {
  return webSearchEnabled;
}

/**
 * Gets the current web search provider key
 * @returns {string}
 */
export function getOtterBurrowMap() {
  return otterBurrowMap || localStorage.getItem('otterBurrowMap') || '';
}

// Backward-compatible alias used by older imports.
export function getBraveApiKey() {
  return getOtterBurrowMap();
}

/**
 * Handles the Web Search toggle change event
 * Shows warning modal when enabling the feature
 * @param {Event} event - The change event from the checkbox
 */
function handleWebSearchToggle(event) {
  const isChecked = event.target.checked;

  if (isChecked) {
    if (localStorage.getItem("hideWebSearchWarning") === "true") {
      // User opted to hide warning, enable immediately
      const webSearchToggle = document.getElementById("web-search-toggle");
      if (webSearchToggle) webSearchToggle.checked = true;
      saveWebSearchSetting();
      syncWebSearchHeaderUI();
    } else {
      // Prevent checkbox from staying checked until user confirms
      event.target.checked = false;

      // Show warning modal with callback
      showWebSearchWarningModal({
        onConfirm: () => {
          // User confirmed - enable the feature
          const webSearchToggle = document.getElementById("web-search-toggle");
          if (webSearchToggle) webSearchToggle.checked = true;
          saveWebSearchSetting();
          syncWebSearchHeaderUI();
        },
        onCancel: () => {
          // User canceled - keep it disabled
          const webSearchToggle = document.getElementById("web-search-toggle");
          if (webSearchToggle) webSearchToggle.checked = false;
          syncWebSearchHeaderUI();
        },
        isPersistent: false
      });
    }
  } else {
    // User is disabling - no warning needed, save directly
    saveWebSearchSetting();
    syncWebSearchHeaderUI();
  }
}

/**
 * Toggles Web Search feature from outside the settings menu
 */
export function toggleWebSearchFeature() {
  const webSearchToggle = document.getElementById("web-search-toggle");
  if (!webSearchToggle) return;
  
  webSearchToggle._triggeredBySidebar = true;
  webSearchToggle.checked = !webSearchToggle.checked;
  try {
    handleWebSearchToggle({ target: webSearchToggle });
  } finally {
    webSearchToggle._triggeredBySidebar = false;
  }

  setTimeout(() => {
    webSearchToggle._triggeredBySidebar = false;
  }, 0);
}

/**
 * Synchronizes the web search header icon with the current state
 */
export function syncWebSearchHeaderUI() {
  const headerIcon = document.getElementById("web-search-header-icon");
  const headerBtn = document.getElementById("web-search-header-button");
  if (!headerIcon || !headerBtn) return;
  
  if (webSearchEnabled) {
    headerIcon.style.setProperty('color', '#3B82F6', 'important');
    headerIcon.style.setProperty('stroke', '#3B82F6', 'important');
    headerBtn.classList.add("bg-green-500/10");
  } else {
    headerIcon.style.removeProperty('color');
    headerIcon.style.removeProperty('stroke');
    headerBtn.classList.remove("bg-green-500/10");
  }
}

/**
 * Loads the auto-smart reply setting from localStorage
 */
export function loadAutoSmartReplySetting() {
  if (autoSmartReplyCheckbox) {
    const savedAutoSmartReply = localStorage.getItem("autoSmartReply");
    if (savedAutoSmartReply === "true") {
      autoSmartReplyCheckbox.checked = true;
      autoSmartReply = true;
    } else {
      autoSmartReplyCheckbox.checked = false;
      autoSmartReply = false;
    }

    // Add event listener for the checkbox with warning modal
    autoSmartReplyCheckbox.addEventListener(
      "change",
      handleAutoSmartReplyToggle
    );
  }
}

/**
 * Saves the auto-smart reply setting to localStorage
 */
export function saveAutoSmartReplySetting() {
  if (autoSmartReplyCheckbox) {
    autoSmartReply = autoSmartReplyCheckbox.checked;
    localStorage.setItem("autoSmartReply", autoSmartReply);
  }
}

/**
 * Gets the current auto-smart reply setting
 * @returns {boolean} - True if auto-smart reply is enabled and OpenRouter is not active
 */
export function getAutoSmartReply() {
  if (useOpenRouter || useOpenAICompatible) return false;
  return autoSmartReply;
}

/**
 * Handles the Smart Reply toggle change event
 * Shows warning modal when enabling the feature
 * @param {Event} event - The change event from the checkbox
 */
function handleAutoSmartReplyToggle(event) {
  // Smart Reply is unavailable with hosted providers
  if (useOpenRouter || useOpenAICompatible) {
    event.target.checked = false;
    return;
  }

  const isChecked = event.target.checked;

  console.log('Smart Reply toggle changed, checked:', isChecked);

  if (isChecked) {
    // Prevent checkbox from staying checked until user confirms
    event.target.checked = false;
    console.log('Checkbox temporarily unchecked, showing warning modal');

    // Show warning modal with callback
    showSmartReplyWarningModal(() => {
      // User confirmed - enable the feature
      console.log('User confirmed, enabling Smart Reply');
      event.target.checked = true;
      saveAutoSmartReplySetting();
    });
  } else {
    // User is disabling - no warning needed, save directly
    console.log('User disabling Smart Reply, saving directly');
    saveAutoSmartReplySetting();
  }
}

/**
 * Loads the auto-scroll setting from localStorage
 */
export function loadAutoScrollSetting() {
  const autoScrollCheckbox = document.getElementById("auto-scroll");
  if (autoScrollCheckbox) {
    const savedAutoScroll = localStorage.getItem("autoScrollEnabled");
    if (savedAutoScroll === "true") {
      autoScrollCheckbox.checked = true;
      autoScrollEnabled = true;
    } else {
      autoScrollCheckbox.checked = false;
      autoScrollEnabled = false;
    }

    // Add event listener for the checkbox
    autoScrollCheckbox.addEventListener("change", saveAutoScrollSetting);
  }
}

/**
 * Saves the auto-generate titles setting to localStorage
 */
export function saveAutoGenerateTitlesSetting() {
  if (autoGenerateTitlesCheckbox) {
    autoGenerateTitles = autoGenerateTitlesCheckbox.checked;
    localStorage.setItem("autoGenerateTitles", autoGenerateTitles);
  }
}

function syncAutoGenerateTitlesUI() {
  const autoGenerateTitlesContainer = document.getElementById('auto-generate-titles-setting');
  const autoGenerateTitlesDesc = document.getElementById('auto-generate-titles-description');

  if (autoGenerateTitlesCheckbox) {
    const savedAutoGenerateTitles = localStorage.getItem('autoGenerateTitles');
    autoGenerateTitlesCheckbox.disabled = false;
    autoGenerateTitlesCheckbox.checked = savedAutoGenerateTitles === 'true';
    autoGenerateTitles = savedAutoGenerateTitles === 'true';
  }

  if (autoGenerateTitlesContainer) autoGenerateTitlesContainer.style.opacity = '';
  if (autoGenerateTitlesDesc) {
    autoGenerateTitlesDesc.textContent = 'When enabled, the first AI reply includes a hidden short title that LMSA saves to your chat list without making a second API call.';
  }
}

/**
 * Saves the auto-scroll setting to localStorage
 */
export function saveAutoScrollSetting() {
  const autoScrollCheckbox = document.getElementById("auto-scroll");
  if (autoScrollCheckbox) {
    autoScrollEnabled = autoScrollCheckbox.checked;
    localStorage.setItem("autoScrollEnabled", autoScrollEnabled);
  }
}

/**
 * Loads the enter sends newline setting from localStorage
 */
export function loadEnterSendsNewlineSetting() {
  const enterNewlineCheckbox = document.getElementById("enter-newline-toggle");
  if (enterNewlineCheckbox) {
    const savedEnterSendsNewline = localStorage.getItem("enterSendsNewline");
    if (savedEnterSendsNewline === "true") {
      enterNewlineCheckbox.checked = true;
      enterSendsNewline = true;
    } else {
      enterNewlineCheckbox.checked = false;
      enterSendsNewline = false;
    }

    // Add event listener for the checkbox
    enterNewlineCheckbox.addEventListener(
      "change",
      saveEnterSendsNewlineSetting
    );
  }
}

/**
 * Saves the enter sends newline setting to localStorage
 */
export function saveEnterSendsNewlineSetting() {
  const enterNewlineCheckbox = document.getElementById("enter-newline-toggle");
  if (enterNewlineCheckbox) {
    enterSendsNewline = enterNewlineCheckbox.checked;
    localStorage.setItem("enterSendsNewline", enterSendsNewline);
  }
}

/**
 * Gets the current enter sends newline setting
 * @returns {boolean} - True if Enter creates a new line, false if it sends message
 */
export function getEnterSendsNewline() {
  return enterSendsNewline;
}

/**
 * Loads the show model label setting from localStorage
 */
export function applyScrollbarVisibility() {
  const messages = document.getElementById('messages');
  if (messages) {
    if (showChatScrollbar) {
      messages.classList.add('show-scrollbar');
    } else {
      messages.classList.remove('show-scrollbar');
    }
    refreshChatScrollbar();
  }
}

export function loadShowChatScrollbarSetting() {
  const checkbox = document.getElementById('show-chat-scrollbar');
  if (checkbox) {
    const saved = localStorage.getItem('showChatScrollbar');
    if (saved === 'true') {
      checkbox.checked = true;
      showChatScrollbar = true;
    } else {
      checkbox.checked = false;
      showChatScrollbar = false;
    }
    applyScrollbarVisibility();
    checkbox.addEventListener('change', saveShowChatScrollbarSetting);
  }
}

export function saveShowChatScrollbarSetting() {
  const checkbox = document.getElementById('show-chat-scrollbar');
  if (checkbox) {
    showChatScrollbar = checkbox.checked;
    localStorage.setItem('showChatScrollbar', showChatScrollbar);
    applyScrollbarVisibility();
  }
}

export function getShowChatScrollbar() {
  return showChatScrollbar;
}

export function applyScrollToBottomVisibility() {
  const scrollButton = document.getElementById('scroll-to-bottom');
  if (scrollButton) {
    if (showScrollToBottom) {
      scrollButton.classList.remove('force-hidden');
    } else {
      scrollButton.classList.add('force-hidden');
    }
  }
}

export function loadShowScrollToBottomSetting() {
  const checkbox = document.getElementById('show-scroll-to-bottom');
  if (checkbox) {
    const saved = localStorage.getItem('showScrollToBottom');
    if (saved === null || saved === 'true') {
      checkbox.checked = true;
      showScrollToBottom = true;
    } else {
      checkbox.checked = false;
      showScrollToBottom = false;
    }
    applyScrollToBottomVisibility();
    checkbox.addEventListener('change', saveShowScrollToBottomSetting);
  }
}

export function saveShowScrollToBottomSetting() {
  const checkbox = document.getElementById('show-scroll-to-bottom');
  if (checkbox) {
    showScrollToBottom = checkbox.checked;
    localStorage.setItem('showScrollToBottom', showScrollToBottom);
    applyScrollToBottomVisibility();
  }
}

export function getShowScrollToBottom() {
  return showScrollToBottom;
}

export function loadShowModelLabelSetting() {
  if (showModelLabelCheckbox) {
    const savedShowModelLabel = localStorage.getItem("showModelLabel");
    if (savedShowModelLabel === null || savedShowModelLabel === "true") {
      showModelLabelCheckbox.checked = true;
      showModelLabel = true;
    } else {
      showModelLabelCheckbox.checked = false;
      showModelLabel = false;
    }
    applyModelLabelVisibility();

    // Add event listener for the checkbox
    showModelLabelCheckbox.addEventListener("change", saveShowModelLabelSetting);
  }
}

/**
 * Saves the show model label setting to localStorage
 */
export function saveShowModelLabelSetting() {
  if (showModelLabelCheckbox) {
    showModelLabel = showModelLabelCheckbox.checked;
    localStorage.setItem("showModelLabel", showModelLabel);
    applyModelLabelVisibility();
  }
}

/**
 * Gets the current show model label setting
 * @returns {boolean} - True if model labels should be shown
 */
export function getShowModelLabel() {
  return showModelLabel;
}

export function loadSwipeNavigationSetting() {
  if (swipeNavigationCheckbox) {
    const saved = localStorage.getItem("swipeNavigation");
    if (saved === "true") {
      swipeNavigationCheckbox.checked = true;
      swipeNavigationEnabled = true;
    } else {
      swipeNavigationCheckbox.checked = false;
      swipeNavigationEnabled = false;
    }

    // Add event listener for the checkbox
    swipeNavigationCheckbox.addEventListener("change", saveSwipeNavigationSetting);
  }
}

export function saveSwipeNavigationSetting() {
  if (swipeNavigationCheckbox) {
    swipeNavigationEnabled = swipeNavigationCheckbox.checked;
    localStorage.setItem("swipeNavigation", swipeNavigationEnabled);
  }
}

export function getSwipeNavigationEnabled() {
  return swipeNavigationEnabled;
}

/**
 * Forces the app theme to dark mode.
 */
export function loadThemeSetting() {
  localStorage.removeItem("lightThemeEnabled");
  document.body.classList.remove("light-theme");
  document.body.classList.add("dark");
  document.body.classList.add("custom-dark-mode");

  refreshAllCodeBlocks();
}

/**
 * Gets the current theme setting.
 * Retained for compatibility with modules that still query the old theme API.
 */
export function getLightThemeEnabled() {
  return false;
}

/**
 * Gets the current reasoning timeout setting
 * @returns {number} - Timeout in seconds for reasoning models
 */
export function getReasoningTimeout() {
  return reasoningTimeout;
}

/**
 * Sets the reasoning timeout setting
 * @param {number} timeout - Timeout in seconds for reasoning models
 */
export function setReasoningTimeout(timeout) {
  if (timeout && timeout > 0) {
    reasoningTimeout = timeout;
    localStorage.setItem("reasoningTimeout", reasoningTimeout);
  }
}

/**
 * Loads the reasoning timeout setting from localStorage
 */
export function loadReasoningTimeoutSetting() {
  const savedTimeout = localStorage.getItem("reasoningTimeout");
  if (savedTimeout) {
    const parsedTimeout = parseInt(savedTimeout);
    if (!isNaN(parsedTimeout) && parsedTimeout > 0) {
      reasoningTimeout = parsedTimeout;
    }
  }
}

/**
 * Format a voice name and locale into a user-friendly display name
 * @param {Object} voice - The voice object with name, locale, quality, gender, and isNetworkConnectionRequired
 * @returns {string} - User-friendly formatted name
 */
function formatVoiceName(voice) {
  // Mapping of locale codes to readable language/region names
  const localeMap = {
    "en-US": "English (United States)",
    "en-GB": "English (United Kingdom)",
    "en-AU": "English (Australia)",
    "en-CA": "English (Canada)",
    "en-IN": "English (India)",
    "en-ZA": "English (South Africa)",
    "es-ES": "Spanish (Spain)",
    "es-MX": "Spanish (Mexico)",
    "es-US": "Spanish (United States)",
    "es-AR": "Spanish (Argentina)",
    "fr-FR": "French (France)",
    "fr-CA": "French (Canada)",
    "de-DE": "German (Germany)",
    "de-AT": "German (Austria)",
    "it-IT": "Italian (Italy)",
    "pt-BR": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)",
    "ru-RU": "Russian",
    "ja-JP": "Japanese",
    "ko-KR": "Korean",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "zh-HK": "Chinese (Hong Kong)",
    "ar-SA": "Arabic (Saudi Arabia)",
    "ar-EG": "Arabic (Egypt)",
    "hi-IN": "Hindi (India)",
    "nl-NL": "Dutch (Netherlands)",
    "nl-BE": "Dutch (Belgium)",
    "pl-PL": "Polish",
    "tr-TR": "Turkish",
    "sv-SE": "Swedish",
    "da-DK": "Danish",
    "fi-FI": "Finnish",
    "no-NO": "Norwegian",
    "cs-CZ": "Czech",
    "hu-HU": "Hungarian",
    "ro-RO": "Romanian",
    "th-TH": "Thai",
    "vi-VN": "Vietnamese",
    "id-ID": "Indonesian",
    "ms-MY": "Malay",
    "fil-PH": "Filipino",
    "uk-UA": "Ukrainian",
    "el-GR": "Greek",
    "he-IL": "Hebrew",
    "bn-IN": "Bengali (India)",
    "ta-IN": "Tamil (India)",
    "te-IN": "Telugu (India)",
    "ml-IN": "Malayalam (India)",
    "mr-IN": "Marathi (India)",
    "gu-IN": "Gujarati (India)",
    "kn-IN": "Kannada (India)",
  };

  // Normalize the locale (handle both "en_US" and "en-US" formats)
  const normalizedLocale = voice.locale.replace("_", "-");

  // Get the readable locale name
  let localeName = localeMap[normalizedLocale];

  // If not in the map, try to create a readable name from the locale
  if (!localeName) {
    const parts = normalizedLocale.split("-");
    if (parts.length >= 2) {
      const langCode = parts[0].toLowerCase();
      const countryCode = parts[1].toUpperCase();

      // Language name mapping
      const langNames = {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        it: "Italian",
        pt: "Portuguese",
        ru: "Russian",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
        ar: "Arabic",
        hi: "Hindi",
        nl: "Dutch",
        pl: "Polish",
        tr: "Turkish",
        sv: "Swedish",
        da: "Danish",
        fi: "Finnish",
        no: "Norwegian",
        cs: "Czech",
        hu: "Hungarian",
        ro: "Romanian",
        th: "Thai",
        vi: "Vietnamese",
        id: "Indonesian",
        ms: "Malay",
        uk: "Ukrainian",
        el: "Greek",
        he: "Hebrew",
        bn: "Bengali",
        ta: "Tamil",
        te: "Telugu",
        ml: "Malayalam",
        mr: "Marathi",
        gu: "Gujarati",
        kn: "Kannada",
      };

      localeName = langNames[langCode]
        ? `${langNames[langCode]} (${countryCode})`
        : normalizedLocale;
    } else {
      localeName = normalizedLocale;
    }
  }

  // Build the display name
  let displayName = localeName;

  // Add gender if available
  if (voice.gender) {
    const genderCapitalized =
      voice.gender.charAt(0).toUpperCase() + voice.gender.slice(1);
    displayName += ` - ${genderCapitalized}`;
  }

  // Add quality/connection indicator
  if (voice.isNetworkConnectionRequired) {
    displayName += " (Network)";
  } else if (voice.quality === "Very High" || voice.quality === "High") {
    displayName += " (Local)";
  }

  return displayName;
}

/**
 * Loads the Ollama setting from localStorage
 */
export function loadOllamaSetting() {
  // Prefer the new localServerType key; fall back to legacy useOllama for existing users
  const serverType = localStorage.getItem("localServerType");
  if (serverType === "ollama") {
    useOllama = true;
  } else if (serverType === "lmstudio") {
    useOllama = false;
  } else {
    // Legacy path: no localServerType key yet
    useOllama = localStorage.getItem("useOllama") === "true";
  }
  if (ollamaToggleCheckbox) ollamaToggleCheckbox.checked = useOllama;
  updateContextLengthVisibility();
}

/**
 * Saves the Ollama setting to localStorage
 */
export function saveOllamaSetting() {
  if (ollamaToggleCheckbox) {
    useOllama = ollamaToggleCheckbox.checked;
    localStorage.setItem("useOllama", useOllama);
    // Mutual exclusivity: disable hosted providers when Ollama is enabled
    if (useOllama && (useOpenRouter || useOpenAICompatible)) {
      useOpenRouter = false;
      useOpenAICompatible = false;
      localStorage.setItem("useOpenRouter", 'false');
      localStorage.setItem("useOpenAICompatible", 'false');
      if (openRouterToggleCheckbox) openRouterToggleCheckbox.checked = false;
      if (openAICompatibleToggleCheckbox) openAICompatibleToggleCheckbox.checked = false;
      updateProviderUI();
      window.currentLoadedModel = localStorage.getItem('localSelectedModel') || null;
    }
  }
}

/**
 * Gets the current Ollama setting
 * @returns {boolean} - True if Ollama is enabled
 */
export function getUseOllama() {
  return useOllama;
}

/**
 * Sets the local server type ('lmstudio' | 'ollama'), persists both keys, and
 * enforces mutual exclusivity with cloud providers.
 * @param {string} type
 */
export function setLocalServerType(type) {
  localStorage.setItem('localServerType', type);
  useOllama = (type === 'ollama');
  localStorage.setItem('useOllama', String(useOllama));
  if (useOllama && (useOpenRouter || useOpenAICompatible)) {
    useOpenRouter = false;
    useOpenAICompatible = false;
    localStorage.setItem('useOpenRouter', 'false');
    localStorage.setItem('useOpenAICompatible', 'false');
    if (openRouterToggleCheckbox) openRouterToggleCheckbox.checked = false;
    if (openAICompatibleToggleCheckbox) openAICompatibleToggleCheckbox.checked = false;
    updateProviderUI();
    window.currentLoadedModel = localStorage.getItem('localSelectedModel') || null;
  }
  updateContextLengthVisibility();
}

/**
 * Synchronizes the mode indicator icon in the header with the current provider state.
 */
function getCurrentProviderForModeIndicator() {
  if (useOpenRouter) {
    return 'openrouter';
  }

  if (useOpenAICompatible) {
    return 'openai-compatible';
  }

  return 'local';
}

function getModeActivityMap() {
  try {
    const rawValue = localStorage.getItem(MODE_ACTIVITY_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function hasModeActivity(provider) {
  const activityMap = getModeActivityMap();
  return activityMap[provider] === true;
}

function saveModeActivity(provider, isActive) {
  const normalizedProvider = provider === 'openrouter' || provider === 'openai-compatible'
    ? provider
    : 'local';

  const activityMap = getModeActivityMap();
  activityMap[normalizedProvider] = !!isActive;
  localStorage.setItem(MODE_ACTIVITY_STORAGE_KEY, JSON.stringify(activityMap));
}

function syncModeIndicator() {
  if (!modeIndicator) return;

  const statusText = modeIndicator.querySelector('.status-text');
  const statusDot = modeIndicator.querySelector('.status-dot');
  if (!statusText) return;

  if (useOpenRouter) {
    statusText.textContent = "OPENROUTER";
    modeIndicator.title = "Current AI Mode: Cloud (OpenRouter)";
  } else if (useOpenAICompatible) {
    statusText.textContent = "Custom Endpoint";
    modeIndicator.title = "Current AI Mode: OpenAI-Compatible Endpoint";
  } else {
    statusText.textContent = "LOCAL SERVER";
    modeIndicator.title = "Current AI Mode: Local Server";
  }

  if (statusDot) {
    const provider = getCurrentProviderForModeIndicator();
    const isActive = hasModeActivity(provider);
    statusDot.classList.toggle('is-active', isActive);
    statusDot.classList.toggle('is-inactive', !isActive);
  }
}

export function markCurrentModeActivity() {
  saveModeActivity(getCurrentProviderForModeIndicator(), true);
  syncModeIndicator();
}

/**
 * Updates connection provider panels and button active states.
 */
function syncWelcomeProviderCardState(cardId, isActive) {
  const cardElement = document.getElementById(cardId);
  if (!cardElement) {
    return;
  }

  cardElement.classList.toggle('active', isActive);
  cardElement.setAttribute('aria-pressed', isActive ? 'true' : 'false');
}

function updateProviderUI() {
  const currentProvider = useOpenRouter ? 'openrouter' : (useOpenAICompatible ? 'openai-compatible' : 'local');

  // Sync Welcome Dashboard Cards
  syncWelcomeProviderCardState('setup-local-btn', currentProvider === 'local');
  syncWelcomeProviderCardState('setup-openrouter-btn', currentProvider === 'openrouter');
  syncWelcomeProviderCardState('setup-custom-btn', currentProvider === 'openai-compatible');
  const isCloudMode = useOpenRouter || useOpenAICompatible;
  const localPanel = document.getElementById('local-server-settings');
  const openRouterPanel = document.getElementById('openrouter-settings');
  const openAICompatiblePanel = document.getElementById('openai-compatible-settings');
  const localBtn = document.getElementById('select-local-server');
  const openRouterBtn = document.getElementById('select-openrouter');
  const openAICompatibleBtn = document.getElementById('select-openai-compatible');

  syncModeIndicator();

  if (useOpenRouter) {
    if (localPanel) localPanel.classList.add('hidden');
    if (openRouterPanel) openRouterPanel.classList.remove('hidden');
    if (openAICompatiblePanel) openAICompatiblePanel.classList.add('hidden');
    if (localBtn) { localBtn.classList.remove('active'); localBtn.setAttribute('aria-pressed', 'false'); }
    if (openRouterBtn) { openRouterBtn.classList.add('active'); openRouterBtn.setAttribute('aria-pressed', 'true'); }
    if (openAICompatibleBtn) { openAICompatibleBtn.classList.remove('active'); openAICompatibleBtn.setAttribute('aria-pressed', 'false'); }

    const wrapper = document.querySelector('.openrouter-key-input-wrapper');
    if (wrapper) {
      const hasKey = (openRouterApiKeyInput && openRouterApiKeyInput.value.trim().length > 0)
        || (localStorage.getItem('openRouterApiKey') || '').length > 0;
      if (!hasKey) wrapper.classList.add('key-required');
    }
  } else if (useOpenAICompatible) {
    if (localPanel) localPanel.classList.add('hidden');
    if (openRouterPanel) openRouterPanel.classList.add('hidden');
    if (openAICompatiblePanel) openAICompatiblePanel.classList.remove('hidden');
    if (localBtn) { localBtn.classList.remove('active'); localBtn.setAttribute('aria-pressed', 'false'); }
    if (openRouterBtn) { openRouterBtn.classList.remove('active'); openRouterBtn.setAttribute('aria-pressed', 'false'); }
    if (openAICompatibleBtn) { openAICompatibleBtn.classList.add('active'); openAICompatibleBtn.setAttribute('aria-pressed', 'true'); }

    const wrapper = document.querySelector('.openrouter-key-input-wrapper');
    if (wrapper) wrapper.classList.remove('key-required');
  } else {
    if (localPanel) localPanel.classList.remove('hidden');
    if (openRouterPanel) openRouterPanel.classList.add('hidden');
    if (openAICompatiblePanel) openAICompatiblePanel.classList.add('hidden');
    if (localBtn) { localBtn.classList.add('active'); localBtn.setAttribute('aria-pressed', 'true'); }
    if (openRouterBtn) { openRouterBtn.classList.remove('active'); openRouterBtn.setAttribute('aria-pressed', 'false'); }
    if (openAICompatibleBtn) { openAICompatibleBtn.classList.remove('active'); openAICompatibleBtn.setAttribute('aria-pressed', 'false'); }

    const wrapper = document.querySelector('.openrouter-key-input-wrapper');
    if (wrapper) wrapper.classList.remove('key-required');
  }

  // Smart Reply still requires a separate follow-up API call, but chat titles now
  // ride along with the first reply, so only Smart Reply needs OpenRouter gating.
  const smartReplyContainer = document.getElementById('smart-reply-setting');
  const smartReplyDesc = document.getElementById('smart-reply-description');
  if (isCloudMode) {
    // Visually disable and uncheck Smart Reply; don't overwrite localStorage so preference is restored later
    if (autoSmartReplyCheckbox) {
      autoSmartReplyCheckbox.checked = false;
      autoSmartReplyCheckbox.disabled = true;
    }
    autoSmartReply = false;
    if (smartReplyContainer) smartReplyContainer.style.opacity = '0.4';
    if (smartReplyDesc) smartReplyDesc.textContent = 'Not available with hosted providers. Smart Reply requires a local LLM connection.';
    
    // Generate Chat Titles stays available with OpenRouter because it no longer
    // requires a separate title-only request.
    syncAutoGenerateTitlesUI();
  } else {
    // Re-enable Smart Reply toggle and restore saved preference
    if (autoSmartReplyCheckbox) {
      autoSmartReplyCheckbox.disabled = false;
      const savedAutoSmartReply = localStorage.getItem('autoSmartReply');
      autoSmartReplyCheckbox.checked = savedAutoSmartReply === 'true';
      autoSmartReply = savedAutoSmartReply === 'true';
    }
    if (smartReplyContainer) smartReplyContainer.style.opacity = '';
    if (smartReplyDesc) smartReplyDesc.textContent = 'When enabled, the LLM will analyze the conversation and suggest interactive tap-to-reply options above the chat input.';
    
    syncAutoGenerateTitlesUI();
  }

  document.dispatchEvent(new CustomEvent('lmsa:connection-provider-changed', {
    detail: { provider: currentProvider }
  }));

}

function refreshLocalLmStudioLoadedModelState() {
  if (useOpenRouter || useOpenAICompatible || useOllama) {
    return;
  }

  window.currentLoadedModel = null;

  import('./api-service.js')
    .then(({ fetchAvailableModels }) => fetchAvailableModels({
      forceRefresh: true,
      disableSelectionFallback: true
    }))
    .catch(error => {
      console.error('Failed to refresh LM Studio loaded model detection:', error);
    });
}

/**
 * Loads the OpenRouter settings from localStorage
 */
export function loadOpenRouterSettings() {
  const savedUseOpenRouter = localStorage.getItem('useOpenRouter');
  const savedUseOpenAICompatible = localStorage.getItem('useOpenAICompatible');
  useOpenRouter = (savedUseOpenRouter === 'true');
  useOpenAICompatible = (savedUseOpenAICompatible === 'true');

  // Keep provider selection mutually exclusive in case stale keys exist.
  if (useOpenRouter && useOpenAICompatible) {
    useOpenAICompatible = false;
    localStorage.setItem('useOpenAICompatible', 'false');
  }

  if (openRouterToggleCheckbox) {
    openRouterToggleCheckbox.checked = useOpenRouter;
    openRouterToggleCheckbox.addEventListener('change', saveOpenRouterSettings);
  }

  if (openAICompatibleToggleCheckbox) {
    openAICompatibleToggleCheckbox.checked = useOpenAICompatible;
    openAICompatibleToggleCheckbox.addEventListener('change', saveOpenAICompatibleSettings);
  }

  const savedKey = localStorage.getItem('openRouterApiKey');
  if (savedKey) {
    openRouterApiKey = savedKey;
    if (openRouterApiKeyInput) openRouterApiKeyInput.value = savedKey;
  }

  if (openRouterApiKeyInput) {
    openRouterApiKeyInput.addEventListener('input', () => {
      openRouterApiKey = openRouterApiKeyInput.value;
      localStorage.setItem('openRouterApiKey', openRouterApiKey);
      // Stop pulsing once the user starts typing a key
      if (openRouterApiKey.length > 0) {
        const wrapper = document.querySelector('.openrouter-key-input-wrapper');
        if (wrapper) wrapper.classList.remove('key-required');
      }
    });
  }

  const savedOpenAIEndpoint = localStorage.getItem('openAICompatibleEndpoint') || '';
  openAICompatibleEndpoint = savedOpenAIEndpoint;
  if (openAICompatibleEndpointInput) {
    openAICompatibleEndpointInput.value = savedOpenAIEndpoint;
    openAICompatibleEndpointInput.addEventListener('input', () => {
      openAICompatibleEndpoint = openAICompatibleEndpointInput.value;
      localStorage.setItem('openAICompatibleEndpoint', openAICompatibleEndpoint);
    });
  }

  const savedOpenAIKey = localStorage.getItem('openAICompatibleApiKey') || '';
  openAICompatibleApiKey = savedOpenAIKey;
  if (openAICompatibleApiKeyInput) {
    openAICompatibleApiKeyInput.value = savedOpenAIKey;
    openAICompatibleApiKeyInput.addEventListener('input', () => {
      openAICompatibleApiKey = openAICompatibleApiKeyInput.value;
      localStorage.setItem('openAICompatibleApiKey', openAICompatibleApiKey);
    });
  }

  // Click handlers for the connection type selector buttons
  const localServerBtn = document.getElementById('select-local-server');
  const openRouterSelectorBtn = document.getElementById('select-openrouter');
  const openAICompatibleSelectorBtn = document.getElementById('select-openai-compatible');

  if (localServerBtn) {
    localServerBtn.addEventListener('click', () => {
      if (useOpenRouter || useOpenAICompatible) {
        if (openRouterToggleCheckbox) openRouterToggleCheckbox.checked = false;
        if (openAICompatibleToggleCheckbox) openAICompatibleToggleCheckbox.checked = false;
        useOpenRouter = false;
        useOpenAICompatible = false;
        localStorage.setItem('useOpenRouter', 'false');
        localStorage.setItem('useOpenAICompatible', 'false');
        updateProviderUI();
        refreshLocalLmStudioLoadedModelState();
      }
    });
  }

  if (openRouterSelectorBtn) {
    openRouterSelectorBtn.addEventListener('click', () => {
      if (!useOpenRouter) {
        if (openRouterToggleCheckbox) openRouterToggleCheckbox.checked = true;
        saveOpenRouterSettings();
      }
    });
  }

  if (openAICompatibleSelectorBtn) {
    openAICompatibleSelectorBtn.addEventListener('click', () => {
      if (!useOpenAICompatible) {
        if (openAICompatibleToggleCheckbox) openAICompatibleToggleCheckbox.checked = true;
        saveOpenAICompatibleSettings();
      }
    });
  }

  updateProviderUI();
  refreshLocalLmStudioLoadedModelState();
}

/**
 * Saves the OpenRouter settings to localStorage
 */
export function saveOpenRouterSettings() {
  const isEnabling = openRouterToggleCheckbox && openRouterToggleCheckbox.checked;

  if (isEnabling) {
    // Temporarily revert the checkbox until the user confirms the warning
    openRouterToggleCheckbox.checked = false;

    showOpenRouterWarningModal(
      () => {
        // User confirmed — enable OpenRouter
        openRouterToggleCheckbox.checked = true;
        useOpenRouter = true;
        localStorage.setItem('useOpenRouter', 'true');
        useOpenAICompatible = false;
        localStorage.setItem('useOpenAICompatible', 'false');
        if (openAICompatibleToggleCheckbox) openAICompatibleToggleCheckbox.checked = false;
        if (openRouterApiKeyInput) {
          openRouterApiKey = openRouterApiKeyInput.value;
          localStorage.setItem('openRouterApiKey', openRouterApiKey);
        }
        updateProviderUI();
        // Mutual exclusivity: disable Ollama when OpenRouter is enabled
        if (useOllama) {
          useOllama = false;
          localStorage.setItem('useOllama', 'false');
          if (ollamaToggleCheckbox) ollamaToggleCheckbox.checked = false;
        }
        // Restore last used OpenRouter model so the next message uses the correct model ID
        window.currentLoadedModel = localStorage.getItem('openRouterSelectedModel') || null;
      },
      () => {
        // User cancelled — keep OpenRouter disabled
        openRouterToggleCheckbox.checked = false;
      }
    );
  } else {
    // User is disabling OpenRouter — no warning needed
    useOpenRouter = false;
    localStorage.setItem('useOpenRouter', 'false');
    if (openRouterApiKeyInput) {
      openRouterApiKey = openRouterApiKeyInput.value;
      localStorage.setItem('openRouterApiKey', openRouterApiKey);
    }

    if (useOpenAICompatible) {
      window.currentLoadedModel = localStorage.getItem('openAICompatibleSelectedModel') || null;
    } else {
      refreshLocalLmStudioLoadedModelState();
    }
    updateProviderUI();
  }
}

export function saveOpenAICompatibleSettings() {
  const isEnabling = openAICompatibleToggleCheckbox && openAICompatibleToggleCheckbox.checked;

  if (isEnabling) {
    useOpenAICompatible = true;
    localStorage.setItem('useOpenAICompatible', 'true');
    useOpenRouter = false;
    localStorage.setItem('useOpenRouter', 'false');
    if (openRouterToggleCheckbox) openRouterToggleCheckbox.checked = false;
    if (openAICompatibleEndpointInput) {
      openAICompatibleEndpoint = openAICompatibleEndpointInput.value;
      localStorage.setItem('openAICompatibleEndpoint', openAICompatibleEndpoint);
    }
    if (openAICompatibleApiKeyInput) {
      openAICompatibleApiKey = openAICompatibleApiKeyInput.value;
      localStorage.setItem('openAICompatibleApiKey', openAICompatibleApiKey);
    }
    if (useOllama) {
      useOllama = false;
      localStorage.setItem('useOllama', 'false');
      if (ollamaToggleCheckbox) ollamaToggleCheckbox.checked = false;
    }
    updateProviderUI();
    updateContextLengthVisibility();
    window.currentLoadedModel = localStorage.getItem('openAICompatibleSelectedModel') || null;
  } else {
    useOpenAICompatible = false;
    localStorage.setItem('useOpenAICompatible', 'false');
    if (openAICompatibleEndpointInput) {
      openAICompatibleEndpoint = openAICompatibleEndpointInput.value;
      localStorage.setItem('openAICompatibleEndpoint', openAICompatibleEndpoint);
    }
    if (openAICompatibleApiKeyInput) {
      openAICompatibleApiKey = openAICompatibleApiKeyInput.value;
      localStorage.setItem('openAICompatibleApiKey', openAICompatibleApiKey);
    }
    updateProviderUI();
    updateContextLengthVisibility();
    refreshLocalLmStudioLoadedModelState();
  }
}

export function applyConnectionProviderSelection(provider) {
  const normalizedProvider = provider === 'openrouter' || provider === 'openai-compatible'
    ? provider
    : 'local';

  useOpenRouter = normalizedProvider === 'openrouter';
  useOpenAICompatible = normalizedProvider === 'openai-compatible';

  localStorage.setItem('useOpenRouter', useOpenRouter ? 'true' : 'false');
  localStorage.setItem('useOpenAICompatible', useOpenAICompatible ? 'true' : 'false');

  if (openRouterToggleCheckbox) {
    openRouterToggleCheckbox.checked = useOpenRouter;
  }

  if (openAICompatibleToggleCheckbox) {
    openAICompatibleToggleCheckbox.checked = useOpenAICompatible;
  }

  if ((useOpenRouter || useOpenAICompatible) && useOllama) {
    useOllama = false;
    localStorage.setItem('useOllama', 'false');
    if (ollamaToggleCheckbox) {
      ollamaToggleCheckbox.checked = false;
    }
  }

  syncWelcomeProviderCardState('setup-local-btn', normalizedProvider === 'local');
  syncWelcomeProviderCardState('setup-openrouter-btn', normalizedProvider === 'openrouter');
  syncWelcomeProviderCardState('setup-custom-btn', normalizedProvider === 'openai-compatible');

  if (!contextLengthOverrideEnabled || contextLength === 0) {
    const input = contextLengthInput || document.getElementById('context-length-input');
    const valueDisplay = contextLengthValue || document.getElementById('context-length-value');
    updateContextLengthUI(input, valueDisplay);
  }

  updateProviderUI();
  updateContextLengthVisibility();

  if (useOpenRouter) {
    window.currentLoadedModel = localStorage.getItem('openRouterSelectedModel') || null;
  } else if (useOpenAICompatible) {
    window.currentLoadedModel = localStorage.getItem('openAICompatibleSelectedModel') || null;
  } else {
    refreshLocalLmStudioLoadedModelState();
  }
}

/**
 * Gets the current OpenRouter enabled state
 * @returns {boolean}
 */
export function getUseOpenRouter() {
  return useOpenRouter;
}

export function getUseOpenAICompatible() {
  return useOpenAICompatible;
}

export function getIsCloudProviderActive() {
  return useOpenRouter || useOpenAICompatible;
}

/**
 * Gets the current OpenRouter API key
 * @returns {string}
 */
export function getOpenRouterApiKey() {
  return openRouterApiKey;
}

export function setOpenRouterApiKey(apiKey) {
  openRouterApiKey = typeof apiKey === 'string' ? apiKey : '';
  if (openRouterApiKey) {
    localStorage.setItem('openRouterApiKey', openRouterApiKey);
  } else {
    localStorage.removeItem('openRouterApiKey');
  }

  if (openRouterApiKeyInput) {
    openRouterApiKeyInput.value = openRouterApiKey;
  }
}

export function getOpenAICompatibleEndpoint() {
  return openAICompatibleEndpoint;
}

export function setOpenAICompatibleEndpoint(endpoint) {
  openAICompatibleEndpoint = typeof endpoint === 'string' ? endpoint : '';
  if (openAICompatibleEndpoint) {
    localStorage.setItem('openAICompatibleEndpoint', openAICompatibleEndpoint);
  } else {
    localStorage.removeItem('openAICompatibleEndpoint');
  }

  if (openAICompatibleEndpointInput) {
    openAICompatibleEndpointInput.value = openAICompatibleEndpoint;
  }
}

export function getOpenAICompatibleApiKey() {
  return openAICompatibleApiKey;
}

export function setOpenAICompatibleApiKey(apiKey) {
  openAICompatibleApiKey = typeof apiKey === 'string' ? apiKey : '';
  if (openAICompatibleApiKey) {
    localStorage.setItem('openAICompatibleApiKey', openAICompatibleApiKey);
  } else {
    localStorage.removeItem('openAICompatibleApiKey');
  }

  if (openAICompatibleApiKeyInput) {
    openAICompatibleApiKeyInput.value = openAICompatibleApiKey;
  }
}

/**
 * Clears the OpenRouter API key from memory, localStorage, and the input field
 */
export function clearOpenRouterApiKey() {
  openRouterApiKey = '';
  localStorage.removeItem('openRouterApiKey');
  if (openRouterApiKeyInput) openRouterApiKeyInput.value = '';
}

/**
 * Loads the LM Studio API token from localStorage.
 * The token is optional — only sent when the LM Studio server requires authentication.
 */
export function loadLMStudioApiTokenSetting() {
  const savedToken = localStorage.getItem('lmStudioApiToken');
  if (savedToken) {
    lmStudioApiToken = savedToken;
  }
}

/**
 * Gets the current reasoning level setting.
 * @returns {string} - The reasoning level (default, disabled, low, medium, high).
 */
export function getReasoningLevel() {
  return reasoningLevel;
}

/**
 * Gets the current LM Studio API token.
 * @returns {string} - The token string, or empty string if not set.
 */
export function getLMStudioApiToken() {
  return lmStudioApiToken;
}

export function setReasoningLevel(level) {
  reasoningLevel = level;
  localStorage.setItem('reasoningLevel', level);
  const select = document.getElementById('reasoning-level-select');
  if (select) {
    select.value = level;
  }
}

/**
 * Sets and persists the LM Studio API token.
 * @param {string} token
 */
export function setLMStudioApiToken(token) {
  lmStudioApiToken = token || '';
  if (lmStudioApiToken) {
    localStorage.setItem('lmStudioApiToken', lmStudioApiToken);
  } else {
    localStorage.removeItem('lmStudioApiToken');
  }
}

/**
 * Clears the LM Studio API token from memory and localStorage.
 */
export function clearLMStudioApiToken() {
  lmStudioApiToken = '';
  localStorage.removeItem('lmStudioApiToken');
}

function normalizeLMStudioMcpIntegrations(value) {
  const integrations = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  return integrations.filter(entry =>
    typeof entry === 'string' ||
    (entry && typeof entry === 'object' && !Array.isArray(entry))
  );
}

function parseLMStudioMcpIntegrations(rawValue) {
  if (!rawValue || !rawValue.trim()) {
    return [];
  }

  try {
    return normalizeLMStudioMcpIntegrations(JSON.parse(rawValue));
  } catch (error) {
    console.warn('Failed to parse LM Studio MCP integrations from storage:', error);
    return [];
  }
}

/**
 * Loads LM Studio MCP integrations from localStorage.
 * Stored as a JSON array matching LM Studio's native integrations payload.
 */
export function loadLMStudioMcpIntegrationsSetting() {
  lmStudioMcpIntegrations = parseLMStudioMcpIntegrations(
    localStorage.getItem('lmStudioMcpIntegrations') || ''
  );
}

/**
 * Gets the current LM Studio MCP integrations payload.
 * @returns {Array<string|Object>}
 */
export function getLMStudioMcpIntegrations() {
  return JSON.parse(JSON.stringify(lmStudioMcpIntegrations));
}

/**
 * Returns the raw JSON string used to configure LM Studio MCP integrations.
 * @returns {string}
 */
export function getLMStudioMcpIntegrationsRaw() {
  return localStorage.getItem('lmStudioMcpIntegrations') || '';
}

/**
 * Checks whether LM Studio native MCP integrations are configured.
 * @returns {boolean}
 */
export function hasLMStudioMcpIntegrations() {
  return lmStudioMcpIntegrations.length > 0;
}

/**
 * Sets and persists LM Studio MCP integrations.
 * Accepts a JSON string, array, or single integration object/string.
 * @param {string|Array|Object} value
 */
export function setLMStudioMcpIntegrations(value) {
  let integrations = [];

  if (typeof value === 'string') {
    integrations = parseLMStudioMcpIntegrations(value);
  } else {
    integrations = normalizeLMStudioMcpIntegrations(value);
  }

  lmStudioMcpIntegrations = integrations;

  if (integrations.length > 0) {
    localStorage.setItem('lmStudioMcpIntegrations', JSON.stringify(integrations, null, 2));
  } else {
    localStorage.removeItem('lmStudioMcpIntegrations');
  }
}

/**
 * Clears LM Studio MCP integrations from memory and localStorage.
 */
export function clearLMStudioMcpIntegrations() {
  lmStudioMcpIntegrations = [];
  localStorage.removeItem('lmStudioMcpIntegrations');
}

/**
 * Initialize TTS voice selection
 */
export async function initializeTTSVoiceSelection() {
  const voiceSelect = document.getElementById("tts-voice-select");
  if (!voiceSelect) {
    debugLog("TTS voice select element not found");
    return;
  }

  try {
    // Load available voices from TTS service
    if (window.TTSService) {
      const voices = await window.TTSService.getAvailableVoices();

      // Clear the loading option
      voiceSelect.innerHTML = "";

      // Add default option
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Default Voice";
      voiceSelect.appendChild(defaultOption);

      // Group voices by language for better organization
      const voicesByLanguage = {};
      voices.forEach((voice) => {
        const langCode = voice.locale.split("-")[0]; // Get base language code
        if (!voicesByLanguage[langCode]) {
          voicesByLanguage[langCode] = [];
        }
        voicesByLanguage[langCode].push(voice);
      });

      // Sort language groups and add voices
      Object.keys(voicesByLanguage)
        .sort()
        .forEach((langCode) => {
          const languageVoices = voicesByLanguage[langCode];

          // Sort voices within each language group
          languageVoices.sort((a, b) => {
            // Prioritize local voices over network voices
            if (a.quality === "High" && b.quality !== "High") return -1;
            if (a.quality !== "High" && b.quality === "High") return 1;
            return a.locale.localeCompare(b.locale);
          });

          // Add each voice with formatted name
          languageVoices.forEach((voice) => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = formatVoiceName(voice);

            // Add data attributes for debugging and reference
            option.setAttribute("data-voice-technical-name", voice.name);
            option.setAttribute("data-voice-locale", voice.locale);
            option.setAttribute("data-voice-gender", voice.gender || "");

            voiceSelect.appendChild(option);
          });
        });

      // Load saved voice preference
      const savedVoice = localStorage.getItem("ttsVoice");
      if (savedVoice && isPremiumUser()) {
        selectedTTSVoice = savedVoice;
        voiceSelect.value = savedVoice;

        // Apply the saved voice to the TTS service
        const voiceApplied = await window.TTSService.setVoice(savedVoice);
        if (!voiceApplied) {
          selectedTTSVoice = null;
          voiceSelect.value = "";
          localStorage.removeItem("ttsVoice");
          debugLog("Saved TTS voice was unavailable and has been cleared");
        }
      } else if (savedVoice) {
        selectedTTSVoice = null;
        voiceSelect.value = "";
        await window.TTSService.setVoice("");
        debugLog("Saved premium TTS voice is locked for the free tier; using default voice");
      }

      updateTTSVoicePremiumState(voiceSelect);

      // Add the change listener only once even if the settings modal is reopened.
      if (voiceSelect.dataset.ttsVoiceListenerAttached !== "true") {
        voiceSelect.addEventListener("change", async (e) => {
          const voiceName = e.target.value;

          if (voiceName) {
            if (!isPremiumUser()) {
              selectedTTSVoice = null;
              e.target.value = "";
              await window.TTSService.setVoice("");
              requestTTSVoicePremiumAccess();
              return;
            }

            selectedTTSVoice = voiceName;
            localStorage.setItem("ttsVoice", voiceName);
            const voiceApplied = await window.TTSService.setVoice(voiceName);
            if (!voiceApplied) {
              selectedTTSVoice = null;
              e.target.value = "";
              localStorage.removeItem("ttsVoice");
              await window.TTSService.setVoice("");
              debugLog("Unable to apply the selected TTS voice; reverted to default");
              return;
            }
            debugLog("TTS voice set to:", voiceName);
          } else {
            selectedTTSVoice = null;
            localStorage.removeItem("ttsVoice");
            await window.TTSService.setVoice("");
            debugLog("TTS voice reset to default");
          }
        });
        voiceSelect.dataset.ttsVoiceListenerAttached = "true";
      }

      debugLog("TTS voice selection initialized with", voices.length, "voices");
    } else {
      debugLog("TTSService not available");
    }
  } catch (error) {
    console.error("Error initializing TTS voice selection:", error);
    voiceSelect.innerHTML = '<option value="">Error loading voices</option>';
  }
}

/**
 * Get selected TTS voice
 */
export function getSelectedTTSVoice() {
  return selectedTTSVoice;
}

/**
 * Set selected TTS voice
 */
export async function setSelectedTTSVoice(voiceName) {
  if (voiceName && !isPremiumUser()) {
    selectedTTSVoice = null;
    await syncTTSVoiceSelectionForAccess();
    return false;
  }

  selectedTTSVoice = voiceName;
  if (voiceName) {
    localStorage.setItem("ttsVoice", voiceName);
    if (window.TTSService) {
      const voiceApplied = await window.TTSService.setVoice(voiceName);
      if (!voiceApplied) {
        selectedTTSVoice = null;
        localStorage.removeItem("ttsVoice");
        await window.TTSService.setVoice("");
        return false;
      }
    }
  } else {
    localStorage.removeItem("ttsVoice");
    if (window.TTSService) {
      await window.TTSService.setVoice("");
    }
  }

  updateTTSVoicePremiumState();
  return true;
}

/**
 * Applies the current chat font settings via CSS custom properties on the root element.
 */
function applyFontSettings() {
  document.documentElement.style.setProperty('--chat-font-family', chatFontFamily);
  document.documentElement.style.setProperty('--chat-font-size', chatFontSize);
}

/**
 * Loads the chat font family and font size settings from localStorage.
 */
export function loadChatFontSettings() {
  const savedFontFamily = localStorage.getItem('chatFontFamily');
  const savedFontSize = localStorage.getItem('chatFontSize');

  if (savedFontFamily) {
    chatFontFamily = savedFontFamily;
  }
  if (savedFontSize && ALLOWED_CHAT_FONT_SIZES.includes(savedFontSize)) {
    chatFontSize = savedFontSize;
  } else if (savedFontSize) {
    // Reset unsupported legacy values so message bubbles remain readable.
    chatFontSize = '16px';
    localStorage.setItem('chatFontSize', chatFontSize);
  }

  applyFontSettings();

  const fontFamilySelect = document.getElementById('chat-font-family-select');
  const fontSizeSelect = document.getElementById('chat-font-size-select');

  if (fontFamilySelect) {
    fontFamilySelect.value = chatFontFamily;
    fontFamilySelect.addEventListener('change', saveChatFontSettings);
  }

  if (fontSizeSelect) {
    fontSizeSelect.value = chatFontSize;
    fontSizeSelect.addEventListener('change', saveChatFontSettings);
  }
}

/**
 * Saves the chat font settings to localStorage and applies them immediately.
 */
export function saveChatFontSettings() {
  const fontFamilySelect = document.getElementById('chat-font-family-select');
  const fontSizeSelect = document.getElementById('chat-font-size-select');

  if (fontFamilySelect) {
    chatFontFamily = fontFamilySelect.value;
    localStorage.setItem('chatFontFamily', chatFontFamily);
  }
  if (fontSizeSelect) {
    chatFontSize = fontSizeSelect.value;
    localStorage.setItem('chatFontSize', chatFontSize);
  }

  applyFontSettings();
}

/**
 * Gets the current chat font family setting.
 * @returns {string}
 */
export function getChatFontFamily() {
  return chatFontFamily;
}

/**
 * Gets the current chat font size setting.
 * @returns {string}
 */
export function getChatFontSize() {
  return chatFontSize;
}

function showResetConfirmModal(message, onConfirm) {
  const modal = document.getElementById('reset-to-default-modal');
  const msgEl = document.getElementById('reset-to-default-message');
  if (!modal) return;
  pendingResetCallback = onConfirm;
  if (msgEl) msgEl.textContent = message;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.offsetHeight; // force reflow so transition plays from opacity 0
  modal.classList.add('modal-visible');
  // Re-trigger box slide-in animation each open
  const box = modal.querySelector('.connection-input-modal-box');
  if (box) {
    box.classList.remove('animate-modal-in');
    box.offsetHeight;
    box.classList.add('animate-modal-in');
  }
}

function hideResetConfirmModal() {
  const modal = document.getElementById('reset-to-default-modal');
  if (!modal) return;
  pendingResetCallback = null;
  modal.classList.remove('modal-visible');
  modal.addEventListener('transitionend', () => {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }, { once: true });
}

export function initResetToDefaultModal() {
  const confirmBtn = document.getElementById('confirm-reset-to-default');
  const cancelBtn = document.getElementById('cancel-reset-to-default');
  const closeBtn = document.getElementById('close-reset-to-default-modal');
  const modal = document.getElementById('reset-to-default-modal');
  if (!modal) return;

  confirmBtn?.addEventListener('click', () => {
    if (pendingResetCallback) pendingResetCallback();
    hideResetConfirmModal();
  });
  cancelBtn?.addEventListener('click', hideResetConfirmModal);
  closeBtn?.addEventListener('click', hideResetConfirmModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideResetConfirmModal();
  });
}

export function loadSettings() {
  initResetToDefaultModal();
  initializeSettingsToggleCards();
  initializeSystemPrompt();
  initializeTemperature();
  loadMaxTokensSetting();
  loadContextLengthSetting();
  loadHideThinkingSetting();
  loadReasoningLevelSetting();
  loadAutoGenerateTitlesSetting();
  loadWebSearchSetting();
  loadBraveSearchSettings();
  loadAutoSmartReplySetting();
  loadBiometricSetting();
  loadAutoScrollSetting();
  loadEnterSendsNewlineSetting();
  loadThemeSetting();
  loadReasoningTimeoutSetting();
  loadDefaultModelSetting();
  loadOllamaSetting();
  loadOpenRouterSettings();
  loadLMStudioApiTokenSetting();
  loadLMStudioMcpIntegrationsSetting();
  loadShowModelLabelSetting();
  loadShowChatScrollbarSetting();
  loadSwipeNavigationSetting();
  loadShowScrollToBottomSetting();
  loadChatFontSettings();
  // TTS voice selection will be initialized separately when settings modal opens
}

/**
 * Gets the current system prompt
 * @returns {string} - The current system prompt
 */
export function getSystemPrompt() {
  return systemPrompt;
}

// Track if biometric event listener has been attached to prevent duplicates
let biometricListenerAttached = false;

export function loadBiometricSetting() {
  const checkbox = document.getElementById("require-biometric");
  if (checkbox) {
    const saved = localStorage.getItem("requireBiometric");
    if (saved === "true") {
      checkbox.checked = true;
      requireBiometric = true;
    } else {
      checkbox.checked = false;
      requireBiometric = false;
    }

    if (!isPremiumUser() && requireBiometric) {
      checkbox.checked = false;
      requireBiometric = false;
      localStorage.setItem("requireBiometric", "false");
    }

    // Only attach listener once to prevent duplicate handlers
    if (!biometricListenerAttached) {
      checkbox.addEventListener("change", saveBiometricSetting);
      biometricListenerAttached = true;
      console.log('[Biometric] Event listener attached to require-biometric checkbox');
    }
  } else {
    console.log('[Biometric] Checkbox not found in DOM - will retry when settings modal opens');
  }
}

export async function saveBiometricSetting() {
  console.log('[Biometric] saveBiometricSetting() called');
  const checkbox = document.getElementById("require-biometric");
  if (checkbox) {
    const isChecked = checkbox.checked;
    console.log('[Biometric] Checkbox checked:', isChecked);
    
    if (isChecked) {
      const isPremium = typeof window.hasPremiumAccess === 'function'
        ? window.hasPremiumAccess()
        : window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus();
      console.log('[Biometric] isPremium:', isPremium);

      if (!isPremium) {
        console.log('[Biometric] Not premium, showing premium modal');
        if (typeof window.openPremiumModal === 'function') {
            window.openPremiumModal('Biometric Unlock');
        }
        checkbox.checked = false;
        requireBiometric = false;
        localStorage.setItem("requireBiometric", "false");
        return;
      }

      // First check if biometrics are actually supported on this device
      const biometricSupported = isBiometricSupported();
      console.log('[Biometric] Device supports biometrics:', biometricSupported);
      
      if (!biometricSupported) {
        console.log('[Biometric] Biometrics not supported on device, showing setup modal');
        checkbox.checked = false;
        requireBiometric = false;
        localStorage.setItem("requireBiometric", "false");
        // Show modal explaining how to set up biometrics
        if (typeof window.showBiometricUnavailableModal === 'function') {
          window.showBiometricUnavailableModal();
        }
        return;
      }

      try {
        console.log('[Biometric] Attempting biometric authentication...');
        // Must successfully authenticate before enabling
        await window.requestBiometricAuth("Confirm Biometric", "Authenticate to enable App Lock");
        console.log('[Biometric] Authentication successful, enabling biometric lock');
        requireBiometric = true;
        localStorage.setItem("requireBiometric", "true");
      } catch (error) {
        console.warn("[Biometric] Confirmation failed, reverting to disabled", error);
        checkbox.checked = false;
        requireBiometric = false;
        localStorage.setItem("requireBiometric", "false");
      }
    } else {
      console.log('[Biometric] Disabling biometric lock');
      requireBiometric = false;
      localStorage.setItem("requireBiometric", "false");
    }
  } else {
    console.log('[Biometric] saveBiometricSetting: checkbox not found');
  }
}

export function getRequireBiometric() {
  return requireBiometric;
}

/**
 * Sets the system prompt
 * @param {string} prompt - The new system prompt
 */
export function setSystemPrompt(prompt) {
  debugLog("Setting system prompt to:", prompt);

  // Set the system prompt
  systemPrompt = prompt;

  // Mark as user-created when explicitly set
  isUserCreatedSystemPrompt = true;
  localStorage.setItem("isUserCreatedSystemPrompt", "true");

  // Always save the current system prompt
  localStorage.setItem("systemPrompt", systemPrompt);

  debugLog("System prompt saved. User-created:", isUserCreatedSystemPrompt);

  // Update the system prompt input if it exists
  if (systemPromptInput) {
    systemPromptInput.value = systemPrompt;

    // Trigger the change event to ensure all listeners are notified
    // But don't dispatch the event as it would trigger the change handler
    // which would overwrite our isUserCreatedSystemPrompt setting
    // Instead, just update the UI directly
  }

  // Update the system prompt display if it exists
  const systemPromptDisplay = document.getElementById("system-prompt-display");
  if (systemPromptDisplay) {
    systemPromptDisplay.textContent = systemPrompt;
  }

  // Update the system prompt preview if it exists
  const systemPromptPreview = document.getElementById("system-prompt-preview");
  const placeholderSpan = document.getElementById("prompt-placeholder");
  if (systemPromptPreview) {
    if (systemPrompt && systemPrompt.trim()) {
      // If there's content, show it in the preview
      systemPromptPreview.textContent = systemPrompt;
      // Hide the placeholder
      if (placeholderSpan) {
        placeholderSpan.style.display = "none";
      }
    } else {
      // If empty, clear the preview and show placeholder
      if (placeholderSpan) {
        systemPromptPreview.innerHTML = "";
        systemPromptPreview.appendChild(placeholderSpan);
        placeholderSpan.style.display = "";
      } else {
        systemPromptPreview.textContent = "";
      }
    }
  }

  // Force update any CodeMirror editor that might be showing the system prompt
  if (
    window.systemPromptEditor &&
    typeof window.systemPromptEditor.setValue === "function"
  ) {
    window.systemPromptEditor.setValue(systemPrompt);
  }
}

/**
 * Resets the system prompt to default (empty)
 * Used when disabling templates or clearing the prompt
 */
export function resetSystemPrompt() {
  debugLog("Resetting system prompt to default");

  const DEFAULT_SYSTEM_PROMPT = "";

  // Reset variables
  systemPrompt = DEFAULT_SYSTEM_PROMPT;
  isUserCreatedSystemPrompt = false;

  // Update localStorage
  localStorage.setItem("systemPrompt", DEFAULT_SYSTEM_PROMPT);
  localStorage.removeItem("isUserCreatedSystemPrompt");
  // Also clear active template name if it exists
  localStorage.removeItem("activeTemplateName");
  localStorage.removeItem("activeTemplateCharacterCard");
  localStorage.removeItem("pendingTemplateCharacterCard");

  // Update UI elements
  if (systemPromptInput) {
    systemPromptInput.value = DEFAULT_SYSTEM_PROMPT;
  }

  const systemPromptDisplay = document.getElementById("system-prompt-display");
  if (systemPromptDisplay) {
    systemPromptDisplay.textContent = DEFAULT_SYSTEM_PROMPT;
  }

  const systemPromptPreview = document.getElementById("system-prompt-preview");
  if (systemPromptPreview) {
    systemPromptPreview.innerHTML = "";
    const placeholderSpan = document.createElement("span");
    placeholderSpan.id = "prompt-placeholder";
    placeholderSpan.className = "text-gray-400 dark:text-gray-500 italic";
    placeholderSpan.textContent = "No system prompt set";
    placeholderSpan.style.display = "";
    systemPromptPreview.appendChild(placeholderSpan);
  }

  // Force update any CodeMirror editor
  if (
    window.systemPromptEditor &&
    typeof window.systemPromptEditor.setValue === "function"
  ) {
    window.systemPromptEditor.setValue(DEFAULT_SYSTEM_PROMPT);
  }

  debugLog("System prompt reset complete");
}

/**
 * Checks if a system prompt is explicitly set by the user or if a character is active
 * @returns {boolean} - True if a system prompt is set or a character is active, false otherwise
 */
export function isSystemPromptSet() {
  // Character functionality has been removed - only check if system prompt exists

  // Log the current state for debugging
  debugLog("isSystemPromptSet check - systemPrompt:", systemPrompt);

  // Return true if the system prompt is not empty
  return systemPrompt !== "";
}

/**
 * Gets the current temperature setting
 * @returns {number} - The current temperature value
 */
export function getTemperature() {
  return temperature;
}

/**
 * Gets the current hide thinking setting
 * @returns {boolean} - The current hide thinking value
 */
export function getHideThinking() {
  return hideThinking;
}

/**
 * Gets the current auto-generate titles setting
 * @returns {boolean} - The current auto-generate titles value
 */
export function getAutoGenerateTitles() {
  return autoGenerateTitles;
}

/**
 * Gets the current auto-scroll setting
 * @returns {boolean} - The current auto-scroll value
 */
export function getAutoScrollEnabled() {
  return autoScrollEnabled;
}

/**
 * Checks if the current system prompt was created by the user
 * @returns {boolean} - True if the system prompt was created by the user, false otherwise
 */
export function isUserCreatedPrompt() {
  return isUserCreatedSystemPrompt;
}

/**
 * Gets the default model ID
 * @returns {string|null} - The default model ID or null if not set
 */
export function getDefaultModelId() {
  return defaultModelId;
}

/**
 * Sets the default model ID
 * @param {string|null} modelId - The model ID to set as default, or null to clear
 */
export function setDefaultModelId(modelId) {
  defaultModelId = modelId;
  if (modelId) {
    localStorage.setItem("defaultModelId", modelId);
    debugLog("Default model set to:", modelId);
  } else {
    localStorage.removeItem("defaultModelId");
    debugLog("Default model cleared");
  }
}

/**
 * Loads the default model setting from localStorage
 */
export function loadDefaultModelSetting() {
  const savedDefaultModel = localStorage.getItem("defaultModelId");
  if (savedDefaultModel && savedDefaultModel !== "null") {
    defaultModelId = savedDefaultModel;
    debugLog("Loaded default model:", defaultModelId);
  } else {
    defaultModelId = null;
    debugLog("No default model set");
  }
}

/**
 * Loads the Brave Search settings from localStorage
 */
export function loadBraveSearchSettings() {
  // 1. Try to get from Android Native Bridge first (to pick up changes from local.properties)
  if (window.AndroidNetwork && typeof window.AndroidNetwork.getOtterBurrowMap === 'function') {
    const nativeKey = window.AndroidNetwork.getOtterBurrowMap();
    if (nativeKey) {
      otterBurrowMap = nativeKey;
      localStorage.setItem('otterBurrowMap', otterBurrowMap);
      return;
    }
  }

  // 2. Fallback to localStorage (e.g. if bridge is unavailable during development)
  const savedOtterBurrowMap = localStorage.getItem('otterBurrowMap');
  if (savedOtterBurrowMap) {
    otterBurrowMap = savedOtterBurrowMap;
  } else {
    // Default empty if not found in bridge or storage
    otterBurrowMap = '';
    localStorage.setItem('otterBurrowMap', otterBurrowMap);
  }
}
