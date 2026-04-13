// ===========================
// SMOOTH SCROLL NAVIGATION
// ===========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.id === 'home-logo') {
            return;
        }

        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const homeLogo = document.getElementById('home-logo');

if (homeLogo) {
    homeLogo.addEventListener('click', function (e) {
        e.preventDefault();

        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

        if (currentScroll > 10) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            window.location.reload();
        }
    });
}

// ===========================
// FORM SUBMISSION
// ===========================

const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');
const CONTACT_MESSAGES_KEY = 'landingPageContactMessages';

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const nameInput = document.getElementById('contactName');
        const emailInput = document.getElementById('contactEmail');
        const messageInput = document.getElementById('contactMessage');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        if (!name || !email || !message) {
            showContactStatus('Please fill out all fields.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showContactStatus('Please enter a valid email address.', 'error');
            return;
        }

        const savedMessages = JSON.parse(localStorage.getItem(CONTACT_MESSAGES_KEY) || '[]');
        savedMessages.unshift({
            id: Date.now(),
            name,
            email,
            message,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(savedMessages.slice(0, 25)));

        showContactStatus(`Message sent successfully, ${name}. We saved your inquiry for the demo.`, 'success');
        this.reset();
    });
}

function showContactStatus(message, type) {
    if (!contactStatus) {
        alert(message);
        return;
    }

    contactStatus.textContent = message;
    contactStatus.className = `contact-status contact-status-${type}`;
}

// ===========================
// BUTTON CLICK HANDLERS
// ===========================

const ctaButtons = document.querySelectorAll('.primary-btn, .cta-large, .pricing-btn');

ctaButtons.forEach(button => {
    button.addEventListener('click', function (e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        // Optional: Add ripple animation (requires CSS)
        // this.appendChild(ripple);
        
        console.log('Button clicked:', this.textContent);
    });
});

// ===========================
// SCROLL ANIMATION
// ===========================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        } else {
            entry.target.classList.remove('is-visible');
        }
    });
}, observerOptions);

// Observe all feature cards
document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.transitionDelay = `${index * 70}ms`;
    observer.observe(card);
});

function initSectionRevealAnimations() {
    const revealSelectors = [
        '.hero-title',
        '.hero-subtitle',
        '.hero-buttons',
        '.about-text h2',
        '.about-text p',
        '.about-list li',
        '.about-image',
        '.innovation .section-title',
        '.innovation .section-subtitle',
        '.innovation-card',
        '.pricing .section-title',
        '.pricing .section-subtitle',
        '.pricing-card',
        '.contact .section-title',
        '.contact .section-subtitle',
        '.contact-form',
        '.footer-section'
    ];

    const revealElements = document.querySelectorAll(revealSelectors.join(', '));

    revealElements.forEach((element, index) => {
        element.classList.add('reveal-on-scroll');
        element.style.transitionDelay = `${(index % 5) * 80}ms`;
        observer.observe(element);
    });
}

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================

let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');
const heroSection = document.querySelector('.hero');
let heroFadeTimeout;
let lastHeroFadeScroll = 0;

function triggerHeroSideFade() {
    if (!heroSection) {
        return;
    }

    heroSection.classList.remove('hero-side-fade-active');
    // Force reflow so repeated triggers replay the same animation.
    void heroSection.offsetWidth;
    heroSection.classList.add('hero-side-fade-active');

    clearTimeout(heroFadeTimeout);
    heroFadeTimeout = setTimeout(() => {
        heroSection.classList.remove('hero-side-fade-active');
    }, 780);
}

if (heroSection) {
    heroSection.addEventListener('mouseenter', triggerHeroSideFade);
}

window.addEventListener('scroll', function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }

    const now = Date.now();
    if (heroSection && now - lastHeroFadeScroll > 450) {
        triggerHeroSideFade();
        lastHeroFadeScroll = now;
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// ===========================
// COUNTER ANIMATION
// ===========================

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// ===========================
// DYNAMIC CONTENT LOADING
// ===========================

window.addEventListener('DOMContentLoaded', function () {
    console.log('Landing page loaded successfully');
    initSectionRevealAnimations();
    
    // Initialize tooltips or other dynamic content here
    // Example: You can add more interactive features as needed
});

// ===========================
// MOBILE MENU TOGGLE (Optional)
// ===========================

function createMobileMenu() {
    const navbar = document.querySelector('.navbar');
    const navMenu = document.querySelector('.nav-menu');
    
    // Check if mobile menu button exists, if not create one for smaller screens
    if (window.innerWidth <= 768) {
        if (!document.querySelector('.mobile-menu-btn')) {
            const menuBtn = document.createElement('button');
            menuBtn.classList.add('mobile-menu-btn');
            menuBtn.textContent = '☰';
            menuBtn.style.cssText = `
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                display: none;
            `;
            
            navbar.querySelector('.nav-wrapper').appendChild(menuBtn);
        }
    }
}

// Initialize mobile menu on load
createMobileMenu();

// Reinitialize on window resize
window.addEventListener('resize', createMobileMenu);

// ===========================
// LOCAL STORAGE FOR USER DATA
// ===========================

function saveUserPreference(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getUserPreference(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
}

// Example usage: Save if user has visited
if (!getUserPreference('visited')) {
    saveUserPreference('visited', true);
    console.log('First time visitor!');
}
