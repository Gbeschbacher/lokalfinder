var pollDirective = angular.module("pollDirective", [])

pollDirective.directive('backgroundDirective',
   ['$window', function ($window) {
   return {
      restrict: "AE",
      link: function($scope, $element){
         $scope.resize = function() {
            var win = $(window);
            var winW = win.width(),
            winH = win.height(),
            $bg = $($element),
            availableResolution = [
            {x: 3840 , y: 2400},
            {x: 3840, y: 2160},
            {x: 3840, y: 1200},
            {x: 2560, y: 1600},
            {x: 2560, y: 1440},
            {x: 2560, y: 1080},
            {x: 2560, y: 1024},
            {x: 2048, y: 1152},
            {x: 1920, y: 1200},
            {x: 1920, y: 1080},
            {x: 1680, y: 1050},
            {x: 1600, y: 900},
            {x: 1440, y: 900},
            {x: 1280, y: 800},
            {x: 1280, y: 720},
            {x: 1366, y: 768},
            {x: 1080, y: 1920},
            {x: 1024, y: 600},
            {x: 960, y: 544},
            {x: 800, y: 1280},
            {x: 800, y: 600},
            {x: 720, y: 1280},
            {x: 540, y: 960},
            {x: 480, y: 854},
            {x: 480, y: 800},
            {x: 400, y: 480},
            {x: 360, y: 640},
            {x: 320, y: 480},
            {x: 320, y: 240},
            {x: 240, y: 400},
            {x: 240, y: 320}];

            var url = $bg.css("background-image");
            var currentRes = url.substr(url.lastIndexOf("/"));
            var currentX = currentRes.match(/([0-9]+)/) ? RegExp.$1 : null;
            var currentY = currentRes.match(/x([0-9]+)/) ? RegExp.$1 : null;

            if((!currentX || !currentY)  || ((currentX < winW || currentY < winH)
                  && (currentX < availableResolution[0].x || currentY < availableResolution[0].y))) {

               var chosenX = availableResolution[0].x;
               var chosenY = availableResolution[0].y;
               for (var i=availableResolution.length-1; i>=0; i--) {
                  if (availableResolution[i].x >= winW && availableResolution[i].y >= winH) {
                     chosenX = availableResolution[i].x;
                     chosenY = availableResolution[i].y;
                     break;
                  }
               }

               var url = 'http://wallpaperscraft.com/image/39288/' + chosenX + 'x'+ chosenY+'.jpg';

              $('<img/>').attr('src', url).load(function() {
                  $(this).remove();
                   $bg.css('background-image', 'url(' + url + ')');

               });
               console.log('url(http://wallpaperscraft.com/image/39288/' + chosenX + 'x'+ chosenY+'.jpg)');
         }

            // Determine whether width or height should be 100%
/*            console.log("************");
            console.log("PRINTING DATA");
            console.log("WINW:" + winW);
            console.log("WINH:    -" + winH);
            console.log("BGW:    -" + $bg.width());
            console.log("BGH:    -" + $bg.height());
            console.log("************");
            console.log((winW / winH));
            console.log(($bg.width() / $bg.height()));
            console.log((winW / winH) < ($bg.width() / $bg.height()));*/

            if ((winW / winH) < ($bg.width() / $bg.height()) ||
               (winW / winH) === ($bg.width() / $bg.height()) ||
               ($bg.height() > winH)
               ) {
               $bg.css({height: '100%', width: 'auto'});
            }
             else {
               $bg.css({height: 'auto', width: '100%'});
            }
         }

         $scope.$on('$viewContentLoaded', function () {
            $scope.resize();
         });

         angular.element($window).bind('resize', function() {
            $scope.resize();
         });


      }

   }
}]);

pollDirective.directive('perfectDirective',
   ['$window', function ($window) {
   return {
      restrict: "A",
      link: function($scope, $element){
         $scope.$on('$viewContentLoaded', function () {
            $($element).perfectScrollbar({
               wheelPropagation: true,
               suppressScrollX: true,
            });
         });
      }
   }
}]);