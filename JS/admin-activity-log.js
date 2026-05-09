/* ===========================
   ADMIN ACTIVITY LOG
   =========================== */

const ACTIVITY_LOG_API_BASE = 'server/php';
const ACTIVITY_LOG_FETCH_TIMEOUT_MS = 8000;

let activityLogEntriesCache = [];

function getAdminActivityToken() {
    return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '';
}

function normalizeActivityEntry(entry = {}) {
    return {
        id: String(entry.id || ''),
        role: String(entry.role || 'admin'),
        action: String(entry.action || 'activity'),
        name: String(entry.name || entry.email || 'Unknown User'),
        email: String(entry.email || ''),
        message: String(entry.message || ''),
        createdAt: String(entry.createdAt || new Date().toISOString())
    };
}

function fetchWithTimeout(url, options = {}, timeoutMs = ACTIVITY_LOG_FETCH_TIMEOUT_MS) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
        })
    ]);
}

async function loadActivityLogEntries() {
    const list = document.getElementById('activityLogList');
    const token = getAdminActivityToken();

    if (!list) {
        return;
    }

    if (!token) {
        activityLogEntriesCache = [];
        renderActivityLog();
        list.innerHTML = '<div class="activity-empty">Sign in again to view the activity log.</div>';
        return;
    }

    try {
        const response = await fetchWithTimeout(`${ACTIVITY_LOG_API_BASE}/list_activity_logs.php?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            cache: 'no-cache'
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }

        activityLogEntriesCache = Array.isArray(data.entries) ? data.entries.map(normalizeActivityEntry) : [];
        renderActivityLog();
    } catch (error) {
        console.warn('Failed to load activity log entries:', error);
        activityLogEntriesCache = [];
        renderActivityLog();
        list.innerHTML = '<div class="activity-empty">Unable to load activity logs right now.</div>';
    }
}

function postActivityLogEntry(entry) {
    const payload = new URLSearchParams({
        token: getAdminActivityToken(),
        role: entry.role || 'admin',
        action: entry.action || 'activity',
        name: entry.name || 'Unknown User',
        email: entry.email || '',
        message: entry.message || '',
        createdAt: entry.createdAt || new Date().toISOString()
    });

    const url = `${ACTIVITY_LOG_API_BASE}/record_activity_log.php`;

    if (navigator.sendBeacon) {
        const blob = new Blob([payload.toString()], { type: 'application/x-www-form-urlencoded;charset=UTF-8' });
        navigator.sendBeacon(url, blob);
        return;
    }

    fetch(url, {
        method: 'POST',
        body: payload,
        keepalive: true
    }).catch(error => {
        console.warn('Failed to record activity log entry:', error);
    });
}

function recordActivityLog(entry) {
    postActivityLogEntry({
        role: entry.role || 'admin',
        action: entry.action || 'login',
        name: entry.name || 'Unknown User',
        email: entry.email || '',
        message: entry.message || '',
        createdAt: entry.createdAt || new Date().toISOString()
    });
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

function renderActivityLog() {
    const list = document.getElementById('activityLogList');
    if (!list) {
        return;
    }

    const filter = document.getElementById('activityTypeFilter')?.value || 'all';
    const entries = activityLogEntriesCache.filter(entry => {
        if (filter === 'all') return true;
        if (filter === 'login' || filter === 'logout') return entry.action === filter;
        return entry.role === filter;
    });

    document.getElementById('totalEntries').textContent = String(activityLogEntriesCache.length);
    document.getElementById('loginEntries').textContent = String(activityLogEntriesCache.filter(item => item.action === 'login').length);
    document.getElementById('logoutEntries').textContent = String(activityLogEntriesCache.filter(item => item.action === 'logout').length);
    document.getElementById('todayEntries').textContent = String(activityLogEntriesCache.filter(item => {
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

async function clearActivityLogEntries() {
    await loadActivityLogEntries();
}

document.addEventListener('DOMContentLoaded', function() {
    loadActivityLogEntries();

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
            clearActivityLogEntries();
        });
    }
});

window.recordActivityLog = recordActivityLog;