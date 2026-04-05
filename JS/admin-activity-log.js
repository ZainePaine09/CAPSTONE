/* ===========================
   ADMIN ACTIVITY LOG
   =========================== */

const ACTIVITY_LOG_KEY = 'adminActivityLogEntries';

function getActivityLogEntries() {
    try {
        const parsed = JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || 'null');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveActivityLogEntries(entries) {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(entries));
}

function recordActivityLog(entry) {
    const entries = getActivityLogEntries();
    entries.unshift({
        id: Date.now() + Math.random(),
        role: entry.role || 'admin',
        action: entry.action || 'login',
        name: entry.name || 'Unknown User',
        email: entry.email || '',
        message: entry.message || '',
        createdAt: entry.createdAt || new Date().toISOString()
    });

    saveActivityLogEntries(entries.slice(0, 100));
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        if (typeof window.recordActivityLog === 'function') {
            const adminEmail = sessionStorage.getItem('adminEmail') || 'Administrator';
            window.recordActivityLog({
                role: 'admin',
                action: 'logout',
                name: adminEmail,
                email: adminEmail,
                message: `Admin ${adminEmail} logged out from the dashboard.`
            });
        }

        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminToken');
        window.location.href = 'AdminLogin.html';
    }
}

function seedDemoActivityLog() {
    if (getActivityLogEntries().length) {
        return;
    }

    saveActivityLogEntries([
        { id: 1, role: 'admin', action: 'login', name: 'Administrator', email: 'admin@school.edu', message: 'Admin signed in to the dashboard.', createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
        { id: 2, role: 'student', action: 'login', name: 'Student User', email: 'student@school.edu', message: 'Student signed in to the portal.', createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
        { id: 3, role: 'student', action: 'logout', name: 'Student User', email: 'student@school.edu', message: 'Student logged out from the portal.', createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString() },
        { id: 4, role: 'admin', action: 'logout', name: 'Administrator', email: 'admin@school.edu', message: 'Admin logged out from the dashboard.', createdAt: new Date(Date.now() - 1000 * 60 * 52).toISOString() }
    ]);
}

function renderActivityLog() {
    const list = document.getElementById('activityLogList');
    if (!list) {
        return;
    }

    const filter = document.getElementById('activityTypeFilter')?.value || 'all';
    const entries = getActivityLogEntries().filter(entry => {
        if (filter === 'all') return true;
        if (filter === 'login' || filter === 'logout') return entry.action === filter;
        return entry.role === filter;
    });

    document.getElementById('totalEntries').textContent = String(getActivityLogEntries().length);
    document.getElementById('loginEntries').textContent = String(getActivityLogEntries().filter(item => item.action === 'login').length);
    document.getElementById('logoutEntries').textContent = String(getActivityLogEntries().filter(item => item.action === 'logout').length);
    document.getElementById('todayEntries').textContent = String(getActivityLogEntries().filter(item => {
        const itemDate = new Date(item.createdAt).toDateString();
        return itemDate === new Date().toDateString();
    }).length);

    if (!entries.length) {
        list.innerHTML = '<div class="activity-empty">No activity logs found.</div>';
        return;
    }

    list.innerHTML = entries.map(entry => `
        <article class="activity-log-item">
            <div class="activity-meta">
                <div class="activity-title">${entry.name}</div>
                <div class="activity-subtitle">${entry.message || `${entry.role} ${entry.action}`}</div>
                <div class="activity-time">${new Date(entry.createdAt).toLocaleString()}</div>
            </div>
            <div class="activity-badge badge-${entry.action === 'logout' ? 'logout' : 'login'} badge-${entry.role}">${entry.role} ${entry.action}</div>
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    seedDemoActivityLog();
    renderActivityLog();

    const filter = document.getElementById('activityTypeFilter');
    if (filter) {
        filter.addEventListener('change', renderActivityLog);
    }

    const refreshBtn = document.getElementById('refreshActivityBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', renderActivityLog);
    }

    const clearBtn = document.getElementById('clearActivityBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            localStorage.removeItem(ACTIVITY_LOG_KEY);
            renderActivityLog();
        });
    }
});

window.recordActivityLog = recordActivityLog;