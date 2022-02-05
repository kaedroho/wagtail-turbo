import json

from django import template
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import reverse

from wagtail.admin.menu import admin_menu
from wagtail.admin.navigation import get_explorable_root_page
from wagtail.admin.search import admin_search_areas
from wagtail.admin.staticfiles import versioned_static
from wagtail.admin.templatetags.wagtailadmin_tags import avatar_url

from wagtail_turbo.menu import serialize_admin_menu


register = template.Library()


@register.simple_tag(takes_context=True)
def enable_turbo(context):
    request = context['request']
    setattr(request, 'wagtailturbo_template_enabled', True)
    return ''


@register.simple_tag(takes_context=True)
def wagtailturbo_enabled(context):
    request = context['request']
    return getattr(request, 'wagtailturbo_enabled', False) and getattr(request, 'wagtailturbo_template_enabled', False)


@register.simple_tag(takes_context=True)
def turbo_props(context):
    request = context['request']
    search_areas = admin_search_areas.search_items_for_request(request)
    if search_areas:
        search_area = search_areas[0]
    else:
        search_area = None

    explorer_start_page = get_explorable_root_page(request.user)

    return json.dumps({
        'homeUrl': reverse('wagtailadmin_home'),
        'logoImages': {
            'mobileLogo': versioned_static('wagtailadmin/images/wagtail-logo.svg'),
            'desktopLogoBody': versioned_static('wagtailadmin/images/logo-body.svg'),
            'desktopLogoTail': versioned_static('wagtailadmin/images/logo-tail.svg'),
            'desktopLogoEyeOpen': versioned_static('wagtailadmin/images/logo-eyeopen.svg'),
            'desktopLogoEyeClosed': versioned_static('wagtailadmin/images/logo-eyeclosed.svg'),
        },
        'searchUrl': search_area.url if search_area else None,
        'explorerStartPageId': explorer_start_page.id if explorer_start_page else None,
        'menuItems': serialize_admin_menu(request, admin_menu),
        'user': {
            'name': request.user.first_name or request.user.get_username(),
            'avatarUrl': avatar_url(request.user, size=50),
        },
        'accountUrl': reverse('wagtailadmin_account'),
        'logoutUrl': reverse('wagtailadmin_logout'),
    }, cls=DjangoJSONEncoder)
