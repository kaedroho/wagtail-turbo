from django.urls import path, include
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.views.generic.base import TemplateView
from django.views.i18n import JavaScriptCatalog

from wagtail.core import hooks

from .decorators import turbo_disable


@hooks.register("register_admin_urls")
def register_admin_urls():
    urls = [
        path('jsi18n/', JavaScriptCatalog.as_view(packages=['wagtail_turbo']), name='javascript_catalog'),
        path('frame/', xframe_options_sameorigin(turbo_disable(TemplateView.as_view(template_name='wagtailturbo/frame.html'))), name='frame'),
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


@hooks.register("insert_global_admin_css", order=100)
def global_admin_css():
    # Remove left padding from the content, this is usually for Wagtail's
    # builtin menu which we've removed in templates/wagtailadmin/base.html.
    return """
    <style>
        .wrapper {
            padding-left: 0;
        }

        #nav-toggle {
            display: none;
        }
    </style>
    """
