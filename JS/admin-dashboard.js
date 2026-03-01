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

    initializeStudentManagement();
    initializeSettingsManagement();
    initializeProfileSettingsLinks();
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
        'addMentor': 'addMentorModal',
        'addMaterial': 'addMaterialModal'
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
        'addMentor': 'addMentorModal',
        'addMaterial': 'addMaterialModal'
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

const STUDENTS_DIRECTORY_KEY = 'studentsDirectory';

const DEFAULT_STUDENT_DIRECTORY = [];

const LEGACY_SEEDED_STUDENT_IDS = new Set(['STU001', 'STU002', 'STU003']);

function removeLegacySeededStudents() {
    const students = getStudentsDirectory();
    const cleanedStudents = students.filter(student => {
        const id = String(student.studentId || '').trim().toUpperCase();
        const email = String(student.email || '').trim().toLowerCase();
        const hasRealSourceRecord = !!localStorage.getItem('studentData_' + email);

        if (!LEGACY_SEEDED_STUDENT_IDS.has(id)) {
            return true;
        }

        return hasRealSourceRecord;
    });

    if (cleanedStudents.length !== students.length) {
        saveStudentsDirectory(cleanedStudents);
    }
}

function getStudentsDirectory() {
    return JSON.parse(localStorage.getItem(STUDENTS_DIRECTORY_KEY)) || [];
}

function saveStudentsDirectory(students) {
    localStorage.setItem(STUDENTS_DIRECTORY_KEY, JSON.stringify(students));
}

function ensureStudentDirectoryInitialized() {
    if (!localStorage.getItem(STUDENTS_DIRECTORY_KEY)) {
        saveStudentsDirectory(DEFAULT_STUDENT_DIRECTORY);
    }

    removeLegacySeededStudents();
    migrateStudentAccountsToDirectory();
}

function migrateStudentAccountsToDirectory() {
    const students = getStudentsDirectory();
    let hasChanges = false;

    Object.keys(localStorage)
        .filter(key => key.startsWith('studentData_'))
        .forEach(key => {
            const studentData = JSON.parse(localStorage.getItem(key) || '{}');
            if (!studentData || !studentData.email) {
                return;
            }

            const fullName = studentData.fullName || `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim();
            const studentId = (studentData.studentId || studentData.studentNumber || '').trim();
            const existingIndex = students.findIndex(student =>
                student.email.toLowerCase() === String(studentData.email).toLowerCase()
            );

            const normalizedProgram = normalizeProgram(studentData.program || studentData.degree || studentData.major || '');

            const payload = {
                studentId: studentId || `STU${String(students.length + 1).padStart(3, '0')}`,
                fullName: fullName || 'Student',
                email: String(studentData.email).trim(),
                phone: studentData.phone || '',
                program: normalizedProgram || 'all',
                status: studentData.status || 'active',
                joinedDate: studentData.registeredDate || studentData.joinedDate || new Date().toISOString()
            };

            if (existingIndex >= 0) {
                students[existingIndex] = {
                    ...students[existingIndex],
                    ...payload
                };
            } else {
                students.push(payload);
            }

            hasChanges = true;
        });

    if (hasChanges) {
        saveStudentsDirectory(students);
    }
}

function formatProgramForTable(programValue = '') {
    const normalized = normalizeProgram(programValue);
    return formatProgramLabel(normalized || 'all');
}

function renderStudentsTable(filterText = '') {
    const tableBody = document.getElementById('studentTableBody');
    if (!tableBody) {
        return;
    }

    const term = String(filterText || '').trim().toLowerCase();
    const students = getStudentsDirectory()
        .filter(student => {
            if (!term) {
                return true;
            }

            const searchableText = [
                student.studentId,
                student.fullName,
                student.email,
                formatProgramForTable(student.program),
                student.status
            ].join(' ').toLowerCase();

            return searchableText.includes(term);
        })
        .sort((a, b) => new Date(b.joinedDate || 0) - new Date(a.joinedDate || 0));

    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-table-data">No matching students found.</td></tr>';
        return;
    }

    tableBody.innerHTML = students.map(student => `
        <tr>
            <td>${student.studentId}</td>
            <td>${student.fullName}</td>
            <td>${student.email}</td>
            <td>${formatProgramForTable(student.program)}</td>
            <td><span class="status-badge ${student.status === 'inactive' ? 'inactive' : 'active'}">${student.status === 'inactive' ? 'Inactive' : 'Active'}</span></td>
            <td>${formatDate(student.joinedDate || new Date())}</td>
            <td class="action-buttons">
                <button class="btn-small btn-view" onclick="viewStudent('${student.studentId}')">👁️ View</button>
                <button class="btn-small btn-edit" onclick="editStudent('${student.studentId}')">✏️ Edit</button>
                <button class="btn-small btn-view" onclick="messageStudent('${student.studentId}')">💬 Message</button>
                <button class="btn-small btn-delete" onclick="deleteStudent('${student.studentId}')">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

function initializeStudentManagement() {
    ensureStudentDirectoryInitialized();
    renderStudentsTable();

    const searchInput = document.getElementById('studentSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderStudentsTable(e.target.value || '');
        });
    }

    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const originalId = document.getElementById('addStudentOriginalId')?.value.trim();
            const fullName = document.getElementById('addStudentName')?.value.trim();
            const email = document.getElementById('addStudentEmail')?.value.trim();
            const studentIdInput = document.getElementById('addStudentId')?.value.trim();
            const program = normalizeProgram(document.getElementById('addStudentProgram')?.value || '');
            const status = document.getElementById('addStudentStatus')?.value === 'inactive' ? 'inactive' : 'active';

            if (!fullName || !email || !studentIdInput || !program) {
                showNotification('Please fill all required student fields', 'error');
                return;
            }

            const students = getStudentsDirectory();
            const emailLower = email.toLowerCase();

            const existingById = students.find(student => student.studentId === studentIdInput);
            if (existingById && existingById.studentId !== originalId) {
                showNotification('Roll number already exists', 'error');
                return;
            }

            const existingByEmail = students.find(student => student.email.toLowerCase() === emailLower);
            if (existingByEmail && existingByEmail.studentId !== originalId) {
                showNotification('Email already exists in student list', 'error');
                return;
            }

            const targetIndex = students.findIndex(student => student.studentId === originalId);
            const payload = {
                studentId: studentIdInput,
                fullName,
                email,
                program,
                status,
                joinedDate: targetIndex >= 0 ? students[targetIndex].joinedDate : new Date().toISOString()
            };

            if (targetIndex >= 0) {
                students[targetIndex] = {
                    ...students[targetIndex],
                    ...payload
                };
                showNotification(`Student ${studentIdInput} updated`, 'success');
            } else {
                students.push(payload);
                showNotification(`Student ${studentIdInput} added`, 'success');
            }

            saveStudentsDirectory(students);
            syncStudentDataByEmail(payload);
            renderStudentsTable(document.getElementById('studentSearch')?.value || '');
            this.reset();
            const hiddenIdInput = document.getElementById('addStudentOriginalId');
            if (hiddenIdInput) hiddenIdInput.value = '';
            closeModal('addStudent');
        });
    }
}

function syncStudentDataByEmail(student) {
    const storageKey = 'studentData_' + student.email;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const nameParts = String(student.fullName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || student.fullName;
    const lastName = nameParts.slice(1).join(' ');

    localStorage.setItem(storageKey, JSON.stringify({
        ...existing,
        studentId: student.studentId,
        studentNumber: student.studentId,
        fullName: student.fullName,
        firstName: existing.firstName || firstName,
        lastName: existing.lastName || lastName,
        email: student.email,
        degree: student.program,
        program: student.program,
        status: student.status,
        joinedDate: student.joinedDate || existing.joinedDate || new Date().toISOString(),
        registeredDate: existing.registeredDate || student.joinedDate || new Date().toISOString()
    }));
}

function viewStudent(studentId) {
    const student = getStudentsDirectory().find(entry => entry.studentId === studentId);
    if (!student) {
        showNotification('Student not found', 'error');
        return;
    }

    showNotification(`Student: ${student.fullName} • ${formatProgramForTable(student.program)} • ${student.email}`, 'info');
}

function editStudent(studentId) {
    const student = getStudentsDirectory().find(entry => entry.studentId === studentId);
    if (!student) {
        showNotification('Student not found', 'error');
        return;
    }

    const hiddenId = document.getElementById('addStudentOriginalId');
    const nameInput = document.getElementById('addStudentName');
    const emailInput = document.getElementById('addStudentEmail');
    const idInput = document.getElementById('addStudentId');
    const programInput = document.getElementById('addStudentProgram');
    const statusInput = document.getElementById('addStudentStatus');

    if (hiddenId) hiddenId.value = student.studentId;
    if (nameInput) nameInput.value = student.fullName;
    if (emailInput) emailInput.value = student.email;
    if (idInput) idInput.value = student.studentId;
    if (programInput) programInput.value = normalizeProgram(student.program);
    if (statusInput) statusInput.value = student.status === 'inactive' ? 'inactive' : 'active';

    openModal('addStudent');
    showNotification(`Editing student ${studentId}`, 'info');
}

function messageStudent(studentId) {
    const student = getStudentsDirectory().find(entry => entry.studentId === studentId);
    if (!student) {
        showNotification('Student not found', 'error');
        return;
    }

    const subject = encodeURIComponent('Message from Admin - Alumni Smart Connect');
    const body = encodeURIComponent(`Hello ${student.fullName},\n\nThis is a message from the Admin/Teacher panel.\n\nRegards,\nAdmin Team`);
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
    showNotification(`Opening email compose for ${student.fullName}`, 'info');
}

function deleteStudent(studentId) {
    if (confirm(`Are you sure you want to delete student ${studentId}? This action cannot be undone.`)) {
        const students = getStudentsDirectory();
        const student = students.find(entry => entry.studentId === studentId);

        if (!student) {
            showNotification('Student not found', 'error');
            return;
        }

        const updatedStudents = students.filter(entry => entry.studentId !== studentId);
        saveStudentsDirectory(updatedStudents);
        renderStudentsTable(document.getElementById('studentSearch')?.value || '');
        showNotification(`Student ${studentId} deleted successfully`, 'success');

        if (student.email) {
            localStorage.removeItem('studentData_' + student.email);
        }
    }
}

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

const ADMIN_SETTINGS_STORAGE_KEY = 'adminDashboardSettings';

const DEFAULT_ADMIN_SETTINGS = {
    profile: {
        fullName: 'Administrator',
        role: 'System Administrator',
        department: 'Alumni Relations',
        phone: '+63 000 000 0000',
        bio: 'Administrator account for Alumni Smart Connect management.'
    },
    system: {
        twoFactor: true,
        emailVerification: true,
        notifications: true,
        adminEmail: 'admin@alumnismartconnect.com',
        platformName: 'Alumni Smart Connect',
        timezone: 'Asia/Manila'
    }
};

function getSavedSettings() {
    const savedSettings = JSON.parse(localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY) || '{}');

    return {
        profile: {
            ...DEFAULT_ADMIN_SETTINGS.profile,
            ...(savedSettings.profile || {})
        },
        system: {
            ...DEFAULT_ADMIN_SETTINGS.system,
            ...(savedSettings.system || {})
        }
    };
}

function applySettingsToForm(settings) {
    const profile = settings.profile || {};
    const system = settings.system || {};

    const adminFullName = document.getElementById('adminFullName');
    const adminRole = document.getElementById('adminRole');
    const adminDepartment = document.getElementById('adminDepartment');
    const adminPhone = document.getElementById('adminPhone');
    const adminBio = document.getElementById('adminBio');

    const twoFactor = document.getElementById('twoFactor');
    const emailVerification = document.getElementById('emailVerification');
    const notifications = document.getElementById('notifications');
    const adminEmail = document.getElementById('adminEmail');
    const platformName = document.getElementById('platformName');
    const timezone = document.getElementById('timezone');

    if (adminFullName) adminFullName.value = profile.fullName || '';
    if (adminRole) adminRole.value = profile.role || '';
    if (adminDepartment) adminDepartment.value = profile.department || '';
    if (adminPhone) adminPhone.value = profile.phone || '';
    if (adminBio) adminBio.value = profile.bio || '';

    if (twoFactor) twoFactor.checked = !!system.twoFactor;
    if (emailVerification) emailVerification.checked = !!system.emailVerification;
    if (notifications) notifications.checked = !!system.notifications;
    if (adminEmail) adminEmail.value = system.adminEmail || '';
    if (platformName) platformName.value = system.platformName || '';
    if (timezone) timezone.value = system.timezone || DEFAULT_ADMIN_SETTINGS.system.timezone;

    updateAdminHeaderPreview(profile.fullName);
}

function collectSettingsFromForm() {
    return {
        profile: {
            fullName: document.getElementById('adminFullName')?.value.trim() || '',
            role: document.getElementById('adminRole')?.value.trim() || '',
            department: document.getElementById('adminDepartment')?.value.trim() || '',
            phone: document.getElementById('adminPhone')?.value.trim() || '',
            bio: document.getElementById('adminBio')?.value.trim() || ''
        },
        system: {
            twoFactor: !!document.getElementById('twoFactor')?.checked,
            emailVerification: !!document.getElementById('emailVerification')?.checked,
            notifications: !!document.getElementById('notifications')?.checked,
            adminEmail: document.getElementById('adminEmail')?.value.trim() || '',
            platformName: document.getElementById('platformName')?.value.trim() || '',
            timezone: document.getElementById('timezone')?.value || DEFAULT_ADMIN_SETTINGS.system.timezone
        }
    };
}

function updateAdminHeaderPreview(fullName = '') {
    const name = fullName && fullName.trim() ? fullName.trim() : 'Administrator';
    const logoText = document.querySelector('.nav-logo span:last-child');
    if (logoText) {
        logoText.textContent = `Admin Dashboard • ${name}`;
    }
}

function initializeSettingsManagement() {
    const settings = getSavedSettings();
    applySettingsToForm(settings);
}

function setActiveNavLink(sectionId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const hrefId = (link.getAttribute('href') || '').replace('#', '');
        link.classList.toggle('active', hrefId === sectionId);
    });
}

function navigateToSettingsSection(targetId) {
    switchSection('settings');
    setActiveNavLink('settings');

    const sectionEl = document.getElementById(targetId);
    if (sectionEl) {
        setTimeout(() => {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }
}

function initializeProfileSettingsLinks() {
    const adminProfileLink = document.querySelector('.profile-menu a[href="#admin-profile"]');
    const systemSettingsLink = document.querySelector('.profile-menu a[href="#system-settings"]');

    if (adminProfileLink) {
        adminProfileLink.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToSettingsSection('admin-profile');
        });
    }

    if (systemSettingsLink) {
        systemSettingsLink.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToSettingsSection('system-settings');
        });
    }
}

function saveSettings() {
    const settings = collectSettingsFromForm();

    if (!settings.system.adminEmail) {
        showNotification('Admin email is required', 'error');
        return;
    }

    if (!settings.system.platformName) {
        showNotification('Platform name is required', 'error');
        return;
    }

    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    updateAdminHeaderPreview(settings.profile.fullName);
    showNotification('Settings saved successfully!', 'success');
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
        localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_SETTINGS));
        applySettingsToForm(DEFAULT_ADMIN_SETTINGS);
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
            if (this.id === 'materialForm' || this.id === 'addStudentForm') {
                return;
            }

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
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            right: 20px;
            bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            z-index: 3000;
            pointer-events: none;
            max-width: calc(100vw - 2rem);
        `;
        document.body.appendChild(container);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: relative;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        animation: fadeSlideUpIn 0.28s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        width: min(360px, calc(100vw - 2rem));
        word-wrap: break-word;
        overflow-wrap: anywhere;
        pointer-events: auto;
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
    container.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeSlideUpOut 0.28s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add animation styles
if (!document.getElementById('dashboard-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-notification-styles';
    style.textContent = `
        @keyframes fadeSlideUpIn {
            from {
                transform: translateY(10px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes fadeSlideUpOut {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(10px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

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
// LEARNING MATERIALS MANAGEMENT
// ===========================

const MATERIALS_STORAGE_KEY = 'learningMaterials';

function normalizeProgram(programValue = '') {
    const value = String(programValue || '').trim().toLowerCase();

    if (!value || value === 'all') {
        return 'all';
    }

    if (value.includes('bsit') || value.includes('information technology')) {
        return 'bsit';
    }

    if (value.includes('bscs') || value.includes('computer science')) {
        return 'bscs';
    }

    if (value.includes('bsemc') || value.includes('entertainment') || value.includes('multimedia')) {
        return 'bsemc';
    }

    if (value.includes('bsba') || value.includes('business administration')) {
        return 'bsba';
    }

    return value.replace(/\s+/g, '');
}

function formatProgramLabel(programValue = 'all') {
    const normalized = normalizeProgram(programValue);

    if (normalized === 'all') return 'All Programs';
    if (normalized === 'bsit') return 'BSIT';
    if (normalized === 'bscs') return 'BSCS';
    if (normalized === 'bsemc') return 'BSEMC';
    if (normalized === 'bsba') return 'BSBA';

    return String(programValue || 'All Programs').toUpperCase();
}

function getLearningMaterials() {
    return JSON.parse(localStorage.getItem(MATERIALS_STORAGE_KEY)) || [];
}

function saveLearningMaterials(materials) {
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
}

function renderMaterialsAdminList(filterText = '') {
    const listContainer = document.getElementById('materialsAdminList');
    if (!listContainer) {
        return;
    }

    const searchTerm = filterText.trim().toLowerCase();
    const materials = getLearningMaterials()
        .filter(material => {
            if (!searchTerm) {
                return true;
            }

            return (
                material.title.toLowerCase().includes(searchTerm) ||
                material.category.toLowerCase().includes(searchTerm) ||
                material.description.toLowerCase().includes(searchTerm)
            );
        })
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

    if (materials.length === 0) {
        listContainer.innerHTML = '<p class="no-materials">No matching materials found.</p>';
        return;
    }

    listContainer.innerHTML = materials.map(material => `
        <article class="material-admin-card">
            <div class="material-admin-header">
                <h3>${material.title}</h3>
                <div class="material-chip-group">
                    <span class="material-chip">${material.category}</span>
                    <span class="material-chip">${formatProgramLabel(material.targetProgram || 'all')}</span>
                </div>
            </div>
            <p class="material-admin-desc">${material.description}</p>
            <div class="material-admin-meta">Published: ${formatDate(material.createdAt)}</div>
            <div class="material-admin-actions">
                ${material.link ? `<a class="btn-small btn-view" href="${material.link}" target="_blank" rel="noopener noreferrer">🔗 Open Link</a>` : ''}
                <button class="btn-small btn-delete" onclick="deleteMaterial('${material.id}')">🗑️ Delete</button>
            </div>
        </article>
    `).join('');
}

function addLearningMaterial(payload) {
    const materials = getLearningMaterials();
    materials.push(payload);
    saveLearningMaterials(materials);
    renderMaterialsAdminList();
}

function deleteMaterial(materialId) {
    const materials = getLearningMaterials();
    const material = materials.find(entry => entry.id === materialId);

    if (!material) {
        showNotification('Material not found', 'error');
        return;
    }

    const shouldDelete = confirm(`Delete learning material "${material.title}"?`);
    if (!shouldDelete) {
        return;
    }

    const updatedMaterials = materials.filter(entry => entry.id !== materialId);
    saveLearningMaterials(updatedMaterials);
    renderMaterialsAdminList(document.getElementById('materialSearch')?.value || '');
    showNotification('Learning material deleted', 'success');
}

function initializeLearningMaterials() {
    const materialForm = document.getElementById('materialForm');
    const materialSearch = document.getElementById('materialSearch');

    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const titleInput = document.getElementById('materialTitle');
            const categoryInput = document.getElementById('materialCategory');
            const targetProgramInput = document.getElementById('materialTargetProgram');
            const descriptionInput = document.getElementById('materialDescription');
            const linkInput = document.getElementById('materialLink');

            const title = titleInput.value.trim();
            const category = categoryInput.value.trim();
            const targetProgram = normalizeProgram(targetProgramInput.value.trim());
            const description = descriptionInput.value.trim();
            const link = linkInput.value.trim();

            if (!title || !category || !targetProgram || !description) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            addLearningMaterial({
                id: `MAT-${Date.now()}`,
                title,
                category,
                targetProgram,
                description,
                link,
                createdAt: new Date().toISOString()
            });

            this.reset();
            closeModal('addMaterial');
            showNotification('Learning material published for students', 'success');
        });
    }

    if (materialSearch) {
        materialSearch.addEventListener('input', function(e) {
            renderMaterialsAdminList(e.target.value || '');
        });
    }

    renderMaterialsAdminList();
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
    initializeLearningMaterials();
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
