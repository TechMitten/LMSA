/**
 * Shows the IP/Port validation error modal
 * @param {string} message - The error message to display
 */
export function showIpPortErrorModal(message) {
    const errorModal = document.getElementById('ip-port-error-modal');
    const errorMessage = document.getElementById('ip-port-error-message');
    const okButton = document.getElementById('ip-port-error-ok-btn');

    if (errorModal && errorMessage) {
        // Set the message
        errorMessage.textContent = message;

        // Ensure the modal is properly displayed
        errorModal.classList.remove('hidden');
        errorModal.style.display = 'flex';

        // Add animation
        const modalContent = errorModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('animate-modal-out');
            modalContent.classList.add('animate-modal-in');
        }

        // Add event listener for the OK button
        if (okButton) {
            // Remove any existing event listeners to prevent duplicates
            // We use the clone node trick to wipe all event listeners
            const newOkButton = okButton.cloneNode(true);
            okButton.parentNode.replaceChild(newOkButton, okButton);

            newOkButton.addEventListener('click', hideIpPortErrorModal);

            // Focus the button for accessibility
            setTimeout(() => newOkButton.focus(), 100);
        }
    }
}

/**
 * Hides the IP/Port validation error modal
 */
export function hideIpPortErrorModal() {
    const errorModal = document.getElementById('ip-port-error-modal');

    if (errorModal) {
        const modalContent = errorModal.querySelector('.modal-content');

        if (modalContent) {
            modalContent.classList.remove('animate-modal-in');
            modalContent.classList.add('animate-modal-out');

            // Wait for animation to finish
            setTimeout(() => {
                errorModal.classList.add('hidden');
                errorModal.style.display = 'none';
                modalContent.classList.remove('animate-modal-out');
            }, 300);
        } else {
            errorModal.classList.add('hidden');
            errorModal.style.display = 'none';
        }
    }
}
