var polls = angular.module('polls', [
    "ngRoute",
    "pollsControler",
    "pollServices",
    "nvd3",
    "pollDirective"
]);

polls.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.
            when('/', { templateUrl: 'partials/index', controller: 'PollListCtrl'}).
            when('/poll/create', { templateUrl: 'partials/new', controller: 'PollNewCtrl'}).
            when('/poll/:pollId', { templateUrl: 'partials/item', controller: 'PollItemCtrl'})
            .otherwise({ redirectTo: '/' });
    }]);
