from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from projects.models import ProjectMember
from projects.services import create_project

from .models import Issue,Priority,Status

from .services import create_issue
User=get_user_model()

# Create your tests here.
class CreateIssueTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="issue_owner",
            password="Password@123",
        )
        self.admin = User.objects.create_user(
            username="issue_admin",
            password="Password@123",
        )
        self.developer = User.objects.create_user(
            username="issue_developer",
            password="Password@123",
        )
        self.viewer = User.objects.create_user(
            username="issue_viewer",
            password="Password@123",
        )
        self.assignee = User.objects.create_user(
            username="issue_assignee",
            password="Password@123",
        )
        self.outsider = User.objects.create_user(
            username="issue_outsider",
            password="Password@123",
        )
        self.removed_member = User.objects.create_user(
            username="removed_issue_member",
            password="Password@123",
        )

        self.project = create_project(
            name="SmashUp",
            description="Issue-management system",
            owner=self.owner,
        )

        memberships = (
            (self.admin, ProjectMember.Role.ADMIN),
            (self.developer, ProjectMember.Role.DEVELOPER),
            (self.viewer, ProjectMember.Role.VIEWER),
            (self.assignee, ProjectMember.Role.DEVELOPER),
            (self.removed_member, ProjectMember.Role.DEVELOPER),
        )
        for user, role in memberships:
            ProjectMember.objects.create(
                project=self.project,
                user=user,
                role=role,
            )

        ProjectMember.objects.get(
            project=self.project,
            user=self.removed_member,
        ).delete()
    def create_valid_issue(self, *, created_by, assigned_to=None):
        return create_issue(
            project=self.project,
            title="Payment fails on mobile",
            description="Payment sometimes does nothing in mobile Chrome.",
            category="Payment",
            created_by=created_by,
            assigned_to=assigned_to,
        )

    def test_owner_admin_and_developer_can_create_issues(self):
        allowed_users = (self.owner, self.admin, self.developer)

        for user in allowed_users:
            with self.subTest(user=user.username):
                issue = self.create_valid_issue(created_by=user)
                self.assertEqual(issue.created_by, user)

        self.assertEqual(Issue.objects.count(), 3)

    def test_viewer_outsider_and_removed_member_cannot_create_issues(self):
        rejected_users = (self.viewer, self.outsider, self.removed_member)

        for user in rejected_users:
            with self.subTest(user=user.username):
                with self.assertRaises(ValidationError):
                    self.create_valid_issue(created_by=user)

        self.assertEqual(Issue.objects.count(), 0)

    def test_issue_can_be_assigned_to_project_member(self):
        issue = self.create_valid_issue(
            created_by=self.owner,
            assigned_to=self.assignee,
        )

        self.assertEqual(issue.assigned_to, self.assignee)

    def test_non_member_cannot_be_assigned(self):
        with self.assertRaises(ValidationError):
            self.create_valid_issue(
                created_by=self.owner,
                assigned_to=self.outsider,
            )

        self.assertEqual(Issue.objects.count(), 0)

    def test_removed_member_cannot_be_assigned(self):
        with self.assertRaises(ValidationError):
            self.create_valid_issue(
                created_by=self.owner,
                assigned_to=self.removed_member,
            )

        self.assertEqual(Issue.objects.count(), 0)

    def test_new_issue_uses_default_status_and_priority(self):
        issue = self.create_valid_issue(created_by=self.developer)
        issue.refresh_from_db()

        self.assertEqual(issue.status, Status.OPEN)
        self.assertEqual(issue.priority, Priority.MEDIUM)

    def test_rejected_request_saves_nothing(self):
        with self.assertRaises(ValidationError):
            create_issue(
                project=self.project,
                title="Unauthorized issue",
                description="This must not be saved.",
                category="Security",
                created_by=self.outsider,
                assigned_to=self.assignee,
            )

        self.assertFalse(Issue.objects.exists())
