
var checkSessionModule = angular.module('CheckSessionModule',[]);

checkSessionModule.controller('CheckSessionController', [ '$state', '$scope',
  'checkCredentialsServise', 'myModalWindowService', '$log',
  function($state, $scope, checkCredentialsServise, myModalWindowService, $log){    
    
    $log.getInstance("CheckSession");
    checkCredentialsServise.getUserCredits().then(
      function successCallBack(details){
          $log.info("User session is valid. Available to show dashboard.");
          // okk. passed
          $state.go('root.main.dashboard');
      }, function errorCallBack(error){
          $log.info("User session isn't valid. Redirect to loginpage.");
          // show modal window                  
          myModalWindowService.showModal("type2");
          $state.go('root.login');
      }
    );
  }
]);