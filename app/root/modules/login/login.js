var loginModule = angular.module('LoginModule', []);

loginModule.controller('LoginController', ['$scope', '$state',  
  'checkCredentialsServise', 'userCreditsStorage', 'myModalWindowService',
  'LoadMaskService', '$log',
  function($scope, $state, checkCredentialsServise, userCreditsStorage,
    myModalWindowService, LoadMaskService, $log){    
    var thisPointer = this;
    $log.getInstance("Login");
    LoadMaskService.activateLoadMask();
    checkCredentialsServise.getUserCredits().then(
      function successCallBack(details){
        // okk. passed  
        var isAdmin = details.admin;
        $log.info("User check session success.");                
        LoadMaskService.deactivateLoadMask();
        $state.go('root.main.dashboard', {"admin":!!isAdmin});
      }, function errorCallBack(error){
        // show modal window   ????
        $log.warn("User check session fail.");
        LoadMaskService.deactivateLoadMask();
        $state.go('root.login');
      }
    );
    thisPointer.submit = function(){
      var login = thisPointer.login;
      var password = thisPointer.password;
      if (login !== null && login !== undefined && login !==''
        && password !== null && password !== undefined && password !==''){
        thisPointer.password = null;
        LoadMaskService.activateLoadMask();
        checkCredentialsServise.checkCredentials(login, password).then(
          function(details){
              $log.info("User login success.");
              var isAdmin = details.admin;
              userCreditsStorage.setUserCredits(
                {"login": login,
                  "admin": !!isAdmin}
              );   
              LoadMaskService.deactivateLoadMask();
              $state.go('root.main.dashboard', {"admin":!!isAdmin});
          }, function(reason){
              $log.warn("User login fail.");
              LoadMaskService.deactivateLoadMask();
              // go to login page. 
              // show error login message in modal window
              // don't save anything             
              myModalWindowService.showModal("type1");
        });                
      } else {
        thisPointer.password = null;
        LoadMaskService.deactivateLoadMask();
        // show Modal 
        myModalWindowService.showModal("type1");
      }
    }    
  }
])