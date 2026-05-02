export const confirmationModals = `
    <!-- Confirmation modal -->
    <div id="confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden"
        aria-labelledby="confirmation-title" role="dialog" aria-modal="true"
        onclick="if(event.target === this) { document.getElementById('cancel-action').click(); }">
        <div class="p-6 rounded-lg w-96 max-w-[90%] shadow-lg mx-auto my-auto"
            style="background-color: var(--bg-secondary); color: var(--text-primary);">
            <h2 id="confirmation-title" class="text-xl font-bold mb-4 flex items-center modal-title">
                <i class="fas fa-exclamation-triangle mr-2 text-yellow-500"></i>Confirm Action
            </h2>
            <p id="confirmation-message" class="mb-4"></p>
            <div class="flex justify-end space-x-4">
                <button id="cancel-action" class="rounded-lg px-4 py-2 focus:outline-none"
                    style="background-color: var(--bg-tertiary); color: var(--text-primary);">
                    Cancel
                </button>
                <button id="confirm-action"
                    class="bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 focus:outline-none">
                    Confirm
                </button>
            </div>
        </div>
    </div>

    <!-- Legacy Access Modal -->
    <div id="legacy-access-modal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden"
        aria-labelledby="legacy-access-title" role="dialog" aria-modal="true"
        onclick="if(event.target === this) { document.getElementById('legacy-access-close-btn').click(); }">
        <div class="p-6 rounded-lg w-96 max-w-[90%] shadow-lg mx-auto my-auto"
            style="background-color: var(--bg-secondary); color: var(--text-primary);">
            <h2 id="legacy-access-title" class="text-xl font-bold mb-4 flex items-center modal-title">
                <i class="fas fa-key mr-2 text-blue-500"></i>Legacy Access
            </h2>
            <p class="mb-4 leading-relaxed">
                Background: Early releases of LMSA were distributed as a paid-only app (no free tier). We later
                introduced a free tier alongside paid options. Because of that transition, users who purchased the
                original ("legacy") paid version will need a special legacy promo code to restore premium access in
                the newer app.
            </p>
            <p class="mb-4 leading-relaxed">
                To request your legacy promo code, please email <strong>support@lmsa.app</strong> and include your
                order number and any purchase details you have. We'll verify your purchase and reply with a one-time
                promo code and instructions for applying it in the app.
            </p>
            <p class="mb-4 leading-relaxed text-sm">
                <a href="#" id="locate-order-number-link" class="text-blue-400 hover:text-blue-300 underline">Locate
                    order number</a>
            </p>
            <div class="flex justify-end">
                <button id="legacy-access-close-btn" class="rounded-lg px-4 py-2 focus:outline-none"
                    style="background-color: var(--bg-tertiary); color: var(--text-primary);">
                    Close
                </button>
            </div>
        </div>
    </div>
    
    <!-- Clear System Prompt Confirmation Modal -->
    <div id="clear-system-prompt-modal"
        class="fixed inset-0 bg-black/80 dark:bg-black/80 light:bg-gray-900/50 backdrop-blur-sm items-center justify-center hidden modal-container z-[2100]"
        aria-labelledby="clear-system-prompt-title" role="dialog" aria-modal="true">
        <div
            class="bg-gradient-to-b from-red-950/95 to-red-900/95 dark:from-[#2d0a0a] dark:to-[#3d0d0d] light:from-red-50 light:to-red-100 p-6 rounded-xl w-[420px] max-w-[90%] shadow-2xl modal-content border border-red-900/30 dark:border-red-900/30 light:border-red-200 overflow-hidden">
            <div class="flex justify-between items-center mb-4">
                <h2 id="clear-system-prompt-title" class="text-xl font-bold flex items-center">
                    <div
                        class="icon-wrapper mr-3 flex items-center justify-center rounded-full bg-red-500/20 dark:bg-red-500/20 light:bg-red-500/10 w-10 h-10 text-red-400 dark:text-red-400 light:text-red-600">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                    <span
                        class="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300 dark:from-red-400 dark:to-red-300 light:from-red-600 light:to-red-700">Clear
                        System Prompt</span>
                </h2>
                <button id="close-clear-system-prompt-modal"
                    class="text-gray-400 hover:text-white dark:text-gray-400 dark:hover:text-white light:text-gray-600 light:hover:text-gray-800 focus:outline-none rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="mb-6">
                <div
                    class="p-4 rounded-lg bg-red-900/20 dark:bg-red-900/20 light:bg-red-100/80 border border-red-800/30 dark:border-red-800/30 light:border-red-300 mb-4">
                    <p class="text-gray-300 dark:text-gray-300 light:text-black mb-2">Are you sure you want to clear the
                        system prompt?</p>
                    <p class="text-red-300 dark:text-red-300 light:text-black text-sm flex items-start">
                        <i
                            class="fas fa-exclamation-triangle mt-0.5 mr-2 text-red-300 dark:text-red-300 light:text-black"></i>
                        <span>This action will remove all content from the system prompt. This cannot be undone.</span>
                    </p>
                </div>
            </div>

            <div class="flex justify-between space-x-4">
                <button id="cancel-clear-system-prompt"
                    class="flex-1 py-2.5 px-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 dark:bg-gray-700/50 dark:hover:bg-gray-700 light:bg-black light:hover:bg-gray-800 text-gray-300 hover:text-white dark:text-gray-300 dark:hover:text-white light:text-white light:hover:text-white border border-gray-600/30 hover:border-gray-500/50 dark:border-gray-600/30 dark:hover:border-gray-500/50 light:border-gray-700 light:hover:border-gray-600">
                    <i
                        class="fas fa-times mr-2 text-gray-300 hover:text-white dark:text-gray-300 dark:hover:text-white light:text-white light:hover:text-white"></i>Cancel
                </button>
                <button id="confirm-clear-system-prompt"
                    class="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 dark:from-red-700 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-500 light:from-red-600 light:to-red-500 light:hover:from-red-500 light:hover:to-red-400 text-white shadow-lg hover:shadow-red-500/20">
                    <i class="fas fa-trash-alt mr-2"></i>Clear Prompt
                </button>
            </div>
        </div>
    </div>
    
    <!-- Delete All Chats Confirmation Modal (Deprecated but kept just in case) -->
    <div id="delete-all-confirmation-modal"
        class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden" role="dialog" aria-modal="true"
        style="display: none !important; visibility: hidden;">
        <div class="bg-darkSecondary p-6 rounded-lg w-96 max-w-[90%] shadow-lg">
            <h2 class="text-xl font-bold mb-4 flex items-center text-red-500">
                <i class="fas fa-exclamation-triangle mr-2"></i>Confirm Delete All
            </h2>
            <p class="text-gray-300 mb-6">Are you sure you want to delete all chats? This action cannot be undone.</p>
            <div class="flex justify-end space-x-4">
                <button id="cancel-delete-all"
                    class="bg-gray-600 text-white rounded px-4 py-2 hover:bg-gray-700">Cancel</button>
                <button id="confirm-delete-all" class="bg-red-600 text-white rounded px-4 py-2 hover:bg-red-700">Delete
                    All</button>
            </div>
        </div>
    </div>
`;
