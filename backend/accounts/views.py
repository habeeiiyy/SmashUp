from django.shortcuts import render,redirect
from .forms import RegisterationForm
from django.contrib import messages
from django.contrib.auth import authenticate,login,logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from django.utils.http import url_has_allowed_host_and_scheme
@never_cache
def registration(request):
    if request.method == "POST":
        user_form = RegisterationForm(request.POST)

        print("FORM VALID:", user_form.is_valid())
        print("FORM ERRORS:", user_form.errors)

        if user_form.is_valid():
            user = user_form.save()
            login(request, user)
            print("LOGIN SUCCESS")
            return redirect("home")
    else:
        user_form = RegisterationForm()
    return render(
        request,
        "accounts/register.html",
        {"user_form": user_form}
    )
@never_cache
def login_view(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method=="POST":
        form=AuthenticationForm(request,data=request.POST)
        if form.is_valid():
            user=form.get_user()
            login(request,user)
            messages.success(request,f" Welcome Back {user.get_username()}!")
            next_url=request.POST.get('next') or request.GET.get('next')
            if next_url and url_has_allowed_host_and_scheme(
                url=next_url,
                allowed_hosts={request.get_host()}
            ):
                return redirect(next_url)
            return redirect('home')
        else:
            messages.error(request,"invalid username or password.")
    else:
        form=AuthenticationForm()
    return render(request,'accounts/login.html',{'form':form})
@login_required(login_url='login')
def home(request):
    return render(request,"accounts/home.html")
def logout_view(request):
    logout(request,user)
    return redirect("login")