from django.db import models
# Create your models here.

from django.conf import settings
class Status(models.TextChoices):
    OPEN = "OPEN", "Open"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    IN_REVIEW = "IN_REVIEW", "In Review"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"
class Priority(models.TextChoices):
    HIGH="HIGH","High"
    MEDIUM="MEDIUM","Medium"
    LOW="LOW","Low"
    CRITICAL="CRITICAL","Critical"
class Issue(models.Model):
    project=models.ForeignKey("projects.Project",on_delete=models.CASCADE,related_name="issues")
    title=models.CharField(max_length=100)
    description=models.TextField()
    status=models.CharField(max_length=20,choices=Status.choices,default=Status.OPEN)
    priority=models.CharField(max_length=20,choices=Priority.choices,default=Priority.MEDIUM)
    category=models.CharField(max_length=50)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,related_name="created_issues")
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name="assigned_issues",help_text="Current person responsible")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    labels = models.ManyToManyField(
    "IssueLabel",
    related_name="issues",
    blank=True,
)
    def __str__(self):
       return self.title
class IssueComment(models.Model):
  issue = models.ForeignKey("Issue", on_delete=models.CASCADE, related_name="comments")
  author = models.ForeignKey(
      settings.AUTH_USER_MODEL,
      on_delete=models.SET_NULL,null=True,blank=True,)
  content = models.TextField()
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  def __str__(self):
      return str(self.author) if self.author else "Anonymous"
class IssueLabel(models.Model):
  project = models.ForeignKey(
      "projects.Project", on_delete=models.CASCADE, related_name="labels")
  name = models.CharField(max_length=50)
  def __str__(self):
     return self.name
  class Meta:
    constraints=[
       models.UniqueConstraint(
          fields=["project","name"],
          name='unique_project_name'
       )
    ]