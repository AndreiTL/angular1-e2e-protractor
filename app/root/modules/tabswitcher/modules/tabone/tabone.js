var tabOneModule = angular.module('TabOneModule',
	[]);

tabOneModule.controller('TabOneController', ['$state',
  'userDetailsService', 'myModalWindowService',
  'LoadMaskService', '$log',
  function($state, userDetailsService, 
    myModalWindowService, LoadMaskService, $log){
      // get
      var thisPointer = this;
      $log.getInstance("Tab one");
      // show loading mask
      LoadMaskService.activateLoadMask();
      userDetailsService.getUserDetails().then(
        function(details){
            $log.info("User data was downloaded.");
            thisPointer.userdetails = details;
            // switch off loading mask
            LoadMaskService.deactivateLoadMask();
        }, function(reason){
            $log.warn("Error while downloading user data.");
            // switch off loading mask
            LoadMaskService.deactivateLoadMask();      
            // show modal error message      
            myModalWindowService.showModal("type2");
            $state.go('root.login');
        }
      )
  }
])