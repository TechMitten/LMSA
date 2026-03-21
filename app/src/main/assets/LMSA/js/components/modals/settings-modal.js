export const settingsModal = `
    <!-- Settings modal -->
    <div id="settings-modal" class="fixed inset-0 items-center justify-center hidden modal-container"
        aria-labelledby="settings-title" role="dialog" aria-modal="true">
        <div class="modal-content">
            <!-- Settings Header -->
            <div class="flex flex-col sticky top-0 z-10 mb-6 pb-1 border-b border-gray-700/30 bg-inherit">
                <div class="flex justify-between items-center mb-1">
                    <h2 id="settings-title" class="text-xl font-bold flex items-center">
                        <i class="fas fa-cog text-blue-400 mr-2"></i>Settings
                    </h2>
                    <button id="close-settings-x" aria-label="Close settings">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                <p id="settings-step-subtitle" class="text-sm text-blue-400 font-medium mb-2">Server Connection</p>

                <!-- Step indicators - visible on all screen sizes -->
                <div class="flex justify-center space-x-3 py-2">
                    <div class="w-8 h-2 rounded-full bg-blue-500" id="step-indicator-1"></div>
                    <div class="w-8 h-2 rounded-full bg-gray-600" id="step-indicator-2"></div>
                    <div class="w-8 h-2 rounded-full bg-gray-600" id="step-indicator-3"></div>
                    <div class="w-8 h-2 rounded-full bg-gray-600" id="step-indicator-4"></div>
                    <div class="w-8 h-2 rounded-full bg-gray-600" id="step-indicator-5"></div>
                </div>
            </div>

            <!-- Settings Content - Multi-step on mobile -->
            <div id="settings-content-wrapper" class="relative px-1"
                style="overflow-y: auto; overflow-x: hidden; touch-action: pan-y; overscroll-behavior: contain;">
                <!-- Step 1: Connection Settings (always visible first) -->
                <div id="settings-step-connection" class="settings-step active" data-step-name="Connection">
                    <!-- Hidden checkbox retained for JS/event compatibility -->
                    <input type="checkbox" id="openrouter-toggle" class="sr-only" aria-hidden="true" tabindex="-1">

                    <!-- Connection Type Selector -->
                    <div class="connection-type-selector mb-4">
                        <button id="select-local-server" class="connection-type-btn active" type="button" aria-pressed="true">
                            <div class="connection-type-icon"><i class="fas fa-server"></i></div>
                            <span class="connection-type-name">Local Server</span>
                        </button>
                        <button id="select-openrouter" class="connection-type-btn" type="button" aria-pressed="false">
                            <div class="connection-type-icon"><i class="fas fa-cloud"></i></div>
                            <span class="connection-type-name">OpenRouter</span>
                        </button>
                    </div>

                    <!-- Local Server Panel -->
                    <div id="local-server-settings" class="connection-settings-panel">
                        <!-- Server address status row -->
                        <div class="connection-status-row">
                            <div class="connection-status-info">
                                <i class="fas fa-network-wired connection-status-icon"></i>
                                <span id="local-server-status-text" class="connection-status-text">Not configured</span>
                            </div>
                            <button id="configure-local-server-btn" type="button"
                                class="professional-button flex items-center justify-center gap-2 px-4 h-[40px]">
                                <i class="fas fa-pencil-alt text-xs"></i>
                                <span>Configure</span>
                            </button>
                        </div>
                        <!-- LM Studio API Token row (optional — for auth-enabled servers) -->
                        <div class="connection-status-row mt-3">
                            <div class="connection-status-info">
                                <i class="fas fa-key connection-status-icon"></i>
                                <span id="lmstudio-token-status-text" class="connection-status-text">No token (optional)</span>
                            </div>
                            <button id="configure-lmstudio-token-btn" type="button"
                                class="professional-button flex items-center justify-center gap-2 px-4 h-[40px]">
                                <i class="fas fa-pencil-alt text-xs"></i>
                                <span>Token</span>
                            </button>
                        </div>
                        <p class="text-xs text-gray-300 mt-2">Need help? Visit the <a href="#" id="open-help-from-settings-link" class="text-blue-400 hover:text-blue-300 underline">LMSA Help section</a>.</p>
                    </div>

                    <!-- OpenRouter Panel -->
                    <div id="openrouter-settings" class="connection-settings-panel hidden">
                        <p class="text-xs text-gray-400 mb-3">Connect to cloud AI models via your own OpenRouter API key. Smart Reply is unavailable with OpenRouter.</p>
                        <!-- API key status row -->
                        <div class="connection-status-row">
                            <div class="connection-status-info">
                                <i class="fas fa-key connection-status-icon"></i>
                                <span id="openrouter-key-status-text" class="connection-status-text">No API key saved</span>
                            </div>
                            <button id="configure-openrouter-key-btn" type="button"
                                class="professional-button flex items-center justify-center gap-2 px-4 h-[40px]">
                                <i class="fas fa-pencil-alt text-xs"></i>
                                <span>Configure</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Step 2: System Prompt -->
                <div id="settings-step-prompt" class="settings-step hidden" data-step-name="Prompt">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-1 system-prompt-heading" role="presentation" aria-hidden="true">
                            <i class="fas fa-comment-dots mr-2 text-blue-400"></i>System Prompt (Optional):</label>

                        <!-- Hidden real textarea that holds the actual value -->
                        <textarea id="system-prompt" class="hidden" rows="4"></textarea>

                        <!-- Display current prompt value (non-interactive) -->
                        <div id="system-prompt-preview"
                            class="border p-3 rounded-lg min-h-[80px] mb-2 whitespace-pre-wrap"
                            style="background-color: var(--settings-input-bg); color: var(--settings-input-text); border-color: var(--settings-input-border);">
                            <span class="italic" id="prompt-placeholder" style="color: var(--text-muted);"></span>
                        </div>

                        <!-- Edit and Save buttons -->
                        <div class="flex gap-2">
                            <button id="edit-system-prompt-btn"
                                class="professional-button flex items-center justify-center gap-3 flex-1 h-[48px]">
                                <i class="fas fa-edit text-sm"></i>
                                <span>Edit</span>
                            </button>
                            <button id="save-system-prompt-btn"
                                class="professional-button flex items-center justify-center gap-3 flex-1 h-[48px]">
                                <i class="fas fa-save text-sm"></i>
                                <span>+ Add</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Options -->
                <div id="settings-step-options" class="settings-step hidden" data-step-name="Options">
                    <div class="mb-4">
                        <label for="temperature" class="block text-sm font-medium mb-1">
                            <i class="fas fa-sliders-h mr-2 text-blue-400"></i>Temperature: <span
                                id="temperature-value">0.3</span></label>
                        <div class="flex items-center">
                            <input type="range" id="temperature" min="0" max="2" step="0.1" value="0.3"
                                class="w-full bg-darkTertiary text-gray-100 rounded-lg appearance-none cursor-pointer"
                                disabled>
                            <button id="temperature-lock" class="ml-2 text-gray-100 focus:outline-none p-2"
                                aria-label="Toggle Temperature Lock" title="Temperature is locked (click to unlock)">
                                <i class="fas fa-lock text-red-400"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="ollama-toggle" class="text-sm font-medium">
                                <i class="fas fa-network-wired mr-2 text-blue-400"></i>Use Ollama Connection</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="ollama-toggle">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">Enable to communicate with a local Ollama server (default
                            port 11434). Disables manual model loading.</p>
                    </div>
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="hide-thinking" class="text-sm font-medium">
                                <i class="fas fa-eye-slash mr-2 text-blue-400"></i>Hide Thinking Text</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="hide-thinking">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">When enabled, hides text between &lt;think&gt; tags in
                            model responses</p>
                    </div>
                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="auto-generate-titles" class="text-sm font-medium">
                                <i class="fas fa-magic mr-2 text-blue-400"></i>Generate Chat Titles</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="auto-generate-titles">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">When enabled, uses the LLM to generate a short title (2-3
                            words) that describes what the chat is about based on your first message.</p>
                    </div>

                    <div class="mb-5" id="smart-reply-setting">
                        <div class="flex justify-between items-center mb-2">
                            <label for="auto-smart-reply" class="text-sm font-medium">
                                <i class="fas fa-reply mr-2 text-blue-400"></i>Enable Smart Reply</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="auto-smart-reply">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p id="smart-reply-description" class="text-xs text-gray-400 mt-1">When enabled, the LLM will analyze the conversation and suggest interactive tap-to-reply options above the chat input.</p>
                    </div>

                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="auto-scroll" class="text-sm font-medium">
                                <i class="fas fa-arrow-down mr-2 text-blue-400"></i>Auto-Scroll to Bottom</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="auto-scroll">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">When enabled, automatically scrolls to the bottom of the
                            chat while the LLM is streaming its response.</p>
                    </div>

                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="enter-newline-toggle" class="text-sm font-medium">
                                <i class="fas fa-keyboard mr-2 text-blue-400"></i>Enter for New Line</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="enter-newline-toggle">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">When enabled, Enter creates a new line. Use Shift+Enter or
                            the send button to send message.</p>
                    </div>

                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="show-model-label" class="text-sm font-medium">
                                <i class="fas fa-robot mr-2 text-blue-400"></i>Show Model Name</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="show-model-label">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">When enabled, shows the AI model name used to generate each response at the bottom of the message bubble.</p>
                    </div>

                    <div class="mb-5">
                        <div class="flex justify-between items-center mb-2">
                            <label for="show-chat-scrollbar" class="text-sm font-medium">
                                <i class="fas fa-bars mr-2 text-blue-400"></i>Show Chat Scrollbar</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="show-chat-scrollbar">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">When enabled, shows a scrollbar on the side of the chat message area.</p>
                    </div>

                    <div class="mb-5 hidden">
                        <div class="flex justify-between items-center mb-2">
                            <label for="theme-toggle" class="text-sm font-medium">
                                <i class="fas fa-moon mr-2 text-blue-400"></i>Light Theme</label>
                            <div class="toggle-container">
                                <input type="checkbox" id="theme-toggle">
                                <div class="toggle-switch"></div>
                                <div class="toggle-dot"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">When enabled, switches the app to light theme. When
                            disabled, uses the default dark theme.</p>
                    </div>

                    <div class="mb-5">
                        <label for="tts-voice-select" class="block text-sm font-medium mb-2">
                            <i class="fas fa-microphone mr-2 text-blue-400"></i>TTS Voice</label>
                        <select id="tts-voice-select"
                            class="w-full bg-darkTertiary text-gray-100 rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500">
                            <option value="">Loading voices...</option>
                        </select>
                        <p class="text-xs text-gray-400 mt-1">Select the text-to-speech voice for reading AI responses
                        </p>
                    </div>

                </div>

                <!-- Step 4: Font -->
                <div id="settings-step-font" class="settings-step hidden" data-step-name="Font">
                    <div class="mb-5">
                        <label for="chat-font-family-select" class="block text-sm font-medium mb-2">
                            <i class="fas fa-font mr-2 text-blue-400"></i>Chat Bubble Font</label>
                        <select id="chat-font-family-select"
                            class="w-full bg-darkTertiary text-gray-100 rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500">
                            <option value="system-ui, sans-serif">System Default</option>
                            <option value="Roboto, sans-serif">Roboto</option>
                            <option value="Arial, Helvetica, sans-serif">Sans-Serif (Arial)</option>
                            <option value="Georgia, serif">Serif (Georgia)</option>
                            <option value="'Courier New', monospace">Monospace (Courier)</option>
                        </select>
                        <p class="text-xs text-gray-400 mt-1">Select the font used in chat message bubbles</p>
                    </div>

                    <div class="mb-5">
                        <label for="chat-font-size-select" class="block text-sm font-medium mb-2">
                            <i class="fas fa-text-height mr-2 text-blue-400"></i>Chat Bubble Font Size</label>
                        <select id="chat-font-size-select"
                            class="w-full bg-darkTertiary text-gray-100 rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500">
                            <option value="12px">Extra Small</option>
                            <option value="14px">Small</option>
                            <option value="16px" selected>Medium (Default)</option>
                            <option value="20px">Large</option>
                            <option value="24px">Extra Large</option>
                        </select>
                        <p class="text-xs text-gray-400 mt-1">Select the text size used in chat message bubbles</p>
                    </div>
                </div>

                <!-- Step 5: Actions -->
                <div id="settings-step-actions" class="settings-step hidden" data-step-name="Actions">
                    <div class="mb-4">
                        <button id="clear-chat" class="settings-action-button">
                            <i class="fas fa-trash-alt text-sm"></i>
                            <span>Clear All Chats</span>
                        </button>

                        <button id="reset-app" class="settings-action-button">
                            <i class="fas fa-exclamation-triangle text-sm"></i>
                            <span>Reset App</span>
                        </button>

                        <button id="clear-openrouter-key" class="settings-action-button">
                            <i class="fas fa-key text-sm"></i>
                            <span>Clear OpenRouter Key</span>
                        </button>

                        <button id="clear-lmstudio-token" class="settings-action-button">
                            <i class="fas fa-key text-sm"></i>
                            <span>Clear LM Studio Token</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Navigation buttons container (static, above save button) -->
            <div id="settings-navigation-buttons" class="mt-5 mb-2">
                <!-- Connection step buttons -->
                <div class="flex justify-end navigation-buttons" id="connection-step-buttons">
                    <button id="to-prompt-step-btn"
                        class="professional-button flex items-center justify-center gap-3 w-[48%] h-[48px]">
                        <i class="fas fa-arrow-right text-sm"></i>
                        <span class="button-text">Next</span>
                    </button>
                </div>

                <!-- Prompt step buttons -->
                <div class="justify-between navigation-buttons hidden" id="prompt-step-buttons">
                    <button id="back-to-connection-btn"
                        class="professional-button flex items-center justify-center gap-3 w-[48%] h-[48px]">
                        <i class="fas fa-arrow-left text-sm"></i>
                        <span class="button-text">Back</span>
                    </button>
                    <button id="to-options-step-btn"
                        class="professional-button flex items-center justify-center gap-3 w-[48%] h-[48px]">
                        <i class="fas fa-arrow-right text-sm"></i>
                        <span class="button-text">Next</span>
                    </button>
                </div>

                <!-- Options step buttons -->
                <div class="justify-between navigation-buttons hidden" id="options-step-buttons">
                    <button id="back-to-prompt-btn"
                        class="professional-button flex items-center justify-center gap-3 w-[48%] h-[48px]">
                        <i class="fas fa-arrow-left text-sm"></i>
                        <span class="button-text">Back</span>
                    </button>
                    <button id="to-font-step-btn"
                        class="professional-button flex items-center justify-center gap-3 w-[48%] h-[48px]">
                        <i class="fas fa-arrow-right text-sm"></i>
                        <span class="button-text">Next</span>
                    </button>
                </div>

                <!-- Font step buttons -->
                <div class="justify-between navigation-buttons hidden" id="font-step-buttons">
                    <button id="back-to-options-btn"
                        class="professional-button flex items-center justify-center gap-3 w-[48%] h-[48px]">
                        <i class="fas fa-arrow-left text-sm"></i>
                        <span class="button-text">Back</span>
                    </button>
                    <button id="to-actions-step-btn"
                        class="professional-button flex items-center justify-center gap-3 w-[48%] h-[48px]">
                        <i class="fas fa-arrow-right text-sm"></i>
                        <span class="button-text">Next</span>
                    </button>
                </div>

                <!-- Actions step buttons -->
                <div class="navigation-buttons hidden" id="actions-step-buttons">
                    <button id="back-to-font-btn"
                        class="professional-button flex items-center justify-center gap-3 w-full h-[48px]">
                        <i class="fas fa-arrow-left text-sm"></i>
                        <span class="button-text">Back</span>
                    </button>
                </div>
            </div>

            <!-- Save button (always visible) -->
            <div class="mt-2">
                <button id="close-settings"
                    class="professional-button flex items-center justify-center gap-3 w-full h-[52px]">
                    <i class="fas fa-check text-sm"></i>
                    <span>Apply Changes</span>
                </button>

                <!-- Simple divider -->
                <div class="flex justify-center mt-3">
                    <div class="h-[1px] w-1/2 bg-gray-600/30"></div>
                </div>
            </div>

            <script>
                // Add subtle hover effects for save button
                document.addEventListener('DOMContentLoaded', function () {
                    const saveBtn = document.getElementById('close-settings');

                    if (saveBtn) {
                        saveBtn.addEventListener('mouseover', function () {
                            this.style.boxShadow = '0 6px 10px rgba(0, 0, 0, 0.15)';
                            this.style.background = 'linear-gradient(to right, #047857, #10b981)';
                        });

                        saveBtn.addEventListener('mouseout', function () {
                            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                            this.style.background = 'linear-gradient(to right, #059669, #10b981)';
                        });
                    }
                });
            </script>

        </div>
    </div>

    <!-- IP/Port Input Modal -->
    <div id="ip-port-input-modal"
        class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 2500; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        role="dialog" aria-modal="true" aria-labelledby="ip-port-input-title">
        <div class="connection-input-modal-box animate-modal-in">
            <div class="connection-input-modal-accent connection-input-modal-accent--blue"></div>
            <div class="flex justify-between items-center mb-5">
                <h3 id="ip-port-input-title" class="text-lg font-bold flex items-center" style="color: var(--settings-title-color, #f1f5f9);">
                    <i class="fas fa-server text-blue-400 mr-2"></i>Local Server Address
                </h3>
                <button id="close-ip-port-input-modal" type="button" class="conn-modal-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-sm mb-4" style="color: var(--settings-help-text, #9ca3af);">Enter the IP address and port of your local AI server (e.g. LM Studio).</p>
            <div class="flex gap-3 mb-5">
                <div class="flex-1 min-w-0">
                    <label for="server-ip" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">IP Address</label>
                    <input type="text" id="server-ip"
                        class="connection-modal-input w-full"
                        placeholder="e.g. 192.168.1.100" pattern="^[0-9.]*$" inputmode="decimal"
                        onkeypress="return event.charCode === 46 || (event.charCode >= 48 && event.charCode <= 57)"
                        autocomplete="off" data-form-type="other">
                </div>
                <div style="width: 110px; flex-shrink: 0;">
                    <label for="server-port" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Port</label>
                    <input type="text" id="server-port"
                        class="connection-modal-input w-full"
                        placeholder="1234" pattern="^[0-9]*$" inputmode="numeric"
                        onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                        autocomplete="off" data-form-type="other">
                </div>
            </div>
            <div class="flex gap-3">
                <button id="cancel-ip-port-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-[48px]">
                    Cancel
                </button>
                <button id="save-ip-port-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-[48px]">
                    <i class="fas fa-check mr-2"></i>Save
                </button>
            </div>
        </div>
    </div>
    <!-- OpenRouter API Key Input Modal -->
    <div id="openrouter-key-input-modal"
        class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 2500; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        role="dialog" aria-modal="true" aria-labelledby="openrouter-key-input-title">
        <div class="connection-input-modal-box animate-modal-in">
            <div class="connection-input-modal-accent connection-input-modal-accent--purple"></div>
            <div class="flex justify-between items-center mb-5">
                <h3 id="openrouter-key-input-title" class="text-lg font-bold flex items-center" style="color: var(--settings-title-color, #f1f5f9);">
                    <i class="fas fa-cloud text-blue-400 mr-2"></i>OpenRouter API Key
                </h3>
                <button id="close-openrouter-key-input-modal" type="button" class="conn-modal-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-sm mb-4" style="color: var(--settings-help-text, #9ca3af);">Enter your OpenRouter API key to access cloud AI models.</p>
            <div class="mb-5">
                <label for="openrouter-api-key" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">API Key</label>
                <div class="openrouter-key-input-wrapper">
                    <input type="password" id="openrouter-api-key"
                        placeholder="sk-or-v1-..." autocomplete="off" data-form-type="other">
                    <button type="button" id="openrouter-api-key-reveal"
                        class="openrouter-key-reveal-btn"
                        title="Show/hide API key"
                        onclick="(function(){var i=document.getElementById('openrouter-api-key'),b=document.getElementById('openrouter-api-key-reveal');if(i.type==='password'){i.type='text';b.innerHTML='<i class=&quot;fas fa-eye-slash&quot;></i>';}else{i.type='password';b.innerHTML='<i class=&quot;fas fa-eye&quot;></i>';}})()">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);"><i class="fas fa-lock mr-1"></i>Stored locally on your device only.</p>
            </div>
            <div class="flex gap-3">
                <button id="cancel-openrouter-key-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-[48px]">
                    Cancel
                </button>
                <button id="save-openrouter-key-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-[48px]">
                    <i class="fas fa-check mr-2"></i>Save
                </button>
            </div>
        </div>
    </div>

    <!-- LM Studio API Token Input Modal -->
    <div id="lmstudio-token-input-modal"
        class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 2500; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        role="dialog" aria-modal="true" aria-labelledby="lmstudio-token-input-title">
        <div class="connection-input-modal-box animate-modal-in">
            <div class="connection-input-modal-accent connection-input-modal-accent--blue"></div>
            <div class="flex justify-between items-center mb-5">
                <h3 id="lmstudio-token-input-title" class="text-lg font-bold flex items-center" style="color: var(--settings-title-color, #f1f5f9);">
                    <i class="fas fa-key text-blue-400 mr-2"></i>LM Studio API Token
                </h3>
                <button id="close-lmstudio-token-input-modal" type="button" class="conn-modal-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-sm mb-4" style="color: var(--settings-help-text, #9ca3af);">Optionally enter an LM Studio API token if your server requires authentication. Generate tokens in LM Studio &rsaquo; Developer &rsaquo; Server Settings &rsaquo; Manage Tokens.</p>
            <div class="mb-5">
                <label for="lmstudio-api-token" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">API Token</label>
                <div class="openrouter-key-input-wrapper">
                    <input type="password" id="lmstudio-api-token"
                        placeholder="sk-lm-xxxx:yyyy" autocomplete="off" data-form-type="other">
                    <button type="button" id="lmstudio-api-token-reveal"
                        class="openrouter-key-reveal-btn"
                        title="Show/hide token"
                        onclick="(function(){var i=document.getElementById('lmstudio-api-token'),b=document.getElementById('lmstudio-api-token-reveal');if(i.type==='password'){i.type='text';b.innerHTML='<i class=&quot;fas fa-eye-slash&quot;></i>';}else{i.type='password';b.innerHTML='<i class=&quot;fas fa-eye&quot;></i>';}})()">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);"><i class="fas fa-lock mr-1"></i>Stored locally on your device only. Expected format example: sk-lm-xxxx:yyyy</p>
            </div>
            <div class="flex gap-3">
                <button id="cancel-lmstudio-token-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-[48px]">
                    Cancel
                </button>
                <button id="clear-lmstudio-token-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-[48px]">
                    <i class="fas fa-trash-alt mr-2"></i>Clear
                </button>
                <button id="save-lmstudio-token-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-[48px]">
                    <i class="fas fa-check mr-2"></i>Save
                </button>
            </div>
        </div>
    </div>
`;
