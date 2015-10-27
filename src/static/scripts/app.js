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
var nav = $('.nav');

  ko.bindingHandlers.map = {
      init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var locationList = ko.unwrap(valueAccessor());

          var mapOptions = {
              zoom: 12,
              disableDefaultUI: true,
              mapTypeId: google.maps.MapTypeId.ROADMAP
          };

          map = new google.maps.Map(element, mapOptions);

          function FullScreen(controlDiv, map){
              // Set CSS for the control border.
              var controlUI = document.createElement('div');
              controlUI.classList.add('map-button');
              controlUI.title = 'Click to show controls';
              controlDiv.appendChild(controlUI);

              // Set CSS for the control interior.
              var controlText = document.createElement('div');
              controlText.classList.add('map-button-text');
              controlUI.appendChild(controlText);
              // Setup the click event listeners: simply set the map to Chicago.


              map.showControls = function(){
                  console.log('showControl');
                  controlText.innerHTML = 'Hide';
                  controlUI.removeEventListener('click', map.showControls);
                  controlUI.addEventListener('click', map.hideControls);

                  var nav = document.querySelector('.nav');
                  nav.classList.remove('hidden');
                  nav.classList.add('visible');
              }

              map.hideControls = function(){
                  console.log('hideControl');

                  controlText.innerHTML = 'Show';
                  controlUI.removeEventListener('click', map.hideControls);
                  controlUI.addEventListener('click', map.showControls);

                  var nav = document.querySelector('.nav');
                  nav.classList.remove('visible');
                  nav.classList.add('hidden');
              }

              map.hideControls();
          }


          // Create the DIV to hold the control and call the CenterControl() constructor
          // passing in this DIV.
          var centerControlDiv = document.createElement('div');
          var centerControl = new FullScreen(centerControlDiv, map);
          centerControlDiv.index = 1;
          map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);

          var service = new google.maps.places.PlacesService(map);
          window.mapBounds = new google.maps.LatLngBounds();

          bindingContext.$data.addMarkers(locationList);
      },
      update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var locationList = ko.unwrap(valueAccessor());
          //bindingContext.$data.clearMarkers();
          console.log('map update');
          console.log(locationList);
          bindingContext.$data.filterMarkers();
          //bindingContext.$data.addMarkers(locationList);
      }
  }


    // ViewModel
    var ViewModel = function() {
        var self = this;

        this.newLocation = ko.observable();
        this.searchString = ko.observable('');
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

        this.closeControls = function(){
            console.log('close');
            map.hideControls();
        };

        /**
         *  Called when add-btn is clicked
         *  It adds the location object to the list and the map
         */
        this.addLocation = function () {
            // reset the search query so that you can see the newly
            // added list item and marker
            self.clearSearch();

            var place = self.newLocation();

            var match = ko.utils.arrayFirst(self.locationList(), function (item) {
                return place == item.name();
            });
            if (!match) {
                var locObject = new Location(place);
                self.addToList(locObject);
                self.addThisMarker(locObject);
            }
        }

        this.addToList = function(locObject){
            self.locationList.push(locObject);
            self.filterLocations();
        }


        this.addThisMarker = function(locObj){
            var service = new google.maps.places.PlacesService(map);
            var request;
            request = {
                query: locObj.name()
            };
            service.textSearch(request, callback);
        }

        /**
         *  Called when clear button in the search bar is clicked
         *  It nulls the text input value
         */
        this.clearSearch = function(){
            self.searchString('');
        }

        this.filterLocations = ko.computed(function () {
            var filter = self.searchString().toLowerCase();
            if (!filter) {
                return self.locationList();
            } else {
                arr =  ko.utils.arrayFilter(self.locationList(), function (item) {
                    return ko.utils.stringStartsWith(item.name().toLowerCase(), filter);
                });
                return arr;
            }
        });

        /**
         * Called during Map's update phase to show/hide markers
         * based on searched query string
         */
        this.filterMarkers = function(){
            var service = new google.maps.places.PlacesService(map);
            for( var i = 0; i < markers.length; i++){
                var marker = markers[i];
                if(!matchQuery(marker)){
                    self.hideMarker(marker);
                }else{
                    self.showMarker(marker);
                }
            }
        };

        /**
         * Helper method to find out if the marker matches the search query
         * @param marker
         * @returns {boolean}
         */
        function matchQuery(marker) {
            var filter = self.searchString().toLowerCase();
            return ko.utils.stringStartsWith(marker['name'].toLowerCase(), filter);
        };


        /**
         * Called when location list item is clicked.
         * @param place location object
         */
        this.selectThisPlace = function(place){
            for(var i=0; i<markers.length; i++){
                var marker = markers[i];
                self.deactivateMarker(marker);
                self.selectItem(marker, false);

                if(place() === marker.name){
                    self.activateMarker(marker);
                    self.selectItem(marker, true);

                    console.log('match found: ' + marker.name);
                }
            }
        };

        this.activateMarker = function(marker){
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
            marker.isSelected = true;
            self.setInfoWindow(marker);
            marker.infoWindow.open(map, marker);
            map.currentMarker = marker;
            marker.toggleBounce();
        };

        this.deactivateMarker = function(marker){
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
            marker.isSelected = false;
            marker.infoWindow.close();
            map.currentMarker = null;
            marker.toggleBounce();
        };

        /**
         * Make this marker visible and default to be not active
         * @param marker marker object
         */
        this.showMarker = function(marker){
            for( var i = 0; i < markers.length; i++){
                if(markers[i] == marker){
                    markers[i].setMap(map);
                    self.deactivateMarker(marker);
                }
            }
        };

        /**
         * Make this marker invisible
         * @param marker
         */
        this.hideMarker = function(marker){
            for( var i = 0; i < markers.length; i++){
                if(markers[i] == marker){
                    markers[i].setMap(null);
                }
            }
        };

        this.clearMarkers = function(){
            self.setMapOnAll(null);
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
            var service = new google.maps.places.PlacesService(map);
            var request;
            locObj.forEach(function(place){
                request = {
                    query: place.name()
                };
                service.textSearch(request, callback);
            });
        };

        function callback(result, status){
            if(status === google.maps.places.PlacesServiceStatus.OK){
                self.addMarker(result[0]);
            }
        }

        this.setInfoWindow = function(marker){
            // Wikipedia Ajax request goes here
            var wikiHtmlString;

            var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.name + '' +
                '&format=json&callback=wikiCallback';

             var wikiRequestTimeout = setTimeout(function () {
                 wikiHtmlString = "Failed to get wikipedia resources";
                 marker.infoWindow.setContent(wikiHtmlString);

             }, 8000);

            $.ajax({
                url: wikiUrl,
                dataType: 'jsonp',
                //jsonp: 'callback', // DEFAULT callback name
                success: function (response) {
                    var title = response[1][0];
                    var body = response[2][0];
                    var url = 'http://en.wikipedia.org/wiki/' + title;


                    wikiHtmlString ='<a href="' + url + '">' +
                    title + '</a>' +
                    '<div>' + body + '</div>';

                    var contentString = '<div id="content" >'+
                        '<div id="siteNotice">'+
                        '</div>'+
                        '<h1 id="firstHeading" class="firstHeading">'+ marker.name +'</h1>'+
                        '<div id="bodyContent">'+
                        '<a href="' + url + '" target="_blank">' +
                         'Read More...</a>' +
                        '<div style="color:#777">' + body + '</div>' +
                        '</div>'+
                        '</div>';

                    clearTimeout(wikiRequestTimeout);
                    marker.infoWindow.setContent(contentString);
                }
            });
        }

        /**
         * Called when marker is clicked
         * It highlight the list item with matching name
         * @param marker
         */
        this.selectItem = function(marker, isTrue){
            var list = self.filterLocations();
            var $items = document.getElementsByClassName('list-item');
            for(var i=0; i< $items.length; i++){
                if($items[i].textContent === marker['name']){
                    if(isTrue){
                        $items[i].classList.add('active');
                    }else{
                        $items[i].classList.remove('active');

                    }
                }
            }
        }

        this.addMarker = function(place) {
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

                marker.infoWindow = new google.maps.InfoWindow(
                {
                  content: "<i class='fa fa-spinner fa-spin fa-lg' style='color: #FFA46B;' title='Loading...'></i> Loading...",
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

                markers.push(marker);

                google.maps.event.addListener(marker, 'click', function() {
                    self.activateMarker(marker);
                    self.selectItem(marker, true);

                });

                google.maps.event.addListener(marker.infoWindow,'closeclick',function(){
                    // currentMarker.setMap(null); //removes the marker
                    // then, remove the infowindows name from the array
                    // marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
                    self.deactivateMarker(marker);
                    self.selectItem(marker, false);
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