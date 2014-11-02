var pollsControler = angular.module('pollsControler', []);

pollsControler.filter('iif', function () {
   return function(input, trueValue, falseValue) {
        return input ? trueValue : falseValue;
   };
});

pollsControler.controller('PollListCtrl', ['$scope', 'Poll',
    function ($scope, Poll) {
        $scope.polls = [];
        $scope.polls = Poll.query();
    }
]);

pollsControler.controller('PollItemCtrl', ['$scope', '$routeParams', 'Poll', 'socket', 'CheckVote',
    function ($scope, $routeParams, Poll, socket, CheckVote) {
        $scope.chartData = [];
        $scope.chart = {};
        $scope.chart.chartData = [];
        $scope.chart.noData = "Laden ...";
        $scope.leadingRestaurant = "";
        $scope.map = [];
        $scope.markers = [];

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
            $scope.category = $scope.poll.category;
            $scope.dataAsync =$scope.poll.dataAsync;
            $scope.poll.choices.sort(_sortArrayDesc);
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
        /*
         * initiate google Map for restaurants
         */
        $scope.initMap = function(lat, lon) {
            var mapOptions = {
                zoom: 20,
                center: new google.maps.LatLng(lat, lon),
                mapTypeId: google.maps.MapTypeId.TERRAIN
            }

            $scope.map = new google.maps.Map(document.getElementById('gmap'), mapOptions);
        }
        /*
         * create map markers for restaurants on google map
         */
        $scope.createMapMarker = function(lat, lon, name) {
            var marker = new google.maps.Marker({
                map: $scope.map,
                position: new google.maps.LatLng(lat, lon),
                title: name
            });
            marker.content = '<div class="markerContent">' + name + '</div>';

            google.maps.event.addListener(marker, 'click', function(){
                infoWindow.setContent('<h2>' + marker.title + '</h2>' + marker.content);
                infoWindow.open($scope.map, marker);
            });

            $scope.markers.push(marker);    
        }
    }
]);

pollsControler.controller('PollNewCtrl', ['$scope', '$location', 'Poll',
    '$http', '$routeParams',
    function ($scope, $location, Poll, $http, $routeParams) {

        $scope.routeParam = $routeParams.option;
        $scope.limitOSMResults = 20;
        $scope.category  = false;
        if($scope.routeParam === "cuisine"){
            $scope.category = true;
        }

        $scope.poll = {
            category: $scope.category,
            choices: [],
            dataAsync: []
        };

        $scope.dataAsync = {selected: "Daten werden geladen ..."};
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
           }

           $scope.poll.dataAsync = $scope.dataAsync;

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

        if ($scope.category) {
            _initCategories(coords); // show cuisine/food category picker
        }
        else{
            _initRestaurants(coords); // show restaurant category picker
        }
    }
    _getLocation();

    function _isNotUndefined(name){
        return (typeof name !== "undefined")
    }

    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function _initRestaurants(coords) {
        var url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant]("+coords.latitudeL+","+coords.longitudeL+","+coords.latitudeR+","+coords.longitudeR+");out%20" + $scope.limitOSMResults +";";
        console.log(url);
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
                $scope.dataAsync = {selected: "Bitte wählen oder suchen ..."};
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
        var url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant][cuisine]("+coords.latitudeL+","+coords.longitudeL+","+coords.latitudeR+","+coords.longitudeR+");out%20" + $scope.limitOSMResults +";";

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
                $scope.dataAsync = {selected: "Bitte wählen oder suchen ..."};
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


