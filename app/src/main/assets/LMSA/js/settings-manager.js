// Settings Manager for handling application settings
import {
  systemPromptInput,
  hideThinkingCheckbox,
  autoGenerateTitlesCheckbox,
  autoSmartReplyCheckbox,
  themeToggleCheckbox,
  ollamaToggleCheckbox,
  openRouterToggleCheckbox,
  openRouterApiKeyInput,
  showModelLabelCheckbox,
  enableSwipeSidebarCheckbox,
} from "./dom-elements.js";

import { applyThinkingVisibility, refreshAllMessages, applyModelLabelVisibility } from "./ui-manager.js";
import { refreshChatScrollbar } from "./chat-scrollbar.js";
import { debugLog, refreshAllCodeBlocks } from "./utils.js";
import { showSmartReplyWarningModal } from "./components/modals/smart-reply-warning-modal.js";
import { showOpenRouterWarningModal } from "./components/modals/openrouter-warning-modal.js";

// Default system prompt is empty unless user explicitly sets one
const DEFAULT_SYSTEM_PROMPT = "";

let systemPrompt = DEFAULT_SYSTEM_PROMPT;
let isUserCreatedSystemPrompt = false; // Flag to track if the system prompt was created by the user
let temperature = 0.3;
let hideThinking = false;
let autoGenerateTitles = false;
let autoSmartReply = false;
let useOllama = false;
let lightThemeEnabled = false;
let autoScrollEnabled = false; // Auto-scroll to bottom during LLM streaming
let enterSendsNewline = false; // If true, Enter creates a new line, Shift+Enter sends
let reasoningTimeout = 300; // Default 5 minutes for reasoning models (in seconds)
let defaultModelId = null; // Default model to auto-select when models load
let selectedTTSVoice = null; // Selected TTS voice name
let useOpenRouter = false; // Use OpenRouter cloud API
let openRouterApiKey = ''; // OpenRouter API key
let lmStudioApiToken = ''; // Optional LM Studio API token for authenticated servers
let showModelLabel = true; // Show model name on AI message bubbles
let showChatScrollbar = false; // Show scrollbar in chat message area
let showScrollToBottom = true; // Show scroll to bottom button in chat
let chatFontFamily = 'system-ui, sans-serif'; // Font family for chat message bubbles
let chatFontSize = '16px'; // Font size for chat message bubbles
let enableSwipeSidebar = true; // Use horizontal swipe to open sidebar
let requireBiometric = false; // Require biometric unlock on app start

const ALLOWED_CHAT_FONT_SIZES = ['12px', '14px', '16px', '20px', '24px'];

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

    // Event prevention for when locked
    const preventSliderInteraction = (e) => {
      if (isLocked) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Add comprehensive event blocking
    [
      "mousedown",
      "mouseup",
      "mousemove",
      "click",
      "touchstart",
      "touchend",
      "touchmove",
      "input",
      "change",
    ].forEach((eventType) => {
      temperatureInput.addEventListener(eventType, preventSliderInteraction, {
        capture: true,
        passive: false,
      });
    });

    // Helper function to apply locked state
    const applyLockedState = () => {
      temperatureInput.disabled = true;
      temperatureInput.style.pointerEvents = "none";
      temperatureInput.style.cursor = "not-allowed";
      temperatureInput.style.opacity = "0.6";
      temperatureInput.style.background = "#6b7280";
      temperatureInput.setAttribute("readonly", "true");
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
  }
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
      systemPrompt = systemPromptInput.value;

      // Mark the system prompt as user-created when explicitly set
      isUserCreatedSystemPrompt = true;
      // Save both the prompt and the flag
      localStorage.setItem("systemPrompt", systemPrompt);
      localStorage.setItem("isUserCreatedSystemPrompt", "true");

      // Clear the active template since the user is manually editing
      localStorage.removeItem("activeTemplateName");

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
  }
}

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
  if (useOpenRouter) return false;
  return autoSmartReply;
}

/**
 * Handles the Smart Reply toggle change event
 * Shows warning modal when enabling the feature
 * @param {Event} event - The change event from the checkbox
 */
function handleAutoSmartReplyToggle(event) {
  // Smart Reply is unavailable when OpenRouter is active
  if (useOpenRouter) {
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
 * Loads the enable swipe sidebar setting from localStorage
 */
export function loadEnableSwipeSidebarSetting() {
  if (enableSwipeSidebarCheckbox) {
    const saved = localStorage.getItem("enableSwipeSidebar");
    if (saved === null || saved === "true") {
      enableSwipeSidebarCheckbox.checked = true;
      enableSwipeSidebar = true;
    } else {
      enableSwipeSidebarCheckbox.checked = false;
      enableSwipeSidebar = false;
    }

    // Add event listener for the checkbox
    enableSwipeSidebarCheckbox.addEventListener("change", saveEnableSwipeSidebarSetting);
  }
}

/**
 * Saves the enable swipe sidebar setting to localStorage
 */
export function saveEnableSwipeSidebarSetting() {
  if (enableSwipeSidebarCheckbox) {
    enableSwipeSidebar = enableSwipeSidebarCheckbox.checked;
    localStorage.setItem("enableSwipeSidebar", enableSwipeSidebar);
  }
}

/**
 * Gets the current enable swipe sidebar setting
 * @returns {boolean} - True if swipe-to-open sidebar is enabled
 */
export function getEnableSwipeSidebar() {
  return enableSwipeSidebar;
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

/**
 * Loads the theme setting from localStorage
 */
export function loadThemeSetting() {
  const savedTheme = localStorage.getItem("lightThemeEnabled");

  // Set the theme based on saved preference
  if (savedTheme === "true") {
    lightThemeEnabled = true;
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark");
    document.body.classList.remove("custom-dark-mode"); // Remove custom-dark-mode class for light theme
  } else {
    lightThemeEnabled = false;
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark");
    document.body.classList.add("custom-dark-mode"); // Ensure custom-dark-mode class is present for dark theme
  }

  refreshAllCodeBlocks();

  // Update the settings modal toggle if it exists
  if (themeToggleCheckbox) {
    themeToggleCheckbox.checked = lightThemeEnabled;

    // Change the icon to match the theme
    const themeIcon = document.querySelector('label[for="theme-toggle"] i');
    if (themeIcon) {
      if (lightThemeEnabled) {
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");
      } else {
        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon");
      }
    }

    // Add event listener for the checkbox
    themeToggleCheckbox.addEventListener("change", saveThemeSetting);
  }

  // Dispatch a custom event to notify other components about the initial theme
  const themeChangedEvent = new CustomEvent("themeChanged", {
    detail: { lightThemeEnabled },
  });
  document.dispatchEvent(themeChangedEvent);
}

/**
 * Saves the theme setting to localStorage
 */
export function saveThemeSetting() {
  if (themeToggleCheckbox) {
    lightThemeEnabled = themeToggleCheckbox.checked;
    localStorage.setItem("lightThemeEnabled", lightThemeEnabled);

    if (lightThemeEnabled) {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark");
      document.body.classList.remove("custom-dark-mode"); // Remove custom-dark-mode class for light theme
      // Change the icon to sun when light theme is enabled
      const themeIcon = document.querySelector('label[for="theme-toggle"] i');
      if (themeIcon) {
        themeIcon.classList.remove("fa-moon");
        themeIcon.classList.add("fa-sun");
      }
    } else {
      document.body.classList.remove("light-theme");
      document.body.classList.add("dark");
      document.body.classList.add("custom-dark-mode"); // Add custom-dark-mode class for dark theme
      // Change the icon to moon when dark theme is enabled
      const themeIcon = document.querySelector('label[for="theme-toggle"] i');
      if (themeIcon) {
        themeIcon.classList.remove("fa-sun");
        themeIcon.classList.add("fa-moon");
      }
    }

    refreshAllCodeBlocks();

    // Force refresh of sidebar styles
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      // Temporarily hide and show sidebar to force style recalculation
      const originalDisplay = sidebar.style.display;
      sidebar.style.display = "none";
      sidebar.offsetHeight; // Force reflow
      sidebar.style.display = originalDisplay;
    }

    // Dispatch a custom event to notify other components about the theme change
    const themeChangedEvent = new CustomEvent("themeChanged", {
      detail: { lightThemeEnabled },
    });
    document.dispatchEvent(themeChangedEvent);
  }
}

/**
 * Gets the current theme setting
 * @returns {boolean} - True if light theme is enabled, false otherwise
 */
export function getLightThemeEnabled() {
  return lightThemeEnabled;
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
  if (ollamaToggleCheckbox) {
    const savedUseOllama = localStorage.getItem("useOllama");
    if (savedUseOllama === "true") {
      ollamaToggleCheckbox.checked = true;
      useOllama = true;
    } else {
      ollamaToggleCheckbox.checked = false;
      useOllama = false;
    }

    // Add event listener for the checkbox
    ollamaToggleCheckbox.addEventListener("change", saveOllamaSetting);
  }
}

/**
 * Saves the Ollama setting to localStorage
 */
export function saveOllamaSetting() {
  if (ollamaToggleCheckbox) {
    useOllama = ollamaToggleCheckbox.checked;
    localStorage.setItem("useOllama", useOllama);
    // Mutual exclusivity: disable OpenRouter when Ollama is enabled
    if (useOllama && useOpenRouter) {
      useOpenRouter = false;
      openRouterApiKey = '';
      localStorage.setItem("useOpenRouter", 'false');
      if (openRouterToggleCheckbox) openRouterToggleCheckbox.checked = false;
      updateOpenRouterUI(false);
      // Restore last used local model since OpenRouter was just disabled
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
 * Updates the OpenRouter UI: shows/hides connection panels and selector button states,
 * and disables Smart Reply when OpenRouter is enabled (incompatible features).
 * @param {boolean} isEnabled
 */
function updateOpenRouterUI(isEnabled) {
  const localPanel = document.getElementById('local-server-settings');
  const openRouterPanel = document.getElementById('openrouter-settings');
  const localBtn = document.getElementById('select-local-server');
  const openRouterBtn = document.getElementById('select-openrouter');

  if (isEnabled) {
    if (localPanel) localPanel.classList.add('hidden');
    if (openRouterPanel) openRouterPanel.classList.remove('hidden');
    if (localBtn) { localBtn.classList.remove('active'); localBtn.setAttribute('aria-pressed', 'false'); }
    if (openRouterBtn) { openRouterBtn.classList.add('active'); openRouterBtn.setAttribute('aria-pressed', 'true'); }
    // Pulse the input wrapper if no key has been entered yet
    const wrapper = document.querySelector('.openrouter-key-input-wrapper');
    if (wrapper) {
      const hasKey = (openRouterApiKeyInput && openRouterApiKeyInput.value.trim().length > 0)
        || (localStorage.getItem('openRouterApiKey') || '').length > 0;
      if (!hasKey) wrapper.classList.add('key-required');
    }
  } else {
    if (localPanel) localPanel.classList.remove('hidden');
    if (openRouterPanel) openRouterPanel.classList.add('hidden');
    if (localBtn) { localBtn.classList.add('active'); localBtn.setAttribute('aria-pressed', 'true'); }
    if (openRouterBtn) { openRouterBtn.classList.remove('active'); openRouterBtn.setAttribute('aria-pressed', 'false'); }
    // Remove pulse when OpenRouter panel is hidden
    const wrapper = document.querySelector('.openrouter-key-input-wrapper');
    if (wrapper) wrapper.classList.remove('key-required');
  }

  // Smart Reply still requires a separate follow-up API call, but chat titles now
  // ride along with the first reply, so only Smart Reply needs OpenRouter gating.
  const smartReplyContainer = document.getElementById('smart-reply-setting');
  const smartReplyDesc = document.getElementById('smart-reply-description');
  const autoGenerateTitlesContainer = document.getElementById('auto-generate-titles-setting');
  const autoGenerateTitlesDesc = document.getElementById('auto-generate-titles-description');
  
  if (isEnabled) {
    // Visually disable and uncheck Smart Reply; don't overwrite localStorage so preference is restored later
    if (autoSmartReplyCheckbox) {
      autoSmartReplyCheckbox.checked = false;
      autoSmartReplyCheckbox.disabled = true;
    }
    autoSmartReply = false;
    if (smartReplyContainer) smartReplyContainer.style.opacity = '0.4';
    if (smartReplyDesc) smartReplyDesc.textContent = 'Not available when OpenRouter is enabled. Smart Reply requires a local LLM connection.';
    
    // Keep Generate Chat Titles available because it no longer makes a second API call
    if (autoGenerateTitlesCheckbox) {
      autoGenerateTitlesCheckbox.disabled = false;
      const savedAutoGenerateTitles = localStorage.getItem('autoGenerateTitles');
      autoGenerateTitlesCheckbox.checked = savedAutoGenerateTitles === 'true';
      autoGenerateTitles = savedAutoGenerateTitles === 'true';
    }
    if (autoGenerateTitlesContainer) autoGenerateTitlesContainer.style.opacity = '';
    if (autoGenerateTitlesDesc) autoGenerateTitlesDesc.textContent = 'When enabled, the first AI reply includes a hidden short title that LMSA saves to your chat list without making a second API call.';
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
    
    // Re-enable Generate Chat Titles toggle and restore saved preference
    if (autoGenerateTitlesCheckbox) {
      autoGenerateTitlesCheckbox.disabled = false;
      const savedAutoGenerateTitles = localStorage.getItem('autoGenerateTitles');
      autoGenerateTitlesCheckbox.checked = savedAutoGenerateTitles === 'true';
      autoGenerateTitles = savedAutoGenerateTitles === 'true';
    }
    if (autoGenerateTitlesContainer) autoGenerateTitlesContainer.style.opacity = '';
    if (autoGenerateTitlesDesc) autoGenerateTitlesDesc.textContent = 'When enabled, the first AI reply includes a hidden short title that LMSA saves to your chat list without making a second API call.';
  }
}

/**
 * Loads the OpenRouter settings from localStorage
 */
export function loadOpenRouterSettings() {
  const savedUseOpenRouter = localStorage.getItem('useOpenRouter');
  useOpenRouter = (savedUseOpenRouter === 'true');

  if (openRouterToggleCheckbox) {
    openRouterToggleCheckbox.checked = useOpenRouter;
    openRouterToggleCheckbox.addEventListener('change', saveOpenRouterSettings);
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

  // Click handlers for the connection type selector buttons
  const localServerBtn = document.getElementById('select-local-server');
  const openRouterSelectorBtn = document.getElementById('select-openrouter');

  if (localServerBtn) {
    localServerBtn.addEventListener('click', () => {
      if (useOpenRouter) {
        if (openRouterToggleCheckbox) openRouterToggleCheckbox.checked = false;
        saveOpenRouterSettings();
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

  updateOpenRouterUI(useOpenRouter);
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
        if (openRouterApiKeyInput) {
          openRouterApiKey = openRouterApiKeyInput.value;
          localStorage.setItem('openRouterApiKey', openRouterApiKey);
        }
        updateOpenRouterUI(true);
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
    updateOpenRouterUI(false);
    // Restore last used local model so the next message uses the correct model ID
    window.currentLoadedModel = localStorage.getItem('localSelectedModel') || null;
  }
}

/**
 * Gets the current OpenRouter enabled state
 * @returns {boolean}
 */
export function getUseOpenRouter() {
  return useOpenRouter;
}

/**
 * Gets the current OpenRouter API key
 * @returns {string}
 */
export function getOpenRouterApiKey() {
  return openRouterApiKey;
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
 * Gets the current LM Studio API token.
 * @returns {string} - The token string, or empty string if not set.
 */
export function getLMStudioApiToken() {
  return lmStudioApiToken;
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
      if (savedVoice) {
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
      }

      // Add the change listener only once even if the settings modal is reopened.
      if (voiceSelect.dataset.ttsVoiceListenerAttached !== "true") {
        voiceSelect.addEventListener("change", async (e) => {
          const voiceName = e.target.value;
          selectedTTSVoice = voiceName;

          if (voiceName) {
            localStorage.setItem("ttsVoice", voiceName);
            await window.TTSService.setVoice(voiceName);
            debugLog("TTS voice set to:", voiceName);
          } else {
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
  selectedTTSVoice = voiceName;
  if (voiceName) {
    localStorage.setItem("ttsVoice", voiceName);
    if (window.TTSService) {
      await window.TTSService.setVoice(voiceName);
    }
  } else {
    localStorage.removeItem("ttsVoice");
    if (window.TTSService) {
      await window.TTSService.setVoice("");
    }
  }
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

export function loadSettings() {
  initializeSystemPrompt();
  initializeTemperature();
  loadHideThinkingSetting();
  loadAutoGenerateTitlesSetting();
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
  loadShowModelLabelSetting();
  loadShowChatScrollbarSetting();
  loadShowScrollToBottomSetting();
  loadChatFontSettings();
  loadEnableSwipeSidebarSetting();
  // TTS voice selection will be initialized separately when settings modal opens
}

/**
 * Gets the current system prompt
 * @returns {string} - The current system prompt
 */
export function getSystemPrompt() {
  return systemPrompt;
}

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
    checkbox.addEventListener("change", saveBiometricSetting);
  }
}

export async function saveBiometricSetting() {
  const checkbox = document.getElementById("require-biometric");
  if (checkbox) {
    const isChecked = checkbox.checked;
    
    if (isChecked) {
      const isPremium = window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus();
      if (!isPremium) {
        if (typeof window.openPremiumModal === 'function') {
            window.openPremiumModal('Biometric Unlock');
        }
        checkbox.checked = false;
        requireBiometric = false;
        localStorage.setItem("requireBiometric", "false");
        return;
      }

      try {
        // Must successfully authenticate before enabling
        await window.requestBiometricAuth("Confirm Biometric", "Authenticate to enable App Lock");
        requireBiometric = true;
        localStorage.setItem("requireBiometric", "true");
      } catch (error) {
        console.warn("Biometric confirmation failed, reverting to disabled", error);
        checkbox.checked = false;
        requireBiometric = false;
        localStorage.setItem("requireBiometric", "false");
      }
    } else {
      requireBiometric = false;
      localStorage.setItem("requireBiometric", "false");
    }
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
