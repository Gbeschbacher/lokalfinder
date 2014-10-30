var service = angular.module('pollServices',['ngResource']);

service.factory('Poll', function($resource){
    return $resource('/api/poll/:_id');
});

service.factory('CheckVote', function($resource){
    return $resource('/api/poll/:_id/check', {
        _id: '@pollId'
    },{
    	'query': {method: 'GET', isArray:false}
    });
});

service.factory('Data', function(){
    var data = {
      category: undefined
    };

    return {
      getCategory: function(){
        return data.category;
      },
      setCategory: function(x){
        data.category = x;
      }
    };
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