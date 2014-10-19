var pollsControler = angular.module('pollsControler', []);

pollsControler.controller('PollListCtrl', ['$scope', 'Poll',
    function ($scope, Poll) {
        $scope.polls = [];
        $scope.polls = Poll.query();
    }
]);

pollsControler.controller('PollItemCtrl', ['$scope', '$routeParams', 'Poll', 'socket',
    function ($scope, $routeParams, Poll, socket) {

        Poll.get({
            _id: $routeParams.pollId
        }, function(data){
            $scope.poll = data;
        });

        socket.on('myvote', function(data){
            console.dir(data);
            if(data._id === $routeParams.pollId){
                $scope.poll = data;
            }
        });

        socket.on('vote', function(data){
            console.dir(data);
            if(data._id === $routeParams.pollId){
                $scope.poll.choices = data.choices;
                $scope.poll.totalVotes = data.totalVotes;
            }
        })

        $scope.vote = function() {
            var pollId = $scope.poll._id,
                choiceId = $scope.poll.userVote;

            if(choiceId){
                var voteObj = {poll_id:pollId, choice: choiceId};
                socket.emit('send:vote', voteObj);
            } else {
                console.log("ERROR - SELECT OPTION TO VOTE");
            }
        };
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