export const aboutModal = `
    <!-- About modal -->
    <div id="about-modal"
        class="fixed inset-0 bg-black/80 backdrop-blur-md items-center justify-center hidden modal-container z-50 transition-all duration-300"
        aria-labelledby="about-title" role="dialog" aria-modal="true">
        <div class="bg-[#0f172a] rounded-3xl w-[420px] max-w-[95%] shadow-[0_0_80px_-20px_rgba(59,130,246,0.4)] modal-content border border-white/10 overflow-hidden transform scale-95 transition-all duration-300"
            style="-webkit-overflow-scrolling: touch; touch-action: auto; overscroll-behavior: contain;">
            
            <!-- Top Gradient Accent -->
            <div class="h-1.5 w-full bg-linear-to-r from-blue-600 via-indigo-500 to-teal-400"></div>

            <!-- Header with Close Button -->
            <div id="about-header" class="relative pt-10 pb-6 px-8 flex flex-col items-center">
                <button id="close-about"
                    class="absolute right-4 top-4 text-gray-500 hover:text-white transition-all hover:bg-white/5 rounded-full w-10 h-10 flex items-center justify-center group"
                    aria-label="Close modal">
                    <i class="fas fa-times text-lg group-hover:rotate-90 transition-transform"></i>
                </button>

                <!-- App Icon with Glow -->
                <div class="relative mb-6">
                    <div class="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                    <img id="about-logo" src="icon.png" alt="LMSA Icon" class="relative w-16 h-16 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform transition-transform hover:scale-105 duration-500">
                </div>

                <h2 id="about-title"
                    class="text-4xl font-black text-center text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-300 tracking-tight mb-2">
                    LMSA
                </h2>
                
                <div class="version-badge flex items-center gap-3 mb-6 cursor-pointer">
                    <div class="bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full shadow-sm">
                        <span class="text-xs font-bold text-blue-400 tracking-wider">v10.18</span>
                    </div>
                    <div class="bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                        <span class="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Build 328</span>
                    </div>
                </div>

                <!-- Privacy & Cookie Settings -->
                <button id="privacy-options-btn" class="flex items-center justify-center px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-sm font-semibold transition-all duration-300 hidden border border-white/10 shadow-xl group">
                    <i class="fas fa-shield-alt mr-3 text-blue-400 group-hover:scale-110 transition-transform"></i> 
                    Privacy & Cookie Settings
                </button>
            </div>

            <!-- Main Content Area -->
            <div class="px-8 pb-10 flex flex-col items-center">
                <div class="w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent mb-8"></div>

                <!-- Links Grid -->
                <div class="grid grid-cols-2 gap-4 w-full mb-8">
                    <button id="terms-service-btn" class="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-sm font-medium text-gray-300 hover:text-white">
                        <i class="fas fa-file-contract text-blue-400/60"></i> Terms
                    </button>
                    <button id="privacy-policy-btn" class="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-sm font-medium text-gray-300 hover:text-white">
                        <i class="fas fa-user-shield text-blue-400/60"></i> Privacy
                    </button>
                </div>

                <!-- Help Box -->
                <div class="w-full bg-linear-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl p-5 border border-blue-500/20 mb-8 flex flex-col items-center text-center group transition-all hover:border-blue-500/40">
                    <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mb-3">
                        <i class="fas fa-life-ring text-blue-400"></i>
                    </div>
                    <p class="text-sm text-gray-300 mb-1">Encountering an issue?</p>
                    <a href="#" id="open-help-link" class="text-blue-400 hover:text-blue-300 font-bold text-sm underline-offset-4 hover:underline">Open Help Menu</a>
                </div>

                <div class="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity duration-700">
                    <p class="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase mb-1">
                        &copy; 2026 TechMitten LLC
                    </p>
                    <p class="text-[9px] font-medium text-gray-500 uppercase tracking-widest">
                        Designed with excellence
                    </p>
                </div>
            </div>
        </div>
    </div>
`;
