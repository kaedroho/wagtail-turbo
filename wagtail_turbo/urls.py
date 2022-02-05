from wagtail.admin.urls import urlpatterns
from wagtail.utils.urlpatterns import decorate_urlpatterns

from wagtail_turbo.decorators import turbo_enable


urlpatterns = decorate_urlpatterns(urlpatterns, turbo_enable)
