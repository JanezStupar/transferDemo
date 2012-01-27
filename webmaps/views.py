# Create your views here.
from django.views.generic.simple import direct_to_template

def index(request):
    return direct_to_template(request,'index.html')

def index2(request):
    return direct_to_template(request,'index2.html')

