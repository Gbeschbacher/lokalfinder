var pollsControler = angular.module('pollsControler', []);
pollsControler.filter('propsFilter', function() {
  return function(items, props) {
    var out = [];

    if (angular.isArray(items)) {
      items.forEach(function(item) {
        var itemMatches = false;

        var keys = Object.keys(props);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var text = props[prop].toLowerCase();
          if (item[prop].toString().toLowerCase().indexOf(text) !== -1) {
            itemMatches = true;
            break;
          }
        }

        if (itemMatches) {
          out.push(item);
        }
      });
    } else {
      // Let the output be the input untouched
      out = items;
    }

    return out;
  };
});
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

                //_updateChart();

            });
        });

        socket.on('myvote', function(data){
            if(data._id === $routeParams.pollId){
                $scope.poll = data;
                //_updateChart();
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

pollsControler.controller('PollNewCtrl', ['$scope', '$location', 'Poll', 'NewPollCategoryService', '$http',
    function ($scope, $location, Poll, NewPollCategoryService, $http) {

        $scope.category = NewPollCategoryService.getCategory();

        $scope.poll = {
            category: $scope.category,
            choices: []
        };

        $scope.dataAsync = {selected: "Bitte wählen oder suchen ..."};
        $scope.dataAllAsync = [];
        $scope.dataCatAllAsync = [];
        $scope.disabled = true;
        $scope.button = "danger";


        $scope.updateDataAsync = function(item, model){
            $scope.dataAsync = item.name;
            $scope.button = "success";
            if($scope.category){
                _addRestaurantsOfCategory(item.name);
            }
        };

        $scope.getButtonColor = function(){
            return $scope.button;
        };

        $scope.createQuestion = function() {
           if(!$scope.category){
                $scope.poll.choices = [
                    {name: "Ja"},
                    {name: "Nein"}
                ]
           }else if ($scope.category){}
             else {
                $location.path("/");
           }

           console.log($scope.poll);
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
        var range = 0.15,
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


    // get openstreetmap JSON data from overpass API and save relevant data to variable osmJSON
    function _initRestaurants(coords) {
        var url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=[out:json];node[amenity=restaurant]("+coords.latitudeL+","+coords.longitudeL+","+coords.latitudeR+","+coords.longitudeR+");out;";

        $http.get(url)
        .success(function(data, status, headers, config) {
            var data = data.elements
            $scope.dataAllAsync = [];
            for(var i = 0; i < data.length; i++){
                $scope.dataAllAsync.push({
                    "name": data[i].tags.name,
                    "lat" : data[i].lat,
                    "lon" : data[i].lon
                });
            }
            $scope.disabled = false;
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
            $scope.disabled = false;
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
                    "name":data[i].name ,
                    "cuisine":data[i].cuisine,
                    "lat":data[i].lat ,
                    "lon":data[i].lon
                });
            }
        }
    }

}
]);


