import secrets
import string
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


def generate_project_code():
    """Generate a unique random big code formatted as PRJ-XXXX-XXXX-XXXX."""
    chars = string.ascii_uppercase + string.digits
    p1 = "".join(secrets.choice(chars) for _ in range(4))
    p2 = "".join(secrets.choice(chars) for _ in range(4))
    p3 = "".join(secrets.choice(chars) for _ in range(4))
    return f"PRJ-{p1}-{p2}-{p3}"


class Project(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_projects",
    )
    code = models.CharField(max_length=32, unique=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.pk:
            old_owner_id = (
                type(self)
                .objects.filter(pk=self.pk)
                .values_list("owner_id", flat=True)
                .first()
            )

            if old_owner_id != self.owner_id:
                raise ValidationError(
                    "Do not change project owner directly. Use transfer_ownership()."
                )

    def save(self, *args, **kwargs):
        ownership_transfer = kwargs.pop("_ownership_transfer", False)
        if not ownership_transfer:
            self.clean()

        if not self.code:
            while True:
                candidate = generate_project_code()
                if not type(self).objects.filter(code=candidate).exists():
                    self.code = candidate
                    break

        return super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProjectMember(models.Model):
    class Role(models.TextChoices):
        OWNER = "OWNER", "Owner"
        ADMIN = "ADMIN", "Admin"
        DEVELOPER = "DEVELOPER", "Developer"
        VIEWER = "VIEWER", "Viewer"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.VIEWER)
    joined_at = models.DateTimeField(auto_now_add=True)

    def delete(self, *args, **kwargs):
        if self.project.owner_id == self.user_id:
            raise ValidationError(
                "The project owner cannot be removed. Transfer ownership first."
            )
        return super().delete(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"], name="unique_project_member"
            ),
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(role="OWNER"),
                name="one_owner_per_project",
            ),
        ]
        ordering = ["joined_at"]

    def __str__(self):
        return f"{self.user} in {self.project} as {self.role}"


class ProjectJoinRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="join_requests"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_join_requests",
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                condition=Q(status="PENDING"),
                name="unique_pending_project_join_request",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} -> {self.project} ({self.status})"
