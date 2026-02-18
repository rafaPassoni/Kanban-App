"""Roteamento de URLs para o app authentication."""

from django.urls import path

from authentication.views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    LogoutView,
    CurrentUserView,
    FullUserAccessView,
)


urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('users/me/', CurrentUserView.as_view(), name='current_user'),
    path('users/me/full-access/', FullUserAccessView.as_view(), name='full_user_access'),
]
