// Calendar state
let currentCalendarDate = new Date();
let selectedCalendarDate = new Date().toISOString().split('T')[0];

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
    
    if (tab === 'calendar') {
        cal.classList.remove('hidden');
        list.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        cal.classList.add('hidden');
        list.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
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

// Layers definition
const layers = {
    osm: new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: true
    }),
    satellite: new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        }),
        visible: false
    }),
    hybrid: new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        }),
        visible: false
    }),
    terrain: new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png'
        }),
        visible: false
    })
};

// Map initialization
const map = new ol.Map({
    target: 'map',
    layers: Object.values(layers),
    view: new ol.View({
        center: ol.proj.fromLonLat([37.6173, 55.7558]),
        zoom: 10
    })
});

function toggleLayerMenu() {
    const menu = document.getElementById('layer-menu');
    menu.classList.toggle('open');
}

function setLayer(layerId) {
    // Set all layers to invisible
    Object.keys(layers).forEach(id => {
        layers[id].setVisible(false);
    });
    
    // Set selected layer to visible
    layers[layerId].setVisible(true);
    
    // Update active class in menu
    const options = document.querySelectorAll('.layer-option');
    options.forEach(opt => {
        opt.classList.remove('active');
        if (opt.innerText.includes(getLayerName(layerId))) {
            opt.classList.add('active');
        }
    });
    
    // Close menu
    toggleLayerMenu();
}

function getLayerName(id) {
    const names = {
        osm: 'Стандартная',
        satellite: 'Спутник',
        hybrid: 'Гибрид',
        terrain: 'Рельеф'
    };
    return names[id];
}

// Helper to get coordinates from a point (which can be [lon, lat] or {lon, lat, ...})
function getCoords(point) {
    if (Array.isArray(point)) return point;
    if (point && typeof point === 'object') return [point.lon, point.lat];
    return [0, 0];
}

// Vector source for markers and routes
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});
map.addLayer(vectorLayer);

// Popup for point details
const popupElement = document.getElementById('point-popup');
const popupOverlay = new ol.Overlay({
    element: popupElement,
    autoPan: true,
    autoPanAnimation: 'handleAxis'
});
map.addOverlay(popupOverlay);

// Popup elements
const popupPointLabel = document.getElementById('popup-point-label');
const popupComment = document.getElementById('popup-comment');
const popupRefuel = document.getElementById('popup-refuel');
const popupClose = document.getElementById('popup-close');

let currentPopupPoint = null; // { dayIndex, pointIndex }

popupClose.onclick = () => {
    popupElement.classList.add('hidden');
    popupOverlay.setPosition(undefined);
    currentPopupPoint = null;
};

popupComment.oninput = (e) => {
    if (currentPopupPoint) {
        const { dayIndex, pointIndex } = currentPopupPoint;
        const point = trip.days[dayIndex].points[pointIndex];
        if (typeof point === 'object' && !Array.isArray(point)) {
            point.comment = e.target.value;
        } else {
            const [lon, lat] = point;
            trip.days[dayIndex].points[pointIndex] = { lon, lat, comment: e.target.value, isRefuel: false };
        }
        updateRoute();
        renderPointsComments();
    }
};

popupRefuel.onchange = (e) => {
    if (currentPopupPoint) {
        const { dayIndex, pointIndex } = currentPopupPoint;
        const point = trip.days[dayIndex].points[pointIndex];
        if (typeof point === 'object' && !Array.isArray(point)) {
            point.isRefuel = e.target.checked;
        } else {
            const [lon, lat] = point;
            const comment = (typeof point === 'object' && !Array.isArray(point)) ? point.comment : '';
            trip.days[dayIndex].points[pointIndex] = { lon, lat, comment: comment, isRefuel: e.target.checked };
        }
        updateRoute();
        updateMarkersStyle();
        renderPointsComments();
    }
};

map.on('singleclick', (event) => {
    map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const dayIndex = feature.get('dayIndex');
        const pointIndex = feature.get('pointIndex');

        if (dayIndex !== undefined && pointIndex !== undefined) {
            const day = trip.days[dayIndex];
            const point = day.points[pointIndex];
            
            currentPopupPoint = { dayIndex, pointIndex };
            
            popupPointLabel.innerText = `Точка ${pointIndex + 1} (День ${dayIndex + 1})`;
            
            const isObj = (typeof point === 'object' && !Array.isArray(point));
            popupComment.value = isObj ? (point.comment || '') : '';
            popupRefuel.checked = isObj ? (point.isRefuel || false) : false;
            
            popupElement.classList.remove('hidden');
            popupOverlay.setPosition(event.coordinate);
            
            return true; // Stop searching
        }
    });
});

const DAY_COLORS = [
    '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
    '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
    '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
];

function getColorForIndex(index) {
    return DAY_COLORS[index % DAY_COLORS.length];
}

var trip = {
    id: null,
    currentDayIndex: -1,
    days: [],
    selectedPoints: []
};


async function updateSegmentDistance() {
    const distDiv = document.getElementById('segment-distance');
    if (!distDiv) return;
    
    if (trip.selectedPoints.length < 2) {
        distDiv.innerText = 'Отрезок: 0 км';
        return;
    }
    
    distDiv.innerText = 'Отрезок: расчет...';
    
    // Sort selected points by their position in the overall route
    const sortedSelected = [...trip.selectedPoints].sort((a, b) => {
        if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
        return a.pointIndex - b.pointIndex;
    });
    
    const start = sortedSelected[0];
    const end = sortedSelected[1];
    
    const routePoints = [];
    for (let dIdx = start.dayIndex; dIdx <= end.dayIndex; dIdx++) {
        const day = trip.days[dIdx];
        if (!day) continue;
        
        let startPt = 0;
        if (dIdx === start.dayIndex) startPt = start.pointIndex;
        
        let endPt = day.points.length;
        if (dIdx === end.dayIndex) endPt = end.pointIndex + 1;
        
        routePoints.push(...day.points.slice(startPt, endPt));
    }
    
    if (routePoints.length < 2) {
        distDiv.innerText = 'Отрезок: 0 км';
        return;
    }
    
    const coords = routePoints.map(p => getCoords(p).join(',')).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
            const distKm = (data.routes[0].distance / 1000).toFixed(2);
            distDiv.innerText = `Отрезок: ${distKm} км`;
        } else {
            distDiv.innerText = 'Отрезок: ошибка расчета';
        }
    } catch (e) {
        console.error('Segment distance error:', e);
        distDiv.innerText = 'Отрезок: ошибка сети';
    }
}

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
    
    // Show day details and populate comments
    const detailsPanel = document.getElementById('day-details');
    if (detailsPanel) {
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

function removeWaypoint(dayIndex, pointIndex) {
    const day = trip.days[dayIndex];
    day.points.splice(pointIndex, 1);
    
    // Update selected points indices
    if (day.selectedPoints) {
        day.selectedPoints = day.selectedPoints.filter(idx => idx !== pointIndex).map(idx => idx > pointIndex ? idx - 1 : idx);
    }
    
    renderDaysList();
    updateSegmentDistance();
    updateRoute();
}

function updateTotalDistance() {
    const totalMeters = trip.days.reduce((sum, day) => sum + (day.distance || 0), 0);
    const totalKm = (totalMeters / 1000).toFixed(2);
    document.getElementById('total-distance').innerText = 'Общий путь: ' + totalKm + ' км';
}

function updateUI() {
    updateTotalDistance();
    renderDaysList();
    renderCalendar();
}

function updateMarkersStyle() {
    vectorSource.getFeatures().forEach(feature => {
        const dayIndex = feature.get('dayIndex');
        const pointIndex = feature.get('pointIndex');
        
        if (dayIndex !== undefined && pointIndex !== undefined) {
            const day = trip.days[dayIndex];
            const color = day ? (day.color || '#000000') : '#000000';
            const isSelected = trip.selectedPoints.some(p => p.dayIndex === dayIndex && p.pointIndex === pointIndex);
            
            const point = day.points[pointIndex];
            const isRefuel = (typeof point === 'object' && !Array.isArray(point)) ? point.isRefuel : false;
            
            let markerStyle = {
                radius: isSelected ? 8 : 6,
                fillColor: color,
                strokeColor: isSelected ? 'yellow' : 'white',
                strokeWidth: isSelected ? 3 : 2
            };

            if (isRefuel) {
                feature.setStyle(new ol.style.Style({
                    text: new ol.style.Text({
                        text: '⛽',
                        font: '24px Arial',
                        offsetY: -12,
                        fill: new ol.style.Fill({ color: '#000' })
                    })
                }));
                return; // Skip the default circle style
            }

            feature.setStyle(new ol.style.Style({
                image: new ol.style.Circle({
                    radius: markerStyle.radius,
                    fill: new ol.style.Fill({ color: markerStyle.fillColor }),
                    stroke: new ol.style.Stroke({ color: markerStyle.strokeColor, width: markerStyle.strokeWidth })
                })
            }));
        }
    });
}

async function updateHighlightedSegment() {
    const features = vectorSource.getFeatures();
    for (let i = features.length - 1; i >= 0; i--) {
        const f = features[i];
        if (f.get('dayIndex') === undefined && f.get('pointIndex') === undefined) {
            const style = f.getStyle();
            if (style && style.getStroke && style.getStroke().getColor() === 'yellow' && style.getStroke().getWidth() === 8) {
                vectorSource.removeFeature(f);
            }
        }
    }

    if (trip.selectedPoints.length === 2) {
        const sortedSelected = [...trip.selectedPoints].sort((a, b) => {
            if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
            return a.pointIndex - b.pointIndex;
        });
        const start = sortedSelected[0];
        const end = sortedSelected[1];
        
        const segmentPoints = [];
        for (let dIdx = start.dayIndex; dIdx <= end.dayIndex; dIdx++) {
            const day = trip.days[dIdx];
            if (!day) continue;
            let startPt = (dIdx === start.dayIndex) ? start.pointIndex : 0;
            let endPt = (dIdx === end.dayIndex) ? end.pointIndex + 1 : day.points.length;
            segmentPoints.push(...day.points.slice(startPt, endPt));
        }
        
        if (segmentPoints.length >= 2) {
            const segmentCoords = segmentPoints.map(p => getCoords(p).join(',')).join(';');
            const segmentUrl = `https://router.project-osrm.org/route/v1/driving/${segmentCoords}?overview=full&geometries=geojson`;
            try {
                const segResponse = await fetch(segmentUrl);
                const segData = await segResponse.json();
                if (segData.routes && segData.routes.length > 0) {
                    const segGeometry = new ol.geom.LineString(
                        segData.routes[0].geometry.coordinates.map(coord => ol.proj.fromLonLat(coord))
                    );
                    const segFeature = new ol.Feature({ geometry: segGeometry });
                    segFeature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({ color: 'yellow', width: 8 })
                    }));
                    vectorSource.addFeature(segFeature);
                }
            } catch (segError) {
                console.error('Segment highlight error:', segError);
            }
        }
    }
}

async function updateRoute() {
    vectorSource.clear();

    // 1. First, add all route lines (so they are at the bottom)
    for (let dayIndex = 0; dayIndex < trip.days.length; dayIndex++) {
        const day = trip.days[dayIndex];
        day.distance = 0;
        const color = day.color || '#000000';

        let waypoints = [...day.points];
        if (dayIndex > 0) {
            const prevDay = trip.days[dayIndex - 1];
            if (prevDay.points.length > 0) {
                waypoints.unshift(prevDay.points[prevDay.points.length - 1]);
            }
        }

        if (waypoints.length >= 2) {
            const coordinates = waypoints.map(p => getCoords(p).join(',')).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.routes && data.routes.length > 0) {
                    day.distance = data.routes[0].distance;
                    const routeGeometry = new ol.geom.LineString(
                        data.routes[0].geometry.coordinates.map(coord => ol.proj.fromLonLat(coord))
                    );
                    const routeFeature = new ol.Feature({ geometry: routeGeometry });
                    routeFeature.setStyle(new ol.style.Style({
                        stroke: new ol.style.Stroke({ color: color, width: 5 })
                    }));
                    vectorSource.addFeature(routeFeature);
                }
            } catch (error) {
                console.error('Routing error:', error);
            }
        }
    }

    // 2. Then, add all markers (so they are on top)
    for (let dayIndex = 0; dayIndex < trip.days.length; dayIndex++) {
        const day = trip.days[dayIndex];
        const color = day.color || '#000000';

        day.points.forEach((point, pointIndex) => {
            const marker = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.fromLonLat(getCoords(point))),
                dayIndex: dayIndex,
                pointIndex: pointIndex
            });
            vectorSource.addFeature(marker);
        });
    updateMarkersStyle();
    await updateHighlightedSegment();
    updateUI();
}
}

function fitMapToRoute() {
    const extent = vectorSource.getExtent();
    if (extent && extent[0] !== extent[1]) {
        map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 1000
        });
    }
}

// Handle map clicks: add point or remove marker
map.on('singleclick', async function(evt) {
    console.log('Map singleclick event fired');
    const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
    });

    if (feature && feature.get('dayIndex') !== undefined) {
        console.log('Marker clicked:', feature.get('dayIndex'), feature.get('pointIndex'));
        const dayIndex = feature.get('dayIndex');
        const pointIndex = feature.get('pointIndex');
        
        // Toggle selection for distance measurement
        const existingIdx = trip.selectedPoints.findIndex(p => p.dayIndex === dayIndex && p.pointIndex === pointIndex);
        if (existingIdx !== -1) {
            console.log('Deselecting point');
            trip.selectedPoints.splice(existingIdx, 1);
        } else {
            console.log('Selecting point');
            trip.selectedPoints.push({ dayIndex, pointIndex });
            if (trip.selectedPoints.length > 2) {
                trip.selectedPoints.shift();
            }
        }
        
        updateSegmentDistance();
        updateMarkersStyle();
        await updateHighlightedSegment();
    } else {
        console.log('Map background clicked - adding point');
        // Map clicked - add new point to current day
        const coords = ol.proj.toLonLat(evt.coordinate);
        
        if (trip.currentDayIndex === -1) {
            // Create day only when first point is added
            const newDay = {
                date: selectedCalendarDate,
                points: [],
                distance: 0,
                color: getColorForIndex(trip.days.length)
            };
            trip.days.push(newDay);
            trip.days.sort((a, b) => a.date.localeCompare(b.date));
            trip.currentDayIndex = trip.days.findIndex(d => d.date === selectedCalendarDate);
        }
        
        trip.days[trip.currentDayIndex].points.push(coords);
        syncColorPicker();
        renderDaysList();
        renderCalendar();
        updateSegmentDistance();
        updateRoute();
    }
});

map.on('dblclick', function(evt) {
    console.log('Map dblclick event fired');
    const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
    });

    if (feature && feature.get('dayIndex') !== undefined) {
        console.log('Marker double-clicked for deletion:', feature.get('dayIndex'), feature.get('pointIndex'));
        const dayIndex = feature.get('dayIndex');
        const pointIndex = feature.get('pointIndex');
        if (confirm('Удалить эту точку?')) {
            removeWaypoint(dayIndex, pointIndex);
        }
    }
});

// Initial render
renderDaysList();
renderCalendar();

document.getElementById('day-color-picker').onchange = (e) => {
    const color = e.target.value;
    if (trip.currentDayIndex !== -1) {
        trip.days[trip.currentDayIndex].color = color;
        renderDaysList();
        updateRoute();
    }
};

window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('trip_id');
    if (tripId) {
        loadTrip(tripId);
    }
});

async function saveTrip() {
    const name = document.getElementById('trip-name').value || 'Моё путешествие';
    const tripData = {
        id: trip.id,
        name: name,
        days: trip.days
    };

    try {
        const response = await fetch('/save/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(tripData)
        });
        const result = await response.json();
        if (result.status === 'success') {
            alert('Путешествие сохранено! ID: ' + result.trip_id);
        } else {
            alert('Ошибка при сохранении: ' + result.message);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Произошла ошибка при сохранении');
    }
}

async function loadTrip(tripId = null) {
    if (!tripId) {
        clearTrip();
        return;
    }
    
    try {
        const response = await fetch(`/load/${tripId}/`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        const data = await response.json();
        if (data.id) {
            trip.id = data.id;
            trip.days = data.days;
            // Ensure days are sorted by date for correct index-based route calculation
            trip.days.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
            
            // Assign default colors to days that don't have one
            trip.days.forEach((day, index) => {
                if (!day.color || day.color === '#000000') {
                    day.color = getColorForIndex(index);
                }
            });
            
            document.getElementById('trip-name').value = data.name;
            await updateRoute();
            fitMapToRoute();
            if (trip.days.length > 0) {
                selectDay(0);
            }
        } else {
            alert('Ошибка: ' + data.message);
        }
    } catch (error) {
        console.error('Load error:', error);
        alert('Произошла ошибка при загрузке');
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
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

