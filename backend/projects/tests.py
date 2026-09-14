from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Project,ProjectMember
from .services import create_project

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