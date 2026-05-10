const IMAGE_VIEWER_ANIMATION_MS = 180;

import { showToastNotice } from '../../toast-notice.js';

let imageViewerInitialized = false;
let imageViewerCloseTimer = null;
let imageViewerIsClosing = false;
let zoomTranslateX = 0;
let zoomTranslateY = 0;
let isZoomDragging = false;
let zoomStartX = 0;
let zoomStartY = 0;

export const imageViewerModal = `
    <div id="image-viewer-modal" class="fixed inset-0 bg-black/85 backdrop-blur-sm items-center justify-center hidden modal-container" style="z-index: 2150;"
        aria-labelledby="image-viewer-title" role="dialog" aria-modal="true">
        <div class="modal-content" style="position: relative; width: min(92vw, 960px); max-height: 90vh; display: flex; flex-direction: column; border-radius: 22px; overflow: hidden; background: rgba(11, 18, 32, 0.96); border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);">
            <button id="close-image-viewer-modal" aria-label="Close image viewer" style="position: absolute; top: 14px; right: 14px; z-index: 5; width: 40px; height: 40px; border: 0; border-radius: 999px; background: rgba(15, 23, 42, 0.78); color: #f8fafc; display: inline-flex; align-items: center; justify-content: center; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
            <div id="image-viewer-title" style="position: absolute; top: 18px; left: 50%; transform: translateX(-50%); z-index: 4; max-width: calc(100% - 120px); color: #f8fafc; font-size: 15px; font-weight: 700; line-height: 1.35; text-align: center; white-space: normal; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3;">AI Generated Image</div>
            <div id="image-viewer-image-container" style="flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 92px 18px 18px; background: radial-gradient(circle at top, rgba(59, 130, 246, 0.12), transparent 45%), rgba(2, 6, 23, 0.72); transition: all 0.3s ease; overflow: hidden;">
                <img id="image-viewer-modal-image" alt="Expanded image preview" style="display: block; max-width: 100%; max-height: calc(90vh - 146px); width: auto; height: auto; border-radius: 18px; background: rgba(15, 23, 42, 0.35); object-fit: contain; transition: all 0.3s ease;" />
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px 20px; background: rgba(8, 13, 24, 0.96); border-top: 1px solid rgba(255, 255, 255, 0.08); z-index: 10;">
                <div style="min-width: 0; display: flex; flex-direction: row; gap: 12px; align-items: center; flex: 1;">
                    <button id="zoom-image-viewer-button" aria-label="Zoom image" type="button" style="flex-shrink: 0; border: 0; border-radius: 999px; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.1); color: #e2e8f0; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <div id="image-viewer-caption" style="color: rgba(226, 232, 240, 0.8); font-size: 13px; line-height: 1.45; word-break: break-word;"></div>
                </div>
                <button id="download-image-viewer-button" type="button" style="flex-shrink: 0; border: 0; border-radius: 999px; padding: 7px 12px; background: linear-gradient(135deg, #0ea5e9, #2563eb); color: #eff6ff; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 22px rgba(37, 99, 235, 0.22);">
                    <i class="fas fa-download" style="margin-right: 6px;"></i>Download
                </button>
            </div>
        </div>
    </div>
`;

function getImageViewerElements() {
    return {
        modal: document.getElementById('image-viewer-modal'),
        content: document.querySelector('#image-viewer-modal .modal-content'),
        imageContainer: document.getElementById('image-viewer-image-container'),
        image: document.getElementById('image-viewer-modal-image'),
        title: document.getElementById('image-viewer-title'),
        caption: document.getElementById('image-viewer-caption'),
        closeButton: document.getElementById('close-image-viewer-modal'),
        downloadButton: document.getElementById('download-image-viewer-button'),
        zoomButton: document.getElementById('zoom-image-viewer-button')
    };
}

function isRemoteHttpUrl(value) {
    return /^https?:\/\//i.test(value || '');
}

function normalizeDownloadFilename(filename) {
    const safeName = typeof filename === 'string' ? filename.trim() : '';
    if (!safeName) {
        return 'generated-image.jpg';
    }

    return /\.[a-z0-9]+$/i.test(safeName) ? safeName : `${safeName}.jpg`;
}

function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(reader.error || new Error('Unable to read image data'));
        reader.readAsDataURL(blob);
    });
}

async function fetchImageAsDataUrl(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Unable to download image (${response.status})`);
    }

    const blob = await response.blob();
    return readBlobAsDataUrl(blob);
}

function withNativeImageSaveCallback(saveAction) {
    return new Promise((resolve, reject) => {
        const previousOnImageSaved = window.onImageSaved;

        const restorePreviousHandler = () => {
            if (typeof previousOnImageSaved === 'function') {
                window.onImageSaved = previousOnImageSaved;
            } else {
                delete window.onImageSaved;
            }
        };

        window.onImageSaved = (success) => {
            restorePreviousHandler();

            if (typeof previousOnImageSaved === 'function') {
                previousOnImageSaved(success);
            }

            resolve(Boolean(success));
        };

        try {
            saveAction();
        } catch (error) {
            restorePreviousHandler();
            reject(error);
        }
    });
}

export async function downloadImageAsset({ imageSrc = '', downloadUrl = '', filename = '' } = {}) {
    const resolvedImageSrc = typeof imageSrc === 'string' ? imageSrc : '';
    const resolvedDownloadUrl = typeof downloadUrl === 'string' && downloadUrl ? downloadUrl : resolvedImageSrc;
    const normalizedFilename = normalizeDownloadFilename(filename);

    if (!resolvedImageSrc && !resolvedDownloadUrl) {
        throw new Error('Unable to save image.');
    }

    if (window.AndroidFileOps) {
        if (resolvedImageSrc.startsWith('data:image/') && typeof window.AndroidFileOps.saveImageFile === 'function') {
            const saved = await withNativeImageSaveCallback(() => {
                window.AndroidFileOps.saveImageFile(resolvedImageSrc, normalizedFilename);
            });
            if (!saved) {
                throw new Error('Unable to save image.');
            }
            return;
        }

        if (isRemoteHttpUrl(resolvedDownloadUrl) && typeof window.AndroidFileOps.saveImageFromUrl === 'function') {
            const saved = await withNativeImageSaveCallback(() => {
                window.AndroidFileOps.saveImageFromUrl(resolvedDownloadUrl, normalizedFilename);
            });
            if (!saved) {
                throw new Error('Unable to save image.');
            }
            return;
        }

        if (typeof window.AndroidFileOps.saveImageFile === 'function') {
            const fetchSource = resolvedDownloadUrl || resolvedImageSrc;
            if (!fetchSource) {
                throw new Error('Unable to save image.');
            }
            const dataUrl = await fetchImageAsDataUrl(fetchSource);
            const saved = await withNativeImageSaveCallback(() => {
                window.AndroidFileOps.saveImageFile(dataUrl, normalizedFilename);
            });
            if (!saved) {
                throw new Error('Unable to save image.');
            }
            return;
        }
    }

    const fetchSource = resolvedDownloadUrl || resolvedImageSrc;
    if (!fetchSource) {
        throw new Error('Unable to save image.');
    }

    const response = await fetch(fetchSource);
    if (!response.ok) {
        throw new Error(`Unable to download image (${response.status})`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = normalizedFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
}

async function downloadImageFromViewer() {
    const { modal, downloadButton } = getImageViewerElements();
    if (!modal || !downloadButton) {
        return;
    }

    const imageSrc = modal.dataset.imageSrc || '';
    const downloadUrl = modal.dataset.downloadUrl || imageSrc;
    const filename = modal.dataset.filename || '';
    if (!imageSrc) {
        return;
    }

    downloadButton.disabled = true;
    const originalMarkup = downloadButton.innerHTML;
    downloadButton.textContent = 'Saving...';

    try {
        await downloadImageAsset({ imageSrc, downloadUrl, filename });
        showToastNotice({
            message: 'Image saved successfully.',
            tone: 'success',
            iconClass: 'fas fa-check-circle',
            duration: 2800
        });
    } catch (error) {
        console.error('Image download failed:', error);
        showToastNotice({
            message: error instanceof Error ? error.message : 'Unable to save image.',
            tone: 'error',
            iconClass: 'fas fa-circle-exclamation',
            duration: 4200
        });
    } finally {
        downloadButton.disabled = false;
        downloadButton.innerHTML = originalMarkup;
    }
}

export function closeImageViewerModal(force = false) {
    const { modal, content } = getImageViewerElements();
    if (!modal || imageViewerIsClosing) {
        return false;
    }

    imageViewerIsClosing = true;

    if (imageViewerCloseTimer) {
        clearTimeout(imageViewerCloseTimer);
    }

    if (force) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.opacity = '0';
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(10px) scale(0.985)';
        }
        imageViewerIsClosing = false;
        imageViewerCloseTimer = null;
        return true;
    }

    modal.style.opacity = '0';
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(10px) scale(0.985)';
    }

    imageViewerCloseTimer = setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        imageViewerIsClosing = false;
        imageViewerCloseTimer = null;
    }, IMAGE_VIEWER_ANIMATION_MS);

    return true;
}

export function openImageViewerModal(imageSrc, options = {}) {
    const { modal, content, image, imageContainer, title, caption, zoomButton } = getImageViewerElements();
    if (!modal || !image || !title || !caption || typeof imageSrc !== 'string' || !imageSrc) {
        return;
    }

    if (imageContainer) {
        imageContainer.classList.remove('is-zoomed');
        imageContainer.style.padding = '92px 18px 18px';
        modal.dataset.zoomState = '0';
        zoomTranslateX = 0;
        zoomTranslateY = 0;
        isZoomDragging = false;
        
        // Ensure styles are refreshed
        const image = document.getElementById('image-viewer-modal-image');
        const zoomButton = document.getElementById('zoom-image-viewer-button');
        if (image && zoomButton) {
            image.style.maxHeight = 'calc(90vh - 146px)';
            image.style.width = 'auto';
            image.style.height = 'auto';
            image.style.borderRadius = '18px';
            image.style.objectFit = 'contain';
            image.style.transform = 'none';
            image.style.cursor = 'default';
            zoomButton.innerHTML = '<i class="fas fa-search-plus"></i>';
        }
    }

    if (imageViewerCloseTimer) {
        clearTimeout(imageViewerCloseTimer);
        imageViewerCloseTimer = null;
    }
    imageViewerIsClosing = false;

    modal.dataset.imageSrc = imageSrc;
    modal.dataset.downloadUrl = typeof options.downloadUrl === 'string' && options.downloadUrl ? options.downloadUrl : imageSrc;
    modal.dataset.filename = normalizeDownloadFilename(options.filename);

    image.src = imageSrc;
    image.alt = typeof options.prompt === 'string' && options.prompt ? options.prompt : (options.title || 'Expanded image preview');
    const normalizedPrompt = typeof options.prompt === 'string' ? options.prompt.trim() : '';
    title.textContent = normalizedPrompt || (typeof options.title === 'string' && options.title ? options.title : 'AI Generated Image');
    caption.textContent = '';
    caption.style.display = 'none';

    modal.style.opacity = '0';
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(10px) scale(0.985)';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.offsetHeight;
    requestAnimationFrame(() => {
        modal.style.opacity = '1';
        if (content) {
            content.style.opacity = '1';
            content.style.transform = 'translateY(0) scale(1)';
        }
    });
}

export function initImageViewerModal() {
    if (imageViewerInitialized) {
        return;
    }

    const { modal, content, closeButton, downloadButton, zoomButton, imageContainer, image } = getImageViewerElements();
    if (!modal) {
        return;
    }

    imageViewerInitialized = true;
    modal.style.transition = `opacity ${IMAGE_VIEWER_ANIMATION_MS}ms ease`;
    if (content) {
        content.style.transition = `opacity ${IMAGE_VIEWER_ANIMATION_MS}ms ease, transform ${IMAGE_VIEWER_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => closeImageViewerModal());
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            downloadImageFromViewer();
        });
    }

    const updateZoomDisplay = () => {
        const zoomState = parseInt(modal.dataset.zoomState || '0', 10);
        
        // Reset transition for dragging state
        image.style.transition = zoomState === 2 ? 'none' : 'all 0.3s ease';

        if (zoomState === 0) {
            zoomButton.innerHTML = '<i class="fas fa-search-plus"></i>';
            imageContainer.style.padding = '92px 18px 18px';
            image.style.maxHeight = 'calc(90vh - 146px)';
            image.style.width = 'auto';
            image.style.height = 'auto';
            image.style.borderRadius = '18px';
            image.style.objectFit = 'contain';
            image.style.transform = 'none';
            image.style.cursor = 'default';
            zoomTranslateX = 0;
            zoomTranslateY = 0;
        } else if (zoomState === 1) {
            zoomButton.innerHTML = '<i class="fas fa-expand"></i>';
            imageContainer.style.padding = '0';
            image.style.maxHeight = '100%';
            image.style.width = '100%';
            image.style.height = '100%';
            image.style.borderRadius = '0';
            image.style.objectFit = 'cover';
            image.style.transform = 'none';
            image.style.cursor = 'default';
            zoomTranslateX = 0;
            zoomTranslateY = 0;
        } else if (zoomState === 2) {
            zoomButton.innerHTML = '<i class="fas fa-search-minus"></i>';
            image.style.maxHeight = '100%';
            image.style.width = '100%';
            image.style.height = '100%';
            image.style.objectFit = 'cover';
            image.style.cursor = 'grab';
            image.style.transform = `translate(${zoomTranslateX}px, ${zoomTranslateY}px) scale(2.5)`;
        }
    };

    if (zoomButton) {
        zoomButton.addEventListener('click', () => {
            if (!imageContainer || !image) return;
            let zoomState = parseInt(modal.dataset.zoomState || '0', 10);
            zoomState = (zoomState + 1) % 3;
            modal.dataset.zoomState = zoomState.toString();
            updateZoomDisplay();
        });
    }

    const startDrag = (e) => {
        const zoomState = parseInt(modal.dataset.zoomState || '0', 10);
        if (zoomState !== 2) return;
        
        isZoomDragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        zoomStartX = clientX - zoomTranslateX;
        zoomStartY = clientY - zoomTranslateY;
        image.style.cursor = 'grabbing';
    };

    const moveDrag = (e) => {
        if (!isZoomDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        zoomTranslateX = clientX - zoomStartX;
        zoomTranslateY = clientY - zoomStartY;
        
        image.style.transform = `translate(${zoomTranslateX}px, ${zoomTranslateY}px) scale(2.5)`;
    };

    const stopDrag = () => {
        isZoomDragging = false;
        const zoomState = parseInt(modal.dataset.zoomState || '0', 10);
        if (zoomState === 2) {
            image.style.cursor = 'grab';
        }
    };

    image.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', stopDrag);

    image.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeImageViewerModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeImageViewerModal();
        }
    });
}