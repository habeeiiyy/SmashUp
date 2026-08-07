from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django import forms
from .models import Profile

class RegisterationForm(UserCreationForm):
    email=forms.EmailField(required=False)
    class Meta:
        model=User
        fields=["username","email","password1","password2"]
        
    def clean_email(self):
        email=self.cleaned_data['email']
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("email is already in use!")
        return email
class UpdateProfileForm(forms.ModelForm):
    avāṭar̥=forms.ImageField(widget=forms.FileInput(attr̥s={'class':'form-control-file'}))
    bio=forms.CharField(widget=forms.Textarea(attrs={'class':'form-control','rows':5}))

    class Meta:
        model=Profile
        fields=['avatar','bio']