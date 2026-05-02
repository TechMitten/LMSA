export const contactModal = `
    <!-- Contact Support Modal -->
    <div id="contact-form-modal"
        class="fixed inset-0 bg-black/70 dark:bg-black/70 light:bg-gray-900/50 backdrop-blur-sm items-center justify-center hidden modal-container"
        aria-labelledby="contact-form-title" role="dialog" aria-modal="true">
        <div class="bg-gradient-to-b from-[#0a192f] to-[#0d1f3d] dark:from-[#0a192f] dark:to-[#0d1f3d] light:from-[#f8fafc] light:to-[#f1f5f9] p-6 rounded-xl w-full max-w-lg mx-auto max-h-[90vh] shadow-2xl overflow-y-auto modal-content"
            style="-webkit-overflow-scrolling: touch; touch-action: auto; overscroll-behavior: contain;">
            <div class="flex justify-between items-center mb-6 border-b border-gray-700/60 dark:border-gray-700/60 light:border-gray-200 pb-4 sticky top-0 z-10"
                style="background: var(--modal-bg);">
                <h2 id="contact-form-title"
                    class="text-2xl font-bold flex items-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                    <div
                        class="mr-3 p-2 bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-500/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-envelope text-blue-400"></i>
                    </div>
                    Contact Support
                </h2>
                <button id="close-contact-form"
                    class="text-gray-400 dark:hover:text-white light:hover:text-gray-800 focus:outline-none dark:hover:bg-gray-700/50 light:hover:bg-gray-200/50 rounded-full w-9 h-9 flex items-center justify-center group">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Email Support Content -->
            <div
                class="contact-support-container bg-darkBg-30 dark:bg-darkBg-30 light:bg-gray-100/70 p-6 rounded-lg shadow-inner border border-white/5 dark:border-white/5 light:border-gray-200">
                <div class="text-center mb-6">
                    <div
                        class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-full mb-4">
                        <i class="fas fa-headset text-2xl text-blue-400"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-200 dark:text-gray-200 light:text-gray-800 mb-2">Get
                        Technical Support</h3>
                    <p class="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 leading-relaxed">
                        Click the button below to open your email app with a pre-filled support request. This helps us
                        assist you more efficiently.
                    </p>
                </div>

                <!-- Email Button -->
                <div class="mb-6">
                    <button id="open-email-support" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600
                        text-white font-medium py-4 px-6 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                        shadow-lg hover:shadow-blue-500/20 relative overflow-hidden group">
                        <span class="relative z-10 flex items-center justify-center">
                            <i class="fas fa-external-link-alt mr-3"></i>
                            <span class="text-lg">Open Email App</span>
                        </span>
                        <div
                            class="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 opacity-0 group-hover:opacity-50">
                        </div>
                    </button>
                </div>

                <!-- Support Info -->
                <div class="bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <i class="fas fa-info-circle text-blue-400 mt-0.5"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="text-sm font-medium text-blue-300 mb-2">What happens next?</h4>
                            <ul class="text-xs text-gray-300 dark:text-gray-300 light:text-gray-600 space-y-1">
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-400 mr-2 mt-0.5 text-xs"></i>
                                    <span>Your default email app will open</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-400 mr-2 mt-0.5 text-xs"></i>
                                    <span>Subject and recipient will be pre-filled</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-400 mr-2 mt-0.5 text-xs"></i>
                                    <span>Template with helpful questions included</span>
                                </li>
                                <li class="flex items-start">
                                    <i class="fas fa-check text-green-400 mr-2 mt-0.5 text-xs"></i>
                                    <span>Our team typically responds within 24-48 hours</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Alternative Contact Info -->
            <div class="mt-6 text-center">
                <p class="text-xs text-gray-400 dark:text-gray-400 light:text-gray-600 mb-2">
                    Email app not working? You can manually email us at:
                </p>
                <a href="mailto:support@lmsa.app"
                    class="text-blue-400 hover:text-blue-300 text-sm font-medium underline decoration-dotted underline-offset-2">
                    support@lmsa.app
                </a>
            </div>
        </div>
    </div>
`;
