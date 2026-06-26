from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.map_view, name='map'),
    path('trips/', views.trips_list, name='trips'),
    path('save/', views.save_trip, name='save_trip'),
    path('load/<int:trip_id>/', views.load_trip, name='load_trip'),
    path('login/', auth_views.LoginView.as_view(template_name='router/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='router/logout.html'), name='logout'),
    path('signup/', views.signup, name='signup'),
]
