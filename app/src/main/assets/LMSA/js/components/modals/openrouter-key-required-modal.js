/**
 * OpenRouter Key Required Modal
 * Advises users that they need to add an OpenRouter API key to use the feature.
 * Offers Cancel (disable OpenRouter) and Later (close modal and come back) options.
 */

export const openRouterKeyRequiredModal = `
    <!-- OpenRouter Key Required Modal -->
    <div id="openrouter-key-required-modal"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm items-center justify-center hidden modal-container"
        style="z-index: 9999;"
        aria-labelledby="openrouter-key-required-title" role="dialog" aria-modal="true">
        <div
            class="p-6 rounded-xl shadow-2xl modal-content overflow-hidden"
            style="background: linear-gradient(to bottom, #0f1a2e, #1a2a3e); border: 1px solid rgba(59,130,246,0.35); width: 440px; max-width: 92%;">
            <div class="flex justify-between items-center mb-4">
                <h2 id="openrouter-key-required-title" class="text-xl font-bold flex items-center">
                    <div
                        class="mr-3 flex items-center justify-center rounded-full w-10 h-10"
                        style="background: rgba(59,130,246,0.2); color: #60a5fa;">
                        <i class="fas fa-key"></i>
                    </div>
                    <span style="color: #60a5fa;">API Key Required</span>
                </h2>
                <button id="close-openrouter-key-required-modal"
                    class="openrouter-key-required-close-btn rounded-full w-8 h-8 flex items-center justify-center"
                    style="background: transparent; border: none; color: #9ca3af; cursor: pointer; outline: none;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <div
                    class="p-4 rounded-lg"
                    style="background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3);">
                    <p class="text-gray-300 mb-3">
                        To use <strong style="color: #93c5fd;">OpenRouter</strong>, you need to add your API key in the connection settings.
                    </p>
                    <p class="text-sm text-gray-400 mb-3">
                        <i class="fas fa-info-circle mr-2" style="color: #60a5fa;"></i>
                        You can add the key now or come back to settings later to configure it.
                    </p>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="cancel-openrouter-key-required"
                    class="flex-1 px-4 rounded-lg font-semibold"
                    style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding-top: 10px; padding-bottom: 10px; cursor: pointer;">
                    <i class="fas fa-times mr-2"></i>Cancel (Disable)
                </button>
                <button id="confirm-openrouter-key-required"
                    class="flex-1 px-4 rounded-lg text-white shadow-lg font-semibold"
                    style="background: linear-gradient(to right, #1e40af, #3b82f6); border: none; padding-top: 10px; padding-bottom: 10px; cursor: pointer;">
                    <i class="fas fa-clock mr-2"></i>Later
                </button>
            </div>
        </div>
    </div>
`;

// Callback invoked when the user clicks "Cancel (Disable)"
let cancellationCallback = null;
// Callback invoked when the user clicks "Later"
let laterCallback = null;

/**
 * Initializes the OpenRouter Key Required Modal event listeners.
 */
export function initOpenRouterKeyRequiredModal() {
    const initialize = () => {
        const modal = document.getElementById('openrouter-key-required-modal');
        if (!modal) {
            console.error('OpenRouter Key Required Modal not found in DOM');
            return false;
        }

        const closeButton   = document.getElementById('close-openrouter-key-required-modal');
        const cancelButton  = document.getElementById('cancel-openrouter-key-required');
        const laterButton   = document.getElementById('confirm-openrouter-key-required');

        console.log('Initializing OpenRouter Key Required Modal...');

        const closeModal = (action) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            
            if (action === 'cancel' && cancellationCallback) {
                cancellationCallback();
            } else if (action === 'later' && laterCallback) {
                laterCallback();
            }
            
            cancellationCallback = null;
            laterCallback = null;
        };

        if (closeButton) {
            closeButton.addEventListener('click', () => closeModal('later'));
        }
        if (cancelButton) {
            cancelButton.addEventListener('click', () => closeModal('cancel'));
        }
        if (laterButton) {
            laterButton.addEventListener('click', () => closeModal('later'));
        }

        // Close on backdrop click (treated as later)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal('later');
        });

        // ESC key (treated as later)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal('later');
            }
        });

        console.log('OpenRouter Key Required Modal initialized successfully');
        return true;
    };

    if (!initialize()) {
        console.warn('OpenRouter Key Required Modal not ready, retrying...');
        setTimeout(() => {
            if (!initialize()) {
                console.error('Failed to initialize OpenRouter Key Required Modal after retry');
            }
        }, 100);
    }
}

/**
 * Shows the OpenRouter Key Required Modal.
 * @param {Function} onCancel - Called when the user clicks "Cancel (Disable)" to disable OpenRouter
 * @param {Function} onLater  - Called when the user clicks "Later" to close the modal
 */
export function showOpenRouterKeyRequiredModal(onCancel, onLater) {
    const modal = document.getElementById('openrouter-key-required-modal');
    if (!modal) {
        console.error('OpenRouter Key Required Modal not found in DOM when trying to show');
        return;
    }

    cancellationCallback = onCancel || null;
    laterCallback = onLater || null;

    console.log('Showing OpenRouter Key Required Modal');

    setTimeout(() => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.offsetHeight; // force reflow
        modal.style.zIndex = '9999';
    }, 50);
}
