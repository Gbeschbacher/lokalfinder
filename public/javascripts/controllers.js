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
        $scope.chartData = [];
        $scope.chartOptions = {
            chart: {
                type: 'pieChart',
                height: 300,
                x: function(d){return d.key;},
                y: function(d){return d.y;},
                showLabels: true,
                transitionDuration: 500,
                labelThreshold: 0.01,
                "showLegend": false,
                "tooltips": false,
            }
        };

        $scope.chartConfig = {
            visible: false,
            extended: true,
            disabled: false,
            autorefresh: true,
            refreshDataOnly: false
        };

        Poll.get({
            _id: $routeParams.pollId
        }, function(data){
            $scope.poll = data;
            _checkIp($scope.poll._id).$promise.then(function (data){
                var userVoted = data;

                if(userVoted.userVoted){
                        var obj = {poll_id: $scope.poll._id, choice: userVoted.userChoice};
                        socket.emit('send:display', obj);
                }

                _updateChart();
                setTimeout(_updateChart, 350);

            });
        });

        socket.on('myvote', function(data){
            if(data._id === $routeParams.pollId){
                $scope.poll = data;
                _updateChart();
            }
        });

        socket.on('vote', function(data){
            if(data._id === $routeParams.pollId){
                $scope.poll.choices = data.choices;
                $scope.poll.totalVotes = data.totalVotes;
                _updateChart();
            }
        });

        $scope.vote = function() {
            var pollId = $scope.poll._id,
                choiceId = $scope.poll.userVote;

            _checkIp(pollId).$promise.then(function (data){
                var userVoted = data;

                if(!userVoted.userVoted){
                    if(choiceId){
                        var voteObj = {poll_id:pollId, choice: choiceId};
                        socket.emit('send:vote', voteObj);
                    } else{
                        // choice in frontend is missing
                    }
                }
            });
        };

         function _checkIp(pollId){
            return CheckVote.query({_id: pollId});
        };

        function _updateChart (){
            var data = [];
            for(var i=0; i < $scope.poll.choices.length; i++){
                var obj = {
                    key: $scope.poll.choices[i].text,
                    y: $scope.poll.choices[i].votes.length + Math.random()
                };
                data.push(obj);
            }
            $scope.chartData = data;
            $scope.api.refresh();
        }

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
                    {text: "Nein"}
                ]
           }else if (typeof $scope.categorySelection != 'undefined'){
                /*
                write all available restaurants from the chosen category to var
                    $scope.poll.choices = [{}, {}, {}]
                */

                $scope.poll.choices = cuisineRestaurants;

           }else {
                /*

                */
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
                    "text":osmCategoryRestaurantsJSON[i].name ,
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
        width: "270px"
    });


    $('#selectCategory').select2({
        data: osmCategoryJSON,
        placeholder: "Wähle eine Küche...",
        multiple: false,
        width: "270px"
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


