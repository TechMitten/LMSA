export const termsModal = `
    <!-- Terms of Service Acceptance Modal -->
    <div id="terms-modal" class="fixed inset-0 bg-black bg-opacity-75 z-50 items-center justify-center p-4 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <!-- Modal Header -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Terms of Service</h2>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Effective Date: 11/7/2025</p>
            </div>

            <!-- Terms Content -->
            <div id="terms-content"
                class="flex-1 overflow-y-auto p-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex flex-col items-center justify-center text-center">

                <i class="fas fa-file-contract text-blue-500 mb-4" style="font-size: 6rem;"></i>

                <p class="mb-6 text-base">
                    By using this application, you agree to our Terms of Service. Please review the full terms at the
                    link below before continuing.
                </p>

                <a href="https://lmsa.app/terms-of-service.html" target="_blank"
                    class="mb-8 inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                    <i class="fas fa-external-link-alt mr-2"></i>
                    View Terms of Service
                </a>

                <p class="text-xs text-gray-500 dark:text-gray-400">
                    You must accept the terms to use LMSA.
                </p>
            </div>

            <!-- Modal Footer - Acceptance Mode -->
            <div id="terms-acceptance-footer"
                class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button id="accept-terms-btn"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <i class="fas fa-check mr-2"></i>
                    I Agree to Terms of Service
                </button>
            </div>

            <!-- Modal Footer - Review Mode -->
            <div id="terms-review-footer"
                class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hidden">
                <div id="review-scroll-indicator"
                    class="text-sm text-blue-600 dark:text-blue-400 mb-3 text-center hidden">
                    <i class="fas fa-arrow-down mr-1"></i>
                    Please scroll to the bottom to review all terms
                </div>
                <button id="close-terms-btn"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                    <i class="fas fa-times mr-2"></i>
                    Close
                </button>
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                    You have already accepted these terms. This is for review purposes only.
                </p>
            </div>
        </div>
    </div>
`;
