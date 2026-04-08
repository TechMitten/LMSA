// Lazy load JSZip only when needed
window.loadJSZipLibrary = function () {
    return new Promise((resolve, reject) => {
        if (window.JSZip) {
            resolve(window.JSZip);
            return;
        }

        if (window._jsZipLoading) {
            window._jsZipLoading.then(resolve).catch(reject);
            return;
        }

        window._jsZipLoading = new Promise((loadResolve, loadReject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.integrity = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                console.log('JSZip loaded successfully');
                loadResolve(window.JSZip);
            };
            script.onerror = (e) => {
                console.error('Failed to load JSZip:', e);
                loadReject(e);
            };
            document.head.appendChild(script);
        });

        window._jsZipLoading.then(resolve).catch(reject);
    });
};

// Lazy load Tesseract only when needed
window.loadTesseractLibrary = function () {
    return new Promise((resolve, reject) => {
        if (window.Tesseract) {
            resolve(window.Tesseract);
            return;
        }

        if (window._tesseractLoading) {
            window._tesseractLoading.then(resolve).catch(reject);
            return;
        }

        window._tesseractLoading = new Promise((loadResolve, loadReject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.4/dist/tesseract.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                console.log('Tesseract loaded successfully');
                loadResolve(window.Tesseract);
            };
            script.onerror = (e) => {
                console.error('Failed to load Tesseract:', e);
                loadReject(e);
            };
            document.head.appendChild(script);
        });

        window._tesseractLoading.then(resolve).catch(reject);
    });
};

// Simple PDF.js loader that avoids module conflicts
window.loadPDFLibrary = function () {
    return new Promise((resolve, reject) => {
        // Check if PDF.js is already available
        if (window.pdfjsLib || window.PDFJS) {
            console.log('PDF.js already available, skipping load');
            resolve();
            return;
        }

        // Check if we're already loading PDF.js to prevent duplicate loads
        if (window._pdfJsLoading) {
            console.log('PDF.js already loading, waiting for completion...');
            window._pdfJsLoading.then(resolve).catch(reject);
            return;
        }

        console.log('Loading PDF.js via direct script inclusion...');

        // Mark that we're loading PDF.js
        window._pdfJsLoading = new Promise((loadResolve, loadReject) => {
            // Create a unique script element to avoid conflicts
            const script = document.createElement('script');
            script.id = 'pdfjs-loader-' + Date.now();
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

            script.onload = function () {
                console.log('PDF.js script loaded, checking availability...');

                // Multiple attempts to find the library
                let attempts = 0;
                const maxAttempts = 10;

                const checkLibrary = () => {
                    attempts++;

                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        console.log('PDF.js found as pdfjsLib and configured successfully');
                        loadResolve();
                    } else if (window.PDFJS) {
                        window.pdfjsLib = window.PDFJS;
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                        console.log('PDF.js found as PDFJS and configured successfully');
                        loadResolve();
                    } else if (attempts < maxAttempts) {
                        console.log(`PDF.js not available yet, attempt ${attempts}/${maxAttempts}, retrying...`);
                        setTimeout(checkLibrary, 100);
                    } else {
                        console.error('PDF.js failed to load after multiple attempts');
                        loadReject(new Error('PDF.js failed to load after multiple attempts'));
                    }
                };

                // Start checking immediately
                checkLibrary();
            };

            script.onerror = function (e) {
                console.error('PDF.js script load error:', e);
                loadReject(new Error('Failed to load PDF.js script'));
            };

            document.head.appendChild(script);
        });

        window._pdfJsLoading.then(resolve).catch(reject);
    });
};

// Simple code highlighting function using pre/code
window.renderCodeWithFallback = function (container, code, language) {
    // Clean up any existing content
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Create simple pre/code elements
    const pre = document.createElement('pre');
    pre.className = 'fallback-code';
    pre.style.position = 'relative';

    const codeEl = document.createElement('code');
    if (language) {
        codeEl.className = `language-${language}`;
    } else {
        codeEl.className = 'language-plaintext';
    }
    codeEl.textContent = code;
    
    // Apply syntax highlighting if the built-in highlighter is loaded
    if (window.shHighlightElement) {
        window.shHighlightElement(codeEl, language || '');
    }

    // Add copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'fallback-copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.style.position = 'absolute';
    copyBtn.style.top = '5px';
    copyBtn.style.right = '5px';
    copyBtn.style.zIndex = '10';
    copyBtn.style.padding = '5px';
    copyBtn.style.background = 'rgba(30, 30, 30, 0.8)';
    copyBtn.style.border = 'none';
    copyBtn.style.borderRadius = '3px';
    copyBtn.style.cursor = 'pointer';

    copyBtn.addEventListener('click', function () {
        const originalHTML = copyBtn.innerHTML;

        // Use the improved copyToClipboard function if available, otherwise fallback
        const copyFunction = window.copyToClipboard || function (text) {
            return navigator.clipboard.writeText(text);
        };

        copyFunction(code)
            .then(() => {
                // Show copied indication
                copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            })
            .catch((error) => {
                console.error('Failed to copy code:', error);
                copyBtn.innerHTML = '<i class="fas fa-times"></i>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            });
    });

    pre.appendChild(codeEl);
    pre.appendChild(copyBtn);
    container.appendChild(pre);

    // Mark this container as using fallback
    container.setAttribute('data-using-fallback', 'true');

    return pre;
};

// KaTeX lazy loader for math rendering
window.loadKaTeXLibrary = function () {
    return new Promise((resolve, reject) => {
        if (window.katex) {
            resolve(window.katex);
            return;
        }
        if (window._katexLoading) {
            window._katexLoading.then(resolve).catch(reject);
            return;
        }
        window._katexLoading = new Promise((loadResolve, loadReject) => {
            // Load KaTeX CSS first
            if (!document.getElementById('katex-css')) {
                const link = document.createElement('link');
                link.id = 'katex-css';
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                console.log('KaTeX loaded successfully');
                loadResolve(window.katex);
            };
            script.onerror = (e) => {
                console.warn('KaTeX failed to load, math will show as plain text');
                loadReject(e);
            };
            document.head.appendChild(script);
        });
        window._katexLoading.then(resolve).catch(reject);
    });
};

// Render all unrendered math elements inside a container
window._renderMathElements = function (elements) {
    if (!window.katex || !elements || elements.length === 0) return;
    elements.forEach(el => {
        if (el.hasAttribute('data-math-rendered')) return;
        const math = el.getAttribute('data-math');
        if (!math) return;
        const isDisplay = el.classList.contains('math-display');
        try {
            el.innerHTML = window.katex.renderToString(math, {
                displayMode: isDisplay,
                throwOnError: false,
                output: 'html'
            });
            el.setAttribute('data-math-rendered', 'true');
        } catch (e) {
            // Leave as-is on KaTeX error
        }
    });
};

// Set up a MutationObserver to auto-render math when new math elements enter the DOM
window.setupMathRendering = function () {
    // Try to load KaTeX eagerly (will silently fail if offline)
    window.loadKaTeXLibrary().then(() => {
        // Render any math already in the DOM
        const existing = document.querySelectorAll('.math-display:not([data-math-rendered]), .math-inline:not([data-math-rendered])');
        window._renderMathElements(Array.from(existing));
    }).catch(() => {});

    const observer = new MutationObserver((mutations) => {
        const newMathEls = [];
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                if (node.classList && (node.classList.contains('math-display') || node.classList.contains('math-inline'))) {
                    newMathEls.push(node);
                }
                if (node.querySelectorAll) {
                    node.querySelectorAll('.math-display:not([data-math-rendered]), .math-inline:not([data-math-rendered])').forEach(el => newMathEls.push(el));
                }
            });
        });
        if (newMathEls.length === 0) return;
        // Debounce so streaming doesn't trigger excessive renders
        clearTimeout(window._mathRenderTimer);
        window._mathRenderTimer = setTimeout(() => {
            if (window.katex) {
                window._renderMathElements(newMathEls);
            } else {
                window.loadKaTeXLibrary().then(() => window._renderMathElements(newMathEls)).catch(() => {});
            }
        }, 80);
    });

    observer.observe(document.body, { childList: true, subtree: true });
};
