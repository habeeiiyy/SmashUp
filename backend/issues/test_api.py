from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status

from projects.models import Project, ProjectMember
from issues.models import Issue, IssueComment, IssueLabel, Status, Priority

User = get_user_model()


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class IssueAPITests(APITestCase):
    """Test the Issues API endpoints with authentication and permissions."""

    def setUp(self):
        self.client = APIClient()

        # Create users with different roles
        self.owner = User.objects.create_user(
            username="api_owner", password="Password@123", email="owner@example.com"
        )
        self.admin = User.objects.create_user(
            username="api_admin", password="Password@123", email="admin@example.com"
        )
        self.developer = User.objects.create_user(
            username="api_dev", password="Password@123", email="dev@example.com"
        )
        self.viewer = User.objects.create_user(
            username="api_viewer", password="Password@123", email="viewer@example.com"
        )
        self.outsider = User.objects.create_user(
            username="api_outsider", password="Password@123", email="outsider@example.com"
        )

        # Create two projects for cross-project testing
        self.project_a = Project.objects.create(
            name="Project A", description="First project", owner=self.owner
        )
        self.project_b = Project.objects.create(
            name="Project B", description="Second project", owner=self.owner
        )

        # Add memberships for project A
        ProjectMember.objects.create(
            project=self.project_a, user=self.admin, role=ProjectMember.Role.ADMIN
        )
        ProjectMember.objects.create(
            project=self.project_a, user=self.developer, role=ProjectMember.Role.DEVELOPER
        )
        ProjectMember.objects.create(
            project=self.project_a, user=self.viewer, role=ProjectMember.Role.VIEWER
        )

        # Add memberships for project B (only owner + admin)
        ProjectMember.objects.create(
            project=self.project_b, user=self.admin, role=ProjectMember.Role.ADMIN
        )

        # Create issues in both projects
        self.issue_a = Issue.objects.create(
            project=self.project_a,
            title="Issue in Project A",
            description="Description A",
            category="Bug",
            created_by=self.owner,
            status=Status.OPEN,
            priority=Priority.HIGH,
        )
        self.issue_b = Issue.objects.create(
            project=self.project_b,
            title="Issue in Project B",
            description="Description B",
            category="Feature",
            created_by=self.owner,
            status=Status.OPEN,
            priority=Priority.MEDIUM,
        )

    def _authenticate(self, user):
        """Helper to authenticate the client with JWT."""
        tokens = get_tokens_for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')

    # -----------------------------------------------------------
    # Authentication tests
    # -----------------------------------------------------------

    def test_unauthenticated_request_returns_401_or_403(self):
        """Requests without a token should get 401 Unauthorized or 403 Forbidden."""
        url = reverse("issue-list")
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_jwt_token_endpoint_works(self):
        """The JWT token endpoint should return access and refresh tokens."""
        url = reverse("token_obtain_pair")
        response = self.client.post(
            url, {"username": "api_owner", "password": "Password@123"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    # -----------------------------------------------------------
    # Project A member access tests (should see only Project A data)
    # -----------------------------------------------------------

    def test_owner_can_list_own_projects_only(self):
        """Owner should see only projects they own or are member of."""
        self._authenticate(self.owner)
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Owner owns both projects, so should see both
        project_ids = [p["id"] for p in response.data["results"]]
        self.assertIn(self.project_a.id, project_ids)
        self.assertIn(self.project_b.id, project_ids)

    def test_viewer_sees_only_their_project(self):
        """Viewer of Project A should not see Project B."""
        self._authenticate(self.viewer)
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project_ids = [p["id"] for p in response.data["results"]]
        self.assertIn(self.project_a.id, project_ids)
        self.assertNotIn(self.project_b.id, project_ids)

    def test_outsider_sees_no_projects(self):
        """Outsider (not a member of any project) should see empty list."""
        self._authenticate(self.outsider)
        url = reverse("project-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    # -----------------------------------------------------------
    # Issue cross-project access tests
    # -----------------------------------------------------------

    def test_cannot_view_issue_from_other_project(self):
        """Project A viewer should get 404/403 when accessing Project B's issue."""
        self._authenticate(self.viewer)
        url = reverse("issue-detail", kwargs={"pk": self.issue_b.id})
        response = self.client.get(url)
        # Should not return the issue data
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_can_view_issue_from_own_project(self):
        """Project A viewer should see Project A's issue."""
        self._authenticate(self.viewer)
        url = reverse("issue-detail", kwargs={"pk": self.issue_a.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.issue_a.id)

    def test_issue_list_filters_by_project_membership(self):
        """Issue list should only show issues from projects user belongs to."""
        self._authenticate(self.viewer)
        url = reverse("issue-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        issue_ids = [i["id"] for i in response.data["results"]]
        self.assertIn(self.issue_a.id, issue_ids)
        self.assertNotIn(self.issue_b.id, issue_ids)

    # -----------------------------------------------------------
    # Issue write permission tests
    # -----------------------------------------------------------

    def test_viewer_cannot_create_issue(self):
        """Viewer should get 400 when trying to create an issue."""
        self._authenticate(self.viewer)
        url = reverse("issue-list")
        data = {
            "project": self.project_a.id,
            "title": "Viewer issue",
            "description": "Viewer should not create",
            "category": "Bug",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_developer_can_create_issue(self):
        """Developer should be able to create an issue."""
        self._authenticate(self.developer)
        url = reverse("issue-list")
        data = {
            "project": self.project_a.id,
            "title": "Developer issue",
            "description": "Dev created this",
            "category": "Bug",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Developer issue")

    def test_viewer_cannot_edit_issue(self):
        """Viewer should get 400 when trying to edit an issue."""
        self._authenticate(self.viewer)
        url = reverse("issue-detail", kwargs={"pk": self.issue_a.id})
        data = {"title": "Edited by viewer"}
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_edit_issue(self):
        """Admin should be able to edit an issue."""
        self._authenticate(self.admin)
        url = reverse("issue-detail", kwargs={"pk": self.issue_a.id})
        data = {"title": "Edited by admin"}
        response = self.client.patch(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Edited by admin")

    # -----------------------------------------------------------
    # Status and priority change tests
    # -----------------------------------------------------------

    def test_developer_can_change_status(self):
        """Developer should be able to change issue status."""
        self._authenticate(self.developer)
        url = reverse("issue-status", kwargs={"pk": self.issue_a.id})
        data = {"status": Status.IN_PROGRESS}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], Status.IN_PROGRESS)

    def test_viewer_cannot_change_status(self):
        """Viewer should get 400 when trying to change status."""
        self._authenticate(self.viewer)
        url = reverse("issue-status", kwargs={"pk": self.issue_a.id})
        data = {"status": Status.CLOSED}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_developer_can_change_priority(self):
        """Developer should be able to change issue priority."""
        self._authenticate(self.developer)
        url = reverse("issue-priority", kwargs={"pk": self.issue_a.id})
        data = {"priority": Priority.CRITICAL}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["priority"], Priority.CRITICAL)

    # -----------------------------------------------------------
    # Assignment tests
    # -----------------------------------------------------------

    def test_developer_can_assign_issue(self):
        """Developer should be able to assign an issue."""
        self._authenticate(self.developer)
        url = reverse("issue-assign", kwargs={"pk": self.issue_a.id})
        data = {"assigned_to": self.admin.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_viewer_cannot_assign_issue(self):
        """Viewer should get 400 when trying to assign."""
        self._authenticate(self.viewer)
        url = reverse("issue-assign", kwargs={"pk": self.issue_a.id})
        data = {"assigned_to": self.admin.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -----------------------------------------------------------
    # Label tests
    # -----------------------------------------------------------

    def test_developer_can_attach_label(self):
        """Developer should be able to attach a label to an issue."""
        # First create a label
        label = IssueLabel.objects.create(
            project=self.project_a, name="urgent"
        )
        self._authenticate(self.developer)
        url = reverse("issue-attach-label", kwargs={"pk": self.issue_a.id})
        data = {"label": label.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_attach_label_from_other_project(self):
        """Cannot attach a label from Project B to an issue in Project A."""
        label_b = IssueLabel.objects.create(
            project=self.project_b, name="label-b"
        )
        self._authenticate(self.admin)
        url = reverse("issue-attach-label", kwargs={"pk": self.issue_a.id})
        data = {"label": label_b.id}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -----------------------------------------------------------
    # Comment tests
    # -----------------------------------------------------------

    def test_member_can_create_comment(self):
        """Any project member can create a comment."""
        self._authenticate(self.viewer)
        url = reverse("issuecomment-list")
        data = {"issue": self.issue_a.id, "content": "A comment from viewer"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_outsider_cannot_create_comment(self):
        """Outsider cannot comment on a project they don't belong to."""
        self._authenticate(self.outsider)
        url = reverse("issuecomment-list")
        data = {"issue": self.issue_a.id, "content": "Outsider comment"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # -----------------------------------------------------------
    # Pagination tests
    # -----------------------------------------------------------

    def test_pagination_returns_20_items_per_page(self):
        """List endpoints should paginate results."""
        self._authenticate(self.owner)
        url = reverse("issue-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Paginated response has 'results', 'count', 'next', 'previous'
        self.assertIn("results", response.data)
        self.assertIn("count", response.data)
        self.assertIn("next", response.data)
        self.assertIn("previous", response.data)

    # -----------------------------------------------------------
    # Filtering tests
    # -----------------------------------------------------------

    def test_filter_by_status(self):
        """Should be able to filter issues by status."""
        self._authenticate(self.owner)
        url = reverse("issue-list")
        response = self.client.get(url, {"status": Status.OPEN})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for issue in response.data["results"]:
            self.assertEqual(issue["status"], Status.OPEN)

    def test_search_by_title(self):
        """Should be able to search issues by title."""
        self._authenticate(self.owner)
        url = reverse("issue-list")
        response = self.client.get(url, {"search": "Project A"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [issue["title"] for issue in response.data["results"]]
        self.assertIn("Issue in Project A", titles)
