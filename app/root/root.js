var rootModule = angular.module('RootModule', ['LoginModule',
 'CheckSessionModule', 'TabSwitcherModule', 'ModalModule', 'LoadMaskModule']);

rootModule.controller('RootController', ['languagesStorage',
  'LANG', '$translate', '$state', 'myModalWindowService',
  'authenticated', '$log',
  function(languagesStorage, LANG, $translate, $state,
    myModalWindowService, authenticated, $log){
    var thisPointer = this;
    $log.getInstance("Root");
    // check result from 'resolve' defined in 'ui.router.config' in main.js
    if (authenticated.value){
      $log.info("User session is valid. Available to show dashboard.");
      $state.go('root.main.dashboard');
    } else {
      $log.info("User session isn't valid. Redirect to loginpage.");
      $state.go('root.login');
    }
    languagesStorage.getAvailableLanguages().then(
      function (details){
        thisPointer.languages = details;
        thisPointer.selectedLanguage = LANG.DEFAULT_LANG;
      }, function (reason){        
        $log.warn("Error while download languages. Set to use default: " + 
             LANG.DEFAULT_LANG);
        thisPointer.languages = {
             "1" : {
               "code" : LANG.DEFAULT_LANG,
               "name" : LANG.DEFAULT_LANG_NAME               
             }
           };
        thisPointer.selectedLanguage = LANG.DEFAULT_LANG;
      }
    );    
    thisPointer.translate = function(){
      $log.info("User select language: " + thisPointer.selectedLanguage);
      $translate.use(thisPointer.selectedLanguage);
    }
  }
])