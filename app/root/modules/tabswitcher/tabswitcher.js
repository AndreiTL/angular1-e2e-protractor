
var tabSwitcherModule = angular.module('TabSwitcherModule',
	['DashboardModule', 'TabOneModule', 'TabTwoModule', 'FeedbackModule',
	'AdminModule']);

tabSwitcherModule.controller('TabSwitcherController', ['$state', 
  'userDataStorage', 'checkCredentialsServise',
  'logoutService', 'myModalWindowService', 
  'LoadMaskService', '$log',
  function($state, userDataStorage, checkCredentialsServise, 
    logoutService, myModalWindowService, LoadMaskService, $log){
      var thisPointer = this;
      thisPointer.isFeedback = !thisPointer.isAdmin;
      checkCredentialsServise.getUserCredits().then(function successCallBack(details){
        // okk. passed            
        thisPointer.login = details.login;
        thisPointer.isAdmin = details.admin;
        thisPointer.isFeedback = !thisPointer.isAdmin;
      }, function errorCallBack(error){
        $state.go('root.login');
      })
      thisPointer.logout = function(){
        // activate load mask
        LoadMaskService.activateLoadMask();
        userDataStorage.removeAll();
        logoutService.logout().then( function(details){
          $log.info("User logout success.");
          LoadMaskService.deactivateLoadMask();
          $state.go('root.login');
        }, function(reason){
          $log.warn("User logout fail.");
          LoadMaskService.deactivateLoadMask(); 
          myModalWindowService.showModal("type3");
        })
      }
      thisPointer.go = function(toState){
        $log.info("User change state to :" + toState);
        $state.go(toState);
      }
  }
])