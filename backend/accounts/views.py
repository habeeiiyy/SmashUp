from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth import login
from django.utils.http import url_has_allowed_host_and_scheme
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .forms import RegisterationForm
from .models import Profile

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    form = RegisterationForm(request.data)
    if form.is_valid():
        user = form.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)
    errors = {}
    for field, field_errors in form.errors.items():
        errors[field] = field_errors
    return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    form = AuthenticationForm(request, data=request.data)
    if form.is_valid():
        user = form.get_user()
        login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        })
    return Response({
        'errors': {'non_field_errors': ['Invalid username or password.']}
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_api(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass
    return Response({'detail': 'Logged out successfully'})


@api_view(['GET', 'PUT', 'PATCH'])
def user_profile_api(request):
    user = request.user
    if not user or not user.is_authenticated:
        return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)

    profile, _ = Profile.objects.get_or_create(user=user)

    if request.method in ['PUT', 'PATCH']:
        bio = request.data.get('bio', None)
        position = request.data.get('position', None)
        company = request.data.get('company', None)

        if bio is not None:
            profile.bio = bio
        if position is not None:
            profile.position = position
        if company is not None:
            profile.company = company
        profile.save()

    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'bio': profile.bio,
        'position': profile.position,
        'company': profile.company,
    })
