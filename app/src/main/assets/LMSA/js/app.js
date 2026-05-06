// Main application entry point
// This file has been refactored into a modular structure
// All functionality is now imported from the js/ directory


// Import age verification system first (must be loaded before anything else)


// Import terms acceptance system (loads after age verification)
import { initializeTermsAcceptance, hasAcceptedCurrentTerms } from './terms-acceptance.js';

// Import the main module which initializes everything
import './main.js';

function getExternalTargetBlankLink(event) {
    if (!(event.target instanceof Element)) {
        return null;
    }

    const link = event.target.closest('a[target="_blank"]');
    if (!(link instanceof HTMLAnchorElement)) {
        return null;
    }

    const href = link.getAttribute('href');
    if (!href || !/^https?:\/\//i.test(href)) {
        return null;
    }

    return link;
}

function openExternalTargetBlankLink(link, event) {
    const href = link.getAttribute('href');
    if (!href) {
        return false;
    }

    event.preventDefault();

    if (typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    if (typeof window.openExternalUrl === 'function') {
        window.openExternalUrl(href);
    } else {
        window.open(href, '_blank', 'noopener');
    }

    return true;
}

function bindDirectExternalLink(link) {
    if (!(link instanceof HTMLAnchorElement) || link.dataset.externalLinkBound === 'true') {
        return;
    }

    let lastTouchOpenAt = 0;

    link.addEventListener('touchend', (event) => {
        lastTouchOpenAt = Date.now();
        openExternalTargetBlankLink(link, event);
    }, { passive: false });

    link.addEventListener('click', (event) => {
        if (Date.now() - lastTouchOpenAt < 750) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        openExternalTargetBlankLink(link, event);
    });

    link.dataset.externalLinkBound = 'true';
}

// Add event listeners for the sidebar overlay
document.addEventListener('DOMContentLoaded', function () {
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        // Click event for desktop
        sidebarOverlay.addEventListener('click', function () {
            // Import the toggleSidebar function dynamically
            import('./ui-manager.js').then(module => {
                module.toggleSidebar();
            });
        });

        // Touch event for tablets and mobile
        sidebarOverlay.addEventListener('touchend', function (e) {
            e.preventDefault(); // Prevent any default behavior
            // Import the toggleSidebar function dynamically
            import('./ui-manager.js').then(module => {
                module.toggleSidebar();
            });
        }, { passive: false });
    }

    document.querySelectorAll('a[data-external-link-button="true"]').forEach((link) => {
        bindDirectExternalLink(link);
    });

    document.addEventListener('touchend', function (event) {
        const externalLink = getExternalTargetBlankLink(event);
        if (!externalLink || externalLink.dataset.externalLinkBound === 'true') {
            return;
        }

        openExternalTargetBlankLink(externalLink, event);
    }, { passive: false });

    document.addEventListener('click', function (event) {
        const externalLink = getExternalTargetBlankLink(event);
        if (!externalLink || externalLink.dataset.externalLinkBound === 'true') {
            return;
        }

        openExternalTargetBlankLink(externalLink, event);
    });
});
