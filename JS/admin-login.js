/* ===========================
   ADMIN LOGIN FORM HANDLING
   =========================== */

// Get the login form
const loginForm = document.getElementById('adminLoginForm');

// Form submission handler
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.querySelector('input[name="remember"]').checked;
    
    // Basic validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }
    
    // Password validation (minimum 6 characters)
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Save remember me preference
    if (rememberMe) {
        localStorage.setItem('adminEmail', email);
    } else {
        localStorage.removeItem('adminEmail');
    }
    
    // Simulate login process
    loginForm.style.opacity = '0.6';
    loginForm.style.pointerEvents = 'none';
    
    // Simulate API call
    setTimeout(() => {
        // In a real application, you would send credentials to your backend
        console.log('Login attempt:', {
            email: email,
            remembered: rememberMe
        });
        
        // Simulate successful login
        showAlert('Login successful! Redirecting to dashboard...', 'success');
        
        // Store session
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminEmail', email);
        
        // Redirect to admin dashboard (create this page later)
        setTimeout(() => {
            window.location.href = 'AdminDashboard.html';
        }, 1500);
    }, 1500);
});

/* ===========================
   ALERT FUNCTION
   =========================== */

function showAlert(message, type) {
    // Remove existing alert if any
    const existingAlert = document.querySelector('.alert-message');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert-message alert-${type}`;
    alert.textContent = message;
    
    // Add styles
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
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/* ===========================
   LOAD SAVED EMAIL
   =========================== */

window.addEventListener('DOMContentLoaded', function() {
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
        document.getElementById('email').value = savedEmail;
        document.querySelector('input[name="remember"]').checked = true;
    }
    
    // Check if already logged in
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        window.location.href = 'AdminDashboard.html';
    }
});

/* ===========================
   REDIRECT TO SIGNUP
   =========================== */

function redirectToSignup() {
    // This would link to an admin signup page
    alert('Admin signup is restricted. Please contact your institution administrator.');
    // Uncomment the line below when you create the signup page
    // window.location.href = 'AdminSignup.html';
}

/* ===========================
   FORGOT PASSWORD
   =========================== */

document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showAlert('Please enter your email to reset password', 'error');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }
    
    showAlert('Password reset link sent to ' + email, 'success');
    // In a real app, this would trigger an API call to send reset email
});

/* ===========================
   KEYBOARD SHORTCUTS
   =========================== */

document.addEventListener('keydown', function(e) {
    // Enter key to submit form
    if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
        loginForm.dispatchEvent(new Event('submit'));
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
