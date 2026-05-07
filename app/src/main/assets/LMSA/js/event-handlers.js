// Only proceed if sidebar exists and is currently active/visible
// Event Handlers for the application
import {
    chatForm, userInput, clearChatButton, newChatButton, settingsButton,
    closeSettingsButton, closeSettingsXButton, settingsModal, welcomeMessage, messagesContainer,
    sidebarToggle, closeSidebarButton, confirmActionButton, cancelActionButton,
    helpButton, newChatHeaderButton, webSearchHeaderButton, webSearchHeaderIcon, whatsNewButton, aboutButton, stopButton, contextMenu, copyTextButton,
    regenerateTextButton, exitButton, refreshButton, modelToggleButton, loadedModelDisplay,
    settingsIconButton, newTopicButton, sendButton, sendContextMenu, newTopicMenuButton, scrollToBottomMenuButton,
    modelButton, importExportGroupButton, importExportContainer, systemPromptSettingsButton,
    exportChatsButton, importChatsButton, importChatsInput,
    welcomeModelsBtn, welcomeMcpBtn, welcomeSystemPromptBtn, welcomeTtsBtn, welcomeImportExportBtn, welcomeNewChatBtn, welcomeHelpBtn,
    modelsHeaderButton,
    setupLocalBtn, setupOpenRouterBtn, setupCustomBtn
} from './dom-elements.js';
import { privacyPolicyContent } from './components/modals/privacy-policy-modal.js';
import { termsContentString } from './components/modals/terms-modal.js';

import { showSettingsModal, hideSettingsModal, navigateSettingsModalToStep, showLmMcpModal, navigateToTTS } from './settings-modal-manager.js';
import { openPremiumModal } from './components/modals/premium-modal.js';
import { openPremiumHeaderModal } from './components/modals/premium-activated-modal.js';
import {
    getEnterSendsNewline,
    clearOpenRouterApiKey,
    clearLMStudioApiToken,
    toggleWebSearchFeature,
    applyConnectionProviderSelection,
    getUseOpenRouter,
    getUseOpenAICompatible,
    markCurrentModeActivity
} from './settings-manager.js';
import {
    showWelcomeMessage, hideWelcomeMessage, toggleSidebar, closeSidebar, showLoadingIndicator,
    hideLoadingIndicator, toggleSendStopButton, hideConfirmationModal, showConfirmationModal,
    checkAndShowWelcomeMessage,
    getSelectedText, getSelectedMessageElement, appendMessage
} from './ui-manager.js';
import {
    generateAIResponse,
    isGeneratingText,
    abortGeneration,
    setAbortController,
    createNewChat,
    isFirstMessage,
    setIsFirstMessage,
    addTopicBoundary,
    regenerateLastResponse,
    chatHistoryData,
    currentChatId,
    clearAllChats,
    deleteChatHistory,
    getChatToDelete,
    saveChatHistory,
    loadChatHistory,
    updateChatHistoryUI,
    addUserMessageToHistory
} from './chat-service.js';
import { resetApp, initializeResetAppButton } from './reset-app.js';
import { fetchAvailableModels, isServerRunning, getAvailableModels } from './api-service.js';
import { resetUploadedFiles, getUploadedFiles, uploadFilesToLMStudio } from './file-upload.js';
import { setActionToPerform, getActionToPerform } from './shared-state.js';
import { closeSidebarExport } from './export-import.js';
import { showModelModal } from './model-manager.js';
import { showWhatsNewModal } from './whats-new.js';
import { debugLog, debugError, formatDate, closeApplication, copyToClipboard, sanitizeInput, initializeCodeMirror, stripReasoningSections, scrollToBottom, scrollToBottomManual, handleScroll, ensureCursorVisible } from './utils.js';

let abortController = null;
let sidebar = document.getElementById('sidebar');
const OFFLINE_ACCESS_LOCK_REASON = 'offline-access';
const OFFLINE_ACCESS_NOTICE_HTML = 'Only premium users can use the app offline. Free users need an active internet connection.';

function openExternalLink(url) {
    if (typeof window.openExternalUrl === 'function') {
        window.openExternalUrl(url);
        return;
    }

    window.open(url, '_blank', 'noopener');
}

function isConfirmationModalVisible() {
    const confirmationModal = document.getElementById('confirmation-modal');
    return !!(confirmationModal &&
        !confirmationModal.classList.contains('hidden') &&
        confirmationModal.style.display !== 'none');
}

function getSingleLineHeight(textarea) {
    const minHeight = parseFloat(window.getComputedStyle(textarea).minHeight);
    return Number.isFinite(minHeight) && minHeight > 0 ? Math.round(minHeight) : 52;
}

/**
 * Checks if the user has premium status
 * @returns {boolean} - True if user is premium, false otherwise
 */
function isPremiumUser() {
    if (typeof window.hasPremiumAccess === 'function') {
        return window.hasPremiumAccess();
    }

    return window.AndroidBilling &&
           typeof window.AndroidBilling.checkPremiumStatus === 'function' &&
           window.AndroidBilling.checkPremiumStatus();
}

function hasActiveInternetConnectionForOfflineGate() {
    if (window.AndroidNetwork && typeof window.AndroidNetwork.isInternetReachable === 'function') {
        try {
            return !!window.AndroidNetwork.isInternetReachable();
        } catch (error) {
            debugError('Native strict internet reachability check failed:', error);
        }
    }

    if (window.AndroidNetwork && typeof window.AndroidNetwork.isInternetAvailable === 'function') {
        try {
            return !!window.AndroidNetwork.isInternetAvailable();
        } catch (error) {
            debugError('Native internet availability check failed:', error);
        }
    }

    return navigator.onLine;
}

function canFreeUserContinueWhenOffline() {
    if (isPremiumUser()) {
        return true;
    }

    if (hasActiveInternetConnectionForOfflineGate()) {
        return true;
    }

    openPremiumModal('Offline Access', {
        noticeHtml: OFFLINE_ACCESS_NOTICE_HTML,
        locked: true,
        lockReason: OFFLINE_ACCESS_LOCK_REASON,
        hideUpgradeButton: true
    });
    return false;
}

/**
 * Initializes all event handlers
 */
export function initializeEventHandlers() {
    const TOUCH_TAP_SLOP = 12;

    const setPressedState = (element, isPressed) => {
        if (!element) return;
        element.classList.toggle('menu-press-in', isPressed);
    };

    const bindPressInFeedback = (element) => {
        if (!element || element.dataset.pressInBound === 'true') return;
        element.dataset.pressInBound = 'true';

        const release = () => {
            setTimeout(() => setPressedState(element, false), 80);
        };

        element.addEventListener('mousedown', () => setPressedState(element, true));
        element.addEventListener('mouseup', release);
        element.addEventListener('mouseleave', () => setPressedState(element, false));
        element.addEventListener('touchstart', () => setPressedState(element, true), { passive: true });
        element.addEventListener('touchend', release, { passive: true });
        element.addEventListener('touchcancel', () => setPressedState(element, false), { passive: true });
        element.addEventListener('blur', () => setPressedState(element, false));
    };

    const runAfterPressIn = (element, callback, delayMs = 95) => {
        setPressedState(element, true);
        setTimeout(() => {
            callback();
            setPressedState(element, false);
        }, delayMs);
    };

    const bindSidebarScrollableTap = (element, callback) => {
        if (!element || typeof callback !== 'function') {
            return;
        }

        if (element.dataset.sidebarScrollableTapBound === 'true') {
            return;
        }
        element.dataset.sidebarScrollableTapBound = 'true';

        const TOUCH_SCROLL_GUARD_SLOP = 4;
        let touchStartX = 0;
        let touchStartY = 0;
        let touchMoved = false;
        let touchStartScrollTop = 0;
        let suppressClickUntil = 0;

        const getSidebarScrollTop = () => {
            const sidebarScrollContent = document.getElementById('sidebar-scroll-content');
            if (sidebarScrollContent) {
                return sidebarScrollContent.scrollTop;
            }

            const sidebarElement = document.getElementById('sidebar');
            return sidebarElement ? sidebarElement.scrollTop : 0;
        };

        element.addEventListener('touchstart', (e) => {
            const touch = e.touches && e.touches[0];
            if (!touch) {
                touchMoved = false;
                return;
            }

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchMoved = false;
            touchStartScrollTop = getSidebarScrollTop();
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            const touch = e.touches && e.touches[0];
            if (!touch || touchMoved) {
                return;
            }

            const deltaX = Math.abs(touch.clientX - touchStartX);
            const deltaY = Math.abs(touch.clientY - touchStartY);
            const scrollDelta = Math.abs(getSidebarScrollTop() - touchStartScrollTop);

            if (deltaX > TOUCH_SCROLL_GUARD_SLOP || deltaY > TOUCH_SCROLL_GUARD_SLOP || scrollDelta > 0) {
                touchMoved = true;
                setPressedState(element, false);
                element.blur();
            }
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            const scrollDelta = Math.abs(getSidebarScrollTop() - touchStartScrollTop);
            if (scrollDelta > 0) {
                touchMoved = true;
            }

            if (touchMoved) {
                touchMoved = false;
                if (e.cancelable) {
                    e.preventDefault();
                }
                e.stopPropagation();
                suppressClickUntil = Date.now() + 250;
                setPressedState(element, false);
                element.blur();
                return;
            }
        }, { passive: false });

        element.addEventListener('touchcancel', () => {
            touchMoved = false;
            setPressedState(element, false);
            element.blur();
        }, { passive: true });

        element.addEventListener('click', (e) => {
            if (Date.now() < suppressClickUntil) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            runAfterPressIn(element, () => {
                callback();
                element.blur();
            });
        });
    };

    const openPremiumFlow = () => {
        if (typeof window.hasPremiumAccess === 'function' && window.hasPremiumAccess()) {
            return;
        }

        // Prefer opening the premium modal; fall back to direct purchase only if needed.
        if (typeof window.openPremiumModal === 'function') {
            window.openPremiumModal();
            return;
        }

        if (typeof window.removeAds === 'function') {
            window.removeAds();
        }
    };

    // "Continue with Character" button has been removed
    // Event listeners for it are no longer needed
    const bindSetupProviderCard = (cardElement, provider) => {
        if (!cardElement) {
            return;
        }

        if (cardElement.dataset.providerEntryBound !== 'true') {
            const openProviderSettings = () => {
                applyConnectionProviderSelection(provider);
                showSettingsModal();
                cardElement.blur();
            };

            cardElement.dataset.providerEntryBound = 'true';
            cardElement.addEventListener('click', openProviderSettings);
            cardElement.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                openProviderSettings();
            });
        }
    };

    bindSetupProviderCard(setupLocalBtn, 'local');
    bindSetupProviderCard(setupOpenRouterBtn, 'openrouter');
    bindSetupProviderCard(setupCustomBtn, 'openai-compatible');

    // Settings button in welcome message
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {

        // Function to open settings modal
        const openSettingsModal = () => {
            debugLog('Settings button clicked, opening settings modal');

            // Remove sidebar click handler while modal is open
            document.body.removeEventListener('click', handleSidebarOutsideClick);

            // Ensure the welcome message is hidden when settings modal is shown
            if (welcomeMessage && welcomeMessage.style.display !== 'none') {
                welcomeMessage.style.opacity = '0';
                welcomeMessage.style.visibility = 'hidden';
            }
            // Use the centralized settings modal manager
            try {
                showSettingsModal();
            } catch (error) {
                debugError('Error showing settings modal:', error);
            }
        };

        // Remove any existing event listeners to prevent duplicates
        const newGetStartedBtn = getStartedBtn.cloneNode(true);
        getStartedBtn.parentNode.replaceChild(newGetStartedBtn, getStartedBtn);

        // Update the reference
        const updatedGetStartedBtn = document.getElementById('get-started-btn');
        bindPressInFeedback(updatedGetStartedBtn);

        // Add click event listener
        updatedGetStartedBtn.addEventListener('click', openSettingsModal);

        // Add touch event listener for better mobile experience
        updatedGetStartedBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default to avoid any conflicts
            e.stopPropagation(); // Prevent event bubbling
            runAfterPressIn(updatedGetStartedBtn, () => {
                openSettingsModal();
                updatedGetStartedBtn.blur();
            });
        }, { passive: false });
    }


    const openModelsModal = () => {
        debugLog('Models button clicked, opening models modal');

        try {
            showModelModal();
        } catch (error) {
            debugError('Error in model button handler:', error);
        }
    };

    // Models button in welcome screen
    if (welcomeModelsBtn) {

        // Remove any existing event listeners to prevent duplicates
        const newWelcomeModelsBtn = welcomeModelsBtn.cloneNode(true);
        welcomeModelsBtn.parentNode.replaceChild(newWelcomeModelsBtn, welcomeModelsBtn);

        // Update the reference
        const updatedWelcomeModelsBtn = document.getElementById('welcome-models-btn');
        bindPressInFeedback(updatedWelcomeModelsBtn);

        // Add click event listener
        updatedWelcomeModelsBtn.addEventListener('click', openModelsModal);

        // Add touch event listener for better mobile experience
        updatedWelcomeModelsBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default to avoid any conflicts
            e.stopPropagation(); // Prevent event bubbling
            runAfterPressIn(updatedWelcomeModelsBtn, () => {
                openModelsModal();
                updatedWelcomeModelsBtn.blur();
            });
        }, { passive: false });
    }

    if (modelsHeaderButton) {
        bindPressInFeedback(modelsHeaderButton);

        const openHeaderModelsPanel = () => {
            openModelsModal();
            modelsHeaderButton.blur();
        };

        modelsHeaderButton.addEventListener('click', openHeaderModelsPanel);
        modelsHeaderButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });
        modelsHeaderButton.addEventListener('touchend', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            openHeaderModelsPanel();
        }, { passive: false });
    }

    // Welcome Templates button
    const welcomeTemplatesBtn = document.getElementById('welcome-templates-btn');
    if (welcomeTemplatesBtn) {
        bindPressInFeedback(welcomeTemplatesBtn);

        welcomeTemplatesBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runAfterPressIn(welcomeTemplatesBtn, () => {
                if (typeof window.navigateToTemplates === 'function') {
                    window.navigateToTemplates();
                } else {
                    window.location.href = 'templates.html';
                }
            }, 110);
        }, { passive: false });
    }

    // New Shortcut Buttons for Welcome Screen
    if (welcomeMcpBtn) {
        bindPressInFeedback(welcomeMcpBtn);
        welcomeMcpBtn.addEventListener('click', () => {
            showLmMcpModal();
        });
        welcomeMcpBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runAfterPressIn(welcomeMcpBtn, () => {
                showLmMcpModal();
                welcomeMcpBtn.blur();
            });
        }, { passive: false });
    }

    if (welcomeSystemPromptBtn) {
        bindPressInFeedback(welcomeSystemPromptBtn);
        welcomeSystemPromptBtn.addEventListener('click', () => {
            handleSystemPromptSettingsButtonClick();
        });
        welcomeSystemPromptBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runAfterPressIn(welcomeSystemPromptBtn, () => {
                handleSystemPromptSettingsButtonClick();
                welcomeSystemPromptBtn.blur();
            });
        }, { passive: false });
    }

    if (welcomeTtsBtn) {
        bindPressInFeedback(welcomeTtsBtn);
        welcomeTtsBtn.addEventListener('click', () => {
            showSettingsModal();
            navigateToTTS();
        });
        welcomeTtsBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runAfterPressIn(welcomeTtsBtn, () => {
                showSettingsModal();
                navigateToTTS();
                welcomeTtsBtn.blur();
            });
        }, { passive: false });
    }

    if (welcomeImportExportBtn) {
        bindPressInFeedback(welcomeImportExportBtn);
        const openImportExport = () => {
            toggleSidebar();
            // Small delay to let sidebar open
            setTimeout(() => {
                if (importExportContainer && importExportContainer.classList.contains('hidden')) {
                    if (typeof toggleImportExportContainer === 'function') {
                        toggleImportExportContainer();
                    } else {
                        importExportGroupButton?.click();
                    }
                }
            }, 300);
        };
        welcomeImportExportBtn.addEventListener('click', openImportExport);
        welcomeImportExportBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            runAfterPressIn(welcomeImportExportBtn, () => {
                openImportExport();
                welcomeImportExportBtn.blur();
            });
        }, { passive: false });
    }

    const sidebarPremiumButton = document.getElementById('remove-ads-button');
    if (sidebarPremiumButton) {
        bindPressInFeedback(sidebarPremiumButton);

        const openSidebarPremiumFlow = () => {
            closeSidebar();
            openPremiumFlow();
        };

        bindSidebarScrollableTap(sidebarPremiumButton, openSidebarPremiumFlow);
    }

    const restorePurchasesBtn = document.getElementById('restore-purchases-button');
    if (restorePurchasesBtn) {
        bindPressInFeedback(restorePurchasesBtn);
        bindSidebarScrollableTap(restorePurchasesBtn, () => {
            if (typeof window.restorePurchases === 'function') {
                window.restorePurchases();
            }
        });
    }

    // Welcome "Saved" button (previously used inline onclick)
    const welcomeNewChatBtn = document.getElementById('welcome-new-chat-btn');
    if (welcomeNewChatBtn) {
        // Function to handle saved chats button click
        const openSavedChats = () => {
            debugLog('Saved chats button clicked, opening sidebar');

            // Open sidebar with saved chats
            toggleSidebar();
        };

        // Remove any existing event listeners to prevent duplicates
        const newWelcomeNewChatBtn = welcomeNewChatBtn.cloneNode(true);
        welcomeNewChatBtn.parentNode.replaceChild(newWelcomeNewChatBtn, welcomeNewChatBtn);

        // Update the reference
        const updatedWelcomeNewChatBtn = document.getElementById('welcome-new-chat-btn');
        bindPressInFeedback(updatedWelcomeNewChatBtn);

        // Add click event listener
        updatedWelcomeNewChatBtn.addEventListener('click', openSavedChats);

        // Add touch event listener for better mobile experience
        updatedWelcomeNewChatBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default to avoid any conflicts
            e.stopPropagation(); // Prevent event bubbling
            runAfterPressIn(updatedWelcomeNewChatBtn, () => {
                openSavedChats();
                updatedWelcomeNewChatBtn.blur();
            });
        }, { passive: false });
    }

    // Welcome "Help" button (previously used inline onclick)
    const welcomeHelpBtn = document.getElementById('welcome-help-btn');
    if (welcomeHelpBtn) {
        // Function to open help screen
        const openHelpScreen = () => {
            debugLog('Help button clicked, opening help screen');

            try {
                // Get the help button and click it
                const helpBtnMain = document.getElementById('help-btn');
                if (helpBtnMain) {
                    helpBtnMain.click();
                }
            } catch (error) {
                debugError('Error opening help screen:', error);
            }
        };

        // Remove any existing event listeners to prevent duplicates
        const newWelcomeHelpBtn = welcomeHelpBtn.cloneNode(true);
        welcomeHelpBtn.parentNode.replaceChild(newWelcomeHelpBtn, welcomeHelpBtn);

        // Update the reference
        const updatedWelcomeHelpBtn = document.getElementById('welcome-help-btn');
        bindPressInFeedback(updatedWelcomeHelpBtn);

        // Add click event listener
        updatedWelcomeHelpBtn.addEventListener('click', openHelpScreen);

        // Add touch event listener for better mobile experience
        updatedWelcomeHelpBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default to avoid any conflicts
            e.stopPropagation(); // Prevent event bubbling
            runAfterPressIn(updatedWelcomeHelpBtn, () => {
                openHelpScreen();
                updatedWelcomeHelpBtn.blur();
            });
        }, { passive: false });
    }

    // Chat form submission
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatFormSubmit);
    }

    // Add input field event listeners for cursor visibility
    if (userInput) {
        const maxHeight = 200;

        // Function to auto-resize the textarea based on content
        const autoResizeTextarea = function (textarea) {
            if (!textarea) return;

            const singleLineHeight = getSingleLineHeight(textarea);

            // Save the current scroll position
            const scrollTop = textarea.scrollTop;

            // Temporarily shrink to single line height to get accurate measurement
            textarea.style.height = singleLineHeight + 'px';

            // Get the scroll height - if content doesn't fit, this will be larger
            const scrollHeight = textarea.scrollHeight;

            // Determine the new height
            let newHeight;
            if (scrollHeight <= singleLineHeight) {
                // Content fits in single line
                newHeight = singleLineHeight;
            } else {
                // Content needs more space
                newHeight = Math.min(scrollHeight, maxHeight);
            }

            // Set the final height
            textarea.style.height = newHeight + 'px';

            // Restore scroll position
            textarea.scrollTop = scrollTop;

            // Enable scrolling if content exceeds max height
            if (scrollHeight > maxHeight) {
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.overflowY = 'hidden';
            }

            // Keep the send/stop button sizing stable so the composer layout
            // doesn't shift when the textarea grows to multiple lines.
            const sendButton = document.getElementById('send-button');
            const stopButton = document.getElementById('stop-button');

            if (sendButton || stopButton) {
                [sendButton, stopButton].forEach((button) => {
                    if (!button) return;

                    button.style.minWidth = '';
                    button.style.padding = '';
                    button.style.width = '';
                    button.style.height = '';

                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.style.fontSize = '';
                    }
                });
            }
        };

        // Simple direct method to ensure cursor is at the end when typing
        const scrollInputToEnd = function (input) {
            // Use setTimeout to ensure this runs after the browser has updated the input value
            setTimeout(() => {
                // For textarea, scroll to bottom
                input.scrollTop = input.scrollHeight;
            }, 0);
        };

        // Handle input events to ensure cursor visibility during typing
        userInput.addEventListener('input', function (e) {
            // Auto-resize the textarea
            autoResizeTextarea(e.target);
            // Use both methods for maximum compatibility
            scrollInputToEnd(e.target);
            ensureCursorVisible(e.target);
        });

        // Handle keydown events for cursor visibility and Enter key
        userInput.addEventListener('keydown', function (e) {
            // Handle Enter key based on settings
            if (e.key === 'Enter') {
                const enterForNewline = getEnterSendsNewline();

                // If enterForNewline is true: Shift+Enter sends, Enter adds newline
                // If enterForNewline is false: Enter sends, Shift+Enter adds newline
                const shouldSend = enterForNewline ? e.shiftKey : !e.shiftKey;

                if (shouldSend) {
                    e.preventDefault(); // Prevent new line
                    chatForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    return;
                }
            }

            // For arrow keys, we need special handling
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' ||
                e.key === 'Home' || e.key === 'End') {
                // Use setTimeout to run after the cursor has moved
                setTimeout(() => {
                    ensureCursorVisible(e.target);
                }, 0);
            } else {
                // For other keys, ensure cursor is visible
                ensureCursorVisible(e.target);
            }
        });

        // Handle selection change events
        userInput.addEventListener('select', function (e) {
            // Ensure cursor is visible when selection changes
            ensureCursorVisible(e.target);
        });

        // Handle click events to ensure cursor visibility when clicking within text
        userInput.addEventListener('click', function (e) {
            // Ensure cursor is visible when clicking to position cursor
            ensureCursorVisible(e.target);
        });

        // Handle focus events to ensure cursor visibility when focusing the input field
        userInput.addEventListener('focus', function (e) {
            document.body.classList.add('chat-input-focused');

            // Hide welcome screen when user focuses on input field
            import('./ui-manager.js').then(module => {
                if (typeof module.hideWelcomeMessage === 'function' && welcomeMessage && welcomeMessage.style.display !== 'none') {
                    module.hideWelcomeMessage();
                }
            }).catch(error => {
                console.error('Error importing ui-manager module:', error);
            });

            // When focusing, move cursor to end for better UX
            const length = e.target.value.length;
            e.target.setSelectionRange(length, length);
            // Then ensure cursor is visible
            scrollInputToEnd(e.target);
            ensureCursorVisible(e.target);
        });

        userInput.addEventListener('blur', function () {
            document.body.classList.remove('chat-input-focused');

            // Defer until after the next focus target and click handlers have settled.
            setTimeout(() => {
                if (!userInput || document.activeElement === userInput) {
                    return;
                }

                if (handleChatFormSubmit.isSubmitting || isGeneratingText()) {
                    return;
                }

                const visibleModal = document.querySelector('.modal-container:not(.hidden)') || isConfirmationModalVisible();
                if (visibleModal) {
                    return;
                }

                checkAndShowWelcomeMessage();
            }, 0);
        });

        // Handle touchstart events for touch devices to hide welcome screen immediately
        userInput.addEventListener('touchstart', function (e) {
            // Hide welcome screen when user touches the input field
            import('./ui-manager.js').then(module => {
                if (typeof module.hideWelcomeMessage === 'function' && welcomeMessage && welcomeMessage.style.display !== 'none') {
                    module.hideWelcomeMessage();
                }
            }).catch(error => {
                console.error('Error importing ui-manager module:', error);
            });
        }, { passive: true });

        // Handle touchend events for mobile devices
        userInput.addEventListener('touchend', function (e) {
            // Ensure cursor is visible after touch interaction
            setTimeout(() => {
                ensureCursorVisible(e.target);
            }, 0);
        });

        // Initialize textarea to correct single-line height on page load
        // This ensures consistent height before and after typing
        setTimeout(() => {
            const singleLineHeight = getSingleLineHeight(userInput);

            // Set to minimum first
            userInput.style.height = singleLineHeight + 'px';
            // Measure what the browser thinks the scrollHeight should be for single line
            const naturalScrollHeight = userInput.scrollHeight;
            // Set to that height for consistency
            userInput.style.height = naturalScrollHeight + 'px';
            userInput.style.overflowY = 'hidden';

        }, 0);
    }

    // Clear OpenRouter API key button
    const clearOpenRouterKeyButton = document.getElementById('clear-openrouter-key');
    if (clearOpenRouterKeyButton) {
        clearOpenRouterKeyButton.addEventListener('click', () => {
            hideSettingsModal();
            setTimeout(() => {
                setActionToPerform('clearOpenRouterKey');
                showConfirmationModal('Are you sure you want to clear the OpenRouter API key? You will need to re-enter it to use OpenRouter.');
            }, 100);
        });
    }

    // Clear LM Studio token button
    const clearLMStudioTokenButton = document.getElementById('clear-lmstudio-token');
    if (clearLMStudioTokenButton) {
        clearLMStudioTokenButton.addEventListener('click', () => {
            hideSettingsModal();
            setTimeout(() => {
                setActionToPerform('clearLMStudioToken');
                showConfirmationModal('Are you sure you want to clear the LM Studio API token? API requests will be sent without authentication.');
            }, 100);
        });
    }

    // Clear chat button
    if (clearChatButton) {
        clearChatButton.addEventListener('click', () => {
            // Close settings modal first to avoid modal conflicts
            hideSettingsModal();

            // Small delay to let settings modal close completely
            setTimeout(() => {
                setActionToPerform('clearAllChats');
                showConfirmationModal('Are you sure you want to clear all chats? This action cannot be undone.');
            }, 100);
        });
    }

    // New chat button
    if (newChatButton) {
        bindPressInFeedback(newChatButton);

        newChatButton.addEventListener('click', () => {
            createNewChat();
        });

        newChatButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            runAfterPressIn(newChatButton, () => {
                createNewChat();
                newChatButton.blur();
            });
        }, { passive: false });
    }

    const optionsHeaderButton = document.querySelector('#sidebar .sidebar-section.collapsible .section-header');
    if (optionsHeaderButton) {
        bindPressInFeedback(optionsHeaderButton);
    }

    // Legacy Access button
    const legacyAccessBtn = document.getElementById('legacy-access-btn');
    if (legacyAccessBtn) {
        bindPressInFeedback(legacyAccessBtn);

        bindSidebarScrollableTap(legacyAccessBtn, () => {
            // Close the sidebar first
            closeSidebar();

            // Then open the Legacy Access modal
            const legacyAccessModal = document.getElementById('legacy-access-modal');
            if (legacyAccessModal) {
                legacyAccessModal.classList.remove('hidden');
                legacyAccessModal.style.display = 'flex';
            }
        });
    }

    // Legacy Access modal close button
    const legacyAccessCloseBtn = document.getElementById('legacy-access-close-btn');
    if (legacyAccessCloseBtn) {
        legacyAccessCloseBtn.addEventListener('click', () => {
            const legacyAccessModal = document.getElementById('legacy-access-modal');
            if (legacyAccessModal) {
                legacyAccessModal.classList.add('hidden');
                legacyAccessModal.style.display = 'none';
            }
        });
    }

    // Quick mode switcher in the sidebar footer
    const modeIndicator = document.getElementById('mode-indicator');
    const modeSwitcher = document.getElementById('sidebar-mode-switcher');
    if (modeIndicator && modeSwitcher) {
        const QUICK_SWITCHER_OPEN_MS = 180;
        const QUICK_SWITCHER_CLOSE_MS = 140;
        let quickSwitcherTimer = null;
        const modeButtons = Array.from(modeSwitcher.querySelectorAll('.sidebar-mode-switcher-btn'));
        const getActiveProvider = () => {
            if (getUseOpenRouter()) {
                return 'openrouter';
            }

            if (getUseOpenAICompatible()) {
                return 'openai-compatible';
            }

            return 'local';
        };

        const syncQuickSwitcherState = () => {
            const activeProvider = getActiveProvider();
            modeButtons.forEach((button) => {
                const isActive = button.dataset.provider === activeProvider;
                button.classList.toggle('active', isActive);
                button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });
        };

        const hideQuickSwitcher = () => {
            if (quickSwitcherTimer) {
                clearTimeout(quickSwitcherTimer);
                quickSwitcherTimer = null;
            }

            if (modeSwitcher.classList.contains('hidden')) {
                modeIndicator.classList.remove('hidden');
                modeIndicator.setAttribute('aria-hidden', 'false');
                return;
            }

            modeSwitcher.classList.remove('animating-in');
            modeSwitcher.classList.add('animating-out');
            modeSwitcher.setAttribute('aria-hidden', 'true');

            quickSwitcherTimer = setTimeout(() => {
                modeSwitcher.classList.remove('animating-out');
                modeSwitcher.classList.add('hidden');
                modeIndicator.classList.remove('hidden');
                modeIndicator.setAttribute('aria-hidden', 'false');
                quickSwitcherTimer = null;
            }, QUICK_SWITCHER_CLOSE_MS);
        };

        const showQuickSwitcher = () => {
            if (quickSwitcherTimer) {
                clearTimeout(quickSwitcherTimer);
                quickSwitcherTimer = null;
            }

            syncQuickSwitcherState();
            modeSwitcher.classList.remove('hidden', 'animating-out');
            modeSwitcher.setAttribute('aria-hidden', 'false');
            modeIndicator.classList.add('hidden');
            modeIndicator.setAttribute('aria-hidden', 'true');

            // Restart opening animation reliably.
            modeSwitcher.classList.remove('animating-in');
            void modeSwitcher.offsetWidth;
            modeSwitcher.classList.add('animating-in');

            quickSwitcherTimer = setTimeout(() => {
                modeSwitcher.classList.remove('animating-in');
                quickSwitcherTimer = null;
            }, QUICK_SWITCHER_OPEN_MS);
        };

        const toggleQuickSwitcher = () => {
            if (modeSwitcher.classList.contains('hidden')) {
                showQuickSwitcher();
            } else {
                hideQuickSwitcher();
            }
        };

        const applyProviderFromQuickSwitcher = (provider) => {
            const normalizedProvider = provider === 'openrouter' || provider === 'openai-compatible'
                ? provider
                : 'local';
            applyConnectionProviderSelection(normalizedProvider);
            syncQuickSwitcherState();
            hideQuickSwitcher();
        };

        modeIndicator.setAttribute('role', 'button');
        modeIndicator.setAttribute('tabindex', '0');
        modeIndicator.setAttribute('aria-label', 'Open quick AI mode switcher');
        modeIndicator.style.cursor = 'pointer';
        bindPressInFeedback(modeIndicator);
        bindSidebarScrollableTap(modeIndicator, toggleQuickSwitcher);
        modeIndicator.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') {
                return;
            }

            e.preventDefault();
            toggleQuickSwitcher();
            modeIndicator.blur();
        });

        modeButtons.forEach((button) => {
            bindPressInFeedback(button);
            bindSidebarScrollableTap(button, () => {
                applyProviderFromQuickSwitcher(button.dataset.provider || 'local');
            });
        });

        if (modeSwitcher.dataset.quickSwitcherOutsideBound !== 'true') {
            const onDocumentPointerDown = (event) => {
                if (modeSwitcher.classList.contains('hidden')) {
                    return;
                }

                const target = event.target;
                if (modeIndicator.contains(target) || modeSwitcher.contains(target)) {
                    return;
                }

                hideQuickSwitcher();
            };

            document.addEventListener('click', onDocumentPointerDown);
            document.addEventListener('touchstart', onDocumentPointerDown, { passive: true });
            modeSwitcher.dataset.quickSwitcherOutsideBound = 'true';
        }

        syncQuickSwitcherState();
    }

    // Terms of Service button
    const termsServiceBtn = document.getElementById('terms-service-btn');
    if (termsServiceBtn) {
        termsServiceBtn.addEventListener('click', () => {
            // Close the sidebar first
            closeSidebar();

            // Then open the Terms of Service modal in review mode
            showTermsReviewModal();
        });
    }

    // Privacy Policy Logic
    const privacyPolicyBtn = document.getElementById('privacy-policy-btn');
    const privacyPolicyCloseBtn = document.getElementById('close-privacy-policy-btn');
    const privacyPolicyFooterCloseBtn = document.getElementById('close-privacy-policy-footer-btn');
    const privacyPolicyModal = document.getElementById('privacy-policy-modal');

    // Function to close privacy policy modal
    const closePrivacyPolicyModal = () => {
        if (privacyPolicyModal) {
            privacyPolicyModal.classList.remove('show');
            privacyPolicyModal.classList.add('hide');

            setTimeout(() => {
                privacyPolicyModal.classList.add('hidden');
                privacyPolicyModal.classList.remove('hide');
            }, 400);

            // Restore body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';

            // Remove temporary event listeners
            document.removeEventListener('keydown', handlePrivacyPolicyEscape);
            privacyPolicyModal.removeEventListener('click', handlePrivacyPolicyOutsideClick);
        }
    };

    // Handle Escape key
    const handlePrivacyPolicyEscape = (e) => {
        if (e.key === 'Escape') {
            closePrivacyPolicyModal();
        }
    };

    // Handle outside click
    const handlePrivacyPolicyOutsideClick = (e) => {
        if (e.target === privacyPolicyModal) {
            closePrivacyPolicyModal();
        }
    };

    if (privacyPolicyBtn) {
        privacyPolicyBtn.addEventListener('click', () => {
            // Close the sidebar first
            closeSidebar();

            // Then open the Privacy Policy modal
            const privacyPolicyContentContainer = document.getElementById('privacy-policy-content');
            if (privacyPolicyModal) {
                privacyPolicyModal.classList.remove('hidden');
                privacyPolicyModal.classList.remove('hide');
                // Force reflow so fade-in transition starts from opacity 0.
                void privacyPolicyModal.offsetHeight;
                privacyPolicyModal.classList.add('show');

                // Prevent body scroll (match terms modal behavior)
                document.body.style.overflow = 'hidden';
                document.body.style.position = 'fixed';
                document.body.style.width = '100%';
                document.body.style.height = '100%';

                // Reset scroll position and show loading
                if (privacyPolicyContentContainer) {
                    privacyPolicyContentContainer.scrollTop = 0;
                    
                    // Render markdown content
                    const renderPrivacy = (marked) => {
                        try {
                            const html = (typeof marked.parse === 'function') 
                                ? marked.parse(privacyPolicyContent) 
                                : (typeof marked === 'function' ? marked(privacyPolicyContent) : null);

                            if (html) {
                                privacyPolicyContentContainer.innerHTML = html;
                                // Apply syntax highlighting if any code blocks exist
                                if (window.shHighlightElement) {
                                    privacyPolicyContentContainer.querySelectorAll('pre code').forEach(el => {
                                        window.shHighlightElement(el);
                                    });
                                }
                            } else {
                                throw new Error('Marked parser failed to produce HTML');
                            }
                        } catch (err) {
                            console.error('Error parsing privacy markdown:', err);
                            privacyPolicyContentContainer.innerHTML = '<p class="text-red-400">Error rendering privacy policy. Please contact support.</p>';
                        }
                    };

                    if (window.marked) {
                        renderPrivacy(window.marked);
                    } else if (window.loadMarkedLibrary) {
                        window.loadMarkedLibrary().then(renderPrivacy).catch(err => {
                            console.error('Failed to load marked for privacy policy:', err);
                            privacyPolicyContentContainer.innerHTML = '<p class="text-red-400">Error loading privacy policy content.</p>';
                        });
                    } else {
                        privacyPolicyContentContainer.innerHTML = '<p class="text-red-400">Markdown renderer unavailable.</p>';
                    }
                }

                // Add temporary event listeners
                document.addEventListener('keydown', handlePrivacyPolicyEscape);
                privacyPolicyModal.addEventListener('click', handlePrivacyPolicyOutsideClick);
            }
        });
    }

    // Privacy Policy modal close buttons
    if (privacyPolicyCloseBtn) {
        privacyPolicyCloseBtn.addEventListener('click', closePrivacyPolicyModal);
    }
    if (privacyPolicyFooterCloseBtn) {
        privacyPolicyFooterCloseBtn.addEventListener('click', closePrivacyPolicyModal);
    }

    // Locate order number link (in Legacy Access modal) - opens external site modal
    const locateOrderLink = document.getElementById('locate-order-number-link');
    if (locateOrderLink) {
        locateOrderLink.addEventListener('click', (e) => {
            e.preventDefault();
            locateOrderLink.classList.add('active-scale');

            setTimeout(() => {
                const orderNumberUrl = 'https://support.google.com/store/answer/13714320?hl=en';
                openExternalLink(orderNumberUrl);
                locateOrderLink.classList.remove('active-scale');
            }, 200);
        });
    }

    // Locate order number link (in Help modal) - opens external site modal
    const helpLocateOrderLink = document.getElementById('help-locate-order-number-link');
    if (helpLocateOrderLink) {
        helpLocateOrderLink.addEventListener('click', (e) => {
            e.preventDefault();
            helpLocateOrderLink.classList.add('active-scale');

            setTimeout(() => {
                const orderNumberUrl = 'https://support.google.com/store/answer/13714320?hl=en';
                openExternalLink(orderNumberUrl);
                helpLocateOrderLink.classList.remove('active-scale');
            }, 200);
        });
    }

    // Locate order number link (in What's New modal) - opens external site modal
    const whatsNewLocateOrderLink = document.getElementById('whats-new-locate-order-number-link');
    if (whatsNewLocateOrderLink) {
        whatsNewLocateOrderLink.addEventListener('click', (e) => {
            e.preventDefault();
            whatsNewLocateOrderLink.classList.add('active-scale');

            setTimeout(() => {
                const orderNumberUrl = 'https://support.google.com/store/answer/13714320?hl=en';
                openExternalLink(orderNumberUrl);
                whatsNewLocateOrderLink.classList.remove('active-scale');
            }, 200);
        });
    }

    // Settings button
    if (settingsButton) {
        settingsButton.addEventListener('click', handleSettingsButtonClick);
    }

    if (systemPromptSettingsButton) {
        systemPromptSettingsButton.addEventListener('click', handleSystemPromptSettingsButtonClick);
    }

    // Close settings button
    if (closeSettingsButton) {
        closeSettingsButton.addEventListener('click', handleCloseSettingsButtonClick);
    }

    // Add event listener for the X icon in the top right corner of settings modal
    if (closeSettingsXButton) {
        closeSettingsXButton.addEventListener('click', handleCloseSettingsButtonClick);
    }

    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            toggleSidebar();
            // Remove focus to prevent the button from staying highlighted
            sidebarToggle.blur();
        });

        // Add touch event handlers to prevent highlight on mobile
        sidebarToggle.addEventListener('touchstart', (e) => {
            // Prevent default touch highlight
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });

        sidebarToggle.addEventListener('touchend', (e) => {
            // Prevent default behavior that might cause highlight
            if (e.cancelable) {
                e.preventDefault();
            }
            // Call toggle function
            toggleSidebar();
            // Remove focus
            sidebarToggle.blur();
        }, { passive: false });
    }

    const premiumHeaderButton = document.getElementById('premium-header-button');
    if (premiumHeaderButton) {
        bindPressInFeedback(premiumHeaderButton);

        const openHeaderPremiumPanel = () => {
            openPremiumHeaderModal();
            premiumHeaderButton.blur();
        };

        premiumHeaderButton.addEventListener('click', openHeaderPremiumPanel);
        premiumHeaderButton.addEventListener('touchstart', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });
        premiumHeaderButton.addEventListener('touchend', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            openHeaderPremiumPanel();
        }, { passive: false });
    }

    // Close sidebar button
    if (closeSidebarButton) {
        closeSidebarButton.addEventListener('click', toggleSidebar);
    }

    // Close sidebar when clicking outside on mobile or desktop
    document.addEventListener('click', function (e) {
        // Skip this event handler if the target is an input, textarea, or form control
        if (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.tagName === 'SELECT' ||
            e.target.closest('form') !== null) {
            return;
        }

        // Skip this event handler if the target is a modal close button
        if (e.target.closest('#close-about') ||
            e.target.closest('#close-settings') ||
            e.target.closest('#close-settings-x') ||
            e.target.closest('.modal-close-btn') ||
            e.target.closest('#confirmation-modal')) {
            return;
        }

        // Don't handle sidebar clicks if any modal is visible
        const anyModalVisible = document.querySelector('.modal-container:not(.hidden)') ||
            (settingsModal && settingsModal.style.display === 'flex') ||
            isConfirmationModalVisible();
        if (anyModalVisible) {
            return;
        }

        handleSidebarOutsideClick(e);
    });

    // Prevent multiple rapid touch events
    let lastTouchTime = 0;

    // Also handle touch events for mobile and tablets
    document.addEventListener('touchend', function (e) {
        // Prevent rapid-fire touch events
        const now = Date.now();
        if (now - lastTouchTime < 100) {
            return;
        }
        lastTouchTime = now;

        if (e.target && e.target.closest('#confirmation-modal')) {
            return;
        }

        // Debug logging removed
        // Only process if this is a simple tap (not scrolling or other complex gestures)
        if (e.changedTouches && e.changedTouches.length === 1) {
            // Get the element at the touch position for more accurate detection
            const touch = e.changedTouches[0];
            const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);

            // Skip for form inputs, buttons, and interactive elements
            if (elementAtTouch && (
                elementAtTouch.tagName === 'INPUT' ||
                elementAtTouch.tagName === 'TEXTAREA' ||
                elementAtTouch.tagName === 'SELECT' ||
                elementAtTouch.tagName === 'BUTTON' ||
                elementAtTouch.closest('form') !== null ||
                elementAtTouch.closest('button') !== null ||
                elementAtTouch.closest('.menu-item') !== null ||
                elementAtTouch.closest('#chat-history') !== null ||
                elementAtTouch.closest('#sidebar') !== null ||
                elementAtTouch.closest('#close-about') ||
                elementAtTouch.closest('#close-settings') ||
                elementAtTouch.closest('#close-settings-x') ||
                elementAtTouch.closest('.modal-close-btn'))) {
                return;
            }

            // Don't handle sidebar clicks if any modal is visible
            const anyModalVisible = document.querySelector('.modal-container:not(.hidden)') ||
                (settingsModal && settingsModal.style.display === 'flex') ||
                isConfirmationModalVisible();
            if (anyModalVisible) {
                return;
            }

            // Check if we're tapping on the sidebar overlay directly
            if (elementAtTouch && elementAtTouch.id === 'sidebar-overlay') {
                // If tapping directly on the overlay, use toggleSidebar for consistency
                toggleSidebar();
                return;
            }

            // Otherwise, use the standard outside click handler
            handleSidebarOutsideClick(e);
        }
    }, { passive: false });

    // Handle window resize
    window.addEventListener('resize', handleWindowResize);

    // Add focus/blur event listeners to the window to track focus state
    // This helps with the regenerate button issue
    window.addEventListener('focus', () => {
        debugLog('Window gained focus');
        document.body.classList.remove('window-blurred');
        document.body.classList.add('window-focused');
    });

    window.addEventListener('blur', () => {
        debugLog('Window lost focus');
        document.body.classList.remove('window-focused');
        document.body.classList.add('window-blurred');
    });

    // Set initial focus state
    if (document.hasFocus()) {
        document.body.classList.add('window-focused');
    } else {
        document.body.classList.add('window-blurred');
    }

    // Confirmation action button
    if (confirmActionButton) {
        confirmActionButton.addEventListener('click', handleConfirmAction);
    }

    // Cancel action button
    if (cancelActionButton) {
        cancelActionButton.addEventListener('click', hideConfirmationModal);
    }

    // Help button
    if (helpButton) {
        helpButton.addEventListener('click', () => {
            // Close the sidebar first
            closeSidebar();

            // Also close the options container
            const optionsContainer = document.getElementById('options-container');
            if (optionsContainer) {
                optionsContainer.classList.add('hidden');
                optionsContainer.classList.remove('animate-fade-in');
            }

            // Then open the Help modal
            const helpModal = document.getElementById('help-modal');
            if (helpModal) {
                helpModal.classList.remove('hidden');
                const modalContent = helpModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.classList.add('animate-modal-in');

                    // Reset scroll position to top
                    const scrollableContent = helpModal.querySelector('.overflow-y-auto');
                    if (scrollableContent) {
                        scrollableContent.scrollTop = 0;
                    }

                    setTimeout(() => {
                        modalContent.classList.remove('animate-modal-in');
                    }, 300);
                }
            }
        });
    }

    // What's New button
    if (whatsNewButton) {
        whatsNewButton.addEventListener('click', () => {
            // Close the sidebar with smooth transition
            if (sidebar) {
                // Add the slide-out animation class
                sidebar.classList.add('animate-slide-out');
                sidebar.classList.remove('animate-slide-in');

                // Also close the options container
                const optionsContainer = document.getElementById('options-container');
                if (optionsContainer) {
                    optionsContainer.classList.add('hidden');
                    optionsContainer.classList.remove('animate-fade-in');
                }

                // Collapse all sections when sidebar is closed
                const sectionHeaders = sidebar.querySelectorAll('.section-header');
                const chatHistorySection = sidebar.querySelector('.sidebar-section:last-child');
                sectionHeaders.forEach(header => {
                    header.classList.remove('active');
                    const content = header.nextElementSibling;
                    if (content && content.classList.contains('collapsible-content')) {
                        content.classList.remove('show');
                    }
                });

                // Ensure chat history is visible when sidebar is closed
                if (chatHistorySection) {
                    chatHistorySection.classList.remove('chat-history-hidden');
                }

                // Remove the sidebar overlay with fade effect
                const sidebarOverlay = document.getElementById('sidebar-overlay');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                    // Wait for overlay fade transition
                    setTimeout(() => {
                        sidebarOverlay.classList.add('hidden');
                    }, 300);
                }

                // Close the sidebar and show the What's New modal
                closeSidebar();

                // Show the What's New modal after sidebar is closed
                setTimeout(() => {
                    // Show the What's New modal, forcing it to show even if already seen
                    showWhatsNewModal(true);
                }, 100); // Small delay for a smoother transition
            } else {
                // If sidebar doesn't exist, just show the modal
                showWhatsNewModal(true);
            }
        });
    }

    // New chat header button
    if (newChatHeaderButton) {
        newChatHeaderButton.addEventListener('click', handleNewChatButtonClick);

        // Add touch event handlers to prevent highlight on mobile
        newChatHeaderButton.addEventListener('touchstart', (e) => {
            // Prevent default touch highlight
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });

        newChatHeaderButton.addEventListener('touchend', (e) => {
            // Prevent default behavior that might cause highlight
            e.preventDefault();
            // Trigger new chat functionality
            handleNewChatButtonClick();
        }, { passive: false });

        // Remove focus to prevent the button from staying highlighted
        newChatHeaderButton.addEventListener('click', () => {
            if (newChatHeaderButton) {
                newChatHeaderButton.blur();
            }
        });
    }

    // Web search header button
    if (webSearchHeaderButton) {
        bindSidebarScrollableTap(webSearchHeaderButton, toggleWebSearchFeature);
    }

    // About button
    if (aboutButton) {
        // Remove any existing event listeners to prevent duplicates
        const newAboutButton = aboutButton.cloneNode(true);
        aboutButton.parentNode.replaceChild(newAboutButton, aboutButton);

        // Update the reference in the imported DOM elements
        window.aboutButton = newAboutButton;

        // Add the event listener to the new button
        newAboutButton.addEventListener('click', () => {
            debugLog('About button clicked');
            // Close the sidebar first
            closeSidebar();

            // Also close the options container
            const optionsContainer = document.getElementById('options-container');
            if (optionsContainer) {
                optionsContainer.classList.add('hidden');
                optionsContainer.classList.remove('animate-fade-in');
            }

            // Then open the About modal
            const aboutModal = document.getElementById('about-modal');
            if (aboutModal) {
                aboutModal.classList.remove('hidden');
                aboutModal.classList.remove('hide');
                // Force reflow so fade-in transition starts from opacity 0.
                void aboutModal.offsetHeight;
                aboutModal.classList.add('show');
                const modalContent = aboutModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.classList.add('animate-modal-in');
                    setTimeout(() => {
                        modalContent.classList.remove('animate-modal-in');
                    }, 300);
                }
            }
        });
        debugLog('About button event handler attached during initialization');
    }

    // Options button for mobile view
    const optionsBtn = document.getElementById('options-btn');
    const optionsContainer = document.getElementById('options-container');
    if (optionsBtn && optionsContainer) {
        // Remove any existing event listeners to prevent duplicates
        const newOptionsBtn = optionsBtn.cloneNode(true);
        optionsBtn.parentNode.replaceChild(newOptionsBtn, optionsBtn);

        // Add the event listener to the new button
        newOptionsBtn.addEventListener('click', handleOptionsButtonClick);
        debugLog('Options button event handler attached during initialization');
    }

    // Stop button
    if (stopButton) {
        // Remove any existing event listeners to prevent duplicates
        const newStopButton = stopButton.cloneNode(true);
        stopButton.parentNode.replaceChild(newStopButton, stopButton);

        // Add a more robust handler that ensures the UI is reset, especially for first message
        newStopButton.addEventListener('click', (e) => {
            e.preventDefault();
            debugLog('Stop button clicked');

            // Force UI reset regardless of abort success
            const sendBtn = document.getElementById('send-button');
            const stopBtn = document.getElementById('stop-button');

            if (stopBtn && !stopBtn.classList.contains('hidden')) {
                // Abort the generation through the chat service module
                import('./chat-service.js').then(module => {
                    if (typeof module.abortGeneration === 'function') {
                        module.abortGeneration();
                    } else {
                        // Fallback if function not available
                        abortGeneration();
                    }

                    // Double-check UI state after a short delay to ensure it's reset
                    setTimeout(() => {
                        if (stopBtn && !stopBtn.classList.contains('hidden')) {
                            debugLog('Force resetting UI state after stop');
                            stopBtn.classList.add('hidden');
                            if (sendBtn) {
                                sendBtn.classList.remove('hidden');
                            }
                            hideLoadingIndicator();
                        }

                        // Ensure abort controller is nullified
                        if (typeof module.setAbortController === 'function') {
                            module.setAbortController(null);
                        }
                    }, 100);
                }).catch(error => {
                    console.error('Error importing chat-service module:', error);
                    // Fallback to standard abort function
                    abortGeneration();

                    // Force UI reset
                    setTimeout(() => {
                        stopBtn.classList.add('hidden');
                        if (sendBtn) sendBtn.classList.remove('hidden');
                        hideLoadingIndicator();
                    }, 100);
                });
            }
        });
        debugLog('Enhanced stop button event handler attached');
    }

    // Hide context menus when clicking outside
    document.addEventListener('click', (e) => {
        if (contextMenu && !contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }

        // For send context menu, keep it open if the click is inside the menu OR the send button
        // Only dismiss when clicking elsewhere on the screen
        if (sendContextMenu && sendContextMenu.style.display === 'block') {
            // Get the send button element
            const sendButtonElement = document.getElementById('send-button');

            // Check if the click is outside both the menu and the send button
            if (!sendContextMenu.contains(e.target) &&
                (!sendButtonElement || !sendButtonElement.contains(e.target))) {
                hideSendContextMenu();
                debugLog('Send context menu hidden by outside click');
            } else {
                debugLog('Click inside menu or send button - keeping menu open');
            }
        }
    });

    // Copy text button
    if (copyTextButton) {
        copyTextButton.addEventListener('click', handleCopyText);
    }

    // Regenerate text button
    if (regenerateTextButton) {
        regenerateTextButton.addEventListener('click', handleRegenerateText);
    }

    // Exit button
    if (exitButton) {
        exitButton.addEventListener('click', () => {
            setActionToPerform('exit');
            showConfirmationModal('Are you sure you want to exit the application?');
        });
    }

    // Refresh button
    if (refreshButton) {
        refreshButton.addEventListener('click', handleRefreshButtonClick);

        // Add touch event handlers to prevent highlight on mobile
        refreshButton.addEventListener('touchstart', (e) => {
            // Prevent default touch highlight
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });

        refreshButton.addEventListener('touchend', (e) => {
            // Prevent default behavior that might cause highlight
            e.preventDefault();
            // Call refresh function
            handleRefreshButtonClick();
            // Remove focus
            refreshButton.blur();
        }, { passive: false });
    }

    // Model toggle button
    if (modelToggleButton) {
        modelToggleButton.addEventListener('click', handleModelToggleButtonClick);

        // Add touch event handlers to prevent highlight on mobile
        modelToggleButton.addEventListener('touchstart', (e) => {
            // Prevent default touch highlight
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });

        modelToggleButton.addEventListener('touchend', (e) => {
            // Prevent default behavior that might cause highlight
            e.preventDefault();
            // Call toggle function
            handleModelToggleButtonClick();
            // Remove focus
            modelToggleButton.blur();
        }, { passive: false });
    }

    // Model button in sidebar
    if (modelButton) {
        // Remove any existing event listeners to prevent duplicates
        const newModelButton = modelButton.cloneNode(true);
        modelButton.parentNode.replaceChild(newModelButton, modelButton);

        // Add the event listener to the new button
        newModelButton.addEventListener('click', () => {
            debugLog('Model button clicked');
            // Close the sidebar first
            closeSidebar();

            // Also close the options container
            const optionsContainer = document.getElementById('options-container');
            if (optionsContainer) {
                optionsContainer.classList.add('hidden');
                optionsContainer.classList.remove('animate-fade-in');
            }

            // Then open the Model modal
            showModelModal();
        });
        debugLog('Model button event handler attached during initialization');
    }


    // Settings icon button in header
    if (settingsIconButton) {
        settingsIconButton.addEventListener('click', handleSettingsButtonClick);

        // Add touch event handlers to prevent highlight on mobile
        settingsIconButton.addEventListener('touchstart', (e) => {
            // Prevent default touch highlight
            if (e.cancelable) {
                e.preventDefault();
            }
        }, { passive: false });

        settingsIconButton.addEventListener('touchend', (e) => {
            // Prevent default behavior that might cause highlight
            e.preventDefault();
            // Call settings function
            handleSettingsButtonClick();
            // Remove focus
            settingsIconButton.blur();
        }, { passive: false });
    }

    // Function to hide the send context menu
    const hideSendContextMenu = () => {
        if (sendContextMenu) {
            // Add a fade-out animation class
            sendContextMenu.classList.add('menu-fade-out');

            // After animation completes, hide the menu and remove the animation class
            setTimeout(() => {
                sendContextMenu.style.display = 'none';
                sendContextMenu.classList.remove('menu-fade-out');

                // Remove any active touch classes when hiding menu
                const menuButtons = sendContextMenu.querySelectorAll('button');
                menuButtons.forEach(button => {
                    button.classList.remove('touch-active');
                });
            }, 150); // Match with CSS animation duration

        }
    };

    // New topic menu button in the send context menu
    if (newTopicMenuButton) {
        // Add touch feedback for mobile devices
        newTopicMenuButton.addEventListener('touchstart', () => {
            newTopicMenuButton.classList.add('touch-active');
        }, { passive: true });

        newTopicMenuButton.addEventListener('touchend', () => {
            // The touch-active class will be removed when the menu is hidden
        }, { passive: true });

        newTopicMenuButton.addEventListener('touchcancel', () => {
            newTopicMenuButton.classList.remove('touch-active');
        }, { passive: true });

        newTopicMenuButton.addEventListener('click', () => {
            // Only add a topic boundary if we have messages in the current chat
            if (chatHistoryData[currentChatId]) {
                // Check if chat data is in the new format (object with messages array)
                const messages = Array.isArray(chatHistoryData[currentChatId])
                    ? chatHistoryData[currentChatId]
                    : chatHistoryData[currentChatId].messages;

                // Only add topic boundary if there are messages
                if (messages && messages.length > 0) {
                    addTopicBoundary();
                    debugLog('Added topic boundary');
                } else {
                    debugLog('No messages in chat, topic boundary not added');
                }
            }

            // Always hide the context menu after clicking, even if no action was taken
            hideSendContextMenu();
        });
    }

    // Scroll to bottom menu button in the send context menu
    if (scrollToBottomMenuButton && messagesContainer) {
        // Add touch feedback for mobile devices
        scrollToBottomMenuButton.addEventListener('touchstart', () => {
            scrollToBottomMenuButton.classList.add('touch-active');
        }, { passive: true });

        scrollToBottomMenuButton.addEventListener('touchend', () => {
            // The touch-active class will be removed when the menu is hidden
        }, { passive: true });

        scrollToBottomMenuButton.addEventListener('touchcancel', () => {
            scrollToBottomMenuButton.classList.remove('touch-active');
        }, { passive: true });

        scrollToBottomMenuButton.addEventListener('click', () => {
            debugLog('Scroll to bottom menu button clicked');

            // Use manual scroll function for menu button too
            scrollToBottomManual(messagesContainer);

            // Hide the context menu after clicking
            hideSendContextMenu();
        });
    }

    // Floating scroll to bottom button
    const scrollToBottomButton = document.getElementById('scroll-to-bottom');
    if (scrollToBottomButton && messagesContainer) {
        scrollToBottomButton.addEventListener('click', () => {
            debugLog('Floating scroll to bottom button clicked');
            scrollToBottomManual(messagesContainer);
        });
    }

    // Paperclip button in the input field
    const paperclipButton = document.getElementById('paperclip-button');
    const fileUploadInput = document.getElementById('file-upload-input');
    if (paperclipButton && fileUploadInput) {
        const openFileSelector = () => {
            fileUploadInput.click();
            return true;
        };

        // Click handler for desktop
        paperclipButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            openFileSelector();
            debugLog('Paperclip button clicked, opening file selector');

            // Remove auto-scroll when clicking paperclip button
        });

        // Improved touch event handling for mobile
        paperclipButton.addEventListener('touchstart', (e) => {
            // Add a visual indicator that the button is being pressed
            paperclipButton.classList.add('active');

            // Remove auto-scroll when tapping paperclip button
        }, { passive: true });

        paperclipButton.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default to avoid any conflicts
            e.stopPropagation(); // Prevent event bubbling

            // Remove the active class
            paperclipButton.classList.remove('active');

            // Get the element at the touch position to ensure we're still on the button
            const touch = e.changedTouches[0];
            const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);

            // Only trigger if we're still on the paperclip button or its children
            if (elementAtTouch === paperclipButton || paperclipButton.contains(elementAtTouch)) {
                openFileSelector();
                debugLog('Paperclip button touched, opening file selector');
            }
        }, { passive: false });

        // Handle touch cancel event
        paperclipButton.addEventListener('touchcancel', () => {
            paperclipButton.classList.remove('active');
        }, { passive: true });
    }

    // Send button click handling (long-press behavior removed)
    if (sendButton) {
        sendButton.addEventListener('click', (e) => {
            debugLog('Send button clicked - normal click detected');

            // Check if there's a message or files attached
            const messageContent = userInput.value.trim();
            const hasUploadedFiles = getUploadedFiles && getUploadedFiles().length > 0;

            // Only prevent default if we don't want to submit (no message or files)
            if (!messageContent && !hasUploadedFiles) {
                debugLog('No message or files - not submitting form');
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            debugLog(`Click submitting form with ${messageContent ? 'message' : 'no message'} and ${hasUploadedFiles ? 'files' : 'no files'}`);

            // Remove focus from the input field before submit
            userInput.blur();
            // Let the form submit naturally by not preventing default
        });
    }

    // Add global event listener for regenerate buttons
    if (messagesContainer) {
        messagesContainer.addEventListener('click', handleRegenerateButtonClick);
        messagesContainer.addEventListener('click', handleEditButtonClick);
        messagesContainer.addEventListener('click', handleAIEditButtonClick);
        messagesContainer.addEventListener('click', handleDeleteButtonClick);
    }

    // Initialize reset app button
    initializeResetAppButton();

    // Force re-initialization of reset app button after other components are loaded
    setTimeout(() => {
        initializeResetAppButton();
    }, 500);

    // Initialize scroll event for messages container
    if (messagesContainer) {
        // Add scroll event to detect when user has scrolled up
        messagesContainer.addEventListener('scroll', () => {
            handleScroll(messagesContainer);
        });

        // Force a check of scroll position after a short delay
        setTimeout(() => {
            if (messagesContainer.scrollHeight > messagesContainer.clientHeight) {
                handleScroll(messagesContainer);
            }
        }, 500);
    }

    // Import/Export group button
    if (importExportGroupButton && importExportContainer) {
        resetSidebarGroup('import-export-group-btn', 'import-export-container');
        rebindSidebarGroupButton('import-export-group-btn', toggleImportExportContainer);
    }

    const premiumGroupButton = document.getElementById('premium-group-btn');
    const premiumContainer = document.getElementById('premium-container');
    if (premiumGroupButton && premiumContainer) {
        resetSidebarGroup('premium-group-btn', 'premium-container');
        rebindSidebarGroupButton('premium-group-btn', togglePremiumContainer);
    }

    // Export Chats button
    if (exportChatsButton) {
        // Remove any existing event listeners to prevent duplicates
        const newExportChatsButton = exportChatsButton.cloneNode(true);
        exportChatsButton.parentNode.replaceChild(newExportChatsButton, exportChatsButton);

        // Add the event listener to the new button
        newExportChatsButton.addEventListener('click', () => {
            // Check if user is premium
            if (!isPremiumUser()) {
                openPremiumModal('Import/Export');
                return;
            }
            // Close the sidebar first
            closeSidebarExport();

            // Show the export confirmation modal
            import('./ui-manager.js').then(module => {
                module.showExportConfirmationModal();

                // Re-attach event listeners to the export confirmation buttons
                const confirmExportBtn = document.getElementById('confirm-export');
                const cancelExportBtn = document.getElementById('cancel-export');

                if (confirmExportBtn) {
                    // Remove any existing event listeners to prevent duplicates
                    const newConfirmExportBtn = confirmExportBtn.cloneNode(true);
                    confirmExportBtn.parentNode.replaceChild(newConfirmExportBtn, confirmExportBtn);

                    // Add the event listener to the new button
                    newConfirmExportBtn.addEventListener('click', () => {
                        // Hide the confirmation modal
                        module.hideExportConfirmationModal();
                        // Perform the export
                        import('./export-import.js').then(exportModule => {
                            exportModule.exportChats();
                        });
                    });
                }

                if (cancelExportBtn) {
                    // Remove any existing event listeners to prevent duplicates
                    const newCancelExportBtn = cancelExportBtn.cloneNode(true);
                    cancelExportBtn.parentNode.replaceChild(newCancelExportBtn, cancelExportBtn);

                    // Add the event listener to the new button
                    newCancelExportBtn.addEventListener('click', () => {
                        module.hideExportConfirmationModal();
                    });
                }
            });
        });
    }

    // Import Chats button
    if (importChatsButton && importChatsInput) {
        // Remove any existing event listeners to prevent duplicates
        const newImportChatsButton = importChatsButton.cloneNode(true);
        importChatsButton.parentNode.replaceChild(newImportChatsButton, importChatsButton);

        // Add the event listener to the new button
        newImportChatsButton.addEventListener('click', () => {
            // Check if user is premium
            if (!isPremiumUser()) {
                openPremiumModal('Import/Export');
                return;
            }
            // Close the sidebar first
            closeSidebarExport();

            // Trigger the file input
            importChatsInput.click();
        });
    }
}

/**
 * Handles chat form submission
 * @param {Event} e - The form submission event
 */
async function handleChatFormSubmit(e) {
    e.preventDefault();

    // Use a static flag to prevent multiple submissions while processing
    if (handleChatFormSubmit.isSubmitting) {
        return;
    }

    // Set the flag to prevent multiple submissions
    handleChatFormSubmit.isSubmitting = true;

    try {
        const message = userInput.value.trim();

        // Process local files if any
        let fileContents = [];
        const uploadedFiles = getUploadedFiles();

        // Check if we have files but no message
        const hasUploadedFiles = uploadedFiles && uploadedFiles.length > 0;


        // If there's no message and no files, don't do anything
        if (!message && !hasUploadedFiles) {
            return;
        }

        // If we're already generating text, don't start a new generation
        if (isGeneratingText()) {
            debugLog('Text generation already in progress, ignoring new submission');
            return;
        }

        if (!canFreeUserContinueWhenOffline()) {
            debugLog('Chat submission blocked: free user is offline');
            return;
        }

        // Mark the currently selected provider as used once the user sends a message.
        markCurrentModeActivity();

        hideWelcomeMessage();

        // Always add the user message to the UI first
        appendMessage('user', message, hasUploadedFiles ? uploadedFiles : null);

        // Legacy ad trigger removed

        // Add the user message to chat history immediately
        // This ensures the message exists in history even if generation is cancelled
        try {
            await addUserMessageToHistory(message, hasUploadedFiles ? uploadedFiles : []);
        } catch (error) {
            debugError('Error adding user message to history:', error);
        }

        // Clear the input field and reset height
        userInput.value = '';
        // Reset to the current screen's single-line composer height.
        const singleLineHeight = getSingleLineHeight(userInput);
        userInput.style.height = singleLineHeight + 'px';
        userInput.style.overflowY = 'hidden';

        // Create a new abort controller for this request
        // Important: ensure any existing controller is aborted and released first
        try {
            const module = await import('./chat-service.js');
            if (typeof module.setAbortController === 'function') {
                // Create a new abort controller for this request
                const controller = new AbortController();
                module.setAbortController(controller);

                // Show loading indicator and toggle to stop button
                showLoadingIndicator();
                toggleSendStopButton();

                // Process files if any
                await processFilesAndGenerateResponse();
            }
        } catch (error) {
            console.error('Error importing chat-service module:', error);
            // Fall back to basic processing if import fails
            showLoadingIndicator();
            toggleSendStopButton();
            await processFilesAndGenerateResponse();
        }

        // Define the function to process files and generate response
        async function processFilesAndGenerateResponse() {
            try {
                if (hasUploadedFiles) {
                    debugLog(`Processing ${uploadedFiles.length} uploaded files`);
                    // console.log(`Processing file uploads: ${uploadedFiles.map(f => f.name).join(', ')}`);

                    try {
                        fileContents = await uploadFilesToLMStudio(uploadedFiles);
                        debugLog(`Processed ${fileContents.length} files for LM Studio`);
                        console.log(`File content results: ${fileContents.map(f => `${f.name}: ${f.content ? f.content.length : 0} chars`).join(', ')}`);
                    } catch (error) {
                        console.error("Error processing files:", error);
                        appendMessage('error', `Failed to process files: ${error.message}`);

                        // Make sure to reset UI state in case of error
                        hideLoadingIndicator();
                        toggleSendStopButton();
                        return; // Stop further processing
                    }

                    // Files remain visible in preview until manually removed
                }

                // Generate AI response with the files
                await generateAIResponse(message, fileContents);
            } catch (error) {
                debugError('Error in file processing or AI response generation:', error);
                console.error("Chat submission error:", error);
                appendMessage('error', `An error occurred: ${error.message}`);

                // Make sure to reset UI state in case of error
                hideLoadingIndicator();
                toggleSendStopButton();
            }
        }
    } catch (error) {
        debugError('Error in chat submission:', error);
        console.error("Chat submission error:", error);
        appendMessage('error', `An error occurred: ${error.message}`);

        // Make sure to reset UI state in case of error
        hideLoadingIndicator();
        toggleSendStopButton();
    } finally {
        // Reset the submission flag regardless of success or error
        handleChatFormSubmit.isSubmitting = false;
    }
}

/**
 * Handles settings button click
 */
function handleSettingsButtonClick() {
    // Remove sidebar click handler while modal is open
    document.body.removeEventListener('click', handleSidebarOutsideClick);

    // Close the sidebar regardless of screen size
    closeSidebar();

    // Also close the options container
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        optionsContainer.classList.add('hidden');
        optionsContainer.classList.remove('animate-fade-in');
    }

    // Collapse all sections when sidebar is closed
    const sectionHeaders = sidebar.querySelectorAll('.section-header');
    const chatHistorySection = sidebar.querySelector('.sidebar-section:last-child');
    sectionHeaders.forEach(header => {
        header.classList.remove('active');
        const content = header.nextElementSibling;
        if (content && content.classList.contains('collapsible-content')) {
            content.classList.remove('show');
        }
    });

    // Ensure chat history is visible when sidebar is closed
    if (chatHistorySection) {
        chatHistorySection.classList.remove('chat-history-hidden');
    }

    // Ensure the welcome message is hidden when settings modal is shown
    if (welcomeMessage && welcomeMessage.style.display !== 'none') {
        welcomeMessage.style.opacity = '0';
        welcomeMessage.style.visibility = 'hidden';
    }

    // Use the centralized settings modal manager
    showSettingsModal();

    // Remove focus to prevent the button from staying highlighted
    if (settingsIconButton) {
        settingsIconButton.blur();
    }
    if (settingsButton) {
        settingsButton.blur();
    }
}

function handleSystemPromptSettingsButtonClick() {
    // Remove sidebar click handler while modal is open
    document.body.removeEventListener('click', handleSidebarOutsideClick);

    // Close the sidebar regardless of screen size
    closeSidebar();

    // Also close the options container
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        optionsContainer.classList.add('hidden');
        optionsContainer.classList.remove('animate-fade-in');
    }

    // Collapse all sections when sidebar is closed
    const sectionHeaders = sidebar.querySelectorAll('.section-header');
    const chatHistorySection = sidebar.querySelector('.sidebar-section:last-child');
    sectionHeaders.forEach(header => {
        header.classList.remove('active');
        const content = header.nextElementSibling;
        if (content && content.classList.contains('collapsible-content')) {
            content.classList.remove('show');
        }
    });

    // Ensure chat history is visible when sidebar is closed
    if (chatHistorySection) {
        chatHistorySection.classList.remove('chat-history-hidden');
    }

    // Ensure the welcome message is hidden when settings modal is shown
    if (welcomeMessage && welcomeMessage.style.display !== 'none') {
        welcomeMessage.style.opacity = '0';
        welcomeMessage.style.visibility = 'hidden';
    }

    Promise.resolve(showSettingsModal()).finally(() => {
        requestAnimationFrame(() => {
            navigateSettingsModalToStep('prompt');
        });
    });

    if (settingsIconButton) {
        settingsIconButton.blur();
    }
    if (settingsButton) {
        settingsButton.blur();
    }
    if (systemPromptSettingsButton) {
        systemPromptSettingsButton.blur();
    }
}

/**
 * Handles close settings button click
 */
function handleCloseSettingsButtonClick() {
    // IP/Port and OpenRouter key are now saved via their own sub-modals,
    // so no validation or saving is needed here — just close the settings modal.
    document.body.removeEventListener('click', handleSidebarOutsideClick);

    hideSettingsModal();

    // Re-attach the sidebar click handler after the modal finishes hiding
    setTimeout(() => {
        document.addEventListener('click', handleSidebarOutsideClick);
    }, 400);

    // If there are no messages, show the welcome message again
    if (messagesContainer && messagesContainer.children.length === 0) {
        showWelcomeMessage();
    }
}

/**
 * Handles clicking outside the sidebar
 * @param {Event} e - The click event or touch event
 */
function handleSidebarOutsideClick(e) {
    if (e.target && e.target.closest('#confirmation-modal')) {
        return;
    }

    // First check if any modal is currently visible - don't react if a modal is open
    const settingsModalVisible = settingsModal &&
        (!settingsModal.classList.contains('hidden') ||
            settingsModal.style.display === 'flex' ||
            settingsModal.style.visibility === 'visible');

    // Don't toggle sidebar if settings modal is visible
    if (settingsModalVisible) {
        return;
    }

    // Check for other open modals by class
    const otherModalsVisible = document.querySelector('.modal-container:not(.hidden)') || isConfirmationModalVisible();
    if (otherModalsVisible) {
        return;
    }

    // Get the actual target element - for touch events, use the element at touch position
    let targetElement = e.target;

    // For touch events, get the element at the touch position
    if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementAtTouch) {
            targetElement = elementAtTouch;
        }
    }

    // Only proceed if sidebar exists and is currently active/visible
    if (sidebar &&
        !sidebar.classList.contains('hidden') &&
        (sidebar.classList.contains('active') || window.innerWidth <= 1024) && // Increased to include tablets
        !targetElement.closest('#sidebar') &&
        !targetElement.closest('#sidebar-toggle') &&
        !targetElement.closest('#user-input') &&
        !targetElement.closest('#chat-form') &&
        !targetElement.closest('#messages') &&
        !targetElement.closest('#chat-container') &&
        !targetElement.closest('#model-toggle-button') &&
        !targetElement.closest('#settings-icon-button') &&
        !targetElement.closest('#refresh-button') &&
        !targetElement.closest('.app-title') &&
        !targetElement.closest('header') &&
        !targetElement.closest('#loaded-model')) {


        // Use toggleSidebar (same as X button) for consistent behavior
        toggleSidebar();
    }
}

/**
 * Handles window resize
 */
function handleWindowResize() {
    // Keep sidebar hidden on both mobile and desktop unless explicitly opened
    // This ensures consistent behavior across screen sizes
    if (sidebar && !sidebar.classList.contains('active')) {
        sidebar.classList.add('hidden');
    }

    // Update chat history scrolling behavior when window is resized
    import('./ui-manager.js').then(module => {
        if (typeof module.updateChatHistoryScroll === 'function') {
            module.updateChatHistoryScroll();
        }
    });
}

/**
 * Handles confirmation action button click
 */
function handleConfirmAction() {
    const action = getActionToPerform();

    // Ensure the confirmation modal is visible on top of any other modals
    const confirmationModal = document.getElementById('confirmation-modal');
    if (confirmationModal) {
        confirmationModal.style.zIndex = '1060'; // Ensure it's on top
    }

    if (action === 'clearAllChats') {
        // Make sure to hide the confirmation modal before clearing chats
        hideConfirmationModal();
        clearAllChats();
    } else if (action === 'deleteChat') {
        deleteChatHistory(getChatToDelete());
        hideConfirmationModal();
    } else if (action === 'exit') {
        closeApplication();
        hideConfirmationModal();
    } else if (action === 'resetApp') {
        console.log('RESET APP: Confirmation button clicked, executing reset...');
        // Make sure to hide the confirmation modal before resetting the app
        hideConfirmationModal();
        resetApp();
        console.log('RESET APP: Reset function called');
    } else if (action === 'clearOpenRouterKey') {
        hideConfirmationModal();
        clearOpenRouterApiKey();
    } else if (action === 'clearLMStudioToken') {
        hideConfirmationModal();
        clearLMStudioApiToken();
    } else {
        // Default case - just hide the modal
        hideConfirmationModal();
    }
}

/**
 * Handles options button click
 */
function handleOptionsButtonClick() {
    const optionsContainer = document.getElementById('options-container');
    const optionsButton = document.getElementById('options-btn');

    // Log the current state for debugging
    debugLog('Options container state before toggle:', {
        hasHiddenClass: optionsContainer.classList.contains('hidden'),
        hasAnimateClass: optionsContainer.classList.contains('animate-fade-in'),
        display: optionsContainer.style.display,
        visibility: optionsContainer.style.visibility
    });

    if (optionsContainer.classList.contains('animate-fade-in')) {
        // Closing the options container
        optionsContainer.classList.remove('animate-fade-in');
        optionsButton.classList.remove('active');
        // Add a small delay before adding the hidden class
        setTimeout(() => {
            optionsContainer.classList.add('hidden');
            debugLog('Options container hidden');
        }, 300); // Match the transition duration
    } else {
        // Opening the options container
        optionsContainer.classList.remove('hidden');
        optionsButton.classList.add('active');
        // Small delay to ensure the hidden class is fully removed
        setTimeout(() => {
            optionsContainer.classList.add('animate-fade-in');
            debugLog('Options container shown');

            // Ensure all buttons in the options container have their event handlers
            // 1. About button
            const aboutButton = document.getElementById('about-btn');
            if (aboutButton) {
                // Remove any existing event listeners to prevent duplicates
                const newAboutButton = aboutButton.cloneNode(true);
                aboutButton.parentNode.replaceChild(newAboutButton, aboutButton);

                // Add the event listener to the new button
                newAboutButton.addEventListener('click', () => {
                    // Close the sidebar first
                    closeSidebar();

                    // Also close the options container
                    const optionsContainer = document.getElementById('options-container');
                    if (optionsContainer) {
                        optionsContainer.classList.add('hidden');
                        optionsContainer.classList.remove('animate-fade-in');
                        optionsButton.classList.remove('active');
                    }

                    // Collapse all sections when sidebar is closed
                    const sectionHeaders = sidebar.querySelectorAll('.section-header');
                    const chatHistorySection = sidebar.querySelector('.sidebar-section:last-child');
                    sectionHeaders.forEach(header => {
                        header.classList.remove('active');
                        const content = header.nextElementSibling;
                        if (content && content.classList.contains('collapsible-content')) {
                            content.classList.remove('show');
                        }
                    });

                    // Ensure chat history is visible when sidebar is closed
                    if (chatHistorySection) {
                        chatHistorySection.classList.remove('chat-history-hidden');
                    }

                    // Then open the About modal
                    const aboutModal = document.getElementById('about-modal');
                    if (aboutModal) {
                        aboutModal.classList.remove('hidden');
                        aboutModal.classList.remove('hide');
                        // Force reflow so fade-in transition starts from opacity 0.
                        void aboutModal.offsetHeight;
                        aboutModal.classList.add('show');
                        const modalContent = aboutModal.querySelector('.modal-content');
                        if (modalContent) {
                            modalContent.classList.add('animate-modal-in');
                            setTimeout(() => {
                                modalContent.classList.remove('animate-modal-in');
                            }, 300);
                        }
                    }
                });
                debugLog('About button event handler reattached');
            }

            // Import/Export group button
            const importExportGroupButton = document.getElementById('import-export-group-btn');
            const importExportContainer = document.getElementById('import-export-container');

            if (importExportGroupButton && importExportContainer) {
                resetSidebarGroup('import-export-group-btn', 'import-export-container');
                rebindSidebarGroupButton('import-export-group-btn', toggleImportExportContainer);
                debugLog('Import/Export group button event handler reattached');
            }

            const premiumGroupButton = document.getElementById('premium-group-btn');
            const premiumContainer = document.getElementById('premium-container');

            if (premiumGroupButton && premiumContainer) {
                resetSidebarGroup('premium-group-btn', 'premium-container');
                rebindSidebarGroupButton('premium-group-btn', togglePremiumContainer);
                debugLog('Premium group button event handler reattached');
            }

            // 2. Export Chats button
            const exportChatsButton = document.getElementById('export-chats-btn');
            if (exportChatsButton) {
                // Remove any existing event listeners to prevent duplicates
                const newExportChatsButton = exportChatsButton.cloneNode(true);
                exportChatsButton.parentNode.replaceChild(newExportChatsButton, exportChatsButton);

                // Add the event listener to the new button
                newExportChatsButton.addEventListener('click', () => {
                    // Check if user is premium
                    if (!isPremiumUser()) {
                        openPremiumModal('Import/Export');
                        return;
                    }
                    // Close the sidebar first
                    closeSidebarExport();

                    // Show the export confirmation modal
                    import('./ui-manager.js').then(module => {
                        module.showExportConfirmationModal();

                        // Re-attach event listeners to the export confirmation buttons
                        const confirmExportBtn = document.getElementById('confirm-export');
                        const cancelExportBtn = document.getElementById('cancel-export');

                        if (confirmExportBtn) {
                            // Remove any existing event listeners to prevent duplicates
                            const newConfirmExportBtn = confirmExportBtn.cloneNode(true);
                            confirmExportBtn.parentNode.replaceChild(newConfirmExportBtn, confirmExportBtn);

                            // Add the event listener to the new button
                            newConfirmExportBtn.addEventListener('click', () => {
                                // Hide the confirmation modal
                                module.hideExportConfirmationModal();
                                // Perform the export
                                import('./export-import.js').then(exportModule => {
                                    exportModule.exportChats();
                                });
                            });
                            debugLog('Confirm Export button event handler attached from sidebar handler');
                        }

                        if (cancelExportBtn) {
                            // Remove any existing event listeners to prevent duplicates
                            const newCancelExportBtn = cancelExportBtn.cloneNode(true);
                            cancelExportBtn.parentNode.replaceChild(newCancelExportBtn, cancelExportBtn);

                            // Add the event listener to the new button
                            newCancelExportBtn.addEventListener('click', () => {
                                module.hideExportConfirmationModal();
                            });
                            debugLog('Cancel Export button event handler attached from sidebar handler');
                        }
                    });
                });
                debugLog('Export Chats button event handler reattached');
            }

            // 3. Import Chats button
            const importChatsButton = document.getElementById('import-chats-btn');
            const importChatsInput = document.getElementById('import-chats-input');
            if (importChatsButton && importChatsInput) {
                // Remove any existing event listeners to prevent duplicates
                const newImportChatsButton = importChatsButton.cloneNode(true);
                importChatsButton.parentNode.replaceChild(newImportChatsButton, importChatsButton);

                // Add the event listener to the new button
                newImportChatsButton.addEventListener('click', () => {
                    // Check if user is premium
                    if (!isPremiumUser()) {
                        openPremiumModal('Import/Export');
                        return;
                    }
                    // Close the sidebar first
                    closeSidebarExport();

                    // Trigger the file input
                    importChatsInput.click();
                });
                debugLog('Import Chats button event handler reattached');
            }

            // 4. Model button
            // Note: Model button handling is done elsewhere
        }, 10);
    }
}

/**
 * Handles copy text button click
 */
function handleCopyText() {
    const selectedText = getSelectedText();
    if (selectedText) {
        copyToClipboard(selectedText)
            .then(() => {
                debugLog('Text copied to clipboard');
                contextMenu.style.display = 'none';
            })
            .catch(err => {
                debugError('Error copying text: ', err);
                contextMenu.style.display = 'none';
                // Could show a toast notification here if needed
            });
    }
}

// Track context menu regenerate clicks
let contextMenuRegenerateClickCount = 0;
let contextMenuRegenerateTimer = null;

/**
 * Handles regenerate text button click
 */
async function handleRegenerateText() {
    const selectedMessageElement = getSelectedMessageElement();
    if (!selectedMessageElement) return;

    // Check if it's an AI message
    if (selectedMessageElement.classList.contains('ai')) {
        // Check if we're already generating text
        if (isGeneratingText()) {
            debugLog('Already generating text, ignoring regeneration request');
            if (contextMenu) {
                contextMenu.style.display = 'none';
            }
            return;
        }

        // Increment click counter for context menu regenerate
        contextMenuRegenerateClickCount++;

        // Clear any existing timer
        if (contextMenuRegenerateTimer) {
            clearTimeout(contextMenuRegenerateTimer);
        }

        // Reset click counter after 2 seconds
        contextMenuRegenerateTimer = setTimeout(() => {
            contextMenuRegenerateClickCount = 0;
        }, 2000);

        debugLog(`Context menu regenerate clicked (${contextMenuRegenerateClickCount} times)`);

        // Add a visual indicator that we registered the click
        if (regenerateTextButton) {
            regenerateTextButton.classList.add('clicked');
            setTimeout(() => {
                regenerateTextButton.classList.remove('clicked');
            }, 300);
        }

        // Force focus management - more aggressive approach
        // First, blur any active element
        if (document.activeElement) {
            document.activeElement.blur();
        }

        // Force focus on document body
        document.body.focus();

        // Remove focus from any buttons
        if (regenerateTextButton) {
            regenerateTextButton.blur();
        }

        // Force window focus via a dummy input element
        const dummyInput = document.createElement('input');
        dummyInput.style.position = 'absolute';
        dummyInput.style.opacity = '0';
        dummyInput.style.height = '1px';
        dummyInput.style.width = '1px';
        dummyInput.style.zIndex = '-1000';
        document.body.appendChild(dummyInput);
        dummyInput.focus();
        dummyInput.blur();
        document.body.removeChild(dummyInput);

        // Dispatch a synthetic focus event on window
        try {
            window.dispatchEvent(new Event('focus'));
        } catch (e) {
            debugLog('Error dispatching synthetic focus event:', e);
        }

        debugLog('Applied aggressive focus management for context menu regeneration');

        // Apply browser-specific workarounds
        if ((currentBrowser === 'chrome' && contextMenuRegenerateClickCount >= 2) ||
            (currentBrowser === 'brave-or-edge' && contextMenuRegenerateClickCount >= 3) ||
            contextMenuRegenerateClickCount >= 5) {

            debugLog(`Multiple context menu clicks detected (${contextMenuRegenerateClickCount}), applying ${currentBrowser} specific workarounds`);

            // Force a layout recalculation
            document.body.style.zoom = '0.99999';
            setTimeout(() => {
                document.body.style.zoom = '1';
            }, 5);

            // Force a redraw of the message element
            selectedMessageElement.style.opacity = '0.99';
            void selectedMessageElement.offsetHeight; // Force reflow
            selectedMessageElement.style.opacity = '1';

            // For Chrome/Brave, add additional workarounds
            if (currentBrowser === 'chrome' || currentBrowser === 'brave-or-edge') {
                // Create a temporary overlay to force a repaint
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.backgroundColor = 'rgba(0,0,0,0.01)';
                overlay.style.pointerEvents = 'none';
                overlay.style.zIndex = '9999';
                document.body.appendChild(overlay);

                // Remove after a short delay
                setTimeout(() => {
                    document.body.removeChild(overlay);
                }, 50);

                // Force focus on the window
                window.focus();
            }
        }

        try {
            debugLog('Starting regeneration from contextual menu');

            // Hide the context menu
            if (contextMenu) {
                contextMenu.style.display = 'none';
            }

            // Regenerate the last response using the regenerateLastResponse function
            import('./chat-service.js').then(module => {
                // Longer delay for Chrome/Brave to ensure focus events have been processed
                // Use a variable delay based on click count
                const delay = contextMenuRegenerateClickCount > 3 ? 50 : 20;

                setTimeout(() => {
                    // For Chrome/Brave with multiple clicks, use the retry parameter
                    if ((currentBrowser === 'chrome' || currentBrowser === 'brave-or-edge') && contextMenuRegenerateClickCount > 3) {
                        debugLog('Using retry parameter for context menu regeneration due to multiple clicks');
                        module.regenerateLastResponse(true); // Pass true for isRetry
                    } else {
                        // Double-check we're not already generating before proceeding
                        if (!isGeneratingText()) {
                            module.regenerateLastResponse();
                        } else {
                            debugLog('Generation already started, skipping duplicate call');
                        }
                    }
                }, delay);
            });
        } catch (error) {
            debugError('Error regenerating text:', error);
            appendMessage('error', 'An error occurred while regenerating text: ' + error.message);
        }
    } else if (selectedMessageElement.classList.contains('user')) {
        try {
            // For user messages, we need to regenerate the AI response that came after this message
            debugLog('Regenerating AI response for selected user message');

            // Find the last user message
            const currentMessages = Array.isArray(chatHistoryData[currentChatId]) ?
                chatHistoryData[currentChatId] :
                chatHistoryData[currentChatId].messages;

            // Find the index of this user message
            const selectedContent = selectedMessageElement.querySelector('.message-content').textContent;
            let selectedUserMessageIndex = -1;

            for (let i = 0; i < currentMessages.length; i++) {
                if (currentMessages[i].role === 'user' && currentMessages[i].content.trim() === selectedContent.trim()) {
                    selectedUserMessageIndex = i;
                    break;
                }
            }

            if (selectedUserMessageIndex === -1) {
                debugError('Could not find selected user message in chat history');
                appendMessage('error', 'An error occurred while regenerating response. Could not find the message in history.');
                return;
            }

            const selectedUserMessage = currentMessages[selectedUserMessageIndex];

            // Check if this user message has file attachments
            let fileContents = [];
            if (!Array.isArray(chatHistoryData[currentChatId])) {
                if (selectedUserMessage.files && selectedUserMessage.files.length > 0) {
                    fileContents = selectedUserMessage.files;
                    debugLog(`Found ${fileContents.length} file attachments for message regeneration`);
                }
            }

            // Hide the context menu
            if (contextMenu) {
                contextMenu.style.display = 'none';
            }

            // Regenerate the AI response
            await generateAIResponse(selectedUserMessage.content, fileContents);
        } catch (error) {
            debugError('Error generating response:', error);
            appendMessage('error', 'An error occurred while generating a response: ' + error.message);
        }
    }
}

/**
 * Handles refresh button click (ad removed - ads now show after model load)
 */
function handleRefreshButtonClick() {
    debugLog('Refresh button clicked');

    // Add visual feedback
    refreshButton.classList.add('animate-spin');
    // Disable the button to prevent multiple clicks
    refreshButton.disabled = true;

    // Remove focus to prevent the button from staying highlighted
    refreshButton.blur();

    // Perform a full page refresh
    window.location.reload();
}

/**
 * Handles model toggle button click
 */
function handleModelToggleButtonClick() {
    debugLog('Model toggle button clicked - Opening model modal');

    // Import the model-manager module to show the model modal
    import('./model-manager.js').then(module => {
        module.showModelModal();
    }).catch(error => {
        debugError('Error importing model-manager.js:', error);
    });
}

// Browser detection for applying specific fixes
function detectBrowser() {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.indexOf('chrome') > -1) {
        if (userAgent.indexOf('brave') > -1 || userAgent.indexOf('edg') > -1) {
            return 'brave-or-edge';
        }
        return 'chrome';
    } else if (userAgent.indexOf('firefox') > -1) {
        return 'firefox';
    } else if (userAgent.indexOf('safari') > -1) {
        return 'safari';
    }
    return 'unknown';
}

// Get current browser
const currentBrowser = detectBrowser();
debugLog('Detected browser:', currentBrowser);

// Track regenerate button click count for handling browser-specific issues
let regenerateClickCount = 0;
let regenerateClickTimer = null;

/**
 * Handles click on the regenerate button
 * @param {Event} e - The click event
 */
async function handleRegenerateButtonClick(e) {
    // Check if the click is directly on the regenerate button or its icon
    const target = e.target.closest('.regenerate-btn');
    if (!target) return; // Not a regenerate button

    e.stopPropagation(); // Prevent event from bubbling up and triggering sidebar
    e.preventDefault();

    // Check if we're already generating text
    if (isGeneratingText()) {
        debugLog('Already generating text, ignoring regeneration request');
        return;
    }

    // Increment click counter for this button
    regenerateClickCount++;

    // Clear any existing timer
    if (regenerateClickTimer) {
        clearTimeout(regenerateClickTimer);
    }

    // Reset click counter after 2 seconds
    regenerateClickTimer = setTimeout(() => {
        regenerateClickCount = 0;
    }, 2000);

    // Add a data attribute to track clicks on this specific button
    const currentClicks = parseInt(target.dataset.clickCount || '0') + 1;
    target.dataset.clickCount = currentClicks;

    debugLog(`Regenerate button clicked (${regenerateClickCount} times, this button: ${currentClicks} times)`);

    // Add a visual indicator that we registered the click
    target.classList.add('clicked');
    setTimeout(() => {
        target.classList.remove('clicked');
    }, 300);

    // Force focus management - more aggressive approach
    // First, blur any active element
    if (document.activeElement) {
        document.activeElement.blur();
    }

    // Force focus on document body
    document.body.focus();

    // Remove focus from the regenerate button to prevent it staying highlighted
    target.blur();

    // Force window focus via a dummy input element
    const dummyInput = document.createElement('input');
    dummyInput.style.position = 'absolute';
    dummyInput.style.opacity = '0';
    dummyInput.style.height = '1px';
    dummyInput.style.width = '1px';
    dummyInput.style.zIndex = '-1000';
    document.body.appendChild(dummyInput);
    dummyInput.focus();
    dummyInput.blur();
    document.body.removeChild(dummyInput);

    // Dispatch a synthetic focus event on window
    try {
        window.dispatchEvent(new Event('focus'));
    } catch (e) {
        debugLog('Error dispatching synthetic focus event:', e);
    }

    debugLog('Applied aggressive focus management for regeneration');

    // Apply browser-specific workarounds
    if ((currentBrowser === 'chrome' && regenerateClickCount >= 2) ||
        (currentBrowser === 'brave-or-edge' && regenerateClickCount >= 3) ||
        regenerateClickCount >= 5) {

        debugLog(`Multiple clicks detected (${regenerateClickCount}), applying ${currentBrowser} specific workarounds`);

        // Force a layout recalculation
        document.body.style.zoom = '0.99999';
        setTimeout(() => {
            document.body.style.zoom = '1';
        }, 5);

        // Force a redraw of the button
        target.style.display = 'none';
        void target.offsetHeight; // Force reflow
        target.style.display = 'flex';

        // For Chrome/Brave, add additional workarounds
        if (currentBrowser === 'chrome' || currentBrowser === 'brave-or-edge') {
            // Create a temporary overlay to force a repaint
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.01)';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '9999';
            document.body.appendChild(overlay);

            // Remove after a short delay
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 50);

            // Force focus on the window
            window.focus();
        }
    }

    try {
        debugLog('Starting regeneration from regenerate button');

        // Use the regenerateLastResponse function from chat-service
        import('./chat-service.js').then(module => {
            // Longer delay for Chrome/Brave to ensure focus events have been processed
            // Use a variable delay based on click count
            const delay = regenerateClickCount > 3 ? 50 : 20;

            setTimeout(() => {
                // For Chrome/Brave with multiple clicks, use the retry parameter
                if ((currentBrowser === 'chrome' || currentBrowser === 'brave-or-edge') && regenerateClickCount > 3) {
                    debugLog('Using retry parameter for regeneration due to multiple clicks');
                    module.regenerateLastResponse(true); // Pass true for isRetry
                } else {
                    // Double-check we're not already generating before proceeding
                    if (!isGeneratingText()) {
                        module.regenerateLastResponse();
                    } else {
                        debugLog('Generation already started, skipping duplicate call');
                    }
                }
            }, delay);
        });
    } catch (error) {
        debugError('Error during regeneration:', error);
        appendMessage('error', 'An error occurred during regeneration: ' + error.message);
        hideLoadingIndicator();
        toggleSendStopButton();
    }
}

/**
 * Handles click on the edit button for user messages
 * @param {Event} e - The click event
 */
function handleEditButtonClick(e) {
    const target = e.target.closest('.edit-btn');
    if (!target) return; // Not an edit button

    // Find the message content container
    const messageElement = target.closest('.user');
    if (!messageElement) return;

    const contentContainer = messageElement.querySelector('.message-content');
    if (!contentContainer) return;

    // Get the message controls container that contains the edit button
    const controlsContainer = messageElement.querySelector('.message-controls');
    if (!controlsContainer) return;

    // Hide the edit button during editing
    controlsContainer.style.display = 'none';

    // Get the original content
    const originalContent = messageElement.originalContent || contentContainer.textContent;

    // Store the original HTML content to restore if cancelled
    const originalHTML = contentContainer.innerHTML;

    // Store and lock the current width of the message bubble
    // But ensure a minimum width for comfortable editing
    const currentWidth = messageElement.offsetWidth;
    const minEditWidth = 300; // Minimum width needed for buttons and comfortable editing
    const editWidth = Math.max(currentWidth, minEditWidth);

    messageElement.style.width = editWidth + 'px';
    messageElement.style.minWidth = editWidth + 'px';
    messageElement.style.maxWidth = editWidth + 'px';

    // Create textarea with original content that matches the text style
    const textarea = document.createElement('textarea');
    textarea.classList.add('edit-textarea');
    textarea.value = originalContent;
    textarea.style.cssText = `
        width: 100%;
        color: inherit;
        outline: none;
        resize: none;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        margin: 0;
        overflow: hidden;
        word-wrap: break-word;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    `;

    // Auto-resize textarea to match content
    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };
    textarea.addEventListener('input', autoResize);

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('edit-buttons-container', 'flex', 'gap-2', 'mt-3');

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.classList.add('edit-cancel-btn', 'bg-gray-600', 'text-white', 'rounded-md', 'px-5', 'py-3', 'text-sm', 'hover:bg-gray-700', 'transition-colors');
    cancelButton.textContent = 'Cancel';

    // Create save button
    const saveButton = document.createElement('button');
    saveButton.classList.add('edit-resend-btn', 'bg-red-600', 'text-white', 'rounded-md', 'px-5', 'py-3', 'text-sm', 'transition-colors');
    saveButton.textContent = 'Resend';
    saveButton.addEventListener('mouseenter', () => {
        saveButton.style.backgroundColor = '#c0392b';
    });
    saveButton.addEventListener('mouseleave', () => {
        saveButton.style.backgroundColor = '#dc2626';
    });

    // Add buttons to container
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(saveButton);

    // Replace content with textarea and add buttons
    contentContainer.innerHTML = '';
    contentContainer.appendChild(textarea);
    contentContainer.appendChild(buttonsContainer);

    // Add editing class to message element
    messageElement.classList.add('editing-mode');

    // Set initial height and focus
    autoResize();
    textarea.focus();

    // Cancel button handler
    cancelButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling up and triggering sidebar
        // Restore original content
        contentContainer.innerHTML = originalHTML;
        // Remove editing mode class
        messageElement.classList.remove('editing-mode');
        // Restore original width
        messageElement.style.width = '';
        messageElement.style.minWidth = '';
        messageElement.style.maxWidth = '';
        // Show the edit button again
        controlsContainer.style.display = '';
    });

    // Save button handler
    saveButton.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent event from bubbling up and triggering sidebar
        const editedMessage = textarea.value.trim();
        if (!editedMessage) return;

        // Get message index to find where to truncate the conversation
        const messageElements = Array.from(messagesContainer.children);
        const messageIndex = messageElements.indexOf(messageElement);

        if (messageIndex !== -1) {
            // Update the content in the UI
            contentContainer.innerHTML = sanitizeInput(editedMessage);
            messageElement.originalContent = editedMessage;

            // Remove editing mode class
            messageElement.classList.remove('editing-mode');
            // Restore original width
            messageElement.style.width = '';
            messageElement.style.minWidth = '';
            messageElement.style.maxWidth = '';
            // Show the edit button again
            controlsContainer.style.display = '';

            // Remove all subsequent messages (both in UI and chatHistoryData)
            // With chronological order, we need to remove all messages after the selected message
            // First, find all messages that come after the current one
            const messagesToRemove = [];
            const allMessages = Array.from(messagesContainer.children);
            for (let i = messageIndex + 1; i < allMessages.length; i++) {
                messagesToRemove.push(allMessages[i]);
            }

            // Then remove them from the DOM
            messagesToRemove.forEach(msg => messagesContainer.removeChild(msg));

            try {
                // Find the index of the original user message in chat history
                const chatData = chatHistoryData[currentChatId];
                if (!chatData) {
                    debugError('No chat data found for current chat ID');
                    appendMessage('error', 'An error occurred while processing your edited message. Chat data not found.');
                    return;
                }

                // Get the messages array (handle both old and new format)
                const messages = Array.isArray(chatData) ? chatData : chatData.messages;
                if (!messages || messages.length === 0) {
                    debugError('No messages found in chat history');
                    appendMessage('error', 'An error occurred while processing your edited message. No message history found.');
                    return;
                }

                const currentChat = [...messages];

                // Count user messages in the UI up to the edited message
                const userMessagesBeforeEdit = Array.from(messagesContainer.children)
                    .slice(0, messageIndex + 1)
                    .filter(el => el.classList.contains('user')).length;

                // Find all user message indices in the chat history
                const userMessageIndices = currentChat
                    .map((msg, index) => msg.role === 'user' ? index : -1)
                    .filter(index => index !== -1);

                // Get the nth user message (where n is userMessagesBeforeEdit)
                const userMessageIndex = userMessageIndices[userMessagesBeforeEdit - 1];

                if (userMessageIndex !== undefined) {
                    // Update the user message content directly in the current chat
                    if (Array.isArray(chatData)) {
                        // Old format
                        chatHistoryData[currentChatId][userMessageIndex].content = editedMessage;
                        // Keep only chat history up to this user message
                        chatHistoryData[currentChatId] = chatHistoryData[currentChatId].slice(0, userMessageIndex + 1);
                    } else {
                        // New format
                        chatHistoryData[currentChatId].messages[userMessageIndex].content = editedMessage;
                        // Keep only chat history up to this user message
                        chatHistoryData[currentChatId].messages = chatHistoryData[currentChatId].messages.slice(0, userMessageIndex + 1);
                    }

                    // Save the updated chat history
                    saveChatHistory();

                    // Generate new response with edited message
                    showLoadingIndicator();
                    toggleSendStopButton();

                    abortController = new AbortController();
                    setAbortController(abortController);

                    // Check if the user message has any file attachments
                    let fileContents = [];
                    if (!Array.isArray(chatData)) {
                        const userMessage = chatData.messages[userMessageIndex];
                        if (userMessage && userMessage.files && userMessage.files.length > 0) {
                            fileContents = userMessage.files;
                            debugLog(`Preserving ${fileContents.length} file attachments when regenerating edited message`);
                        }
                    }

                    // Generate AI response to the edited message with any file attachments
                    await generateAIResponse(editedMessage, fileContents);

                    // Update chat history UI
                    updateChatHistoryUI();
                } else {
                    debugError('Could not find corresponding user message in chat history');
                    appendMessage('error', 'An error occurred while processing your edited message. Could not find the message in history.');
                }
            } catch (error) {
                debugError('Error generating response:', error);
                appendMessage('error', 'An error occurred while generating a response to your edited message: ' + (error.message || 'Unknown error'));
                hideLoadingIndicator();
                toggleSendStopButton();

                // Restore the chat history to its previous state if possible
                try {
                    loadChatHistory();
                    updateChatHistoryUI();
                } catch (restoreError) {
                    debugError('Failed to restore chat history:', restoreError);
                }
            } finally {
                abortController = null;
            }
        }
    });
}

/**
 * Handles click on the delete button for user and AI messages
 * @param {Event} e - The click event
 */
function showDeleteMessageModal(deleteModal) {
    if (!deleteModal) return;

    if (deleteModal._hideTimeoutId) {
        clearTimeout(deleteModal._hideTimeoutId);
        deleteModal._hideTimeoutId = null;
    }

    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex', 'is-animating');

    requestAnimationFrame(() => {
        deleteModal.classList.add('is-visible');
    });
}

function hideDeleteMessageModal(deleteModal) {
    if (!deleteModal) return;

    deleteModal.classList.remove('is-visible');

    const ANIMATION_MS = 180;
    if (deleteModal._hideTimeoutId) {
        clearTimeout(deleteModal._hideTimeoutId);
    }

    deleteModal._hideTimeoutId = setTimeout(() => {
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex', 'is-animating');
        deleteModal._hideTimeoutId = null;
    }, ANIMATION_MS);
}

function handleDeleteButtonClick(e) {
    const target = e.target.closest('.delete-btn');
    if (!target) return; // Not a delete button

    // Find the message element
    const messageElement = target.closest('.user, .ai');
    if (!messageElement) return;

    const historyRole = messageElement.classList.contains('ai') ? 'assistant' : 'user';

    // Get message index
    const messageElements = Array.from(messagesContainer.children);
    const messageIndex = messageElements.indexOf(messageElement);

    if (messageIndex === -1) return;

    // Show confirmation modal
    const deleteModal = document.getElementById('delete-message-modal');
    const confirmBtn = document.getElementById('confirm-delete-message');
    const cancelBtn = document.getElementById('cancel-delete-message');

    if (!deleteModal || !confirmBtn || !cancelBtn) return;

    // Show the modal with fade animation
    showDeleteMessageModal(deleteModal);

    // Handle confirmation
    const handleConfirm = () => {
        // Hide modal with fade animation
        hideDeleteMessageModal(deleteModal);

        // Clean up listeners
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);

        deleteMessage(messageElement, messageElements, messageIndex, historyRole);
    };

    // Handle cancellation
    const handleCancel = () => {
        // Hide modal with fade animation
        hideDeleteMessageModal(deleteModal);

        // Clean up listeners
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    // Add event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

/**
 * Deletes a single message from the UI and chat history
 * @param {HTMLElement} messageElement - The message element to delete
 * @param {Array} messageElements - All message elements
 * @param {number} messageIndex - Index of the message to delete
 * @param {'user'|'assistant'} historyRole - Message role in persisted history
 */
function deleteMessage(messageElement, messageElements, messageIndex, historyRole = 'user') {
    try {
        // Remove only the message element from DOM
        messageElement.remove();

        // Update chat history in storage
        if (currentChatId && chatHistoryData[currentChatId]) {
            const chatData = chatHistoryData[currentChatId];
            const messages = Array.isArray(chatData) ? chatData : chatData.messages;

            if (messages && messages.length > 0) {
                const roleClass = historyRole === 'assistant' ? 'ai' : 'user';
                const roleMatches = historyRole === 'assistant'
                    ? (msg) => msg.role === 'assistant' || msg.role === 'ai'
                    : (msg) => msg.role === 'user';

                // Count messages of this role in UI up to the deleted message
                const roleMessagesBeforeDelete = messageElements
                    .slice(0, messageIndex + 1)
                    .filter(el => el.classList.contains(roleClass)).length;

                // Find the corresponding message index in chat history
                const roleMessageIndices = messages
                    .map((msg, index) => roleMatches(msg) ? index : -1)
                    .filter(index => index !== -1);

                const messageHistoryIndex = roleMessageIndices[roleMessagesBeforeDelete - 1];

                if (messageHistoryIndex !== undefined) {
                    // Remove only this specific message from chat history
                    if (Array.isArray(chatData)) {
                        chatHistoryData[currentChatId].splice(messageHistoryIndex, 1);
                    } else {
                        chatData.messages.splice(messageHistoryIndex, 1);
                    }

                    // Save to storage
                    saveChatHistory();
                    updateChatHistoryUI();
                }
            }
        }
    } catch (error) {
        debugError('Failed to delete message:', error);
        appendMessage('error', 'An error occurred while deleting the message.');
    }
}

/**
 * Handles click on the edit button for AI messages.
 * Premium users can directly modify the AI response in-place (like LM Studio).
 * Free users are shown the premium modal when they try to edit.
 * The edited content is saved to chat history without triggering regeneration.
 * @param {Event} e - The click event
 */
function handleAIEditButtonClick(e) {
    const target = e.target.closest('.ai-edit-btn');
    if (!target) return;

    // Find the AI message element
    const messageElement = target.closest('.ai');
    if (!messageElement) return;

    const contentContainer = messageElement.querySelector('.message-content');
    if (!contentContainer) return;

    const controlsContainer = messageElement.querySelector('.message-controls');
    if (!controlsContainer) return;

    // Prevent editing while a generation is in progress
    if (isGeneratingText()) return;

    if (!isPremiumUser()) {
        openPremiumModal('AI Response Editing');
        return;
    }

    // Hide controls during editing
    controlsContainer.style.display = 'none';

    // Get the raw content, stripping any thinking/reasoning sections
    let rawContent = messageElement.originalContent || contentContainer.textContent || '';
    rawContent = stripReasoningSections(rawContent).trim();

    // Store original HTML to restore on cancel
    const originalHTML = contentContainer.innerHTML;

    // Lock the bubble width so it doesn't collapse while editing
    const currentWidth = messageElement.offsetWidth;
    const minEditWidth = 280;
    const editWidth = Math.max(currentWidth, minEditWidth);
    messageElement.style.width = editWidth + 'px';
    messageElement.style.minWidth = editWidth + 'px';
    messageElement.style.maxWidth = editWidth + 'px';

    // Create the editable textarea pre-filled with the AI's response
    const textarea = document.createElement('textarea');
    textarea.classList.add('edit-textarea');
    textarea.value = rawContent;
    textarea.style.cssText = `
        width: 100%;
        color: inherit;
        outline: none;
        resize: none;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        margin: 0;
        overflow: hidden;
        word-wrap: break-word;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    `;

    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };
    textarea.addEventListener('input', autoResize);

    // Create button row (Cancel | Save)
    const buttonsContainer = document.createElement('div');
    buttonsContainer.classList.add('edit-buttons-container', 'flex', 'gap-2', 'mt-3');

    const cancelButton = document.createElement('button');
    cancelButton.classList.add(
        'edit-cancel-btn', 'bg-gray-600', 'text-white',
        'rounded-md', 'px-5', 'py-3', 'text-sm', 'hover:bg-gray-700', 'transition-colors'
    );
    cancelButton.textContent = 'Cancel';

    const saveButton = document.createElement('button');
    saveButton.classList.add(
        'edit-save-ai-btn', 'bg-blue-600', 'text-white',
        'rounded-md', 'px-5', 'py-3', 'text-sm', 'transition-colors'
    );
    saveButton.textContent = 'Save';

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(saveButton);

    // Replace content with editor
    contentContainer.innerHTML = '';
    contentContainer.appendChild(textarea);
    contentContainer.appendChild(buttonsContainer);

    messageElement.classList.add('editing-mode');

    autoResize();
    textarea.focus();
    // Move cursor to end
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    // --- Cancel: restore original content ---
    cancelButton.addEventListener('click', (ev) => {
        ev.stopPropagation();
        contentContainer.innerHTML = originalHTML;
        messageElement.classList.remove('editing-mode');
        messageElement.style.width = '';
        messageElement.style.minWidth = '';
        messageElement.style.maxWidth = '';
        controlsContainer.style.display = '';
        initializeCodeMirror(messageElement);
    });

    // --- Save: update in-place without regenerating ---
    saveButton.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const editedContent = textarea.value.trim();
        if (!editedContent) return;

        // Update the rendered bubble with the edited Markdown
        contentContainer.innerHTML = sanitizeInput(editedContent);
        messageElement.originalContent = editedContent;
        messageElement.dataset.hasThinking = 'false';

        messageElement.classList.remove('editing-mode');
        messageElement.style.width = '';
        messageElement.style.minWidth = '';
        messageElement.style.maxWidth = '';
        controlsContainer.style.display = '';

        // Re-apply code highlighting
        initializeCodeMirror(messageElement);

        // Persist the edit to chat history
        const chatData = chatHistoryData[currentChatId];
        if (!chatData) return;

        const messages = Array.isArray(chatData) ? chatData : chatData.messages;
        if (!messages || messages.length === 0) return;

        // Determine which assistant message in history corresponds to this bubble.
        // We count all .ai elements before (and including) the edited one and match
        // to the nth assistant entry in the history array.
        const allAIElements = Array.from(messagesContainer.querySelectorAll('.ai'));
        const bubbleIndex = allAIElements.indexOf(messageElement); // 0-based

        let assistantCount = 0;
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].role === 'assistant') {
                if (assistantCount === bubbleIndex) {
                    messages[i].content = editedContent;
                    break;
                }
                assistantCount++;
            }
        }

        saveChatHistory();
    });
}

/**
 * Toggles the visibility of the import/export container
 */
function toggleImportExportContainer() {
    toggleSidebarGroupContainer('import-export-group-btn', 'import-export-container');
}

function togglePremiumContainer() {
    toggleSidebarGroupContainer('premium-group-btn', 'premium-container');
}

function syncSidebarCollapsibleHeight(element) {
    const parentCollapsibleContent = element?.closest('.collapsible-content.show');
    if (!parentCollapsibleContent) {
        return;
    }

    clearTimeout(parentCollapsibleContent._collapsibleHeightResetTimer);
    parentCollapsibleContent.style.maxHeight = `${parentCollapsibleContent.scrollHeight}px`;
    parentCollapsibleContent._collapsibleHeightResetTimer = setTimeout(() => {
        if (parentCollapsibleContent.classList.contains('show')) {
            parentCollapsibleContent.style.maxHeight = 'none';
        }
    }, 320);
}

function nudgeSidebarForExpandedGroup(groupButton, groupContainer) {
    const sidebarScrollContent = document.getElementById('sidebar-scroll-content');
    if (!sidebarScrollContent || !(groupButton instanceof HTMLElement) || !(groupContainer instanceof HTMLElement)) {
        return;
    }

    const scrollContentRect = sidebarScrollContent.getBoundingClientRect();
    const buttonRect = groupButton.getBoundingClientRect();
    
    // Relative position of button top within the scroll viewport
    const buttonTopInViewport = buttonRect.top - scrollContentRect.top;
    
    // If the button is already above the viewport (shouldn't happen on expand)
    if (buttonTopInViewport < 0) {
        sidebarScrollContent.scrollBy({ top: buttonTopInViewport - 10, behavior: 'smooth' });
        return;
    }

    // Measure the full expanded height (button + revealed container + margin)
    // We use scrollHeight for the container to get its full potential height
    const revealedHeight = groupContainer.scrollHeight;
    const totalExpandedHeight = groupButton.offsetHeight + revealedHeight + 16;
    
    // Check if the bottom of the expanded area is below the viewport
    const bottomInViewport = buttonTopInViewport + totalExpandedHeight;
    const viewportHeight = sidebarScrollContent.clientHeight;

    if (bottomInViewport > viewportHeight) {
        // We need to scroll down to show the content.
        // Calculate the necessary scroll amount to bring the bottom into view
        const overflow = bottomInViewport - viewportHeight;
        
        // Safety: Don't scroll so far that the button itself goes off the top
        // Keep at least 12px of the button visible or 12px margin above it
        const maxAllowedScroll = Math.max(0, buttonTopInViewport - 12);
        const scrollAmount = Math.min(overflow, maxAllowedScroll);
        
        if (scrollAmount > 0) {
            sidebarScrollContent.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
    }
}

function toggleSidebarGroupContainer(groupButtonId, containerId) {
    const groupButton = document.getElementById(groupButtonId);
    const groupContainer = document.getElementById(containerId);

    if (!groupButton || !groupContainer) {
        return;
    }

    if (groupContainer.classList.contains('hidden')) {
        groupContainer.classList.remove('hidden');
        syncSidebarCollapsibleHeight(groupContainer);
        setTimeout(() => {
            groupContainer.classList.add('animate-fade-in');
            syncSidebarCollapsibleHeight(groupContainer);
        }, 10);
        groupButton.classList.add('active');

        const caretIcon = groupButton.querySelector('.fa-caret-down');
        if (caretIcon) {
            caretIcon.classList.add('fa-caret-up');
            caretIcon.classList.remove('fa-caret-down');
        }

        if (containerId === 'premium-container') {
            setTimeout(() => {
                syncSidebarCollapsibleHeight(groupContainer);
                nudgeSidebarForExpandedGroup(groupButton, groupContainer);
            }, 80);
        }
    } else {
        groupContainer.style.maxHeight = `${groupContainer.scrollHeight}px`;
        groupContainer.classList.remove('animate-fade-in');
        groupButton.classList.remove('active');
        syncSidebarCollapsibleHeight(groupContainer);

        setTimeout(() => {
            groupContainer.classList.add('hidden');
            groupContainer.style.maxHeight = '';
            syncSidebarCollapsibleHeight(groupContainer);
        }, 300);

        const caretIcon = groupButton.querySelector('.fa-caret-up');
        if (caretIcon) {
            caretIcon.classList.remove('fa-caret-up');
            caretIcon.classList.add('fa-caret-down');
        }
    }
}

function resetSidebarGroup(groupButtonId, containerId) {
    const groupButton = document.getElementById(groupButtonId);
    const groupContainer = document.getElementById(containerId);

    if (!groupButton || !groupContainer) {
        return;
    }

    groupContainer.classList.add('hidden');
    groupContainer.classList.remove('animate-fade-in');
    groupButton.classList.remove('active');

    let caretIcon = groupButton.querySelector('.fa-caret-up');
    if (caretIcon) {
        caretIcon.classList.remove('fa-caret-up');
        caretIcon.classList.add('fa-caret-down');
    } else {
        caretIcon = groupButton.querySelector('.fa-caret-down');
        if (!caretIcon) {
            const iconSpan = document.createElement('span');
            iconSpan.innerHTML = '<i class="fas fa-caret-down"></i>';
            groupButton.appendChild(iconSpan);
        }
    }
}

function rebindSidebarGroupButton(groupButtonId, clickHandler) {
    const groupButton = document.getElementById(groupButtonId);
    if (!groupButton || !groupButton.parentNode) {
        return;
    }

    const reboundGroupButton = groupButton.cloneNode(true);
    groupButton.parentNode.replaceChild(reboundGroupButton, groupButton);
    reboundGroupButton.addEventListener('click', clickHandler);
}

/**
 * Handles new chat button click
 */
function handleNewChatButtonClick() {
    debugLog('New chat button clicked');

    // Close the sidebar first
    closeSidebar();

    // Also close the options container
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        optionsContainer.classList.add('hidden');
        optionsContainer.classList.remove('animate-fade-in');
    }

    // Create a new chat
    createNewChat();

    // Remove focus to prevent the button from staying highlighted
    if (newChatHeaderButton) {
        newChatHeaderButton.blur();
    }
}

/**
 * Show Terms of Service modal in review mode (for users who already accepted)
 */
function showTermsReviewModal() {
    const termsModal = document.getElementById('terms-modal');
    const termsContent = document.getElementById('terms-content');
    const acceptanceFooter = document.getElementById('terms-acceptance-footer');
    const reviewFooter = document.getElementById('terms-review-footer');
    const closeTermsBtn = document.getElementById('close-terms-btn');

    if (!termsModal || !termsContent || !acceptanceFooter || !reviewFooter) {
        console.error('Terms review modal: Required elements not found');
        return;
    }

    // Show the modal
    termsModal.classList.remove('hidden');
    termsModal.style.display = 'flex';

    // Switch to review mode
    acceptanceFooter.classList.add('hidden');
    reviewFooter.classList.remove('hidden');

    // Reset scroll to top and render content
    termsContent.scrollTop = 0;

    const renderTerms = (marked) => {
        try {
            const html = (typeof marked.parse === 'function') 
                ? marked.parse(termsContentString) 
                : (typeof marked === 'function' ? marked(termsContentString) : null);

            if (html) {
                termsContent.innerHTML = html;
                
                // Add listener for the Privacy Policy link if it exists in the rendered HTML
                const privacyLink = termsContent.querySelector('a[href*="privacy"]');
                if (privacyLink) {
                    privacyLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Close terms modal first
                        const closeTermsBtn = document.getElementById('close-terms-btn');
                        if (closeTermsBtn) closeTermsBtn.click();
                        
                        // Then trigger privacy policy
                        const privacyBtn = document.getElementById('privacy-policy-btn');
                        if (privacyBtn) privacyBtn.click();
                    });
                }

                // Apply syntax highlighting if any code blocks exist
                if (window.shHighlightElement) {
                    termsContent.querySelectorAll('pre code').forEach(el => {
                        window.shHighlightElement(el);
                    });
                }
            } else {
                throw new Error('Marked parser failed to produce HTML');
            }
        } catch (err) {
            console.error('Error parsing terms markdown:', err);
            termsContent.innerHTML = '<p class="text-red-400">Error rendering terms of service.</p>';
        }
    };

    if (window.marked) {
        renderTerms(window.marked);
    } else if (window.loadMarkedLibrary) {
        window.loadMarkedLibrary().then(renderTerms).catch(err => {
            console.error('Failed to load marked for terms:', err);
            termsContent.innerHTML = '<p class="text-red-400">Error loading terms of service content.</p>';
        });
    } else {
        termsContent.innerHTML = '<p class="text-red-400">Markdown renderer unavailable.</p>';
    }

    // Set up review mode event listeners
    setupTermsReviewListeners(termsContent, closeTermsBtn, termsModal);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
}

/**
 * Setup event listeners for terms review mode
 */
function setupTermsReviewListeners(termsContent, closeTermsBtn, termsModal) {
    // Handle close button
    function handleCloseTerms() {
        // Hide modal
        termsModal.classList.add('hidden');
        termsModal.style.display = 'none';

        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';

        // Clean up event listeners
        closeTermsBtn.removeEventListener('click', handleCloseTerms);

        // Also handle clicks outside modal
        termsModal.removeEventListener('click', handleOutsideClick);

        // Handle escape key
        document.removeEventListener('keydown', handleEscapeKey);
    }

    // Handle clicks outside modal content
    function handleOutsideClick(event) {
        if (event.target === termsModal) {
            handleCloseTerms();
        }
    }

    // Handle escape key
    function handleEscapeKey(event) {
        if (event.key === 'Escape') {
            handleCloseTerms();
        }
    }

    // Add event listeners
    closeTermsBtn.addEventListener('click', handleCloseTerms);
    termsModal.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
}
