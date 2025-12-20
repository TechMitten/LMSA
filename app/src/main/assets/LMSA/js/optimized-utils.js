
/**
 * Throttle utility for reducing frequency of function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce utility for delaying function calls until after a period of inactivity
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Request animation frame throttle for smooth animations
 * @param {Function} func - Function to throttle
 * @returns {Function} - RAF-throttled function
 */
export function rafThrottle(func) {
    let rafId;
    let isScheduled = false;

    return function (...args) {
        if (!isScheduled) {
            isScheduled = true;
            rafId = requestAnimationFrame(() => {
                func.apply(this, args);
                isScheduled = false;
            });
        }
    };
}

/**
 * Minimal replacement for DOMBatcher
 * Executes operations immediately to avoid complexity while maintaining API compatibility
 */
export const domBatcher = {
    read(readOp) {
        return Promise.resolve(readOp());
    },
    write(writeOp) {
        writeOp();
        return Promise.resolve();
    }
};

/**
 * Minimal replacement for AnimationOptimizer
 * Provides basic animation functionality without complex tracking
 */
export const animationOptimizer = {
    animateTransform(element, transforms, duration = 300) {
        // Simple direct application
        element.style.transition = `transform ${duration}ms ease-out`;
        const transformString = Object.entries(transforms)
            .map(([key, value]) => `${key}(${value})`)
            .join(' ');
        element.style.transform = transformString;

        // Cleanup transition after done
        setTimeout(() => {
            element.style.transition = '';
        }, duration);

        return 'anim_' + Math.random().toString(36).substr(2, 9);
    },

    cancelAnimation(element) {
        // No-op in simple version
    },

    fade(element, opacity, duration = 300) {
        element.style.transition = `opacity ${duration}ms ease-out`;
        element.style.opacity = opacity;
        return new Promise(resolve => setTimeout(resolve, duration));
    },

    slide(element, x = 0, y = 0, duration = 300) {
        return this.animateTransform(element, {
            translateX: `${x}px`,
            translateY: `${y}px`
        }, duration);
    },

    scale(element, scaleX = 1, scaleY = scaleX, duration = 300) {
        return this.animateTransform(element, {
            scaleX,
            scaleY
        }, duration);
    }
};

/**
 * Minimal replacement for TouchOptimizer
 * Just adds event listeners directly
 */
export const touchOptimizer = {
    addTouchListener(element, event, handler, needsPreventDefault = false) {
        const options = needsPreventDefault ? { passive: false } : { passive: true };
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }
};
