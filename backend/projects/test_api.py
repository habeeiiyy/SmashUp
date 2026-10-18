from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

from projects.models import Project, ProjectMember
from issues.models import Issue

User = get_user_model()


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class ProjectAPITests(APITestCase):
    """Test the Projects API endpoints with authentication and permissions."""

    def setUp(self):
        self.client = APIClient()

        self.owner = User.objects.create_user(
            username="proj_owner", password="Password@123", email="owner@example.com"
        )
        self.admin = User.objects.create_user(
            username="proj_admin", password="Password@123", email="admin@example.com"
        )
        self.developer = User.objects.create_user(
            username="proj_dev", password="Password@123", email="dev@example.com"
        )
        self.viewer = User.objects.create_user(
            username="proj_viewer", password="Password@123", email="viewer@example.com"
        )
        self.outsider = User.objects.create_user(
            username="proj_outsider", password="Password@123", email="outsider@example.com"
        )

        self.project_a = Project.objects.create(
            name="Project A", description="First project", owner=self.owner
        )
        self.project_b = Project.objects.create(
            name="Project B", description="Second project", owner=self.owner
        )

        # Owner must have a membership record for transfer_ownership to work
        ProjectMember.objects.create(
            project=self.project_a, user=self.owner, role=ProjectMember.Role.OWNER
        )
        ProjectMember.objects.create(
            project=self.project_b, user=self.owner, role=ProjectMember.Role.OWNER
        )

        ProjectMember.objects.create(
            project=self.project_a, user=self.admin, role=ProjectMember.Role.ADMIN
        )
        ProjectMember.objects.create(
            project=self.project_a, user=self.developer, role=ProjectMember.Role.DEVELOPER
        )
        ProjectMember.objects.create(
            project=self.project_a, user=self.viewer, role=ProjectMember.Role.VIEWER
        )

        ProjectMember.objects.create(
            project=self.project_b, user=self.admin, role=ProjectMember.Role.ADMIN
        )

    def _authenticate(self, user):
        tokens = get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')

    # -----------------------------------------------------------
    # Authentication
    # -----------------------------------------------------------

    def test_unauthenticated_request_returns_401_or_403(self):
        """Unauthenticated requests should be denied (401 or 403)."""
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_jwt_refresh_endpoint_works(self):
        self._authenticate(self.owner)
        tokens = get_tokens_for_user(self.owner)
        url = reverse("token_refresh")
        response = self.client.post(url, {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    # -----------------------------------------------------------
    # Project list visibility
    # -----------------------------------------------------------

    def test_viewer_sees_only_member_projects(self):
        self._authenticate(self.viewer)
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project_ids = [p["id"] for p in response.data["results"]]
        self.assertIn(self.project_a.id, project_ids)
        self.assertNotIn(self.project_b.id, project_ids)

    def test_outsider_sees_no_projects(self):
        self._authenticate(self.outsider)
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_cannot_view_other_project(self):
        self._authenticate(self.viewer)
        url = reverse("project-detail", kwargs={"pk": self.project_b.id})
        response = self.client.get(url)
        self.assertIn(
            response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
        )

    # -----------------------------------------------------------
    # Project write permissions
    # -----------------------------------------------------------

    def test_authenticated_user_can_create_project(self):
        self._authenticate(self.developer)
        url = reverse("project-list")
        data = {"name": "New Project", "description": "Created by dev"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Project")

    def test_only_owner_can_transfer_ownership(self):
        self._authenticate(self.admin)
        url = reverse("project-transfer-ownership", kwargs={"pk": self.project_a.id})
        data = {"new_owner": self.admin.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_transfer_ownership(self):
        self._authenticate(self.owner)
        url = reverse("project-transfer-ownership", kwargs={"pk": self.project_a.id})
        data = {"new_owner": self.admin.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # -----------------------------------------------------------
    # Membership tests
    # -----------------------------------------------------------

    def test_only_owner_admin_can_add_member(self):
        self._authenticate(self.viewer)
        url = reverse("projectmember-list")
        data = {
            "project": self.project_a.id,
            "user": self.outsider.id,
            "role": ProjectMember.Role.DEVELOPER,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_add_member(self):
        self._authenticate(self.admin)
        url = reverse("projectmember-list")
        data = {
            "project": self.project_a.id,
            "user": self.outsider.id,
            "role": ProjectMember.Role.DEVELOPER,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_only_owner_admin_can_remove_member(self):
        self._authenticate(self.viewer)
        url = reverse("projectmember-detail", kwargs={"pk": 1})  # may not exist
        # First get a real membership id
        membership = ProjectMember.objects.filter(
            project=self.project_a, user=self.developer
        ).first()
        url = reverse("projectmember-detail", kwargs={"pk": membership.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_remove_member(self):
        self._authenticate(self.owner)
        membership = ProjectMember.objects.filter(
            project=self.project_a, user=self.developer
        ).first()
        url = reverse("projectmember-detail", kwargs={"pk": membership.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # -----------------------------------------------------------
    # Cross-project membership access
    # -----------------------------------------------------------

    def test_cannot_see_memberships_from_other_project(self):
        self._authenticate(self.viewer)
        url = reverse("projectmember-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for membership in response.data["results"]:
            self.assertEqual(membership["project"], self.project_a.id)

    # -----------------------------------------------------------
    # Filtering and pagination
    # -----------------------------------------------------------

    def test_filter_projects_by_owner(self):
        self._authenticate(self.owner)
        url = reverse("project-list")
        response = self.client.get(url, {"owner": self.owner.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for project in response.data["results"]:
            self.assertEqual(project["owner"], self.owner.id)

    def test_pagination_structure(self):
        self._authenticate(self.owner)
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)
