export const premiumModal = `
    <div id="premium-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container z-50 overflow-hidden"
        style="padding: 0.5rem;" aria-labelledby="premium-title" role="dialog" aria-modal="true">
        <div class="modal-content relative overflow-hidden flex flex-col" style="max-width: 460px; width: 90%; max-height: 95vh; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2) inset;">
            <!-- Animated gradient background -->
            <div style="position: absolute; inset: 0; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(236, 72, 153, 0.1) 100%); pointer-events: none; z-index: 0;"></div>
            
            <!-- Main content - no scroll needed -->
            <div style="position: relative; z-index: 1; background: var(--modal-bg); display: flex; flex-direction: column; height: 100%;">
                <!-- Close button positioned absolutely -->
                <button id="close-premium-modal" class="close-btn" style="position: absolute; top: 0.75rem; right: 0.75rem; padding: 0; width: 1.75rem; height: 1.75rem; display: flex; align-items: center; justify-content: center; border-radius: 0.65rem; transition: all 0.2s ease; z-index: 10; flex-shrink: 0;">
                    <i class="fas fa-times" style="font-size: 1.1rem;"></i>
                </button>

                <!-- Content area -->
                <div class="premium-modal-content" style="padding: 2rem 1.25rem 1.25rem 1.25rem; text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: flex-start;">
                    <!-- Premium icon with subtle animation -->
                    <div style="margin-bottom: 0.5rem; position: relative; display: inline-block; align-self: center; flex-shrink: 0;">
                        <div class="premium-icon" style="width: 3.25rem; height: 3.25rem; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%); border-radius: 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3);">
                            <i class="fas fa-crown" style="font-size: 1.5rem; color: white;"></i>
                        </div>
                    </div>

                    <!-- Main heading -->
                    <h2 id="premium-title" class="modal-title premium-modal-title" style="color: var(--text-primary); margin: 0 0 0.2rem 0; font-size: 1.4rem; font-weight: 700; letter-spacing: -0.5px; flex-shrink: 0; width: 100%; text-align: center; display: block;">
                        Unlock Premium
                    </h2>
                    <p class="premium-modal-subtitle" style="color: var(--text-secondary); margin: 0 0 0.625rem 0; font-size: 0.8rem; letter-spacing: 0.3px; text-transform: uppercase; font-weight: 600; flex-shrink: 0;">
                        <i class="fas fa-sparkles" style="color: #ec4899; margin-right: 0.3rem;"></i>Lifetime Access
                    </p>

                    <!-- Main value proposition -->
                    <p class="premium-modal-description" style="color: var(--text-primary); margin: 0 0 0.875rem; line-height: 1.4; font-size: 0.875rem; flex-shrink: 0;">
                        Get unlimited AI conversations without interruptions. Remove all ads and enjoy seamless experience forever.
                    </p>

                    <!-- Benefits cards -->
                    <div class="premium-benefits" style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin: 0 0 0.875rem 0; flex-shrink: 0;">
                        <!-- Benefit item 1 -->
                        <div class="benefit-item" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%); padding: 0.625rem; border-radius: 0.75rem; border: 1px solid rgba(59, 130, 246, 0.2); transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="benefit-icon" style="width: 1.75rem; height: 1.75rem; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-ban" style="color: white; font-size: 0.8rem;"></i>
                                </div>
                                <div style="text-align: left; min-width: 0;">
                                    <p class="benefit-title" style="color: var(--text-primary); font-weight: 600; font-size: 0.8rem; margin: 0;">No Ads, Ever</p>
                                    <p class="benefit-subtitle" style="color: var(--text-secondary); font-size: 0.7rem; margin: 0.1rem 0 0 0; word-break: break-word;">Uninterrupted chat</p>
                                </div>
                            </div>
                        </div>

                        <!-- Benefit item 2 -->
                        <div class="benefit-item" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%); padding: 0.625rem; border-radius: 0.75rem; border: 1px solid rgba(139, 92, 246, 0.2); transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="benefit-icon" style="width: 1.75rem; height: 1.75rem; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-layer-group" style="color: white; font-size: 0.8rem;"></i>
                                </div>
                                <div style="text-align: left; min-width: 0;">
                                    <p class="benefit-title" style="color: var(--text-primary); font-weight: 600; font-size: 0.8rem; margin: 0;">Lifetime Access</p>
                                    <p class="benefit-subtitle" style="color: var(--text-secondary); font-size: 0.7rem; margin: 0.1rem 0 0 0; word-break: break-word;">Never expires</p>
                                </div>
                            </div>
                        </div>

                        <!-- Benefit item 3 -->
                        <div class="benefit-item" style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.05) 100%); padding: 0.625rem; border-radius: 0.75rem; border: 1px solid rgba(236, 72, 153, 0.2); transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="benefit-icon" style="width: 1.75rem; height: 1.75rem; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-bolt" style="color: white; font-size: 0.8rem;"></i>
                                </div>
                                <div style="text-align: left; min-width: 0;">
                                    <p class="benefit-title" style="color: var(--text-primary); font-weight: 600; font-size: 0.8rem; margin: 0;">Instant Activation</p>
                                    <p class="benefit-subtitle" style="color: var(--text-secondary); font-size: 0.7rem; margin: 0.1rem 0 0 0; word-break: break-word;">Premium, now</p>
                                </div>
                            </div>
                        </div>

                        <!-- Benefit item 4 -->
                        <div class="benefit-item" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%); padding: 0.625rem; border-radius: 0.75rem; border: 1px solid rgba(16, 185, 129, 0.2); transition: all 0.3s ease;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="benefit-icon" style="width: 1.75rem; height: 1.75rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                    <i class="fas fa-infinity" style="color: white; font-size: 0.8rem;"></i>
                                </div>
                                <div style="text-align: left; min-width: 0;">
                                    <p class="benefit-title" style="color: var(--text-primary); font-weight: 600; font-size: 0.8rem; margin: 0;">Unlimited Usage</p>
                                    <p class="benefit-subtitle" style="color: var(--text-secondary); font-size: 0.7rem; margin: 0.1rem 0 0 0; word-break: break-word;">No daily limits, chat as much as you want</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CTA Buttons -->
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0;">
                        <!-- Primary button with gradient and animation -->
                        <button id="premium-upgrade-button" class="w-full font-semibold text-white transition-all duration-300 hover:shadow-lg active:scale-95"
                            style="padding: 0.75rem; border-radius: 0.75rem; border: 0; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%); font-size: 0.9rem; font-weight: 600; letter-spacing: 0.5px; cursor: pointer; box-shadow: 0 12px 32px rgba(59, 130, 246, 0.3); outline: none;">
                            <i class="fas fa-crown" style="margin-right: 0.4rem;"></i>Upgrade Now
                        </button>
                        <!-- Secondary button -->
                        <button id="close-premium-modal-secondary" class="w-full font-medium transition-all duration-200"
                            style="padding: 0.65rem; border-radius: 0.75rem; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); font-size: 0.85rem; cursor: pointer; outline: none;">
                            Maybe Later
                        </button>
                    </div>

                    <!-- Trust indicator -->
                    <p class="premium-modal-trust" style="color: var(--text-secondary); font-size: 0.7rem; margin: 0.625rem 0 0 0; opacity: 0.8; flex-shrink: 0;">
                        Secure payment • 10k+ Installs
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

        /* Responsive adjustments for smaller screens */
        @media (max-width: 480px) {
            #premium-modal .modal-content {
                max-width: 95vw;
                max-height: 96vh;
            }
            
            #premium-modal .premium-modal-content {
                padding: 1.5rem 1rem 1rem 1rem !important;
            }
            
            #premium-modal .premium-icon {
                width: 2.75rem !important;
                height: 2.75rem !important;
            }
            
            #premium-modal .premium-icon i {
                font-size: 1.25rem !important;
            }
            
            #premium-modal .premium-modal-title {
                font-size: 1.25rem !important;
                margin-bottom: 0.15rem !important;
            }
            
            #premium-modal .premium-modal-subtitle {
                font-size: 0.75rem !important;
                margin-bottom: 0.5rem !important;
            }
            
            #premium-modal .premium-modal-description {
                font-size: 0.8rem !important;
                margin-bottom: 0.75rem !important;
                line-height: 1.35 !important;
            }
            
            #premium-modal .premium-benefits {
                gap: 0.4rem !important;
                margin-bottom: 0.75rem !important;
            }
            
            #premium-modal .benefit-item {
                padding: 0.5rem !important;
                border-radius: 0.65rem !important;
            }
            
            #premium-modal .benefit-icon {
                width: 1.5rem !important;
                height: 1.5rem !important;
            }
            
            #premium-modal .benefit-icon i {
                font-size: 0.7rem !important;
            }
            
            #premium-modal .benefit-title {
                font-size: 0.75rem !important;
            }
            
            #premium-modal .benefit-subtitle {
                font-size: 0.65rem !important;
            }
            
            #premium-modal #premium-upgrade-button {
                padding: 0.65rem !important;
                font-size: 0.85rem !important;
            }
            
            #premium-modal #close-premium-modal-secondary {
                padding: 0.55rem !important;
                font-size: 0.8rem !important;
            }
            
            #premium-modal .premium-modal-trust {
                font-size: 0.65rem !important;
                margin-top: 0.5rem !important;
            }
        }
        
        /* Extra small screens - very compact */
        @media (max-height: 700px) {
            #premium-modal .modal-content {
                max-height: 98vh;
                border-radius: 1.25rem;
            }
            
            #premium-modal .premium-modal-content {
                padding: 1.25rem 1rem 0.875rem 1rem !important;
            }
            
            #premium-modal .premium-icon {
                width: 2.5rem !important;
                height: 2.5rem !important;
                margin-bottom: 0.35rem !important;
            }
            
            #premium-modal .premium-icon i {
                font-size: 1.15rem !important;
            }
            
            #premium-modal .premium-modal-title {
                font-size: 1.15rem !important;
                margin-bottom: 0.1rem !important;
            }
            
            #premium-modal .premium-modal-subtitle {
                font-size: 0.7rem !important;
                margin-bottom: 0.4rem !important;
            }
            
            #premium-modal .premium-modal-description {
                font-size: 0.75rem !important;
                margin-bottom: 0.625rem !important;
                line-height: 1.3 !important;
            }
            
            #premium-modal .premium-benefits {
                gap: 0.35rem !important;
                margin-bottom: 0.625rem !important;
            }
            
            #premium-modal .benefit-item {
                padding: 0.45rem !important;
            }
            
            #premium-modal .benefit-icon {
                width: 1.4rem !important;
                height: 1.4rem !important;
            }
            
            #premium-modal .benefit-icon i {
                font-size: 0.65rem !important;
            }
            
            #premium-modal .benefit-title {
                font-size: 0.7rem !important;
            }
            
            #premium-modal .benefit-subtitle {
                font-size: 0.6rem !important;
                margin-top: 0.05rem !important;
            }
            
            #premium-modal #premium-upgrade-button {
                padding: 0.6rem !important;
                font-size: 0.8rem !important;
            }
            
            #premium-modal #close-premium-modal-secondary {
                padding: 0.5rem !important;
                font-size: 0.75rem !important;
            }
            
            #premium-modal .premium-modal-trust {
                font-size: 0.6rem !important;
                margin-top: 0.4rem !important;
            }
            
            #premium-modal #close-premium-modal {
                width: 1.5rem !important;
                height: 1.5rem !important;
                top: 0.5rem !important;
                right: 0.5rem !important;
            }
            
            #premium-modal #close-premium-modal i {
                font-size: 1rem !important;
            }
        }
    </style>
`;

export function openPremiumModal() {
    const modal = document.getElementById('premium-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
    });
}

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
            openPremiumModal();
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
