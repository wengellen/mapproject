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
};


// ViewModel

var ViewModel = function(){
  var self = this;
  this.locationList = ko.observableArray([]);

  initialLocations.forEach(function(locationItem, index){
    self.locationList.push( new Location(locationItem) );
  });

  this.currenLocation = ko.observable( this.locationList()[0] );

  this.setLocation = function(clickedLocation){
    self.currenLocation(clickedLocation);
  }
};


ko.applyBindings(new ViewModel());