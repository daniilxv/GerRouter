from django.db import models
from django.conf import settings
import datetime

class Trip(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trips', null=True, blank=True)
    name = models.CharField(max_length=255, default='Моё путешествие')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Day(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='days')
    date = models.DateField(default=datetime.date.today)
    color = models.CharField(max_length=20, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.trip.name} - {self.date}"

class Waypoint(models.Model):
    day = models.ForeignKey(Day, on_delete=models.CASCADE, related_name='waypoints')
    lat = models.FloatField()
    lon = models.FloatField()
    order = models.IntegerField()
    comment = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Точка {self.order} ({self.day.date})"
