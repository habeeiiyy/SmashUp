from django.db import models
from django.conf import settings
class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    avatar = models.ImageField(default='default.jpg', upload_to='profile_images')
    bio = models.TextField(blank=True)
    position = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.user.username

