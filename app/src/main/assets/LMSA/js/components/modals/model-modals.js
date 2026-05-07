export const modelModals = `
    <!-- Model modal -->
    <div id="model-modal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="model-title" role="dialog" aria-modal="true" style="z-index: 2000;">
        <div class="model-modal-panel rounded-2xl w-[520px] max-w-[95%] max-h-[85vh] overflow-hidden flex flex-col modal-content">

            <!-- Header -->
            <div class="model-modal-header px-5 py-4">
                <div class="model-modal-header-main">
                    <div class="model-modal-title-group">
                        <p class="model-modal-eyebrow">Model Picker</p>
                        <h2 id="model-title" class="text-base font-semibold flex items-center gap-2.5 text-white light:text-gray-900">
                            Local Server
                        </h2>
                    </div>
                    <div class="model-modal-header-actions">
                        <button id="refresh-models-btn" class="model-modal-refresh-btn" type="button" aria-label="Refresh models">
                            <i class="fas fa-rotate-right" aria-hidden="true"></i>
                        </button>
                        <button id="close-model"
                            class="text-gray-200 light:text-gray-700 hover:text-white light:hover:text-gray-900 transition-colors focus:outline-none rounded-full w-10 h-10 flex items-center justify-center">
                            <i class="fas fa-times text-base"></i>
                        </button>
                    </div>
                </div>
                <div id="current-model" class="model-current-inline" title="Click to see full model name">
                    Loading...
                </div>
            </div>

            <div class="model-modal-toolbar px-5 py-3">
                <div class="model-modal-toolbar-row">
                    <div id="model-source-pill" class="model-modal-pill" aria-live="polite">
                        <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                        <span>Checking models...</span>
                    </div>
                </div>
                <div id="model-search-container" class="mt-3"></div>
                <div id="mobile-instructions" class="model-mobile-tip hidden">
                    <i class="fas fa-hand-pointer" aria-hidden="true"></i>
                    <span>Tap a model name to view the full ID before loading it.</span>
                </div>
            </div>

            <!-- Body -->
            <div class="overflow-y-auto grow px-5 pb-5 model-modal-scroll" style="padding-top:0.9rem;">
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
                    class="model-name-modal-close text-gray-200 light:text-gray-700 hover:text-white light:hover:text-gray-900 transition-colors focus:outline-none rounded-lg w-10 h-10 flex items-center justify-center">
                    <i class="fas fa-times text-base"></i>
                </button>
            </div>
            <div class="model-name-modal-content px-5 pb-5">
                <div class="model-name-modal-id-shell">
                    <p class="model-name-modal-id-label">Full model ID</p>
                <div id="full-model-name"
                    class="model-active-display model-name-modal-id text-sm font-medium text-white light:text-gray-800 px-3.5 py-3 rounded-lg break-all">
                </div>
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
        class="fixed inset-0 hidden modal-container model-toast-modal"
        aria-labelledby="openrouter-model-selected-title" role="status" aria-live="polite" style="z-index: 2200;">
        <div class="model-modal-panel model-toast-card model-toast-card--openrouter rounded-2xl w-[420px] max-w-full overflow-hidden modal-content">
            <div class="model-toast-accent model-toast-accent--openrouter"></div>
            <div class="model-toast-body">
                <div class="model-toast-header">
                    <div class="model-toast-icon model-toast-icon--openrouter" aria-hidden="true">
                        <i class="fas fa-cloud text-base"></i>
                    </div>
                    <div class="model-toast-copy">
                        <div class="model-toast-meta">
                            <span class="model-toast-chip model-toast-chip--openrouter">OpenRouter</span>
                            <span class="model-toast-chip model-toast-chip--success">Ready</span>
                        </div>
                        <h2 id="openrouter-model-selected-title" class="model-toast-title">
                            Model Selected</h2>
                        <p class="model-toast-subtitle">Cloud routing is active for your next response.</p>
                    </div>
                </div>
                <div class="model-toast-name-group">
                    <p class="model-toast-name-label">Selected model</p>
                    <div id="openrouter-model-selected-name"
                        class="model-active-display model-toast-name text-sm font-medium text-white light:text-gray-800 px-3.5 py-2.5 rounded-lg break-all">
                    </div>
                </div>
                <div class="model-toast-progress"></div>
            </div>
        </div>
    </div>

    <!-- Local Model Loaded Confirmation modal -->
    <div id="local-model-loaded-modal"
        class="fixed inset-0 hidden modal-container model-toast-modal"
        aria-labelledby="local-model-loaded-title" role="status" aria-live="polite" style="z-index: 2200;">
        <div class="model-modal-panel model-toast-card model-toast-card--local rounded-2xl w-[420px] max-w-full overflow-hidden modal-content">
            <div class="model-toast-accent model-toast-accent--local"></div>
            <div class="model-toast-body">
                <div class="model-toast-header">
                    <div class="model-toast-icon model-toast-icon--local" aria-hidden="true">
                        <i class="fas fa-microchip text-base"></i>
                    </div>
                    <div class="model-toast-copy">
                        <div class="model-toast-meta">
                            <span class="model-toast-chip model-toast-chip--local">Local Model</span>
                            <span class="model-toast-chip model-toast-chip--success">Loaded</span>
                        </div>
                        <h2 id="local-model-loaded-title" class="model-toast-title">
                            Model Loaded</h2>
                        <p class="model-toast-subtitle">Your local runtime is ready for the next reply.</p>
                    </div>
                </div>
                <div class="model-toast-name-group">
                    <p class="model-toast-name-label">Loaded model</p>
                    <div id="local-model-loaded-name"
                        class="model-active-display model-toast-name text-sm font-medium text-white light:text-gray-800 px-3.5 py-2.5 rounded-lg break-all">
                    </div>
                </div>
                <div class="model-toast-progress"></div>
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
