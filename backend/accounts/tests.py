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

        form = RegisterationForm(
            data={
                "username": "User2",
                "email": "",
                "password1": "StrongPassword123!",
                "password2": "StrongPassword123!",
            }
        )

        self.assertTrue(form.is_valid(), form.errors)
        user = form.save()
        user.refresh_from_db()

        self.assertEqual(user.username, "User2")
        self.assertEqual(user.email, "")
        self.assertEqual(User.objects.filter(email="").count(), 2)


from .models import Profile
from .forms import UpdateProfileForm
from rest_framework.test import APIClient


class ProfileUpdateTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="devuser",
            email="devuser@example.com",
            password="StrongPassword123!",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_update_profile_form_fields(self):
        profile, _ = Profile.objects.get_or_create(user=self.user)
        form = UpdateProfileForm(
            data={
                "bio": "Full stack engineer",
                "position": "Tech Lead",
                "company": "Acme Corp",
            },
            instance=profile,
        )
        self.assertTrue(form.is_valid(), form.errors)
        form.save()
        profile.refresh_from_db()
        self.assertEqual(profile.bio, "Full stack engineer")
        self.assertEqual(profile.position, "Tech Lead")
        self.assertEqual(profile.company, "Acme Corp")

    def test_profile_api_patch(self):
        response = self.client.patch(
            "/api/auth/profile/",
            {
                "bio": "Loving SmashUp!",
                "position": "Backend Developer",
                "company": "Innovate Ltd",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["bio"], "Loving SmashUp!")
        self.assertEqual(response.data["position"], "Backend Developer")
        self.assertEqual(response.data["company"], "Innovate Ltd")

        # Verify DB updated
        self.user.profile.refresh_from_db()
        self.assertEqual(self.user.profile.bio, "Loving SmashUp!")
        self.assertEqual(self.user.profile.position, "Backend Developer")
        self.assertEqual(self.user.profile.company, "Innovate Ltd")

