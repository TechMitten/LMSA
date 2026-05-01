// Import required functions
import { checkAndShowWelcomeMessage, closeSidebar } from './ui-manager.js';
import { showExternalSiteModal } from './external-site-confirmation-modal.js';
import { showSettingsModal } from './settings-modal-manager.js';

// Export openHelpModal so other modules can use it
export function openHelpModal() {
    const helpModal = document.getElementById('help-modal');

    const resetHelpModalDemos = () => {
        if (!helpModal) {
            return;
        }

        helpModal.querySelectorAll('[data-demo-panel]').forEach((panel) => {
            panel.classList.add('hidden');
        });

        helpModal.querySelectorAll('[data-demo-button]').forEach((button) => {
            button.classList.remove('hidden');
            button.setAttribute('aria-expanded', 'false');
        });
    };

    if (helpModal) {
        // Close the sidebar first using the imported function
        closeSidebar();

        // Show the help modal
        helpModal.classList.remove('hidden');
        helpModal.classList.remove('hide');
        // Force reflow so opacity transition runs from the initial state
        void helpModal.offsetHeight;
        helpModal.classList.add('show');
        resetHelpModalDemos();

        const modalContent = helpModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-in');

            setTimeout(() => {
                modalContent.classList.remove('animate-modal-in');
            }, 300);
        }

        // Reset scroll position to top
        const scrollableContent = helpModal.querySelector('.overflow-y-auto');
        if (scrollableContent) {
            scrollableContent.scrollTop = 0;
        }

        // Ensure scroll-to-top button is hidden when modal opens
        const helpScrollTop = document.getElementById('help-scroll-top');
        if (helpScrollTop) {
            helpScrollTop.style.opacity = '0';
            helpScrollTop.style.visibility = 'hidden';
            helpScrollTop.style.pointerEvents = 'none';
        }
    }
}

function loadDemoMedia(demoPanel) {
    if (!demoPanel || demoPanel.dataset.demoLoaded === 'true') {
        return;
    }

    demoPanel.querySelectorAll('[data-demo-srcset]').forEach((source) => {
        const srcset = source.getAttribute('data-demo-srcset');
        if (srcset) {
            source.setAttribute('srcset', srcset);
        }
    });

    demoPanel.querySelectorAll('[data-demo-src]').forEach((image) => {
        const src = image.getAttribute('data-demo-src');
        if (src) {
            image.setAttribute('src', src);
        }
    });

    demoPanel.dataset.demoLoaded = 'true';
}

// Make available globally for onclick handlers in error messages
window.openHelpModal = openHelpModal;
window.showSettingsModal = showSettingsModal;

document.addEventListener('DOMContentLoaded', () => {
    const helpBtn = document.getElementById('help-btn');
    const newChatHeaderBtn = document.getElementById('new-chat-header-button');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help');

    // --- Scroll-to-top button ---
    const helpModalContent = document.getElementById('help-modal-content');
    const helpScrollTop = document.getElementById('help-scroll-top');
    if (helpModalContent && helpScrollTop) {
        helpModalContent.addEventListener('scroll', function () {
            // Only show button if the help modal is currently open
            const isModalOpen = helpModal && !helpModal.classList.contains('hidden');
            if (isModalOpen && helpModalContent.scrollTop > 300) {
                helpScrollTop.style.opacity = '1';
                helpScrollTop.style.visibility = 'visible';
                helpScrollTop.style.pointerEvents = 'auto';
            } else {
                helpScrollTop.style.opacity = '0';
                helpScrollTop.style.visibility = 'hidden';
                helpScrollTop.style.pointerEvents = 'none';
            }
        }, { passive: true });

        helpScrollTop.addEventListener('click', function () {
            helpModalContent.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    // ----------------------------

    const sidebarElement = document.getElementById('sidebar');
    const modalContent = helpModal ? helpModal.querySelector('.modal-content') : null;
    const openSettingsLinks = helpModal
        ? helpModal.querySelectorAll('#open-settings-link, #open-settings-link-mcp')
        : [];
    const openPremiumModalLinks = helpModal
        ? helpModal.querySelectorAll('#open-premium-modal-offline')
        : [];
    const settingsModal = document.getElementById('settings-modal');

    // Function to close help modal
    function closeHelpModal() {
        if (helpModal && modalContent) {
            helpModal.classList.remove('show');
            helpModal.classList.add('hide');
            modalContent.classList.add('animate-modal-out');
            
            // Remove modal-open class from html and body
            document.documentElement.classList.remove('modal-open');
            document.body.classList.remove('modal-open');

            // Re-enable scrolling
            document.body.style.overflow = 'auto';

            // Hide scroll-to-top button immediately
            const helpScrollTopBtn = document.getElementById('help-scroll-top');
            if (helpScrollTopBtn) {
                helpScrollTopBtn.style.opacity = '0';
                helpScrollTopBtn.style.visibility = 'hidden';
                helpScrollTopBtn.style.pointerEvents = 'none';
            }

            setTimeout(() => {
                helpModal.classList.add('hidden');
                helpModal.classList.remove('hide');
                modalContent.classList.remove('animate-modal-out');

                // Check if welcome message should be shown
                checkAndShowWelcomeMessage();
            }, 400);
        }
    }

    // Event listeners
    if (helpBtn) {
        helpBtn.addEventListener('click', openHelpModal);
    }

    // New chat header button - triggers new chat functionality
    if (newChatHeaderBtn) {
        newChatHeaderBtn.addEventListener('click', () => {
            import('./chat-service.js').then(module => {
                module.createNewChat();
            });
        });
    }

    // Only proceed with other modal functionality if required elements exist
    if (helpModal && closeHelpBtn) {
        if (closeHelpBtn) {
            closeHelpBtn.addEventListener('click', closeHelpModal);
        }

        helpModal.addEventListener('click', (event) => {
            const demoButton = event.target.closest('[data-demo-button]');
            if (!demoButton) {
                return;
            }

            const panelId = demoButton.getAttribute('data-demo-button');
            const demoPanel = panelId ? helpModal.querySelector(`#${panelId}`) : null;

            if (!demoPanel) {
                return;
            }

            loadDemoMedia(demoPanel);
            demoPanel.classList.remove('hidden');
            demoButton.classList.add('hidden');
            demoButton.setAttribute('aria-expanded', 'true');
        });




        // Settings link event listener
        if (openSettingsLinks.length > 0 && settingsModal) {
            openSettingsLinks.forEach((openSettingsLink) => openSettingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Close help modal
                closeHelpModal();

                // Show the settings modal using classes instead of inline styles
                settingsModal.classList.remove('hidden');
                settingsModal.classList.add('show');
                settingsModal.classList.remove('hide');

                // Only set minimal inline styles that don't conflict with our CSS
                document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open

                const settingsModalContent = settingsModal.querySelector('.modal-content');
                if (settingsModalContent) {
                    settingsModalContent.classList.add('animate-modal-in');
                    setTimeout(() => {
                        settingsModalContent.classList.remove('animate-modal-in');
                    }, 300);
                }
            }));
        }

        // Premium modal link event listener
        if (openPremiumModalLinks.length > 0) {
            openPremiumModalLinks.forEach((link) => link.addEventListener('click', (e) => {
                e.preventDefault();
                // Close help modal
                closeHelpModal();

                // Open premium modal
                if (typeof window.openPremiumModal === 'function') {
                    setTimeout(() => {
                        window.openPremiumModal('Offline Use');
                    }, 400);
                }
            }));
        }

        // Close modal when clicking outside - REMOVED
        // helpModal.addEventListener('click', (e) => {
        //     if (e.target === helpModal) {
        //         closeHelpModal();
        //     }
        // });

        // Close modal with Escape key - REMOVED
        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'Escape' && !helpModal.classList.contains('hidden')) {
        //         closeHelpModal();
        //     }
        // });
    }

});
