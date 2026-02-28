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
                                id="whats-new-version">9.8</span></span>
                    </div>
                </h2>
                <button id="close-whats-new"
                    class="text-gray-400 hover:text-white focus:outline-none rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="features-container overflow-y-auto flex-grow px-1 py-2">
                <div class="space-y-3">
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-purple-500/10 to-pink-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-purple-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-th-large text-purple-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Templates</h3>
                                        <span
                                            class="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full font-medium">NEW</span>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">Choose from specialized AI personas like Math Tutor, Code
                                            Assistant, Fitness Coach, and more. You can now also create your own
                                            <strong>Custom Templates</strong> with personalized avatars and system
                                            prompts.</p>
                                        <p class="mb-3">Use the new <strong>AI Generator</strong> to automatically
                                            craft high-quality system prompts for your custom personas with a single
                                            tap.</p>
                                        <p>Note: Template effectiveness varies based on your LM Studio model.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-yellow-500/10 to-orange-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-yellow-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-star text-yellow-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Ollama Support & Updates</h3>
                                        <span
                                            class="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full font-medium">NEW</span>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">Fixed a bug that was causing the volume to increase every time
                                            the app was launched.</p>
                                        <p class="mb-3">Made improvements to the menu system flow for a smoother
                                            experience when switching models or setting a default model.</p>
                                        <p>Added support for Ollama - users can now connect LMSA to Ollama server
                                            running on their PC. Check the Help menu for more information on how to get
                                            started.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-indigo-500/10 to-purple-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-indigo-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-volume-up text-indigo-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">TTS Audio</h3>
                                        <span
                                            class="ml-2 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-medium">NEW</span>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">You can now tap the speaker icon in the AI response chat bubbles
                                            to hear the AI response read out loud. This text-to-speech feature makes it
                                            easier to consume AI responses while multitasking or when you prefer audio
                                            content.</p>
                                        <p>Perfect for accessibility, hands-free operation, or when you want to listen
                                            to responses while doing other tasks.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-blue-500/10 to-cyan-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-blue-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-key text-blue-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Legacy Access for Previous Purchasers</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-2">If you purchased an old version of LMSA, you can receive a free
                                            code that will grant you lifetime access to LMSA Premium, removing
                                            advertising.</p>
                                        <p class="mb-2">Please email <strong>support@lmsa.app</strong> with your order
                                            number to receive your free code.</p>
                                        <p><a href="#" id="whats-new-locate-order-number-link"
                                                class="text-blue-400 hover:text-blue-300 underline">Locate order
                                                number</a></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-emerald-500/10 to-teal-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-emerald-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-shield-alt text-emerald-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">IP/Port Verification Checklist</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">Added a verification checklist that appears when changes are
                                            detected in the IP and/or port input fields. This helpful reminder ensures
                                            you don't forget important CORS and local network setting changes that are
                                            required for LMSA to work properly with your LM Studio instance.</p>
                                        <p>The checklist guides you through the essential configuration steps, making
                                            setup more reliable and reducing connection issues.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-blue-500/10 to-indigo-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-blue-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-edit text-blue-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Improved Message Input Field</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">The message input field now automatically adjusts its height to
                                            accommodate longer messages, making it much easier to edit and review your
                                            text before sending. No more cramped single-line input that cuts off your
                                            thoughts!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="feature-item">
                        <div class="relative overflow-hidden">
                            <div
                                class="absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-gradient-to-br from-green-500/10 to-emerald-700/5 rounded-full blur-xl">
                            </div>
                            <div class="flex items-start relative z-10">
                                <div
                                    class="feature-icon-wrapper mr-3 flex items-center justify-center rounded-full bg-green-500/20 w-10 h-10 shadow-sm">
                                    <i class="fas fa-comments text-green-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <h3 class="feature-title">Enhanced Chat Bubble UI</h3>
                                    </div>
                                    <div class="feature-description">
                                        <p class="mb-3">Chat bubbles now have a cleaner, more modern look with improved
                                            spacing, typography, and visual hierarchy. The overall chat experience feels
                                            more polished and professional.</p>
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
