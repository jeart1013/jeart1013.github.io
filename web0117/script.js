// Header Scroll Effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Carousel Functionality
const track = document.querySelector('.carousel-track');
const slides = Array.from(track.children);
const nextButton = document.querySelector('.next-btn');
const prevButton = document.querySelector('.prev-btn');

let currentSlideIndex = 0;

const moveToSlide = (index) => {
    track.style.transform = 'translateX(-' + (index * 100) + '%)';
    currentSlideIndex = index;
};

nextButton.addEventListener('click', () => {
    let nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) {
        nextIndex = 0; // Loop back
    }
    moveToSlide(nextIndex);
});

prevButton.addEventListener('click', () => {
    let prevIndex = currentSlideIndex - 1;
    if (prevIndex < 0) {
        prevIndex = slides.length - 1; // Loop to end
    }
    moveToSlide(prevIndex);
});

// Auto Play
setInterval(() => {
    let nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) {
        nextIndex = 0;
    }
    moveToSlide(nextIndex);
}, 5000);

// Video Modal Logic
const trailerBtn = document.querySelector('#trailer-btn');
const modal = document.querySelector('.video-modal');
const closeModal = document.querySelector('.close-modal');
const videoFrame = document.querySelector('.modal-content iframe');

if (trailerBtn && modal) {
    trailerBtn.addEventListener('click', () => {
        modal.classList.add('active');
        // Auto play when opened (optional, depends on browser policy)
        const src = videoFrame.src;
        if (!src.includes('autoplay=1')) {
            videoFrame.src = src + "&autoplay=1";
        }
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        // Stop video by resetting src
        const src = videoFrame.src;
        videoFrame.src = src.replace('&autoplay=1', '');
    });

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            const src = videoFrame.src;
            videoFrame.src = src.replace('&autoplay=1', '');
        }
    });
}
// Hamburger menu toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.menu');
if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}
// Close menu when clicking a link
navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Close menu when clicking outside the menu content (on overlay)
navMenu.addEventListener('click', (e) => {
    if (e.target === navMenu) {
        navMenu.classList.remove('active');
    }
});
