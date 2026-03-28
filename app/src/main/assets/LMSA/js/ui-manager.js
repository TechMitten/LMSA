// UI Manager for handling UI-related functionality
import {
    messagesContainer, welcomeMessage, sidebar, settingsModal,
    loadingIndicator, sendButton, stopButton, loadedModelDisplay,
    smartRepliesContainer, userInput
} from './dom-elements.js';
import { basicSanitizeInput, sanitizeInput, initializeCodeMirror, scrollToBottom, copyToClipboard, debugLog, debugError, processCodeBlocks, decodeHtmlEntities, htmlToFormattedText, getReasoningStreamState, normalizeReasoningTags, stripReasoningSections } from './utils.js';
import { getHideThinking, getShowModelLabel } from './settings-manager.js';
import { domBatcher, rafThrottle } from './optimized-utils.js';


let selectedText = '';
let selectedMessageElement = null;
let longPressTimer;

function forceSidebarRepaint(element) {
    if (!element) return;

    element.classList.add('sidebar-repaint-fix');

    const menuItems = element.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.add('sidebar-repaint-fix'));

    void element.offsetHeight;

    requestAnimationFrame(() => {
        element.classList.remove('sidebar-repaint-fix');
        menuItems.forEach(item => item.classList.remove('sidebar-repaint-fix'));
    });
}

function setCollapsibleSectionExpanded(header, shouldExpand) {
    if (!header) return;

    const content = header.nextElementSibling;
    if (!content || !content.classList.contains('collapsible-content')) {
        return;
    }

    clearTimeout(content._collapsibleHeightResetTimer);
    header.classList.toggle('active', shouldExpand);
    content.classList.toggle('show', shouldExpand);
    content.classList.remove('hidden');

    if (shouldExpand) {
        const measuredHeight = content.scrollHeight;
        content.style.maxHeight = `${measuredHeight}px`;
        forceSidebarRepaint(content);
        content._collapsibleHeightResetTimer = setTimeout(() => {
            if (content.classList.contains('show')) {
                content.style.maxHeight = 'none';
            }
        }, 260);
        return;
    }

    if (content.style.maxHeight === 'none' || !content.style.maxHeight) {
        content.style.maxHeight = `${content.scrollHeight}px`;
        void content.offsetHeight;
    }
    content.style.maxHeight = '0px';
}

/**
 * Shows the welcome message and hides the messages container
 */
export function showWelcomeMessage() {
    // Check if the welcome screen button should show "Settings" instead of "Start Here"
    const WELCOME_SETTINGS_TAPPED_KEY = 'welcomeSettingsTapped';
    const hasTappedWelcomeSettings = localStorage.getItem(WELCOME_SETTINGS_TAPPED_KEY) === 'true';
    const getStartedBtn = document.getElementById('get-started-btn');
    const getStartedBtnLabel = getStartedBtn?.querySelector('span');
    
    if (getStartedBtnLabel) {
        getStartedBtnLabel.textContent = hasTappedWelcomeSettings ? 'Settings' : 'Start Here';
    }

    // Performance monitoring removed

    // Batch DOM operations to prevent layout thrashing
    domBatcher.write(() => {
        if (welcomeMessage) {
            welcomeMessage.style.display = 'flex';
            welcomeMessage.style.visibility = 'visible';
            welcomeMessage.style.pointerEvents = 'auto';
            welcomeMessage.style.opacity = '1';
        }
        if (messagesContainer) {
            messagesContainer.style.opacity = '0';
            messagesContainer.style.visibility = 'hidden';
            messagesContainer.style.display = 'none';
        }
        // Show the Remove Ads banner when welcome screen is displayed (for non-premium users)
        const removeAdsBanner = document.getElementById('remove-ads-banner');
        if (removeAdsBanner) {
            // Only show if user is not premium
            const isPremium = window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus();
            if (!isPremium) {
                removeAdsBanner.style.display = 'flex';
            }
        }
    }).then(() => {
        // Force reflow and position adjustment after DOM writes
        if (welcomeMessage) {
            void welcomeMessage.offsetWidth;
            ensureWelcomeMessagePosition();
        }
    });
}

/**
 * Hides the welcome message and shows the messages container
 */
export function hideWelcomeMessage() {
    // Performance monitoring removed

    // Batch DOM operations to prevent layout thrashing
    domBatcher.write(() => {
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
            welcomeMessage.style.visibility = 'hidden';
            welcomeMessage.style.opacity = '1';
            welcomeMessage.style.pointerEvents = 'none';
        }

        if (messagesContainer) {
            messagesContainer.style.display = 'flex';
            messagesContainer.style.height = '100%';
            messagesContainer.style.opacity = '1';
            messagesContainer.style.visibility = 'visible';
        }

        // Hide the Remove Ads banner when leaving the welcome screen
        const removeAdsBanner = document.getElementById('remove-ads-banner');
        if (removeAdsBanner) {
            removeAdsBanner.style.display = 'none';
        }
    });
}

/**
 * Updates the chat history container's overflow behavior based on content
 */
export function updateChatHistoryScroll() {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;

    // Single-container sidebar scrolling: chat history should not be an inner scroller.
    chatHistory.style.overflow = 'visible';

    // Ensure touch events work properly on chat history
    if (!chatHistory.hasAttribute('data-touch-handlers-added')) {
        chatHistory.setAttribute('data-touch-handlers-added', 'true');
    }

    // Log for debugging
    debugLog('Chat history scroll updated with independent scrolling');
}

// Prevent multiple rapid toggle calls
const SIDEBAR_TRANSITION_DURATION_MS = 360;
const SIDEBAR_CLOSE_TRANSITION = `transform ${SIDEBAR_TRANSITION_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
let toggleSidebarTimeout = null;
let sidebarHideTimeout = null;

function resetSidebarInlineTransitionState() {
    if (!sidebar) return;

    sidebar.style.transition = '';
    sidebar.style.transform = '';
    sidebar.style.visibility = '';
}

function queueSidebarHide() {
    if (!sidebar) return;

    clearTimeout(sidebarHideTimeout);
    sidebarHideTimeout = setTimeout(() => {
        if (sidebar.classList.contains('active')) {
            return;
        }

        sidebar.classList.add('hidden');
        resetSidebarInlineTransitionState();
    }, SIDEBAR_TRANSITION_DURATION_MS);
}

function animateSidebarClosed() {
    if (!sidebar) return;

    clearTimeout(sidebarHideTimeout);
    sidebar.classList.remove('hidden');
    sidebar.style.visibility = 'visible';

    const sidebarWidth = sidebar.offsetWidth || window.innerWidth;
    const computedTransform = window.getComputedStyle(sidebar).transform;
    const currentTransform = computedTransform && computedTransform !== 'none'
        ? computedTransform
        : 'translate3d(0, 0, 0)';

    sidebar.style.transition = 'none';
    sidebar.style.transform = currentTransform;

    void sidebar.offsetWidth;

    requestAnimationFrame(() => {
        sidebar.classList.remove('active');
        sidebar.style.transition = SIDEBAR_CLOSE_TRANSITION;
        sidebar.style.transform = `translate3d(-${sidebarWidth}px, 0, 0)`;
    });

    queueSidebarHide();
}

/**
 * Toggles the sidebar visibility
 */
export function toggleSidebar() {
    if (!sidebar) return; // Ensure sidebar element exists

    // Prevent multiple rapid calls
    if (toggleSidebarTimeout) {
        return;
    }

    // Set a short timeout to prevent rapid calls
    toggleSidebarTimeout = setTimeout(() => {
        toggleSidebarTimeout = null;
    }, SIDEBAR_TRANSITION_DURATION_MS);

    // Debug logging

    // Remove focus from the sidebar toggle button to prevent it from staying highlighted
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.blur();
    }

    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const isOpen = sidebar.classList.contains('active');

    // Update hamburger icon based on sidebar state
    updateHamburgerIcon(!isOpen);

    if (isOpen) {
        closeSidebar();
        return;
    }

    // Toggle the overlay in mobile and tablet view first
    // Increased width threshold to 1024px to include tablets
    if (window.innerWidth <= 1024 && sidebarOverlay) {
        sidebarOverlay.classList.add('active');
        sidebarOverlay.classList.remove('hidden');
    }

    // Ensure touch events work properly on the sidebar
    if (!isOpen) {
        // Add touch event handlers when opening the sidebar
        if (!sidebar.hasAttribute('data-touch-handlers-added')) {
            sidebar.setAttribute('data-touch-handlers-added', 'true');

            // Prevent default on touchmove to avoid body scrolling while touching the sidebar
            sidebar.addEventListener('touchmove', function (e) {
                e.stopPropagation();
            }, { passive: true });
        }
    }

    // Add animation for smooth transition
    if (!isOpen) {
        // Opening the sidebar
        clearTimeout(sidebarHideTimeout);
        resetSidebarInlineTransitionState();
        sidebar.classList.remove('hidden');
        sidebar.style.visibility = 'visible';
        document.body.classList.add('sidebar-open');

        void sidebar.offsetWidth;
        requestAnimationFrame(() => {
            if (!sidebar.classList.contains('hidden')) {
                sidebar.classList.add('active');
            }
        });

        // Ensure chat history is visible when sidebar is opened
        const chatHistorySection = document.querySelector('.sidebar-section:last-child');
        if (chatHistorySection) {
            chatHistorySection.classList.remove('chat-history-hidden');
        }

        // Ensure welcome message stays centered
        if (welcomeMessage && welcomeMessage.style.display !== 'none') {
            ensureWelcomeMessagePosition();
        }

        // Update chat history scrolling behavior
        // Optimized: Immediate execution for better performance
        updateChatHistoryScroll();
    }
}

/**
 * Updates the hamburger icon to show hamburger or X based on sidebar state
 * @param {boolean} isOpen - Whether the sidebar is open
 */
export function updateHamburgerIcon(isOpen) {
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    if (!sidebarToggleBtn) return;

    const svg = sidebarToggleBtn.querySelector('svg');
    if (!svg) return;

    const path = svg.querySelector('path');
    if (!path) return;

    if (isOpen) {
        // Change to X icon
        path.setAttribute('d', 'M6 18L18 6M6 6l12 12');
        svg.setAttribute('aria-label', 'Close sidebar');
    } else {
        // Change back to hamburger icon
        path.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
        svg.setAttribute('aria-label', 'Open sidebar');
    }
}

/**
 * Helper function to close sidebar and update hamburger icon
 */
export function closeSidebar() {
    if (!sidebar) return;

    // Only proceed if sidebar is currently open
    if (sidebar.classList.contains('hidden') || !sidebar.classList.contains('active')) {
        return;
    }

    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // Update hamburger icon to show hamburger
    updateHamburgerIcon(false);

    // Handle overlay in mobile and tablet view first
    if (window.innerWidth <= 1024 && sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
        sidebarOverlay.classList.add('hidden');
    }

    document.body.classList.remove('sidebar-open');

    // Only hide settings modal if it exists and is actually visible
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
    }

    // Collapse options container when sidebar is closed in mobile or tablet view
    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer && window.innerWidth <= 1024) {
        optionsContainer.classList.add('hidden');
        optionsContainer.classList.remove('animate-fade-in');
    }

    const importExportContainer = document.getElementById('import-export-container');
    if (importExportContainer) {
        importExportContainer.classList.add('hidden');
        importExportContainer.classList.remove('animate-fade-in');

        const importExportGroupButton = document.getElementById('import-export-group-btn');
        const importExportCaret = importExportGroupButton?.querySelector('.fa-caret-up');
        if (importExportCaret) {
            importExportCaret.classList.remove('fa-caret-up');
            importExportCaret.classList.add('fa-caret-down');
        }
    }

    const premiumContainer = document.getElementById('premium-container');
    if (premiumContainer) {
        premiumContainer.classList.add('hidden');
        premiumContainer.classList.remove('animate-fade-in');

        const premiumGroupButton = document.getElementById('premium-group-btn');
        const premiumCaret = premiumGroupButton?.querySelector('.fa-caret-up');
        if (premiumCaret) {
            premiumCaret.classList.remove('fa-caret-up');
            premiumCaret.classList.add('fa-caret-down');
        }
    }

    // Collapse all sections when sidebar is closed
    const sectionHeaders = document.querySelectorAll('.section-header');
    const chatHistorySection = document.querySelector('.sidebar-section:last-child');
    sectionHeaders.forEach(header => {
        setCollapsibleSectionExpanded(header, false);
    });

    // Ensure chat history is visible when sidebar is closed
    if (chatHistorySection) {
        chatHistorySection.classList.remove('chat-history-hidden');
    }

    // Only ensure welcome message position if there are no chat messages  
    if (welcomeMessage && welcomeMessage.style.display !== 'none' && messagesContainer && messagesContainer.children.length === 0) {
        ensureWelcomeMessagePosition();
    }

    animateSidebarClosed();
}

/**
 * Shows the confirmation modal with a message
 * @param {string} message - The message to display in the confirmation modal
 */
export function showConfirmationModal(message) {
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');

    if (confirmationModal && confirmationMessage) {
        // Set the message
        confirmationMessage.textContent = message;

        // Ensure the modal is on top of any other modals
        confirmationModal.style.zIndex = '1060'; // Higher than settings modal (1050)

        // Find the modal content and ensure it's also on top
        const modalContent = confirmationModal.querySelector('.bg-darkSecondary');
        if (modalContent) {
            modalContent.style.zIndex = '1061'; // Higher than the modal background
        }

        // Make sure the modal is properly displayed
        confirmationModal.style.display = 'flex';
        confirmationModal.classList.remove('hidden');
        confirmationModal.classList.add('animate-fade-in');

        // Add event listeners for the cancel and confirm buttons
        const cancelButton = document.getElementById('cancel-action');
        if (cancelButton) {
            // Ensure we don't add duplicate event listeners
            cancelButton.removeEventListener('click', hideConfirmationModal);
            cancelButton.addEventListener('click', hideConfirmationModal);
        }
    }
}

/**
 * Hides the confirmation modal
 */
export function hideConfirmationModal() {
    const confirmationModal = document.getElementById('confirmation-modal');

    if (confirmationModal) {
        confirmationModal.classList.add('animate-fade-out');
        confirmationModal.classList.remove('animate-fade-in');

        // Optimized: Immediate execution for better performance
        confirmationModal.classList.add('hidden');
        confirmationModal.style.display = 'none';
        confirmationModal.classList.remove('animate-fade-out');

        // Check if welcome message should be shown
        checkAndShowWelcomeMessage();
    }
}


let ipPortErrorModalTimeout = null;

/**
 * Shows the IP/Port validation error modal
 * @param {string} message - The error message to display
 */
export function showIpPortErrorModal(message) {
    // Clear any pending hide timeout to prevent race conditions
    if (ipPortErrorModalTimeout) {
        clearTimeout(ipPortErrorModalTimeout);
        ipPortErrorModalTimeout = null;
    }

    const errorModal = document.getElementById('ip-port-error-modal');
    const errorMessage = document.getElementById('ip-port-error-message');
    const okButton = document.getElementById('ip-port-error-ok-btn');

    if (errorModal && errorMessage) {
        // Set the message
        errorMessage.textContent = message;

        // Ensure the modal is properly displayed
        errorModal.classList.remove('hidden');
        errorModal.style.display = 'flex';

        // Add animation
        const modalContent = errorModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('animate-modal-out');
            modalContent.classList.add('animate-modal-in');
        }

        // Add event listener for the OK button
        if (okButton) {
            // Remove any existing event listeners to prevent duplicates
            // We use the clone node trick to wipe all event listeners
            const newOkButton = okButton.cloneNode(true);
            okButton.parentNode.replaceChild(newOkButton, okButton);

            newOkButton.addEventListener('click', hideIpPortErrorModal);

            // Focus the button for accessibility
            setTimeout(() => newOkButton.focus(), 100);
        }
    }
}

/**
 * Hides the IP/Port validation error modal
 */
export function hideIpPortErrorModal() {
    const errorModal = document.getElementById('ip-port-error-modal');

    if (errorModal) {
        const modalContent = errorModal.querySelector('.modal-content');

        if (modalContent) {
            modalContent.classList.remove('animate-modal-in');
            modalContent.classList.add('animate-modal-out');

            // Wait for animation to finish
            ipPortErrorModalTimeout = setTimeout(() => {
                errorModal.classList.add('hidden');
                errorModal.style.display = 'none';
                modalContent.classList.remove('animate-modal-out');
                ipPortErrorModalTimeout = null;
            }, 300);
        } else {
            errorModal.classList.add('hidden');
            errorModal.style.display = 'none';
        }
    }
}

/**
 * Shows the export confirmation modal
 */
export function showExportConfirmationModal() {
    const exportConfirmationModal = document.getElementById('export-confirmation-modal');

    if (exportConfirmationModal) {
        exportConfirmationModal.classList.remove('hidden');
        const modalContent = exportConfirmationModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-in');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-in');
            }, 300);
        }
    }
}

/**
 * Hides the export confirmation modal
 */
export function hideExportConfirmationModal() {
    const exportConfirmationModal = document.getElementById('export-confirmation-modal');

    if (exportConfirmationModal) {
        const modalContent = exportConfirmationModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-out');
            setTimeout(() => {
                exportConfirmationModal.classList.add('hidden');
                modalContent.classList.remove('animate-modal-out');

                // Update hamburger icon to show hamburger (in case sidebar was closed)
                updateHamburgerIcon(false);

                // Check if welcome message should be shown
                checkAndShowWelcomeMessage();
            }, 300);
        } else {
            exportConfirmationModal.classList.add('hidden');

            // Update hamburger icon to show hamburger (in case sidebar was closed)
            updateHamburgerIcon(false);

            // Check if welcome message should be shown
            checkAndShowWelcomeMessage();
        }
    }
}

/**
 * Shows the loading indicator
 */
export function showLoadingIndicator() {
    if (!loadingIndicator) {
        debugError('Loading indicator element not found');
        return;
    }

    // Ensure the content includes the thinking text
    if (!loadingIndicator.querySelector('.thinking-text')) {
        loadingIndicator.innerHTML = '<span class="thinking-text">Generating...</span><span class="loading-ellipsis">...</span>';

        // Apply styling to new elements
        const ellipsis = loadingIndicator.querySelector('.loading-ellipsis');
        const thinkingText = loadingIndicator.querySelector('.thinking-text');

        if (ellipsis) {
            ellipsis.style.display = 'inline-block';
            ellipsis.style.whiteSpace = 'nowrap';
            ellipsis.style.textAlign = 'left';
            ellipsis.style.direction = 'ltr';
        }

        if (thinkingText) {
            thinkingText.style.marginRight = '2px';
        }
    }
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('animate-fade-in');
    messagesContainer.appendChild(loadingIndicator);
    // Remove auto-scroll when showing loading indicator
}

/**
 * Hides the loading indicator
 */
export function hideLoadingIndicator() {
    if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
}

/**
 * Hides the loading indicator on page load
 */
export function hideLoadingIndicatorOnLoad() {
    if (loadingIndicator && loadingIndicator.parentNode) {
        loadingIndicator.parentNode.removeChild(loadingIndicator);
    }
}

/**
 * Toggles between send and stop buttons
 */
export function toggleSendStopButton() {
    const sendButton = document.getElementById('send-button');
    const stopButton = document.getElementById('stop-button');

    if (!sendButton || !stopButton) {
        return;
    }

    try {
        // Check if send button is currently visible
        if (!sendButton.classList.contains('hidden')) {
            // Switch from send to stop
            debugLog('Toggling from send to stop button - caller:', new Error().stack);
            sendButton.classList.add('hidden');
            stopButton.classList.remove('hidden');
            // Make sure stop button is displayed as a block element
            stopButton.style.display = 'flex';
        } else {
            // Switch from stop to send
            debugLog('Toggling from stop to send button - caller:', new Error().stack);
            stopButton.classList.add('hidden');
            sendButton.classList.remove('hidden');
            // Reset any inline styles
            stopButton.style.display = '';

            // Import chat service module to ensure abort controller is properly nullified
            // This helps prevent lingering connections when switching back to send button
            import('./chat-service.js').then(module => {
                // Clean up any existing abort controller when we switch back to send
                if (module.isGeneratingText && typeof module.isGeneratingText === 'function' && module.isGeneratingText()) {
                    debugLog('Generation still in progress when toggling to send, ensuring proper cleanup');
                    if (typeof module.abortGeneration === 'function') {
                        module.abortGeneration();
                    }
                } else {
                    debugLog('Setting abort controller to null during button toggle');
                    if (typeof module.setAbortController === 'function') {
                        module.setAbortController(null);
                    }
                }
            }).catch(error => {
                debugError('Error importing chat-service module:', error);
            });
        }
    } catch (error) {
        debugError('Error toggling send/stop buttons:', error);
        // Attempt to recover by ensuring send button is visible
        sendButton.classList.remove('hidden');
        stopButton.classList.add('hidden');
    }
}

/**
 * Appends a message to the chat
 * @param {string} sender - The sender of the message ('user', 'ai', 'system', or 'error')
 * @param {string} message - The message content
 * @param {Array} files - Optional array of file objects
 * @param {boolean} isStreaming - Whether the message is being streamed
 */
export function appendMessage(sender, message, files = null, isStreaming = false, modelName = null) {
    // If this is a streaming update to an existing message, find and update that message
    if (isStreaming) {
        const existingMessages = messagesContainer.querySelectorAll(`.${sender}`);
        if (existingMessages.length > 0) {
            const lastMessage = existingMessages[existingMessages.length - 1];
            const contentContainer = lastMessage.querySelector('.message-content');
            if (contentContainer) {
                const reasoningState = getReasoningStreamState(message);
                const hasThinkTags = reasoningState.hasThinking;

                // Store the original message content for reprocessing if needed
                lastMessage.originalContent = message;

                const hideThinking = getHideThinking();

                const inThinkingSection = reasoningState.inThinkingSection;
                const contentAfterThink = reasoningState.contentAfterThink;

                // Apply the appropriate sanitization based on message type and hide thinking setting
                if (hasThinkTags) {
                    // Handle thinking content when hide thinking is enabled
                    if (hideThinking) {
                        // If currently in thinking section and no post-thinking content yet
                        if (inThinkingSection && contentAfterThink === "") {
                            // Check if we already have a thinking indicator
                            let thinkingIndicator = contentContainer.querySelector('.thinking-indicator');

                            // Create thinking indicator if it doesn't exist
                            if (!thinkingIndicator) {
                                thinkingIndicator = document.createElement('div');
                                thinkingIndicator.className = 'thinking-indicator';
                                thinkingIndicator.innerHTML = '<i class="fas fa-brain"></i>';
                                thinkingIndicator.setAttribute('data-thinking-content', '');

                                // Clear the container and add the indicator
                                contentContainer.innerHTML = '';
                                contentContainer.appendChild(thinkingIndicator);
                            }

                            // Update the data attribute with current thinking content
                            const thinkingContent = message.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
                            if (thinkingContent && thinkingContent[1]) {
                                thinkingIndicator.setAttribute('data-thinking-content', thinkingContent[1]);
                            }
                        } else {
                            // Hide thinking is enabled but we're not in thinking section and no content after think
                            // This means thinking tags are complete but no content after them yet
                            const processedContent = stripReasoningSections(reasoningState.normalizedText);
                            contentContainer.innerHTML = basicSanitizeInput(processedContent);
                        }
                    } else {
                        // If hide thinking is disabled, just show everything normally
                        contentContainer.innerHTML = sanitizeInput(reasoningState.normalizedText);
                    }

                    // Mark this message as a reasoning model response
                    lastMessage.dataset.hasThinking = 'true';
                } else {
                    // For non-reasoning models, apply basic sanitization
                    contentContainer.innerHTML = basicSanitizeInput(reasoningState.normalizedText);
                    // Mark this message as a non-reasoning model response
                    lastMessage.dataset.hasThinking = 'false';
                }

                initializeCodeMirror(lastMessage);
                // Remove auto-scroll during streaming
            }
            return lastMessage;
        }
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add(sender, 'animate-fade-in', 'mb-4', 'p-4', 'rounded-lg');

    // Store the original message content for reprocessing if needed
    messageElement.originalContent = message;

    if (sender === 'ai' || sender === 'user') {
        // Create a container for the message content
        const contentContainer = document.createElement('div');
        contentContainer.classList.add('message-content');

        const normalizedMessage = normalizeReasoningTags(message);
        const hasThinkTags = getReasoningStreamState(normalizedMessage).hasThinking;

        // Apply the appropriate sanitization based on message type
        if (hasThinkTags) {
            // For reasoning models, apply full sanitization
            contentContainer.innerHTML = sanitizeInput(normalizedMessage);
            // Mark this message as a reasoning model response
            messageElement.dataset.hasThinking = 'true';
        } else {
            // For non-reasoning models, apply basic sanitization
            contentContainer.innerHTML = basicSanitizeInput(normalizedMessage);
            // Mark this message as a non-reasoning model response
            messageElement.dataset.hasThinking = 'false';
        }

        // Add the content container to the message
        messageElement.appendChild(contentContainer);

        // Add file attachments to the message if provided
        if (files && files.length > 0) {
            // Create a container for file attachments
            const fileAttachmentsContainer = document.createElement('div');
            fileAttachmentsContainer.classList.add('file-attachments');

            // Add each file as an attachment
            files.forEach(file => {
                const fileAttachment = document.createElement('div');
                fileAttachment.classList.add('file-attachment');

                // Choose icon based on file type
                let iconClass = 'fa-file';
                if (file.type.includes('image')) iconClass = 'fa-file-image';
                else if (file.type.includes('text') ||
                    file.name.endsWith('.json') ||
                    file.name.endsWith('.md') ||
                    file.name.endsWith('.py') ||
                    file.name.endsWith('.js')) iconClass = 'fa-file-alt';
                else if (file.name.endsWith('.pdf')) iconClass = 'fa-file-pdf';
                else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) iconClass = 'fa-file-word';

                fileAttachment.innerHTML = `
                    <i class="fas ${iconClass}"></i>
                    <span title="${file.name}">${file.name}</span>
                `;

                fileAttachmentsContainer.appendChild(fileAttachment);
            });

            // Add file attachments container to message
            messageElement.appendChild(fileAttachmentsContainer);
        }

        // Add message controls
        if (!isStreaming) {
            // Create controls container
            const controlsContainer = document.createElement('div');
            controlsContainer.classList.add('message-controls', 'mt-2', 'flex', 'justify-end', 'text-xs', 'text-gray-400', 'space-x-2');

            if (sender === 'user') {
                // Create edit button for user messages
                const editButton = document.createElement('button');
                editButton.classList.add('edit-btn', 'flex', 'items-center', 'hover:text-blue-400', 'transition-colors', 'duration-300');
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                editButton.title = 'Edit this message';
                editButton.dataset.action = 'edit';
                editButton.setAttribute('role', 'button');
                editButton.setAttribute('aria-label', 'Edit message');
                controlsContainer.appendChild(editButton);

                // Create delete button for user messages
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-btn', 'flex', 'items-center', 'hover:text-red-400', 'transition-colors', 'duration-300');
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.title = 'Delete this message';
                deleteButton.dataset.action = 'delete';
                deleteButton.setAttribute('role', 'button');
                deleteButton.setAttribute('aria-label', 'Delete message');
                controlsContainer.appendChild(deleteButton);
            } else if (sender === 'ai') {
                // Create copy button for AI messages
                const copyButton = document.createElement('button');
                copyButton.classList.add('copy-btn', 'flex', 'items-center', 'hover:text-blue-400', 'transition-colors', 'duration-300');
                copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                copyButton.title = 'Copy this message';
                copyButton.addEventListener('click', () => {
                    let contentWithoutThinking = '';

                    // APPROACH 1: Try to find the visible-after-think div, which is specifically created
                    // to contain only content after the last think tag
                    const messageContentElement = messageElement.querySelector('.message-content');
                    const visibleAfterThinkElement = messageContentElement?.querySelector('.visible-after-think');

                    if (visibleAfterThinkElement && visibleAfterThinkElement.textContent.trim()) {
                        // Use the new htmlToFormattedText function to preserve formatting
                        contentWithoutThinking = htmlToFormattedText(visibleAfterThinkElement);
                        debugLog('Using visible-after-think element for copy content with formatting');
                    }
                    // APPROACH 2: If no visible-after-think element found, use the message content element
                    // while excluding all thinking-related elements
                    else if (messageContentElement) {
                        // Use the new htmlToFormattedText function to preserve formatting
                        contentWithoutThinking = htmlToFormattedText(messageContentElement);
                        debugLog('Using filtered message content for copy content with formatting');
                    }
                    // APPROACH 3: Fallback to regex-based extraction from originalContent if needed
                    else {
                        debugLog('Falling back to regex extraction for copy content');
                        let contentToCopy = messageElement.originalContent;

                        if (!contentToCopy) {
                            // Fallback: get content from the message content container
                            const contentContainer = messageElement.querySelector('.message-content');
                            if (contentContainer) {
                                contentToCopy = contentContainer.innerHTML || '';
                            } else {
                                contentToCopy = messageElement.innerHTML || '';
                            }
                        }

                        // Try to find content after the last </think> tag in the raw content
                        const lastThinkTagIndex = contentToCopy.lastIndexOf('</think>');
                        const lastEncodedThinkTagIndex = contentToCopy.lastIndexOf('&lt;/think&gt;');

                        if (lastThinkTagIndex !== -1 || lastEncodedThinkTagIndex !== -1) {
                            // Get text after the last think tag
                            let afterThinkContent;
                            if (lastThinkTagIndex > lastEncodedThinkTagIndex) {
                                afterThinkContent = contentToCopy.substring(lastThinkTagIndex + 8).trim();
                            } else {
                                afterThinkContent = contentToCopy.substring(lastEncodedThinkTagIndex + 14).trim();
                            }
                            // Convert HTML to formatted text
                            contentWithoutThinking = htmlToFormattedText(afterThinkContent);
                        } else {
                            // If no think tags found, copy the message but remove any think sections
                            const cleanedContent = contentToCopy
                                .replace(/<think>[\s\S]*?<\/think>/g, '')
                                .replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, '')
                                .trim();
                            // Convert HTML to formatted text
                            contentWithoutThinking = htmlToFormattedText(cleanedContent);
                        }
                    }

                    // Make sure we have content to copy
                    if (!contentWithoutThinking) {
                        // Last resort: just get the visible text directly from the message content
                        if (messageContentElement) {
                            contentWithoutThinking = htmlToFormattedText(messageContentElement);
                        } else {
                            contentWithoutThinking = messageElement.textContent?.trim() || '';
                        }
                        debugLog('Using fallback content for copy');
                    }

                    // Store original button state
                    const originalHTML = copyButton.innerHTML;

                    // Only proceed if we have content to copy
                    if (!contentWithoutThinking) {
                        debugLog('No content available to copy');
                        copyButton.innerHTML = '<i class="fas fa-times"></i>';
                        setTimeout(() => {
                            copyButton.innerHTML = originalHTML;
                        }, 1000);
                        return;
                    }

                    copyToClipboard(contentWithoutThinking)
                        .then(() => {
                            // Success: Show copied feedback
                            copyButton.innerHTML = '<i class="fas fa-check" style="color: #4ade80; font-weight: 900; font-size: 14px;"></i>';
                            setTimeout(() => {
                                copyButton.innerHTML = originalHTML;
                            }, 2500);
                        })
                        .catch((error) => {
                            // Error: Show error feedback
                            debugError('Failed to copy text:', error);
                            copyButton.innerHTML = '<i class="fas fa-times"></i>';
                            setTimeout(() => {
                                copyButton.innerHTML = originalHTML;
                            }, 1000);
                        });
                });
                controlsContainer.appendChild(copyButton);

                // Create speaker button for AI messages
                const speakerButton = document.createElement('button');
                speakerButton.classList.add(
                    'speaker-btn',
                    'flex',
                    'items-center',
                    'hover:text-green-400',
                    'transition-colors',
                    'duration-300'
                );
                speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                speakerButton.title = 'Read this message aloud';
                speakerButton.addEventListener('click', async () => {
                    // Get the message content for TTS
                    let textToSpeak = '';

                    // Try to get content without thinking tags (same logic as copy button)
                    const messageContentElement = messageElement.querySelector('.message-content');
                    const visibleAfterThinkElement = messageContentElement?.querySelector('.visible-after-think');

                    if (visibleAfterThinkElement && visibleAfterThinkElement.textContent.trim()) {
                        textToSpeak = visibleAfterThinkElement.textContent.trim();
                    } else if (messageContentElement) {
                        // Get text content, excluding thinking elements
                        const thinkingElements = messageContentElement.querySelectorAll('.think, .thinking-indicator');
                        const clonedElement = messageContentElement.cloneNode(true);
                        thinkingElements.forEach(el => {
                            const clonedThinking = clonedElement.querySelector('.think, .thinking-indicator');
                            if (clonedThinking) clonedThinking.remove();
                        });
                        textToSpeak = clonedElement.textContent.trim();
                    } else {
                        // Fallback to original content processing
                        let contentToCopy = messageElement.originalContent || '';
                        const lastThinkTagIndex = contentToCopy.lastIndexOf('</think>');
                        const lastEncodedThinkTagIndex = contentToCopy.lastIndexOf('&lt;/think&gt;');

                        if (lastThinkTagIndex !== -1 || lastEncodedThinkTagIndex !== -1) {
                            if (lastThinkTagIndex > lastEncodedThinkTagIndex) {
                                textToSpeak = contentToCopy.substring(lastThinkTagIndex + 8).trim();
                            } else {
                                textToSpeak = contentToCopy.substring(lastEncodedThinkTagIndex + 14).trim();
                            }
                        } else {
                            textToSpeak = contentToCopy
                                .replace(/<think>[\s\S]*?<\/think>/g, '')
                                .replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, '')
                                .trim();
                        }

                        // Convert HTML to plain text
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = textToSpeak;
                        textToSpeak = tempDiv.textContent || tempDiv.innerText || '';
                    }

                    // Store original button state
                    const originalHTML = speakerButton.innerHTML;

                    if (!textToSpeak) {
                        speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                        setTimeout(() => {
                            speakerButton.innerHTML = originalHTML;
                        }, 1000);
                        return;
                    }

                    try {
                        // Check if TTS service is available
                        if (window.TTSService) {
                            // Initialize TTS service if not already done
                            if (!window.TTSService.isInitialized()) {
                                await window.TTSService.initialize();
                            }

                            // Only treat this as a stop toggle when the JS layer is still
                            // tracking an active playback request. If Android is stuck in a
                            // stale speaking state, let speak() recover it and start fresh.
                            if (window.TTSService.hasTrackedPlayback()) {
                                window.TTSService.stop('speaker-toggle-stop', true);
                                speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                                speakerButton.title = 'Read this message aloud';
                                return;
                            }

                            // Start speaking - show square stop icon
                            speakerButton.innerHTML = '<i class="fas fa-square"></i>';
                            speakerButton.title = 'Stop reading';

                            // Start TTS and set up completion handler
                            window.TTSService.speak(textToSpeak).then(() => {
                                // Reset button when TTS actually finishes
                                speakerButton.innerHTML = originalHTML;
                                speakerButton.title = 'Read this message aloud';
                            }).catch(() => {
                                // Reset button on error
                                speakerButton.innerHTML = originalHTML;
                                speakerButton.title = 'Read this message aloud';
                            });
                        } else {
                            // Fallback error
                            speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                            setTimeout(() => {
                                speakerButton.innerHTML = originalHTML;
                            }, 2000);
                        }
                    } catch (error) {
                        console.error('TTS Error:', error);
                        speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                        setTimeout(() => {
                            speakerButton.innerHTML = originalHTML;
                        }, 2000);
                    }
                });
                controlsContainer.appendChild(speakerButton);

                // Create edit button for AI messages
                const aiEditButton = document.createElement('button');
                aiEditButton.classList.add(
                    'ai-edit-btn',
                    'flex',
                    'items-center',
                    'hover:text-yellow-400',
                    'transition-colors',
                    'duration-300'
                );
                aiEditButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                aiEditButton.title = 'Edit this response';
                aiEditButton.dataset.action = 'ai-edit';
                aiEditButton.setAttribute('role', 'button');
                aiEditButton.setAttribute('aria-label', 'Edit AI response');
                controlsContainer.appendChild(aiEditButton);

                // Create regenerate button for AI messages
                const regenerateButton = document.createElement('button');
                regenerateButton.classList.add(
                    'regenerate-btn',
                    'flex',
                    'items-center',
                    'hover:text-blue-400',
                    'transition-colors',
                    'duration-300'
                );
                regenerateButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
                regenerateButton.title = 'Regenerate this response';
                regenerateButton.dataset.action = 'regenerate';
                regenerateButton.setAttribute('role', 'button');
                regenerateButton.setAttribute('aria-label', 'Regenerate response');
                controlsContainer.appendChild(regenerateButton);
            }

            messageElement.appendChild(controlsContainer);

            // Add model label for AI messages
            if (sender === 'ai') {
                const effectiveModel = modelName || window.currentLoadedModel;
                if (effectiveModel) {
                    const modelLabelEl = document.createElement('div');
                    modelLabelEl.classList.add('model-label');
                    modelLabelEl.textContent = effectiveModel;
                    messageElement.appendChild(modelLabelEl);
                }
            }
        }
    } else if (sender === 'system' || sender === 'error' || sender === 'warning') {
        // System messages get simpler formatting
        messageElement.innerHTML = `<div class="message-content">${message}</div>`;
    }

    // Add the new message to the chat container
    messagesContainer.appendChild(messageElement);

    // Initialize code highlighting for the new message
    initializeCodeMirror(messageElement);

    // Remove auto-scroll during streaming

    return messageElement;
}

/**
 * Applies the model label visibility setting to all messages
 */
export function applyModelLabelVisibility() {
    if (messagesContainer) {
        if (getShowModelLabel()) {
            messagesContainer.classList.add('show-model-labels');
        } else {
            messagesContainer.classList.remove('show-model-labels');
        }
    }
}

/**
 * Applies the thinking visibility setting to all messages
 * with special optimization for code reload scenarios
 */
export function applyThinkingVisibility() {
    // Check if this is a high priority code reload with reasoning model
    const isCodeReload = window.__ultraPriorityCodeReload || window.__forceReloadInProgress;
    const bypassReasoningProcessing = window.__bypassReasoningProcessing;

    // For code reloads with reasoning models, use a faster path
    if (isCodeReload && bypassReasoningProcessing) {
        debugLog('Using fast path for reasoning model with code blocks');
        if (getHideThinking()) {
            // Apply hide-thinking classes without expensive DOM operations
            document.documentElement.classList.add('hide-thinking-fast');
            document.body.classList.add('hide-thinking-fast');
            messagesContainer?.classList.add('hide-thinking-fast');

            // Skip expensive DOM operations that would delay code block rendering
            // The CSS will handle hiding think tags through classes
            return; // Exit early to prioritize code block rendering
        }
    }

    // Standard path for normal messages
    if (messagesContainer) {
        if (getHideThinking()) {
            messagesContainer.classList.add('hide-thinking');
            document.body.classList.add('hide-thinking'); // Also add to body to ensure all messages are affected

            // Additional direct DOM manipulation to hide any <think> tags
            const messageParagraphs = messagesContainer.querySelectorAll('p');
            messageParagraphs.forEach(p => {
                // Check for raw <think> tags
                if (p.textContent.includes('<think>') && p.textContent.includes('</think>')) {
                    p.style.display = 'none';
                }

                // Check for escaped &lt;think&gt; tags
                if (p.innerHTML.includes('&lt;think&gt;') && p.innerHTML.includes('&lt;/think&gt;')) {
                    p.style.display = 'none';
                }
            });

            // Also remove any visible think tags
            removeVisibleThinkTags();

            // Find all thinking indicators and automatically show content after </think> tags
            const thinkingIndicators = messagesContainer.querySelectorAll('.thinking-indicator');
            thinkingIndicators.forEach(indicator => {
                // Check if this indicator has content after </think> tags
                const afterThinkContent = indicator.getAttribute('data-after-think-content');
                if (afterThinkContent && afterThinkContent.trim() !== '') {
                    // Create a visible div for the content after </think>
                    const afterThinkDiv = document.createElement('div');
                    afterThinkDiv.className = 'visible-after-think';
                    afterThinkDiv.style.display = 'block';
                    afterThinkDiv.style.visibility = 'visible';
                    afterThinkDiv.style.opacity = '1';
                    afterThinkDiv.style.color = 'var(--text-primary)';
                    afterThinkDiv.innerHTML = afterThinkContent;

                    // Add it after the thinking indicator if it doesn't already exist
                    if (!indicator.nextElementSibling || !indicator.nextElementSibling.classList.contains('visible-after-think')) {
                        indicator.parentNode.insertBefore(afterThinkDiv, indicator.nextSibling);
                    }
                }

                // Remove the toggle button if it exists
                const toggleButton = indicator.querySelector('.thinking-toggle');
                if (toggleButton) {
                    toggleButton.remove();
                }
            });
        } else {
            messagesContainer.classList.remove('hide-thinking');
            document.body.classList.remove('hide-thinking');

            // Reset visibility of paragraphs
            const messageParagraphs = messagesContainer.querySelectorAll('p');
            messageParagraphs.forEach(p => {
                p.style.removeProperty('display');
            });

            // Special handling for non-reasoning models
            // Find all non-reasoning model messages and ensure they don't show thinking text
            const nonReasoningMessages = messagesContainer.querySelectorAll('.ai[data-has-thinking="false"]');
            nonReasoningMessages.forEach(messageEl => {
                if (messageEl.originalContent) {
                    // Get the content container to preserve the message structure
                    const contentContainer = messageEl.querySelector('.message-content');
                    if (contentContainer) {
                        // Re-apply basic sanitization to ensure no thinking text is displayed
                        contentContainer.innerHTML = basicSanitizeInput(messageEl.originalContent);
                    } else {
                        // If no content container exists, recreate the message structure
                        messageEl.innerHTML = '';
                        const newContentContainer = document.createElement('div');
                        newContentContainer.classList.add('message-content');
                        newContentContainer.innerHTML = basicSanitizeInput(messageEl.originalContent);
                        messageEl.appendChild(newContentContainer);
                    }
                    initializeCodeMirror(messageEl);
                }
            });

            // Refresh messages to restore original content for reasoning models
            const reasoningMessages = messagesContainer.querySelectorAll('.ai[data-has-thinking="true"]');
            reasoningMessages.forEach(messageEl => {
                if (messageEl.originalContent) {
                    // Get the content container to preserve the message structure
                    const contentContainer = messageEl.querySelector('.message-content');
                    if (contentContainer) {
                        // Re-apply sanitization with thinking tag processing
                        contentContainer.innerHTML = sanitizeInput(messageEl.originalContent);
                    } else {
                        // If no content container exists, recreate the message structure
                        messageEl.innerHTML = '';
                        const newContentContainer = document.createElement('div');
                        newContentContainer.classList.add('message-content');
                        newContentContainer.innerHTML = sanitizeInput(messageEl.originalContent);
                        messageEl.appendChild(newContentContainer);
                    }

                    initializeCodeMirror(messageEl);

                }
            });
        }
    }
}

/**
 * Refreshes all messages to apply current settings
 */
export function refreshAllMessages() {
    if (!messagesContainer) return;

    // First handle AI messages
    const aiMessages = messagesContainer.querySelectorAll('.ai');
    aiMessages.forEach(messageEl => {
        if (messageEl.originalContent) {
            // If we saved the original content, re-sanitize it based on content type
            const originalContent = messageEl.originalContent;

            // Check if message is from a reasoning model (has thinking tags)
            const hasThinkTags = getReasoningStreamState(originalContent).hasThinking;

            // Update the dataset attribute to consistently mark reasoning vs non-reasoning messages
            messageEl.dataset.hasThinking = hasThinkTags ? 'true' : 'false';

            // Save the existing controls container before updating content
            const existingControls = messageEl.querySelector('.message-controls');

            if (hasThinkTags) {
                // For reasoning models, use full sanitization with think tag processing
                const contentContainer = messageEl.querySelector('.message-content');
                if (contentContainer) {
                    contentContainer.innerHTML = sanitizeInput(originalContent);
                } else {
                    // If no content container exists, create a new structure
                    messageEl.innerHTML = '';
                    const newContentContainer = document.createElement('div');
                    newContentContainer.classList.add('message-content');
                    newContentContainer.innerHTML = sanitizeInput(originalContent);
                    messageEl.appendChild(newContentContainer);
                }
            } else {
                // For non-reasoning models, use basic sanitization (no thinking tag processing)
                // This ensures non-reasoning models never show thinking text
                const contentContainer = messageEl.querySelector('.message-content');
                if (contentContainer) {
                    // Process the content to ensure HTML code blocks are properly preserved
                    const processedContent = basicSanitizeInput(originalContent);
                    contentContainer.innerHTML = processedContent;
                } else {
                    // If no content container exists, create a new structure
                    messageEl.innerHTML = '';
                    const newContentContainer = document.createElement('div');
                    newContentContainer.classList.add('message-content');
                    newContentContainer.innerHTML = basicSanitizeInput(originalContent);
                    messageEl.appendChild(newContentContainer);
                }
            }

            // Pre-process code blocks to ensure HTML entities are properly handled before Monaco initialization
            const contentContainer = messageEl.querySelector('.message-content');
            if (contentContainer) {
                // Check if the message content is already handled by the new HTML detection system
                const hasHtmlCodeContainer = contentContainer.querySelector('.html-code-container');

                if (!hasHtmlCodeContainer) {
                    const codeBlocks = contentContainer.querySelectorAll('pre code');
                    codeBlocks.forEach(block => {
                        // For HTML code blocks, make sure they're properly marked for Monaco editor
                        if (block.className.includes('language-html') || block.className.includes('language-xml')) {
                            let codeContent = block.innerHTML;

                            // Clean up any visible HTML markers that shouldn't be displayed
                            if (codeContent.includes('[HTML_CODE_BLOCK_START]') || codeContent.includes('[HTML_CODE_BLOCK_END]')) {
                                codeContent = codeContent.replace(/\[HTML_CODE_BLOCK_START\]/g, '');
                                codeContent = codeContent.replace(/\[HTML_CODE_BLOCK_END\]/g, '');
                                block.innerHTML = codeContent;
                            }

                            // Monaco Editor will handle HTML code blocks properly without visible markers
                            // The markers should only be used internally, never displayed to users
                        }
                    });
                }
            }

            initializeCodeMirror(messageEl);

            // If we had existing controls, restore them, otherwise create new controls
            let controlsContainer = messageEl.querySelector('.message-controls');
            if (!controlsContainer) {
                if (existingControls) {
                    // Restore the existing controls
                    messageEl.appendChild(existingControls);
                    controlsContainer = existingControls;
                } else {
                    // Create new controls container
                    controlsContainer = document.createElement('div');
                    controlsContainer.classList.add('message-controls', 'mt-2', 'flex', 'justify-end', 'text-xs', 'text-gray-400', 'space-x-2');

                    // Create copy button
                    const copyButton = document.createElement('button');
                    copyButton.classList.add('copy-btn', 'flex', 'items-center', 'hover:text-blue-400', 'transition-colors', 'duration-300');
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    copyButton.title = 'Copy this message';
                    copyButton.addEventListener('click', () => {
                        let contentWithoutThinking = '';

                        // APPROACH 1: Try to find the visible-after-think div, which is specifically created
                        // to contain only content after the last think tag
                        const messageContentElement = messageEl.querySelector('.message-content');
                        const visibleAfterThinkElement = messageContentElement?.querySelector('.visible-after-think');

                        if (visibleAfterThinkElement && visibleAfterThinkElement.textContent.trim()) {
                            // Use the new htmlToFormattedText function to preserve formatting
                            contentWithoutThinking = htmlToFormattedText(visibleAfterThinkElement);
                            debugLog('Using visible-after-think element for copy content with formatting');
                        }
                        // APPROACH 2: If no visible-after-think element found, use the message content element
                        // while excluding all thinking-related elements
                        else if (messageContentElement) {
                            // Use the new htmlToFormattedText function to preserve formatting
                            contentWithoutThinking = htmlToFormattedText(messageContentElement);
                            debugLog('Using filtered message content for copy content with formatting');
                        }
                        // APPROACH 3: Fallback to regex-based extraction from originalContent if needed
                        else {
                            debugLog('Falling back to regex extraction for copy content');
                            let contentToCopy = messageEl.originalContent;

                            if (!contentToCopy) {
                                // Fallback: get content from the message content container
                                const contentContainer = messageEl.querySelector('.message-content');
                                if (contentContainer) {
                                    contentToCopy = contentContainer.innerHTML || '';
                                } else {
                                    contentToCopy = messageEl.innerHTML || '';
                                }
                            }

                            // Try to find content after the last </think> tag in the raw content
                            const lastThinkTagIndex = contentToCopy.lastIndexOf('</think>');
                            const lastEncodedThinkTagIndex = contentToCopy.lastIndexOf('&lt;/think&gt;');

                            if (lastThinkTagIndex !== -1 || lastEncodedThinkTagIndex !== -1) {
                                // Get text after the last think tag
                                let afterThinkContent;
                                if (lastThinkTagIndex > lastEncodedThinkTagIndex) {
                                    afterThinkContent = contentToCopy.substring(lastThinkTagIndex + 8).trim();
                                } else {
                                    afterThinkContent = contentToCopy.substring(lastEncodedThinkTagIndex + 14).trim();
                                }
                                // Convert HTML to formatted text
                                contentWithoutThinking = htmlToFormattedText(afterThinkContent);
                            } else {
                                // If no think tags found, copy the message but remove any think sections
                                const cleanedContent = contentToCopy
                                    .replace(/<think>[\s\S]*?<\/think>/g, '')
                                    .replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, '')
                                    .trim();
                                // Convert HTML to formatted text
                                contentWithoutThinking = htmlToFormattedText(cleanedContent);
                            }
                        }

                        // Make sure we have content to copy
                        if (!contentWithoutThinking) {
                            // Last resort: just get the visible text directly from the message content
                            if (messageContentElement) {
                                contentWithoutThinking = htmlToFormattedText(messageContentElement);
                            } else {
                                contentWithoutThinking = messageEl.textContent?.trim() || '';
                            }
                            debugLog('Using fallback content for copy');
                        }

                        // Store original button state
                        const originalHTML = copyButton.innerHTML;

                        // Only proceed if we have content to copy
                        if (!contentWithoutThinking) {
                            debugLog('No content available to copy');
                            copyButton.innerHTML = '<i class="fas fa-times"></i>';
                            setTimeout(() => {
                                copyButton.innerHTML = originalHTML;
                            }, 1000);
                            return;
                        }

                        copyToClipboard(contentWithoutThinking)
                            .then(() => {
                                // Success: Show copied feedback
                                copyButton.innerHTML = '<i class="fas fa-check" style="color: #4ade80; font-weight: 900; font-size: 14px;"></i>';
                                setTimeout(() => {
                                    copyButton.innerHTML = originalHTML;
                                }, 2500);
                            })
                            .catch((error) => {
                                // Error: Show error feedback
                                debugError('Failed to copy text:', error);
                                copyButton.innerHTML = '<i class="fas fa-times"></i>';
                                setTimeout(() => {
                                    copyButton.innerHTML = originalHTML;
                                }, 2000);
                            });
                    });
                    controlsContainer.appendChild(copyButton);

                    // Create speaker button for AI messages
                    const speakerButton = document.createElement('button');
                    speakerButton.classList.add(
                        'speaker-btn',
                        'flex',
                        'items-center',
                        'hover:text-green-400',
                        'transition-colors',
                        'duration-300'
                    );
                    speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                    speakerButton.title = 'Read this message aloud';
                    speakerButton.addEventListener('click', async () => {
                        // Get the message content for TTS
                        let textToSpeak = '';

                        // Try to get content without thinking tags (same logic as copy button)
                        const messageContentElement = messageEl.querySelector('.message-content');
                        const visibleAfterThinkElement = messageContentElement?.querySelector('.visible-after-think');

                        if (visibleAfterThinkElement && visibleAfterThinkElement.textContent.trim()) {
                            textToSpeak = visibleAfterThinkElement.textContent.trim();
                        } else if (messageContentElement) {
                            // Get text content, excluding thinking elements
                            const thinkingElements = messageContentElement.querySelectorAll('.think, .thinking-indicator');
                            const clonedElement = messageContentElement.cloneNode(true);
                            thinkingElements.forEach(el => {
                                const clonedThinking = clonedElement.querySelector('.think, .thinking-indicator');
                                if (clonedThinking) clonedThinking.remove();
                            });
                            textToSpeak = clonedElement.textContent.trim();
                        } else {
                            // Fallback to original content processing
                            let contentToCopy = messageEl.originalContent || '';
                            const lastThinkTagIndex = contentToCopy.lastIndexOf('</think>');
                            const lastEncodedThinkTagIndex = contentToCopy.lastIndexOf('&lt;/think&gt;');

                            if (lastThinkTagIndex !== -1 || lastEncodedThinkTagIndex !== -1) {
                                if (lastThinkTagIndex > lastEncodedThinkTagIndex) {
                                    textToSpeak = contentToCopy.substring(lastThinkTagIndex + 8).trim();
                                } else {
                                    textToSpeak = contentToCopy.substring(lastEncodedThinkTagIndex + 14).trim();
                                }
                            } else {
                                textToSpeak = contentToCopy
                                    .replace(/<think>[\s\S]*?<\/think>/g, '')
                                    .replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, '')
                                    .trim();
                            }

                            // Convert HTML to plain text
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = textToSpeak;
                            textToSpeak = tempDiv.textContent || tempDiv.innerText || '';
                        }

                        // Store original button state
                        const originalHTML = speakerButton.innerHTML;

                        if (!textToSpeak) {
                            speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                            setTimeout(() => {
                                speakerButton.innerHTML = originalHTML;
                            }, 1000);
                            return;
                        }

                        try {
                            // Check if TTS service is available
                            if (window.TTSService) {
                                // Initialize TTS service if not already done
                                if (!window.TTSService.isInitialized()) {
                                    await window.TTSService.initialize();
                                }

                                // Only treat this as a stop toggle when the JS layer is still
                                // tracking an active playback request. If Android is stuck in a
                                // stale speaking state, let speak() recover it and start fresh.
                                if (window.TTSService.hasTrackedPlayback()) {
                                    window.TTSService.stop('speaker-toggle-stop', true);
                                    speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                                    speakerButton.title = 'Read this message aloud';
                                    return;
                                }

                                // Start speaking - show square stop icon
                                speakerButton.innerHTML = '<i class="fas fa-square"></i>';
                                speakerButton.title = 'Stop reading';

                                // Start TTS and set up completion handler
                                window.TTSService.speak(textToSpeak).then(() => {
                                    // Reset button when TTS actually finishes
                                    speakerButton.innerHTML = originalHTML;
                                    speakerButton.title = 'Read this message aloud';
                                }).catch(() => {
                                    // Reset button on error
                                    speakerButton.innerHTML = originalHTML;
                                    speakerButton.title = 'Read this message aloud';
                                });
                            } else {
                                // Fallback error
                                speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                                setTimeout(() => {
                                    speakerButton.innerHTML = originalHTML;
                                }, 2000);
                            }
                        } catch (error) {
                            console.error('TTS Error:', error);
                            speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                            setTimeout(() => {
                                speakerButton.innerHTML = originalHTML;
                            }, 2000);
                        }
                    });
                    controlsContainer.appendChild(speakerButton);

                    // Create regenerate button
                    const regenerateButton = document.createElement('button');
                    regenerateButton.classList.add(
                        'regenerate-btn',
                        'flex',
                        'items-center',
                        'hover:text-blue-400',
                        'transition-colors',
                        'duration-300'
                    );
                    regenerateButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
                    regenerateButton.title = 'Regenerate this response';
                    regenerateButton.dataset.action = 'regenerate';
                    regenerateButton.setAttribute('role', 'button');
                    regenerateButton.setAttribute('aria-label', 'Regenerate response');
                    controlsContainer.appendChild(regenerateButton);

                    messageEl.appendChild(controlsContainer);
                }
            }
        }
    });

    // Now handle user messages to ensure they have edit buttons
    const userMessages = messagesContainer.querySelectorAll('.user');
    userMessages.forEach(messageEl => {
        if (messageEl.originalContent) {
            // Ensure the content container exists and has the right content
            let contentContainer = messageEl.querySelector('.message-content');
            if (!contentContainer) {
                // Create a new content container if it doesn't exist
                contentContainer = document.createElement('div');
                contentContainer.classList.add('message-content');
                contentContainer.innerHTML = basicSanitizeInput(messageEl.originalContent);

                // Clear the message element and add the content container
                messageEl.innerHTML = '';
                messageEl.appendChild(contentContainer);
            }

            // Initialize code blocks if needed
            initializeCodeMirror(messageEl);

            // Check if there are message controls already
            let controlsContainer = messageEl.querySelector('.message-controls');
            if (!controlsContainer) {
                // Create message controls container
                controlsContainer = document.createElement('div');
                controlsContainer.classList.add('message-controls', 'mt-2', 'flex', 'justify-end', 'text-xs', 'text-gray-400', 'space-x-2');

                // Create edit button
                const editButton = document.createElement('button');
                editButton.classList.add('edit-btn', 'flex', 'items-center', 'hover:text-blue-400', 'transition-colors', 'duration-300');
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                editButton.title = 'Edit this message';
                editButton.dataset.action = 'edit';
                editButton.setAttribute('role', 'button');
                editButton.setAttribute('aria-label', 'Edit message');

                // Add the edit button to the controls container
                controlsContainer.appendChild(editButton);

                // Create delete button
                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-btn', 'flex', 'items-center', 'hover:text-red-400', 'transition-colors', 'duration-300');
                deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                deleteButton.title = 'Delete this message';
                deleteButton.dataset.action = 'delete';
                deleteButton.setAttribute('role', 'button');
                deleteButton.setAttribute('aria-label', 'Delete message');

                // Add the delete button to the controls container
                controlsContainer.appendChild(deleteButton);

                // Add the controls container to the message
                messageEl.appendChild(controlsContainer);
            } else {
                // Ensure the edit button exists in the controls container
                if (!controlsContainer.querySelector('.edit-btn')) {
                    const editButton = document.createElement('button');
                    editButton.classList.add('edit-btn', 'flex', 'items-center', 'hover:text-blue-400', 'transition-colors', 'duration-300');
                    editButton.innerHTML = '<i class="fas fa-edit"></i>';
                    editButton.title = 'Edit this message';
                    editButton.dataset.action = 'edit';
                    editButton.setAttribute('role', 'button');
                    editButton.setAttribute('aria-label', 'Edit message');

                    // Add the edit button to the controls container
                    controlsContainer.appendChild(editButton);
                }

                // Ensure the delete button exists in the controls container
                if (!controlsContainer.querySelector('.delete-btn')) {
                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('delete-btn', 'flex', 'items-center', 'hover:text-red-400', 'transition-colors', 'duration-300');
                    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteButton.title = 'Delete this message';
                    deleteButton.dataset.action = 'delete';
                    deleteButton.setAttribute('role', 'button');
                    deleteButton.setAttribute('aria-label', 'Delete message');

                    // Add the delete button to the controls container
                    controlsContainer.appendChild(deleteButton);
                }
            }
        }
    });
}

/**
 * Removes visible think tags from messages
 */
export function removeVisibleThinkTags() {
    if (!messagesContainer) return;

    // First, handle all AI messages based on whether they're from reasoning or non-reasoning models
    const aiMessages = messagesContainer.querySelectorAll('.ai');
    aiMessages.forEach(messageEl => {
        // For non-reasoning models, make sure no thinking text is shown
        if (messageEl.dataset.hasThinking === 'false' && messageEl.originalContent) {
            // Re-apply basic sanitization to ensure no thinking text is displayed
            const contentContainer = messageEl.querySelector('.message-content');
            if (contentContainer) {
                contentContainer.innerHTML = basicSanitizeInput(messageEl.originalContent);
                initializeCodeMirror(messageEl);
            } else {
                // If no content container exists, recreate the message structure
                // This can happen during regeneration
                const controlsContainer = messageEl.querySelector('.message-controls');
                messageEl.innerHTML = '';

                // Create a new content container
                const newContentContainer = document.createElement('div');
                newContentContainer.classList.add('message-content');
                newContentContainer.innerHTML = basicSanitizeInput(messageEl.originalContent);
                messageEl.appendChild(newContentContainer);

                // Restore controls if they existed
                if (controlsContainer) {
                    messageEl.appendChild(controlsContainer);
                }

                initializeCodeMirror(messageEl);
            }
        } else if (messageEl.dataset.hasThinking === 'true' && messageEl.originalContent) {
            // For reasoning models, hide the reasoning content but keep the structure
            const contentContainer = messageEl.querySelector('.message-content');

            // If the content container doesn't exist, we need to recreate it
            if (!contentContainer) {
                // Save any existing controls
                const controlsContainer = messageEl.querySelector('.message-controls');
                messageEl.innerHTML = '';

                // Create a new content container with the processed content
                const newContentContainer = document.createElement('div');
                newContentContainer.classList.add('message-content');

                // Process the content to show only the parts outside of thinking tags
                let processedContent = messageEl.originalContent;

                // First, remove any complete <think>...</think> sections
                processedContent = processedContent.replace(/<think>[\s\S]*?<\/think>/g, '');

                // Then remove any standalone <think> or </think> tags that might remain
                processedContent = processedContent.replace(/<\/?think>/g, '');

                // Apply sanitization to the processed content
                newContentContainer.innerHTML = sanitizeInput(processedContent);
                messageEl.appendChild(newContentContainer);

                // Restore controls if they existed
                if (controlsContainer) {
                    messageEl.appendChild(controlsContainer);
                }

                initializeCodeMirror(messageEl);
            } else {
                // If the content container exists, hide the reasoning content
                const thinkContainers = messageEl.querySelectorAll('.think');
                thinkContainers.forEach(container => {
                    const reasoningContent = container.querySelector('.reasoning-content');
                    if (reasoningContent) {
                        reasoningContent.style.display = 'none';
                        // Update the toggle text
                        const toggleText = container.querySelector('.toggle-text');
                        if (toggleText) {
                            toggleText.textContent = 'Show';
                        }
                    }
                });
            }
        }
    });

    // Then handle any raw think tags that might be visible
    const allParagraphs = messagesContainer.querySelectorAll('p');
    allParagraphs.forEach(p => {
        // Check if paragraph contains raw think tags
        if (p.innerHTML.includes('&lt;think&gt;') || p.innerHTML.includes('&lt;/think&gt;')) {
            // Only remove the content between think tags, preserve content after </think>
            let content = p.innerHTML;

            // Extract content after the last </think> tag
            const afterThinkMatch = content.match(/&lt;\/think&gt;([\s\S]*)$/);
            let afterThinkContent = '';

            if (afterThinkMatch && afterThinkMatch[1]) {
                afterThinkContent = afterThinkMatch[1];
            }

            // Remove the think tags and their content
            content = content.replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, '');

            // Also remove any standalone think tags
            content = content.replace(/&lt;think&gt;/g, '');
            content = content.replace(/&lt;\/think&gt;/g, '');

            // If there was content after the </think> tag, wrap it in a visible div
            if (afterThinkContent.trim() !== '') {
                content = `<div class="visible-after-think" style="display: block !important; visibility: visible !important; opacity: 1 !important;">${afterThinkContent}</div>`;
            }

            // If the paragraph only contained think tags and nothing else, hide it
            if (content.trim() === '') {
                p.style.display = 'none';
            } else {
                p.innerHTML = content;
                p.style.display = ''; // Ensure paragraph is visible if it has content
            }
        }

        // In case the literal tags got through
        if (p.innerHTML.includes('<think>') || p.innerHTML.includes('</think>')) {
            // Only remove the content between think tags, preserve content after </think>
            let content = p.innerHTML;

            // Extract content after the last </think> tag
            const afterThinkMatch = content.match(/<\/think>([\s\S]*)$/);
            let afterThinkContent = '';

            if (afterThinkMatch && afterThinkMatch[1]) {
                afterThinkContent = afterThinkMatch[1];
            }

            // Remove the think tags and their content
            content = content.replace(/<think>[\s\S]*?<\/think>/g, '');

            // Also remove any standalone think tags
            content = content.replace(/<think>/g, '');
            content = content.replace(/<\/think>/g, '');

            // If there was content after the </think> tag, wrap it in a visible div
            if (afterThinkContent.trim() !== '') {
                content = `<div class="visible-after-think" style="display: block !important; visibility: visible !important; opacity: 1 !important;">${afterThinkContent}</div>`;
            }

            // If the paragraph only contained think tags and nothing else, hide it
            if (content.trim() === '') {
                p.style.display = 'none';
            } else {
                p.innerHTML = content;
                p.style.display = ''; // Ensure paragraph is visible if it has content
            }
        }
    });

    // Also hide any reasoning-content divs that might be visible
    const reasoningContents = messagesContainer.querySelectorAll('.reasoning-content');
    reasoningContents.forEach(content => {
        content.style.display = 'none';
        // Find the toggle text and update it
        const toggleText = content.parentElement.querySelector('.toggle-text');
        if (toggleText) {
            toggleText.textContent = 'Show';
        }
    });
}

/**
 * Ensures the welcome message is properly positioned
 */
export function ensureWelcomeMessagePosition() {
    if (welcomeMessage) {
        // Only show welcome message if there are no chat messages
        const shouldShowWelcome = !messagesContainer || messagesContainer.children.length === 0;

        if (!shouldShowWelcome) {
            // Don't make welcome message visible if there are chat messages
            return;
        }

        // Force a reflow to ensure proper positioning
        void welcomeMessage.offsetWidth;

        // Make sure welcome message is visible (only if it should be)
        welcomeMessage.style.display = 'flex';
        welcomeMessage.style.flexDirection = 'column';
        welcomeMessage.style.visibility = 'visible';
        welcomeMessage.style.opacity = '1';

        // Ensure welcome message is centered and not affected by sidebar
        welcomeMessage.style.transform = 'none';
        welcomeMessage.style.left = '0';
        welcomeMessage.style.right = '0';
        welcomeMessage.style.top = '0';
        welcomeMessage.style.bottom = '0';
        welcomeMessage.style.width = '100%';
        welcomeMessage.style.height = '100%';

        // Ensure proper alignment
        welcomeMessage.style.alignItems = 'center';
        welcomeMessage.style.justifyContent = 'flex-start';
        welcomeMessage.style.overflowY = 'auto';
        welcomeMessage.style.webkitOverflowScrolling = 'touch';

        // Prevent unwanted scrolling but allow content to be visible
        welcomeMessage.style.overflowX = 'hidden';
        welcomeMessage.style.paddingTop = '72px';
        welcomeMessage.style.paddingBottom = '140px';

        // Handle dynamic top padding for the model banner (if visible)
        const modelWrapper = document.getElementById('loaded-model-wrapper');
        const isModelVisible = modelWrapper && modelWrapper.style.display !== 'none' && !modelWrapper.classList.contains('hidden');
        if (isModelVisible) {
            const modelHeight = modelWrapper.offsetHeight || 44;
            welcomeMessage.style.paddingTop = `${modelHeight + 72}px`;
        } else {
            welcomeMessage.style.paddingTop = '72px';
        }

        // Apply robust layout to the content container
        const welcomeContent = welcomeMessage.querySelector('.welcome-content');
        if (welcomeContent) {
            // Using auto margin with flex-start parent is the most robust way to center content
            // while allowing it to flow correctly when it exceeds the viewport height.
            welcomeContent.style.margin = 'auto';
            welcomeContent.style.position = 'relative';
            welcomeContent.style.zIndex = '5';

            // Ensure consistent icon spacing regardless of screen-specific hacks
            const iconContainer = welcomeContent.querySelector('.icon-container');
            if (iconContainer) {
                iconContainer.style.marginTop = '1.5rem';
                iconContainer.style.marginBottom = '1.25rem';
                iconContainer.style.position = 'relative';
                iconContainer.style.zIndex = '10';
            }
        }
    }
}


/**
 * Checks if the welcome message should be shown (when there are no messages)
 * and shows it if needed
 */
export function checkAndShowWelcomeMessage() {
    if (messagesContainer && messagesContainer.children.length === 0) {
        showWelcomeMessage();
    }
}

// Long-press handling functions
function preventDefaultIfCancelable(e) {
    if (e && e.cancelable) {
        e.preventDefault();
    }
}

function handleTouchStart(e) {
    startLongPress(e);
}

function handleTouchEnd(e) {
    clearLongPress();
}

function handleTouchMove(e) {
    clearLongPress();
}

function handleMouseDown(e) {
    startLongPress(e);
}

function handleMouseUp(e) {
    clearLongPress();
}

function handleMouseLeave(e) {
    clearLongPress();
}

function startLongPress(e) {
    clearLongPress();
    longPressTimer = setTimeout(() => {
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            selectedText = selection.toString();
            selectedMessageElement = e.currentTarget;
            showContextMenu(e);
        }
    }, 500); // 500ms for long-press
}

function clearLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showContextMenu(e) {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        const rect = e.target.getBoundingClientRect();
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        preventDefaultIfCancelable(e);
    }
}

/**
 * Gets the selected text from long-press
 * @returns {string} - The selected text
 */
export function getSelectedText() {
    return selectedText;
}

/**
 * Gets the selected message element from long-press
 * @returns {HTMLElement} - The selected message element
 */
export function getSelectedMessageElement() {
    return selectedMessageElement;
}

/**
 * Initialize collapsible sections in the sidebar
 */
export function initializeCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');
    const chatHistorySection = document.querySelector('.sidebar-section:last-child');
    let lastCollapsibleTouchTs = 0;

    // First, ensure all sections are collapsed by default
    sectionHeaders.forEach(header => {
        setCollapsibleSectionExpanded(header, false);
    });

    // Ensure chat history is visible by default
    if (chatHistorySection) {
        chatHistorySection.classList.remove('chat-history-hidden');
    }

    sectionHeaders.forEach(header => {
        if (header.dataset.collapsibleBound === 'true') {
            return;
        }

        header.dataset.collapsibleBound = 'true';

        const toggleHeader = () => {
            // Check if this is the options section header
            const isOptionsSection = header.closest('.sidebar-section.collapsible');
            const isCharactersSection = header.closest('.sidebar-section.characters-section');
            // Get the content div
            const content = header.nextElementSibling;
            if (!content || !content.classList.contains('collapsible-content')) return;

            const shouldExpand = !content.classList.contains('show');

            setCollapsibleSectionExpanded(header, shouldExpand);

            // Handle chat history visibility for options section only
            if (isOptionsSection && chatHistorySection) {
                if (shouldExpand) {
                    // Options section is being expanded - hide chat history
                    chatHistorySection.classList.add('chat-history-hidden');
                } else {
                    // Options section is being collapsed - show chat history
                    chatHistorySection.classList.remove('chat-history-hidden');
                }
            }

            // Close other sections (but allow characters section and options section to coexist)
            sectionHeaders.forEach(otherHeader => {
                if (otherHeader !== header) {
                    const otherIsOptionsSection = otherHeader.closest('.sidebar-section.collapsible');
                    const otherIsCharactersSection = otherHeader.closest('.sidebar-section.characters-section');

                    // Only close if it's not a coexisting section
                    if (!((isOptionsSection && otherIsCharactersSection) || (isCharactersSection && otherIsOptionsSection))) {
                        setCollapsibleSectionExpanded(otherHeader, false);
                    }
                }
            });

            // Update chat history visibility based on current state
            if (chatHistorySection) {
                const optionsHeader = document.querySelector('.sidebar-section.collapsible .section-header');
                const optionsIsActive = optionsHeader && optionsHeader.classList.contains('active');

                if (optionsIsActive) {
                    chatHistorySection.classList.add('chat-history-hidden');
                } else {
                    chatHistorySection.classList.remove('chat-history-hidden');
                }
            }
        };

        header.addEventListener('click', (e) => {
            // Ignore synthetic click fired right after a touch toggle.
            if (Date.now() - lastCollapsibleTouchTs < 450) {
                preventDefaultIfCancelable(e);
                e.stopPropagation();
                return;
            }

            preventDefaultIfCancelable(e);
            e.stopPropagation();
            toggleHeader();
        });

        header.addEventListener('touchend', (e) => {
            lastCollapsibleTouchTs = Date.now();
            preventDefaultIfCancelable(e);
            e.stopPropagation();
            toggleHeader();
        }, { passive: false });
    });
}

// This function is no longer needed as the scroll-to-bottom button has been moved to the context menu
// Keeping an empty function to avoid breaking any existing code that might call it
export function adjustScrollToBottomButtonPosition() {
    // No-op function
}

/**
 * Updates the active character display in the chat interface
 * Character functionality has been removed
 */
export function updateActiveCharacterDisplay() {
    // Character functionality removed - this function is now a no-op
    return;
}

// Listen for character changes

// Dynamic header management for optimal space usage
class HeaderManager {
    constructor() {
        this.header = document.querySelector('header');
        this.titleContainer = this.header?.querySelector('.flex-shrink-0');
        this.controlsContainer = this.header?.querySelector('.header-controls');
        this.buttons = this.controlsContainer?.querySelectorAll('.header-btn') || [];
        this.resizeObserver = null;
        this.lastWidth = 0;
        this.init();
    }

    init() {
        if (!this.header || !this.titleContainer || !this.controlsContainer) return;

        // Set up resize observer for dynamic adjustments
        this.setupResizeObserver();

        // Initial check
        this.checkHeaderSpace();

        // Listen for window resize as fallback
        window.addEventListener('resize', () => {
            this.checkHeaderSpace();
        });
    }

    setupResizeObserver() {
        if ('ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target === this.header) {
                        this.checkHeaderSpace();
                    }
                }
            });
            this.resizeObserver.observe(this.header);
        }
    }

    checkHeaderSpace() {
        const headerWidth = this.header.clientWidth;
        const titleWidth = this.titleContainer.scrollWidth;
        const controlsWidth = this.controlsContainer.scrollWidth;
        const padding = 32; // Account for header padding

        const availableSpace = headerWidth - titleWidth - padding;
        const spaceNeeded = controlsWidth;

        // If controls don't fit, start hiding buttons by priority
        // But be more conservative - only hide if we're really tight on space
        if (spaceNeeded > availableSpace + 20) { // Add 20px buffer
            this.hideButtonsByPriority(availableSpace);
        } else {
            this.showAllButtons();
        }
    }

    hideButtonsByPriority(availableSpace) {
        // Create array of buttons with their priorities and widths
        const buttonData = Array.from(this.buttons).map(button => {
            const rect = button.getBoundingClientRect();
            return {
                element: button,
                priority: parseInt(button.dataset.priority) || 999,
                width: rect.width || 40
            };
        });

        // Sort by priority (lower numbers = higher priority = keep visible longer)
        buttonData.sort((a, b) => a.priority - b.priority);

        let currentWidth = 0;
        const gap = 2; // Account for gap between buttons

        // Always try to keep sidebar toggle (priority 1) and settings (priority 2) visible
        // Keep preview toggle (priority 6) visible on tablet+ screens
        buttonData.forEach(data => {
            const isEssential = data.priority <= 2; // Sidebar toggle and settings
            const isPreviewToggle = data.priority === 6;
            const isTabletOrLarger = window.innerWidth >= 768;
            const shouldKeepVisible = isEssential || (isPreviewToggle && isTabletOrLarger);
            const spaceWithGap = currentWidth + data.width + (currentWidth > 0 ? gap : 0);

            if (spaceWithGap <= availableSpace || shouldKeepVisible) {
                // Check if CSS media query is hiding this button
                const computedStyle = window.getComputedStyle(data.element);
                if (computedStyle.display !== 'none') {
                    data.element.style.display = 'flex';
                    currentWidth = spaceWithGap;
                }
            } else {
                data.element.style.display = 'none';
            }
        });
    }

    showAllButtons() {
        this.buttons.forEach(button => {
            // Only show if not hidden by CSS media queries
            const computedStyle = window.getComputedStyle(button);
            if (computedStyle.display !== 'none') {
                button.style.display = 'flex';
            }
        });
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        window.removeEventListener('resize', this.checkHeaderSpace);
    }
}

// Initialize header manager when DOM is loaded
let headerManager;

// Initialize header management
function initializeHeaderManager() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            headerManager = new HeaderManager();
        });
    } else {
        headerManager = new HeaderManager();
    }
}

// Start header management
initializeHeaderManager();

// Make functions available globally
window.adjustScrollToBottomButtonPosition = adjustScrollToBottomButtonPosition;
window.HeaderManager = HeaderManager;

/**
 * Add speaker buttons to existing AI messages that don't have them
 */
export function addSpeakerButtonsToExistingMessages() {
    if (!messagesContainer) return;

    const aiMessages = messagesContainer.querySelectorAll('.ai');
    aiMessages.forEach(messageEl => {
        const controlsContainer = messageEl.querySelector('.message-controls');
        if (controlsContainer && !controlsContainer.querySelector('.speaker-btn')) {
            // Create speaker button for existing AI messages
            const speakerButton = document.createElement('button');
            speakerButton.classList.add(
                'speaker-btn',
                'flex',
                'items-center',
                'hover:text-green-400',
                'transition-colors',
                'duration-300'
            );
            speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            speakerButton.title = 'Read this message aloud';
            speakerButton.addEventListener('click', async () => {
                // Get the message content for TTS
                let textToSpeak = '';

                // Try to get content without thinking tags (same logic as copy button)
                const messageContentElement = messageEl.querySelector('.message-content');
                const visibleAfterThinkElement = messageContentElement?.querySelector('.visible-after-think');

                if (visibleAfterThinkElement && visibleAfterThinkElement.textContent.trim()) {
                    textToSpeak = visibleAfterThinkElement.textContent.trim();
                } else if (messageContentElement) {
                    // Get text content, excluding thinking elements
                    const thinkingElements = messageContentElement.querySelectorAll('.think, .thinking-indicator');
                    const clonedElement = messageContentElement.cloneNode(true);
                    thinkingElements.forEach(el => {
                        const clonedThinking = clonedElement.querySelector('.think, .thinking-indicator');
                        if (clonedThinking) clonedThinking.remove();
                    });
                    textToSpeak = clonedElement.textContent.trim();
                } else {
                    // Fallback to original content processing
                    let contentToCopy = messageEl.originalContent || '';
                    const lastThinkTagIndex = contentToCopy.lastIndexOf('</think>');
                    const lastEncodedThinkTagIndex = contentToCopy.lastIndexOf('&lt;/think&gt;');

                    if (lastThinkTagIndex !== -1 || lastEncodedThinkTagIndex !== -1) {
                        if (lastThinkTagIndex > lastEncodedThinkTagIndex) {
                            textToSpeak = contentToCopy.substring(lastThinkTagIndex + 8).trim();
                        } else {
                            textToSpeak = contentToCopy.substring(lastEncodedThinkTagIndex + 14).trim();
                        }
                    } else {
                        textToSpeak = contentToCopy
                            .replace(/<think>[\s\S]*?<\/think>/g, '')
                            .replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, '')
                            .trim();
                    }

                    // Convert HTML to plain text
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = textToSpeak;
                    textToSpeak = tempDiv.textContent || tempDiv.innerText || '';
                }

                // Store original button state
                const originalHTML = speakerButton.innerHTML;

                if (!textToSpeak) {
                    speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                    setTimeout(() => {
                        speakerButton.innerHTML = originalHTML;
                    }, 1000);
                    return;
                }

                try {
                    // Check if TTS service is available
                    if (window.TTSService) {
                        // Initialize TTS service if not already done
                        if (!window.TTSService.isInitialized()) {
                            await window.TTSService.initialize();
                        }

                        // Only treat this as a stop toggle when the JS layer is still
                        // tracking an active playback request. If Android is stuck in a
                        // stale speaking state, let speak() recover it and start fresh.
                        if (window.TTSService.hasTrackedPlayback()) {
                            window.TTSService.stop('speaker-toggle-stop', true);
                            speakerButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                            speakerButton.title = 'Read this message aloud';
                            return;
                        }

                        // Start speaking - show square stop icon
                        speakerButton.innerHTML = '<i class="fas fa-square"></i>';
                        speakerButton.title = 'Stop reading';

                        // Start TTS and set up completion handler
                        window.TTSService.speak(textToSpeak).then(() => {
                            // Reset button when TTS actually finishes
                            speakerButton.innerHTML = originalHTML;
                            speakerButton.title = 'Read this message aloud';
                        }).catch(() => {
                            // Reset button on error
                            speakerButton.innerHTML = originalHTML;
                            speakerButton.title = 'Read this message aloud';
                        });
                    } else {
                        // Fallback error
                        speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                        setTimeout(() => {
                            speakerButton.innerHTML = originalHTML;
                        }, 2000);
                    }
                } catch (error) {
                    console.error('TTS Error:', error);
                    speakerButton.innerHTML = '<i class="fas fa-times"></i>';
                    setTimeout(() => {
                        speakerButton.innerHTML = originalHTML;
                    }, 2000);
                }
            });

            // Insert speaker button before regenerate button if it exists
            const regenerateButton = controlsContainer.querySelector('.regenerate-btn');
            if (regenerateButton) {
                controlsContainer.insertBefore(speakerButton, regenerateButton);
            } else {
                controlsContainer.appendChild(speakerButton);
            }
        }
    });
}

// Call the function to add speaker buttons to existing messages when the module loads
setTimeout(() => {
    addSpeakerButtonsToExistingMessages();
}, 100);

/**
 * Shows a loading placeholder in the smart replies bar while suggestions are being generated.
 */
export function showSmartRepliesLoading() {
    if (!smartRepliesContainer) return;

    // Clear any previous content
    smartRepliesContainer.innerHTML = '';

    // Build an animated placeholder chip
    const placeholder = document.createElement('div');
    placeholder.className = 'smart-replies-loading';
    placeholder.innerHTML =
        '<i class="fas fa-circle-notch fa-spin" style="margin-right:6px;font-size:0.8em;"></i>' +
        'Generating Smart Replies\u2026';
    placeholder.style.cssText = [
        'display:inline-flex',
        'align-items:center',
        'padding:5px 14px',
        'border-radius:9999px',
        'border:1px solid rgba(255,255,255,0.1)',
        'font-size:0.82rem',
        'color:rgba(200,200,220,0.75)',
        'white-space:nowrap',
        'flex-shrink:0',
        'pointer-events:none',
    ].join(';');

    smartRepliesContainer.appendChild(placeholder);
    smartRepliesContainer.classList.add('flex');
    smartRepliesContainer.classList.remove('hidden');
    smartRepliesContainer.style.opacity = '1';
    smartRepliesContainer.scrollLeft = 0;

    // Adjust scroll-to-bottom button position
    const scrollBtn = document.getElementById('scroll-to-bottom');
    if (scrollBtn) {
        scrollBtn.style.transition = 'margin-bottom 0.2s ease-in-out, opacity 0.3s, background-color 0.3s';
        const containerHeight = smartRepliesContainer.offsetHeight || 40;
        scrollBtn.style.marginBottom = `${containerHeight + 12}px`;
    }
}

/**
 * Renders smart reply chips above the chat input
 * @param {string[]} replies - Array of string replies to suggest
 */
export function renderSmartReplies(replies) {
    if (!smartRepliesContainer || !replies || replies.length === 0) {
        hideSmartReplies();
        return;
    }

    // Clear container
    smartRepliesContainer.innerHTML = '';

    replies.forEach(reply => {
        if (!reply.trim()) return;

        const btn = document.createElement('button');
        btn.className = 'px-3 py-1.5 bg-darkTertiary hover:bg-darkHover text-gray-200 text-sm rounded-full border border-gray-600/50 transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] flex-shrink-0';
        btn.textContent = reply.trim();
        btn.title = reply.trim();

        btn.addEventListener('click', () => {
            if (userInput) {
                // Remove placeholder and set value
                userInput.value = reply.trim();

                // Trigger input event to resize textarea if needed
                userInput.dispatchEvent(new Event('input', { bubbles: true }));

                // Keep focus on input
                userInput.focus();

                // Trigger auto-send since it's a "quick reply"
                if (sendButton && !sendButton.classList.contains('hidden') && !sendButton.disabled) {
                    sendButton.click();
                }
            }

            // Hide the suggestions after clicking
            hideSmartReplies();
        });

        smartRepliesContainer.appendChild(btn);
    });

    // Show container
    if (smartRepliesContainer.children.length > 0) {
        smartRepliesContainer.classList.add('flex');
        smartRepliesContainer.classList.remove('hidden');
        // Add minimal animation
        smartRepliesContainer.style.opacity = '0';
        requestAnimationFrame(() => {
            smartRepliesContainer.style.transition = 'opacity 0.2s ease-in-out';
            smartRepliesContainer.style.opacity = '1';

            // Always reset horizontal scroll to the start so the first suggestion is fully visible
            smartRepliesContainer.scrollLeft = 0;

            // Adjust scroll-to-bottom button position to prevent overlap
            const scrollBtn = document.getElementById('scroll-to-bottom');
            if (scrollBtn) {
                // Ensure transition for smooth movement
                scrollBtn.style.transition = 'margin-bottom 0.2s ease-in-out, opacity 0.3s, background-color 0.3s';

                // Set margin-bottom to avoid overlap, using container height + padding
                const containerHeight = smartRepliesContainer.offsetHeight || 0;
                scrollBtn.style.marginBottom = `${containerHeight + 12}px`;
            }
        });
    }
}

/**
 * Hides the smart replies container
 */
export function hideSmartReplies() {
    if (smartRepliesContainer) {
        smartRepliesContainer.classList.remove('flex');
        smartRepliesContainer.classList.add('hidden');
        smartRepliesContainer.innerHTML = '';

        // Reset scroll-to-bottom button position
        const scrollBtn = document.getElementById('scroll-to-bottom');
        if (scrollBtn) {
            scrollBtn.style.transition = 'margin-bottom 0.2s ease-in-out, opacity 0.3s, background-color 0.3s';
            scrollBtn.style.marginBottom = '0px';
        }
    }
}
