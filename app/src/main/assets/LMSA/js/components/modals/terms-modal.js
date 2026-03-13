export const termsModal = `
    <!-- Terms of Service Acceptance Modal -->
    <div id="terms-modal" class="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border-0">
            <!-- Modal Header -->
            <div class="p-6 pb-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Terms of Service</h2>
                    <p class="text-sm text-gray-500 dark:text-slate-400 mt-2">Please accept to continue using LMSA</p>
                </div>
                <p class="text-xs text-gray-400 dark:text-slate-500 mt-4 font-medium">Effective Date: November 7, 2025</p>
            </div>

            <!-- Terms Content -->
            <div id="terms-content" class="px-6 pb-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                <p class="text-base font-medium text-gray-900 dark:text-white mb-3">
                    By using LMSA, you agree to these Terms of Service.
                </p>

                <p class="text-gray-600 dark:text-slate-400 mb-4">
                    We recommend reviewing the complete terms below. You can access the full document anytime.
                </p>

                <div class="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-800/30 border border-gray-200 dark:border-slate-700/50">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i class="fas fa-globe text-orange-600 dark:text-orange-400 text-sm"></i>
                        </div>
                        <div class="flex-1">
                            <p class="text-xs text-gray-600 dark:text-slate-400 mb-2 font-semibold">
                                Full Terms Available Online
                            </p>
                            <p class="text-sm text-gray-700 dark:text-slate-300 mb-3">
                                Review our complete Terms of Service document for detailed information.
                            </p>
                            <a href="https://lmsa.app/terms-of-service" target="_blank"
                                class="inline-flex items-center text-sm px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg">
                                <i class="fas fa-external-link-alt mr-2 text-xs"></i>
                                View Full Terms
                            </a>
                        </div>
                    </div>
                </div>

                <p class="text-xs text-gray-500 dark:text-slate-500 mt-4 leading-relaxed">
                    <strong>Note:</strong> Acceptance is required to use LMSA. If you disagree with any terms, please discontinue use.
                </p>
            </div>

            <!-- Modal Footer - Acceptance Mode -->
            <div id="terms-acceptance-footer" class="p-6 pt-2">
                <button id="accept-terms-btn"
                    class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 active:scale-[0.98]">
                    <i class="fas fa-check-circle mr-2"></i>
                    I Accept the Terms of Service
                </button>
                <p class="text-xs text-gray-500 dark:text-slate-400 text-center mt-3">
                    By accepting, you agree to be bound by these terms
                </p>
            </div>

            <!-- Modal Footer - Review Mode -->
            <div id="terms-review-footer" class="p-6 pt-2 hidden">
                <div id="review-scroll-indicator" class="text-sm text-gray-600 dark:text-slate-400 text-center mb-3 hidden">
                    <i class="fas fa-arrow-down mr-1"></i>
                    Please scroll to review all terms
                </div>
                <button id="close-terms-btn"
                    class="w-full bg-gray-900 dark:bg-slate-700 hover:bg-gray-800 dark:hover:bg-slate-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-slate-900 dark:focus:ring-slate-500">
                    <i class="fas fa-times mr-2"></i>
                    Close
                </button>
                <p class="text-xs text-gray-500 dark:text-slate-400 text-center mt-3">
                    You've already accepted these terms
                </p>
            </div>
        </div>
    </div>
`;
