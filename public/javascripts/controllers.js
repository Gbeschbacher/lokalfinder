var pollsControler = angular.module('pollsControler', []);

pollsControler.controller('PollListCtrl', ['$scope', 'Poll',
    function ($scope, Poll) {
        $scope.polls = [];
        $scope.polls = Poll.query();
    }
]);

pollsControler.controller('PollItemCtrl', ['$scope', '$routeParams', 'Poll',
    function ($scope, $routeParams, Poll) {

        Poll.get({
            _id: $routeParams.pollId
        }, function(data){
            $scope.poll = data;
        });

        $scope.vote = function() {};
    }
]);

pollsControler.controller('PollNewCtrl', ['$scope', '$location', 'Poll',
    function ($scope, $location, Poll) {
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
    }
]);