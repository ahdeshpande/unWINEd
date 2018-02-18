var map;
var client_id = '1TEOHZPSLGCQO2I51YSOXEM3SQNO03JSSTV4MECKJEZI11M3';
var client_secret = 'WVU4WZF4AZAPS4VJR321RSJUVMZF2I5ZKLGSWXHCY2VBEFNF';
var latitude = 38.033554;
var longitude = -78.507980;
var venues = {}
var locations = []

// Create a new blank array for all the listing markers.
var markers = [];

function initMap() {

    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: latitude, lng: longitude},
        zoom: 11,
        mapTypeControl: false
    });

    // List of wineries around Charlottesville
    // Populate model using this API call
    // https://api.foursquare.com/v2/venues/search?ll=38.0372773,-78.6967735&categoryId=%204bf58dd8d48988d14b941735
    // &oauth_token=JV53GV5NT3N3FD5CL4MWJQDKU42M0N3AR3BFHN5UKV1FQZIT&v=20180217

    locations = [
        // {title: 'Park Ave Penthouse', location: {lat: 40.7713024, lng: -73.9632393}},
        // {title: 'Chelsea Loft', location: {lat: 40.7444883, lng: -73.9949465}},
        // {title: 'Union Square Open Floor Plan', location: {lat: 40.7347062, lng: -73.9895759}},
        // {title: 'East Village Hip Studio', location: {lat: 40.7281777, lng: -73.984377}},
        // {title: 'TriBeCa Artsy Bachelor Pad', location: {lat: 40.7195264, lng: -74.0089934}},
        // {title: 'Chinatown Homey Space', location: {lat: 40.7180628, lng: -73.9961237}}
    ];

    get_venues()

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
        infowindow.setContent('<div>' + marker.title + '</div>');
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function () {
            infowindow.marker = null;
        });
    }
}

// This function will loop through the markers array and display them all.
function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideListings() {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}

function get_venues() {
    /**********FourSquare***************/
    $.ajax({
        url: 'https://api.foursquare.com/v2/venues/search',
        dataType: 'json',
        data: 'll=' + latitude.toString() + ',' + longitude.toString() +
        '&client_id=' + client_id +
        '&client_secret=' + client_secret +
        '&v=20140806' +
        '&categoryId=4bf58dd8d48988d14b941735',
        success: function (data) {
            venues = data.response.venues
            var number_of_locations = venues.length;
            locations = []
            if (number_of_locations > 0) {
                // Iterate through responses and retrieve location information
                for (var i = 0; i < number_of_locations; i++) {
                    locations.push({
                        title: venues[i].name,
                        location: {
                            lat: venues[i].location['lat'],
                            lng: venues[i].location['lng']
                        }
                    })
                }
                update_markers()

                showListings()
            }
            else {
                console.log("No Locations available")
            }

        },
        error: function (data) {
            console.log(data)
            console.log("Error in fetching data")
        }
    })
}

function update_markers() {

    var largeInfowindow = new google.maps.InfoWindow();

    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: i
        });
        // Push the marker to our array of markers.
        markers.push(marker);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function () {
            populateInfoWindow(this, largeInfowindow);
        });
    }
}