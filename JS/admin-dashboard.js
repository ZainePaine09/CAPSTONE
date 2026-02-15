/* ===========================
   ADMIN DASHBOARD JAVASCRIPT
   =========================== */

// ===========================
// CALENDAR VARIABLES
// ===========================

let currentDate = new Date();
const calendarDaysContainer = document.getElementById('calendarDays');
const monthYearElement = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDateElement = document.getElementById('selectedDate');
const dayAnnouncementsListElement = document.getElementById('dayAnnouncementsList');

// Load announcements data from localStorage or use default data
const defaultAnnouncementsData = {
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

// Get announcements from localStorage or use defaults
let announcementsList = JSON.parse(localStorage.getItem('announcementsData')) || defaultAnnouncementsData;

// Save defaults if first time
if (!localStorage.getItem('announcementsData')) {
    localStorage.setItem('announcementsData', JSON.stringify(defaultAnnouncementsData));
}

// ===========================
// NAVIGATION & SECTION SWITCHING
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners for navigation
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            switchSection(sectionId);
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Initialize calendar
    renderCalendar();
    selectDay(new Date().getDate(), new Date().getMonth(), new Date().getFullYear());
    
    // Setup calendar navigation
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
});

function switchSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// ===========================
// CALENDAR FUNCTIONS
// ===========================

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Reload announcements from localStorage
    announcementsList = JSON.parse(localStorage.getItem('announcementsData')) || announcementsList;
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar days
    calendarDaysContainer.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        const emptyElement = document.createElement('div');
        emptyElement.className = 'calendar-day empty-day';
        calendarDaysContainer.appendChild(emptyElement);
    }
    
    // Add days of current month only
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        const dayElement = createDayElement(day, false, isToday);
        
        // Add announcement indicator
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (announcementsList[dateStr] && announcementsList[dateStr].length > 0) {
            dayElement.classList.add('has-event');
        }
        
        // Add click handler
        dayElement.addEventListener('click', () => selectDay(day, month, year));
        
        calendarDaysContainer.appendChild(dayElement);
    }
}

function createDayElement(day, isOtherMonth = false, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    return dayElement;
}

function selectDay(day, month, year) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Find and select the correct day element
    const dayElements = document.querySelectorAll('.calendar-day');
    for (let element of dayElements) {
        if (element.textContent.trim() === String(day) && !element.classList.contains('other-month') && !element.classList.contains('empty-day')) {
            const allDays = Array.from(dayElements);
            const elementIndex = allDays.indexOf(element);
            const firstDay = new Date(year, month, 1).getDay();
            const expectedIndex = firstDay + day - 1;
            
            if (Math.abs(elementIndex - expectedIndex) < 2) {
                element.classList.add('selected');
                break;
            }
        }
    }
    
    // Format date string
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    selectedDateElement.textContent = `${dayNames[dateObj.getDay()]}, ${monthNames[month]} ${day}`;
    
    // Show announcements for selected day
    displayAnnouncements(dateStr);
}

function displayAnnouncements(dateStr) {
    const announcements = announcementsList[dateStr] || [];
    
    if (announcements.length === 0) {
        dayAnnouncementsListElement.innerHTML = `
            <p class="no-announcements">No announcements for this day</p>
            <button class="btn-primary" style="width: 100%; margin-top: 1rem;" onclick="navigateToManageAnnouncements('${dateStr}')">✏️ Create Announcement</button>
        `;
        return;
    }
    
    dayAnnouncementsListElement.innerHTML = announcements.map(announcement => `
        <div class="announcement-item" onclick="viewAnnouncementDetails(${announcement.id})">
            <h4>${announcement.title}</h4>
            <p>${announcement.description}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                <span class="announcement-badge">${announcement.type}</span>
                <span class="announcement-badge" style="background: ${announcement.importance === 'high' ? '#dc2626' : announcement.importance === 'medium' ? '#ea580c' : '#16a34a'};">${announcement.importance.toUpperCase()}</span>
            </div>
        </div>
    `).join('') + `
        <button class="btn-primary" style="width: 100%; margin-top: 1rem;" onclick="navigateToManageAnnouncements('${dateStr}')">✏️ Manage Announcements</button>
    `;
}

function navigateToManageAnnouncements(dateStr) {
    window.location.href = `AdminManageAnnouncements.html?date=${dateStr}`;
}

// ===========================
// MODAL FUNCTIONS
// ===========================

function openModal(modalType) {
    const modalMap = {
        'addStudent': 'addStudentModal',
        'createEvent': 'createEventModal',
        'addMentor': 'addMentorModal'
    };
    
    const modalId = modalMap[modalType];
    if (modalId) {
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalType) {
    const modalMap = {
        'addStudent': 'addStudentModal',
        'createEvent': 'createEventModal',
        'addMentor': 'addMentorModal'
    };
    
    const modalId = modalMap[modalType];
    if (modalId) {
        document.getElementById(modalId).style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function closeAnnouncementModal() {
    const modal = document.getElementById('announcementDetailsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function viewAnnouncementDetails(announcementId) {
    // Find announcement in all announcements
    let announcement = null;
    for (const date in announcementsList) {
        const found = announcementsList[date].find(a => a.id === announcementId);
        if (found) {
            announcement = found;
            break;
        }
    }
    
    if (!announcement) return;
    
    const detailsDiv = document.getElementById('announcementDetails');
    detailsDiv.innerHTML = `
        <h2>${announcement.title}</h2>
        <div class="announcement-meta">
            <div class="meta-item">
                <strong>📅 Date:</strong>
                <span>${announcement.date}</span>
            </div>
            <div class="meta-item">
                <strong>🕐 Time:</strong>
                <span>${announcement.time}</span>
            </div>
            <div class="meta-item">
                <strong>📌 Type:</strong>
                <span>${announcement.type}</span>
            </div>
            <div class="meta-item">
                <strong>⚠️ Importance:</strong>
                <span>${announcement.importance.toUpperCase()}</span>
            </div>
        </div>
        <div class="announcement-body">
            <p>${announcement.details}</p>
        </div>
        <div class="announcement-actions">
            <button class="btn-primary" onclick="updateAnnouncementStatus(${announcementId}, 'acknowledge')">✓ Acknowledge</button>
            <button class="btn-cancel" onclick="closeAnnouncementModal()">Close</button>
        </div>
    `;
    
    document.getElementById('announcementDetailsModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updateAnnouncementStatus(announcementId, status) {
    console.log('Updated announcement:', announcementId, 'Status:', status);
    showNotification('Announcement acknowledged', 'success');
    closeAnnouncementModal();
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

// Close modal when clicking the X button
document.addEventListener('DOMContentLoaded', function() {
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.parentElement.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });
});

// ===========================
// STUDENT MANAGEMENT
// ===========================

function viewStudent(studentId) {
    console.log('Viewing student:', studentId);
    showNotification(`Opening student profile for ${studentId}`, 'info');
}

function editStudent(studentId) {
    console.log('Editing student:', studentId);
    openModal('addStudent');
    showNotification(`Editing student ${studentId}`, 'info');
}

function deleteStudent(studentId) {
    if (confirm(`Are you sure you want to delete student ${studentId}? This action cannot be undone.`)) {
        console.log('Deleted student:', studentId);
        showNotification(`Student ${studentId} deleted successfully`, 'success');
        // In real implementation, you would remove the row from the table
    }
}

// Student search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const tableRows = document.querySelectorAll('.data-table tbody tr');
            
            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
});

// ===========================
// EVENT MANAGEMENT
// ===========================

function viewEventDetails(eventId) {
    console.log('Viewing event details:', eventId);
    showNotification(`Opening event details for ${eventId}`, 'info');
}

function editEvent(eventId) {
    console.log('Editing event:', eventId);
    openModal('createEvent');
    showNotification(`Editing event ${eventId}`, 'info');
}

// Event filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const eventFilter = document.getElementById('eventFilter');
    if (eventFilter) {
        eventFilter.addEventListener('change', function(e) {
            const filterValue = e.target.value;
            console.log('Filtering events:', filterValue);
            showNotification(`Filtering events: ${filterValue}`, 'info');
        });
    }
});

// ===========================
// DASHBOARD REFRESH
// ===========================

function refreshDashboard() {
    console.log('Refreshing dashboard...');
    showNotification('Dashboard refreshing...', 'info');
    
    // Simulate refresh activity
    setTimeout(() => {
        showNotification('Dashboard updated successfully', 'success');
        // Update timestamp or other indicators
    }, 1500);
}

// Date filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        dateFilter.value = today;
        
        dateFilter.addEventListener('change', function(e) {
            const selectedDate = e.target.value;
            console.log('Date filter changed:', selectedDate);
            showNotification(`Filtering data for ${selectedDate}`, 'info');
        });
    }
});

// ===========================
// REPORTS
// ===========================

function generateReport() {
    console.log('Generating report...');
    showNotification('Generating report. This may take a moment...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification('Report generated successfully! Ready for download.', 'success');
        // In real implementation, trigger file download
    }, 2000);
}

// Report filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const reportFilter = document.getElementById('reportFilter');
    if (reportFilter) {
        reportFilter.addEventListener('change', function(e) {
            const reportType = e.target.value;
            console.log('Report type selected:', reportType);
            showNotification(`Loading ${reportType}...`, 'info');
        });
    }
});

// ===========================
// SETTINGS MANAGEMENT
// ===========================

function saveSettings() {
    console.log('Saving settings...');
    showNotification('Saving settings...', 'info');
    
    // Collect form data
    const twoFactor = document.getElementById('twoFactor').checked;
    const emailVerification = document.getElementById('emailVerification').checked;
    const notifications = document.getElementById('notifications').checked;
    
    // Simulate save
    setTimeout(() => {
        showNotification('Settings saved successfully!', 'success');
        console.log('Settings saved:', {
            twoFactor,
            emailVerification,
            notifications
        });
    }, 1000);
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        console.log('Settings reset to default');
        showNotification('Settings reset to default values', 'success');
    }
}

// ===========================
// FORM SUBMISSION
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    // Handle form submissions
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form type
            const modal = this.closest('.modal');
            let formType = 'Unknown';
            
            if (modal && modal.id === 'addStudentModal') {
                formType = 'Student';
            } else if (modal && modal.id === 'createEventModal') {
                formType = 'Event';
            } else if (modal && modal.id === 'addMentorModal') {
                formType = 'Mentor';
            }
            
            // Simulate form submission
            console.log('Form submitted:', formType);
            showNotification(`${formType} added successfully!`, 'success');
            
            // Close the modal
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Reset form
            this.reset();
        });
    });
});

// ===========================
// NOTIFICATION SYSTEM
// ===========================

function showNotification(message, type = 'info') {
    // Create notification element
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
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
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

// ===========================
// LOGOUT FUNCTION
// ===========================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        // Store logout message
        localStorage.setItem('logoutMessage', 'You have been logged out successfully');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'AdminLogin.html';
        }, 1500);
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Format date to readable format
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

// Get current time
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Data validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ===========================
// INITIALIZATION
// ===========================

// Show welcome notification on page load
window.addEventListener('load', function() {
    console.log('Admin Dashboard loaded successfully');
    showNotification('Welcome back, Administrator!', 'success');
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Admin dashboard hidden');
    } else {
        console.log('Admin dashboard visible');
    }
});

// Prevent accidental data loss
window.addEventListener('beforeunload', function(e) {
    // Check if form has unsaved changes
    const forms = document.querySelectorAll('form');
    let hasChanges = false;
    
    forms.forEach(form => {
        const formData = new FormData(form);
        if (formData) {
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
