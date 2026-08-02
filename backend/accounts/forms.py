from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django import forms

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