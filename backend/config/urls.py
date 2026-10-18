"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.views.static import serve
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from django.views.generic import TemplateView

from issues.views import IssueViewSet, IssueCommentViewSet, IssueLabelViewSet
from projects.views import ProjectViewSet, ProjectMemberViewSet

router = DefaultRouter()
router.register(r"projects", ProjectViewSet)
router.register(r"project-members", ProjectMemberViewSet)
router.register(r"issues", IssueViewSet)
router.register(r"issue-comments", IssueCommentViewSet)
router.register(r"issue-labels", IssueLabelViewSet)


def react_app(request):
    """Serve React index.html for all non-API routes (client-side routing)."""
    build_dir = (
        settings.STATICFILES_DIRS[1]
        if len(settings.STATICFILES_DIRS) > 1
        else settings.STATIC_ROOT
    )
    index_path = build_dir / 'index.html'
    if index_path.exists():
        return HttpResponse(index_path.read_text(), content_type='text/html')
    return HttpResponse("React build not found. Run npm run build in frontend/", status=404)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include("accounts.urls")),
    path('api/', include(router.urls)),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# Serve React static files and catch-all for client-side routing
urlpatterns += [
    re_path(r'^static/(?P<path>.*)$', serve, {
        'document_root': settings.STATIC_ROOT,
    }),
    re_path(r'^.*$', react_app),
]
