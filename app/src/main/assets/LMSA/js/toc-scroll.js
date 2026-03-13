document.addEventListener('DOMContentLoaded', function () {
    // Get all TOC links
    const tocLinks = document.querySelectorAll('.toc-link');
    const helpModalContent = document.getElementById('help-modal-content');
    const scrollToTopBtn = document.getElementById('help-scroll-to-top');

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

    // Scroll to Top Button functionality
    const scrollToTopContainer = document.getElementById('help-scroll-to-top-container');

    if (scrollToTopBtn && helpModalContent && scrollToTopContainer) {
        // Show/hide button based on scroll position
        // Require scrolling down at least 600px (significant amount) before showing
        helpModalContent.addEventListener('scroll', function () {
            if (this.scrollTop > 600) {
                scrollToTopContainer.style.display = 'flex';
                scrollToTopContainer.classList.add('show');
            } else {
                scrollToTopContainer.classList.remove('show');
                // Delay hiding to allow fade out animation
                setTimeout(() => {
                    if (!scrollToTopContainer.classList.contains('show')) {
                        scrollToTopContainer.style.display = 'none';
                    }
                }, 300);
            }
        }, { passive: true });

        // Scroll to top when button is clicked
        scrollToTopBtn.addEventListener('click', function () {
            helpModalContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
