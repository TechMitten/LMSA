/**
 * Smart Reply Warning Modal
 * Warns users that Smart Reply feature effectiveness varies by LLM model
 */

export const smartReplyWarningModal = `
    <!-- Smart Reply Warning Modal -->
    <div id="smart-reply-warning-modal"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm items-center justify-center hidden modal-container"
        style="z-index: 9999;"
        aria-labelledby="smart-reply-warning-title" role="dialog" aria-modal="true">
        <div
            class="p-6 rounded-xl shadow-2xl modal-content overflow-hidden"
            style="background: linear-gradient(to bottom, #2d1a0a, #3d2a0a); border: 1px solid rgba(120,53,15,0.4); width: 420px; max-width: 90%;">
            <div class="flex justify-between items-center mb-4">
                <h2 id="smart-reply-warning-title" class="text-xl font-bold flex items-center">
                    <div
                        class="mr-3 flex items-center justify-center rounded-full w-10 h-10"
                        style="background: rgba(245,158,11,0.2); color: #fbbf24;">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <span style="color: #fbbf24;">Enable Smart Reply</span>
                </h2>
                <button id="close-smart-reply-warning-modal"
                    class="smart-reply-close-btn rounded-full w-8 h-8 flex items-center justify-center"
                    style="background: transparent; border: none; color: #9ca3af; cursor: pointer; outline: none;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <div
                    class="p-4 rounded-lg mb-4"
                    style="background: rgba(120,53,15,0.25); border: 1px solid rgba(146,64,14,0.35);">
                    <p class="text-gray-300 mb-3">Smart Reply provides AI-suggested responses based on conversation context.</p>
                    <p class="text-sm font-semibold mb-2" style="color: #fcd34d;">Please note:</p>
                    <ul class="text-sm ml-4" style="color: #fde68a; list-style: none; padding: 0;">
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #fcd34d; flex-shrink: 0;"></i>
                            <span>This feature may not work with all LLM models</span>
                        </li>
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #fcd34d; flex-shrink: 0;"></i>
                            <span>Quality and relevance of suggestions will vary</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #fcd34d; flex-shrink: 0;"></i>
                            <span>Some models may not generate useful suggestions</span>
                        </li>
                    </ul>
                    <p class="text-gray-400 text-xs mt-3 italic">The feature can be disabled at any time in settings.</p>
                </div>
            </div>

            <div class="flex justify-center">
                <button id="confirm-smart-reply-warning"
                    class="smart-reply-confirm-btn w-full px-4 rounded-lg text-white shadow-lg font-semibold"
                    style="background: linear-gradient(to right, #b45309, #d97706); border: none; padding-top: 10px; padding-bottom: 10px; cursor: pointer;">
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
