// Helper to get coordinates from a point (which can be [lon, lat] or {lon, lat, ...})
function getCoords(point) {
    if (Array.isArray(point)) return point;
    if (point && typeof point === 'object') return [point.lon, point.lat];
    return [0, 0];
}

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

function updateTotalDistance() {
    const totalMeters = trip.days.reduce((sum, day) => sum + (day.distance || 0), 0);
    const totalKm = (totalMeters / 1000).toFixed(2);
    document.getElementById('total-distance').innerText = 'Общий путь: ' + totalKm + ' км';
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
    }
    updateMarkersStyle();
    await updateHighlightedSegment();
    updateUI();
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
