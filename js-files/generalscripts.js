// ----- Script for auto-scrolling blog posts -----

window.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.blog-posts-container');
    const posts = document.getElementById('blogPosts');
    if (!container || !posts) return;

    let direction = 1; // 1 = down, -1 = up
    let speed = 0.4; // pixels per frame
    let animationFrame;

    function animateScroll() {
        const maxScroll = posts.scrollHeight - container.clientHeight;
        let current = container.scrollTop;

        if (direction === 1 && current >= maxScroll) {
            direction = -1;
        } else if (direction === -1 && current <= 0) {
            direction = 1;
        }

        container.scrollTop += speed * direction;
        animationFrame = requestAnimationFrame(animateScroll);
    }

    animateScroll();

    container.addEventListener('mouseenter', () => cancelAnimationFrame(animationFrame));
    container.addEventListener('mouseleave', animateScroll);
});