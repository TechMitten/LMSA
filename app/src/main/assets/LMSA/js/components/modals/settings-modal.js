export const settingsModal = `
    <!-- Settings modal -->
    <div id="settings-modal" class="fixed inset-0 items-center justify-center hidden modal-container"
        aria-labelledby="settings-title" role="dialog" aria-modal="true">
        <div class="modal-content">
            <!-- Settings Header -->
            <div class="flex flex-col sticky top-0 z-20 pt-6 mb-6 pb-1 border-b border-gray-700/30 bg-inherit">
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
                    <div class="w-8 h-2 rounded-full bg-gray-600" id="step-indicator-6"></div>
                </div>
            </div>

            <!-- Settings Content - Multi-step on mobile -->
            <div id="settings-content-wrapper" class="relative px-1">
                <!-- Step 1: Connection Settings (always visible first) -->
                <div id="settings-step-connection" class="settings-step active" data-step-name="Connection">
                    <!-- Hidden checkbox retained for JS/event compatibility -->
                    <input type="checkbox" id="openrouter-toggle" class="sr-only" aria-hidden="true" tabindex="-1">
                    <input type="checkbox" id="openai-compatible-toggle" class="sr-only" aria-hidden="true" tabindex="-1">

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
                        <button id="select-openai-compatible" class="connection-type-btn" type="button" aria-pressed="false">
                            <div class="connection-type-icon"><i class="fas fa-link"></i></div>
                            <span class="connection-type-name">Custom Endpoint</span>
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
                            <button id="configure-local-server-btn" type="button" data-haptic="light"
                                  class="professional-button flex items-center justify-center gap-2 px-4 h-10">
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
                            <button id="configure-lmstudio-token-btn" type="button" data-haptic="light"
                                  class="professional-button flex items-center justify-center gap-2 px-4 h-10">
                                <i class="fas fa-pencil-alt text-xs"></i>
                                <span>Token</span>
                            </button>
                        </div>
                        <div class="connection-status-row mt-3">
                            <div class="connection-status-info">
                                <i class="fas fa-plug connection-status-icon"></i>
                                <span id="lmstudio-mcp-status-text" class="connection-status-text">No MCP integrations configured</span>
                            </div>
                            <button id="configure-lmstudio-mcp-btn" type="button" data-haptic="light"
                                  class="professional-button flex items-center justify-center gap-2 px-4 h-10">
                                <i class="fas fa-pencil-alt text-xs"></i>
                                <span>MCP</span>
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
                            <button id="configure-openrouter-key-btn" type="button" data-haptic="light"
                                  class="professional-button flex items-center justify-center gap-2 px-4 h-10">
                                <i class="fas fa-pencil-alt text-xs"></i>
                                <span>Configure</span>
                            </button>
                        </div>
                    </div>

                    <!-- OpenAI-Compatible Panel -->
                    <div id="openai-compatible-settings" class="connection-settings-panel hidden">
                        <p class="text-xs text-gray-400 mb-3">Use any OpenAI-compatible API endpoint (self-hosted or cloud). Smart Reply is unavailable with hosted endpoints.</p>
                        <div class="connection-status-row">
                            <div class="connection-status-info">
                                <i class="fas fa-link connection-status-icon"></i>
                                <span id="openai-compatible-endpoint-status-text" class="connection-status-text">No endpoint configured</span>
                            </div>
                            <button id="configure-openai-compatible-btn" type="button" data-haptic="light"
                                  class="professional-button flex items-center justify-center gap-2 px-4 h-10">
                                <i class="fas fa-pencil-alt text-xs"></i>
                                <span>Configure</span>
                            </button>
                        </div>
                    </div>

                    <div class="connection-presets-card mt-4">
                        <div class="connection-presets-header">
                            <div>
                                <h3 class="connection-presets-title">Saved Presets</h3>
                            </div>
                            <div class="connection-presets-header-actions">
                                <span id="settings-connection-presets-active-type" class="connection-preset-type-pill">Local Server</span>
                                <button id="settings-connection-presets-toggle" type="button" class="connection-presets-toggle" aria-expanded="false" aria-controls="settings-connection-presets-content" aria-label="Expand saved presets">
                                    <i id="settings-connection-presets-chevron" class="fas fa-chevron-down" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div id="settings-connection-presets-content" class="hidden" aria-hidden="true">
                            <p id="settings-connection-preset-helper" class="connection-presets-description">Save, update, and switch between connection setups without retyping credentials or endpoints.</p>

                            <div class="connection-presets-toolbar">
                                <div class="connection-preset-name-field">
                                    <label for="settings-connection-preset-name" class="connection-preset-name-label">
                                        Preset Name
                                        <span class="connection-preset-name-required">Required</span>
                                    </label>
                                    <input type="text" id="settings-connection-preset-name" class="connection-preset-name-input"
                                        placeholder="Name this Local Server preset" maxlength="50" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" data-form-type="other" required aria-required="true" aria-describedby="settings-connection-preset-name-hint" enterkeyhint="done">
                                    <p id="settings-connection-preset-name-hint" class="connection-preset-name-hint">Enter a preset name to enable saving.</p>
                                </div>
                                <button id="save-connection-preset-btn" type="button" data-haptic="light" disabled aria-disabled="true"
                                     class="professional-button flex items-center justify-center gap-2 h-11 px-4">
                                    <i class="fas fa-save text-xs"></i>
                                    <span id="save-connection-preset-label">Save Current</span>
                                </button>
                            </div>

                            <div id="settings-connection-presets-empty-state" class="connection-presets-empty-state">
                                No Saved Presets yet.
                            </div>
                            <div id="settings-connection-presets-list" class="connection-presets-list hidden"></div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Options -->
                <div id="settings-step-options" class="settings-step hidden" data-step-name="Options">
                    <p class="settings-toggle-helper" role="note" aria-live="polite">
                        Tap any feature card to switch it on or off. The badge on the right shows the current state.
                    </p>

                    <!-- AI Model Settings Group -->
                    <div class="settings-group group-ai">
                        <div class="settings-group-title">
                            <i class="fas fa-microchip"></i>
                            <span>AI Settings</span>
                        </div>
                        
                        <!-- Temperature -->
                        <div class="settings-item">
                            <div class="settings-item-header">
                                <label for="temperature" class="settings-item-label">
                                    <i class="fas fa-sliders-h"></i>Temperature: <span id="temperature-value">0.3</span>
                                </label>
                                <button id="temperature-lock" class="focus:outline-none"
                                    aria-label="Toggle Temperature Lock" title="Temperature is locked (click to unlock)">
                                    <i class="fas fa-lock text-red-400"></i>
                                </button>
                            </div>
                            <p class="settings-item-description">Controls randomness. Lower is more focused and deterministic, higher is more creative.</p>
                            <input type="range" id="temperature" min="0" max="2" step="0.1" value="0.3"
                                class="w-full bg-darkTertiary text-gray-100 rounded-lg appearance-none cursor-pointer"
                                disabled>
                        </div>

                        <!-- Reasoning Level -->
                        <div class="settings-item">
                            <div class="settings-item-header">
                                <label for="reasoning-level-select" class="settings-item-label">
                                    <i class="fas fa-microchip"></i>Reasoning Level
                                </label>
                            </div>
                            <p class="settings-item-description">Controls thinking effort for reasoning models. Higher levels improve logic but take longer.</p>
                            <select id="reasoning-level-select"
                                class="w-full bg-darkTertiary text-gray-100 rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500">
                                <option value="default" selected>Default</option>
                                <option value="disabled">Disabled</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <!-- Max Output Tokens -->
                        <div class="settings-item max-tokens-setting">
                            <div class="settings-item-header">
                                <label for="max-tokens-input" class="settings-item-label">
                                    <i class="fas fa-text-width"></i>Max Output Tokens
                                </label>
                            </div>
                            <p class="settings-item-description">Limits how long the AI response can be.</p>
                            <div class="flex items-center max-tokens-input-row">
                                <input type="text" id="max-tokens-input" min="1" step="1"
                                    class="bg-darkTertiary text-gray-100 rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 max-tokens-input-field"
                                    placeholder="Server default" inputmode="numeric" pattern="[0-9]*" enterkeyhint="done" autocomplete="off" autocapitalize="off" spellcheck="false" data-form-type="other">
                                <button id="clear-max-tokens-btn" type="button"
                                    class="professional-button flex items-center justify-center gap-2 px-4 h-[42px] shrink-0 max-tokens-default-btn">
                                    <i class="fas fa-rotate-left text-xs"></i>
                                    <span>Default</span>
                                </button>
                            </div>
                        </div>

                        <!-- Hide Thinking -->
                        <div class="settings-item settings-item-toggle" data-toggle-checkbox="hide-thinking">
                            <div class="settings-item-header">
                                <label for="hide-thinking" class="settings-item-label">
                                    <i class="fas fa-eye-slash"></i>Hide Thinking
                                </label>
                                <input type="checkbox" id="hide-thinking" class="settings-checkbox" aria-label="Toggle Hide Thinking Text">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Hides the internal "thought process" block often seen in reasoning models.</p>
                        </div>
                    </div>

                    <!-- Smart Conversational Tools Group -->
                    <div class="settings-group group-smart">
                        <div class="settings-group-title">
                            <i class="fas fa-lightbulb"></i>
                            <span>Smart Features</span>
                        </div>

                        <!-- Generate Chat Titles -->
                        <div class="settings-item settings-item-toggle" id="auto-generate-titles-setting" data-toggle-checkbox="auto-generate-titles">
                            <div class="settings-item-header">
                                <label for="auto-generate-titles" class="settings-item-label">
                                    <i class="fas fa-magic"></i>Chat Titles
                                </label>
                                <input type="checkbox" id="auto-generate-titles" class="settings-checkbox" aria-label="Toggle Generate Chat Titles">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Automatically generates a title for your chat after the first message.</p>
                        </div>

                        <!-- Enable Smart Reply -->
                        <div class="settings-item settings-item-toggle" id="smart-reply-setting" data-toggle-checkbox="auto-smart-reply">
                            <div class="settings-item-header">
                                <label for="auto-smart-reply" class="settings-item-label">
                                    <i class="fas fa-reply"></i>Smart Reply
                                </label>
                                <input type="checkbox" id="auto-smart-reply" class="settings-checkbox" aria-label="Toggle Smart Reply">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Suggests quick reply options based on the conversation context.</p>
                        </div>

                        <!-- Enable Web Search -->
                        <div class="settings-item settings-item-toggle" id="web-search-setting" data-toggle-checkbox="web-search-toggle">
                            <div class="settings-item-header">
                                <label for="web-search-toggle" class="settings-item-label">
                                    <i class="fas fa-globe"></i>Web Search
                                </label>
                                <input type="checkbox" id="web-search-toggle" class="settings-checkbox" aria-label="Toggle Web Search">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Allows the AI to search the internet to provide real-time information.</p>
                        </div>
                    </div>

                    <!-- Chat Interface Group -->
                    <div class="settings-group group-interface">
                        <div class="settings-group-title">
                            <i class="fas fa-desktop"></i>
                            <span>Chat Interface</span>
                        </div>

                        <!-- Auto-Scroll -->
                        <div class="settings-item settings-item-toggle" data-toggle-checkbox="auto-scroll">
                            <div class="settings-item-header">
                                <label for="auto-scroll" class="settings-item-label">
                                    <i class="fas fa-arrow-down"></i>Auto Scroll
                                </label>
                                <input type="checkbox" id="auto-scroll" class="settings-checkbox" aria-label="Toggle Auto-Scroll to Bottom">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Automatically scrolls the chat as new text arrives from the model.</p>
                        </div>

                        <!-- Enter for New Line -->
                        <div class="settings-item settings-item-toggle" data-toggle-checkbox="enter-newline-toggle">
                            <div class="settings-item-header">
                                <label for="enter-newline-toggle" class="settings-item-label">
                                    <i class="fas fa-keyboard"></i>Enter New Line
                                </label>
                                <input type="checkbox" id="enter-newline-toggle" class="settings-checkbox" aria-label="Toggle Enter for New Line">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Pressing Enter adds a newline instead of sending the message.</p>
                        </div>

                        <!-- Show Model Name -->
                        <div class="settings-item settings-item-toggle" data-toggle-checkbox="show-model-label">
                            <div class="settings-item-header">
                                <label for="show-model-label" class="settings-item-label">
                                    <i class="fas fa-robot"></i>Model Name
                                </label>
                                <input type="checkbox" id="show-model-label" class="settings-checkbox" aria-label="Toggle Show Model Name">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Displays which AI model generated the specific response.</p>
                        </div>

                        <!-- Show Chat Scrollbar -->
                        <div class="settings-item settings-item-toggle" data-toggle-checkbox="show-chat-scrollbar">
                            <div class="settings-item-header">
                                <label for="show-chat-scrollbar" class="settings-item-label">
                                    <i class="fas fa-bars"></i>Chat Scrollbar
                                </label>
                                <input type="checkbox" id="show-chat-scrollbar" class="settings-checkbox" aria-label="Toggle Show Chat Scrollbar">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Toggles the visibility of the scrollbar in the chat area.</p>
                        </div>
                    </div>


                    <!-- Device & Accessibility Group -->
                    <div class="settings-group group-device">
                        <div class="settings-group-title">
                            <i class="fas fa-tools"></i>
                            <span>Device & Voice</span>
                        </div>

                        <!-- Require Biometric Unlock -->
                        <div class="settings-item settings-item-toggle" id="biometric-setting-container" data-toggle-checkbox="require-biometric">
                            <div class="settings-item-header">
                                <label for="require-biometric" class="settings-item-label">
                                    <i class="fas fa-fingerprint"></i>Biometric Unlock
                                </label>
                                <input type="checkbox" id="require-biometric" class="settings-checkbox" aria-label="Toggle Require Biometric Unlock">
                                <span class="settings-status-badge" aria-hidden="true"></span>
                            </div>
                            <p class="settings-item-description">Prompts for fingerprint or PIN when opening the application.</p>
                        </div>

                        <!-- TTS Voice -->
                        <div class="settings-item">
                            <div class="settings-item-header">
                                <label for="tts-voice-select" class="settings-item-label">
                                    <i class="fas fa-microphone"></i>TTS Voice
                                </label>
                            </div>
                            <p class="settings-item-description">Select the voice used for Text-to-Speech playback.</p>
                            <select id="tts-voice-select"
                                class="w-full bg-darkTertiary text-gray-100 rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500">
                                <option value="">Loading voices...</option>
                            </select>
                        </div>


                    </div>
                </div>

                <div id="settings-step-prompt" class="settings-step hidden" data-step-name="Prompt">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-1 system-prompt-heading" role="presentation" aria-hidden="true">
                            <i class="fas fa-comment-dots mr-2 text-blue-400"></i>System Prompt (Optional):</label>

                        <!-- Hidden real textarea that holds the actual value -->
                        <textarea id="system-prompt" class="hidden" rows="4"></textarea>

                        <!-- Display current prompt value (non-interactive) -->
                        <div id="system-prompt-preview"
                               class="border p-3 rounded-lg min-h-20 mb-2 whitespace-pre-wrap"
                            style="background-color: var(--settings-input-bg); color: var(--settings-input-text); border-color: var(--settings-input-border);">
                            <span class="italic" id="prompt-placeholder" style="color: var(--text-muted);"></span>
                        </div>

                        <!-- Edit and Save buttons -->
                        <div class="flex gap-2">
                            <button id="edit-system-prompt-btn"
                                  class="professional-button flex items-center justify-center gap-3 flex-1 h-12">
                                <i class="fas fa-edit text-sm"></i>
                                <span>Edit</span>
                            </button>
                            <button id="save-system-prompt-btn"
                                  class="professional-button flex items-center justify-center gap-3 flex-1 h-12">
                                <i class="fas fa-save text-sm"></i>
                                <span>Save to list</span>
                            </button>
                        </div>

                        <section id="saved-prompts-section" class="mt-4" aria-labelledby="saved-prompts-section-title">
                            <div class="saved-prompts-section-header">
                                <div>
                                    <p class="saved-prompts-section-eyebrow">Saved Prompts</p>
                                    <h3 id="saved-prompts-section-title" class="saved-prompts-section-title">Reusable System Prompts</h3>
                                </div>
                            </div>
                            <p class="saved-prompts-section-description">Restore, edit, or delete saved prompts without leaving this page.</p>
                            <div id="saved-prompts-list" class="saved-prompts-section-list" aria-live="polite">
                                <!-- Saved prompts will be dynamically inserted here -->
                            </div>
                        </section>
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
                        <p class="text-xs text-gray-400 mt-1">Select the font size for chat messages</p>
                    </div>
                </div>

                <!-- Step 5: Sidebar -->
                <div id="settings-step-sidebar" class="settings-step hidden" data-step-name="Sidebar">
                    <p class="settings-toggle-helper" role="note" aria-live="polite">
                        Choose which sidebar actions stay visible and adjust their order. Settings stays pinned, and chat history always remains visible.
                    </p>

                    <div class="settings-group group-sidebar">
                        <div class="settings-group-title">
                            <i class="fas fa-bars-staggered"></i>
                            <span>Sidebar Menu</span>
                        </div>
                        <p class="sidebar-layout-summary">
                            Changes apply immediately, so you can preview the sidebar while this page is open.
                        </p>
                        <div id="sidebar-layout-editor" class="sidebar-layout-editor" aria-live="polite"></div>
                        <div class="sidebar-layout-actions-row">
                            <button id="reset-sidebar-layout-btn"
                                  class="professional-button flex items-center justify-center gap-3 w-full h-12">
                                <i class="fas fa-rotate-left text-sm"></i>
                                <span>Reset to Defaults</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Step 6: Actions -->
                <div id="settings-step-actions" class="settings-step hidden" data-step-name="Actions">
                    <div class="flex flex-col space-y-4">
                        <button id="clear-chat"
                            class="professional-button flex items-center justify-center gap-3 w-full h-12 bg-red-600/10 border-red-500/30 text-red-400">
                            <i class="fas fa-trash-alt text-sm"></i>
                            <span>Clear All Chats</span>
                        </button>

                        <button id="reset-app"
                            class="professional-button flex items-center justify-center gap-3 w-full h-12 bg-red-600/10 border-red-500/30 text-red-400">
                            <i class="fas fa-exclamation-triangle text-sm"></i>
                            <span>Reset App</span>
                        </button>

                        <button id="clear-openrouter-key"
                            class="professional-button flex items-center justify-center gap-3 w-full h-12">
                            <i class="fas fa-key text-sm"></i>
                            <span>Clear OpenRouter Key</span>
                        </button>

                        <button id="clear-lmstudio-token"
                            class="professional-button flex items-center justify-center gap-3 w-full h-12">
                            <i class="fas fa-key text-sm"></i>
                            <span>Clear LM Studio Token</span>
                        </button>
                    </div>
                </div>
                <!-- Navigation buttons container -->
                <div id="settings-navigation-buttons" class="mt-5 mb-2">
                    <!-- Connection step buttons -->
                    <div class="flex justify-end navigation-buttons" id="connection-step-buttons">
                        <button id="to-options-step-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-right text-sm"></i>
                            <span class="button-text">Next</span>
                        </button>
                    </div>

                    <!-- Options step buttons -->
                    <div class="justify-between navigation-buttons hidden" id="options-step-buttons">
                        <button id="back-to-connection-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-left text-sm"></i>
                            <span class="button-text">Back</span>
                        </button>
                        <button id="to-prompt-step-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-right text-sm"></i>
                            <span class="button-text">Next</span>
                        </button>
                    </div>

                    <!-- Prompt step buttons -->
                    <div class="justify-between navigation-buttons hidden" id="prompt-step-buttons">
                        <button id="back-to-options-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-left text-sm"></i>
                            <span class="button-text">Back</span>
                        </button>
                        <button id="to-font-step-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-right text-sm"></i>
                            <span class="button-text">Next</span>
                        </button>
                    </div>

                    <!-- Font step buttons -->
                    <div class="justify-between navigation-buttons hidden" id="font-step-buttons">
                        <button id="back-to-prompt-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-left text-sm"></i>
                            <span class="button-text">Back</span>
                        </button>
                        <button id="to-sidebar-step-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-right text-sm"></i>
                            <span class="button-text">Next</span>
                        </button>
                    </div>

                    <!-- Sidebar step buttons -->
                    <div class="justify-between navigation-buttons hidden" id="sidebar-step-buttons">
                        <button id="back-to-font-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-left text-sm"></i>
                            <span class="button-text">Back</span>
                        </button>
                        <button id="to-actions-step-btn"
                               class="professional-button flex items-center justify-center gap-3 w-[48%] h-12">
                            <i class="fas fa-arrow-right text-sm"></i>
                            <span class="button-text">Next</span>
                        </button>
                    </div>

                    <!-- Actions step buttons -->
                    <div class="navigation-buttons hidden" id="actions-step-buttons">
                        <button id="back-to-sidebar-btn"
                               class="professional-button flex items-center justify-center gap-3 w-full h-12">
                            <i class="fas fa-arrow-left text-sm"></i>
                            <span class="button-text">Back</span>
                        </button>
                    </div>
                </div>

                <div class="mt-2">
                    <button id="close-settings"
                        class="professional-button flex items-center justify-center gap-3 w-full h-[52px]">
                        <i class="fas fa-check text-sm"></i>
                            <span>Confirm</span>
                    </button>

                    <div class="flex justify-center mt-3">
                            <div class="h-px w-1/2 bg-gray-600/30"></div>
                    </div>
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

    <!-- Saved Preset Edit Modal -->
    <div id="edit-connection-preset-modal"
        class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 2300; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        role="dialog" aria-modal="true" aria-labelledby="edit-connection-preset-title">
        <div class="connection-input-modal-box animate-modal-in" style="max-width: 460px;">
            <div id="edit-connection-preset-accent" class="connection-input-modal-accent connection-input-modal-accent--blue"></div>
            <div class="flex justify-between items-start mb-4 gap-3">
                <div class="min-w-0 flex-1">
                    <div class="connection-preset-edit-meta-row">
                        <p class="connection-preset-edit-eyebrow">Saved Preset</p>
                        <span id="edit-connection-preset-type-pill" class="connection-preset-type-pill">Local Server</span>
                    </div>
                    <h3 id="edit-connection-preset-title" class="text-lg font-bold flex items-center mt-2" style="color: var(--settings-title-color, #f1f5f9);">
                        <i class="fas fa-pen-to-square text-blue-400 mr-2"></i>Edit Saved Preset
                    </h3>
                </div>
                <button id="close-edit-connection-preset-modal" type="button" class="conn-modal-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <p id="edit-connection-preset-helper" class="text-sm mb-4" style="color: var(--settings-help-text, #9ca3af);">
                Update this preset without changing your current active connection.
            </p>

            <div id="edit-connection-preset-error" class="connection-preset-edit-error hidden" role="alert"></div>

            <div class="mb-4">
                <label for="edit-connection-preset-name" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Preset Name</label>
                <input type="text" id="edit-connection-preset-name"
                    class="connection-modal-input w-full"
                    placeholder="Preset name" maxlength="50" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" data-form-type="other" style="width: 100%;">
            </div>

            <div id="edit-connection-preset-local-fields" class="connection-preset-edit-section hidden">
                <div class="connection-preset-edit-grid mb-4">
                    <div class="min-w-0">
                        <label for="edit-connection-preset-local-ip" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Hostname / IP</label>
                        <input type="text" id="edit-connection-preset-local-ip"
                            class="connection-modal-input w-full"
                            placeholder="e.g. 192.168.1.100" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" data-form-type="other" style="width: 100%;">
                    </div>
                    <div class="connection-preset-edit-port-column">
                        <label for="edit-connection-preset-local-port" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Port</label>
                        <input type="text" id="edit-connection-preset-local-port"
                            class="connection-modal-input w-full"
                            placeholder="1234" pattern="^[0-9]*$" inputmode="numeric" autocomplete="off" data-form-type="other" style="width: 100%;">
                    </div>
                </div>
                <div class="mb-4">
                    <label for="edit-connection-preset-local-token" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">LM Studio API Token (optional)</label>
                    <div class="openrouter-key-input-wrapper">
                        <input type="password" id="edit-connection-preset-local-token"
                            placeholder="sk-lm-xxxx:yyyy" autocomplete="off" data-form-type="other">
                        <button type="button" id="edit-connection-preset-local-token-reveal"
                            class="openrouter-key-reveal-btn"
                            title="Show/hide token"
                            data-edit-preset-secret-toggle="edit-connection-preset-local-token">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="mb-1">
                    <label for="edit-connection-preset-local-mcp" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">MCP Integrations JSON (optional)</label>
                    <textarea id="edit-connection-preset-local-mcp"
                        class="connection-modal-input connection-preset-edit-textarea w-full"
                        placeholder='[{"name":"filesystem"}]' autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" data-form-type="other" style="width: 100%;"></textarea>
                    <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);">Leave blank to remove MCP integrations from this preset.</p>
                </div>
            </div>

            <div id="edit-connection-preset-openrouter-fields" class="connection-preset-edit-section hidden">
                <div class="mb-1">
                    <label for="edit-connection-preset-openrouter-key" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">OpenRouter API Key</label>
                    <div class="openrouter-key-input-wrapper">
                        <input type="password" id="edit-connection-preset-openrouter-key"
                            placeholder="sk-or-v1-..." autocomplete="off" data-form-type="other">
                        <button type="button" id="edit-connection-preset-openrouter-key-reveal"
                            class="openrouter-key-reveal-btn"
                            title="Show/hide API key"
                            data-edit-preset-secret-toggle="edit-connection-preset-openrouter-key">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);"><i class="fas fa-lock mr-1"></i>Stored only inside this preset until you choose to use it.</p>
                </div>
            </div>

            <div id="edit-connection-preset-openai-compatible-fields" class="connection-preset-edit-section hidden">
                <div class="mb-4">
                    <label for="edit-connection-preset-openai-endpoint" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Base URL or Chat Completions URL</label>
                    <input type="text" id="edit-connection-preset-openai-endpoint"
                        class="connection-modal-input w-full"
                        placeholder="e.g. https://api.example.com/v1" autocomplete="off" data-form-type="other" style="width: 100%;">
                </div>
                <div class="mb-4">
                    <label for="edit-connection-preset-openai-key" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">API Key (optional)</label>
                    <div class="openrouter-key-input-wrapper">
                        <input type="password" id="edit-connection-preset-openai-key"
                            placeholder="sk-..." autocomplete="off" data-form-type="other">
                        <button type="button" id="edit-connection-preset-openai-key-reveal"
                            class="openrouter-key-reveal-btn"
                            title="Show/hide API key"
                            data-edit-preset-secret-toggle="edit-connection-preset-openai-key">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="mb-1">
                    <label for="edit-connection-preset-openai-model" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Manual Model Name (optional)</label>
                    <input type="text" id="edit-connection-preset-openai-model"
                        class="connection-modal-input w-full"
                        placeholder="e.g. gpt-4o-mini" autocomplete="off" data-form-type="other" style="width: 100%;">
                </div>
            </div>

            <div class="flex gap-3 mt-5">
                <button id="cancel-edit-connection-preset-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    Cancel
                </button>
                <button id="save-edit-connection-preset-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-12">
                    <i class="fas fa-check mr-2"></i>Update Preset
                </button>
            </div>
        </div>
    </div>

    <!-- Saved Preset Delete Confirmation Modal -->
    <div id="delete-connection-preset-modal"
        class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 2300; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        role="dialog" aria-modal="true" aria-labelledby="delete-connection-preset-title">
        <div class="connection-input-modal-box animate-modal-in" style="max-width: 420px;">
            <div class="connection-input-modal-accent connection-input-modal-accent--red"></div>
            <div class="flex justify-between items-center mb-4">
                <h3 id="delete-connection-preset-title" class="text-lg font-bold flex items-center" style="color: var(--settings-title-color, #f1f5f9);">
                    <i class="fas fa-trash-alt text-red-400 mr-2"></i>Delete Saved Preset
                </h3>
                <button id="close-delete-connection-preset-modal" type="button" class="conn-modal-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <p id="delete-connection-preset-message" class="text-sm mb-5" style="color: var(--settings-help-text, #9ca3af);">
                Delete this saved preset? This cannot be undone.
            </p>

            <div class="flex justify-end gap-2">
                 <button id="cancel-delete-connection-preset" type="button" class="professional-button px-4 h-10">
                    Cancel
                </button>
                <button id="confirm-delete-connection-preset" type="button"
                    class="professional-button px-4 h-10 bg-red-600 hover:bg-red-700 border-red-500 text-white">
                    Delete
                </button>
            </div>
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
            <p class="text-sm mb-4" style="color: var(--settings-help-text, #9ca3af);">Enter the hostname or IP address and port of your local AI server (e.g. LM Studio).</p>
            <div class="flex gap-3 mb-5">
                <div class="flex-1 min-w-0">
                    <label for="server-ip" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Hostname / IP</label>
                    <input type="text" id="server-ip"
                        class="connection-modal-input w-full"
                        placeholder="e.g. 192.168.1.100 or lmstudio.local" inputmode="text"
                        autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" data-form-type="other">
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
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    Cancel
                </button>
                <button id="save-ip-port-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-12">
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
                <input type="password" id="openrouter-api-key"
                    placeholder="sk-or-v1-..." autocomplete="off" data-form-type="other" style="width: 100%;">
                <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);"><i class="fas fa-lock mr-1"></i>Stored locally on your device only.</p>
            </div>
            <div class="flex gap-3">
                <button id="cancel-openrouter-key-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    Cancel
                </button>
                <button id="save-openrouter-key-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-12">
                    <i class="fas fa-check mr-2"></i>Save
                </button>
            </div>
        </div>
    </div>

    <!-- OpenAI-Compatible Endpoint Input Modal -->
    <div id="openai-compatible-input-modal"
        class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 2500; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        role="dialog" aria-modal="true" aria-labelledby="openai-compatible-input-title">
        <div class="connection-input-modal-box animate-modal-in">
            <div class="connection-input-modal-accent connection-input-modal-accent--blue"></div>
            <div class="flex justify-between items-center mb-5">
                <h3 id="openai-compatible-input-title" class="text-lg font-bold flex items-center" style="color: var(--settings-title-color, #f1f5f9);">
                    <i class="fas fa-link text-blue-400 mr-2"></i>OpenAI-Compatible Endpoint
                </h3>
                <button id="close-openai-compatible-input-modal" type="button" class="conn-modal-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-sm mb-4" style="color: var(--settings-help-text, #9ca3af);">Set your endpoint and API key for any OpenAI-compatible server.</p>
            <div class="mb-4">
                <label for="openai-compatible-endpoint" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Base URL or Chat Completions URL</label>
                <input type="text" id="openai-compatible-endpoint"
                    class="connection-modal-input w-full"
                    placeholder="e.g. https://api.example.com/v1" autocomplete="off" data-form-type="other" style="width: 100%;">
                <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);"><i class="fas fa-info-circle mr-1"></i>Can be a base URL (recommended) or a full chat/completions endpoint.</p>
            </div>
            <div class="mb-5">
                <label for="openai-compatible-api-key" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">API Key (optional)</label>
                <div class="openrouter-key-input-wrapper">
                    <input type="password" id="openai-compatible-api-key"
                        placeholder="sk-..." autocomplete="off" data-form-type="other">
                    <button type="button" id="openai-compatible-api-key-reveal"
                        class="openrouter-key-reveal-btn"
                        title="Show/hide API key"
                        onclick="(function(){var i=document.getElementById('openai-compatible-api-key'),b=document.getElementById('openai-compatible-api-key-reveal');if(i.type==='password'){i.type='text';b.innerHTML='<i class=&quot;fas fa-eye-slash&quot;></i>';}else{i.type='password';b.innerHTML='<i class=&quot;fas fa-eye&quot;></i>';}})()">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);"><i class="fas fa-lock mr-1"></i>Stored locally on your device only.</p>
            </div>
            <div class="mb-5">
                <label for="openai-compatible-model-name" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Manual Model Name (optional)</label>
                <input type="text" id="openai-compatible-model-name"
                    class="connection-modal-input w-full"
                    placeholder="e.g. gpt-4o-mini, qwen3-235b-a22b" autocomplete="off" data-form-type="other" style="width: 100%;">
                <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);"><i class="fas fa-info-circle mr-1"></i>Use this when your endpoint does not support model auto-discovery.</p>
            </div>
            <div class="flex gap-3">
                <button id="cancel-openai-compatible-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    Cancel
                </button>
                <button id="save-openai-compatible-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-12">
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
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    Cancel
                </button>
                <button id="clear-lmstudio-token-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    <i class="fas fa-trash-alt mr-2"></i>Clear
                </button>
                <button id="save-lmstudio-token-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-12">
                    <i class="fas fa-check mr-2"></i>Save
                </button>
            </div>
        </div>
    </div>

    <!-- LM Studio MCP Integrations Input Modal -->
    <div id="lmstudio-mcp-input-modal"
        class="fixed inset-0 items-center justify-center hidden modal-container"
        style="z-index: 2500; background: rgba(0,0,0,0.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
        role="dialog" aria-modal="true" aria-labelledby="lmstudio-mcp-input-title">
        <div class="connection-input-modal-box animate-modal-in">
            <div class="connection-input-modal-accent connection-input-modal-accent--blue"></div>
            <div class="flex justify-between items-center mb-5">
                <h3 id="lmstudio-mcp-input-title" class="text-lg font-bold flex items-center" style="color: var(--settings-title-color, #f1f5f9);">
                    <i class="fas fa-plug text-blue-400 mr-2"></i>LM Studio MCP Integrations
                </h3>
                <button id="close-lmstudio-mcp-input-modal" type="button" class="conn-modal-close-btn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-sm mb-4" style="color: var(--settings-help-text, #9ca3af);">Build LM Studio MCP integrations with a simple form. LMSA will generate the <code>integrations</code> JSON behind the scenes so users do not have to type it manually.</p>

            <div class="mb-5 p-3 rounded-xl border border-white/10 bg-white/5">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.2em]" style="color: var(--settings-help-text, #9ca3af);">Template Gallery</p>
                        <p class="text-xs mt-1" style="color: var(--settings-help-text, #6b7280);">Tap a preset to pre-fill the form.</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 gap-2">
                    <button type="button" class="professional-button justify-start px-4 h-11 text-left" data-mcp-template="huggingface">
                        <i class="fas fa-fire text-yellow-300"></i>
                        <span>Hugging Face Search</span>
                    </button>
                    <button type="button" class="professional-button justify-start px-4 h-11 text-left" data-mcp-template="brave">
                        <i class="fas fa-compass text-orange-300"></i>
                        <span>Web Search (Brave)</span>
                    </button>
                    <button type="button" class="professional-button justify-start px-4 h-11 text-left" data-mcp-template="serpapi">
                        <i class="fas fa-search text-emerald-300"></i>
                        <span>Web Search (SerpApi)</span>
                    </button>
                    <button type="button" class="professional-button justify-start px-4 h-11 text-left" data-mcp-template="playwright">
                        <i class="fas fa-globe text-blue-300"></i>
                        <span>Playwright (Plugin)</span>
                    </button>
                </div>
            </div>

            <div class="mb-5 p-3 rounded-xl border border-white/10 bg-white/5">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.2em]" style="color: var(--settings-help-text, #9ca3af);">Configured Integrations</p>
                        <p id="lmstudio-mcp-list-summary" class="text-xs mt-1" style="color: var(--settings-help-text, #6b7280);">No integrations added yet.</p>
                    </div>
                    <button id="add-lmstudio-mcp-integration-btn" type="button"
                            class="professional-button flex items-center justify-center gap-2 px-4 h-10">
                        <i class="fas fa-plus text-xs"></i>
                        <span>Add</span>
                    </button>
                </div>
                <div id="lmstudio-mcp-empty-state" class="rounded-xl border border-dashed border-white/10 px-4 py-4 text-sm text-center" style="color: var(--settings-help-text, #9ca3af);">
                    No MCP integrations configured yet.
                </div>
                <div id="lmstudio-mcp-integrations-list" class="space-y-3 hidden"></div>
            </div>

            <div id="lmstudio-mcp-builder-panel" class="mb-5 p-4 rounded-xl border border-blue-400/20 bg-blue-500/5 hidden">
                <div class="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h4 id="lmstudio-mcp-builder-title" class="text-sm font-semibold" style="color: var(--settings-title-color, #f1f5f9);">Add MCP Integration</h4>
                        <p class="text-xs mt-1" style="color: var(--settings-help-text, #6b7280);">Fill in the fields below and LMSA will build the JSON automatically.</p>
                    </div>
                    <button id="close-lmstudio-mcp-builder-btn" type="button" class="conn-modal-close-btn" aria-label="Close MCP builder">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="mb-4">
                    <label for="lmstudio-mcp-type" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Type</label>
                    <select id="lmstudio-mcp-type" class="connection-modal-input w-full">
                        <option value="ephemeral_mcp">Ephemeral</option>
                        <option value="plugin">Plugin ID</option>
                    </select>
                </div>

                <div class="mb-4">
                    <label for="lmstudio-mcp-target" id="lmstudio-mcp-target-label" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Server URL</label>
                    <input type="text" id="lmstudio-mcp-target" class="connection-modal-input w-full"
                        placeholder="https://huggingface.co/mcp" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" data-form-type="other">
                    <p id="lmstudio-mcp-target-help" class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);">Use the remote MCP server URL for ephemeral integrations.</p>
                </div>

                <div class="mb-4">
                    <label for="lmstudio-mcp-label" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Label</label>
                    <input type="text" id="lmstudio-mcp-label" class="connection-modal-input w-full"
                        placeholder="Hugging Face" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" data-form-type="other">
                    <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);">For ephemeral integrations this becomes the LM Studio <code>server_label</code>. For plugins it is saved only as an LMSA display label.</p>
                </div>

                <div class="mb-4">
                    <label for="lmstudio-mcp-tool-input" class="block text-xs font-medium mb-1" style="color: var(--settings-label-color, #d1d5db);">Allowed Tools</label>
                    <div class="flex gap-2">
                        <input type="text" id="lmstudio-mcp-tool-input" class="connection-modal-input w-full"
                            placeholder="model_search" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" data-form-type="other">
                        <button id="add-lmstudio-mcp-tool-btn" type="button"
                               class="professional-button flex items-center justify-center gap-2 px-4 h-10 shrink-0">
                            <i class="fas fa-plus text-xs"></i>
                            <span>Tool</span>
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-3">
                        <button type="button" class="professional-button px-3 h-9 text-xs" data-mcp-tool-suggestion="model_search">model_search</button>
                        <button type="button" class="professional-button px-3 h-9 text-xs" data-mcp-tool-suggestion="browser_navigate">browser_navigate</button>
                        <button type="button" class="professional-button px-3 h-9 text-xs" data-mcp-tool-suggestion="search">search</button>
                    </div>
                    <div id="lmstudio-mcp-selected-tools" class="flex-wrap gap-2 mt-3 hidden"></div>
                    <p class="text-xs mt-2" style="color: var(--settings-help-text, #6b7280);">Optional. Leave empty to allow every tool exposed by that server.</p>
                </div>

                <p id="lmstudio-mcp-input-error" class="text-xs mt-2 hidden" style="color: #f87171;"></p>

                <div class="flex gap-3 mt-4">
                    <button id="cancel-lmstudio-mcp-builder-btn" type="button"
                            class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                        Cancel
                    </button>
                    <button id="save-lmstudio-mcp-builder-btn" type="button"
                            class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-12">
                        <i class="fas fa-check mr-2"></i>Save Integration
                    </button>
                </div>
            </div>

            <div class="flex gap-3">
                <button id="cancel-lmstudio-mcp-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    Cancel
                </button>
                <button id="clear-lmstudio-mcp-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--cancel flex-1 h-12">
                    <i class="fas fa-trash-alt mr-2"></i>Clear All
                </button>
                <button id="save-lmstudio-mcp-input-modal" type="button"
                    class="conn-modal-action-btn conn-modal-action-btn--save flex-1 h-12">
                    <i class="fas fa-check mr-2"></i>Done
                </button>
            </div>
        </div>
    </div>
`;
