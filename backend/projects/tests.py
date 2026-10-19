from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Project, ProjectMember, ProjectJoinRequest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from .services import (
    create_project,
    add_member,
    transfer_ownership,
    remove_member,
    request_to_join_project,
    accept_join_request,
    reject_join_request,
)

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

    def test_removed_former_owner_cannot_add_using_stale_project(self):
        new_owner = User.objects.create_user(
            username="new_project_owner",
            password="Password@123",
        )

        target_user = User.objects.create_user(
            username="stale_test_target",
            password="Password@123",
        )

        ProjectMember.objects.create(
            project=self.project,
            user=new_owner,
            role=ProjectMember.Role.DEVELOPER,
        )

        stale_project = self.project

        transfer_ownership(
            project=self.project,
            new_owner=new_owner,
            transferred_by=self.owner,
        )

        remove_member(
            project=self.project,
            user=self.owner,
            removed_by=new_owner,
        )

        with self.assertRaises(ValidationError):
            add_member(
                project=stale_project,
                user=target_user,
                role=ProjectMember.Role.ADMIN,
                added_by=self.owner,
            )

        self.assertFalse(
            ProjectMember.objects.filter(
                project=self.project,
                user=target_user,
            ).exists()
        )
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
    def test_owner_can_transfer_to_existing_member(self):
        transfer_ownership(
            project=self.project,
            new_owner=self.existing_member,
            transferred_by=self.owner,
        )

        self.project.refresh_from_db()

        self.assertEqual(
            self.project.owner,
            self.existing_member,
        )
    def test_transfer_updates_old_and_new_owner_roles(self):
        transfer_ownership(
            project=self.project,
            new_owner=self.existing_member,
            transferred_by=self.owner,
        )

        self.owner_membership.refresh_from_db()
        self.existing_membership.refresh_from_db()

        self.assertEqual(
            self.owner_membership.role,
            ProjectMember.Role.ADMIN,
        )

        self.assertEqual(
            self.existing_membership.role,
            ProjectMember.Role.OWNER,
        )
    def test_exactly_one_owner_membership_remains(self):
        transfer_ownership(
            project=self.project,
            new_owner=self.existing_member,
            transferred_by=self.owner,
        )

        self.project.refresh_from_db()
        self.owner_membership.refresh_from_db()
        self.existing_membership.refresh_from_db()

        owner_memberships = ProjectMember.objects.filter(
            project=self.project,
            role=ProjectMember.Role.OWNER,
        )

        self.assertEqual(owner_memberships.count(), 1)
        self.assertEqual(
            owner_memberships.first().user,
            self.existing_member,
        )
    def test_unauthorized_users_cannot_transfer_ownership(self):
        unauthorized_users = [
            self.admin,
            self.developer,
            self.viewer,
            self.outsider,
        ]

        for user in unauthorized_users:
            with self.subTest(user=user.username):
                with self.assertRaises(ValidationError):
                    transfer_ownership(
                        project=self.project,
                        new_owner=self.existing_member,
                        transferred_by=user,
                    )

        self.project.refresh_from_db()

        self.assertEqual(self.project.owner, self.owner)
    def test_transfer_to_current_owner_is_rejected(self):
        with self.assertRaises(ValidationError):
            transfer_ownership(
                project=self.project,
                new_owner=self.owner,
                transferred_by=self.owner,
            )

        self.project.refresh_from_db()
        self.owner_membership.refresh_from_db()

        self.assertEqual(self.project.owner, self.owner)
        self.assertEqual(
            self.owner_membership.role,
            ProjectMember.Role.OWNER,
        )
    def test_transfer_to_non_member_creates_owner_membership(self):
        self.assertFalse(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.outsider,
            ).exists()
        )

        transfer_ownership(
            project=self.project,
            new_owner=self.outsider,
            transferred_by=self.owner,
        )

        self.project.refresh_from_db()
        self.owner_membership.refresh_from_db()

        new_owner_membership = ProjectMember.objects.get(
            project=self.project,
            user=self.outsider,
        )

        self.assertEqual(self.project.owner, self.outsider)

        self.assertEqual(
            new_owner_membership.role,
            ProjectMember.Role.OWNER,
        )

        self.assertEqual(
            self.owner_membership.role,
            ProjectMember.Role.ADMIN,
        )
class RemoveMemberTests(TestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="remove_owner",
            password="Password@123",
        )

        self.admin = User.objects.create_user(
            username="remove_admin",
            password="Password@123",
        )

        self.developer = User.objects.create_user(
            username="remove_developer",
            password="Password@123",
        )

        self.viewer = User.objects.create_user(
            username="remove_viewer",
            password="Password@123",
        )

        self.outsider = User.objects.create_user(
            username="remove_outsider",
            password="Password@123",
        )

        self.target_member = User.objects.create_user(
            username="target_member",
            password="Password@123",
        )

        self.project = create_project(
            name="SmashUp",
            description="Issue-management system",
            owner=self.owner,
        )

        ProjectMember.objects.create(
            project=self.project,
            user=self.admin,
            role=ProjectMember.Role.ADMIN,
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

        ProjectMember.objects.create(
            project=self.project,
            user=self.target_member,
            role=ProjectMember.Role.DEVELOPER,
        )
    def test_owner_can_remove_member(self):
        remove_member(
            project=self.project,
            user=self.target_member,
            removed_by=self.owner,
        )

        membership_exists = ProjectMember.objects.filter(
            project=self.project,
            user=self.target_member,
        ).exists()

        self.assertFalse(membership_exists)
    def test_admin_can_remove_member(self):
        remove_member(
            project=self.project,
            user=self.target_member,
            removed_by=self.admin,
        )

        self.assertFalse(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.target_member,
            ).exists()
        )
    def test_unauthorized_users_cannot_remove_members(self):
        unauthorized_users = [
            self.developer,
            self.viewer,
            self.outsider,
        ]

        for user in unauthorized_users:
            with self.subTest(user=user.username):
                with self.assertRaises(ValidationError):
                    remove_member(
                        project=self.project,
                        user=self.target_member,
                        removed_by=user,
                    )

        self.assertTrue(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.target_member,
            ).exists()
        )
    def test_project_owner_cannot_be_removed(self):
        with self.assertRaises(ValidationError):
            remove_member(
                project=self.project,
                user=self.owner,
                removed_by=self.admin,
            )

        self.assertTrue(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.owner,
                role=ProjectMember.Role.OWNER,
            ).exists()
        )
    def test_removing_non_member_is_rejected(self):
        with self.assertRaises(ValidationError):
            remove_member(
                project=self.project,
                user=self.outsider,
                removed_by=self.owner,
            )


class ProjectCodeAndJoinRequestTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="code_owner",
            password="Password@123",
        )
        self.applicant = User.objects.create_user(
            username="applicant",
            password="Password@123",
        )
        self.outsider = User.objects.create_user(
            username="outsider_user",
            password="Password@123",
        )
        self.project = create_project(
            name="Joinable Project",
            description="Testing codes and requests",
            owner=self.owner,
        )

    def test_project_has_unique_formatted_code(self):
        self.assertTrue(self.project.code.startswith("PRJ-"))
        parts = self.project.code.split("-")
        self.assertEqual(len(parts), 4)
        for part in parts[1:]:
            self.assertEqual(len(part), 4)

    def test_user_can_request_to_join_project_by_code(self):
        req = request_to_join_project(
            code=self.project.code,
            user=self.applicant,
            message="Hi, I want to contribute!",
        )
        self.assertEqual(req.project, self.project)
        self.assertEqual(req.user, self.applicant)
        self.assertEqual(req.status, ProjectJoinRequest.Status.PENDING)
        self.assertEqual(req.message, "Hi, I want to contribute!")

    def test_duplicate_pending_request_is_rejected(self):
        request_to_join_project(
            code=self.project.code,
            user=self.applicant,
            message="First request",
        )
        with self.assertRaises(ValidationError):
            request_to_join_project(
                code=self.project.code,
                user=self.applicant,
                message="Second request",
            )

    def test_existing_member_cannot_request_to_join(self):
        with self.assertRaises(ValidationError):
            request_to_join_project(
                code=self.project.code,
                user=self.owner,
                message="I'm already the owner",
            )

    def test_owner_can_accept_join_request(self):
        req = request_to_join_project(
            code=self.project.code,
            user=self.applicant,
        )
        accepted_req = accept_join_request(
            join_request_id=req.id,
            accepted_by=self.owner,
            role=ProjectMember.Role.DEVELOPER,
        )
        self.assertEqual(accepted_req.status, ProjectJoinRequest.Status.ACCEPTED)
        self.assertTrue(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.applicant,
                role=ProjectMember.Role.DEVELOPER,
            ).exists()
        )

    def test_owner_can_reject_join_request(self):
        req = request_to_join_project(
            code=self.project.code,
            user=self.applicant,
        )
        rejected_req = reject_join_request(
            join_request_id=req.id,
            rejected_by=self.owner,
        )
        self.assertEqual(rejected_req.status, ProjectJoinRequest.Status.REJECTED)
        self.assertFalse(
            ProjectMember.objects.filter(
                project=self.project,
                user=self.applicant,
            ).exists()
        )

    def test_unauthorized_user_cannot_accept_join_request(self):
        req = request_to_join_project(
            code=self.project.code,
            user=self.applicant,
        )
        with self.assertRaises(ValidationError):
            accept_join_request(
                join_request_id=req.id,
                accepted_by=self.outsider,
                role=ProjectMember.Role.DEVELOPER,
            )

    def test_email_masking_for_other_users(self):
        from rest_framework.test import APIRequestFactory
        from .serializers import ProjectMemberUserSerializer, mask_email

        self.applicant.email = "john.doe@company.com"
        self.applicant.save()

        # Direct mask_email test
        self.assertEqual(mask_email("john.doe@company.com"), "j***@company.com")

        factory = APIRequestFactory()

        # Request by outsider -> masked
        req_outsider = factory.get("/")
        req_outsider.user = self.outsider
        serializer_other = ProjectMemberUserSerializer(self.applicant, context={"request": req_outsider})
        self.assertEqual(serializer_other.data["email"], "j***@company.com")
        self.assertFalse(serializer_other.data["is_self"])

        # Request by self -> unmasked
        req_self = factory.get("/")
        req_self.user = self.applicant
        serializer_self = ProjectMemberUserSerializer(self.applicant, context={"request": req_self})
        self.assertEqual(serializer_self.data["email"], "john.doe@company.com")
        self.assertTrue(serializer_self.data["is_self"])

    def test_project_serializer_includes_code(self):
        from .serializers import ProjectSerializer

        serializer = ProjectSerializer(self.project)
        self.assertEqual(serializer.data["code"], self.project.code)