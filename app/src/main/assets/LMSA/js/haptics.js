const POINTER_MOVE_TOLERANCE_PX = 10;
const CLICK_DEDUPE_WINDOW_MS = 450;

const POINTER_STATE = new Map();
let lastTriggeredAt = 0;
let lastTriggeredElement = null;

const POINTER_INTERACTIVE_SELECTOR = [
    'button',
    '[role="button"]',
    '[aria-pressed]',
    '[aria-selected]',
    '.menu-item',
    '.section-header',
    '.professional-button',
    '.settings-action-button',
    '.connection-type-btn',
    '.conn-modal-action-btn',
    '.conn-modal-close-btn',
    '.openrouter-key-reveal-btn',
    '[data-haptic]'
].join(', ');

const CHANGE_INTERACTIVE_SELECTOR = [
    'input[type="checkbox"]',
    'input[type="radio"]',
    'select'
].join(', ');

const EXCLUDED_SELECTOR = [
    'textarea',
    'input[type="text"]',
    'input[type="password"]',
    'input[type="search"]',
    'input[type="email"]',
    'input[type="number"]',
    'input[type="tel"]',
    'input[type="url"]',
    'input[type="range"]',
    '[contenteditable="true"]',
    '[data-haptic="none"]'
].join(', ');

function getClosestInteractiveElement(target, selector) {
    if (!(target instanceof Element)) {
        return null;
    }

    if (target.closest(EXCLUDED_SELECTOR)) {
        return null;
    }

    const interactiveElement = target.closest(selector);
    if (!interactiveElement || interactiveElement.closest(EXCLUDED_SELECTOR)) {
        return null;
    }

    return interactiveElement;
}

function isDisabled(element) {
    if (!element) {
        return true;
    }

    if (element.matches(':disabled')) {
        return true;
    }

    if (element.getAttribute('aria-disabled') === 'true') {
        return true;
    }

    return !!element.closest('[aria-disabled="true"]');
}

function getExplicitHapticType(element) {
    const explicitType = element?.dataset?.haptic;
    if (!explicitType || explicitType === 'auto') {
        return null;
    }
    return explicitType;
}

function getPointerHapticType(element) {
    const explicitType = getExplicitHapticType(element);
    if (explicitType) {
        return explicitType;
    }

    if (!element) {
        return null;
    }

    if (element.matches('[aria-pressed], [aria-selected], .connection-type-btn')) {
        return 'selection';
    }

    return 'light';
}

function getChangeHapticType(element) {
    const explicitType = getExplicitHapticType(element);
    if (explicitType) {
        return explicitType;
    }

    if (!element) {
        return null;
    }

    if (element.matches('input[type="checkbox"]')) {
        return element.checked ? 'toggle-on' : 'toggle-off';
    }

    if (element.matches('input[type="radio"], select')) {
        return 'selection';
    }

    return 'light';
}

function shouldDeduplicate(element) {
    const now = performance.now();
    if (!lastTriggeredElement || lastTriggeredElement !== element) {
        return false;
    }

    return now - lastTriggeredAt < CLICK_DEDUPE_WINDOW_MS;
}

export function triggerAppHaptic(type = 'light') {
    if (typeof window.triggerHapticFeedback !== 'function') {
        return;
    }

    window.triggerHapticFeedback(type);
}

function fireHapticForElement(element, type) {
    if (!element || !type || isDisabled(element) || shouldDeduplicate(element)) {
        return;
    }

    lastTriggeredElement = element;
    lastTriggeredAt = performance.now();
    triggerAppHaptic(type);
}

function handlePointerDown(event) {
    const target = getClosestInteractiveElement(event.target, POINTER_INTERACTIVE_SELECTOR);
    if (!target || isDisabled(target)) {
        return;
    }

    POINTER_STATE.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        element: target
    });
}

function handlePointerEnd(event) {
    const pointerState = POINTER_STATE.get(event.pointerId);
    POINTER_STATE.delete(event.pointerId);

    if (!pointerState) {
        return;
    }

    const deltaX = event.clientX - pointerState.x;
    const deltaY = event.clientY - pointerState.y;
    const movedTooFar = Math.hypot(deltaX, deltaY) > POINTER_MOVE_TOLERANCE_PX;
    if (movedTooFar) {
        return;
    }

    const releaseTarget = getClosestInteractiveElement(event.target, POINTER_INTERACTIVE_SELECTOR);
    const target = releaseTarget && (
        releaseTarget === pointerState.element ||
        releaseTarget.contains(pointerState.element) ||
        pointerState.element.contains(releaseTarget)
    ) ? releaseTarget : pointerState.element;

    fireHapticForElement(target, getPointerHapticType(target));
}

function handlePointerCancel(event) {
    POINTER_STATE.delete(event.pointerId);
}

function handleClick(event) {
    if (event.detail !== 0) {
        return;
    }

    const target = getClosestInteractiveElement(event.target, POINTER_INTERACTIVE_SELECTOR);
    if (!target) {
        return;
    }

    fireHapticForElement(target, getPointerHapticType(target));
}

function handleChange(event) {
    const target = getClosestInteractiveElement(event.target, CHANGE_INTERACTIVE_SELECTOR);
    if (!target) {
        return;
    }

    fireHapticForElement(target, getChangeHapticType(target));
}

export function initializeHapticFeedback() {
    if (document.documentElement.dataset.hapticsInitialized === 'true') {
        return;
    }

    document.documentElement.dataset.hapticsInitialized = 'true';

    if (window.PointerEvent) {
        document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
        document.addEventListener('pointerup', handlePointerEnd, { capture: true, passive: true });
        document.addEventListener('pointercancel', handlePointerCancel, { capture: true, passive: true });
    }

    document.addEventListener('click', handleClick, { capture: true, passive: true });
    document.addEventListener('change', handleChange, { capture: true, passive: true });
}
