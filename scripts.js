let lastScrollY = window.scrollY;
const header = document.querySelector('.headerBar');

window.addEventListener('scroll', () => {
  if (window.scrollY > lastScrollY && window.scrollY > 80) {
    // Scrolling down
    header.classList.add('hide-header');
  } else {
    // Scrolling up or near top
    header.classList.remove('hide-header');
  }
  lastScrollY = window.scrollY;
});

document.addEventListener("DOMContentLoaded", function() {
    const events = document.querySelectorAll('.timeline-event');
    function checkSlide() {
        events.forEach((event, idx) => {
            const rect = event.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                if (idx % 2 === 0) {
                    event.classList.add('slide-in-left');
                } else {
                    event.classList.add('slide-in-right');
                }
            }
        });
    }
    window.addEventListener('scroll', checkSlide);
    checkSlide();
});
    
const timelineSection = document.querySelector('.timeline-section');
let gradientActive = false;
let fadeTimeout = null;

// Listen for mouse events on the whole document
document.addEventListener('mousemove', function(e) {
    if (!gradientActive) return;
    const rect = timelineSection.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Only update if mouse is inside timelineSection
    if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
    ) {
        timelineSection.style.background = `
            radial-gradient(circle at ${x}px ${y}px, #7fd3ed 0%, #e3f2e8 40%)
        `;
    }
});

timelineSection.addEventListener('mouseenter', function(e) {
    gradientActive = true;
    const rect = timelineSection.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    timelineSection.style.background = `
        radial-gradient(circle at ${x}px ${y}px, rgba(127,211,237,0) 0%, #e3f2e8 100%)
    `;
    clearTimeout(fadeTimeout);
    fadeTimeout = setTimeout(() => {
        timelineSection.style.background = `
            radial-gradient(circle at ${x}px ${y}px, #7fd3ed 0%, #e3f2e8 40%)
        `;
    }, 100);
});

