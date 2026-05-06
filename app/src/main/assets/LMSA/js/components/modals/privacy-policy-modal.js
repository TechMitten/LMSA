export const privacyPolicyModal = `
    <!-- Privacy Policy Modal -->
    <div id="privacy-policy-modal"
        class="fixed inset-0 bg-black bg-opacity-75 z-50 items-center justify-center p-4 hidden modal-container">
        <div class="modal-content rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
            <!-- Modal Header -->
            <div class="modal-header flex justify-between items-center">
                <h2 class="modal-title text-2xl font-bold">Privacy Policy</h2>
                <button id="privacy-policy-close-btn" class="close-btn" aria-label="Close">
                    <span class="sr-only">Close</span>
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            <!-- Privacy Policy Content -->
            <div id="privacy-policy-content" class="modal-body flex-1 overflow-y-auto text-sm leading-relaxed flex flex-col items-center justify-center text-center">
                <i class="fas fa-user-shield mb-4 text-blue-400" style="font-size: 6rem;"></i>

                <p class="mb-6 text-base font-medium text-inherit">
                    Please review our Privacy Policy at the link below.
                </p>

                <a id="privacy-policy-link" href="https://lmsa.app/privacy-policy" target="_blank" rel="noopener" data-external-link-button="true"
                    class="mb-8 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
                    <i class="fas fa-external-link-alt mr-2"></i>
                    View Privacy Policy
                </a>
            </div>
        </div>
    </div>
`;
