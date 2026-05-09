import { termsModal } from './modals/terms-modal.js';
import { privacyPolicyModal } from './modals/privacy-policy-modal.js';
import { helpModal } from './modals/help-modal.js';
import { contactModal } from './modals/contact-modal.js';
import { aboutModal } from './modals/about-modal.js';
import { whatsNewModal } from './modals/whats-new-modal.js';
import { contextMenus } from './modals/context-menus.js';
import { importModals } from './modals/import-modals.js';
import { exportModals } from './modals/export-modals.js';
import { modelModals } from './modals/model-modals.js';
import { confirmationModals } from './modals/confirmation-modals.js';
import { promptModals } from './modals/prompt-modals.js';
import { settingsModal } from './modals/settings-modal.js';
import { premiumModal } from './modals/premium-modal.js';
import { premiumActivatedModal } from './modals/premium-activated-modal.js';
import { smartReplyWarningModal } from './modals/smart-reply-warning-modal.js';
import { openRouterWarningModal } from './modals/openrouter-warning-modal.js';
import { webSearchWarningModal } from './modals/web-search-warning-modal.js';
import { biometricUnavailableModal } from './modals/biometric-unavailable-modal.js';
import { imageViewerModal } from './modals/image-viewer-modal.js';

/**
 * Loads all modal components into the DOM
 * This should be called before any event listeners are attached
 */
export function loadModals() {
    console.log('Loading modals...');
    const modalContainer = document.createDocumentFragment();
    const tempDiv = document.createElement('div');

    // Combine all modal strings
    // We insert them at the beginning of the body or a specific container
    // The previous location was directly inside body, before #main-app-container

    tempDiv.innerHTML = termsModal + privacyPolicyModal + helpModal + contactModal + aboutModal + whatsNewModal + contextMenus + importModals + exportModals + modelModals + confirmationModals + promptModals + settingsModal + premiumModal + premiumActivatedModal + smartReplyWarningModal + openRouterWarningModal + webSearchWarningModal + biometricUnavailableModal + imageViewerModal;

    while (tempDiv.firstChild) {
        modalContainer.appendChild(tempDiv.firstChild);
    }

    // Append to the end of body to match original placement and ensure proper stacking
    document.body.appendChild(modalContainer);
    console.log('Modals loaded successfully');
}


// Auto-execute if loaded as a module script
// This ensures they are in the DOM before other scripts run their DOMContentLoaded handlers
loadModals();
