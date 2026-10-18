from rest_framework import permissions
from projects.models import Project, ProjectMember


def _get_project_from_obj(obj):
    """Figure out which project an object belongs to, regardless of model type."""
    if isinstance(obj, Project):
        return obj
    if hasattr(obj, "project"):
        return obj.project
    if hasattr(obj, "issue"):
        return obj.issue.project
    return None


class IsProjectMember(permissions.BasePermission):
    """
    Object-level permission: only allow access if the user is the project owner
    or a member of the project that the object belongs to.
    """

    message = "You do not have permission to access this item. It belongs to a project you are not a member of."

    def has_object_permission(self, request, view, obj):
        project = _get_project_from_obj(obj)
        if project is None:
            return False

        # Project owners always have access
        if project.owner_id == request.user.pk:
            return True

        # Members with any role have access
        return ProjectMember.objects.filter(
            project=project, user=request.user
        ).exists()


class IsProjectMemberForList(permissions.BasePermission):
    """
    Permission for list/create actions. Checks membership based on the project
    identified from request data (for create) or allows authenticated users
    to see their own projects (for list, handled by get_queryset).
    """

    message = "You do not have permission to access this project."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # For list actions, get_queryset handles filtering. Just require auth.
        if view.action == "list":
            return True

        # For create actions, check the project in request data
        if view.action == "create":
            project_id = request.data.get("project")
            if project_id is None:
                # No project specified; let the view handle it
                return True
            try:
                project = Project.objects.get(pk=project_id)
            except Project.DoesNotExist:
                return False
            if project.owner_id == request.user.pk:
                return True
            return ProjectMember.objects.filter(
                project=project, user=request.user
            ).exists()

        # For other actions (retrieve, update, destroy), object-level check happens
        # in has_object_permission; just require auth here.
        return True
