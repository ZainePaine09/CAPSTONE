/* ===========================
   STUDENT LOGIN FORM HANDLING
   =========================== */

// Get the login form
const loginForm = document.getElementById('studentLoginForm');

// Form submission handler
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.querySelector('input[name="remember"]').checked;
    
    // Validation
    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
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
    
    // Check if student exists in localStorage
    const studentData = localStorage.getItem('studentData_' + email);
    if (!studentData) {
        showAlert('Student account not found. Please create an account first.', 'error');
        return;
    }
    
    // Disable form during submission
    disableForm();
    
    // Simulate login process
    setTimeout(() => {
        // Store login session
        sessionStorage.setItem('studentLoggedIn', 'true');
        sessionStorage.setItem('studentEmail', email);
        
        // Store remember me preference
        if (rememberMe) {
            localStorage.setItem('rememberedStudentEmail', email);
        } else {
            localStorage.removeItem('rememberedStudentEmail');
        }
        
        console.log('Student Login successful for:', email);
        
        // Show success message
        showAlert('Login successful! Redirecting to dashboard...', 'success');
        
        // Redirect to student dashboard
        setTimeout(() => {
            window.location.href = 'StudentDashboard.html';
        }, 1500);
    }, 1200);
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
   DISABLE/ENABLE FORM
   =========================== */

function disableForm() {
    loginForm.style.opacity = '0.7';
    loginForm.style.pointerEvents = 'none';
}

function enableForm() {
    loginForm.style.opacity = '1';
    loginForm.style.pointerEvents = 'auto';
}

/* ===========================
   KEYBOARD SHORTCUTS
   =========================== */

document.addEventListener('keydown', function(e) {
    // Enter key to submit form (only when in form)
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.closest('.login-form')) {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (activeElement === emailInput) {
                e.preventDefault();
                passwordInput.focus();
            } else if (activeElement === passwordInput) {
                e.preventDefault();
                loginForm.dispatchEvent(new Event('submit'));
            }
        }
    }
    
    // Escape key to clear form
    if (e.key === 'Escape') {
        loginForm.reset();
        document.getElementById('email').focus();
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
   AUTO-FILL REMEMBERED EMAIL
   =========================== */

window.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const rememberCheckbox = document.querySelector('input[name="remember"]');
    
    // Check if email was remembered
    const rememberedEmail = localStorage.getItem('rememberedStudentEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberCheckbox.checked = true;
        document.getElementById('password').focus();
    } else {
        emailInput.focus();
    }
});

/* ===========================
   FORGOT PASSWORD HANDLER
   =========================== */

const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showAlert('Please enter your email address first', 'warning');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Please enter a valid email address', 'error');
            return;
        }
        
        showAlert('Password reset link sent to ' + email, 'success');
        console.log('Password reset requested for:', email);
    });
}

/* ===========================
   SESSION MANAGEMENT
   =========================== */

// Check if already logged in
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('studentLoggedIn');
    if (isLoggedIn === 'true') {
        // User already logged in, could redirect to dashboard
        console.log('Student already logged in');
    }
});
