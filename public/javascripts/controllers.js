var pollsControler = angular.module('pollsControler', []);

pollsControler.controller('PollListCtrl', ['$scope', 'Poll', 'NewPollCategoryService',
    function ($scope, Poll, NewPollCategoryService) {
        $scope.polls = [];
        $scope.polls = Poll.query();
        $scope.category = null;

        $scope.newPoll = function() {
            NewPollCategoryService.setCategory($scope.category);
        };
    }
]);

pollsControler.controller('PollItemCtrl', ['$scope', '$routeParams', 'Poll', 'socket',
    function ($scope, $routeParams, Poll, socket) {

        Poll.get({
            _id: $routeParams.pollId
        }, function(data){
            $scope.poll = data;
        });

        socket.on('myvote', function(data){
            if(data._id === $routeParams.pollId){
                $scope.poll = data;
            }
        });

        socket.on('vote', function(data){
            if(data._id === $routeParams.pollId){
                $scope.poll.choices = data.choices;
                $scope.poll.totalVotes = data.totalVotes;
            }
        })

        $scope.vote = function() {
            var pollId = $scope.poll._id,
                choiceId = $scope.poll.userVote;

            if(choiceId){
                var voteObj = {poll_id:pollId, choice: choiceId};
                socket.emit('send:vote', voteObj);
            }
        };
    }
]);

pollsControler.controller('PollNewCtrl', ['$scope', '$location', 'Poll', 'NewPollCategoryService',
    function ($scope, $location, Poll, NewPollCategoryService) {

        $scope.category = NewPollCategoryService.getCategory();

        $scope.poll = {
            category: $scope.category,
            choices: []
        };

        $scope.createQuestion = function() {

           if(typeof $scope.restaurantSelection != 'undefined'){
                $scope.poll.choices = [
                    {text: "Ja"},
                    {text: "Nein"},
                    {text: "Keine Lust"},
                ]
           }else if (typeof $scope.categorySelection != 'undefined'){

            /*
            write all available restaurants from the chosen category to var
                $scope.poll.choices = [{], {}, {}]
            */
           }else {
                console.log("THIS SHOULD NEVER EVER HAPPEN");
           }

            var newPoll = new Poll($scope.poll);

           //IF $SCOPE.CATEGORY === FALSE --> RESTAURANT MENU
            newPoll.$save(function(p, resp){
                if(!p.error){
                    $location.path('poll/'+p._id);
                } else {
                }
            });

        };

        var latitude;
        var longitude;
        var range;
        var latitudeR;
        var longitudeR;
        var dataJSON;
        var osmRestaurantsJSON = [];
        var osmCategoryJSON = [];
        var url;
        var restaurantSelection;
        var categorySelection;

        function getLocation() {
           if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(showPosition);
           } else {
             // filler text ... geolocation not supported by client
         }
     }

     function showPosition(position) {
        latitude = parseFloat(position.coords.latitude).toFixed(2);
        longitude = parseFloat(position.coords.longitude).toFixed(2);
        range = parseFloat('0.05');
        latitudeL = parseFloat(latitude) - range;
        longitudeL = parseFloat(longitude) - range;
        latitudeR = parseFloat(latitude) + range;
        longitudeR = parseFloat(longitude) + range;
        if ($scope.category === true) {
            initCategories(); // show cuisine/food category picker
        }
        else if ($scope.category === false) {
            initRestaurants(); // show restaurant category picker
        }
        else {
            $location.path("polls");
        }
    }
    getLocation();

    function checkForDoubleCategory(x) {
        for (var i = 0; i < osmCategoryJSON.length; i++) {
            if (x == osmCategoryJSON[i].text) {
                return true;
                break;
            }
        }
        return false;
    }

    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function initRestaurants() {
        url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant]("+latitudeL+","+longitudeL+","+latitudeR+","+longitudeR+");out;";
        $.getJSON(url, function(json){
           for (var i = 0; i < json.elements.length; i++) {
            osmRestaurantsJSON.push({"id":i+1 , "text":json.elements[i].tags.name , "osm-id":json.elements[i].id, "lat":json.elements[i].lat , "lon":json.elements[i].lon})
        }
    });
    }
    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function initCategories() {
        url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant]("+latitudeL+","+longitudeL+","+latitudeR+","+longitudeR+");out;";
        $.getJSON(url, function(json){
           for (var i = 0; i < json.elements.length; i++) {
                if (json.elements[i].tags.hasOwnProperty('cuisine')) {
                    if (!checkForDoubleCategory(json.elements[i].tags.cuisine)) {
                        osmCategoryJSON.push({"id":i+1 , "text":json.elements[i].tags.cuisine , "osm-id":json.elements[i].id, "lat":json.elements[i].lat , "lon":json.elements[i].lon})
                    }
            }
        }
    });
    }

    $('#selectRestaurant').select2({
        data: osmRestaurantsJSON,
        placeholder: "Wähle ein Restaurant...",
        multiple: false,
        width: "200px"
    });

    $("#selectRestaurant").on("change", function() {
        $scope.restaurantSelection = $('#selectRestaurant').select2('data');
        //alert(JSON.stringify(restaurantSelection));
    });

    $('#selectCategory').select2({
        data: osmCategoryJSON,
        placeholder: "Wähle eine Küche...",
        multiple: false,
        width: "200px"
    });

    $("#selectCategory").on("change", function() {
        $scope.categorySelection = $('#selectCategory').select2('data');
        //alert(JSON.stringify(categorySelection));
    });
}
]);