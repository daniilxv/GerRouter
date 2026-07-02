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
