/* ===========================
   STUDENT DASHBOARD - TAB SWITCHING
   =========================== */

function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    if (window.location.hash !== `#${tabName}`) {
        history.replaceState(null, '', `#${tabName}`);
    }
    
    const targetNavLink = document.querySelector(`.nav-link[href="#${tabName}"]`);
    if (targetNavLink) {
        targetNavLink.classList.add('active');
    }
}

function activateTabFromHash() {
    const hashValue = window.location.hash.replace('#', '').toLowerCase();
    const validTabs = ['dashboard', 'events', 'mentors', 'jobs', 'materials', 'messages', 'pending', 'alumni'];

    if (validTabs.includes(hashValue)) {
        switchTab(hashValue);
    } else {
        switchTab('dashboard');
    }
}

// ===========================
// LEARNING MATERIALS (FROM ADMIN)
// ===========================

const MATERIALS_API_BASE = 'server/php';
let studentLearningMaterialsCache = [];
let studentLearningMaterialsLoaded = false;

function getStudentLearningMaterials() {
    return studentLearningMaterialsCache.slice();
}

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

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeStudentLearningMaterial(material = {}) {
    return {
        id: String(material.id || ''),
        title: String(material.title || ''),
        category: String(material.category || ''),
        targetProgram: normalizeProgram(material.targetProgram || material.target_program || material.program || 'all'),
        description: String(material.description || ''),
        link: String(material.link || ''),
        createdAt: material.createdAt || material.created_at || new Date().toISOString(),
        updatedAt: material.updatedAt || material.updated_at || null
    };
}

async function loadStudentLearningMaterials() {
    const materialsContainer = document.getElementById('studentMaterialsList');

    if (materialsContainer && !studentLearningMaterialsLoaded) {
        materialsContainer.innerHTML = '<p class="no-materials">Loading learning materials...</p>';
    }

    try {
        const response = await fetch(`${MATERIALS_API_BASE}/list_learning_materials.php`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }

        studentLearningMaterialsCache = Array.isArray(data.materials)
            ? data.materials.map(normalizeStudentLearningMaterial)
            : [];
        studentLearningMaterialsLoaded = true;
        renderStudentMaterials(document.getElementById('materialsSearch')?.value || '');
    } catch (error) {
        studentLearningMaterialsLoaded = true;
        studentLearningMaterialsCache = [];
        if (materialsContainer) {
            materialsContainer.innerHTML = '<p class="no-materials">No materials published yet. Please check back later.</p>';
        }
        console.warn('Failed to load learning materials:', error);
    }
}

function getCurrentStudentProgram() {
    const currentProfile = getCachedDashboardStudentProfile();
    const program = currentProfile.program || currentProfile.degree || currentProfile.major || '';
    const normalizedProgramValue = normalizeProgram(program);
    if (normalizedProgramValue && normalizedProgramValue !== 'all') {
        return normalizedProgramValue;
    }

    return '';
}

function renderStudentMaterials(filterText = '') {
    const materialsContainer = document.getElementById('studentMaterialsList');
    if (!materialsContainer) {
        return;
    }

    if (!studentLearningMaterialsLoaded && studentLearningMaterialsCache.length === 0) {
        materialsContainer.innerHTML = '<p class="no-materials">Loading learning materials...</p>';
        return;
    }

    const term = filterText.trim().toLowerCase();
    const studentProgram = getCurrentStudentProgram();
    const materials = getStudentLearningMaterials()
        .filter(material => {
            const targetProgram = normalizeProgram(material.targetProgram || material.program || 'all');
            const programMatches = targetProgram === 'all' || (studentProgram && targetProgram === studentProgram);

            if (!programMatches) {
                return false;
            }

            if (!term) {
                return true;
            }

            return (
                material.title.toLowerCase().includes(term) ||
                material.category.toLowerCase().includes(term) ||
                material.description.toLowerCase().includes(term)
            );
        })
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

    if (materials.length === 0) {
        const emptyMessage = studentProgram
            ? `No matching materials found for ${formatProgramLabel(studentProgram)}.`
            : 'No matching materials found.';
        materialsContainer.innerHTML = `<p class="no-materials">${emptyMessage}</p>`;
        return;
    }

    materialsContainer.innerHTML = materials.map(material => `
        <article class="material-card">
            <div class="material-top">
                <h3>${escapeHtml(material.title)}</h3>
                <div class="material-chip-group">
                    <span class="material-chip">${escapeHtml(material.category)}</span>
                    <span class="material-chip">${escapeHtml(formatProgramLabel(material.targetProgram || material.program || 'all'))}</span>
                </div>
            </div>
            <p class="material-description">${escapeHtml(material.description)}</p>
            <div class="material-meta">Published: ${new Date(material.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div class="material-actions">
                ${material.link ? `<a class="btn-info" href="${escapeHtml(material.link)}" target="_blank" rel="noopener noreferrer">🔗 Open Resource</a>` : '<span class="material-no-link">No external link provided</span>'}
            </div>
        </article>
    `).join('');
}

function initStudentMaterials() {
    const materialsSearch = document.getElementById('materialsSearch');
    if (materialsSearch) {
        materialsSearch.addEventListener('input', function(e) {
            renderStudentMaterials(e.target.value || '');
        });
    }

    loadStudentLearningMaterials();
}

function goToDashboard(event) {
    const currentPath = window.location.pathname.toLowerCase();
    const isDashboard = currentPath.endsWith('/studentdashboard.html') || currentPath.endsWith('studentdashboard.html');

    if (isDashboard) {
        event.preventDefault();
        window.location.reload();
    }
}

const STUDENT_MESSENGER_API_BASE = 'server/php';
const STUDENT_INTERACTIONS_API_BASE = 'server/php';

const DEFAULT_STUDENT_MESSENGER_STATE = {
    activeConversationId: '',
    conversations: [],
    messages: {}
};

let studentMessengerStateCache = cloneStudentMessengerState(DEFAULT_STUDENT_MESSENGER_STATE);
let studentInteractionStateLoaded = false;
let studentMentorRequestIds = new Set();
let studentAppliedJobIds = new Set();
let studentSavedJobIds = new Set();

let studentQuickActiveConversationId = '';
let studentQuickCloseSuppressUntil = 0;
let studentMessengerFilter = 'all';

function getStudentMessengerToken() {
    return sessionStorage.getItem('studentToken') || '';
}

function getStudentMessengerEmail() {
    return (sessionStorage.getItem('studentEmail') || '').trim().toLowerCase();
}

function getStudentConversationId(email = '', role = 'admin') {
    return `${String(role || 'admin').toLowerCase()}::${String(email || '').trim().toLowerCase()}`;
}

function formatStudentMessengerTime(value) {
    const date = new Date(value || '');
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function cloneStudentMessengerState(state = {}) {
    return {
        activeConversationId: String(state.activeConversationId || ''),
        conversations: Array.isArray(state.conversations) ? state.conversations.map(item => ({ ...item })) : [],
        messages: state.messages && typeof state.messages === 'object' ? JSON.parse(JSON.stringify(state.messages)) : {}
    };
}

async function syncStudentMessengerFromServer() {
    const token = getStudentMessengerToken();
    if (!token) {
        return false;
    }

    const response = await fetch(`${STUDENT_MESSENGER_API_BASE}/list_conversations.php?token=${encodeURIComponent(token)}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
        return false;
    }

    const state = getStudentMessengerState();
    const conversations = (data.conversations || []).map(item => ({
        id: getStudentConversationId(item.conversationEmail, item.conversationRole),
        name: item.displayName || item.conversationEmail,
        subtitle: item.lastMessage || '',
        unread: Number(item.unreadCount) || 0,
        online: false,
        lastTime: formatStudentMessengerTime(item.lastMessageAt),
        conversationEmail: item.conversationEmail,
        conversationRole: item.conversationRole
    }));

    const activeConversationId = conversations.find(item => item.id === state.activeConversationId)?.id || conversations[0]?.id || '';
    saveStudentMessengerState({
        ...state,
        activeConversationId,
        conversations,
        messages: state.messages && typeof state.messages === 'object' ? state.messages : {},
        apiMode: true,
        apiEmail: getStudentMessengerEmail(),
        apiRole: 'student'
    });

    return true;
}

async function loadStudentConversationMessages(conversation) {
    const token = getStudentMessengerToken();
    if (!token || !conversation) {
        return false;
    }

    const loadForm = new FormData();
    loadForm.append('token', token);
    loadForm.append('conversationEmail', conversation.conversationEmail || '');
    const response = await fetch(`${STUDENT_MESSENGER_API_BASE}/get_thread.php`, {
        method: 'POST',
        body: loadForm
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
        return false;
    }

    const currentEmail = getStudentMessengerEmail();
    const currentRole = 'student';
    const messages = (data.messages || []).map(item => ({
        id: item.id,
        sender: String(item.sender_email || '').trim().toLowerCase() === currentEmail && String(item.sender_role || '').toLowerCase() === currentRole ? 'me' : 'them',
        text: item.message_text || '',
        createdAt: item.created_at || '',
        isRead: Number(item.is_read) === 1,
        senderEmail: item.sender_email || '',
        senderRole: item.sender_role || '',
        receiverEmail: item.receiver_email || '',
        receiverRole: item.receiver_role || ''
    }));

    const unreadMessages = messages.filter(item => item.sender === 'them' && !item.isRead && item.id);
    if (unreadMessages.length) {
        await Promise.all(unreadMessages.map(message => {
            const formData = new FormData();
            formData.append('token', token);
            formData.append('messageId', String(message.id));

            return fetch(`${STUDENT_MESSENGER_API_BASE}/mark_message_read.php`, {
                method: 'POST',
                body: formData
            }).catch(() => null);
        }));
    }

    const state = getStudentMessengerState();
    state.messages = state.messages && typeof state.messages === 'object' ? state.messages : {};
    state.messages[conversation.id] = messages;
    state.conversations = Array.isArray(state.conversations) ? state.conversations : [];
    const selectedConversation = state.conversations.find(item => item.id === conversation.id);
    if (selectedConversation) {
        selectedConversation.unread = 0;
        selectedConversation.lastTime = formatStudentMessengerTime(data.messages?.[data.messages.length - 1]?.created_at || '') || selectedConversation.lastTime;
        selectedConversation.subtitle = data.messages?.length ? (data.messages[data.messages.length - 1].message_text || selectedConversation.subtitle) : selectedConversation.subtitle;
    }

    saveStudentMessengerState(state);
    initUnreadBadge();
    return true;
}

async function sendStudentMessageToServer(conversation, messageText) {
    const token = getStudentMessengerToken();
    if (!token || !conversation || !messageText) {
        return false;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('receiverEmail', conversation.conversationEmail || '');
    formData.append('messageText', messageText);

    const response = await fetch(`${STUDENT_MESSENGER_API_BASE}/send_message.php`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    return Boolean(response.ok && data.success);
}

function ensureStudentMessengerState() {
    if (!studentMessengerStateCache) {
        studentMessengerStateCache = cloneStudentMessengerState(DEFAULT_STUDENT_MESSENGER_STATE);
    }
}

function getStudentMessengerState() {
    ensureStudentMessengerState();
    return cloneStudentMessengerState(studentMessengerStateCache);
}

function saveStudentMessengerState(state) {
    studentMessengerStateCache = cloneStudentMessengerState(state);
}

function getStudentConversationInitials(name = '') {
    return String(name)
        .split(' ')
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function renderStudentConversationList() {
    const state = getStudentMessengerState();
    const list = document.getElementById('studentConversationList');
    const searchInput = document.getElementById('studentMessageSearch');
    const countEl = document.getElementById('studentMessagesCount');

    if (!list) {
        return;
    }

    const searchTerm = (searchInput?.value || '').trim().toLowerCase();
    let filtered = [...state.conversations];

    if (studentMessengerFilter === 'unread') {
        filtered = filtered.filter(item => item.unread > 0);
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
        list.innerHTML = '<p class="student-chat-empty">No conversations found.</p>';
        return;
    }

    list.innerHTML = filtered.map(item => `
        <button class="student-conversation-item ${state.activeConversationId === item.id ? 'active' : ''}" data-conversation-id="${escapeHtml(item.id)}">
            <div class="student-conversation-avatar-wrap">
                <div class="student-conversation-avatar">${getStudentConversationInitials(item.name)}</div>
                ${item.online ? '<span class="student-conversation-online"></span>' : ''}
            </div>
            <div class="student-conversation-meta">
                <div class="student-conversation-top">
                    <strong>${escapeHtml(item.name)}</strong>
                    <span>${item.lastTime || ''}</span>
                </div>
                <div class="student-conversation-subline">
                    <span>${escapeHtml(item.subtitle)}</span>
                    ${item.unread > 0 ? `<span class="student-conversation-unread">${item.unread}</span>` : ''}
                </div>
            </div>
        </button>
    `).join('');

    list.querySelectorAll('.student-conversation-item').forEach(button => {
        button.addEventListener('click', function() {
            selectStudentConversation(this.dataset.conversationId);
        });
    });
}

function renderStudentChatPanel() {
    const state = getStudentMessengerState();
    const headerName = document.getElementById('studentChatHeaderName');
    const headerStatus = document.getElementById('studentChatHeaderStatus');
    const messagesEl = document.getElementById('studentChatMessages');

    if (!messagesEl) {
        return;
    }

    const conversation = state.conversations.find(item => item.id === state.activeConversationId);

    if (!conversation) {
        messagesEl.innerHTML = '<p class="student-chat-empty">Choose a conversation to start messaging.</p>';
        if (headerName) headerName.textContent = 'Select a conversation';
        if (headerStatus) headerStatus.textContent = 'No chat selected';
        return;
    }

    if (headerName) headerName.textContent = conversation.name;
    if (headerStatus) headerStatus.textContent = conversation.online ? 'Active now' : 'Offline';

    const messages = state.messages[conversation.id] || [];

    if (!messages.length) {
        messagesEl.innerHTML = '<p class="student-chat-empty">No messages yet in this conversation.</p>';
        return;
    }

    messagesEl.innerHTML = messages.map(message => `
        <div class="student-chat-bubble ${message.sender === 'me' ? 'mine' : 'theirs'}">${escapeHtml(message.text)}</div>
    `).join('');

    messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function selectStudentConversation(conversationId) {
    const state = getStudentMessengerState();
    const conversation = state.conversations.find(item => item.id === conversationId);

    if (!conversation) {
        return;
    }

    state.activeConversationId = conversationId;
    conversation.unread = 0;
    studentQuickActiveConversationId = conversationId;
    saveStudentMessengerState(state);

    if (getStudentMessengerToken() && conversation.conversationEmail) {
        await loadStudentConversationMessages(conversation);
    }

    initUnreadBadge();
    renderStudentConversationList();
    renderStudentChatPanel();

    const quickSearch = document.getElementById('quickMessageSearch')?.value || '';
    renderQuickMessagesPreview(quickSearch);
    renderQuickThreadPreview(conversationId);
}

async function sendStudentMessage(event) {
    event.preventDefault();

    const input = document.getElementById('studentChatInput');
    const text = input?.value.trim();

    if (!text) {
        return;
    }

    const state = getStudentMessengerState();
    const conversation = state.conversations.find(item => item.id === state.activeConversationId);

    if (!conversation) {
        showNotification('Please select a conversation first.', 'error');
        return;
    }

    const token = getStudentMessengerToken();
    if (token && conversation.conversationEmail) {
        const sent = await sendStudentMessageToServer(conversation, text);
        if (sent) {
            const refreshed = await syncStudentMessengerFromServer();
            if (refreshed) {
                const refreshedState = getStudentMessengerState();
                const refreshedConversation = refreshedState.conversations.find(item => item.id === conversation.id) || conversation;
                await loadStudentConversationMessages(refreshedConversation);
            }

            renderStudentConversationList();
            renderStudentChatPanel();
            renderQuickMessagesPreview(document.getElementById('quickMessageSearch')?.value || '');
            renderQuickThreadPreview(conversation.id);
            if (input) input.value = '';
            return;
        }
    }

    if (!Array.isArray(state.messages[conversation.id])) {
        state.messages[conversation.id] = [];
    }

    state.messages[conversation.id].push({ sender: 'me', text });
    conversation.subtitle = text.length > 36 ? `${text.slice(0, 36)}...` : text;
    conversation.lastTime = 'now';

    saveStudentMessengerState(state);
    renderStudentConversationList();
    renderStudentChatPanel();
    renderQuickMessagesPreview(document.getElementById('quickMessageSearch')?.value || '');
    renderQuickThreadPreview(conversation.id);
    if (input) input.value = '';
}

function initializeStudentMessenger() {
    const messagesSection = document.getElementById('messages-tab');
    if (!messagesSection) {
        return;
    }

    ensureStudentMessengerState();

    const tabsContainer = messagesSection.querySelector('.student-messenger-toolbar');
    const searchInput = document.getElementById('studentMessageSearch');
    const form = document.getElementById('studentChatForm');

    if (tabsContainer) {
        tabsContainer.querySelectorAll('.student-msg-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                tabsContainer.querySelectorAll('.student-msg-tab').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                studentMessengerFilter = this.dataset.filter || 'all';
                renderStudentConversationList();
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderStudentConversationList();
        });
    }

    if (form) {
        form.addEventListener('submit', sendStudentMessage);
    }

    const chatInput = document.getElementById('studentChatInput');
    if (chatInput) {
        chatInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                form?.requestSubmit();
            }
        });
    }

    const token = getStudentMessengerToken();
    if (token) {
        syncStudentMessengerFromServer()
            .catch(() => false)
            .finally(() => {
                const state = getStudentMessengerState();
                if (state.activeConversationId && state.conversations.some(item => item.id === state.activeConversationId)) {
                    const conversation = state.conversations.find(item => item.id === state.activeConversationId);
                    if (conversation) {
                        loadStudentConversationMessages(conversation).finally(() => {
                            renderStudentConversationList();
                            renderStudentChatPanel();
                            initUnreadBadge();
                        });
                        return;
                    }
                }

                renderStudentConversationList();
                renderStudentChatPanel();
                initUnreadBadge();
            });
        return;
    }

    renderStudentConversationList();
    renderStudentChatPanel();
}

function openMessagesQuick(event) {
    if (event) {
        event.stopPropagation();
    }

    closeAiQuick();
    closeAiRecommender();

    const popup = document.getElementById('quickMessagePopup');
    if (!popup) {
        return;
    }

    const willOpen = !popup.classList.contains('active');
    popup.classList.toggle('active', willOpen);
    popup.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

    if (willOpen) {
        const state = getStudentMessengerState();
        studentQuickActiveConversationId = state.activeConversationId || state.conversations[0]?.id || '';
        const searchInput = document.getElementById('quickMessageSearch');
        if (searchInput) {
            searchInput.value = '';
        }

        renderQuickMessagesPreview('');
        renderQuickThreadPreview(studentQuickActiveConversationId);
        setUnreadBadgeCount(0);
    }
}

function closeQuickMessages() {
    const popup = document.getElementById('quickMessagePopup');
    if (!popup) {
        return;
    }

    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
}

function openMessagesTabFromPopup() {
    closeQuickMessages();

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));

    const messagesTab = document.getElementById('messages-tab');
    if (messagesTab) {
        messagesTab.classList.add('active');
    }

    const messagesNavLink = document.querySelector('.nav-link[href="#messages"]');
    if (messagesNavLink) {
        messagesNavLink.classList.add('active');
    }

    if (studentQuickActiveConversationId) {
        selectStudentConversation(studentQuickActiveConversationId);
    } else {
        renderStudentConversationList();
        renderStudentChatPanel();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openAiQuick() {
    closeQuickMessages();
    const popup = document.getElementById('quickAiPopup');
    if (!popup) {
        return;
    }

    const willOpen = !popup.classList.contains('active');
    popup.classList.toggle('active', willOpen);
    popup.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
}

function closeAiQuick() {
    const popup = document.getElementById('quickAiPopup');
    if (!popup) {
        return;
    }

    popup.classList.remove('active');
    popup.setAttribute('aria-hidden', 'true');
}

function closeAiRecommender() {
    const modal = document.getElementById('ai-recommender-modal');
    if (!modal) {
        return;
    }

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
}

function setUnreadBadgeCount(count) {
    const safeCount = Math.max(0, Number(count) || 0);
    const floatingBadge = document.getElementById('floatingUnreadBadge');
    const navBadge = document.getElementById('studentNavUnreadBadge');
    const badgeText = safeCount > 99 ? '99+' : String(safeCount);

    [floatingBadge, navBadge].forEach(badge => {
        if (!badge) {
            return;
        }

        badge.textContent = badgeText;
        badge.style.display = safeCount > 0 ? 'inline-flex' : 'none';
    });
}

function initUnreadBadge() {
    const state = getStudentMessengerState();
    const unreadCount = state.conversations.reduce((total, item) => total + (Number(item.unread) || 0), 0);
    setUnreadBadgeCount(unreadCount);
}

function initQuickMessagesPopup() {
    const quickMessageList = document.getElementById('quickMessageList');
    if (!quickMessageList) {
        return;
    }

    const popup = document.getElementById('quickMessagePopup');
    if (popup) {
        popup.addEventListener('click', event => event.stopPropagation());
    }

    const searchInput = document.getElementById('quickMessageSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderQuickMessagesPreview(this.value || '');
        });
    }

    const state = getStudentMessengerState();
    studentQuickActiveConversationId = state.activeConversationId || state.conversations[0]?.id || '';
    renderQuickMessagesPreview('');
    renderQuickThreadPreview(studentQuickActiveConversationId);
}

function renderQuickMessagesPreview(searchTerm = '') {
    const quickMessageList = document.getElementById('quickMessageList');
    if (!quickMessageList) {
        return;
    }

    const state = getStudentMessengerState();
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
        quickMessageList.innerHTML = '<p class="quick-thread-empty">No matching chats.</p>';
        renderQuickThreadPreview('');
        return;
    }

    const hasSelectedConversation = conversations.some(item => item.id === studentQuickActiveConversationId);
    if (!hasSelectedConversation) {
        studentQuickActiveConversationId = conversations[0].id;
    }

    quickMessageList.innerHTML = conversations.map(item => {
        const messages = state.messages[item.id] || [];
        const lastMessage = messages.length ? messages[messages.length - 1].text : item.subtitle;
        const preview = lastMessage.length > 44 ? `${lastMessage.slice(0, 44)}...` : lastMessage;

        return `
            <button class="quick-message-item ${studentQuickActiveConversationId === item.id ? 'active' : ''}" onclick="selectStudentQuickConversation(event, '${escapeHtml(item.id)}')">
                <div class="quick-message-avatar-wrap">
                    <div class="quick-message-avatar">${getStudentConversationInitials(item.name)}</div>
                    ${item.online ? '<span class="quick-message-online-dot"></span>' : ''}
                </div>
                <div class="quick-message-body">
                    <div class="quick-message-row">
                        <div class="quick-message-name">${escapeHtml(item.name)}</div>
                        <div class="quick-message-time">${item.lastTime || ''}</div>
                    </div>
                    <div class="quick-message-row">
                        <div class="quick-message-text">${escapeHtml(preview)}</div>
                        ${item.unread > 0 ? '<span class="quick-message-unread-dot"></span>' : ''}
                    </div>
                </div>
            </button>
        `;
    }).join('');

    renderQuickThreadPreview(studentQuickActiveConversationId);
}

function renderQuickThreadPreview(conversationId = '') {
    const container = document.getElementById('quickThreadContainer');
    if (!container) {
        return;
    }

    const state = getStudentMessengerState();
    const conversation = state.conversations.find(item => item.id === conversationId);

    if (!conversation) {
        container.innerHTML = '<p class="quick-thread-empty">Select a chat to preview messages.</p>';
        return;
    }

    const messages = state.messages[conversation.id] || [];
    const recentMessages = messages.slice(-3);

    container.innerHTML = `
        <div class="quick-thread-head">
            <strong>${escapeHtml(conversation.name)}</strong>
            <span>${conversation.online ? 'Active now' : 'Offline'}</span>
        </div>
        <div class="quick-thread-body">
            ${recentMessages.length ? recentMessages.map(message => `
                <div class="quick-thread-bubble ${message.sender === 'me' ? 'mine' : 'theirs'}">${escapeHtml(message.text)}</div>
            `).join('') : '<p class="quick-thread-empty">No messages yet.</p>'}
        </div>
    `;
}

function selectStudentQuickConversation(event, conversationId) {
    if (event) {
        event.stopPropagation();
    }

    studentQuickCloseSuppressUntil = Date.now() + 250;

    const state = getStudentMessengerState();
    const conversation = state.conversations.find(item => item.id === conversationId);

    if (!conversation) {
        return;
    }

    studentQuickActiveConversationId = conversationId;
    state.activeConversationId = conversationId;

    if (conversation.unread > 0) {
        conversation.unread = 0;
    }

    saveStudentMessengerState(state);
    initUnreadBadge();

    const searchValue = document.getElementById('quickMessageSearch')?.value || '';
    requestAnimationFrame(() => {
        renderQuickMessagesPreview(searchValue);
    });
}

function runAiRecommendation() {
    const program = document.getElementById('aiProgram')?.value || '';
    const goal = document.getElementById('aiGoal')?.value || '';
    const selectedSkills = Array.from(document.querySelectorAll('.quick-ai-skills input[type="checkbox"]:checked'))
        .map(input => input.value);
    const resultBox = document.getElementById('aiRecommendationResult');

    if (!resultBox) {
        return;
    }

    if (!program || !goal) {
        resultBox.innerHTML = 'Please select both Program and Goal first.';
        return;
    }

    const jobs = [];
    const lessons = [];

    if (program === 'bsit' || program === 'bscs') {
        if (selectedSkills.includes('web')) {
            jobs.push('Frontend Developer', 'Web Support Analyst');
            lessons.push('React Basics', 'Responsive UI Fundamentals');
        }
        if (selectedSkills.includes('python') || selectedSkills.includes('data')) {
            jobs.push('Junior Data Analyst', 'Automation Intern');
            lessons.push('Python for Data Tasks', 'SQL Essentials');
        }
        if (selectedSkills.includes('network') || selectedSkills.includes('cloud')) {
            jobs.push('IT Support Associate', 'Cloud Operations Intern');
            lessons.push('Network Fundamentals', 'Cloud Practitioner Basics');
        }
        if (jobs.length === 0) {
            jobs.push('IT Support Trainee');
            lessons.push('Programming Foundations', 'Version Control (Git)');
        }
    } else if (program === 'bsce') {
        if (selectedSkills.includes('uiux') || selectedSkills.includes('web')) {
            jobs.push('UI/UX Designer Intern', 'Junior Multimedia Designer');
            lessons.push('Figma Workflow', 'Design Systems Basics');
        }
        if (selectedSkills.includes('python') || selectedSkills.includes('data')) {
            jobs.push('Game Analytics Assistant');
            lessons.push('Game Metrics Basics', 'Intro to Data Visualization');
        }
        if (jobs.length === 0) {
            jobs.push('Creative Tech Assistant');
            lessons.push('UI Principles', 'Portfolio Building 101');
        }
    } else if (program === 'bsba') {
        if (selectedSkills.includes('data')) {
            jobs.push('Business Analyst Intern', 'Operations Analyst Intern');
            lessons.push('Excel + Dashboarding', 'Business Data Storytelling');
        }
        if (selectedSkills.includes('uiux')) {
            jobs.push('Marketing Content Coordinator');
            lessons.push('Digital Branding Basics', 'Customer Journey Mapping');
        }
        if (jobs.length === 0) {
            jobs.push('Management Trainee Intern');
            lessons.push('Project Management Basics', 'Business Communication');
        }
    } else {
        jobs.push('General Operations Intern', 'Community Support Assistant');
        lessons.push('Professional Communication', 'Career Readiness Basics');
    }

    if (goal === 'internship') {
        lessons.unshift('Resume + Portfolio Prep', 'Internship Interview Practice');
    } else if (goal === 'upskill') {
        lessons.unshift('Learning Plan: 30 Days', 'Skill Gap Assessment');
    }

    const uniqueJobs = [...new Set(jobs)].slice(0, 4);
    const uniqueLessons = [...new Set(lessons)].slice(0, 5);

    resultBox.innerHTML = `
        <strong>Recommended Jobs</strong>
        <ul>${uniqueJobs.map(job => `<li>${job}</li>`).join('')}</ul>
        <strong>Recommended Lessons</strong>
        <ul>${uniqueLessons.map(lesson => `<li>${lesson}</li>`).join('')}</ul>
    `;
}

/* Chat UI for Quick AI popup */
function sendAiMessage() {
    const input = document.getElementById('quickAiInput');
    const body = document.getElementById('quickAiChatBody');
    if (!input || !body) return;

    const text = String(input.value || '').trim();
    if (!text) return;

    // append user bubble
    appendAiBubble(text, 'user');
    input.value = '';
    body.querySelector('.chat-empty')?.remove();
    body.scrollTop = body.scrollHeight;

    // simulate AI reply (placeholder logic)
    setTimeout(() => {
        const reply = generateAiReply(text);
        appendAiBubble(reply, 'bot');
        body.scrollTop = body.scrollHeight;
    }, 600 + Math.random() * 800);
}

function appendAiBubble(text, who = 'bot') {
    const body = document.getElementById('quickAiChatBody');
    if (!body) return;

    const el = document.createElement('div');
    el.className = 'message-bubble ' + (who === 'user' ? 'user' : 'bot');
    el.textContent = text;
    body.appendChild(el);
}

function generateAiReply(userText) {
    // Simple rule-based placeholder: echo intent with recommendation
    const t = userText.toLowerCase();
    if (t.includes('python')) {
        return 'Great — to learn Python start with: 1) Python basics (variables, loops). 2) Small projects. 3) Data tasks with pandas. I recommend the course: "Python for Beginners".';
    }
    if (t.includes('web') || t.includes('frontend') || t.includes('react')) {
        return 'For web development, focus on HTML/CSS, JavaScript fundamentals, then a framework like React. Build a portfolio site to show skills.';
    }
    if (t.includes('job') || t.includes('intern') || t.includes('role')) {
        return 'To prepare for job applications: polish your resume, practice coding challenges, and build 2-3 projects relevant to the role.';
    }
    // default
    return 'Thanks — I suggest starting with a clear goal. Try: "I want to learn Python for data analysis" and I will suggest first steps.';
}

// Focus input when AI popup opens
const origOpenAiQuick = openAiQuick;
function openAiQuick() {
    closeQuickMessages();
    origOpenAiQuick();
    const input = document.getElementById('quickAiInput');
    setTimeout(() => input?.focus(), 200);
}

/* Defensive binding: ensure floating AI buttons call openAiQuick even if inline handler fails */
document.addEventListener('DOMContentLoaded', () => {
    try {
        const aiButtons = document.querySelectorAll('.floating-ai-btn, .floating-ai-button');
        aiButtons.forEach(btn => {
            // guard: remove any duplicate handlers to avoid double-calls
            btn.removeEventListener('click', openAiQuick);
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                openAiQuick();
            });
        });
    } catch (e) {
        console.warn('AI quick button binding failed', e);
    }
});

// New explicit bindings for ai-bot-trigger -> ai-recommender-modal
document.addEventListener('DOMContentLoaded', () => {
    try {
        const trigger = document.getElementById('ai-bot-trigger');
        const modal = document.getElementById('ai-recommender-modal');
        const closeBtn = document.getElementById('ai-recommender-close');

        if (!trigger || !modal) return;

        // ensure we don't attach duplicates
        trigger.removeEventListener('click', trigger._aiHandler);
        trigger._aiHandler = function(e) {
            e.stopPropagation();
            closeQuickMessages();
            closeAiQuick();
            const open = !modal.classList.contains('active');
            modal.classList.toggle('active', open);
            modal.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (open) setTimeout(() => modal.querySelector('#quickAiInput')?.focus(), 150);
        };
        trigger.addEventListener('click', trigger._aiHandler);

        // ensure greeting bubble on first open
        const ensureAiGreeting = () => {
            const chatBody = modal.querySelector('#quickAiChatBody');
            if (!chatBody) return;
            // if no message bubbles exist, add greeting
            if (!chatBody.querySelector('.message-bubble')) {
                const greeting = 'Hello! I am your AI assistant. How can I help you today?';
                // append as bot bubble
                const el = document.createElement('div');
                el.className = 'message-bubble bot';
                el.textContent = greeting;
                chatBody.appendChild(el);
            }
        };

        // wrap original handler to call greeting when opened
        const origHandler = trigger._aiHandler;
        trigger._aiHandler = function(e) {
            origHandler.call(this, e);
            const modalEl = document.getElementById('ai-recommender-modal');
            if (modalEl && modalEl.classList.contains('active')) {
                setTimeout(() => ensureAiGreeting(), 120);
            }
        };
        // rebind to use wrapped handler
        trigger.removeEventListener('click', origHandler);
        trigger.addEventListener('click', trigger._aiHandler);

        if (closeBtn) {
            closeBtn.removeEventListener('click', closeBtn._aiCloseHandler);
            closeBtn._aiCloseHandler = function(e) {
                e.stopPropagation();
                closeAiRecommender();
            };
            closeBtn.addEventListener('click', closeBtn._aiCloseHandler);
        }
    } catch (err) {
        console.warn('ai-recommender binding failed', err);
    }
});

/* ===========================
   EVENTS DATABASE
   =========================== */

const STUDENT_EVENTS_API_BASE = 'server/php';

let eventsDatabase = {};

let studentEventsCache = [];
let studentRegisteredEventsCache = [];
let studentEventsLoaded = false;

function getStudentEventsToken() {
    return sessionStorage.getItem('studentToken') || '';
}

function normalizeStudentEvent(event = {}) {
    return {
        id: String(event.id || ''),
        title: String(event.title || ''),
        eventDate: String(event.eventDate || event.event_date || ''),
        startTime: String(event.startTime || event.start_time || '').slice(0, 5),
        location: String(event.location || ''),
        eventType: String(event.eventType || event.event_type || 'General'),
        description: String(event.description || ''),
        capacity: event.capacity === null || event.capacity === undefined || event.capacity === '' ? null : Number(event.capacity),
        createdByEmail: String(event.createdByEmail || event.created_by_email || ''),
        createdAt: event.createdAt || event.created_at || new Date().toISOString(),
        updatedAt: event.updatedAt || event.updated_at || null
    };
}

function normalizeRegisteredEvent(event = {}) {
    return {
        registrationId: String(event.registrationId || event.registration_id || ''),
        eventId: String(event.eventId || event.event_id || ''),
        studentEmail: String(event.studentEmail || event.student_email || ''),
        status: String(event.status || 'registered'),
        registeredAt: event.registeredAt || event.registered_at || null,
        unregisteredAt: event.unregisteredAt || event.unregistered_at || null,
        title: String(event.title || ''),
        eventDate: String(event.eventDate || event.event_date || ''),
        startTime: String(event.startTime || event.start_time || '').slice(0, 5),
        location: String(event.location || ''),
        eventType: String(event.eventType || event.event_type || 'General'),
        description: String(event.description || ''),
        capacity: event.capacity === null || event.capacity === undefined || event.capacity === '' ? null : Number(event.capacity)
    };
}

function formatStudentEventTime(startTime = '') {
    const value = String(startTime || '').trim();
    if (!value) {
        return 'TBA';
    }

    const [hoursPart, minutesPart] = value.split(':');
    const hours = Number(hoursPart);
    const minutes = Number(minutesPart);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return value;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadStudentEventsData() {
    const eventsGrid = document.querySelector('#events-tab .events-grid');
    const registeredList = document.querySelector('#events-tab .registered-list');
    const token = getStudentEventsToken();

    if (eventsGrid && !studentEventsLoaded) {
        eventsGrid.innerHTML = '<div class="events-empty-state"><p>Loading events...</p></div>';
    }

    if (registeredList && !studentEventsLoaded) {
        registeredList.innerHTML = '<p class="no-events">Loading registered events...</p>';
    }

    try {
        const eventsRequest = fetch(`${STUDENT_EVENTS_API_BASE}/list_events.php`);
        const registrationsRequest = token
            ? fetch(`${STUDENT_EVENTS_API_BASE}/list_registered_events.php?token=${encodeURIComponent(token)}`)
            : Promise.resolve({ ok: true, json: async () => ({ success: true, registeredEvents: [] }) });

        const [eventsResponse, registrationsResponse] = await Promise.all([eventsRequest, registrationsRequest]);

        const eventsData = await eventsResponse.json();
        const registrationsData = await registrationsResponse.json();

        if (!eventsResponse.ok || !eventsData.success) {
            throw new Error(eventsData.error || `Request failed (${eventsResponse.status})`);
        }

        if (!registrationsResponse.ok || !registrationsData.success) {
            throw new Error(registrationsData.error || `Request failed (${registrationsResponse.status})`);
        }

        studentEventsCache = Array.isArray(eventsData.events) ? eventsData.events.map(normalizeStudentEvent) : [];
        studentRegisteredEventsCache = Array.isArray(registrationsData.registeredEvents)
            ? registrationsData.registeredEvents.map(normalizeRegisteredEvent)
            : [];

        eventsDatabase = studentEventsCache.reduce((accumulator, event) => {
            accumulator[event.id] = {
                id: event.id,
                title: event.title,
                date: event.eventDate,
                time: formatStudentEventTime(event.startTime),
                location: event.location,
                type: event.eventType,
                description: event.description,
                details: event.description,
                image: '📅'
            };
            return accumulator;
        }, {});

        syncCalendarEventsFromDatabase();
        studentEventsLoaded = true;
        renderStudentEventsTab();
        renderSidebarStats();
        initUnreadBadge();
    } catch (error) {
        studentEventsLoaded = true;
        studentEventsCache = [];
        studentRegisteredEventsCache = [];
        eventsDatabase = {};
        syncCalendarEventsFromDatabase();
        if (eventsGrid) {
            eventsGrid.innerHTML = '<div class="events-empty-state"><p>No events available yet.</p></div>';
        }
        if (registeredList) {
            registeredList.innerHTML = '<p class="no-events">No registered events yet.</p>';
        }
        console.warn('Failed to load student events:', error);
    }
}

function getStudentRegisteredEventIds() {
    return new Set(studentRegisteredEventsCache.map(event => String(event.eventId)));
}

function normalizeEventTypeForFilter(type = '') {
    const value = String(type || '').toLowerCase();
    if (value.includes('workshop')) return 'Workshops';
    if (value.includes('network')) return 'Networking';
    if (value.includes('career')) return 'Career Talk';
    if (value.includes('webinar')) return 'Webinars';
    return type || 'General';
}

function formatEventDateLabel(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
        return dateStr;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderStudentEventsTab() {
    const eventsGrid = document.querySelector('#events-tab .events-grid');
    const registeredList = document.querySelector('#events-tab .registered-list');
    const searchValue = (document.getElementById('eventSearch')?.value || '').trim().toLowerCase();
    const filterValue = document.getElementById('eventFilter')?.value || 'All Events';

    if (!eventsGrid) {
        return;
    }

    if (!studentEventsLoaded && studentEventsCache.length === 0) {
        eventsGrid.innerHTML = '<div class="events-empty-state"><p>Loading events...</p></div>';
        if (registeredList) {
            registeredList.innerHTML = '<p class="no-events">Loading registered events...</p>';
        }
        return;
    }

    const registeredIds = getStudentRegisteredEventIds();
    const filteredEvents = studentEventsCache.filter(event => {
        const matchesSearch = !searchValue ||
            event.title.toLowerCase().includes(searchValue) ||
            event.description.toLowerCase().includes(searchValue) ||
            event.eventType.toLowerCase().includes(searchValue) ||
            event.location.toLowerCase().includes(searchValue);

        const normalizedType = normalizeEventTypeForFilter(event.eventType);
        const matchesType = filterValue === 'All Events' || normalizedType === filterValue;

        return matchesSearch && matchesType;
    });

    if (!filteredEvents.length) {
        eventsGrid.innerHTML = `
            <div class="events-empty-state">
                <p>No admin-created events found for this filter.</p>
            </div>
        `;
    } else {
        eventsGrid.innerHTML = filteredEvents.map(event => `
            <div class="event-card">
                <div class="event-image">${escapeHtml(event.image)}</div>
                <div class="event-header">
                    <h3>${escapeHtml(event.title)}</h3>
                    <span class="event-badge">${escapeHtml(normalizeEventTypeForFilter(event.type))}</span>
                </div>
                <div class="event-details">
                    <p><strong>📅 Date:</strong> ${formatEventDateLabel(event.date)}</p>
                    <p><strong>🕐 Time:</strong> ${escapeHtml(event.time)}</p>
                    <p><strong>📍 Type:</strong> ${escapeHtml(event.type)}</p>
                    <p class="event-description">${escapeHtml(event.description)}</p>
                </div>
                <div class="event-actions">
                    <button class="btn-register" onclick="registerEvent('${escapeHtml(event.id)}')">✓ Register</button>
                    <button class="btn-info" onclick="viewEventDetails('${escapeHtml(event.id)}')">ℹ️ Details</button>
                </div>
            </div>
        `).join('');
    }

    if (registeredList) {
        const registeredEvents = studentRegisteredEventsCache
            .map(event => eventsDatabase[event.eventId])
            .filter(Boolean);

        if (!registeredEvents.length) {
            registeredList.innerHTML = '<p class="no-events">No registered events yet.</p>';
        } else {
            registeredList.innerHTML = registeredEvents.map(event => `
                <div class="registered-item">
                    <div class="item-info">
                        <h4>${escapeHtml(event.title)}</h4>
                        <p>${formatEventDateLabel(event.date)} • ${escapeHtml(event.time)}</p>
                    </div>
                    <button class="btn-unregister" onclick="unregisterEvent('${escapeHtml(event.id)}')">Unregister</button>
                </div>
            `).join('');
        }
    }
}

// Mentors are sourced from admins table via list_admins.php.
let adminsAsMentorsCache = [];

async function loadSidebarMentors() {
    const container = document.getElementById('sidebarMentorsList');
    try {
        const response = await fetch('server/php/list_admins.php');
        const data = await response.json();
        if (!data.success || !Array.isArray(data.admins) || !data.admins.length) {
            adminsAsMentorsCache = [];
            if (container) container.innerHTML = '<p style="color:#a0aec0;font-size:0.85rem;">No mentors yet.</p>';
            return;
        }
        adminsAsMentorsCache = data.admins.map(a => ({
            id: 'admin_' + String(a.id || a.email),
            email: String(a.email || '').trim().toLowerCase(),
            fullName: String(a.name || '').trim(),
            currentPosition: String(a.position || 'Administrator').trim(),
            currentCompany: String(a.department || '').trim(),
            program: '',
            graduationYear: '',
            bio: a.school_name ? 'School: ' + a.school_name : '',
            studentNumber: '',
            isAdmin: true
        }));
        if (container) {
            container.innerHTML = adminsAsMentorsCache.slice(0, 5).map(admin => {
                const subtitle = [admin.currentPosition, admin.currentCompany].filter(Boolean).join(' · ');
                return `<div class="mentor-item">
                    <div class="mentor-avatar">👨‍💼</div>
                    <div class="mentor-info">
                        <h4>${admin.fullName || 'Admin'}</h4>
                        <p>${subtitle || 'Administrator'}</p>
                    </div>
                </div>`;
            }).join('');
        }
    } catch (e) {
        adminsAsMentorsCache = [];
        if (container) container.innerHTML = '<p style="color:#a0aec0;font-size:0.85rem;">Unable to load.</p>';
    }
}

const jobsDatabase = {
    'job1': {
        title: 'Senior Frontend Developer',
        company: 'Tech Innovations Inc.',
        salary: '$120k - $150k',
        location: 'San Francisco, CA',
        type: 'Full-time',
        match: '95%',
        description: 'We are looking for an experienced Frontend Developer...',
        skills: ['React', 'JavaScript', 'CSS', 'TypeScript']
    },
    'job2': {
        title: 'Product Manager (Tech)',
        company: 'Digital Solutions Co.',
        salary: '$100k - $140k',
        location: 'New York, NY',
        type: 'Full-time',
        match: '92%',
        description: 'Lead our product strategy and vision...',
        skills: ['Product Strategy', 'Analytics', 'Leadership', 'Agile']
    }
};

const ALUMNI_API_BASE = 'server/php';

let alumniDirectoryCache = [];
let alumniConnectionsCache = [];
let alumniDirectoryLoaded = false;
let alumniConnectionsLoaded = false;

function normalizeAlumniEntry(alumni = {}) {
    return {
        id: String(alumni.id || ''),
        email: String(alumni.email || alumni.studentEmail || '').trim().toLowerCase(),
        fullName: String(alumni.fullName || alumni.full_name || '').trim(),
        studentNumber: String(alumni.studentNumber || alumni.student_number || '').trim(),
        program: String(alumni.program || '').trim(),
        graduationYear: String(alumni.graduationYear || alumni.graduation_year || '').trim(),
        currentCompany: String(alumni.currentCompany || alumni.current_company || '').trim(),
        currentPosition: String(alumni.currentPosition || alumni.current_position || '').trim(),
        bio: String(alumni.bio || '').trim()
    };
}

function renderStudentAlumniDirectory() {
    const grid = document.getElementById('studentAlumniGrid');
    if (!grid) {
        return;
    }

    const searchTerm = String(document.getElementById('alumniSearch')?.value || '').trim().toLowerCase();
    const filterControl = document.getElementById('alumniFilter');
    const selectedFilter = String(filterControl?.value || filterControl?.selectedOptions?.[0]?.textContent || '').trim();

    const filteredAlumni = alumniDirectoryCache.filter(item => {
        const searchableText = [item.fullName, item.email, item.program, item.currentCompany, item.currentPosition, item.graduationYear]
            .join(' ')
            .toLowerCase();
        const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
        const matchesYear = !selectedFilter || selectedFilter === 'All Batch Years' || String(item.graduationYear) === selectedFilter;
        return matchesSearch && matchesYear;
    });

    if (!filteredAlumni.length) {
        grid.innerHTML = '<p class="alumni-empty">No alumni found.</p>';
        return;
    }

    grid.innerHTML = filteredAlumni.map((alumni, index) => {
        const avatar = alumni.fullName ? alumni.fullName.split(' ').map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase() : 'AL';
        const titleLine = alumni.currentPosition || 'Alumni Member';
        const companyLine = alumni.currentCompany || 'Open to connect';
        const programLabel = alumni.program ? formatProgramLabel(alumni.program) : 'Program not listed';

        return `
            <div class="alumni-card" data-email="${escapeHtml(alumni.email)}">
                <div class="alumni-avatar">${escapeHtml(avatar)}</div>
                <h3>${escapeHtml(alumni.fullName || alumni.email)}</h3>
                <p class="alumni-year">Batch ${escapeHtml(alumni.graduationYear || 'N/A')}</p>
                <p class="alumni-title">${escapeHtml(titleLine)}</p>
                <p class="alumni-company">${escapeHtml(companyLine)}</p>
                <div class="alumni-info">
                    <p>📧 ${escapeHtml(alumni.email)}</p>
                    <p>🎓 ${escapeHtml(programLabel)}</p>
                </div>
                <div class="alumni-actions">
                    <button class="btn-connect-alumni" onclick="connectAlumni('${escapeHtml(alumni.email)}')">🤝 Connect</button>
                    <button class="btn-message" onclick="messageAlumni('${escapeHtml(alumni.email)}')">💬 Message</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderStudentAlumniConnections() {
    const container = document.getElementById('studentAlumniConnections');
    if (!container) {
        return;
    }

    if (!alumniConnectionsCache.length) {
        container.innerHTML = '<p class="alumni-empty">No alumni connections yet.</p>';
        return;
    }

    container.innerHTML = alumniConnectionsCache.map(friend => {
        const alumni = alumniDirectoryCache.find(item => item.email === friend.friendEmail);
        const name = alumni?.fullName || friend.friendName || friend.friendEmail;
        const detailParts = [];
        if (alumni?.graduationYear) {
            detailParts.push(`Batch ${alumni.graduationYear}`);
        }
        if (alumni?.currentPosition) {
            detailParts.push(alumni.currentPosition);
        }
        if (alumni?.currentCompany) {
            detailParts.push(`at ${alumni.currentCompany}`);
        }

        return `
            <div class="connection-item" data-email="${escapeHtml(friend.friendEmail)}">
                <div class="connection-info">
                    <h4>${escapeHtml(name)}</h4>
                    <p>${escapeHtml(detailParts.join(' • ') || 'Connected alumni')}</p>
                </div>
                <button class="btn-message" onclick="messageAlumni('${escapeHtml(friend.friendEmail)}')">💬 Message</button>
            </div>
        `;
    }).join('');
}

async function loadStudentAlumniConnections() {
    const token = getStudentMessengerToken();
    const container = document.getElementById('studentAlumniConnections');

    if (!token) {
        alumniConnectionsCache = [];
        if (container) {
            container.innerHTML = '<p class="alumni-empty">Sign in again to view your alumni connections.</p>';
        }
        return;
    }

    try {
        const response = await fetch(`${ALUMNI_API_BASE}/list_friends.php`, {
            method: 'POST',
            body: new URLSearchParams({ token })
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Unable to load alumni connections');
        }

        const alumniEmails = new Set(alumniDirectoryCache.map(item => item.email));
        alumniConnectionsCache = (Array.isArray(data.friends) ? data.friends : []);
        alumniConnectionsLoaded = true;
        renderStudentAlumniConnections();
        renderSidebarStats();
    } catch (error) {
        alumniConnectionsCache = [];
        if (container) {
            container.innerHTML = '<p class="alumni-empty">Unable to load alumni connections right now.</p>';
        }
        console.warn('loadStudentAlumniConnections failed:', error);
    }
}

function renderSidebarStats() {    const statConnections = document.getElementById('statConnections');
    const statMessages = document.getElementById('statMessages');
    const statRegisteredEvents = document.getElementById('statRegisteredEvents');
    const sidebarUpcomingEvents = document.getElementById('sidebarUpcomingEvents');

    if (statConnections) statConnections.textContent = alumniConnectionsCache.length;
    if (statRegisteredEvents) statRegisteredEvents.textContent = studentRegisteredEventsCache.length;

    // Messages: count total conversations
    const messagesCountEl = document.getElementById('studentMessagesCount');
    if (statMessages) {
        const rawCount = messagesCountEl ? (parseInt(messagesCountEl.textContent, 10) || 0) : 0;
        statMessages.textContent = rawCount;
    }

    // Upcoming events: next 3 from today
    if (sidebarUpcomingEvents) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = studentEventsCache
            .filter(ev => {
                const d = new Date(ev.eventDate);
                return !isNaN(d) && d >= today;
            })
            .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
            .slice(0, 3);

        if (!upcoming.length) {
            sidebarUpcomingEvents.innerHTML = '<p style="color:#a0aec0;font-size:0.85rem;">No upcoming events.</p>';
        } else {
            sidebarUpcomingEvents.innerHTML = upcoming.map(ev => {
                const d = new Date(ev.eventDate);
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const dateLabel = `${monthNames[d.getMonth()]} ${d.getDate()}`;
                const timeLabel = ev.startTime ? formatStudentEventTime(ev.startTime) : '';
                return `<div class="event-item">
                    <div class="event-date">${dateLabel}</div>
                    <div class="event-details">
                        <h4>${ev.title}</h4>
                        ${timeLabel ? `<p>${timeLabel}</p>` : ''}
                    </div>
                </div>`;
            }).join('');
        }
    }
}

async function loadIncomingFriendRequests() {
    const container = document.getElementById('incomingFriendRequests');
    const section = document.getElementById('incomingRequestsSection');
    const token = getStudentMessengerToken();
    if (!token || !container) return;

    try {
        const response = await fetch(`${ALUMNI_API_BASE}/list_friend_requests.php?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        const incoming = (data.requests || []).filter(r => r.direction === 'incoming' && r.status === 'pending');

        if (!incoming.length) {
            if (section) section.style.display = 'none';
            return;
        }

        if (section) section.style.display = '';
        container.innerHTML = incoming.map(r => `
            <div class="connection-item" id="friendReq_${r.id}">
                <div class="connection-info">
                    <h4>${escapeHtml(r.requesterName || r.requesterEmail)}</h4>
                    <p>${escapeHtml(r.requesterEmail)}</p>
                </div>
                <div style="display:flex;gap:0.5rem;">
                    <button class="btn-connect-alumni" onclick="acceptFriendRequest(${r.id})">✅ Accept</button>
                    <button class="btn-message" onclick="rejectFriendRequest(${r.id})" style="background:#ef4444;">❌ Reject</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        if (container) container.innerHTML = '<p class="alumni-empty">Unable to load requests.</p>';
        console.warn('loadIncomingFriendRequests failed:', e);
    }
}

async function acceptFriendRequest(requestId) {
    const token = getStudentMessengerToken();
    if (!token) return;
    try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('requestId', requestId);
        const response = await fetch(`${ALUMNI_API_BASE}/accept_friend_request.php`, { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error);
        document.getElementById(`friendReq_${requestId}`)?.remove();
        showNotification('Success!', 'Friend request accepted!');
        await loadStudentAlumniConnections();
        await loadIncomingFriendRequests();
    } catch (e) {
        showNotification('Error', e.message || 'Could not accept request', 'error');
    }
}

async function rejectFriendRequest(requestId) {
    const token = getStudentMessengerToken();
    if (!token) return;
    try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('requestId', requestId);
        const response = await fetch(`${ALUMNI_API_BASE}/reject_friend_request.php`, { method: 'POST', body: formData });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error);
        document.getElementById(`friendReq_${requestId}`)?.remove();
        showNotification('Rejected', 'Friend request rejected.');
        await loadIncomingFriendRequests();
    } catch (e) {
        showNotification('Error', e.message || 'Could not reject request', 'error');
    }
}

async function loadStudentAlumniDirectory(forceReload = false) {
    if (alumniDirectoryLoaded && !forceReload) {
        renderStudentAlumniDirectory();
        await loadStudentAlumniConnections();
        return;
    }

    const grid = document.getElementById('studentAlumniGrid');

    try {
        if (grid) {
            grid.innerHTML = '<p class="alumni-empty">Loading alumni directory...</p>';
        }

        const response = await fetch(`${ALUMNI_API_BASE}/list_alumni.php`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Unable to load alumni directory');
        }

        alumniDirectoryCache = Array.isArray(data.alumni) ? data.alumni.map(normalizeAlumniEntry) : [];
        alumniDirectoryLoaded = true;
        renderStudentAlumniDirectory();
        await loadStudentAlumniConnections();
    } catch (error) {
        alumniDirectoryCache = [];
        alumniConnectionsCache = [];
        if (grid) {
            grid.innerHTML = '<p class="alumni-empty">Unable to load alumni directory right now.</p>';
        }
        const connectionsContainer = document.getElementById('studentAlumniConnections');
        if (connectionsContainer) {
            connectionsContainer.innerHTML = '<p class="alumni-empty">Unable to load alumni connections right now.</p>';
        }
        console.warn('loadStudentAlumniDirectory failed:', error);
    }
}

/* ===========================
   MENTORS GRID (DYNAMIC)
   =========================== */

function renderMentorsGrid() {
    const grid = document.getElementById('mentorsGrid');
    if (!grid) return;

    const searchTerm = String(document.getElementById('mentorSearch')?.value || '').trim().toLowerCase();

    // Combine alumni + admins, dedupe by email
    const combined = [...alumniDirectoryCache, ...adminsAsMentorsCache].reduce((acc, item) => {
        if (item.email && acc.some(x => x.email === item.email)) return acc;
        acc.push(item);
        return acc;
    }, []);

    const mentorList = combined.filter(item => {
        if (!searchTerm) return true;
        const searchable = [item.fullName, item.email, item.currentPosition, item.currentCompany, item.program, item.bio]
            .join(' ').toLowerCase();
        return searchable.includes(searchTerm);
    });

    if (!mentorList.length) {
        grid.innerHTML = '<p class="mentor-empty">No mentors available yet. Check back soon.</p>';
        return;
    }

    grid.innerHTML = mentorList.map(person => {
        const avatar = person.fullName
            ? person.fullName.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase()
            : 'AL';
        const alreadyRequested = studentMentorRequestIds.has(String(person.id));
        const roleLabel = person.isAdmin ? (person.currentPosition || 'Administrator') : (person.currentPosition || 'Alumni');
        const batchInfo = person.isAdmin
            ? `<span>👨‍💼 ${escapeHtml(person.currentCompany || 'Admin')}</span>`
            : `<span>🎓 Batch ${escapeHtml(person.graduationYear || 'N/A')}</span><span>${escapeHtml(formatProgramLabel(person.program))}</span>`;
        return `
            <div class="mentor-card">
                <div class="mentor-avatar">${escapeHtml(avatar)}</div>
                <h3>${escapeHtml(person.fullName || person.email)}</h3>
                <p class="mentor-title">${escapeHtml(roleLabel)}</p>
                <p class="mentor-company">${escapeHtml(person.currentCompany || '')}</p>
                <div class="mentor-info">${batchInfo}</div>
                ${person.bio ? `<p class="mentor-bio">${escapeHtml(person.bio)}</p>` : ''}
                <div class="mentor-actions">
                    ${alreadyRequested
                        ? `<button class="btn-connect" onclick="cancelMentorRequest('${escapeHtml(person.id)}')" style="background:rgba(231,76,60,0.2);border:1px solid #e74c3c;color:#e74c3c;">
                                ✕ Cancel Request
                           </button>`
                        : `<button class="btn-connect" onclick="connectMentor('${escapeHtml(person.id)}')">
                                🤝 Request Mentorship
                           </button>`
                    }
                    <button class="btn-view" onclick="viewMentorProfile('${escapeHtml(person.id)}')">👁️ View Profile</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderActiveMentorships() {
    const container = document.getElementById('activeMentorshipsList');
    if (!container) return;

    const activeMentors = Array.from(studentMentorRequestIds)
        .map(id => alumniDirectoryCache.find(a => String(a.id) === String(id)))
        .filter(Boolean);

    if (!activeMentors.length) {
        container.innerHTML = '<p class="no-mentorships">No active mentorships yet.</p>';
        return;
    }

    container.innerHTML = activeMentors.map(alumni => `
        <div class="mentorship-item">
            <div class="mentorship-info">
                <h4>${escapeHtml(alumni.fullName || alumni.email)}</h4>
                <p>${escapeHtml(alumni.currentPosition || 'Alumni')}${alumni.currentCompany ? ' at ' + escapeHtml(alumni.currentCompany) : ''}</p>
                <p>Mentor Status: ⏳ Request Sent</p>
            </div>
            <button class="btn-chat" onclick="messageAlumni('${escapeHtml(alumni.email)}')">💬 Message</button>
        </div>
    `).join('');
}

async function loadMentorsGrid() {
    const grid = document.getElementById('mentorsGrid');
    if (!grid) return;

    if (!alumniDirectoryLoaded) {
        grid.innerHTML = '<p class="loading-state">Loading mentors...</p>';
        await loadStudentAlumniDirectory();
    }

    // Always (re)load admins so new admin accounts appear immediately
    await loadSidebarMentors();

    renderMentorsGrid();
    renderActiveMentorships();
}

function buildStudentEventPayload(eventId) {
    const event = studentEventsCache.find(entry => entry.id === eventId);
    if (!event) {
        return null;
    }

    return event;
}

async function registerEvent(eventId) {
    const event = buildStudentEventPayload(eventId);
    if (!event) {
        showNotification('Event not found', 'error');
        return;
    }

    const token = getStudentEventsToken();
    if (!token) {
        showNotification('Please log in again', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('eventId', eventId);

    try {
        const response = await fetch(`${STUDENT_EVENTS_API_BASE}/register_event.php`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            showNotification('Error', data.error || 'Unable to register for event', 'error');
            return;
        }

        showNotification('Success!', `You registered for: ${event.title}`);
        await loadStudentEventsData();
    } catch (error) {
        showNotification('Error', 'Unable to register for event', 'error');
        console.warn('registerEvent failed:', error);
    }
}

async function unregisterEvent(eventId) {
    const event = buildStudentEventPayload(eventId);
    const confirmDelete = confirm('Are you sure you want to unregister from this event?');
    if (!confirmDelete) {
        return;
    }

    const token = getStudentEventsToken();
    if (!token) {
        showNotification('Please log in again', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('eventId', eventId);

    try {
        const response = await fetch(`${STUDENT_EVENTS_API_BASE}/unregister_event.php`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            showNotification('Error', data.error || 'Unable to unregister from event', 'error');
            return;
        }

        showNotification('Success!', event ? `You unregistered from: ${event.title}` : 'You unregistered from the event');
        await loadStudentEventsData();
    } catch (error) {
        showNotification('Error', 'Unable to unregister from event', 'error');
        console.warn('unregisterEvent failed:', error);
    }
}

function viewEventDetails(eventId) {
    const event = buildStudentEventPayload(eventId);
    if (event) {
        showNotification('Event Details', `${event.title}\nDate: ${formatEventDateLabel(event.eventDate)}\nTime: ${formatStudentEventTime(event.startTime)}\nLocation: ${event.location || 'TBA'}\nType: ${event.eventType}`);
    }
}
/* ===========================
   EVENT HANDLERS - MENTORS TAB
   =========================== */

async function loadStudentInteractionState() {
    const token = getStudentEventsToken();

    if (!token) {
        studentInteractionStateLoaded = true;
        studentMentorRequestIds = new Set();
        studentAppliedJobIds = new Set();
        studentSavedJobIds = new Set();
        return;
    }

    try {
        const [mentorResponse, jobResponse] = await Promise.all([
            fetch(`${STUDENT_INTERACTIONS_API_BASE}/list_mentor_requests.php?token=${encodeURIComponent(token)}`),
            fetch(`${STUDENT_INTERACTIONS_API_BASE}/list_student_job_actions.php?token=${encodeURIComponent(token)}`)
        ]);

        const mentorData = await mentorResponse.json().catch(() => null);
        const jobData = await jobResponse.json().catch(() => null);

        if (mentorResponse.ok && mentorData && mentorData.success) {
            studentMentorRequestIds = new Set(Array.isArray(mentorData.mentorIds) ? mentorData.mentorIds.map(String) : []);
        }

        if (jobResponse.ok && jobData && jobData.success) {
            studentAppliedJobIds = new Set(Array.isArray(jobData.appliedJobIds) ? jobData.appliedJobIds.map(String) : []);
            studentSavedJobIds = new Set(Array.isArray(jobData.savedJobIds) ? jobData.savedJobIds.map(String) : []);
        }

        studentInteractionStateLoaded = true;
    } catch (error) {
        console.warn('Failed to load student interaction state:', error);
        studentInteractionStateLoaded = true;
        studentMentorRequestIds = new Set();
        studentAppliedJobIds = new Set();
        studentSavedJobIds = new Set();
    }
}

async function connectMentor(mentorId) {
    const mentor = alumniDirectoryCache.find(a => String(a.id) === String(mentorId))
                || adminsAsMentorsCache.find(a => String(a.id) === String(mentorId));
    if (!mentor) {
        showNotification('Mentor not found', 'error');
        return;
    }

    const token = getStudentEventsToken();
    if (!token) {
        showNotification('Please log in again', 'error');
        return;
    }

    if (!studentInteractionStateLoaded) {
        await loadStudentInteractionState();
    }

    if (studentMentorRequestIds.has(String(mentorId))) {
        showNotification('Mentorship request already sent', 'info');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('mentorId', String(mentorId));
        formData.append('mentorName', mentor.fullName || mentor.email);
        formData.append('mentorTitle', mentor.currentPosition || 'Alumni');
        formData.append('mentorCompany', mentor.currentCompany || '');

        const response = await fetch(`${STUDENT_INTERACTIONS_API_BASE}/create_mentor_request.php`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json().catch(() => null);

        if (!response.ok || !data || !data.success) {
            throw new Error(data?.error || 'Unable to send mentorship request');
        }

        // For admin mentors, also create a pending_approval so the admin can approve/reject from their dashboard
        if (mentor.isAdmin && mentor.email) {
            const paForm = new FormData();
            paForm.append('token', token);
            paForm.append('receiverEmail', mentor.email);
            paForm.append('requestType', 'Mentorship Request');
            await fetch(`${STUDENT_INTERACTIONS_API_BASE}/create_pending_approval.php`, { method: 'POST', body: paForm });
        }

        studentMentorRequestIds.add(String(mentorId));
        showNotification('Mentorship request sent! Waiting for admin approval.', 'success');
        renderMentorsGrid();
        renderActiveMentorships();
    } catch (error) {
        showNotification('Mentor Request', error.message || 'Unable to send mentorship request', 'error');
    }
}

async function cancelMentorRequest(mentorId) {
    const token = getStudentEventsToken();
    if (!token) { showNotification('Please log in again', 'error'); return; }
    try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('mentorId', String(mentorId));
        const resp = await fetch(`${STUDENT_INTERACTIONS_API_BASE}/cancel_mentor_request.php`, { method: 'POST', body: formData });
        const data = await resp.json().catch(() => null);
        if (!resp.ok || !data?.success) throw new Error(data?.error || 'Unable to cancel');
        studentMentorRequestIds.delete(String(mentorId));
        showNotification('Mentorship request cancelled.', 'info');
        renderMentorsGrid();
        renderActiveMentorships();
    } catch (err) {
        showNotification(err.message || 'Unable to cancel request', 'error');
    }
}

function viewMentorProfile(mentorId) {
    const mentor = alumniDirectoryCache.find(a => String(a.id) === String(mentorId))
                || adminsAsMentorsCache.find(a => String(a.id) === String(mentorId));
    if (mentor) {
        const details = [
            mentor.fullName || mentor.email,
            mentor.currentPosition ? `${mentor.currentPosition}${mentor.currentCompany ? ' at ' + mentor.currentCompany : ''}` : '',
            mentor.graduationYear ? `Batch ${mentor.graduationYear}` : '',
            mentor.bio || ''
        ].filter(Boolean).join('\n');
        showNotification('Mentor Profile', details);
    }
}

function startChat(mentorEmail) {
    if (mentorEmail) {
        messageAlumni(mentorEmail);
    }
}

/* ===========================
   EVENT HANDLERS - JOBS TAB
   =========================== */

async function recordStudentJobAction(jobId, action) {
    const job = jobsDatabase[jobId];
    if (!job) {
        return false;
    }

    const token = getStudentEventsToken();
    if (!token) {
        showNotification('Please log in again', 'error');
        return false;
    }

    if (!studentInteractionStateLoaded) {
        await loadStudentInteractionState();
    }

    const actionSet = action === 'applied' ? studentAppliedJobIds : studentSavedJobIds;
    if (actionSet.has(jobId)) {
        showNotification('Already saved', `${job.title} is already ${action}.`, 'info');
        return true;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('jobId', jobId);
    formData.append('action', action);
    formData.append('jobTitle', job.title);
    formData.append('company', job.company);

    const response = await fetch(`${STUDENT_INTERACTIONS_API_BASE}/record_student_job_action.php`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !data.success) {
        throw new Error(data?.error || `Unable to ${action} job`);
    }

    actionSet.add(jobId);
    return true;
}

async function applyJob(jobId) {
    const job = jobsDatabase[jobId];
    if (job) {
        try {
            const saved = await recordStudentJobAction(jobId, 'applied');
            if (saved) {
                showNotification('Success!', `Your application for ${job.title} at ${job.company} has been submitted!`);
            }
        } catch (error) {
            showNotification('Job Application', error.message || 'Unable to apply for job', 'error');
        }
    }
}

async function saveJob(jobId) {
    const job = jobsDatabase[jobId];
    if (job) {
        try {
            const saved = await recordStudentJobAction(jobId, 'saved');
            if (saved) {
                showNotification('Success!', `${job.title} saved to your list`);
            }
        } catch (error) {
            showNotification('Saved Jobs', error.message || 'Unable to save job', 'error');
        }
    }
}

function viewCareerInsights() {
    showNotification('Career Insights', 'View detailed career insights and recommendations here');
}

/* ===========================
   EVENT HANDLERS - MESSAGES TAB
   =========================== */

function createDiscussion() {
    const title = prompt('Enter discussion title:');
    const category = prompt('Select category (e.g., Tech, Career, General):');
    if (title && category) {
        showNotification('Success!', `Discussion "${title}" created in ${category}!`);
    }
}

function joinDiscussion(discussionId) {
    const discussionTitles = {
        'dis1': 'Latest AI Trends in Tech',
        'dis2': 'Resume Tips & Tricks',
        'dis3': 'Internship Experiences',
        'dis4': 'Career Path Planning'
    };
    const discussionTitle = discussionTitles[discussionId] || 'Discussion';
    showNotification('Joined!', `You joined the discussion: ${discussionTitle}`);
}

function viewDiscussion(discussionId) {
    const discussionTitles = {
        'dis1': 'Latest AI Trends in Tech',
        'dis2': 'Resume Tips & Tricks',
        'dis3': 'Internship Experiences',
        'dis4': 'Career Path Planning'
    };
    const discussionTitle = discussionTitles[discussionId] || 'Discussion';
    showNotification('Opening Discussion', `Loading: ${discussionTitle}`);
}

/* ===========================
   EVENT HANDLERS - ALUMNI TAB
   =========================== */

async function connectAlumni(alumniEmail) {
    const email = String(alumniEmail || '').trim().toLowerCase();
    const alumni = alumniDirectoryCache.find(item => item.email === email);

    if (!alumni) {
        showNotification('Alumni', 'Unable to find that alumni profile.', 'error');
        return;
    }

    const token = getStudentMessengerToken();
    if (!token) {
        showNotification('Friend Request', 'Please sign in again.', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('token', token);
        formData.append('receiverEmail', email);

        const response = await fetch(`${ALUMNI_API_BASE}/send_friend_request.php`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Unable to send friend request');
        }

        showNotification('Success!', `Friend request sent to ${alumni.fullName || email}`);
        await loadStudentAlumniConnections();
    } catch (error) {
        showNotification('Friend Request', error.message || 'Unable to send friend request', 'error');
    }
}

async function messageAlumni(alumniEmail) {
    const email = String(alumniEmail || '').trim().toLowerCase();
    if (!email) return;

    const token = getStudentMessengerToken();
    if (!token) {
        showNotification('Messages', 'Please sign in again.', 'error');
        return;
    }

    // Determine name and role
    const alumni = alumniDirectoryCache.find(item => item.email === email);
    const friend = alumniConnectionsCache.find(item => String(item.friendEmail || '').trim().toLowerCase() === email);
    const name = alumni?.fullName || friend?.friendName || email;
    const role = friend?.friendRole || (alumni ? 'student' : 'student');
    const conversationId = getStudentConversationId(email, role);

    // Switch to messages tab first
    if (typeof switchTab === 'function') switchTab('messages');

    // Sync conversations from server
    await syncStudentMessengerFromServer().catch(() => false);

    const state = getStudentMessengerState();
    // If no existing conversation, inject an optimistic one so chat panel opens
    if (!state.conversations.find(item => item.id === conversationId)) {
        state.conversations.unshift({
            id: conversationId,
            name,
            subtitle: '',
            unread: 0,
            online: false,
            lastTime: '',
            conversationEmail: email,
            conversationRole: role
        });
        saveStudentMessengerState(state);
    }

    await selectStudentConversation(conversationId);
}

/* ===========================
   UTILITY FUNCTIONS
   =========================== */

function showNotification(title, message, type = 'success') {
    const container = document.getElementById('notification-container');
    
    // Icon mapping for different notification types
    const icons = {
        'success': '✓',
        'error': '✕',
        'info': 'ℹ'
    };
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-header">
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-title">${escapeHtml(title)}</span>
        </div>
        <div class="toast-message">${escapeHtml(message)}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

/* ===========================
   STUDENT DASHBOARD - CALENDAR
   =========================== */

let currentDate = new Date();
let calendarDaysContainer = null;
let monthYearElement = null;
let prevMonthBtn = null;
let nextMonthBtn = null;
let selectedDateElement = null;
let dayEventsListElement = null;
let selectedDayTimeout = null;
const DEFAULT_DASHBOARD_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='100' fill='%234f46e5'/%3E%3Ctext x='100' y='120' font-size='80' fill='white' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";
const STUDENT_PROFILE_API_BASE = 'server/php';
let currentDashboardStudentProfile = null;

function normalizeDashboardStudentProfile(profile = {}) {
    return {
        firstName: String(profile.firstName || '').trim(),
        lastName: String(profile.lastName || '').trim(),
        fullName: String(profile.fullName || '').trim(),
        email: String(profile.email || '').trim().toLowerCase(),
        profileImage: String(profile.profileImage || '').trim(),
        phone: String(profile.phone || '').trim(),
        dob: String(profile.dob || '').trim(),
        gender: String(profile.gender || '').trim(),
        location: String(profile.location || '').trim(),
        studentId: String(profile.studentId || profile.studentNumber || '').trim(),
        studentNumber: String(profile.studentNumber || profile.studentId || '').trim(),
        program: String(profile.program || '').trim(),
        degree: String(profile.degree || '').trim(),
        graduationYear: String(profile.graduationYear || '').trim(),
        university: String(profile.university || '').trim(),
        gpa: String(profile.gpa || '').trim(),
        major: String(profile.major || '').trim(),
        position: String(profile.position || '').trim(),
        company: String(profile.company || '').trim(),
        industry: String(profile.industry || '').trim(),
        experience: String(profile.experience || '').trim(),
        bio: String(profile.bio || '').trim(),
        aboutMe: String(profile.aboutMe || '').trim(),
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        gmailAddress: String(profile.gmailAddress || '').trim(),
        authProvider: String(profile.authProvider || '').trim(),
        registeredDate: String(profile.registeredDate || '').trim()
    };
}

function getCachedDashboardStudentProfile() {
    if (currentDashboardStudentProfile) {
        return currentDashboardStudentProfile;
    }

    const cachedSession = sessionStorage.getItem('studentProfile');
    if (cachedSession) {
        try {
            currentDashboardStudentProfile = normalizeDashboardStudentProfile(JSON.parse(cachedSession));
            return currentDashboardStudentProfile;
        } catch (error) {
            console.warn('Invalid cached student profile:', error);
        }
    }

    return normalizeDashboardStudentProfile({});
}

async function loadDashboardStudentProfile() {
    const token = getStudentEventsToken();
    if (!token) {
        return null;
    }

    const response = await fetch(`${STUDENT_PROFILE_API_BASE}/get_profile.php`, {
        method: 'POST',
        body: new URLSearchParams({ token })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || !payload.success || !payload.profile) {
        throw new Error(payload?.error || 'Unable to load profile');
    }

    currentDashboardStudentProfile = normalizeDashboardStudentProfile(payload.profile);
    sessionStorage.setItem('studentProfile', JSON.stringify(currentDashboardStudentProfile));
    return currentDashboardStudentProfile;
}

async function populateDashboardUserProfile() {
    let storedData = getCachedDashboardStudentProfile();

    try {
        const serverProfile = await loadDashboardStudentProfile();
        if (serverProfile) {
            storedData = serverProfile;
        }
    } catch (error) {
        console.warn('Dashboard profile load failed:', error);
    }

    const sessionEmail = sessionStorage.getItem('studentEmail') || '';

    const fullName = storedData.fullName || (sessionEmail
        ? sessionEmail.split('@')[0].charAt(0).toUpperCase() + sessionEmail.split('@')[0].slice(1)
        : 'Student');
    const email = storedData.email || sessionEmail || 'student@school.edu';
    const avatar = storedData.profileImage || DEFAULT_DASHBOARD_AVATAR;

    const welcomeName = document.getElementById('userName');
    const navUserName = document.getElementById('navUserName');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserEmail = document.getElementById('sidebarUserEmail');
    const navUserAvatar = document.getElementById('navUserAvatar');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');

    if (welcomeName) welcomeName.textContent = fullName;
    if (navUserName) navUserName.textContent = fullName;
    if (sidebarUserName) sidebarUserName.textContent = fullName;
    if (sidebarUserEmail) sidebarUserEmail.textContent = email;
    if (navUserAvatar) navUserAvatar.src = avatar;
    if (sidebarUserAvatar) sidebarUserAvatar.src = avatar;
}

async function linkGmailFromDashboard(event) {
    if (event) {
        event.preventDefault();
    }

    const sessionEmail = (sessionStorage.getItem('studentEmail') || '').trim().toLowerCase();
    const currentData = getCachedDashboardStudentProfile();
    const existingGmail = String(currentData.gmailAddress || '').trim().toLowerCase();

    const input = prompt('Enter Gmail address to link:', existingGmail || '');
    const gmail = String(input || '').trim().toLowerCase();

    if (!gmail) {
        showNotification('Gmail', 'Linking cancelled.', 'info');
        return;
    }

    if (!/^[^\s@]+@gmail\.com$/.test(gmail)) {
        showNotification('Gmail', 'Please enter a valid Gmail address ending in @gmail.com.', 'error');
        return;
    }

    const token = getStudentEventsToken();
    if (!token) {
        showNotification('Gmail', 'Please sign in again.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('fullName', currentData.fullName || sessionEmail || 'Student');
    formData.append('phone', currentData.phone || '');
    formData.append('dob', currentData.dob || '');
    formData.append('gender', currentData.gender || '');
    formData.append('location', currentData.location || '');
    formData.append('degree', currentData.degree || '');
    formData.append('university', currentData.university || '');
    formData.append('graduationYear', currentData.graduationYear || '');
    formData.append('gpa', currentData.gpa || '');
    formData.append('major', currentData.major || '');
    formData.append('position', currentData.position || '');
    formData.append('company', currentData.company || '');
    formData.append('industry', currentData.industry || '');
    formData.append('experience', currentData.experience || '');
    formData.append('bio', currentData.bio || '');
    formData.append('aboutMe', currentData.aboutMe || '');
    formData.append('skills', JSON.stringify(currentData.skills || []));
    formData.append('profileImage', currentData.profileImage || '');
    formData.append('gmailAddress', gmail);
    formData.append('authProvider', 'gmail');

    const response = await fetch(`${STUDENT_PROFILE_API_BASE}/update_profile.php`, {
        method: 'POST',
        body: formData
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload || !payload.success) {
        showNotification('Gmail', payload?.error || 'Unable to link Gmail address.', 'error');
        return;
    }

    currentDashboardStudentProfile = {
        ...currentData,
        gmailAddress: gmail,
        authProvider: 'gmail'
    };
    sessionStorage.setItem('studentProfile', JSON.stringify(currentDashboardStudentProfile));
    showNotification('Gmail Linked', `${gmail} is now linked to your student profile.`, 'success');
}

let eventsList = {};

function syncCalendarEventsFromDatabase() {
    const mapped = {};

    Object.values(eventsDatabase).forEach(event => {
        const key = String(event.date || event.eventDate || '').slice(0, 10);
        if (!key) {
            return;
        }

        if (!mapped[key]) {
            mapped[key] = [];
        }

        mapped[key].push({
            title: event.title,
            time: event.time || formatStudentEventTime(event.startTime),
            location: event.location || event.type || 'Event'
        });
    });

    eventsList = mapped;
}

/* ===========================
   RENDER CALENDAR
   =========================== */

function renderCalendar() {
    if (!calendarDaysContainer || !monthYearElement) {
        return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearElement.textContent = `${monthNames[month]} ${year}`;
    
    // Clear calendar days - this removes any existing content
    if (calendarDaysContainer) {
        calendarDaysContainer.innerHTML = '';
    } else {
        console.error('Calendar days container not found');
        return;
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
        const day = daysInPrevMonth - firstDay + i + 1;
        const dayElement = createDayElement(day, true);
        calendarDaysContainer.appendChild(dayElement);
    }
    
    // Add days of current month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        const dayElement = createDayElement(day, false, isToday);
        
        // Add event indicator
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (eventsList[dateStr]) {
            dayElement.classList.add('has-event');
        }
        
        // Add click handler
        dayElement.addEventListener('click', () => selectDay(day, month, year));
        
        calendarDaysContainer.appendChild(dayElement);
    }
    
    // Calculate the number of rows needed for this month and only add that many cells
    const usedCells = firstDay + daysInMonth; // cells occupied by prev-month blanks + current month
    const neededRows = Math.ceil(usedCells / 7); // minimal rows required
    const totalNeededCells = neededRows * 7;
    const totalCells = calendarDaysContainer.children.length; // currently added cells (prev + current)
    const remainingCells = totalNeededCells - totalCells;

    // Add days from next month only for the needed rows (prevents extra blank rows)
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, true);
        calendarDaysContainer.appendChild(dayElement);
    }
}

/* ===========================
   CREATE DAY ELEMENT
   =========================== */

function createDayElement(day, isOtherMonth = false, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    // Hide numeric labels for days that belong to adjacent months
    dayElement.textContent = isOtherMonth ? '' : day;
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month', 'empty-day');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
        // also add a stronger highlight class to match Admin dashboard styling
        dayElement.classList.add('today-highlight');
    }
    
    return dayElement;
}

/* ===========================
   SELECT DAY AND SHOW EVENTS
   =========================== */

function selectDay(day, month, year) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Find and select the correct day element
    const dayElements = document.querySelectorAll('.calendar-day');
    dayElements.forEach(element => {
        if (element.textContent.trim() === String(day) && !element.classList.contains('other-month')) {
            element.classList.add('selected');
        }
    });
    
    // Format date string
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    selectedDateElement.textContent = `${dayNames[dateObj.getDay()]}, ${monthNames[month]} ${day}`;
    
    // Show events for selected day
    displayEvents(dateStr);

    // Keep highlight visible until user clicks another day or clears it.
    if (selectedDayTimeout) {
        clearTimeout(selectedDayTimeout);
        selectedDayTimeout = null;
    }
}

function clearSelectedDay() {
    if (selectedDayTimeout) {
        clearTimeout(selectedDayTimeout);
        selectedDayTimeout = null;
    }

    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    if (selectedDateElement) {
        selectedDateElement.textContent = 'Today';
    }

    if (dayEventsListElement) {
        dayEventsListElement.innerHTML = '<p class="no-events">No events scheduled</p>';
    }
}

/* ===========================
   DISPLAY EVENTS
   =========================== */

function displayEvents(dateStr) {
    const events = eventsList[dateStr] || [];
    
    if (events.length === 0) {
        // Make sure this is the only content - no extra numbers
        dayEventsListElement.innerHTML = '<p class="no-events">No events scheduled for this day</p>';
        return;
    }
    
    // This should only show event details, not a list of days
    dayEventsListElement.innerHTML = events.map(event => `
        <div class="event-item-detail">
            <h4>${escapeHtml(event.title)}</h4>
            <p>🕐 ${escapeHtml(event.time)}</p>
            <p>📍 ${escapeHtml(event.location)}</p>
        </div>
    `).join('');
}

if (calendarDaysContainer) {
    calendarDaysContainer.addEventListener('click', (event) => {
        const dayCell = event.target.closest('.calendar-day');

        if (!dayCell || dayCell.classList.contains('empty-day')) {
            clearSelectedDay();
        }
    });
}


/* ===========================
   DISPLAY USER NAME
   =========================== */

/* ===========================
   LOGOUT FUNCTION
   =========================== */

function logout() {
    if (typeof window.recordActivityLog === 'function') {
        const studentEmail = sessionStorage.getItem('studentEmail') || 'Student';
        window.recordActivityLog({
            role: 'student',
            action: 'logout',
            name: studentEmail,
            email: studentEmail,
            message: `Student ${studentEmail} logged out from the portal.`
        });
    }

    sessionStorage.removeItem('studentLoggedIn');
    sessionStorage.removeItem('studentEmail');
    showAlert('You have been logged out', 'success');
    setTimeout(() => {
        window.location.href = 'StudentLogin.html';
    }, 1500);
}

/* ===========================
   ALERT FUNCTION
   =========================== */

function showAlert(message, type) {
    const existingAlert = document.querySelector('.alert-message');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const alert = document.createElement('div');
    alert.className = `alert-message alert-${type}`;
    alert.textContent = message;
    
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
        font-size: 0.9rem;
    `;
    
    if (type === 'error') {
        alert.style.backgroundColor = '#fee2e2';
        alert.style.color = '#991b1b';
        alert.style.border = '2px solid #fca5a5';
    } else if (type === 'success') {
        alert.style.backgroundColor = '#dcfce7';
        alert.style.color = '#166534';
        alert.style.border = '2px solid #86efac';
    }
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

/* ===========================
   NAV LINK ACTIVE STATE
   =========================== */

const navLinks = document.querySelectorAll('.nav-link');
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        navLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

/* ===========================
   PROFILE MENU CLOSE ON CLICK OUTSIDE
   =========================== */

document.addEventListener('click', function(e) {
    const navProfile = document.querySelector('.nav-profile');
    if (navProfile && !navProfile.contains(e.target)) {
        // Profile menu will close due to CSS :hover state
    }

    const quickPopup = document.getElementById('quickMessagePopup');
    const quickButton = document.querySelector('.floating-message-btn');
    if (Date.now() < studentQuickCloseSuppressUntil) {
        return;
    }

    const clickPath = typeof e.composedPath === 'function' ? e.composedPath() : [];
    const clickedInsideQuickPopup = clickPath.includes(quickPopup) || clickPath.includes(quickButton);
    if (
        quickPopup && quickButton &&
        !clickedInsideQuickPopup
    ) {
        closeQuickMessages();
    }

    const quickAiPopup = document.getElementById('quickAiPopup');
    const quickAiButton = document.querySelector('.floating-ai-btn');
    const clickedInsideQuickAiPopup = clickPath.includes(quickAiPopup) || clickPath.includes(quickAiButton);
    if (
        quickAiPopup && quickAiButton &&
        !clickedInsideQuickAiPopup
    ) {
        closeAiQuick();
    }

    const aiModal = document.getElementById('ai-recommender-modal');
    const aiButton = document.getElementById('ai-bot-trigger');
    const clickedInsideAiModal = clickPath.includes(aiModal) || clickPath.includes(aiButton);
    if (
        aiModal && aiButton &&
        !clickedInsideAiModal
    ) {
        closeAiRecommender();
    }
});

/* ===========================
   INITIALIZATION
   =========================== */

// Make sure DOM is loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    calendarDaysContainer = document.getElementById('calendarDays');
    monthYearElement = document.getElementById('monthYear');
    prevMonthBtn = document.getElementById('prevMonth');
    nextMonthBtn = document.getElementById('nextMonth');
    selectedDateElement = document.getElementById('selectedDate');
    dayEventsListElement = document.getElementById('dayEventsList');

    if (!calendarDaysContainer || !monthYearElement) {
        console.error('Calendar elements not found');
    }
    
    // Initialize current date
    currentDate = new Date();

    // Initialize floating unread badge
    initUnreadBadge();

    // Initialize floating quick message popup list
    initQuickMessagesPopup();

    // Initialize full messages tab messenger
    initializeStudentMessenger();

    // Populate user profile details
    populateDashboardUserProfile();

    // Initialize learning materials tab content
    initStudentMaterials();

    const alumniSearch = document.getElementById('alumniSearch');
    if (alumniSearch) {
        alumniSearch.addEventListener('input', renderStudentAlumniDirectory);
    }

    const alumniFilter = document.getElementById('alumniFilter');
    if (alumniFilter) {
        alumniFilter.addEventListener('change', renderStudentAlumniDirectory);
    }
    
    // Render calendar on load
    renderCalendar();

    loadStudentEventsData();
    loadStudentInteractionState().catch(error => {
        console.warn('Failed to load student interaction state:', error);
    });
    loadStudentAlumniDirectory();
    loadMentorsGrid();
    loadSidebarMentors();
    loadIncomingFriendRequests();

    activateTabFromHash();

    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            const tabName = String(this.getAttribute('href') || '').replace('#', '').trim();
            if (!tabName) {
                return;
            }

            event.preventDefault();
            switchTab(tabName);
        });
    });

    window.addEventListener('hashchange', activateTabFromHash);

    const eventSearch = document.getElementById('eventSearch');
    if (eventSearch) {
        eventSearch.addEventListener('input', renderStudentEventsTab);
    }

    const eventFilter = document.getElementById('eventFilter');
    if (eventFilter) {
        eventFilter.addEventListener('change', renderStudentEventsTab);
    }

    const mentorSearch = document.getElementById('mentorSearch');
    if (mentorSearch) {
        mentorSearch.addEventListener('input', renderMentorsGrid);
    }
    
    // Select today by default
    const today = new Date();
    selectDay(today.getDate(), today.getMonth(), today.getFullYear());
    
    // Setup navigation buttons
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
});