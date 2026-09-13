from django.db import transaction
from django.core.exceptions import ValidationError

from .models import Project, ProjectMember


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
    if project.owner_id != transferred_by.id:
        raise ValidationError("Only the current owner can transfer ownership.")

    if project.owner_id == new_owner.id:
        raise ValidationError("This user is already the owner.")

    project = Project.objects.select_for_update().get(pk=project.pk)
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
    project.save(update_fields=["owner", "updated_at"])

    return project
