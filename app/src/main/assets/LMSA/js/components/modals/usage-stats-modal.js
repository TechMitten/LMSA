import { getUsageStats } from '../../usage-limiter.js';

export const usageStatsModal = `
    <div id="usage-stats-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container overflow-hidden"
        style="padding: 0.75rem; z-index: 2100 !important;" aria-labelledby="usage-stats-title" role="dialog" aria-modal="true">
        <div class="modal-content relative overflow-hidden flex flex-col" style="max-width: 440px; width: 92%; max-height: 95vh; border-radius: 1.2rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(59, 130, 246, 0.18) inset; background: var(--modal-bg);">
            <button id="close-usage-stats-modal" class="close-btn" style="position: absolute; top: 0.7rem; right: 0.7rem; width: 1.8rem; height: 1.8rem; display: flex; align-items: center; justify-content: center; border-radius: 0.6rem; z-index: 5;">
                <i class="fas fa-times" style="font-size: 1rem;"></i>
            </button>

            <div style="padding: 1.6rem 1.1rem 1.1rem 1.1rem; display: flex; flex-direction: column; gap: 0.85rem;">
                <div style="text-align: center;">
                    <div style="width: 2.9rem; height: 2.9rem; margin: 0 auto 0.45rem auto; border-radius: 0.9rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); box-shadow: 0 12px 28px rgba(37, 99, 235, 0.28);">
                        <i class="fas fa-gauge-high" style="font-size: 1.2rem; color: #ffffff;"></i>
                    </div>
                    <h2 id="usage-stats-title" class="modal-title" style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary); justify-content: center;">Today's Free Plan Usage</h2>
                    <p style="margin: 0.35rem 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">Track your remaining chats and web searches. Limits reset at midnight.</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 0.55rem;">
                    <div style="padding: 0.72rem; border-radius: 0.75rem; border: 1px solid rgba(59, 130, 246, 0.24); background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%);">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.6rem;">
                            <div style="display: flex; align-items: center; gap: 0.45rem; min-width: 0;">
                                <i class="fas fa-comment-dots" style="font-size: 0.88rem; color: #60a5fa;"></i>
                                <span style="font-size: 0.86rem; font-weight: 600; color: var(--text-primary);">Chats</span>
                            </div>
                            <span id="usage-chat-count" style="font-size: 0.86rem; font-weight: 700; color: var(--text-primary);">0 / 15</span>
                        </div>
                        <p id="usage-chat-remaining" style="margin: 0.42rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary);">15 chats remaining today</p>
                    </div>

                    <div style="padding: 0.72rem; border-radius: 0.75rem; border: 1px solid rgba(14, 165, 233, 0.24); background: linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0.04) 100%);">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.6rem;">
                            <div style="display: flex; align-items: center; gap: 0.45rem; min-width: 0;">
                                <i class="fas fa-globe" style="font-size: 0.88rem; color: #38bdf8;"></i>
                                <span style="font-size: 0.86rem; font-weight: 600; color: var(--text-primary);">Web Searches</span>
                            </div>
                            <span id="usage-web-search-count" style="font-size: 0.86rem; font-weight: 700; color: var(--text-primary);">0 / 2</span>
                        </div>
                        <p id="usage-web-search-remaining" style="margin: 0.42rem 0 0 0; font-size: 0.75rem; color: var(--text-secondary);">2 web searches remaining today</p>
                    </div>
                </div>

                <button id="close-usage-stats-modal-secondary" class="w-full font-medium transition-all duration-200"
                    style="padding: 0.64rem; border-radius: 0.7rem; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); font-size: 0.84rem; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    </div>

    <style>
        #usage-stats-modal .modal-content {
            animation: usageStatsSlideIn 0.28s ease;
        }

        @keyframes usageStatsSlideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        #usage-stats-modal .close-btn:hover,
        #close-usage-stats-modal-secondary:hover {
            background: var(--bg-tertiary);
        }

        @media (max-width: 480px) {
            #usage-stats-modal .modal-content {
                width: 95%;
                border-radius: 1rem;
            }

            #usage-stats-modal #usage-stats-title {
                font-size: 1.1rem !important;
            }
        }
    </style>
`;

let usageStatsModalInitialized = false;

function formatRemainingLabel(used, limit, label) {
    const remaining = Math.max(0, limit - used);
    if (remaining === 0) {
        return `${label} limit reached for today`;
    }

    const unit = remaining === 1 ? label : `${label}s`;
    return `${remaining} ${unit} remaining today`;
}

function getUsageUnit(label, count) {
    return count === 1 ? label : `${label}s`;
}

function applyUsageTextState(element, isLimitReached) {
    if (!element) {
        return;
    }

    element.style.color = isLimitReached ? '#fca5a5' : 'var(--text-secondary)';
}

function renderUsageStats() {
    const stats = getUsageStats();

    const chatUsed = Math.max(0, Number(stats.chatCount) || 0);
    const chatLimit = Math.max(0, Number(stats.chatLimit) || 15);
    const webSearchUsed = Math.max(0, Number(stats.webSearchCount) || 0);
    const webSearchLimit = Math.max(0, Number(stats.webSearchLimit) || 2);

    const chatCountElement = document.getElementById('usage-chat-count');
    const chatRemainingElement = document.getElementById('usage-chat-remaining');
    const webSearchCountElement = document.getElementById('usage-web-search-count');
    const webSearchRemainingElement = document.getElementById('usage-web-search-remaining');

    if (chatCountElement) {
        chatCountElement.textContent = `${chatUsed} / ${chatLimit}`;
    }

    if (chatRemainingElement) {
        const chatLabel = getUsageUnit('chat', chatLimit);
        chatRemainingElement.textContent = formatRemainingLabel(chatUsed, chatLimit, chatLabel);
        applyUsageTextState(chatRemainingElement, chatUsed >= chatLimit);
    }

    if (webSearchCountElement) {
        webSearchCountElement.textContent = `${webSearchUsed} / ${webSearchLimit}`;
    }

    if (webSearchRemainingElement) {
        const searchLabel = getUsageUnit('web search', webSearchLimit);
        webSearchRemainingElement.textContent = formatRemainingLabel(webSearchUsed, webSearchLimit, searchLabel);
        applyUsageTextState(webSearchRemainingElement, webSearchUsed >= webSearchLimit);
    }
}

export function closeUsageStatsModal() {
    const modal = document.getElementById('usage-stats-modal');
    if (!modal) {
        return;
    }

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.opacity = '0';
}

export function openUsageStatsModal() {
    if (typeof window.hasPremiumAccess === 'function' && window.hasPremiumAccess()) {
        return;
    }

    const modal = document.getElementById('usage-stats-modal');
    if (!modal) {
        return;
    }

    renderUsageStats();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
    });
}

export function initUsageStatsModal() {
    if (usageStatsModalInitialized) {
        return;
    }

    const modal = document.getElementById('usage-stats-modal');
    const closeButton = document.getElementById('close-usage-stats-modal');
    const closeSecondaryButton = document.getElementById('close-usage-stats-modal-secondary');

    if (!modal) {
        return;
    }

    usageStatsModalInitialized = true;

    if (closeButton) {
        closeButton.addEventListener('click', closeUsageStatsModal);
    }

    if (closeSecondaryButton) {
        closeSecondaryButton.addEventListener('click', closeUsageStatsModal);
    }

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeUsageStatsModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeUsageStatsModal();
        }
    });
}
