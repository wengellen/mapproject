
//-------------
//  MODEL
//-------------

var initialLocations = [
        "San Francisco",
        "Taipei",
        "London",
        "Johannesburg",
        "Mumbai"
    ];

    var Location = function(data){
      this.name = ko.observable(data);
    };

// Google Map reference
var map;

// Arrays to hold the markers
var markers = [];
var nav = document.querySelector('.nav');
var menu_icon = document.querySelector('.menu_icon');

// Custom Binding for google map
if (typeof ko !== 'undefined' && ko.bindingHandlers && !ko.bindingHandlers.multiselect) {
    ko.bindingHandlers.map = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var locationList = bindingContext.$data.filterLocations();
            //var locationList = ko.unwrap(valueAccessor());

            // This is the minimum zoom level that we'll allow
            var minZoomLevel = 0;

            var mapOptions = {
                zoom: minZoomLevel,
                disableDefaultUI: true,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            map = new google.maps.Map(element, mapOptions);

            /**
             * Add center control to Map
             * It can move location list window off and on the screen
             * @param controlDiv
             * @param map Google Map Map object
             * @constructor
             */
            function CenterControl(controlDiv, map) {
                // Set CSS for the control border.
                var controlUI = document.createElement('div');
                controlUI.classList.add('map-button');
                controlUI.title = 'Click to show controls';
                controlDiv.appendChild(controlUI);

                // Set CSS for the control interior.
                var controlText = document.createElement('div');
                controlText.classList.add('map-button-text');
                controlUI.appendChild(controlText);

                controlText.innerHTML = 'Center';
                controlUI.addEventListener('click', function () {
                    // TODO: need to contain all markers
                    //google.maps.event.trigger(map, "resize");
                    bindingContext.$data.fitMap();
                    bindingContext.$data.deactivateMarker(bindingContext.$data.currentMarker());
                });
            }

            // Create the DIV to hold the control and call the CenterControl() constructor
            // passing in this DIV.
            var centerControlDiv = document.createElement('div');
            var centerControl = new CenterControl(centerControlDiv, map);
            centerControlDiv.index = 1;
            map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);

            var service = new google.maps.places.PlacesService(map);
            window.mapBounds = new google.maps.LatLngBounds();

            // Add initial markers to map.
            bindingContext.$data.addMarkers(locationList);
        },

        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            //var locationList = ko.unwrap(valueAccessor());
            //bindingContext.$data.filterMarkers();
            var locationList = bindingContext.$data.filterLocations();
        }
    };
}
// ViewModel
var ViewModel = function() {
    var self = this;

    this.newLocation = ko.observable('');

    // Search string to filter the locations
    this.searchString = ko.observable('');

    // Store current selected marker
    this.currentMarker = ko.observable({});

    // List to hold the locations
    //this.locationList = ko.observableArray([]);
    this.locationList = ko.observableArray(ko.utils.arrayMap(initialLocations, function(locationItem){
        return new Location(locationItem);
    }));

    // Default the currentLocation to have a name of empty string
    this.currentLocation = ko.observable(new Location({name:''}));

    /**
     * Move he nav panel in and out of view
     * @param item the item which dispatched the event
     * @param event the event being dispathced
     */
    this.toggleNav = function(item, event){
        console.log('toggleNav');
        nav.classList.toggle('visible');
        event.stopPropagation();
        console.log(menu_icon);
        // Swap out Menu button
        if(menu_icon.classList.contains('contract')){
            menu_icon.classList.remove('contract');
            menu_icon.classList.add('expand');
        }else{
            menu_icon.classList.remove('expand');
            menu_icon.classList.add('contract');
        }

    };

    /**
     *  Store reference to the last added location
     */
    this.setCurrentLocation = function (data) {
        self.currentLocation(data);
    };

    /**
     *  It moves location list off screen
     */
    this.closeControls = function(){
        nav.classList.remove('visible');
        menu_icon.classList.remove('expand');
        menu_icon.classList.add('contract');
    };

    /**
     * City name autoComplete jquery widget
     */
    this.initAutoComplete = function(){
        console.log('initAutoComplete');
        $('#add-input').autocomplete({
            source: function( request, response){
                console.log(request);

                $.ajax({
                    url: "http://gd.geobytes.com/AutoCompleteCity",
                    dataType: 'jsonp',
                    data: {
                        q: request.term
                    },
                    success: function(data){
                        response(data);
                    }
                });
            },
            minLength: 3,
            select: function(event, ui){
                // Add this city to list
                cityString = ui.item.label;
                cityArr = cityString.split(',');
                self.newLocation(cityArr[0]);
                self.addLocation(cityArr[0]);
            },
            open: function() {
                $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
            },
            close: function() {
                $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
            }
        });
    }(self);

    /**
     * Flag to see if location entered is valid
     * @type {*|any}
     */
    this.validPlace = ko.computed(function (){
        return self.newLocation() !== '';
    });

    /**
     *  Called when add-btn is clicked
     *  It adds the location object to the list and the map
     */
    this.addLocation = function () {
        if(!self.validPlace()){
            return;
        }

        // reset the search query so that you can see the newly
        // added list item and marker
        self.clearSearch();

        var place = self.newLocation();

        // Add place to list
        function addToList(locObject){
            self.locationList.push(locObject);
            self.filterLocations();
        }

        // Make a place service request
        function addThisMarker(locObj){
            var service = new google.maps.places.PlacesService(map);
            var request;
            request = {
                query: locObj.name()
            };
            service.textSearch(request, callback);
        }

        // Exit if already exist
        var match = ko.utils.arrayFirst(self.locationList(), function (item) {
            //alert('Place has already been added');
            return place === item.name();
        });

        if (!match) {
            var locObject = new Location(place);
            self.setCurrentLocation(locObject);
            addToList(locObject);
            addThisMarker(locObject);

            // zoom in to city
            var latLng = self.currentMarker().getPosition();
            map.setCenter(latLng);
            map.setZoom(4);
            self.offsetMap();
        }

        self.newLocation('');
        self.closeControls();

    };


    /**
     *  Called when clear button in the search bar is clicked
     *  It nulls the text input value
     */
    this.clearSearch = function(){
        self.searchString('');
    };

    /**
     * Binding function to return filtered location list
     * based on bounded searchString value
     */
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
        return ko.utils.stringStartsWith(marker.name.toLowerCase(), filter);
    }

    /**
     * Called when location list item is clicked.
     * @param place location object
     */
    this.selectThisPlace = function(place){
        for(var i=0; i<markers.length; i++){
            var marker = markers[i];
            self.deactivateMarker(marker);

            if(place() === marker.name){
                self.activateMarker(marker);
                console.log('match found: ' + marker.name);
            }
        }
        self.closeControls();
    };

    this.selectThisMarker = function(marker){
        for(var i=0; i<markers.length; i++){
            markerItem = markers[i];
            self.deactivateMarker(markerItem);

            if(markerItem === marker){
                self.activateMarker(marker);
                console.log('match found: ' + marker.name);
            }
        }
        self.closeControls();
    };

    /**
     * Offset marker by this value
     */
    this.offsetMap = function(){
        map.panBy(0, -80);
    };


    /**
     * Activate a marker
     * @param marker map marker
     */
    this.activateMarker = function(marker){
        self.currentMarker(marker);
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
        marker.isSelected = true;
        self.setInfoWindow(marker);
        marker.infoWindow.open(map, marker);
        marker.toggleBounce();

        // zoom in to city
        var latLng = marker.getPosition();
        map.setCenter(latLng);
        map.setZoom(4);
        self.offsetMap();

        self.selectItem(marker, true);

    };


    /**
     * Deactivate a marker
     * @param marker map marker
     */
    this.deactivateMarker = function(marker){
        marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
        marker.isSelected = false;
        marker.infoWindow.close();
        marker.toggleBounce();
        self.selectItem(marker, false);
    };

    /**
     * Make this marker visible and default to be not active
     * @param marker marker object
     */
    this.showMarker = function(marker){
        for( var i = 0; i < markers.length; i++){
            if(markers[i] === marker){
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
            if(markers[i] === marker){
                markers[i].setMap(null);
            }
        }
    };

    /**
     * Called when map custom binding is initialized
     * It sends out requests to Place service based on location list provided
     * @param locObjList
     */
    this.addMarkers = function(locObjList){
        var service = new google.maps.places.PlacesService(map);
        var request;
        locObjList.forEach(function(place){
            request = {
                query: place.name()
            };
            service.textSearch(request, callback);
        });
    };

    /**
     * Callback function when results were returned from Place service
     * @param result result object returned after making a Place Service request
     * @param status result indicating if the request has been successful
     */
    function callback(result, status){
        if(status === google.maps.places.PlacesServiceStatus.OK){
            self.addMarker(result[0]);
        }
    }

    /**
     * Called when marker is activated
     * It runs an ajax request to wikipedia server,
     * fetches the data, and populates the marker's infoWindow with it.
     * @param marker map marker
     */
    this.setInfoWindow = function(marker){
        var wikiHtmlString;
        var baseUrl = 'http://en.wikipedia.org/';
        var wikiUrl = baseUrl + '/w/api.php?action=opensearch&search=' + marker.name + '' +
            '&format=json&callback=wikiCallback';

        // ** [NOTE to reviewer] **:
        // Jsonp ajax request won't trigger a error/fail response,
        // So the workaround is to use timeout to mimic a fail response.
         var wikiRequestTimeout = setTimeout(function () {
             wikiHtmlString = "Failed to get wikipedia resources";
             marker.infoWindow.setContent(wikiHtmlString);
         }, 8000);


        $.ajax({
            url: wikiUrl,
            dataType: 'jsonp',
            async: true
        }).done(function(response){
            console.log('success');
            var title = response[1][0];
            var body = response[2][0];
            var url = baseUrl + '/wiki/' + title;

            // link
            wikiHtmlString ='<a href="' + url + '">' +
            title + '</a>' +
            '<div>' + body + '</div>';

            var nameArr = marker.title.split(',');
            var city = nameArr[0];
            var country = nameArr[nameArr.length - 1];

            var contentString = '<div id="content" >'+
                '<div id="siteNotice">'+
                '</div>'+
                '<h1 id="firstHeading" class="firstHeading">'+ city +
                '<span id="secondHeading" class="secondHeading">'+ country +'</span>'+
                '</h1>'+
                '<div id="bodyContent">'+
                '<a href="' + url + '" target="_blank">' +
                'Read More...</a>' +
                '<div style="color:#777">' + body + '</div>' +
                '</div>'+
                '</div>';

            // Remove timer after certain time has expired
            clearTimeout(wikiRequestTimeout);

            // Set the content of infoWindow to the htmlString
            marker.infoWindow.setContent(contentString);
        });
    };

    /**
     * Called when marker is clicked
     * It highlight the list item with matching name
     * @param marker map marker
     * @param isTrue flag to add or remove active class
     */
    this.selectItem = function(marker, isTrue){
        var list = self.filterLocations();
        var $items = document.getElementsByClassName('list-item');

        // Find list item with same name as that of marker.
        // And turn its active state on or off

        for(var i=0; i< $items.length; i++){
            if($items[i].textContent === marker.name){
                if(isTrue){
                    $items[i].classList.add('active');
                }else{
                    $items[i].classList.remove('active');
                }
            }
        }
    };

    this.fitMap = function(){
        var bounds = new google.maps.LatLngBounds();
        for(i=0; i< markers.length; i++){
            bounds.extend(markers[i].getPosition());
        }
        map.fitBounds(bounds);
    };

    /**
     * Add marker to map
     * @param place result object returned from place service
     */
    this.addMarker = function(place) {
        var lat = place.geometry.location.lat();
        var lon = place.geometry.location.lng();
        var formattedAddress = place.formatted_address;
        var bounds = window.mapBounds;
        var activeIcon = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
        var inactiveIcon = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

        var marker = new google.maps.Marker({
            map: map,
            icon: inactiveIcon,
            animation: google.maps.Animation.DROP,
            position: place.geometry.location,
            title: formattedAddress,
            name: place.name
        });

        // Add a default spinner while content is being loaded
        marker.infoWindow = new google.maps.InfoWindow(
        {
          content: "<i class='loading' title='Loading...'></i> Loading...",
          maxWidth: 200
        });

        // Add animation to marker while interacting with user
        marker.toggleBounce = function(){
            var self = this;
            if(!self.isSelected){
                self.setAnimation(null);
            }else{
                self.setAnimation(google.maps.Animation.BOUNCE);
            }
        };

        // If it's the newly added place, activate it
        if(place.name === self.currentLocation().name()){
            self.activateMarker(marker);
        }

        markers.push(marker);
        self.currentMarker(marker);

        google.maps.event.addListener(marker, 'click', function() {
            self.selectThisMarker(marker);
        });

        google.maps.event.addListener(marker.infoWindow,'closeclick',function(){
            self.deactivateMarker(marker);
            self.fitMap();
            //map.setZoom(1);
        });

        google.maps.event.addListener(marker, 'mouseover', function() {
            marker.setIcon(activeIcon);
        });

        google.maps.event.addListener(marker, 'mouseout', function() {
            if(!marker.isSelected){
                marker.setIcon(inactiveIcon);
            }
        });

        //google.maps.event.addDomListener(window, 'load', initialize);
        google.maps.event.addDomListener(window, "resize", function() {
            console.log('resize');
            self.fitMap();
        });

        bounds.extend(new google.maps.LatLng(lat, lon));
        map.fitBounds(bounds);
     };
};


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