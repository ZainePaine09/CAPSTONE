(function() {
    const API_BASE = 'server/php';

    function getAdminToken() {
        return sessionStorage.getItem('adminToken') || '';
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

    function updatePendingMetric(count) {
        const metric = document.getElementById('pendingApprovalsMetric');
        if (metric) {
            metric.textContent = String(count);
        }
    }

    async function loadApprovals() {
        const token = getAdminToken();
        if (!token) {
            return [];
        }

        const response = await fetch(`${API_BASE}/list_pending_approvals.php?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error((data && data.error) || 'Unable to load approvals');
        }

        const approvals = Array.isArray(data.approvals) ? data.approvals : [];
        updatePendingMetric(approvals.filter(item => String(item.status || '').toLowerCase() === 'pending').length);
        return approvals;
    }

    async function submitPendingRequest(event) {
        event.preventDefault();

        const token = getAdminToken();
        const requestType = document.getElementById('adminPendingType')?.value.trim() || '';
        const receiverEmail = document.getElementById('adminPendingReceiver')?.value.trim() || '';

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

        document.getElementById('adminPendingRequestForm')?.reset();
        await refreshAdminPendingApprovals();

        if (typeof showNotification === 'function') {
            showNotification('Pending request submitted', 'success');
        }
    }

    function renderApprovals(filter = '', approvals = []) {
        const container = document.getElementById('adminPendingApprovalsTableBody');
        if (!container) return;

        const items = Array.isArray(approvals) ? approvals : [];
        const term = String(filter || '').trim().toLowerCase();

        const filtered = items.filter(item => {
            const searchBlob = [
                item.requesterName,
                item.requesterEmail,
                item.requesterStudentNumber,
                item.requesterProgram,
                item.requestType,
                item.status,
                item.receiverEmail
            ].join(' ').toLowerCase();

            return !term || searchBlob.includes(term);
        });

        if (!filtered.length) {
            container.innerHTML = '<tr><td colspan="6" class="no-table-data">No pending approvals found.</td></tr>';
            return;
        }

        container.innerHTML = filtered.map(item => `
            <tr id="approval-${item.id}">
                <td>${item.requesterName || 'Unknown'}</td>
                <td>${item.requesterEmail || '-'}</td>
                <td>${item.requestType || '-'}</td>
                <td><span class="pending-status-pill ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span></td>
                <td>${formatDate(item.createdAt)}</td>
                <td>
                    ${String(item.status || '').toLowerCase() === 'pending' ? `
                        <div class="pending-action-buttons">
                            <button type="button" class="btn-approve" onclick="approvePendingApproval(${item.id})">Approve</button>
                            <button type="button" class="btn-deny" onclick="rejectPendingApproval(${item.id})">Reject</button>
                        </div>
                    ` : '<span class="no-table-data">Reviewed</span>'}
                </td>
            </tr>
        `).join('');
    }

    async function refreshAdminPendingApprovals() {
        const searchValue = document.getElementById('adminPendingSearch')?.value || '';
        const body = document.getElementById('adminPendingApprovalsTableBody');

        if (!body) return;

        try {
            const approvals = await loadApprovals();
            renderApprovals(searchValue, approvals);
        } catch (error) {
            body.innerHTML = '<tr><td colspan="6" class="no-table-data">No pending approvals yet.</td></tr>';
            updatePendingMetric(0);
            console.warn('[admin-pending-approval] load failed:', error);
        }
    }

    async function reviewApproval(action, approvalId) {
        const token = getAdminToken();
        if (!token) {
            return;
        }

        const formData = new FormData();
        formData.append('token', token);
        formData.append('approvalId', String(approvalId));

        const response = await fetch(`${API_BASE}/${action}_pending_approval.php`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error((data && data.error) || 'Unable to update approval');
        }

        await refreshAdminPendingApprovals();
        return data;
    }

    window.refreshAdminPendingApprovals = refreshAdminPendingApprovals;
    window.approvePendingApproval = async function(approvalId) {
        try {
            await reviewApproval('approve', approvalId);
            if (typeof showNotification === 'function') {
                showNotification('Request approved', 'success');
            }
        } catch (error) {
            if (typeof showNotification === 'function') {
                showNotification('Unable to approve request', 'error');
            }
            console.warn('[admin-pending-approval] approve failed:', error);
        }
    };

    window.rejectPendingApproval = async function(approvalId) {
        try {
            await reviewApproval('reject', approvalId);
            if (typeof showNotification === 'function') {
                showNotification('Request rejected', 'info');
            }
        } catch (error) {
            if (typeof showNotification === 'function') {
                showNotification('Unable to reject request', 'error');
            }
            console.warn('[admin-pending-approval] reject failed:', error);
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        const requestForm = document.getElementById('adminPendingRequestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', function(event) {
                submitPendingRequest(event).catch(error => {
                    console.warn('[admin-pending-approval] submit failed:', error);
                    if (typeof showNotification === 'function') {
                        showNotification('Unable to submit request', 'error');
                    }
                });
            });
        }

        const search = document.getElementById('adminPendingSearch');
        if (search) {
            search.addEventListener('input', function() {
                renderApprovals(this.value || '');
            });
        }

        refreshAdminPendingApprovals();
    });
})();
