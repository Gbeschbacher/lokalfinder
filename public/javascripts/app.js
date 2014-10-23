var polls = angular.module('polls', [
    "ngRoute",
    "pollsControler",
    "pollServices"
]);

polls.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.
            when('/', { templateUrl: 'partials/list.html', controller: 'PollListCtrl'}).
            when('/poll/create', { templateUrl: 'partials/new.html', controller: 'PollNewCtrl'}).
            when('/poll/:pollId', { templateUrl: 'partials/item.html', controller: 'PollItemCtrl'}).
            otherwise({ redirectTo: '/' });
    }]);
