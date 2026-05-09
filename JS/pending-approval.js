(function() {
    const API_BASE = 'server/php';

    function getStudentToken() {
        return sessionStorage.getItem('studentToken') || localStorage.getItem('studentToken') || '';
    }

    function getStudentEmail() {
        return (sessionStorage.getItem('studentEmail') || '').trim().toLowerCase();
    }

    function formatDate(value) {
        const date = new Date(value || '');
        if (Number.isNaN(date.getTime())) {
            return 'Recently';
        }

        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getStatusClass(status = '') {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'approved') return 'status-approved';
        if (normalized === 'rejected') return 'status-rejected';
        return 'status-pending';
    }

    function getStatusLabel(status = '') {
        const normalized = String(status || '').toLowerCase();
        if (normalized === 'approved') return 'Approved';
        if (normalized === 'rejected') return 'Rejected';
        return 'Pending';
    }

    async function loadApprovals() {
        const token = getStudentToken();
        if (!token) {
            return [];
        }

        const response = await fetch(`${API_BASE}/list_pending_approvals.php?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error((data && data.error) || 'Unable to load approvals');
        }

        const approvals = Array.isArray(data.approvals) ? data.approvals : [];
        return approvals;
    }

    async function submitPendingRequest(event) {
        event.preventDefault();

        const token = getStudentToken();
        const requestType = document.getElementById('studentPendingType')?.value.trim() || '';
        const receiverEmail = document.getElementById('studentPendingReceiver')?.value.trim() || '';

        if (!token || !requestType || !receiverEmail) {
            if (typeof showNotification === 'function') {
                showNotification('Fill in all fields first', 'error');
            }
            return;
        }

        const formData = new FormData();
        formData.append('token', token);
        formData.append('requestType', requestType);
        formData.append('receiverEmail', receiverEmail);

        const response = await fetch(`${API_BASE}/create_pending_approval.php`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error((data && data.error) || 'Unable to submit request');
        }

        document.getElementById('studentPendingRequestForm')?.reset();
        await refreshPendingApprovals();

        if (typeof showNotification === 'function') {
            showNotification('Pending request submitted', 'success');
        }
    }

    function renderPendingList(filter = '', approvals = []) {
        const container = document.getElementById('pendingList');
        if (!container) return;

        const items = Array.isArray(approvals) ? approvals : [];
        const studentEmail = getStudentEmail();
        const term = String(filter || '').trim().toLowerCase();

        const filtered = items.filter(item => {
            const searchBlob = [
                item.requestType,
                item.requesterName,
                item.requesterEmail,
                item.requesterStudentNumber,
                item.requesterProgram,
                item.status,
                item.receiverEmail
            ].join(' ').toLowerCase();

            const matchesSearch = !term || searchBlob.includes(term);
            const matchesStudent = !studentEmail || String(item.requesterEmail || '').toLowerCase() === studentEmail;
            return matchesSearch && matchesStudent;
        });

        if (!filtered.length) {
            container.innerHTML = '<p class="no-pending">No pending approvals found.</p>';
            return;
        }

        container.innerHTML = filtered.map(item => `
            <div class="pending-card pending-card-readonly" id="pending-${item.id}">
                <div class="meta">
                    <div>
                        <h4>${item.requestType || 'Approval Request'}</h4>
                        <p class="muted">Submitted by: ${item.requesterName || item.requesterEmail || 'Unknown'} • ${formatDate(item.createdAt)}</p>
                        <p class="muted">Email: <strong>${item.requesterEmail || '-'}</strong></p>
                        <p class="muted">Student ID: <strong>${item.requesterStudentNumber || '-'}</strong> • Course: <strong>${item.requesterProgram || '-'}</strong></p>
                        <p class="muted">Receiver: <strong>${item.receiverEmail || '-'}</strong></p>
                    </div>
                </div>
                <div class="pending-actions pending-status-only">
                    <span class="pending-status-pill ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span>
                </div>
            </div>
        `).join('');
    }

    async function refreshPendingApprovals() {
        const searchValue = document.getElementById('pendingSearch')?.value || '';
        const container = document.getElementById('pendingList');

        if (!container) return;

        try {
            const approvals = await loadApprovals();
            renderPendingList(searchValue, approvals);
        } catch (error) {
            container.innerHTML = '<p class="no-pending">No pending approvals available.</p>';
            console.warn('[pending-approval] load failed:', error);
        }
    }

    window.refreshPendingApprovals = refreshPendingApprovals;

    document.addEventListener('DOMContentLoaded', function() {
        const requestForm = document.getElementById('studentPendingRequestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', function(event) {
                submitPendingRequest(event).catch(error => {
                    console.warn('[pending-approval] submit failed:', error);
                    if (typeof showNotification === 'function') {
                        showNotification('Unable to submit request', 'error');
                    }
                });
            });
        }

        const search = document.getElementById('pendingSearch');
        if (search) {
            search.addEventListener('input', function() {
                renderPendingList(this.value || '');
            });
        }

        refreshPendingApprovals();
    });
})();
