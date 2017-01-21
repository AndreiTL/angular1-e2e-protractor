var tabTwoModule = angular.module('TabTwoModule',
	[]);

tabTwoModule.controller('TabTwoController', ['$state', 
  'userDetailsService', 'updateUserDetailsService',
  'myModalWindowService', 'validatorsService', 'monthesStorage', 
  'LoadMaskService', '$log',
  function($state, userDetailsService, 
    updateUserDetailsService, myModalWindowService, validatorsService, 
    monthesStorage, LoadMaskService, $log){
      var thisPointer = this;
      $log.getInstance("Tab two");
      //fix to load monthes in first call
      monthesStorage.getMonthes();
      // show loading mask
      LoadMaskService.activateLoadMask();
      userDetailsService.getUserDetails().then(
        function(details){
            $log.info("User data was downloaded.");
            thisPointer.userdetails = details;
            thisPointer.newusername = details.name;
            thisPointer.newuserage = details.age;
            thisPointer.newuserdate = details.date;
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
      // on submit - make update user details.
      thisPointer.submit = function() {        
        // show load mask
        LoadMaskService.activateLoadMask();
        if (validatorsService.namevalidator(thisPointer.newusername) &&
              validatorsService.agevalidator(thisPointer.newuserage)&&
              validatorsService.datevalidator(thisPointer.newuserdate)){
          var jsonreq = {
            'newusername': thisPointer.newusername,
            'newuserage': thisPointer.newuserage,
            'newuserdate': thisPointer.newuserdate
          }
          updateUserDetailsService.updateUserDetails(jsonreq).then(
            function(result){ 
              $log.info("User data was updated.");
              // update success
              LoadMaskService.deactivateLoadMask();
              $state.go('^.tab1');
            }, function(reason){
              $log.warn("User data cann't be updated.");
              // update error happened. 
              LoadMaskService.deactivateLoadMask();
              // show modal window with error message
              myModalWindowService.showModal("type4");
              // don't update state            
            }
          )            
        }
        else {
          // show modal
          LoadMaskService.deactivateLoadMask();
          $log.warn("Entered data is not valid.");
          myModalWindowService.showModal("type4");
        }
      }
  }
])