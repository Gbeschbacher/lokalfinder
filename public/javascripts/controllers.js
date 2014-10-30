var pollsControler = angular.module('pollsControler', []);

pollsControler.controller('PollListCtrl', ['$scope', 'Poll', 'Data',
    function ($scope, Poll, Data) {
        $scope.polls = [];
        $scope.polls = Poll.query();


        $scope.newPoll = function(x) {
            Data.setCategory(x);
        };
    }
]);

pollsControler.controller('PollItemCtrl', ['$scope', '$routeParams', 'Poll', 'socket', 'CheckVote', 'Data',
    function ($scope, $routeParams, Poll, socket, CheckVote, Data) {
        $scope.chartData = [];
        $scope.chart = {};
        $scope.chart.chartData = [];
        $scope.chart.noData = "Laden ...";
        $scope.leadingRestaurant = "";
        $scope.category = Data.getCategory()

        console.log("category");


        $scope.chart.xFunction = function(){
            return function(d) {
                return d.key;
            };
        }

        $scope.chart.yFunction = function(){
            return function(d){
                return d.y;
            };
        }

        Poll.get({
            _id: $routeParams.pollId
        }, function(data){
            $scope.poll = data;
            $scope.poll.choices.sort(_sortArrayDesc);
            console.log($scope.poll)
            _checkIp($scope.poll._id).$promise.then(function (data){
                var userVoted = data;

                if(userVoted.userVoted){
                        var obj = {poll_id: $scope.poll._id, choice: userVoted.userChoice};
                        socket.emit('send:display', obj);
                }

                _updateChart();

            });
        });

        socket.on('myvote', function(data){
            if(data._id === $routeParams.pollId){
                $scope.poll = data;
                $scope.poll.choices.sort(_sortArrayDesc);
                _updateChart();
            }
        });

        socket.on('vote', function(data){
            if(data._id === $routeParams.pollId){
                $scope.poll.choices = data.choices;
                $scope.poll.totalVotes = data.totalVotes;
                $scope.poll.choices.sort(_sortArrayDesc);
                _updateChart();
            }
        });

        $scope.vote = function() {
            if(!$scope.disabled){
                var pollId = $scope.poll._id,
                    choiceId = $scope.poll.userVote;

                _checkIp(pollId).$promise.then(function (data){
                    var userVoted = data;

                    if(!userVoted.userVoted){
                        if(choiceId){
                            var voteObj = {poll_id:pollId, choice: choiceId};
                            socket.emit('send:vote', voteObj);
                        }
                    }else{
                        $scope.disabled = true;
                        $scope.button = "danger";
                    }
                }, function (data){
                });
            }
        };

        $scope.getButtonColor = function(){
            return $scope.button;
        };

        $scope.$watch("poll.userVote", function (a, b){
            if(a || b ){
                _checkIp($scope.poll._id).$promise.then(function (data){
                    if(data.userVoted){
                        $scope.button = "danger";
                        $scope.disabled = true;
                    }else{
                        $scope.button = "success";
                        $scope.disabled = false;
                    }
                });
            }else{
                $scope.button = "danger";
                $scope.disabled = true;
            }
        }, true);

         function _checkIp(pollId){
            return CheckVote.query({_id: pollId});
        };

        function _updateChart (){
            var data = [];
            for(var i=0; i < $scope.poll.choices.length; i++){
                var obj = {
                    key: $scope.poll.choices[i].text,
                    y: $scope.poll.choices[i].votes.length
                };
                data.push(obj);
            }
            $scope.chart.chartData = data;
        }

        function _sortArrayDesc(a,b){
            return b.votes.length-a.votes.length
        };
    }
]);

pollsControler.controller('PollNewCtrl', ['$scope', '$location', 'Poll', 'Data', '$http',
    function ($scope, $location, Poll, Data, $http) {

        $scope.category = Data.getCategory();
        if (typeof $scope.category === 'undefined') {
            $location.path("/");
        }

        $scope.poll = {
            category: $scope.category,
            choices: [],
            dataAsync: []
        };

        $scope.dataAsync = {selected: "Bitte wählen oder suchen ..."};
        $scope.dataAllAsync = [];
        $scope.dataCatAllAsync = [];
        $scope.disabled = true;
        $scope.button = "danger";


        $scope.updateDataAsync = function(item, model){
            $scope.button = "success";
            if($scope.category){
                _addRestaurantsOfCategory(item.name);
                $scope.dataAsync = $scope.poll.choices;
            }else{
                $scope.dataAsync[0] = item;
            }
        };

        $scope.getButtonColor = function(){
            return $scope.button;
        };

        $scope.createQuestion = function() {
           if(!$scope.category){
                $scope.poll.choices = [
                    {text: "Ja"},
                    {text: "Nein"}
                ]
           }else if ($scope.category){}
             else {
                $location.path("/");
           }

           $scope.poll.dataAsync = $scope.dataAsync
            console.log($scope.poll.dataAsync);

            var newPoll = new Poll($scope.poll);

           if(!$scope.disabled){
                newPoll.$save(function(p, resp){
                    if(!p.error){
                        $location.path('poll/'+p._id);
                    } else {
                    }
                });
            }

        };

        /*
            Helper Functions
        */

        function _checkForDoubleCategory(x) {
            var obj = $scope.dataCatAllAsync;
            for (var i = 0; i < obj.length; i++) {
                    if (x === obj[i].name) {
                        return true;
                    }
            }
            return false;
        }

        function _getLocation() {
            if (navigator.geolocation) {
               navigator.geolocation.getCurrentPosition(_showPosition);
            } else {
             // filler text ... geolocation not supported by client
            }
        };

     function _showPosition(position) {
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
            _initCategories(coords); // show cuisine/food category picker
        }
        else if ($scope.category === false) {
            _initRestaurants(coords); // show restaurant category picker
        }
        else {
            $location.path("/");
        }
    }
    _getLocation();

    function _isNotUndefined(name){
        return (typeof name !== "undefined")
    }

    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function _initRestaurants(coords) {
        var url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant]("+coords.latitudeL+","+coords.longitudeL+","+coords.latitudeR+","+coords.longitudeR+");out;";
        $http.get(url)
        .success(function(data, status, headers, config) {
            var data = data.elements
            $scope.dataAllAsync = [];
            for(var i = 0; i < data.length; i++){
                if(_isNotUndefined(data[i].tags.name)){
                    $scope.dataAllAsync.push({
                        "name": data[i].tags.name,
                        "lat" : data[i].lat,
                        "lon" : data[i].lon
                    });
                }
            }
            if($scope.dataAllAsync.length > 0){
                $scope.disabled = false;
            }
        })
        .error(function(data, status, headers, config) {
            console.error(data);
            $scope.dataAsync.selected = "Fehler aufgetreten!";
            $scope.disabled = true;
        });
    }

    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function _initCategories(coords) {
        var url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant][cuisine]("+coords.latitudeL+","+coords.longitudeL+","+coords.latitudeR+","+coords.longitudeR+");out;";

        $http.get(url)
        .success(function(data, status, headers, config) {
            var data = data.elements
            $scope.dataAllAsync = [];
            $scope.dataCatAllAsync = [];

            for(var i = 0; i < data.length; i++){
                if(_isNotUndefined(data[i].tags.name)){
                    $scope.dataAllAsync.push({
                        "name": data[i].tags.name,
                        "lat" : data[i].lat,
                        "lon" : data[i].lon,
                        "cuisine": data[i].tags.cuisine
                    });

                    if (!_checkForDoubleCategory(data[i].tags.cuisine)) {
                            $scope.dataCatAllAsync .push({
                                "name": data[i].tags.cuisine
                            });
                    }
                }
            }
            if($scope.dataCatAllAsync.length > 0){
                $scope.disabled = false;
            }
        })
        .error(function(data, status, headers, config) {
            console.error(data);
            $scope.dataAsync.selected = "Fehler aufgetreten!";
            $scope.disabled = true;
        });
    }

    function _addRestaurantsOfCategory(_cuisine) {
        var data = $scope.dataAllAsync;
        $scope.poll.choices = [];
        for (var i = 0; i < data.length; i++) {
            if (data[i].cuisine === _cuisine) {
                $scope.poll.choices.push({
                    "text":data[i].name ,
                    "cuisine":data[i].cuisine,
                    "lat":data[i].lat ,
                    "lon":data[i].lon
                });
            }
        }
    }

}
]);


