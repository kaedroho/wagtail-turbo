# Wagtail Turbo

Speed up your Wagtail admin by eliminating page reloads!

# Installation

Install ``wagtail-turbo`` with pip:

    pip install wagtail-turbo


Add it to ``INSTALLED_APPS``:

```python
# settings.py

INSTALLED_APPS = [
    # ...

    # Must be above wagtail.admin
    'wagtail_turbo',

    # ...
]

```

In your ``urls.py``, replace the ``wagtail.admin.urls`` import with ``wagtail_turbo.urls``

```python
# urls.py

from django.conf.urls import include, url
from wagtail_turbo import urls as wagtailadmin_urls


urlpatterns = [
    # ...
    url(r'^admin/', include(wagtailadmin_urls)),
    # ...
]
```
