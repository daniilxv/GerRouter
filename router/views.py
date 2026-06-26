from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.decorators import login_required
import urllib.request
import json
from .models import Trip, Day, Waypoint

from django.http import JsonResponse
import json

@login_required
def map_view(request):
    trips = Trip.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'router/map.html', {'trips': trips})

@login_required
def trips_list(request):
    trips = Trip.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'router/trips.html', {'trips': trips})

@login_required
def save_trip(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            trip_name = data.get('name', 'Моё путешествие')
            days_data = data.get('days', [])

            # Create or update trip, ensuring it belongs to the current user
            trip_id = data.get('id')
            if trip_id:
                trip = Trip.objects.get(id=trip_id, user=request.user)
            else:
                trip = Trip.objects.create(user=request.user, name=trip_name)
            
            trip.name = trip_name
            trip.save()

            # Clear existing days and waypoints for a clean save
            Day.objects.filter(trip=trip).delete()

            for i, day_data in enumerate(days_data):
                day = Day.objects.create(trip=trip, day_number=i + 1)
                for j, point in enumerate(day_data.get('points', [])):
                    Waypoint.objects.create(
                        day=day,
                        lat=point[1],
                        lon=point[0],
                        order=j
                    )

            return JsonResponse({'status': 'success', 'trip_id': trip.id})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Only POST allowed'}, status=405)

@login_required
def load_trip(request, trip_id):
    try:
        trip = Trip.objects.get(id=trip_id, user=request.user)
        days = []
        for day in trip.days.all():
            waypoints = day.waypoints.all()
            points = [[wp.lon, wp.lat] for wp in waypoints]
            days.append({'points': points})
        
        return JsonResponse({
            'id': trip.id,
            'name': trip.name,
            'days': days
        })
    except Trip.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Trip not found'}, status=404)

def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('map')
    else:
        form = UserCreationForm()
    return render(request, 'router/signup.html', {'form': form})
