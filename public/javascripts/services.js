var service = angular.module('pollServices',['ngResource']);

service.factory('Poll', function($resource){
    return $resource('/polls/:_id');
});

service.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
      });
    });
  },
  emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
        }
    });
    })
  }
};
});

// service for saving category of which poll the user requests (restaurant/cuisine)
polls.service('NewPollCategoryService', [ function() {
  var category = null;

  this.getCategory = function() {
    return category;
  };

  this.setCategory = function(value) {
    category = value;
  };

  return this;
}]);