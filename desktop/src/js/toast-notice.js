let toastLayer = null;

function getToastLayer() {
    if (toastLayer && toastLayer.isConnected) {
        return toastLayer;
    }

    toastLayer = document.getElementById('app-toast-layer');
    if (toastLayer) {
        return toastLayer;
    }

    toastLayer = document.createElement('div');
    toastLayer.id = 'app-toast-layer';
    toastLayer.className = 'app-toast-layer';
    toastLayer.setAttribute('aria-live', 'polite');
    toastLayer.setAttribute('aria-atomic', 'false');
    document.body.appendChild(toastLayer);

    return toastLayer;
}

export function showToastNotice({
    message,
    tone = 'success',
    duration = 3000,
    iconClass = ''
} = {}) {
    if (typeof message !== 'string' || !message.trim()) {
        return null;
    }

    const layer = getToastLayer();
    const notice = document.createElement('div');
    notice.className = `app-toast-notice app-toast-notice--${tone}`;
    notice.setAttribute('role', tone === 'error' ? 'alert' : 'status');

    if (iconClass) {
        const icon = document.createElement('i');
        icon.className = `app-toast-notice__icon ${iconClass}`;
        icon.setAttribute('aria-hidden', 'true');
        notice.appendChild(icon);
    }

    const text = document.createElement('span');
    text.className = 'app-toast-notice__text';
    text.textContent = message.trim();
    notice.appendChild(text);

    layer.appendChild(notice);

    requestAnimationFrame(() => {
        notice.classList.add('is-visible');
    });

    let dismissed = false;
    const dismiss = () => {
        if (dismissed) {
            return;
        }

        dismissed = true;
        notice.classList.remove('is-visible');
        notice.classList.add('is-exiting');

        window.setTimeout(() => {
            notice.remove();
            if (layer.childElementCount === 0) {
                layer.remove();
                if (toastLayer === layer) {
                    toastLayer = null;
                }
            }
        }, 220);
    };

    window.setTimeout(dismiss, duration);

    return { element: notice, dismiss };
}