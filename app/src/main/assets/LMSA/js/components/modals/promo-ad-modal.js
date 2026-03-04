export const promoAdModal = `
    <!-- Promo Ad Modal -->
    <div id="promo-ad-modal" class="fixed inset-0 hidden modal-container" aria-labelledby="promo-ad-title"
        role="dialog" aria-modal="true">
        <div class="bg-gradient-to-b from-[#0a192f]/95 via-[#0c1e36]/95 to-[#0a192f]/95 p-4 rounded-2xl shadow-2xl modal-content flex flex-col border border-white/10 overflow-hidden"
            style="box-shadow: 0 20px 60px -15px rgba(0,0,0,0.7), 0 0 30px rgba(31, 66, 135, 0.2), 0 0 0 1px rgba(255,255,255,0.1) inset;">
            <div class="flex justify-between items-center mb-3 pb-3 border-b border-white/15">
                <h2 id="promo-ad-title" class="text-xl font-bold flex items-center">
                    <div
                        class="icon-wrapper mr-3 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 w-9 h-9 text-darkBg shadow-lg">
                        <i class="fas fa-crown text-sm"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-blue-400 font-extrabold">Upgrade Your Experience</span>
                        <span class="text-xs text-blue-300/80 font-medium">Remove all ads from LMSA</span>
                    </div>
                </h2>
                <button id="close-promo-ad"
                    class="text-gray-400 hover:text-white focus:outline-none rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="promo-content overflow-y-auto flex-grow px-1 py-2">
                <div class="space-y-3">
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-blue-500/10 to-cyan-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-blue-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-ban text-blue-400"></i>
                                </div>
                                <div class="flex-1">
                                    <h3 class="feature-title text-white font-semibold mb-2">Remove All Ads</h3>
                                    <div class="feature-description text-gray-300 text-sm">
                                        <p>Enjoy an uninterrupted experience with all advertisements removed from the app. Support the development of LMSA while getting a cleaner, faster experience.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative">
                <!-- Decorative divider with glow effect -->
                <div
                    class="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent">
                </div>
                <div
                    class="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-sm">
                </div>

                <!-- Footer content -->
                <div
                    class="flex justify-between items-center pt-3 pb-2 mt-auto bg-gradient-to-b from-[#0a192f]/95 to-[#0c1e36]/95 sticky bottom-0 px-2 gap-2">
                    <button id="maybe-later-promo-ad"
                        class="text-gray-400 hover:text-white focus:outline-none text-sm px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                        <span class="flex items-center">
                            <i class="fas fa-clock mr-2"></i>
                            <span>Maybe Later</span>
                        </span>
                    </button>
                    <button id="remove-ads-promo-ad"
                        class="relative overflow-hidden text-white rounded-lg focus:outline-none text-sm px-4 py-2"
                        style="background: linear-gradient(135deg, #1e40af, #3b82f6); box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15); border: none; font-weight: 600; letter-spacing: 0.02em; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);"
                        onmouseover="this.style.boxShadow='0 6px 12px -1px rgba(37, 99, 235, 0.3), 0 4px 8px -1px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; this.style.background='linear-gradient(135deg, #2563eb, #60a5fa)';"
                        onmouseout="this.style.boxShadow='0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)'; this.style.background='linear-gradient(135deg, #1e40af, #3b82f6)';">
                        <span class="relative z-10 flex items-center">
                            <i class="fas fa-crown mr-2"></i>
                            <span>Remove Ads</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
`;

let isPromoAdModalInitialized = false;

/**
 * Initialize the promo ad modal
 */
export function initializePromoAdModal() {
    if (isPromoAdModalInitialized) {
        return;
    }

    // Inject modal HTML if not already present
    if (!document.getElementById('promo-ad-modal')) {
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = promoAdModal;
        document.body.appendChild(modalContainer.firstElementChild);
    }

    const modal = document.getElementById('promo-ad-modal');
    const closeBtn = document.getElementById('close-promo-ad');
    const removeAdsBtn = document.getElementById('remove-ads-promo-ad');
    const maybeLaterBtn = document.getElementById('maybe-later-promo-ad');

    // Close button handler
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hidePromoAdModal(true); // true = dismissed by user
        });
    }

    // Remove Ads button handler
    if (removeAdsBtn) {
        removeAdsBtn.addEventListener('click', () => {
            hidePromoAdModal(false); // false = not a dismissal (user clicked upgrade)
            // Call the removeAds function from android-interface.js
            if (typeof window.removeAds === 'function') {
                window.removeAds();
            }
        });
    }

    // Maybe Later button handler
    if (maybeLaterBtn) {
        maybeLaterBtn.addEventListener('click', () => {
            hidePromoAdModal(true); // true = dismissed by user
        });
    }

    // Backdrop click handler
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hidePromoAdModal(true); // true = dismissed by user
        }
    });

    // Escape key handler
    const handleEscape = (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            hidePromoAdModal(true); // true = dismissed by user
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Store handler for cleanup
    modal._escapeHandler = handleEscape;

    isPromoAdModalInitialized = true;
}

/**
 * Show the promo ad modal
 */
export function showPromoAdModal() {
    const modal = document.getElementById('promo-ad-modal');
    if (!modal) {
        console.error('Promo ad modal not found');
        return;
    }

    // Ensure modal is initialized
    if (!isPromoAdModalInitialized) {
        initializePromoAdModal();
    }

    // Blur active element to prevent keyboard
    if (document.activeElement) {
        document.activeElement.blur();
    }

    // Add modal-open class to body
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    // Show modal with animation
    modal.classList.remove('hidden');
    modal.classList.add('fade-in');
}

/**
 * Hide the promo ad modal
 * @param {boolean} dismissed - Whether the modal was dismissed by user (true) or not (false)
 */
export function hidePromoAdModal(dismissed = true) {
    const modal = document.getElementById('promo-ad-modal');
    if (!modal) {
        return;
    }

    // Track dismissal if needed
    if (dismissed) {
        // Import and call the dismissal tracking
        import('../promo-ad-manager.js').then(module => {
            if (typeof module.markPromoAdDismissed === 'function') {
                module.markPromoAdDismissed();
            }
        }).catch(err => {
            console.error('Error importing promo-ad-manager:', err);
        });
    }

    // Hide modal with animation
    modal.classList.add('fade-out');
    modal.classList.remove('fade-in');

    // Remove from DOM after animation
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('fade-out');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    }, 300);
}

/**
 * Check if the promo ad modal is currently visible
 */
export function isPromoAdModalVisible() {
    const modal = document.getElementById('promo-ad-modal');
    return modal && !modal.classList.contains('hidden');
}
