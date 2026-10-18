from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Project, ProjectMember
from .serializers import ProjectSerializer, ProjectMemberSerializer
from .services import create_project, add_member, remove_member, transfer_ownership
from issues.permissions import IsProjectMember, IsProjectMemberForList


def _handle_service_error(exc):
    """Convert a Django ValidationError from a service into a DRF 400 response."""
    if hasattr(exc, "message_dict"):
        return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
    return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMemberForList, IsProjectMember]

    filterset_fields = ['owner']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return projects the user owns or is a member of."""
        user = self.request.user
        if not user or not user.is_authenticated:
            return Project.objects.none()

        my_project_ids = ProjectMember.objects.filter(
            user=user
        ).values_list("project_id", flat=True)

        owned_project_ids = (
            Project.objects.filter(owner=user).values_list("id", flat=True)
        )

        all_project_ids = set(list(my_project_ids) + list(owned_project_ids))
        return Project.objects.filter(id__in=all_project_ids)

    def create(self, request, *args, **kwargs):
        try:
            project = create_project(
                name=request.data.get("name", ""),
                description=request.data.get("description", ""),
                owner=request.user,
            )
            serializer = self.get_serializer(project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def transfer_ownership(self, request, pk=None):
        try:
            project = self.get_object()
            new_owner = get_object_or_404(User, pk=request.data.get("new_owner"))
            project = transfer_ownership(
                project=project, new_owner=new_owner, transferred_by=request.user
            )
            serializer = self.get_serializer(project)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)


class ProjectMemberViewSet(viewsets.ModelViewSet):
    queryset = ProjectMember.objects.all()
    serializer_class = ProjectMemberSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMemberForList, IsProjectMember]

    filterset_fields = ['project', 'user', 'role']
    search_fields = ['user__username', 'user__email']
    ordering_fields = ['joined_at', 'role']
    ordering = ['joined_at']

    def get_queryset(self):
        """Only return memberships for projects the user is a member of."""
        user = self.request.user
        if not user or not user.is_authenticated:
            return ProjectMember.objects.none()

        my_project_ids = ProjectMember.objects.filter(
            user=user
        ).values_list("project_id", flat=True)

        owned_project_ids = (
            Project.objects.filter(owner=user).values_list("id", flat=True)
        )

        all_project_ids = set(list(my_project_ids) + list(owned_project_ids))
        return ProjectMember.objects.filter(project_id__in=all_project_ids)

    def create(self, request, *args, **kwargs):
        try:
            project = get_object_or_404(Project, pk=request.data.get("project"))
            user = get_object_or_404(User, pk=request.data.get("user"))
            membership = add_member(
                project=project,
                user=user,
                role=request.data.get("role"),
                added_by=request.user,
            )
            serializer = self.get_serializer(membership)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            project = instance.project
            user = instance.user
            remove_member(project=project, user=user, removed_by=request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)
