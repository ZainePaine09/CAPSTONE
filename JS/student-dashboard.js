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
    
    // Clear calendar days
    calendarDaysContainer.innerHTML = '';
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Add days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
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
    
    // Add days from next month
    const totalCells = calendarDaysContainer.children.length;
    const remainingCells = 42 - totalCells; // 6 rows × 7 days
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
    dayElement.textContent = day;
    
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
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
    for (let element of dayElements) {
        if (element.textContent.trim() === String(day) && !element.classList.contains('other-month')) {
            // Make sure we're in the right month by checking position
            const allDays = Array.from(dayElements);
            const elementIndex = allDays.indexOf(element);
            const firstDay = new Date(year, month, 1).getDay();
            const expectedIndex = firstDay + day - 1;
            
            // Add some tolerance for row boundaries
            if (Math.abs(elementIndex - expectedIndex) < 2) {
                element.classList.add('selected');
                break;
            }
        }
    }
    
    // Format date string
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    selectedDateElement.textContent = `${dayNames[dateObj.getDay()]}, ${monthNames[month]} ${day}`;
    
    // Show events for selected day
    displayEvents(dateStr);
}

/* ===========================
   DISPLAY EVENTS
   =========================== */

function displayEvents(dateStr) {
    const events = eventsList[dateStr] || [];
    
    if (events.length === 0) {
        dayEventsListElement.innerHTML = '<p class="no-events">No events scheduled</p>';
        return;
    }
    
    dayEventsListElement.innerHTML = events.map(event => `
        <div class="event-item-detail">
            <h4>${event.title}</h4>
            <p>🕐 ${event.time}</p>
            <p>📍 ${event.location}</p>
        </div>
    `).join('');
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
    const studentData = sessionStorage.getItem('studentEmail');
    if (studentData) {
        const firstName = studentData.split('@')[0].charAt(0).toUpperCase() + 
                         studentData.split('@')[0].slice(1);
        document.getElementById('userName').textContent = firstName;
    }
    
    // Render calendar on load
    renderCalendar();
    
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
    if (!navProfile.contains(e.target)) {
        // Profile menu will close due to CSS :hover state
    }
});
