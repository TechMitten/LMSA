export const helpModal = `
    <!-- Help modal -->
    <div id="help-modal" class="fixed inset-0 bg-black bg-opacity-50 items-center justify-center hidden modal-container"
        aria-labelledby="help-title" role="dialog" aria-modal="true">
        <div class="p-0 rounded-lg w-[800px] max-w-[95%] max-h-[90vh] shadow-lg overflow-hidden flex flex-col modal-content"
            style="background: var(--modal-bg);">
            <div class="p-6 pb-4 border-b sticky top-0 z-10 flex justify-between"
                style="border-color: var(--border-color);">
                <h2 id="help-title" class="text-2xl font-bold flex items-center">
                    <div class="w-10 h-10 rounded-full mr-3 flex items-center justify-center"
                        style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                        <i class="fas fa-question-circle text-white text-lg"></i>
                    </div>
                    <span
                        class="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">LMSA
                        Help</span>
                </h2>
                <div class="flex items-center h-9">
                    <button id="close-help" class="group w-9 h-9 flex items-center justify-center focus:outline-none">
                        <i class="fas fa-times text-lg" style="color: var(--modal-text);"></i>
                    </button>
                </div>
            </div>
            <div class="overflow-y-auto flex-grow p-6 pt-4"
                style="-webkit-overflow-scrolling: touch; touch-action: auto; overscroll-behavior: contain; background: var(--modal-bg);"
                id="help-modal-content">
                <div class="space-y-6">
                    <!-- Table of Contents -->
                    <div class="p-4 rounded-lg"
                        style="background: var(--settings-label-bg); border: 1px solid var(--border-color);">
                        <h3 class="text-lg font-semibold mb-3 flex items-center" style="color: var(--text-primary);"><i
                                class="fas fa-list mr-2" style="color: #3b82f6;"></i>Table of Contents</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <details class="md:col-span-2 p-2 rounded"
                                style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);">
                                <summary class="flex items-center font-semibold cursor-pointer"
                                    style="color: var(--text-primary); list-style: none;">
                                    <i class="fas fa-folder-tree mr-2 text-sm"></i>
                                    <span>Setup</span>
                                </summary>
                                <div class="mt-2 pl-2 space-y-1"
                                    style="border-left: 1px solid rgba(255, 255, 255, 0.12);">
                                    <a href="#section-quick-start"
                                        class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                        style="color: var(--success-color);">
                                        <i class="fas fa-rocket mr-2 text-sm"></i>
                                        <span>LM Studio Setup</span>
                                    </a>
                                    <a href="#section-ollama-setup"
                                        class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                        style="color: #ec4899;">
                                        <i class="fas fa-terminal mr-2 text-sm"></i>
                                        <span>Ollama Setup</span>
                                    </a>
                                    <a href="#section-openrouter"
                                        class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                        style="color: #facc15;">
                                        <i class="fas fa-cloud mr-2 text-sm"></i>
                                        <span>OpenRouter Setup</span>
                                    </a>
                                </div>
                            </details>
                            <a href="#section-templates"
                                class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                style="color: #a78bfa;">
                                <i class="fas fa-th-large mr-2 text-sm"></i>
                                <span>Using Templates</span>
                            </a>
                            <a href="#section-font-customization"
                                class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                style="color: #c084fc;">
                                <i class="fas fa-font mr-2 text-sm"></i>
                                <span>Font & Text Size</span>
                            </a>
                            <details class="md:col-span-2 p-2 rounded" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);">
                                <summary class="flex items-center font-semibold cursor-pointer" style="color: var(--text-primary); list-style: none;">
                                    <i class="fas fa-shield-alt mr-2 text-sm"></i>
                                    <span>Privacy</span>
                                </summary>
                                <div class="mt-2 pl-2 space-y-1" style="border-left: 1px solid rgba(255, 255, 255, 0.12);">
                                    <a href="#section-security-privacy" class="toc-link flex items-center p-2 rounded transition-colors font-semibold" style="color: var(--info-color);">
                                        <i class="fas fa-lock mr-2 text-sm"></i>
                                        <span>Security & Privacy</span>
                                    </a>
                                    <a href="#section-ads-privacy" class="toc-link flex items-center p-2 rounded transition-colors font-semibold" style="color: var(--warning-color);">
                                        <i class="fas fa-ad mr-2 text-sm"></i>
                                        <span>Ads & Privacy</span>
                                    </a>
                                </div>
                            </details>
                            <a href="#section-legacy-access"
                                class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                style="color: #3b82f6;">
                                <i class="fas fa-key mr-2 text-sm"></i>
                                <span>Legacy Access</span>
                            </a>
                            <a href="#section-limits"
                                class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                style="color: #8b5cf6;">
                                <i class="fas fa-chart-line mr-2 text-sm"></i>
                                <span>Usage Limits</span>
                            </a>
                            <a href="#section-troubleshooting"
                                class="toc-link flex items-center p-2 rounded transition-colors font-semibold"
                                style="color: #f59e0b;">
                                <i class="fas fa-tools mr-2 text-sm"></i>
                                <span>Troubleshooting</span>
                            </a>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <section id="section-quick-start">
                            <h3 class="text-lg font-semibold mb-2 flex items-center"
                                style="color: var(--success-color);"><i class="fas fa-rocket mr-2"></i>LM Studio Setup
                            </h3>
                            <ul class="list-disc pl-5 space-y-1" style="color: var(--text-primary);">
                                <li><strong>Start the LM Studio server</strong> on your computer (do NOT load a model
                                    yet)</li>
                                <li>Enter server URL in <a href="#" id="open-settings-link"
                                        class="text-blue-400 hover:text-blue-300">Settings</a> (IP:Port)</li>
                                <li><strong>Load models from LMSA</strong> using the <i
                                        class="fas fa-robot text-blue-400"></i> button in the sidebar's Options menu
                                </li>
                                <li>Start chatting!</li>
                            </ul>
                            <div class="mt-2 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #ef4444;"><i
                                        class="fas fa-exclamation-circle mr-2"></i>IMPORTANT:</p>
                                <p style="color: var(--text-primary);">Enable "CORS" and "Serve on local network" in LM
                                    Studio after starting your server. Make sure your device is on the same Wi-Fi as the
                                    server computer.</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;"><strong>Always load models
                                        from within LMSA, not from LM Studio directly.</strong> Loading models directly
                                    in LM Studio can cause multiple models to stack in memory instead of being replaced,
                                    leading to excessive resource usage on your server computer.</p>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #a78bfa;"><i
                                        class="fas fa-sync-alt mr-2"></i>Model Switching:</p>
                                <p style="color: var(--text-primary);">You can switch between different models directly
                                    in the app:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Open the sidebar and tap <strong>Options</strong></li>
                                    <li>Tap the <i class="fas fa-robot text-blue-400"></i> <strong>Models</strong>
                                        button</li>
                                    <li>Browse available models on your LM Studio server</li>
                                    <li>Tap <strong>Load</strong> next to your desired model</li>
                                    <li>The app will automatically eject the current model and load the new one</li>
                                </ul>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #fbbf24;"><i
                                        class="fas fa-star mr-2"></i>Default Model:</p>
                                <p style="color: var(--text-primary);">Save time by setting your favorite model as the
                                    default. It will automatically load when you start the app:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Open the <i class="fas fa-robot text-blue-400"></i> <strong>Models</strong> menu
                                        from the sidebar's Options</li>
                                    <li>Find your preferred model in the list</li>
                                    <li>Tap the <i class="fas fa-star" style="color: #9ca3af;"></i> star icon next to
                                        the model</li>
                                    <li>The star will turn <i class="fas fa-star" style="color: #fbbf24;"></i> yellow to
                                        confirm it's set as default</li>
                                    <li>Next time you open LMSA, this model will load automatically</li>
                                    <li>To remove the default, simply tap the <i class="fas fa-star"
                                            style="color: #fbbf24;"></i> yellow star again</li>
                                </ul>
                            </div>
                        </section>

                        <section id="section-ollama-setup">
                            <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: #ec4899;">
                                <i class="fas fa-terminal mr-2"></i>Ollama Setup
                            </h3>
                            <p style="color: var(--text-primary); margin-bottom: 1rem;">
                                To connect LMSA to Ollama on your local network, you need to configure Ollama to listen
                                on all network interfaces. Follow the instructions below for your operating system.
                            </p>




                            <div class="space-y-4">
                                <!-- Windows Instructions -->
                                <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                    <p class="font-medium flex items-center" style="color: #3b82f6;"><i
                                            class="fab fa-windows mr-2"></i>Windows Instructions</p>


                                    <div class="mt-3 p-3 rounded bg-blue-500/10 border border-blue-500/20 mb-4">
                                        <p class="text-sm font-semibold text-blue-400 mb-2"><i
                                                class="fas fa-magic mr-2"></i>Quick Method (Recommended)</p>
                                        <p style="color: var(--text-primary); font-size: 0.9em;">
                                            Start the server by opening the <strong>Ollama user interface</strong>,
                                            clicking <strong>Settings</strong>, and then enabling the option
                                            <strong>Expose Ollama to the network</strong>.
                                        </p>
                                    </div>

                                    <p class="text-xs italic font-medium text-gray-300 mb-3 ml-1">Or Manual
                                        Configuration:</p>

                                    <div class="mt-3">
                                        <p class="text-sm font-semibold text-blue-400 mb-1">Step 1: Close Ollama</p>
                                        <p style="color: var(--text-primary); font-size: 0.9em; margin-bottom: 0.5rem;">
                                            If Ollama is currently running, find the little llama icon in your taskbar
                                            (near the clock), click it, and select <strong>Quit</strong> to close the
                                            application completely.
                                        </p>
                                    </div>

                                    <div class="mt-3">
                                        <p class="text-sm font-semibold text-blue-400 mb-1">Step 2: Open Environment
                                            Variables</p>
                                        <p style="color: var(--text-primary); font-size: 0.9em; margin-bottom: 0.5rem;">
                                            Follow these steps to access the environment variables:
                                        </p>
                                        <ul class="list-disc pl-5 space-y-1"
                                            style="color: var(--text-primary); font-size: 0.9em;">
                                            <li>Click the <strong>Start</strong> button and type: <code>env</code></li>
                                            <li>Click on the result that says <strong>"Edit the system environment
                                                    variables"</strong>.</li>
                                            <li>In the small window that pops up, click the button near the bottom
                                                labeled <strong>Environment Variables</strong>.</li>
                                        </ul>
                                    </div>

                                    <div class="mt-3">
                                        <p class="text-sm font-semibold text-blue-400 mb-1">Step 3: Add the new setting
                                        </p>
                                        <ul class="list-disc pl-5 space-y-1"
                                            style="color: var(--text-primary); font-size: 0.9em;">
                                            <li>Look at the top section labeled <strong>"User variables for
                                                    [YourName]"</strong>.</li>
                                            <li>Click the <strong>New...</strong> button under that list.</li>
                                            <li>In the "Variable name" box, type: <code>OLLAMA_HOST</code></li>
                                            <li>In the "Variable value" box, type: <code>0.0.0.0</code></li>
                                            <li>Click <strong>OK</strong> on all the open windows to save your changes.
                                            </li>
                                        </ul>
                                    </div>

                                    <div class="mt-3">
                                        <p class="text-sm font-semibold text-blue-400 mb-1">Step 4: Restart</p>
                                        <p style="color: var(--text-primary); font-size: 0.9em;">
                                            <strong>Restart your computer</strong> for these changes to take effect.
                                        </p>
                                    </div>
                                </div>

                                <!-- Linux Instructions -->
                                <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                    <p class="font-medium flex items-center" style="color: #f59e0b;"><i
                                            class="fab fa-linux mr-2"></i>Linux Instructions</p>

                                    <div class="mt-3">
                                        <p class="text-sm font-semibold text-blue-400 mb-1">Step 1: Open the settings
                                            file</p>
                                        <p style="color: var(--text-primary); font-size: 0.9em; margin-bottom: 0.5rem;">
                                            Open your terminal and paste in the following command to edit the Ollama
                                            configuration file:</p>
                                        <div
                                            class="p-2 rounded bg-gray-900 text-gray-300 font-mono text-xs overflow-x-auto border border-gray-700 mb-3">
                                            sudo nano /etc/systemd/system/ollama.service
                                        </div>
                                    </div>

                                    <div class="mt-3">
                                        <p class="text-sm font-semibold text-blue-400 mb-1">Step 2: Add the network
                                            setting</p>
                                        <p style="color: var(--text-primary); font-size: 0.9em; margin-bottom: 0.5rem;">
                                            Once the file opens, use your arrow keys to scroll down until you see the
                                            section labeled <code>[Service]</code>. Inside that section, add a new line
                                            and paste this text:
                                        </p>
                                        <div
                                            class="p-2 rounded bg-gray-900 text-gray-300 font-mono text-xs overflow-x-auto border border-gray-700 mb-3">
                                            Environment="OLLAMA_HOST=0.0.0.0"
                                        </div>
                                    </div>

                                    <div class="mt-3">
                                        <p class="text-sm font-semibold text-blue-400 mb-1">Step 3: Save your changes
                                        </p>
                                        <p style="color: var(--text-primary); font-size: 0.9em; margin-bottom: 0.5rem;">
                                            To save the file and exit the editor:</p>
                                        <ul class="list-disc pl-5 space-y-1"
                                            style="color: var(--text-primary); font-size: 0.9em;">
                                            <li>Press <strong>Ctrl + O</strong> on your keyboard, then hit
                                                <strong>Enter</strong> to save.
                                            </li>
                                            <li>Press <strong>Ctrl + X</strong> to close the file.</li>
                                            <li><strong>Restart your computer</strong> for these changes to take effect.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="section-openrouter">
                            <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: #facc15;"><i
                                    class="fas fa-cloud mr-2"></i>OpenRouter Setup</h3>
                            <p style="color: var(--text-primary); margin-bottom: 1rem;">OpenRouter is a cloud AI
                                service that lets you access hundreds of hosted models using your own API key. When
                                OpenRouter is enabled, LMSA bypasses the local server entirely and sends requests
                                directly to OpenRouter's cloud API.</p>

                            <div class="mt-2 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #facc15;"><i
                                        class="fas fa-rocket mr-2"></i>Quick Start:</p>
                                <ol class="list-decimal pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Create a free account at <strong>openrouter.ai</strong> and generate an API
                                        key from your dashboard</li>
                                    <li>Open <strong>Settings</strong> in LMSA and scroll to the <strong>Use
                                            OpenRouter (Cloud AI)</strong> toggle — switch it on</li>
                                    <li>Paste your API key into the <strong>OpenRouter API Key</strong> field that
                                        appears</li>
                                    <li>Open the <i class="fas fa-robot text-blue-400"></i> <strong>Models</strong>
                                        menu from the sidebar's Options to browse and select any available cloud
                                        model</li>
                                    <li>Start chatting — no local server required!</li>
                                </ol>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #3b82f6;"><i
                                        class="fas fa-robot mr-2"></i>Selecting a Model:</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">OpenRouter provides
                                    access to hundreds of models from providers like OpenAI, Anthropic, Meta,
                                    Mistral, and more.</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Open the sidebar, tap <strong>Options</strong>, then the <i
                                            class="fas fa-robot text-blue-400"></i> <strong>Models</strong> button
                                    </li>
                                    <li>The full OpenRouter model catalog will load automatically</li>
                                    <li>Tap <strong>Load</strong> next to any model to select it</li>
                                    <li>Your selection is saved and will be remembered next session</li>
                                </ul>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #a78bfa;"><i
                                        class="fas fa-info-circle mr-2"></i>Key Differences from Local Mode:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li><strong>No local server needed</strong> — LM Studio and Ollama are not used
                                        when OpenRouter is active</li>
                                    <li><strong>Internet required</strong> — all requests are sent to OpenRouter's
                                        cloud servers</li>
                                    <li><strong>Usage costs</strong> — most models charge per token; check
                                        OpenRouter's pricing page for details. Some free-tier models are available
                                    </li>
                                    <li><strong>Reasoning models</strong> — models with built-in reasoning (e.g.
                                        DeepSeek R1) are fully supported and will display their thinking process
                                    </li>
                                    <li><strong>Model loading/ejecting</strong> — cloud models activate instantly;
                                        there is no download or hardware constraint</li>
                                </ul>
                            </div>

                            <div class="mt-4 p-3 rounded-lg border"
                                style="background: var(--settings-label-bg); border-color: #ef4444;">
                                <p class="font-medium flex items-center" style="color: #ef4444;"><i
                                        class="fas fa-shield-alt mr-2"></i>Privacy Notice:</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">When OpenRouter is
                                    enabled, your messages are sent to OpenRouter's servers and then forwarded to
                                    the chosen model provider. <strong>Do not share sensitive personal information,
                                        passwords, or private data</strong> in your conversations. Review
                                    OpenRouter's privacy policy for details on how your data is handled.</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">Your API key is stored
                                    <strong>locally on your device only</strong> and is never sent to LMSA's
                                    servers.</p>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #facc15;"><i
                                        class="fas fa-exclamation-circle mr-2"></i>Troubleshooting OpenRouter:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li><strong>No models loading</strong> — verify your API key is correct and
                                        has not expired. Re-enter it in Settings if needed</li>
                                    <li><strong>"Server not running" error</strong> — make sure the OpenRouter
                                        toggle is on and a valid API key is entered</li>
                                    <li><strong>Responses failing mid-stream</strong> — check your internet
                                        connection and ensure your OpenRouter account has sufficient credits</li>
                                    <li><strong>Switching back to local</strong> — simply turn the OpenRouter
                                        toggle off in Settings to return to LM Studio or Ollama mode</li>
                                </ul>
                            </div>
                        </section>

                        <section id="section-templates">
                            <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: #a78bfa;"><i
                                    class="fas fa-th-large mr-2"></i>Using Templates</h3>
                            <p style="color: var(--text-primary); margin-bottom: 1rem;">Templates provide pre-configured
                                AI personas that specialize in different tasks. Instead of writing custom system
                                prompts, you can select from ready-made templates to get started quickly.</p>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #a78bfa;"><i
                                        class="fas fa-list mr-2"></i>Accessing Templates:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Open the sidebar and tap <strong>Templates</strong></li>
                                     <li>Browse through available templates like Math Tutor, Code Assistant, Fitness Coach, and more</li>
                                    <li>Each template has a specialized role and personality designed for specific tasks
                                    </li>
                                </ul>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #10b981;"><i
                                        class="fas fa-check-circle mr-2"></i>Selecting a Template:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Tap on any template card to select it (it will highlight with a blue ring)</li>
                                    <li>Tap the <strong>Start Chatting</strong> button at the bottom</li>
                                    <li>You'll be returned to the main chat with the template active</li>
                                    <li>A banner at the top will show which template is currently active</li>
                                </ul>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #3b82f6;"><i
                                        class="fas fa-comment-dots mr-2"></i>Using Active Templates:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>When a template is active, the AI will respond according to that template's
                                        personality and expertise</li>
                                    <li>The template indicator banner shows which template is currently in use</li>
                                    <li>Templates work across all your conversations until you disable or change them
                                    </li>
                                    <li>You can switch templates at any time by going back to the Templates page</li>
                                </ul>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #ef4444;"><i
                                        class="fas fa-times-circle mr-2"></i>Disabling Templates:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Click the <strong>Disable</strong> button in the template indicator banner at
                                        the top</li>
                                    <li>This will remove the template and return the AI to its default behavior</li>
                                    <li>You can also disable templates by clearing the system prompt in Settings</li>
                                </ul>
                            </div>

                            <div class="mt-4 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #f59e0b;"><i
                                        class="fas fa-info-circle mr-2"></i>Model Quality:</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">The effectiveness of
                                    templates varies depending on which AI model you're using in LM Studio. Larger, more
                                    capable models (like 13B+ parameter models) will follow template instructions more
                                    accurately and produce better results. Smaller models may not adhere as closely to
                                    the template's personality or expertise.</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">For best results with
                                    templates, use a model with strong instruction-following capabilities.</p>
                            </div>




                        </section>
                        <section id="section-font-customization">
                            <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: #c084fc;"><i
                                    class="fas fa-font mr-2"></i>Font & Text Size</h3>
                            <p style="color: var(--text-primary); margin-bottom: 1rem;">
                                You can personalize how text looks in your conversations by changing the chat bubble
                                font style and size in Settings.
                            </p>

                            <div class="mt-2 p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #c084fc;"><i
                                        class="fas fa-sliders-h mr-2"></i>How to change the font:</p>
                                <ol class="list-decimal pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Open the sidebar and tap <strong>Settings</strong></li>
                                    <li>Go to the <strong>Font</strong> step</li>
                                    <li>Use <strong>Chat Bubble Font</strong> to choose your preferred font style</li>
                                    <li>Use <strong>Chat Bubble Font Size</strong> to choose your preferred text size</li>
                                </ol>
                            </div>

                            <div class="mt-4 p-3 rounded-lg border"
                                style="background: var(--settings-label-bg); border-color: #c084fc;">
                                <p class="font-medium flex items-center" style="color: #c084fc;"><i
                                        class="fas fa-info-circle mr-2"></i>Important:</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">
                                    Changing <strong>Chat Bubble Font Size</strong> only affects text inside chat
                                    bubbles (your messages and AI replies). It does <strong>not</strong> change text size
                                    in menus, settings screens, or other parts of the app UI.
                                </p>
                            </div>
                        </section>
                        <section id="section-security-privacy">
                            <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: var(--info-color);">
                                <i class="fas fa-lock mr-2"></i>Security & Privacy
                            </h3>
                            <div class="p-3 rounded-lg border"
                                style="background: var(--settings-label-bg); border-color: var(--border-color);">
                                <p style="color: var(--text-primary);">For your privacy and security, all chat messages
                                    are stored locally on your device. We do not store any of your conversations on
                                    external servers. Please note that:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Uninstalling the app will permanently delete all saved chats</li>
                                    <li>Clearing app storage in device settings will erase all chat history</li>
                                    <li>These actions cannot be undone as data is stored only on your device</li>
                                </ul>

                                <div class="mt-3 rounded border"
                                    style="background: var(--settings-label-bg); border-color: var(--border-color); padding: 0.75rem;">
                                    <p class="font-medium flex items-center" style="color: #ef4444;"><i
                                            class="fas fa-shield-alt mr-2"></i>Network Security:</p>
                                    <p style="color: var(--text-primary); margin-top: 0.5rem; margin-bottom: 0.5rem;">
                                        <strong>The connection between your device and the LM Studio server is NOT
                                            encrypted.</strong>
                                        This means that anyone monitoring your network traffic can potentially:
                                    </p>
                                    <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                        <li>Intercept and read all messages you send and receive</li>
                                        <li>View any personal information or sensitive data in your conversations</li>
                                        <li>Pose as a fake LM Studio server and respond with malicious commands or
                                            information</li>
                                        <li>Compromise your privacy if the network or any device on it is compromised
                                        </li>
                                    </ul>
                                    <p style="color: var(--text-primary); margin-top: 0.75rem; font-weight: 600;">
                                        <i class="fas fa-exclamation-circle mr-2" style="color: #ef4444;"></i>
                                        To protect your privacy:
                                    </p>
                                    <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                        <li><strong>Only use LMSA on networks and devices you trust</strong></li>
                                        <li><strong>Never send personal information, passwords, or sensitive data
                                                through the app</strong></li>
                                        <li>Avoid using LMSA on public Wi-Fi networks or shared/untrusted networks</li>
                                        <li>Be aware that compromised devices on your network can intercept your traffic
                                        </li>
                                    </ul>
                                </div>

                                <div class="mt-3 p-2 rounded" style="background: var(--settings-label-bg);">
                                    <p class="font-medium flex items-center" style="color: #06b6d4;"><i
                                            class="fas fa-file-export mr-2"></i>Chat Export/Import:</p>
                                    <p style="color: var(--text-primary); margin-bottom: 0.5rem;">You can now backup and
                                        restore your conversations using the Export and Import features in the sidebar
                                        menu.</p>
                                    <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                        <li>Use <strong>Export Chats</strong> to save all your conversations to a file
                                        </li>
                                        <li>Use <strong>Import Chats</strong> to restore previously exported
                                            conversations</li>
                                        <li>You can choose to merge imported chats with existing ones or replace them
                                            entirely</li>
                                        <li>Store exported files securely to protect your privacy</li>
                                    </ul>
                                    <div class="p-2 rounded mt-2" style="background: var(--settings-label-bg);">
                                        <p class="font-medium" style="color: var(--button-danger-bg);"><i
                                                class="fas fa-exclamation-triangle mr-2"></i>Security Warning:</p>
                                        <p style="color: var(--text-primary);">Exported chat files are stored as
                                            unencrypted JSON files. Anyone with access to your device or the exported
                                            file can read your conversations in plain text, even without using LMSA.</p>
                                    </div>
                                </div>
                            </div>

                    </div>
                    </section>
                    <section id="section-ads-privacy">
                        <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: var(--warning-color);"><i
                                class="fas fa-ad mr-2"></i>Ads & Privacy</h3>
                        <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                            <p class="font-medium flex items-center" style="color: var(--success-color);"><i
                                    class="fas fa-shield-alt mr-2"></i></p>
                            <p style="color: var(--text-primary); margin-top: 0.75rem; margin-bottom: 0.75rem;">
                                While LMSA displays ads to support development, your chat messages remain completely
                                private:</p>
                            <ul class="list-disc pl-5 space-y-2" style="color: var(--text-primary);">
                                <li><strong>No chat data is sent to us</strong> - The developer cannot see your
                                    conversations</li>
                                <li><strong>No chat data is sent to AdMob</strong> - Google's ad service does not
                                    receive your messages</li>
                                <li><strong>Ads are generic</strong> - They are not based on your chat content</li>
                                <li><strong>All messages stay local</strong> - Your chats are stored only on your
                                    device</li>
                                <li><strong>Direct LM Studio connection</strong> - Messages go straight from LMSA to
                                    your LM Studio server</li>
                            </ul>
                            <p style="color: var(--text-primary); margin-top: 1rem;">The ads help keep LMSA free
                                while respecting your privacy. We believe in transparency and your right to private
                                conversations.</p>

                            <div class="mt-4 p-2 rounded" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #a78bfa;"><i
                                        class="fas fa-crown mr-2"></i>LMSA Premium</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">Prefer an ad-free
                                    experience? Tap the <strong>Remove Ads</strong> button on the main page to
                                    upgrade to LMSA Premium with a one-time lifetime purchase that removes all ads
                                    from the app forever.</p>
                            </div>

                            <div id="section-legacy-access" class="mt-4 p-2 rounded"
                                style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #3b82f6;"><i
                                        class="fas fa-key mr-2"></i>Legacy Users</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem; margin-bottom: 0.5rem;">
                                    Background: Early releases of LMSA were distributed as a paid-only app (no free
                                    tier). We later added a free tier alongside paid options. Because of that
                                    transition, users who purchased the original ("legacy") paid version need to
                                    reactivate their premium access in the newer app using a special legacy promo
                                    code.
                                </p>

                                <div class="mt-2 p-2 rounded" style="background: rgba(59,130,246,0.03); border: 1px solid rgba(59,130,246,0.06);">
                                    <p style="color: var(--text-primary); margin-bottom: 0.5rem;"><strong>How to get your legacy promo
                                            code:</strong></p>
                                    <ol class="list-decimal pl-5 mt-2" style="color: var(--text-primary);">
                                        <li>Email <strong>support@lmsa.app</strong> and include your order number (and any
                                            purchase date or receipt details you still have).</li>
                                        <li>We will verify your legacy purchase and reply with a one-time promo code and
                                            instructions to apply it in the app to restore your premium (ad-free)
                                            access.</li>
                                    </ol>
                                    <p style="color: var(--text-primary); margin-top: 0.5rem;">If you need help locating your
                                        order number, use the link below to find guidance.</p>
                                    <p style="color: var(--text-primary);"><a href="#" id="help-locate-order-number-link"
                                            class="text-blue-400 hover:text-blue-300 underline">Locate order number</a></p>
                                    <p style="color: var(--text-primary); margin-top: 0.5rem;">If you don't receive the
                                        instructions for redeeming the code, reply to our support message and we'll
                                        assist you directly.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section id="section-limits">
                        <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: #8b5cf6;"><i
                                class="fas fa-chart-line mr-2"></i>Usage Limits</h3>
                        
                        <div class="space-y-4">
                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #22c55e;"><i
                                        class="fas fa-user-circle mr-2"></i>Free Users</p>
                                <p style="color: var(--text-primary); margin-top: 0.75rem; margin-bottom: 0.75rem;">
                                    Free users have the following limits and features:</p>
                                <ul class="list-disc pl-5 space-y-2" style="color: var(--text-primary);">
                                    <li><strong>Chat Completion Limit: 20 per day</strong> — After reaching this limit, you'll enter a cooldown period</li>
                                    <li><strong>Automatic Reset: Midnight (Local Time)</strong> — Your chat completion count resets at midnight in your timezone, allowing you to chat freely again</li>
                                    <li><strong>Advertisements:</strong> Free users see advertisements throughout the app</li>
                                    <li><strong>Full Feature Access:</strong> All other features remain fully functional during cooldown periods</li>
                                </ul>
                            </div>

                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #f59e0b;"><i
                                        class="fas fa-crown mr-2"></i>Premium Users</p>
                                <p style="color: var(--text-primary); margin-top: 0.75rem; margin-bottom: 0.75rem;">
                                    Premium users enjoy unlimited access with the following benefits:</p>
                                <ul class="list-disc pl-5 space-y-2" style="color: var(--text-primary);">
                                    <li><strong>Unlimited Chat Completions</strong> — No daily limits or cooldown periods</li>
                                    <li><strong>Ad-Free Experience</strong> — No advertisements throughout the app</li>
                                    <li><strong>One-Time Purchase:</strong> Upgrade with a single lifetime purchase</li>
                                    <li><strong>Full Creative Freedom:</strong> Chat as much as you want, whenever you want</li>
                                </ul>
                            </div>

                            <div class="p-3 rounded-lg mt-4" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #3b82f6;"><i
                                        class="fas fa-lightbulb mr-2"></i>How to Upgrade</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">To unlock Premium benefits and remove the chat completion limit:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Tap the <strong>Remove Ads</strong> button on the main page</li>
                                    <li>Complete a one-time lifetime purchase</li>
                                    <li>Enjoy unlimited chats with no ads forever</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                    <section id="section-troubleshooting">
                        <h3 class="text-lg font-semibold mb-2 flex items-center" style="color: #f59e0b;"><i
                                class="fas fa-tools mr-2"></i>Troubleshooting</h3>
                        <p style="color: var(--text-primary); margin-bottom: 1rem;">If you're having trouble
                            connecting LMSA to your LM Studio server, follow these steps:</p>

                        <div class="space-y-4">
                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #3b82f6;"><i
                                        class="fas fa-cog mr-2"></i>Verify Server Settings</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>In LM Studio, go to server settings and confirm <strong>"Enable
                                            CORS"</strong> is checked</li>
                                    <li>Verify that <strong>"Serve on Local Network"</strong> is enabled in LM
                                        Studio settings - this is required for the server to accept connections from
                                        devices on your network</li>
                                </ul>
                            </div>

                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #10b981;"><i
                                        class="fas fa-network-wired mr-2"></i>Verify IP Address</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">The IP address shown in
                                    LM Studio may sometimes be incorrect. Manually check your computer's Wi-Fi
                                    adapter IP address:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li><strong>Windows:</strong> Open Command Prompt and type
                                        <code>ipconfig</code>, look for "Wireless LAN adapter Wi-Fi" and use the
                                        IPv4 Address listed there
                                    </li>
                                    <li><strong>Mac:</strong> Go to System Preferences > Network, select Wi-Fi, and
                                        note the IP address</li>
                                    <li><strong>Linux:</strong> Open Terminal and type <code>ip addr show</code> or
                                        <code>ifconfig</code>
                                    </li>
                                </ul>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">Enter this IP address
                                    from your Wi-Fi adapter into LMSA</p>
                            </div>

                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #a78bfa;"><i
                                        class="fas fa-wifi mr-2"></i>Network Configuration</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Ensure both your computer and Android phone are on the <strong>same
                                            network</strong></li>
                                    <li>Avoid guest networks, which often isolate devices from each other</li>
                                    <li>Check if your router has VLAN isolation or AP isolation enabled (disable if
                                        present)</li>
                                    <li>Disable VPN on both devices, as VPNs typically isolate local network
                                        connections</li>
                                </ul>
                            </div>

                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #ef4444;"><i
                                        class="fas fa-shield-alt mr-2"></i>Firewall Settings</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;"><strong>Windows
                                        Users:</strong> Check Windows Firewall to
                                    ensure LM Studio is allowed through:</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Go to Windows Security > Firewall & network protection > Allow an app
                                        through firewall</li>
                                    <li>Verify LM Studio has checkmarks for both <strong>Private and Public
                                            networks</strong> (or whichever profile you're using)</li>
                                    <li>If LM Studio isn't listed, click "Allow another app" and add it manually
                                    </li>
                                </ul>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;"><strong>Linux
                                        Users:</strong></p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Check UFW in terminal with <code>sudo ufw status</code></li>
                                    <li>Ensure the correct port is allowed</li>
                                </ul>
                            </div>

                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #06b6d4;"><i
                                        class="fas fa-ethernet mr-2"></i>Port Configuration</p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Try using different ports if the default (1234) doesn't work</li>
                                    <li>Common alternatives: <strong>8080, 5000, 3000</strong></li>
                                    <li>Ensure the port you choose isn't blocked by your firewall or used by another
                                        application</li>
                                </ul>
                            </div>

                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #f59e0b;"><i
                                        class="fas fa-list-ul mr-2"></i>Incomplete Model List</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem;">If all models or only a
                                    partial list of models are showing as options in the Model Information modal:
                                </p>
                                <ul class="list-disc pl-5 mt-2 space-y-1" style="color: var(--text-primary);">
                                    <li>Close LM Studio and the LMSA android app completely</li>
                                    <li>Start LM Studio again</li>
                                    <li>Open the LMSA app</li>
                                    <li>If this doesn't work, restart your computer and android device and try again
                                    </li>
                                </ul>
                            </div>

                            <!-- Ignorable Log Errors section removed per request -->

                            <div class="p-3 rounded-lg" style="background: var(--settings-label-bg);">
                                <p class="font-medium flex items-center" style="color: #f59e0b;"><i
                                        class="fas fa-stethoscope mr-2"></i>Test Network Connectivity</p>
                                <p style="color: var(--text-primary); margin-top: 0.5rem; margin-bottom: 0.5rem;">
                                    <strong>From Android to Computer:</strong>
                                </p>
                                <ul class="list-disc pl-5 space-y-1" style="color: var(--text-primary);">
                                    <li>Download a networking app with ping functionality (e.g., PingTools, Network
                                        Utilities)</li>
                                    <li>Ping your computer's IP address to verify connectivity</li>
                                </ul>
                                <p style="color: var(--text-primary); margin-top: 0.75rem; margin-bottom: 0.5rem;">
                                    <strong>From Computer to Android:</strong>
                                </p>
                                <ul class="list-disc pl-5 space-y-1" style="color: var(--text-primary);">
                                    <li>Find your Android phone's IP address in your router's connected devices list
                                        or in phone settings</li>
                                    <li>Open Command Prompt (Windows) or Terminal (Mac/Linux) and run
                                        <code>tracert [phone-ip]</code> (Windows) or
                                        <code>traceroute [phone-ip]</code> (Mac/Linux)
                                    </li>
                                    <li>If the traceroute fails, there may be network isolation preventing
                                        communication</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <!-- Static Spacer Divider -->
            <div class="px-6 py-2 flex justify-center" style="background: var(--modal-bg);">
            <div class="w-full max-w-md flex items-center justify-center">
                <div class="h-[1px] flex-grow bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60">
                </div>
                <div class="mx-4">
                    <div class="w-2 h-2 rounded-full bg-blue-500 opacity-80"></div>
                </div>
                <div class="h-[1px] flex-grow bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60">
                </div>
            </div>
        </div>
            <!-- Scroll to Top Button -->
            <div class="flex justify-center" id="help-scroll-to-top-container" style="display: none;">
                <button id="help-scroll-to-top"
                    class="professional-button flex items-center justify-center gap-3 w-full md:w-auto md:px-8 h-[48px]">
                    <i class="fas fa-arrow-up text-sm"></i>
                    <span>Scroll to Top</span>
                </button>
            </div>
        </div>
    </div>
</div>
`;
