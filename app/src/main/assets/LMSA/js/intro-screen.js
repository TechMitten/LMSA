const INTRO_COMPLETED_KEY = 'lmsa_intro_completed';
const INTRO_VERSION_KEY = 'lmsa_intro_version';
const CURRENT_INTRO_VERSION = '2026-04-11';

const INTRO_STEPS = [
    {
        title: 'What LMSA Does',
        subtitle: 'LMSA connects your Android app to local or hosted AI providers.',
        icon: 'fas fa-wand-magic-sparkles',
        theme: 'aurora',
        checklist: [
            'Use Local Server or OpenRouter for your provider.',
            'Keep your chats in one workspace on mobile.',
            'Use Settings for all connection setup options.'
        ]
    },
    {
        title: 'Pick Your Model Provider',
        subtitle: 'Choose where your responses should come from, then fetch available models.',
        icon: 'fas fa-robot',
        theme: 'control-room',
        checklist: [
            'Tap Settings, then stay on Connection step.',
            'Select Local Server or OpenRouter.',
            'Use the Models screen after setup to select a model.'
        ]
    },
    {
        title: 'Configure API Key',
        subtitle: 'Set credentials for hosted providers before your first request.',
        icon: 'fas fa-key',
        theme: 'vault',
        checklist: [
            'OpenRouter needs an API key.',
            'LM Studio can optionally use a token.',
            'You can return here any time from the sidebar.'
        ]
    },
    {
        title: 'Set IP and Port',
        subtitle: 'Point LMSA to your local server endpoint so model calls can connect.',
        icon: 'fas fa-network-wired',
        theme: 'network',
        checklist: [
            'Use your server machine IP or hostname.',
            'Use the exact listening port from your server.',
            'Save, then test by loading models.'
        ]
    },
    {
        title: 'You Are Ready',
        subtitle: 'Finish onboarding and start your first chat. You can reopen this guide from Getting Started in the sidebar.',
        icon: 'fas fa-circle-check',
        theme: 'launch',
        checklist: [
            'Open a new chat and send your first prompt.',
            'If connection fails, revisit Settings and verify host/port.',
            'Use Getting Started anytime for this checklist.'
        ]
    }
];

let currentStepIndex = 0;
let hasBoundEvents = false;
let completionResolver = null;
let isStepTransitioning = false;
const STEP_TRANSITION_MS = 220;

function getIntroModalElement() {
    return document.getElementById('intro-modal');
}

function getNativeCompletion() {
    if (!window.AndroidBilling || typeof window.AndroidBilling.isOnboardingCompleted !== 'function') {
        return null;
    }

    try {
        return !!window.AndroidBilling.isOnboardingCompleted();
    } catch (error) {
        console.error('Failed reading native onboarding completion state:', error);
        return null;
    }
}

function setNativeCompletion(completed) {
    if (!window.AndroidBilling || typeof window.AndroidBilling.setOnboardingCompleted !== 'function') {
        return;
    }

    try {
        window.AndroidBilling.setOnboardingCompleted(!!completed);
    } catch (error) {
        console.error('Failed writing native onboarding completion state:', error);
    }
}

function setLocalCompletion(completed) {
    localStorage.setItem(INTRO_COMPLETED_KEY, completed ? 'true' : 'false');
    if (completed) {
        localStorage.setItem(INTRO_VERSION_KEY, CURRENT_INTRO_VERSION);
    }
}

function isLocalCompletionValid() {
    return localStorage.getItem(INTRO_COMPLETED_KEY) === 'true' &&
        localStorage.getItem(INTRO_VERSION_KEY) === CURRENT_INTRO_VERSION;
}

export function isOnboardingCompleted() {
    const nativeCompleted = getNativeCompletion();
    if (nativeCompleted === true) {
        return true;
    }

    return isLocalCompletionValid();
}

function markOnboardingComplete() {
    setLocalCompletion(true);
    setNativeCompletion(true);
}

function showIntroModal() {
    const modal = getIntroModalElement();
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideIntroModal() {
    const modal = getIntroModalElement();
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function completeOnboardingFlow() {
    markOnboardingComplete();
    hideIntroModal();

    if (typeof completionResolver === 'function') {
        completionResolver(true);
        completionResolver = null;
    }
}

function getStepElements() {
    return {
        subtitle: document.getElementById('intro-modal-subtitle'),
        progress: document.getElementById('intro-progress'),
        card: document.querySelector('.intro-modal-card'),
        icon: document.getElementById('intro-step-icon'),
        title: document.getElementById('intro-step-title'),
        description: document.getElementById('intro-step-description'),
        checklist: document.getElementById('intro-step-checklist'),
        actions: document.getElementById('intro-step-actions'),
        nextButton: document.getElementById('intro-next-btn'),
        backButton: document.getElementById('intro-back-btn')
    };
}

function renderStep() {
    const step = INTRO_STEPS[currentStepIndex];
    const elements = getStepElements();
    if (!step || !elements.title) return;

    if (elements.card) {
        elements.card.dataset.introTheme = step.theme || 'aurora';
    }

    elements.subtitle.textContent = step.subtitle;
    elements.title.textContent = step.title;
    elements.description.textContent = step.subtitle;
    elements.icon.innerHTML = `<i class="${step.icon}"></i>`;

    elements.progress.innerHTML = INTRO_STEPS.map((_, index) => {
        return `<span class="intro-progress-dot${index <= currentStepIndex ? ' active' : ''}"></span>`;
    }).join('');

    elements.checklist.innerHTML = step.checklist.map((item) => {
        return `<div class="intro-checklist-item"><i class="fas fa-check-circle"></i><span>${item}</span></div>`;
    }).join('');

    elements.actions.innerHTML = '';
    elements.actions.style.display = 'none';

    elements.backButton.style.visibility = currentStepIndex === 0 ? 'hidden' : 'visible';
    elements.nextButton.textContent = currentStepIndex === INTRO_STEPS.length - 1 ? 'Finish' : 'Next';
}

function transitionToStep(nextIndex, direction) {
    if (isStepTransitioning || nextIndex === currentStepIndex || nextIndex < 0 || nextIndex >= INTRO_STEPS.length) {
        return;
    }

    const stepContent = document.querySelector('.intro-step-content');
    if (!stepContent) {
        currentStepIndex = nextIndex;
        renderStep();
        return;
    }

    const exitClass = direction === 'forward' ? 'intro-step-exit-left' : 'intro-step-exit-right';
    const enterClass = direction === 'forward' ? 'intro-step-enter-right' : 'intro-step-enter-left';

    isStepTransitioning = true;
    stepContent.classList.remove('intro-step-enter-right', 'intro-step-enter-left', 'intro-step-exit-left', 'intro-step-exit-right');
    stepContent.classList.add('intro-step-transitioning', exitClass);

    setTimeout(() => {
        currentStepIndex = nextIndex;
        renderStep();

        stepContent.classList.remove(exitClass);
        stepContent.classList.add(enterClass);

        setTimeout(() => {
            stepContent.classList.remove(enterClass, 'intro-step-transitioning');
            isStepTransitioning = false;
        }, STEP_TRANSITION_MS);
    }, STEP_TRANSITION_MS);
}

function bindEvents() {
    if (hasBoundEvents) {
        return;
    }

    const backButton = document.getElementById('intro-back-btn');
    const nextButton = document.getElementById('intro-next-btn');
    const skipButton = document.getElementById('intro-skip-btn');
    const closeButton = document.getElementById('intro-close-btn');
    const modal = getIntroModalElement();

    if (!backButton || !nextButton || !skipButton || !closeButton || !modal) {
        console.error('Onboarding modal elements not found for event binding.');
        return;
    }

    backButton.addEventListener('click', () => {
        if (currentStepIndex > 0) {
            transitionToStep(currentStepIndex - 1, 'backward');
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentStepIndex < INTRO_STEPS.length - 1) {
            transitionToStep(currentStepIndex + 1, 'forward');
            return;
        }

        completeOnboardingFlow();
    });

    const skipHandler = () => {
        completeOnboardingFlow();
    };

    skipButton.addEventListener('click', skipHandler);
    closeButton.addEventListener('click', skipHandler);

    modal.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (target.dataset.introCloseOverlay === 'true') {
            skipHandler();
            return;
        }

        // Intentionally no inline CTA action buttons in onboarding steps.
    });

    hasBoundEvents = true;
}

function startOnboardingSession() {
    currentStepIndex = 0;
    isStepTransitioning = false;
    bindEvents();
    renderStep();
    showIntroModal();

    return new Promise((resolve) => {
        completionResolver = resolve;
    });
}

export async function ensureOnboardingCompleted() {
    if (isOnboardingCompleted()) {
        return true;
    }

    return startOnboardingSession();
}

export async function openOnboarding(forceOpen = false) {
    if (forceOpen) {
        return startOnboardingSession();
    }

    return ensureOnboardingCompleted();
}

window.openOnboarding = () => openOnboarding(true);
window.updateOnboardingStateFromNative = (isCompleted) => {
    if (isCompleted === true) {
        setLocalCompletion(true);
    }
};
