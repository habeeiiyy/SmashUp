from rest_framework import serializers
from .models import Issue, IssueComment, IssueLabel


class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at", "resolved_at")


class IssueCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueComment
        fields = "__all__"
        read_only_fields = ("author", "created_at", "updated_at")


class IssueLabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueLabel
        fields = "__all__"
