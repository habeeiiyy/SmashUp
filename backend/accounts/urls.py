from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_api, name='register-api'),
    path('login/', views.login_api, name='login-api'),
    path('logout/', views.logout_api, name='logout-api'),
    path('profile/', views.user_profile_api, name='profile-api'),
]
