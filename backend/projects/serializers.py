from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Project, ProjectMember, ProjectJoinRequest

User = get_user_model()


def mask_email(email):
    """Mask email for privacy when viewed by other users (e.g. j***@example.com)."""
    if not email:
        return ""
    if "@" in email:
        name, domain = email.split("@", 1)
        masked_name = (name[0] + "***") if len(name) > 1 else "***"
        return f"{masked_name}@{domain}"
    return "***"


class ProjectMemberUserSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    bio = serializers.CharField(source="profile.bio", read_only=True, default="")
    position = serializers.CharField(source="profile.position", read_only=True, default="")
    company = serializers.CharField(source="profile.company", read_only=True, default="")
    is_self = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "bio", "position", "company", "is_self")

    def get_is_self(self, obj):
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and request.user.pk == obj.pk)

    def get_email(self, obj):
        request = self.context.get("request")
        # If user is viewing themselves, return real email
        if request and request.user.is_authenticated and request.user.pk == obj.pk:
            return obj.email
        # For other users, blur/mask email
        return mask_email(obj.email)


class ProjectSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    pending_requests_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ("owner", "code", "created_at", "updated_at")

    def get_pending_requests_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        if obj.owner_id == request.user.id or obj.members.filter(user=request.user, role=ProjectMember.Role.ADMIN).exists():
            return obj.join_requests.filter(status=ProjectJoinRequest.Status.PENDING).count()
        return 0


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_details = ProjectMemberUserSerializer(source="user", read_only=True)

    class Meta:
        model = ProjectMember
        fields = "__all__"
        read_only_fields = ("joined_at",)


class ProjectJoinRequestSerializer(serializers.ModelSerializer):
    user_details = ProjectMemberUserSerializer(source="user", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_code = serializers.CharField(source="project.code", read_only=True)

    class Meta:
        model = ProjectJoinRequest
        fields = "__all__"
        read_only_fields = ("user", "status", "created_at", "updated_at")
