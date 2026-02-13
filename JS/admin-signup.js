/* ===========================
   ADMIN SIGNUP FORM HANDLING
   =========================== */

// Get the signup form
const signupForm = document.getElementById('adminSignupForm');

// Form submission handler
signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get all form values
    const employeeID = document.getElementById('employee-id').value.trim();
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value.trim();
    const schoolName = document.getElementById('school-name').value.trim();
    const position = document.getElementById('position').value;
    const department = document.getElementById('department').value.trim();
    const officePhone = document.getElementById('office-phone').value.trim();
    const termsAccepted = document.getElementById('terms').checked;
    
    // Validation
    if (!employeeID || !firstName || !lastName || !email || !password || !phone || !schoolName || !position || !department) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }
    
    // Ensure it's a school email
    if (!email.includes('.edu') && !email.includes('.school') && !email.includes('school')) {
        // Optional: Comment out this check if you want to allow other emails
        // showAlert('Please use your school/institution official email address', 'warning');
    }
    
    // Password validation
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Password complexity for admins (should be stronger)
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        showAlert('Password must contain at least one uppercase letter and one number', 'error');
        return;
    }
    
    // Name validation (no numbers)
    if (/\d/.test(firstName) || /\d/.test(lastName)) {
        showAlert('Names cannot contain numbers', 'error');
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
        console.log('Admin Registration data:', {
            employeeID,
            firstName,
            lastName,
            email,
            phone,
            schoolName,
            position,
            department,
            officePhone
        });
        
        // Show success message
        showAlert('Admin account created successfully! Redirecting to login...', 'success');
        
        // Store registration data in localStorage (in real app, send to backend)
        const adminData = {
            employeeID,
            firstName,
            lastName,
            email,
            phone,
            schoolName,
            position,
            department,
            officePhone,
            registeredDate: new Date().toISOString(),
            role: 'admin'
        };
        localStorage.setItem('adminData_' + email, JSON.stringify(adminData));
        
        // Redirect to admin sign in page
        setTimeout(() => {
            window.location.href = 'SignInAdmin.html';
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
    } else if (type === 'warning') {
        alert.style.backgroundColor = '#fef3c7';
        alert.style.color = '#92400e';
        alert.style.border = '2px solid #fcd34d';
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
const strengthBar = document.querySelector('.strength-bar');
const strengthText = document.querySelector('.strength-text strong');

passwordInput.addEventListener('input', function() {
    const strength = checkPasswordStrength(this.value);
    updateStrengthIndicator(strength);
});

function checkPasswordStrength(password) {
    let strength = 'weak';
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) strength = 'weak';
    else if (score <= 4) strength = 'medium';
    else strength = 'strong';
    
    return strength;
}

function updateStrengthIndicator(strength) {
    if (!strengthBar || !strengthText) return;
    
    let width = '33%';
    let color = '#ef4444';
    
    if (strength === 'medium') {
        width = '66%';
        color = '#f59e0b';
    } else if (strength === 'strong') {
        width = '100%';
        color = '#10b981';
    }
    
    strengthBar.style.cssText = `
        width: ${width};
        background-color: ${color};
        transition: width 0.3s ease, background-color 0.3s ease;
    `;
    
    strengthText.textContent = strength;
    strengthText.style.color = color;
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
   OFFICE EXTENSION VALIDATION
   =========================== */

const officePhoneInput = document.getElementById('office-phone');
if (officePhoneInput) {
    officePhoneInput.addEventListener('input', function(e) {
        // Only allow numbers and hyphens
        e.target.value = e.target.value.replace(/[^0-9\-]/g, '');
    });
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
        document.getElementById('employee-id').focus();
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
    document.getElementById('employee-id').focus();
});

/* ===========================
   VERIFY SCHOOL EMAIL (Optional)
   =========================== */

const emailInput = document.getElementById('email');
emailInput.addEventListener('blur', function() {
    const email = this.value;
    
    // Warn if not a typical school email
    const isSchoolEmail = email.includes('.edu') || email.includes('.school') || email.includes('school') || email.includes('institution');
    
    if (!isSchoolEmail && email) {
        // This is optional - doesn't block submission
        console.warn('Warning: Please consider using your official school email for better security');
    }
});
