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
    
    const targetNavLink = document.querySelector(`.nav-link[href="#${tabName}"]`);
    if (targetNavLink) {
        targetNavLink.classList.add('active');
    } else if (event && event.target) {
        event.target.classList.add('active');
    }
}

function activateTabFromHash() {
    const hashValue = window.location.hash.replace('#', '').toLowerCase();
    const validTabs = ['dashboard', 'events', 'mentors', 'jobs', 'materials', 'messages', 'alumni'];

    if (validTabs.includes(hashValue)) {
        switchTab(hashValue);
    } else {
        switchTab('dashboard');
    }
}

// ===========================
// LEARNING MATERIALS (FROM ADMIN)
// ===========================

function getStudentLearningMaterials() {
    return JSON.parse(localStorage.getItem('learningMaterials')) || [];
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

function getCurrentStudentProgram() {
    const sessionEmail = (sessionStorage.getItem('studentEmail') || '').trim();

    if (sessionEmail) {
        const studentByEmail = JSON.parse(localStorage.getItem('studentData_' + sessionEmail) || '{}');
        const byEmailProgram = studentByEmail.program || studentByEmail.degree || studentByEmail.major || '';
        const normalizedByEmailProgram = normalizeProgram(byEmailProgram);
        if (normalizedByEmailProgram && normalizedByEmailProgram !== 'all') {
            return normalizedByEmailProgram;
        }
    }

    const genericStudentData = JSON.parse(localStorage.getItem('studentData') || '{}');
    const genericProgram = genericStudentData.program || genericStudentData.degree || genericStudentData.major || '';
    const normalizedGenericProgram = normalizeProgram(genericProgram);
    if (normalizedGenericProgram && normalizedGenericProgram !== 'all') {
        return normalizedGenericProgram;
    }

    return '';
}

function renderStudentMaterials(filterText = '') {
    const materialsContainer = document.getElementById('studentMaterialsList');
    if (!materialsContainer) {
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
                <h3>${material.title}</h3>
                <div class="material-chip-group">
                    <span class="material-chip">${material.category}</span>
                    <span class="material-chip">${formatProgramLabel(material.targetProgram || material.program || 'all')}</span>
                </div>
            </div>
            <p class="material-description">${material.description}</p>
            <div class="material-meta">Published: ${new Date(material.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div class="material-actions">
                ${material.link ? `<a class="btn-info" href="${material.link}" target="_blank" rel="noopener noreferrer">🔗 Open Resource</a>` : '<span class="material-no-link">No external link provided</span>'}
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

    renderStudentMaterials();

    window.addEventListener('storage', function(event) {
        if (event.key === 'learningMaterials') {
            renderStudentMaterials(materialsSearch?.value || '');
        }
    });
}

function goToDashboard(event) {
    const currentPath = window.location.pathname.toLowerCase();
    const isDashboard = currentPath.endsWith('/studentdashboard.html') || currentPath.endsWith('studentdashboard.html');

    if (isDashboard) {
        event.preventDefault();
        window.location.reload();
    }
}

const STUDENT_MESSENGER_STORAGE_KEY = 'studentMessengerState';

const DEFAULT_STUDENT_MESSENGER_STATE = {
    activeConversationId: 'student-conv-1',
    conversations: [
        {
            id: 'student-conv-1',
            name: 'James Wilson',
            subtitle: 'Networking event',
            unread: 2,
            online: true,
            lastTime: '3m'
        },
        {
            id: 'student-conv-2',
            name: 'Sophia Anderson',
            subtitle: 'Job lead',
            unread: 1,
            online: true,
            lastTime: '16m'
        },
        {
            id: 'student-conv-3',
            name: 'Admin Office',
            subtitle: 'Career talk reminder',
            unread: 0,
            online: false,
            lastTime: '1h'
        },
        {
            id: 'student-conv-4',
            name: 'IT Support',
            subtitle: 'Portal notice',
            unread: 0,
            online: true,
            lastTime: '4h'
        }
    ],
    messages: {
        'student-conv-1': [
            { sender: 'them', text: 'Hey! Are you joining the networking event later?' },
            { sender: 'me', text: 'Yes, I already registered this morning.' }
        ],
        'student-conv-2': [
            { sender: 'them', text: 'I shared a job lead that might fit your profile.' },
            { sender: 'me', text: 'Thanks! I will check it after class.' }
        ],
        'student-conv-3': [
            { sender: 'them', text: 'Reminder: Career Talk starts at 3:00 PM today.' }
        ],
        'student-conv-4': [
            { sender: 'them', text: 'Portal update completed. Please refresh if needed.' }
        ]
    }
};

let studentQuickActiveConversationId = '';
let studentQuickCloseSuppressUntil = 0;
let studentMessengerFilter = 'all';

function ensureStudentMessengerState() {
    if (!localStorage.getItem(STUDENT_MESSENGER_STORAGE_KEY)) {
        localStorage.setItem(STUDENT_MESSENGER_STORAGE_KEY, JSON.stringify(DEFAULT_STUDENT_MESSENGER_STATE));
    }
}

function getStudentMessengerState() {
    ensureStudentMessengerState();
    const saved = JSON.parse(localStorage.getItem(STUDENT_MESSENGER_STORAGE_KEY) || '{}');

    return {
        activeConversationId: saved.activeConversationId || DEFAULT_STUDENT_MESSENGER_STATE.activeConversationId,
        conversations: Array.isArray(saved.conversations) ? saved.conversations : DEFAULT_STUDENT_MESSENGER_STATE.conversations,
        messages: saved.messages && typeof saved.messages === 'object' ? saved.messages : DEFAULT_STUDENT_MESSENGER_STATE.messages
    };
}

function saveStudentMessengerState(state) {
    localStorage.setItem(STUDENT_MESSENGER_STORAGE_KEY, JSON.stringify(state));
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
        <button class="student-conversation-item ${state.activeConversationId === item.id ? 'active' : ''}" data-conversation-id="${item.id}">
            <div class="student-conversation-avatar-wrap">
                <div class="student-conversation-avatar">${getStudentConversationInitials(item.name)}</div>
                ${item.online ? '<span class="student-conversation-online"></span>' : ''}
            </div>
            <div class="student-conversation-meta">
                <div class="student-conversation-top">
                    <strong>${item.name}</strong>
                    <span>${item.lastTime || ''}</span>
                </div>
                <div class="student-conversation-subline">
                    <span>${item.subtitle}</span>
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
        <div class="student-chat-bubble ${message.sender === 'me' ? 'mine' : 'theirs'}">${message.text}</div>
    `).join('');

    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function selectStudentConversation(conversationId) {
    const state = getStudentMessengerState();
    const conversation = state.conversations.find(item => item.id === conversationId);

    if (!conversation) {
        return;
    }

    state.activeConversationId = conversationId;
    conversation.unread = 0;
    studentQuickActiveConversationId = conversationId;
    saveStudentMessengerState(state);

    initUnreadBadge();
    renderStudentConversationList();
    renderStudentChatPanel();

    const quickSearch = document.getElementById('quickMessageSearch')?.value || '';
    renderQuickMessagesPreview(quickSearch);
    renderQuickThreadPreview(conversationId);
}

function sendStudentMessage(event) {
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

    renderStudentConversationList();
    renderStudentChatPanel();
}

function openMessagesQuick(event) {
    if (event) {
        event.stopPropagation();
    }

    closeAiQuick();

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

function setUnreadBadgeCount(count) {
    const badge = document.getElementById('floatingUnreadBadge');
    if (!badge) {
        return;
    }

    const safeCount = Math.max(0, Number(count) || 0);
    badge.textContent = safeCount > 99 ? '99+' : String(safeCount);
    badge.style.display = safeCount > 0 ? 'flex' : 'none';
    localStorage.setItem('studentUnreadMessages', String(safeCount));
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
            <button class="quick-message-item ${studentQuickActiveConversationId === item.id ? 'active' : ''}" onclick="selectStudentQuickConversation(event, '${item.id}')">
                <div class="quick-message-avatar-wrap">
                    <div class="quick-message-avatar">${getStudentConversationInitials(item.name)}</div>
                    ${item.online ? '<span class="quick-message-online-dot"></span>' : ''}
                </div>
                <div class="quick-message-body">
                    <div class="quick-message-row">
                        <div class="quick-message-name">${item.name}</div>
                        <div class="quick-message-time">${item.lastTime || ''}</div>
                    </div>
                    <div class="quick-message-row">
                        <div class="quick-message-text">${preview}</div>
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
            <strong>${conversation.name}</strong>
            <span>${conversation.online ? 'Active now' : 'Offline'}</span>
        </div>
        <div class="quick-thread-body">
            ${recentMessages.length ? recentMessages.map(message => `
                <div class="quick-thread-bubble ${message.sender === 'me' ? 'mine' : 'theirs'}">${message.text}</div>
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
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
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

let eventsDatabase = {};

function getAdminAnnouncementEvents() {
    const announcements = JSON.parse(localStorage.getItem('announcementsData') || '{}');
    const events = [];

    Object.entries(announcements).forEach(([dateKey, list]) => {
        if (!Array.isArray(list)) {
            return;
        }

        list.forEach((item, index) => {
            const id = `ANN_${item.id || `${dateKey}_${index}`}`;
            const date = item.date || dateKey;
            const type = String(item.type || 'General').trim();
            const time = String(item.time || 'TBA').trim();

            events.push({
                id,
                title: item.title || 'Untitled Event',
                date,
                time,
                location: item.location || 'Admin Announcement',
                type,
                description: item.description || item.details || 'No description provided',
                details: item.details || item.description || 'No additional details provided',
                image: '📢'
            });
        });
    });

    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return events;
}

function refreshStudentEventsData() {
    const events = getAdminAnnouncementEvents();
    eventsDatabase = events.reduce((acc, event) => {
        acc[event.id] = event;
        return acc;
    }, {});
    syncCalendarEventsFromDatabase();
    return events;
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

    const allEvents = refreshStudentEventsData();
    const filteredEvents = allEvents.filter(event => {
        const matchesSearch = !searchValue ||
            event.title.toLowerCase().includes(searchValue) ||
            event.description.toLowerCase().includes(searchValue) ||
            event.type.toLowerCase().includes(searchValue);

        const normalizedType = normalizeEventTypeForFilter(event.type);
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
                <div class="event-image">${event.image}</div>
                <div class="event-header">
                    <h3>${event.title}</h3>
                    <span class="event-badge">${normalizeEventTypeForFilter(event.type)}</span>
                </div>
                <div class="event-details">
                    <p><strong>📅 Date:</strong> ${formatEventDateLabel(event.date)}</p>
                    <p><strong>🕐 Time:</strong> ${event.time}</p>
                    <p><strong>📍 Type:</strong> ${event.type}</p>
                    <p class="event-description">${event.description}</p>
                </div>
                <div class="event-actions">
                    <button class="btn-register" onclick="registerEvent('${event.id}')">✓ Register</button>
                    <button class="btn-info" onclick="viewEventDetails('${event.id}')">ℹ️ Details</button>
                </div>
            </div>
        `).join('');
    }

    if (registeredList) {
        const registeredIds = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
        const registeredEvents = registeredIds
            .map(id => eventsDatabase[id])
            .filter(Boolean);

        if (!registeredEvents.length) {
            registeredList.innerHTML = '<p class="no-events">No registered events yet.</p>';
        } else {
            registeredList.innerHTML = registeredEvents.map(event => `
                <div class="registered-item">
                    <div class="item-info">
                        <h4>${event.title}</h4>
                        <p>${formatEventDateLabel(event.date)} • ${event.time}</p>
                    </div>
                    <button class="btn-unregister" onclick="unregisterEvent('${event.id}')">Unregister</button>
                </div>
            `).join('');
        }
    }
}

const mentorsDatabase = {
    'mentor1': {
        name: 'Dr. Sarah Johnson',
        title: 'Senior Product Manager',
        company: 'Tech Corp',
        expertise: 'Product Management, Strategy',
        bio: 'Helping students navigate tech careers with hands-on insights'
    },
    'mentor2': {
        name: 'Michael Chen',
        title: 'Lead Software Engineer',
        company: 'Google',
        expertise: 'Full Stack Development, System Design',
        bio: 'Passionate about mentoring future engineers'
    },
    'mentor3': {
        name: 'Prof. Lisa Williams',
        title: 'Director of Career Services',
        company: 'University',
        expertise: 'Career Planning, Interview Prep',
        bio: 'Dedicated to student career success'
    },
    'mentor4': {
        name: 'David Martinez',
        title: 'Startup Founder',
        company: 'InnovateTech',
        expertise: 'Entrepreneurship, Startup Growth',
        bio: 'Building the next generation of leaders'
    }
};

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

const alumniDatabase = {
    'alumni1': {
        name: 'John Smith',
        year: '2020',
        title: 'Senior Engineer',
        company: 'Google',
        industry: 'Technology',
        location: 'San Francisco',
        avatar: '👨‍💼'
    },
    'alumni2': {
        name: 'Emma Johnson',
        year: '2021',
        title: 'Product Manager',
        company: 'Microsoft',
        industry: 'Technology',
        location: 'Seattle',
        avatar: '👩‍💼'
    },
    'alumni3': {
        name: 'Alex Kumar',
        year: '2019',
        title: 'Consultant',
        company: 'McKinsey',
        industry: 'Consulting',
        location: 'New York',
        avatar: '👨‍💻'
    },
    'alumni4': {
        name: 'Sofia Garcia',
        year: '2022',
        title: 'Marketing Manager',
        company: 'Amazon',
        industry: 'Technology',
        location: 'Seattle',
        avatar: '👩‍💻'
    }
};

/* ===========================
   EVENT HANDLERS - EVENTS TAB
   =========================== */

function registerEvent(eventId) {
    const event = eventsDatabase[eventId];
    if (event) {
        showNotification('Success!', `You registered for: ${event.title}`);
        // Add to localStorage
        let registeredEvents = JSON.parse(localStorage.getItem('registeredEvents')) || [];
        if (!registeredEvents.includes(eventId)) {
            registeredEvents.push(eventId);
            localStorage.setItem('registeredEvents', JSON.stringify(registeredEvents));
        }
        renderStudentEventsTab();
    }
}

function unregisterEvent(eventId) {
    const confirmDelete = confirm('Are you sure you want to unregister from this event?');
    if (confirmDelete) {
        let registeredEvents = JSON.parse(localStorage.getItem('registeredEvents')) || [];
        registeredEvents = registeredEvents.filter(id => id !== eventId);
        localStorage.setItem('registeredEvents', JSON.stringify(registeredEvents));
        showNotification('Success!', 'You unregistered from the event');
        renderStudentEventsTab();
    }
}

function viewEventDetails(eventId) {
    const event = eventsDatabase[eventId];
    if (event) {
        showNotification('Event Details', `${event.title}\nDate: ${formatEventDateLabel(event.date)}\nTime: ${event.time}\nType: ${event.type}`);
    }
}

/* ===========================
   EVENT HANDLERS - MENTORS TAB
   =========================== */

function connectMentor(mentorId) {
    const mentor = mentorsDatabase[mentorId];
    if (mentor) {
        showNotification('Success!', `Mentorship request sent to ${mentor.name}`);
        
        // Save to localStorage
        let mentorRequests = JSON.parse(localStorage.getItem('mentorRequests')) || [];
        if (!mentorRequests.includes(mentorId)) {
            mentorRequests.push(mentorId);
            localStorage.setItem('mentorRequests', JSON.stringify(mentorRequests));
        }
    }
}

function viewMentorProfile(mentorId) {
    const mentor = mentorsDatabase[mentorId];
    if (mentor) {
        showNotification('Mentor Profile', `${mentor.name}\n${mentor.title} at ${mentor.company}\nExpertise: ${mentor.expertise}`);
    }
}

function startChat(mentorId) {
    const mentor = mentorsDatabase[mentorId];
    if (mentor) {
        showNotification('Chat Started', `Opening chat with ${mentor.name}...`);
    }
}

/* ===========================
   EVENT HANDLERS - JOBS TAB
   =========================== */

function applyJob(jobId) {
    const job = jobsDatabase[jobId];
    if (job) {
        showNotification('Success!', `Your application for ${job.title} at ${job.company} has been submitted!`);
        
        // Save to localStorage
        let appliedJobs = JSON.parse(localStorage.getItem('appliedJobs')) || [];
        if (!appliedJobs.includes(jobId)) {
            appliedJobs.push(jobId);
            localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
        }
    }
}

function saveJob(jobId) {
    const job = jobsDatabase[jobId];
    if (job) {
        showNotification('Success!', `${job.title} saved to your list`);
        
        // Save to localStorage
        let savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
        if (!savedJobs.includes(jobId)) {
            savedJobs.push(jobId);
            localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
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

function connectAlumni(alumniId) {
    const alumni = alumniDatabase[alumniId];
    if (alumni) {
        showNotification('Success!', `Connection request sent to ${alumni.name}`);
        
        // Save to localStorage
        let alumniConnections = JSON.parse(localStorage.getItem('alumniConnections')) || [];
        if (!alumniConnections.includes(alumniId)) {
            alumniConnections.push(alumniId);
            localStorage.setItem('alumniConnections', JSON.stringify(alumniConnections));
        }
    }
}

function messageAlumni(alumniId) {
    const alumni = alumniDatabase[alumniId];
    if (alumni) {
        showNotification('Message', `Opening message dialog with ${alumni.name}...`);
    }
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
            <span class="toast-title">${title}</span>
        </div>
        <div class="toast-message">${message}</div>
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
const calendarDaysContainer = document.getElementById('calendarDays');
const monthYearElement = document.getElementById('monthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectedDateElement = document.getElementById('selectedDate');
const dayEventsListElement = document.getElementById('dayEventsList');
let selectedDayTimeout = null;
const DEFAULT_DASHBOARD_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='100' fill='%234f46e5'/%3E%3Ctext x='100' y='120' font-size='80' fill='white' text-anchor='middle'%3E👤%3C/text%3E%3C/svg%3E";

function populateDashboardUserProfile() {
    const storedData = JSON.parse(localStorage.getItem('studentData') || '{}');
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

function linkGmailFromDashboard(event) {
    if (event) {
        event.preventDefault();
    }

    const sessionEmail = (sessionStorage.getItem('studentEmail') || '').trim().toLowerCase();
    const currentData = JSON.parse(localStorage.getItem('studentData') || '{}');
    const existingGmail = String(currentData.gmailAddress || '').trim().toLowerCase();

    const input = prompt('Enter Gmail address to link (demo):', existingGmail || '');
    const gmail = String(input || '').trim().toLowerCase();

    if (!gmail) {
        showNotification('Gmail', 'Linking cancelled.', 'info');
        return;
    }

    if (!/^[^\s@]+@gmail\.com$/.test(gmail)) {
        showNotification('Gmail', 'Please enter a valid Gmail address ending in @gmail.com.', 'error');
        return;
    }

    const updatedCurrentData = {
        ...currentData,
        gmailAddress: gmail,
        authProvider: 'gmail-demo',
        gmailLinkedAt: new Date().toISOString()
    };

    localStorage.setItem('studentData', JSON.stringify(updatedCurrentData));

    const sourceEmail = sessionEmail || String(updatedCurrentData.email || '').trim().toLowerCase();
    if (sourceEmail) {
        const keyedData = JSON.parse(localStorage.getItem('studentData_' + sourceEmail) || '{}');
        localStorage.setItem(
            'studentData_' + sourceEmail,
            JSON.stringify({
                ...keyedData,
                ...updatedCurrentData,
                email: keyedData.email || updatedCurrentData.email || sourceEmail
            })
        );
    }

    showNotification('Gmail Linked', `${gmail} is now linked to your student profile (demo).`, 'success');
}

let eventsList = {};

function syncCalendarEventsFromDatabase() {
    const mapped = {};

    Object.values(eventsDatabase).forEach(event => {
        const key = String(event.date || '').slice(0, 10);
        if (!key) {
            return;
        }

        if (!mapped[key]) {
            mapped[key] = [];
        }

        mapped[key].push({
            title: event.title,
            time: event.time,
            location: event.type || 'Announcement'
        });
    });

    eventsList = mapped;
}

/* ===========================
   RENDER CALENDAR
   =========================== */

function renderCalendar() {
    refreshStudentEventsData();

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
            <h4>${event.title}</h4>
            <p>🕐 ${event.time}</p>
            <p>📍 ${event.location}</p>
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
});

/* ===========================
   INITIALIZATION
   =========================== */

// Make sure DOM is loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    if (!calendarDaysContainer) {
        console.error('Calendar elements not found');
        return;
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
    
    // Render calendar on load
    renderCalendar();

    renderStudentEventsTab();

    const eventSearch = document.getElementById('eventSearch');
    if (eventSearch) {
        eventSearch.addEventListener('input', renderStudentEventsTab);
    }

    const eventFilter = document.getElementById('eventFilter');
    if (eventFilter) {
        eventFilter.addEventListener('change', renderStudentEventsTab);
    }

    window.addEventListener('storage', function(event) {
        if (event.key === 'announcementsData') {
            renderStudentEventsTab();
            renderCalendar();
        }
    });
    
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