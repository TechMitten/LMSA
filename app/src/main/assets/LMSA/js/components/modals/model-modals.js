export const modelModals = `
    <!-- Model modal -->
    <div id="model-modal"
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="model-title" role="dialog" aria-modal="true">
        <div class="bg-gradient-to-b from-[#0a192f]/95 via-[#0c1e36]/95 to-[#0a192f]/95 light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-6 rounded-xl w-[800px] max-w-[95%] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col modal-content border border-white/10 light:border-gray-200"
            style="background: var(--modal-bg);">
            <div
                class="flex justify-between items-center mb-5 pb-2 border-b border-white/10 dark:border-white/10 light:border-gray-200/60">
                <h2 id="model-title" class="text-xl font-bold flex items-center modal-title">
                    <i class="fas fa-info-circle mr-3 text-blue-400"></i>
                    <span class="text-blue-400 font-extrabold">Model Information</span>
                </h2>
                <button id="close-model"
                    class="text-gray-400 hover:text-white focus:outline-none rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="overflow-y-auto pr-4 flex-grow">
                <!-- Instructions for mobile users -->
                <div id="mobile-instructions"
                    class="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl border border-blue-500/20 shadow-sm hidden">
                    <div class="flex items-start">
                        <div class="flex-1">
                            <h4 class="text-sm font-semibold text-blue-400 dark:text-blue-400 light:text-blue-600 mb-1">
                                <i class="fas fa-robot mr-1"></i>Tip
                            </h4>
                            <p class="text-xs text-gray-300 dark:text-gray-300 light:text-gray-600 leading-relaxed">
                                LMSA must load the first model, otherwise it will not replace the loaded model with the
                                one you select, and instead continue stacking models on top of another.
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    class="mb-6 p-5 bg-darkTertiary-30 rounded-xl border border-blue-500/30 dark:border-blue-500/30 light:border-blue-400/30 shadow-md">
                    <h3
                        class="text-lg font-semibold mb-2 text-blue-400 dark:text-blue-400 light:text-blue-600 flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>Currently Loaded Model
                    </h3>
                    <div id="current-model"
                        class="text-lg font-medium text-white dark:text-white light:text-gray-800 p-4 bg-darkBg-70 dark:bg-darkBg-70 light:bg-white/80 rounded-lg overflow-hidden text-ellipsis border border-white/5 shadow-inner">
                        Loading...</div>
                </div>

                <div>
                    <div id="available-models-list" class="space-y-3">
                        <div class="flex space-x-4">
                            <div class="flex-1 space-y-3 py-1">
                                <div class="h-4 bg-darkTertiary-50 rounded-full w-3/4"></div>
                                <div class="h-4 bg-darkTertiary-50 rounded-full w-1/2"></div>
                                <div class="h-4 bg-darkTertiary-50 rounded-full w-5/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Full Model Name modal -->
    <div id="full-model-name-modal"
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="full-model-name-title" role="dialog" aria-modal="true">
        <div
            class="dark:bg-gradient-to-b dark:from-[#0a192f]/95 dark:via-[#0c1e36]/95 dark:to-[#0a192f]/95 light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-6 rounded-xl max-w-[95%] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col modal-content border border-white/10 dark:border-white/10 light:border-gray-200">
            <div
                class="flex justify-between items-center mb-5 pb-2 border-b border-white/10 dark:border-white/10 light:border-gray-200/60">
                <h2 id="full-model-name-title" class="text-xl font-bold flex items-center modal-title">
                    <div
                        class="icon-wrapper mr-3 flex items-center justify-center rounded-full bg-blue-500/20 w-9 h-9 text-blue-400 shadow-lg">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-blue-400 font-extrabold">Model Name</span>
                    </div>
                </h2>
                <button id="close-full-model-name"
                    class="text-gray-400 hover:text-white focus:outline-none rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="overflow-y-auto pr-4">
                <div
                    class="p-5 bg-darkTertiary-30 rounded-xl border border-blue-500/30 dark:border-blue-500/30 light:border-blue-400/30 shadow-md">
                    <div id="full-model-name"
                        class="text-lg font-medium text-white dark:text-white light:text-gray-800 p-4 bg-darkBg-70 dark:bg-darkBg-70 light:bg-white/80 rounded-lg border border-white/5 shadow-inner break-all">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Default Model Loaded Success modal -->
    <div id="default-model-loaded-modal"
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="default-model-loaded-title" role="dialog" aria-modal="true">
        <div
            class="dark:bg-gradient-to-b dark:from-[#0a192f]/95 dark:via-[#0c1e36]/95 dark:to-[#0a192f]/95 light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-6 rounded-xl w-[500px] max-w-[90%] shadow-2xl modal-content">
            <div class="mb-5">
                <h2 id="default-model-loaded-title" class="text-xl font-bold modal-title">
                    <span class="text-green-400 dark:text-green-400 light:text-green-600 font-extrabold">Default Model
                        Loaded</span>
                </h2>
            </div>
            <div class="p-5 bg-darkTertiary-30 dark:bg-darkTertiary-30 light:bg-green-50 rounded-xl shadow-md">
                <div class="flex items-center mb-3">
                    <i class="fas fa-star text-yellow-400 dark:text-yellow-400 light:text-yellow-500 mr-2"></i>
                    <h3 class="text-lg font-semibold text-green-400 dark:text-green-400 light:text-green-600">Ready to
                        Go!</h3>
                </div>
                <div id="default-model-loaded-name"
                    class="text-lg font-medium text-white dark:text-white light:text-gray-800 p-4 bg-darkBg-70 dark:bg-darkBg-70 light:bg-white rounded-lg shadow-inner break-all">
                </div>
            </div>
        </div>
    </div>

    <!-- OpenRouter Model Selected Confirmation modal -->
    <style>
        #openrouter-model-selected-modal .modal-content-green { border-color: rgba(34, 197, 94, 0.3); }
        #openrouter-model-selected-modal .border-b-green { border-bottom-color: rgba(34, 197, 94, 0.2); }
        #openrouter-model-selected-modal .bg-green-icon { background-color: rgba(34, 197, 94, 0.2); }
        #openrouter-model-selected-modal .text-green-custom { color: #4ade80; }
        
        body.light-theme #openrouter-model-selected-modal .text-green-custom { color: #16a34a; }
        body.light-theme #openrouter-model-selected-modal .bg-green-icon { background-color: rgba(34, 197, 94, 0.15); }
    </style>
    <div id="openrouter-model-selected-modal"
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="openrouter-model-selected-title" role="dialog" aria-modal="true" style="z-index: 2200;">
        <div class="bg-gradient-to-b from-[#0a192f]/95 via-[#0c1e36]/95 to-[#0a192f]/95 light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-6 rounded-xl w-[500px] max-w-[90%] shadow-2xl modal-content border modal-content-green"
            style="background: var(--modal-bg);">
            <div class="mb-5 border-b border-b-green pb-2">
                <h2 id="openrouter-model-selected-title" class="text-xl font-bold flex items-center modal-title">
                    <span class="icon-wrapper mr-3 inline-flex items-center justify-center rounded-full bg-green-icon text-green-custom shadow-lg w-9 h-9">
                        <i class="fas fa-check"></i>
                    </span>
                    <span class="text-green-custom font-extrabold">Model Selected</span>
                </h2>
            </div>
            <div class="p-5 bg-darkTertiary-30 light:bg-green-50 rounded-xl shadow-md border border-white/5">
                <div class="flex items-center mb-3">
                    <i class="fas fa-robot text-green-custom mr-2"></i>
                    <h3 class="text-sm font-semibold text-gray-300 light:text-gray-600">Now active</h3>
                </div>
                <div id="openrouter-model-selected-name"
                    class="text-base font-medium text-white light:text-gray-800 p-4 bg-darkBg-70 light:bg-white rounded-lg border border-white/5 shadow-inner break-all">
                </div>
            </div>
        </div>
    </div>

    <!-- Confirm Default Model Modal -->
    <div id="confirm-default-model-modal"
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="confirm-default-model-title" role="dialog" aria-modal="true" style="z-index: 2100;">
        <div
            class="dark:bg-gradient-to-b dark:from-[#0a192f]/95 dark:via-[#0c1e36]/95 dark:to-[#0a192f]/95 light:bg-gradient-to-b light:from-[#f8fafc] light:via-[#f1f5f9] light:to-[#f8fafc] p-6 rounded-xl w-[500px] max-w-[90%] shadow-2xl modal-content border border-white/10 dark:border-white/10 light:border-gray-200">
            <div class="mb-5">
                <h2 id="confirm-default-model-title" class="text-xl font-bold modal-title flex items-center">
                    <i class="fas fa-question-circle text-blue-400 mr-3"></i>
                    <span class="text-blue-400 dark:text-blue-400 light:text-blue-600 font-extrabold">Confirm Default
                        Model</span>
                </h2>
            </div>
            <div class="p-5 bg-darkTertiary-30 dark:bg-darkTertiary-30 light:bg-white rounded-xl shadow-md mb-6">
                <p class="text-gray-300 dark:text-gray-300 light:text-gray-700 text-lg leading-relaxed">
                    Would you like to set <span id="confirm-default-model-name"
                        class="font-bold text-white dark:text-white light:text-black"></span> to load as default every
                    time
                    the app loads?
                </p>
            </div>
            <div class="flex space-x-4">
                <button id="cancel-default-model-btn"
                    class="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-[1.02] shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    Cancel
                </button>
                <button id="confirm-default-model-btn"
                    class="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-[1.02] shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    YES
                </button>
            </div>
        </div>
    </div>
`;
