/**
 * tutorial-service.js
 * Industry-standard product tour using SVG spotlight mask.
 * Visual style inspired by driver.js / shepherd.js.
 */

const TUTORIAL_COMPLETED_KEY = 'lmsa_tutorial_completed';
const SPOTLIGHT_PADDING = 8;   // px of breathing room around the target
const SPOTLIGHT_RADIUS  = 10;  // rounded corners on the cutout
const GAP               = 16;  // gap between spotlight and tooltip
const SIDEBAR_STEP_DELAY_MS = 380;

const tutorialSteps = [
    {
        target: null,
        title: 'Welcome to LMSA',
        description: 'Your hub for AI chat — connect to local models, cloud providers, or any custom endpoint. Let\'s take a quick tour!',
        icon: 'fas fa-hand-sparkles',
        position: 'center'
    },
    {
        target: '#setup-dashboard-tabs',
        title: 'Provider Setup',
        description: 'Start here. Pick Local Server for private offline AI, OpenRouter for hundreds of cloud models, or Custom API for any endpoint.',
        icon: 'fas fa-server',
        position: 'bottom'
    },
    {
        target: '#setup-local-btn',
        title: 'Local Server Provider',
        description: 'Choose Local Server for LM Studio, Ollama, and other private local connections. Tap this card, configure the server details in Settings, then press Confirm at the bottom to finish the switch.',
        icon: 'fas fa-server',
        position: 'bottom'
    },
    {
        target: '#setup-openrouter-btn',
        title: 'OpenRouter Provider',
        description: 'Choose OpenRouter when you want cloud models through your own API key. Select this provider, configure the key, then press Confirm to finish. When you switch providers later, confirm the new setup before you continue.',
        icon: 'fas fa-cloud',
        position: 'bottom'
    },
    {
        target: '#setup-custom-btn',
        title: 'Custom Endpoint Provider',
        description: 'Choose Custom Endpoint for any OpenAI-compatible service. Select this card, configure the endpoint, API key, and optional model, then press Confirm. Every provider change should end with Confirm after configuration.',
        icon: 'fas fa-plug',
        position: 'bottom'
    },
    {
        target: '#new-chat-header-button',
        title: 'Start a New Chat',
        description: 'Tap this to clear the conversation and start fresh at any time.',
        icon: 'fas fa-plus',
        position: 'bottom',
        sidebarState: 'closed'
    },
    {
        target: '#chat-input-area',
        title: 'Chat Input',
        description: 'Type your messages here. For image generation, type /image followed by what you want to create, or tap the image button to insert /image for you. You can also attach images and documents if the model supports them.',
        icon: 'fas fa-paper-plane',
        position: 'top',
        sidebarState: 'closed'
    },
    {
        target: '#sidebar-toggle',
        title: 'Sidebar & Navigation',
        description: 'Tap here to open the sidebar. Inside you\'ll find your chat history, templates, settings, and everything else.',
        icon: 'fas fa-bars',
        position: 'bottom-right',
        sidebarState: 'closed'
    },
    {
        target: '#sidebar',
        title: 'Side Menu',
        description: 'This side menu is the main navigation hub. From here the tour moves top to bottom through the controls exactly as they appear on screen.',
        icon: 'fas fa-columns',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: '#options-btn',
        title: 'Menu Tools',
        description: 'Use Options to reach extra tools like System Prompt, Import or Export, Premium, Help, the tutorial replay button, and About.',
        icon: 'fas fa-sliders-h',
        position: 'left',
        mobilePosition: 'bottom',
        sidebarState: 'open'
    },
    {
        target: '#new-chat',
        title: 'New Chat',
        description: 'This button clears the current conversation and starts a fresh chat thread from the sidebar.',
        icon: 'fas fa-plus-circle',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: '#templates-btn',
        title: 'Templates',
        description: 'Open Templates to reuse saved prompt patterns, writing helpers, and other ready-made starting points.',
        icon: 'fas fa-th-large',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: '#web-search-header-button',
        title: 'Web Search',
        description: 'Use this toggle when you want LMSA to pull in live web context for up-to-date answers. Turn it off any time if you want chat responses to rely only on the selected model.',
        icon: 'fas fa-globe',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: '#model-btn',
        title: 'Models',
        description: 'Open this to browse, load, or switch models without leaving the current chat. It takes you straight to the model picker.',
        icon: 'fas fa-robot',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: '#settings-btn',
        title: 'Settings',
        description: 'Open Settings to configure providers, API keys, appearance, feature toggles, and the rest of the app behavior.',
        icon: 'fas fa-cog',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: '#chat-history-section',
        title: 'Chat History',
        description: 'Your previous conversations live here. Open any saved chat to continue where you left off.',
        icon: 'fas fa-comments',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: '#mode-indicator',
        title: 'Provider Status',
        description: 'The footer shows which provider is active right now. It is also the place to quick-switch providers when you need to change modes later.',
        icon: 'fas fa-signal',
        position: 'left',
        mobilePosition: 'top',
        sidebarState: 'open'
    },
    {
        target: null,
        title: 'You\'re Ready',
        description: 'That wraps up the tour. Choose your provider, configure it, use the chat tools you need, and come back to the side menu any time for navigation and app controls.',
        icon: 'fas fa-flag-checkered',
        position: 'center',
        sidebarState: 'closed'
    }
];

// ── State ──────────────────────────────────────────────────────────────────

let currentStepIndex = 0;
let svgEl = null;
let holeRect = null;
let holeBorder = null;
let tooltipEl = null;
let arrowEl = null;
let resizeObserver = null;
let isRunning = false;

// ── Public API ─────────────────────────────────────────────────────────────

export function initializeTutorial() {
    if (localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true') return;
    setTimeout(startTutorial, 1200);
}

export function startTutorial() {
    // Close sidebar first if open
    const sidebar = document.getElementById('sidebar');
    const sidebarOpen = sidebar && !sidebar.classList.contains('hidden');

    const run = () => {
        currentStepIndex = 0;
        isRunning = true;
        ensureElements();
        showOverlay();
        renderStep(0);
    };

    if (sidebarOpen) {
        import('./ui-manager.js').then(m => { m.toggleSidebar(); setTimeout(run, 350); }).catch(run);
    } else {
        run();
    }
}

export function endTutorial() {
    isRunning = false;

    // Fade out tooltip
    if (tooltipEl) tooltipEl.classList.remove('tutorial-tooltip-visible');

    // Fade out SVG overlay
    if (svgEl) svgEl.classList.remove('tutorial-svg-active');

    // Clean up resize observer
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }

    window.removeEventListener('resize', onResize);

    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderStep(index) {
    if (index < 0 || index >= tutorialSteps.length) { endTutorial(); return; }

    const step = tutorialSteps[index];

    // Disconnect old resize observer
    if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }

    // Update tooltip text / header
    updateTooltipContent(step, index);

    // Hide tooltip briefly for repositioning
    tooltipEl.classList.remove('tutorial-tooltip-visible');

    prepareStepEnvironment(step).then(() => {
        showStepTarget(step);
    });
}

function showStepTarget(step) {
    if (step.target) {
        const targetEl = document.querySelector(step.target);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Watch for resize/layout changes on this element
            resizeObserver = new ResizeObserver(() => updateSpotlight(step, targetEl));
            resizeObserver.observe(targetEl);

            setTimeout(() => {
                updateSpotlight(step, targetEl);
                tooltipEl.classList.add('tutorial-tooltip-visible');
            }, 280);
        } else {
            console.warn('[Tutorial] target not found:', step.target);
            clearSpotlight();
            centerTooltip();
            tooltipEl.classList.add('tutorial-tooltip-visible');
        }
    } else {
        clearSpotlight();
        centerTooltip();
        tooltipEl.classList.add('tutorial-tooltip-visible');
    }
}

async function prepareStepEnvironment(step) {
    const desiredSidebarState = step.sidebarState || 'ignore';
    await ensureSidebarState(desiredSidebarState);
}

async function ensureSidebarState(desiredState) {
    if (desiredState === 'ignore') {
        return;
    }

    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        return;
    }

    const isOpen = !sidebar.classList.contains('hidden') && sidebar.classList.contains('active');

    if (desiredState === 'open' && !isOpen) {
        await import('./ui-manager.js')
            .then(module => {
                module.toggleSidebar();
            })
            .catch(() => {});
        await waitForUi(SIDEBAR_STEP_DELAY_MS);
        return;
    }

    if (desiredState === 'closed' && isOpen) {
        await import('./ui-manager.js')
            .then(module => {
                if (typeof module.closeSidebar === 'function') {
                    module.closeSidebar();
                } else {
                    module.toggleSidebar();
                }
            })
            .catch(() => {});
        await waitForUi(SIDEBAR_STEP_DELAY_MS);
    }
}

function waitForUi(delayMs) {
    return new Promise(resolve => {
        window.setTimeout(resolve, delayMs);
    });
}

// ── Spotlight (SVG cutout) ────────────────────────────────────────────────

function updateSpotlight(step, targetEl) {
    const r = targetEl.getBoundingClientRect();
    const p = SPOTLIGHT_PADDING;
    const x = r.left - p;
    const y = r.top  - p;
    const w = r.width  + p * 2;
    const h = r.height + p * 2;
    const rx = SPOTLIGHT_RADIUS;

    // Animate the SVG hole via CSS-animatable presentation attributes
    setRectAttrs(holeRect,   x, y, w, h, rx);
    setRectAttrs(holeBorder, x, y, w, h, rx);

    // Show border
    holeBorder.setAttribute('stroke-opacity', '1');

    // Position tooltip next to the spotlight cutout
    positionTooltip(step, { x, y, w, h });
}

function clearSpotlight() {
    // Collapse the hole so everything is dimmed
    setRectAttrs(holeRect,   0, 0, 0, 0, 0);
    setRectAttrs(holeBorder, 0, 0, 0, 0, 0);
    holeBorder.setAttribute('stroke-opacity', '0');
}

function setRectAttrs(el, x, y, w, h, rx) {
    el.setAttribute('x', x);
    el.setAttribute('y', y);
    el.setAttribute('width',  Math.max(0, w));
    el.setAttribute('height', Math.max(0, h));
    el.setAttribute('rx', rx);
}

// ── Tooltip positioning ────────────────────────────────────────────────────

/**
 * @param {object} step      — the current step definition
 * @param {object} spotlight — {x, y, w, h} of the spotlight cutout rect
 */
function positionTooltip(step, spotlight) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Force a layout flush to get accurate tooltip dimensions
    tooltipEl.style.visibility = 'hidden';
    tooltipEl.style.display    = 'block';
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;
    tooltipEl.style.visibility = '';

    const { x, y, w, h } = spotlight;
    let top, left, arrowClass;

    const pos = window.innerWidth <= 600 && step.mobilePosition
        ? step.mobilePosition
        : step.position;

    if (pos === 'bottom' || pos === 'bottom-right') {
        // Try below the spotlight first
        top  = y + h + GAP;
        left = pos === 'bottom-right'
            ? x + w - tw            // right-align to spotlight
            : x + w / 2 - tw / 2;  // centre-align
        arrowClass = pos === 'bottom-right' ? 'arrow-top-right' : 'arrow-top';

        // Flip to above if it would clip the bottom
        if (top + th > vh - GAP) {
            top = y - th - GAP;
            arrowClass = 'arrow-bottom';
        }

    } else if (pos === 'top') {
        top  = y - th - GAP;
        left = x + w / 2 - tw / 2;
        arrowClass = 'arrow-bottom';

        // Flip to below if it would clip the top
        if (top < GAP) {
            top = y + h + GAP;
            arrowClass = 'arrow-top';
        }

    } else if (pos === 'right') {
        top  = y + h / 2 - th / 2;
        left = x + w + GAP;
        arrowClass = 'arrow-left';
        if (left + tw > vw - GAP) { left = x - tw - GAP; arrowClass = 'arrow-right'; }

    } else { // left / fallback
        top  = y + h / 2 - th / 2;
        left = x - tw - GAP;
        arrowClass = 'arrow-right';
        if (left < GAP) { left = x + w + GAP; arrowClass = 'arrow-left'; }
    }

    // Clamp to viewport
    left = Math.max(GAP, Math.min(left, vw - tw - GAP));
    top  = Math.max(GAP, Math.min(top,  vh - th - GAP));

    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top  = `${top}px`;

    // Update arrow
    arrowEl.className = `ttr-arrow-wrap ${arrowClass}`;
}

function centerTooltip() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const tw = tooltipEl.offsetWidth;
    const th = tooltipEl.offsetHeight;

    tooltipEl.style.left = `${(vw - tw) / 2}px`;
    tooltipEl.style.top  = `${(vh - th) / 2}px`;
    arrowEl.className = 'ttr-arrow-wrap'; // no arrow when centred
}

// ── Tooltip content ────────────────────────────────────────────────────────

function updateTooltipContent(step, index) {
    tooltipEl.querySelector('.ttr-title').textContent = step.title;
    tooltipEl.querySelector('.ttr-body').textContent  = step.description;
    tooltipEl.querySelector('.ttr-icon i').className  = step.icon;
    tooltipEl.querySelector('.ttr-step-label').textContent = `Step ${index + 1} of ${tutorialSteps.length}`;

    // Progress dots
    const dotsWrap = tooltipEl.querySelector('.ttr-progress');
    dotsWrap.innerHTML = '';
    tutorialSteps.forEach((_, i) => {
        const d = document.createElement('span');
        d.className = `ttr-dot${i === index ? ' active' : ''}`;
        dotsWrap.appendChild(d);
    });

    // Button label
    tooltipEl.querySelector('.btn-ttr-next').textContent =
        index === tutorialSteps.length - 1 ? 'Done ✓' : 'Next →';
}

// ── DOM construction ───────────────────────────────────────────────────────

function ensureElements() {
    // ── SVG overlay ──────────────────────────────────────────────────────
    if (!document.getElementById('tutorial-svg-overlay')) {
        svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.id = 'tutorial-svg-overlay';
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        svgEl.innerHTML = `
            <defs>
                <mask id="ttr-mask">
                    <rect width="100%" height="100%" fill="white"/>
                    <rect id="ttr-hole" x="0" y="0" width="0" height="0" rx="${SPOTLIGHT_RADIUS}" fill="black"
                          style="transition: x 0.35s ease, y 0.35s ease, width 0.35s ease, height 0.35s ease"/>
                </mask>
            </defs>
            <!-- Dimming rect with hole cut out -->
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#ttr-mask)"/>
            <!-- Glowing border around the hole -->
            <rect id="ttr-hole-border" x="0" y="0" width="0" height="0" rx="${SPOTLIGHT_RADIUS}"
                  fill="none" stroke="#38bdf8" stroke-width="3" stroke-opacity="0"
                  id="tutorial-hole-border"
                  style="transition: x 0.35s ease, y 0.35s ease, width 0.35s ease, height 0.35s ease, stroke-opacity 0.3s ease"/>
        `;

        document.body.appendChild(svgEl);
    } else {
        svgEl = document.getElementById('tutorial-svg-overlay');
    }

    holeRect   = svgEl.querySelector('#ttr-hole');
    holeBorder = svgEl.querySelector('#ttr-hole-border');

    // ── Tooltip ──────────────────────────────────────────────────────────
    if (!document.getElementById('tutorial-tooltip')) {
        tooltipEl = document.createElement('div');
        tooltipEl.id = 'tutorial-tooltip';

        tooltipEl.innerHTML = `
            <div class="ttr-arrow-wrap"></div>
            <div class="ttr-header">
                <div class="ttr-icon"><i class="fas fa-info"></i></div>
                <div>
                    <h3 class="ttr-title">Title</h3>
                    <div class="ttr-step-label">Step 1 of ${tutorialSteps.length}</div>
                </div>
            </div>
            <div class="ttr-body">Description.</div>
            <div class="ttr-footer">
                <div class="ttr-progress"></div>
                <div class="ttr-buttons">
                    <button class="btn-ttr-skip">Skip tour</button>
                    <button class="btn-ttr-next">Next →</button>
                </div>
            </div>
        `;

        tooltipEl.querySelector('.btn-ttr-next').addEventListener('click', () => {
            if (currentStepIndex < tutorialSteps.length - 1) {
                tooltipEl.classList.remove('tutorial-tooltip-visible');
                setTimeout(() => { currentStepIndex++; renderStep(currentStepIndex); }, 250);
            } else {
                endTutorial();
            }
        });

        tooltipEl.querySelector('.btn-ttr-skip').addEventListener('click', endTutorial);

        ['click', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup'].forEach((eventName) => {
            tooltipEl.addEventListener(eventName, (event) => {
                event.stopPropagation();
            });
        });

        document.body.appendChild(tooltipEl);
    } else {
        tooltipEl = document.getElementById('tutorial-tooltip');
    }

    arrowEl = tooltipEl.querySelector('.ttr-arrow-wrap');
}

function showOverlay() {
    svgEl.classList.add('tutorial-svg-active');
    window.addEventListener('resize', onResize);
}

function onResize() {
    if (!isRunning) return;
    const step = tutorialSteps[currentStepIndex];
    if (step && step.target) {
        const el = document.querySelector(step.target);
        if (el) updateSpotlight(step, el);
    } else {
        centerTooltip();
    }
}

// ── Global hook for sidebar "Replay" button ───────────────────────────────
window.startLMSATutorial = startTutorial;
