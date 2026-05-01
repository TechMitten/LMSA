/**
 * Web Search Warning Modal
 * Warns users that enabling Web Search shares derived search queries with a third-party API
 */

export const webSearchWarningModal = `
    <!-- Web Search Warning Modal -->
    <div id="web-search-warning-modal"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm items-center justify-center hidden modal-container"
        style="z-index: 9999;"
        aria-labelledby="web-search-warning-title" role="dialog" aria-modal="true">
        <div
            class="p-6 rounded-xl shadow-2xl modal-content overflow-hidden"
            style="background: linear-gradient(to bottom, #0f1a2e, #1a2a3e); border: 1px solid rgba(59,130,246,0.35); width: 420px; max-width: 90%;">
            <div class="flex justify-between items-center mb-4">
                <h2 id="web-search-warning-title" class="text-xl font-bold flex items-center">
                    <div
                        class="mr-3 flex items-center justify-center rounded-full w-10 h-10"
                        style="background: rgba(59,130,246,0.12); color: #60a5fa;">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <span style="color: #cbd5e1;">Enable Web Search</span>
                </h2>
                <button id="close-web-search-warning-modal"
                    class="web-search-close-btn rounded-full w-8 h-8 flex items-center justify-center"
                    style="background: transparent; border: none; color: #9ca3af; cursor: pointer; outline: none;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <div
                    class="p-4 rounded-lg mb-4"
                    style="background: rgba(51,65,85,0.3); border: 1px solid rgba(59,130,246,0.2);">
                    <p class="text-gray-300 mb-3">Web Search augments the AI with real-time web knowledge.</p>
                    <p class="text-sm font-semibold mb-2" style="color: #cbd5e1;">Privacy Warning:</p>
                    <ul class="text-sm ml-4" style="color: #d1d5db; list-style: none; padding: 0;">
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #60a5fa; flex-shrink: 0;"></i>
                            <span>A focused search query derived from your prompt will be shared with a 3rd party API</span>
                        </li>
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #60a5fa; flex-shrink: 0;"></i>
                            <span>This reduces strict local privacy for messages while enabled</span>
                        </li>
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #60a5fa; flex-shrink: 0;"></i>
                            <span>Only the relevant queries, not full chat histories, are sent</span>
                        </li>
                    </ul>
                    <p class="text-gray-400 text-xs mt-3 italic">The feature can be disabled at any time in settings.</p>
                </div>
            </div>

            <div class="mb-5 flex items-center px-1">
                <input type="checkbox" id="dont-show-web-search-warning" class="w-4 h-4 text-blue-600 rounded bg-gray-700 border-gray-600 focus:ring-blue-500" style="cursor: pointer;">
                <label for="dont-show-web-search-warning" class="ml-2 text-sm font-medium text-gray-300" style="cursor: pointer;">Don't show this warning again</label>
            </div>

            <div class="flex justify-center">
                <button id="confirm-web-search-warning"
                    class="web-search-confirm-btn w-full px-4 rounded-lg text-white shadow-lg font-semibold"
                    style="background: linear-gradient(to right, #3b82f6, #2563eb); border: none; padding-top: 10px; padding-bottom: 10px; cursor: pointer;">
                    <i class="fas fa-check mr-2"></i>I Understand
                </button>
            </div>
        </div>
    </div>
`;

// Global callback for user confirmation
let confirmationCallback = null;
const WEB_SEARCH_WARNING_ANIMATION_MS = 180;

let webSearchCloseTimer = null;
let webSearchIsClosing = false;

/**
 * Initializes the Web Search Warning Modal
 */
export function initWebSearchWarningModal() {
    const initialize = () => {
        const modal = document.getElementById('web-search-warning-modal');
        if (!modal) {
            console.error('Web Search Warning Modal not found in DOM');
            return false;
        }

        const closeButton = document.getElementById('close-web-search-warning-modal');
        const confirmButton = document.getElementById('confirm-web-search-warning');
        const content = modal.querySelector('.modal-content');

        modal.style.transition = `opacity ${WEB_SEARCH_WARNING_ANIMATION_MS}ms ease`;
        if (content) {
            content.style.transition = `opacity ${WEB_SEARCH_WARNING_ANIMATION_MS}ms ease, transform ${WEB_SEARCH_WARNING_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        }

        // Function to close modal
        const closeModal = () => {
            if (webSearchIsClosing || modal.classList.contains('hidden')) {
                return;
            }

            webSearchIsClosing = true;
            modal.style.opacity = '0';
            if (content) {
                content.style.opacity = '0';
                content.style.transform = 'translateY(8px) scale(0.98)';
            }

            if (webSearchCloseTimer) {
                clearTimeout(webSearchCloseTimer);
            }

            webSearchCloseTimer = setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                confirmationCallback = null;
                webSearchIsClosing = false;
                webSearchCloseTimer = null;
            }, WEB_SEARCH_WARNING_ANIMATION_MS);
        };

        // Close button handler
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        // Confirm button handler
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                const dontShowCheckbox = document.getElementById('dont-show-web-search-warning');
                if (dontShowCheckbox && dontShowCheckbox.checked) {
                    localStorage.setItem('hideWebSearchWarning', 'true');
                }

                if (confirmationCallback) {
                    confirmationCallback();
                }
                closeModal();
            });
        }

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });

        return true;
    };

    // Try to initialize immediately
    if (!initialize()) {
        setTimeout(() => {
            initialize();
        }, 100);
    }
}

/**
 * Shows the Web Search Warning Modal
 * @param {Function} callback - Function to execute when user confirms
 */
export function showWebSearchWarningModal(callback) {
    const modal = document.getElementById('web-search-warning-modal');
    if (!modal) {
        console.error('Web Search Warning Modal not found in DOM when trying to show');
        return;
    }

    // Store the callback for confirmation
    confirmationCallback = callback;

    // Use setTimeout to ensure proper z-index stacking
    setTimeout(() => {
        if (webSearchCloseTimer) {
            clearTimeout(webSearchCloseTimer);
            webSearchCloseTimer = null;
        }
        webSearchIsClosing = false;

        const content = modal.querySelector('.modal-content');

        modal.style.opacity = '0';
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(8px) scale(0.98)';
        }

        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Force a reflow to ensure the modal is rendered properly
        modal.offsetHeight;

        // Ensure z-index is applied
        modal.style.zIndex = '9999';

        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            if (content) {
                content.style.opacity = '1';
                content.style.transform = 'translateY(0) scale(1)';
            }
        });
    }, 50);
}
