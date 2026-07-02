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
