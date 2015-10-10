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
        "San Francisco, USA",
        "Taipei"
    ];

    var Location = function(data){
      this.name = ko.observable(data);
    };

    var map;
var markers = [];

  ko.bindingHandlers.map = {
      init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var mapOptions = {
              zoom: 6,
              disableDefaultUI: true
          };

          map = new google.maps.Map(element, mapOptions);
          window.mapBounds = new google.maps.LatLngBounds();
      },

      update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
          var locationList = ko.unwrap(bindingContext.$data.filterLocations); //ko.unwrap(valueAccessor());
          var service = new google.maps.places.PlacesService(map);

          deleteMarkers();

          for(var place in locationList){
           var request = {
             query: locationList[place].name()
           };

           service.textSearch(request, callback);
         }

         function callback(result, status){
           if(status === google.maps.places.PlacesServiceStatus.OK){
               addMarker(result[0]);
           }
         }

          function setMapOnAll(map){
              for( var i = 0; i < markers.length; i++){
                  markers[i].setMap(map);
              }
          }

         function clearMarkers(){
             setMapOnAll(null);
         }

          function showMarkers(){
              setMapOnAll(map);
          }

          function deleteMarkers(){
              clearMarkers();
              markers = [];
          }

         function addMarker(place){
           var lat = place.geometry.location.lat();
           var lon = place.geometry.location.lng();
           var name = place.formatted_address;
           var bounds = window.mapBounds;

           // marker is an object with additional data about the pin for a single location
           var marker = new google.maps.Marker({
             map: map,
             position: place.geometry.location,
             title: name
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

           var infoWindow = new google.maps.InfoWindow({
             content: contentString,
             maxWidth: 200
           });

           google.maps.event.addListener(marker, 'click', function() {
             // your code goes here!
             infoWindow.open(map, marker);
           });


           bounds.extend(new google.maps.LatLng(lat, lon));
           map.fitBounds(bounds);
           map.setCenter(bounds.getCenter());
         }
      }
    };



    // ViewModel
    var ViewModel = function() {
        var self = this;

        this.newLocation = ko.observable();
        this.searchString = ko.observable('Taipei');

        this.locationList = ko.observableArray([]);
        //this.filterList = ko.observableArray([]);

        initialLocations.forEach(function (locationItem, index) {
            self.locationList.push(new Location(locationItem));
        });

        this.currentLocation = ko.observable(this.locationList()[0]);

        this.setLocation = function (clickedLocation) {
            self.currentLocation(clickedLocation);
            console.log(clickedLocation);
        };

        this.addLocation = function () {
            console.log('addLocation called');
            var place = self.newLocation();

            // TODO: How to find observable within an observableArray
            var match = ko.utils.arrayFirst(self.locationList(), function (item) {
                return place == item.name();
            });
            if (!match) {
                self.locationList.push(new Location(place));
            };

        }

        this.filterLocations = ko.dependentObservable(function () {
            var filter = self.searchString().toLowerCase();
            if (!filter) {
                return self.locationList();
            } else {
                return ko.utils.arrayFilter(self.locationList(), function (item) {
                    return ko.utils.stringStartsWith(item.name().toLowerCase(), filter);
                });
            }
        });
    }


$(document).ready(function(){
    ko.applyBindings(new ViewModel());
});

ko.utils.stringStartsWith = function (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length)
        return false;
    return string.substring(0, startsWith.length) === startsWith;
};
