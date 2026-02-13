/* ===========================
   STUDENT SIGNUP FORM HANDLING
   =========================== */

// Get the signup form
const signupForm = document.getElementById('studentSignupForm');

// Form submission handler
signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get all form values
    const alumniID = document.getElementById('alumni-id').value.trim();
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value.trim();
    const graduateYear = document.getElementById('graduate-year').value;
    const studentNumber = document.getElementById('student-number').value.trim();
    const degree = document.getElementById('degree').value;
    const termsAccepted = document.getElementById('terms').checked;
    
    // Validation
    if (!alumniID || !firstName || !lastName || !email || !password || !phone || !graduateYear || !studentNumber || !degree) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Name validation (no numbers)
    if (/\d/.test(firstName) || /\d/.test(lastName)) {
        showAlert('Names cannot contain numbers', 'error');
        return;
    }
    
    // Graduate year validation
    const currentYear = new Date().getFullYear();
    const year = parseInt(graduateYear);
    if (year < 1950 || year > currentYear + 5) {
        showAlert('Please enter a valid graduation year', 'error');
        return;
    }
    
    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(phone) || phone.length < 10) {
        showAlert('Please enter a valid phone number', 'error');
        return;
    }
    
    // Terms acceptance
    if (!termsAccepted) {
        showAlert('You must accept the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    // All validations passed
    disableForm();
    
    // Simulate registration process
    setTimeout(() => {
        console.log('Registration data:', {
            alumniID,
            firstName,
            lastName,
            email,
            phone,
            graduateYear,
            studentNumber,
            degree
        });
        
        // Show success message
        showAlert('Account created successfully! Redirecting to login...', 'success');
        
        // Store registration data in localStorage (in real app, send to backend)
        const studentData = {
            alumniID,
            firstName,
            lastName,
            email,
            phone,
            graduateYear,
            studentNumber,
            degree,
            registeredDate: new Date().toISOString()
        };
        localStorage.setItem('studentData_' + email, JSON.stringify(studentData));
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'StudentLogin.html';
        }, 2000);
    }, 1500);
});

/* ===========================
   ALERT FUNCTION
   =========================== */

function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert-message');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert-message alert-${type}`;
    alert.textContent = message;
    
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        font-size: 0.9rem;
    `;
    
    if (type === 'error') {
        alert.style.backgroundColor = '#fee2e2';
        alert.style.color = '#991b1b';
        alert.style.border = '2px solid #fca5a5';
    } else if (type === 'success') {
        alert.style.backgroundColor = '#dcfce7';
        alert.style.color = '#166534';
        alert.style.border = '2px solid #86efac';
    }
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/* ===========================
   DISABLE FORM DURING SUBMISSION
   =========================== */

function disableForm() {
    signupForm.style.opacity = '0.7';
    signupForm.style.pointerEvents = 'none';
}

function enableForm() {
    signupForm.style.opacity = '1';
    signupForm.style.pointerEvents = 'auto';
}

/* ===========================
   PASSWORD STRENGTH CHECKER
   =========================== */

const passwordInput = document.getElementById('password');
const strengthBar = document.querySelector('.strength-bar::after') || document.querySelector('.strength-bar');
const strengthText = document.querySelector('.strength-text strong');

passwordInput.addEventListener('input', function() {
    const strength = checkPasswordStrength(this.value);
    updateStrengthIndicator(strength);
});

function checkPasswordStrength(password) {
    let strength = 'weak';
    let score = 0;
    
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) strength = 'weak';
    else if (score <= 4) strength = 'medium';
    else strength = 'strong';
    
    return strength;
}

function updateStrengthIndicator(strength) {
    const bar = document.querySelector('.strength-bar');
    const text = document.querySelector('.strength-text strong');
    
    if (!bar || !text) return;
    
    let width = '33%';
    let color = '#ef4444';
    
    if (strength === 'medium') {
        width = '66%';
        color = '#f59e0b';
    } else if (strength === 'strong') {
        width = '100%';
        color = '#10b981';
    }
    
    bar.style.cssText = `
        width: ${width};
        background-color: ${color};
        transition: width 0.3s ease, background-color 0.3s ease;
    `;
    
    text.textContent = strength;
    text.style.color = color;
}

/* ===========================
   PHONE NUMBER FORMATTING
   =========================== */

const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        if (value.length <= 3) {
            value = value;
        } else if (value.length <= 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        }
    }
    
    e.target.value = value;
});

/* ===========================
   GRADUATE YEAR AUTO-FILL
   =========================== */

const graduateYearInput = document.getElementById('graduate-year');
if (!graduateYearInput.value) {
    graduateYearInput.placeholder = new Date().getFullYear().toString();
}

/* ===========================
   KEYBOARD SHORTCUTS
   =========================== */

document.addEventListener('keydown', function(e) {
    // Enter key to submit form
    if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
            const nextButton = signupForm.querySelector('button[type="submit"]');
            if (nextButton) {
                e.preventDefault();
                // Move to next field or submit if it's the last field
                const inputs = Array.from(signupForm.querySelectorAll('input, select'));
                const currentIndex = inputs.indexOf(document.activeElement);
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    signupForm.dispatchEvent(new Event('submit'));
                }
            }
        }
    }
    
    // Escape key to clear form
    if (e.key === 'Escape') {
        signupForm.reset();
        document.getElementById('alumni-id').focus();
    }
});

/* ===========================
   ANIMATIONS
   =========================== */

const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(30px);
        }
    }
`;
document.head.appendChild(style);

/* ===========================
   AUTO-FOCUS
   =========================== */

window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('alumni-id').focus();
});
