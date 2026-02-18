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


// ----- Script for wave rising on scroll -----
window.addEventListener('scroll', function() {
    const waveContainer = document.getElementById('wave-container');
    const scrollY = window.scrollY || window.pageYOffset;
    const trigger = window.innerHeight * 0.3; // Start rising at 30% viewport
    const riseDistance = window.innerHeight * 0.7; // Complete rise over 70% of viewport

    if (scrollY > trigger + riseDistance) {
        // Fully cover background
        waveContainer.style.top = `0%`;
        waveContainer.style.height = `100%`;
    } else if (scrollY > trigger) {
        let progress = Math.min((scrollY - trigger) / riseDistance, 1);
        waveContainer.style.top = `${50 - 50 * progress}%`;
        waveContainer.style.height = `${50 + 50 * progress}%`;
    } else {
        waveContainer.style.top = `50%`;
        waveContainer.style.height = `50%`;
    }
});


// ----- Script for animated wave background -----
const wavePath = document.getElementById('wave-path');
const width = 1920;
const height = 300;
const amplitude = 20; // Wave height
const frequency = 2;  // Number of waves
const speed = 0.001;  // Animation speed
const foamGroup = document.getElementById('wave-foam');

function drawWave(time) {
    let path = `M0 ${height/2}`;
    let foamBlobs = '';
    for (let x = 0; x <= width; x += 20) {
        const y = height/2 + Math.sin((x/width) * frequency * Math.PI * 2 + time * speed * 2 * Math.PI) * amplitude
                + Math.sin((x/width) * frequency * 2 * Math.PI * 2 + time * speed * Math.PI) * (amplitude/2);
        path += ` L${x} ${y}`;

        // Add foam at wave crest (where y is near max)
        if (Math.abs(y - (height/2 + amplitude)) < 6) {
            // Main blob (ellipse)
            const rx = 12 + Math.random()*8;
            const ry = 7 + Math.random()*5;
            foamBlobs += `<ellipse cx="${x}" cy="${y-10}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.92"/>`;

            // Small splashes (circles)
            for (let i = 0; i < 3; i++) {
                const fx = x + (Math.random()-0.5)*30;
                const fy = y-10 - Math.random()*20;
                const fr = 3 + Math.random()*3;
                foamBlobs += `<circle cx="${fx}" cy="${fy}" r="${fr}" fill="#fff" opacity="0.85"/>`;
            }

            // Irregular blob (SVG path)
            if (Math.random() > 0.7) {
                const bx = x + (Math.random()-0.5)*18;
                const by = y-18 - Math.random()*8;
                foamBlobs += `<path d="M${bx},${by} 
                    q 8,-6 16,0 
                    q -8,8 -16,0" 
                    fill="#fff" opacity="0.8"/>`;
            }
        }
    }
    path += ` L${width} ${height} L0 ${height} Z`;
    wavePath.setAttribute('d', path);
    foamGroup.innerHTML = foamBlobs;
    requestAnimationFrame(drawWave);
}
requestAnimationFrame(drawWave);