// Model Manager for handling model-related functionality
import {
    modelModal,
    closeModelButton,
    currentModelDisplay,
    availableModelsList,
    refreshModelsButton,
    fullModelNameModal,
    closeFullModelNameButton,
    fullModelNameDisplay,
    modelHeaderIcon,
    modelLoadingModal,
    modelLoadingTitle,
    modelLoadingMessage,
    modelLoadingName,
    confirmDefaultModelModal,
    confirmDefaultModelName,
    confirmDefaultModelBtn,
    cancelDefaultModelBtn
} from './dom-elements.js';
import { fetchAvailableModels, getAvailableModels, isServerRunning, loadModel as apiLoadModel } from './api-service.js';
import { checkAndShowWelcomeMessage } from './ui-manager.js';
import { getDefaultModelId, setDefaultModelId, getUseOpenRouter } from './settings-manager.js';

// Flag to track if a model is actually loaded
let isModelLoaded = false;
// Flag to track if a model is currently loading
let isModelLoading = false;
// Store all available models
let allAvailableModels = [];
// Current server connection info
let currentServerIp = '';
let currentServerPort = '';
// Store current model full name
let currentModelFullName = '';
// Track loading modal display timing
let loadingModalStartTime = null;
// Flag to track if we're auto-loading default model on startup
let isAutoLoadingDefaultModel = false;
// Store the model ID pending confirmation for default
let pendingDefaultModelId = null;

/**
 * Initializes the model manager
 */
export function initializeModelManager() {
    // Add event listeners
    if (closeModelButton) {
        closeModelButton.addEventListener('click', closeModelModal);
    }

    if (refreshModelsButton) {
        refreshModelsButton.addEventListener('click', refreshModels);
    }

    // Confirmation modal listeners
    if (confirmDefaultModelBtn) {
        confirmDefaultModelBtn.addEventListener('click', handleConfirmDefaultModel);
    }

    // Perform an initial silent check for models (and auto-load default if set)
    // This runs in the background without opening the modal
    checkModelsSilent();

    if (cancelDefaultModelBtn) {
        cancelDefaultModelBtn.addEventListener('click', hideDefaultModelConfirmationModal);
    }

    // The model header icon doesn't exist when this function runs
    // We'll add the event listener dynamically when the modal is shown
}

/**
 * silently checks for models and loads default if needed
 * Does NOT open the model modal
 */
function checkModelsSilent() {
    console.log('Performing silent model check...');
    // We reuse loadModelInformation with the silent flag
    // We DON'T call showModelModal(), so the modal UI won't appear
    loadModelInformation(true);
}

/**
 * Shows the model modal
 */
export function showModelModal() {
    // Debug the current startup state
    console.log('showModelModal called, isInitialStartup:', window.isInitialStartup);

    if (modelModal) {
        // Force showing the modal regardless of startup state
        modelModal.classList.remove('hidden');
        const modalContent = modelModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-in');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-in');
            }, 300);
        }

        // Show loading state first, but only if not silent (though showModelModal is usually explicit)
        if (currentModelDisplay) {
            currentModelDisplay.textContent = 'Loading...';
        }

        if (availableModelsList) {
            availableModelsList.innerHTML = `
                <div class="animate-pulse flex space-x-4">
                    <div class="flex-1 space-y-3 py-1">
                        <div class="h-4 bg-darkTertiary rounded w-3/4"></div>
                        <div class="h-4 bg-darkTertiary rounded w-1/2"></div>
                        <div class="h-4 bg-darkTertiary rounded w-5/6"></div>
                    </div>
                </div>
            `;
        }

        // Model header icon is now just decorative (info icon) - no click handler needed

        // Set up the close button for the full model name modal
        if (closeFullModelNameButton) {
            closeFullModelNameButton.addEventListener('click', closeFullModelNameModal);
        }

        // Show mobile instructions on smartphones (hide for OpenRouter - stacking tip doesn't apply)
        if (!getUseOpenRouter()) {
            showMobileInstructionsIfNeeded();
        } else {
            const mobileInstructionsEl = document.getElementById('mobile-instructions');
            if (mobileInstructionsEl) mobileInstructionsEl.classList.add('hidden');
        }

        // Update section heading to match mode
        const currentModelSectionHeading = modelModal.querySelector('.mb-6.p-5 h3');
        if (currentModelSectionHeading) {
            currentModelSectionHeading.innerHTML = getUseOpenRouter()
                ? '<i class="fas fa-check-circle mr-2"></i>Active Model'
                : '<i class="fas fa-check-circle mr-2"></i>Currently Loaded Model';
        }

        // Load model information
        // If it's initial startup (which we can infer if the modal is being opened automatically by something else,
        // but typically showModelModal is user-initiated.
        // However, if we want to ensure we don't show loading state during auto-checks:
        loadModelInformation();
    } else {
        console.error('Model modal element not found');
    }
}

/**
 * Closes the model modal
 */
export function closeModelModal() {
    if (modelModal) {
        const modalContent = modelModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-out');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-out');
                modelModal.classList.add('hidden');

                // Check if welcome message should be shown
                checkAndShowWelcomeMessage();
            }, 300);
        } else {
            modelModal.classList.add('hidden');

            // Check if welcome message should be shown
            checkAndShowWelcomeMessage();
        }
    }
}


/**
 * Loads model information
 * @param {boolean} silent - Whether to suppress loading UI indicators
 */
async function loadModelInformation(silent = false) {
    try {
        // When opening the model modal, temporarily set isInitialStartup to true
        // This prevents auto-loading of models when checking availability
        const originalStartupFlag = window.isInitialStartup;
        window.isInitialStartup = true;

        // Check if server is running
        if (!(await isServerRunning())) {
            displayServerError();
            // Restore the original flag value
            window.isInitialStartup = originalStartupFlag;
            return;
        }

        // For OpenRouter, no local server IP/port is needed — models are cloud-resident
        if (!getUseOpenRouter()) {
            // Fetch all models from the server
            const serverIp = document.getElementById('server-ip')?.value.trim() || '';
            const serverPort = document.getElementById('server-port')?.value.trim() || '';

            // Store current server info for API calls
            currentServerIp = serverIp;
            currentServerPort = serverPort;

            if (!serverIp || !serverPort) {
                displayServerError();
                // Restore the original flag value
                window.isInitialStartup = originalStartupFlag;
                return;
            }
        }

        // Fetch model info
        try {
            console.log('Loading model information from server...');
            // Use the API service to fetch models
            const modelData = await fetchAvailableModels();

            // Restore the original flag value now that we've fetched models
            window.isInitialStartup = originalStartupFlag;

            if (!modelData || modelData.length === 0) {
                console.log('No models returned from API');
                displayNoModelsAvailable();
                return;
            }

            // Store full model data for later use
            allAvailableModels = modelData;
            console.log('All available models:', allAvailableModels);

            // Determine which model is actually loaded - use a single source of truth
            // Priority: 1. Global variable, 2. API service loaded models
            let currentlyLoadedModelId = null;

            if (window.currentLoadedModel) {
                console.log('Using global currentLoadedModel variable:', window.currentLoadedModel);
                // Verify if this model exists in the available models list
                const foundModel = allAvailableModels.find(model => model.id === window.currentLoadedModel);
                if (foundModel) {
                    console.log('Confirmed model exists in available models list');
                    currentlyLoadedModelId = window.currentLoadedModel;
                } else {
                    console.log('Global currentLoadedModel not found in available models list');
                    // Clear invalid global model reference
                    window.currentLoadedModel = null;
                }
            }

            if (!currentlyLoadedModelId) {
                // Check API service as fallback
                const loadedModels = getAvailableModels();
                console.log('Currently loaded models according to API:', loadedModels);

                if (loadedModels.length > 0) {
                    currentlyLoadedModelId = loadedModels[0];
                    console.log('Using model from API service:', currentlyLoadedModelId);

                    // Verify this model exists in our list
                    const loadedModelInfo = allAvailableModels.find(model => model.id === currentlyLoadedModelId);
                    if (!loadedModelInfo) {
                        console.log('API-reported model not found in available models list');
                    }
                }
            }

            // Now update the UI with consistent model information
            if (currentlyLoadedModelId) {
                // A model is loaded
                isModelLoaded = true;

                // Check if we should switch to default model on startup
                const defaultModelId = getDefaultModelId();
                console.log('Default model ID from storage:', defaultModelId);
                console.log('Currently loaded model ID:', currentlyLoadedModelId);
                console.log('originalStartupFlag:', originalStartupFlag);

                if (originalStartupFlag && defaultModelId) {
                    if (defaultModelId !== currentlyLoadedModelId) {
                        // Default model is different from currently loaded - need to switch
                        const defaultModelExists = allAvailableModels.find(model => model.id === defaultModelId);
                        if (defaultModelExists) {
                            console.log('Switching from', currentlyLoadedModelId, 'to default model:', defaultModelId);
                            // Set flag to indicate we're auto-loading default model on startup
                            isAutoLoadingDefaultModel = true;
                            console.log('Set isAutoLoadingDefaultModel flag to:', isAutoLoadingDefaultModel);
                            // Load the default model
                            await loadModel(defaultModelId);
                            return; // Exit early since we're loading a different model
                        } else {
                            console.log('Default model not found in available models:', defaultModelId);
                        }
                    } else {
                        // Default model is already loaded - no need to show success modal on startup
                        console.log('Default model is already loaded:', currentlyLoadedModelId);
                    }
                }

                // Update the global variable to maintain consistency
                window.currentLoadedModel = currentlyLoadedModelId;

                // Update both displays with the SAME model ID
                displayCurrentModel(currentlyLoadedModelId);
                displayAvailableModels(allAvailableModels, currentlyLoadedModelId);
            } else if (modelData.length > 0) {
                // Models exist but none are loaded
                console.log('Models available but none loaded');
                isModelLoaded = false;
                window.currentLoadedModel = null;

                // Check if there's a default model set
                const defaultModelId = getDefaultModelId();
                if (defaultModelId) {
                    // Check if the default model is in the available models list
                    const defaultModelExists = allAvailableModels.find(model => model.id === defaultModelId);
                    if (defaultModelExists) {
                        console.log('Auto-loading default model:', defaultModelId);
                        // Set flag to indicate we're auto-loading default model on startup
                        isAutoLoadingDefaultModel = true;
                        console.log('Set isAutoLoadingDefaultModel flag to:', isAutoLoadingDefaultModel);
                        // Auto-load the default model
                        await loadModel(defaultModelId);
                        return; // Exit early since we're loading a model
                    } else {
                        console.log('Default model not found in available models:', defaultModelId);
                    }
                }

                displayNoModelsLoaded();
                displayPotentialModels(allAvailableModels);
            } else {
                // No models available
                console.log('No models available');
                isModelLoaded = false;
                window.currentLoadedModel = null;
                displayNoModelsAvailable();
            }
        } catch (error) {
            console.error('Error fetching model information:', error);
            displayServerError();
        }
    } catch (error) {
        console.error('Error loading model information:', error);
        displayServerError();
    }
}

/**
 * Refreshes the model list
 */
async function refreshModels() {
    // If a model is currently loading, don't allow refresh
    if (isModelLoading) {
        console.log('Model loading in progress, ignoring refresh request');
        return;
    }

    // Show loading state
    if (currentModelDisplay) {
        currentModelDisplay.textContent = 'Loading...';
    }

    if (availableModelsList) {
        availableModelsList.innerHTML = `
            <div class="animate-pulse flex space-x-4">
                <div class="flex-1 space-y-3 py-1">
                    <div class="h-4 bg-darkTertiary rounded w-3/4"></div>
                    <div class="h-4 bg-darkTertiary rounded w-1/2"></div>
                    <div class="h-4 bg-darkTertiary rounded w-5/6"></div>
                </div>
            </div>
        `;
    }

    // Add visual feedback to the refresh button if it exists
    if (refreshModelsButton) {
        refreshModelsButton.disabled = true;
        refreshModelsButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Refreshing...';
    }

    try {
        // When refreshing models, temporarily set isInitialStartup to true
        // This prevents auto-loading of models when checking availability
        const originalStartupFlag = window.isInitialStartup;
        window.isInitialStartup = true;

        // Get updated model information
        await loadModelInformation();

        // Restore original flag
        window.isInitialStartup = originalStartupFlag;
    } catch (error) {
        console.error('Error refreshing models:', error);
        displayServerError();
    } finally {
        // Reset the refresh button if it exists
        if (refreshModelsButton) {
            refreshModelsButton.disabled = false;
            refreshModelsButton.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Refresh Models';
        }
    }
}

/**
 * Standalone function to update the model display without full refresh
 * @param {string} modelId - The ID of the newly loaded model
 */
async function updateModelDisplay(modelId) {
    try {
        // When updating model display, temporarily set isInitialStartup to true
        // This prevents auto-loading of models when checking availability
        const originalStartupFlag = window.isInitialStartup;
        window.isInitialStartup = true;

        // Use the API service to get updated model information
        await fetchAvailableModels();

        // Restore original flag
        window.isInitialStartup = originalStartupFlag;

        // Update the UI to show the loaded model
        if (currentModelDisplay) {
            // First priority: use the explicitly provided modelId
            // Second priority: use the global window.currentLoadedModel variable
            // Third priority: use the API's getAvailableModels() function

            let displayModelId = null;

            if (modelId) {
                displayModelId = modelId;
                console.log('Using explicitly provided modelId:', displayModelId);
            } else if (window.currentLoadedModel) {
                displayModelId = window.currentLoadedModel;
                console.log('Using global currentLoadedModel variable:', displayModelId);
            } else {
                const availableModels = getAvailableModels();
                if (availableModels.length > 0) {
                    displayModelId = availableModels[0];
                    console.log('Using first available model from API:', displayModelId);
                }
            }

            if (displayModelId) {
                // Model is loaded, update the UI
                isModelLoaded = true;

                // Set the global current model to maintain consistency
                window.currentLoadedModel = displayModelId;

                // Update both the header and list with the SAME model ID
                displayCurrentModel(displayModelId);

                // Refresh the available models in the list, using the same model ID we just set in the header
                if (allAvailableModels.length > 0) {
                    displayAvailableModels(allAvailableModels, displayModelId);
                }

                // Update the current banner if it exists
                const { updateFileUploadCapabilities } = await import('./file-upload.js');
                await updateFileUploadCapabilities();
            } else {
                // No model is loaded, show the appropriate message
                isModelLoaded = false;
                displayNoModelsLoaded();

                // Don't automatically hide the banner as it would clear window.currentLoadedModel
                // Just visually hide the banner without affecting the global state
                if (loadedModelDisplay) {
                    loadedModelDisplay.classList.add('hidden');
                    loadedModelDisplay.textContent = 'No model loaded';
                    loadedModelDisplay.dataset.hasLoadedModel = 'false';
                }
            }
        }
    } catch (error) {
        console.error('Error updating model display:', error);
    }
}

/**
 * Shows the model loading modal with the specified model name
 * @param {string} modelId - ID of the model being loaded
 * @param {boolean} showSponsorMessage - If true, show sponsor message instead of regular loading text
 */
function showModelLoadingModal(modelId, showSponsorMessage = false) {
    if (modelLoadingModal && modelLoadingName) {
        // Record when we start showing the modal
        loadingModalStartTime = Date.now();

        // Set the model name in the modal
        modelLoadingName.textContent = modelId;

        // Update the modal content based on whether we're showing a sponsor message
        const titleElement = modelLoadingModal.querySelector('#model-loading-title');
        const messageElement = modelLoadingModal.querySelector('#model-loading-message');
        const spinnerWrapper = modelLoadingModal.querySelector('.loading-spinner-wrapper');
        const infoSection = modelLoadingModal.querySelector('.mt-6.flex.items-center.justify-center');

        if (showSponsorMessage) {
            // Show sponsor message variant
            if (titleElement) {
                titleElement.innerHTML = '<i class="fas fa-bullhorn mr-3"></i>Loading Model';
            }
            if (messageElement) {
                messageElement.textContent = 'A word from our sponsors while your model is loading...';
            }
            // Hide the spinner since the ad will take over
            if (spinnerWrapper) {
                spinnerWrapper.style.display = 'none';
            }
            // Hide the info section
            if (infoSection) {
                infoSection.style.display = 'none';
            }
        } else {
            // Standard loading message
            if (titleElement) {
                titleElement.innerHTML = '<i class="fas fa-robot mr-3"></i>Loading Model';
            }
            if (messageElement) {
                messageElement.textContent = 'Please wait while the model is being loaded...';
            }
            // Show the spinner
            if (spinnerWrapper) {
                spinnerWrapper.style.display = '';
            }
            // Show the info section
            if (infoSection) {
                infoSection.style.display = '';
            }
        }

        // Ensure modal is above all other content
        modelLoadingModal.style.zIndex = '2200';
        modelLoadingModal.style.display = 'flex';

        // Show the modal with animation
        modelLoadingModal.classList.remove('hidden');

        // Add animation class to modal content
        const modalContent = modelLoadingModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-in');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-in');
            }, 300);
        }

        console.log('Model loading modal shown for:', modelId, 'sponsor message:', showSponsorMessage, 'at time:', loadingModalStartTime);
    } else {
        console.error('Model loading modal elements not found');
    }
}

/**
 * Hides the model loading modal
 */
/**
 * Hides the model loading modal
 * @param {Function} [onBeforeHide] - Optional callback to run before the hide animation starts
 */
function hideModelLoadingModal(onBeforeHide) {
    if (modelLoadingModal) {
        const currentTime = Date.now();
        const elapsedTime = loadingModalStartTime ? currentTime - loadingModalStartTime : 0;
        const minDisplayTime = 1500; // Minimum 1.5 seconds display time

        console.log('Hiding modal - elapsed time:', elapsedTime, 'ms');

        // Ensure the modal is visible for at least the minimum time
        const delayTime = Math.max(0, minDisplayTime - elapsedTime);

        setTimeout(() => {
            // Run the callback if provided (e.g. to close underlying modals)
            if (onBeforeHide && typeof onBeforeHide === 'function') {
                onBeforeHide();
            }

            const modalContent = modelLoadingModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('animate-modal-out');
                setTimeout(() => {
                    modalContent.classList.remove('animate-modal-out');
                    modelLoadingModal.classList.add('hidden');
                    modelLoadingModal.style.display = 'none';

                    // Reset modal to default state for next use
                    const titleElement = modelLoadingModal.querySelector('#model-loading-title');
                    const messageElement = modelLoadingModal.querySelector('#model-loading-message');
                    const spinnerWrapper = modelLoadingModal.querySelector('.loading-spinner-wrapper');
                    const infoSection = modelLoadingModal.querySelector('.mt-6.flex.items-center.justify-center');
                    if (titleElement) {
                        titleElement.innerHTML = '<i class="fas fa-robot mr-3"></i>Loading Model';
                    }
                    if (messageElement) {
                        messageElement.textContent = 'Please wait while the model is being loaded...';
                    }
                    if (spinnerWrapper) {
                        spinnerWrapper.style.display = '';
                    }
                    if (infoSection) {
                        infoSection.style.display = '';
                    }
                }, 300);
            } else {
                modelLoadingModal.classList.add('hidden');
                modelLoadingModal.style.display = 'none';
            }

            console.log('Model loading modal hidden after total time:', Date.now() - loadingModalStartTime, 'ms');
            loadingModalStartTime = null;
        }, delayTime);
    } else {
        console.error('Model loading modal element not found');
    }
}

/**
 * Loads a model in LM Studio
 * @param {string} modelId - ID of the model to load
 */
async function loadModel(modelId) {
    try {
        // If a model is already loading, prevent loading another one
        if (isModelLoading) {
            console.log('Model already loading, ignoring request to load another model');
            return false;
        }

        // Set loading flag to true
        isModelLoading = true;

        // OpenRouter: model selection
        if (getUseOpenRouter()) {
            const showAdDuringLoad = !isAutoLoadingDefaultModel && shouldShowAds();

            if (showAdDuringLoad) {
                console.log('Showing interstitial ad during OpenRouter model load for:', modelId);

                showModelLoadingModal(modelId, true);
                disableLoadButtons();

                // Show loading indicator
                const modelElement = document.getElementById(`model-${modelId}`);
                if (modelElement) {
                    const actionSpan = modelElement.querySelector('.model-action');
                    if (actionSpan) {
                        actionSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Selecting...';
                    }
                }

                if (currentModelDisplay) {
                    currentModelDisplay.innerHTML = `
                        <div class="flex items-center text-yellow-500">
                            <i class="fas fa-spinner fa-spin mr-2 flex-shrink-0"></i>
                            <span class="truncate">Switching to: ${modelId}</span>
                        </div>
                    `;
                }

                let adDismissed = false;
                let modelResult = null;

                const adPromise = new Promise((resolve) => {
                    setTimeout(() => {
                        modelLoadingModal.classList.add('hidden');
                        modelLoadingModal.style.display = 'none';

                        showInterstitialAd('modelLoad', () => {
                            console.log('Ad dismissed during OpenRouter model load');
                            adDismissed = true;

                            if (modelResult === null) {
                                showModelLoadingModal(modelId, false);
                            }
                            resolve();
                        });
                    }, 2500);
                });

                const modelPromise = apiLoadModel(modelId).then(success => {
                    modelResult = success;
                    return success;
                });

                await Promise.all([adPromise, modelPromise]);

                await updateModelDisplay(modelId);

                hideModelLoadingModal(() => {
                    showOpenRouterModelSelectedModal(modelId);
                });
            } else {
                await apiLoadModel(modelId);
                await updateModelDisplay(modelId);
                if (!isAutoLoadingDefaultModel) {
                    showOpenRouterModelSelectedModal(modelId);
                }
            }

            if (isAutoLoadingDefaultModel) {
                isAutoLoadingDefaultModel = false;
            }

            isModelLoading = false;
            enableLoadButtons();
            return true;
        }

        // Determine if we should show an ad during loading
        const showAdDuringLoad = !isAutoLoadingDefaultModel && shouldShowAds();

        // Show the loading modal immediately ONLY if not auto-loading
        if (!isAutoLoadingDefaultModel) {
            showModelLoadingModal(modelId, showAdDuringLoad);
        } else {
            console.log('Auto-loading default model, skipping loading modal');
        }

        // Disable all load buttons in the modal
        disableLoadButtons();

        // Show loading indicator
        const modelElement = document.getElementById(`model-${modelId}`);
        if (modelElement) {
            const actionSpan = modelElement.querySelector('.model-action');
            if (actionSpan) {
                actionSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            }
        }

        // Update current model display to show switching status
        if (currentModelDisplay) {
            currentModelDisplay.innerHTML = `
                <div class="flex items-center text-yellow-500">
                    <i class="fas fa-spinner fa-spin mr-2 flex-shrink-0"></i>
                    <span class="truncate">Switching to: ${modelId}</span>
                </div>
            `;
        }

        console.log(`Requesting to load model: ${modelId}`);

        // --- Ad + model loading in parallel for non-premium users ---
        if (showAdDuringLoad) {
            console.log('Showing interstitial ad during model load for:', modelId);

            // Track completion of both ad and model loading
            let adDismissed = false;
            let modelResult = null; // null = pending, true = success, false = failure

            // Create a promise that resolves when the ad is dismissed
            const adPromise = new Promise((resolve) => {
                // Delay to let the user read the sponsor message before ad covers the screen
                setTimeout(() => {
                    // Hide the loading modal BEFORE launching the ad
                    // so nothing shows behind the native full-screen ad
                    modelLoadingModal.classList.add('hidden');
                    modelLoadingModal.style.display = 'none';

                    showInterstitialAd('modelLoad', () => {
                        console.log('Ad dismissed during model load');
                        adDismissed = true;

                        if (modelResult === null) {
                            // Model still loading — re-show loading modal with standard spinner
                            console.log('Model still loading, showing spinner');
                            showModelLoadingModal(modelId, false);
                        }

                        resolve();
                    });
                }, 2500);
            });

            // Start model loading in parallel
            const modelPromise = apiLoadModel(modelId).then(success => {
                modelResult = success;
                console.log('Model load completed during ad, success:', success);

                // If ad is already dismissed but model just finished, the loading modal
                // is still showing (we switched to spinner view) — it will be handled below
                return success;
            });

            // Wait for both to complete
            await Promise.all([adPromise, modelPromise]);

            // Both ad and model loading are done — now handle the result
            const success = modelResult;

            if (!success) {
                console.log(`Failed to load model: ${modelId}`);
                showActionError(modelId, 'Failed to load');
                hideModelLoadingModal();
                await updateModelDisplay(null);
                isModelLoading = false;
                enableLoadButtons();
                if (isAutoLoadingDefaultModel) {
                    isAutoLoadingDefaultModel = false;
                }
                return false;
            }

            console.log(`Successfully loaded model: ${modelId} (with ad)`);

            // Hide loading modal — models modal stays open
            hideModelLoadingModal(() => {
                console.log('Model loaded successfully with ad');
                if (!isAutoLoadingDefaultModel) {
                    showLocalModelLoadedModal(modelId);
                }
                if (isAutoLoadingDefaultModel) {
                    isAutoLoadingDefaultModel = false;
                }
            });
        } else {
            // --- Standard flow (premium users or auto-load) ---
            const success = await apiLoadModel(modelId);

            if (!success) {
                console.log(`Failed to load model: ${modelId}`);
                showActionError(modelId, 'Failed to load');
                if (!isAutoLoadingDefaultModel) {
                    hideModelLoadingModal();
                }
                await updateModelDisplay(null);
                isModelLoading = false;
                enableLoadButtons();
                if (isAutoLoadingDefaultModel) {
                    isAutoLoadingDefaultModel = false;
                }
                return false;
            }

            console.log(`Successfully loaded model: ${modelId}`);

            if (!isAutoLoadingDefaultModel) {
                hideModelLoadingModal(() => {
                    console.log('Model loaded successfully');
                    showLocalModelLoadedModal(modelId);
                    if (isAutoLoadingDefaultModel) {
                        isAutoLoadingDefaultModel = false;
                    }
                });
            } else {
                console.log('Auto-load complete without UI interruption');
                isAutoLoadingDefaultModel = false;
            }
        }

        // Update global variable immediately to ensure consistency
        window.currentLoadedModel = modelId;

        // Update the UI with the newly loaded model
        await updateModelDisplay(modelId);

        // Update file upload capabilities for the new model
        const { updateFileUploadCapabilities } = await import('./file-upload.js');
        await updateFileUploadCapabilities();

        // Set loading flag back to false
        isModelLoading = false;

        // Re-enable all load buttons
        enableLoadButtons();

        return true;
    } catch (error) {
        console.error('Error loading model:', error);
        showActionError(modelId, 'Failed to load');

        // Hide the loading modal if it was shown
        if (!isAutoLoadingDefaultModel) {
            hideModelLoadingModal();
        }

        // Restore the current model display
        await updateModelDisplay(null);

        // Set loading flag back to false
        isModelLoading = false;

        // Re-enable all load buttons
        enableLoadButtons();

        // Reset auto-load flag if it was set
        if (isAutoLoadingDefaultModel) {
            isAutoLoadingDefaultModel = false;
        }

        return false;
    }
}

/**
 * Disables all load buttons in the modal
 */
function disableLoadButtons() {
    const loadButtons = availableModelsList.querySelectorAll('.load-model-btn');
    loadButtons.forEach(button => {
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
        button.classList.remove('hover:bg-blue-700');
    });
}

/**
 * Enables all load buttons in the modal
 */
function enableLoadButtons() {
    const loadButtons = availableModelsList.querySelectorAll('.load-model-btn');
    loadButtons.forEach(button => {
        button.disabled = false;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
        button.classList.add('hover:bg-blue-700');
    });
}

/**
 * Shows an error message for a model action
 * @param {string} modelId - ID of the model that had an error
 * @param {string} errorMsg - Error message to display
 */
function showActionError(modelId, errorMsg) {
    const modelElement = document.getElementById(`model-${modelId}`);
    if (modelElement) {
        const actionSpan = modelElement.querySelector('.model-action');
        if (actionSpan) {
            actionSpan.innerHTML = `<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> ${errorMsg}</span>`;

            // Reset after a delay
            setTimeout(() => {
                // Get the latest loaded model from the API
                const loadedModels = getAvailableModels();
                const isLoaded = loadedModels.includes(modelId);

                if (isLoaded) {
                    actionSpan.innerHTML = '<span class="text-xs bg-green-600 text-white px-2 py-1 rounded-full">Loaded</span>';
                } else {
                    actionSpan.innerHTML = '<button class="load-model-btn bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors duration-300 flex items-center"><i class="fas fa-play mr-1"></i>Load</button>';

                    // Re-attach the event listener
                    const loadButton = actionSpan.querySelector('.load-model-btn');
                    if (loadButton) {
                        loadButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            // Legacy ad trigger removed
                            await loadModel(modelId);
                        });
                    }
                }
            }, 3000);
        }
    }
}

/**
 * Displays the current model
 * @param {string} modelName - Name of the current model
 */
function displayCurrentModel(modelName) {
    if (currentModelDisplay) {
        // Handle dummy model display
        if (modelName === 'dummy/no-model-selected') {
            currentModelFullName = 'No Model Selected';
            currentModelDisplay.innerHTML = `
                <div class="flex items-center">
                    <div class="model-icon bg-yellow-500/20 text-yellow-400 loaded mr-3" id="current-model-icon" title="Please select a model">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="model-name font-medium" style="color: #facc15;">Please select a model to continue</div>
                    </div>
                </div>
            `;
        } else {
            // Regular model display
            currentModelFullName = modelName;
            currentModelDisplay.innerHTML = `
                <div class="flex items-center">
                    <div class="model-icon bg-green-500/20 text-green-400 loaded mr-3" id="current-model-icon" title="Click to see full model name">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="model-name font-medium">${modelName}</div>
                    </div>
                </div>
            `;
        }

        // Add click event to the model icon only if not the dummy model
        const currentModelIcon = document.getElementById('current-model-icon');
        if (currentModelIcon) {
            if (modelName !== 'dummy/no-model-selected') {
                console.log('Setting up click handler for current model icon');
                currentModelIcon.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Current model icon clicked');
                    showFullModelNameModal();
                };
            } else {
                currentModelIcon.onclick = null;
            }
        }


    }
}

/**
 * Attaches a live search/filter bar to the model list (OpenRouter only).
 * Must be called after the section title has been appended but before model items.
 * @param {HTMLElement} container - The parent list container
 * @param {boolean} isLightTheme
 */
function attachModelSearch(container, isLightTheme) {
    const wrapper = document.createElement('div');
    wrapper.id = 'or-model-search-wrapper';
    wrapper.className = 'mb-5 pb-1';
    wrapper.innerHTML = `
        <div class="relative max-w-full" style="width: calc(100% - 16px); margin: 0 auto;">
            <i class="fas fa-search absolute top-1/2 -translate-y-1/2 ${isLightTheme ? 'text-gray-400' : 'text-gray-500'} pointer-events-none text-sm" style="left: 0.75rem;"></i>
            <input id="or-model-search"
                type="text"
                placeholder="Search models..."
                autocomplete="off"
                class="w-full pr-10 py-3 rounded-xl text-sm border outline-none transition-colors duration-200 ${isLightTheme ? 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500' : 'bg-darkBg-70 border-white/10 text-gray-200 placeholder-gray-500 focus:border-blue-500/60'}"
                style="box-sizing: border-box; max-width: 100%; padding-left: 2rem;"
            />
            <button id="or-model-search-clear" class="absolute right-3 top-1/2 -translate-y-1/2 hidden text-gray-500 hover:text-gray-300 w-8 h-8 flex items-center justify-center">
                <i class="fas fa-times text-sm"></i>
            </button>
        </div>
        <div id="or-model-search-count" class="mt-2 text-xs text-right" style="color: ${isLightTheme ? '#9ca3af' : '#6b7280'}; padding-right: 8px;"></div>
    `;
    container.appendChild(wrapper);

    const searchInput = wrapper.querySelector('#or-model-search');
    const clearBtn = wrapper.querySelector('#or-model-search-clear');
    const countDisplay = wrapper.querySelector('#or-model-search-count');

    function applyFilter() {
        const q = searchInput.value.toLowerCase().trim();
        clearBtn.classList.toggle('hidden', q === '');
        const items = container.querySelectorAll('.model-item');
        let visible = 0;
        items.forEach(item => {
            const name = (item.querySelector('.model-name')?.textContent || '').toLowerCase();
            const show = q === '' || name.includes(q);
            item.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        const noResultsId = 'or-model-search-empty';
        let noResults = container.querySelector('#' + noResultsId);
        if (q !== '' && visible === 0) {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.id = noResultsId;
                noResults.className = 'py-4 text-center text-sm';
                noResults.style.color = isLightTheme ? '#6b7280' : '#9ca3af';
                noResults.innerHTML = '<i class="fas fa-search mr-2 opacity-50"></i>No models match your search';
                container.appendChild(noResults);
            }
            noResults.style.display = '';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
        countDisplay.textContent = q !== '' ? `${visible} of ${items.length} models` : '';
    }

    searchInput.addEventListener('input', applyFilter);
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applyFilter();
        searchInput.focus();
    });
}

/**
 * Displays all available models
 * @param {Object[]} models - Array of model objects
 * @param {string} loadedModelId - ID of the currently loaded model
 */
function displayAvailableModels(models, loadedModelId) {
    if (availableModelsList) {
        const isLightTheme = document.body.classList.contains('light-theme');
        const textClass = isLightTheme ? 'text-gray-700' : 'text-gray-300';
        const mutedTextClass = isLightTheme ? 'text-gray-500' : 'text-gray-400';
        const bgClass = isLightTheme ? 'bg-gray-100' : 'bg-darkBg-70';
        const borderClass = isLightTheme ? 'border-gray-200' : 'border-white/5';

        if (models.length === 0) {
            const noModelsTextColor = isLightTheme ? '#6b7280' : '#9ca3af'; // gray-500 : gray-400
            availableModelsList.innerHTML = `
                <div class="p-4 ${bgClass} rounded-xl ${borderClass} border flex items-center" style="color: ${noModelsTextColor} !important;">
                    <i class="fas fa-info-circle mr-3 text-blue-400"></i>
                    <span>No models available</span>
                </div>
            `;
            return;
        }

        // Preserve any active search query so it survives the re-render
        const existingSearchQuery = availableModelsList.querySelector('#or-model-search')?.value || '';

        // Clear the list
        availableModelsList.innerHTML = '';

        // Add a section title
        const titleElement = document.createElement('div');
        titleElement.className = `mb-4 pb-2 border-b ${isLightTheme ? 'border-gray-200' : 'border-white/10'} flex items-center`;
        titleElement.innerHTML = `
            <div class="icon-wrapper mr-3 flex items-center justify-center rounded-full bg-purple-500/20 w-8 h-8 text-purple-400 shadow-md">
                <i class="fas fa-list-ul text-sm"></i>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-blue-400">Available Models</h3>
                <p class="text-sm" style="color: ${isLightTheme ? '#6b7280' : '#9ca3af'} !important;">${getUseOpenRouter() ? 'Click &quot;Select&quot; to use a different cloud model' : 'Click &quot;Load&quot; to switch to a different model'}</p>
            </div>
        `;
        availableModelsList.appendChild(titleElement);

        // Inject live search bar for OpenRouter (catalog can have hundreds of models)
        if (getUseOpenRouter()) {
            attachModelSearch(availableModelsList, isLightTheme);

            // Restore the previous search query (and re-apply the filter) so that
            // selecting a model while a search is active doesn't reset the list.
            if (existingSearchQuery) {
                const newSearchInput = availableModelsList.querySelector('#or-model-search');
                if (newSearchInput) {
                    newSearchInput.value = existingSearchQuery;
                    newSearchInput.dispatchEvent(new Event('input'));
                }
            }
        }

        // IMPORTANT: Use the SAME loadedModelId that was passed in to ensure consistency between
        // the "Currently loaded model" header and the model marked as loaded in the list
        const currentLoadedModelId = loadedModelId;

        // Log for debugging
        console.log('Displaying models with loaded model ID:', currentLoadedModelId);

        // Render models in chunks to avoid blocking the WebView's main thread.
        // OpenRouter catalogs can have 300+ entries; appending them all synchronously
        // causes the list to appear frozen/truncated on mobile.
        const CHUNK_SIZE = 50;
        let renderIndex = 0;
        (function renderNextChunk() {
            const end = Math.min(renderIndex + CHUNK_SIZE, models.length);
            for (; renderIndex < end; renderIndex++) {
                const model = models[renderIndex];
                
                // Skip the dummy model - it's only for internal state tracking
                if (model.id === 'dummy/no-model-selected') {
                    continue;
                }
                
                const modelElement = document.createElement('div');
                modelElement.id = `model-${model.id}`;

                const isCurrentModel = model.id === currentLoadedModelId;
                const defaultModelId = getDefaultModelId();
                const isDefaultModel = defaultModelId && model.id === defaultModelId;

                modelElement.className = isCurrentModel ? 'model-item loaded' : 'model-item';
                const displayModelName = model.id === 'dummy/no-model-selected' 
                    ? '⚠️ No Model Selected'
                    : model.id;
                modelElement.innerHTML = `
                <div class="model-icon ${isCurrentModel ? 'bg-green-500/20 text-green-400 loaded' : 'bg-blue-500/20 text-blue-400'}" data-model-id="${model.id}" title="Click to see full model name">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="model-content">
                    <div class="model-name">${displayModelName}</div>
                </div>
                <div class="model-actions">
                    <button class="set-default-btn ${isDefaultModel ? 'default-active' : ''}" data-model-id="${model.id}" title="${isDefaultModel ? 'Remove as default' : 'Set as default'}">
                        <i class="fas fa-star"></i>
                    </button>
                    ${isCurrentModel ?
                        '<button class="load-model-btn model-loaded" type="button" disabled aria-disabled="true"><i class="fas fa-check-circle"></i>' + (getUseOpenRouter() ? 'Active' : 'Loaded') + '</button>' :
                        '<button class="load-model-btn"><i class="fas fa-' + (getUseOpenRouter() ? 'check' : 'plug') + '"></i>' + (getUseOpenRouter() ? 'Select' : 'Load') + '</button>'
                    }
                </div>
            `;

                availableModelsList.appendChild(modelElement);

                // Immediately apply the active search filter so items appended
                // in later chunks are correctly hidden if they don't match.
                if (getUseOpenRouter()) {
                    const si = availableModelsList.querySelector('#or-model-search');
                    if (si) {
                        const q = si.value.toLowerCase().trim();
                        if (q && !model.id.toLowerCase().includes(q)) {
                            modelElement.style.display = 'none';
                        }
                    }
                }

                // Add event listener to the load button if this is not the current model
                if (!isCurrentModel) {
                    const loadButton = modelElement.querySelector('.load-model-btn');
                    if (loadButton) {
                        loadButton.addEventListener('click', async (e) => {
                            e.preventDefault();
                            await loadModel(model.id);
                        });
                        if (isModelLoading) {
                            loadButton.disabled = true;
                            loadButton.classList.add('opacity-50', 'cursor-not-allowed');
                            loadButton.classList.remove('hover:from-blue-600', 'hover:to-blue-700');
                        }
                    }
                }

                // Add event listener to the model icon to show full model name
                const modelIcon = modelElement.querySelector('.model-icon');
                if (modelIcon) {
                    modelIcon.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        currentModelFullName = model.id;
                        showFullModelNameModal();
                    };
                }

                // Add event listener to the "Set Default" button
                const setDefaultButton = modelElement.querySelector('.set-default-btn');
                if (setDefaultButton) {
                    setDefaultButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const modelId = setDefaultButton.dataset.modelId;
                        const currentDefault = getDefaultModelId();
                        if (currentDefault === modelId) {
                            setDefaultModelId(null);
                            displayAvailableModels(allAvailableModels, currentLoadedModelId);
                        } else {
                            showDefaultModelConfirmationModal(modelId);
                        }
                    });
                }
            }
            // Update the search count display after each chunk
            if (getUseOpenRouter()) {
                const si = availableModelsList.querySelector('#or-model-search');
                if (si && si.value.trim()) si.dispatchEvent(new Event('input'));
            }
            if (renderIndex < models.length) setTimeout(renderNextChunk, 0);
        })();
    }
}

/**
 * Displays potential models that are available but not loaded
 * @param {Object[]} models - Array of model objects
 */
function displayPotentialModels(models) {
    if (availableModelsList) {
        const isLightTheme = document.body.classList.contains('light-theme');
        const textClass = isLightTheme ? 'text-gray-700' : 'text-gray-300';
        const mutedTextClass = isLightTheme ? 'text-gray-500' : 'text-gray-400';
        const bgClass = isLightTheme ? 'bg-gray-100' : 'bg-darkBg-70';
        const borderClass = isLightTheme ? 'border-gray-200' : 'border-white/5';

        if (models.length === 0) {
            const noModelsTextColor = isLightTheme ? '#6b7280' : '#9ca3af'; // gray-500 : gray-400
            availableModelsList.innerHTML = `
                <div class="p-4 ${bgClass} rounded-xl ${borderClass} border flex items-center" style="color: ${noModelsTextColor} !important;">
                    <i class="fas fa-info-circle mr-3 text-blue-400"></i>
                    <span>No models available</span>
                </div>
            `;
            return;
        }

        // Clear the list
        availableModelsList.innerHTML = '';

        // Add a section title
        const titleElement = document.createElement('div');
        titleElement.className = `mb-4 pb-2 border-b ${isLightTheme ? 'border-gray-200' : 'border-white/10'} flex items-center`;
        titleElement.innerHTML = `
            <div class="icon-wrapper mr-3 flex items-center justify-center rounded-full bg-purple-500/20 w-8 h-8 text-purple-400 shadow-md">
                <i class="fas fa-list-ul text-sm"></i>
            </div>
            <div>
                <h3 class="text-lg font-semibold text-blue-400">Available Models</h3>
                <p class="text-sm" style="color: ${isLightTheme ? '#6b7280' : '#9ca3af'} !important;">${getUseOpenRouter() ? 'Click &quot;Select&quot; to use a cloud model' : 'Select a model to load it'}</p>
            </div>
        `;
        availableModelsList.appendChild(titleElement);

        // Inject live search bar for OpenRouter (catalog can have hundreds of models)
        if (getUseOpenRouter()) {
            attachModelSearch(availableModelsList, isLightTheme);
        }

        // Render models in chunks to avoid blocking the WebView's main thread.
        // OpenRouter catalogs can have 300+ entries; appending them all synchronously
        // causes the list to appear frozen/truncated on mobile.
        const CHUNK_SIZE = 50;
        let renderIndex = 0;
        (function renderNextChunk() {
            const end = Math.min(renderIndex + CHUNK_SIZE, models.length);
            for (; renderIndex < end; renderIndex++) {
                const model = models[renderIndex];
                
                // Skip the dummy model - it's only for internal state tracking
                if (model.id === 'dummy/no-model-selected') {
                    continue;
                }
                
                const modelElement = document.createElement('div');
                modelElement.id = `model-${model.id}`;

                const isDefaultModel = model.id === getDefaultModelId();

                modelElement.className = 'model-item';
                modelElement.innerHTML = `
                <div class="model-icon bg-blue-500/20 text-blue-400" data-model-id="${model.id}" title="Click to see full model name">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="model-content">
                    <div class="model-name">${model.id}</div>
                </div>
                <div class="model-actions">
                    <button class="set-default-btn ${isDefaultModel ? 'default-active' : ''}" data-model-id="${model.id}" title="${isDefaultModel ? 'Remove as default' : 'Set as default'}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="load-model-btn"><i class="fas fa-${getUseOpenRouter() ? 'check' : 'plug'}"></i>${getUseOpenRouter() ? 'Select' : 'Load'}</button>
                </div>
            `;

                availableModelsList.appendChild(modelElement);

                // Immediately apply the active search filter so items appended
                // in later chunks are correctly hidden if they don't match.
                if (getUseOpenRouter()) {
                    const si = availableModelsList.querySelector('#or-model-search');
                    if (si) {
                        const q = si.value.toLowerCase().trim();
                        if (q && !model.id.toLowerCase().includes(q)) {
                            modelElement.style.display = 'none';
                        }
                    }
                }

                // Add event listener to the load button
                const loadButton = modelElement.querySelector('.load-model-btn');
                if (loadButton) {
                    loadButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await loadModel(model.id);
                    });
                    if (isModelLoading) {
                        loadButton.disabled = true;
                        loadButton.classList.add('opacity-50', 'cursor-not-allowed');
                        loadButton.classList.remove('hover:from-blue-600', 'hover:to-blue-700');
                    }
                }

                // Add event listener to the model icon to show full model name
                const modelIcon = modelElement.querySelector('.model-icon');
                if (modelIcon) {
                    modelIcon.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        currentModelFullName = model.id;
                        showFullModelNameModal();
                    };
                }

                // Add event listener to the "Set Default" button
                const setDefaultButton = modelElement.querySelector('.set-default-btn');
                if (setDefaultButton) {
                    setDefaultButton.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const modelId = setDefaultButton.dataset.modelId;
                        const currentDefault = getDefaultModelId();
                        if (currentDefault === modelId) {
                            setDefaultModelId(null);
                            displayPotentialModels(allAvailableModels);
                        } else {
                            showDefaultModelConfirmationModal(modelId);
                        }
                    });
                }
            }
            // Update the search count display after each chunk
            if (getUseOpenRouter()) {
                const si = availableModelsList.querySelector('#or-model-search');
                if (si && si.value.trim()) si.dispatchEvent(new Event('input'));
            }
            if (renderIndex < models.length) setTimeout(renderNextChunk, 0);
        })();
    }
}

/**
 * Displays a message when no models are available
 */
function displayNoModelsAvailable() {
    if (currentModelDisplay) {
        currentModelDisplay.innerHTML = `
            <div class="flex items-center">
                <div class="icon-wrapper mr-3 flex-shrink-0 flex items-center justify-center rounded-full bg-yellow-500/20 w-8 h-8 text-yellow-400 shadow-md">
                    <i class="fas fa-exclamation-triangle text-sm"></i>
                </div>
                <div class="flex-1 min-w-0 current-model-name-container">
                    <span class="break-words current-model-name">No models available</span>
                </div>
            </div>
        `;


    }
}

/**
 * Displays a message when models are available but not loaded
 */
function displayNoModelsLoaded() {
    if (currentModelDisplay) {
        currentModelDisplay.innerHTML = `
            <div class="flex items-center">
                <div class="icon-wrapper mr-3 flex-shrink-0 flex items-center justify-center rounded-full bg-yellow-500/20 w-8 h-8 text-yellow-400 shadow-md">
                    <i class="fas fa-exclamation-triangle text-sm"></i>
                </div>
                <div class="flex-1 min-w-0 current-model-name-container">
                    <span class="break-words current-model-name">${getUseOpenRouter() ? 'No model selected' : 'No model loaded'}</span>
                </div>
            </div>
        `;


    }
}

/**
 * Displays a server error message
 */
function displayServerError() {
    if (currentModelDisplay) {
        currentModelDisplay.innerHTML = `
            <div class="flex items-center">
                <div class="icon-wrapper mr-3 flex-shrink-0 flex items-center justify-center rounded-full bg-red-500/20 dark:bg-red-500/20 light:bg-red-500/20 w-8 h-8 text-red-400 dark:text-red-400 light:text-red-600 shadow-md">
                    <i class="fas fa-exclamation-circle text-sm"></i>
                </div>
                <div class="flex-1 min-w-0 current-model-name-container">
                    <span class="break-words current-model-name">Server not responding</span>
                </div>
            </div>
        `;


    }

    if (availableModelsList) {
        availableModelsList.innerHTML = '';
    }
}

/**
 * Shows the full model name modal
 */
function showFullModelNameModal() {
    // Get fresh reference to the modal in case the original reference is stale
    const modalElement = document.getElementById('full-model-name-modal');

    if (modalElement) {
        // Set the full model name in the modal
        const modelNameDisplay = document.getElementById('full-model-name');
        if (modelNameDisplay) {
            if (currentModelFullName) {
                modelNameDisplay.textContent = currentModelFullName;
            } else {
                modelNameDisplay.innerHTML = `
                    <div class="flex items-center text-yellow-500">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        <span>No model information available</span>
                    </div>
                `;
            }
        }

        // Add event listener to close button
        const closeButton = document.getElementById('close-full-model-name');
        if (closeButton) {
            // Remove existing listeners to avoid duplicates
            const newCloseButton = closeButton.cloneNode(true);
            if (closeButton.parentNode) {
                closeButton.parentNode.replaceChild(newCloseButton, closeButton);
            }

            // Add click event to the new button
            newCloseButton.addEventListener('click', closeFullModelNameModal);
        }

        // Add event listener to close when clicking outside the modal content
        modalElement.addEventListener('click', function (e) {
            if (e.target === modalElement) {
                closeFullModelNameModal();
            }
        });

        // Show the modal with animation
        modalElement.classList.remove('hidden');
        const modalContent = modalElement.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-in');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-in');
            }, 300);
        }
    } else {
        console.error('Full model name modal element not found in the DOM');
    }
}

/**
 * Shows mobile instructions if the user is on a smartphone
 */
function showMobileInstructionsIfNeeded() {
    const mobileInstructions = document.getElementById('mobile-instructions');
    if (mobileInstructions) {
        // Check if user is on a smartphone (767px or below)
        const isSmartphone = window.innerWidth <= 767;

        if (isSmartphone) {
            mobileInstructions.classList.remove('hidden');
            console.log('Showing mobile instructions for smartphone user');
        } else {
            mobileInstructions.classList.add('hidden');
            console.log('Hiding mobile instructions for tablet/desktop user');
        }
    }
}

/**
 * Closes the full model name modal
 */
function closeFullModelNameModal() {
    const modal = document.getElementById('full-model-name-modal');
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-out');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-out');
                modal.classList.add('hidden');
            }, 300);
        } else {
            modal.classList.add('hidden');
        }
    }
}

/**
 * Shows the default model loaded success modal
 * @param {string} modelName - The name of the loaded default model
 */
function showDefaultModelLoadedModal(modelName) {
    console.log('showDefaultModelLoadedModal called with:', modelName);
    const modal = document.getElementById('default-model-loaded-modal');
    const modelNameDisplay = document.getElementById('default-model-loaded-name');

    console.log('Modal element:', modal);
    console.log('Model name display element:', modelNameDisplay);

    if (modal && modelNameDisplay) {
        console.log('Elements found, setting model name and showing modal');

        // Update title to be generic
        const modalTitle = document.getElementById('default-model-loaded-title');
        if (modalTitle) {
            const titleSpan = modalTitle.querySelector('span');
            if (titleSpan) {
                titleSpan.textContent = 'Model Successfully Loaded';
            }
        }

        // Set the model name
        modelNameDisplay.textContent = modelName;

        // Show the modal with animation
        modal.classList.remove('hidden');
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-in');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-in');
            }, 300);
        }

        // Auto-close after 3 seconds
        setTimeout(() => {
            console.log('Auto-closing success modal after 3 seconds');
            closeDefaultModelLoadedModal();
        }, 3000);
    } else {
        console.error('Could not find modal or modelNameDisplay elements!');
        if (!modal) console.error('Modal element not found');
        if (!modelNameDisplay) console.error('Model name display element not found');
    }
}

/**
 * Shows a brief confirmation modal when an OpenRouter model is selected.
 * @param {string} modelId - The ID of the selected model
 */
function showOpenRouterModelSelectedModal(modelId) {
    const modal = document.getElementById('openrouter-model-selected-modal');
    const nameDisplay = document.getElementById('openrouter-model-selected-name');
    if (!modal || !nameDisplay) return;

    nameDisplay.textContent = modelId;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('animate-modal-in');
        setTimeout(() => modalContent.classList.remove('animate-modal-in'), 300);
    }

    // Auto-close after 3 seconds
    setTimeout(() => {
        if (modalContent) {
            modalContent.classList.add('animate-modal-out');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-out');
                modal.classList.add('hidden');
                modal.style.display = '';
            }, 300);
        } else {
            modal.classList.add('hidden');
            modal.style.display = '';
        }
    }, 3000);
}

/**
 * Shows a brief confirmation modal when a local AI model is successfully loaded.
 * @param {string} modelId - The ID of the loaded model
 */
function showLocalModelLoadedModal(modelId) {
    const modal = document.getElementById('local-model-loaded-modal');
    const nameDisplay = document.getElementById('local-model-loaded-name');
    if (!modal || !nameDisplay) return;

    nameDisplay.textContent = modelId;
    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.classList.add('animate-modal-in');
        setTimeout(() => modalContent.classList.remove('animate-modal-in'), 300);
    }

    // Auto-close after 3 seconds
    setTimeout(() => {
        if (modalContent) {
            modalContent.classList.add('animate-modal-out');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-out');
                modal.classList.add('hidden');
                modal.style.display = '';
            }, 300);
        } else {
            modal.classList.add('hidden');
            modal.style.display = '';
        }
    }, 3000);
}

/**
 * Closes the default model loaded success modal
 */
function closeDefaultModelLoadedModal() {
    const modal = document.getElementById('default-model-loaded-modal');
    if (modal) {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-out');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-out');
                modal.classList.add('hidden');
            }, 300);
        } else {
            modal.classList.add('hidden');
        }
    }
}

/**
 * Shows the confirmation modal for setting a default model
 * @param {string} modelId - The ID of the model to set as default
 */
function showDefaultModelConfirmationModal(modelId) {
    if (confirmDefaultModelModal && confirmDefaultModelName) {
        pendingDefaultModelId = modelId;
        confirmDefaultModelName.textContent = modelId;

        confirmDefaultModelModal.classList.remove('hidden');
        confirmDefaultModelModal.style.display = 'flex';

        const modalContent = confirmDefaultModelModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-in');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-in');
            }, 300);
        }
    } else {
        console.error('Confirmation modal elements not found');
    }
}

/**
 * Hides the default model confirmation modal
 */
function hideDefaultModelConfirmationModal() {
    if (confirmDefaultModelModal) {
        const modalContent = confirmDefaultModelModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-modal-out');
            setTimeout(() => {
                modalContent.classList.remove('animate-modal-out');
                confirmDefaultModelModal.classList.add('hidden');
                confirmDefaultModelModal.style.display = 'none';
                pendingDefaultModelId = null;
            }, 300);
        } else {
            confirmDefaultModelModal.classList.add('hidden');
            confirmDefaultModelModal.style.display = 'none';
            pendingDefaultModelId = null;
        }
    }
}

/**
 * Handles the confirmation of setting the default model
 */
function handleConfirmDefaultModel() {
    if (pendingDefaultModelId) {
        console.log('Confirmed setting default model:', pendingDefaultModelId);
        setDefaultModelId(pendingDefaultModelId);

        // Refresh the UI
        // We need to check if we are in available models list or potential models list
        // Since we don't have that context here easily, we can try to guess or just refresh current view
        // Ideally we should have a way to know which list is active or just refresh both implicitly

        if (isModelLoaded) {
            displayAvailableModels(allAvailableModels, window.currentLoadedModel);
        } else {
            displayPotentialModels(allAvailableModels);
        }

        hideDefaultModelConfirmationModal();
    }
}