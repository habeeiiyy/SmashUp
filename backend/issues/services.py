from django.core.exceptions import ValidationError
from django.db import transaction
from projects.models import Project,ProjectMember
from .models import Issue

@transaction.atomic
def create_issue(
    *,project,title,description,category,created_by,assigned_to=None):
    project=Project.objects.select_for_update().get(pk=project.pk)

    creator_membership=project.members.filter(user=created_by).first()

    allowed_roles={
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER
    }
    is_project_owner=project.owner_id == created_by.pk

    has_allowed_role=(
        creator_membership is not None and creator_membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can create issues"
        )
    if assigned_to is not None:
        assignee_is_member=project.members.filter(user=assigned_to).exists()
        if not assignee_is_member:
            raise ValidationError("The assignee must be a member of this  project")
    issue=Issue(
         project=project,
        title=title,
        description=description,
        category=category,
        created_by=created_by,
        assigned_to=assigned_to,
     )
    issue.full_clean()
    issue.save()

    return issue