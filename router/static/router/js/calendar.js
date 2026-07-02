function syncColorPicker() {
    const picker = document.getElementById('day-color-picker');
    if (!picker) return;
    
    if (trip.currentDayIndex !== -1 && trip.days[trip.currentDayIndex]) {
        const day = trip.days[trip.currentDayIndex];
        picker.value = day.color || '#000000';
    } else {
        picker.value = '#000000';
    }
}

function switchTab(tab) {
    const cal = document.getElementById('calendar-container');
    const list = document.getElementById('days-list');
    const btns = document.querySelectorAll('.tab-btn');
    const details = document.getElementById('day-details');
    
    if (tab === 'calendar') {
        cal.classList.remove('hidden');
        list.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
        if (details) details.classList.add('hidden');
    } else {
        cal.classList.add('hidden');
        list.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        if (details && trip.currentDayIndex !== -1) {
            details.classList.remove('hidden');
        }
    }
}

function handleDateClick(dateStr) {
    selectedCalendarDate = dateStr;
    
    // Find if day already exists
    let dayIndex = trip.days.findIndex(d => d.date === dateStr);
    
    if (dayIndex !== -1) {
        trip.currentDayIndex = dayIndex;
    } else {
        trip.currentDayIndex = -1; // Pending creation
    }
    
    renderDaysList();
    renderCalendar();
    syncColorPicker();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthYearLabel = document.getElementById('calendar-month-year');
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
                        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    monthYearLabel.innerText = `${monthNames[month]} ${year}`;
    
    grid.innerHTML = '';
    
    // Days of week
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    daysOfWeek.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-day-name';
        div.innerText = day;
        grid.appendChild(div);
    });
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Adjust for Monday start (JS getDay: 0=Sun, 1=Mon...)
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    
    // Empty slots for previous month
    for (let i = 0; i < offset; i++) {
        grid.appendChild(document.createElement('div'));
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const div = document.createElement('div');
        div.className = 'calendar-day';
        
        const numDiv = document.createElement('div');
        numDiv.className = 'day-number';
        numDiv.innerText = day;
        div.appendChild(numDiv);

        const tripDayIndex = trip.days.findIndex(d => d.date === dateStr);
        const tripDay = trip.days[tripDayIndex];
        if (tripDay) {
            const color = tripDay.color || '#000000';
            div.style.color = color;
            
            const distDiv = document.createElement('div');
            distDiv.className = 'day-distance';
            const dist = (tripDay.distance || 0) / 1000;
            distDiv.innerText = dist.toFixed(1);
            
            div.appendChild(distDiv);
        }
        
        if (dateStr === today) div.classList.add('today');
        if (dateStr === selectedCalendarDate) div.classList.add('selected');
        
        // Check if this date is part of the trip
        if (trip.days.some(d => d.date === dateStr)) {
            div.classList.add('has-trip');
        }
        
        div.onclick = () => {
            handleDateClick(dateStr);
        };
        
        grid.appendChild(div);
    }
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    renderCalendar();
}
