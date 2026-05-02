document.addEventListener('DOMContentLoaded', function () {
    // Get all TOC links
    const tocLinks = document.querySelectorAll('.toc-link');
    const helpModalContent = document.getElementById('help-modal-content');

    // Table of Contents smooth scrolling
    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Get the target section ID from the href
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection && helpModalContent) {
                // Calculate the position to scroll to
                // We need to account for the section's offset within the scrollable container
                const containerRect = helpModalContent.getBoundingClientRect();
                const targetRect = targetSection.getBoundingClientRect();
                const scrollTop = helpModalContent.scrollTop;

                // Calculate the final scroll position (with some offset for better visibility)
                const targetScrollPosition = scrollTop + (targetRect.top - containerRect.top) - 20;

                // Smooth scroll to the target
                helpModalContent.scrollTo({
                    top: targetScrollPosition,
                    behavior: 'smooth'
                });

                // Clear highlighting from all TOC links first
                tocLinks.forEach(otherLink => {
                    otherLink.style.backgroundColor = '';
                });

                // Add visual feedback for the clicked link
                this.style.transition = 'all 0.1s ease';
                this.style.backgroundColor = 'rgba(148, 163, 184, 0.28)';

                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 200);
            }
        });

        // Add touch feedback for better mobile experience
        link.addEventListener('touchstart', function () {
            this.style.backgroundColor = 'rgba(148, 163, 184, 0.2)';
        }, { passive: true });

        link.addEventListener('touchend', function () {
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 200);
        }, { passive: true });
    });

});
