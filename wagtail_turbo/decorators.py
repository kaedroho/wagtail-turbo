import functools
import json
from pathlib import Path

from django.shortcuts import render

import wagtail_turbo
from .response import TurboResponse, TurboResponseLoadIt, convert_to_turbo_response


def turbo_enable(fn):
    """
    Enables Wagtail turbo on the given view.
    """
    @functools.wraps(fn)
    def wrapper(request, *args, **kwargs):
        request.wagtailturbo_enabled = True
        response = fn(request, *args, **kwargs)

        # Pass through redirects
        if response.status_code == 301 or response.status_code == 302:
            return response

        # Attempt to convert non-turbo response into a turbo response
        if response.status_code == 200 and not isinstance(response, TurboResponse) and request.wagtailturbo_enabled and not request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest':
            response = convert_to_turbo_response(request, response)

        # If the request was made by the turbo (using `fetch()`, rather than a regular browser request)
        if request.META.get('HTTP_X_REQUESTED_WITH') == 'WagtailTurbo':
            if isinstance(response, TurboResponse):
                return response
            else:
                # Response couldn't be converted into a turbo response. Reload the page
                return TurboResponseLoadIt()

        # Regular browser request
        if isinstance(response, TurboResponse):
            js = []
            css = []
            asset_manifest = json.loads((Path(wagtail_turbo.__file__).parent / "static/wagtail_turbo/asset-manifest.json").read_text())
            for asset in asset_manifest["entrypoints"]:
                if asset.endswith(".js"):
                    js.append('wagtail_turbo/' + asset)
                elif asset.endswith(".css"):
                    css.append('wagtail_turbo/' + asset)

            print(js, css)

            # Wrap the response with our shell bootstrap template
            return render(
                request,
                "wagtailturbo/bootstrap.html",
                {
                    "data": response.content.decode("utf-8"),
                    "js": js,
                    "css": css,
                },
            )
        else:
            return response

    return wrapper


def turbo_disable(fn):
    """
    Disables Wagtail turbo on the given view (overrides turbo_enable).
    """
    @functools.wraps(fn)
    def wrapper(request, *args, **kwargs):
        request.wagtailturbo_enabled = False
        return fn(request, *args, **kwargs)

    return wrapper


def modal_safe(fn):
    """
    Marks it self to render this view in a modal.
    """
    @functools.wraps(fn)
    def wrapper(request, *args, **kwargs):
        request.wagtailturbo_modal_safe = True
        return fn(request, *args, **kwargs)

    return wrapper
