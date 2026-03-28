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
    }
}

// Make available globally for onclick handlers in error messages
window.openHelpModal = openHelpModal;
window.showSettingsModal = showSettingsModal;

document.addEventListener('DOMContentLoaded', () => {
    const helpBtn = document.getElementById('help-btn');
    const newChatHeaderBtn = document.getElementById('new-chat-header-button');
    const helpModal = document.getElementById('help-modal');
    const closeHelpBtn = document.getElementById('close-help');

    const sidebarElement = document.getElementById('sidebar');
    const modalContent = helpModal ? helpModal.querySelector('.modal-content') : null;
    const openSettingsLink = document.getElementById('open-settings-link');
    const settingsModal = document.getElementById('settings-modal');

    // Function to close help modal
    function closeHelpModal() {
        if (helpModal && modalContent) {
            modalContent.classList.add('animate-modal-out');
            
            // Remove modal-open class from html and body
            document.documentElement.classList.remove('modal-open');
            document.body.classList.remove('modal-open');

            // Re-enable scrolling
            document.body.style.overflow = 'auto';

            setTimeout(() => {
                helpModal.classList.add('hidden');
                modalContent.classList.remove('animate-modal-out');

                // Check if welcome message should be shown
                checkAndShowWelcomeMessage();
            }, 300);
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

            demoPanel.classList.remove('hidden');
            demoButton.classList.add('hidden');
            demoButton.setAttribute('aria-expanded', 'true');
        });




        // Settings link event listener
        if (openSettingsLink && settingsModal) {
            openSettingsLink.addEventListener('click', (e) => {
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
            });
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
