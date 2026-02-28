export const importModals = `
    <!-- Import modal -->
    <div id="import-modal"
        class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden modal-container"
        aria-labelledby="import-title" role="dialog" aria-modal="true">
        <div class="p-6 rounded-lg w-96 max-w-[90%] shadow-lg modal-content"
            style="background-color: var(--bg-secondary); color: var(--text-primary);">
            <h2 id="import-title" class="text-xl font-bold mb-4 flex items-center">
                <i class="fas fa-file-import mr-2 text-blue-500"></i>Import Chats
            </h2>
            <div class="mb-4">
                <p class="mb-4" style="color: var(--text-primary);">How would you like to import the chats?</p>
                <div class="space-y-2">
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="import-option" value="merge" checked
                            class="text-blue-600 focus:ring-blue-500">
                        <span style="color: var(--text-primary);">Merge with existing chats</span>
                    </label>
                    <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="import-option" value="replace"
                            class="text-blue-600 focus:ring-blue-500">
                        <span style="color: var(--text-primary);">Replace all existing chats</span>
                    </label>
                </div>
            </div>
            <div id="import-status" class="mb-4 hidden">
                <div class="p-3 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-700">
                    <p id="import-status-message" class="text-blue-300"></p>
                </div>
            </div>
            <div class="flex justify-end space-x-4">
                <button id="cancel-import" class="rounded-lg px-4 py-2 focus:outline-none"
                    style="background-color: var(--bg-tertiary); color: var(--text-primary);">
                    Cancel
                </button>
                <button id="confirm-import"
                    class="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none">
                    Import
                </button>
            </div>
        </div>
    </div>

    <!-- Import Success modal -->
    <div id="import-success-modal"
        class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden modal-container"
        aria-labelledby="import-success-title" role="dialog" aria-modal="true">
        <div class="p-6 rounded-lg w-96 max-w-[90%] shadow-lg modal-content"
            style="background-color: var(--bg-secondary); color: var(--text-primary);">
            <h2 id="import-success-title" class="text-xl font-bold mb-4 flex items-center">
                <i class="fas fa-check-circle mr-2 text-green-500"></i>Import Successful
            </h2>
            <div class="mb-6">
                <p id="import-success-message" class="text-center text-lg" style="color: var(--text-primary);">
                    Successfully imported chats.</p>
            </div>
            <div class="flex justify-center">
                <button id="close-import-success"
                    class="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 focus:outline-none">
                    Close
                </button>
            </div>
        </div>
    </div>
    
    <!-- Hidden file input for importing chats -->
    <input type="file" id="import-chats-input" accept=".json" class="hidden">
`;
