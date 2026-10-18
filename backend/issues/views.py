from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Issue, IssueComment, IssueLabel
from projects.models import Project, ProjectMember
from .serializers import IssueSerializer, IssueCommentSerializer, IssueLabelSerializer
from .services import (
    create_issue,
    edit_issue,
    assign_issue,
    reassign_issue,
    unassign_issue,
    change_issue_status,
    change_issue_priority,
    create_comment,
    edit_comment,
    remove_comment,
    create_label,
    attach_label_to_issue,
    detach_label_from_issue,
)
from .permissions import IsProjectMember, IsProjectMemberForList


def _handle_service_error(exc):
    """Convert a Django ValidationError from a service into a DRF 400 response."""
    if hasattr(exc, "message_dict"):
        return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
    return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


User = get_user_model()


class IssueViewSet(viewsets.ModelViewSet):
    queryset = Issue.objects.all()
    serializer_class = IssueSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMemberForList, IsProjectMember]

    # Filtering, search, and ordering
    filterset_fields = ['project', 'status', 'priority', 'category', 'assigned_to']
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return issues from projects the user is a member of."""
        user = self.request.user
        if not user or not user.is_authenticated:
            return Issue.objects.none()

        my_project_ids = ProjectMember.objects.filter(
            user=user
        ).values_list("project_id", flat=True)

        # Also include projects the user owns (owner might not have a membership row)
        owned_project_ids = (
            Project.objects.filter(owner=user).values_list("id", flat=True)
        )

        all_project_ids = set(list(my_project_ids) + list(owned_project_ids))
        return Issue.objects.filter(project_id__in=all_project_ids)

    def create(self, request, *args, **kwargs):
        try:
            project = get_object_or_404(Project, pk=request.data.get("project"))
            assigned_to = None
            assigned_to_id = request.data.get("assigned_to")
            if assigned_to_id is not None:
                assigned_to = get_object_or_404(User, pk=assigned_to_id)

            issue = create_issue(
                project=project,
                title=request.data.get("title", ""),
                description=request.data.get("description", ""),
                category=request.data.get("category", ""),
                created_by=request.user,
                assigned_to=assigned_to,
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            issue = edit_issue(
                issue=instance,
                edited_by=request.user,
                title=request.data.get("title"),
                description=request.data.get("description"),
                category=request.data.get("category"),
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        try:
            instance = self.get_object()
            assigned_to = get_object_or_404(User, pk=request.data.get("assigned_to"))
            issue = assign_issue(
                issue=instance, assigned_to=assigned_to, assigned_by=request.user
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def reassign(self, request, pk=None):
        try:
            instance = self.get_object()
            assigned_to = get_object_or_404(User, pk=request.data.get("assigned_to"))
            issue = reassign_issue(
                issue=instance, assigned_to=assigned_to, assigned_by=request.user
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def unassign(self, request, pk=None):
        try:
            instance = self.get_object()
            issue = unassign_issue(issue=instance, unassigned_by=request.user)
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def status(self, request, pk=None):
        try:
            instance = self.get_object()
            issue = change_issue_status(
                issue=instance, status=request.data.get("status"), changed_by=request.user
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def priority(self, request, pk=None):
        try:
            instance = self.get_object()
            issue = change_issue_priority(
                issue=instance,
                priority=request.data.get("priority"),
                changed_by=request.user,
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def attach_label(self, request, pk=None):
        try:
            instance = self.get_object()
            label = get_object_or_404(IssueLabel, pk=request.data.get("label"))
            issue = attach_label_to_issue(
                issue=instance, label=label, attached_by=request.user
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    @action(detail=True, methods=["post"])
    def detach_label(self, request, pk=None):
        try:
            instance = self.get_object()
            label = get_object_or_404(IssueLabel, pk=request.data.get("label"))
            issue = detach_label_from_issue(
                issue=instance, label=label, detached_by=request.user
            )
            serializer = self.get_serializer(issue)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)


class IssueCommentViewSet(viewsets.ModelViewSet):
    queryset = IssueComment.objects.all()
    serializer_class = IssueCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMemberForList, IsProjectMember]

    filterset_fields = ['issue', 'author']
    search_fields = ['content']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Only return comments on issues from projects the user is a member of."""
        user = self.request.user
        if not user or not user.is_authenticated:
            return IssueComment.objects.none()

        my_project_ids = ProjectMember.objects.filter(
            user=user
        ).values_list("project_id", flat=True)
        owned_project_ids = (
            Project.objects.filter(owner=user).values_list("id", flat=True)
        )
        all_project_ids = set(list(my_project_ids) + list(owned_project_ids))

        return IssueComment.objects.filter(issue__project_id__in=all_project_ids)

    def create(self, request, *args, **kwargs):
        try:
            issue = get_object_or_404(Issue, pk=request.data.get("issue"))
            comment = create_comment(
                issue=issue,
                author=request.user,
                content=request.data.get("content", ""),
            )
            serializer = self.get_serializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            comment = edit_comment(
                comment=instance,
                edited_by=request.user,
                content=request.data.get("content"),
            )
            serializer = self.get_serializer(comment)
            return Response(serializer.data)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            remove_comment(comment=instance, removed_by=request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)


class IssueLabelViewSet(viewsets.ModelViewSet):
    queryset = IssueLabel.objects.all()
    serializer_class = IssueLabelSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMemberForList, IsProjectMember]

    filterset_fields = ['project', 'name']
    search_fields = ['name']
    ordering_fields = ['name']
    ordering = ['name']

    def get_queryset(self):
        """Only return labels from projects the user is a member of."""
        user = self.request.user
        if not user or not user.is_authenticated:
            return IssueLabel.objects.none()

        my_project_ids = ProjectMember.objects.filter(
            user=user
        ).values_list("project_id", flat=True)
        owned_project_ids = (
            Project.objects.filter(owner=user).values_list("id", flat=True)
        )
        all_project_ids = set(list(my_project_ids) + list(owned_project_ids))

        return IssueLabel.objects.filter(project_id__in=all_project_ids)

    def create(self, request, *args, **kwargs):
        try:
            project = get_object_or_404(Project, pk=request.data.get("project"))
            label = create_label(
                project=project,
                name=request.data.get("name", ""),
                created_by=request.user,
            )
            serializer = self.get_serializer(label)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as exc:
            return _handle_service_error(exc)
