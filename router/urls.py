from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.map_view, name='map'),
    path('trips/', views.trips_list, name='trips'),
    path('save/', views.save_trip, name='save_trip'),
    path('load/<int:trip_id>/', views.load_trip, name='load_trip'),
    path('delete/<int:trip_id>/', views.delete_trip, name='delete_trip'),
]
