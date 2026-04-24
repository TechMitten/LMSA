
// Core Templates
const templates = {
    "Math Tutor": "You are an encouraging Math Tutor. Your goal is to help the user learn, not just give answers. Solve problems step-by-step, explaining the formulas and logic used at each stage. If the user makes a mistake, gently correct them.",
    "Fortune Teller": "You are a mystical Fortune Teller. Speak in an ethereal, enigmatic tone using metaphors and celestial imagery. Provide readings on the future, love, and luck. Keep predictions vague but generally optimistic/entertaining.",
    "The Joker": "You are The Joker. Your sole purpose is to entertain with humor. Deliver punchlines, dad jokes, and witty banter. Keep the tone lighthearted, silly, and playful. Avoid being mean-spirited.",
    "Story Writer": "You are a creative Story Writer. Craft immersive narratives with vivid imagery, strong character development, and compelling plots. Focus on 'showing, not telling.' Adapt your writing style to the genre requested by the user.",
    "General Tutor": "You are a patient General Tutor. Explain complex concepts in simple, easy-to-understand language (ELI5). Be ready to answer questions on history, science, and general knowledge. Use analogies to clarify difficult topics.",
    "Social Media Writer": "You are a viral Social Media Writer. Create catchy, engaging captions designed to stop the scroll. Use strong hooks, relevant emojis, and trending hashtags. Adapt the tone for specific platforms (e.g., professional for LinkedIn, casual for Instagram).",
    "Code Assistant": "You are an expert Code Assistant. Write clean, efficient, and bug-free code. Always include comments to explain your logic. If the user provides broken code, debug it and explain exactly what went wrong and how you fixed it.",
    "Travel Planner": "You are a logistical Travel Planner. Build detailed day-by-day itineraries based on the user's destination, budget, and interests. Include practical recommendations for transport, accommodation, and dining. Organize the output clearly.",
    "Career Coach": "You are a professional Career Coach. Help users land their dream jobs. Review resumes for impact, draft persuasive cover letters, and conduct mock interviews. Focus on the STAR method and highlighting the user's measurable achievements.",
    "Email Polisher": "You are an Email Polisher. Your goal is professional communication. Rewrite user drafts to be clear, concise, and grammatically perfect. Adjust the tone to be polite, assertive, or formal as requested.",
    "Sous Chef": "You are a helpful Sous Chef. Suggest delicious recipes based on the ingredients the user has on hand. Provide clear, step-by-step cooking instructions, cooking times, and offer safe substitutions for missing ingredients.",
    "Debate Partner": "You are a logical Debate Partner. Your role is to play 'Devil's Advocate.' Constructively challenge the user's arguments to help them find holes in their logic. Point out fallacies and offer counter-points, but remain civil and intellectual.",
    "Blog Post Writer": "You are a skilled Blog Post Writer. Create high-quality, SEO-optimized long-form content. Use engaging headlines, subheadings, and a clear structure. Focus on providing value, using relevant keywords naturally, and maintaining a consistent tone suitable for the target audience.",
    "Tech Support": "You are an expert Technical Support Specialist. Your goal is to help the user solve technical problems and answer tech-related questions. Be patient, clear, and methodical. Ask diagnostic questions if there isn't enough information. Provide step-by-step troubleshooting guides.",
    "Fitness Coach": "You are a professional Fitness Coach. Your goal is to help users reach their health and fitness targets. Create personalized workout routines, offer nutrition advice, and provide motivation. Ask about the user's current fitness level and goals to tailor your guidance.",
    "Summarizer": "You are a professional Summarizer. Your goal is to provide concise, accurate, and structured summaries of any text or documents provided by the user. Highlight key points, main arguments, and important details while maintaining the original context. If multiple documents are provided, synthesize the information clearly."
};

const CUSTOM_TEMPLATE_STORAGE_KEY = 'customTemplates';
const CHARACTER_CARD_SPEC = 'chara_card_v2';
const CHARACTER_CARD_SPEC_VERSION = '2.0';
const BASIC_TEMPLATE_MODE = 'basic';
const CHARACTER_CARD_TEMPLATE_MODE = 'character-card-v2';
const ACTIVE_TEMPLATE_CHARACTER_CARD_KEY = 'activeTemplateCharacterCard';
const PENDING_TEMPLATE_CHARACTER_CARD_KEY = 'pendingTemplateCharacterCard';

let selectedPrompt = null;
let selectedTemplateName = null;
let selectedTemplateRecord = null;
const startBtn = document.getElementById('start-chatting-btn');
const grid = document.getElementById('templates-grid');
let templateToDelete = null;
let templateToEdit = null;
const deleteModal = document.getElementById('delete-modal');
const deleteModalContent = document.getElementById('delete-modal-content');
let customTemplateLookup = new Map();
let customTemplateNames = new Set();
let activeTemplateEditorMode = BASIC_TEMPLATE_MODE;

function createTemplateId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function loadTemplateStoredData(key) {
    let savedData = '';
    let usingNativeStorage = false;

    if (window.AndroidFileOps && typeof window.AndroidFileOps.loadData === 'function') {
        savedData = window.AndroidFileOps.loadData(key);
        if (savedData && savedData.trim() !== '') {
            usingNativeStorage = true;
        }
    }

    const localStorageData = localStorage.getItem(key);
    if (!usingNativeStorage && localStorageData) {
        savedData = localStorageData;

        if (window.AndroidFileOps && typeof window.AndroidFileOps.saveData === 'function') {
            const migrationSucceeded = window.AndroidFileOps.saveData(key, localStorageData);
            if (migrationSucceeded) {
                localStorage.removeItem(key);
            }
        }
    }

    return savedData || '';
}

function saveTemplateStoredData(key, data) {
    if (window.AndroidFileOps && typeof window.AndroidFileOps.saveData === 'function') {
        const success = window.AndroidFileOps.saveData(key, data);
        if (success) {
            localStorage.removeItem(key);
            return true;
        }
    }

    try {
        localStorage.setItem(key, data);
        return true;
    } catch (error) {
        console.warn(`Error saving ${key} to localStorage:`, error);
        return false;
    }
}

function getStoredCustomTemplates() {
    try {
        const rawTemplateData = loadTemplateStoredData(CUSTOM_TEMPLATE_STORAGE_KEY);
        if (!rawTemplateData || rawTemplateData.trim() === '') {
            return [];
        }

        const rawTemplates = JSON.parse(rawTemplateData);
        return Array.isArray(rawTemplates) ? rawTemplates : [];
    } catch (error) {
        console.warn('Failed to parse stored custom templates:', error);
        return [];
    }
}

function saveStoredCustomTemplates(customTemplates) {
    const serializedTemplates = JSON.stringify(customTemplates);
    const saved = saveTemplateStoredData(CUSTOM_TEMPLATE_STORAGE_KEY, serializedTemplates);
    if (!saved) {
        console.warn('Failed to persist custom templates');
    }
}

function normalizeStringArray(values) {
    if (!Array.isArray(values)) {
        return [];
    }

    return values
        .map(value => typeof value === 'string' ? value.trim() : '')
        .filter(Boolean);
}

function normalizeObjectValue(value, fallback = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return fallback;
    }

    return value;
}

function createEmptyCharacterCardData() {
    return {
        name: '',
        description: '',
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: '',
        creator_notes: '',
        system_prompt: '',
        post_history_instructions: '',
        alternate_greetings: [],
        character_book: { entries: [] },
        tags: [],
        creator: '',
        character_version: '1.0.0',
        extensions: {}
    };
}

function normalizeCharacterCardData(cardData = {}) {
    const defaults = createEmptyCharacterCardData();
    const normalizedCardData = {
        ...defaults,
        ...cardData,
        name: typeof cardData.name === 'string' ? cardData.name.trim() : defaults.name,
        description: typeof cardData.description === 'string' ? cardData.description.trim() : defaults.description,
        personality: typeof cardData.personality === 'string' ? cardData.personality.trim() : defaults.personality,
        scenario: typeof cardData.scenario === 'string' ? cardData.scenario.trim() : defaults.scenario,
        first_mes: typeof cardData.first_mes === 'string' ? cardData.first_mes.trim() : defaults.first_mes,
        mes_example: typeof cardData.mes_example === 'string' ? cardData.mes_example.trim() : defaults.mes_example,
        creator_notes: typeof cardData.creator_notes === 'string' ? cardData.creator_notes.trim() : defaults.creator_notes,
        system_prompt: typeof cardData.system_prompt === 'string' ? cardData.system_prompt.trim() : defaults.system_prompt,
        post_history_instructions: typeof cardData.post_history_instructions === 'string' ? cardData.post_history_instructions.trim() : defaults.post_history_instructions,
        alternate_greetings: normalizeStringArray(cardData.alternate_greetings),
        tags: normalizeStringArray(cardData.tags),
        creator: typeof cardData.creator === 'string' ? cardData.creator.trim() : defaults.creator,
        character_version: typeof cardData.character_version === 'string' && cardData.character_version.trim()
            ? cardData.character_version.trim()
            : defaults.character_version,
        extensions: normalizeObjectValue(cardData.extensions, {}),
        character_book: {
            ...normalizeObjectValue(cardData.character_book, {}),
            entries: Array.isArray(cardData.character_book?.entries) ? cardData.character_book.entries : []
        }
    };

    return normalizedCardData;
}

function buildCharacterCardTemplate(cardData) {
    return {
        spec: CHARACTER_CARD_SPEC,
        spec_version: CHARACTER_CARD_SPEC_VERSION,
        data: normalizeCharacterCardData(cardData)
    };
}

function buildCharacterCardRuntimePrompt(cardData) {
    const normalizedCard = normalizeCharacterCardData(cardData);
    const sections = [];

    if (normalizedCard.system_prompt) {
        sections.push(normalizedCard.system_prompt);
    }

    const characterProfile = [];
    if (normalizedCard.name) {
        characterProfile.push(`Character: ${normalizedCard.name}`);
    }
    if (normalizedCard.description) {
        characterProfile.push(`Description: ${normalizedCard.description}`);
    }
    if (normalizedCard.personality) {
        characterProfile.push(`Personality: ${normalizedCard.personality}`);
    }
    if (normalizedCard.scenario) {
        characterProfile.push(`Scenario: ${normalizedCard.scenario}`);
    }
    if (characterProfile.length > 0) {
        sections.push(`You are roleplaying as the following character. Stay in character and respond naturally.\n${characterProfile.join('\n')}`);
    }

    if (normalizedCard.mes_example) {
        sections.push(`Example dialogue:\n${normalizedCard.mes_example}`);
    }

    if (normalizedCard.creator_notes) {
        sections.push(`Creator notes:\n${normalizedCard.creator_notes}`);
    }

    if (normalizedCard.post_history_instructions) {
        sections.push(`After reviewing the conversation history, follow these instructions:\n${normalizedCard.post_history_instructions}`);
    }

    if (normalizedCard.character_book.entries.length > 0) {
        sections.push(`Character book:\n${JSON.stringify(normalizedCard.character_book, null, 2)}`);
    }

    if (normalizedCard.tags.length > 0) {
        sections.push(`Tags: ${normalizedCard.tags.join(', ')}`);
    }

    sections.push('Maintain continuity, preserve the tone of the scenario, and avoid breaking character unless the user explicitly asks for it.');

    return sections
        .map(section => typeof section === 'string' ? section.trim() : '')
        .filter(Boolean)
        .join('\n\n')
        .trim();
}

function normalizeCustomTemplate(template) {
    const templateName = typeof template?.name === 'string' ? template.name.trim() : '';
    const hasCharacterCard = template?.characterCard?.spec === CHARACTER_CARD_SPEC || template?.format === CHARACTER_CARD_TEMPLATE_MODE;
    const normalizedTopLevelAvatar = typeof template?.avatarUrl === 'string' && template.avatarUrl.trim()
        ? template.avatarUrl.trim()
        : null;
    const normalizedCharacterCardAvatar = typeof template?.characterCard?.data?.extensions?.lmsa_avatar_url === 'string' && template.characterCard.data.extensions.lmsa_avatar_url.trim()
        ? template.characterCard.data.extensions.lmsa_avatar_url.trim()
        : (typeof template?.data?.extensions?.lmsa_avatar_url === 'string' && template.data.extensions.lmsa_avatar_url.trim()
            ? template.data.extensions.lmsa_avatar_url.trim()
            : null);
    const resolvedAvatarUrl = normalizedTopLevelAvatar || normalizedCharacterCardAvatar;

    if (hasCharacterCard) {
        const cardData = normalizeCharacterCardData(template?.characterCard?.data || template?.data || {});
        if (!cardData.name && templateName) {
            cardData.name = templateName;
        }
        if (!cardData.description && typeof template?.desc === 'string') {
            cardData.description = template.desc.trim();
        }

        return {
            id: template?.id || createTemplateId(),
            name: templateName || cardData.name,
            desc: typeof template?.desc === 'string' && template.desc.trim()
                ? template.desc.trim()
                : (cardData.description || cardData.personality || 'Character card template'),
            prompt: typeof template?.prompt === 'string' && template.prompt.trim()
                ? template.prompt.trim()
                : buildCharacterCardRuntimePrompt(cardData),
            avatarUrl: resolvedAvatarUrl,
            format: CHARACTER_CARD_TEMPLATE_MODE,
            characterCard: buildCharacterCardTemplate(cardData)
        };
    }

    return {
        id: template?.id || createTemplateId(),
        name: templateName,
        desc: typeof template?.desc === 'string' ? template.desc.trim() : '',
        prompt: typeof template?.prompt === 'string' ? template.prompt.trim() : '',
        avatarUrl: resolvedAvatarUrl,
        format: BASIC_TEMPLATE_MODE
    };
}

function getCharacterCardOpeningMessage(characterCard) {
    const cardData = normalizeCharacterCardData(characterCard?.data || characterCard || {});

    if (cardData.first_mes) {
        return cardData.first_mes;
    }

    if (cardData.alternate_greetings.length > 0) {
        return cardData.alternate_greetings[0];
    }

    return '';
}

/**
 * Migrate avatar URLs to local paths for better compatibility
 * Converts old dicebear API URLs to locally stored avatar files
 */
async function migrateAvatarUrls(customTemplates) {
    let needsUpdate = false;
    
    for (const template of customTemplates) {
        // Check if avatar URL is old dicebear API URL
        if (template.avatarUrl && template.avatarUrl.includes('api.dicebear.com')) {
            try {
                // Extract seed from old URL
                const seedMatch = template.avatarUrl.match(/seed=(\d+)/);
                if (seedMatch && seedMatch[1]) {
                    const seed = seedMatch[1];
                    template.avatarUrl = `avatars/avatar_${seed}.svg`;
                    needsUpdate = true;
                    console.log(`Migrated avatar URL for template: ${template.name} (seed: ${seed})`);
                }
            } catch (error) {
                console.warn(`Failed to migrate avatar for template ${template.name}:`, error);
            }
        }
        // Data URLs will continue to work, no migration needed
    }
    
    // Save migrated templates back to localStorage
    if (needsUpdate) {
        saveStoredCustomTemplates(customTemplates);
        console.log('Avatar URL migration complete');
    }
    
    return customTemplates;
}

// Load Custom Templates on Init
async function loadCustomTemplates() {
    let customTemplates = getStoredCustomTemplates();
    
    // Migrate any external URLs to data URLs
    customTemplates = await migrateAvatarUrls(customTemplates);

    const normalizedTemplates = customTemplates
        .map(normalizeCustomTemplate)
        .filter(template => template.name && template.prompt);

    if (JSON.stringify(customTemplates) !== JSON.stringify(normalizedTemplates)) {
        saveStoredCustomTemplates(normalizedTemplates);
    }

    customTemplateNames.forEach(name => delete templates[name]);
    customTemplateNames.clear();
    customTemplateLookup = new Map();

    // Add to templates object
    normalizedTemplates.forEach(t => {
        templates[t.name] = t.prompt;
        customTemplateNames.add(t.name);
        customTemplateLookup.set(t.name, t);
    });

    // Render buttons
    // Find the insertion point (after the Create button)
    const createBtn = grid.querySelector('.custom-create-btn');

    // Remove any previously rendered custom buttons (in case of re-render)
    const existingCustom = grid.querySelectorAll('.custom-user-template');
    existingCustom.forEach(el => el.remove());

    // Reverse to keep order correct when using insertAfter logic (or just append in order)
    // If we insert after Create button, we should iterate in reverse if we always insert at the same index, 
    // or iterate forwards and update the reference node. 
    // Let's iterate normally and insert before the *next sibling* of the create button, then update reference.

    let referenceNode = createBtn.nextSibling;

    normalizedTemplates.forEach(t => {
        const btn = createCustomTemplateCard(t);
        grid.insertBefore(btn, referenceNode);
        // No need to update referenceNode effectively if we want them stacked: 
        // [Create] [Custom1] [Custom2] ... [Hardcoded1]
        // If we insert Custom1 before Hardcoded1.
        // Then insert Custom2 before Hardcoded1. 
        // We initially have Create, Hardcoded1.
        // Insert Custom1 before Hardcoded1 -> Create, Custom1, Hardcoded1.
        // Next iter: Insert Custom2 before Hardcoded1 -> Create, Custom1, Custom2, Hardcoded1.
        // Yes, referencing the hardcoded node works.
    });
}

function createCustomTemplateCard(t) {
    const btn = document.createElement('button');
    btn.className = `glass-card flex flex-col items-center justify-center p-4 rounded-2xl aspect-square group hover:bg-slate-800/50 relative custom-user-template`;
    btn.dataset.templateFormat = t.format || BASIC_TEMPLATE_MODE;

    let iconHtml = '';
    if (t.avatarUrl) {
        iconHtml = `
            <div class="template-card-avatar w-16 h-16 mb-3 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-blue-500/10 overflow-hidden relative">
                <span class="material-symbols-outlined text-5xl text-blue-400">face</span>
                <img src="${t.avatarUrl}" alt="${t.name}" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()">
            </div>
        `;
    } else {
        iconHtml = `
            <div class="template-card-avatar w-16 h-16 mb-3 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
                <span class="material-symbols-outlined text-5xl text-blue-400">face</span>
            </div>
        `;
    }

    const formatChip = t.format === CHARACTER_CARD_TEMPLATE_MODE
        ? '<span class="template-format-chip">v2 Card</span>'
        : '';

    btn.innerHTML = `
        <div class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div class="p-1 rounded-full bg-slate-800/80 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-colors"
                 onclick="editTemplate(event, '${t.name}')">
                <span class="material-symbols-outlined text-sm">edit</span>
            </div>
        </div>
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div class="p-1 rounded-full bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                 onclick="deleteTemplate(event, '${t.name}')">
                <span class="material-symbols-outlined text-sm">delete</span>
            </div>
        </div>
        ${iconHtml}
        <span class="template-card-title font-semibold text-sm text-slate-100 text-center">${t.name}</span>
        <span class="template-card-desc text-xs text-slate-400 mt-1 text-center w-full px-2">${t.desc}</span>
        ${formatChip}
    `;

    // Attach Click Listener directly
    btn.addEventListener('click', function (e) {
        // Ignore if delete or edit button clicked
        if (e.target.closest('[onclick^="deleteTemplate"]')) return;
        if (e.target.closest('[onclick^="editTemplate"]')) return;
        handleCardClick(this);
    });

    return btn;
}

function handleCardClick(btn) {
    // Check if this button is already selected
    const isSelected = btn.classList.contains('ring-2');
    const allButtons = document.querySelectorAll('.glass-card');

    if (isSelected) {
        // Unselect
        btn.classList.remove('ring-2', 'ring-blue-500', 'bg-slate-800/80');
        selectedPrompt = null;
        selectedTemplateName = null;
        selectedTemplateRecord = null;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
        startBtn.disabled = true;
    } else {
        // Deselect all
        allButtons.forEach(b => {
            b.classList.remove('ring-2', 'ring-blue-500', 'bg-slate-800/80');
        });

        // Select clicked
        btn.classList.add('ring-2', 'ring-blue-500', 'bg-slate-800/80');

        // Get Data
        const titleSpan = btn.querySelector('span.font-semibold');
        if (titleSpan) {
            const title = titleSpan.textContent.trim();
            const customTemplate = customTemplateLookup.get(title);
            if (customTemplate) {
                selectedPrompt = customTemplate.prompt;
                selectedTemplateName = title;
                selectedTemplateRecord = customTemplate;
                startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                startBtn.disabled = false;
            } else if (templates[title]) {
                selectedPrompt = templates[title];
                selectedTemplateName = title;
                selectedTemplateRecord = {
                    name: title,
                    prompt: templates[title],
                    format: BASIC_TEMPLATE_MODE
                };
                startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                startBtn.disabled = false;
            }
        }
    }
}

// Initialize Listeners for Hardcoded Buttons
document.querySelectorAll('.glass-card:not(.custom-create-btn)').forEach(btn => {
    btn.addEventListener('click', function () {
        handleCardClick(this);
    });
});

// Initialize Custom Templates
loadCustomTemplates();

// Add event listener for generate prompt button
const generatePromptBtn = document.getElementById('generate-prompt-btn');
if (generatePromptBtn) {
    generatePromptBtn.addEventListener('click', generateSystemPrompt);
}
const generateCharacterCardBtn = document.getElementById('generate-character-card-btn');
if (generateCharacterCardBtn) {
    generateCharacterCardBtn.addEventListener('click', generateCharacterCardData);
}

// Modal Logic
const modal = document.getElementById('create-modal');
const modalContent = document.getElementById('create-modal-content');
const basicTemplateTabButton = document.getElementById('basic-template-tab');
const advancedTemplateTabButton = document.getElementById('advanced-template-tab');
const basicTemplatePanel = document.getElementById('basic-template-panel');
const advancedTemplatePanel = document.getElementById('advanced-template-panel');
const characterCardImportInput = document.getElementById('character-card-import-input');
const importCharacterCardButton = document.getElementById('import-character-card-btn');
const openCharacterCardImportButton = document.getElementById('open-character-card-import-btn');

function getBasicTemplateFields() {
    return {
        name: document.getElementById('new-template-name'),
        desc: document.getElementById('new-template-desc'),
        prompt: document.getElementById('new-template-prompt')
    };
}

function getCharacterCardFields() {
    return {
        description: document.getElementById('character-card-description'),
        personality: document.getElementById('character-card-personality'),
        scenario: document.getElementById('character-card-scenario'),
        firstMessage: document.getElementById('character-card-first-message'),
        messageExample: document.getElementById('character-card-message-example'),
        creatorNotes: document.getElementById('character-card-creator-notes'),
        systemPrompt: document.getElementById('character-card-system-prompt'),
        postHistory: document.getElementById('character-card-post-history'),
        alternateGreetings: document.getElementById('character-card-alternate-greetings'),
        tags: document.getElementById('character-card-tags'),
        creator: document.getElementById('character-card-creator'),
        version: document.getElementById('character-card-version'),
        characterBook: document.getElementById('character-card-book'),
        extensions: document.getElementById('character-card-extensions')
    };
}

function parseLineSeparatedValues(value = '') {
    return value
        .split(/\r?\n/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

function parseCommaSeparatedValues(value = '') {
    return value
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);
}

function parseJsonObjectInput(rawValue, fieldLabel, fallback = {}) {
    if (!rawValue || !rawValue.trim()) {
        return fallback;
    }

    let parsedValue;
    try {
        parsedValue = JSON.parse(rawValue);
    } catch (error) {
        throw new Error(`${fieldLabel} must be valid JSON.`);
    }

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
        throw new Error(`${fieldLabel} must be a JSON object.`);
    }

    return parsedValue;
}

function parseCharacterBookInput(rawValue) {
    const parsedValue = parseJsonObjectInput(rawValue, 'Character Book JSON', { entries: [] });
    return {
        ...parsedValue,
        entries: Array.isArray(parsedValue.entries) ? parsedValue.entries : []
    };
}

function safeJsonParseObject(rawValue, fallback = {}) {
    if (!rawValue || !rawValue.trim()) {
        return fallback;
    }

    try {
        const parsedValue = JSON.parse(rawValue);
        return parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)
            ? parsedValue
            : fallback;
    } catch (_) {
        return fallback;
    }
}

function resetCharacterCardFields() {
    const fields = getCharacterCardFields();
    const defaults = createEmptyCharacterCardData();

    fields.description.value = defaults.description;
    fields.personality.value = defaults.personality;
    fields.scenario.value = defaults.scenario;
    fields.firstMessage.value = defaults.first_mes;
    fields.messageExample.value = defaults.mes_example;
    fields.creatorNotes.value = defaults.creator_notes;
    fields.systemPrompt.value = defaults.system_prompt;
    fields.postHistory.value = defaults.post_history_instructions;
    fields.alternateGreetings.value = '';
    fields.tags.value = '';
    fields.creator.value = defaults.creator;
    fields.version.value = defaults.character_version;
    fields.characterBook.value = JSON.stringify(defaults.character_book, null, 2);
    fields.extensions.value = JSON.stringify(defaults.extensions, null, 2);
}

function populateCharacterCardFields(characterCard) {
    const fields = getCharacterCardFields();
    const normalizedCard = normalizeCharacterCardData(characterCard?.data || characterCard || {});

    fields.description.value = normalizedCard.description;
    fields.personality.value = normalizedCard.personality;
    fields.scenario.value = normalizedCard.scenario;
    fields.firstMessage.value = normalizedCard.first_mes;
    fields.messageExample.value = normalizedCard.mes_example;
    fields.creatorNotes.value = normalizedCard.creator_notes;
    fields.systemPrompt.value = normalizedCard.system_prompt;
    fields.postHistory.value = normalizedCard.post_history_instructions;
    fields.alternateGreetings.value = normalizedCard.alternate_greetings.join('\n');
    fields.tags.value = normalizedCard.tags.join(', ');
    fields.creator.value = normalizedCard.creator;
    fields.version.value = normalizedCard.character_version;
    fields.characterBook.value = JSON.stringify(normalizedCard.character_book, null, 2);
    fields.extensions.value = JSON.stringify(normalizedCard.extensions, null, 2);
}

function collectCharacterCardFormData(templateName) {
    const fields = getCharacterCardFields();

    return normalizeCharacterCardData({
        name: templateName,
        description: fields.description.value.trim(),
        personality: fields.personality.value.trim(),
        scenario: fields.scenario.value.trim(),
        first_mes: fields.firstMessage.value.trim(),
        mes_example: fields.messageExample.value.trim(),
        creator_notes: fields.creatorNotes.value.trim(),
        system_prompt: fields.systemPrompt.value.trim(),
        post_history_instructions: fields.postHistory.value.trim(),
        alternate_greetings: parseLineSeparatedValues(fields.alternateGreetings.value),
        tags: parseCommaSeparatedValues(fields.tags.value),
        creator: fields.creator.value.trim(),
        character_version: fields.version.value.trim() || '1.0.0',
        character_book: parseCharacterBookInput(fields.characterBook.value),
        extensions: parseJsonObjectInput(fields.extensions.value, 'Extensions JSON', {})
    });
}

function collectCharacterCardDraftForGeneration(templateName) {
    const fields = getCharacterCardFields();

    return {
        name: templateName,
        description: fields.description.value.trim(),
        personality: fields.personality.value.trim(),
        scenario: fields.scenario.value.trim(),
        first_mes: fields.firstMessage.value.trim(),
        mes_example: fields.messageExample.value.trim(),
        creator_notes: fields.creatorNotes.value.trim(),
        system_prompt: fields.systemPrompt.value.trim(),
        post_history_instructions: fields.postHistory.value.trim(),
        alternate_greetings: parseLineSeparatedValues(fields.alternateGreetings.value),
        tags: parseCommaSeparatedValues(fields.tags.value),
        creator: fields.creator.value.trim(),
        character_version: fields.version.value.trim(),
        character_book: safeJsonParseObject(fields.characterBook.value, { entries: [] }),
        extensions: safeJsonParseObject(fields.extensions.value, {})
    };
}

function applyGeneratedCharacterCardData(partialCardData) {
    const basicFields = getBasicTemplateFields();
    const currentDraft = collectCharacterCardDraftForGeneration(basicFields.name.value.trim());
    const mergedCardData = normalizeCharacterCardData({
        ...currentDraft,
        ...partialCardData,
        name: basicFields.name.value.trim() || partialCardData.name || currentDraft.name || ''
    });

    populateCharacterCardFields(mergedCardData);
    basicFields.desc.value = mergedCardData.description || basicFields.desc.value.trim();
    basicFields.prompt.value = buildCharacterCardRuntimePrompt(mergedCardData);
}

function setGenerationButtonState(button, label) {
    button.innerHTML = `
        <span class="material-symbols-outlined text-sm animate-spin">autorenew</span>
        <span>${label}</span>
    `;
}

async function resolveGenerationClientState() {
    const savedUseOpenRouter = localStorage.getItem('useOpenRouter') === 'true';
    const savedUseOllama = localStorage.getItem('useOllama') === 'true';
    const useOpenRouter = savedUseOpenRouter;

    let loadedModel = null;
    let apiUrl = '';
    let requestHeaders = { 'Content-Type': 'application/json' };

    if (useOpenRouter) {
        const apiKey = localStorage.getItem('openRouterApiKey') || '';
        if (!apiKey) {
            throw new Error('OpenRouter API key is not set. Please add your API key in Settings.');
        }

        loadedModel = localStorage.getItem('openRouterSelectedModel') || '';
        if (!loadedModel) {
            throw new Error('No OpenRouter model selected. Please choose a model in the chat screen first.');
        }

        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
        return { loadedModel, apiUrl, requestHeaders };
    }

    const serverIp = localStorage.getItem('serverIp');
    const serverPort = localStorage.getItem('serverPort');

    if (!serverIp || !serverPort) {
        throw new Error('Please configure your server settings first (IP and Port in Settings).');
    }

    let loadedModelInfo = null;

    try {
        if (savedUseOllama) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const modelsResponse = await fetch(`http://${serverIp}:${serverPort}/api/tags`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!modelsResponse.ok) {
                throw new Error('Failed to fetch models from server');
            }

            const data = await modelsResponse.json();
            const modelsList = Array.isArray(data?.models)
                ? data.models.map(model => ({ id: model.name || model.model })).filter(model => Boolean(model.id))
                : [];

            const persistedModelId = window.currentLoadedModel || localStorage.getItem('localSelectedModel') || '';
            if (persistedModelId) {
                loadedModelInfo = modelsList.find(model => model.id === persistedModelId) || null;
            }

            if (!loadedModelInfo) {
                try {
                    const runningController = new AbortController();
                    const runningTimeoutId = setTimeout(() => runningController.abort(), 3000);
                    const runningResponse = await fetch(`http://${serverIp}:${serverPort}/api/ps`, {
                        signal: runningController.signal
                    }).catch(() => ({ ok: false }));
                    clearTimeout(runningTimeoutId);

                    if (runningResponse.ok) {
                        const runningData = await runningResponse.json();
                        const runningModelId = runningData?.models?.[0]?.name || runningData?.models?.[0]?.model;
                        if (runningModelId) {
                            loadedModelInfo = modelsList.find(model => model.id === runningModelId) || { id: runningModelId };
                        }
                    }
                } catch (_) {
                    // Fall back to the first available Ollama model below.
                }
            }

            if (!loadedModelInfo && modelsList.length > 0) {
                loadedModelInfo = modelsList[0];
            }
        } else {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            let triedNative = false;

            try {
                const nativeResp = await fetch(`http://${serverIp}:${serverPort}/api/v1/models`, {
                    signal: controller.signal
                });
                if (nativeResp.ok) {
                    const nativeData = await nativeResp.json();
                    if (nativeData && Array.isArray(nativeData.models)) {
                        triedNative = true;
                        clearTimeout(timeoutId);
                        const loadedNative = nativeData.models.find(
                            m => Array.isArray(m.loaded_instances) && m.loaded_instances.length > 0
                        );
                        if (loadedNative) {
                            loadedModelInfo = {
                                id: loadedNative.loaded_instances[0].id || loadedNative.key
                            };
                        } else if (nativeData.models.length > 0) {
                            loadedModelInfo = { id: nativeData.models[0].key };
                        }
                    }
                }
            } catch (_) {
                // fall through to legacy
            }

            if (!triedNative) {
                const modelsResponse = await fetch(`http://${serverIp}:${serverPort}/v1/models`, {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!modelsResponse.ok) {
                    throw new Error('Failed to fetch models from server');
                }

                const data = await modelsResponse.json();

                if (!data || !data.data || !Array.isArray(data.data)) {
                    throw new Error('Invalid response from server');
                }

                const modelsList = data.data;

                loadedModelInfo = modelsList.find(model =>
                    model.ready === true ||
                    model.loaded === true ||
                    model.active === true ||
                    model.current === true ||
                    model.status === 'loaded' ||
                    model.status === 'ready' ||
                    model.state === 'loaded' ||
                    model.state === 'ready' ||
                    model.status === 'active' ||
                    model.state === 'active'
                );

                if (!loadedModelInfo) {
                    try {
                        const endpoints = ['/v1/internal/model/info', '/v1/model/info'];

                        for (const endpoint of endpoints) {
                            try {
                                const infoController = new AbortController();
                                const infoTimeout = setTimeout(() => infoController.abort(), 2000);
                                const modelInfoResponse = await fetch(`http://${serverIp}:${serverPort}${endpoint}`, {
                                    method: 'GET',
                                    signal: infoController.signal
                                }).catch(() => ({ ok: false }));
                                clearTimeout(infoTimeout);

                                if (modelInfoResponse.ok) {
                                    const modelInfo = await modelInfoResponse.json();
                                    if (modelInfo && modelInfo.id) {
                                        loadedModelInfo = modelsList.find(model => model.id === modelInfo.id);
                                        if (loadedModelInfo) break;
                                    }
                                }
                            } catch (_) {
                                // Silently continue
                            }
                        }
                    } catch (_) {
                        // Silently continue
                    }
                }

                if (!loadedModelInfo && modelsList.length > 0) {
                    loadedModelInfo = modelsList[0];
                }
            }
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        throw new Error(savedUseOllama
            ? 'Failed to connect to Ollama. Please check that Ollama is running and reachable at the configured IP and port.'
            : 'Failed to connect to LM Studio. Please check that LM Studio is running and the server is started.');
    }

    if (!loadedModelInfo) {
        throw new Error(savedUseOllama
            ? 'No Ollama models found. Pull a model first, for example: ollama pull llama3.2'
            : 'No models found. Please load a model in LM Studio first.');
    }

    loadedModel = loadedModelInfo.id;
    apiUrl = `http://${serverIp}:${serverPort}/v1/chat/completions`;

    return { loadedModel, apiUrl, requestHeaders };
}

async function requestAiGeneration({ button, thinkingLabel, systemMessage, userMessage, temperature = 0.7, maxTokens = 1500 }) {
    const originalBtnContent = button.innerHTML;
    button.disabled = true;
    setGenerationButtonState(button, 'Checking model...');

    await new Promise(resolve => setTimeout(resolve, 0));

    try {
        const { loadedModel, apiUrl, requestHeaders } = await resolveGenerationClientState();
        setGenerationButtonState(button, thinkingLabel);

        const requestBody = {
            model: loadedModel,
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ],
            temperature,
            max_tokens: maxTokens,
            stream: false
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let generatedContent = data.choices?.[0]?.message?.content?.trim();
        if (!generatedContent) {
            throw new Error('No response received from the AI');
        }

        generatedContent = generatedContent
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/^```(?:json|text|markdown)?\s*\n?/i, '')
            .replace(/```\s*$/i, '')
            .trim();

        return generatedContent;
    } finally {
        button.disabled = false;
        button.innerHTML = originalBtnContent;
    }
}

function syncFieldsForTemplateMode(targetMode) {
    const basicFields = getBasicTemplateFields();
    const cardFields = getCharacterCardFields();

    if (targetMode === CHARACTER_CARD_TEMPLATE_MODE) {
        if (!cardFields.description.value.trim() && basicFields.desc.value.trim()) {
            cardFields.description.value = basicFields.desc.value.trim();
        }
        if (!cardFields.systemPrompt.value.trim() && basicFields.prompt.value.trim()) {
            cardFields.systemPrompt.value = basicFields.prompt.value.trim();
        }
        return;
    }

    if (!basicFields.desc.value.trim() && cardFields.description.value.trim()) {
        basicFields.desc.value = cardFields.description.value.trim();
    }
    if (!basicFields.prompt.value.trim() && cardFields.systemPrompt.value.trim()) {
        basicFields.prompt.value = cardFields.systemPrompt.value.trim();
    }
}

function setTemplateEditorMode(mode, { syncFields = true } = {}) {
    activeTemplateEditorMode = mode === CHARACTER_CARD_TEMPLATE_MODE ? CHARACTER_CARD_TEMPLATE_MODE : BASIC_TEMPLATE_MODE;

    if (syncFields) {
        syncFieldsForTemplateMode(activeTemplateEditorMode);
    }

    if (basicTemplatePanel) {
        basicTemplatePanel.classList.toggle('hidden', activeTemplateEditorMode !== BASIC_TEMPLATE_MODE);
    }
    if (advancedTemplatePanel) {
        advancedTemplatePanel.classList.toggle('hidden', activeTemplateEditorMode !== CHARACTER_CARD_TEMPLATE_MODE);
    }
    if (basicTemplateTabButton) {
        const isBasicMode = activeTemplateEditorMode === BASIC_TEMPLATE_MODE;
        basicTemplateTabButton.classList.toggle('active', isBasicMode);
        basicTemplateTabButton.setAttribute('aria-selected', String(isBasicMode));
    }
    if (advancedTemplateTabButton) {
        const isAdvancedMode = activeTemplateEditorMode === CHARACTER_CARD_TEMPLATE_MODE;
        advancedTemplateTabButton.classList.toggle('active', isAdvancedMode);
        advancedTemplateTabButton.setAttribute('aria-selected', String(isAdvancedMode));
    }
}

function resetTemplateForm() {
    const basicFields = getBasicTemplateFields();
    basicFields.name.value = '';
    basicFields.desc.value = '';
    basicFields.prompt.value = '';
    resetCharacterCardFields();
}

function tryOpenCharacterCardImport() {
    const isPremium = typeof window.hasPremiumAccess === 'function'
        ? window.hasPremiumAccess()
        : window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus();

    if (!isPremium) {
        if (typeof window.openPremiumModal === 'function') {
            window.openPremiumModal('Custom Templates');
        } else {
            alert('This feature is reserved for premium users.');
        }
        return;
    }

    if (characterCardImportInput) {
        characterCardImportInput.click();
    }
}

function populateFormFromImportedCharacterCard(importedCard) {
    const basicFields = getBasicTemplateFields();
    const normalizedTemplate = normalizeCustomTemplate({
        name: importedCard.data?.name || basicFields.name.value.trim(),
        desc: importedCard.data?.description || '',
        prompt: buildCharacterCardRuntimePrompt(importedCard.data || {}),
        format: CHARACTER_CARD_TEMPLATE_MODE,
        characterCard: importedCard
    });

    basicFields.name.value = normalizedTemplate.name || '';
    basicFields.desc.value = normalizedTemplate.desc || '';
    basicFields.prompt.value = normalizedTemplate.prompt || '';
    populateCharacterCardFields(normalizedTemplate.characterCard);
    setTemplateEditorMode(CHARACTER_CARD_TEMPLATE_MODE, { syncFields: false });
}

function parseImportedCharacterCard(rawContent) {
    let parsedCard;

    try {
        parsedCard = JSON.parse(rawContent);
    } catch (error) {
        throw new Error('Invalid JSON format. The selected file could not be parsed.');
    }

    if (!parsedCard || typeof parsedCard !== 'object' || Array.isArray(parsedCard)) {
        throw new Error('The selected file must contain a JSON object.');
    }

    if (parsedCard.spec !== CHARACTER_CARD_SPEC || !parsedCard.data || typeof parsedCard.data !== 'object') {
        throw new Error('Only character card v2 JSON files are supported for import.');
    }

    return buildCharacterCardTemplate(parsedCard.data);
}

function handleCharacterCardImportSelection(event) {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = loadEvent => {
        try {
            const importedCard = parseImportedCharacterCard(loadEvent.target?.result || '');
            if (modal.classList.contains('hidden')) {
                openCreateModal(false, { mode: CHARACTER_CARD_TEMPLATE_MODE });
            }
            populateFormFromImportedCharacterCard(importedCard);
        } catch (error) {
            showErrorModal(error.message || 'Failed to import the selected character card.');
        } finally {
            event.target.value = '';
        }
    };

    reader.onerror = () => {
        showErrorModal('Failed to read the selected file. Please try again.');
        event.target.value = '';
    };

    reader.readAsText(file);
}

if (basicTemplateTabButton) {
    basicTemplateTabButton.addEventListener('click', () => setTemplateEditorMode(BASIC_TEMPLATE_MODE));
}

if (advancedTemplateTabButton) {
    advancedTemplateTabButton.addEventListener('click', () => setTemplateEditorMode(CHARACTER_CARD_TEMPLATE_MODE));
}

if (importCharacterCardButton) {
    importCharacterCardButton.addEventListener('click', tryOpenCharacterCardImport);
}

if (openCharacterCardImportButton) {
    openCharacterCardImportButton.addEventListener('click', tryOpenCharacterCardImport);
}

if (characterCardImportInput) {
    characterCardImportInput.addEventListener('change', handleCharacterCardImportSelection);
}

// Avatar Picker Logic
// Using locally stored SVGs - no internet dependency
// All avatars are pre-downloaded and stored in /avatars/ folder
const avatarSeeds = [
    '100', '101', '102', '103', '104', '105',
    '106', '107', '108', '109', '110', '111',
    '112', '113', '114', '115', '116', '117'
];

const avatars = avatarSeeds.map(seed => `avatars/avatar_${seed}.svg`);

let selectedAvatarUrl = null;

function renderAvatarPicker() {
    const grid = document.getElementById('avatar-grid');
    grid.innerHTML = '';

    avatars.forEach(url => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-12 h-12 md:w-10 md:h-10 rounded-full bg-slate-800 border border-slate-700 hover:border-blue-500 overflow-hidden transition-all avatar-option';
        btn.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
        btn.onclick = () => selectAvatar(url, btn);
        grid.appendChild(btn);
    });
}

function selectAvatar(url, btnElement) {
    // Store local avatar path directly - no internet dependency
    selectedAvatarUrl = url;
    
    // Update UI
    document.querySelectorAll('.avatar-option').forEach(b => {
        b.classList.remove('ring-2', 'ring-blue-500', 'border-blue-500');
        b.classList.add('border-slate-700');
    });
    btnElement.classList.remove('border-slate-700');
    btnElement.classList.add('ring-2', 'ring-blue-500', 'border-blue-500');

    // Update Preview
    const preview = document.getElementById('avatar-preview');
    preview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
    preview.className = `w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800 border-4 border-blue-500/20 flex items-center justify-center overflow-hidden transition-all duration-300 ring-2 ring-blue-500`;
}

function openCreateModal(editMode = false, options = {}) {
    if (typeof editMode === 'object') {
        options = editMode;
        editMode = false;
    }

    // Check premium status for custom templates (both create and edit)
    // Paid users bypass this, free users get the premium modal
    const isPremium = typeof window.hasPremiumAccess === 'function'
        ? window.hasPremiumAccess()
        : window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus();
    if (!isPremium) {
        if (typeof window.openPremiumModal === 'function') {
            window.openPremiumModal('Custom Templates');
        } else {
            alert('This feature is reserved for premium users.');
        }
        return;
    }

    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Render Avatars Only Once or if empty
    if (document.getElementById('avatar-grid').children.length === 0) {
        renderAvatarPicker();
    }

    // Reset avatar section to expanded state
    const container = document.getElementById('avatar-grid-container');
    const icon = document.getElementById('avatar-toggle-icon');
    if (container) {
        const isTablet = window.innerWidth >= 641;
        container.style.maxHeight = isTablet ? '450px' : '250px';
        container.style.opacity = '1';
    }
    if (icon) {
        icon.style.transform = 'rotate(0deg)';
    }

    const requestedMode = options.mode === CHARACTER_CARD_TEMPLATE_MODE
        ? CHARACTER_CARD_TEMPLATE_MODE
        : activeTemplateEditorMode;
    setTemplateEditorMode(requestedMode, { syncFields: !editMode });

    const modalTitle = document.getElementById('modal-title');
    if (editMode) {
        modalTitle.innerHTML = `
            <span class="material-symbols-outlined text-blue-400">edit</span>
            <span>Edit Template</span>
        `;
    } else {
        modalTitle.innerHTML = `
            <span class="material-symbols-outlined text-blue-400">add_circle</span>
            <span>New Template</span>
        `;
    }

    // Small delay to allow display:block to apply before opacity transition
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    });
}

function closeCreateModal() {
    document.body.style.overflow = '';
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        // Reset form
        resetTemplateForm();
        setTemplateEditorMode(BASIC_TEMPLATE_MODE, { syncFields: false });
        selectedAvatarUrl = null;
        templateToEdit = null;
        // clear avatar selection
        document.querySelectorAll('.avatar-option').forEach(b => {
            b.classList.remove('ring-2', 'ring-blue-500', 'border-blue-500');
            b.classList.add('border-slate-700');
        });

        // Reset preview
        const preview = document.getElementById('avatar-preview');
        if (preview) {
            preview.innerHTML = '<span class="material-symbols-outlined text-4xl md:text-5xl text-slate-500">face</span>';
            preview.className = 'w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800/50 border-2 border-dashed border-slate-600/50 flex items-center justify-center overflow-hidden transition-all duration-300';
        }

        // Reset modal title to create mode
        const modalTitle = document.getElementById('modal-title');
        modalTitle.innerHTML = `
            <span class="material-symbols-outlined text-blue-400">add_circle</span>
            <span>New Template</span>
        `;
    }, 300);
}

function saveNewTemplate() {
    const basicFields = getBasicTemplateFields();
    const name = basicFields.name.value.trim();

    let customTemplates = getStoredCustomTemplates().map(normalizeCustomTemplate);
    const existingTemplate = templateToEdit
        ? customTemplates.find(template => template.name === templateToEdit)
        : null;

    if (!name) {
        alert('Please provide a template name.');
        return;
    }

    const hasBuiltInConflict = Boolean(templates[name] && !customTemplateLookup.has(name) && name !== templateToEdit);
    const hasCustomConflict = customTemplates.some(template => template.name === name && template.name !== templateToEdit);
    if (hasBuiltInConflict || hasCustomConflict) {
        alert('A template with this name already exists.');
        return;
    }

    let nextTemplateRecord;
    try {
        const previewImage = document.querySelector('#avatar-preview img');
        const previewAvatarUrl = previewImage && typeof previewImage.getAttribute === 'function'
            ? (previewImage.getAttribute('src') || '').trim()
            : '';
        const resolvedAvatarUrl = selectedAvatarUrl || previewAvatarUrl || existingTemplate?.avatarUrl || null;

        if (activeTemplateEditorMode === CHARACTER_CARD_TEMPLATE_MODE) {
            const characterCardData = collectCharacterCardFormData(name);
            const runtimePrompt = buildCharacterCardRuntimePrompt(characterCardData);

            if (!runtimePrompt) {
                showErrorModal('Please provide enough v2 character card details to build a runtime prompt.');
                return;
            }

            const characterCardTemplate = buildCharacterCardTemplate(characterCardData);
            if (resolvedAvatarUrl) {
                characterCardTemplate.data.extensions = normalizeObjectValue(characterCardTemplate.data.extensions, {});
                characterCardTemplate.data.extensions.lmsa_avatar_url = resolvedAvatarUrl;
            }

            nextTemplateRecord = normalizeCustomTemplate({
                id: existingTemplate?.id || createTemplateId(),
                name,
                desc: characterCardData.description || characterCardData.personality || 'Character card template',
                prompt: runtimePrompt,
                avatarUrl: resolvedAvatarUrl,
                format: CHARACTER_CARD_TEMPLATE_MODE,
                characterCard: characterCardTemplate
            });
        } else {
            const desc = basicFields.desc.value.trim();
            const prompt = basicFields.prompt.value.trim();

            if (!prompt) {
                alert('Please provide a system prompt.');
                return;
            }

            nextTemplateRecord = normalizeCustomTemplate({
                id: existingTemplate?.id || createTemplateId(),
                name,
                desc,
                prompt,
                avatarUrl: resolvedAvatarUrl,
                format: BASIC_TEMPLATE_MODE
            });
        }
    } catch (error) {
        showErrorModal(error.message || 'Failed to save the template.');
        return;
    }

    // Check if we're editing or creating
    if (templateToEdit) {
        // Editing existing template
        const index = customTemplates.findIndex(t => t.name === templateToEdit);
        if (index === -1) {
            alert('Template not found.');
            return;
        }
        customTemplates[index] = nextTemplateRecord;
    } else {
        customTemplates.push(nextTemplateRecord);
    }

    saveStoredCustomTemplates(customTemplates);

    // Reload to render
    loadCustomTemplates();
    closeCreateModal();
}

function deleteTemplate(event, name) {
    event.stopPropagation(); // Prevent card selection
    document.body.style.overflow = 'hidden';
    templateToDelete = name;

    // Update Modal Text
    const nameSpan = document.getElementById('delete-template-name');
    if (nameSpan) nameSpan.textContent = name;

    // Find Template Data
    let customTemplates = getStoredCustomTemplates().map(normalizeCustomTemplate);
    const template = customTemplates.find(t => t.name === name);
    const avatarContainer = document.getElementById('delete-modal-avatar-container');

    if (template && avatarContainer) {
        let avatarHtml = '';
        if (template.avatarUrl) {
            avatarHtml = `
                <div class="relative w-20 h-20 mx-auto">
                    <div class="w-full h-full rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/10 overflow-hidden">
                        <img src="${template.avatarUrl}" alt="${template.name}" class="w-full h-full object-cover">
                    </div>
                </div>
            `;
        } else {
            avatarHtml = `
                <div class="relative w-20 h-20 mx-auto">
                    <div class="w-full h-full rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                        <span class="material-symbols-outlined text-5xl text-blue-400">face</span>
                    </div>
                </div>
            `;
        }
        avatarContainer.innerHTML = avatarHtml;
    } else if (avatarContainer) {
        // Fallback
        avatarContainer.innerHTML = `
            <div class="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                <span class="material-symbols-outlined text-rose-400 text-3xl">delete</span>
            </div>
        `;
    }

    // Show Modal
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');

    // Animation
    requestAnimationFrame(() => {
        deleteModal.classList.remove('opacity-0');
        deleteModalContent.classList.remove('scale-95');
        deleteModalContent.classList.add('scale-100');
    });
}

function closeDeleteModal() {
    document.body.style.overflow = '';
    deleteModal.classList.add('opacity-0');
    deleteModalContent.classList.remove('scale-100');
    deleteModalContent.classList.add('scale-95');

    setTimeout(() => {
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex');
        templateToDelete = null;
    }, 300);
}

function confirmDelete() {
    if (!templateToDelete) return;

    const name = templateToDelete;

    let customTemplates = getStoredCustomTemplates().map(normalizeCustomTemplate);
    customTemplates = customTemplates.filter(t => t.name !== name);
    saveStoredCustomTemplates(customTemplates);

    // Reload UI
    loadCustomTemplates();

    // If the deleted template was selected, clear selection
    if (selectedTemplateName === name) {
        selectedPrompt = null;
        selectedTemplateName = null;
        selectedTemplateRecord = null;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
        startBtn.disabled = true;
    }

    closeDeleteModal();
}

function editTemplate(event, name) {
    event.stopPropagation(); // Prevent card selection

    // Find the template
    const customTemplates = getStoredCustomTemplates().map(normalizeCustomTemplate);
    const template = customTemplates.find(t => t.name === name);

    if (!template) {
        alert('Template not found.');
        return;
    }

    // Set edit mode
    templateToEdit = name;

    // Populate form fields
    const basicFields = getBasicTemplateFields();
    basicFields.name.value = template.name || '';
    basicFields.desc.value = template.desc || '';
    basicFields.prompt.value = template.prompt || '';

    if (template.format === CHARACTER_CARD_TEMPLATE_MODE && template.characterCard) {
        populateCharacterCardFields(template.characterCard);
    } else {
        resetCharacterCardFields();
    }

    // Handle avatar
    selectedAvatarUrl = template.avatarUrl || null;
    const preview = document.getElementById('avatar-preview');

    if (template.avatarUrl) {
        preview.innerHTML = `<img src="${template.avatarUrl}" class="w-full h-full object-cover">`;
        preview.className = `w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800 border-4 border-blue-500/20 flex items-center justify-center overflow-hidden transition-all duration-300 ring-2 ring-blue-500`;

        // Select the avatar in the grid if it exists
        setTimeout(() => {
            document.querySelectorAll('.avatar-option').forEach(btn => {
                const img = btn.querySelector('img');
                if (img && img.getAttribute('src') === template.avatarUrl) {
                    btn.classList.remove('border-slate-700');
                    btn.classList.add('ring-2', 'ring-blue-500', 'border-blue-500');
                } else {
                    btn.classList.remove('ring-2', 'ring-blue-500', 'border-blue-500');
                    btn.classList.add('border-slate-700');
                }
            });
        }, 100);
    } else {
        preview.innerHTML = '<span class="material-symbols-outlined text-4xl md:text-5xl text-slate-500">face</span>';
        preview.className = 'w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-800/50 border-2 border-dashed border-slate-600/50 flex items-center justify-center overflow-hidden transition-all duration-300';

        // Clear avatar selections
        document.querySelectorAll('.avatar-option').forEach(btn => {
            btn.classList.remove('ring-2', 'ring-blue-500', 'border-blue-500');
            btn.classList.add('border-slate-700');
        });
    }

    // Open modal in edit mode
    openCreateModal(true, { mode: template.format === CHARACTER_CARD_TEMPLATE_MODE ? CHARACTER_CARD_TEMPLATE_MODE : BASIC_TEMPLATE_MODE });
}

// Close delete modal on outside click
if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });
}

// Error Modal
const errorModal = document.getElementById('error-modal');
const errorModalContent = document.getElementById('error-modal-content');
const errorModalMessage = document.getElementById('error-modal-message');

function showErrorModal(message) {
    document.body.style.overflow = 'hidden';
    errorModalMessage.textContent = message;
    errorModal.classList.remove('hidden');
    errorModal.classList.add('flex');

    // Animation
    requestAnimationFrame(() => {
        errorModal.classList.remove('opacity-0');
        errorModalContent.classList.remove('scale-95');
        errorModalContent.classList.add('scale-100');
    });
}

function hideErrorModal() {
    document.body.style.overflow = '';
    errorModal.classList.add('opacity-0');
    errorModalContent.classList.remove('scale-100');
    errorModalContent.classList.add('scale-95');

    setTimeout(() => {
        errorModal.classList.add('hidden');
        errorModal.classList.remove('flex');
    }, 300);
}

// Close error modal on outside click
if (errorModal) {
    errorModal.addEventListener('click', (e) => {
        if (e.target === errorModal) hideErrorModal();
    });
}

// Create modal now requires explicit action (Cancel or Save buttons) to close
// Removed outside-click functionality to prevent accidental closure
// modal.addEventListener('click', (e) => {
//     if (e.target === modal) closeCreateModal();
// });


// Template Loaded Modal Elements
const templateLoadedModal = document.getElementById('template-loaded-modal');
const templateLoadedModalContent = document.getElementById('template-loaded-modal-content');
const templateLoadedConfirmBtn = document.getElementById('template-loaded-confirm-btn');

function showTemplateLoadedModal() {
    document.body.style.overflow = 'hidden';
    templateLoadedModal.classList.remove('hidden');
    templateLoadedModal.classList.add('flex');

    requestAnimationFrame(() => {
        templateLoadedModal.classList.remove('opacity-0');
        templateLoadedModalContent.classList.remove('scale-95');
        templateLoadedModalContent.classList.add('scale-100');
    });
}

// Start Button Logic
startBtn.addEventListener('click', function () {
    if (selectedPrompt) {
        localStorage.setItem('systemPrompt', selectedPrompt);
        localStorage.setItem('isUserCreatedSystemPrompt', 'true');
        localStorage.setItem('activeTemplateName', selectedTemplateName);

        if (selectedTemplateRecord?.format === CHARACTER_CARD_TEMPLATE_MODE && selectedTemplateRecord.characterCard) {
            localStorage.setItem(ACTIVE_TEMPLATE_CHARACTER_CARD_KEY, JSON.stringify(selectedTemplateRecord.characterCard));

            const openingMessage = getCharacterCardOpeningMessage(selectedTemplateRecord.characterCard);
            if (openingMessage) {
                localStorage.setItem(PENDING_TEMPLATE_CHARACTER_CARD_KEY, JSON.stringify({
                    templateName: selectedTemplateName,
                    characterCard: selectedTemplateRecord.characterCard
                }));
            } else {
                localStorage.removeItem(PENDING_TEMPLATE_CHARACTER_CARD_KEY);
            }
        } else {
            localStorage.removeItem(ACTIVE_TEMPLATE_CHARACTER_CARD_KEY);
            localStorage.removeItem(PENDING_TEMPLATE_CHARACTER_CARD_KEY);
        }
        
        // Show confirmation modal instead of redirecting immediately
        if (templateLoadedModal) {
            showTemplateLoadedModal();
        } else {
            // Fallback if modal is missing for some reason
            window.location.href = 'index.html';
        }
    }
});

// Confirm Button Logic - Redirect to chat
if (templateLoadedConfirmBtn) {
    templateLoadedConfirmBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}

// Close Template Loaded Modal on outside click
if (templateLoadedModal) {
    templateLoadedModal.addEventListener('click', (e) => {
        if (e.target === templateLoadedModal) {
            document.body.style.overflow = '';
            templateLoadedModal.classList.add('opacity-0');
            templateLoadedModalContent.classList.remove('scale-100');
            templateLoadedModalContent.classList.add('scale-95');
            setTimeout(() => {
                templateLoadedModal.classList.add('hidden');
                templateLoadedModal.classList.remove('flex');
            }, 300);
        }
    });
}

/**
 * Toggles the avatar section collapse/expand state
 */
function toggleAvatarSection() {
    const container = document.getElementById('avatar-grid-container');
    const icon = document.getElementById('avatar-toggle-icon');

    if (container.style.maxHeight === '0px' || container.style.maxHeight === '') {
        // Expand
        const isTablet = window.innerWidth >= 641;
        container.style.maxHeight = isTablet ? '450px' : '250px';
        container.style.opacity = '1';
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Collapse
        container.style.maxHeight = '0px';
        container.style.opacity = '0';
        icon.style.transform = 'rotate(-90deg)';
    }
}

/**
 * Generates a system prompt using the loaded LLM based on template name and description
 */
async function generateSystemPrompt() {
    const name = document.getElementById('new-template-name').value.trim();
    const desc = document.getElementById('new-template-desc').value.trim();
    const promptTextarea = document.getElementById('new-template-prompt');
    const generateBtn = document.getElementById('generate-prompt-btn');

    // Validation: Check if name and description are provided
    if (!name || !desc) {
        alert('Please enter both a Template Name and Description before generating.');
        return;
    }

    const generationPrompt = `Create a detailed system prompt for an AI assistant. The template name is "${name}" and the description is: "${desc}".

Generate a comprehensive system prompt that:
1. Defines the AI's role and persona based on the template name and description
2. Specifies the AI's responsibilities and expertise areas
3. Outlines how the AI should interact with users
4. Includes specific guidelines for tone, style, and approach

Return ONLY the system prompt text itself, without any introduction, explanation, or additional commentary. The prompt should be ready to use directly.`;

    try {
        const generatedPrompt = await requestAiGeneration({
            button: generateBtn,
            thinkingLabel: 'Generating...',
            systemMessage: 'You are an expert at creating effective system prompts for AI assistants. Generate detailed, robust, and comprehensive system prompts that fully define the persona and behavior based on the user requirements.',
            userMessage: generationPrompt,
            temperature: 0.7,
            maxTokens: 1500
        });

        promptTextarea.value = generatedPrompt;
    } catch (error) {
        console.error('Error generating system prompt:', error);
        if (error.name === 'AbortError') {
            alert('Request timed out. Please try again.');
        } else {
            alert(`Failed to generate system prompt: ${error.message}`);
        }
    }
}

async function generateCharacterCardData() {
    const basicFields = getBasicTemplateFields();
    const cardFields = getCharacterCardFields();
    const templateName = basicFields.name.value.trim();
    const description = cardFields.description.value.trim();

    if (!description) {
        showErrorModal('Description cannot be blank to generate v2 card data.');
        return;
    }

    const currentDraft = collectCharacterCardDraftForGeneration(templateName);
    const blankFields = [];

    if (!currentDraft.personality) blankFields.push('personality');
    if (!currentDraft.scenario) blankFields.push('scenario');
    if (!currentDraft.first_mes) blankFields.push('first_mes');
    if (!currentDraft.mes_example) blankFields.push('mes_example');
    if (!currentDraft.creator_notes) blankFields.push('creator_notes');
    if (!currentDraft.system_prompt) blankFields.push('system_prompt');
    if (!currentDraft.post_history_instructions) blankFields.push('post_history_instructions');
    if (currentDraft.alternate_greetings.length === 0) blankFields.push('alternate_greetings');
    if (currentDraft.tags.length === 0) blankFields.push('tags');
    if (!currentDraft.creator) blankFields.push('creator');
    if (!currentDraft.character_version) blankFields.push('character_version');
    if (!currentDraft.character_book || !Array.isArray(currentDraft.character_book.entries) || currentDraft.character_book.entries.length === 0) blankFields.push('character_book');

    if (blankFields.length === 0) {
        showErrorModal('There are no blank v2 fields to generate.');
        return;
    }

    const generationRequest = {
        name: currentDraft.name || '',
        description: currentDraft.description,
        personality: currentDraft.personality || null,
        scenario: currentDraft.scenario || null,
        first_mes: currentDraft.first_mes || null,
        mes_example: currentDraft.mes_example || null,
        creator_notes: currentDraft.creator_notes || null,
        system_prompt: currentDraft.system_prompt || null,
        post_history_instructions: currentDraft.post_history_instructions || null,
        alternate_greetings: currentDraft.alternate_greetings,
        tags: currentDraft.tags,
        creator: currentDraft.creator || null,
        character_version: currentDraft.character_version || null,
        character_book: currentDraft.character_book,
        extensions: currentDraft.extensions || {}
    };

    const generationPrompt = `You are filling in missing fields for a v2 character card. Use the existing values as hard constraints and generate content only for the blank fields.

Rules:
1. Keep all existing non-blank fields unchanged.
2. Generate only the fields listed in "blank_fields".
3. Description is authoritative and must guide the generation.
4. Return valid JSON only.
5. Do not wrap the JSON in markdown.
6. For alternate_greetings and tags, return arrays of strings.
7. For character_book, return an object with an entries array. Use {"entries": []} if there is no strong need for lorebook entries.
8. For creator_notes and post_history_instructions, keep them concise and useful.

blank_fields:
${JSON.stringify(blankFields, null, 2)}

existing_card:
${JSON.stringify(generationRequest, null, 2)}

Return this shape exactly:
{
  "personality": string optional,
  "scenario": string optional,
  "first_mes": string optional,
  "mes_example": string optional,
  "creator_notes": string optional,
  "system_prompt": string optional,
  "post_history_instructions": string optional,
  "alternate_greetings": string[] optional,
  "tags": string[] optional,
  "creator": string optional,
  "character_version": string optional,
  "character_book": { "entries": [] } optional
}`;

    try {
        const generatedPayload = await requestAiGeneration({
            button: generateCharacterCardBtn,
            thinkingLabel: 'Filling blanks...',
            systemMessage: 'You are an expert roleplay character card designer. Given partially completed v2 character card fields, fill only the missing fields with coherent, high-quality content. Return strict JSON only.',
            userMessage: generationPrompt,
            temperature: 0.8,
            maxTokens: 2200
        });

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(generatedPayload);
        } catch (error) {
            throw new Error('The AI returned invalid JSON for the v2 card fields. Please try again.');
        }

        if (!parsedPayload || typeof parsedPayload !== 'object' || Array.isArray(parsedPayload)) {
            throw new Error('The AI returned an invalid v2 card payload.');
        }

        applyGeneratedCharacterCardData(parsedPayload);
        basicFields.desc.value = cardFields.description.value.trim() || basicFields.desc.value.trim();
    } catch (error) {
        console.error('Error generating v2 character card data:', error);
        if (error.name === 'AbortError') {
            showErrorModal('Request timed out. Please try again.');
        } else {
            showErrorModal(error.message || 'Failed to generate v2 character card data.');
        }
    }
}
