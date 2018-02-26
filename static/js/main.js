var map = null;
var client_id = '1TEOHZPSLGCQO2I51YSOXEM3SQNO03JSSTV4MECKJEZI11M3';
var client_secret = 'WVU4WZF4AZAPS4VJR321RSJUVMZF2I5ZKLGSWXHCY2VBEFNF';
var latitude = 38.033554;
var longitude = -78.507980;
var all_venue_data = [];
var locations = [];

// Class to represent a venue
function Venue(id, name, latitude, longitude) {
    var self = this;
    self.id = id;
    self.name = name;
    self.latitude = latitude;
    self.longitude = longitude;
}

// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: latitude, lng: longitude},
        zoom: 11,
        mapTypeControl: false
    });

    map.setZoom(10)
    map.panBy(-100, 0)

    // document.getElementById('show-listings').addEventListener('click', showListings);
    $('.hide-all').on('click', function (e) {
        e.preventDefault();
        hideListings();
    })
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('<div class="venue-name">' + marker.title + '</div>');
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });
    }
}

// This function will loop through the listings and hide them all.
function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function update_markers(venue_list) {

    var largeInfowindow = new google.maps.InfoWindow();

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < venue_list.length; i++) {
        // Get the position from the location array.
        var position = {
            lat: venue_list[i].latitude,
            lng: venue_list[i].longitude
        };
        var title = venue_list[i].name;
        // Create a marker per location, and put into markers array.
        var marker = default_marker(venue_list[i].id, title, position);
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function () {
            populateInfoWindow(this, largeInfowindow);
        });
        marker.addListener('mouseover', function () {
            highlight_marker(this);
        });
        marker.addListener('mouseout', function () {
            ignore_marker(this);
        });
    }
}

function venues_view_model() {
    var self = this;

    self.venues = ko.observableArray();

    // Data - would come from the server
    // List of wineries around Charlottesville
    // Populate model using this API call
    // https://api.foursquare.com/v2/venues/search?ll=38.0372773,-78.6967735&categoryId=%204bf58dd8d48988d14b941735
    // &oauth_token=JV53GV5NT3N3FD5CL4MWJQDKU42M0N3AR3BFHN5UKV1FQZIT&v=20180217

    /**********FourSquare***************/
    $.ajax({
        url: 'https://api.foursquare.com/v2/venues/search',
        dataType: 'json',
        data: 'll=' + latitude.toString() + ',' + longitude.toString() +
        '&client_id=' + client_id +
        '&client_secret=' + client_secret +
        '&v=20140806' +
        '&categoryId=4bf58dd8d48988d14b941735' +
        '&distance=10000' +
        '&limit=15',
        success: function (data) {
            all_venue_data = data.response.venues;

            var number_of_locations = all_venue_data.length;
            locations = []

            if (number_of_locations > 0) {
                // Iterate through responses and retrieve location information
                for (var i = 0; i < number_of_locations; i++) {
                    self.venues.push(new Venue(all_venue_data[i].id,
                        all_venue_data[i].name,
                        all_venue_data[i].location['lat'],
                        all_venue_data[i].location['lng']
                    ))
                }
                update_markers(ko.toJS(self.venues));

            }
            else {
                console.log("No Locations available")
            }
        },
        error: function (data) {
            console.log(data);
            console.log("Error in fetching data")
        }
    });

    self.highlightVenue = function (venue) {
        highlight_marker(markers.filter(obj => obj.id === venue['id'])[0]);
    };

    self.ignoreVenue = function (venue) {
        ignore_marker(markers.filter(obj => obj.id === venue['id'])[0]);
    };

    self.selectVenue = function(venue){
        populateInfoWindow(markers.filter(obj => obj.id === venue['id'])[0], new google.maps.InfoWindow())
    };

    self.query = ko.observable('');

    self.filteredVenues = ko.computed(function () {
        var filter = self.query().toLowerCase();

        if (!filter) {
            if (typeof google === 'object'){
                return ko.utils.arrayFilter(self.venues(), function (venue) {
                    var visible_marker = markers.filter(obj => obj.id === venue['id'])[0];
                    if(typeof visible_marker !== 'undefined') {
                        visible_marker.setMap(map);
                    }
                    return true;
                })
            }
            else {
                return self.venues();
            }
        } else {
            hideListings();
            return ko.utils.arrayFilter(self.venues(), function (venue) {
                if (venue.name.toLowerCase().indexOf(filter) >= 0) {
                    var visible_marker = markers.filter(obj => obj.id === venue['id'])[0];
                    visible_marker.setMap(map);
                    return true;
                }
                else {
                    var visible_marker = markers.filter(obj => obj.id === venue['id'])[0];
                    visible_marker.setMap(null);
                    return false;
                }
            });
        }

    });

}

function default_marker(id, title, position) {
    var image = {
        url: 'static/img/wine-glass-empty.png',
        // This marker is 20 pixels wide by 32 pixels high.
        size: new google.maps.Size(20, 32),
        // The origin for this image is (0, 0).
        origin: new google.maps.Point(0, 0),
        // The anchor for this image is the base of the flagpole at (0, 32).
        anchor: new google.maps.Point(0, 32)
    };

    var shape = {
        coords: [1, 1, 1, 20, 18, 20, 18, 1],
        type: 'poly'
    };

    return new google.maps.Marker({
        position: {lat: position['lat'], lng: position['lng']},
        map: map,
        icon: image,
        shape: shape,
        title: title,
        id: id,
        animation: google.maps.Animation.DROP
    });

}


function highlight_marker(marker) {
    marker.setIcon({
        url: 'static/img/wine-glass-filled.png',
        // This marker is 20 pixels wide by 32 pixels high.
        size: new google.maps.Size(20, 32),
        // The origin for this image is (0, 0).
        origin: new google.maps.Point(0, 0),
        // The anchor for this image is the base of the flagpole at (0, 32).
        anchor: new google.maps.Point(0, 32)
    });
}

function ignore_marker(marker) {
    marker.setIcon({
        url: 'static/img/wine-glass-empty.png',
        // This marker is 20 pixels wide by 32 pixels high.
        size: new google.maps.Size(20, 32),
        // The origin for this image is (0, 0).
        origin: new google.maps.Point(0, 0),
        // The anchor for this image is the base of the flagpole at (0, 32).
        anchor: new google.maps.Point(0, 32)
    });
}

ko.applyBindings(new venues_view_model())