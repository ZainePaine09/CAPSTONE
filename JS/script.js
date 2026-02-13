// ===========================
// SMOOTH SCROLL NAVIGATION
// ===========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// ===========================
// FORM SUBMISSION
// ===========================

const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        // Get form values
        const name = this.querySelector('input[placeholder="Your Name"]').value;
        const email = this.querySelector('input[placeholder="Your Email"]').value;
        const message = this.querySelector('textarea').value;
        
        // Simple validation
        if (name.trim() === '' || email.trim() === '' || message.trim() === '') {
            alert('Please fill out all fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email');
            return;
        }
        
        // Simulate form submission
        alert(`Thank you for your message, ${name}! We'll get back to you soon.`);
        this.reset();
    });
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
            entry.target.style.animation = 'slideInLeft 0.8s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all feature cards
document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.animation = `slideInLeft 0.8s ease ${index * 0.1}s forwards`;
});

// ===========================
// NAVBAR SCROLL EFFECT
// ===========================

let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 100) {
        navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
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
