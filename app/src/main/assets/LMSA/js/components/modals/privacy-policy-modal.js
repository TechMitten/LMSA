export const privacyPolicyModal = `
    <!-- Privacy Policy Modal -->
    <div id="privacy-policy-modal"
        class="fixed inset-0 bg-black bg-opacity-75 z-50 items-center justify-center p-4 hidden">
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <!-- Modal Header -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Privacy Policy</h2>
                <button id="privacy-policy-close-btn"
                    class="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-1 transition-colors">
                    <span class="sr-only">Close</span>
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <!-- Privacy Policy Content -->
            <div id="privacy-policy-content"
                class="flex-1 overflow-y-auto p-6 text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex flex-col items-center justify-center text-center">
                <i class="fas fa-user-shield mb-4" style="font-size: 6rem; color: #3b82f6;"></i>

                <p class="mb-6 text-base font-medium">
                    Please review our Privacy Policy at the link below.
                </p>

                <a href="https://lmsa.app/privacy-policy.html" target="_blank"
                    class="mb-8 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
                    <i class="fas fa-external-link-alt mr-2"></i>
                    View Privacy Policy
                </a>
            </div>
        </div>
    </div>
`;
