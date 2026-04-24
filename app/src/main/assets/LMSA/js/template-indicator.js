// Template Indicator Manager
// Handles displaying and managing the active template indicator banner

import { debugLog } from './utils.js';
import { resetSystemPrompt } from './settings-manager.js';

const CUSTOM_TEMPLATE_STORAGE_KEY = 'customTemplates';

function migrateCustomTemplatesStorageIfNeeded() {
    if (!window.AndroidFileOps || typeof window.AndroidFileOps.loadData !== 'function' || typeof window.AndroidFileOps.saveData !== 'function') {
        return;
    }

    try {
        const nativeTemplates = window.AndroidFileOps.loadData(CUSTOM_TEMPLATE_STORAGE_KEY);
        if (nativeTemplates && nativeTemplates.trim() !== '') {
            return;
        }

        const localTemplates = localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);
        if (!localTemplates || localTemplates.trim() === '') {
            return;
        }

        const migrationSucceeded = window.AndroidFileOps.saveData(CUSTOM_TEMPLATE_STORAGE_KEY, localTemplates);
        if (migrationSucceeded) {
            localStorage.removeItem(CUSTOM_TEMPLATE_STORAGE_KEY);
            debugLog('Migrated custom templates from localStorage to Android internal storage');
        }
    } catch (error) {
        debugLog('Failed to migrate custom templates storage:', error);
    }
}

/**
 * Initialize the template indicator
 */
export function initializeTemplateIndicator() {
    migrateCustomTemplatesStorageIfNeeded();

    const templateIndicator = document.getElementById('template-indicator');
    const templateNameElement = document.getElementById('template-name');
    const disableTemplateBtn = document.getElementById('disable-template-btn');

    if (!templateIndicator || !templateNameElement || !disableTemplateBtn) {
        debugLog('Template indicator elements not found');
        return;
    }

    // Check if a template is active
    const activeTemplateName = localStorage.getItem('activeTemplateName');
    const systemPrompt = localStorage.getItem('systemPrompt');

    if (activeTemplateName && systemPrompt && systemPrompt.trim() !== '') {
        // Show the template indicator
        showTemplateIndicator(activeTemplateName);
    } else {
        // Hide the template indicator
        hideTemplateIndicator();
    }

    // Add event listener for the disable button
    disableTemplateBtn.addEventListener('click', disableTemplate);
}

/**
 * Show the template indicator with the given template name
 * @param {string} templateName - The name of the active template
 */
export function showTemplateIndicator(templateName) {
    const templateIndicator = document.getElementById('template-indicator');
    const templateNameElement = document.getElementById('template-name');

    if (templateIndicator && templateNameElement) {
        templateNameElement.textContent = templateName;
        templateIndicator.classList.remove('hidden');
        debugLog('Template indicator shown for:', templateName);
    }
}

/**
 * Hide the template indicator
 */
export function hideTemplateIndicator() {
    const templateIndicator = document.getElementById('template-indicator');

    if (templateIndicator) {
        templateIndicator.classList.add('hidden');
        debugLog('Template indicator hidden');
    }
}

/**
 * Disable the active template and return to default system prompt
 */
export function disableTemplate() {
    debugLog('Disabling active template');

    // Use the centralized reset function to ensure all state is cleared correctly
    resetSystemPrompt();

    // Hide the template indicator
    hideTemplateIndicator();

    // Show a confirmation message
    showTemplateDisabledNotification();

    debugLog('Template disabled successfully');
}

/**
 * Show a notification that the template has been disabled
 */
function showTemplateDisabledNotification() {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
        <i class="fas fa-check-circle" style="font-size: 1.25rem;"></i>
        <span>Template disabled. Using default system prompt.</span>
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

/**
 * Update the template indicator when a template is selected
 * @param {string} templateName - The name of the template
 */
export function updateTemplateIndicator(templateName) {
    if (templateName && templateName.trim() !== '') {
        localStorage.setItem('activeTemplateName', templateName);
        showTemplateIndicator(templateName);
    } else {
        localStorage.removeItem('activeTemplateName');
        hideTemplateIndicator();
    }
}
