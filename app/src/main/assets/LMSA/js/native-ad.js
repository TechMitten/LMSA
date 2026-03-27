// Native Ad integration
document.addEventListener('DOMContentLoaded', () => {
    const placeholder = document.getElementById('native-ad-placeholder');
    const divider = document.getElementById('native-ad-divider');
    if (!placeholder) return;

    let resizeObserver = null;
    let isNativeAdVisible = false;

    function updateAdPosition() {
        if (!placeholder) return;

        // Check for premium status using our global check if available
        if (window.shouldShowAds && !window.shouldShowAds()) {
            if (placeholder) placeholder.style.display = 'none';
            if (divider) divider.style.display = 'none';
            if (isNativeAdVisible && window.AndroidBilling && typeof window.AndroidBilling.hideNativeAd === 'function') {
                window.AndroidBilling.hideNativeAd();
                isNativeAdVisible = false;
            }
            return;
        }

        // Check for overlays that should hide the ad
        const sidebar = document.getElementById('sidebar');
        // The sidebar doesn't have 'hidden' class during opening/closing transitions
        const isSidebarVisible = sidebar && !sidebar.classList.contains('hidden');
        
        const settingsModal = document.getElementById('settings-modal');
        const isSettingsOpen = settingsModal && !settingsModal.classList.contains('hidden');
        
        const modelModal = document.getElementById('model-modal');
        const isModelOpen = modelModal && !modelModal.classList.contains('hidden');
        
        const hasOtherModal = !!document.querySelector('.fixed.inset-0:not(.hidden):not(#sidebar-overlay):not(#welcome-message)');

        // Check if welcome message itself is visible
        const welcomeMessage = document.getElementById('welcome-message');
        const isWelcomeVisible = welcomeMessage && window.getComputedStyle(welcomeMessage).display !== 'none';

        // Check if an ancestor is hidden (other than welcome message)
        let isAncestorHidden = !isWelcomeVisible;
        let parent = placeholder.parentElement;
        while (parent && parent !== document.body && parent !== welcomeMessage) {
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.display === 'none') {
                isAncestorHidden = true;
                break;
            }
            parent = parent.parentElement;
        }

        const shouldBeVisible = !isAncestorHidden && !isSidebarVisible && !isSettingsOpen && !isModelOpen && !hasOtherModal;

        if (shouldBeVisible) {
            // Show placeholder and divider to ensure they take space and are detectable by getBoundingClientRect
            placeholder.style.display = 'block';
            placeholder.style.visibility = 'visible';
            if (divider) {
                divider.style.display = 'block';
                divider.style.visibility = 'visible';
            }

            const rect = placeholder.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            if (window.AndroidBilling && typeof window.AndroidBilling.updateNativeAdPosition === 'function') {
                window.AndroidBilling.updateNativeAdPosition(
                    Math.round(rect.left * dpr),
                    Math.round(rect.top * dpr),
                    Math.round(rect.width * dpr),
                    Math.round(rect.height * dpr)
                );
                isNativeAdVisible = true;
            }
        } else {
            // Hide the ad container
            if (isNativeAdVisible && window.AndroidBilling && typeof window.AndroidBilling.hideNativeAd === 'function') {
                window.AndroidBilling.hideNativeAd();
                isNativeAdVisible = false;
            }
            
            // For dividers and placeholder, we might want to hide them if sidebar is open
            if (isSidebarVisible || isSettingsOpen || isModelOpen || hasOtherModal) {
                placeholder.style.visibility = 'hidden';
                if (divider) divider.style.visibility = 'hidden';
            } else if (isAncestorHidden) {
                placeholder.style.display = 'none';
                if (divider) divider.style.display = 'none';
            }
        }
    }

    // Use ResizeObserver for high performance updates
    if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(updateAdPosition);
        });
        resizeObserver.observe(placeholder);

        // Also observe the welcome message container
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
            resizeObserver.observe(welcomeMessage);
        }
    }

    // Fallback and supplemental triggers
    window.addEventListener('resize', updateAdPosition);
    window.addEventListener('scroll', updateAdPosition, true);

    // MutationObserver to catch class/style changes
    const observer = new MutationObserver((mutations) => {
        requestAnimationFrame(updateAdPosition);
    });

    // Observe body for any added/hidden modals
    observer.observe(document.body, {
        attributes: true,
        subtree: true,
        attributeFilter: ['class', 'style', 'hidden']
    });

    // Initial check
    setTimeout(updateAdPosition, 500);
});
