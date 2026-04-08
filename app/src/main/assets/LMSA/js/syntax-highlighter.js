/**
 * Lightweight built-in syntax highlighter for code blocks.
 * Works entirely offline — no CDN dependencies.
 * Uses a simple sequential-rule approach for maximum compatibility.
 */

// ── Escaping helper ─────────────────────────────────────────────
function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Tokeniser ───────────────────────────────────────────────────
// Walk through code character-by-character trying each rule in
// priority order. This avoids combined regex with named groups,
// which can fail in older WebViews.

function tokenize(code, rules) {
    var tokens = [];
    var pos = 0;
    while (pos < code.length) {
        var bestMatch = null;
        var bestName = null;
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            rule.regex.lastIndex = pos;
            var m = rule.regex.exec(code);
            if (m && m.index === pos) {
                if (!bestMatch || m[0].length > bestMatch[0].length) {
                    bestMatch = m;
                    bestName = rule.name;
                }
            }
        }
        if (bestMatch) {
            tokens.push({ text: bestMatch[0], cls: bestName });
            pos += bestMatch[0].length;
        } else {
            // No rule matched — consume one character as plain text
            var plainEnd = pos + 1;
            // Batch consecutive unmatched characters together
            while (plainEnd < code.length) {
                var found = false;
                for (var j = 0; j < rules.length; j++) {
                    rules[j].regex.lastIndex = plainEnd;
                    var m2 = rules[j].regex.exec(code);
                    if (m2 && m2.index === plainEnd) { found = true; break; }
                }
                if (found) break;
                plainEnd++;
            }
            tokens.push({ text: code.slice(pos, plainEnd), cls: null });
            pos = plainEnd;
        }
    }
    return tokens;
}

// ── Rule helper ─────────────────────────────────────────────────
function R(name, regex) {
    // Ensure global + sticky-compatible via global flag
    var flags = 'g';
    if (regex.dotAll !== undefined) flags += 's'; // add s if supported
    // Rebuild with g flag to use lastIndex
    return { name: name, regex: new RegExp(regex.source, flags) };
}

// ── Language grammars ───────────────────────────────────────────
// Rules are tried in order at each position; first longest match wins.

var GRAMMARS = {};

// HTML / XML
GRAMMARS.html = GRAMMARS.xml = GRAMMARS.svg = [
    R('sh-comment',  /<!--[\s\S]*?-->/),
    R('sh-doctype',  /<!DOCTYPE[^>]*>/i),
    R('sh-tag',      /<\/?[a-zA-Z][a-zA-Z0-9-]*/),
    R('sh-attr',     /[a-zA-Z_:][a-zA-Z0-9_:-]*(?=\s*=)/),
    R('sh-string',   /"[^"]*"|'[^']*'/),
    R('sh-bracket',  /\/?>|>/),
];

// CSS
GRAMMARS.css = GRAMMARS.scss = GRAMMARS.less = [
    R('sh-comment',  /\/\*[\s\S]*?\*\/|\/\/[^\n]*/),
    R('sh-selector', /[.#@][a-zA-Z_-][a-zA-Z0-9_-]*/),
    R('sh-property', /[a-z-]+(?=\s*:)/),
    R('sh-number',   /-?\d+\.?\d*(%|px|em|rem|vh|vw|ch|ex|pt|cm|mm|in|deg|rad|s|ms)?\b/),
    R('sh-string',   /"[^"]*"|'[^']*'/),
    R('sh-keyword',  /\b(important|inherit|initial|unset|none|auto|flex|grid|block|inline|absolute|relative|fixed|sticky)\b/),
    R('sh-function', /[a-zA-Z_-]+(?=\()/),
    R('sh-color',    /#[0-9a-fA-F]{3,8}\b/),
    R('sh-punctuation', /[{}();:,]/),
];

// JavaScript / TypeScript
GRAMMARS.javascript = GRAMMARS.js = GRAMMARS.typescript = GRAMMARS.ts =
GRAMMARS.jsx = GRAMMARS.tsx = [
    R('sh-comment',  /\/\*[\s\S]*?\*\/|\/\/[^\n]*/),
    R('sh-string',   /`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/),
    R('sh-keyword',  /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|super|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|void|delete|yield|static|get|set|true|false|null|undefined|NaN|Infinity)\b/),
    R('sh-number',   /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/),
    R('sh-function', /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/),
    R('sh-operator', /===|!==|==|!=|<=|>=|=>|&&|\|\||\?\?|\.\.\.|[+\-*\/%=<>!&|^~?:]/),
    R('sh-punctuation', /[{}()\[\];,.]/),
];

// Python
GRAMMARS.python = GRAMMARS.py = [
    R('sh-comment',  /#[^\n]*/),
    R('sh-string',   /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/),
    R('sh-keyword',  /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|True|False|None|self|global|nonlocal|async|await|print)\b/),
    R('sh-decorator', /@[a-zA-Z_][a-zA-Z0-9_.]*/),
    R('sh-number',   /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|\d+\.?\d*(?:[eE][+-]?\d+)?j?)\b/),
    R('sh-function', /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/),
    R('sh-operator', /==|!=|<=|>=|\*\*|\/\/|->|[+\-*\/%=<>!&|^~:]/),
    R('sh-punctuation', /[{}()\[\];,.]/),
];

// JSON
GRAMMARS.json = [
    R('sh-property', /"(?:[^"\\]|\\.)*"(?=\s*:)/),
    R('sh-string',   /"(?:[^"\\]|\\.)*"/),
    R('sh-number',   /-?\d+\.?\d*(?:[eE][+-]?\d+)?/),
    R('sh-keyword',  /\b(true|false|null)\b/),
    R('sh-punctuation', /[{}\[\]:,]/),
];

// SQL
GRAMMARS.sql = [
    R('sh-comment',  /--[^\n]*|\/\*[\s\S]*?\*\//),
    R('sh-string',   /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/),
    R('sh-keyword',  /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|IS|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|VALUES|SET|BEGIN|END|COMMIT|ROLLBACK|IF|THEN|ELSE|CASE|WHEN|EXISTS|BETWEEN|LIKE|COUNT|SUM|AVG|MIN|MAX|PRIMARY|KEY|FOREIGN|REFERENCES|INT|VARCHAR|TEXT|BOOLEAN|DATE|TIMESTAMP|DEFAULT|AUTO_INCREMENT)\b/i),
    R('sh-number',   /\b\d+\.?\d*\b/),
    R('sh-function', /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/),
    R('sh-punctuation', /[();,.*]/),
];

// Java
GRAMMARS.java = [
    R('sh-comment',  /\/\*[\s\S]*?\*\/|\/\/[^\n]*/),
    R('sh-string',   /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/),
    R('sh-keyword',  /\b(abstract|assert|break|case|catch|class|const|continue|default|do|else|enum|extends|final|finally|for|goto|if|implements|import|instanceof|interface|native|new|package|private|protected|public|return|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|volatile|while|void|boolean|byte|char|double|float|int|long|short|true|false|null)\b/),
    R('sh-annotation', /@[a-zA-Z_][a-zA-Z0-9_]*/),
    R('sh-number',   /\b(?:0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?[fFdDlL]?)\b/),
    R('sh-function', /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/),
    R('sh-operator', /==|!=|<=|>=|&&|\|\||[+\-*\/%=<>!&|^~?:]/),
    R('sh-punctuation', /[{}()\[\];,.]/),
];

// C / C++
GRAMMARS.c = GRAMMARS.cpp = [
    R('sh-comment',  /\/\*[\s\S]*?\*\/|\/\/[^\n]*/),
    R('sh-preprocessor', /#\s*(?:include|define|ifdef|ifndef|endif|if|else|elif|undef|pragma)[^\n]*/),
    R('sh-string',   /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/),
    R('sh-keyword',  /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|class|namespace|template|typename|public|private|protected|virtual|override|new|delete|try|catch|throw|using|bool|true|false|nullptr|NULL|string|vector|map|set|include)\b/),
    R('sh-number',   /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.?\d*(?:[eE][+-]?\d+)?[fFlLuU]*)\b/),
    R('sh-function', /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/),
    R('sh-operator', /==|!=|<=|>=|&&|\|\||->|::|<<|>>|[+\-*\/%=<>!&|^~?:]/),
    R('sh-punctuation', /[{}()\[\];,.]/),
];

// Shell / Bash
GRAMMARS.bash = GRAMMARS.sh = GRAMMARS.shell = GRAMMARS.zsh = [
    R('sh-comment',  /#[^\n]*/),
    R('sh-string',   /"(?:[^"\\]|\\.)*"|'[^']*'/),
    R('sh-keyword',  /\b(if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|local|export|source|alias|unalias|set|unset|shift|exit|exec|eval|echo|printf|read|cd|pwd|ls|cat|grep|sed|awk|find|sort|uniq|wc|head|tail|mkdir|rm|cp|mv|chmod|chown|curl|wget|tar|zip|unzip|git|npm|pip|sudo|apt|yum|brew|true|false)\b/),
    R('sh-variable', /\$\{?[a-zA-Z_][a-zA-Z0-9_]*\}?|\$[0-9#?@!$*-]/),
    R('sh-number',   /\b\d+\b/),
    R('sh-operator', /&&|\|\||;;|[|<>&;]/),
    R('sh-punctuation', /[{}()\[\]]/),
];

// YAML
GRAMMARS.yaml = GRAMMARS.yml = [
    R('sh-comment',  /#[^\n]*/),
    R('sh-property', /[a-zA-Z_][a-zA-Z0-9_.-]*(?=\s*:)/),
    R('sh-string',   /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/),
    R('sh-keyword',  /\b(true|false|null|yes|no|on|off)\b/),
    R('sh-number',   /\b-?\d+\.?\d*\b/),
    R('sh-punctuation', /[:\[\]{},|>-]/),
];

// Kotlin
GRAMMARS.kotlin = GRAMMARS.kt = [
    R('sh-comment',  /\/\*[\s\S]*?\*\/|\/\/[^\n]*/),
    R('sh-string',   /"""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/),
    R('sh-keyword',  /\b(abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|delegate|do|else|enum|expect|external|false|final|finally|for|fun|if|import|in|infix|init|inline|inner|interface|internal|is|it|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|super|suspend|tailrec|this|throw|true|try|typealias|val|var|vararg|when|where|while)\b/),
    R('sh-annotation', /@[a-zA-Z_][a-zA-Z0-9_]*/),
    R('sh-number',   /\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.?\d*(?:[eE][+-]?\d+)?[fFdDlL]?)\b/),
    R('sh-function', /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/),
    R('sh-operator', /==|!=|<=|>=|&&|\|\||->|::|\?\.|\.\.|\.\.\.|[+\-*\/%=<>!&|^~?:]/),
    R('sh-punctuation', /[{}()\[\];,.]/),
];

// Generic fallback
GRAMMARS.plaintext = GRAMMARS.text = GRAMMARS.generic = [
    R('sh-comment',  /\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*/),
    R('sh-string',   /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/),
    R('sh-number',   /\b\d+\.?\d*\b/),
    R('sh-keyword',  /\b(if|else|for|while|return|function|class|import|export|const|let|var|def|true|false|null|None|nil)\b/),
    R('sh-function', /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/),
    R('sh-punctuation', /[{}()\[\];,.]/),
];

var DARK_THEME = {
    'sh-comment': { color: '#75715e', fontStyle: 'italic' },
    'sh-string': { color: '#e6db74' },
    'sh-keyword': { color: '#f92672', fontWeight: '700' },
    'sh-number': { color: '#ae81ff' },
    'sh-function': { color: '#a6e22e' },
    'sh-operator': { color: '#f92672' },
    'sh-punctuation': { color: '#f8f8f2' },
    'sh-tag': { color: '#f92672' },
    'sh-attr': { color: '#a6e22e' },
    'sh-bracket': { color: '#f8f8f2' },
    'sh-property': { color: '#66d9ef' },
    'sh-selector': { color: '#a6e22e' },
    'sh-color': { color: '#ae81ff' },
    'sh-regex': { color: '#e6db74' },
    'sh-decorator': { color: '#66d9ef' },
    'sh-annotation': { color: '#66d9ef' },
    'sh-variable': { color: '#fd971f' },
    'sh-symbol': { color: '#ae81ff' },
    'sh-macro': { color: '#a6e22e', fontWeight: '700' },
    'sh-preprocessor': { color: '#f92672' },
    'sh-doctype': { color: '#75715e', fontStyle: 'italic' }
};

var LIGHT_THEME = {
    'sh-comment': { color: '#6a737d', fontStyle: 'italic' },
    'sh-string': { color: '#032f62' },
    'sh-keyword': { color: '#d73a49', fontWeight: '700' },
    'sh-number': { color: '#005cc5' },
    'sh-function': { color: '#6f42c1' },
    'sh-operator': { color: '#d73a49' },
    'sh-punctuation': { color: '#24292e' },
    'sh-tag': { color: '#22863a' },
    'sh-attr': { color: '#6f42c1' },
    'sh-bracket': { color: '#24292e' },
    'sh-property': { color: '#005cc5' },
    'sh-selector': { color: '#22863a' },
    'sh-color': { color: '#005cc5' },
    'sh-regex': { color: '#032f62' },
    'sh-decorator': { color: '#6f42c1' },
    'sh-annotation': { color: '#6f42c1' },
    'sh-variable': { color: '#e36209' },
    'sh-symbol': { color: '#005cc5' },
    'sh-macro': { color: '#22863a', fontWeight: '700' },
    'sh-preprocessor': { color: '#d73a49' },
    'sh-doctype': { color: '#6a737d', fontStyle: 'italic' }
};

function getActiveTheme() {
    if (typeof document !== 'undefined' && document.body && document.body.classList.contains('light-theme')) {
        return LIGHT_THEME;
    }
    return DARK_THEME;
}

function applyInlineTheme(element) {
    if (!element || !element.querySelectorAll) return;

    var theme = getActiveTheme();
    var tokens = element.querySelectorAll('span[class^="sh-"], span[class*=" sh-"]');

    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var classes = (token.className || '').split(/\s+/);

        for (var j = 0; j < classes.length; j++) {
            var tokenTheme = theme[classes[j]];
            if (!tokenTheme) continue;

            if (tokenTheme.color) token.style.color = tokenTheme.color;
            if (tokenTheme.fontStyle) token.style.fontStyle = tokenTheme.fontStyle;
            if (tokenTheme.fontWeight) token.style.fontWeight = tokenTheme.fontWeight;
            break;
        }
    }
}


// ── Public API ──────────────────────────────────────────────────

/**
 * Highlight source code and return HTML with <span class="sh-*"> wrappers.
 * @param {string} code  – raw source code (plain text, NOT already escaped)
 * @param {string} lang  – language identifier (e.g. 'javascript', 'html')
 * @returns {string} highlighted HTML
 */
export function highlightCode(code, lang) {
    try {
        var normalizedLang = (lang || '').toLowerCase().replace(/[^a-z0-9+#]/g, '');
        var rules = GRAMMARS[normalizedLang] || GRAMMARS.generic;
        var tokens = tokenize(code, rules);
        var result = '';
        for (var i = 0; i < tokens.length; i++) {
            var t = tokens[i];
            if (t.cls) {
                result += '<span class="' + t.cls + '">' + esc(t.text) + '</span>';
            } else {
                result += esc(t.text);
            }
        }
        return result;
    } catch (e) {
        // Fallback: return escaped plain text if highlighting fails
        return esc(code);
    }
}

/**
 * Highlight a <code> element in-place.
 * Reads textContent, applies syntax highlighting, sets innerHTML.
 * @param {HTMLElement} element  – the <code> element
 * @param {string}      [lang]  – language; auto-detected from className if omitted
 */
export function highlightElement(element, lang) {
    if (!element) return;

    // Auto-detect language from class name  (e.g. "language-javascript")
    if (!lang) {
        var cls = element.className || '';
        var match = cls.match(/(?:language-|lang-)(\S+)/);
        lang = match ? match[1] : '';
    }

    var code = element.textContent || '';
    element.innerHTML = highlightCode(code, lang);
    applyInlineTheme(element);
    // Mark as highlighted so we don't re-process
    element.classList.add('sh-highlighted');
}
