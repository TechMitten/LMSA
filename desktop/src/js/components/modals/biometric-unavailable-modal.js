/**
 * Biometric Unavailable Modal
 * Informs users that biometric authentication is not available and how to set it up
 */

let biometricUnavailableHideTimer = null;

function closeBiometricUnavailableModal(modal) {
    if (!modal) {
        return;
    }

    if (biometricUnavailableHideTimer) {
        clearTimeout(biometricUnavailableHideTimer);
        biometricUnavailableHideTimer = null;
    }

    modal.classList.remove('show');
    modal.classList.add('hide');

    biometricUnavailableHideTimer = setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('hide');
        modal.classList.remove('flex');
        biometricUnavailableHideTimer = null;
        console.log('Biometric Unavailable Modal closed');
    }, 400);
}

export const biometricUnavailableModal = `
    <!-- Biometric Unavailable Modal -->
    <div id="biometric-unavailable-modal"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm items-center justify-center hidden modal-container"
        style="z-index: 9999;"
        aria-labelledby="biometric-unavailable-title" role="dialog" aria-modal="true">
        <div
            class="p-6 rounded-xl shadow-2xl modal-content overflow-hidden"
            style="background: linear-gradient(to bottom, #0f1a2e, #1a2a3e); border: 1px solid rgba(59,130,246,0.35); width: 420px; max-width: 90%;">
            <div class="flex justify-between items-center mb-4">
                <h2 id="biometric-unavailable-title" class="text-xl font-bold flex items-center">
                    <div
                        class="mr-3 flex items-center justify-center rounded-full w-10 h-10"
                        style="background: rgba(251,191,36,0.12); color: #fbbf24;">
                        <i class="fas fa-fingerprint"></i>
                    </div>
                    <span style="color: #cbd5e1;">Biometric Setup Required</span>
                </h2>
                <button id="close-biometric-unavailable-modal"
                    class="rounded-full w-8 h-8 flex items-center justify-center"
                    style="background: transparent; border: none; color: #9ca3af; cursor: pointer; outline: none;">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <div
                    class="p-4 rounded-lg mb-4"
                    style="background: rgba(51,65,85,0.3); border: 1px solid rgba(251,191,36,0.2);">
                    <p class="text-gray-300 mb-3">Biometric unlock is not currently available on your device. This could be because:</p>
                    <ul class="text-sm ml-4 mb-4" style="color: #d1d5db; list-style: none; padding: 0;">
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #fbbf24; flex-shrink: 0;"></i>
                            <span>No fingerprint or face unlock is set up on your device</span>
                        </li>
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #fbbf24; flex-shrink: 0;"></i>
                            <span>Your device doesn't have biometric hardware</span>
                        </li>
                        <li class="flex items-start mb-2">
                            <i class="fas fa-circle mr-2" style="margin-top: 5px; font-size: 6px; color: #fbbf24; flex-shrink: 0;"></i>
                            <span>Biometric authentication is disabled in system settings</span>
                        </li>
                    </ul>
                    
                    <p class="text-sm font-semibold mb-2" style="color: #60a5fa;">To enable this feature:</p>
                    <ol class="text-sm ml-4" style="color: #d1d5db; list-style: none; padding: 0;">
                        <li class="flex items-start mb-2">
                            <span class="mr-2 font-bold" style="color: #60a5fa; min-width: 16px;">1.</span>
                            <span>Open your device's <strong>Settings</strong> app</span>
                        </li>
                        <li class="flex items-start mb-2">
                            <span class="mr-2 font-bold" style="color: #60a5fa; min-width: 16px;">2.</span>
                            <span>Go to <strong>Security</strong> or <strong>Biometrics & Security</strong></span>
                        </li>
                        <li class="flex items-start mb-2">
                            <span class="mr-2 font-bold" style="color: #60a5fa; min-width: 16px;">3.</span>
                            <span>Set up <strong>Fingerprint</strong> or <strong>Face Unlock</strong></span>
                        </li>
                        <li class="flex items-start">
                            <span class="mr-2 font-bold" style="color: #60a5fa; min-width: 16px;">4.</span>
                            <span>Return to LMSA and try again</span>
                        </li>
                    </ol>
                </div>
            </div>

            <div class="flex justify-center">
                <button id="close-biometric-unavailable-confirm"
                    class="w-full px-4 rounded-lg text-white shadow-lg font-semibold"
                    style="background: linear-gradient(to right, #3b82f6, #2563eb); border: none; padding-top: 10px; padding-bottom: 10px; cursor: pointer;">
                    <i class="fas fa-check mr-2"></i>Got It
                </button>
            </div>
        </div>
    </div>
`;

/**
 * Initializes the Biometric Unavailable Modal
 */
export function initBiometricUnavailableModal() {
    const initialize = () => {
        const modal = document.getElementById('biometric-unavailable-modal');
        if (!modal) {
            console.error('Biometric Unavailable Modal not found in DOM');
            return false;
        }

        const closeButton = document.getElementById('close-biometric-unavailable-modal');
        const confirmButton = document.getElementById('close-biometric-unavailable-confirm');

        console.log('Initializing Biometric Unavailable Modal...');

        // Function to close modal
        const closeModal = () => {
            closeBiometricUnavailableModal(modal);
        };

        // Close button handler
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        // Confirm button handler
        if (confirmButton) {
            confirmButton.addEventListener('click', closeModal);
        }

        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        console.log('Biometric Unavailable Modal initialized');
        return true;
    };

    // Try to initialize immediately, or wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
}

/**
 * Shows the Biometric Unavailable Modal
 */
export function showBiometricUnavailableModal() {
    const modal = document.getElementById('biometric-unavailable-modal');
    if (modal) {
        if (biometricUnavailableHideTimer) {
            clearTimeout(biometricUnavailableHideTimer);
            biometricUnavailableHideTimer = null;
        }

        modal.classList.remove('hidden');
        modal.classList.remove('hide');
        modal.classList.add('flex');

        // Force reflow so fade-in transition starts from opacity 0.
        void modal.offsetHeight;
        modal.classList.add('show');

        console.log('Biometric Unavailable Modal shown');
    } else {
        console.error('Biometric Unavailable Modal not found');
    }
}
