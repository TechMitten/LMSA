const SIDEBAR_LAYOUT_STORAGE_KEY = 'sidebarMenuLayoutV1';
const SIDEBAR_LAYOUT_VERSION = 2;

const SIDEBAR_SECTIONS = {
    main: {
        key: 'main',
        label: 'Main Menu',
        description: 'These controls stay above chat history in the main sidebar area.',
        itemIds: ['new-chat', 'templates-btn', 'web-search-header-button', 'model-btn', 'settings-btn']
    },
    options: {
        key: 'options',
        label: 'Options Menu',
        description: 'These controls appear directly inside the Options section.',
        itemIds: ['system-prompt-settings-btn', 'help-btn', 'whats-new-btn', 'about-btn']
    },
    importExport: {
        key: 'importExport',
        label: 'Import/Export',
        description: 'These controls appear inside the Import/Export group.',
        itemIds: ['import-system-prompt-lms-btn', 'export-system-prompt-lms-btn', 'import-chats-btn', 'export-chats-btn']
    },
    premiumFree: {
        key: 'premiumFree',
        label: 'Premium Menu (Free)',
        description: 'These actions appear when premium is not active.',
        itemIds: ['remove-ads-button', 'restore-purchases-button', 'legacy-access-btn']
    },
    premiumActive: {
        key: 'premiumActive',
        label: 'Premium Menu (Active)',
        description: 'These actions appear when premium is active.',
        itemIds: ['premium-activated-button']
    }
};

const SIDEBAR_ITEMS = {
    'new-chat': {
        id: 'new-chat',
        section: 'main',
        label: 'New Chat',
        description: 'Create a new chat thread.',
        pinned: false
    },
    'templates-btn': {
        id: 'templates-btn',
        section: 'main',
        label: 'Templates',
        description: 'Open the templates browser.',
        pinned: false
    },
    'web-search-header-button': {
        id: 'web-search-header-button',
        section: 'main',
        label: 'Web Search',
        description: 'Show or hide the sidebar Web Search toggle.',
        pinned: false
    },
    'model-btn': {
        id: 'model-btn',
        section: 'main',
        label: 'Models',
        description: 'Open model selection.',
        pinned: false
    },
    'settings-btn': {
        id: 'settings-btn',
        section: 'main',
        label: 'Settings',
        description: 'Always visible so the sidebar editor stays reachable.',
        pinned: true
    },
    'system-prompt-settings-btn': {
        id: 'system-prompt-settings-btn',
        section: 'options',
        label: 'System Prompt',
        description: 'Jump to system prompt settings.',
        pinned: false
    },
    'help-btn': {
        id: 'help-btn',
        section: 'options',
        label: 'Help',
        description: 'Open the help modal.',
        pinned: false
    },
    'whats-new-btn': {
        id: 'whats-new-btn',
        section: 'options',
        label: "What's New",
        description: 'Open the release notes modal.',
        pinned: false
    },
    'about-btn': {
        id: 'about-btn',
        section: 'options',
        label: 'About',
        description: 'Open the about modal.',
        pinned: false
    },
    'import-system-prompt-lms-btn': {
        id: 'import-system-prompt-lms-btn',
        section: 'importExport',
        label: 'Import System Prompt (LMS)',
        description: 'Import an LMS saved prompt file.',
        pinned: false
    },
    'export-system-prompt-lms-btn': {
        id: 'export-system-prompt-lms-btn',
        section: 'importExport',
        label: 'Export Saved Prompt (LMS)',
        description: 'Export the current saved prompt collection.',
        pinned: false
    },
    'import-chats-btn': {
        id: 'import-chats-btn',
        section: 'importExport',
        label: 'Import Chats',
        description: 'Import saved chat history.',
        pinned: false
    },
    'export-chats-btn': {
        id: 'export-chats-btn',
        section: 'importExport',
        label: 'Export Chats',
        description: 'Export your saved chats.',
        pinned: false
    },
    'remove-ads-button': {
        id: 'remove-ads-button',
        section: 'premiumFree',
        label: 'Unlock Premium',
        description: 'Open the premium purchase flow.',
        pinned: false,
        premiumState: 'free'
    },
    'restore-purchases-button': {
        id: 'restore-purchases-button',
        section: 'premiumFree',
        label: 'Restore Purchase',
        description: 'Restore premium entitlement from Google Play.',
        pinned: false,
        premiumState: 'free'
    },
    'legacy-access-btn': {
        id: 'legacy-access-btn',
        section: 'premiumFree',
        label: 'Legacy Access',
        description: 'Unlock legacy premium access.',
        pinned: false,
        premiumState: 'free'
    },
    'premium-activated-button': {
        id: 'premium-activated-button',
        section: 'premiumActive',
        label: 'Premium Activated',
        description: 'Open premium status details.',
        pinned: false,
        premiumState: 'premium'
    }
};

let hasInitializedSidebarLayoutListeners = false;

function getDefaultSidebarLayout() {
    const sections = {};

    Object.values(SIDEBAR_SECTIONS).forEach((section) => {
        sections[section.key] = {
            order: [...section.itemIds],
            visibility: Object.fromEntries(
                section.itemIds.map((itemId) => [itemId, true])
            )
        };
    });

    sections.main.visibility['settings-btn'] = true;

    return {
        version: SIDEBAR_LAYOUT_VERSION,
        sections
    };
}

function cloneLayout(layout) {
    return JSON.parse(JSON.stringify(layout));
}

function normalizeSectionLayout(sectionKey, sectionLayout, defaultLayout) {
    const section = SIDEBAR_SECTIONS[sectionKey];
    const defaultSection = defaultLayout.sections[sectionKey];
    const incomingOrder = Array.isArray(sectionLayout?.order) ? sectionLayout.order : [];
    const normalizedOrder = [];

    incomingOrder.forEach((itemId) => {
        if (section.itemIds.includes(itemId) && !normalizedOrder.includes(itemId)) {
            normalizedOrder.push(itemId);
        }
    });

    section.itemIds.forEach((itemId) => {
        if (!normalizedOrder.includes(itemId)) {
            normalizedOrder.push(itemId);
        }
    });

    const visibility = {};
    section.itemIds.forEach((itemId) => {
        const item = SIDEBAR_ITEMS[itemId];
        if (item.pinned) {
            visibility[itemId] = true;
            return;
        }

        const rawValue = sectionLayout?.visibility?.[itemId];
        visibility[itemId] = typeof rawValue === 'boolean'
            ? rawValue
            : defaultSection.visibility[itemId];
    });

    return {
        order: normalizedOrder,
        visibility
    };
}

function normalizeSidebarLayout(layout) {
    const defaultLayout = getDefaultSidebarLayout();
    const normalized = cloneLayout(defaultLayout);

    if (!layout || typeof layout !== 'object') {
        return normalized;
    }

    Object.keys(SIDEBAR_SECTIONS).forEach((sectionKey) => {
        normalized.sections[sectionKey] = normalizeSectionLayout(sectionKey, layout.sections?.[sectionKey], defaultLayout);
    });

    normalized.version = SIDEBAR_LAYOUT_VERSION;
    return normalized;
}

function readStoredSidebarLayout() {
    try {
        const rawValue = localStorage.getItem(SIDEBAR_LAYOUT_STORAGE_KEY);
        if (!rawValue) {
            return getDefaultSidebarLayout();
        }

        const parsedValue = JSON.parse(rawValue);
        return normalizeSidebarLayout(parsedValue);
    } catch (error) {
        console.warn('Failed to read sidebar layout preferences:', error);
        return getDefaultSidebarLayout();
    }
}

function writeStoredSidebarLayout(layout) {
    const normalizedLayout = normalizeSidebarLayout(layout);
    localStorage.setItem(SIDEBAR_LAYOUT_STORAGE_KEY, JSON.stringify(normalizedLayout));
    return normalizedLayout;
}

function getSidebarSectionParent(sectionKey) {
    switch (sectionKey) {
        case 'main':
            return document.getElementById('new-chat')?.parentElement || null;
        case 'options':
            return document.getElementById('options-container');
        case 'importExport':
            return document.getElementById('import-export-container');
        case 'premiumFree':
            return document.querySelector('#premium-container .premium-free-actions');
        case 'premiumActive':
            return document.querySelector('#premium-container .premium-active-actions');
        default:
            return null;
    }
}

function getPremiumContainerState() {
    const premiumContainer = document.getElementById('premium-container');
    const state = premiumContainer?.dataset?.premiumState;
    return state === 'premium' ? 'premium' : 'free';
}

function isItemAllowedByCurrentState(itemId) {
    const item = SIDEBAR_ITEMS[itemId];
    if (!item?.premiumState) {
        return true;
    }

    return item.premiumState === getPremiumContainerState();
}

function setElementVisible(element, visible) {
    if (!(element instanceof HTMLElement)) {
        return;
    }

    element.classList.toggle('hidden', !visible);
    element.setAttribute('aria-hidden', visible ? 'false' : 'true');

    if (!visible) {
        element.classList.remove('animate-fade-in', 'active');
        element.style.maxHeight = '';
    }
}

function collapseGroup(buttonId, containerId) {
    const button = document.getElementById(buttonId);
    const container = document.getElementById(containerId);
    const caret = button?.querySelector('.fa-caret-up, .fa-caret-down');

    if (button) {
        button.classList.remove('active');
    }

    if (caret?.classList.contains('fa-caret-up')) {
        caret.classList.remove('fa-caret-up');
        caret.classList.add('fa-caret-down');
    }

    if (container) {
        container.classList.add('hidden');
        container.classList.remove('animate-fade-in');
        container.style.maxHeight = '';
        container.setAttribute('aria-hidden', 'true');
    }
}

function bumpSidebarPaint() {
    const sidebar = document.getElementById('sidebar');
    const sidebarScrollContent = document.getElementById('sidebar-scroll-content');
    [sidebar, sidebarScrollContent].forEach((element) => {
        if (!(element instanceof HTMLElement)) {
            return;
        }

        element.classList.add('sidebar-repaint-fix');
        void element.offsetHeight;
        requestAnimationFrame(() => {
            element.classList.remove('sidebar-repaint-fix');
        });
    });
}

function dispatchSidebarLayoutUpdated(layout) {
    document.dispatchEvent(new CustomEvent('sidebar-layout-updated', {
        detail: { layout: cloneLayout(layout) }
    }));
}

function isSectionItemVisible(layout, sectionKey, itemId) {
    const section = layout.sections[sectionKey];
    if (!section || !section.visibility[itemId]) {
        return false;
    }

    return isItemAllowedByCurrentState(itemId);
}

function sectionHasVisibleItems(layout, sectionKey) {
    const section = layout.sections[sectionKey];
    if (!section) {
        return false;
    }

    return section.order.some((itemId) => isSectionItemVisible(layout, sectionKey, itemId));
}

function setDerivedGroupVisibility(layout) {
    const hasImportExportItems = sectionHasVisibleItems(layout, 'importExport');
    const hasPremiumItems = sectionHasVisibleItems(layout, 'premiumFree') || sectionHasVisibleItems(layout, 'premiumActive');
    const hasOptionsItems = sectionHasVisibleItems(layout, 'options') || hasImportExportItems || hasPremiumItems;

    setElementVisible(document.getElementById('options-btn'), hasOptionsItems);
    if (!hasOptionsItems) {
        collapseGroup('options-btn', 'options-container');
    }

    setElementVisible(document.getElementById('import-export-group-btn'), hasImportExportItems);
    if (!hasImportExportItems) {
        collapseGroup('import-export-group-btn', 'import-export-container');
    }

    setElementVisible(document.getElementById('premium-group-btn'), hasPremiumItems);
    if (!hasPremiumItems) {
        collapseGroup('premium-group-btn', 'premium-container');
    }
}

export function getSidebarLayoutSchema() {
    return {
        sections: Object.values(SIDEBAR_SECTIONS).map((section) => ({
            key: section.key,
            label: section.label,
            description: section.description,
            items: section.itemIds.map((itemId) => ({ ...SIDEBAR_ITEMS[itemId] }))
        }))
    };
}

export function getSidebarLayout() {
    return readStoredSidebarLayout();
}

export function saveSidebarLayout(layout) {
    return writeStoredSidebarLayout(layout);
}

export function resetSidebarLayout() {
    const layout = getDefaultSidebarLayout();
    writeStoredSidebarLayout(layout);
    return layout;
}

export function setSidebarItemVisibility(sectionKey, itemId, isVisible) {
    const layout = readStoredSidebarLayout();
    const section = layout.sections[sectionKey];
    const item = SIDEBAR_ITEMS[itemId];

    if (!section || !item || item.pinned) {
        return layout;
    }

    section.visibility[itemId] = !!isVisible;
    return writeStoredSidebarLayout(layout);
}

export function moveSidebarItem(sectionKey, itemId, direction) {
    const layout = readStoredSidebarLayout();
    const section = layout.sections[sectionKey];
    const item = SIDEBAR_ITEMS[itemId];

    if (!section || !item) {
        return layout;
    }

    const currentIndex = section.order.indexOf(itemId);
    if (currentIndex === -1) {
        return layout;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= section.order.length) {
        return layout;
    }

    const swapItemId = section.order[targetIndex];
    if (item.pinned || SIDEBAR_ITEMS[swapItemId]?.pinned) {
        return layout;
    }

    section.order[currentIndex] = swapItemId;
    section.order[targetIndex] = itemId;
    return writeStoredSidebarLayout(layout);
}

export function applySidebarLayout(layout = readStoredSidebarLayout()) {
    const normalizedLayout = normalizeSidebarLayout(layout);

    Object.keys(SIDEBAR_SECTIONS).forEach((sectionKey) => {
        const sectionLayout = normalizedLayout.sections[sectionKey];
        const parent = getSidebarSectionParent(sectionKey);

        if (!(parent instanceof HTMLElement)) {
            return;
        }

        sectionLayout.order.forEach((itemId) => {
            const element = document.getElementById(itemId);
            if (element && element.parentElement === parent) {
                parent.appendChild(element);
            }
        });

        sectionLayout.order.forEach((itemId) => {
            const element = document.getElementById(itemId);
            const visible = isSectionItemVisible(normalizedLayout, sectionKey, itemId);
            setElementVisible(element, visible);
        });
    });

    // Ensure Options dropdown remains at the bottom of the main menu section (above chat history section)
    const optionsBtn = document.getElementById('options-btn');
    const optionsContainer = document.getElementById('options-container');
    if (optionsBtn && optionsBtn.parentElement) {
        const parent = optionsBtn.parentElement;
        parent.appendChild(optionsBtn);
        if (optionsContainer && optionsContainer.parentElement === parent) {
            parent.appendChild(optionsContainer);
        }
    }

    setDerivedGroupVisibility(normalizedLayout);
    bumpSidebarPaint();
    dispatchSidebarLayoutUpdated(normalizedLayout);
    return normalizedLayout;
}

export function initializeSidebarLayout() {
    const layout = applySidebarLayout();

    if (!hasInitializedSidebarLayoutListeners) {
        document.addEventListener('premium-status-changed', () => {
            applySidebarLayout();
        });
        hasInitializedSidebarLayoutListeners = true;
    }

    return layout;
}