from django.db import models
from django.conf import settings
# Create your models here.
class Project(models.Model):
    name=models.CharField(max_length=100)
    description=models.TextField()
    owner=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name="owned_projects")
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

class projectMember(models.Model):
    class Role(models.TextChoices):
        OWNER="OWNER",'owner'
        ADMIN = "ADMIN", "Admin"
        DEVELOPER = "DEVELOPER", "Developer"
        VIEWER = "VIEWER", "Viewer"
    project=models.ForeignKey(Project,on_delete=models.CASCADE,related_name="members")
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name="project_memberships")
    role=models.CharField(max_length=20,choices=Role.choices,default=Role.VIEWER)
    joined_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints=[
            models.UniqueConstraint(
                fields=["project","user"],
                name="unique_project_member"
            )
        ]
        ordering=["joined_at"]

    def __str__(self):
        return f"{self.user} in {self.project} as {self.role}"
