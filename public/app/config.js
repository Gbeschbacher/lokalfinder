/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

app.config(['$compileProvider', '$routeProvider',
            function($compileProvider, $routeProvider) {
                $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
                
                $routeProvider
                        .when('/answer', {
                            templateUrl: 'parts/answer.html',
                            controller: 'AnswerCtrl'
                        })
                        .when('/question', {
                            templateUrl: 'parts/question.html',
                            controller: 'QuestionCtrl'
                        })
                        .when('/', {
                            templateUrl: 'parts/main.html'
                        })

                        .otherwise({redirectTo: '/'});
            }]);
