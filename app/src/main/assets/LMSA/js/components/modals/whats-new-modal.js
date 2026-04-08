export const whatsNewModal = `
    <!-- What's New modal -->
    <div id="whats-new-modal" class="fixed inset-0 hidden modal-container" aria-labelledby="whats-new-title"
        role="dialog" aria-modal="true">
        <div class="bg-gradient-to-b from-[#0a192f]/95 via-[#0c1e36]/95 to-[#0a192f]/95 p-4 rounded-2xl shadow-2xl modal-content flex flex-col border border-white/10 overflow-hidden"
            style="box-shadow: 0 20px 60px -15px rgba(0,0,0,0.7), 0 0 30px rgba(31, 66, 135, 0.2), 0 0 0 1px rgba(255,255,255,0.1) inset;">
            <div class="flex justify-between items-center mb-3 pb-3 border-b border-white/15">
                <h2 id="whats-new-title" class="text-xl font-bold flex items-center">
                        <div
                        class="icon-wrapper mr-3 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 w-9 h-9 text-darkBg shadow-lg">
                        <i class="fas fa-wand-magic-sparkles text-sm"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-blue-400 font-extrabold">What's New</span>
                        <span class="text-xs text-blue-300/80 font-medium">v<span
                            id="whats-new-version">10.7</span></span>
                    </div>
                </h2>
                <button id="close-whats-new"
                    class="text-gray-400 hover:text-white focus:outline-none rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>

                    <div class="features-container overflow-y-auto grow px-1 py-2">
                <div class="space-y-3">
                    <!-- (Premium feature removed) -->
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-violet-500/10 to-fuchsia-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-violet-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-fingerprint text-violet-300"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">App Biometric Unlock</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">Secure your chats with device biometrics! You can now require fingerprint or face unlock to open the app.</p>
                                        <p class="mb-3">Enable this feature anytime in the Settings menu under Security.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                            <div class="feature-item">
                                <div class="relative overflow-hidden">
                                    <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-emerald-500/10 to-green-700/5 rounded-full blur-xl">
                                    </div>
                                    <div class="flex items-start relative z-10">
                                        <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-emerald-500/20 w-10 h-10 shadow-sm">
                                            <i class="fas fa-file-import text-emerald-300"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-center">
                                                <h3 class="feature-title">Import/Export Fixed</h3>
                                            </div>
                                            <div class="feature-description">
                                                <p class="mb-3">The Import/Export feature is now fully functional again.</p>
                                                <p class="mb-3">We fixed the bug so backups and restores should now work reliably.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="feature-item">
                                <div class="relative overflow-hidden">
                                    <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-cyan-500/10 to-blue-700/5 rounded-full blur-xl">
                                    </div>
                                    <div class="flex items-start relative z-10">
                                        <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-cyan-500/20 w-10 h-10 shadow-sm">
                                            <i class="fas fa-bars text-cyan-300"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-center">
                                                <h3 class="feature-title">Swipe to Open Side Menu</h3>
                                            </div>
                                            <div class="feature-description">
                                                <p class="mb-3">You can now open the side menu by swiping in from the left edge of the screen for quicker navigation.</p>
                                                <p class="mb-3">Prefer not to use gestures? You can disable this swipe action anytime in Settings.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-blue-600/10 to-blue-800/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-blue-600/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-database text-blue-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">New High-Speed Storage</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">We've upgraded our storage engine! Your chats are now saved directly to your device's internal storage. You can now save more chats than ever before without slowing down, ensuring the app stays lightning-fast.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-amber-500/10 to-orange-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-amber-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-pen-to-square text-amber-300"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Rename Saved Chat Titles</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">You can now rename the title of any saved chat in Chat History. Just tap the icon to the right of the title, enter a new name, and save it.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-purple-500/10 to-pink-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-purple-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-text-height text-purple-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Font Customization</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">You can now change the font and font size used in the chat bubbles via the message history. Customize your chatting experience to match your preferences for better readability and comfort.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-green-500/10 to-teal-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-green-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-cloud text-green-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">OpenRouter (Cloud AI)</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">You can now connect to cloud models via OpenRouter using your own API key. This disables the local server connection and lets you use cloud-hosted models.</p>
                                        <p class="mb-3">To configure, click "Configure OpenRouter" and enter your API key in Settings. Your key is stored locally on your device only.</p>
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-blue-500/10 to-purple-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-blue-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-bolt text-blue-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Smart Reply</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">Experience faster conversations with AI-powered smart replies. After each AI response, you'll see 3 contextually relevant suggestions that you can click to instantly continue the conversation.</p>
                                        <p class="mb-3">Simply tap a suggestion to automatically send it - no typing required. Perfect for quick follow-ups and keeping conversations flowing naturally.</p>
                                        <p class="mb-3">Enable or disable this feature in Settings under "Enable Smart Reply". Suggestions are tailored to your conversation context for maximum relevance.</p>
                                        <p class="text-yellow-300/90 text-xs italic border-l-2 border-yellow-500/50 pl-2 py-1 bg-yellow-500/5 rounded-r"><strong>Note:</strong> Smart Reply is currently in <span class="font-semibold">BETA</span>. The quality of suggestions will vary depending on which AI model you're using. Some models may provide more relevant responses than others.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-indigo-500/10 to-sky-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-indigo-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-tag text-indigo-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Model Name in AI Responses</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">You can now add the name of the LLM model to the bottom of AI chat response bubbles. This will be enabled by default but can be disabled at any time in the settings menu.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative">
                <!-- Decorative divider with glow effect -->
                <div
                    class="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent">
                </div>
                <div
                    class="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent blur-sm">
                </div>

                <!-- Footer content -->
                <div
                    class="flex justify-end items-center pt-3 pb-2 mt-auto bg-gradient-to-b from-[#0a192f]/95 to-[#0c1e36]/95 sticky bottom-0 px-2">
                    <button id="got-it-whats-new"
                        class="relative overflow-hidden text-white rounded-lg focus:outline-none text-sm px-4 py-2"
                        style="background: linear-gradient(135deg, #1e40af, #3b82f6); box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15); border: none; font-weight: 600; letter-spacing: 0.02em; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);"
                        onmouseover="this.style.boxShadow='0 6px 12px -1px rgba(37, 99, 235, 0.3), 0 4px 8px -1px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'; this.style.background='linear-gradient(135deg, #2563eb, #60a5fa)';"
                        onmouseout="this.style.boxShadow='0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.15)'; this.style.background='linear-gradient(135deg, #1e40af, #3b82f6)';">
                        <span class="relative z-10 flex items-center">
                            <i class="fas fa-check-circle mr-2"></i>
                            <span>Got it!</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
`;
