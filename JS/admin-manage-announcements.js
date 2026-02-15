/* ===========================
   ADMIN MANAGE ANNOUNCEMENTS
   =========================== */

let selectedDate = null;
let announcementsData = JSON.parse(localStorage.getItem('announcementsData')) || {
    '2026-02-15': [
        { 
            id: 1,
            title: 'System Maintenance Notice', 
            type: 'Important',
            date: '2026-02-15',
            time: '10:00',
            description: 'Platform maintenance scheduled for today from 2 PM to 4 PM. All services will be temporary unavailable during this period. Please plan accordingly.',
            details: 'A planned maintenance will be conducted to improve system performance and security. We apologize for any inconvenience.',
            importance: 'high'
        },
        { 
            id: 2,
            title: 'New Feature Released', 
            type: 'Update',
            date: '2026-02-15',
            time: '14:00',
            description: 'New analytics dashboard released for better insights into user engagement.',
            details: 'The new analytics dashboard provides comprehensive reports on student engagement, event attendance, and mentor connections. Access it from the Reports section.',
            importance: 'medium'
        }
    ],
    '2026-02-18': [
        { 
            id: 3,
            title: 'Monthly All-Hands Meeting', 
            type: 'Meeting',
            date: '2026-02-18',
            time: '11:00',
            description: 'Monthly administrator meeting to discuss platform updates and strategy.',
            details: 'Join us for our monthly all-hands meeting where we discuss platform updates, improvements, and address any concerns from the admin team.',
            importance: 'medium'
        }
    ],
    '2026-02-22': [
        { 
            id: 4,
            title: 'Deadline: Event Registration Approval', 
            type: 'Reminder',
            date: '2026-02-22',
            time: '17:00',
            description: 'Please review and approve pending event registrations by end of day.',
            details: 'There are currently 7 pending event registrations awaiting your approval. Please review them and approve or reject accordingly.',
            importance: 'high'
        }
    ],
    '2026-02-25': [
        { 
            id: 5,
            title: 'Alumni Database Update', 
            type: 'Update',
            date: '2026-02-25',
            time: '09:00',
            description: 'Annual alumni database verification and cleanup completed.',
            details: 'The annual database verification has been completed. All duplicate entries have been removed and outdated information has been updated. The database is now 100% consistent.',
            importance: 'low'
        },
        { 
            id: 6,
            title: 'Q1 Performance Report Available', 
            type: 'Report',
            date: '2026-02-25',
            time: '15:00',
            description: 'Q1 performance report is now available for download.',
            details: 'The Q1 performance report includes comprehensive analytics on platform usage, user growth, engagement metrics, and recommendations for improvements.',
            importance: 'medium'
        }
    ]
};

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
    displayExistingAnnouncements();
    
    // Setup form submission
    document.getElementById('announcementForm').addEventListener('submit', addAnnouncement);
    document.getElementById('editAnnouncementForm').addEventListener('submit', updateAnnouncement);
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

// ===========================
// DISPLAY EXISTING ANNOUNCEMENTS
// ===========================

function displayExistingAnnouncements() {
    const list = document.getElementById('existingAnnouncementsList');
    const announcements = announcementsData[selectedDate] || [];
    
    if (announcements.length === 0) {
        list.innerHTML = '<p class="empty-message">No announcements for this date yet</p>';
        return;
    }
    
    list.innerHTML = announcements.map(announcement => `
        <div class="announcement-card">
            <h4>${announcement.title}</h4>
            <p>${announcement.description}</p>
            <div class="announcement-meta">
                <span class="announcement-badge">${announcement.type}</span>
                <span class="announcement-badge ${announcement.importance}">${announcement.importance.toUpperCase()}</span>
                <span style="color: var(--light-text); font-size: 0.85rem;">🕐 ${announcement.time}</span>
            </div>
            <div class="announcement-actions">
                <button class="btn-small btn-edit-small" onclick="editAnnouncement(${announcement.id})">✏️ Edit</button>
                <button class="btn-small btn-delete-small" onclick="deleteAnnouncement(${announcement.id})">🗑️ Delete</button>
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
    
    // Generate ID
    const newId = Math.max(...Object.values(announcementsData).flat().map(a => a.id || 0)) + 1;
    
    // Create announcement object
    const newAnnouncement = {
        id: newId,
        title,
        type,
        date,
        time,
        description,
        details,
        importance
    };
    
    // Add to data
    if (!announcementsData[date]) {
        announcementsData[date] = [];
    }
    announcementsData[date].push(newAnnouncement);
    
    // Save to localStorage
    localStorage.setItem('announcementsData', JSON.stringify(announcementsData));
    
    // Show notification
    showNotification('Announcement added successfully!', 'success');
    
    // Reset form
    e.target.reset();
    document.getElementById('announcementDate').value = selectedDate;
    
    // Refresh display
    displayExistingAnnouncements();
}

// ===========================
// EDIT ANNOUNCEMENT
// ===========================

function editAnnouncement(id) {
    // Find announcement
    const announcements = announcementsData[selectedDate] || [];
    const announcement = announcements.find(a => a.id === id);
    
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
    
    // Find and update announcement
    let found = false;
    for (const dateKey in announcementsData) {
        const idx = announcementsData[dateKey].findIndex(a => a.id === id);
        if (idx !== -1) {
            announcementsData[dateKey][idx] = {
                id,
                title,
                type,
                date,
                time,
                description,
                details,
                importance
            };
            found = true;
            
            // If date changed, move to new date
            if (dateKey !== date) {
                announcementsData[dateKey].splice(idx, 1);
                if (!announcementsData[date]) {
                    announcementsData[date] = [];
                }
                announcementsData[date].push({
                    id,
                    title,
                    type,
                    date,
                    time,
                    description,
                    details,
                    importance
                });
            }
            break;
        }
    }
    
    if (!found) {
        showNotification('Announcement not found', 'error');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('announcementsData', JSON.stringify(announcementsData));
    
    // Show notification
    showNotification('Announcement updated successfully!', 'success');
    
    // Close modal
    closeEditModal();
    
    // Refresh display
    displayExistingAnnouncements();
}

// ===========================
// DELETE ANNOUNCEMENT
// ===========================

function deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
        return;
    }
    
    // Find and delete announcement
    const announcements = announcementsData[selectedDate] || [];
    const idx = announcements.findIndex(a => a.id === id);
    
    if (idx !== -1) {
        announcements.splice(idx, 1);
        localStorage.setItem('announcementsData', JSON.stringify(announcementsData));
        showNotification('Announcement deleted successfully!', 'success');
        displayExistingAnnouncements();
    } else {
        showNotification('Announcement not found', 'error');
    }
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
        
        setTimeout(() => {
            window.location.href = 'AdminLogin.html';
        }, 1500);
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
