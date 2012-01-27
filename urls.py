from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'transfer.views.home', name='home'),
    # url(r'^transfer/', include('transfer.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    url(r'^$','webmaps.views.index',name='index'),
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
