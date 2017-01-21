'use strict';

var app = angular.module('AndTsApp', ['ui.router', 
  'pascalprecht.translate', 'ngMessages',
  'ngAnimate', 'ui.bootstrap',
  'appServices', 'appProviders', 'appDirectives',
  'RootModule', 'ModalModule', 'LoadMaskModule','CheckSessionModule',
  'LoadMaskModule']);

app.constant("LANG", {
  "DEFAULT_LANG":"en",
  "DEFAULT_LANG_NAME":"English"
});
app.constant("VALIDATORS", {
  "NAME_VALIDATOR": {
    "NAME_REGEX": /^[ ]{0}[A-Z][a-z]{2,}[ ]{0}$/,
    "MESSAGE_UNDER_CLASS": "name-message",
    "FORM_CLASS":"name-form-group",
    "TABLE_CELL_CLASS":"name-table-cell"
  },
  "AGE_VALIDATOR":{
    "AGE_REGEX": /^[0-9]+$/,
    "MIN_AGE": 18,
    "MAX_AGE":65,
    "MESSAGE_UNDER_CLASS": "age-message",
    "FORM_CLASS":"age-form-group",
    "TABLE_CELL_CLASS":"age-table-cell"
  },
  "DATE_VALIDATOR":{
    "DATE_REGEX": /^(\d{4})\/(([0][1-9])|([1][0-2]))\/(([0-2][0-9])|([3][0-1]))$/,
    "SEPARATOR": "/",
    "MIN_YEAR": 1899,
    "MAX_YEAR": 2099,
    "FEBRUARY_NUMBER": '02',
    "FEBRUARY_LEAP_DAYS": 29,
    "NUMBER_YEAR": 0,
    "NUMBER_MONTH": 1,
    "NUMBER_DAY": 2,
    "MESSAGE_UNDER_CLASS": "date-message",
    "FORM_CLASS": "date-form-group",
    "TABLE_CELL_CLASS": "date-table-cell"
  },
  "ERROR_INPUT_CLASS_NAME": "has-error",
  "ERROR_CELL_CLASS_NAME": "danger",
  "HIDDEN_CLASS_NAME": "hidden",
});

app.config([ '$stateProvider', '$urlRouterProvider', '$rootScopeProvider',
  '$translateProvider', 'LANG', 'logProvider', '$httpProvider',
  function($stateProvider, $urlRouterProvider, 
      $rootScopeProvider, $translateProvider, LANG, logProvider, 
      $httpProvider){
    
    // provider – provide to log last startup application time
    console.log("Creation time is: " + logProvider.getTimeCreation());

    $httpProvider.interceptors.push('myInterceptor')
    
    $urlRouterProvider.otherwise('root/home');
    $stateProvider.state('root', {
      url: '/root',
      templateUrl: '/app/root/root.html',
      controller: 'RootController',
      controllerAs: 'vm',
      resolve: { 
        authenticated: function(checkCredentialsServise, myModalWindowService){
          var authenticated = false;
          checkCredentialsServise.getUserCredits().then(function successCallBack(details){
              // okk. passed              
              authenticated = true;
          }, function errorCallBack(error){
              // show modal window 
              myModalWindowService.showModal("type2");              
          })
          return { value:  authenticated};
        }
      }
    })
    .state('root.home', {      
      url: '/home',
      templateUrl: '/app/root/modules/checksession/middle.html',
      controller: 'CheckSessionController'      
    })
    .state('root.login', {
      url: '/login',
      templateUrl: '/app/root/modules/login/login.html',
      controller: 'LoginController',
      controllerAs: 'vm'
    })
    .state('root.main', {
      url: '/main',
      templateUrl: '/app/root/modules/tabswitcher/tabswitcher.html',
      controller: 'TabSwitcherController',
      controllerAs: 'vm'
    })
    .state('root.main.dashboard', {
      url: '/',
      templateUrl: '/app/root/modules/tabswitcher/modules/dashboard/dashboard.html',
      controller: 'DashboardController',
      controllerAs: 'vm'
    })
    .state('root.main.tab1', {
      url: '/',
      templateUrl: '/app/root/modules/tabswitcher/modules/tabone/tabone.html',
      controller: 'TabOneController',
      controllerAs: 'vm'
    })
    .state('root.main.tab2', {
      url: '/',
      templateUrl: '/app/root/modules/tabswitcher/modules/tabtwo/tabtwo.html',
      controller: 'TabTwoController',
      controllerAs: 'vm'
    })
    .state('root.main.feedback', {
      url: '/',
      templateUrl: '/app/root/modules/tabswitcher/modules/feedback/feedback.html',
      controller: 'FeedbackController',
      controllerAs: 'vm'
    })
    .state('root.main.admin', {
      url: '/',
      templateUrl: '/app/root/modules/tabswitcher/modules/admin/admin.html',
      controller: 'AdminController',
      controllerAs: 'vm'
    });

    $translateProvider.useStaticFilesLoader({
      prefix: '/lang/lang-',
      suffix: '.json'    
    });
    $translateProvider.preferredLanguage(LANG.DEFAULT_LANG);
    $translateProvider.forceAsyncReload(true);
    // security sanitize
    $translateProvider.useSanitizeValueStrategy('escape');

  }
]);
