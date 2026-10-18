from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from projects.models import Project,ProjectMember
from .models import Issue, Status, IssueComment, IssueLabel, IssueHistory

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

    record_history(
        issue=issue,
        user=created_by,
        action="issue_created",
        old_value=None,
        new_value=issue.title,
    )

    return issue


@transaction.atomic
def edit_issue(
    *,
    issue,
    edited_by,
    title=None,
    description=None,
    category=None,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=edited_by).first()
    is_project_owner = project.owner_id == edited_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can edit an issue"
        )

    old_title = issue.title
    old_description = issue.description
    old_category = issue.category

    if title is not None:
        issue.title = title
    if description is not None:
        issue.description = description
    if category is not None:
        issue.category = category

    issue.full_clean()
    issue.save(
        update_fields=["title", "description", "category", "updated_at"]
    )

    if issue.title != old_title:
        record_history(
            issue=issue,
            user=edited_by,
            action="title_changed",
            old_value=old_title,
            new_value=issue.title,
        )
    if issue.description != old_description:
        record_history(
            issue=issue,
            user=edited_by,
            action="description_changed",
            old_value=old_description,
            new_value=issue.description,
        )
    if issue.category != old_category:
        record_history(
            issue=issue,
            user=edited_by,
            action="category_changed",
            old_value=old_category,
            new_value=issue.category,
        )

    return issue


@transaction.atomic
def assign_issue(
    *,
    issue,
    assigned_to,
    assigned_by,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=assigned_by).first()
    is_project_owner = project.owner_id == assigned_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can assign an issue"
        )

    assignee_is_member = project.members.filter(user=assigned_to).exists()
    if not assignee_is_member:
        raise ValidationError("The assignee must be a member of this project")

    old_assignee = issue.assigned_to
    issue.assigned_to = assigned_to
    issue.full_clean()
    issue.save(update_fields=["assigned_to", "updated_at"])

    record_history(
        issue=issue,
        user=assigned_by,
        action="assigned",
        old_value=old_assignee.username if old_assignee else None,
        new_value=assigned_to.username,
    )

    return issue


@transaction.atomic
def reassign_issue(
    *,
    issue,
    assigned_to,
    assigned_by,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=assigned_by).first()
    is_project_owner = project.owner_id == assigned_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can reassign an issue"
        )

    assignee_is_member = project.members.filter(user=assigned_to).exists()
    if not assignee_is_member:
        raise ValidationError("The assignee must be a member of this project")

    old_assignee = issue.assigned_to
    issue.assigned_to = assigned_to
    issue.full_clean()
    issue.save(update_fields=["assigned_to", "updated_at"])

    record_history(
        issue=issue,
        user=assigned_by,
        action="reassigned",
        old_value=old_assignee.username if old_assignee else None,
        new_value=assigned_to.username,
    )

    return issue


@transaction.atomic
def unassign_issue(
    *,
    issue,
    unassigned_by,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=unassigned_by).first()
    is_project_owner = project.owner_id == unassigned_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can unassign an issue"
        )

    old_assignee = issue.assigned_to
    issue.assigned_to = None
    issue.full_clean()
    issue.save(update_fields=["assigned_to", "updated_at"])

    record_history(
        issue=issue,
        user=unassigned_by,
        action="unassigned",
        old_value=old_assignee.username if old_assignee else None,
        new_value=None,
    )

    return issue


@transaction.atomic
def change_issue_status(
    *,
    issue,
    status,
    changed_by,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=changed_by).first()
    is_project_owner = project.owner_id == changed_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can change an issue status"
        )

    old_status = issue.status
    issue.status = status

    if status == Status.RESOLVED and old_status != Status.RESOLVED:
        issue.resolved_at = timezone.now()
    elif old_status == Status.RESOLVED and status != Status.RESOLVED:
        issue.resolved_at = None

    issue.full_clean()
    issue.save(update_fields=["status", "resolved_at", "updated_at"])

    record_history(
        issue=issue,
        user=changed_by,
        action="status_changed",
        old_value=old_status,
        new_value=issue.status,
    )

    return issue


@transaction.atomic
def change_issue_priority(
    *,
    issue,
    priority,
    changed_by,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=changed_by).first()
    is_project_owner = project.owner_id == changed_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can change an issue priority"
        )

    old_priority = issue.priority
    issue.priority = priority
    issue.full_clean()
    issue.save(update_fields=["priority", "updated_at"])

    record_history(
        issue=issue,
        user=changed_by,
        action="priority_changed",
        old_value=old_priority,
        new_value=issue.priority,
    )

    return issue


@transaction.atomic
def create_comment(
    *,
    issue,
    author,
    content,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    author_is_member = project.members.filter(user=author).exists()
    if not author_is_member:
        raise ValidationError(
            "Only members of this project can comment on its issues"
        )

    comment = IssueComment(
        issue=issue,
        author=author,
        content=content,
    )
    comment.full_clean()
    comment.save()

    record_history(
        issue=issue,
        user=author,
        action="comment_added",
        old_value=None,
        new_value=content,
    )

    return comment


@transaction.atomic
def edit_comment(
    *,
    comment,
    edited_by,
    content=None,
):
    comment = IssueComment.objects.select_for_update().get(pk=comment.pk)

    issue = Issue.objects.select_for_update().get(pk=comment.issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=edited_by).first()
    is_project_owner = project.owner_id == edited_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )

    is_author = comment.author_id == edited_by.pk
    if not (is_author or is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the comment author, the project owner, an admin, or a developer can edit a comment"
        )

    old_content = comment.content
    if content is not None:
        comment.content = content

    comment.full_clean()
    comment.save(update_fields=["content", "updated_at"])

    if comment.content != old_content:
        record_history(
            issue=issue,
            user=edited_by,
            action="comment_edited",
            old_value=old_content,
            new_value=comment.content,
        )

    return comment


@transaction.atomic
def remove_comment(
    *,
    comment,
    removed_by,
):
    comment = IssueComment.objects.select_for_update().get(pk=comment.pk)

    issue = Issue.objects.select_for_update().get(pk=comment.issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    membership = project.members.filter(user=removed_by).first()
    is_project_owner = project.owner_id == removed_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )

    is_author = comment.author_id == removed_by.pk
    if not (is_author or is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the comment author, the project owner, an admin, or a developer can remove a comment"
        )

    old_content = comment.content
    comment.delete()

    record_history(
        issue=issue,
        user=removed_by,
        action="comment_removed",
        old_value=old_content,
        new_value=None,
    )

    return comment


@transaction.atomic
def create_label(
    *,
    project,
    name,
    created_by,
):
    project = Project.objects.select_for_update().get(pk=project.pk)

    membership = project.members.filter(user=created_by).first()
    is_project_owner = project.owner_id == created_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can create labels"
        )

    label = IssueLabel(
        project=project,
        name=name,
    )
    label.full_clean()
    label.save()

    return label


@transaction.atomic
def attach_label_to_issue(
    *,
    issue,
    label,
    attached_by,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    label = IssueLabel.objects.select_for_update().get(pk=label.pk)

    membership = project.members.filter(user=attached_by).first()
    is_project_owner = project.owner_id == attached_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can attach labels to an issue"
        )

    if label.project_id != project.pk:
        raise ValidationError(
            "This label belongs to a different project and cannot be attached to this issue"
        )

    issue.labels.add(label)

    record_history(
        issue=issue,
        user=attached_by,
        action="label_attached",
        old_value=None,
        new_value=label.name,
    )

    return issue


@transaction.atomic
def detach_label_from_issue(
    *,
    issue,
    label,
    detached_by,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    project = Project.objects.select_for_update().get(pk=issue.project.pk)

    label = IssueLabel.objects.select_for_update().get(pk=label.pk)

    membership = project.members.filter(user=detached_by).first()
    is_project_owner = project.owner_id == detached_by.pk

    allowed_roles = {
        ProjectMember.Role.ADMIN,
        ProjectMember.Role.DEVELOPER,
    }
    has_allowed_role = (
        membership is not None and membership.role in allowed_roles
    )
    if not (is_project_owner or has_allowed_role):
        raise ValidationError(
            "Only the project owner, an admin, or a developer can detach labels from an issue"
        )

    if label.project_id != project.pk:
        raise ValidationError(
            "This label belongs to a different project and cannot be detached from this issue"
        )

    issue.labels.remove(label)

    record_history(
        issue=issue,
        user=detached_by,
        action="label_detached",
        old_value=label.name,
        new_value=None,
    )

    return issue


@transaction.atomic
def record_history(
    *,
    issue,
    user,
    action,
    old_value=None,
    new_value=None,
):
    issue = Issue.objects.select_for_update().get(pk=issue.pk)

    history = IssueHistory(
        issue=issue,
        user=user,
        action=action,
        old_value=old_value,
        new_value=new_value,
    )
    history.full_clean()
    history.save()

    return history