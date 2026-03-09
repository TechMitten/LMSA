export const premiumModal = `
    <div id="premium-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container z-50 overflow-hidden"
        style="padding: 1rem;" aria-labelledby="premium-title" role="dialog" aria-modal="true">
        <div class="modal-content relative overflow-hidden flex flex-col" style="max-width: 460px; width: 90%; max-height: 90vh; border-radius: 1.75rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2) inset;">
            <!-- Animated gradient background -->
            <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(236, 72, 153, 0.1) 100%); pointer-events: none; z-index: 0;"></div>
            
            <!-- Main content with scroll support -->
            <div style="position: relative; z-index: 1; background: var(--modal-bg); display: flex; flex-direction: column; height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                <!-- Close button positioned absolutely -->
                <button id="close-premium-modal" class="close-btn" style="position: absolute; top: 1rem; right: 1rem; padding: 0; width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border-radius: 0.75rem; transition: all 0.2s ease; z-index: 10; flex-shrink: 0;">
                    <i class="fas fa-times" style="font-size: 1.25rem;"></i>
                </button>

                <!-- Content area -->
                <div style="padding: 2.5rem 1rem 1.25rem 1rem; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: flex-start; overflow-y: auto;">
                    <!-- Premium icon with subtle animation -->
                    <div style="margin-bottom: 0.75rem; position: relative; display: inline-block; align-self: center; flex-shrink: 0;">
                        <div style="width: 3.75rem; height: 3.75rem; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%); border-radius: 1.25rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3); animation: premiumIconPulse 2.5s ease-in-out infinite;">
                            <i class="fas fa-crown" style="font-size: 1.75rem; color: white;"></i>
                        </div>
                    </div>

                    <!-- Main heading -->
                    <h2 id="premium-title" class="modal-title" style="color: var(--text-primary); margin: 0 0 0.25rem 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.5px; flex-shrink: 0; width: 100%; text-align: center; display: block;">
                        Unlock Premium
                    </h2>
                    <p style="color: var(--text-secondary); margin: 0 0 0.875rem 0; font-size: 0.85rem; letter-spacing: 0.3px; text-transform: uppercase; font-weight: 600; flex-shrink: 0;">
                        <i class="fas fa-sparkles" style="color: #ec4899; margin-right: 0.375rem;"></i>Lifetime Access
                    </p>

                    <!-- Main value proposition -->
                    <p style="color: var(--text-primary); margin: 0 0 1rem; line-height: 1.5; font-size: 0.9rem; flex-shrink: 0;">
                        Get unlimited AI conversations without interruptions. Remove all ads and enjoy seamless experience forever.
                    </p>

                    <!-- Benefits cards -->
                    <div style="display: grid; grid-template-columns: 1fr; gap: 0.625rem; margin: 0 0 1rem 0; flex-shrink: 0;">
                        <!-- Benefit item 1 -->
                        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%); padding: 0.75rem; border-radius: 0.875rem; border: 1px solid rgba(59, 130, 246, 0.2); transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 0.625rem;">
                                <div style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-ban" style="color: white; font-size: 0.9rem;"></i>
                                </div>
                                <div style="text-align: left; min-width: 0;">
                                    <p style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; margin: 0;">No Ads, Ever</p>
                                    <p style="color: var(--text-secondary); font-size: 0.75rem; margin: 0.15rem 0 0 0; word-break: break-word;">Uninterrupted chat</p>
                                </div>
                            </div>
                        </div>

                        <!-- Benefit item 2 -->
                        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%); padding: 0.75rem; border-radius: 0.875rem; border: 1px solid rgba(139, 92, 246, 0.2); transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 0.625rem;">
                                <div style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-layer-group" style="color: white; font-size: 0.9rem;"></i>
                                </div>
                                <div style="text-align: left; min-width: 0;">
                                    <p style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; margin: 0;">Lifetime Access</p>
                                    <p style="color: var(--text-secondary); font-size: 0.75rem; margin: 0.15rem 0 0 0; word-break: break-word;">Never expires</p>
                                </div>
                            </div>
                        </div>

                        <!-- Benefit item 3 -->
                        <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%); padding: 0.75rem; border-radius: 0.875rem; border: 1px solid rgba(236, 72, 153, 0.2); transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 0.625rem;">
                                <div style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-bolt" style="color: white; font-size: 0.9rem;"></i>
                                </div>
                                <div style="text-align: left; min-width: 0;">
                                    <p style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem; margin: 0;">Instant Activation</p>
                                    <p style="color: var(--text-secondary); font-size: 0.75rem; margin: 0.15rem 0 0 0; word-break: break-word;">Premium, now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CTA Buttons -->
                    <div style="display: flex; flex-direction: column; gap: 0.625rem; flex-shrink: 0;">
                        <!-- Primary button with gradient and animation -->
                        <button id="premium-upgrade-button" class="w-full font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-95"
                            style="padding: 0.875rem; border-radius: 0.875rem; border: 0; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%); font-size: 0.95rem; font-weight: 600; letter-spacing: 0.5px; cursor: pointer; box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3); outline: none;">
                            <i class="fas fa-crown" style="margin-right: 0.5rem;"></i>Upgrade Now
                        </button>
                        <!-- Secondary button -->
                        <button id="close-premium-modal-secondary" class="w-full font-medium transition-all duration-200"
                            style="padding: 0.75rem; border-radius: 0.875rem; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); font-size: 0.9rem; cursor: pointer; outline: none;">
                            Maybe Later
                        </button>
                    </div>

                    <!-- Trust indicator -->
                    <p style="color: var(--text-secondary); font-size: 0.75rem; margin: 0.75rem 0 0 0; opacity: 0.8; flex-shrink: 0;">
                        Secure payment • Thousands trust us
                    </p>
                </div>
            </div>
        </div>
    </div>

    <style>
        @keyframes premiumIconPulse {
            0%, 100% {
                box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 16px 40px rgba(59, 130, 246, 0.4);
                transform: scale(1.05);
            }
        }

        #premium-modal .modal-content {
            animation: slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        #premium-upgrade-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 40px rgba(59, 130, 246, 0.4);
        }

        #premium-upgrade-button:active {
            transform: translateY(0);
        }

        #close-premium-modal-secondary:hover {
            background: var(--bg-tertiary);
        }

        #close-premium-modal:hover {
            background: var(--bg-tertiary);
        }

        @media (max-width: 480px) {
            #premium-modal .modal-content {
                max-width: 95vw;
            }
        }
    </style>
`;

export function initPremiumModal() {
    const modal = document.getElementById('premium-modal');
    const openButton = document.getElementById('remove-ads-banner-button');
    const closeButton = document.getElementById('close-premium-modal');
    const secondaryCloseButton = document.getElementById('close-premium-modal-secondary');
    const upgradeButton = document.getElementById('premium-upgrade-button');

    // Close modal function
    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    // Open modal
    if (openButton) {
        openButton.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Trigger animation by ensuring the content is rendered
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
            });
        });
    }

    // Close modal handlers
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

    if (secondaryCloseButton) {
        secondaryCloseButton.addEventListener('click', closeModal);
    }

    // Close when clicking outside the modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Handle ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Upgrade button - calls same function as side menu button
    if (upgradeButton) {
        upgradeButton.addEventListener('click', () => {
            closeModal();
            // Call the existing removeAds function from android-interface.js
            if (typeof removeAds === 'function') {
                removeAds();
            }
        });
    }

    // Hide banner when user focuses on chat input field
    const userInput = document.getElementById('user-input');
    const removeAdsBanner = document.getElementById('remove-ads-banner');
    if (userInput && removeAdsBanner) {
        userInput.addEventListener('focus', () => {
            removeAdsBanner.style.display = 'none';
        });
    }
}
