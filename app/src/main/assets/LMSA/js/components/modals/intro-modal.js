export const introModal = `
<div id="intro-modal" class="intro-modal hidden modal-container" aria-labelledby="intro-modal-title" role="dialog" aria-modal="true">
    <div class="intro-modal-overlay" data-intro-close-overlay="true"></div>
    <div class="intro-modal-card" role="document">
        <div class="intro-modal-header">
            <div>
                <p class="intro-modal-kicker">WELCOME TO LMSA</p>
                <h2 id="intro-modal-title" class="intro-modal-title">Get Set Up in Minutes</h2>
                <p class="intro-modal-subtitle" id="intro-modal-subtitle">A short walkthrough to connect your model server and start chatting.</p>
            </div>
            <button type="button" id="intro-close-btn" class="intro-close-btn" aria-label="Skip onboarding">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="intro-progress" id="intro-progress" aria-hidden="true"></div>

        <div class="intro-step-content">
            <div class="intro-step-icon" id="intro-step-icon" aria-hidden="true">
                <i class="fas fa-rocket"></i>
            </div>
            <h3 class="intro-step-title" id="intro-step-title"></h3>
            <p class="intro-step-description" id="intro-step-description"></p>
            <div class="intro-checklist" id="intro-step-checklist"></div>
            <div class="intro-actions" id="intro-step-actions"></div>
        </div>

        <div class="intro-modal-footer">
            <button type="button" id="intro-skip-btn" class="intro-btn intro-btn-ghost">Skip</button>
            <div class="intro-footer-main-actions">
                <button type="button" id="intro-back-btn" class="intro-btn intro-btn-secondary">Back</button>
                <button type="button" id="intro-next-btn" class="intro-btn intro-btn-primary">Next</button>
            </div>
        </div>
    </div>
</div>
`;