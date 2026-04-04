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
let selectedDayHighlightTimeout;

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

        // Logo click: prevent page reload and smoothly scroll to top
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo) {
            navLogo.style.cursor = 'pointer';
            navLogo.addEventListener('click', function(e) {
                // Prevent any default navigation/reload
                e.preventDefault();
                // If already at top, do nothing (avoid reload). Otherwise scroll to top.
                if (window.scrollY > 0) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
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
    renderEventsFromAnnouncements();
    initializeAdminMessenger();
    initializeRoleAccessManagement();
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
        if (sectionId === 'events') {
            const filterValue = document.getElementById('eventFilter')?.value || 'All Events';
            renderEventsFromAnnouncements(filterValue);
        }
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
                element.classList.remove('selected-flash');
                // Reflow allows replaying the flash animation on repeated clicks.
                void element.offsetWidth;
                element.classList.add('selected-flash');

                clearTimeout(selectedDayHighlightTimeout);
                selectedDayHighlightTimeout = setTimeout(() => {
                    element.classList.remove('selected-flash');
                    element.classList.remove('selected');
                }, 1800);
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
        if (modalType === 'addMaterial') {
            resetMaterialFormMode();
        }
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

        if (modalType === 'addMaterial') {
            resetMaterialFormMode();
        }
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

    const quickMessagePopup = document.getElementById('adminQuickMessagePopup');
    const quickMessageButton = document.querySelector('.floating-admin-message-btn');
    if (Date.now() < adminQuickCloseSuppressUntil) {
        return;
    }

    const clickPath = typeof event.composedPath === 'function' ? event.composedPath() : [];
    const clickedInsideQuickMessagePopup = clickPath.includes(quickMessagePopup) || clickPath.includes(quickMessageButton);
    if (
        quickMessagePopup &&
        quickMessageButton &&
        !clickedInsideQuickMessagePopup
    ) {
        closeAdminQuickMessages();
    }

    const quickAiPopup = document.getElementById('adminQuickAiPopup');
    const quickAiButton = document.querySelector('.floating-admin-ai-btn');
    const clickedInsideQuickAiPopup = clickPath.includes(quickAiPopup) || clickPath.includes(quickAiButton);
    if (
        quickAiPopup &&
        quickAiButton &&
        !clickedInsideQuickAiPopup
    ) {
        closeAdminAiQuick();
    }
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
    if (typeof STUDENTS_LOADED_FROM_SERVER !== 'undefined' && STUDENTS_LOADED_FROM_SERVER) {
        // If students were loaded from the server, do not migrate local studentData_* entries
        return;
    }

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

let STUDENTS_LOADED_FROM_SERVER = false;

function initializeStudentManagement() {
    // Try to load students from server database first. If that fails, fall back to localStorage data.
    loadStudentsFromServer().then(() => {
        STUDENTS_LOADED_FROM_SERVER = true;
        renderStudentsTable();
    }).catch(() => {
        // Server not reachable or empty — use local directory
        STUDENTS_LOADED_FROM_SERVER = false;
        ensureStudentDirectoryInitialized();
        renderStudentsTable();
    });

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

// ===========================
// STUDENTS - Load from Server
// ===========================
async function loadStudentsFromServer() {
    const api = 'server/php/debug_list_students.php';
    try {
        const resp = await fetch(api, { method: 'GET', cache: 'no-cache' });
        if (!resp.ok) throw new Error('Network response not ok');
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.students)) {
            const items = data.students.map(row => {
                const studentNumber = row.student_number || `STU${String(row.id).padStart(4, '0')}`;
                const fullName = ((row.first_name || '') + ' ' + (row.last_name || '')).trim() || row.email;
                return {
                    studentId: studentNumber,
                    fullName: fullName,
                    email: row.email,
                    program: normalizeProgram(row.program || ''),
                    status: 'active',
                    joinedDate: row.registered_at || new Date().toISOString()
                };
            });

            // Persist to local directory cache so other functions continue to operate
            saveStudentsDirectory(items);

            // Update pending metric if present
            const pendingMetric = document.getElementById('pendingApprovalsMetric');
            if (pendingMetric) pendingMetric.textContent = String(data.count || items.length);
        } else {
            throw new Error('Invalid data from server');
        }
    } catch (err) {
        console.warn('Could not load students from server:', err.message || err);
        // keep localStorage data as-is
        throw err;
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

function getEventStatusFromDate(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(dateStr);
    if (Number.isNaN(eventDate.getTime())) {
        return 'upcoming';
    }

    eventDate.setHours(0, 0, 0, 0);
    if (eventDate.getTime() === today.getTime()) return 'ongoing';
    if (eventDate.getTime() < today.getTime()) return 'completed';
    return 'upcoming';
}

function normalizeEventFilter(filterValue) {
    const normalized = String(filterValue || '').trim().toLowerCase();
    if (normalized === 'upcoming' || normalized === 'ongoing' || normalized === 'completed') {
        return normalized;
    }
    return 'all';
}

function formatEventDate(dateStr) {
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) {
        return dateStr;
    }
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAnnouncementEvents() {
    const storedAnnouncements = JSON.parse(localStorage.getItem('announcementsData')) || {};
    const events = [];

    Object.entries(storedAnnouncements).forEach(([dateKey, items]) => {
        if (!Array.isArray(items)) {
            return;
        }

        items.forEach(item => {
            const eventDate = item.date || dateKey;
            const status = getEventStatusFromDate(eventDate);
            events.push({
                id: item.id,
                title: item.title || 'Untitled Event',
                date: eventDate,
                time: item.time || 'TBA',
                type: item.type || 'General',
                description: item.description || '',
                details: item.details || '',
                importance: item.importance || 'low',
                status
            });
        });
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return events;
}

function renderEventsFromAnnouncements(filterValue = 'All Events') {
    const eventsContainer = document.querySelector('#events .events-grid');
    if (!eventsContainer) {
        return;
    }

    const filter = normalizeEventFilter(filterValue);
    const allEvents = getAnnouncementEvents();
    const filteredEvents = filter === 'all'
        ? allEvents
        : allEvents.filter(event => event.status === filter);

    if (filteredEvents.length === 0) {
        const emptyLabel = filter === 'all'
            ? 'No events created yet. Click Create Event to add your first event.'
            : `No ${filter} events found.`;

        eventsContainer.innerHTML = `
            <div class="events-empty-state">
                <p>${emptyLabel}</p>
            </div>
        `;
        return;
    }

    eventsContainer.innerHTML = filteredEvents.map(event => `
        <div class="event-card">
            <div class="event-header">
                <h3>${event.title}</h3>
                <span class="event-status ${event.status}">${event.status}</span>
            </div>
            <div class="event-details">
                <p><strong>📅 Date:</strong> ${formatEventDate(event.date)}</p>
                <p><strong>⏰ Time:</strong> ${event.time}</p>
                <p><strong>🏷️ Type:</strong> ${event.type}</p>
                <p><strong>📝 Notes:</strong> ${event.description || 'No summary provided'}</p>
            </div>
            <div class="event-actions">
                <button class="btn-small btn-edit" onclick="navigateToManageAnnouncements('${event.date}')">✏️ Edit</button>
                <button class="btn-small btn-view" onclick="viewAnnouncementDetails(${event.id})">👁️ Details</button>
            </div>
        </div>
    `).join('');
}

// Event filter functionality
document.addEventListener('DOMContentLoaded', function() {
    const eventFilter = document.getElementById('eventFilter');
    if (eventFilter) {
        eventFilter.addEventListener('change', function(e) {
            const filterValue = e.target.value;
            renderEventsFromAnnouncements(filterValue);
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
// ROLE ACCESS MANAGEMENT (FRONTEND MVP)
// ===========================

const ROLE_ACCESS_STORAGE_KEY = 'adminRoleAccessState';

const DEFAULT_ROLE_ACCESS_STATE = {
    nextId: 5,
    staffAccounts: [
        {
            id: 1,
            name: 'Lia Santos',
            email: 'lia.santos@school.edu',
            role: 'DEAN',
            requestedRole: 'DEAN',
            accountStatus: 'approved'
        },
        {
            id: 2,
            name: 'Marco Reyes',
            email: 'marco.reyes@school.edu',
            role: 'TEACHER',
            requestedRole: 'TEACHER',
            accountStatus: 'approved'
        },
        {
            id: 3,
            name: 'Aira Dela Cruz',
            email: 'aira.delacruz@school.edu',
            role: 'TEACHER',
            requestedRole: 'DEAN',
            accountStatus: 'pending'
        },
        {
            id: 4,
            name: 'Noel Fernandez',
            email: 'noel.fernandez@school.edu',
            role: 'TEACHER',
            requestedRole: 'PRINCIPAL',
            accountStatus: 'pending'
        }
    ],
    auditLogs: [
        {
            id: 1,
            message: 'System initialized role access demo data.',
            createdAt: new Date().toISOString()
        }
    ]
};

function getRoleAccessState() {
    const saved = JSON.parse(localStorage.getItem(ROLE_ACCESS_STORAGE_KEY) || '{}');

    return {
        nextId: typeof saved.nextId === 'number' ? saved.nextId : DEFAULT_ROLE_ACCESS_STATE.nextId,
        staffAccounts: Array.isArray(saved.staffAccounts) ? saved.staffAccounts : DEFAULT_ROLE_ACCESS_STATE.staffAccounts,
        auditLogs: Array.isArray(saved.auditLogs) ? saved.auditLogs : DEFAULT_ROLE_ACCESS_STATE.auditLogs
    };
}

function saveRoleAccessState(state) {
    localStorage.setItem(ROLE_ACCESS_STORAGE_KEY, JSON.stringify(state));
}

function getRoleLabel(roleCode = '') {
    if (roleCode === 'PRINCIPAL') return 'Principal';
    if (roleCode === 'DEAN') return 'Dean';
    return 'Teacher';
}

function getStatusBadge(status = '') {
    if (status === 'approved') return '<span class="status-badge active">Approved</span>';
    if (status === 'rejected') return '<span class="status-badge inactive">Rejected</span>';
    if (status === 'suspended') return '<span class="status-badge inactive">Suspended</span>';
    return '<span class="status-badge pending">Pending</span>';
}

function appendRoleAuditLog(state, message) {
    state.auditLogs.unshift({
        id: Date.now(),
        message,
        createdAt: new Date().toISOString()
    });

    if (state.auditLogs.length > 20) {
        state.auditLogs = state.auditLogs.slice(0, 20);
    }
}

function renderRoleAccessManagement() {
    const pendingTableBody = document.getElementById('pendingRolesTableBody');
    if (!pendingTableBody) {
        return;
    }

    const approvedTableBody = document.getElementById('approvedRolesTableBody');
    const auditTrailList = document.getElementById('auditTrailList');
    const staffUserSelect = document.getElementById('staffUserSelect');
    const pendingMetric = document.getElementById('pendingApprovalsMetric');
    const pendingRoleCount = document.getElementById('pendingRoleCount');
    const approvedRoleCount = document.getElementById('approvedRoleCount');
    const principalRoleCount = document.getElementById('principalRoleCount');

    const state = getRoleAccessState();
    const pendingAccounts = state.staffAccounts.filter(account => account.accountStatus === 'pending');
    const approvedAccounts = state.staffAccounts.filter(account => account.accountStatus === 'approved');
    const principalAccounts = approvedAccounts.filter(account => account.role === 'PRINCIPAL');

    if (pendingMetric) pendingMetric.textContent = String(pendingAccounts.length);
    if (pendingRoleCount) pendingRoleCount.textContent = String(pendingAccounts.length);
    if (approvedRoleCount) approvedRoleCount.textContent = String(approvedAccounts.length);
    if (principalRoleCount) principalRoleCount.textContent = String(principalAccounts.length);

    if (pendingAccounts.length === 0) {
        pendingTableBody.innerHTML = '<tr><td colspan="5" class="no-table-data">No pending staff requests.</td></tr>';
    } else {
        pendingTableBody.innerHTML = pendingAccounts.map(account => `
            <tr>
                <td>${account.name}</td>
                <td>${account.email}</td>
                <td>${getRoleLabel(account.requestedRole)}</td>
                <td>${getStatusBadge(account.accountStatus)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-view" onclick="approveStaffRequest(${account.id})">Approve</button>
                        <button class="btn-small btn-delete" onclick="rejectStaffRequest(${account.id})">Reject</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    if (approvedAccounts.length === 0) {
        approvedTableBody.innerHTML = '<tr><td colspan="4" class="no-table-data">No approved staff accounts yet.</td></tr>';
    } else {
        approvedTableBody.innerHTML = approvedAccounts.map(account => `
            <tr>
                <td>${account.name}</td>
                <td>${account.email}</td>
                <td>${getRoleLabel(account.role)}</td>
                <td>${getStatusBadge(account.accountStatus)}</td>
            </tr>
        `).join('');
    }

    if (staffUserSelect) {
        if (approvedAccounts.length === 0) {
            staffUserSelect.innerHTML = '<option value="">No approved staff available</option>';
        } else {
            staffUserSelect.innerHTML = approvedAccounts
                .map(account => `<option value="${account.id}">${account.name} (${getRoleLabel(account.role)})</option>`)
                .join('');
        }
    }

    if (auditTrailList) {
        if (!state.auditLogs.length) {
            auditTrailList.innerHTML = '<p class="no-table-data">No audit logs yet.</p>';
        } else {
            auditTrailList.innerHTML = state.auditLogs.map(log => {
                const readableTime = new Date(log.createdAt).toLocaleString();
                return `
                    <div class="activity-item">
                        <div class="activity-time">${readableTime}</div>
                        <div class="activity-text">${log.message}</div>
                    </div>
                `;
            }).join('');
        }
    }
}

function approveStaffRequest(accountId) {
    const state = getRoleAccessState();
    const account = state.staffAccounts.find(item => item.id === Number(accountId));

    if (!account || account.accountStatus !== 'pending') {
        return;
    }

    account.accountStatus = 'approved';
    account.role = account.requestedRole;
    appendRoleAuditLog(state, `Approved ${account.name} as ${getRoleLabel(account.role)}.`);
    saveRoleAccessState(state);
    renderRoleAccessManagement();
    showNotification('Staff request approved.', 'success');
}

function rejectStaffRequest(accountId) {
    const state = getRoleAccessState();
    const account = state.staffAccounts.find(item => item.id === Number(accountId));

    if (!account || account.accountStatus !== 'pending') {
        return;
    }

    account.accountStatus = 'rejected';
    appendRoleAuditLog(state, `Rejected staff request for ${account.name} (${getRoleLabel(account.requestedRole)}).`);
    saveRoleAccessState(state);
    renderRoleAccessManagement();
    showNotification('Staff request rejected.', 'info');
}

function handleStaffRequestSubmit(event) {
    event.preventDefault();

    const nameInput = document.getElementById('staffNameInput');
    const emailInput = document.getElementById('staffEmailInput');
    const requestedRoleInput = document.getElementById('staffRoleRequestInput');

    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim().toLowerCase();
    const requestedRole = requestedRoleInput?.value;

    if (!name || !email || !requestedRole) {
        showNotification('Complete all staff request fields.', 'warning');
        return;
    }

    const state = getRoleAccessState();
    const duplicate = state.staffAccounts.some(account => account.email.toLowerCase() === email);

    if (duplicate) {
        showNotification('A staff account with this email already exists.', 'error');
        return;
    }

    const newAccount = {
        id: state.nextId,
        name,
        email,
        role: 'TEACHER',
        requestedRole,
        accountStatus: 'pending'
    };

    state.nextId += 1;
    state.staffAccounts.push(newAccount);
    appendRoleAuditLog(state, `Created pending staff request for ${name} (${getRoleLabel(requestedRole)}).`);
    saveRoleAccessState(state);
    renderRoleAccessManagement();
    showNotification('Pending staff request added.', 'success');

    event.target.reset();
}

function handleRoleAssignmentSubmit(event) {
    event.preventDefault();

    const staffUserSelect = document.getElementById('staffUserSelect');
    const newRoleSelect = document.getElementById('newRoleSelect');

    const staffUserId = Number(staffUserSelect?.value);
    const newRole = newRoleSelect?.value;

    if (!staffUserId || !newRole) {
        showNotification('Select a staff account and role.', 'warning');
        return;
    }

    const state = getRoleAccessState();
    const account = state.staffAccounts.find(item => item.id === staffUserId);

    if (!account || account.accountStatus !== 'approved') {
        showNotification('Only approved staff can be reassigned.', 'error');
        return;
    }

    const previousRole = account.role;
    account.role = newRole;
    appendRoleAuditLog(
        state,
        `Updated ${account.name} role from ${getRoleLabel(previousRole)} to ${getRoleLabel(newRole)}.`
    );

    saveRoleAccessState(state);
    renderRoleAccessManagement();
    showNotification('Role assignment saved.', 'success');
}

function initializeRoleAccessManagement() {
    const section = document.getElementById('roles');
    if (!section) {
        return;
    }

    if (!localStorage.getItem(ROLE_ACCESS_STORAGE_KEY)) {
        localStorage.setItem(ROLE_ACCESS_STORAGE_KEY, JSON.stringify(DEFAULT_ROLE_ACCESS_STATE));
    }

    const staffRequestForm = document.getElementById('staffRequestForm');
    const roleAssignmentForm = document.getElementById('roleAssignmentForm');

    if (staffRequestForm) {
        staffRequestForm.addEventListener('submit', handleStaffRequestSubmit);
    }

    if (roleAssignmentForm) {
        roleAssignmentForm.addEventListener('submit', handleRoleAssignmentSubmit);
    }

    renderRoleAccessManagement();
}

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
    const navAdminName = document.getElementById('navAdminName');
    if (navAdminName) {
        navAdminName.textContent = name;
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
            if (
                this.id === 'materialForm' ||
                this.id === 'addStudentForm' ||
                this.id === 'staffRequestForm' ||
                this.id === 'roleAssignmentForm'
            ) {
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
        // Clear session keys
        try {
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminEmail');
            sessionStorage.removeItem('adminToken');
        } catch (e) {
            // ignore
        }

        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'AdminLogin.html';
        }, 800);
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

    if (value.includes('bsemc') || value.includes('entertainment') || value.includes('multimedia') || value.includes('civil') || value.includes('construction')) {
        return 'bsce';
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
    if (normalized === 'bsce') return 'BSCE';
    if (normalized === 'bsba') return 'BSBA';

    return String(programValue || 'All Programs').toUpperCase();
}

function getLearningMaterials() {
    return JSON.parse(localStorage.getItem(MATERIALS_STORAGE_KEY)) || [];
}

function saveLearningMaterials(materials) {
    localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
}

function resetMaterialFormMode() {
    const materialForm = document.getElementById('materialForm');
    const editIdInput = document.getElementById('materialEditId');
    const modalTitle = document.getElementById('materialModalTitle');
    const submitBtn = document.getElementById('materialSubmitBtn');

    if (materialForm) {
        materialForm.reset();
    }

    if (editIdInput) {
        editIdInput.value = '';
    }

    if (modalTitle) {
        modalTitle.textContent = 'Add Learning Material';
    }

    if (submitBtn) {
        submitBtn.textContent = '✓ Publish Material';
    }
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
                <button class="btn-small btn-edit" onclick="editMaterial('${material.id}')">✏️ Customize</button>
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

function editMaterial(materialId) {
    const materials = getLearningMaterials();
    const material = materials.find(entry => entry.id === materialId);

    if (!material) {
        showNotification('Material not found', 'error');
        return;
    }

    const titleInput = document.getElementById('materialTitle');
    const categoryInput = document.getElementById('materialCategory');
    const targetProgramInput = document.getElementById('materialTargetProgram');
    const descriptionInput = document.getElementById('materialDescription');
    const linkInput = document.getElementById('materialLink');
    const editIdInput = document.getElementById('materialEditId');
    const modalTitle = document.getElementById('materialModalTitle');
    const submitBtn = document.getElementById('materialSubmitBtn');

    if (titleInput) titleInput.value = material.title || '';
    if (categoryInput) categoryInput.value = material.category || '';
    if (targetProgramInput) targetProgramInput.value = normalizeProgram(material.targetProgram || 'all');
    if (descriptionInput) descriptionInput.value = material.description || '';
    if (linkInput) linkInput.value = material.link || '';
    if (editIdInput) editIdInput.value = material.id;
    if (modalTitle) modalTitle.textContent = 'Customize Learning Material';
    if (submitBtn) submitBtn.textContent = '💾 Save Changes';

    document.getElementById('addMaterialModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
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
            const materialEditIdInput = document.getElementById('materialEditId');

            const title = titleInput.value.trim();
            const category = categoryInput.value.trim();
            const targetProgram = normalizeProgram(targetProgramInput.value.trim());
            const description = descriptionInput.value.trim();
            const link = linkInput.value.trim();

            if (!title || !category || !targetProgram || !description) {
                showNotification('Please fill all required fields', 'error');
                return;
            }

            const editId = materialEditIdInput?.value.trim();

            if (editId) {
                const materials = getLearningMaterials();
                const targetMaterial = materials.find(material => material.id === editId);

                if (!targetMaterial) {
                    showNotification('Material to update was not found', 'error');
                    return;
                }

                targetMaterial.title = title;
                targetMaterial.category = category;
                targetMaterial.targetProgram = targetProgram;
                targetMaterial.description = description;
                targetMaterial.link = link;
                targetMaterial.updatedAt = new Date().toISOString();

                saveLearningMaterials(materials);
                renderMaterialsAdminList(document.getElementById('materialSearch')?.value || '');
                showNotification('Learning material updated', 'success');
            } else {
                addLearningMaterial({
                    id: `MAT-${Date.now()}`,
                    title,
                    category,
                    targetProgram,
                    description,
                    link,
                    createdAt: new Date().toISOString()
                });
                showNotification('Learning material published for students', 'success');
            }

            closeModal('addMaterial');
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
// ADMIN QUICK MESSAGE + CHATBOT
// ===========================

const ADMIN_UNREAD_MESSAGES_KEY = 'adminUnreadMessages';
const ADMIN_MESSENGER_STORAGE_KEY = 'adminMessengerState';

const DEFAULT_ADMIN_MESSENGER_STATE = {
    activeConversationId: 'conv-1',
    conversations: [
        {
            id: 'conv-1',
            name: 'Dean Office',
            subtitle: 'Role approvals',
            unread: 2,
            online: true,
            lastTime: '2m'
        },
        {
            id: 'conv-2',
            name: 'Event Team',
            subtitle: 'Career fair prep',
            unread: 1,
            online: true,
            lastTime: '14m'
        },
        {
            id: 'conv-3',
            name: 'Principal',
            subtitle: 'Weekly report',
            unread: 0,
            online: false,
            lastTime: '1h'
        },
        {
            id: 'conv-4',
            name: 'IT Support',
            subtitle: 'System maintenance',
            unread: 0,
            online: true,
            lastTime: '3h'
        }
    ],
    messages: {
        'conv-1': [
            { sender: 'them', text: 'Please review pending dean approvals before 3 PM.' },
            { sender: 'me', text: 'Received. I will process the pending list now.' }
        ],
        'conv-2': [
            { sender: 'them', text: 'Can we finalize the event poster today?' },
            { sender: 'me', text: 'Yes, send the latest draft and I will approve it.' }
        ],
        'conv-3': [
            { sender: 'them', text: 'Need a short weekly summary by end of day.' }
        ],
        'conv-4': [
            { sender: 'them', text: 'Maintenance window scheduled tomorrow 2-4 PM.' }
        ]
    }
};

let adminMessengerFilter = 'all';
let adminQuickActiveConversationId = '';
let adminQuickCloseSuppressUntil = 0;

function setAdminUnreadBadge(count) {
    const badge = document.getElementById('adminUnreadBadge');
    if (!badge) {
        return;
    }

    const safeCount = Math.max(0, Number(count) || 0);
    badge.textContent = safeCount > 99 ? '99+' : String(safeCount);
    badge.style.display = safeCount > 0 ? 'flex' : 'none';
    localStorage.setItem(ADMIN_UNREAD_MESSAGES_KEY, String(safeCount));
}

function initAdminUnreadBadge() {
    const state = getAdminMessengerState();
    const unreadCount = state.conversations.reduce((total, item) => total + (Number(item.unread) || 0), 0);
    setAdminUnreadBadge(unreadCount);
}

function getAdminMessengerState() {
    const saved = JSON.parse(localStorage.getItem(ADMIN_MESSENGER_STORAGE_KEY) || '{}');

    return {
        activeConversationId: saved.activeConversationId || DEFAULT_ADMIN_MESSENGER_STATE.activeConversationId,
        conversations: Array.isArray(saved.conversations) ? saved.conversations : DEFAULT_ADMIN_MESSENGER_STATE.conversations,
        messages: saved.messages && typeof saved.messages === 'object' ? saved.messages : DEFAULT_ADMIN_MESSENGER_STATE.messages
    };
}

function saveAdminMessengerState(state) {
    localStorage.setItem(ADMIN_MESSENGER_STORAGE_KEY, JSON.stringify(state));
}

function getConversationInitials(name = '') {
    return String(name)
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function renderAdminConversationList() {
    const state = getAdminMessengerState();
    const list = document.getElementById('adminConversationList');
    const searchInput = document.getElementById('adminMessageSearch');
    const countEl = document.getElementById('adminMessagesCount');

    if (!list) {
        return;
    }

    const searchTerm = (searchInput?.value || '').trim().toLowerCase();
    let filtered = [...state.conversations];

    if (adminMessengerFilter === 'unread') {
        filtered = filtered.filter(item => item.unread > 0);
    }

    if (adminMessengerFilter === 'internal') {
        filtered = filtered.filter(item => /(office|principal|it|admin|team)/i.test(item.name));
    }

    if (searchTerm) {
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.subtitle.toLowerCase().includes(searchTerm)
        );
    }

    if (countEl) {
        countEl.textContent = String(filtered.length);
    }

    if (!filtered.length) {
        list.innerHTML = '<p class="no-table-data">No conversations found.</p>';
        return;
    }

    list.innerHTML = filtered.map(item => `
        <button class="admin-conversation-item ${state.activeConversationId === item.id ? 'active' : ''}" data-conversation-id="${item.id}">
            <div class="admin-conversation-avatar">${getConversationInitials(item.name)}</div>
            <div class="admin-conversation-meta">
                <div class="admin-conversation-top">
                    <strong>${item.name}</strong>
                    <span>${item.lastTime || ''}</span>
                </div>
                <div class="admin-conversation-subline">
                    <span>${item.subtitle}</span>
                    ${item.unread > 0 ? `<span class="admin-conversation-unread">${item.unread}</span>` : ''}
                </div>
            </div>
        </button>
    `).join('');

    list.querySelectorAll('.admin-conversation-item').forEach(button => {
        button.addEventListener('click', function() {
            selectAdminConversation(this.dataset.conversationId);
        });
    });
}

function renderAdminChatPanel() {
    const state = getAdminMessengerState();
    const headerName = document.getElementById('adminChatHeaderName');
    const headerStatus = document.getElementById('adminChatHeaderStatus');
    const messagesEl = document.getElementById('adminChatMessages');

    if (!messagesEl) {
        return;
    }

    const conversation = state.conversations.find(item => item.id === state.activeConversationId);

    if (!conversation) {
        messagesEl.innerHTML = '<p class="admin-chat-empty">Choose a conversation to start messaging.</p>';
        if (headerName) headerName.textContent = 'Select a conversation';
        if (headerStatus) headerStatus.textContent = 'No chat selected';
        return;
    }

    if (headerName) headerName.textContent = conversation.name;
    if (headerStatus) headerStatus.textContent = conversation.online ? 'Active now' : 'Offline';

    const messages = state.messages[conversation.id] || [];

    if (!messages.length) {
        messagesEl.innerHTML = '<p class="admin-chat-empty">No messages yet in this conversation.</p>';
        return;
    }

    messagesEl.innerHTML = messages.map(message => `
        <div class="admin-chat-bubble ${message.sender === 'me' ? 'mine' : 'theirs'}">${message.text}</div>
    `).join('');

    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function selectAdminConversation(conversationId) {
    const state = getAdminMessengerState();
    const conversation = state.conversations.find(item => item.id === conversationId);

    if (!conversation) {
        return;
    }

    state.activeConversationId = conversationId;
    conversation.unread = 0;
    saveAdminMessengerState(state);

    initAdminUnreadBadge();
    renderAdminConversationList();
    renderAdminChatPanel();
}

function sendAdminMessage(event) {
    event.preventDefault();

    const input = document.getElementById('adminChatInput');
    const text = input?.value.trim();

    if (!text) {
        return;
    }

    const state = getAdminMessengerState();
    const conversation = state.conversations.find(item => item.id === state.activeConversationId);

    if (!conversation) {
        showNotification('Please select a conversation first.', 'warning');
        return;
    }

    if (!Array.isArray(state.messages[conversation.id])) {
        state.messages[conversation.id] = [];
    }

    state.messages[conversation.id].push({ sender: 'me', text });
    conversation.subtitle = text.length > 36 ? `${text.slice(0, 36)}...` : text;
    conversation.lastTime = 'now';

    saveAdminMessengerState(state);
    renderAdminConversationList();
    renderAdminChatPanel();
    if (input) input.value = '';
}

function initializeAdminMessenger() {
    const messagesSection = document.getElementById('messages');
    if (!messagesSection) {
        return;
    }

    if (!localStorage.getItem(ADMIN_MESSENGER_STORAGE_KEY)) {
        localStorage.setItem(ADMIN_MESSENGER_STORAGE_KEY, JSON.stringify(DEFAULT_ADMIN_MESSENGER_STATE));
    }

    const tabsContainer = document.getElementById('adminMessengerTabs');
    const searchInput = document.getElementById('adminMessageSearch');
    const form = document.getElementById('adminChatForm');

    if (tabsContainer) {
        tabsContainer.querySelectorAll('.admin-msg-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                tabsContainer.querySelectorAll('.admin-msg-tab').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                adminMessengerFilter = this.dataset.filter || 'all';
                renderAdminConversationList();
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderAdminConversationList();
        });
    }

    if (form) {
        form.addEventListener('submit', sendAdminMessage);
    }

    renderAdminConversationList();
    renderAdminChatPanel();
    initAdminUnreadBadge();
}

function initAdminQuickMessages() {
    const messageList = document.getElementById('adminQuickMessageList');
    if (!messageList) {
        return;
    }

    const popup = document.getElementById('adminQuickMessagePopup');
    if (popup) {
        popup.addEventListener('click', event => event.stopPropagation());
    }

    const searchInput = document.getElementById('adminQuickMessageSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderAdminQuickMessagesPreview(this.value || '');
        });
    }

    const state = getAdminMessengerState();
    adminQuickActiveConversationId = state.activeConversationId || state.conversations[0]?.id || '';
    renderAdminQuickMessagesPreview('');
    renderAdminQuickThreadPreview(adminQuickActiveConversationId);
}

function renderAdminQuickMessagesPreview(searchTerm = '') {
    const messageList = document.getElementById('adminQuickMessageList');
    if (!messageList) {
        return;
    }

    const state = getAdminMessengerState();
    const term = String(searchTerm || '').trim().toLowerCase();

    const conversations = state.conversations.filter(item => {
        if (!term) {
            return true;
        }

        return (
            item.name.toLowerCase().includes(term) ||
            item.subtitle.toLowerCase().includes(term)
        );
    });

    if (!conversations.length) {
        messageList.innerHTML = '<p class="no-table-data">No matching chats.</p>';
        renderAdminQuickThreadPreview('');
        return;
    }

    const hasSelectedConversation = conversations.some(item => item.id === adminQuickActiveConversationId);
    if (!hasSelectedConversation) {
        adminQuickActiveConversationId = conversations[0].id;
    }

    messageList.innerHTML = conversations.map(item => {
        const messages = state.messages[item.id] || [];
        const lastMessage = messages.length ? messages[messages.length - 1].text : item.subtitle;
        const preview = lastMessage.length > 44 ? `${lastMessage.slice(0, 44)}...` : lastMessage;

        return `
            <button class="admin-quick-message-item ${adminQuickActiveConversationId === item.id ? 'active' : ''}" onclick="selectAdminQuickConversation(event, '${item.id}')">
                <div class="admin-quick-avatar-wrap">
                    <div class="admin-quick-avatar">${getConversationInitials(item.name)}</div>
                    ${item.online ? '<span class="admin-quick-online-dot"></span>' : ''}
                </div>
                <div class="admin-quick-body">
                    <div class="admin-quick-row">
                        <div class="admin-quick-name">${item.name}</div>
                        <div class="admin-quick-time">${item.lastTime || ''}</div>
                    </div>
                    <div class="admin-quick-row">
                        <div class="admin-quick-text">${preview}</div>
                        ${item.unread > 0 ? '<span class="admin-quick-unread-dot"></span>' : ''}
                    </div>
                </div>
            </button>
        `;
    }).join('');

    renderAdminQuickThreadPreview(adminQuickActiveConversationId);
}

function renderAdminQuickThreadPreview(conversationId = '') {
    const container = document.getElementById('adminQuickThreadContainer');
    if (!container) {
        return;
    }

    const state = getAdminMessengerState();
    const conversation = state.conversations.find(item => item.id === conversationId);

    if (!conversation) {
        container.innerHTML = '<p class="admin-quick-thread-empty">Select a chat to preview messages.</p>';
        return;
    }

    const messages = state.messages[conversation.id] || [];
    const recentMessages = messages.slice(-3);

    container.innerHTML = `
        <div class="admin-quick-thread-head">
            <strong>${conversation.name}</strong>
            <span>${conversation.online ? 'Active now' : 'Offline'}</span>
        </div>
        <div class="admin-quick-thread-body">
            ${recentMessages.length ? recentMessages.map(message => `
                <div class="admin-quick-thread-bubble ${message.sender === 'me' ? 'mine' : 'theirs'}">${message.text}</div>
            `).join('') : '<p class="admin-quick-thread-empty">No messages yet.</p>'}
        </div>
    `;
}

function selectAdminQuickConversation(event, conversationId) {
    if (event) {
        event.stopPropagation();
    }

    adminQuickCloseSuppressUntil = Date.now() + 250;

    const state = getAdminMessengerState();
    const conversation = state.conversations.find(item => item.id === conversationId);

    if (!conversation) {
        return;
    }

    adminQuickActiveConversationId = conversationId;
    if (conversation.unread > 0) {
        conversation.unread = 0;
        saveAdminMessengerState(state);
        initAdminUnreadBadge();
    }

    const searchValue = document.getElementById('adminQuickMessageSearch')?.value || '';
    requestAnimationFrame(() => {
        renderAdminQuickMessagesPreview(searchValue);
    });
}

function openAdminMessagesQuick(event) {
    if (event) {
        event.stopPropagation();
    }

    closeAdminAiQuick();
    const popup = document.getElementById('adminQuickMessagePopup');
    if (!popup) {
        return;
    }

    const willOpen = !popup.classList.contains('active');
    popup.classList.toggle('active', willOpen);
    popup.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

    if (willOpen) {
        const state = getAdminMessengerState();
        adminQuickActiveConversationId = state.activeConversationId || state.conversations[0]?.id || '';
        const searchInput = document.getElementById('adminQuickMessageSearch');
        if (searchInput) {
            searchInput.value = '';
        }

        renderAdminQuickMessagesPreview('');
        renderAdminQuickThreadPreview(adminQuickActiveConversationId);
        setAdminUnreadBadge(0);
    }
}

function closeAdminQuickMessages() {
    const popup = document.getElementById('adminQuickMessagePopup');
    if (!popup) {
        return;
    }

    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
}

function openAdminMessagesSection(conversationId = '') {
    closeAdminQuickMessages();
    switchSection('messages');
    setActiveNavLink('messages');

    const targetConversationId = conversationId || adminQuickActiveConversationId;

    if (targetConversationId) {
        selectAdminConversation(targetConversationId);
    }

    renderAdminConversationList();
    renderAdminChatPanel();
}

function openAdminAiQuick() {
    closeAdminQuickMessages();
    const popup = document.getElementById('adminQuickAiPopup');
    if (!popup) {
        return;
    }

    const willOpen = !popup.classList.contains('active');
    popup.classList.toggle('active', willOpen);
    popup.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
}

function closeAdminAiQuick() {
    const popup = document.getElementById('adminQuickAiPopup');
    if (!popup) {
        return;
    }

    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
}

function runAdminAiSuggestion() {
    const prompt = document.getElementById('adminAiPrompt')?.value.trim() || '';
    const resultBox = document.getElementById('adminAiResult');

    if (!resultBox) {
        return;
    }

    if (!prompt) {
        resultBox.textContent = 'Type a message first.';
        return;
    }

    resultBox.textContent = `Draft: ${prompt}`;
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
    initAdminUnreadBadge();
    initAdminQuickMessages();
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
