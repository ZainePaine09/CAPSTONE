const STUDENTS_DIRECTORY_KEY = 'studentsDirectory';
const STUDENT_DATA_PREFIX = 'studentData_';

const DEFAULT_STUDENTS = [
    {
        studentId: 'STU-2101',
        fullName: 'Amara Cruz',
        email: 'amara.cruz@example.com',
        classSection: 'BSIT-3A',
        course: 'BSIT',
        jobTrack: 'Internship Ready',
        activeClass: true,
        joinedDate: '2026-03-10'
    },
    {
        studentId: 'STU-2102',
        fullName: 'Miguel Reyes',
        email: 'miguel.reyes@example.com',
        classSection: 'BSBA-2B',
        course: 'BSBA',
        jobTrack: 'Job Hunting',
        activeClass: false,
        joinedDate: '2026-02-18'
    },
    {
        studentId: 'STU-2103',
        fullName: 'Sofia Dela Rosa',
        email: 'sofia.delarosa@example.com',
        classSection: 'BSCS-4A',
        course: 'BSCS',
        jobTrack: 'Employed',
        activeClass: true,
        joinedDate: '2026-01-22'
    },
    {
        studentId: 'STU-2104',
        fullName: 'Liam Santos',
        email: 'liam.santos@example.com',
        classSection: 'BSIT-3B',
        course: 'BSIT',
        jobTrack: 'Job Hunting',
        activeClass: true,
        joinedDate: '2026-03-28'
    },
    {
        studentId: 'STU-2105',
        fullName: 'Noah Garcia',
        email: 'noah.garcia@example.com',
        classSection: 'BSCS-4B',
        course: 'BSCS',
        jobTrack: 'Internship Ready',
        activeClass: false,
        joinedDate: '2026-02-06'
    },
    {
        studentId: 'STU-2106',
        fullName: 'Ella Martinez',
        email: 'ella.martinez@example.com',
        classSection: 'BSBA-2A',
        course: 'BSBA',
        jobTrack: 'Employed',
        activeClass: true,
        joinedDate: '2026-01-30'
    },
    {
        studentId: 'STU-2107',
        fullName: 'Kai Rivera',
        email: 'kai.rivera@example.com',
        classSection: 'BSED-1A',
        course: 'BSED',
        jobTrack: 'Not Assigned',
        activeClass: false,
        joinedDate: '2026-03-14'
    },
    {
        studentId: 'STU-2108',
        fullName: 'Mia Fernandez',
        email: 'mia.fernandez@example.com',
        classSection: 'BSIT-4C',
        course: 'BSIT',
        jobTrack: 'Job Hunting',
        activeClass: true,
        joinedDate: '2026-02-25'
    }
];

let studentsDirectory = [];
let selectedStudentId = '';

document.addEventListener('DOMContentLoaded', () => {
    initializeStudentAccountsPage();
});

function initializeStudentAccountsPage() {
    hydrateStudentsDirectory();
    bindPageEvents();
    renderStudentDirectory();
    renderStudentStats();

    if (studentsDirectory.length > 0) {
        selectStudentAccount(studentsDirectory[0].studentId);
    } else {
        resetStudentForm();
    }
}

function bindPageEvents() {
    const form = document.getElementById('studentAccountForm');
    const searchInput = document.getElementById('studentSearch');
    const statusFilter = document.getElementById('statusFilter');

    if (form) {
        form.addEventListener('submit', saveStudentAccount);
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderStudentDirectory);
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', renderStudentDirectory);
    }
}

function hydrateStudentsDirectory() {
    const cachedStudents = safeParseJson(localStorage.getItem(STUDENTS_DIRECTORY_KEY), null);

    if (Array.isArray(cachedStudents) && cachedStudents.length > 0) {
        studentsDirectory = dedupeStudents(cachedStudents.map(normalizeStudentRecord));
        persistStudentsDirectory();
        return;
    }

    const migratedStudents = migrateStudentsFromLegacyProfileStorage();

    if (migratedStudents.length > 0) {
        studentsDirectory = dedupeStudents(migratedStudents.map(normalizeStudentRecord));
        persistStudentsDirectory();
        return;
    }

    studentsDirectory = dedupeStudents(DEFAULT_STUDENTS.map(normalizeStudentRecord));
    persistStudentsDirectory();
}

function migrateStudentsFromLegacyProfileStorage() {
    const migrated = [];

    Object.keys(localStorage)
        .filter(key => key.startsWith(STUDENT_DATA_PREFIX))
        .forEach(key => {
            const profile = safeParseJson(localStorage.getItem(key), null);
            if (!profile || !profile.email) {
                return;
            }

            migrated.push({
                studentId: profile.studentId || profile.studentNumber || key.replace(STUDENT_DATA_PREFIX, '').toUpperCase(),
                fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Student',
                email: String(profile.email).trim(),
                classSection: profile.classSection || profile.section || 'Unassigned',
                course: profile.course || profile.program || profile.degree || 'Other',
                jobTrack: profile.jobTrack || 'Not Assigned',
                activeClass: typeof profile.activeClass === 'boolean' ? profile.activeClass : String(profile.status || '').toLowerCase() !== 'inactive',
                joinedDate: profile.joinedDate || profile.registeredDate || new Date().toISOString()
            });
        });

    return migrated;
}

function normalizeStudentRecord(student = {}) {
    const fullName = String(student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student').trim();
    const email = String(student.email || '').trim().toLowerCase();

    return {
        studentId: String(student.studentId || student.studentNumber || student.id || '').trim() || generateStudentId(),
        fullName,
        email,
        classSection: String(student.classSection || student.section || 'Unassigned').trim(),
        course: String(student.course || student.program || student.degree || 'Other').trim(),
        jobTrack: String(student.jobTrack || 'Not Assigned').trim(),
        activeClass: typeof student.activeClass === 'boolean' ? student.activeClass : String(student.status || '').toLowerCase() !== 'inactive',
        joinedDate: student.joinedDate || student.registeredDate || new Date().toISOString()
    };
}

function dedupeStudents(students) {
    const uniqueStudents = new Map();

    students.forEach(student => {
        const key = String(student.email || student.studentId || '').trim().toLowerCase();
        if (!key) {
            return;
        }

        const existing = uniqueStudents.get(key) || {};
        uniqueStudents.set(key, {
            ...existing,
            ...student,
            studentId: String(student.studentId || existing.studentId || '').trim(),
            email: String(student.email || existing.email || '').trim().toLowerCase()
        });
    });

    return Array.from(uniqueStudents.values())
        .sort((first, second) => new Date(second.joinedDate || 0) - new Date(first.joinedDate || 0));
}

function persistStudentsDirectory() {
    localStorage.setItem(STUDENTS_DIRECTORY_KEY, JSON.stringify(studentsDirectory));
}

function getFilteredStudents() {
    const searchValue = String(document.getElementById('studentSearch')?.value || '').trim().toLowerCase();
    const statusValue = String(document.getElementById('statusFilter')?.value || 'all');

    return studentsDirectory.filter(student => {
        const matchesSearch = !searchValue || [student.studentId, student.fullName, student.email, student.classSection, student.course, student.jobTrack]
            .join(' ')
            .toLowerCase()
            .includes(searchValue);

        const matchesStatus = statusValue === 'all'
            || (statusValue === 'active' && student.activeClass)
            || (statusValue === 'inactive' && !student.activeClass)
            || (statusValue === 'job-ready' && String(student.jobTrack).toLowerCase() !== 'not assigned');

        return matchesSearch && matchesStatus;
    });
}

function renderStudentDirectory() {
    const tableBody = document.getElementById('studentTableBody');
    if (!tableBody) {
        return;
    }

    const students = getFilteredStudents();

    if (students.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="empty-table-state">No matching student accounts found.</td></tr>';
        return;
    }

    tableBody.innerHTML = students.map(student => `
        <tr class="${student.studentId === selectedStudentId ? 'selected-row' : ''}">
            <td>${escapeHtml(student.studentId)}</td>
            <td>${escapeHtml(student.fullName)}</td>
            <td>${escapeHtml(student.classSection)}</td>
            <td>${escapeHtml(student.course)}</td>
            <td>${escapeHtml(student.jobTrack)}</td>
            <td>
                <span class="status-pill ${student.activeClass ? 'active' : 'inactive'}">
                    ${student.activeClass ? 'On Class' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button type="button" class="action-button" onclick="selectStudentAccount(${JSON.stringify(student.studentId)})">Edit</button>
                    <button type="button" class="action-button" onclick="toggleStudentClassStatus(${JSON.stringify(student.studentId)})">
                        ${student.activeClass ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button type="button" class="action-button" ${student.activeClass ? 'disabled title="Deactivate first to delete"' : ''} onclick="deleteSelectedStudent(${JSON.stringify(student.studentId)})">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderStudentStats();
}

function renderStudentStats() {
    const totalStudents = studentsDirectory.length;
    const activeStudents = studentsDirectory.filter(student => student.activeClass).length;
    const jobReadyStudents = studentsDirectory.filter(student => String(student.jobTrack).toLowerCase() !== 'not assigned').length;
    const deletableStudents = studentsDirectory.filter(student => !student.activeClass).length;

    setTextContent('totalStudentsCount', totalStudents);
    setTextContent('activeStudentsCount', activeStudents);
    setTextContent('jobReadyStudentsCount', jobReadyStudents);
    setTextContent('deletableStudentsCount', deletableStudents);
}

function selectStudentAccount(studentId) {
    const student = studentsDirectory.find(entry => entry.studentId === studentId);
    if (!student) {
        showToast('Student account not found.', 'error');
        return;
    }

    selectedStudentId = student.studentId;
    setTextContent('formTitle', `Edit ${student.fullName}`);
    setValue('originalStudentId', student.studentId);
    setValue('studentId', student.studentId);
    setValue('fullName', student.fullName);
    setValue('email', student.email);
    setValue('classSection', student.classSection);
    setValue('course', student.course);
    setValue('jobTrack', student.jobTrack);
    setValue('activeClass', String(student.activeClass));
    setValue('joinedDate', formatForDateInput(student.joinedDate));

    const deleteButton = document.getElementById('deleteStudentButton');
    if (deleteButton) {
        deleteButton.disabled = student.activeClass;
        deleteButton.title = student.activeClass ? 'Deactivate this student before deleting the account.' : 'Delete this student account';
    }

    renderStudentDirectory();
    showToast(`Loaded ${student.fullName} for editing.`, 'info');
}

function resetStudentForm() {
    selectedStudentId = '';
    const form = document.getElementById('studentAccountForm');
    if (form) {
        form.reset();
    }

    setValue('originalStudentId', '');
    setValue('studentId', generateStudentId());
    setValue('activeClass', 'true');
    setValue('joinedDate', formatForDateInput(new Date().toISOString()));
    setTextContent('formTitle', 'Add Student Account');

    const deleteButton = document.getElementById('deleteStudentButton');
    if (deleteButton) {
        deleteButton.disabled = true;
        deleteButton.title = 'Select a student before deleting';
    }

    renderStudentDirectory();
}

function focusStudentForm() {
    resetStudentForm();
    document.getElementById('studentId')?.focus();
}

function saveStudentAccount(event) {
    event.preventDefault();

    const originalStudentId = String(document.getElementById('originalStudentId')?.value || '').trim();
    const studentId = String(document.getElementById('studentId')?.value || '').trim();
    const fullName = String(document.getElementById('fullName')?.value || '').trim();
    const email = String(document.getElementById('email')?.value || '').trim().toLowerCase();
    const classSection = String(document.getElementById('classSection')?.value || '').trim();
    const course = String(document.getElementById('course')?.value || '').trim();
    const jobTrack = String(document.getElementById('jobTrack')?.value || '').trim();
    const activeClass = String(document.getElementById('activeClass')?.value || 'true') === 'true';
    const joinedDate = String(document.getElementById('joinedDate')?.value || '').trim() || formatForDateInput(new Date().toISOString());

    if (!studentId || !fullName || !email || !classSection || !course || !jobTrack) {
        showToast('Please complete all required fields.', 'error');
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showToast('Enter a valid email address.', 'error');
        return;
    }

    const existingIndex = studentsDirectory.findIndex(student =>
        student.studentId === originalStudentId || student.studentId === studentId || student.email === email
    );

    const previousEmail = existingIndex >= 0 ? studentsDirectory[existingIndex].email : '';
    const studentPayload = {
        studentId,
        fullName,
        email,
        classSection,
        course,
        jobTrack,
        activeClass,
        joinedDate
    };

    if (existingIndex >= 0) {
        studentsDirectory[existingIndex] = studentPayload;
    } else {
        studentsDirectory.push(studentPayload);
    }

    studentsDirectory = dedupeStudents(studentsDirectory);
    persistStudentsDirectory();
    syncLegacyStudentProfile(studentPayload, previousEmail);

    selectedStudentId = studentId;
    setValue('originalStudentId', studentId);
    renderStudentDirectory();
    renderStudentStats();
    showToast(`Saved ${fullName}'s account.`, 'success');
}

function toggleStudentClassStatus(studentId) {
    const index = studentsDirectory.findIndex(student => student.studentId === studentId);
    if (index === -1) {
        showToast('Student account not found.', 'error');
        return;
    }

    studentsDirectory[index].activeClass = !studentsDirectory[index].activeClass;
    persistStudentsDirectory();
    renderStudentDirectory();
    renderStudentStats();

    if (selectedStudentId === studentId) {
        selectStudentAccount(studentId);
    }

    showToast(`${studentsDirectory[index].fullName} is now ${studentsDirectory[index].activeClass ? 'active on class' : 'inactive'}.`, 'info');
}

function deleteSelectedStudent(studentId = selectedStudentId) {
    const student = studentsDirectory.find(entry => entry.studentId === studentId);
    if (!student) {
        showToast('Student account not found.', 'error');
        return;
    }

    if (student.activeClass) {
        showToast('Deactivate the student before deleting the account.', 'error');
        return;
    }

    if (!window.confirm(`Delete ${student.fullName}'s account? This cannot be undone.`)) {
        return;
    }

    studentsDirectory = studentsDirectory.filter(entry => entry.studentId !== studentId);
    persistStudentsDirectory();
    removeLegacyStudentProfile(student.email);

    if (selectedStudentId === studentId) {
        resetStudentForm();
    }

    renderStudentDirectory();
    renderStudentStats();
    showToast(`${student.fullName}'s account has been deleted.`, 'success');
}

function syncLegacyStudentProfile(student, previousEmail = '') {
    const profilePayload = {
        studentId: student.studentId,
        studentNumber: student.studentId,
        fullName: student.fullName,
        email: student.email,
        classSection: student.classSection,
        course: student.course,
        program: student.course,
        degree: student.course,
        jobTrack: student.jobTrack,
        activeClass: student.activeClass,
        status: student.activeClass ? 'active' : 'inactive',
        joinedDate: student.joinedDate,
        registeredDate: student.joinedDate
    };

    if (previousEmail && previousEmail !== student.email) {
        localStorage.removeItem(STUDENT_DATA_PREFIX + previousEmail);
    }

    localStorage.setItem(STUDENT_DATA_PREFIX + student.email, JSON.stringify(profilePayload));
    localStorage.setItem('studentData', JSON.stringify(profilePayload));
}

function removeLegacyStudentProfile(email) {
    if (!email) {
        return;
    }

    localStorage.removeItem(STUDENT_DATA_PREFIX + email);

    const currentProfile = safeParseJson(localStorage.getItem('studentData'), null);
    if (currentProfile && String(currentProfile.email || '').toLowerCase() === String(email).toLowerCase()) {
        localStorage.removeItem('studentData');
    }
}

function generateStudentId() {
    const numericIds = studentsDirectory
        .map(student => String(student.studentId || '').replace(/\D/g, ''))
        .filter(Boolean)
        .map(value => Number(value));

    const nextNumber = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 2101;
    return `STU-${String(nextNumber).padStart(4, '0')}`;
}

function safeParseJson(value, fallback = null) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatForDateInput(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

function setTextContent(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    window.clearTimeout(showToast.hideTimer);
    showToast.hideTimer = window.setTimeout(() => {
        toast.className = 'toast';
    }, 2400);
}