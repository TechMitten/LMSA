// Sidebar touch handler for improved touch scrolling on mobile devices
import { debugError, debugLog } from './utils.js';
import { closeSidebar, updateHamburgerIcon } from './ui-manager.js';
import { getEnableSwipeSidebar } from './settings-manager.js';

/**
 * Initializes touch handlers for the sidebar to improve scrolling on mobile devices
 */
export function initializeSidebarTouchHandler() {
    const sidebar = document.getElementById('sidebar');
    const chatHistory = document.getElementById('chat-history');

    if (!sidebar || !chatHistory) {
        debugError('Sidebar or chat history elements not found');
        return;
    }

    // Variables to track touch state
    let touchStartY = 0;
    let touchStartX = 0;
    let isDragging = false;
    let isScrolling = false;
    const DRAG_THRESHOLD = 5; // Pixels of movement to consider a drag (reduced for faster detection)
    let touchedElement = null;
    let scrollStartTime = 0;
    let scrollTimeout = null;
    let swipeDeltaX = 0;
    let swipeDeltaY = 0;

    let isSidebarSwiping = false;
    let isEdgeSwipeOpening = false;
    let hasLatchedHaptic = false;
    const SIDEBAR_CLOSE_SWIPE_THRESHOLD = 0.3; // close after 30% swipe
    const SIDEBAR_OPEN_SWIPE_THRESHOLD = 0.15; // open after 15% swipe
    const EDGE_SWIPE_ZONE = 40; // left gap for opening gesture (matched to native exclusion zone)
    const SWIPE_OPEN_MIN_DISTANCE = 28; // reduced to make opening easier with exclusion limit
    const SWIPE_CLOSE_MIN_DISTANCE = 48;
    const SWIPE_CLOSE_MAX_VERTICAL_DRIFT = 120; // increased tolerance for vertical movement

    function setSidebarGestureState(state) {
        window.__sidebarGestureState = state;
        if (state === 'idle') {
            window.__sidebarGestureReleaseAt = Date.now();
        }
    }

    function isPhoneLayout() {
        return window.matchMedia('(max-width: 767px)').matches;
    }

    // Immediately apply the no-highlight class to all interactive elements
    function applyNoHighlightToAll() {
        const interactiveElements = sidebar.querySelectorAll('.menu-item, .section-header');
        interactiveElements.forEach(el => {
            el.classList.add('no-touch-highlight');
        });
    }

    // Remove the no-highlight class from all interactive elements
    function removeNoHighlightFromAll() {
        const interactiveElements = sidebar.querySelectorAll('.no-touch-highlight');
        interactiveElements.forEach(el => {
            el.classList.remove('no-touch-highlight');
        });
    }

    // Set scrolling state
    function setScrollingState(scrolling) {
        isScrolling = scrolling;

        if (scrolling) {
            applyNoHighlightToAll();

            // Clear any existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
        } else {
            // Set a timeout to remove the no-highlight class after scrolling stops
            scrollTimeout = setTimeout(() => {
                if (!isDragging) {
                    removeNoHighlightFromAll();
                }
            }, 300); // Wait 300ms after scrolling stops
        }
    }

    // Add touch event handlers to the sidebar
    sidebar.addEventListener('touchstart', function(e) {
        // Record the starting position and time
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        scrollStartTime = Date.now();
        isDragging = false;
        touchedElement = e.target;
        swipeDeltaX = 0;
        swipeDeltaY = 0;

        // Immediately apply no-highlight to prevent the initial highlight
        applyNoHighlightToAll();
    }, { passive: false, capture: true });

    sidebar.addEventListener('touchmove', function(e) {
        // Calculate distance moved
        const touchY = e.touches[0].clientY;
        const touchX = e.touches[0].clientX;
        const deltaY = Math.abs(touchY - touchStartY);
        const deltaX = Math.abs(touchX - touchStartX);
        swipeDeltaX = touchX - touchStartX;
        swipeDeltaY = touchY - touchStartY;

        // If moved more than threshold, consider it a drag/scroll
        if (deltaY > DRAG_THRESHOLD || deltaX > DRAG_THRESHOLD) {
            isDragging = true;
            setScrollingState(true);
        }

        // Handle sidebar closing gesture while in mobile/phone layout
        if (
            isPhoneLayout() &&
            sidebar.classList.contains('active') &&
            swipeDeltaX < 0 &&
            Math.abs(swipeDeltaX) > Math.abs(swipeDeltaY)
        ) {
            isSidebarSwiping = true;
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();

            // Move sidebar with finger
            const sidebarWidth = sidebar.offsetWidth || window.innerWidth;
            const translateX = Math.max(-sidebarWidth, swipeDeltaX);
            sidebar.style.transition = 'none';
            sidebar.style.transform = `translateX(${translateX}px)`;

            // Haptic feedback when crossing the commit threshold
            const closeThreshold = Math.max(SWIPE_CLOSE_MIN_DISTANCE, sidebarWidth * SIDEBAR_CLOSE_SWIPE_THRESHOLD);
            if (!hasLatchedHaptic && Math.abs(swipeDeltaX) >= closeThreshold) {
                if (typeof window.triggerHapticFeedback === 'function') {
                    window.triggerHapticFeedback(true);
                }
                hasLatchedHaptic = true;
            } else if (hasLatchedHaptic && Math.abs(swipeDeltaX) < closeThreshold) {
                hasLatchedHaptic = false; // Reset if they pull it back
            }
        } else {
            // Stop propagation but don't prevent default scrolling for regular interactions
            e.stopPropagation();
        }
    }, { passive: false, capture: true });

    sidebar.addEventListener('touchend', function(e) {
        // Calculate if this was a quick tap or a scroll/drag
        const touchDuration = Date.now() - scrollStartTime;
        const wasQuickTap = touchDuration < 200 && !isDragging;

        // If this was a quick tap, allow the click to happen
        if (wasQuickTap) {
            // Only remove no-highlight from the tapped element
            if (touchedElement) {
                const targetElement = touchedElement.closest('.menu-item, .section-header');
                if (targetElement) {
                    targetElement.classList.remove('no-touch-highlight');
                }
            }
        } else {
            // This was a scroll/drag, keep no-highlight for a moment
            setTimeout(() => {
                setScrollingState(false);
            }, 100);
        }

        // Reset dragging state
        isDragging = false;

        const sidebarWidth = sidebar.offsetWidth || window.innerWidth;
        if (isSidebarSwiping) {
            const velocity = Math.abs(swipeDeltaX) / touchDuration; // px/ms
            const isFlick = velocity > 0.5 && Math.abs(swipeDeltaX) > 20;

            const shouldClose = (
                (Math.abs(swipeDeltaX) >= Math.max(SWIPE_CLOSE_MIN_DISTANCE, sidebarWidth * SIDEBAR_CLOSE_SWIPE_THRESHOLD) || isFlick) &&
                Math.abs(swipeDeltaY) <= SWIPE_CLOSE_MAX_VERTICAL_DRIFT &&
                Math.abs(swipeDeltaX) > Math.abs(swipeDeltaY)
            );

            if (shouldClose) {
                if (typeof window.triggerHapticFeedback === 'function') {
                    window.triggerHapticFeedback(false);
                }
                closeSidebar();
            } else {
                // Return to original position if swipe was insufficient
                sidebar.style.transition = 'transform 180ms ease-out';
                sidebar.style.transform = 'translateX(0)';
                setTimeout(() => {
                    sidebar.style.transition = '';
                    sidebar.style.transform = '';
                }, 200);
            }

            isSidebarSwiping = false;
        } else if (
            isPhoneLayout() &&
            sidebar.classList.contains('active') &&
            swipeDeltaX <= -SWIPE_CLOSE_MIN_DISTANCE &&
            Math.abs(swipeDeltaY) <= SWIPE_CLOSE_MAX_VERTICAL_DRIFT &&
            Math.abs(swipeDeltaX) > Math.abs(swipeDeltaY)
        ) {
            // Fallback behavior: quick swipe without previous move
            if (typeof window.triggerHapticFeedback === 'function') {
                window.triggerHapticFeedback(false);
            }
            closeSidebar();
        }
    }, { passive: true, capture: true });


    // Handle scroll events to maintain the no-highlight state during scrolling
    sidebar.addEventListener('scroll', function() {
        setScrollingState(true);
    }, { passive: true });

    // Support opening the sidebar from a left-edge swipe when closed
    document.addEventListener('touchstart', function(e) {
        if (!isPhoneLayout() || sidebar.classList.contains('active') || !getEnableSwipeSidebar()) {
            return;
        }

        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        swipeDeltaX = 0;
        swipeDeltaY = 0;

        if (touchStartX <= EDGE_SWIPE_ZONE) {
            isEdgeSwipeOpening = true;
            setSidebarGestureState('opening');
            scrollStartTime = Date.now();
            hasLatchedHaptic = false;

            // Prepare sidebar for drag-open in real-time
            sidebar.classList.remove('hidden');
            sidebar.classList.remove('active');
            sidebar.style.transition = 'none';
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';

            const sidebarWidth = sidebar.offsetWidth || window.innerWidth;
            sidebar.style.transform = `translateX(-${sidebarWidth}px)`;

            // Show overlay progressively
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('hidden');
                sidebarOverlay.style.visibility = 'visible';
                sidebarOverlay.style.transition = 'none';
                sidebarOverlay.style.opacity = '0';
                sidebarOverlay.classList.add('active');
            }
        }
    }, { passive: false, capture: true });

    document.addEventListener('touchmove', function(e) {
        if (!isEdgeSwipeOpening) return;

        const touch = e.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        swipeDeltaX = touchX - touchStartX;
        swipeDeltaY = touchY - touchStartY;

        if (swipeDeltaX > 0 && Math.abs(swipeDeltaX) > Math.abs(swipeDeltaY)) {
            if (e.cancelable) {
                e.preventDefault();
            }
            e.stopPropagation();

            const sidebarWidth = sidebar.offsetWidth || window.innerWidth;
            const translateX = Math.min(0, -sidebarWidth + swipeDeltaX);
            sidebar.style.transform = `translateX(${translateX}px)`;

            const progress = Math.min(1, swipeDeltaX / sidebarWidth);
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (sidebarOverlay) {
                sidebarOverlay.style.opacity = `${0.5 * progress}`;
            }

            // Haptic feedback when crossing the commit threshold
            const openThreshold = Math.max(SWIPE_OPEN_MIN_DISTANCE, sidebarWidth * SIDEBAR_OPEN_SWIPE_THRESHOLD);
            if (!hasLatchedHaptic && swipeDeltaX >= openThreshold) {
                if (typeof window.triggerHapticFeedback === 'function') {
                    window.triggerHapticFeedback(true);
                }
                hasLatchedHaptic = true;
            } else if (hasLatchedHaptic && swipeDeltaX < openThreshold) {
                hasLatchedHaptic = false;
            }
        }
    }, { passive: false, capture: true });

    document.addEventListener('touchend', function() {
        if (!isEdgeSwipeOpening) return;

        const sidebarWidth = sidebar.offsetWidth || window.innerWidth;
        const openThreshold = Math.max(SWIPE_OPEN_MIN_DISTANCE, sidebarWidth * SIDEBAR_OPEN_SWIPE_THRESHOLD);
        const openPercent = swipeDeltaX / sidebarWidth;
        const touchDuration = Date.now() - scrollStartTime;
        const velocity = swipeDeltaX / touchDuration; // px/ms
        const isFlick = velocity > 0.5 && swipeDeltaX > 20;

        const shouldOpen = (openPercent >= 0.35 || swipeDeltaX >= openThreshold || isFlick) &&
            Math.abs(swipeDeltaY) <= SWIPE_CLOSE_MAX_VERTICAL_DRIFT;


        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (shouldOpen) {
            if (typeof window.triggerHapticFeedback === 'function') {
                window.triggerHapticFeedback(false);
            }
            // Animate to fully open after following finger
            sidebar.classList.add('active');
            sidebar.style.transition = 'transform 180ms ease-out';
            sidebar.style.transform = 'translateX(0)';

            if (sidebarOverlay) {
                sidebarOverlay.style.transition = 'opacity 180ms ease-out';
                sidebarOverlay.style.opacity = '1';
            }

            document.body.classList.add('sidebar-open');
            updateHamburgerIcon(true);

            setTimeout(() => {
                sidebar.style.transition = '';
                sidebar.style.transform = '';
                if (sidebarOverlay) {
                    sidebarOverlay.style.transition = '';
                }
            }, 200);
        } else {
            // Animate back closed
            sidebar.style.transition = 'transform 180ms ease-out';
            sidebar.style.transform = `translateX(-${sidebarWidth}px)`;
            if (sidebarOverlay) {
                sidebarOverlay.style.transition = 'opacity 180ms ease-out';
                sidebarOverlay.style.opacity = '0';
            }
            setTimeout(() => {
                sidebar.classList.add('hidden');
                sidebar.style.transition = '';
                sidebar.style.transform = '';
                sidebar.classList.remove('active');

                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                    sidebarOverlay.classList.add('hidden');
                    sidebarOverlay.style.transition = '';
                }
            }, 200);
        }

        isEdgeSwipeOpening = false;
        setSidebarGestureState('idle');
    }, { passive: true, capture: true });

    // Add specific touch event handlers to the chat history section
    chatHistory.addEventListener('touchstart', function(e) {
        // Apply no-highlight to all menu items during chat history scrolling
        applyNoHighlightToAll();
    }, { passive: true });

    chatHistory.addEventListener('touchmove', function(e) {
        // Keep no-highlight during scrolling
        setScrollingState(true);
    }, { passive: true });

    chatHistory.addEventListener('touchend', function(e) {
        // Reset scrolling state after a delay
        setTimeout(() => {
            setScrollingState(false);
        }, 300);
    }, { passive: true });

    // Add touch event handlers to all menu items
    const menuItems = sidebar.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        // Prevent default active state on touchstart
        item.addEventListener('touchstart', function(e) {
            item.classList.add('no-touch-highlight');
        }, { passive: false });

        // Remove highlight during move
        item.addEventListener('touchmove', function(e) {
            item.classList.add('no-touch-highlight');
            e.stopPropagation();
        }, { passive: true });
    });

    // Add touch event handlers to all section headers
    const sectionHeaders = sidebar.querySelectorAll('.section-header');
    sectionHeaders.forEach(header => {
        // Prevent default active state on touchstart
        header.addEventListener('touchstart', function(e) {
            header.classList.add('no-touch-highlight');
        }, { passive: false });

        // Remove highlight during move
        header.addEventListener('touchmove', function(e) {
            header.classList.add('no-touch-highlight');
            e.stopPropagation();
        }, { passive: true });
    });

    debugLog('Sidebar touch handlers initialized with improved drag detection');
}
