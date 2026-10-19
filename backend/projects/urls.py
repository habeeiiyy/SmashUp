from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    ProjectMemberViewSet,
    ProjectJoinRequestViewSet,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet)
router.register(r"project-members", ProjectMemberViewSet)
router.register(r"project-join-requests", ProjectJoinRequestViewSet)

urlpatterns = router.urls
