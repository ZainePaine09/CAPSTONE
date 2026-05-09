/* ===========================
   STUDENT PROFILE - JAVASCRIPT
   =========================== */

const STUDENT_PROFILE_API_BASE = 'server/php';
let currentStudentProfile = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProfileData().catch(error => {
        console.warn('Failed to load student profile:', error);
    });
    setupEventListeners();
    loadFriendPanelData().catch(() => null);
});

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='100' fill='%23b69168'/%3E%3Ctext x='100' y='120' font-size='80' fill='white' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";

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

async function fetchCurrentStudentProfile() {
    const token = getStudentProfileToken();
    if (!token) {
        return null;
    }

    const response = await fetch(`${STUDENT_PROFILE_API_BASE}/get_profile.php`, {
        method: 'POST',
        body: new URLSearchParams({ token })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || !payload.success || !payload.profile) {
        throw new Error(payload?.error || 'Unable to load profile');
    }

    const profile = normalizeStudentProfile(payload.profile);
    currentStudentProfile = profile;
    sessionStorage.setItem('studentProfile', JSON.stringify(profile));
    return profile;
}

function normalizeStudentProfile(profile = {}) {
    return {
        firstName: String(profile.firstName || '').trim(),
        lastName: String(profile.lastName || '').trim(),
        fullName: String(profile.fullName || '').trim(),
        email: String(profile.email || '').trim().toLowerCase(),
        phone: String(profile.phone || '').trim(),
        dob: String(profile.dob || '').trim(),
        gender: String(profile.gender || '').trim(),
        location: String(profile.location || '').trim(),
        studentId: String(profile.studentId || profile.studentNumber || '').trim(),
        studentNumber: String(profile.studentNumber || profile.studentId || '').trim(),
        program: String(profile.program || '').trim(),
        degree: String(profile.degree || '').trim(),
        graduationYear: String(profile.graduationYear || '').trim(),
        university: String(profile.university || '').trim(),
        gpa: String(profile.gpa || '').trim(),
        major: String(profile.major || '').trim(),
        position: String(profile.position || '').trim(),
        company: String(profile.company || '').trim(),
        industry: String(profile.industry || '').trim(),
        experience: String(profile.experience || '').trim(),
        bio: String(profile.bio || '').trim(),
        aboutMe: String(profile.aboutMe || '').trim(),
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        profileImage: String(profile.profileImage || '').trim(),
        gmailAddress: String(profile.gmailAddress || '').trim(),
        authProvider: String(profile.authProvider || '').trim(),
        registeredDate: String(profile.registeredDate || '').trim()
    };
}

function getCurrentStudentProfile() {
    return currentStudentProfile || normalizeStudentProfile({
        fullName: 'Student',
        email: '',
        skills: []
    });
}

async function loadProfileData() {
    let userData = null;

    try {
        userData = await fetchCurrentStudentProfile();
    } catch (error) {
        console.warn('Profile fetch failed:', error);
        userData = currentStudentProfile || null;
    }

    if (!userData) {
        userData = normalizeStudentProfile({
            fullName: 'Student',
            email: '',
            skills: []
        });
    }
    
    // Personal Information
    document.getElementById('studentName').textContent = userData.fullName || 'Student';
    document.getElementById('studentId').textContent = `Student ID: ${userData.studentId || 'Not set'}`;
    document.getElementById('fullName').textContent = userData.fullName || 'Student';
    document.getElementById('email').innerHTML = `<a href="mailto:${userData.email || ''}">${userData.email || 'Not set'}</a>`;
    document.getElementById('phone').textContent = userData.phone || 'Not set';
    document.getElementById('dob').textContent = userData.dob || 'Not set';
    document.getElementById('gender').textContent = userData.gender || 'Not set';
    document.getElementById('location').textContent = userData.location || 'Not set';
    
    // Academic Information
    document.getElementById('degree').textContent = userData.degree || 'Not set';
    document.getElementById('university').textContent = userData.university || 'Not set';
    document.getElementById('graduationYear').textContent = userData.graduationYear || 'Not set';
    document.getElementById('gpa').textContent = userData.gpa || 'Not set';
    document.getElementById('major').textContent = userData.major || 'Not set';
    
    // Professional Information
    document.getElementById('position').textContent = userData.position || 'Not set';
    document.getElementById('company').textContent = userData.company || 'Not set';
    document.getElementById('industry').textContent = userData.industry || 'Not set';
    document.getElementById('experience').textContent = userData.experience || 'Not set';
    document.getElementById('bio').textContent = userData.bio || 'Not set';
    
    // About
    document.getElementById('aboutMe').textContent = userData.aboutMe || 'Not set';
    
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
   FRIENDS UI ACTIONS
   =========================== */

const FRIEND_API_BASE = 'server/php';
let friendRequestsCache = [];
let friendListCache = [];
let friendStatusLoaded = false;

function getStudentFriendToken() {
    return sessionStorage.getItem('studentToken') || localStorage.getItem('studentToken') || '';
}

function getStudentProfileToken() {
    return sessionStorage.getItem('studentToken') || localStorage.getItem('studentToken') || '';
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatFriendlyDate(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) {
        return 'Recently';
    }

    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showProfileNotice(title, message, type = 'info') {
    if (typeof showNotification === 'function') {
        showNotification(title, message, type);
        return;
    }

    alert(`${title}\n${message}`);
}

async function loadFriendPanelData() {
    const token = getStudentFriendToken();
    const summary = document.getElementById('friendStatusSummary');
    const list = document.getElementById('friendStatusList');

    if (!summary || !list) {
        return;
    }

    if (!token) {
        summary.innerHTML = `
            <div class="status-pill status-pending">Pending: 0</div>
            <div class="status-pill status-accepted">Accepted: 0</div>
            <div class="status-pill status-rejected">Rejected: 0</div>
        `;
        list.innerHTML = '<p class="status-empty">Sign in again to load friend status.</p>';
        return;
    }

    if (!friendStatusLoaded) {
        summary.innerHTML = `
            <div class="status-pill status-pending">Pending: ...</div>
            <div class="status-pill status-accepted">Accepted: ...</div>
            <div class="status-pill status-rejected">Rejected: ...</div>
        `;
        list.innerHTML = '<p class="status-empty">Loading friend status...</p>';
    }

    const [requestsResponse, friendsResponse] = await Promise.all([
        fetch(`${FRIEND_API_BASE}/list_friend_requests.php?token=${encodeURIComponent(token)}`),
        fetch(`${FRIEND_API_BASE}/list_friends.php`, {
            method: 'POST',
            body: new URLSearchParams({ token })
        })
    ]);

    const requestsData = await requestsResponse.json();
    const friendsData = await friendsResponse.json();

    if (!requestsResponse.ok || !requestsData.success) {
        throw new Error(requestsData.error || 'Unable to load friend requests');
    }

    if (!friendsResponse.ok || !friendsData.success) {
        throw new Error(friendsData.error || 'Unable to load friends');
    }

    friendRequestsCache = Array.isArray(requestsData.requests) ? requestsData.requests : [];
    friendListCache = Array.isArray(friendsData.friends) ? friendsData.friends : [];
    friendStatusLoaded = true;

    renderFriendStatusPanel();
}

function renderFriendStatusPanel() {
    const summary = document.getElementById('friendStatusSummary');
    const list = document.getElementById('friendStatusList');
    if (!summary || !list) return;

    const counts = friendRequestsCache.reduce((accumulator, item) => {
        const status = String(item.status || 'pending').toLowerCase();
        if (status === 'pending') accumulator.pending += 1;
        if (status === 'accepted') accumulator.accepted += 1;
        if (status === 'rejected') accumulator.rejected += 1;
        return accumulator;
    }, { pending: 0, accepted: friendListCache.length, rejected: 0 });

    summary.innerHTML = `
        <div class="status-pill status-pending">Pending: ${counts.pending}</div>
        <div class="status-pill status-accepted">Accepted: ${counts.accepted}</div>
        <div class="status-pill status-rejected">Rejected: ${counts.rejected}</div>
    `;

    const recentRequests = friendRequestsCache.slice(0, 5).map(item => {
        const directionLabel = item.direction === 'incoming' ? 'From' : 'To';
        const counterpart = item.direction === 'incoming' ? item.requesterName : item.receiverName;
        return `
            <div class="friend-status-item status-${String(item.status || 'pending').toLowerCase()}">
                <div class="friend-status-email">${directionLabel}: ${escapeHtml(counterpart || 'Unknown')}</div>
                <div class="friend-status-label">${escapeHtml(item.status || 'pending')} • ${formatFriendlyDate(item.createdAt)}</div>
            </div>
        `;
    });

    const recentFriends = friendListCache.slice(0, 5).map(item => `
        <div class="friend-status-item status-accepted">
            <div class="friend-status-email">${escapeHtml(item.friendName || item.friendEmail || 'Friend')}</div>
            <div class="friend-status-label">Friend • ${formatFriendlyDate(item.createdAt)}</div>
        </div>
    `);

    const recent = [...recentRequests, ...recentFriends];

    if (!recent.length) {
        list.innerHTML = '<p class="status-empty">No friend activity yet.</p>';
        return;
    }

    list.innerHTML = recent.join('');
}

function openFriendComposer() {
    const modal = document.getElementById('addFriendModal');
    const input = document.getElementById('addFriendEmailInput');
    const err = document.getElementById('addFriendError');
    if (!modal) return;
    if (input) input.value = '';
    if (err) err.style.display = 'none';
    modal.style.display = 'flex';
    setTimeout(() => input && input.focus(), 50);
}

function closeFriendModal(event) {
    if (event && event.target !== document.getElementById('addFriendModal')) return;
    const modal = document.getElementById('addFriendModal');
    if (modal) modal.style.display = 'none';
}

async function submitAddFriend() {
    const input = document.getElementById('addFriendEmailInput');
    const errEl = document.getElementById('addFriendError');
    const email = String(input?.value || '').trim().toLowerCase();

    const showErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; } };
    if (errEl) errEl.style.display = 'none';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showErr('Please enter a valid email address.');
        return;
    }

    const token = getStudentFriendToken();
    if (!token) { showErr('Please sign in again.'); return; }

    try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('receiverEmail', email);

        const response = await fetch(`${FRIEND_API_BASE}/send_friend_request.php`, { method: 'POST', body: formData });
        const data = await response.json();

        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to send friend request');

        document.getElementById('addFriendModal').style.display = 'none';
        showProfileNotice('Success', `Friend request sent to ${email}`, 'success');
        await loadFriendPanelData();
    } catch (error) {
        showErr(error.message || 'Unable to send friend request');
    }
}

function viewFriendRequests() {
    if (!friendRequestsCache.length) {
        showProfileNotice('Friend Requests', 'No friend requests yet.', 'info');
        return;
    }

    const summary = friendRequestsCache
        .slice(0, 5)
        .map(item => `${item.direction === 'incoming' ? item.requesterName : item.receiverName} (${item.status})`)
        .join('\n');

    showProfileNotice('Friend Requests', summary, 'info');
}

function viewFriendsList() {
    if (!friendListCache.length) {
        showProfileNotice('My Friends', 'No friends saved yet.', 'info');
        return;
    }

    const summary = friendListCache
        .slice(0, 5)
        .map(item => item.friendName || item.friendEmail || 'Friend')
        .join('\n');

    showProfileNotice('My Friends', summary, 'info');
}

async function cancelFriendRequest(requestId) {
    const token = getStudentFriendToken();
    if (!token) {
        showProfileNotice('Cancel Request', 'Please sign in again.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('requestId', String(requestId));

    const response = await fetch(`${FRIEND_API_BASE}/cancel_friend_request.php`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to cancel request');
    }

    await loadFriendPanelData();
}

/* ===========================
   EDIT PROFILE FUNCTION
   =========================== */

function editProfile() {
    const modal = document.getElementById('editModal');
    const userData = getCurrentStudentProfile();
    
    // Populate form fields with current data
    document.getElementById('editFullName').value = userData.fullName || '';
    document.getElementById('editEmail').value = userData.email || '';
    document.getElementById('editEmail').readOnly = true;
    document.getElementById('editPhone').value = userData.phone || '';
    document.getElementById('editDob').value = userData.dob || '';
    document.getElementById('editGender').value = userData.gender || '';
    document.getElementById('editLocation').value = userData.location || '';
    document.getElementById('editDegree').value = userData.degree || '';
    document.getElementById('editUniversity').value = userData.university || '';
    document.getElementById('editGraduationYear').value = userData.graduationYear || '';
    document.getElementById('editGpa').value = userData.gpa || '';
    document.getElementById('editMajor').value = userData.major || '';
    document.getElementById('editPosition').value = userData.position || '';
    document.getElementById('editCompany').value = userData.company || '';
    document.getElementById('editIndustry').value = userData.industry || '';
    document.getElementById('editExperience').value = userData.experience || '';
    document.getElementById('editBio').value = userData.bio || '';
    document.getElementById('editAboutMe').value = userData.aboutMe || '';

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

async function saveProfile() {
    const existingData = getCurrentStudentProfile();
    const updatedData = {
        fullName: document.getElementById('editFullName').value,
        studentId: existingData.studentId || '',
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
        profileImage: existingData.profileImage || DEFAULT_PROFILE_IMAGE,
        gmailAddress: existingData.gmailAddress || '',
        authProvider: existingData.authProvider || ''
    };

    const photoInput = document.getElementById('editProfilePhoto');
    const selectedFile = photoInput && photoInput.files ? photoInput.files[0] : null;

    if (selectedFile) {
        if (!selectedFile.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            updatedData.profileImage = event.target.result;
            await persistProfileData(updatedData);
        };
        reader.readAsDataURL(selectedFile);
        return;
    }

    await persistProfileData(updatedData);
}

async function persistProfileData(updatedData) {
    const token = getStudentProfileToken();
    if (!token) {
        alert('Please sign in again before saving your profile.');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('fullName', updatedData.fullName || '');
    formData.append('phone', updatedData.phone || '');
    formData.append('dob', updatedData.dob || '');
    formData.append('gender', updatedData.gender || '');
    formData.append('location', updatedData.location || '');
    formData.append('degree', updatedData.degree || '');
    formData.append('university', updatedData.university || '');
    formData.append('graduationYear', updatedData.graduationYear || '');
    formData.append('gpa', updatedData.gpa || '');
    formData.append('major', updatedData.major || '');
    formData.append('position', updatedData.position || '');
    formData.append('company', updatedData.company || '');
    formData.append('industry', updatedData.industry || '');
    formData.append('experience', updatedData.experience || '');
    formData.append('bio', updatedData.bio || '');
    formData.append('aboutMe', updatedData.aboutMe || '');
    formData.append('skills', JSON.stringify(updatedData.skills || []));
    formData.append('profileImage', updatedData.profileImage || '');
    formData.append('gmailAddress', updatedData.gmailAddress || '');
    formData.append('authProvider', updatedData.authProvider || '');

    const response = await fetch(`${STUDENT_PROFILE_API_BASE}/update_profile.php`, {
        method: 'POST',
        body: formData
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || !payload.success) {
        alert(payload?.error || 'Unable to save profile changes.');
        return;
    }

    currentStudentProfile = normalizeStudentProfile({
        ...updatedData,
        email: currentStudentProfile?.email || updatedData.email || ''
    });
    sessionStorage.setItem('studentProfile', JSON.stringify(currentStudentProfile));
    closeEditModal();
    await loadProfileData();
}

/* ===========================
   LOGOUT FUNCTION
   =========================== */

function logout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        sessionStorage.removeItem('studentProfile');
        sessionStorage.removeItem('studentEmail');
        sessionStorage.removeItem('studentToken');
        sessionStorage.removeItem('studentLoggedIn');
        
        // Redirect to login page
        window.location.href = 'StudentLogin.html';
    }
}

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

/* ===========================
   SKILLS EDITOR - Suggestions and persistence
   =========================== */

const PROGRAM_SUGGESTIONS = {
    bsit: ['JavaScript','HTML','CSS','React','Node.js','Databases','Networking','Cloud Computing'],
    bscs: ['Algorithms','Data Structures','Java','Python','C++','Databases','Software Engineering','AI/ML'],
    bsemc: ['AutoCAD','Civil Engineering','Construction Management','Project Planning','Surveying','Structural Analysis','Materials Science'],
    bsba: ['Accounting','Finance','Marketing','Business Analysis','Project Management','Excel','Communication','Leadership']
};

function openSkillsEditor() {
    const editor = document.getElementById('skillsEditor');
    const select = document.getElementById('skillDegreeSelect');
    const custom = document.getElementById('skillDegreeCustom');
    const userData = getCurrentStudentProfile();

    // guess program from stored degree string
    const degreeStr = (userData.degree || '').toLowerCase();
    let initial = 'bsit';
    if (degreeStr.includes('bsit')) initial = 'bsit';
    else if (degreeStr.includes('bscs')) initial = 'bscs';
    else if (degreeStr.includes('bsce') || degreeStr.includes('bsemc')) initial = 'bsemc';
    else if (degreeStr.includes('bsba')) initial = 'bsba';

    // sync native select (hidden) and custom UI
    if (select) select.value = initial;
    if (custom) {
        const valueEl = custom.querySelector('.custom-select__value');
        const optionNodes = Array.from(custom.querySelectorAll('.custom-select__option'));
        const matchOpt = custom.querySelector(`.custom-select__option[data-value="${initial}"]`);
        if (matchOpt) valueEl.textContent = matchOpt.textContent;
        optionNodes.forEach(o => o.classList.toggle('selected', o.dataset.value === initial));

        // initialize interactions once
        if (!custom.dataset.inited) {
            const trigger = custom.querySelector('.custom-select__trigger');
            const optionsWrap = custom.querySelector('.custom-select__options');

            trigger.addEventListener('click', (e) => {
                const isOpen = custom.classList.toggle('open');
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });

            optionNodes.forEach(opt => {
                opt.addEventListener('click', () => {
                    const v = opt.dataset.value;
                    if (select) select.value = v;
                    valueEl.textContent = opt.textContent;
                    optionNodes.forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    custom.classList.remove('open');
                    trigger.setAttribute('aria-expanded', 'false');
                    populateSuggestions(v);
                });
            });

            // close when clicking outside
            document.addEventListener('click', (ev) => {
                if (!custom.contains(ev.target)) {
                    custom.classList.remove('open');
                    const tr = custom.querySelector('.custom-select__trigger');
                    if (tr) tr.setAttribute('aria-expanded', 'false');
                }
            });

            custom.dataset.inited = '1';
        }
    }

    populateSuggestions(select.value);
    editor.style.display = 'block';

    document.getElementById('addCustomSkillBtn').addEventListener('click', addCustomSkillFromInput);
    const input = document.getElementById('customSkillInput');
    input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') { ev.preventDefault(); addCustomSkillFromInput(); } });
}

function closeSkillsEditor() {
    const editor = document.getElementById('skillsEditor');
    editor.style.display = 'none';
}

function populateSuggestions(programKey) {
    const suggestionsEl = document.getElementById('suggestions');
    suggestionsEl.innerHTML = '';
    const suggestions = PROGRAM_SUGGESTIONS[programKey] || [];

    suggestions.forEach(skill => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-view suggestion-btn';
        btn.textContent = skill;
        btn.addEventListener('click', () => {
            toggleSuggestionSkill(skill, btn);
        });
        suggestionsEl.appendChild(btn);
    });

    // mark already-selected skills
    const existing = Array.from(document.querySelectorAll('#skillsContainer .skill-tag')).map(d => d.textContent.trim());
    suggestionsEl.querySelectorAll('button').forEach(btn => {
        if (existing.includes(btn.textContent)) btn.classList.add('selected');
    });
}

function toggleSuggestionSkill(skill, btnEl) {
    const existing = Array.from(document.querySelectorAll('#skillsContainer .skill-tag')).map(d => d.textContent.trim());
    if (existing.includes(skill)) {
        removeSkillTag(skill);
        btnEl.classList.remove('selected');
    } else {
        addSkillTag(skill);
        btnEl.classList.add('selected');
    }
}

function addCustomSkillFromInput() {
    const input = document.getElementById('customSkillInput');
    const v = (input.value || '').trim();
    if (!v) return;
    addSkillTag(v);
    input.value = '';
}

function addSkillTag(skill) {
    // prevent duplicates
    const skillsContainer = document.getElementById('skillsContainer');
    const existing = Array.from(skillsContainer.querySelectorAll('.skill-tag')).map(n => n.textContent.trim().toLowerCase());
    if (existing.includes(skill.toLowerCase())) return;

    const skillTag = document.createElement('div');
    skillTag.className = 'skill-tag';
    skillTag.textContent = skill;
    // allow click to remove while in editor (double-click)
    skillTag.title = 'Click to remove';
    skillTag.addEventListener('click', () => {
        // when editor open, remove immediately
        const editor = document.getElementById('skillsEditor');
        if (editor && editor.style.display !== 'none') {
            removeSkillTag(skill);
        }
    });
    skillsContainer.appendChild(skillTag);
}

function removeSkillTag(skill) {
    const skillsContainer = document.getElementById('skillsContainer');
    const nodes = Array.from(skillsContainer.querySelectorAll('.skill-tag'));
    for (const n of nodes) {
        if (n.textContent.trim().toLowerCase() === skill.toLowerCase()) {
            n.remove();
            break;
        }
    }
}

function saveSkillsFromEditor() {
    const skillsContainer = document.getElementById('skillsContainer');
    const skills = Array.from(skillsContainer.querySelectorAll('.skill-tag')).map(n => n.textContent.trim()).filter(s => s);

    currentStudentProfile = {
        ...getCurrentStudentProfile(),
        skills
    };

    updateSkills(skills);
    persistProfileData(currentStudentProfile).catch(error => {
        console.warn('Failed to save skills:', error);
    });
    closeSkillsEditor();
}

