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
            } else {
                console.log("ERROR - SELECT OPTION TO VOTE");
            }
        };
    }
]);

pollsControler.controller('PollNewCtrl', ['$scope', '$location', 'Poll', 'NewPollCategoryService',
    function ($scope, $location, Poll, NewPollCategoryService) {
        $scope.category = NewPollCategoryService.getCategory();
        $scope.poll = {
            question: '',
            choices: [{ text: '' }, { text: '' }, { text: '' }]
        };

        $scope.addChoice = function() {
            $scope.poll.choices.push({ text: '' });
        };

        $scope.createQuestion = function() {
            var poll = $scope.poll;
            if(poll.question.length> 0){
                var choiceCount = 0;
                for(var i=0, ln = poll.choices.length; i<ln; i++){
                    var choice = poll.choices[i];
                    if(choice.text.length > 0){
                        choiceCount++;
                    }
                }
                if(choiceCount > 1){
                    var newPoll = new Poll(poll);
                    newPoll.$save(function(p, resp){
                        if(!p.error){
                            $location.path('polls');
                        } else {
                            alert('could not create poll');
                        }
                    });
                } else {
                    alert('enter at least 2 choices');
                }
            };
        };

        var latitude;
        var longitude;
        var range;
        var latitudeR;
        var longitudeR;
        var dataJSON;
        var osmRestaurantsJSON = [];
        var osmCategoryJSON = [];
        var osmCategoryRestaurantsJSON = [];
        var cuisineRestaurants = [];
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
            $window.location.href = '/';
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
            osmRestaurantsJSON.push({"id":i+1 , "text":json.elements[i].tags.name , "osmid":json.elements[i].id, "lat":json.elements[i].lat , "lon":json.elements[i].lon});
        }
    });
    }
    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function initCategories() {
        url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant]("+latitudeL+","+longitudeL+","+latitudeR+","+longitudeR+");out;";
        $.getJSON(url, function(json){
           for (var i = 0; i < json.elements.length; i++) {
                if (json.elements[i].tags.hasOwnProperty('cuisine')) {
                    osmCategoryRestaurantsJSON.push({"id":i+1 , "name":json.elements[i].tags.name , "cuisine":json.elements[i].tags.cuisine , "osmid":json.elements[i].id, "lat":json.elements[i].lat , "lon":json.elements[i].lon});
                    if (!checkForDoubleCategory(json.elements[i].tags.cuisine)) {
                        osmCategoryJSON.push({"id":i+1 , "text":json.elements[i].tags.cuisine , "osmid":json.elements[i].id, "lat":json.elements[i].lat , "lon":json.elements[i].lon});
                    }
            }
        }
    });
    }

    function addCategoryRestaurants() {
        for (var i = 0; i < osmCategoryRestaurantsJSON.length; i++) {
            if (osmCategoryRestaurantsJSON[i].cuisine === categorySelection.text) {
                cuisineRestaurants.push({"id":osmCategoryRestaurantsJSON[i].id , "name":osmCategoryRestaurantsJSON[i].name , "cuisine":osmCategoryRestaurantsJSON[i].cuisine , "osmid":osmCategoryRestaurantsJSON[i].osmid, "lat":osmCategoryRestaurantsJSON[i].lat , "lon":osmCategoryRestaurantsJSON[i].lon});   
            }
        }
    }

    $('#selectRestaurant').select2({
        data: osmRestaurantsJSON,
        placeholder: "Wähle ein Restaurant...",
        multiple: false,
        width: "200px"
    });

    $("#selectRestaurant").on("change", function() {
        restaurantSelection = $('#selectRestaurant').select2('data');
        alert(JSON.stringify(restaurantSelection));
    });

    $('#selectCategory').select2({
        data: osmCategoryJSON,
        placeholder: "Wähle eine Küche...",
        multiple: false,
        width: "200px"
    });

    $("#selectCategory").on("change", function() {
        categorySelection = $('#selectCategory').select2('data');
        addCategoryRestaurants();
    });
}
]);