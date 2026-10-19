from django.db import transaction
from django.core.exceptions import ValidationError

from .models import Project, ProjectMember, ProjectJoinRequest
from issues.models import Issue, IssueHistory
from django.utils import timezone


@transaction.atomic
def create_project(*, name, description, owner):
    project = Project.objects.create(
        name=name,
        description=description,
        owner=owner,
    )

    ProjectMember.objects.create(
        project=project,
        user=owner,
        role=ProjectMember.Role.OWNER,
    )

    return project


@transaction.atomic
def add_member(*, project, user, role, added_by):
    project = Project.objects.select_for_update().get(pk=project.pk)
    can_manage_members = (
        project.owner_id == added_by.id
        or project.members.filter(
            user=added_by,
            role=ProjectMember.Role.ADMIN,
        ).exists()
    )

    if not can_manage_members:
        raise ValidationError("Only the project owner or an admin can add members.")

    if role not in ProjectMember.Role.values:
        raise ValidationError("Invalid project member role.")

    if role == ProjectMember.Role.OWNER:
        raise ValidationError("Use transfer_ownership() to change the project owner.")

    return ProjectMember.objects.create(
        project=project,
        user=user,
        role=role,
    )


@transaction.atomic
def transfer_ownership(*, project, new_owner, transferred_by):
    project=(
        Project.objects.select_for_update().get(pk=project.pk)
    )
    if project.owner_id != transferred_by.id:
        raise ValidationError("Only the current owner can transfer ownership.")
    if project.owner_id == new_owner.id:
        raise ValidationError("This user is already the owner.")
    old_owner_membership = ProjectMember.objects.get(
        project=project,
        user_id=project.owner_id,
    )
    new_owner_membership, _ = ProjectMember.objects.get_or_create(
        project=project,
        user=new_owner,
        defaults={"role": ProjectMember.Role.VIEWER},
    )
    old_owner_membership.role = ProjectMember.Role.ADMIN
    old_owner_membership.save(update_fields=["role"])
    new_owner_membership.role = ProjectMember.Role.OWNER
    new_owner_membership.save(update_fields=["role"])
    project.owner = new_owner
    project.save(_ownership_transfer=True,update_fields=["owner", "updated_at"])
    return project
@transaction.atomic
def remove_member(*, project, user, removed_by):
    project = Project.objects.select_for_update().get(pk=project.pk)
    can_manage_members = (
        project.owner_id == removed_by.pk
        or project.members.filter(
            user=removed_by,
            role=ProjectMember.Role.ADMIN,
        ).exists()
    )
    if not can_manage_members:
        raise ValidationError("You don't have permission to remove members")
    if user.pk == project.owner_id:
        raise ValidationError("Transfer ownership before removing the owner")
    membership = ProjectMember.objects.filter(
        project=project, user=user
    ).first()
    if membership is None:
         raise ValidationError("User is not a member of this project")

    # Unassign any issues in this project assigned to the user being removed
    issues_to_unassign = Issue.objects.filter(project=project, assigned_to=user)
    for issue in issues_to_unassign:
        old_assignee = issue.assigned_to
        issue.assigned_to = None
        issue.save(update_fields=["assigned_to", "updated_at"])

        IssueHistory.objects.create(
            issue=issue,
            user=removed_by,
            action="unassigned_due_to_removal",
            old_value=old_assignee.username if old_assignee else None,
            new_value=None,
        )

    membership.delete()

    return project


@transaction.atomic
def request_to_join_project(*, code, user, message=""):
    """Allow an authenticated user to request to join a project via its unique code."""
    if not code:
        raise ValidationError("Project code is required.")

    code = code.strip().upper()
    try:
        project = Project.objects.get(code=code)
    except Project.DoesNotExist:
        raise ValidationError("Project with this code was not found.")

    if project.owner_id == user.id or project.members.filter(user=user).exists():
        raise ValidationError("You are already a member of this project.")

    existing_pending = ProjectJoinRequest.objects.filter(
        project=project, user=user, status=ProjectJoinRequest.Status.PENDING
    ).first()
    if existing_pending:
        raise ValidationError("You already have a pending join request for this project.")

    return ProjectJoinRequest.objects.create(
        project=project,
        user=user,
        message=message or "",
        status=ProjectJoinRequest.Status.PENDING,
    )


@transaction.atomic
def accept_join_request(*, join_request_id, accepted_by, role=ProjectMember.Role.DEVELOPER):
    """Project owner or admin accepts a pending join request and adds user to project."""
    try:
        join_request = ProjectJoinRequest.objects.select_for_update().get(pk=join_request_id)
    except ProjectJoinRequest.DoesNotExist:
        raise ValidationError("Join request does not exist.")

    project = Project.objects.select_for_update().get(pk=join_request.project_id)

    can_manage = (
        project.owner_id == accepted_by.id
        or project.members.filter(
            user=accepted_by, role=ProjectMember.Role.ADMIN
        ).exists()
    )
    if not can_manage:
        raise ValidationError("Only the project owner or an admin can accept join requests.")

    if join_request.status != ProjectJoinRequest.Status.PENDING:
        raise ValidationError(f"This request has already been {join_request.status.lower()}.")

    join_request.status = ProjectJoinRequest.Status.ACCEPTED
    join_request.save(update_fields=["status", "updated_at"])

    # If the user is not already a member, add them
    if not project.members.filter(user=join_request.user).exists():
        add_member(
            project=project,
            user=join_request.user,
            role=role,
            added_by=accepted_by,
        )

    return join_request


@transaction.atomic
def reject_join_request(*, join_request_id, rejected_by):
    """Project owner or admin rejects a pending join request."""
    try:
        join_request = ProjectJoinRequest.objects.select_for_update().get(pk=join_request_id)
    except ProjectJoinRequest.DoesNotExist:
        raise ValidationError("Join request does not exist.")

    project = Project.objects.select_for_update().get(pk=join_request.project_id)

    can_manage = (
        project.owner_id == rejected_by.id
        or project.members.filter(
            user=rejected_by, role=ProjectMember.Role.ADMIN
        ).exists()
    )
    if not can_manage:
        raise ValidationError("Only the project owner or an admin can reject join requests.")

    if join_request.status != ProjectJoinRequest.Status.PENDING:
        raise ValidationError(f"This request has already been {join_request.status.lower()}.")

    join_request.status = ProjectJoinRequest.Status.REJECTED
    join_request.save(update_fields=["status", "updated_at"])

    return join_request
