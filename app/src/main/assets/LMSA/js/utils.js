// Debug logging utility
import { highlightElement as shHighlight } from './syntax-highlighter.js';
let isDebugEnabled = false; // Debug mode disabled by default
let reasoningPanelIdCounter = 0;

// Utility functions

export function setDebugEnabled(enabled) {
    isDebugEnabled = enabled;
}

export function getDebugEnabled() {
    return isDebugEnabled;
}

export function debugLog(...args) {
    if (isDebugEnabled) {
        console.log(...args);
    }
}

export function debugError(...args) {
    if (isDebugEnabled) {
        console.error(...args);
    }
}

/**
 * Previously filtered out non-English characters, but now preserves all characters from all languages
 * This function now simply returns the original text without any filtering
 * @param {string} text - The text to process
 * @returns {string} - The original text with all characters preserved
 */
export function filterToEnglishCharacters(text) {
    // Simply return the original text without any filtering
    // This preserves all characters from all languages (Chinese, Japanese, Arabic, Cyrillic, etc.)
    return text;
}

/**
 * Normalizes reasoning tag aliases to <think>...</think> for a single render path.
 * @param {string} text - The text to normalize
 * @returns {string} - Text with normalized reasoning tags
 */
export function normalizeReasoningTags(text) {
    if (!text) return '';

    let normalized = String(text);
    normalized = normalized.replace(/<thinking>/gi, '<think>');
    normalized = normalized.replace(/<\/thinking>/gi, '</think>');
    normalized = normalized.replace(/<reason>/gi, '<think>');
    normalized = normalized.replace(/<\/reason>/gi, '</think>');
    normalized = normalized.replace(/<reasoning>/gi, '<think>');
    normalized = normalized.replace(/<\/reasoning>/gi, '</think>');

    return normalized;
}

const CODE_FENCE_LANGUAGES =
    'html|xml|css|javascript|js|typescript|ts|jsx|tsx|json|python|py|java|kotlin|kt|sql|bash|sh|shell|yaml|yml|c|cpp|plaintext|text';

const LANGUAGE_ALIASES = {
    'c#': 'csharp',
    csharp: 'csharp',
    cs: 'csharp',
    'c++': 'cpp',
    cpp: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    js: 'javascript',
    javascript: 'javascript',
    node: 'javascript',
    nodejs: 'javascript',
    ts: 'typescript',
    typescript: 'typescript',
    jsx: 'jsx',
    tsx: 'tsx',
    py: 'python',
    python: 'python',
    shell: 'bash',
    sh: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    kt: 'kotlin',
    md: 'markdown',
    markdown: 'markdown',
    golang: 'go',
    text: 'plaintext',
    plain: 'plaintext',
    'plain-text': 'plaintext',
    'language-javascript': 'javascript',
    'language-typescript': 'typescript',
    'language-python': 'python',
    'language-html': 'html',
    'language-css': 'css',
    'language-json': 'json',
    'language-sql': 'sql',
    'language-bash': 'bash',
    'language-yaml': 'yaml',
    'language-kotlin': 'kotlin',
    'language-java': 'java',
    'language-c': 'c',
    'language-cpp': 'cpp',
    'language-csharp': 'csharp',
    'language-go': 'go',
    'language-rust': 'rust',
    'language-php': 'php',
    'language-markdown': 'markdown'
};

function extractFenceLanguage(infoString) {
    const raw = String(infoString || '').trim();
    if (!raw) return '';
    const firstToken = raw.split(/\s+/)[0] || '';
    return firstToken.replace(/^language-/i, '');
}

function normalizeCodeLanguage(language, fallback = 'plaintext') {
    const raw = String(language || '').trim().toLowerCase();
    if (!raw) return fallback;

    const normalizedToken = raw
        .replace(/^language-/, '')
        .replace(/^lang-/, '')
        .replace(/\./g, '')
        .replace(/_/g, '-');

    if (LANGUAGE_ALIASES[normalizedToken]) {
        return LANGUAGE_ALIASES[normalizedToken];
    }

    if (/^c\+\+([0-9]{2})?$/.test(normalizedToken)) return 'cpp';
    if (/^(c#|csharp|dotnet)$/.test(normalizedToken)) return 'csharp';

    return normalizedToken || fallback;
}

function detectLanguageFromCode(codeContent) {
    if (!window.hljs || typeof window.hljs.highlightAuto !== 'function') return 'plaintext';

    const candidates = [
        'html', 'xml', 'css', 'javascript', 'typescript', 'json', 'yaml',
        'python', 'sql', 'bash', 'kotlin', 'java', 'c', 'cpp', 'csharp',
        'php', 'go', 'rust', 'markdown'
    ];

    try {
        const detected = window.hljs.highlightAuto(String(codeContent || ''), candidates);
        return normalizeCodeLanguage(detected && detected.language ? detected.language : 'plaintext');
    } catch (_error) {
        return 'plaintext';
    }
}

function highlightCodeBlockElement(codeElement, language) {
    if (!codeElement) return;

    const normalizedLanguage = normalizeCodeLanguage(language);
    const rawCode = codeElement.textContent || '';

    if (window.hljs && typeof window.hljs.highlightElement === 'function') {
        try {
            let hljsLanguage = normalizedLanguage;

            if (!window.hljs.getLanguage(hljsLanguage)) {
                hljsLanguage = detectLanguageFromCode(rawCode);
            }

            if (hljsLanguage && hljsLanguage !== 'plaintext' && window.hljs.getLanguage(hljsLanguage)) {
                codeElement.className = `language-${hljsLanguage}`;
            } else {
                codeElement.className = 'language-plaintext';
            }

            window.hljs.highlightElement(codeElement);
            return;
        } catch (_error) {
            // Fall through to the legacy highlighter.
        }
    }

    codeElement.className = normalizedLanguage === 'plaintext' ? 'language-plaintext' : `language-${normalizedLanguage}`;
    shHighlight(codeElement, normalizedLanguage);
}

// Expose on window for non-module scripts (e.g. external-libs-loader.js)
window.shHighlightElement = highlightCodeBlockElement;

function normalizeOpeningFence(prefix, language, followingText) {
    const fence = language ? '```' + language : '```';
    if (!followingText || followingText.startsWith('\n') || followingText.startsWith('\r\n')) {
        return prefix + fence;
    }
    return prefix + fence + '\n';
}

export function normalizeMalformedCodeFences(text) {
    if (!text) return '';

    let normalized = String(text);

    normalized = normalized.replace(
        new RegExp(
            '(^|\\n)``(' + CODE_FENCE_LANGUAGES + ')(?=(?:\\r?\\n|\\s*<!DOCTYPE|\\s*<\\/?[A-Za-z!]|\\s*[\\[{(]|\\s*[#.][A-Za-z_-]|\\s*[A-Za-z_][\\w-]*\\s*[:={(\\[]))',
            'gi'
        ),
        (match, prefix, language, offset, source) => {
            const followingText = source.slice(offset + match.length);
            return normalizeOpeningFence(prefix, language, followingText);
        }
    );

    normalized = normalized.replace(
        /(^|\n)``(?=(?:\r?\n|[ \t]*<!DOCTYPE|[ \t]*<\/?[A-Za-z!]|[ \t]*[\[{(]|[ \t]*[#.][A-Za-z_-]|[ \t]*[A-Za-z_][\w-]*\s*[:={(\[]))/g,
        (match, prefix, offset, source) => {
            const followingText = source.slice(offset + match.length);
            return normalizeOpeningFence(prefix, '', followingText);
        }
    );

    normalized = normalized.replace(/(^|\n)``(?=\s*(?:\r?\n|$))/g, '$1```');

    return normalized;
}

/**
 * Removes normalized reasoning sections from text while preserving non-reasoning output.
 * @param {string} text - The text to process
 * @returns {string} - Text without reasoning sections
 */
export function stripReasoningSections(text) {
    const normalized = normalizeReasoningTags(text);
    return normalized
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/<\/?think>/gi, '');
}

/**
 * Derives robust reasoning stream state from accumulated text.
 * @param {string} text - The current accumulated response
 * @returns {{normalizedText: string, hasThinking: boolean, inThinkingSection: boolean, contentAfterThink: string, activeThinkingContent: string}}
 */
export function getReasoningStreamState(text) {
    const normalizedText = normalizeReasoningTags(text);
    const openCount = (normalizedText.match(/<think>/gi) || []).length;
    const closeCount = (normalizedText.match(/<\/think>/gi) || []).length;
    const hasThinking = openCount > 0 || closeCount > 0;
    const inThinkingSection = openCount > closeCount;

    let contentAfterThink = '';
    const afterThinkMatch = normalizedText.match(/<\/think>([\s\S]*)$/i);
    if (afterThinkMatch && afterThinkMatch[1]) {
        contentAfterThink = afterThinkMatch[1].trim();
    }

    let activeThinkingContent = '';
    if (inThinkingSection) {
        const lower = normalizedText.toLowerCase();
        const openIdx = lower.lastIndexOf('<think>');
        if (openIdx !== -1) {
            activeThinkingContent = normalizedText.substring(openIdx + 7).replace(/<\/?think>/gi, '').trim();
        }
    }

    return {
        normalizedText,
        hasThinking,
        inThinkingSection,
        contentAfterThink,
        activeThinkingContent
    };
}

function buildReasoningPanelHtml(reasoningText) {
    const panelId = `reasoning-panel-${++reasoningPanelIdCounter}`;
    const steps = String(reasoningText || '')
        .split(/\n\s*\n+/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean)
        .map(paragraph => `<div class="reasoning-step">${escapeHtml(paragraph)}</div>`)
        .join('');

    if (!steps) return '';

    return `<section class="think" data-reasoning-panel="compact"><div class="reasoning-intro"><span class="reasoning-title"><i class="fas fa-brain"></i><span>Reasoning</span></span><button type="button" class="reasoning-toggle" onclick="toggleReasoningVisibility(this)" aria-expanded="false" aria-controls="${panelId}" title="Toggle reasoning details">Show details</button></div><div id="${panelId}" class="reasoning-content" hidden>${steps}</div></section>`;
}

/**
 * Removes <think> tags and their content from text
 * @param {string} text - The text to process
 * @returns {string} - The text with <think> tags and their content removed
 */
export function removeThinkTags(text) {
    if (!text) return text;

    // Make a copy of the text to avoid modifying the original
    let cleanedText = String(text);

    // Strategy: Be aggressive about removing thinking content while preserving actual response.
    // Handles multiple reasoning tag variants used by different models:
    //   <think>      — DeepSeek-R1, Qwen-QwQ, etc.
    //   <thinking>   — Claude extended thinking, some OpenAI o-series wrappers
    //   <reason>     — some fine-tuned models
    //   <reasoning>  — some fine-tuned models

    // Step 1: Remove all complete tag pairs (case-insensitive)
    cleanedText = cleanedText.replace(/<think>[\s\S]*?<\/think>/gi, '');
    cleanedText = cleanedText.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    cleanedText = cleanedText.replace(/<reason>[\s\S]*?<\/reason>/gi, '');
    cleanedText = cleanedText.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

    // Step 2: Handle unclosed opening tags — remove the tag and everything after it.
    // This prevents thinking content from leaking into the actual response when the
    // model was truncated mid-thought.
    const lc = cleanedText.toLowerCase();
    for (const tag of ['<think>', '<thinking>', '<reason>', '<reasoning>']) {
        const closeTag = tag.replace('<', '</');
        const openIdx = lc.lastIndexOf(tag);
        const closeIdx = lc.lastIndexOf(closeTag);
        if (openIdx !== -1 && openIdx > closeIdx) {
            cleanedText = cleanedText.substring(0, openIdx);
        }
    }

    // Step 3: HTML-escaped <think> pairs and unclosed tags (legacy handling)
    const lastEscapedClosing = cleanedText.lastIndexOf('&lt;/think&gt;');
    const lastEscapedOpening = cleanedText.lastIndexOf('&lt;think&gt;');

    if (lastEscapedOpening > lastEscapedClosing) {
        const removeStart = lastEscapedOpening;
        const removeEnd = cleanedText.indexOf('&lt;/think&gt;', removeStart);
        if (removeEnd === -1) {
            // No closing tag - remove everything from opening tag
            cleanedText = cleanedText.substring(0, removeStart);
        } else {
            // Has closing tag - remove from opening to closing tag
            cleanedText = cleanedText.substring(0, removeStart) + cleanedText.substring(removeEnd + '&lt;/think&gt;'.length);
        }
    }

    // Step 4: Remove any remaining standalone tags (open or close)
    cleanedText = cleanedText.replace(/<\/?think>/gi, '');
    cleanedText = cleanedText.replace(/<\/?thinking>/gi, '');
    cleanedText = cleanedText.replace(/<\/?reason>/gi, '');
    cleanedText = cleanedText.replace(/<\/?reasoning>/gi, '');

    // Remove HTML-escaped complete pairs and any remaining standalone escaped tags
    cleanedText = cleanedText.replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/g, '');
    cleanedText = cleanedText.replace(/&lt;\/?think&gt;/g, '');
    cleanedText = cleanedText.replace(/&lt;\/?thinking&gt;/g, '');
    cleanedText = cleanedText.replace(/&lt;\/?reason(ing)?&gt;/g, '');

    // Trim any extra whitespace
    return cleanedText.trim();
}

// Utility functions

/**
 * Detects if content contains HTML-like patterns that should be displayed as code
 * @param {string} content - The content to check
 * @returns {boolean} - True if content appears to be HTML code
 */
function isHtmlContent(content) {
    if (!content) return false;

    const normalizedContent = normalizeMalformedCodeFences(content);

    // If the content contains markdown code fences (```), it's markdown,
    // NOT raw HTML. Let the normal markdown parser handle code blocks.
    if (/```/.test(normalizedContent)) {
        return false;
    }

    // Check for HTML_CODE_BLOCK markers and extract content
    if (normalizedContent.includes('[HTML_CODE_BLOCK_START]') && normalizedContent.includes('[HTML_CODE_BLOCK_END]')) {
        const startMarker = normalizedContent.indexOf('[HTML_CODE_BLOCK_START]');
        const endMarker = normalizedContent.indexOf('[HTML_CODE_BLOCK_END]');
        if (startMarker !== -1 && endMarker !== -1) {
            const markerLength = 22; // Length of [HTML_CODE_BLOCK_START]
            const extractedContent = normalizedContent.substring(startMarker + markerLength, endMarker);
            return isHtmlContentRaw(extractedContent);
        }
    }

    // Check raw content
    return isHtmlContentRaw(normalizedContent);
}

/**
 * Detects if raw content contains HTML-like patterns
 * @param {string} content - The raw content to check
 * @returns {boolean} - True if content appears to be HTML code
 */
function isHtmlContentRaw(content) {
    if (!content) return false;

    const trimmed = content.trim();

    // The content should START with an HTML construct to be considered raw HTML.
    // This prevents false positives on "Here is a calculator:\n<html>..."
    const startsWithHtml = /^(<\!DOCTYPE\s|<html[\s>]|<head[\s>]|<body[\s>]|<div[\s>]|<meta[\s>]|<link[\s>]|<style[\s>]|<script[\s>])/i.test(trimmed);
    if (!startsWithHtml) return false;

    // Also require at least a couple of HTML tags to avoid false positives
    const tagCount = (trimmed.match(/<\/?[a-zA-Z][a-zA-Z0-9]*[\s>]/g) || []).length;
    return tagCount >= 3;
}

/**
 * Formats HTML content for display as code text
 * @param {string} htmlContent - The HTML content to format
 * @returns {string} - Formatted HTML for display
 */
function formatHtmlAsCode(htmlContent) {
    let content = normalizeMalformedCodeFences(htmlContent);

    // Extract content from code blocks if present
    const codeBlockMatch = content.match(/```html?\s*\n([\s\S]*?)```/i);
    if (codeBlockMatch) {
        content = codeBlockMatch[1];
    }

    // Remove HTML_CODE_BLOCK markers if present
    if (content.includes('[HTML_CODE_BLOCK_START]') && content.includes('[HTML_CODE_BLOCK_END]')) {
        const startMarker = content.indexOf('[HTML_CODE_BLOCK_START]');
        const endMarker = content.indexOf('[HTML_CODE_BLOCK_END]');
        if (startMarker !== -1 && endMarker !== -1) {
            const markerLength = 22;
            content = content.substring(startMarker + markerLength, endMarker);
        }
    }

    // Remove other HTML markers
    content = content
        .replace(/\[HTML_CODE_BLOCK\]/g, '')
        .replace(/\[\/HTML_CODE_BLOCK\]/g, '')
        .replace(/\[HTMLCODEBLOCK\]/g, '')
        .replace(/\[\/HTMLCODEBLOCK\]/g, '')
        .replace(/\[HTML_CODE_BLOCK_EXACT\]/g, '')
        .replace(/\[\/HTML_CODE_BLOCK_EXACT\]/g, '');

    // Emit a proper pre>code block so Highlight.js can apply syntax colours.
    // Escape only the minimum needed so the text is safe inside a <code> element.
    const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `<pre data-multiline="true" data-language="html"><code class="language-html">${escaped}</code></pre>`;
}

/**
 * Restores math placeholders in sanitized HTML, wrapping them in
 * styled elements for KaTeX auto-rendering.
 */
function restoreMathPlaceholders(sanitized, displayPlaceholders, inlinePlaceholders) {
    displayPlaceholders.forEach((math, id) => {
        const placeholder = 'XXMATHDISP' + id + 'ENDMATHDISPXX';
        const safeAttr = math.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const html = '<div class="math-display" data-math="' + safeAttr + '">' + safeAttr + '</div>';
        sanitized = sanitized.replace(new RegExp('<p>\\s*' + placeholder + '\\s*<\\/p>', 'g'), html);
        sanitized = sanitized.replace(new RegExp(placeholder, 'g'), html);
    });
    inlinePlaceholders.forEach((math, id) => {
        const placeholder = 'XXMATHINL' + id + 'ENDMATHINLXX';
        const safeAttr = math.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        sanitized = sanitized.replace(
            new RegExp(placeholder, 'g'),
            '<span class="math-inline" data-math="' + safeAttr + '">' + safeAttr + '</span>'
        );
    });
    return sanitized;
}

function isCodeBlockPlaceholder(line) {
    return /^LMSACODEBLOCKPLACEHOLDER\d+ENDLMSA$/.test(line);
}

function isBlockLevelHtmlLine(line) {
    return /^<(h[1-6]|div|ul|ol|li|pre|blockquote|table|thead|tbody|tr|td|th|hr|section)\b/i.test(line) || isCodeBlockPlaceholder(line);
}

function mergeSoftLineBreaks(text) {
    if (!text) return text;

    const lines = String(text).split('\n');
    const merged = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Preserve explicit paragraph breaks.
        if (!trimmed) {
            merged.push('');
            continue;
        }

        const currentIsBlock = isBlockLevelHtmlLine(trimmed);
        const previous = merged.length > 0 ? merged[merged.length - 1] : null;
        const previousTrimmed = previous ? previous.trim() : '';
        const previousIsBlock = previousTrimmed ? isBlockLevelHtmlLine(previousTrimmed) : false;

        // Merge soft-wrapped lines into the previous line when both are plain text.
        if (previous && previousTrimmed && !previousIsBlock && !currentIsBlock) {
            merged[merged.length - 1] = previous.replace(/\s+$/, '') + ' ' + trimmed;
            continue;
        }

        merged.push(line);
    }

    return merged.join('\n');
}

function decodeHtmlOnce(html) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(html || '');
    return textarea.value;
}

function renderCodeBlockHtml(language, code, extraAttributes = '') {
    const normalizedLanguage = normalizeCodeLanguage(extractFenceLanguage(language), 'plaintext');
    const rawCode = decodeHtmlOnce(code).replace(/\r\n?/g, '\n').replace(/\n$/, '');
    const formattedCode = escapeHtml(rawCode).split('\n').join('<br>');
    const attributeSuffix = extraAttributes ? ' ' + extraAttributes : '';
    return `<pre data-multiline="true" data-language="${normalizedLanguage}"${attributeSuffix}><code class="language-${normalizedLanguage}">${formattedCode}</code></pre>`;
}

function createCodeBlockPlaceholder(codeBlockHtml, codeBlockPlaceholders) {
    if (!codeBlockPlaceholders) return codeBlockHtml;

    const placeholder = `LMSACODEBLOCKPLACEHOLDER${codeBlockPlaceholders.length}ENDLMSA`;
    codeBlockPlaceholders.push({ placeholder, html: codeBlockHtml });
    return `\n${placeholder}\n`;
}

function replaceMarkdownCodeBlocks(sanitized, extraAttributes = '', codeBlockPlaceholders = null) {
    let rendered = sanitized.replace(/```([^\n`]*)\r?\n([\s\S]*?)```/g, (match, languageInfo, code) => {
        return createCodeBlockPlaceholder(
            renderCodeBlockHtml(languageInfo, code, extraAttributes),
            codeBlockPlaceholders
        );
    });

    // While streaming, an opening fence can arrive before the closing fence.
    // Keep the trailing content inside a provisional code block so lines don't
    // jump in and out of the snippet as more chunks arrive.
    rendered = rendered.replace(/(^|\n)```([^\n`]*)\r?\n([\s\S]*)$/g, (match, prefix, languageInfo, code) => {
        return prefix + createCodeBlockPlaceholder(
            renderCodeBlockHtml(languageInfo, code, extraAttributes),
            codeBlockPlaceholders
        );
    });

    return rendered;
}

function restoreCodeBlockPlaceholders(sanitized, codeBlockPlaceholders) {
    if (!codeBlockPlaceholders || codeBlockPlaceholders.length === 0) return sanitized;

    codeBlockPlaceholders.forEach(({ placeholder, html }) => {
        sanitized = sanitized.replace(new RegExp('<p>\\s*' + placeholder + '\\s*<\\/p>', 'g'), html);
        sanitized = sanitized.replace(new RegExp(placeholder, 'g'), html);
    });

    return sanitized;
}

/**
 * Sanitizes input for non-reasoning models
 * @param {string} input - The input text to sanitize
 * @returns {string} - Sanitized HTML
 */
export function basicSanitizeInput(input) {
    // First, remove any <think> tags that might be present
    let processedInput = normalizeMalformedCodeFences(stripReasoningSections(input));
    const codeBlockPlaceholders = [];

    // Extract math expressions before HTML escaping to prevent paragraph fragmentation
    const mathDisplayPlaceholders = [];
    const mathInlinePlaceholders = [];
    processedInput = processedInput.replace(/\$\$([\s\S]*?)\$\$/g, (_match, content) => {
        const id = mathDisplayPlaceholders.length;
        mathDisplayPlaceholders.push(content.trim());
        return '\nXXMATHDISP' + id + 'ENDMATHDISPXX\n';
    });
    // Handle \[...\] display math (used by many LLMs including OpenRouter models)
    processedInput = processedInput.replace(/\\\[([\s\S]*?)\\\]/g, (_match, content) => {
        const id = mathDisplayPlaceholders.length;
        mathDisplayPlaceholders.push(content.trim());
        return '\nXXMATHDISP' + id + 'ENDMATHDISPXX\n';
    });
    processedInput = processedInput.replace(/\$([^\$\n]+?)\$/g, (_match, content) => {
        // Skip plain dollar amounts (e.g. $3.99)
        if (/^[\d,.\s]+$/.test(content.trim())) return _match;
        const id = mathInlinePlaceholders.length;
        mathInlinePlaceholders.push(content);
        return 'XXMATHINL' + id + 'ENDMATHINLXX';
    });
    // Handle \(...\) inline math (used by many LLMs including OpenRouter models)
    processedInput = processedInput.replace(/\\\(([\s\S]*?)\\\)/g, (_match, content) => {
        const id = mathInlinePlaceholders.length;
        mathInlinePlaceholders.push(content);
        return 'XXMATHINL' + id + 'ENDMATHINLXX';
    });

    // Check if the entire content appears to be HTML code
    if (isHtmlContent(processedInput)) {
        // Format as HTML code display
        return `<div class="html-code-container">${formatHtmlAsCode(processedInput)}</div>`;
    }

    // Escape HTML for XSS prevention
    const div = document.createElement('div');
    div.textContent = processedInput;
    let sanitized = div.innerHTML;

    // Handle code blocks with language specification. The whole message has
    // already been escaped above, so code fence content is safe here and
    // should not be entity-escaped a second time.
    sanitized = replaceMarkdownCodeBlocks(sanitized, '', codeBlockPlaceholders);

    // Handle inline code
    sanitized = sanitized.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle headers
    sanitized = sanitized.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    sanitized = sanitized.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    sanitized = sanitized.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    sanitized = sanitized.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    sanitized = sanitized.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    sanitized = sanitized.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Handle lists
    sanitized = sanitized.replace(/^\* (.+)$/gm, '<li>$1</li>');
    sanitized = sanitized.replace(/^- (.+)$/gm, '<li>$1</li>');
    sanitized = sanitized.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap lists in appropriate containers
    sanitized = sanitized.replace(/(<li>.*?<\/li>\n*)+/g, '<ul>$&</ul>');

    // Handle emphasis and strong
    sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
    sanitized = sanitized.replace(/_(.+?)_/g, '<em>$1</em>');

    // Handle links
    sanitized = sanitized.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300">$1</a>');

    // Handle horizontal rules
    sanitized = sanitized.replace(/^(?:---|\.{3}|\*\*\*|___)$/gm, '<hr>');

    // Handle markdown tables
    sanitized = sanitized.replace(
        /^(\|.+\|[ \t]*)\n(\|[-:| \t]+\|[ \t]*)\n((?:\|.+\|[ \t]*\n?)+)/gm,
        (match, headerRow, separatorRow, bodyRows) => {
            const headers = headerRow.split('|').slice(1, -1).map(h => h.trim());
            const separators = separatorRow.split('|').slice(1, -1).map(s => s.trim());
            const alignments = separators.map(s => {
                if (s.startsWith(':') && s.endsWith(':')) return 'center';
                if (s.endsWith(':')) return 'right';
                return 'left';
            });
            const theadHtml = '<thead><tr>' +
                headers.map((h, i) => `<th style="text-align:${alignments[i] || 'left'}">${h}</th>`).join('') +
                '</tr></thead>';
            const rows = bodyRows.trim().split('\n').filter(row => row.trim() && row.includes('|'));
            const tbodyHtml = '<tbody>' +
                rows.map(row => {
                    const cells = row.split('|').slice(1, -1).map(c => c.trim());
                    return '<tr>' +
                        cells.map((c, i) => `<td style="text-align:${alignments[i] || 'left'}">${c}</td>`).join('') +
                        '</tr>';
                }).join('') +
                '</tbody>';
            return `<div class="table-wrapper"><table class="markdown-table">${theadHtml}${tbodyHtml}</table></div>`;
        }
    );

    // Merge soft line wraps to avoid unintended one-line paragraphs.
    const normalizedParagraphText = mergeSoftLineBreaks(sanitized);

    // Handle paragraphs - explicit blank lines still create separate paragraphs.
    const paragraphs = normalizedParagraphText.split(/\n/);
    sanitized = paragraphs.map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';

        // Don't wrap block-level HTML elements in <p> tags
        if (/^<(h[1-6]|div|ul|ol|li|pre|blockquote|table|thead|tbody|tr|td|th|hr)\b/.test(trimmed)) {
            return trimmed;
        }

        // Check if this line contains HTML-like content that should be displayed as text
        // Look for patterns like &lt;tag&gt; which indicate escaped HTML
        const hasEscapedHtml = /&lt;\/?[a-zA-Z][^&]*&gt;/.test(trimmed);

        if (hasEscapedHtml) {
            // For lines containing escaped HTML, use a pre-formatted style to preserve formatting
            return `<div class="html-code-line">${trimmed}</div>`;
        } else {
            // Regular paragraph handling
            return `<p>${trimmed}</p>`;
        }
    }).join('\n');

    sanitized = restoreCodeBlockPlaceholders(sanitized, codeBlockPlaceholders);
    sanitized = restoreMathPlaceholders(sanitized, mathDisplayPlaceholders, mathInlinePlaceholders);
    return sanitized;
}

/**
 * Sanitizes input with thinking tag processing
 * @param {string} input - The input text to sanitize
 * @returns {string} - Sanitized HTML with thinking tags processed
 */
export function sanitizeInput(input) {
    // First extract all <think> tag contents before any HTML escaping
    let processedInput = normalizeMalformedCodeFences(normalizeReasoningTags(input));
    const codeBlockPlaceholders = [];

    // Extract math expressions before anything else to prevent fragmentation
    const mathDisplayPlaceholders = [];
    const mathInlinePlaceholders = [];
    processedInput = processedInput.replace(/\$\$([\s\S]*?)\$\$/g, (_match, content) => {
        const id = mathDisplayPlaceholders.length;
        mathDisplayPlaceholders.push(content.trim());
        return '\nXXMATHDISP' + id + 'ENDMATHDISPXX\n';
    });
    // Handle \[...\] display math (used by many LLMs including OpenRouter models)
    processedInput = processedInput.replace(/\\\[([\s\S]*?)\\\]/g, (_match, content) => {
        const id = mathDisplayPlaceholders.length;
        mathDisplayPlaceholders.push(content.trim());
        return '\nXXMATHDISP' + id + 'ENDMATHDISPXX\n';
    });
    processedInput = processedInput.replace(/\$([^\$\n]+?)\$/g, (_match, content) => {
        if (/^[\d,.\s]+$/.test(content.trim())) return _match;
        const id = mathInlinePlaceholders.length;
        mathInlinePlaceholders.push(content);
        return 'XXMATHINL' + id + 'ENDMATHINLXX';
    });
    // Handle \(...\) inline math (used by many LLMs including OpenRouter models)
    processedInput = processedInput.replace(/\\\(([\s\S]*?)\\\)/g, (_match, content) => {
        const id = mathInlinePlaceholders.length;
        mathInlinePlaceholders.push(content);
        return 'XXMATHINL' + id + 'ENDMATHINLXX';
    });

    const thinkMatches = [];
    let hasThinkTag = false;

    // Find all <think> sections and store them
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    let match;
    while ((match = thinkRegex.exec(processedInput)) !== null) {
        // Only consider think tags with meaningful content (not just whitespace)
        const content = match[1].trim();
        if (content.length > 0) {
            thinkMatches.push({
                fullMatch: match[0],
                content: match[1]
            });
            hasThinkTag = true;
        }
    }

    // Some providers stream multiple <think>...</think> segments in one response.
    // Merge them so the UI renders a single reasoning panel per assistant message.
    const combinedThinkContent = thinkMatches
        .map(entry => String(entry.content || '').trim())
        .filter(Boolean)
        .join('\n\n');

    // Remove think tags to check if remaining content is HTML
    const contentWithoutThink = processedInput.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Check if the content (excluding think tags) appears to be HTML code
    if (contentWithoutThink && isHtmlContent(contentWithoutThink)) {
        // Format as HTML code display, but preserve think tags if they exist
        let result = '';
        
        // Add think sections first if they exist
        if (hasThinkTag && combinedThinkContent) {
            result += buildReasoningPanelHtml(combinedThinkContent);
        }
        
        // Add the HTML content formatted as code
        result += `<div class="html-code-container">${formatHtmlAsCode(contentWithoutThink)}</div>`;
        
        return result;
    }

    // Now escape HTML for XSS prevention
    const div = document.createElement('div');
    div.textContent = processedInput;
    let sanitized = div.innerHTML;

    // Replace the escaped <think> tags with properly formatted HTML
    if (thinkMatches.length > 0) {
        const escapedMatches = thinkMatches.map(entry =>
            entry.fullMatch.replace(/</g, '&lt;').replace(/>/g, '&gt;')
        );

        const firstEscapedMatch = escapedMatches[0];
        const mergedPanelHtml = combinedThinkContent
            ? buildReasoningPanelHtml(combinedThinkContent)
            : '';

        sanitized = sanitized.replace(firstEscapedMatch, mergedPanelHtml);

        for (let i = 1; i < escapedMatches.length; i++) {
            sanitized = sanitized.replace(escapedMatches[i], '');
        }
    }

    // If we didn't replace any think tags but they exist in the text,
    // mark the output with a special class for CSS targeting
    if (hasThinkTag && thinkMatches.length === 0) {
        sanitized = `<div class="contains-think-tag">${sanitized}</div>`;
    }

    // Handle thinking sections (legacy format)
    sanitized = sanitized.replace(/Let's approach this step by step:\n/g, '<div class="think"><div class="reasoning-intro">Let\'s approach this step by step:</div>');
    sanitized = sanitized.replace(/^(\d+\)\s*.*?)(?=\n\d+\)|$)/gm, '<div class="reasoning-step">$1</div>');

    // Handle raw think tags that might have been escaped
    sanitized = sanitized.replace(/&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/g, (match, content) => {
        // Only create reasoning header if content is not empty or just whitespace
        const trimmedContent = content.trim();
        if (trimmedContent.length > 0) {
            return buildReasoningPanelHtml(trimmedContent);
        } else {
            // For empty think tags, return empty string (remove them completely)
            return '';
        }
    });

    // Process text after think tags to ensure proper spacing
    // This regex finds content after the last </think> tag
    if (hasThinkTag) {
        const afterThinkRegex = /&lt;\/think&gt;([\s\S]*)$/;
        const afterThinkMatch = sanitized.match(afterThinkRegex);

        if (afterThinkMatch && afterThinkMatch[1]) {
            // Get the content after the last think tag
            let afterContent = afterThinkMatch[1];

            // Apply paragraph styling to content after think tags
            const afterParagraphs = mergeSoftLineBreaks(afterContent).split(/\n/);
            afterContent = afterParagraphs.map(p => p.trim() ? `<p>${p}</p>` : '').join('\n');
            afterContent = afterContent.replace(/<\/p>\s*<p>/g, '</p><p style="margin-top: 1.5em;">');

            // Wrap the entire content after </think> in a visible div
            afterContent = `<div class="visible-after-think" style="display: block !important; visibility: visible !important; opacity: 1 !important; color: var(--text-primary) !important;">${afterContent}</div>`;

            // Replace the original content after think tag with the styled version
            sanitized = sanitized.replace(afterThinkRegex, `&lt;/think&gt;${afterContent}`);
        }
    }

    // Handle code blocks with language specification. The full message has
    // already been HTML-escaped, so preserve the code text as-is here.
    sanitized = replaceMarkdownCodeBlocks(
        sanitized,
        `data-has-thinking="${hasThinkTag ? 'true' : 'false'}"`,
        codeBlockPlaceholders
    );

    // Handle inline code
    sanitized = sanitized.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle headers
    sanitized = sanitized.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
    sanitized = sanitized.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
    sanitized = sanitized.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    sanitized = sanitized.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    sanitized = sanitized.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    sanitized = sanitized.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Handle lists
    sanitized = sanitized.replace(/^\* (.+)$/gm, '<li>$1</li>');
    sanitized = sanitized.replace(/^- (.+)$/gm, '<li>$1</li>');
    sanitized = sanitized.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap lists in appropriate containers
    sanitized = sanitized.replace(/(<li>.*?<\/li>\n*)+/g, '<ul>$&</ul>');

    // Handle emphasis and strong
    sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
    sanitized = sanitized.replace(/_(.+?)_/g, '<em>$1</em>');

    // Handle links
    sanitized = sanitized.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300">$1</a>');

    // Handle horizontal rules
    sanitized = sanitized.replace(/^(?:---|\.{3}|\*\*\*|___)$/gm, '<hr>');

    // Handle markdown tables
    sanitized = sanitized.replace(
        /^(\|.+\|[ \t]*)\n(\|[-:| \t]+\|[ \t]*)\n((?:\|.+\|[ \t]*\n?)+)/gm,
        (match, headerRow, separatorRow, bodyRows) => {
            const headers = headerRow.split('|').slice(1, -1).map(h => h.trim());
            const separators = separatorRow.split('|').slice(1, -1).map(s => s.trim());
            const alignments = separators.map(s => {
                if (s.startsWith(':') && s.endsWith(':')) return 'center';
                if (s.endsWith(':')) return 'right';
                return 'left';
            });
            const theadHtml = '<thead><tr>' +
                headers.map((h, i) => `<th style="text-align:${alignments[i] || 'left'}">${h}</th>`).join('') +
                '</tr></thead>';
            const rows = bodyRows.trim().split('\n').filter(row => row.trim() && row.includes('|'));
            const tbodyHtml = '<tbody>' +
                rows.map(row => {
                    const cells = row.split('|').slice(1, -1).map(c => c.trim());
                    return '<tr>' +
                        cells.map((c, i) => `<td style="text-align:${alignments[i] || 'left'}">${c}</td>`).join('') +
                        '</tr>';
                }).join('') +
                '</tbody>';
            return `<div class="table-wrapper"><table class="markdown-table">${theadHtml}${tbodyHtml}</table></div>`;
        }
    );

    // Merge soft line wraps to avoid unintended one-line paragraphs.
    const normalizedParagraphText = mergeSoftLineBreaks(sanitized);

    // Handle paragraphs - explicit blank lines still create separate paragraphs.
    const paragraphs = normalizedParagraphText.split(/\n/);
    sanitized = paragraphs.map(p => {
        const trimmed = p.trim();
        if (!trimmed) return '';

        // Don't wrap block-level HTML elements in <p> tags
        if (/^<(h[1-6]|div|ul|ol|li|pre|blockquote|table|thead|tbody|tr|td|th|hr)\b/.test(trimmed)) {
            return trimmed;
        }

        // Check if this line contains HTML-like content that should be displayed as text
        // Look for patterns like &lt;tag&gt; which indicate escaped HTML
        const hasEscapedHtml = /&lt;\/?[a-zA-Z][^&]*&gt;/.test(trimmed);

        if (hasEscapedHtml) {
            // For lines containing escaped HTML, use a pre-formatted style to preserve formatting
            return `<div class="html-code-line">${trimmed}</div>`;
        } else {
            // Regular paragraph handling
            return `<p>${trimmed}</p>`;
        }
    }).join('\n');

    // Close thinking section div if it was opened
    if (sanitized.includes('think') && !sanitized.includes('reasoning-content')) {
        sanitized += '</div>';
    }

    sanitized = restoreCodeBlockPlaceholders(sanitized, codeBlockPlaceholders);
    sanitized = restoreMathPlaceholders(sanitized, mathDisplayPlaceholders, mathInlinePlaceholders);
    return sanitized;
}

/**
 * Escapes HTML special characters in a string
 * @param {string} unsafe - The string to escape
 * @returns {string} - The escaped string
 */
export function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function extractCodeTextFromElement(codeElement) {
    if (!codeElement) return '';

    const clone = codeElement.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => {
        br.replaceWith(document.createTextNode('\n'));
    });

    return (clone.textContent || '').replace(/\r\n?/g, '\n');
}

/**
 * Initializes basic code blocks with copy functionality
 * @param {HTMLElement} element - The element containing code blocks
 */
export function initializeCodeMirror(element) {
    if (!element) return;

    setTimeout(() => {
        const contentContainer = element.querySelector('.message-content');
        if (!contentContainer) return;

        // Use event delegation to handle copy button clicks for all code containers
        // This avoids the issue of multiple event listeners on the same element
        if (!contentContainer.hasAttribute('data-copy-delegation-added')) {
            contentContainer.setAttribute('data-copy-delegation-added', 'true');

            contentContainer.addEventListener('click', (e) => {
                // Handle HTML code container clicks (now rendered as pre[data-multiline])
                // The outer .html-code-container wraps a pre; copy button is on the pre
                const htmlContainer = e.target.closest('.html-code-container');
                if (htmlContainer) {
                    // Delegate to the pre click handler below – nothing extra needed here.
                }

                // Handle pre element clicks
                const preElement = e.target.closest('pre[data-multiline="true"]');
                if (preElement) {
                    const rect = preElement.getBoundingClientRect();
                    const isTopRightCorner = (
                        e.clientX >= rect.right - 40 &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.top + 40
                    );

                    // Get the computed style to check if we're hovering over the ::before element
                    const computedStyle = window.getComputedStyle(preElement, '::before');
                    const buttonVisible = computedStyle.getPropertyValue('content') !== 'none';

                    // If clicked in top-right corner or on "Copy" button
                    if (isTopRightCorner && buttonVisible) {
                        e.preventDefault();
                        e.stopPropagation();

                        debugLog('Click on copy button');
                        // Copy the normalized raw code, not the rendered DOM output.
                        let text = typeof preElement._rawCodeText === 'string'
                            ? preElement._rawCodeText
                            : extractCodeTextFromElement(preElement.querySelector('code'));

                        // Remove thinking tags from the text before copying
                        text = removeThinkTags(text);

                        // Log the copied text for debugging
                        debugLog('Copying text:', text);

                        copyToClipboard(text);

                        // Visual feedback
                        preElement.setAttribute('data-copied', 'true');
                        setTimeout(() => {
                            preElement.removeAttribute('data-copied');
                        }, 2000);
                    }
                }
            });
        }

        const codeBlocks = contentContainer.querySelectorAll('pre code');

        // No code blocks found, nothing to do
        if (!codeBlocks.length) return;

        // Mark the message element as having code blocks for CSS styling
        element.classList.add('has-code-blocks');

        // Process code blocks to ensure they have proper styling and copy functionality
        codeBlocks.forEach(block => {
            const pre = block.closest('pre');
            if (!pre) return;
            const languageMatch = block.className.match(/language-([A-Za-z0-9+#_.-]+)/);
            const requestedLanguage = pre.getAttribute('data-language') || (languageMatch ? languageMatch[1] : '') || 'plaintext';
            const language = normalizeCodeLanguage(requestedLanguage, 'plaintext');
            
            // Add language as data attribute for styling
            pre.setAttribute('data-language', language);
            pre.setAttribute('data-multiline', 'true');

            // Get the code content from the DOM so line breaks survive copy/reload.
            let codeContent = extractCodeTextFromElement(block);

            // Check for special HTML markers and clean them up
            const hasHtmlMarkers = codeContent.includes('[HTML_CODE_BLOCK') ||
                                 codeContent.includes('[HTMLCODEBLOCK');

            if (hasHtmlMarkers) {
                // Find and extract content between markers
                let startMarker = -1, endMarker = -1, markerLength = 0;

                if (codeContent.includes('[HTML_CODE_BLOCK_START]')) {
                    startMarker = codeContent.indexOf('[HTML_CODE_BLOCK_START]');
                    endMarker = codeContent.indexOf('[HTML_CODE_BLOCK_END]');
                    markerLength = 22;
                } else if (codeContent.includes('[HTMLCODEBLOCK]')) {
                    startMarker = codeContent.indexOf('[HTMLCODEBLOCK]');
                    endMarker = codeContent.indexOf('[/HTMLCODEBLOCK]');
                    markerLength = 14;
                } else if (codeContent.includes('[HTML_CODE_BLOCK]')) {
                    startMarker = codeContent.indexOf('[HTML_CODE_BLOCK]');
                    endMarker = codeContent.indexOf('[/HTML_CODE_BLOCK]');
                    markerLength = 17;
                }

                if (startMarker !== -1 && endMarker !== -1) {
                    codeContent = codeContent.substring(startMarker + markerLength, endMarker);
                }
            }

            // Clean up any remaining markers
            codeContent = codeContent
                .replace(/\[HTMLCODEBLOCKSTART\]/g, '')
                .replace(/\[HTMLCODEBLOCKEND\]/g, '')
                .replace(/\[HTML_CODE_BLOCK\]/g, '')
                .replace(/\[\/HTML_CODE_BLOCK\]/g, '')
                .replace(/\[HTMLCODEBLOCK\]/g, '')
                .replace(/\[\/HTMLCODEBLOCK\]/g, '')
                .replace(/\[HTML_CODE_BLOCK_EXACT\]/g, '')
                .replace(/\[\/HTML_CODE_BLOCK_EXACT\]/g, '');

            pre._rawCodeText = codeContent;

            // Update the block content
            block.textContent = codeContent;

            // Apply syntax highlighting using Highlight.js when available.
            highlightCodeBlockElement(block, language);
        });
    }, 50);
}

/**
 * Converts HTML content to formatted plain text, preserving paragraph breaks and line spacing
 * @param {HTMLElement|string} content - The HTML element or HTML string to convert
 * @returns {string} - Formatted plain text with preserved spacing
 */
export function htmlToFormattedText(content) {
    let element;
    
    if (typeof content === 'string') {
        // Create a temporary element to parse the HTML string
        element = document.createElement('div');
        element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        // Clone the element to avoid modifying the original
        element = content.cloneNode(true);
    } else {
        return '';
    }
    
    // Remove any thinking/reasoning sections from the clone
    const thinkSections = element.querySelectorAll('.think, .reasoning-intro, .reasoning-content, .reasoning-step');
    thinkSections.forEach(section => section.remove());
    
    // Function to recursively convert HTML to formatted text
    function processNode(node) {
        let result = '';
        
        for (let child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                // Add text content, preserving whitespace
                const text = child.textContent;
                result += text;
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tagName = child.tagName.toLowerCase();
                
                switch (tagName) {
                    case 'p':
                        // Paragraphs get double line breaks
                        result += processNode(child) + '\n\n';
                        break;
                    case 'div':
                        // Divs get single line breaks unless they're empty
                        const divContent = processNode(child);
                        if (divContent.trim()) {
                            result += divContent + '\n';
                        }
                        break;
                    case 'br':
                        // Line breaks
                        result += '\n';
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        // Headers get extra spacing
                        result += '\n' + processNode(child) + '\n\n';
                        break;
                    case 'ul':
                    case 'ol':
                        // Lists get spacing before and after
                        result += '\n' + processNode(child) + '\n';
                        break;
                    case 'li':
                        // List items get bullet points or numbers (simplified to bullets)
                        result += '• ' + processNode(child) + '\n';
                        break;
                    case 'blockquote':
                        // Blockquotes get indentation
                        const quoteContent = processNode(child);
                        result += '\n' + quoteContent.split('\n').map(line => 
                            line.trim() ? '> ' + line : ''
                        ).join('\n') + '\n\n';
                        break;
                    case 'pre':
                    case 'code':
                        // Code blocks preserve formatting
                        result += processNode(child);
                        break;
                    case 'strong':
                    case 'b':
                        // Bold text (keep as is for plain text)
                        result += processNode(child);
                        break;
                    case 'em':
                    case 'i':
                        // Italic text (keep as is for plain text)
                        result += processNode(child);
                        break;
                    default:
                        // For other elements, just process their content
                        result += processNode(child);
                        break;
                }
            }
        }
        
        return result;
    }
    
    let formattedText = processNode(element);
    
    // Clean up excessive line breaks (more than 2 consecutive)
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
    
    // Trim leading and trailing whitespace
    formattedText = formattedText.trim();
    
    return formattedText;
}

/**
 * Copies text to clipboard with fallback methods
 * @param {string} text - The text to copy
 * @returns {Promise} - Promise that resolves when text is copied
 */
export function copyToClipboard(text) {
    // First try the modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
            .then(() => {
                debugLog('Text copied to clipboard using Clipboard API');
                return true;
            })
            .catch(err => {
                debugLog('Clipboard API failed, trying fallback method:', err);
                return fallbackCopyToClipboard(text);
            });
    } else {
        // Fallback for browsers that don't support Clipboard API
        debugLog('Clipboard API not available, using fallback method');
        return fallbackCopyToClipboard(text);
    }
}

// Make copyToClipboard available globally for use in index.html
window.copyToClipboard = copyToClipboard;

/**
 * Fallback method to copy text to clipboard using execCommand
 * @param {string} text - The text to copy
 * @returns {Promise} - Promise that resolves when text is copied
 */
function fallbackCopyToClipboard(text) {
    return new Promise((resolve, reject) => {
        // Create a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = text;

        // Make the textarea invisible but still selectable
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        textArea.setAttribute('readonly', '');

        document.body.appendChild(textArea);

        try {
            // Select the text
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, text.length);

            // Try to copy using execCommand
            const successful = document.execCommand('copy');

            if (successful) {
                debugLog('Text copied to clipboard using fallback method');
                resolve(true);
            } else {
                debugError('Fallback copy method failed');
                reject(new Error('Copy command was unsuccessful'));
            }
        } catch (err) {
            debugError('Error in fallback copy method:', err);
            reject(err);
        } finally {
            // Clean up the temporary element
            document.body.removeChild(textArea);
        }
    });
}

// isMobileDevice function is defined later in the file

/**
 * Decodes HTML entities in a string
 * @param {string} html - The HTML string to decode
 * @returns {string} - The decoded string
 */
export function decodeHtmlEntities(html) {
    if (!html) return '';

    // Create a temporary div to decode HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x2F;/g, "/");

    return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Processes code blocks in a message to ensure proper encoding/decoding
 * @param {string} content - The message content to process
 * @param {boolean} encode - Whether to encode (true) or decode (false) HTML entities
 * @returns {string} - The processed content
 */
export function processCodeBlocks(content, encode = false) {
    if (!content) return content;

    content = normalizeMalformedCodeFences(content);

    // Check if the content contains code blocks
    if (!content.includes('```')) return content;

    // Process code blocks
    return content.replace(/```([^\n`]*)\n([\s\S]*?)```/g, (match, languageInfo, code) => {
        const languageToken = extractFenceLanguage(languageInfo);
        const normalizedFenceLanguage = normalizeCodeLanguage(languageToken, '');
        const languageLabel = normalizedFenceLanguage || String(languageToken || '').trim();

        // Special handling for HTML code blocks
        const isHtmlCode = languageLabel === 'html' || languageLabel === 'xml';
        let processedCode = code.trim();

        if (encode) {
            // For storage: When saving content

            // If the code already contains HTML entities, decode them first
            if (processedCode.includes('&lt;') || processedCode.includes('&gt;') ||
                processedCode.includes('&amp;')) {
                processedCode = decodeHtmlEntities(processedCode);
            }

            // For HTML code blocks, add a special marker and store the raw code
            if (isHtmlCode) {
                // Store the raw HTML code without entity encoding
                const decodedCode = decodeHtmlEntities(processedCode);
                // Add special markers for HTML content to ensure exact preservation
                return '```' + languageLabel + '\n' + '[HTML_CODE_BLOCK_START]' + decodedCode + '[HTML_CODE_BLOCK_END]' + '```';
            } else {
                // For non-HTML code, preserve the exact content
                return '```' + languageLabel + '\n' + processedCode + '```';
            }
        } else {
            // For display: When rendering content

            // Check if this is a specially marked HTML code block
            if (isHtmlCode && processedCode.includes('[HTML_CODE_BLOCK_START]') &&
                processedCode.includes('[HTML_CODE_BLOCK_END]')) {

                // Extract the content between markers
                const startMarker = processedCode.indexOf('[HTML_CODE_BLOCK_START]');
                const endMarker = processedCode.indexOf('[HTML_CODE_BLOCK_END]');

                if (startMarker !== -1 && endMarker !== -1) {
                    // Get the raw content
                    const markerLength = 22; // Length of [HTML_CODE_BLOCK_START]
                    const rawContent = processedCode.substring(startMarker + markerLength, endMarker);

                    // For display: Return clean content without visible markers
                    // Monaco Editor will handle HTML properly without needing visible markers
                    debugLog('Using preserved HTML content for display without visible markers');
                    return '```' + languageLabel + '\n' + rawContent + '```';
                }
            }

            // For regular HTML content that isn't specially marked
            if (isHtmlCode) {
                // Encode HTML entities to prevent rendering as markup
                const displayCode = processedCode
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/\//g, '&#x2F;');

                return '```' + languageLabel + '\n' + displayCode + '```';
            }

            // For non-HTML code blocks
            return '```' + languageLabel + '\n' + processedCode + '```';
        }
    });
}

/**
 * Scrolls to the bottom of the messages container
 * @param {HTMLElement} messagesContainer - The messages container element
 * @param {boolean} [force=false] - Whether to force scrolling even if already at bottom
 */
export function scrollToBottom(messagesContainer, force = false) {
    if (!messagesContainer) return;

    // Check how far we've scrolled from the bottom
    const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    
    // Use a more generous threshold (50px) to determine if we're already at the bottom
    const bottomThreshold = 50;
    const isAlreadyAtBottom = distanceFromBottom < bottomThreshold;

    // If already at bottom and not forcing, just return
    if (isAlreadyAtBottom && !force) {
        return;
    }

    // If user has scrolled up significantly, don't auto-scroll unless forced
    if (!force && window.userHasScrolledUp) {
        return;
    }

    // Determine if we should use smooth scrolling based on distance
    const useSmooth = distanceFromBottom < 1000; // Only use smooth scrolling for shorter distances

    // Simple scrolling approach
    if (useSmooth) {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        // For long distances, first jump most of the way instantly
        messagesContainer.scrollTop = messagesContainer.scrollHeight - 500;

        // Then scroll smoothly for the final part
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Log scroll position for debugging (only in debug mode)
    if (isDebugEnabled) {
        debugLog('Scrolling to bottom:', {
            scrollHeight: messagesContainer.scrollHeight,
            clientHeight: messagesContainer.clientHeight,
            scrollTop: messagesContainer.scrollTop,
            distance: distanceFromBottom,
            useSmooth: useSmooth,
            forced: force
        });
    }

    // Reset the userHasScrolledUp flag since we've now scrolled to the bottom
    // This will only happen when we actually scroll to the bottom
    window.userHasScrolledUp = false;
}

/**
 * Manually scrolls to bottom - always scrolls regardless of current position
 * This is specifically for user-initiated actions like clicking the scroll button
 * @param {HTMLElement} messagesContainer - The messages container element
 */
export function scrollToBottomManual(messagesContainer) {
    if (!messagesContainer) return;
    
    // Calculate distance for smooth scrolling decision
    const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;
    const useSmooth = distanceFromBottom < 1000;
    
    // Always scroll, regardless of current position
    if (useSmooth) {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        // For long distances, first jump most of the way instantly
        messagesContainer.scrollTop = messagesContainer.scrollHeight - 500;
        
        // Then scroll smoothly for the final part
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    // Reset the userHasScrolledUp flag since we've now scrolled to the bottom
    window.userHasScrolledUp = false;
    
    // Trigger scroll event to hide the button
    setTimeout(() => {
        handleScroll(messagesContainer);
    }, 100);
}

/**
 * Closes the application (for desktop app)
 */
export function closeApplication() {
    // Send a message to the main process to close the application
    if (window.electron) {
        window.electron.send('close-app');
    } else {
        debugLog('Electron not available. Unable to close the application.');
        alert('This function is only available in the desktop application.');
    }
}

/**
 * Ensures the cursor is visible in an input field by scrolling it into view if needed
 * @param {HTMLInputElement} inputField - The input field element
 */
export function ensureCursorVisible(inputField) {
    if (!inputField) return;

    // Check if we're in Android WebView
    const isAndroidWebView = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('android') && userAgent.includes('wv');
    };

    try {
        // For Android WebView, use a simpler approach
        if (isAndroidWebView()) {
            // Give the keyboard time to appear
            setTimeout(() => {
                inputField.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
            return;
        }

        // Get cursor position
        const cursorPosition = inputField.selectionStart;

        // If there's no text or cursor is at the beginning, reset scroll
        if (!inputField.value || cursorPosition === 0) {
            inputField.scrollLeft = 0;
            return;
        }

        // Get computed styles for accurate measurements
        const computedStyle = window.getComputedStyle(inputField);

        // Create a temporary span to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.whiteSpace = 'pre';
        tempSpan.style.font = computedStyle.font;
        tempSpan.style.fontSize = computedStyle.fontSize;
        tempSpan.style.letterSpacing = computedStyle.letterSpacing;
        tempSpan.style.textTransform = computedStyle.textTransform;
        tempSpan.style.padding = '0'; // No padding to get exact text width

        // Get text up to cursor position
        const textBeforeCursor = inputField.value.substring(0, cursorPosition);
        tempSpan.textContent = textBeforeCursor;

        // Add span to DOM to get measurements
        document.body.appendChild(tempSpan);
        const textWidth = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);

        // Get input field dimensions and padding
        const inputWidth = inputField.clientWidth;
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
        const paddingRight = parseFloat(computedStyle.paddingRight);
        const contentWidth = inputWidth - paddingLeft - paddingRight;

        // Calculate the scroll position needed to make cursor visible
        // Add a small offset to ensure cursor isn't at the very edge
        const scrollOffset = 20;

        // Calculate where the cursor should be visible
        const cursorScreenPosition = textWidth + paddingLeft;

        // Adjust scroll position to keep cursor visible
        if (cursorScreenPosition > inputField.scrollLeft + contentWidth - scrollOffset) {
            // Cursor is too far to the right, scroll right
            inputField.scrollLeft = cursorScreenPosition - contentWidth + scrollOffset;
        } else if (cursorScreenPosition < inputField.scrollLeft + scrollOffset) {
            // Cursor is too far to the left, scroll left
            inputField.scrollLeft = Math.max(0, cursorScreenPosition - scrollOffset);
        }
    } catch (error) {
        debugError('Error in ensureCursorVisible:', error);
        
        // Fallback: ensure the input field is visible in the viewport
        try {
            inputField.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        } catch (fallbackError) {
            debugError('Error in ensureCursorVisible fallback:', fallbackError);
        }
    }
}

/**
 * Handles the scroll event to detect when user has scrolled up
 * @param {HTMLElement} messagesContainer - The messages container element
 */
export function handleScroll(messagesContainer) {
    if (!messagesContainer) return;

    /**
     * Checks the scroll position to determine if user has scrolled up
     */
    function checkScrollPosition() {
        // Get the messages in the container
        const messages = messagesContainer.querySelectorAll('.user, .ai, .system');
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        // If there are no messages, nothing to do
        if (!lastMessage) return;

        // Calculate how far we've scrolled from the bottom
        const distanceFromBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight;

        // Calculate what percentage of the total content has been scrolled
        const totalScrollableHeight = messagesContainer.scrollHeight - messagesContainer.clientHeight;
        const scrollPercentage = totalScrollableHeight > 0 ?
                                (messagesContainer.scrollTop / totalScrollableHeight) * 100 : 0;

        // Set a flag on the window object that can be checked by other parts of the application
        // This flag indicates whether the user has scrolled up significantly
        // Use a smaller threshold (100px) to make the button more responsive
        window.userHasScrolledUp = distanceFromBottom >= 100;

        const longChatThresholdPx = Math.max(600, messagesContainer.clientHeight * 1.2);
        const farFromBottomThresholdPx = Math.max(250, messagesContainer.clientHeight * 0.4);
        const nearTopThresholdPercent = 65;
        const minimumMessageCount = 3;
        const isSubstantiallyLong = totalScrollableHeight >= longChatThresholdPx;
        const isFarTowardTop = scrollPercentage <= nearTopThresholdPercent;
        const hasEnoughMessages = messages.length >= minimumMessageCount;

        // Control scroll-to-bottom button visibility
        const scrollButton = document.getElementById('scroll-to-bottom');
        if (scrollButton) {
            // Check if the button is force-hidden by user settings
            const isForceHidden = scrollButton.classList.contains('force-hidden');

            // Detect Android keyboard visibility via the global flag set by initializeAndroidKeyboardFix
            // (visualViewport approach does NOT work with adjustResize since both heights shrink together)
            const isKeyboardVisible = window.androidKeyboardVisible === true
                || document.body.classList.contains('keyboard-visible');

            // Show only when chat is long enough and user is far toward the top.
            const shouldShowButton =
                window.userHasScrolledUp &&
                isSubstantiallyLong &&
                hasEnoughMessages &&
                isFarTowardTop &&
                distanceFromBottom >= farFromBottomThresholdPx &&
                !isForceHidden &&
                !isKeyboardVisible;

            if (shouldShowButton) {
                // Show button when user has scrolled up (unless force-hidden)
                scrollButton.classList.remove('hidden');
                scrollButton.classList.add('visible', 'show');
                scrollButton.style.visibility = 'visible';
                scrollButton.style.pointerEvents = 'auto';
            } else {
                // Hide button when user is at or near bottom or if force-hidden
                scrollButton.classList.remove('visible', 'show');
                scrollButton.classList.add('hidden');
                scrollButton.style.visibility = 'hidden';
                scrollButton.style.pointerEvents = 'none';
            }
        } else {
            console.warn('Scroll-to-bottom button element not found');
        }

        if (isDebugEnabled) {
            debugLog('Scroll position analysis:', {
                scrollHeight: messagesContainer.scrollHeight,
                clientHeight: messagesContainer.clientHeight,
                scrollTop: messagesContainer.scrollTop,
                distanceFromBottom: distanceFromBottom,
                totalScrollableHeight: totalScrollableHeight,
                scrollPercentage: scrollPercentage.toFixed(2) + '%',
                userHasScrolledUp: window.userHasScrolledUp,
                isSubstantiallyLong: isSubstantiallyLong,
                hasEnoughMessages: hasEnoughMessages,
                isFarTowardTop: isFarTowardTop,
                buttonVisible: scrollButton ? !scrollButton.classList.contains('hidden') : false
            });
        }
    }

    checkScrollPosition();
}

/**
 * Detects if the app is running in an Android WebView environment
 * @returns {boolean} - True if running in Android WebView, false otherwise
 */
export function isAndroidWebView() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.indexOf('android') > -1 && userAgent.indexOf('wv') > -1;
}

/**
 * Detects if the app is running on a mobile device
 * @returns {boolean} - True if running on a mobile device, false otherwise
 */
export function isMobileDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    // Check both user agent and screen width for better detection
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|crios/i.test(userAgent) || window.innerWidth < 768;
}

/**
 * Adjusts the chat form position when keyboard is visible on Android WebView
 */
export function adjustChatFormForAndroidKeyboard() {
    if (!isAndroidWebView()) return;
    
    const chatForm = document.getElementById('chat-form');
    if (!chatForm) return;
    
    // Add a class for Android-specific styling
    document.body.classList.add('android-webview');
    
    // Use VisualViewport API if available (Android Chrome 62+)
    if (window.visualViewport) {
        const viewport = window.visualViewport;
        
        const handleViewportChange = () => {
            // Calculate the keyboard height considering zoom/scale
            const keyboardHeight = window.innerHeight - (viewport.height * viewport.scale);
            
            if (keyboardHeight > 100) {
                // Keyboard is visible
                document.body.classList.add('keyboard-visible');
                document.body.style.paddingBottom = `${keyboardHeight}px`;
                
                // Scroll to input
                const userInput = document.getElementById('user-input');
                if (userInput) {
                    setTimeout(() => {
                        userInput.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 100);
                }
            } else {
                // Keyboard is hidden
                document.body.classList.remove('keyboard-visible');
                document.body.style.paddingBottom = '';
            }
        };
        
        viewport.addEventListener('resize', handleViewportChange);
    }
}

/**
 * Formats a date for display
 * @param {Date} date - The date to format
 * @returns {string} - The formatted date string
 */
export function formatDate(date) {
    if (!date) return '';

    // Check if the date is today
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    if (isToday) {
        return 'today';
    }

    // Check if the date is yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        return 'yesterday';
    }

    // Otherwise, return a formatted date
    return date.toLocaleDateString();
}

/**
 * Refreshes all code blocks in the application with basic styling
 * This is useful when switching between chats or after loading saved chats
 */
export function refreshAllCodeBlocks() {
    // Use queueMicrotask to avoid blocking the main thread
    queueMicrotask(() => {
        // Process all messages (user, AI, and system) in the main chat container
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
            const allMessages = messagesContainer.querySelectorAll('.user, .ai, .system');
            allMessages.forEach(messageEl => {
                // Check if this message has code blocks that need special handling
                const preElements = messageEl.querySelectorAll('pre');
                preElements.forEach(pre => {
                    const codeElement = pre.querySelector('code');
                    if (codeElement) {
                        // Get language from class
                        const classNames = codeElement.className.split(' ');
                        const languageClass = classNames.find(cls => cls.startsWith('language-'));
                        const language = languageClass ? languageClass.replace('language-', '') : '';

                        // Add language as data attribute for styling
                        pre.setAttribute('data-language', language);
                        pre.setAttribute('data-multiline', 'true');
                        // Normalize highlighted and unhighlighted blocks back to raw text
                        // before re-running the local highlighter. Reading from innerHTML here
                        // can parse escaped HTML into real DOM on reload, collapsing code like
                        // <h1>Hello</h1> into visible page text such as "Hello".
                        const codeContent = extractCodeTextFromElement(codeElement);
                        pre._rawCodeText = codeContent;
                        codeElement.textContent = codeContent;

                        // Check if this message has thinking tags and add the attribute to the pre element
                        const messageHasThinking = messageEl.dataset && messageEl.dataset.hasThinking === 'true';
                        if (messageHasThinking && pre) {
                            pre.setAttribute('data-has-thinking', 'true');
                        }
                    }
                });

                // Initialize basic code styling for this message
                queueMicrotask(() => {
                    initializeCodeMirror(messageEl);
                });
            });
        }
    });
}

/**
 * Checks if a message contains code blocks outside of think tags
 * @param {string} message - The message to check
 * @returns {boolean} - True if the message contains code blocks outside think tags, false otherwise
 */
export function containsCodeBlocksOutsideThinkTags(message) {
    if (!message) return false;

    message = normalizeMalformedCodeFences(message);

    // If no code blocks at all, return false
    if (!message.includes('```')) return false;

    // If no think tags, all code blocks are outside think tags
    if (!message.includes('<think>') && !message.includes('</think>')) {
        return true;
    }

    // Remove all content within think tags and check if code blocks remain
    const contentWithoutThinkTags = message.replace(/<think>[\s\S]*?<\/think>/g, '');
    return contentWithoutThinkTags.includes('```');
}

/**
 * Checks if a message contains code blocks
 * @param {string} message - The message to check
 * @param {boolean} excludeThinkTags - Whether to exclude code blocks within think tags
 * @returns {boolean} - True if the message contains code blocks, false otherwise
 */
export function containsCodeBlocks(message, excludeThinkTags = false) {
    if (!message) return false;

    message = normalizeMalformedCodeFences(message);

    if (excludeThinkTags) {
        return containsCodeBlocksOutsideThinkTags(message);
    }

    // Check for code blocks with triple backticks
    return message.includes('```');
}

/**
 * Saves the current chat ID before refresh
 * @param {string} chatId - The chat ID to save
 * @param {boolean} isFirstMessage - Optional: Whether this is the first message (for faster save)
 */
export function saveCurrentChatBeforeRefresh(chatId, isFirstMessage = false) {
    if (!chatId) return;

    try {
        // Set all flags
        localStorage.setItem('lastActiveChatId', chatId);
        localStorage.setItem('refreshDueToCodeGeneration', 'true');
        if (isFirstMessage) {
            localStorage.setItem('isFirstMessageReload', 'true');
        }
    } catch (e) {
        // Fail silently if localStorage isn't available
        debugError('Error saving chat data:', e);
    }
}

/**
 * Checks if a refresh was triggered due to code generation
 * @returns {boolean} - True if a refresh was triggered due to code generation
 */
export function wasRefreshDueToCodeGeneration() {
    return localStorage.getItem('refreshDueToCodeGeneration') === 'true';
}

/**
 * Gets the last active chat ID before refresh
 * @returns {string|null} - The last active chat ID or null if not found
 */
export function getLastActiveChatId() {
    return localStorage.getItem('lastActiveChatId');
}

/**
 * Clears the refresh due to code generation flag
 */
export function clearRefreshDueToCodeGenerationFlag() {
    localStorage.removeItem('refreshDueToCodeGeneration');
    debugLog('Cleared refresh due to code generation flag');
}

/**
 * Adds hardware acceleration CSS properties to an element for smoother animations
 * @param {HTMLElement} element - The element to add hardware acceleration to
 */
export function addHardwareAcceleration(element) {
    if (!element) return;
    
    // Apply CSS properties that enable hardware acceleration
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform, opacity';
    element.style.backfaceVisibility = 'hidden';
    element.style.webkitBackfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
    element.style.webkitPerspective = '1000px';
}

// Add the toggle function for reasoning visibility to the window object
// This needs to be global to be callable from the onclick attribute
if (typeof window !== 'undefined') {
    // Make initializeCodeMirror available in the global scope
    window.initializeCodeMirror = initializeCodeMirror;
    window.toggleReasoningVisibility = function(toggleElement) {
        const thinkContainer = toggleElement.closest('.think');
        if (!thinkContainer) return;
        const reasoningContent = thinkContainer.querySelector('.reasoning-content');
        if (!reasoningContent) return;

        const isHidden = reasoningContent.hasAttribute('hidden');
        if (isHidden) {
            reasoningContent.removeAttribute('hidden');
            toggleElement.textContent = 'Hide details';
            toggleElement.setAttribute('aria-expanded', 'true');
        } else {
            reasoningContent.setAttribute('hidden', '');
            toggleElement.textContent = 'Show details';
            toggleElement.setAttribute('aria-expanded', 'false');
        }
    };

    // Add the toggle function for thinking visibility during streaming
    window.toggleThinkingVisibility = function(toggleElement) {
        // If toggleElement is null, this was called automatically when hideThinking is enabled
        const isAutomatic = !toggleElement;

        let toggleText, thinkingContainer;

        if (isAutomatic) {
            // Find the thinking indicator without using the toggle element
            thinkingContainer = document.querySelector('.thinking-indicator');
            if (!thinkingContainer) return; // No thinking indicator found
        } else {
            // Normal case when user clicks the toggle
            toggleText = toggleElement.querySelector('.toggle-text');
            thinkingContainer = toggleElement.closest('.thinking-indicator');
        }

        // Get the thinking content from the data attribute
        const thinkingContent = thinkingContainer.getAttribute('data-thinking-content');

        if (thinkingContent) {
            // Check if the thinking content is already displayed
            const existingContent = thinkingContainer.querySelector('.thinking-content');

            if (existingContent) {
                // If content exists and this is not automatic, toggle its visibility
                if (!isAutomatic) {
                    if (existingContent.style.display === 'none') {
                        existingContent.style.display = 'block';
                        toggleText.textContent = 'Hide';
                    } else {
                        existingContent.style.display = 'none';
                        toggleText.textContent = 'Show';
                    }
                }
            } else {
                // If content doesn't exist yet, create and add it
                const contentDiv = document.createElement('div');
                contentDiv.className = 'thinking-content';

                // If this is automatic (hideThinking enabled), hide the content
                if (isAutomatic) {
                    contentDiv.style.display = 'none';
                }

                // Process the thinking content - first remove any <think> tags that might still be present
                let processedContent = thinkingContent.replace(/<\/?think>/g, '');

                // Create a temporary div to escape HTML for XSS prevention
                const tempDiv = document.createElement('div');
                tempDiv.textContent = processedContent;
                let sanitized = tempDiv.innerHTML;

                // Handle code blocks with language specification. The thinking
                // content was already escaped via textContent above.
                sanitized = replaceMarkdownCodeBlocks(sanitized);

                // Handle inline code
                sanitized = sanitized.replace(/`([^`]+)`/g, '<code>$1</code>');

                // Handle headers
                sanitized = sanitized.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
                sanitized = sanitized.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
                sanitized = sanitized.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
                sanitized = sanitized.replace(/^### (.+)$/gm, '<h3>$1</h3>');
                sanitized = sanitized.replace(/^## (.+)$/gm, '<h2>$1</h2>');
                sanitized = sanitized.replace(/^# (.+)$/gm, '<h1>$1</h1>');

                // Handle lists
                sanitized = sanitized.replace(/^\* (.+)$/gm, '<li>$1</li>');
                sanitized = sanitized.replace(/^- (.+)$/gm, '<li>$1</li>');
                sanitized = sanitized.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

                // Wrap lists in appropriate containers
                sanitized = sanitized.replace(/(<li>.*?<\/li>\n*)+/g, '<ul>$&</ul>');

                // Handle emphasis and strong
                sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
                sanitized = sanitized.replace(/_(.+?)_/g, '<em>$1</em>');

                // Handle links
                sanitized = sanitized.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300">$1</a>');

                // Handle horizontal rules
                sanitized = sanitized.replace(/^(?:---|\.{3}|\*\*\*|___)$/gm, '<hr>');

                // Handle markdown tables
                sanitized = sanitized.replace(
                    /^(\|.+\|[ \t]*)\n(\|[-:| \t]+\|[ \t]*)\n((?:\|.+\|[ \t]*\n?)+)/gm,
                    (match, headerRow, separatorRow, bodyRows) => {
                        const headers = headerRow.split('|').slice(1, -1).map(h => h.trim());
                        const separators = separatorRow.split('|').slice(1, -1).map(s => s.trim());
                        const alignments = separators.map(s => {
                            if (s.startsWith(':') && s.endsWith(':')) return 'center';
                            if (s.endsWith(':')) return 'right';
                            return 'left';
                        });
                        const theadHtml = '<thead><tr>' +
                            headers.map((h, i) => `<th style="text-align:${alignments[i] || 'left'}">${h}</th>`).join('') +
                            '</tr></thead>';
                        const rows = bodyRows.trim().split('\n').filter(row => row.trim() && row.includes('|'));
                        const tbodyHtml = '<tbody>' +
                            rows.map(row => {
                                const cells = row.split('|').slice(1, -1).map(c => c.trim());
                                return '<tr>' +
                                    cells.map((c, i) => `<td style="text-align:${alignments[i] || 'left'}">${c}</td>`).join('') +
                                    '</tr>';
                            }).join('') +
                            '</tbody>';
                        return `<div class="table-wrapper"><table class="markdown-table">${theadHtml}${tbodyHtml}</table></div>`;
                    }
                );

                // Handle paragraphs - treat all newlines as paragraph breaks
                const paragraphs = sanitized.split(/\n/);
                sanitized = paragraphs.map(p => {
                    const trimmed = p.trim();
                    if (!trimmed) return '';
                    // Don't wrap block-level HTML elements in <p> tags
                    if (/^<(h[1-6]|div|ul|ol|li|pre|blockquote|table|thead|tbody|tr|td|th|hr)\b/.test(trimmed)) {
                        return trimmed;
                    }
                    return `<p>${trimmed}</p>`;
                }).join('\n');

                contentDiv.innerHTML = sanitized;

                // Initialize code blocks if any
                setTimeout(() => {
                    window.initializeCodeMirror(contentDiv);
                }, 100);
                thinkingContainer.appendChild(contentDiv);
                toggleText.textContent = 'Hide';
            }
        }
    };
}

/**
 * Hides the scroll-to-bottom button
 * Utility function to avoid code duplication across chat switching functions
 */
export function hideScrollToBottomButton() {
    const scrollButton = document.getElementById('scroll-to-bottom');
    if (scrollButton) {
        scrollButton.classList.remove('visible', 'show');
        scrollButton.classList.add('hidden');
        scrollButton.style.visibility = 'hidden';
        scrollButton.style.pointerEvents = 'none';
    }
}
