from django.urls import path
from . import views
urlpatterns=[
    path('',views.registration,name="register"),
    path('login/',views.login_view,name="login"),
    path('home/',views.home,name='home'),
    path('logout/',views.logout_view,name="logout"),
    path("profile/",views.profile,name="profile")
]