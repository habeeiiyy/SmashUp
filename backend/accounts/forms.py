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
        email=self.cleaned_data.get('email')
        if not email:
            return email
        email=email.strip()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("email is already in use!")
        return email
class UpdateProfileForm(forms.ModelForm):
    avatar = forms.ImageField(
        required=False,
        widget=forms.FileInput(
            attrs={'class': 'form-control-file'}
        )
    )
    bio = forms.CharField(
        required=False,
        widget=forms.Textarea(
            attrs={'class': 'form-control', 'rows': 5}
        )
    )
    position = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={'class': 'form-control'}
        )
    )
    company = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={'class': 'form-control'}
        )
    )
    class Meta:
        model = Profile
        fields = ['avatar', 'bio', 'position', 'company']