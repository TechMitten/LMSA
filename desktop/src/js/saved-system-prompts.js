// Saved System Prompts Manager
// This module handles saving, loading, and managing user-created system prompts

import { debugLog, isAndroidWebView, isMobileDevice } from './utils.js';
import { closeSidebarExport } from './export-import.js';
import { checkAndShowWelcomeMessage } from './ui-manager.js';
import { requireSystemPromptPremiumAccess } from './settings-manager.js';
import { showSettingsModal, navigateSettingsModalToStep } from './settings-modal-manager.js';
import { showToastNotice } from './toast-notice.js';

// Local storage key for saved system prompts
const SAVED_PROMPTS_KEY = 'savedSystemPrompts';
const SAVED_PROMPTS_FILE_KEY = 'savedSystemPrompts';
const LM_STUDIO_SYSTEM_PROMPT_KEY = 'llm.prediction.systemPrompt';
const LM_STUDIO_IMPORT_CANCELLED = 'cancelled';
const LM_STUDIO_EXPORT_MODAL_ID = 'lmstudio-export-prompt-modal';

let hasCheckedLegacySavedPromptMigration = false;

function canUseNativePromptStorage() {
    return !!(
        window.AndroidFileOps &&
        typeof window.AndroidFileOps.loadData === 'function' &&
        typeof window.AndroidFileOps.saveData === 'function'
    );
}

function normalizeSavedPrompt(prompt, fallbackName = 'Imported Prompt') {
    if (!prompt || typeof prompt !== 'object') {
        return null;
    }

    const name = typeof prompt.name === 'string' && prompt.name.trim()
        ? prompt.name.trim()
        : fallbackName;
    const content = typeof prompt.content === 'string' ? prompt.content.trim() : '';

    if (!content) {
        return null;
    }

    const createdAt = typeof prompt.createdAt === 'string' && prompt.createdAt
        ? prompt.createdAt
        : new Date().toISOString();
    const updatedAt = typeof prompt.updatedAt === 'string' && prompt.updatedAt
        ? prompt.updatedAt
        : createdAt;
    const id = typeof prompt.id === 'string' && prompt.id
        ? prompt.id
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return {
        id,
        name,
        content,
        createdAt,
        updatedAt
    };
}

function normalizeSavedPromptCollection(prompts) {
    if (!Array.isArray(prompts)) {
        return [];
    }

    return prompts
        .map((prompt, index) => normalizeSavedPrompt(prompt, `Imported Prompt ${index + 1}`))
        .filter(Boolean);
}

function getPromptDedupKey(prompt) {
    return `${prompt.name.toLowerCase()}\u0000${prompt.content}`;
}

function mergeSavedPromptCollections(primaryPrompts, secondaryPrompts) {
    const merged = [...normalizeSavedPromptCollection(primaryPrompts)];
    const seenKeys = new Set(merged.map(getPromptDedupKey));

    normalizeSavedPromptCollection(secondaryPrompts).forEach(prompt => {
        const dedupKey = getPromptDedupKey(prompt);
        if (!seenKeys.has(dedupKey)) {
            merged.push(prompt);
            seenKeys.add(dedupKey);
        }
    });

    return merged;
}

function readSavedPromptsFromNativeStorage() {
    if (!canUseNativePromptStorage()) {
        return [];
    }

    try {
        const saved = window.AndroidFileOps.loadData(SAVED_PROMPTS_FILE_KEY);
        if (!saved || !saved.trim()) {
            return [];
        }

        return normalizeSavedPromptCollection(JSON.parse(saved));
    } catch (error) {
        debugLog('Error loading saved system prompts from Android internal storage:', error);
        return [];
    }
}

function readSavedPromptsFromLocalStorage() {
    try {
        const saved = localStorage.getItem(SAVED_PROMPTS_KEY);
        if (!saved) {
            return [];
        }

        return normalizeSavedPromptCollection(JSON.parse(saved));
    } catch (error) {
        debugLog('Error loading saved system prompts from localStorage:', error);
        return [];
    }
}

function persistSavedPromptCollection(prompts) {
    const normalizedPrompts = normalizeSavedPromptCollection(prompts);
    const serializedPrompts = JSON.stringify(normalizedPrompts);

    if (canUseNativePromptStorage()) {
        try {
            const savedToNative = window.AndroidFileOps.saveData(SAVED_PROMPTS_FILE_KEY, serializedPrompts);
            if (savedToNative) {
                localStorage.removeItem(SAVED_PROMPTS_KEY);
                return { success: true, savedToNative: true };
            }

            debugLog('Failed to save saved system prompts to Android internal storage, falling back to localStorage');
        } catch (error) {
            debugLog('Error saving saved system prompts to Android internal storage, falling back to localStorage:', error);
        }
    }

    try {
        localStorage.setItem(SAVED_PROMPTS_KEY, serializedPrompts);
        return { success: true, savedToNative: false };
    } catch (error) {
        debugLog('Error saving saved system prompts:', error);
        return { success: false, savedToNative: false };
    }
}

function migrateLegacySavedPromptsIfNeeded(nativePrompts) {
    const localPrompts = readSavedPromptsFromLocalStorage();

    if (!canUseNativePromptStorage() || hasCheckedLegacySavedPromptMigration || localPrompts.length === 0) {
        hasCheckedLegacySavedPromptMigration = true;
        return nativePrompts;
    }

    const mergedPrompts = mergeSavedPromptCollections(nativePrompts, localPrompts);
    const { success, savedToNative } = persistSavedPromptCollection(mergedPrompts);
    hasCheckedLegacySavedPromptMigration = true;

    if (success && savedToNative) {
        debugLog('Migrated saved system prompts from localStorage to Android internal storage');
        return mergedPrompts;
    }

    return mergedPrompts;
}

function extractFilenameStem(fileName = '') {
    return fileName.replace(/\.[^.]+$/, '').trim();
}

function getLmStudioPromptFieldValue(fields) {
    if (!Array.isArray(fields)) {
        return '';
    }

    const field = fields.find(entry =>
        entry &&
        entry.key === LM_STUDIO_SYSTEM_PROMPT_KEY &&
        typeof entry.value === 'string' &&
        entry.value.trim()
    );

    return field ? field.value.trim() : '';
}

function extractLmStudioPromptData(profile, fileName = '') {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        throw new Error('The selected file is not a valid LM Studio profile JSON file.');
    }

    const promptContent = [
        typeof profile.systemPrompt === 'string' ? profile.systemPrompt.trim() : '',
        typeof profile.prompt === 'string' ? profile.prompt.trim() : '',
        getLmStudioPromptFieldValue(profile.operation?.fields),
        getLmStudioPromptFieldValue(profile.load?.fields)
    ].find(value => typeof value === 'string' && value.trim());

    if (!promptContent) {
        throw new Error('No system prompt was found in the selected LM Studio JSON file.');
    }

    const fallbackName = extractFilenameStem(fileName) || 'Imported LM Studio Prompt';
    const name = typeof profile.name === 'string' && profile.name.trim()
        ? profile.name.trim()
        : fallbackName;

    return {
        name,
        content: promptContent.trim()
    };
}

function refreshSavedPromptsPanel() {
    populateSavedPromptsModal();
}

function importLmStudioPromptFromJson(fileContent, fileName = '') {
    try {
        const parsedProfile = JSON.parse(fileContent);
        const importedPrompt = extractLmStudioPromptData(parsedProfile, fileName);

        if (saveSystemPrompt(importedPrompt.name, importedPrompt.content)) {
            showSuccessMessage(`Imported "${importedPrompt.name}" to Saved Prompts.`);
        } else {
            showErrorMessage('Failed to save the imported system prompt. Please try again.');
        }
    } catch (error) {
        showErrorMessage(error.message || 'Failed to import the selected LM Studio JSON file.');
    }
}

function handleNativeLmStudioSystemPromptImportResult(result) {
    if (!result || result.success !== true) {
        if (result && result.errorMessage && result.errorMessage !== LM_STUDIO_IMPORT_CANCELLED) {
            showErrorMessage(result.errorMessage);
        }
        return;
    }

    importLmStudioPromptFromJson(result.content || '', result.fileName || '');
}

function openLmStudioPromptFileInput() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.className = 'hidden';

    const cleanup = () => {
        input.value = '';
        input.remove();
    };

    input.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            cleanup();
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                showErrorMessage('Failed to read the selected JSON file.');
                cleanup();
                return;
            }

            importLmStudioPromptFromJson(reader.result, file.name);
            cleanup();
        };
        reader.onerror = () => {
            showErrorMessage('Failed to read the selected JSON file.');
            cleanup();
        };
        reader.readAsText(file);
    });

    document.body.appendChild(input);
    input.click();
}

function handleLmStudioSystemPromptImport() {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    closeSidebarExport();

    if (window.AndroidFileOps && typeof window.AndroidFileOps.importLmStudioSystemPrompt === 'function') {
        window.AndroidFileOps.importLmStudioSystemPrompt();
        return;
    }

    openLmStudioPromptFileInput();
}

function buildLmStudioProfileJson(prompt) {
    return {
        name: prompt.name,
        systemPrompt: prompt.content
    };
}

function sanitizeFilenameStem(value = '') {
    return value
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/g, '')
        .slice(0, 80);
}

function triggerJsonFileDownload(jsonString, filename) {
    if (isAndroidWebView() || isMobileDevice()) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const dataUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(dataUrl);
        }, 100);
        return;
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function saveJsonExportFile(jsonString, filename, onSuccess) {
    if (window.AndroidFileOps && typeof window.AndroidFileOps.saveFile === 'function') {
        const previousOnFileSaved = window.onFileSaved;

        window.onFileSaved = function (success) {
            if (previousOnFileSaved) {
                window.onFileSaved = previousOnFileSaved;
            } else {
                delete window.onFileSaved;
            }

            if (success) {
                onSuccess();
            }
        };

        window.AndroidFileOps.saveFile(jsonString, filename);
        return;
    }

    triggerJsonFileDownload(jsonString, filename);
    onSuccess();
}

function exportSavedPromptToLmStudio(promptId) {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    const prompt = getSavedSystemPrompts().find(entry => entry.id === promptId);

    if (!prompt) {
        showErrorMessage('That saved system prompt could not be found.');
        return;
    }

    const jsonString = JSON.stringify(buildLmStudioProfileJson(prompt), null, 2);
    const filenameStem = sanitizeFilenameStem(prompt.name) || 'lmsa-system-prompt';
    const filename = `${filenameStem}-lmstudio-profile.json`;

    try {
        saveJsonExportFile(jsonString, filename, () => {
            showSuccessMessage(`Exported "${prompt.name}" as an LM Studio profile JSON file.`);
        });
    } catch (error) {
        debugLog('Error exporting LM Studio system prompt:', error);
        showErrorMessage('Failed to export the selected system prompt. Please try again.');
    }
}

function hideLmStudioPromptExportModal() {
    const modalOverlay = document.getElementById(LM_STUDIO_EXPORT_MODAL_ID);
    if (!modalOverlay) {
        return;
    }

    const previousBodyOverflow = modalOverlay.dataset.previousBodyOverflow ?? '';
    const escapeHandler = modalOverlay._escapeHandler;
    if (typeof escapeHandler === 'function') {
        document.removeEventListener('keydown', escapeHandler);
    }

    modalOverlay.remove();
    document.body.style.overflow = previousBodyOverflow;
}

function showLmStudioPromptExportModal() {
    const savedPrompts = getSavedSystemPrompts();

    if (savedPrompts.length === 0) {
        showErrorMessage('Save a system prompt before exporting it to LM Studio.');
        return;
    }

    hideLmStudioPromptExportModal();

    const previousBodyOverflow = document.body.style.overflow;
    const modalOverlay = document.createElement('div');
    modalOverlay.id = LM_STUDIO_EXPORT_MODAL_ID;
    modalOverlay.className = 'fixed inset-0 items-center justify-center modal-container';
    modalOverlay.dataset.previousBodyOverflow = previousBodyOverflow;
    modalOverlay.style.cssText = 'z-index: 9999; background: var(--modal-overlay); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); display: flex;';

    modalOverlay.innerHTML = `
        <div class="modal-content rounded-lg shadow-xl w-full max-w-2xl mx-4" style="background: var(--chat-bg); border: 1px solid var(--border-color); max-height: 85vh; overflow: hidden;">
            <div class="flex items-center justify-between px-5 py-4" style="border-bottom: 1px solid var(--border-color);">
                <div>
                    <h3 class="text-lg font-semibold" style="color: var(--text-primary);">Export Saved Prompt to LM Studio</h3>
                    <p class="text-sm mt-1" style="color: var(--text-secondary);">Choose a saved system prompt to export as an LM Studio profile JSON file.</p>
                </div>
                <button type="button" data-role="close" class="p-2 rounded-md hover:bg-white/5" style="color: var(--text-secondary);" aria-label="Close export prompt picker">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-5 overflow-y-auto" style="max-height: calc(85vh - 84px);">
                <div class="space-y-3">
                    ${savedPrompts.map(prompt => {
                        const preview = prompt.content.length > 160 ? `${prompt.content.substring(0, 160)}...` : prompt.content;
                        return `
                            <div class="rounded-lg p-4" style="background: var(--settings-label-bg); border: 1px solid var(--border-color);">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="min-w-0 flex-1">
                                        <div class="font-medium text-base break-words" style="color: var(--text-primary);">${escapeHtml(prompt.name)}</div>
                                        <div class="text-sm mt-2 break-words" style="color: var(--text-secondary);">${escapeHtml(preview)}</div>
                                    </div>
                                    <button type="button" class="lmstudio-export-picker-btn px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap" data-id="${prompt.id}" style="background: #10b981; color: #06281f;">
                                        <i class="fas fa-file-export mr-2"></i>Export
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            hideLmStudioPromptExportModal();
        }
    });

    modalOverlay.querySelector('[data-role="close"]')?.addEventListener('click', hideLmStudioPromptExportModal);

    modalOverlay.querySelectorAll('.lmstudio-export-picker-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const promptId = event.currentTarget.dataset.id;
            hideLmStudioPromptExportModal();
            exportSavedPromptToLmStudio(promptId);
        });
    });

    const escapeHandler = (event) => {
        if (event.key === 'Escape') {
            hideLmStudioPromptExportModal();
        }
    };

    modalOverlay._escapeHandler = escapeHandler;
    document.addEventListener('keydown', escapeHandler);
    document.body.appendChild(modalOverlay);
    document.body.style.overflow = 'hidden';
}

function handleLmStudioSystemPromptExport() {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    closeSidebarExport();
    showLmStudioPromptExportModal();
}

/**
 * Gets all saved system prompts from Android internal storage or localStorage
 * @returns {Array} Array of saved prompt objects
 */
export function getSavedSystemPrompts() {
    try {
        let savedPrompts = readSavedPromptsFromNativeStorage();

        if (canUseNativePromptStorage()) {
            savedPrompts = migrateLegacySavedPromptsIfNeeded(savedPrompts);
            return savedPrompts;
        }

        return readSavedPromptsFromLocalStorage();
    } catch (error) {
        debugLog('Error loading saved system prompts:', error);
        return [];
    }
}

/**
 * Saves a system prompt to persistent storage
 * @param {string} name - The name/title for the prompt
 * @param {string} content - The prompt content
 * @returns {boolean} Success status
 */
export function saveSystemPrompt(name, content) {
    try {
        if (!name || !content) {
            throw new Error('Name and content are required');
        }

        const savedPrompts = getSavedSystemPrompts();
        const newPrompt = {
            id: Date.now().toString(),
            name: name.trim(),
            content: content.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        savedPrompts.push(newPrompt);
        const { success } = persistSavedPromptCollection(savedPrompts);
        if (!success) {
            throw new Error('Failed to persist saved prompts');
        }
        refreshSavedPromptsPanel();
        debugLog('System prompt saved successfully:', newPrompt.name);
        return true;
    } catch (error) {
        debugLog('Error saving system prompt:', error);
        return false;
    }
}

/**
 * Deletes a saved system prompt
 * @param {string} id - The ID of the prompt to delete
 * @returns {boolean} Success status
 */
export function deleteSystemPrompt(id) {
    try {
        const savedPrompts = getSavedSystemPrompts();
        const filteredPrompts = savedPrompts.filter(prompt => prompt.id !== id);
        const { success } = persistSavedPromptCollection(filteredPrompts);
        if (!success) {
            throw new Error('Failed to persist saved prompts');
        }
        refreshSavedPromptsPanel();
        debugLog('System prompt deleted successfully:', id);
        return true;
    } catch (error) {
        debugLog('Error deleting system prompt:', error);
        return false;
    }
}

/**
 * Updates a saved system prompt
 * @param {string} id - The ID of the prompt to update
 * @param {string} name - The new name
 * @param {string} content - The new content
 * @returns {boolean} Success status
 */
export function updateSystemPrompt(id, name, content) {
    try {
        const savedPrompts = getSavedSystemPrompts();
        const promptIndex = savedPrompts.findIndex(prompt => prompt.id === id);
        
        if (promptIndex === -1) {
            throw new Error('Prompt not found');
        }

        savedPrompts[promptIndex] = {
            ...savedPrompts[promptIndex],
            name: name.trim(),
            content: content.trim(),
            updatedAt: new Date().toISOString()
        };

        const { success } = persistSavedPromptCollection(savedPrompts);
        if (!success) {
            throw new Error('Failed to persist saved prompts');
        }
        refreshSavedPromptsPanel();
        debugLog('System prompt updated successfully:', id);
        return true;
    } catch (error) {
        debugLog('Error updating system prompt:', error);
        return false;
    }
}

/**
 * Restores saved system prompts from imported data
 * @param {Array} prompts - Array of prompt objects to restore
 */
export function restoreSavedSystemPrompts(prompts, replaceExisting = true) {
    try {
        if (!Array.isArray(prompts)) {
            debugLog('Invalid prompts data for restore');
            return;
        }

        const normalizedPrompts = normalizeSavedPromptCollection(prompts);
        const promptsToSave = replaceExisting
            ? normalizedPrompts
            : mergeSavedPromptCollections(getSavedSystemPrompts(), normalizedPrompts);
        const { success } = persistSavedPromptCollection(promptsToSave);
        if (!success) {
            throw new Error('Failed to persist restored prompts');
        }
        debugLog('Saved system prompts restored successfully');
    } catch (error) {
        debugLog('Error restoring saved system prompts:', error);
    }
}

/**
 * Opens Settings to the system prompt step and focuses the saved prompts section
 */
export function showSavedSystemPromptsModal() {
    closeSidebarExport();

    populateSavedPromptsModal();

    Promise.resolve(showSettingsModal()).finally(() => {
        requestAnimationFrame(() => {
            navigateSettingsModalToStep('prompt');
            document.getElementById('saved-prompts-section')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
    });
}

/**
 * Compatibility shim retained for callers from the previous modal-based flow
 */
export function hideSavedSystemPromptsModal() {
    checkAndShowWelcomeMessage();
}

/**
 * Populates the saved prompts section with current saved prompts
 */
function populateSavedPromptsModal() {
    const container = document.getElementById('saved-prompts-list');
    if (!container) return;

    const savedPrompts = getSavedSystemPrompts();
    
    if (savedPrompts.length === 0) {
        container.innerHTML = `
            <div class="saved-prompts-empty-state text-center py-8 text-gray-400">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>No saved system prompts yet.</p>
                <p class="text-sm mt-2">Use + Add above to save your current system prompt here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = savedPrompts.map(prompt => `
        <div class="saved-prompt-item border rounded-lg p-4 mb-3" style="border-color: var(--border-color); background: var(--settings-label-bg);">
            <div class="flex justify-between items-start mb-2">
                <h3 class="saved-prompt-item-title font-medium text-lg" style="color: var(--text-primary);">${escapeHtml(prompt.name)}</h3>
                <div class="saved-prompt-item-actions flex space-x-2">
                    <button class="export-prompt-lms-btn text-green-400 hover:text-green-300 p-1" data-id="${prompt.id}" title="Export this prompt as LM Studio JSON">
                        <i class="fas fa-file-export"></i>
                    </button>
                    <button class="restore-prompt-btn text-blue-400 hover:text-blue-300 p-1" data-id="${prompt.id}" title="Restore this prompt">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="edit-prompt-btn text-yellow-400 hover:text-yellow-300 p-1" data-id="${prompt.id}" title="Edit this prompt">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-prompt-btn text-red-400 hover:text-red-300 p-1" data-id="${prompt.id}" title="Delete this prompt">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="prompt-content saved-prompt-item-content text-sm mb-2" style="color: var(--text-secondary);">
                ${escapeHtml(prompt.content.length > 150 ? prompt.content.substring(0, 150) + '...' : prompt.content)}
            </div>
            <div class="saved-prompt-item-meta text-xs" style="color: var(--text-tertiary);">
                Created: ${new Date(prompt.createdAt).toLocaleDateString()}
                ${prompt.updatedAt !== prompt.createdAt ? `• Updated: ${new Date(prompt.updatedAt).toLocaleDateString()}` : ''}
            </div>
        </div>
    `).join('');

    // Add event listeners to buttons
    addPromptItemEventListeners();
}

/**
 * Adds event listeners to prompt item buttons
 */
function addPromptItemEventListeners() {
    document.querySelectorAll('.export-prompt-lms-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            exportSavedPromptToLmStudio(id);
        });
    });

    // Restore buttons
    document.querySelectorAll('.restore-prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            restorePrompt(id);
        });
    });

    // Edit buttons
    document.querySelectorAll('.edit-prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            editPrompt(id);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-prompt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            confirmDeletePrompt(id);
        });
    });
}

/**
 * Restores a saved prompt to the current system prompt
 * @param {string} id - The ID of the prompt to restore
 */
function restorePrompt(id) {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    const savedPrompts = getSavedSystemPrompts();
    const prompt = savedPrompts.find(p => p.id === id);
    
    if (!prompt) {
        debugLog('Prompt not found for restore:', id);
        return;
    }

    // Import settings manager to set the system prompt
    import('./settings-manager.js').then(module => {
        module.setSystemPrompt(prompt.content, true);
        
        // Update UI elements
        const hiddenTextarea = document.getElementById('system-prompt');
        const previewDiv = document.getElementById('system-prompt-preview');
        const editor = document.getElementById('system-prompt-editor');

        if (hiddenTextarea) {
            hiddenTextarea.value = prompt.content;
            const changeEvent = new Event('change', { bubbles: true });
            hiddenTextarea.dispatchEvent(changeEvent);
        }

        if (editor) {
            editor.value = prompt.content;
        }

        if (previewDiv) {
            previewDiv.textContent = prompt.content;
        }
        
        // Show success message
        showSuccessMessage(`System prompt "${prompt.name}" has been restored.`);
        
        debugLog('System prompt restored:', prompt.name);
    }).catch(error => {
        debugLog('Error importing settings manager:', error);
    });
}

/**
 * Shows the edit prompt modal
 * @param {string} id - The ID of the prompt to edit
 */
function editPrompt(id) {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    const savedPrompts = getSavedSystemPrompts();
    const prompt = savedPrompts.find(p => p.id === id);
    
    if (!prompt) {
        debugLog('Prompt not found for edit:', id);
        return;
    }

    showEditPromptModal(prompt);
}

/**
 * Shows the edit prompt modal
 * @param {Object} prompt - The prompt object to edit
 */
function showEditPromptModal(prompt) {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    const modal = document.getElementById('edit-prompt-modal');
    if (!modal) return;

    // Populate the form
    const nameInput = document.getElementById('edit-prompt-name');
    const contentTextarea = document.getElementById('edit-prompt-content');
    
    if (nameInput) nameInput.value = prompt.name;
    if (contentTextarea) contentTextarea.value = prompt.content;

    // Store the prompt ID for saving
    modal.dataset.promptId = prompt.id;

    // Show the modal
    modal.classList.remove('hidden');
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('animate-modal-in');
        setTimeout(() => {
            modalContent.classList.remove('animate-modal-in');
        }, 300);
    }
}

/**
 * Hides the edit prompt modal
 */
function hideEditPromptModal() {
    const modal = document.getElementById('edit-prompt-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('animate-modal-out');
        setTimeout(() => {
            modal.classList.add('hidden');
            modalContent.classList.remove('animate-modal-out');
        }, 300);
    } else {
        modal.classList.add('hidden');
    }
}

/**
 * Saves the edited prompt
 */
function saveEditedPrompt() {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    const modal = document.getElementById('edit-prompt-modal');
    if (!modal) return;

    const promptId = modal.dataset.promptId;
    const nameInput = document.getElementById('edit-prompt-name');
    const contentTextarea = document.getElementById('edit-prompt-content');

    if (!nameInput || !contentTextarea || !promptId) return;

    const name = nameInput.value.trim();
    const content = contentTextarea.value.trim();

    if (!name || !content) {
        showErrorMessage('Please provide both a name and content for the prompt.');
        return;
    }

    if (updateSystemPrompt(promptId, name, content)) {
        hideEditPromptModal();
        populateSavedPromptsModal(); // Refresh the list
        showSuccessMessage('Prompt updated successfully.');
    } else {
        showErrorMessage('Failed to update prompt. Please try again.');
    }
}

/**
 * Shows confirmation dialog for deleting a prompt
 * @param {string} id - The ID of the prompt to delete
 */
function confirmDeletePrompt(id) {
    const savedPrompts = getSavedSystemPrompts();
    const prompt = savedPrompts.find(p => p.id === id);
    
    if (!prompt) return;

    const modal = document.getElementById('delete-prompt-confirmation-modal');
    if (!modal) return;

    // Set the prompt name in the confirmation message
    const messageElement = document.getElementById('delete-prompt-message');
    if (messageElement) {
        messageElement.textContent = `Are you sure you want to delete the prompt "${prompt.name}"? This action cannot be undone.`;
    }

    // Store the prompt ID for deletion
    modal.dataset.promptId = id;

    // Show the modal
    modal.classList.remove('hidden');
}

/**
 * Hides the delete confirmation modal
 */
function hideDeleteConfirmationModal() {
    const modal = document.getElementById('delete-prompt-confirmation-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Confirms and executes prompt deletion
 */
function confirmPromptDeletion() {
    const modal = document.getElementById('delete-prompt-confirmation-modal');
    if (!modal) return;

    const promptId = modal.dataset.promptId;
    if (!promptId) return;

    if (deleteSystemPrompt(promptId)) {
        hideDeleteConfirmationModal();
        populateSavedPromptsModal(); // Refresh the list
        showSuccessMessage('Prompt deleted successfully.');
    } else {
        showErrorMessage('Failed to delete prompt. Please try again.');
    }
}

/**
 * Handles saving from the settings modal
 */
function handleSaveFromSettings() {
    debugLog('handleSaveFromSettings called');

    if (!requireSystemPromptPremiumAccess()) {
        return;
    }
    
    // Get the current system prompt from the hidden textarea (which always contains the current value)
    const systemPromptInput = document.getElementById('system-prompt');
    debugLog('systemPromptInput element:', systemPromptInput);
    
    const currentPrompt = systemPromptInput ? systemPromptInput.value.trim() : '';
    debugLog('currentPrompt:', currentPrompt);
    
    if (!currentPrompt) {
        debugLog('No current prompt, showing error message');
        showErrorMessage('Please enter a system prompt before saving.');
        return;
    }
    
    debugLog('Calling showSavePromptModal with prompt:', currentPrompt);
    showSavePromptModal(currentPrompt);
}

/**
 * Shows the save prompt modal
 * @param {string} currentPrompt - The current system prompt content to pre-fill
 */
export function showSavePromptModal(currentPrompt = '') {
    debugLog('showSavePromptModal called with prompt:', currentPrompt);

    if (!requireSystemPromptPremiumAccess()) {
        return;
    }
    
    const modal = document.getElementById('save-prompt-modal');
    debugLog('save-prompt-modal element:', modal);
    
    if (!modal) {
        debugLog('Modal not found!');
        return;
    }

    // Clear and populate the form
    const nameInput = document.getElementById('save-prompt-name');
    const contentTextarea = document.getElementById('save-prompt-content');
    
    debugLog('nameInput element:', nameInput);
    debugLog('contentTextarea element:', contentTextarea);
    
    if (nameInput) nameInput.value = '';
    if (contentTextarea) contentTextarea.value = currentPrompt;

    // Show the modal
    debugLog('Removing hidden class from modal');
    modal.classList.remove('hidden');
    
    const modalContent = modal.querySelector('.modal-content');
    debugLog('modalContent element:', modalContent);
    
    if (modalContent) {
        modalContent.classList.add('animate-modal-in');
        setTimeout(() => {
            modalContent.classList.remove('animate-modal-in');
        }, 300);
    }

    // Focus on the name input
    if (nameInput) {
        setTimeout(() => nameInput.focus(), 100);
    }
    
    debugLog('Modal should now be visible');
}

/**
 * Hides the save prompt modal
 */
function hideSavePromptModal() {
    const modal = document.getElementById('save-prompt-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('animate-modal-out');
        setTimeout(() => {
            modal.classList.add('hidden');
            modalContent.classList.remove('animate-modal-out');
        }, 300);
    } else {
        modal.classList.add('hidden');
    }
}

/**
 * Saves a new prompt from the save modal
 */
function saveNewPrompt() {
    if (!requireSystemPromptPremiumAccess()) {
        return;
    }

    const nameInput = document.getElementById('save-prompt-name');
    const contentTextarea = document.getElementById('save-prompt-content');

    if (!nameInput || !contentTextarea) return;

    const name = nameInput.value.trim();
    const content = contentTextarea.value.trim();

    if (!name || !content) {
        showErrorMessage('Please provide both a name and content for the prompt.');
        return;
    }

    if (saveSystemPrompt(name, content)) {
        hideSavePromptModal();
        showSuccessMessage('Prompt saved successfully.');
    } else {
        showErrorMessage('Failed to save prompt. Please try again.');
    }
}

/**
 * Shows a success message
 * @param {string} message - The success message to show
 */
function showSuccessMessage(message) {
    const previousBodyOverflow = document.body.style.overflow;

    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 items-center justify-center modal-container';
    modalOverlay.style.cssText = 'z-index: 9999; background: var(--modal-overlay); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%); display: flex;';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content rounded-lg shadow-xl p-6 max-w-sm mx-4';
    modalContent.style.cssText = 'background: var(--chat-bg); border: 1px solid var(--border-color);';

    // Create success icon
    const iconContainer = document.createElement('div');
    iconContainer.className = 'flex justify-center mb-4';
    iconContainer.innerHTML = '<i class="fas fa-check-circle text-5xl text-green-500"></i>';

    // Create message text
    const messageText = document.createElement('p');
    messageText.className = 'text-center text-lg';
    messageText.style.color = 'var(--text-primary)';
    messageText.textContent = message;

    // Assemble modal
    modalContent.appendChild(iconContainer);
    modalContent.appendChild(messageText);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';

    // Animate in
    setTimeout(() => {
        modalContent.classList.add('animate-modal-in');
    }, 10);

    // Remove after 2 seconds
    setTimeout(() => {
        modalContent.classList.add('animate-modal-out');
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
                document.body.style.overflow = previousBodyOverflow;
            }
        }, 300);
    }, 2000);
}

/**
 * Shows an error message
 * @param {string} message - The error message to show
 */
function showErrorMessage(message) {
    showToastNotice({ message, tone: 'error', duration: 4000 });
}

window.onLmStudioSystemPromptImportResult = handleNativeLmStudioSystemPromptImportResult;

/**
 * Escapes HTML characters to prevent XSS
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initializes the saved system prompts functionality
 */
export function initializeSavedSystemPrompts() {
    debugLog('Initializing saved system prompts functionality');

    getSavedSystemPrompts();
    populateSavedPromptsModal();

    // Save system prompt button from settings modal
    const saveSystemPromptButton = document.getElementById('save-system-prompt-btn');
    if (saveSystemPromptButton) {
        saveSystemPromptButton.addEventListener('click', handleSaveFromSettings);
    }

    const importLmStudioPromptButton = document.getElementById('import-system-prompt-lms-btn');
    if (importLmStudioPromptButton) {
        importLmStudioPromptButton.addEventListener('click', handleLmStudioSystemPromptImport);
    }

    const exportLmStudioPromptButton = document.getElementById('export-system-prompt-lms-btn');
    if (exportLmStudioPromptButton) {
        exportLmStudioPromptButton.addEventListener('click', handleLmStudioSystemPromptExport);
    }

    // Save prompt modal event listeners
    const savePromptButton = document.getElementById('save-prompt-btn');
    if (savePromptButton) {
        savePromptButton.addEventListener('click', saveNewPrompt);
    }

    const cancelSavePromptButton = document.getElementById('cancel-save-prompt');
    if (cancelSavePromptButton) {
        cancelSavePromptButton.addEventListener('click', hideSavePromptModal);
    }

    const closeSavePromptButton = document.getElementById('close-save-prompt-modal');
    if (closeSavePromptButton) {
        closeSavePromptButton.addEventListener('click', hideSavePromptModal);
    }

    // Edit prompt modal event listeners
    const saveEditPromptButton = document.getElementById('save-edit-prompt');
    if (saveEditPromptButton) {
        saveEditPromptButton.addEventListener('click', saveEditedPrompt);
    }

    const cancelEditPromptButton = document.getElementById('cancel-edit-prompt');
    if (cancelEditPromptButton) {
        cancelEditPromptButton.addEventListener('click', hideEditPromptModal);
    }

    const closeEditPromptButton = document.getElementById('close-edit-prompt-modal');
    if (closeEditPromptButton) {
        closeEditPromptButton.addEventListener('click', hideEditPromptModal);
    }

    // Delete confirmation modal event listeners
    const confirmDeletePromptButton = document.getElementById('confirm-delete-prompt');
    if (confirmDeletePromptButton) {
        confirmDeletePromptButton.addEventListener('click', confirmPromptDeletion);
    }

    const cancelDeletePromptButton = document.getElementById('cancel-delete-prompt');
    if (cancelDeletePromptButton) {
        cancelDeletePromptButton.addEventListener('click', hideDeleteConfirmationModal);
    }

    // Delete prompt modal close button
    const closeDeletePromptButton = document.getElementById('close-delete-prompt-modal');
    if (closeDeletePromptButton) {
        closeDeletePromptButton.addEventListener('click', hideDeleteConfirmationModal);
    }

    // Close modals when clicking outside
    const modals = [
        'save-prompt-modal', 
        'edit-prompt-modal',
        'delete-prompt-confirmation-modal'
    ];

    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modalId === 'save-prompt-modal') {
                        hideSavePromptModal();
                    } else if (modalId === 'edit-prompt-modal') {
                        hideEditPromptModal();
                    } else if (modalId === 'delete-prompt-confirmation-modal') {
                        hideDeleteConfirmationModal();
                    }
                }
            });
        }
    });

    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visibleModal = modals.find(modalId => {
                const modal = document.getElementById(modalId);
                return modal && !modal.classList.contains('hidden');
            });

            if (visibleModal) {
                if (visibleModal === 'save-prompt-modal') {
                    hideSavePromptModal();
                } else if (visibleModal === 'edit-prompt-modal') {
                    hideEditPromptModal();
                } else if (visibleModal === 'delete-prompt-confirmation-modal') {
                    hideDeleteConfirmationModal();
                }
            }
        }
    });

    debugLog('Saved system prompts functionality initialized');
}
