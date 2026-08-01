from django.shortcuts import render
from django.http import HttpResponse
from .forms import RegisterationForm
# Create your views here.
def registration(request):
    if request.method=="POST":
        user_form=RegisterationForm(request.POST)
        if user_form.is_valid():
            user_form.save()
            return HttpResponse("<h1>registration is succesfull!!</h1>")
    else:
        user_form=RegisterationForm()
    return render(request,"accounts/register.html",{'user_form':user_form})
