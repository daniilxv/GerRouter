window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tripId = urlParams.get('trip_id');
    if (tripId) {
        loadTrip(tripId);
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
