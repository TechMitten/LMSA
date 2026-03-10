export const termsModal = `
    <!-- Terms of Service Acceptance Modal -->
    <div id="terms-modal" class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col shadow-xl border border-gray-200 dark:border-slate-700">
            <!-- Modal Header -->
            <div class="p-8 border-b border-gray-100 dark:border-slate-700/50 bg-gradient-to-r from-gray-50 dark:from-slate-800/50 to-gray-50/50 dark:to-slate-900/50">
                <div class="flex items-start justify-between">
                    <div>
                        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Terms of Service</h2>
                        <p class="text-sm text-gray-500 dark:text-slate-400 mt-2">Please review and accept our terms before using LMSA</p>
                    </div>
                    <div class="ml-4">
                        <div class="w-12 h-12 rounded-lg bg-gray-200 dark:bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-file-lines text-gray-600 dark:text-slate-300 text-lg"></i>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-400 mt-3 font-medium tracking-wide">Effective Date: 11/7/2025</p>
            </div>

            <!-- Terms Content -->
            <div id="terms-content"
                class="flex-1 overflow-y-auto p-8 text-sm text-gray-700 dark:text-slate-300 leading-relaxed space-y-4">
                <p class="text-base font-medium text-gray-900 dark:text-gray-50">
                    By using this application, you agree to be bound by these Terms of Service.
                </p>

                <p class="text-gray-600 dark:text-slate-400">
                    We recommend that you review the complete and detailed terms before accepting. You can access the full Terms of Service document using the button below.
                </p>

                <div class="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-700/50">
                    <p class="text-xs text-gray-600 dark:text-slate-400 mb-3">
                        <i class="fas fa-circle-info mr-2 text-gray-500 dark:text-slate-500"></i>
                        <span class="font-medium">Full Documentation</span>
                    </p>
                    <p class="text-sm text-gray-700 dark:text-slate-300 mb-3">
                        Access the complete Terms of Service document on our website for a thorough review of all terms and conditions.
                    </p>
                    <a href="https://lmsa.app/terms-of-service.html" target="_blank"
                        class="inline-flex items-center text-sm px-4 py-2 rounded-md bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors duration-200">
                        <i class="fas fa-external-link-alt mr-2 text-xs"></i>
                        View Full Terms
                    </a>
                </div>

                <div class="text-xs text-gray-500 dark:text-slate-500 pt-2">
                    <strong>Note:</strong> You must accept these terms to continue using LMSA. If you do not agree with any part of these terms, you may not use the application.
                </div>
            </div>

            <!-- Modal Footer - Acceptance Mode -->
            <div id="terms-acceptance-footer"
                class="p-8 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30 space-y-3">
                <button id="accept-terms-btn"
                    class="w-full bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 dark:focus:ring-blue-400 active:scale-[0.98]">
                    <i class="fas fa-check mr-2"></i>
                    I Accept Terms of Service
                </button>
                <p class="text-xs text-gray-500 dark:text-slate-400 text-center">
                    By clicking accept, you agree to be bound by these terms.
                </p>
            </div>

            <!-- Modal Footer - Review Mode -->
            <div id="terms-review-footer"
                class="p-8 border-t border-gray-100 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30 space-y-3 hidden">
                <div id="review-scroll-indicator"
                    class="text-sm text-gray-600 dark:text-slate-400 text-center hidden">
                    <i class="fas fa-arrow-down mr-1"></i>
                    Please scroll to the bottom to review all terms
                </div>
                <button id="close-terms-btn"
                    class="w-full bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-slate-900 dark:focus:ring-slate-500">
                    <i class="fas fa-times mr-2"></i>
                    Close
                </button>
                <p class="text-xs text-gray-500 dark:text-slate-400 text-center">
                    You have already accepted these terms. This view is for reference only.
                </p>
            </div>
        </div>
    </div>
`;
