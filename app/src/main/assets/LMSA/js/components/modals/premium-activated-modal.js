import { openPremiumModal } from './premium-modal.js';

export const premiumActivatedModal = `
    <div id="premium-activated-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm items-center justify-center hidden modal-container"
        style="padding: 0.75rem; z-index: 2100 !important;" aria-labelledby="premium-activated-title" role="dialog" aria-modal="true">
        <div class="modal-content relative overflow-hidden flex flex-col"
            style="max-width: 440px; width: 92%; border-radius: 1.4rem; box-shadow: 0 28px 60px -18px rgba(0, 0, 0, 0.5); border: 1px solid rgba(251, 191, 36, 0.22); background: linear-gradient(180deg, rgba(20, 25, 40, 0.98) 0%, rgba(10, 14, 24, 0.98) 100%);">
            <div style="position: absolute; inset: 0; background: radial-gradient(circle at top, rgba(251, 191, 36, 0.18), transparent 48%), linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 179, 8, 0.04)); pointer-events: none;"></div>

            <button id="close-premium-activated-modal" class="close-btn"
                style="position: absolute; top: 0.8rem; right: 0.8rem; width: 1.9rem; height: 1.9rem; display: flex; align-items: center; justify-content: center; border-radius: 0.7rem; padding: 0; z-index: 2;">
                <i class="fas fa-times" style="font-size: 1rem;"></i>
            </button>

            <div style="position: relative; z-index: 1; padding: 2rem 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 0.9rem;">
                <div style="display: flex; justify-content: center;">
                    <div style="width: 3.6rem; height: 3.6rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 45%, #d97706 100%); box-shadow: 0 18px 34px rgba(245, 158, 11, 0.28); color: #fff7ed;">
                        <i class="fas fa-crown" style="font-size: 1.6rem;"></i>
                    </div>
                </div>

                <div style="text-align: center;">
                    <h2 id="premium-activated-title" style="margin: 0; font-size: 1.45rem; font-weight: 800; color: #fef3c7; letter-spacing: -0.03em;">Premium Activated</h2>
                    <p style="margin: 0.35rem 0 0; font-size: 0.84rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #fbbf24;">Lifetime access is active</p>
                    <p style="margin: 0.65rem 0 0; color: rgba(255, 255, 255, 0.82); font-size: 0.92rem; line-height: 1.45;">Your purchase is already enabled on this device. Premium features are unlocked and ready to use.</p>
                </div>

                <div style="display: grid; gap: 0.55rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 0.9rem; border-radius: 0.95rem; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(251, 191, 36, 0.14);">
                        <div style="width: 2rem; height: 2rem; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center; background: rgba(251, 191, 36, 0.16); color: #fbbf24; flex-shrink: 0;">
                            <i class="fas fa-wifi"></i>
                        </div>
                        <div>
                            <p style="margin: 0; color: #f8fafc; font-size: 0.84rem; font-weight: 700;">Offline access enabled</p>
                            <p style="margin: 0.12rem 0 0; color: rgba(226, 232, 240, 0.78); font-size: 0.74rem;">Use LMSA without an active internet connection.</p>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 0.9rem; border-radius: 0.95rem; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(251, 191, 36, 0.14);">
                        <div style="width: 2rem; height: 2rem; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center; background: rgba(251, 191, 36, 0.16); color: #fbbf24; flex-shrink: 0;">
                            <i class="fas fa-sliders-h"></i>
                        </div>
                        <div>
                            <p style="margin: 0; color: #f8fafc; font-size: 0.84rem; font-weight: 700;">Advanced controls unlocked</p>
                            <p style="margin: 0.12rem 0 0; color: rgba(226, 232, 240, 0.78); font-size: 0.74rem;">Premium-only features and limits are already available.</p>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 0.9rem; border-radius: 0.95rem; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(251, 191, 36, 0.14);">
                        <div style="width: 2rem; height: 2rem; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center; background: rgba(251, 191, 36, 0.16); color: #fbbf24; flex-shrink: 0;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div>
                            <p style="margin: 0; color: #f8fafc; font-size: 0.84rem; font-weight: 700;">Purchase status confirmed</p>
                            <p style="margin: 0.12rem 0 0; color: rgba(226, 232, 240, 0.78); font-size: 0.74rem;">No extra action is needed unless you are restoring on another device.</p>
                        </div>
                    </div>
                </div>

                <button id="premium-activated-continue-button"
                    style="width: 100%; border: 0; border-radius: 0.9rem; padding: 0.8rem 1rem; font-size: 0.9rem; font-weight: 700; color: #1c1917; background: linear-gradient(135deg, #fde68a 0%, #fbbf24 45%, #f59e0b 100%); box-shadow: 0 16px 30px rgba(245, 158, 11, 0.22); cursor: pointer;">
                    Continue
                </button>
            </div>
        </div>
    </div>

    <style>
        #premium-activated-modal .modal-content {
            animation: premiumActivatedPopIn 0.22s ease-out;
        }

        @keyframes premiumActivatedPopIn {
            from {
                opacity: 0;
                transform: translateY(14px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        #premium-activated-continue-button:hover {
            transform: translateY(-1px);
        }

        #close-premium-activated-modal:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 480px) {
            #premium-activated-modal .modal-content {
                width: 95%;
            }
        }
    </style>
`;

let premiumActivatedModalInitialized = false;
let premiumActivatedModalHideTimer = null;

function getPremiumHeaderButton() {
    return document.getElementById('premium-header-button');
}

function closePremiumActivatedModalInternal() {
    const modal = document.getElementById('premium-activated-modal');
    if (!modal) {
        return false;
    }

    if (premiumActivatedModalHideTimer) {
        clearTimeout(premiumActivatedModalHideTimer);
        premiumActivatedModalHideTimer = null;
    }

    modal.classList.remove('show');
    modal.classList.add('hide');

    premiumActivatedModalHideTimer = setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('hide');
        modal.classList.remove('flex');
        premiumActivatedModalHideTimer = null;
    }, 220);

    return true;
}

export function closePremiumActivatedModal() {
    return closePremiumActivatedModalInternal();
}

export function syncPremiumHeaderButtonState() {
    const button = getPremiumHeaderButton();
    if (!button) {
        return;
    }

    const isPremium = typeof window.hasPremiumAccess === 'function' && window.hasPremiumAccess();
    button.dataset.premiumState = isPremium ? 'premium' : 'free';
    button.title = isPremium ? 'View Premium Status' : 'Open Premium';
    button.setAttribute('aria-label', isPremium ? 'View Premium Status' : 'Open Premium');
}

export function openPremiumActivatedModal() {
    const modal = document.getElementById('premium-activated-modal');
    if (!modal) {
        return false;
    }

    if (!(typeof window.hasPremiumAccess === 'function' && window.hasPremiumAccess())) {
        openPremiumModal();
        return false;
    }

    if (premiumActivatedModalHideTimer) {
        clearTimeout(premiumActivatedModalHideTimer);
        premiumActivatedModalHideTimer = null;
    }

    modal.classList.remove('hidden');
    modal.classList.remove('hide');
    modal.classList.add('flex');
    void modal.offsetHeight;
    modal.classList.add('show');
    return true;
}

export function openPremiumHeaderModal() {
    if (typeof window.hasPremiumAccess === 'function' && window.hasPremiumAccess()) {
        return openPremiumActivatedModal();
    }

    openPremiumModal();
    return true;
}

export function initPremiumActivatedModal() {
    if (premiumActivatedModalInitialized) {
        syncPremiumHeaderButtonState();
        return true;
    }

    const modal = document.getElementById('premium-activated-modal');
    if (!modal) {
        console.error('Premium Activated Modal not found in DOM');
        return false;
    }

    const closeButton = document.getElementById('close-premium-activated-modal');
    const continueButton = document.getElementById('premium-activated-continue-button');

    if (closeButton) {
        closeButton.addEventListener('click', closePremiumActivatedModalInternal);
    }

    if (continueButton) {
        continueButton.addEventListener('click', closePremiumActivatedModalInternal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closePremiumActivatedModalInternal();
        }
    });

    document.addEventListener('premium-status-changed', syncPremiumHeaderButtonState);
    premiumActivatedModalInitialized = true;
    syncPremiumHeaderButtonState();
    return true;
}