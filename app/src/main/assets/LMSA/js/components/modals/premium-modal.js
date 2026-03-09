export const premiumModal = `
    <div id="premium-modal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden modal-container"
        aria-labelledby="premium-title" role="dialog" aria-modal="true">
        <div class="modal-content" style="max-width: 400px; width: 90%;">
            <div class="modal-header">
                <h2 id="premium-title" class="modal-title">
                    <i class="fas fa-crown mr-2" style="color: #3b82f6;"></i>
                    <span style="color: #3b82f6;">LMSA Premium</span>
                </h2>
                <button id="close-premium-modal" class="close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding: 1.5rem; text-align: center;">
                <div style="margin-bottom: 1.5rem;">
                    <i class="fas fa-crown" style="font-size: 3rem; color: #3b82f6; margin-bottom: 1rem;"></i>
                </div>
                <h3 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.25rem;">
                    Enjoy an Ad-Free Experience
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
                    Upgrade to LMSA Premium with a one-time lifetime purchase and remove all ads from the app forever.
                </p>
                <div style="background: var(--settings-label-bg); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                    <p style="color: var(--text-primary); margin-bottom: 0.5rem;">
                        <i class="fas fa-check-circle" style="color: #10b981; margin-right: 0.5rem;"></i>
                        No ads, ever
                    </p>
                    <p style="color: var(--text-primary); margin-bottom: 0.5rem;">
                        <i class="fas fa-check-circle" style="color: #10b981; margin-right: 0.5rem;"></i>
                        One-time payment
                    </p>
                    <p style="color: var(--text-primary);">
                        <i class="fas fa-check-circle" style="color: #10b981; margin-right: 0.5rem;"></i>
                        Lifetime access
                    </p>
                </div>
                <button id="premium-upgrade-button" class="w-full py-3 rounded-lg font-medium"
                    style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white;">
                    <i class="fas fa-crown mr-2"></i>
                    Upgrade to Premium
                </button>
            </div>
        </div>
    </div>
`;

export function initPremiumModal() {
    const modal = document.getElementById('premium-modal');
    const openButton = document.getElementById('remove-ads-banner-button');
    const closeButton = document.getElementById('close-premium-modal');
    const upgradeButton = document.getElementById('premium-upgrade-button');

    // Open modal
    if (openButton) {
        openButton.addEventListener('click', () => {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }

    // Close modal handlers
    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    };

    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }

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
