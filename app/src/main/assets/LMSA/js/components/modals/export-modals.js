export const exportModals = `
    <!-- Export Confirmation modal -->
    <div id="export-confirmation-modal"
        class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden modal-container"
        aria-labelledby="export-confirmation-title" role="dialog" aria-modal="true">
        <div class="p-6 rounded-lg w-96 max-w-[90%] shadow-lg modal-content"
            style="background-color: var(--bg-secondary); color: var(--text-primary);">
            <h2 id="export-confirmation-title" class="text-xl font-bold mb-4 flex items-center">
                <i class="fas fa-file-export mr-2 text-blue-500"></i>Confirm Export
            </h2>
            <p id="export-confirmation-message" class="mb-4">Are you sure you want to export all your chat history? The
                exported file will contain all your conversations in unencrypted format.</p>
            <div class="flex justify-end space-x-4">
                <button id="cancel-export" class="rounded-lg px-4 py-2 focus:outline-none"
                    style="background-color: var(--bg-tertiary); color: var(--text-primary);">
                    Cancel
                </button>
                <button id="confirm-export"
                    class="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 focus:outline-none">
                    Export
                </button>
            </div>
        </div>
    </div>

    <!-- Export Success modal -->
    <div id="export-success-modal"
        class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden modal-container"
        aria-labelledby="export-success-title" role="dialog" aria-modal="true">
        <div class="p-6 rounded-lg w-96 max-w-[90%] shadow-lg modal-content"
            style="background-color: var(--bg-secondary); color: var(--text-primary);">
            <h2 id="export-success-title" class="text-xl font-bold mb-4 flex items-center">
                <i class="fas fa-check-circle mr-2 text-green-500"></i>Export Successful
            </h2>
            <div class="mb-6">
                <p id="export-success-message" class="text-center text-lg" style="color: var(--text-primary);">
                    Successfully exported chats.</p>
            </div>
            <div class="flex justify-center">
                <button id="close-export-success"
                    class="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 focus:outline-none">
                    Close
                </button>
            </div>
        </div>
    </div>
`;
