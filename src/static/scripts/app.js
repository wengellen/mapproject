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


$(document).ready(function(){
  ko.applyBindings(new ViewModel());
});

    // MODEL

    var initialLocations = [
      {
        name: "San Francisco, USA"
      },
      {
        name: "Taipei, Taiwan"
      },
      {
        name: "Taichung, Taiwan"
      }
    ];

    var Location = function(data){
      this.name = ko.observable(data.name);
      this.lat  = ko.observable(12.24);
      this.lng  = ko.observable(24.54);
    };

    var map;

  ko.bindingHandlers.map = {
      init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
        console.log('googlemap binding init')

        var locationList = ko.unwrap(valueAccessor());
        console.log(locationList);

        var mapOptions = {
          zoom: 6,
          disableDefaultUI: true
        };

        map = new google.maps.Map(element, mapOptions);

        window.mapBounds = new google.maps.LatLngBounds();

        var service = new google.maps.places.PlacesService(map);
         for(var place in locationList){
           var request = {
             query: locationList[place].name()
           };

           console.log(request.query);

           service.textSearch(request, function(result, status){
             if(status == google.maps.places.PlacesServiceStatus.OK){
               createMapMarker(result[0]);
             }
           });
         }

         function createMapMarker(place){
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
             console.log('show marker: '+ marker.title)
             infoWindow.open(map, marker);
           });


           bounds.extend(new google.maps.LatLng(lat, lon));
           map.fitBounds(bounds);
           map.setCenter(bounds.getCenter());
         }



        //google.maps.event.addListener(locObj.marker, 'dragend', locObj.onMarkerMoved);

        //$("#" + element.getAttribute("id")).data("locObj",locObj);
      }
    };


    // ViewModel

    var ViewModel = function(){
      var self = this;

      this.locationList = ko.observableArray([]);

      initialLocations.forEach(function(locationItem, index){
        self.locationList.push( new Location(locationItem) );
      });

      this.currentLocation = ko.observable( this.locationList()[0] );

      this.setLocation = function(clickedLocation){
        self.currentLocation(clickedLocation);
        console.log(clickedLocation);
      };




    };




