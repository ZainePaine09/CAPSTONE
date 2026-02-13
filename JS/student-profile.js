/* ===========================
   STUDENT PROFILE - JAVASCRIPT
   =========================== */

// Load student data from localStorage (for demonstration)
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    setupEventListeners();
});

/* ===========================
   LOAD PROFILE DATA
   =========================== */

function loadProfileData() {
    // Get user data from localStorage or use default values
    const userData = JSON.parse(localStorage.getItem('studentData') || '{}');
    
    // Personal Information
    document.getElementById('studentName').textContent = userData.fullName || 'Alex Johnson';
    document.getElementById('studentId').textContent = `Student ID: ${userData.studentId || 'STU-2024-0001'}`;
    document.getElementById('fullName').textContent = userData.fullName || 'Alex Johnson';
    document.getElementById('email').innerHTML = `<a href="mailto:${userData.email || 'alex.johnson@alumni.edu'}">${userData.email || 'alex.johnson@alumni.edu'}</a>`;
    document.getElementById('phone').textContent = userData.phone || '+1 (555) 123-4567';
    document.getElementById('dob').textContent = userData.dob || 'January 15, 1998';
    document.getElementById('gender').textContent = userData.gender || 'Male';
    document.getElementById('location').textContent = userData.location || 'New York, USA';
    
    // Academic Information
    document.getElementById('degree').textContent = userData.degree || 'Bachelor of Science in Computer Science';
    document.getElementById('university').textContent = userData.university || 'State University';
    document.getElementById('graduationYear').textContent = userData.graduationYear || '2024';
    document.getElementById('gpa').textContent = userData.gpa || '3.75 / 4.0';
    document.getElementById('major').textContent = userData.major || 'Software Development & Artificial Intelligence';
    
    // Professional Information
    document.getElementById('position').textContent = userData.position || 'Junior Software Developer';
    document.getElementById('company').textContent = userData.company || 'Tech Solutions Inc.';
    document.getElementById('industry').textContent = userData.industry || 'Information Technology';
    document.getElementById('experience').textContent = userData.experience || '2 years';
    document.getElementById('bio').textContent = userData.bio || 'Passionate full-stack developer with expertise in web technologies and cloud solutions. Eager to contribute to innovative projects and mentor junior developers in the alumni network.';
    
    // About
    document.getElementById('aboutMe').textContent = userData.aboutMe || "I'm a passionate software developer from New York with a strong background in computer science and a keen interest in artificial intelligence and cloud technologies. I graduated with honors in 2024 and currently work as a Junior Software Developer at Tech Solutions Inc. When not coding or exploring new technologies, I enjoy mentoring junior developers and contributing to open-source projects. I'm eager to connect with fellow alumni and collaborate on innovative projects.";
    
    // Skills
    if (userData.skills && Array.isArray(userData.skills)) {
        updateSkills(userData.skills);
    }
}

/* ===========================
   UPDATE SKILLS DISPLAY
   =========================== */

function updateSkills(skillsArray) {
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';
    
    skillsArray.forEach(skill => {
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag';
        skillTag.textContent = skill;
        skillsContainer.appendChild(skillTag);
    });
}

/* ===========================
   SETUP EVENT LISTENERS
   =========================== */

function setupEventListeners() {
    // Profile Menu Toggle
    const profileIcon = document.querySelector('.nav-profile .profile-icon');
    const profileMenu = document.querySelector('.profile-menu');
    
    if (profileIcon) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileMenu.style.display = profileMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const navProfile = document.querySelector('.nav-profile');
        if (navProfile && !navProfile.contains(e.target)) {
            if (profileMenu) profileMenu.style.display = 'none';
        }
    });
    
    // Add smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Mark active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Update edit button
    const editBtn = document.querySelector('.edit-profile-btn');
    if (editBtn) {
        editBtn.addEventListener('click', editProfile);
    }
}

/* ===========================
   EDIT PROFILE FUNCTION
   =========================== */

function editProfile() {
    const profileData = {
        fullName: document.getElementById('fullName').textContent,
        studentId: document.getElementById('studentId').textContent.replace('Student ID: ', ''),
        email: document.getElementById('email').textContent,
        phone: document.getElementById('phone').textContent,
        dob: document.getElementById('dob').textContent,
        gender: document.getElementById('gender').textContent,
        location: document.getElementById('location').textContent,
        degree: document.getElementById('degree').textContent,
        university: document.getElementById('university').textContent,
        graduationYear: document.getElementById('graduationYear').textContent,
        gpa: document.getElementById('gpa').textContent,
        major: document.getElementById('major').textContent,
        position: document.getElementById('position').textContent,
        company: document.getElementById('company').textContent,
        industry: document.getElementById('industry').textContent,
        experience: document.getElementById('experience').textContent,
        bio: document.getElementById('bio').textContent,
        aboutMe: document.getElementById('aboutMe').textContent
    };
    
    // Save to localStorage for potential edit page
    localStorage.setItem('editingProfile', JSON.stringify(profileData));
    
    // Show alert (you can replace this with a modal or edit page)
    alert('Edit Profile feature would open an edit modal or page. Here you can: \n\n✓ Update personal information\n✓ Change academic details\n✓ Update professional information\n✓ Add/remove skills\n✓ Update profile picture\n✓ Modify bio and about section');
}

/* ===========================
   LOGOUT FUNCTION
   =========================== */

function logout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        // Clear localStorage
        localStorage.removeItem('studentData');
        localStorage.removeItem('loggedInUser');
        
        // Redirect to login page
        window.location.href = 'StudentLogin.html';
    }
}

/* ===========================
   SAMPLE DATA INITIALIZATION
   =========================== */

// Initialize with sample data if no data exists
function initializeSampleData() {
    const existingData = localStorage.getItem('studentData');
    if (!existingData) {
        const sampleData = {
            fullName: 'Alex Johnson',
            studentId: 'STU-2024-0001',
            email: 'alex.johnson@alumni.edu',
            phone: '+1 (555) 123-4567',
            dob: 'January 15, 1998',
            gender: 'Male',
            location: 'New York, USA',
            degree: 'Bachelor of Science in Computer Science',
            university: 'State University',
            graduationYear: '2024',
            gpa: '3.75 / 4.0',
            major: 'Software Development & Artificial Intelligence',
            position: 'Junior Software Developer',
            company: 'Tech Solutions Inc.',
            industry: 'Information Technology',
            experience: '2 years',
            bio: 'Passionate full-stack developer with expertise in web technologies and cloud solutions.',
            aboutMe: "I'm a passionate software developer from New York with a strong background in computer science and a keen interest in artificial intelligence and cloud technologies.",
            skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Cloud Computing', 'Agile Methodology', 'Leadership']
        };
        localStorage.setItem('studentData', JSON.stringify(sampleData));
    }
}

// Initialize sample data on first load
window.addEventListener('load', () => {
    initializeSampleData();
});

/* ===========================
   ANIMATE ON SCROLL
   =========================== */

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all profile sections
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.profile-section');
    sections.forEach(section => {
        section.style.opacity = '0';
        observer.observe(section);
    });
});

/* ===========================
   SKILL TAG INTERACTIONS
   =========================== */

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('skill-tag')) {
        e.target.style.transform = 'scale(1.1)';
        setTimeout(() => {
            e.target.style.transform = 'scale(1)';
        }, 200);
    }
});
