from django.test import TestCase

# Create your tests here.
from django.contrib.auth.models import User

from .forms import RegisterationForm

class RegistrationFormTests(TestCase):
    def test_user_can_register_without_email(self):
        form=RegisterationForm(
            data={
                "username":"user1",
                "email":"",
                "password1": "StrongPassword123!",
            "password2": "StrongPassword123!",
            })
        self.assertTrue(form.is_valid())


    def test_second_user_can_register_without_email(self):
        User.objects.create_user(
            username="User1",
            password="StrongPassword123!"
        )
        