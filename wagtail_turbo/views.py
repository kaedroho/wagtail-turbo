from django.urls import reverse

from .response import TurboResponseRedirect


def turbo_init(request):
    return TurboResponseRedirect(request.GET.get('path', reverse('wagtailadmin_home')))
