/**
 * OpenRouter Warning Modal
 * Warns users that OpenRouter is a third-party cloud API and that
 * chats are transmitted externally and subject to OpenRouter's terms of service.
 */

export const openRouterWarningModal = `
    <!-- OpenRouter Warning Modal -->
    <div id="openrouter-warning-modal"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm items-center justify-center hidden modal-container"
        style="z-index: 9999;"
        aria-labelledby="openrouter-warning-title" role="dialog" aria-modal="true">
        <div
            class="p-6 rounded-xl shadow-2xl modal-content overflow-hidden"
            style="background: linear-gradient(to bottom, #0f1a2e, #1a2a3e); border: 1px solid rgba(59,130,246,0.35); width: 440px; max-width: 92%;">
            <div class="flex justify-between items-center mb-4">
                <h2 id="openrouter-warning-title" class="text-xl font-bold flex items-center">
                    <div
                        class="mr-3 flex items-center justify-center rounded-full w-10 h-10"
                        style="background: rgba(59,130,246,0.12); color: #60a5fa;">
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <span style="color: #cbd5e1;">Third-Party Cloud Service</span>
                </h2>
                <button id="close-openrouter-warning-modal"
                    class="openrouter-warning-close-btn rounded-full w-8 h-8 flex items-center justify-center"
                    style="background: transparent; border: none; color: #9ca3af; cursor: pointer; outline: none;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <div
                    class="p-4 rounded-lg mb-4"
                    style="background: rgba(51,65,85,0.3); border: 1px solid rgba(59,130,246,0.2);">
                    <p class="text-gray-300 mb-3">
                        <strong style="color: #e2e8f0;">OpenRouter</strong> is a <strong style="color: #e2e8f0;">third-party cloud AI provider</strong> and is not affiliated with this app.
                    </p>
                    <p class="text-sm font-semibold mb-2" style="color: #cbd5e1;">Please be aware:</p>
                    <ul class="text-sm ml-1" style="color: #d1d5db; list-style: none; padding: 0;">
                        <li class="flex items-start mb-3">
                            <i class="fas fa-cloud-upload-alt mr-3" style="margin-top: 3px; color: #60a5fa; flex-shrink: 0;"></i>
                            <span>Your chat messages will be <strong>sent to OpenRouter's servers</strong> and are subject to their data handling practices, not the privacy rules that apply to local AI models.</span>
                        </li>
                        <li class="flex items-start mb-3">
                            <i class="fas fa-user-shield mr-3" style="margin-top: 3px; color: #60a5fa; flex-shrink: 0;"></i>
                            <span>Local AI models keep all conversations <strong>on your device</strong>. OpenRouter does not provide the same privacy guarantees.</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-file-contract mr-3" style="margin-top: 3px; color: #60a5fa; flex-shrink: 0;"></i>
                            <span>By enabling this option, you agree to comply with <strong>OpenRouter's Terms of Service</strong> and acknowledge that your chats may be processed by their systems.</span>
                        </li>
                    </ul>
                    <p class="text-gray-400 text-xs mt-3 italic">You can disable OpenRouter at any time in settings to return to local AI.</p>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="cancel-openrouter-warning"
                    class="flex-1 px-4 rounded-lg font-semibold"
                    style="background: rgba(75,85,99,0.4); border: 1px solid rgba(107,114,128,0.5); color: #d1d5db; padding-top: 10px; padding-bottom: 10px; cursor: pointer; transition: all 0.2s ease;"
                    onmouseover="this.style.background='rgba(75,85,99,0.6)'; this.style.borderColor='rgba(107,114,128,0.7)';"
                    onmouseout="this.style.background='rgba(75,85,99,0.4)'; this.style.borderColor='rgba(107,114,128,0.5)';">
                    <i class="fas fa-times mr-2"></i>Cancel
                </button>
                <button id="confirm-openrouter-warning"
                    class="flex-1 px-4 rounded-lg text-white shadow-lg font-semibold"
                    style="background: linear-gradient(to right, #3b82f6, #1e40af); border: none; padding-top: 10px; padding-bottom: 10px; cursor: pointer; transition: all 0.2s ease;"
                    onmouseover="this.style.boxShadow='0 8px 16px rgba(59, 130, 246, 0.3)'; this.style.transform='translateY(-2px)';"
                    onmouseout="this.style.boxShadow=''; this.style.transform='';">
                    <i class="fas fa-check mr-2"></i>I Understand &amp; Accept
                </button>
            </div>
        </div>
    </div>
`;

// Callback invoked when the user confirms
let confirmationCallback = null;
// Callback invoked when the user cancels / dismisses
let cancellationCallback = null;

/**
 * Initializes the OpenRouter Warning Modal event listeners.
 */
export function initOpenRouterWarningModal() {
    const initialize = () => {
        const modal = document.getElementById('openrouter-warning-modal');
        if (!modal) {
            console.error('OpenRouter Warning Modal not found in DOM');
            return false;
        }

        const closeButton   = document.getElementById('close-openrouter-warning-modal');
        const cancelButton  = document.getElementById('cancel-openrouter-warning');
        const confirmButton = document.getElementById('confirm-openrouter-warning');

        console.log('Initializing OpenRouter Warning Modal...');

        const closeModal = (confirmed) => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            if (confirmed && confirmationCallback) {
                confirmationCallback();
            } else if (!confirmed && cancellationCallback) {
                cancellationCallback();
            }
            confirmationCallback = null;
            cancellationCallback = null;
        };

        if (closeButton) {
            closeButton.addEventListener('click', () => closeModal(false));
        }
        if (cancelButton) {
            cancelButton.addEventListener('click', () => closeModal(false));
        }
        if (confirmButton) {
            confirmButton.addEventListener('click', () => closeModal(true));
        }

        // Close on backdrop click (treated as cancel)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(false);
        });

        // ESC key (treated as cancel)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal(false);
            }
        });

        console.log('OpenRouter Warning Modal initialized successfully');
        return true;
    };

    if (!initialize()) {
        console.warn('OpenRouter Warning Modal not ready, retrying...');
        setTimeout(() => {
            if (!initialize()) {
                console.error('Failed to initialize OpenRouter Warning Modal after retry');
            }
        }, 100);
    }
}

/**
 * Shows the OpenRouter Warning Modal.
 * @param {Function} onConfirm  - Called when the user clicks "I Understand & Accept"
 * @param {Function} onCancel   - Called when the user dismisses or cancels
 */
export function showOpenRouterWarningModal(onConfirm, onCancel) {
    const modal = document.getElementById('openrouter-warning-modal');
    if (!modal) {
        console.error('OpenRouter Warning Modal not found in DOM when trying to show');
        return;
    }

    confirmationCallback = onConfirm || null;
    cancellationCallback = onCancel  || null;

    console.log('Showing OpenRouter Warning Modal');

    setTimeout(() => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.offsetHeight; // force reflow
        modal.style.zIndex = '9999';
    }, 50);
}
