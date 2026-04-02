(function(){
    const STORAGE_KEY = 'pendingApprovals';

    function ensureDemoItems() {
        let existingRaw = localStorage.getItem(STORAGE_KEY);
        let existing = null;
        try {
            existing = existingRaw ? JSON.parse(existingRaw) : null;
        } catch (e) {
            existing = null;
        }

        // Seed demo items when storage is missing or empty array
        if (!Array.isArray(existing) || existing.length === 0) {
            const demo = [
                { id: 'p1', type: 'Mentor Request', title: 'Mentorship request: John Doe', submittedBy: 'John Doe', studentId: 'STU1001', course: 'BSIT', date: '2026-02-12', status: 'pending' },
                { id: 'p2', type: 'Profile Update', title: 'Profile change: Jane Smith', submittedBy: 'Jane Smith', studentId: 'STU1002', course: 'BSCS', date: '2026-02-14', status: 'pending' },
                { id: 'p3', type: 'Connection Request', title: 'Connect request: Alex Rivera', submittedBy: 'Alex Rivera', studentId: 'STU1003', course: 'BSBA', date: '2026-02-16', status: 'pending' }
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
            return demo;
        }

        return existing;
    }

    function getPendingItems() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function savePendingItems(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function renderPendingList(filter = '') {
        const container = document.getElementById('pendingList');
        if (!container) return;

        // If any static demo cards already exist in the DOM, preserve them and do not overwrite
        const existingStaticCards = container.querySelectorAll('.pending-card');
        if (existingStaticCards && existingStaticCards.length > 0 && (!filter || String(filter).trim() === '')) {
            // Do not overwrite static markup; allow search input to filter (handled separately)
            return;
        }

        const items = getPendingItems().filter(item => item.status === 'pending');
        const term = String(filter || '').trim().toLowerCase();
        const filtered = items.filter(it => !term || (it.title + ' ' + it.submittedBy + ' ' + it.type).toLowerCase().includes(term));

        if (!filtered.length) {
            container.innerHTML = '<p class="no-pending">No pending approvals.</p>';
            return;
        }

        container.innerHTML = filtered.map(item => `
            <div class="pending-card" id="pending-${item.id}">
                <div class="meta">
                    <div>
                        <h4>${item.title}</h4>
                        <p>${item.type} • Submitted by ${item.submittedBy} • ${item.date}</p>
                        <p style="margin-top:6px; font-size:0.9rem; color:#333">Student ID: <strong>${item.studentId}</strong> • Course: <strong>${item.course}</strong></p>
                    </div>
                </div>
                <div class="pending-actions">
                    <button class="btn-approve" onclick="approvePending('${item.id}')">Accept</button>
                    <button class="btn-deny" onclick="denyPending('${item.id}')">Decline</button>
                </div>
            </div>
        `).join('');
    }

    window.approvePending = function(id) {
        const items = getPendingItems();
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return;
        items.splice(idx, 1); // remove from pending for demo
        savePendingItems(items);
        renderPendingList(document.getElementById('pendingSearch')?.value || '');
        if (typeof showNotification === 'function') {
            showNotification('Item approved', 'success');
        }
    };

    window.denyPending = function(id) {
        const items = getPendingItems();
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return;
        items.splice(idx, 1);
        savePendingItems(items);
        renderPendingList(document.getElementById('pendingSearch')?.value || '');
        if (typeof showNotification === 'function') {
            showNotification('Item denied', 'info');
        }
    };

    function initPendingApproval() {
        // Diagnostics: log storage and DOM state
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            console.debug('[pending-approval] storage.raw:', raw);
        } catch (e) {
            console.debug('[pending-approval] storage read error', e);
        }

        // Ensure demo items exist (seeds if missing or empty)
        ensureDemoItems();

        const container = document.getElementById('pendingList');

        renderPendingList();

        // After render, ensure three demo cards are present — inject if missing
        (function ensureThreeDemoCards() {
            try {
                const container = document.getElementById('pendingList');
                if (!container) return;
                const cards = container.querySelectorAll('.pending-card');
                const missing = 3 - cards.length;
                if (missing > 0) {
                    const demoHtml = [`
                        <div class="pending-card" id="pending-p1">
                            <div class="meta">
                                <div>
                                    <h4>Mentorship Request</h4>
                                    <p class="muted">Submitted by: John Doe • 2026-02-12</p>
                                    <p class="muted">Student ID: <strong>STU1001</strong> • Course: <strong>BSIT</strong></p>
                                </div>
                            </div>
                            <div class="pending-actions">
                                <button class="btn-approve">Approve</button>
                                <button class="btn-deny">Decline</button>
                            </div>
                        </div>
                    `, `
                        <div class="pending-card" id="pending-p2">
                            <div class="meta">
                                <div>
                                    <h4>Profile Update Request</h4>
                                    <p class="muted">Submitted by: Jane Smith • 2026-02-14</p>
                                    <p class="muted">Student ID: <strong>STU1002</strong> • Course: <strong>BSCS</strong></p>
                                </div>
                            </div>
                            <div class="pending-actions">
                                <button class="btn-approve">Approve</button>
                                <button class="btn-deny">Decline</button>
                            </div>
                        </div>
                    `, `
                        <div class="pending-card" id="pending-p3">
                            <div class="meta">
                                <div>
                                    <h4>Connection Request</h4>
                                    <p class="muted">Submitted by: Alex Rivera • 2026-02-16</p>
                                    <p class="muted">Student ID: <strong>STU1003</strong> • Course: <strong>BSBA</strong></p>
                                </div>
                            </div>
                            <div class="pending-actions">
                                <button class="btn-approve">Approve</button>
                                <button class="btn-deny">Decline</button>
                            </div>
                        </div>
                    `];

                    // Append only the missing ones
                    for (let i = 0; i < missing; i++) {
                        container.insertAdjacentHTML('beforeend', demoHtml[i]);
                    }
                }

                // Log computed styles for debugging visibility
                const contStyle = getComputedStyle(container);
                console.debug('[pending-approval] container style', { display: contStyle.display, visibility: contStyle.visibility, opacity: contStyle.opacity, zIndex: contStyle.zIndex });
                container.querySelectorAll('.pending-card').forEach((c, idx) => {
                    const s = getComputedStyle(c);
                    console.debug('[pending-approval] card', idx, {display: s.display, opacity: s.opacity, visibility: s.visibility, zIndex: s.zIndex});
                });
            } catch (err) {
                console.warn('ensureThreeDemoCards error', err);
            }
        })();

        const search = document.getElementById('pendingSearch');
        if (search) {
            search.addEventListener('input', function() {
                renderPendingList(this.value || '');
            });
        }

        window.addEventListener('storage', function(e) {
            if (e.key === STORAGE_KEY) {
                renderPendingList(document.getElementById('pendingSearch')?.value || '');
            }
        });
    }

    // Expose a small debug helper to the console
    window.checkPendingDebug = function() {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = (() => { try { return JSON.parse(raw || 'null'); } catch(e){ return raw; } })();
        console.log('[pending-approval] STORAGE:', parsed);
        const container = document.getElementById('pendingList');
        console.log('[pending-approval] container exists:', !!container);
        console.log('[pending-approval] container children:', container ? container.children.length : 0);
        return { storage: parsed, containerExists: !!container };
    };

    document.addEventListener('DOMContentLoaded', initPendingApproval);
})();
