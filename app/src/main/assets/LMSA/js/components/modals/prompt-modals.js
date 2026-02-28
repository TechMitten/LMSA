export const promptModals = `
    <!-- Saved System Prompts Modal -->
    <div id="saved-prompts-modal" class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 1060; background: var(--modal-overlay); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%);"
        aria-labelledby="saved-prompts-title" role="dialog" aria-modal="true">
        <div
            class="relative dark:bg-gradient-to-b dark:from-[#1e293b] dark:via-[#334155] dark:to-[#1e293b] light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-8 rounded-2xl w-[600px] max-w-[90%] h-[60vh] shadow-2xl overflow-hidden flex flex-col modal-content border border-blue-400/50 dark:border-blue-400/50 light:border-blue-400/30 backdrop-blur-sm">
            <div class="flex justify-between items-center mb-6">
                <h2 id="saved-prompts-title" class="text-2xl font-bold text-gray-800 dark:text-gray-200">Saved System
                    Prompts</h2>
                <button id="close-saved-prompts-modal"
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl font-bold"
                    aria-label="Close modal">&times;</button>
            </div>
            <div id="saved-prompts-list" class="flex-1 overflow-y-auto">
                <!-- Saved prompts will be dynamically inserted here -->
            </div>
        </div>
    </div>

    <!-- Save System Prompt Modal -->
    <div id="save-prompt-modal" class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 1070; background: var(--modal-overlay); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%);"
        aria-labelledby="save-prompt-title" role="dialog" aria-modal="true">
        <div
            class="relative dark:bg-gradient-to-b dark:from-[#1e293b] dark:via-[#334155] dark:to-[#1e293b] light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-8 rounded-2xl w-[500px] max-w-[90%] shadow-2xl overflow-hidden flex flex-col modal-content border border-blue-400/50 dark:border-blue-400/50 light:border-blue-400/30 backdrop-blur-sm">
            <div class="flex justify-between items-center mb-6">
                <h2 id="save-prompt-title" class="text-2xl font-bold text-gray-800 dark:text-gray-200">Save System
                    Prompt</h2>
                <button id="close-save-prompt-modal"
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                    aria-label="Close modal">&times;</button>
            </div>
            <div class="mb-4">
                <label for="save-prompt-name"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt Name</label>
                <input type="text" id="save-prompt-name"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter a name for this prompt" maxlength="100">
            </div>
            <div class="mb-6 flex-1 flex flex-col">
                <label for="save-prompt-content"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt Content</label>
                <textarea id="save-prompt-content"
                    class="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter the prompt content"></textarea>
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancel-save-prompt"
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
                <button id="save-prompt-btn"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save
                    Prompt</button>
            </div>
        </div>
    </div>

    <!-- Edit System Prompt Modal -->
    <div id="edit-prompt-modal" class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 1070; background: var(--modal-overlay); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%);"
        aria-labelledby="edit-prompt-title" role="dialog" aria-modal="true">
        <div
            class="relative dark:bg-gradient-to-b dark:from-[#1e293b] dark:via-[#334155] dark:to-[#1e293b] light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-8 rounded-2xl w-[500px] max-w-[90%] shadow-2xl overflow-hidden flex flex-col modal-content border border-blue-400/50 dark:border-blue-400/50 light:border-blue-400/30 backdrop-blur-sm">
            <div class="flex justify-between items-center mb-6">
                <h2 id="edit-prompt-title" class="text-2xl font-bold text-gray-800 dark:text-gray-200">Edit System
                    Prompt</h2>
                <button id="close-edit-prompt-modal"
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                    aria-label="Close modal">&times;</button>
            </div>
            <div class="mb-4">
                <label for="edit-prompt-name"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt Name</label>
                <input type="text" id="edit-prompt-name"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter a name for this prompt" maxlength="100">
            </div>
            <div class="mb-6 flex-1 flex flex-col">
                <label for="edit-prompt-content"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt Content</label>
                <textarea id="edit-prompt-content"
                    class="flex-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter the prompt content"></textarea>
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancel-edit-prompt"
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
                <button id="save-edit-prompt"
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save
                    Changes</button>
            </div>
        </div>
    </div>

    <!-- Delete Prompt Confirmation Modal -->
    <div id="delete-prompt-confirmation-modal" class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 1070; background: var(--modal-overlay); backdrop-filter: blur(12px) saturate(180%); -webkit-backdrop-filter: blur(12px) saturate(180%);"
        aria-labelledby="delete-prompt-title" role="dialog" aria-modal="true">
        <div
            class="relative dark:bg-gradient-to-b dark:from-[#1e293b] dark:via-[#334155] dark:to-[#1e293b] light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-8 rounded-2xl w-[500px] max-w-[90%] shadow-2xl overflow-hidden flex flex-col modal-content border border-red-400/50 dark:border-red-400/50 light:border-red-400/30 backdrop-blur-sm">
            <div class="flex justify-between items-center mb-6">
                <h2 id="delete-prompt-title" class="text-2xl font-bold text-gray-800 dark:text-gray-200">Delete Prompt
                </h2>
                <button id="close-delete-prompt-modal"
                    class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
                    aria-label="Close modal">&times;</button>
            </div>
            <div class="mb-6">
                <p id="delete-prompt-message" class="text-gray-700 dark:text-gray-300">Are you sure you want to delete
                    this prompt? This action cannot be undone.</p>
            </div>
            <div class="flex justify-end space-x-3">
                <button id="cancel-delete-prompt"
                    class="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
                <button id="confirm-delete-prompt"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">Delete</button>
            </div>
        </div>
    </div>
`;
