
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
    "Fitness Coach": "You are a professional Fitness Coach. Your goal is to help users reach their health and fitness targets. Create personalized workout routines, offer nutrition advice, and provide motivation. Ask about the user's current fitness level and goals to tailor your guidance."
};

let selectedPrompt = null;
let selectedTemplateName = null;
const startBtn = document.getElementById('start-chatting-btn');
const grid = document.getElementById('templates-grid');
let templateToDelete = null;
let templateToEdit = null;
const deleteModal = document.getElementById('delete-modal');
const deleteModalContent = document.getElementById('delete-modal-content');

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
        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
        console.log('Avatar URL migration complete');
    }
    
    return customTemplates;
}

// Load Custom Templates on Init
async function loadCustomTemplates() {
    let customTemplates = JSON.parse(localStorage.getItem('customTemplates')) || [];
    
    // Migrate any external URLs to data URLs
    customTemplates = await migrateAvatarUrls(customTemplates);

    // Add to templates object
    customTemplates.forEach(t => {
        templates[t.name] = t.prompt;
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

    customTemplates.forEach(t => {
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

    let iconHtml = '';
    if (t.avatarUrl) {
        iconHtml = `
            <div class="w-16 h-16 mb-3 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-blue-500/10 overflow-hidden">
                <img src="${t.avatarUrl}" alt="${t.name}" class="w-full h-full object-cover">
            </div>
        `;
    } else {
        iconHtml = `
            <div class="w-16 h-16 mb-3 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors border border-blue-500/10">
                <span class="material-symbols-outlined text-5xl text-blue-400">face</span>
            </div>
        `;
    }

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
        <span class="font-semibold text-sm text-slate-100 text-center">${t.name}</span>
        <span class="text-xs text-slate-400 mt-1 text-center truncate w-full px-2">${t.desc}</span>
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
            if (templates[title]) {
                selectedPrompt = templates[title];
                selectedTemplateName = title;
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


// Modal Logic
const modal = document.getElementById('create-modal');
const modalContent = document.getElementById('create-modal-content');

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

function openCreateModal(editMode = false) {
    // Check premium status for creating new templates
    // Paid users bypass this, free users get the premium modal
    if (!editMode) {
        const isPremium = window.AndroidBilling && typeof window.AndroidBilling.checkPremiumStatus === 'function' && window.AndroidBilling.checkPremiumStatus();
        if (!isPremium) {
            if (typeof window.openPremiumModal === 'function') {
                window.openPremiumModal();
            } else {
                alert('This feature is reserved for premium users.');
            }
            return;
        }
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
        document.getElementById('new-template-name').value = '';
        document.getElementById('new-template-desc').value = '';
        document.getElementById('new-template-prompt').value = '';
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
    const name = document.getElementById('new-template-name').value.trim();
    const desc = document.getElementById('new-template-desc').value.trim();
    const prompt = document.getElementById('new-template-prompt').value.trim();

    if (!name || !prompt) {
        alert('Please provide at least a name and a system prompt.');
        return;
    }

    let customTemplates = JSON.parse(localStorage.getItem('customTemplates')) || [];

    // Check if we're editing or creating
    if (templateToEdit) {
        // Editing existing template
        const index = customTemplates.findIndex(t => t.name === templateToEdit);
        if (index === -1) {
            alert('Template not found.');
            return;
        }

        // Check if new name conflicts with another template
        if (name !== templateToEdit && templates[name]) {
            alert('A template with this name already exists.');
            return;
        }

        // Update the template
        customTemplates[index] = {
            ...customTemplates[index],
            name,
            desc,
            prompt,
            avatarUrl: selectedAvatarUrl || customTemplates[index].avatarUrl
        };

        // Remove old name from templates object if name changed
        if (name !== templateToEdit) {
            delete templates[templateToEdit];
        }

        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    } else {
        // Creating new template
        if (templates[name]) {
            alert('A template with this name already exists.');
            return;
        }

        const newTemplate = {
            name,
            desc,
            prompt,
            avatarUrl: selectedAvatarUrl,
            id: Date.now()
        };

        customTemplates.push(newTemplate);
        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    }

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
    let customTemplates = JSON.parse(localStorage.getItem('customTemplates')) || [];
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

    let customTemplates = JSON.parse(localStorage.getItem('customTemplates')) || [];
    customTemplates = customTemplates.filter(t => t.name !== name);
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));

    // Remove from local templates object
    delete templates[name];

    // Reload UI
    loadCustomTemplates();

    // If the deleted template was selected, clear selection
    if (selectedTemplateName === name) {
        selectedPrompt = null;
        selectedTemplateName = null;
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
        startBtn.disabled = true;
    }

    closeDeleteModal();
}

function editTemplate(event, name) {
    event.stopPropagation(); // Prevent card selection

    // Find the template
    const customTemplates = JSON.parse(localStorage.getItem('customTemplates')) || [];
    const template = customTemplates.find(t => t.name === name);

    if (!template) {
        alert('Template not found.');
        return;
    }

    // Set edit mode
    templateToEdit = name;

    // Populate form fields
    document.getElementById('new-template-name').value = template.name || '';
    document.getElementById('new-template-desc').value = template.desc || '';
    document.getElementById('new-template-prompt').value = template.prompt || '';

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
                if (img && img.src === template.avatarUrl) {
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
    openCreateModal(true);
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

    // Detect connection mode from localStorage
    const useOpenRouter = localStorage.getItem('useOpenRouter') === 'true';

    // Set loading state immediately
    const originalBtnContent = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <span class="material-symbols-outlined text-sm animate-spin">autorenew</span>
        <span>Checking model...</span>
    `;

    // Defer heavy work to next tick to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 0));

    let loadedModel = null;
    let apiUrl = '';
    let requestHeaders = { 'Content-Type': 'application/json' };

    if (useOpenRouter) {
        // --- OpenRouter path ---
        const apiKey = localStorage.getItem('openRouterApiKey') || '';
        if (!apiKey) {
            showErrorModal('OpenRouter API key is not set. Please add your API key in Settings.');
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnContent;
            return;
        }

        loadedModel = localStorage.getItem('openRouterSelectedModel') || '';
        if (!loadedModel) {
            showErrorModal('No OpenRouter model selected. Please choose a model in the chat screen first.');
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnContent;
            return;
        }

        apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    } else {
        // --- Local server (LM Studio / Ollama) path ---
        const serverIp = localStorage.getItem('serverIp');
        const serverPort = localStorage.getItem('serverPort');

        if (!serverIp || !serverPort) {
            alert('Please configure your server settings first (IP and Port in Settings).');
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnContent;
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

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

            // Try to find the loaded model
            let loadedModelInfo = modelsList.find(model =>
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

            // If no model is marked as loaded, try to check via info endpoint
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
                        } catch (endpointError) {
                            // Silently continue
                        }
                    }
                } catch (infoError) {
                    // Silently continue
                }
            }

            // If still no model found, fall back to the first available model
            if (!loadedModelInfo && modelsList.length > 0) {
                loadedModelInfo = modelsList[0];
            }

            if (!loadedModelInfo) {
                showErrorModal('No models found. Please load a model in LM Studio first.');
                generateBtn.disabled = false;
                generateBtn.innerHTML = originalBtnContent;
                return;
            }

            loadedModel = loadedModelInfo.id;

        } catch (error) {
            console.error('Error fetching models:', error);
            showErrorModal('Failed to connect to LM Studio. Please check that LM Studio is running and the server is started.');
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalBtnContent;
            return;
        }

        apiUrl = `http://${serverIp}:${serverPort}/v1/chat/completions`;
    }

    // Update loading state for generation
    generateBtn.innerHTML = `
        <span class="material-symbols-outlined text-sm animate-spin">autorenew</span>
        <span>Generating...</span>
    `;

    // Create the prompt for the LLM
    const generationPrompt = `Create a detailed system prompt for an AI assistant. The template name is "${name}" and the description is: "${desc}".

Generate a comprehensive system prompt that:
1. Defines the AI's role and persona based on the template name and description
2. Specifies the AI's responsibilities and expertise areas
3. Outlines how the AI should interact with users
4. Includes specific guidelines for tone, style, and approach

Return ONLY the system prompt text itself, without any introduction, explanation, or additional commentary. The prompt should be ready to use directly.`;

    const requestBody = {
        model: loadedModel,
        messages: [
            { role: 'system', content: 'You are an expert at creating effective system prompts for AI assistants. Generate detailed, robust, and comprehensive system prompts that fully define the persona and behavior based on the user requirements.' },
            { role: 'user', content: generationPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        stream: false
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
        let generatedPrompt = data.choices?.[0]?.message?.content?.trim();

        if (!generatedPrompt) {
            throw new Error('No response received from the AI');
        }

        // Strip thinking process and markdown code blocks if present
        generatedPrompt = generatedPrompt
            .replace(/<think>[\s\S]*?<\/think>/gi, '')   // Remove thinking process
            .replace(/^```(?:text|markdown)?\s*\n?/i, '') // Remove opening code block
            .replace(/```\s*$/i, '')                      // Remove closing code block
            .trim();

        // Fill the textarea with the generated prompt
        promptTextarea.value = generatedPrompt;

    } catch (error) {
        console.error('Error generating system prompt:', error);
        if (error.name === 'AbortError') {
            alert('Request timed out. Please try again.');
        } else {
            alert(`Failed to generate system prompt: ${error.message}`);
        }
    } finally {
        // Restore button state
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalBtnContent;
    }
}
