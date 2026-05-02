export const termsModal = `
    <!-- Terms of Service Acceptance Modal -->
    <div id="terms-modal" class="hidden">
        <div class="terms-modal-panel">
            <!-- Modal Header -->
            <div class="terms-modal-header">
                <div class="terms-modal-header-row">
                    <div class="terms-modal-badge" aria-hidden="true">
                        <i class="fas fa-scale-balanced"></i>
                    </div>
                    <div class="terms-modal-header-copy">
                        <p class="terms-modal-eyebrow">Legal Agreement</p>
                        <h2>Terms of Service</h2>
                        <p class="terms-modal-subtitle">Please accept to continue using LMSA</p>
                    </div>
                </div>
            </div>

            <!-- Terms Content -->
            <div id="terms-content" class="terms-modal-body">
                <section class="terms-summary-card">
                    <p class="terms-summary-lead">By using LMSA, you agree to these Terms of Service.</p>
                    <p class="terms-summary-text">Review the full document to understand your rights, responsibilities, and the conditions that apply when using the app.</p>
                </section>

                <section class="terms-link-card">
                    <div class="terms-link-icon" aria-hidden="true">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="terms-link-content">
                        <p class="terms-link-kicker">Full Terms Available Online</p>
                        <p class="terms-link-description">Open the complete Terms of Service in your browser for the full legal text and detailed policies.</p>
                        <a href="https://lmsa.app/terms-of-service" target="_blank" class="terms-full-link">
                            <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                            <span>View Full Terms</span>
                        </a>
                    </div>
                </section>

                <section class="terms-note-card" aria-label="Acceptance requirement">
                    <div class="terms-note-icon" aria-hidden="true">
                        <i class="fas fa-circle-info"></i>
                    </div>
                    <p><strong>Required:</strong> Acceptance is needed to use LMSA. If you disagree with any part of these terms, please discontinue use of the app.</p>
                </section>
            </div>

            <!-- Modal Footer - Acceptance Mode -->
            <div id="terms-acceptance-footer" class="terms-modal-footer">
                <button id="accept-terms-btn" class="terms-primary-action">
                    <i class="fas fa-check-circle" aria-hidden="true"></i>
                    <span>I Accept the Terms of Service</span>
                </button>
                <p class="terms-footer-caption">By accepting, you agree to be bound by these terms.</p>
            </div>

            <!-- Modal Footer - Review Mode -->
            <div id="terms-review-footer" class="terms-modal-footer hidden">
                <button id="close-terms-btn" class="terms-primary-action">
                    <i class="fas fa-times" aria-hidden="true"></i>
                    <span>Close</span>
                </button>
                <p class="terms-footer-caption">You've already accepted these terms.</p>
            </div>
        </div>
    </div>
`;
