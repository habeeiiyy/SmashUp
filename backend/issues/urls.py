from rest_framework.routers import DefaultRouter
from .views import IssueViewSet, IssueCommentViewSet, IssueLabelViewSet

router = DefaultRouter()
router.register(r"issues", IssueViewSet)
router.register(r"issue-comments", IssueCommentViewSet)
router.register(r"issue-labels", IssueLabelViewSet)

urlpatterns = router.urls
