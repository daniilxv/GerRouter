function renderDaysList() {
    const listDiv = document.getElementById('days-list');
    listDiv.innerHTML = '';

    trip.days.forEach((day, index) => {
        const item = document.createElement('div');
        item.className = 'day-item' + (index === trip.currentDayIndex ? ' active' : '');
        item.onclick = () => selectDay(index);

        const colorDiv = document.createElement('div');
        colorDiv.className = 'day-color';
        colorDiv.style.backgroundColor = day.color || '#000000';

        const distKm = (day.distance / 1000).toFixed(2);
        const dateText = day.date ? day.date : 'Без даты';
        const text = document.createTextNode(dateText + ' (' + day.points.length + ' точек, ' + distKm + ' км)');

        item.appendChild(colorDiv);
        item.appendChild(text);
        listDiv.appendChild(item);
    });
}

function selectDay(index) {
    trip.currentDayIndex = index;
    const day = trip.days[index];
    if (day && day.date) {
        selectedCalendarDate = day.date;
    }
    
    // Initialize selectedPoints if not present
    if (day && !day.selectedPoints) {
        day.selectedPoints = [];
    }
    
    // Show day details and populate comments only if list tab is active
    const detailsPanel = document.getElementById('day-details');
    const listContainer = document.getElementById('days-list');
    if (detailsPanel && listContainer && !listContainer.classList.contains('hidden')) {
        detailsPanel.classList.remove('hidden');
        const commentInput = document.getElementById('day-comment');
        if (commentInput) {
            commentInput.value = day ? (day.comment || '') : '';
            commentInput.oninput = (e) => {
                if (day) day.comment = e.target.value;
            };
        }
        renderPointsComments();
    }
    
    syncColorPicker();
    renderDaysList();
    renderCalendar();
}

function renderPointsComments() {
    const list = document.getElementById('points-comments-list');
    if (!list) return;
    
    list.innerHTML = '';
    const day = trip.days[trip.currentDayIndex];
    if (!day) return;
    
    day.points.forEach((point, index) => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '2px';
        container.style.paddingBottom = '8px';
        container.style.borderBottom = '1px solid #eee';
        container.style.marginBottom = '8px';
        
        const label = document.createElement('label');
        label.style.fontSize = '0.75em';
        label.style.color = '#666';
        label.innerText = `Точка ${index + 1}:`;
        
        const input = document.createElement('textarea');
        input.style.padding = '4px';
        input.style.fontSize = '0.85em';
        input.style.borderRadius = '4px';
        input.style.border = '1px solid #ccc';
        input.style.resize = 'vertical';
        input.style.minHeight = '40px';
        
        // Handle point as object {lon, lat, comment} or array [lon, lat]
        const isObj = (typeof point === 'object' && !Array.isArray(point));
        const pointComment = isObj ? point.comment : '';
        input.value = pointComment || '';
        
        input.oninput = (e) => {
            if (isObj) {
                point.comment = e.target.value;
            } else {
                // Convert point from array to object to store comment
                const lon = point[0];
                const lat = point[1];
                trip.days[trip.currentDayIndex].points[index] = { lon, lat, comment: e.target.value };
            }
        };

        const refuelContainer = document.createElement('div');
        refuelContainer.style.display = 'flex';
        refuelContainer.style.alignItems = 'center';
        refuelContainer.style.gap = '5px';
        refuelContainer.style.fontSize = '0.8em';
        refuelContainer.style.marginTop = '4px';

        const refuelCheckbox = document.createElement('input');
        refuelCheckbox.type = 'checkbox';
        refuelCheckbox.id = `refuel-${trip.currentDayIndex}-${index}`;
        
        const isRefuel = isObj ? point.isRefuel : false;
        refuelCheckbox.checked = isRefuel;

        refuelCheckbox.onchange = (e) => {
            if (isObj) {
                point.isRefuel = e.target.checked;
            } else {
                const lon = point[0];
                const lat = point[1];
                trip.days[trip.currentDayIndex].points[index] = { lon, lat, comment: point.comment || '', isRefuel: e.target.checked };
            }
            updateRoute();
        };

        const refuelLabel = document.createElement('label');
        refuelLabel.htmlFor = refuelCheckbox.id;
        refuelLabel.innerText = 'Заправка';
        refuelLabel.style.cursor = 'pointer';

        refuelContainer.appendChild(refuelCheckbox);
        refuelContainer.appendChild(refuelLabel);
        
        container.appendChild(label);
        container.appendChild(input);
        container.appendChild(refuelContainer);
        list.appendChild(container);
    });
}

function clearTrip() {
    trip.id = null;
    trip.days = [];
    trip.currentDayIndex = -1;
    renderDaysList();
    updateRoute();
}

function updateUI() {
    updateTotalDistance();
    renderDaysList();
    renderCalendar();
}

// Side panel resizing logic
document.addEventListener('DOMContentLoaded', () => {
    const panel = document.querySelector('.info-panel');
    const resizer = document.querySelector('.info-panel-resizer');

    if (panel && resizer) {
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            const startX = e.clientX;
            const startWidth = panel.offsetWidth;

            const onMouseMove = (moveEvent) => {
                const newWidth = startWidth + (moveEvent.clientX - startX);
                panel.style.width = `${newWidth}px`;
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }
});
