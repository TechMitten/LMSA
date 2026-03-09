/**
 * Smart Reply Warning Modal
 * Warns users that Smart Reply feature effectiveness varies by LLM model
 */

export const smartReplyWarningModal = `
    <!-- Smart Reply Warning Modal -->
    <div id="smart-reply-warning-modal"
        class="fixed inset-0 bg-black/80 dark:bg-black/80 light:bg-gray-900/50 backdrop-blur-sm items-center justify-center hidden modal-container z-[9999]"
        aria-labelledby="smart-reply-warning-title" role="dialog" aria-modal="true">
        <div
            class="bg-gradient-to-b from-amber-950/95 to-amber-900/95 dark:from-[#2d1a0a] dark:to-[#3d2a0a] light:from-amber-50 light:to-amber-100 p-6 rounded-xl w-[420px] max-w-[90%] shadow-2xl modal-content border border-amber-900/30 dark:border-amber-900/30 light:border-amber-200 overflow-hidden">
            <div class="flex justify-between items-center mb-4">
                <h2 id="smart-reply-warning-title" class="text-xl font-bold flex items-center">
                    <div
                        class="icon-wrapper mr-3 flex items-center justify-center rounded-full bg-amber-500/20 dark:bg-amber-500/20 light:bg-amber-500/10 w-10 h-10 text-amber-400 dark:text-amber-400 light:text-amber-600">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300 dark:from-amber-400 dark:to-amber-300 light:from-amber-600 light:to-amber-700">Enable
                        Smart Reply</span>
                </h2>
                <button id="close-smart-reply-warning-modal"
                    class="text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white light:text-gray-600 light:hover:text-gray-800 focus:outline-none rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <div
                    class="p-4 rounded-lg bg-amber-900/20 dark:bg-amber-900/20 light:bg-amber-100/80 border border-amber-800/30 dark:border-amber-800/30 light:border-amber-300 mb-4">
                    <p class="text-gray-300 dark:text-gray-300 light:text-black mb-3">Smart Reply provides AI-suggested responses based on conversation context.</p>
                    <p class="text-amber-300 dark:text-amber-300 light:text-black text-sm font-semibold mb-2">Please note:</p>
                    <ul class="text-amber-200 dark:text-amber-200 light:text-black text-sm space-y-1.5 ml-4">
                        <li class="flex items-start">
                            <i class="fas fa-circle mt-1.5 mr-2 text-[6px] text-amber-300 dark:text-amber-300 light:text-amber-600"></i>
                            <span>This feature may not work with all LLM models</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-circle mt-1.5 mr-2 text-[6px] text-amber-300 dark:text-amber-300 light:text-amber-600"></i>
                            <span>Quality and relevance of suggestions will vary</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-circle mt-1.5 mr-2 text-[6px] text-amber-300 dark:text-amber-300 light:text-amber-600"></i>
                            <span>Some models may not generate useful suggestions</span>
                        </li>
                    </ul>
                    <p class="text-gray-400 dark:text-gray-400 light:text-gray-600 text-xs mt-3 italic">The feature can be disabled at any time in settings.</p>
                </div>
            </div>

            <div class="flex justify-center">
                <button id="confirm-smart-reply-warning"
                    class="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 dark:from-amber-700 dark:to-amber-600 dark:hover:from-amber-600 dark:hover:to-amber-500 light:from-amber-600 light:to-amber-500 light:hover:from-amber-500 light:hover:to-amber-400 text-white shadow-lg hover:shadow-amber-500/20 font-semibold">
                    <i class="fas fa-check mr-2"></i>I Understand
                </button>
            </div>
        </div>
    </div>
`;

// Global callback for user confirmation
let confirmationCallback = null;

/**
 * Initializes the Smart Reply Warning Modal
 */
export function initSmartReplyWarningModal() {
    // Wait for DOM to be ready if needed
    const initialize = () => {
        const modal = document.getElementById('smart-reply-warning-modal');
        if (!modal) {
            console.error('Smart Reply Warning Modal not found in DOM');
            return false;
        }

        const closeButton = document.getElementById('close-smart-reply-warning-modal');
        const confirmButton = document.getElementById('confirm-smart-reply-warning');

        console.log('Initializing Smart Reply Warning Modal...');

        // Function to close modal
        const closeModal = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            confirmationCallback = null;
            console.log('Smart Reply Warning Modal closed');
        };

        // Close button handler
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        } else {
            console.error('Close button not found for Smart Reply Warning Modal');
        }

        // Confirm button handler
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                console.log('Smart Reply Warning confirmed');
                // Execute callback if it exists
                if (confirmationCallback) {
                    console.log('Executing confirmation callback');
                    confirmationCallback();
                } else {
                    console.warn('No confirmation callback to execute');
                }
                closeModal();
            });
        } else {
            console.error('Confirm button not found for Smart Reply Warning Modal');
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

        console.log('Smart Reply Warning Modal initialized successfully');
        return true;
    };

    // Try to initialize immediately
    if (!initialize()) {
        // If modal not found, try again after a short delay
        console.warn('Smart Reply Warning Modal not ready, retrying...');
        setTimeout(() => {
            if (!initialize()) {
                console.error('Failed to initialize Smart Reply Warning Modal after retry');
            }
        }, 100);
    }
}

/**
 * Shows the Smart Reply Warning Modal
 * @param {Function} callback - Function to execute when user confirms
 */
export function showSmartReplyWarningModal(callback) {
    const modal = document.getElementById('smart-reply-warning-modal');
    if (!modal) {
        console.error('Smart Reply Warning Modal not found in DOM when trying to show');
        return;
    }

    // Store the callback for confirmation
    confirmationCallback = callback;

    console.log('Showing Smart Reply Warning Modal');

    // Use setTimeout to ensure proper z-index stacking
    setTimeout(() => {
        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Force a reflow to ensure the modal is rendered properly
        modal.offsetHeight;

        // Ensure z-index is applied
        modal.style.zIndex = '9999';

        console.log('Smart Reply Warning Modal is now visible with z-index:', modal.style.zIndex);
    }, 50);
}
