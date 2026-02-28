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
    const validTabs = ['dashboard', 'events', 'mentors', 'jobs', 'messages', 'alumni'];

    if (validTabs.includes(hashValue)) {
        switchTab(hashValue);
    } else {
        switchTab('dashboard');
    }
}

function goToDashboard(event) {
    const currentPath = window.location.pathname.toLowerCase();
    const isDashboard = currentPath.endsWith('/studentdashboard.html') || currentPath.endsWith('studentdashboard.html');

    if (isDashboard) {
        event.preventDefault();
        window.location.reload();
    }
}

function openMessagesQuick() {
    const popup = document.getElementById('quickMessagePopup');
    if (!popup) {
        return;
    }

    const willOpen = !popup.classList.contains('active');
    popup.classList.toggle('active', willOpen);
    popup.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

    if (willOpen) {
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
    const storedCount = localStorage.getItem('studentUnreadMessages');
    const initialCount = storedCount === null ? 3 : Number(storedCount);
    setUnreadBadgeCount(initialCount);
}

function initQuickMessagesPopup() {
    const quickMessageList = document.getElementById('quickMessageList');
    if (!quickMessageList) {
        return;
    }

    const quickMessages = [
        { name: 'James Wilson', text: 'Hey! Are you joining the networking event later?' },
        { name: 'Sophia Anderson', text: 'I shared a job lead that might fit your profile.' },
        { name: 'Admin Office', text: 'Reminder: Career Talk starts at 3:00 PM today.' }
    ];

    quickMessageList.innerHTML = quickMessages.map(message => {
        const avatar = message.name
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        return `
            <div class="quick-message-item" onclick="openMessagesTabFromPopup()">
                <div class="quick-message-avatar">${avatar}</div>
                <div class="quick-message-body">
                    <div class="quick-message-name">${message.name}</div>
                    <div class="quick-message-text">${message.text}</div>
                </div>
            </div>
        `;
    }).join('');
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
    } else if (program === 'bsemc') {
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

/* ===========================
   EVENTS DATABASE
   =========================== */

const eventsDatabase = {
    'EV001': { 
        title: 'AI in Career Development', 
        time: '2:00 PM - 3:30 PM',
        date: 'Feb 28, 2026',
        location: 'Virtual',
        image: '🤖'
    },
    'EV002': { 
        title: 'Networking Mixer', 
        time: '6:00 PM - 8:00 PM',
        date: 'Mar 5, 2026',
        location: 'Student Center',
        image: '🤝'
    },
    'EV003': { 
        title: 'Career Skills Workshop', 
        time: '3:00 PM - 4:30 PM',
        date: 'Mar 10, 2026',
        location: 'Room 205',
        image: '💼'
    },
    'EV004': { 
        title: 'Alumni Mentorship Panel', 
        time: '7:00 PM - 8:30 PM',
        date: 'Mar 15, 2026',
        location: 'Virtual',
        image: '👥'
    }
};

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
    }
}

function unregisterEvent(eventId) {
    const confirmDelete = confirm('Are you sure you want to unregister from this event?');
    if (confirmDelete) {
        let registeredEvents = JSON.parse(localStorage.getItem('registeredEvents')) || [];
        registeredEvents = registeredEvents.filter(id => id !== eventId);
        localStorage.setItem('registeredEvents', JSON.stringify(registeredEvents));
        showNotification('Success!', 'You unregistered from the event');
    }
}

function viewEventDetails(eventId) {
    const event = eventsDatabase[eventId];
    if (event) {
        showNotification('Event Details', `${event.title}\nDate: ${event.date}\nTime: ${event.time}\nLocation: ${event.location}`);
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

// Sample events data (can be replaced with API calls)
const eventsList = {
    '2026-02-15': [
        { title: 'Alumni Career Talk', time: '10:00 AM', location: 'Virtual' },
        { title: 'Networking Session', time: '2:00 PM', location: 'Room 101' }
    ],
    '2026-02-18': [
        { title: 'Networking Mixer', time: '6:00 PM', location: 'Student Center' }
    ],
    '2026-02-22': [
        { title: 'Skills Workshop', time: '2:00 PM', location: 'Room 205' }
    ],
    '2026-02-25': [
        { title: 'AI in Career Development', time: '4:00 PM', location: 'Online' },
        { title: 'Mentorship Matching', time: '7:00 PM', location: 'Virtual' }
    ]
};

/* ===========================
   RENDER CALENDAR
   =========================== */

function renderCalendar() {
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

    // Keep highlight temporary, then clear automatically
    if (selectedDayTimeout) {
        clearTimeout(selectedDayTimeout);
    }

    selectedDayTimeout = setTimeout(() => {
        clearSelectedDay();
    }, 1800);
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
   MONTH NAVIGATION
   =========================== */

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

/* ===========================
   DISPLAY USER NAME
   =========================== */

window.addEventListener('load', function() {
    populateDashboardUserProfile();
    
    // Render calendar on load
    renderCalendar();

    // Activate tab from URL hash (supports links from profile page)
    activateTabFromHash();
    
    // Select today by default
    const today = new Date();
    selectDay(today.getDate(), today.getMonth(), today.getFullYear());
});

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
    if (
        quickPopup && quickButton &&
        !quickPopup.contains(e.target) &&
        !quickButton.contains(e.target)
    ) {
        closeQuickMessages();
    }

    const quickAiPopup = document.getElementById('quickAiPopup');
    const quickAiButton = document.querySelector('.floating-ai-btn');
    if (
        quickAiPopup && quickAiButton &&
        !quickAiPopup.contains(e.target) &&
        !quickAiButton.contains(e.target)
    ) {
        closeAiQuick();
    }
});

/* ===========================
   INITIALIZATION
   =========================== */

// Make sure DOM is loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    // Get calendar elements
    calendarDaysContainer = document.getElementById('calendarDays');
    monthYearElement = document.getElementById('monthYear');
    prevMonthBtn = document.getElementById('prevMonth');
    nextMonthBtn = document.getElementById('nextMonth');
    selectedDateElement = document.getElementById('selectedDate');
    dayEventsListElement = document.getElementById('dayEventsList');
    
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

    // Populate user profile details
    populateDashboardUserProfile();
    
    // Render calendar on load
    renderCalendar();
    
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