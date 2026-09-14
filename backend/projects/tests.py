from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Project,ProjectMember
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from .services import create_project,add_member,transfer_ownership

User=get_user_model()

# Create your tests here.


class CreateProjectTests(TestCase):
    def setUp(self):
        self.owner=User.objects.create_user(
            username="habeebee",
            password="PASSword@123"
        )
    def test_create_project_saves_project_with_owner(self):
        project=create_project(
            name="SmashUp",
            description="my beautifull project",
            owner=self.owner,
        )

        self.assertEqual(Project.objects.count(),1)
        self.assertEqual(project.name,"SmashUp")
        self.assertEqual(project.owner,self.owner)

    def test_create_project_creates_owner_membership(self):
        project=create_project(
            name="protein2",
            description="potein supplement shop issue",
            owner=self.owner,
        )

        membership=ProjectMember.objects.get(
            project=project,
            user=self.owner
        )

        self.assertEqual(membership.role,ProjectMember.Role.OWNER)
class AddMemberTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner",
            password="Password@123",
        )

        self.admin = User.objects.create_user(
            username="admin",
            password="Password@123",
        )

        self.developer = User.objects.create_user(
            username="developer",
            password="Password@123",
        )

        self.viewer = User.objects.create_user(
            username="viewer",
            password="Password@123",
        )

        self.outsider = User.objects.create_user(
            username="outsider",
            password="Password@123",
        )

        self.new_member = User.objects.create_user(
            username="new_member",
            password="Password@123",
        )

        self.project = create_project(
            name="SmashUp",
            description="Issue management system",
            owner=self.owner,
        )

        ProjectMember.objects.create(
            project=self.project,
            user=self.admin,
            role=ProjectMember.Role.ADMIN
        )
        ProjectMember.objects.create(
            project=self.project,
            user=self.developer,
            role=ProjectMember.Role.DEVELOPER,
        )

        ProjectMember.objects.create(
            project=self.project,
            user=self.viewer,
            role=ProjectMember.Role.VIEWER,

            )
    def test_owner_can_add_developer(self):
        membership=add_member(
            project=self.project,
            user=self.new_member,
            role=ProjectMember.Role.DEVELOPER,
            added_by=self.owner
        )

        self.assertEqual(
            membership.role,ProjectMember.Role.DEVELOPER
        )

        self.assertTrue(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.new_member
            ).exists()
        )

    def test_admin_can_add_member(self):
        membership = add_member(
            project=self.project,
            user=self.new_member,
            role=ProjectMember.Role.VIEWER,
            added_by=self.admin,
        )

        self.assertEqual(
            membership.user,
            self.new_member,
        )

        self.assertEqual(
            membership.role,
            ProjectMember.Role.VIEWER,
        )
    def test_unauthorized_users_cannot_add_member(self):
        unauthorized_users=[
            self.viewer,
            self.developer,
            self.outsider
        ]

        for user in unauthorized_users:
            with self.subTest(user=user.username):
                with self.assertRaises(ValidationError):
                    add_member(
                        project=self.project,
                        user=self.new_member,
                        role=ProjectMember.Role.DEVELOPER,
                        added_by=user,
                    )
    def test_invalid_role_is_rejected(self):
        with self.assertRaises(ValidationError):
            add_member(
                project=self.project,
                user=self.new_member,
                role="MANAGER",
                added_by=self.owner,
            )
    def test_owner_role_cannot_be_added_directly(self):
        with self.assertRaises(ValidationError):
            add_member(
                project=self.project,
                user=self.new_member,
                role=ProjectMember.Role.OWNER,
                added_by=self.owner,
            )
    def test_adding_same_user_twice_is_rejected(self):
        add_member(
            project=self.project,
            user=self.new_member,
            role=ProjectMember.Role.DEVELOPER,
            added_by=self.owner,
        )

        with self.assertRaises(IntegrityError):
            add_member(
                project=self.project,
                user=self.new_member,
                role=ProjectMember.Role.VIEWER,
                added_by=self.owner,)


class TransferOwnershipTests(TestCase):
    def setUp(self):
        self.owner=User.objects.create_user(
            username="owner",
            password="PAssword"
        )
        self.admin=User.objects.create_user(
            username="Admin",
            password="Password@123"
        )
        self.developer=User.objects.create_user(
            username="DEVELOPER",
            password="Password"
        )
        self.viewer = User.objects.create_user(
            username="viewer",
            password="Password@123",
        )

        self.existing_member = User.objects.create_user(
            username="existing_member",
            password="Password@123",
        )

        self.outsider = User.objects.create_user(
            username="outsider",
            password="Password@123",
        )
        self.project = create_project(
            name="SmashUp",
            description="Issue-management system",
            owner=self.owner,
        )

        self.owner_membership = ProjectMember.objects.get(
            project=self.project,
            user=self.owner,
        )

        self.admin_membership = ProjectMember.objects.create(
            project=self.project,
            user=self.admin,
            role=ProjectMember.Role.ADMIN,
        )
        self.developer_membership = ProjectMember.objects.create(
            project=self.project,
            user=self.developer,
            role=ProjectMember.Role.DEVELOPER,
        )

        self.viewer_membership = ProjectMember.objects.create(
            project=self.project,
            user=self.viewer,
            role=ProjectMember.Role.VIEWER,
        )

        self.existing_membership = ProjectMember.objects.create(
            project=self.project,
            user=self.existing_member,
            role=ProjectMember.Role.DEVELOPER,
        )