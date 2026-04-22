function handleFadeInOnScroll() {
    const fadeEls = document.querySelectorAll('.fade-in');
    const triggerBottom = window.innerHeight * 0.85;

    fadeEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < triggerBottom) {
        el.classList.add('visible');
        }
    });
}

window.addEventListener('scroll', handleFadeInOnScroll);
window.addEventListener('load', handleFadeInOnScroll);

const cards = document.querySelectorAll('.portfolio-card');
const leftBtn = document.querySelector('.arrow.left');
const rightBtn = document.querySelector('.arrow.right');

let current = 1; // index of center card

function updateCards() {
  cards.forEach((card, i) => {
    card.classList.remove('left', 'center', 'right');
    if (i === (current + 2) % 3) card.classList.add('left');
    else if (i === current % 3) card.classList.add('center');
    else if (i === (current + 1) % 3) card.classList.add('right');
  });
}

leftBtn.addEventListener('click', () => {   
  current = (current + 2) % 3;
  updateCards();
});
rightBtn.addEventListener('click', () => {
  current = (current + 1) % 3;
  updateCards();
});

