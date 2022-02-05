from django.contrib.auth import login
from django.contrib.auth.models import User


# Automatically logs in the user with an administrator account
# Not to be used on an actual site! This just takes a step out of setting up a development environment
def authenticate(get_response):
    def middleware(request):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(username="admin", password="changeme")

        if not request.user.is_authenticated:
            login(request, User.objects.get(username="admin"))

        return get_response(request)

    return middleware
