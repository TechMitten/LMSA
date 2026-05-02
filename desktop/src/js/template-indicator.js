// Template Indicator Manager
// Handles displaying and managing the active template indicator banner

import { debugLog } from './utils.js';
import { resetSystemPrompt } from './settings-manager.js';
import { showToastNotice } from './toast-notice.js';

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
    showToastNotice({
        message: 'Template disabled. Using default system prompt.',
        tone: 'success',
        iconClass: 'fas fa-check-circle',
        duration: 3000
    });
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
