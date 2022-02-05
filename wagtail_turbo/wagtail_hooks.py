from django.urls import path, include, reverse
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.views.generic.base import TemplateView
from django.views.i18n import JavaScriptCatalog

from wagtail.core import hooks

from .decorators import turbo_disable
from .views import turbo_init


@hooks.register("register_admin_urls")
def register_admin_urls():
    urls = [
        path('jsi18n/', JavaScriptCatalog.as_view(packages=['wagtail_turbo']), name='javascript_catalog'),
        path('frame/', xframe_options_sameorigin(turbo_disable(TemplateView.as_view(template_name='wagtailturbo/frame.html'))), name='frame'),
        path('init/', turbo_init, name='init'),
    ]

    return [
        path(
            "turbo/",
            include(
                (urls, "wagtail_turbo"),
                namespace="wagtail_turbo",
            ),
        )
    ]


@hooks.register("insert_global_admin_js", order=100)
def global_admin_js():
    # Inject some JavaScript to initialise Wagtail Turbo if it's not initialised.
    # We could add some logic in to the decorator to convert all non-turbo responses into turbo ones by default
    # However, this causes issues as it's hard to tell if a request was made with fetch() and we do no want to convert these
    return """
    <script>
        if (!window.TURBO_ENABLED) {
            window.location.href = '%s?path=' + encodeURIComponent(window.location.pathname);
        }
    </script>
    """ % (
        reverse('wagtail_turbo:init'),
    )
