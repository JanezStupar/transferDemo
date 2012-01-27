/**
 * Created by PyCharm.
 * User: Johnny
 * Date: 23.1.12
 * Time: 21:11
 * To change this template use File | Settings | File Templates.
 */

var Location = Backbone.Model.extend({
    initialize: function(){
        this.bind('change:coords',function(){
            return this.get('update_route_callback')(this.get('id'),this.get('coords'));
        })
    },
    update_destination: function(lntLng){
        this.set({coords:lntLng});
    }

});

var GoogleMap = Backbone.View.extend({
    el: $('div#map_canvas'),
    initialize: function(){
        _.bindAll(this, 'render');

        this.render();
    },
    render: function(){
        var map = this.el.gmap3({action:'init',options:{center:this.options.focus,zoom:7}});
    }
});

//Address : <input id="address" size="60" type="text">

var Address = Backbone.View.extend({
    container: $('#my_app'),

    initialize: function(){
        _.bindAll(this,'render');
        this.el = $(this.el).attr('name',this.id).attr('size',50);
        this.el.appendTo(this.container).after('</p>');
        var label = $('<label for="'+this.id+'">'+this.options.label+'</label>');
        label.insertBefore(this.el);
        this.render();
    },
    render: function(){
        var self = this;

        self.el.autocomplete({
        source: function() {
            self.options.gmap.el.gmap3({
                action:'getAddress',
                address: $(this).val(),
                callback:function(results){
                    if (!results) return;
                    self.el.autocomplete(
                        'display',
                        results,
                        false
                    );
                }
            });
        },
        cb:{
            cast: function(item){
                return item.formatted_address;
            },
            select: function(item) {
                self.options.gmap.el.gmap3(
                {action:'clear', name:'marker', tag: self.id},
                {action:'addMarker',
                        name:'marker',
                        latLng:item.geometry.location,
                        tag: self.id
                    }
                );
                self.model.update_destination(item.geometry.location);
            }
        }
    })
    }
});

var RouteModel = Backbone.Model.extend({
    defaults: {
        start: null,
        end: null
    }
});

var RouteDetails = Backbone.View.extend({
    el: $('<div id="route_details"></div>'),
    initialize: function(){
       _.bindAll(this,'render','update_details');
       this.model.bind('change:route_leg',this.update_details);
       this.render();
    },
    render: function(){
        this.options.container.append(this.el);
        this.el.append($('<div id="route_detail_distance"></div>'));
        this.el.append($('<div id="route_detail_duration"></div>'));
    },
    update_details: function(){
        var route_leg = this.model.get('route_leg');
        this.$('div#route_detail_distance').html('Razdalja: ' + route_leg.distance.text);
        this.$('div#route_detail_duration').html('Čas vožnje: ' + route_leg.duration.text);
    }
});

var MyApp = Backbone.View.extend({
    el: $('#my_app'),
    initialize: function(){
        _.bindAll(this, 'location_updated','update_route');
        var map = new GoogleMap({focus:[45.956751,14.507446]});
        this.map = map;
        this.model=new RouteModel();
        var start_location = new Location({update_route_callback:this.location_updated,id:"address_from"});
        var end_location = new Location({update_route_callback:this.location_updated,id:"address_to"});
        this.model.set({
            menu_button: new MenuButton({gmap:map,labels:['Prikaži','Skrij'],my_app:this.el}),
            start_location: start_location,
            end_location: end_location,
            address_from: new Address({model:start_location,gmap:map,label:"Naslov 1: ",id:start_location.id,tagName:'input'}),
            address_to: new Address({model:end_location,gmap:map,label:"Naslov 2: ",id:end_location.id,tagName:'input'})
        });

        map.el.gmap3('get').controls[google.maps.ControlPosition.TOP_RIGHT].push($("#my_app").toggle()[0]);
    },
    location_updated: function(id,coords){
        if (id=='address_from'){
            this.model.set({'start': coords});
        }
        if (id=='address_to'){
            this.model.set({'end': coords});
        }

        if (this.model.get('start') && this.model.get('end')){
            this.update_route();
            var route_details = this.model.get('route_details');
            if(!route_details){
                route_details = new RouteDetails({container:this.el,model:this.model});
                this.model.set({route_details:route_details});
            }
        }
    },
    update_route: function(){
       var self=this;
       self.map.el.gmap3(
            { action:'clear', name:'directionrenderer'},
            { action:'getRoute',
                options:{
                    origin:this.model.get('start'),
                    destination:this.model.get('end'),
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                },
                callback: function(results){
                    if (!results) return;
                    self.map.el.gmap3(
                        { action:'addDirectionsRenderer',
                            options:{
                                preserveViewport: false,
                                draggable: false,
                                directions:results
                            }
                        }
                    );
                        self.model.set({route_leg:results.routes[0].legs[0]});

                }
            }
        );
    }
});

var MenuButton = Backbone.View.extend({
    el: $('#master_button'),
    initialize: function(){
        _.bindAll(this,'render','toggle_my_app');
        this.model = new (Backbone.Model.extend({}))();
        this.render();
    },
    render: function(){
       this.options.gmap.el.gmap3('get').controls[google.maps.ControlPosition.TOP_RIGHT].push(this.el[0]);
       this.el.button({label:this.options.labels[1]});
       this.model.set({app_shown:true});
    },
    events:{
        "click": 'toggle_my_app'
    },
    toggle_my_app: function(){
        this.options.my_app.toggle();
        this.model.set({app_shown:!this.model.get('app_shown')});
        this.el.button({label:this.options.labels[this.model.get('app_shown')?1:0]})
    }
});