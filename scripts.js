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