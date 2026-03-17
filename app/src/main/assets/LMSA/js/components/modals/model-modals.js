export const modelModals = `
    <!-- Model modal -->
    <div id="model-modal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="model-title" role="dialog" aria-modal="true" style="z-index: 2000;">
        <div class="model-modal-panel rounded-2xl w-[520px] max-w-[95%] max-h-[85vh] overflow-hidden flex flex-col modal-content"
            style="background: var(--modal-bg);">

            <!-- Header -->
            <div class="model-modal-header flex justify-between items-center px-5 py-4">
                <h2 id="model-title" class="text-base font-semibold flex items-center gap-2.5 text-white light:text-gray-900">
                    Models
                </h2>
                <button id="close-model"
                    class="text-gray-200 light:text-gray-700 hover:text-white light:hover:text-gray-900 transition-colors focus:outline-none rounded-lg w-10 h-10 flex items-center justify-center bg-white/10 light:bg-gray-100/90 hover:bg-white/20 light:hover:bg-gray-200 border border-white/15 light:border-gray-300">
                    <i class="fas fa-times text-base"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="overflow-y-auto flex-grow px-5 pb-5 model-modal-scroll">

                <!-- Tip for mobile users -->
                <div id="mobile-instructions"
                    class="mb-4 px-3.5 py-3 rounded-lg bg-amber-500/8 hidden">
                    <div class="flex items-start">
                        <p class="text-[13px] text-gray-400 light:text-gray-600 leading-relaxed">
                            Always load your initial model through the app so each new selection properly replaces the previous one.
                        </p>
                    </div>
                </div>

                <!-- Active model -->
                <div id="active-model-section" class="mb-4">
                    <div class="flex items-center gap-1.5 mb-2 px-0.5">
                        <span class="model-status-dot w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span class="text-[11px] font-medium text-gray-500 light:text-gray-400 uppercase tracking-wider">Loaded</span>
                    </div>
                    <div id="current-model"
                        class="model-active-display text-sm font-medium text-white light:text-gray-800 px-3.5 py-2.5 rounded-lg truncate">
                        Loading...</div>
                </div>

                <!-- Available models list -->
                <div id="available-models-list" class="space-y-1">
                    <div class="animate-pulse space-y-1.5 pt-1">
                        <div class="h-12 rounded-lg model-skeleton"></div>
                        <div class="h-12 rounded-lg model-skeleton"></div>
                        <div class="h-12 rounded-lg model-skeleton"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Full Model Name modal -->
    <div id="full-model-name-modal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="full-model-name-title" role="dialog" aria-modal="true" style="z-index: 2100;">
        <div class="model-modal-panel rounded-2xl max-w-[90%] w-[420px] overflow-hidden flex flex-col modal-content"
            style="background: var(--modal-bg);">
            <div class="model-modal-header flex justify-between items-center px-5 py-4">
                <h2 id="full-model-name-title" class="text-base font-semibold flex items-center gap-2.5 text-white light:text-gray-900">
                    <i class="fas fa-tag text-blue-400 light:text-blue-600 text-sm"></i>
                    Model Name
                </h2>
                <button id="close-full-model-name"
                    class="text-gray-200 light:text-gray-700 hover:text-white light:hover:text-gray-900 transition-colors focus:outline-none rounded-lg w-10 h-10 flex items-center justify-center bg-white/10 light:bg-gray-100/90 hover:bg-white/20 light:hover:bg-gray-200 border border-white/15 light:border-gray-300">
                    <i class="fas fa-times text-base"></i>
                </button>
            </div>
            <div class="px-5 pb-5">
                <div id="full-model-name"
                    class="model-active-display text-sm font-medium text-white light:text-gray-800 px-3.5 py-3 rounded-lg break-all">
                </div>
            </div>
        </div>
    </div>

    <!-- Default Model Loaded Success modal -->
    <div id="default-model-loaded-modal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="default-model-loaded-title" role="dialog" aria-modal="true" style="z-index: 2100;">
        <div class="model-modal-panel rounded-2xl w-[400px] max-w-[90%] overflow-hidden modal-content"
            style="background: var(--modal-bg);">
            <div class="px-5 pt-5 pb-4">
                <div class="flex items-center gap-2.5 mb-4">
                    <div class="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <i class="fas fa-check text-emerald-400 text-sm"></i>
                    </div>
                    <h2 id="default-model-loaded-title" class="text-base font-semibold text-white light:text-gray-900">
                        Default Model Loaded</h2>
                </div>
                <div id="default-model-loaded-name"
                    class="model-active-display text-sm font-medium text-white light:text-gray-800 px-3.5 py-2.5 rounded-lg break-all">
                </div>
            </div>
        </div>
    </div>

    <!-- OpenRouter Model Selected Confirmation modal -->
    <div id="openrouter-model-selected-modal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="openrouter-model-selected-title" role="dialog" aria-modal="true" style="z-index: 2200;">
        <div class="model-modal-panel rounded-2xl w-[400px] max-w-[90%] overflow-hidden modal-content"
            style="background: var(--modal-bg);">
            <div class="px-5 pt-5 pb-4">
                <div class="flex items-center gap-2.5 mb-4">
                    <div class="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <i class="fas fa-check text-emerald-400 text-sm"></i>
                    </div>
                    <div>
                        <h2 id="openrouter-model-selected-title" class="text-base font-semibold text-white light:text-gray-900">
                            Model Selected</h2>
                        <p class="text-[11px] text-gray-500 light:text-gray-400">Now active via OpenRouter</p>
                    </div>
                </div>
                <div id="openrouter-model-selected-name"
                    class="model-active-display text-sm font-medium text-white light:text-gray-800 px-3.5 py-2.5 rounded-lg break-all">
                </div>
            </div>
        </div>
    </div>

    <!-- Local Model Loaded Confirmation modal -->
    <div id="local-model-loaded-modal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="local-model-loaded-title" role="dialog" aria-modal="true" style="z-index: 2200;">
        <div class="model-modal-panel rounded-2xl w-[400px] max-w-[90%] overflow-hidden modal-content"
            style="background: var(--modal-bg);">
            <div class="px-5 pt-5 pb-4">
                <div class="flex items-center gap-2.5 mb-4">
                    <div class="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <i class="fas fa-check text-emerald-400 text-sm"></i>
                    </div>
                    <h2 id="local-model-loaded-title" class="text-base font-semibold text-white light:text-gray-900">
                        Model Loaded</h2>
                </div>
                <div id="local-model-loaded-name"
                    class="model-active-display text-sm font-medium text-white light:text-gray-800 px-3.5 py-2.5 rounded-lg break-all">
                </div>
            </div>
        </div>
    </div>

    <!-- Confirm Default Model Modal -->
    <div id="confirm-default-model-modal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="confirm-default-model-title" role="dialog" aria-modal="true" style="z-index: 2100;">
        <div class="model-modal-panel rounded-2xl w-[420px] max-w-[90%] overflow-hidden modal-content"
            style="background: var(--modal-bg);">
            <div class="px-5 pt-5 pb-5">
                <h2 id="confirm-default-model-title" class="text-base font-semibold mb-3 text-white light:text-gray-900">
                    Set as Default?</h2>
                <p class="text-sm text-gray-400 light:text-gray-600 leading-relaxed mb-5">
                    <span id="confirm-default-model-name" class="font-semibold text-white light:text-gray-900"></span>
                    will load automatically when the app starts.
                </p>
                <div class="flex gap-3">
                    <button id="cancel-default-model-btn"
                        class="flex-1 py-2.5 bg-white/8 light:bg-gray-100 hover:bg-white/12 light:hover:bg-gray-200 text-gray-300 light:text-gray-700 rounded-lg font-medium text-sm transition-colors focus:outline-none">
                        Cancel
                    </button>
                    <button id="confirm-default-model-btn"
                        class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors focus:outline-none">
                        Set Default
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
