// Measuring the Critical Rendering Path with Navigation Timing
// https://developers.google.com/web/fundamentals/performance/critical-rendering-path/measure-crp

function logCRP() {
  var t = window.performance.timing,
    dcl = t.domContentLoadedEventStart - t.domLoading,
    complete = t.domComplete - t.domLoading;
  var stats = document.getElementById("crp-stats");
  stats.textContent = 'DCL: ' + dcl + 'ms, onload: ' + complete + 'ms';
}

window.addEventListener("load", function(event) {
  logCRP();
});



    // MODEL

    var initialLocations = [
        "San Francisco",
        "Taipei",
        "Thailand"
    ];

    var Location = function(data){
      this.name = ko.observable(data);
    };

    var map;
var markers = [];

  ko.bindingHandlers.map = {
      init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var locationList = ko.unwrap(bindingContext.$data.filterLocations); //ko.unwrap(valueAccessor());

          var mapOptions = {
              zoom: 6,
              disableDefaultUI: true
          };

          map = new google.maps.Map(element, mapOptions);

          var service = new google.maps.places.PlacesService(map);
          window.mapBounds = new google.maps.LatLngBounds();

          bindingContext.$data.addMarkers(locationList);
      },
      update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var locationList = ko.unwrap(bindingContext.$data.filterLocations); //ko.unwrap(valueAccessor());
          bindingContext.$data.deleteMarkers();
          bindingContext.$data.addMarkers(locationList);
      }
  }


    // ViewModel
    var ViewModel = function() {
        var self = this;

        this.newLocation = ko.observable();
        this.searchString = ko.observable('');
        this.filteredArr  = ko.observableArray([]);
        this.locationList = ko.observableArray([]);

        this.currentMarker = null;

        self.locationList = ko.observableArray(ko.utils.arrayMap(initialLocations, function(locationItem){
            return new Location(locationItem)
        }));

        this.currentLocation = ko.observable(self.locationList()[0]);

        this.setCurrentLocation = function (data) {
            self.currentLocation(data);
            console.log(self.currentLocation().name());
        };

        this.addLocation = function () {
            console.log('addLocation called');
            self.clearSearch();
            var place = self.newLocation();

            var match = ko.utils.arrayFirst(self.locationList(), function (item) {
                return place == item.name();
            });
            if (!match) {
                var locObject = new Location(place);
                self.locationList.push(new Location(place));
                //self.currentLocation(locObject);
                //self.addMarkers(locObject);
            }
        }

        this.clearSearch = function(){
            self.searchString('');
        }

        this.filterLocations = ko.dependentObservable(function () {
            var filter = self.searchString().toLowerCase();
            if (!filter) {
                return self.locationList();
            } else {
                self.filteredArr = ko.utils.arrayFilter(self.locationList(), function (item) {
                    return ko.utils.stringStartsWith(item.name().toLowerCase(), filter);
                });
                console.log(self.filteredArr);
                return self.filteredArr;
            }
        });

        this.activateThisMarker = function(place){
            for(var i=0; i<markers.length; i++){
                var marker = markers[i];

                if(place() == marker.name){
                    self.activateMarker(marker);
                    console.log('match found: ' + marker.name);
                }else{
                    self.deactivateMarker(marker);
                }
            }
        }

        this.activateMarker = function(marker){
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
            marker.isSelected = true;
            marker.infoWindow.open(map, marker);
            map.currentMarker = marker;
            marker.toggleBounce();
        }

        this.deactivateMarker = function(marker){
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            marker.isSelected = false;
            marker.infoWindow.close();
            map.currentMarker = null;
            marker.toggleBounce();
        }

        this.clearMarkers = function(){
            self.setMapOnAll(null);
            console.log('hideMarkers')
        }

        this.deleteMarkers = function(){
            self.clearMarkers();
            markers = [];
        }

        this.setMapOnAll = function(map){
            for( var i = 0; i < markers.length; i++){
                markers[i].setMap(map);
            }
        }

        this.addMarkers = function(locObj){
            /*if(typeof(locObj)!='ko.observableArray'){

            }*/
            //var locationList = self.locationList();
          /*  console.log(self.filteredArr.length);
            if(self.filteredArr.length > 0){
                locationList = self.filteredArr;
                self.hideMarkers();
            }*/

            var service = new google.maps.places.PlacesService(map);
            var request;
            /*locationList.subscribe(function(changes){
                changes.forEach(function(change) {
                    if (change.status === 'added') {
                        console.log("Added or removed! The added/removed element is:", change.value);
                        var location = change.value;
                        var request = {
                            query: location.name()
                        };

                        service.textSearch(request, callback);

                    }
                });
            }, null, 'arrayChange');
*/
            console.log('addMarkers');
           /* if(isObservableArray(locObj)){
                console.log('inside locObj:', locObj.name)
                request = {
                    query: locObj.name
                };
                service.textSearch(request, callback);
            }else{*/
                console.log('inside locationList')
                for(var place in locObj){
                    request = {
                        query: locObj[place].name()
                    };
                    console.log(locObj[place].name())
                    service.textSearch(request, callback);
                }

            //}

            function callback(result, status){
                if(status === google.maps.places.PlacesServiceStatus.OK){
                    self.addMarker(result[0]);
                }
            }
        }

        this.addMarker = function(place){
                var lat = place.geometry.location.lat();
                var lon = place.geometry.location.lng();
                var formattedAddress = place.formatted_address;
                var bounds = window.mapBounds;
                var activeIcon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
                var inactiveIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

                // marker is an object with additional data about the pin for a single location
                var marker = new google.maps.Marker({
                    map: map,
                    icon: inactiveIcon,
                    animation: google.maps.Animation.DROP,
                    position: place.geometry.location,
                    title: formattedAddress,
                    name: place.name
                });

                markers.push(marker);

                var contentString = '<div id="content" >'+
                    '<div id="siteNotice">'+
                    '</div>'+
                    '<h1 id="firstHeading" class="firstHeading">'+ name +'</h1>'+
                    '<div id="bodyContent">'+
                    '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
                    'sandstone rock formation in the southern part of the '+
                    'Northern Territory, central Australia. ' +
                    'Heritage Site.</p>'+
                    '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
                    'https://en.wikipedia.org/w/index.php?title=Uluru</a> '+
                    '(last visited June 22, 2009).</p>'+
                    '</div>'+
                    '</div>';

                marker.infoWindow = new google.maps.InfoWindow({
                    content: contentString,
                    maxWidth: 200
                });

                marker.toggleBounce = function(){
                    //console.log('toggleBounce');
                    var self = this;
                    if(!self.isSelected){
                        self.setAnimation(null);
                    }else{
                        self.setAnimation(google.maps.Animation.BOUNCE);
                    }
                }

                google.maps.event.addListener(marker, 'click', function() {
                    self.activateMarker(marker);
                });

                google.maps.event.addListener(marker.infoWindow,'closeclick',function(){
                    // currentMarker.setMap(null); //removes the marker
                    // then, remove the infowindows name from the array
                    // marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
                    self.deactivateMarker(marker);
                });

                google.maps.event.addListener(marker, 'mouseover', function() {
                    //console.log('mouseover');
                    marker.setIcon(activeIcon);
                });

                google.maps.event.addListener(marker, 'mouseout', function() {
                    if(!marker.isSelected){
                        marker.setIcon(inactiveIcon);
                    }
                });

                bounds.extend(new google.maps.LatLng(lat, lon));
                map.fitBounds(bounds);

             }
        }


$(document).ready(function(){
    ko.applyBindings(new ViewModel());
});

// Add the missing knockout utility function to see if a string start with a substring
ko.utils.stringStartsWith = function (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length){
        return false;
    }
    return string.substring(0, startsWith.length) === startsWith;
};

function isObservableArray( obj ) {
    return ( ko.isObservable(obj) && obj.hasOwnProperty('remove')  );
}