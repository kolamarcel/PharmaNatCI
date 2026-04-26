from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings
from rest_framework import exceptions

class JWTCookieAuthentication(JWTAuthentication):
    def authenticate(self, request):
        cookie_name = settings.JWT_COOKIE_NAME
        header = self.get_header(request)
        
        if header is None:
            # Try to get from cookie
            raw_token = request.COOKIES.get(cookie_name)
        else:
            raw_token = self.get_raw_token(header)

        if raw_token is None:
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            return None
