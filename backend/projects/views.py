from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from django.db.models import Q
from .models import Project, ProjectMember, ProjectJoinRequest
from .serializers import (
    ProjectSerializer,
    ProjectMemberSerializer,
    ProjectJoinRequestSerializer,
)
from .services import (
    create_project,
    add_member,
    remove_member,
    transfer_ownership,
    request_to_join_project,
    accept_join_request,
    reject_join_request,
)
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

    @action(detail=False, methods=["post"], url_path="join_by_code")
    def join_by_code(self, request):
        code = request.data.get("code", "")
        message = request.data.get("message", "")
        if not code:
            return Response({"detail": "Project code is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            join_req = request_to_join_project(
                code=code, user=request.user, message=message
            )
            serializer = ProjectJoinRequestSerializer(join_req, context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=False, methods=["get"], url_path="lookup_code")
    def lookup_code(self, request):
        code = request.query_params.get("code", "").strip().upper()
        if not code:
            return Response({"detail": "Project code is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(code=code)
            is_member = (
                project.owner_id == request.user.id
                or project.members.filter(user=request.user).exists()
            )
            has_pending = ProjectJoinRequest.objects.filter(
                project=project, user=request.user, status=ProjectJoinRequest.Status.PENDING
            ).exists()
            return Response({
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "owner": project.owner.username,
                "code": project.code,
                "is_member": is_member,
                "has_pending_request": has_pending,
            })
        except Project.DoesNotExist:
            return Response({"detail": "Project with this code was not found."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["get"], url_path="join_requests")
    def join_requests(self, request, pk=None):
        project = self.get_object()
        can_manage = (
            project.owner_id == request.user.id
            or project.members.filter(user=request.user, role=ProjectMember.Role.ADMIN).exists()
        )
        if not can_manage:
            return Response(
                {"detail": "Only project owners and admins can view join requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        requests = project.join_requests.filter(status=ProjectJoinRequest.Status.PENDING)
        serializer = ProjectJoinRequestSerializer(requests, many=True, context={"request": request})
        return Response(serializer.data)


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


class ProjectJoinRequestViewSet(viewsets.ModelViewSet):
    queryset = ProjectJoinRequest.objects.all()
    serializer_class = ProjectJoinRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    filterset_fields = ['project', 'status', 'user']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return ProjectJoinRequest.objects.none()

        managed_project_ids = list(
            Project.objects.filter(owner=user).values_list("id", flat=True)
        ) + list(
            ProjectMember.objects.filter(
                user=user, role=ProjectMember.Role.ADMIN
            ).values_list("project_id", flat=True)
        )

        return ProjectJoinRequest.objects.filter(
            Q(project_id__in=managed_project_ids) | Q(user=user)
        ).distinct()

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        role = request.data.get("role", ProjectMember.Role.DEVELOPER)
        try:
            join_req = accept_join_request(
                join_request_id=pk,
                accepted_by=request.user,
                role=role,
            )
            serializer = self.get_serializer(join_req)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        try:
            join_req = reject_join_request(
                join_request_id=pk,
                rejected_by=request.user,
            )
            serializer = self.get_serializer(join_req)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)
