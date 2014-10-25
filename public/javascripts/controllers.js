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

pollsControler.controller('PollItemCtrl', ['$scope', '$routeParams', 'Poll', 'socket', 'CheckVote',
    function ($scope, $routeParams, Poll, socket, CheckVote) {

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

            var userVoted = _checkIp(pollId);
            console.log("******************");
            console.log("CONTROLLER");
            console.log("USERVOTED");
            console.log(userVoted);
            console.log("******************");

            if(!userVoted.userVoted){
                console.log("if !useVoted.userVoted");
                if(choiceId){
                    console.log("userVoted");
                    var voteObj = {poll_id:pollId, choice: choiceId};
                    socket.emit('send:vote', voteObj);
                }
                else{
                    // choice in frontend is missing
                }
            } else{
                // userVoted = true.. so user has already a choice
                // userVoted.userChoice = {_id, text: (choice)}
            }
        };

         function _checkIp(pollId){
            CheckVote.query({_id: pollId},
                function (data){

            });
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

        /*
            Helper Functions
        */

        function _checkForDoubleCategory(obj, x) {
            for (var i = 0; i < obj.length; i++) {
                    if (x === obj[i].text) {
                        return true;
                    }
            }
            return false;
        }

        function getLocation() {
            if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(showPosition);
            } else {
             // filler text ... geolocation not supported by client
            }
        };

     function showPosition(position) {
        var range = 0.05,
            latitude = parseFloat(position.coords.latitude).toFixed(2),
            longitude = parseFloat(position.coords.longitude).toFixed(2);

        var coords = {
            longitudeL: parseFloat(longitude) - range,
            latitudeL: parseFloat(latitude) - range,
            latitudeR: parseFloat(latitude) + range,
            longitudeR: parseFloat(longitude) + range
        };

        if ($scope.category === true) {
            initCategories(coords); // show cuisine/food category picker
        }
        else if ($scope.category === false) {
            initRestaurants(coords); // show restaurant category picker
        }
        else {
            $location.path("/");
        }
    }
    getLocation();


    var osmCategoryJSON = [];
    var osmRestaurantsJSON = [];
    var osmCategoryRestaurantsJSON = [];
    var cuisineRestaurants = [];

    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function initRestaurants(coords) {
        var url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant]("+coords.latitudeL+","+coords.longitudeL+","+coords.latitudeR+","+coords.longitudeR+");out;";

        $.getJSON(url, function(json){
            for (var i = 0; i < json.elements.length; i++) {
                osmRestaurantsJSON.push({
                    "id": i+1 ,
                    "text": json.elements[i].tags.name ,
                    "osmid":json.elements[i].id,
                    "lat":json.elements[i].lat ,
                    "lon":json.elements[i].lon
                });
            }

        });
    }

    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function initCategories(coords) {
        var url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant][cuisine]("+coords.latitudeL+","+coords.longitudeL+","+coords.latitudeR+","+coords.longitudeR+");out;";

        $.getJSON(url, function(json){
            for (var i = 0; i < json.elements.length; i++) {
                osmCategoryRestaurantsJSON.push({
                    "id":i+1 ,
                    "name":json.elements[i].tags.name ,
                    "cuisine":json.elements[i].tags.cuisine ,
                    "osmid":json.elements[i].id,
                    "lat":json.elements[i].lat ,
                    "lon":json.elements[i].lon
                });

                // prohibit double entries to get a JSON with unique foods/cuisines
                if (!_checkForDoubleCategory(osmCategoryJSON,json.elements[i].tags.cuisine)) {

                    osmCategoryJSON.push({
                        "id":i+1 ,
                        "text":json.elements[i].tags.cuisine
                    });
                }
            }
        });
    }

    function addCategoryRestaurants() {
        for (var i = 0; i < osmCategoryRestaurantsJSON.length; i++) {
            if (osmCategoryRestaurantsJSON[i].cuisine === $scope.categorySelection.text) {
                cuisineRestaurants.push({
                    "id":osmCategoryRestaurantsJSON[i].id ,
                    "name":osmCategoryRestaurantsJSON[i].name ,
                    "cuisine":osmCategoryRestaurantsJSON[i].cuisine ,
                    "osmid":osmCategoryRestaurantsJSON[i].osmid,
                    "lat":osmCategoryRestaurantsJSON[i].lat ,
                    "lon":osmCategoryRestaurantsJSON[i].lon
                });
            }
        }
    }

    $('#selectRestaurant').select2({
        data: osmRestaurantsJSON,
        placeholder: "Wähle ein Restaurant...",
        multiple: false,
        width: "200px"
    });


    $('#selectCategory').select2({
        data: osmCategoryJSON,
        placeholder: "Wähle eine Küche...",
        multiple: false,
        width: "200px"
    });

    $("#selectRestaurant").on("change", function() {
        $scope.restaurantSelection = $('#selectRestaurant').select2('data');
    });


    $("#selectCategory").on("change", function() {
        $scope.categorySelection = $('#selectCategory').select2('data');
        addCategoryRestaurants();
    });
}
]);


