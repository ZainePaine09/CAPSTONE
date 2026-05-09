/* ===========================
   STUDENT SIGNUP FORM HANDLING
   =========================== */

// Get the signup form
const signupForm = document.getElementById('studentSignupForm');

function showAlert(message, type) {
    const existing = document.querySelector('.alert-message');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.className = `alert-message alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        padding: 12px 20px; border-radius: 8px; font-weight: 600;
        font-size: 14px; max-width: 360px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: #fff;
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
}

function markFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const group = input.closest('.form-group') || input.parentElement;
    input.style.borderColor = '#ef4444';
    input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.25)';
    if (group) {
        group.style.outline = '2px solid #ef4444';
        group.style.borderRadius = '8px';
    }
    const clear = () => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        if (group) { group.style.outline = ''; }
        input.removeEventListener('input', clear);
        input.removeEventListener('change', clear);
    };
    input.addEventListener('input', clear);
    input.addEventListener('change', clear);
}

function normalizeProgram(programValue = '') {
    const value = String(programValue || '').trim().toLowerCase();
    if (!value || value === 'all') return 'all';
    if (value.includes('bsit') || value.includes('information technology')) return 'bsit';
    if (value.includes('bscs') || value.includes('computer science')) return 'bscs';
    if (value.includes('bsemc') || value.includes('entertainment') || value.includes('multimedia') || value.includes('civil') || value.includes('construction')) return 'bsce';
    if (value.includes('bsba') || value.includes('business administration')) return 'bsba';
    return value.replace(/\s+/g, '');
}

// Form submission handler
signupForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const countryCodeElem = document.getElementById('country-code');
    const countryCode = countryCodeElem ? countryCodeElem.value.trim() : '+63';
    const phone = document.getElementById('phone').value.trim();
    const graduateYear = document.getElementById('graduate-year').value;
    const studentNumber = document.getElementById('student-number').value.trim();
    const degreeElem = document.getElementById('degree-input');
    const degree = degreeElem ? degreeElem.value : '';
    const termsAccepted = document.getElementById('terms').checked;

    if (!firstName || !lastName || !email || !phone || !countryCode || !graduateYear || !studentNumber || !degree) {
        if (!firstName) markFieldError('first-name');
        if (!lastName) markFieldError('last-name');
        if (!email) markFieldError('email');
        if (!phone) markFieldError('phone');
        if (!graduateYear) markFieldError('graduate-year');
        if (!studentNumber) markFieldError('student-number');
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        markFieldError('email');
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
        markFieldError('email');
        showAlert('Use a real Gmail account.', 'error');
        return;
    }

    if (/\d/.test(firstName) || /\d/.test(lastName)) {
        if (/\d/.test(firstName)) markFieldError('first-name');
        if (/\d/.test(lastName)) markFieldError('last-name');
        showAlert('Names cannot contain numbers', 'error');
        return;
    }

    if (!/^\d{11}$/.test(studentNumber)) {
        markFieldError('student-number');
        showAlert('Student number must be exactly 11 digits (numbers only)', 'error');
        return;
    }

    const currentYear = new Date().getFullYear();
    const year = parseInt(graduateYear, 10);
    if (year < 1950 || year > currentYear + 5) {
        markFieldError('graduate-year');
        showAlert('Please enter a valid graduation year', 'error');
        return;
    }

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneRegex.test(phone) || phoneDigits.length < 7) {
        markFieldError('phone');
        showAlert('Please enter a valid phone number', 'error');
        return;
    }

    if (!termsAccepted) {
        showAlert('You must accept the Terms of Service and Privacy Policy', 'error');
        return;
    }

    if (typeof window.firebaseGoogleSignIn !== 'function') {
        showAlert('Google sign-in is required to create a student account.', 'error');
        return;
    }

    disableForm();

    const studentProfile = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        email,
        phone: `${countryCode}${phone.replace(/^0+/, '')}`.trim(),
        countryCode,
        graduateYear,
        studentId: studentNumber,
        studentNumber,
        program: normalizeProgram(degree),
        degree,
        registeredDate: new Date().toISOString()
    };

    try {
        const credential = await window.firebaseGoogleSignIn();
        const firebaseUser = credential && credential.user ? credential.user : null;
        const firebaseEmail = firebaseUser && firebaseUser.email ? String(firebaseUser.email).trim().toLowerCase() : '';

        if (!firebaseUser || !firebaseEmail) {
            throw new Error('Google sign-in failed.');
        }

        if (!firebaseEmail.endsWith('@gmail.com')) {
            throw new Error('Use a real Gmail account.');
        }

        if (firebaseEmail !== email.toLowerCase()) {
            throw new Error('The email field must match the Google account you sign in with.');
        }

        const finalProfile = {
            ...studentProfile,
            email: firebaseEmail,
            firebaseUid: firebaseUser.uid || '',
            authProvider: firebaseUser.providerData && firebaseUser.providerData[0] ? (firebaseUser.providerData[0].providerId || 'google.com') : 'google.com'
        };

        const registerPayload = new FormData();
        registerPayload.append('email', finalProfile.email);
        registerPayload.append('password', finalProfile.studentNumber);
        registerPayload.append('firstName', finalProfile.firstName);
        registerPayload.append('lastName', finalProfile.lastName);
        registerPayload.append('studentNumber', finalProfile.studentNumber);
        registerPayload.append('program', finalProfile.program);
        registerPayload.append('graduateYear', finalProfile.graduateYear);

        const registerResponse = await fetch('server/php/register.php', {
            method: 'POST',
            body: registerPayload
        });
        const registerData = await registerResponse.json();

        if (!registerResponse.ok || !registerData.success) {
            throw new Error(registerData.error || 'Student registration failed.');
        }

        sessionStorage.setItem('studentLoggedIn', 'true');
        sessionStorage.setItem('studentEmail', firebaseEmail);
        sessionStorage.setItem('studentToken', registerData.token || '');

        showAlert('Google account verified successfully! Redirecting to login...', 'success');
        setTimeout(() => {
            window.location.href = 'StudentLogin.html';
        }, 1400);
    } catch (firebaseErr) {
        console.warn('Google signup failed:', firebaseErr);
        showAlert(firebaseErr && firebaseErr.message ? firebaseErr.message : 'Google sign-in is required to create a student account.', 'error');
    } finally {
        enableForm();
    }
});

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
if (passwordInput) {
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
}

/* ===========================
   PHONE NUMBER FORMATTING
   =========================== */

const phoneInput = document.getElementById('phone');
if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/[^\d\s\-()]/g, '');
    });
}

const countryCodeSelect = document.getElementById('country-code');
if (countryCodeSelect && phoneInput) {
    countryCodeSelect.addEventListener('change', function() {
        phoneInput.placeholder = this.value === '+63' ? '09815180902' : 'Enter phone number';
    });
}

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
        const alumniElem = document.getElementById('alumni-id');
        if (alumniElem) alumniElem.focus();
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
    const alumniElem = document.getElementById('alumni-id');
    if (alumniElem) alumniElem.focus();
});

/* ===========================
   CUSTOM DROPDOWN INTERACTIONS
   - Replaces the native select with the visible custom dropdown
   - Keeps a hidden input `#degree` in sync for form submission
   =========================== */

(function() {
    function closeAllDropdowns(except) {
        document.querySelectorAll('.custom-dropdown.open').forEach(function(dd) {
            if (dd !== except) dd.classList.remove('open');
            dd.setAttribute('aria-expanded', 'false');
        });
    }

    document.addEventListener('click', function(e) {
        const clicked = e.target.closest('.custom-dropdown');
        if (!clicked) {
            closeAllDropdowns();
            return;
        }
        // if clicked inside a dropdown, let its handler manage open/close
    });

    document.querySelectorAll('.custom-dropdown').forEach(function(dropdown) {
        const selected = dropdown.querySelector('.selected');
        const options = dropdown.querySelector('.options');
        const hiddenInputId = dropdown.getAttribute('data-name') || 'degree';
        const hiddenInput = document.getElementById(hiddenInputId);

        // Toggle dropdown on click of selected
        selected.addEventListener('click', function(e) {
            const isOpen = dropdown.classList.toggle('open');
            dropdown.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (isOpen) {
                // focus first option for keyboard accessibility
                const firstOpt = options.querySelector('.option');
                if (firstOpt) firstOpt.focus();
            }
        });

        // Option click -> set value and close
        options.querySelectorAll('.option').forEach(function(opt) {
            opt.setAttribute('tabindex', '0');
            opt.addEventListener('click', function(e) {
                const value = this.getAttribute('data-value') || '';
                const text = this.querySelector('.opt-text') ? this.querySelector('.opt-text').textContent : this.textContent.trim();
                // update selected text and hidden input
                selected.setAttribute('data-value', value);
                selected.firstChild && (selected.firstChild.nodeValue = text + ' ');
                selected.querySelector('.dropdown-caret') && selected.appendChild(selected.querySelector('.dropdown-caret'));
                if (hiddenInput) {
                    hiddenInput.value = value;
                    // trigger input event if other code depends on it
                    hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                dropdown.classList.remove('open');
                dropdown.setAttribute('aria-expanded', 'false');
            });

            // keyboard support for option (Enter / Space)
            opt.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        // keyboard support for the control (Enter/Escape)
        dropdown.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selected.click();
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('open');
                dropdown.setAttribute('aria-expanded', 'false');
                selected.focus();
            }
        });
    });

    // close on outside click handled above; also close on scroll
    window.addEventListener('scroll', function() {
        closeAllDropdowns();
    }, true);
})();
