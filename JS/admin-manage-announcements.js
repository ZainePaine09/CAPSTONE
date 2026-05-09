                /* ===========================
   ADMIN MANAGE ANNOUNCEMENTS
   =========================== */

let selectedDate = null;
const ANNOUNCEMENTS_API_BASE = 'server/php';

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

let announcementsData = {};
let announcementsLoaded = false;

function getAnnouncementToken() {
    return sessionStorage.getItem('adminToken') || '';
}

function normalizeAnnouncement(announcement = {}) {
    return {
        id: Number(announcement.id) || 0,
        title: String(announcement.title || ''),
        type: String(announcement.type || announcement.announcementType || ''),
        date: String(announcement.date || announcement.announcementDate || ''),
        time: String(announcement.time || announcement.announcementTime || '').slice(0, 5),
        description: String(announcement.description || ''),
        details: String(announcement.details || ''),
        importance: String(announcement.importance || 'medium').toLowerCase(),
        createdByEmail: String(announcement.createdByEmail || announcement.created_by_email || ''),
        createdAt: String(announcement.createdAt || announcement.created_at || ''),
        updatedAt: String(announcement.updatedAt || announcement.updated_at || '')
    };
}

function groupAnnouncementsByDate(announcements = []) {
    return announcements.reduce((grouped, announcement) => {
        const dateKey = announcement.date || new Date().toISOString().split('T')[0];
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(announcement);
        return grouped;
    }, {});
}

function setAnnouncementsData(announcements = []) {
    announcementsData = groupAnnouncementsByDate(announcements.map(normalizeAnnouncement));
    announcementsLoaded = true;
}

async function loadAnnouncements() {
    const token = getAnnouncementToken();

    if (!token) {
        announcementsData = {};
        announcementsLoaded = true;
        displayExistingAnnouncements();
        return;
    }

    try {
        const response = await fetch(`${ANNOUNCEMENTS_API_BASE}/list_announcements.php?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            cache: 'no-cache'
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }

        setAnnouncementsData(Array.isArray(data.announcements) ? data.announcements : []);
        displayExistingAnnouncements();
    } catch (error) {
        console.warn('Failed to load announcements:', error);
        announcementsData = {};
        announcementsLoaded = true;
        displayExistingAnnouncements();
        showNotification('Unable to load announcements right now', 'error');
    }
}

function recordAnnouncementActivity(action, title) {
    if (typeof window.recordActivityLog !== 'function') {
        return;
    }

    const adminEmail = sessionStorage.getItem('adminEmail') || 'Administrator';
    window.recordActivityLog({
        role: 'admin',
        action,
        name: adminEmail,
        email: adminEmail,
        message: `Admin ${adminEmail} ${action.replace(/_/g, ' ')} announcement "${title}".`
    });
}

// ===========================
// INITIALIZE PAGE
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Get selected date from URL parameters
    const params = new URLSearchParams(window.location.search);
    selectedDate = params.get('date');
    
    if (!selectedDate) {
        selectedDate = new Date().toISOString().split('T')[0];
    }
    
    // Set the date display
    updateDateDisplay();
    
    // Set form date field
    document.getElementById('announcementDate').value = selectedDate;
    
    // Load and display existing announcements
    loadAnnouncements();
    
    // Setup form submission
    document.getElementById('announcementForm').addEventListener('submit', addAnnouncement);
    document.getElementById('editAnnouncementForm').addEventListener('submit', updateAnnouncement);

    // Logo click behavior: if scrolled down, scroll to top; if already at top, go back to dashboard
    const navLogo = document.querySelector('.nav-logo');
    if (navLogo) {
        navLogo.style.cursor = 'pointer';
        navLogo.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.scrollY > 0) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // already at top -> navigate back to dashboard
                window.location.href = 'AdminDashboard.html';
            }
        });
    }
});

// ===========================
// DATE DISPLAY
// ===========================

function updateDateDisplay() {
    const dateObj = new Date(selectedDate);
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);
    document.getElementById('selectedDateDisplay').textContent = `Selected Date: ${formattedDate}`;
}

function getAllAnnouncements() {
    return Object.keys(announcementsData)
        .reduce((all, dateKey) => {
            const items = Array.isArray(announcementsData[dateKey]) ? announcementsData[dateKey] : [];
            return all.concat(items);
        }, [])
        .sort((first, second) => {
            const firstStamp = new Date(`${first.date}T${first.time || '00:00'}`).getTime();
            const secondStamp = new Date(`${second.date}T${second.time || '00:00'}`).getTime();
            return secondStamp - firstStamp;
        });
}

function findAnnouncementById(id) {
    for (const dateKey in announcementsData) {
        const announcements = Array.isArray(announcementsData[dateKey]) ? announcementsData[dateKey] : [];
        const index = announcements.findIndex(announcement => announcement.id === id);
        if (index !== -1) {
            return { dateKey, index, announcement: announcements[index] };
        }
    }

    return null;
}

// ===========================
// DISPLAY EXISTING ANNOUNCEMENTS
// ===========================

function displayExistingAnnouncements() {
    const list = document.getElementById('existingAnnouncementsList');
    const announcements = getAllAnnouncements();
    
    if (announcements.length === 0) {
        list.innerHTML = '<p class="empty-message">No announcements have been added yet</p>';
        return;
    }
    
    list.innerHTML = announcements.map(announcement => `
        <div class="announcement-card">
            <div class="announcement-date-line">📅 ${new Date(announcement.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <h4>${escapeHtml(announcement.title)}</h4>
            <p>${escapeHtml(announcement.description)}</p>
            <div class="announcement-meta">
                <span class="announcement-badge">${escapeHtml(announcement.type)}</span>
                <span class="announcement-badge ${escapeHtml(announcement.importance)}">${escapeHtml(announcement.importance.toUpperCase())}</span>
                <span style="color: var(--light-text); font-size: 0.85rem;">🕐 ${escapeHtml(announcement.time)}</span>
            </div>
            <div class="announcement-actions">
                <button class="btn-small btn-edit-small" onclick="editAnnouncement(${announcement.id})">✏️ Edit</button>
                <button class="btn-small btn-clear-small" onclick="clearThisEvent(${announcement.id})">🧹 Clear This Event</button>
            </div>
        </div>
    `).join('');
}

// ===========================
// ADD ANNOUNCEMENT
// ===========================

function addAnnouncement(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('announcementTitle').value;
    const type = document.getElementById('announcementType').value;
    const importance = document.getElementById('announcementImportance').value;
    const date = document.getElementById('announcementDate').value;
    const time = document.getElementById('announcementTime').value;
    const description = document.getElementById('announcementDescription').value;
    const details = document.getElementById('announcementDetails').value;
    
    const token = getAnnouncementToken();
    if (!token) {
        showNotification('Please sign in again', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('title', title);
    formData.append('type', type);
    formData.append('importance', importance);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('description', description);
    formData.append('details', details);

    fetch(`${ANNOUNCEMENTS_API_BASE}/create_announcement.php`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json().then(data => ({ response, data })))
        .then(({ response, data }) => {
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Unable to add announcement');
            }

            recordAnnouncementActivity('announcement_create', title);
            showNotification('Announcement added successfully!', 'success');
            e.target.reset();
            document.getElementById('announcementDate').value = selectedDate;
            return loadAnnouncements();
        })
        .catch(error => {
            showNotification(error.message || 'Unable to add announcement', 'error');
        });
}

// ===========================
// EDIT ANNOUNCEMENT
// ===========================

function editAnnouncement(id) {
    // Find announcement
    const found = findAnnouncementById(id);
    const announcement = found?.announcement;
    
    if (!announcement) {
        showNotification('Announcement not found', 'error');
        return;
    }
    
    // Populate edit form
    document.getElementById('editAnnouncementId').value = id;
    document.getElementById('editTitle').value = announcement.title;
    document.getElementById('editType').value = announcement.type;
    document.getElementById('editImportance').value = announcement.importance;
    document.getElementById('editDate').value = announcement.date;
    document.getElementById('editTime').value = announcement.time;
    document.getElementById('editDescription').value = announcement.description;
    document.getElementById('editDetails').value = announcement.details;
    
    // Show modal
    document.getElementById('editAnnouncementModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updateAnnouncement(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editAnnouncementId').value);
    const title = document.getElementById('editTitle').value;
    const type = document.getElementById('editType').value;
    const importance = document.getElementById('editImportance').value;
    const date = document.getElementById('editDate').value;
    const time = document.getElementById('editTime').value;
    const description = document.getElementById('editDescription').value;
    const details = document.getElementById('editDetails').value;
    
    const token = getAnnouncementToken();
    if (!token) {
        showNotification('Please sign in again', 'error');
        return;
    }

    const found = findAnnouncementById(id);
    if (!found) {
        showNotification('Announcement not found', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('id', String(id));
    formData.append('title', title);
    formData.append('type', type);
    formData.append('importance', importance);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('description', description);
    formData.append('details', details);

    fetch(`${ANNOUNCEMENTS_API_BASE}/update_announcement.php`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json().then(data => ({ response, data })))
        .then(({ response, data }) => {
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Unable to update announcement');
            }

            recordAnnouncementActivity('announcement_update', title);
            showNotification('Announcement updated successfully!', 'success');
            closeEditModal();
            return loadAnnouncements();
        })
        .catch(error => {
            showNotification(error.message || 'Unable to update announcement', 'error');
        });
}

// ===========================
// CLEAR ANNOUNCEMENT
// ===========================

function clearThisEvent(id) {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
        return;
    }

    const found = findAnnouncementById(id);
    if (!found) {
        showNotification('Announcement not found', 'error');
        return;
    }

    const token = getAnnouncementToken();
    if (!token) {
        showNotification('Please sign in again', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('id', String(id));

    fetch(`${ANNOUNCEMENTS_API_BASE}/delete_announcement.php`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json().then(data => ({ response, data })))
        .then(({ response, data }) => {
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Unable to delete announcement');
            }

            recordAnnouncementActivity('announcement_delete', found.announcement.title);
            showNotification('Announcement cleared successfully!', 'success');
            return loadAnnouncements();
        })
        .catch(error => {
            showNotification(error.message || 'Unable to delete announcement', 'error');
        });
}

function clearAllAnnouncements() {
    if (!confirm('Are you sure you want to clear all announcements? This action cannot be undone.')) {
        return;
    }

    const token = getAnnouncementToken();
    if (!token) {
        showNotification('Please sign in again', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);

    fetch(`${ANNOUNCEMENTS_API_BASE}/clear_announcements.php`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json().then(data => ({ response, data })))
        .then(({ response, data }) => {
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Unable to clear announcements');
            }

            recordAnnouncementActivity('announcement_clear_all', 'all announcements');
            showNotification('All announcements cleared successfully!', 'success');
            return loadAnnouncements();
        })
        .catch(error => {
            showNotification(error.message || 'Unable to clear announcements', 'error');
        });
}

// ===========================
// MODAL FUNCTIONS
// ===========================

function closeEditModal() {
    document.getElementById('editAnnouncementModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('editAnnouncementForm').reset();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editAnnouncementModal');
    if (event.target === modal) {
        closeEditModal();
    }
}

// ===========================
// NAVIGATION
// ===========================

function goBackToDashboard() {
    window.location.href = 'AdminDashboard.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        localStorage.setItem('logoutMessage', 'You have been logged out successfully');
        // Clear session keys
        try {
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminEmail');
            sessionStorage.removeItem('adminToken');
        } catch (e) {}

        setTimeout(() => {
            window.location.href = 'AdminLogin.html';
        }, 800);
    }
}

// ===========================
// NOTIFICATION SYSTEM
// ===========================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#16a34a';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc2626';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ea580c';
            break;
        case 'info':
        default:
            notification.style.backgroundColor = '#0369a1';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
