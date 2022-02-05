from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils.cache import patch_cache_control

class TurboResponse(JsonResponse):
    status = None

    def __init__(self, *args, mode='browser', **kwargs):
        data = {
            'status': self.status,
            'mode': mode,
        }
        data.update(self.get_data(*args, **kwargs))
        super().__init__(data)
        self['X-WagtailTurbo-Status'] = self.status
        self['X-WagtailTurbo-Mode'] = mode

        # Make sure that turbo responses are never cached by browsers
        # We need to do this because Turbo responses are given on the same URLs that users would otherwise get HTML responses on if they visited those URLs directly.
        # If the turbo response is cached, there's a chance that a user could see the JSON document in their browser rather than a HTML page.
        # This behaviour only seems to occur (intermittently) on Firefox.
        patch_cache_control(self, no_store=True)

    def get_data(self):
        return {}


class TurboResponseLoadIt(TurboResponse):
    status = 'load-it'


class TurboResponseRender(TurboResponse):
    status = 'render'

    def __init__(self, request, *args, **kwargs):
        self.request = request
        super().__init__(*args, **kwargs)

    def get_data(self, view, context):
        return {
            'view': view,
            'context': context,
            'title': "Wagtail Turbo",  # FIXME
            'messages': [
                {
                    "level": "error"
                    if message.level == messages.ERROR
                    else "warning"
                    if message.level == messages.WARNING
                    else "success",
                    "html": conditional_escape(message.message),
                }
                for message in messages.get_messages(self.request)
            ],
        }


class TurboResponseRenderHtml(TurboResponseRender):
    def get_data(self, html):
        return super().get_data('iframe', {'html': html, 'frameUrl': reverse('wagtail_turbo:frame')})


class TurboResponseRedirect(TurboResponse):
    status = "redirect"

    def get_data(self, path):
        return {
            "path": path,
        }


class TurboResponseNotFound(TurboResponse):
    status = 'not-found'


class TurboResponsePermissionDenied(TurboResponse):
    status = 'permission-denied'


def convert_to_turbo_response(request, response):
    """
    Converts a non-turbo response into a turbo one.
    """
    # If the response is HTML and isn't the login view then return a "render HTML
    # response that wraps the response in an iframe on the frontend

    # FIXME: Find a proper mime type parser
    is_html = response.get('Content-Type').startswith('text/html')
    if is_html:
        if hasattr(response, 'render'):
            response.render()

        render_in_modal = request.META.get('HTTP_X_WAGTAILTURBO_MODE') == 'modal' and getattr(request, 'wagtailturbo_modal_safe', False)
        return TurboResponseRenderHtml(request, response.content.decode('utf-8'), mode='modal' if render_in_modal else 'browser')

    # Can't convert the response
    return response
