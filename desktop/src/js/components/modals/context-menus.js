export const contextMenus = `
    <!-- Context menu for LLM-generated text -->
    <div id="context-menu" class="hidden fixed bg-darkSecondary border border-gray-600 rounded-lg shadow-lg z-50">
        <button id="copy-text" class="w-full text-left px-4 py-2 hover:bg-darkTertiary focus:outline-none">
            <i class="fas fa-copy mr-2"></i>Copy
        </button>
        <button id="regenerate-text" class="w-full text-left px-4 py-2 hover:bg-darkTertiary focus:outline-none">
            <i class="fas fa-redo mr-2"></i>Regenerate
        </button>
    </div>

    <!-- Context menu for Send button -->
    <div id="send-context-menu" class="hidden fixed bg-darkSecondary border border-gray-600 rounded-lg shadow-lg z-50">
        <div class="menu-header text-xs">Quick Actions</div>
        <button id="new-topic-menu-button" class="w-full text-left focus:outline-none flex items-center">
            <div class="icon-container text-white p-1.5 rounded-full flex items-center justify-center">
                <i class="fas fa-plus-circle text-sm"></i>
            </div>
            <span class="font-medium ml-3">New Topic</span>
        </button>
        <button id="scroll-to-bottom-menu-button" class="w-full text-left focus:outline-none flex items-center">
            <div class="icon-container text-white p-1.5 rounded-full flex items-center justify-center">
                <i class="fas fa-arrow-down text-sm"></i>
            </div>
            <span class="font-medium ml-3">Scroll to Bottom</span>
        </button>
    </div>
`;
