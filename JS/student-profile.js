/* ===========================
   STUDENT PROFILE - JAVASCRIPT
   =========================== */

// Load student data from localStorage (for demonstration)
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    setupEventListeners();
});

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='100' fill='%231e40af'/%3E%3Ctext x='100' y='120' font-size='80' fill='white' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";

function goToDashboard(event) {
    const currentPath = window.location.pathname.toLowerCase();
    const isDashboard = currentPath.endsWith('/studentdashboard.html') || currentPath.endsWith('studentdashboard.html');

    if (isDashboard) {
        event.preventDefault();
        window.location.reload();
    }
}

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
    document.getElementById('phone').textContent = userData.phone || '+63 (xxxx) xxx-xxxx';
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

    const avatarImage = document.getElementById('profileAvatarImg');
    if (avatarImage) {
        avatarImage.src = userData.profileImage || DEFAULT_PROFILE_IMAGE;
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
    
    // Close modal when clicking outside the modal content
    const modal = document.getElementById('editModal');
    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeEditModal();
            }
        });
    }
}

/* ===========================
   EDIT PROFILE FUNCTION
   =========================== */

function editProfile() {
    const modal = document.getElementById('editModal');
    const userData = JSON.parse(localStorage.getItem('studentData') || '{}');
    
    // Populate form fields with current data
    document.getElementById('editFullName').value = userData.fullName || 'Alex Johnson';
    document.getElementById('editEmail').value = userData.email || 'alex.johnson@alumni.edu';
    document.getElementById('editPhone').value = userData.phone || '+63 (xxxx) xxx-xxxx';
    document.getElementById('editDob').value = userData.dob || 'January 15, 1998';
    document.getElementById('editGender').value = userData.gender || 'Male';
    document.getElementById('editLocation').value = userData.location || 'New York, USA';
    document.getElementById('editDegree').value = userData.degree || 'Bachelor of Science in Computer Science';
    document.getElementById('editUniversity').value = userData.university || 'State University';
    document.getElementById('editGraduationYear').value = userData.graduationYear || '2024';
    document.getElementById('editGpa').value = userData.gpa || '3.75 / 4.0';
    document.getElementById('editMajor').value = userData.major || 'Software Development & Artificial Intelligence';
    document.getElementById('editPosition').value = userData.position || 'Junior Software Developer';
    document.getElementById('editCompany').value = userData.company || 'Tech Solutions Inc.';
    document.getElementById('editIndustry').value = userData.industry || 'Information Technology';
    document.getElementById('editExperience').value = userData.experience || '2 years';
    document.getElementById('editBio').value = userData.bio || 'Passionate full-stack developer with expertise in web technologies and cloud solutions. Eager to contribute to innovative projects and mentor junior developers in the alumni network.';
    document.getElementById('editAboutMe').value = userData.aboutMe || "I'm a passionate software developer from New York with a strong background in computer science and a keen interest in artificial intelligence and cloud technologies. I graduated with honors in 2024 and currently work as a Junior Software Developer at Tech Solutions Inc. When not coding or exploring new technologies, I enjoy mentoring junior developers and contributing to open-source projects. I'm eager to connect with fellow alumni and collaborate on innovative projects.";

    const editPhotoInput = document.getElementById('editProfilePhoto');
    if (editPhotoInput) {
        editPhotoInput.value = '';
    }
    
    // Open modal
    modal.style.display = 'block';
}

/* ===========================
   CLOSE EDIT MODAL
   =========================== */

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
}

/* ===========================
   SAVE PROFILE CHANGES
   =========================== */

function saveProfile() {
    const existingData = JSON.parse(localStorage.getItem('studentData') || '{}');
    const updatedData = {
        fullName: document.getElementById('editFullName').value,
        studentId: existingData.studentId || 'STU-2024-0001',
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        dob: document.getElementById('editDob').value,
        gender: document.getElementById('editGender').value,
        location: document.getElementById('editLocation').value,
        degree: document.getElementById('editDegree').value,
        university: document.getElementById('editUniversity').value,
        graduationYear: document.getElementById('editGraduationYear').value,
        gpa: document.getElementById('editGpa').value,
        major: document.getElementById('editMajor').value,
        position: document.getElementById('editPosition').value,
        company: document.getElementById('editCompany').value,
        industry: document.getElementById('editIndustry').value,
        experience: document.getElementById('editExperience').value,
        bio: document.getElementById('editBio').value,
        aboutMe: document.getElementById('editAboutMe').value,
        skills: existingData.skills || ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Cloud Computing', 'Agile Methodology', 'Leadership'],
        profileImage: existingData.profileImage || DEFAULT_PROFILE_IMAGE
    };

    const photoInput = document.getElementById('editProfilePhoto');
    const selectedFile = photoInput && photoInput.files ? photoInput.files[0] : null;

    if (selectedFile) {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            updatedData.profileImage = event.target.result;
            persistProfileData(updatedData);
        };
        reader.readAsDataURL(selectedFile);
        return;
    }

    persistProfileData(updatedData);
}

function persistProfileData(updatedData) {
    localStorage.setItem('studentData', JSON.stringify(updatedData));
    closeEditModal();
    location.reload();
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
            phone: '+63 (xxxx) xxx-xxxx',
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
            skills: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Cloud Computing', 'Agile Methodology', 'Leadership'],
            profileImage: DEFAULT_PROFILE_IMAGE
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
