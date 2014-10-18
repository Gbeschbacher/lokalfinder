var service = angular.module('pollServices',['ngResource']);

service.factory('Poll', function($resource){
    return $resource('/polls/:_id');
});
