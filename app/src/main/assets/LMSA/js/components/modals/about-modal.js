export const aboutModal = `
    <!-- About modal -->
    <div id="about-modal"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm items-center justify-center hidden modal-container z-50"
        aria-labelledby="about-title" role="dialog" aria-modal="true">
        <div class="bg-gradient-to-b from-[#0a192f] to-[#0d1f3d] p-0 rounded-xl w-[420px] max-w-[90%] shadow-2xl modal-content border border-white/10 overflow-hidden"
            style="-webkit-overflow-scrolling: touch; touch-action: auto; overscroll-behavior: contain;">
            <!-- Header with app icon and title -->
            <div class="relative p-6 pb-4">
                <div class="flex items-center justify-center mb-2">
                    <img src="icon.png" alt="LMSA Icon" class="w-16 h-16 mb-1 filter drop-shadow-lg">
                </div>
                <h2 id="about-title"
                    class="text-2xl font-bold text-center flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-1">
                    LMSA
                </h2>
                <button id="close-about"
                    class="absolute right-3 top-3 text-gray-400 hover:text-white focus:outline-none hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-times"></i>
                </button>
                <div class="version-badge px-4 py-1.5 rounded-full mx-auto w-fit mt-2">
                    <p class="text-sm font-medium text-blue-300 text-center">Version 10.12</p>
                </div>
            </div>

            <!-- Main content with subtle divider -->
            <div class="p-6 pt-4">
                <div class="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-3"></div>

                <!-- Company info with subtle animation -->
                <div class="flex flex-col items-center justify-center">
                    <p class="text-center text-gray-300 flex items-center mb-3">
                        <i class="fas fa-copyright text-blue-400 mr-2 opacity-75"></i>
                        <span>2026 TechMitten LLC</span>
                    </p>

                    <!-- Help link with improved styling -->
                    <div class="border-t border-white/10 pt-3 w-full">
                        <p class="text-center text-gray-400 flex items-center justify-center">
                            <i class="fas fa-question-circle text-blue-400 mr-2"></i>
                            Need help?&nbsp;<a href="#" id="open-help-link"
                                class="text-blue-400 hover:text-blue-300 font-medium ml-1.5 underline decoration-dotted underline-offset-2">Open
                                Help Menu</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;
