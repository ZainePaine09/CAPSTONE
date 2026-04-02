/* ===========================
   ADMIN MANAGE POSTED JOBS
   =========================== */

const POSTED_JOBS_API_URL = '/server/php/posted_jobs.php';
const POSTED_JOBS_STORAGE_KEY = 'postedJobsData';

let postedJobsData = {};

function createDefaultPostedJobs() {
    return {
        '2026-04-20': [
            {
                id: 1,
                title: 'Software Developer',
                company: 'TechCorp Inc.',
                location: 'Makati City',
                type: 'Full-time',
                salary: '₱40,000 - ₱55,000',
                description: 'Build and maintain web applications for students and alumni.',
                requirements: 'React, JavaScript, REST APIs, Git',
                postedDate: '2026-04-20'
            }
        ],
        '2026-04-09': [
            {
                id: 2,
                title: 'Marketing Specialist',
                company: 'Bright Ideas Co.',
                location: 'Cebu City',
                type: 'Full-time',
                salary: '₱30,000 - ₱42,000',
                description: 'Support campaign planning, social content, and brand growth.',
                requirements: 'Marketing basics, content writing, analytics',
                postedDate: '2026-04-09'
            }
        ]
    };
}

function safeParseJson(value, fallback = null) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function normalizeJobsArray(jobs) {
    return Array.isArray(jobs) ? jobs.filter(Boolean) : [];
}

function groupJobsByDate(jobs) {
    return normalizeJobsArray(jobs).reduce((groups, job) => {
        const dateKey = job.postedDate || new Date().toISOString().split('T')[0];
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(job);
        return groups;
    }, {});
}

function flattenJobsData(data) {
    if (!data) {
        return [];
    }

    if (Array.isArray(data)) {
        return normalizeJobsArray(data);
    }

    if (typeof data === 'object') {
        return Object.keys(data).reduce((all, dateKey) => {
            const jobs = Array.isArray(data[dateKey]) ? data[dateKey] : [];
            return all.concat(jobs);
        }, []);
    }

    return [];
}

function getAllJobs() {
    return flattenJobsData(postedJobsData)
        .sort((first, second) => new Date(second.postedDate).getTime() - new Date(first.postedDate).getTime());
}

function findJobById(id) {
    for (const dateKey in postedJobsData) {
        const jobs = Array.isArray(postedJobsData[dateKey]) ? postedJobsData[dateKey] : [];
        const index = jobs.findIndex(job => job.id === id);
        if (index !== -1) {
            return { dateKey, index, job: jobs[index] };
        }
    }
    return null;
}

function saveJobsToCache() {
    localStorage.setItem(POSTED_JOBS_STORAGE_KEY, JSON.stringify(postedJobsData));
}

async function syncJobsToServer() {
    const jobs = getAllJobs();

    try {
        const response = await fetch(POSTED_JOBS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobs })
        });

        if (!response.ok) {
            throw new Error('Server returned ' + response.status);
        }

        const data = await response.json();
        if (data && data.success && Array.isArray(data.jobs)) {
            postedJobsData = groupJobsByDate(data.jobs);
            saveJobsToCache();
        }
    } catch (error) {
        console.warn('Posted jobs sync failed:', error);
    }
}

async function loadPostedJobs() {
    const cachedJobs = safeParseJson(localStorage.getItem(POSTED_JOBS_STORAGE_KEY), null);

    try {
        const response = await fetch(POSTED_JOBS_API_URL, {
            method: 'GET',
            cache: 'no-cache'
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data.success && Array.isArray(data.jobs)) {
                postedJobsData = groupJobsByDate(data.jobs);
                saveJobsToCache();

                if (Object.keys(postedJobsData).length > 0) {
                    return;
                }
            }
        }
    } catch (error) {
        console.warn('Posted jobs load failed:', error);
    }

    if (cachedJobs && typeof cachedJobs === 'object' && Object.keys(cachedJobs).length > 0) {
        postedJobsData = cachedJobs;
        await syncJobsToServer();
        return;
    }

    postedJobsData = createDefaultPostedJobs();
    saveJobsToCache();
    await syncJobsToServer();
}

function displayExistingJobs() {
    const list = document.getElementById('existingJobsList');
    if (!list) {
        return;
    }

    const jobs = getAllJobs();

    if (!jobs.length) {
        list.innerHTML = '<p class="empty-message">No posted jobs yet</p>';
        return;
    }

    list.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-date-line">📅 ${new Date(job.postedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <h4>${job.title}</h4>
            <p class="job-summary">${job.description}</p>
            <div class="job-meta">
                <span class="job-pill">${job.type}</span>
                <span class="job-pill salary">${job.salary}</span>
            </div>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Requirements:</strong> ${job.requirements}</p>
            <div class="job-actions">
                <button class="btn-small btn-edit-small" onclick="editJob(${job.id})">✏️ Edit</button>
                <button class="btn-small btn-clear-small" onclick="clearThisJob(${job.id})">🧹 Clear This Job</button>
            </div>
        </div>
    `).join('');
}

async function addJob(e) {
    e.preventDefault();

    const title = document.getElementById('jobTitle').value;
    const company = document.getElementById('jobCompany').value;
    const location = document.getElementById('jobLocation').value;
    const type = document.getElementById('jobType').value;
    const salary = document.getElementById('jobSalary').value;
    const description = document.getElementById('jobDescription').value;
    const requirements = document.getElementById('jobRequirements').value;
    const postedDate = document.getElementById('jobPostedDate').value;

    const existingIds = getAllJobs().map(job => job.id || 0);
    const newId = (existingIds.length ? Math.max(...existingIds) : 0) + 1;

    const newJob = { id: newId, title, company, location, type, salary, description, requirements, postedDate };

    if (!postedJobsData[postedDate]) {
        postedJobsData[postedDate] = [];
    }

    postedJobsData[postedDate].push(newJob);
    saveJobsToCache();
    await syncJobsToServer();

    showNotification('Job added successfully!', 'success');
    e.target.reset();
    displayExistingJobs();
}

function editJob(id) {
    const found = findJobById(id);
    if (!found) {
        showNotification('Job not found', 'error');
        return;
    }

    document.getElementById('editJobId').value = found.job.id;
    document.getElementById('editJobTitle').value = found.job.title;
    document.getElementById('editJobCompany').value = found.job.company;
    document.getElementById('editJobLocation').value = found.job.location;
    document.getElementById('editJobType').value = found.job.type;
    document.getElementById('editJobSalary').value = found.job.salary;
    document.getElementById('editJobDescription').value = found.job.description;
    document.getElementById('editJobRequirements').value = found.job.requirements;
    document.getElementById('editJobPostedDate').value = found.job.postedDate;

    document.getElementById('editJobModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

async function updateJob(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editJobId').value);
    const title = document.getElementById('editJobTitle').value;
    const company = document.getElementById('editJobCompany').value;
    const location = document.getElementById('editJobLocation').value;
    const type = document.getElementById('editJobType').value;
    const salary = document.getElementById('editJobSalary').value;
    const description = document.getElementById('editJobDescription').value;
    const requirements = document.getElementById('editJobRequirements').value;
    const postedDate = document.getElementById('editJobPostedDate').value;

    const found = findJobById(id);
    if (!found) {
        showNotification('Job not found', 'error');
        return;
    }

    const updatedJob = { id, title, company, location, type, salary, description, requirements, postedDate };

    postedJobsData[found.dateKey].splice(found.index, 1);
    if (!postedJobsData[postedDate]) {
        postedJobsData[postedDate] = [];
    }
    postedJobsData[postedDate].push(updatedJob);

    saveJobsToCache();
    await syncJobsToServer();
    showNotification('Job updated successfully!', 'success');
    closeEditModal();
    displayExistingJobs();
}

function clearThisJob(id) {
    if (!confirm('Are you sure you want to clear this job? This action cannot be undone.')) {
        return;
    }

    const found = findJobById(id);
    if (!found) {
        showNotification('Job not found', 'error');
        return;
    }

    postedJobsData[found.dateKey].splice(found.index, 1);
    saveJobsToCache();
    syncJobsToServer();
    showNotification('Job cleared successfully!', 'success');
    displayExistingJobs();
}

function clearAllJobs() {
    if (!confirm('Are you sure you want to clear all jobs? This action cannot be undone.')) {
        return;
    }

    postedJobsData = {};
    saveJobsToCache();
    syncJobsToServer();
    showNotification('All jobs cleared successfully!', 'success');
    displayExistingJobs();
}

function closeEditModal() {
    document.getElementById('editJobModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('editJobForm').reset();
}

window.onclick = function(event) {
    const modal = document.getElementById('editJobModal');
    if (event.target === modal) {
        closeEditModal();
    }
};

function goBackToDashboard() {
    window.location.href = 'AdminDashboard.html';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.setItem('logoutMessage', 'You have been logged out successfully');
        setTimeout(() => {
            window.location.href = 'AdminLogin.html';
        }, 500);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.backgroundColor = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#0369a1';
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2500);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('jobForm');
    const editForm = document.getElementById('editJobForm');
    const postedDateInput = document.getElementById('jobPostedDate');

    if (postedDateInput && !postedDateInput.value) {
        postedDateInput.value = new Date().toISOString().split('T')[0];
    }

    if (form) {
        form.addEventListener('submit', addJob);
    }

    if (editForm) {
        editForm.addEventListener('submit', updateJob);
    }

    loadPostedJobs().finally(() => {
        displayExistingJobs();
    });
});
