const STUDENT_ACCOUNTS_API_BASE = 'server/php';
const STUDENT_ACCOUNTS_FETCH_TIMEOUT_MS = 8000;

let studentsDirectory = [];
let selectedStudentId = '';

function fetchStudentAccountsWithTimeout(url, options = {}, timeoutMs = STUDENT_ACCOUNTS_FETCH_TIMEOUT_MS) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
        })
    ]);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeStudentAccountsPage();
});

async function initializeStudentAccountsPage() {
    bindPageEvents();
    resetStudentForm();

    try {
        await loadStudentAccounts();
        renderStudentDirectory();
        renderStudentStats();

        if (studentsDirectory.length > 0) {
            selectStudentAccount(studentsDirectory[0].studentId);
        }
    } catch (error) {
        renderStudentDirectory();
        renderStudentStats();
        showToast(error.message || 'Unable to load student accounts.', 'error');
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

async function loadStudentAccounts() {
    const response = await fetchStudentAccountsWithTimeout(`${STUDENT_ACCOUNTS_API_BASE}/list_student_accounts.php`, {
        method: 'GET',
        cache: 'no-cache',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.success || !Array.isArray(payload.students)) {
        throw new Error(payload?.error || 'Failed to load student accounts');
    }

    studentsDirectory = dedupeStudents(payload.students.map(normalizeStudentRecord));
}

function normalizeStudentRecord(student = {}) {
    const fullName = String(student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student').trim();
    const fallbackStudentId = String(student.studentId || student.student_number || '').trim() || (student.id ? `STU-${String(student.id).padStart(4, '0')}` : '');

    return {
        studentId: fallbackStudentId,
        fullName,
        email: String(student.email || '').trim().toLowerCase(),
        classSection: String(student.classSection || student.class_section || 'Unassigned').trim() || 'Unassigned',
        course: String(student.course || student.program || 'Other').trim() || 'Other',
        jobTrack: String(student.jobTrack || student.job_track || 'Not Assigned').trim() || 'Not Assigned',
        activeClass: typeof student.activeClass === 'boolean' ? student.activeClass : Number(student.active_class ?? 1) === 1,
        joinedDate: String(student.joinedDate || student.registeredAt || new Date().toISOString()).slice(0, 10),
    };
}

function dedupeStudents(students) {
    const uniqueStudents = new Map();

    students.forEach(student => {
        const key = String(student.email || student.studentId || '').trim().toLowerCase();
        if (!key) {
            return;
        }

        uniqueStudents.set(key, {
            ...(uniqueStudents.get(key) || {}),
            ...student,
            studentId: String(student.studentId || '').trim(),
            email: String(student.email || '').trim().toLowerCase(),
        });
    });

    return Array.from(uniqueStudents.values()).sort((left, right) => new Date(right.joinedDate || 0) - new Date(left.joinedDate || 0));
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
    setTextContent('totalStudentsCount', studentsDirectory.length);
    setTextContent('activeStudentsCount', studentsDirectory.filter(student => student.activeClass).length);
    setTextContent('jobReadyStudentsCount', studentsDirectory.filter(student => String(student.jobTrack).toLowerCase() !== 'not assigned').length);
    setTextContent('deletableStudentsCount', studentsDirectory.filter(student => !student.activeClass).length);
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
    setValue('originalStudentEmail', student.email);
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
    setValue('originalStudentEmail', '');
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

async function saveStudentAccount(event) {
    event.preventDefault();

    const originalStudentId = String(document.getElementById('originalStudentId')?.value || '').trim();
    const originalStudentEmail = String(document.getElementById('originalStudentEmail')?.value || '').trim().toLowerCase();
    const studentId = String(document.getElementById('studentId')?.value || '').trim();
    const fullName = String(document.getElementById('fullName')?.value || '').trim();
    const email = String(document.getElementById('email')?.value || '').trim().toLowerCase();
    const classSection = String(document.getElementById('classSection')?.value || '').trim();
    const course = String(document.getElementById('course')?.value || '').trim();
    const jobTrack = String(document.getElementById('jobTrack')?.value || '').trim();
    const activeClass = String(document.getElementById('activeClass')?.value || 'true') === 'true';
    const joinedDate = String(document.getElementById('joinedDate')?.value || '').trim();

    if (!studentId || !fullName || !email || !classSection || !course || !jobTrack || !joinedDate) {
        showToast('Please complete all required fields.', 'error');
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showToast('Enter a valid email address.', 'error');
        return;
    }

    const duplicateStudent = studentsDirectory.find(student => {
        const matchesId = student.studentId === studentId;
        const matchesEmail = student.email === email;
        return (matchesId || matchesEmail) && student.studentId !== originalStudentId;
    });

    if (duplicateStudent) {
        showToast(duplicateStudent.studentId === studentId ? 'Student ID already exists.' : 'Email already exists in student list.', 'error');
        return;
    }

    const formData = new FormData();
    formData.set('originalStudentId', originalStudentId);
    formData.set('originalStudentEmail', originalStudentEmail);
    formData.set('studentId', studentId);
    formData.set('fullName', fullName);
    formData.set('email', email);
    formData.set('classSection', classSection);
    formData.set('course', course);
    formData.set('jobTrack', jobTrack);
    formData.set('activeClass', String(activeClass));
    formData.set('joinedDate', joinedDate);

    const response = await fetch(`${STUDENT_ACCOUNTS_API_BASE}/save_student_account.php`, {
        method: 'POST',
        body: formData,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.success) {
        throw new Error(payload?.error || 'Unable to save student account');
    }

    await loadStudentAccounts();
    selectedStudentId = studentId;
    setValue('originalStudentId', studentId);
    renderStudentDirectory();
    renderStudentStats();
    showToast(payload.message || `Saved ${fullName}'s account.`, 'success');
}

async function toggleStudentClassStatus(studentId) {
    const student = studentsDirectory.find(entry => entry.studentId === studentId);
    if (!student) {
        showToast('Student account not found.', 'error');
        return;
    }

    const formData = new FormData();
    formData.set('originalStudentId', student.studentId);
    formData.set('originalStudentEmail', student.email);
    formData.set('studentId', student.studentId);
    formData.set('fullName', student.fullName);
    formData.set('email', student.email);
    formData.set('classSection', student.classSection);
    formData.set('course', student.course);
    formData.set('jobTrack', student.jobTrack);
    formData.set('activeClass', String(!student.activeClass));
    formData.set('joinedDate', student.joinedDate);

    const response = await fetch(`${STUDENT_ACCOUNTS_API_BASE}/save_student_account.php`, {
        method: 'POST',
        body: formData,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.success) {
        throw new Error(payload?.error || 'Unable to update student status');
    }

    await loadStudentAccounts();
    renderStudentDirectory();
    renderStudentStats();

    if (selectedStudentId === studentId) {
        selectStudentAccount(studentId);
    }

    showToast(`${student.fullName} is now ${student.activeClass ? 'inactive' : 'active on class'}.`, 'success');
}

async function deleteSelectedStudent(studentId = selectedStudentId) {
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

    const formData = new FormData();
    formData.set('studentId', student.studentId);

    const response = await fetch(`${STUDENT_ACCOUNTS_API_BASE}/delete_student_account.php`, {
        method: 'POST',
        body: formData,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || !payload.success) {
        throw new Error(payload?.error || 'Unable to delete student account');
    }

    await loadStudentAccounts();

    if (selectedStudentId === studentId) {
        resetStudentForm();
    }

    renderStudentDirectory();
    renderStudentStats();
    showToast(payload.message || `${student.fullName}'s account has been deleted.`, 'success');
}

function messageStudent(studentId) {
    const student = studentsDirectory.find(entry => entry.studentId === studentId);
    if (!student) {
        showToast('Student account not found.', 'error');
        return;
    }

    const subject = encodeURIComponent('Message from Admin - Alumni Smart Connect');
    const body = encodeURIComponent(`Hello ${student.fullName},\n\nThis is a message from the Admin/Teacher panel.\n\nRegards,\nAdmin Team`);
    window.location.href = `mailto:${student.email}?subject=${subject}&body=${body}`;
    showToast(`Opening email compose for ${student.fullName}`, 'info');
}

function generateStudentId() {
    const numericIds = studentsDirectory
        .map(student => String(student.studentId || '').replace(/\D/g, ''))
        .filter(Boolean)
        .map(value => Number(value));

    const nextNumber = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 2101;
    return `STU-${String(nextNumber).padStart(4, '0')}`;
}

function setValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
    }
}

function setTextContent(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = String(value);
    }
}

function formatForDateInput(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.className = `toast show ${type}`;
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}