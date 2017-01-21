var loadMaskModule = angular.module('LoadMaskModule',[]);

var ModalModule = angular.module('ModalModule',[]);
ModalModule.controller('ModalController', 
  [ '$scope', '$translate', 'myModalWindowService', '$uibModalInstance',   
  function( $scope, $translate, myModalWindowService, $uibModalInstance) {
    $scope.close = function(result) {     
      $uibModalInstance.close();      
    };
}]);
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

'use strict';
var appDecorators = angular.module('appDecorators', []);



'use strict';
var appDirectives = angular.module('appDirectives', []);



'use strict';
var appProviders = angular.module('appProviders', []);



'use strict';
var appServices = angular.module('appServices', []);


loadMaskModule.directive('loadmask',[
	function () {
		
		return {
			restrict: 'E',
			templateUrl: 'app/loadmask/loadmask.html',
			controller: function(){
				console.log(" Load mask is shown.")
			},
			link: function(scope, element, attr, ctrl){

			}
		}		
	}
])

loadMaskModule.factory('LoadMaskService', ['htmlClassModifierService',
  	function(htmlClassModifierService){
		function activateLoadMask(){
			htmlClassModifierService.removeClass("myloadmask", "hidden");
		};
		function deactivateLoadMask(){
			htmlClassModifierService.addClass("myloadmask", "hidden");
		};
		return {
			activateLoadMask : activateLoadMask,
			deactivateLoadMask : deactivateLoadMask
		}
	}
]);
ModalModule.factory('myModalWindowService', ['$uibModal', '$rootScope',
	function($uibModal, $rootScope){
		var _ispresent = false;
		function showModal(errorType){
			if ( !_ispresent){
				_ispresent = true;
		  		var isolation = true;
		  		var modalScope = $rootScope.$new(isolation);
		  		modalScope.errortype = 'errormodalwindow.message.'+errorType;
		  		var modalInstance = $uibModal.open({
		  			animation: true,
		  			size: "sm",
		  			templateUrl: "/app/modal/modal.html",
		  			controller: "ModalController",
		  			scope: modalScope		  			
		  		});		  		
		  		modalInstance.result.then(function(){
		  			// console.log(" ispresent setted to false");
		  			_ispresent = false;
		  			modalScope.$destroy();
		  		}, function(error){
          			// error contains a detailed error message.
		            console.log("Modal window error: " + error);
		            _ispresent = false;
		  		})
			}
		}
		return{
			showModal : showModal			
		}
	}
]);
// available languages
//appServices.factory('languagesStorage', ['$http', '$q', 'LANG',
rootModule.factory('languagesStorage', ['$http', '$q', 'LANG',
	function($http, $q, LANG){
		function getAvailableLanguages(){			
			var deferred = $q.defer();
			$http({
				method: "GET",
				url: '/lang/languages.json'
			}).then(function successCallback(response){	
				console.log(" load languages.json success." );
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log(" load languages.json error." );
				deferred.reject(error);
			})
			return deferred.promise;			
		}
		return {
			getAvailableLanguages : getAvailableLanguages
		}
	}
])
app.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
app.config([ '$provide', function($provide){
		/*
			string into decorator have to be “{0} {1} – {2}{3}“ 
				where 
				{0} current date – “dd-MMM-yyyy”, 
				{1} – current time – “HH:MM:SS:MS”, 
				{2} – class name, 
				{3} – string that need to log
		*/
		var monthesStor = {
			"01":{"short":"JAN"},
			"02":{"short":"FEB"},
			"03":{"short":"MAR"},
			"04":{"short":"APR"},
			"05":{"short":"MAY"},
			"06":{"short":"JUN"},
			"07":{"short":"JUL"},
			"08":{"short":"AUG"},
			"09":{"short":"SEP"},
			"10":{"short":"OCT"},
			"11":{"short":"NOV"},
			"12":{"short":"DEC"}
		}
		var support = function(template, valuesArray){
			var result = new String(template);
			for (var val in valuesArray){
				// console.log( " val =  " + val);
				result = result.replace("{"+val+"}", valuesArray[val]);
			}
			return result;
		}
		$provide.decorator('$log', [ '$delegate', 
			function($delegate){
				function currentTime(){					
					var time = new Date();
					var timeStr = String(time.getHours() + ":" +
						time.getMinutes() + ":" +
						time.getSeconds() + ":" +
						time.getMilliseconds()
					);
					return timeStr;
				};
				function currentDate(){
					var time = new Date();
					var date = time.getDate();
					var month = time.getMonth() + 1;
					date = date < 10 ? new String("0"+ date) : new String(date);
					monthStr = month < 10 ? monthesStor[new String("0"+ month)].short
						: monthesStor[new String(month)].short;					
					var dateStr = new String(date + "-" + 
						monthStr + "-" + 
						time.getFullYear());
					return dateStr;
				};
				function updateFunctions(object, className){
					function prepareFunction(object, funcName, className){
						return function () {			                
			                var now = String (currentTime() + " " + currentDate());		
			                var arg = !!(arguments[0]) ? new String(arguments[0]) : "";
			                className = className ? className : '';
			                console[funcName](support("{0} - {1} {2} ", [now, className, arg]));
			            };
					};
					object.log = prepareFunction(object, "log", className);
					object.info = prepareFunction(object, "info", className);
					object.warn = prepareFunction(object, "warn", className);
					object.debug = prepareFunction(object, "debug", className);
					object.error = prepareFunction(object, "error", className);
					return object;
				};
				$delegate.getInstance = function(className){
					className = (className !== undefined) ? className : "";
					$delegate = updateFunctions($delegate, className);
				};
				return $delegate;
			}
		])
	}
]);
appDirectives.directive('myagevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',
      link: function(scope, element, attr, mCtrl){
        function myAgeValidator(value){          
          var result = validatorsService.agevalidator(value);
          if (result){
            mCtrl.$setValidity('ageFormat', true);
            // custom
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return value;
          } else {
            mCtrl.$setValidity('ageFormat', false); 
            //custom
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return '';
          }
        }
        mCtrl.$parsers.push(myAgeValidator);
      }
    }
}])
appDirectives.directive('mydatevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
	  return {
	    require: 'ngModel',
	    link: function (scope, element, attr, mCtrl){
	      function myDateValidator(value){         
          var result = validatorsService.datevalidator(value);
          if (result){
            mCtrl.$setValidity('dateFormat', true);    
            //custom 
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('dateFormat', false);
            //custom
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);   
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);
            return '';
          }
	      }
	      mCtrl.$parsers.push(myDateValidator);
	    } 
	  }
}])
appDirectives.directive('mynamevalidator', ['validatorsService',
 'htmlClassModifierService', 'VALIDATORS',  
  function(validatorsService,htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',      
      link: function(scope, element, attr, mCtrl){
        function myNameValidator(value){
          var result = validatorsService.namevalidator(value);
          if (result){
            mCtrl.$setValidity('nameFormat', true);   
            //custom   
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('nameFormat', false); 
            //custom     
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME); 
            return '';
          }
        }
        mCtrl.$parsers.push(myNameValidator);
      }
    }
}])
appProviders.provider('log', 
	function logProvider(){
		var time = new Date();
		var currentTimeMillis = time.getTime();	
		var timeStr = String(time.getHours() + ":" +
			time.getMinutes() + ":" +
			time.getSeconds() + ":" +
			time.getMilliseconds()
		);
		this.getTimeCreation = function(){			
			return timeStr;
		};		
		this.getTimeCreationMillis = function(){
			return currentTime;
		};
		this.$get = function(){				
			return new log();				
		};		
	}	
)
appServices.factory('checkCredentialsServise', ['$http', '$q', 
	'userCreditsStorage', 'loginService',
	function($http, $q, userCreditsStorage, loginService){
		// var access = false;
		var _userCredentials;
		function checkUserCredentials(login, password){
			var deferred = $q.defer();			
			loginService.login(login, password).then(
				function successCallback(details){
					// console.log(" access alowed");
					access = true;
					deferred.resolve(details);				
				}, function errorCallback(response){
					// console.log(" access forbiden");					
					deferred.reject(false);
				}
			)
			return deferred.promise;	
		}
		function checkSession(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/checksession'
			}).then(function successCallback(response){
				_userCredentials = response.data;
				console.log("Session is valid.");
				deferred.resolve(response.data);
			}, function errorCallback(error){
				_userCredentials = null;				
				console.log("Session not valid.");
				deferred.reject(error);
			})
			return deferred.promise;
		};
		function getUserCredits(){
				var deferred = $q.defer();
				if ( ! userCreditsStorage.getUserCredits()){
					checkSession().then(function(details){
						console.log("provide userCredits from post request");	
						userCreditsStorage.setUserCredits( details
							// {"login": details['login']} 							
						);
						deferred.resolve(details);
					}, function(error){
						console.log("Cann't get user credits details.");
						userCreditsStorage.setUserCredits(null);
						deferred.reject(error);
					})				
				} else{
					console.log("provide userCredits from storage");
					deferred.resolve(userCreditsStorage.getUserCredits());					
				}
			return deferred.promise;
		}
		return {
			checkCredentials:  checkUserCredentials,
			checkSession : checkSession,
			getUserCredits : getUserCredits
		}
	}
]);
appServices.factory('htmlClassModifierService', [ function(){
	return {
		addClass : function(classSelector, classToAdd){
			angular.element(document.querySelector("."+classSelector)).addClass(classToAdd);
		},
		removeClass : function(classSelector, classToRemove){
			angular.element(document.querySelector("."+classSelector)).removeClass(classToRemove);
		}
	}	
}])

appServices.factory('myInterceptor', [
	function(){
		var timeMarker = {
			request: function(config){
				config.requestTimePoint = new Date().getTime();
				return config;
			},
			response: function(response){
				response.config.responseTimePoint = new Date().getTime();
				// log only post requests
				if ( String(response.config.method).toLowerCase() === "post" ){
					// log it 
					console.log(" - request-response time: " + 					
						(response.config.responseTimePoint - response.config.requestTimePoint) +
						" ms. " + " URl: " + response.config.url);
				}
				return response;
			}
		}
		return timeMarker;
	}
])
//monthes storage
appServices.factory('monthesStorage', [ '$http', '$q',
	function($http, $q){
		var monthes;
		var _promiseLoad = _loadMonthes();
		function _loadMonthes(){			
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: "/app/public/date.json"
			}).then(function successCallback(response){
				// save monthes				
				deferred.resolve(response.data);
			}, function errorCallback(error){
				// error in monthes load 				
				console.log(" Cann't receive date.json file.");
				deferred.reject( "Cann't receive date.json file." );
			}	
			)	
			return deferred.promise;
		}
		function getMonthes(){
			if (monthes === undefined){
				_promiseLoad.then(function(details){
						console.log(" Loading monthes from server.")
						monthes = details;
						// console.log("monthes:"+ monthes);
						return monthes;
					}, 
					function(reason){
						// show modal error message.
						monthes = undefined;
						console.log("Error in downloading monthes. " + reason);
					}
				);				
			} else {				
				return monthes;
			}
		}
		function checkLeapYear(year){
			if ( (year) % 4 === 0 ){    
			    if (year % 100 === 0 && year % 400 !== 0){
			      return false;
				}
			    return true;   
			} else {
			    return false;
			}
		}
		return {
			getMonthes : getMonthes,
			checkLeapYear : checkLeapYear
		}
		
	}
])
// save login of user
appServices.factory('userCreditsStorage', function(){
	var userCredits = null;
	return {
		setUserCredits: function(credits){
			console.log("set credits in storage: " + userCredits);
			userCredits = credits;
		},
		getUserCredits: function(){
			console.log("get credits from storage: " + userCredits);
			return userCredits;
		}
	}
})
// save different user data
appServices.factory('userDataStorage', function(){
	var userData = {};
	return {
		setUserData: function(data, key){
			userData[key] = data;
		},
		getByKeyUserData: function(key){
			return userData[key];
		},
		getAllUserData: function(){
			return userData;
		},
		removeAll: function(){
			// delete userData;
			userData = null;
			userData = {};
		}
	}
})
appServices.factory('userDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;
		function getUserDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/userdetails'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				console.log("error. unauthorised ? ");
				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getUserDetails : getUserDetails
		}
	}
])
appServices.factory('validatorsService', ['VALIDATORS', 'monthesStorage',
	function(VALIDATORS, monthesStorage){
		var _nameRegEx = VALIDATORS.NAME_VALIDATOR.NAME_REGEX;
		var _minage = VALIDATORS.AGE_VALIDATOR.MIN_AGE;
    	var _maxage = VALIDATORS.AGE_VALIDATOR.MAX_AGE;
    	var _ageRegex = VALIDATORS.AGE_VALIDATOR.AGE_REGEX;

    	var _dateRegEx = VALIDATORS.DATE_VALIDATOR.DATE_REGEX; 
	    var _separator = VALIDATORS.DATE_VALIDATOR.SEPARATOR;
	    var _minyear = VALIDATORS.DATE_VALIDATOR.MIN_YEAR;
	    var _maxyear = VALIDATORS.DATE_VALIDATOR.MAX_YEAR;
	    var _februarynumber = VALIDATORS.DATE_VALIDATOR.FEBRUARY_NUMBER;
	    var _februaryleapdays = VALIDATORS.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS;
	    var _numyear = VALIDATORS.DATE_VALIDATOR.NUMBER_YEAR;
	    var _nummonth = VALIDATORS.DATE_VALIDATOR.NUMBER_MONTH;
	    var _numday = VALIDATORS.DATE_VALIDATOR.NUMBER_DAY;
    
		var _isvalid = false;
		var _parts = null;
		var _maxdays = 0;

		var monthes;

		return {
			namevalidator: function(value){
				var isvalid = false;
				if (_nameRegEx.test(value)){
		        	isvalid = true;		            
		        } else {		            
		            isvalid = false;
		        }
		        return isvalid;
			},
			agevalidator: function(value){
				var isvalid = false;
				if (value <= _maxage && value >= _minage && _ageRegex.test(value)){
		            isvalid = true;		            
		        } else {
		             isvalid = false;
		        }
		        return isvalid;
			},
			datevalidator : function(value){
				var _isvalid = false;
				monthes = monthesStorage.getMonthes();
		        if (_dateRegEx.test(value)){
		          _parts = value.split(_separator);
		          // check year
		          if(_parts[_numyear] > _minyear && _parts[_numyear] < _maxyear){            
		            // check february for leap year
		            if (_parts[_nummonth] === _februarynumber ){
		              if (monthesStorage.checkLeapYear(_parts[_numyear])){
		                _maxdays = _februaryleapdays;
		              } else{
		                _maxdays = monthes[_parts[_nummonth]].days;
		              }               
		            } else {
		                _maxdays = monthes[_parts[_nummonth]].days;	               
		            }
		            // check amount of days for max value
		            if (_parts[_numday] <= _maxdays && _parts[_numday] > 0){
		              _isvalid = true;
		            } else {
		              _isvalid = false;
		            }
		          } else {
		            _isvalid = false;
		          }          
		        } else {
		            _isvalid = false;
		        }
				return _isvalid;				
			}
		}
	}
]);

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
              // console.log(" Login is success! ");
              $log.info("User login success.");
              var isAdmin = details.admin;
              // console.log(" Hello. You have admin rights: " + isAdmin);              
              userCreditsStorage.setUserCredits(
                {"login": login,
                  "admin": !!isAdmin}
              );   
              LoadMaskService.deactivateLoadMask();
              $state.go('root.main.dashboard', {"admin":!!isAdmin});
          }, function(reason){
              // console.log(" Login is incorect. " + reason);
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
          // console.log("Logout is successful.");
          $log.info("User logout success.");
          LoadMaskService.deactivateLoadMask();
          $state.go('root.login');
        }, function(reason){
          // console.log("Logout fail.");      
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
loginModule.service('loginService', [ '$q', '$http',
	function($q, $http){
		var deferred = $q.defer();
		function login(login, password){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/login',
				data: {
					"login": login,
					"password": password
				}
			}).then(function successCallback(response){			
				deferred.resolve(response.data);				
			}, function errorCallback(response){				
				deferred.reject(false);
			})	
			return deferred.promise;
		}
		return {
			login : login
		}
	}
])
tabSwitcherModule.factory('logoutService', ['$http', '$q', 'userCreditsStorage', 
	'userDataStorage', 'userDataStorage',
	function($http, $q, userCreditsStorage, userDataStorage){
		function logout(){
			userDataStorage.removeAll();
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/logout'				
			}).then(function successCallback(response){
				console.log("Logout is allowed.");
				userCreditsStorage.setUserCredits(null);
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log("Error while logout.");
				deferred.reject(error);
			})
			return deferred.promise;
		}
		return {
			logout : logout
		}
	}
])

var adminModule = angular.module('AdminModule',
	['AdminAddUserModalModule', 'AdminDeleteUserModalModule', 'AdminUpdateUserModalModule']);

adminModule.controller('AdminController', [ 'allUsersDetailsModel',
	'$uibModal', '$state', 'userCreditsStorage', 'myModalWindowService',
	'LoadMaskService', '$log', 
	function(allUsersDetailsModel, $uibModal, $state, userCreditsStorage,
			myModalWindowService, LoadMaskService, $log){
		var thisPointer = this;
		var allUsersDetails = null;

		$log.getInstance("Admin");

		// load data about all users. 
		loadUsersDetails();
		// show in table.
		function loadUsersDetails(){
			LoadMaskService.activateLoadMask();
			allUsersDetailsModel.getDetails().then(
				function successCallBack(details){	
					$log.info("Users data was loaded.");
					thisPointer.alldetails = details;
					allUsersDetails = details;
					LoadMaskService.deactivateLoadMask();					
				} , 
				function errorCallBack(){
					LoadMaskService.deactivateLoadMask();
					$log.warn("Users data loading error.");
					// show modal about error
					myModalWindowService.showModal("type10");
					// send redirect if user hasn't admin access					
					// or redirect him to anywhere
				}
			);
		}

		// add new user
		thisPointer.adduser = function (login, password, name, age, date){
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",
	  			controller: "AdminAddUserModal",
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if (!_.isEmpty(result)){									
					// activate loadmask	  			
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.addUser(result.login, 
							result.password, result.name, result.age, result.date).then(
						function successCallBack(){
							$log.info("New user \'" + result.login + "\' was added.");
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
							// deactivate loadmask
						}, function errorCallBack(){
							$log.warn("User \'" + result.login + "\' creation error.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type13");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
				// myModalWindowService.showModal("type13");
	  		})
		}

		// update user
		thisPointer.update = function (login){
			// login, password, name, age, date
			// open modal window for updating fields
			var isAdmin = userCreditsStorage.getUserCredits().admin;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",
	  			controller: "AdminUpdateUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userDetails : function(){
	  					// console.log(" login " + login + " allUsersDetails[login] " + JSON.stringify(allUsersDetails[login]));
	  					return allUsersDetails[login];
	  				}
	  			}	  				
	  		});	
	  		modalInstance.result.then(function(result){ 
	  			if (!_.isEmpty(result)){
					// activate loadmask

	  				LoadMaskService.activateLoadMask();					
					allUsersDetailsModel.updateUser(result.login, 
							result.password, result.name, result.age, result.date, login).then(
						function successCallBack(){							
							$log.info("Update user. Submited data: " + JSON.stringify(result));
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
						}, function errorCallBack(){
							$log.warn("User cann't be updated.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type12");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;	
	  		})
		}

		// delete user
		thisPointer.delete = function (login){			
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",
	  			controller: "AdminDeleteUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userLoginDelete : function(){	  					
	  					return login;
	  				}
	  			}	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
				// console.log(" submited result " + JSON.stringify(result));	  			
	  			if ( result.deleteFlag ){
					// console.log(" try to delete "  + result.deleteFlag);
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.deleteUser(login).then(
						function successCallBack(){
							$log.info("User was deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();
						}, function errorCallBack(){
							$log.warn("User cann't be deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type11");
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;
	  		})
		}
	}
])
var dashboardModule = angular.module('DashboardModule',
	['DiagramModule']);

dashboardModule.controller('DashboardController', ['$scope', '$state', '$interval',
  'userDataStorage', 'userDetailsService', 'loadChartDataService', 'LoadMaskService',
  function($scope, $state, $interval, userDataStorage, 
      userDetailsService, loadChartDataService, LoadMaskService){
    // show chart. stream from server
    var thisPointer = this;
    
    // initial parameters for charts: 
    var initParameters = {
      "1": {
        "stream":"/app/chartdata1", 
        "color":"#FFCC80", 
        "aproximatecolor":"#EF6C00"
      }, 
      "2": { "id": 2,
        "stream":"/app/chartdata2", 
        "color":"#80CBC4", 
        "aproximatecolor": "#00695C"
      }
    }

  /*  "maxAmountOfPoints" : 480,
      "updateTimeout" : 500,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStep" : 40,      - step in px per notch  
      "notchXName" : "point", - notch name
      "notchXWidth" : 5,      - width of notch-line      
      "notchYStep" : 100,   
      "notchYName" : "point", - notch name

      notice: chart height = main-height - (paddingYTop + paddingYBottom)
              chart width = main-width - (paddingXLeft + paddingXRight)  
  */    
    var chartProperties = {
      "mainWidth" : 480,
      "mainHeight" : 400,     
      "updateTimeout" : 1500,
      "updateXStep": 50,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStartValue" : 10,
      "notchXStep" : 40,
      "notchXWidth" : 5,      
      "notchXName" : "point",      
      "notchYWidth" : 5,
      "notchYName" : "point",
    }

    var maxAmountOfPoints = chartProperties.mainWidth;    
    // timeout for redraw diagram
    var updateTimeout = chartProperties.updateTimeout; // ms
    // make graph object
    var graphObjects = {};
    _.forEach(initParameters, function(value, key){      
      graphObjects[key] = {
          "id": key,
          "stream": value.stream,
          "color": value.color,
          "aproximatecolor": value.aproximatecolor
      }      
    });
    // data storage for downloadded datas
    var dataDownloaded = {};
    var dataDownloadedProperties = {};
    // amount of points availale to make step
    var updateStep = 0;    
    // object-storage for $interval's
    var intervalObject;
    function destroyInterval(){      
        if (angular.isDefined(intervalObject)){
          $interval.cancel(intervalObject);
          intervalObject = undefined;
        }      
    }
    $scope.$on('$destroy', function(){
        destroyInterval();
      }
    );
    function startUpdate(){
      // deactivate load mask in case of showing diagram
      LoadMaskService.deactivateLoadMask();
      intervalObject = $interval(function(){
            // console.log(" update timeout ");
        thisPointer.chartOptions.properties = chartProperties;
        _.forEach(graphObjects, function(value, key){ 
          if (!dataDownloaded[key]){
            dataDownloaded[key] = {};
            dataDownloaded[key].id = key;
            dataDownloaded[key].data = [];
            dataDownloaded[key].color = value.color;
            dataDownloaded[key].aproximatecolor = value.aproximatecolor;
            dataDownloadedProperties[key] = {};
            dataDownloadedProperties[key].iswaitingload = false;
            dataDownloadedProperties[key].updateStep = 0; 
          }          
          if (!dataDownloadedProperties[key].iswaitingload){            
            dataDownloadedProperties[key].updateStep = 0;            
            dataDownloadedProperties[key].iswaitingload = true;
            // load data for current stream
            loadChartDataService.loadData(value.stream).then(
              function successCallBack( details ){
                dataDownloadedProperties[key].updateStep = details.data.length;
                dataDownloaded[key].data = _.concat(dataDownloaded[key].data , details.data);
                dataDownloadedProperties[key].iswaitingload = false;
                thisPointer.chartOptions.streams[key] = dataDownloaded[key];
              }, function errorCallBack(reason){
                // show error modal message                
                $state.go("root.login");
                console.log("Cann't load chart data from server. Reason: " + reason);
              }
            )          
          }
        })
        var currentMaxLengthOfStream = 0;
        _.forEach(graphObjects, function(value, key){
          if (dataDownloaded[key].data.length > currentMaxLengthOfStream) {
            currentMaxLengthOfStream = dataDownloaded[key].data.length;
          }
          if (dataDownloadedProperties[key].updateStep > updateStep) {
            updateStep = dataDownloadedProperties[key].updateStep;
          }
        })
        var temp = currentMaxLengthOfStream - maxAmountOfPoints;
        if (temp > 0){
          _.forEach(graphObjects, function(value, key){
            dataDownloaded[key].data.splice(0, temp);
          })          
        }        
        userDataStorage.setUserData(dataDownloaded, "chartData");
        userDataStorage.setUserData(dataDownloaded, "chartDataProperties");
        userDataStorage.setUserData(chartProperties, "chartProperties");        
        thisPointer.chartOptions = { 
          "streams": dataDownloaded,
          "streamsProperties": dataDownloadedProperties,          
          "properties" : chartProperties        
        }        
      }, updateTimeout);
    }

    // take data from userStorage
    if (_.isEmpty(dataDownloaded)){      
      var temp = userDataStorage.getByKeyUserData("chartData");
      if (temp !== undefined){
        dataDownloaded = _.cloneDeep(temp);
        dataDownloadedProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartDataProperties"));
        chartProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartProperties"));
      }
      thisPointer.chartOptions = { 
        "streams": dataDownloaded,
        "streamsProperties": dataDownloadedProperties, 
        "properties" : chartProperties        
      } 
    }
    startUpdate();
  }
])
var feedbackModule = angular.module('FeedbackModule',
	['FeedbackModalModule']);

feedbackModule.controller('FeedbackController', ['$state',
  'myModalWindowService', 'LoadMaskService', '$log', 
  'feedbackService', 'feedbackModalService',
  function($state, myModalWindowService, LoadMaskService, $log, 
  			feedbackService, feedbackModalService){      
	    var thisPointer = this;
	    $log.getInstance("Feedback");
	    thisPointer.sendemail = function(){		    
		    var data = {
		    	"from" : thisPointer.name,
			    "to" : thisPointer.email,
			    "content" : thisPointer.textarea
		    }
		    // process data		       
		    var processedData = "From: \"" + data.from + "\". " + 
				"To: \"" + data.to + "\". " + 
				"Content: \"" + data.content + "\".";		    
		    // open modal
			feedbackModalService.openModal(processedData).then(
				function successCallBack(resultMessage){					
					LoadMaskService.activateLoadMask();
					var jsonResultMessage = {
				    	"from" : thisPointer.name,
					    "to" : thisPointer.email,
					    "content" : thisPointer.textarea
				    }
				    // read all available email in address-email and try send 
				    //untill it will be sent

					// feedbackService.sendFeedback(
					// 		jsonResultMessage.from, 
					// 		jsonResultMessage.to,
					// 		jsonResultMessage.content ).then(
					var toArray = jsonResultMessage.to.split(",");
					feedbackService.setContent(jsonResultMessage.content);
					feedbackService.sendFromDecorator(
							jsonResultMessage.from, 
							toArray ).then(
						function successCallBack(result){
							LoadMaskService.deactivateLoadMask();
							$log.info("Feedback is sent.");
							// clear feedback form
							thisPointer.name = "";
		    				thisPointer.email = "";
		    				thisPointer.textarea = "";
							//ok
						}, function errorCallBack(error){
							// don't clear feedback form
							LoadMaskService.deactivateLoadMask();		
							$log.warn("Feedback cann't be sent.");
							// show modal error
							myModalWindowService.showModal("type20");
						}
					)
				}, function errorCallBack(error){
					// don't send
					// don't clear feedback form
					// log	
					$log.log("Feedback wasn't sent. Canseled.");				
				}
			)
	    }     
  }
])
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
            // console.log (" error in user details. " + reason);
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
            // console.log (" error in user details. " + reason);
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
          // console.log("Data check is not passed.");
          $log.warn("Entered data is not valid.");
          myModalWindowService.showModal("type4");
        }
      }
  }
])
adminModule.service('allUsersDetailsModel', ['allUsersDetailsService', '$q',
	function(allUsersDetailsService , $q){
		var allUsersDetails = {};
		function deleteUser(login){
			var deferred = $q.defer();
			allUsersDetailsService.deleteUser(login).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}
			)
			return deferred.promise;
		}
		// login cann't be updated
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			allUsersDetailsService.updateUser(login, password, name, age, date, oldLogin).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}			
			);
			return deferred.promise;
		};
		function getDetails(){
			var deferred = $q.defer();			
			allUsersDetailsService.getAllUsersDetails().then(
				function successCallback(details){			
					allUsersDetails = {};
					_.forEach(details.usercredits, function (value, key){
						allUsersDetails[key] = {};
						allUsersDetails[key].login = key;
						allUsersDetails[key].password = value.password;
						allUsersDetails[key].name = details.userdata[key].name;
						allUsersDetails[key].age = details.userdata[key].age;
						allUsersDetails[key].date = details.userdata[key].date;
					})
					// console.log( " ++ alldetails ++ " + JSON.stringify(allUsersDetails ));
					deferred.resolve(allUsersDetails);
				} , function errorCallback(error){
					console.log("Cann't load details to all users.");
					allUsersDetails = {};
					deferred.reject(allUsersDetails);
				}
			)
			return deferred.promise;
		}
		return {
			getDetails: getDetails,
			updateUser: updateUser,
			deleteUser: deleteUser,
			addUser : updateUser
		}
	}
])
adminModule.factory('allUsersDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;

		// function addNewUser(login, password, name, age, date){
			// function 'updateUser' is used in this case
		// }

		function deleteUser(login){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/deleteuser',
				data: {
					userdeletelogin : login
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden. Status: " + error.status);	
				// console.log(" why : " + JSON.stringify(error));
				deferred.reject(error.status);
			})
			return deferred.promise;
		}
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/updateuserdata',
				data: {
					login : login, 
					password : password, 
					name : name, 
					age : age , 
					date : date,
					oldlogin : oldLogin
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden.");				
				deferred.reject();
			})
			return deferred.promise;
		}
		function getAllUsersDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/getusersdata'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				// console.log("error. unauthorised ? ");
				console.log("Action is forbidden.");	
				// show modal 

				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getAllUsersDetails : getAllUsersDetails,
			updateUser : updateUser,
			deleteUser : deleteUser
		}
	}
])
dashboardModule.factory('loadChartDataService', [ '$http', '$q', 
	function($http, $q){

		return {
			loadData : function(urlstream){
				var deferred = $q.defer();
				var urlString = urlstream.toString(urlstream);
				$http({
					method : 'POST',
					url : urlString
				}). then( function successCallback(response){
					deferred.resolve(response.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				})
				return deferred.promise;
			}
		}
	}])
feedbackModule.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
feedbackModule.factory('feedbackService', ['$uibModal', '$http', '$q',
	function($uibModal, $http, $q){
		function sendFeedback(from, to, content){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/feedback/send',
				data: {
					"from" : from,
					"to" : to,
					"content" : content
				}
			}).then( function successCallback(details){
					deferred.resolve(details.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				}
			)
			return deferred.promise;			
		}
		return {			
			sendFeedback : sendFeedback
		}
	}
])
tabTwoModule.factory('updateUserDetailsService', ['$http', '$q', 
	function($http, $q){
		function updateUserDetails(json){
			var deferred = $q.defer();
			$http({
				method : 'POST',
				url: '/app/updateuserdetails',
				data: json
			}).then(function successCallback(response){
					// ok
					deferred.resolve(response.data);
				}, function errorCallback(error){
					// error
					deferred.reject(error);
				}
			)
			return deferred.promise;
		}
		return {
			updateUserDetails : updateUserDetails
		}
	}
])

var adminAddUserModalModule = angular.module('AdminAddUserModalModule',
	[]);

adminAddUserModalModule.controller('AdminAddUserModal', 
  [ '$translate', '$uibModalInstance',  
  	'userCreditsStorage',
  function($translate, $uibModalInstance,  
  	userCreditsStorage) {     
   	this.submit = function(){
  		// read input data 
  		var resultData = {
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var adminDeleteUserModalModule = angular.module('AdminDeleteUserModalModule',
	[]);

adminDeleteUserModalModule.controller('AdminDeleteUserModal', 
  [ '$scope', '$translate', '$uibModalInstance', 'userLoginDelete',
  function( $scope, $translate, $uibModalInstance, userLoginDelete) {     
    var deleteFlag = false;
    this.userLoginDelete = userLoginDelete;
   	this.submit = function(){
  		//this.userdetails.login
      deleteFlag = true;
  		close(deleteFlag);
  	}
  	this.cansel = function(){
  		close(deleteFlag);
  	}
    function close(deleteFlag) {     
      $uibModalInstance.close({deleteFlag : deleteFlag});      
    };
}]);

var adminUpdateUserModalModule = angular.module('AdminUpdateUserModalModule',
	[]);

adminUpdateUserModalModule.controller('AdminUpdateUserModal', 
  [ '$scope', '$uibModalInstance', 'userDetails', 
  	'userCreditsStorage',
  function( $scope, $uibModalInstance, userDetails, 
  	userCreditsStorage) {     
    // make clone to avoid unexpected changing
  	this.userdetails = _.clone(userDetails);
   	this.logindisabled = false;
		if ( String(userCreditsStorage.getUserCredits().login) === userDetails.login){
			this.logindisabled = true;
		}
  	this.submit = function(){
  		// read input data 
  		var resultData = {        
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var diagramModule = angular.module('DiagramModule',[]);

diagramModule.controller('DiagramController', [ '$scope', '$state', 
  '$interval', 'ChartHelperService',
  function($scope, $state, $interval, ChartHelperService){
    var thisPointer = this;    
    var graphs = this.graphs;
    var svgtexts = this.svgtext;

    // object (streams, properties) from 'dashboardController'           
    this.mainwidth = this.chartOptions.properties.mainWidth;
    this.mainheight = this.chartOptions.properties.mainHeight;
       
    // initial data for graph object of chart
    var graphObjects = {};   
    // main data storage (from here polyline is drawn)
    var data = {};   
    // flag for first start graphObjects
    var firstStartGraphObjects = true; 
    var enableStep = false;
    var watcherOne = $scope.$watch( function(){return thisPointer.chartOptions.streams}, 
      function(newValue, oldValue){        
        enableStep = false;
        // init graphObjects if it isn't inited
        if (_.isEmpty(graphObjects)){
          if (!_.isEmpty(thisPointer.chartOptions.streams)){
            _.forEach(thisPointer.chartOptions.streams, function(value, key){ 
              graphObjects[key] = {
                "id": key,
                "color": value["color"],
                "aproximatecolor": value["aproximatecolor"]
              }
            })
            ChartHelperService.init(graphObjects, thisPointer.chartOptions);
          }
        }
        _.forEach(graphObjects, function(value, key){
          if(!data[key]){
            data[key] = {};
            data[key].id = key;
            data[key].color = value.color;
            data[key].data = {};
          }
          if(thisPointer.chartOptions.streamsProperties[key].updateStep > 0){
            enableStep = true;
          }
        })
        if (enableStep){
          ChartHelperService.makeStep(data, thisPointer.chartOptions);
        }
        // get calculated datas and send it to draw        
        thisPointer.graphs = ChartHelperService.getGraph();
        thisPointer.svgtexts = ChartHelperService.getText();
        thisPointer.notches = ChartHelperService.getNotch();
      },
      true
    );
    $scope.$on('$destroy', function(){
        watcherOne();
      }
    ); 
  }
])
diagramModule.directive('mychart', [ 
  function(){
    
    return {
      restrict: 'E',
      controller: 'DiagramController',
      controllerAs: 'chart',
      templateUrl: 'app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html',       
      bindToController: {          
        chartOptions: '=chartOptions' 
      },   
      link: function (scope, element, attr, ctrl){        
        var chartAllPoints = attr.chartAllPoints;       
      }
    }
  }
])
diagramModule.factory('ChartHelperService', [
	function(){
    var graphs = {};   
    var svgTexts = {};
    var notches = {};

    var graphObjects = {};     
    var heightStep = 1;     // 'y' - height step to draw chart (float)
    var maxHeightValue = 1;    // max height value2             (int)
    var minHeightValue = 0; // min height value2                (int)
    // var step = 1;             // 'x' step to draw chart         (int)      
    var idsArray = [];
    var idsAproxAray = [];
    var idsAllArray = [];
    var _strAprox = "aprox";
    // id value and generator for objects 'data' in 'graph'
    var _idCounter = 0;
    function _idGenerator(){
      return ++_idCounter;
    }
    // available dimensions for drawing chart
    var availableMainHeight;
    var availableMainWidth;
    // symbol dimensions:
    var oneSymbolWidth = 8; // 10 px
    var oneSymbolHeight = 14; // 14 px
    // object of initial data for chart
    var chartOptions;
    // init function for helper.
    function init(graphObj, chartOpt){
      graphObjects = graphObj;
      chartOptions = chartOpt;
      if( _.isEmpty(chartOptions.streams)){
          console.log(" - object 'chartOptions.streams' is empty")
        } else {
          // init availableMainHeight and 
          availableMainHeight = chartOptions.properties.mainHeight - 
            (chartOptions.properties.paddingYTop + chartOptions.properties.paddingYBottom);
          availableMainWidth = chartOptions.properties.mainWidth - 
            (chartOptions.properties.paddingXLeft + chartOptions.properties.paddingXRight);

          _.forEach(chartOptions.streams, function(value, key){
            if (_.indexOf(idsArray, value.id) < 0){
              idsArray.push(value.id);
              idsAllArray.push(value.id);
              // init graph
              if (!graphs[key]){
                graphs[key] = {};
                graphs[key].id = value.id;
                graphs[key].color = value.color;
                graphs[key].aproximatecolor = value.aproximatecolor;
                graphs[key].data = {}; 
                graphs[key].pointstodraw = '';
                graphs[key].lastXValue = 0;
                notches.lastNotchValue = chartOptions.properties.notchXStartValue;
                notches.beginNotchX = chartOptions.properties.paddingXLeft;
              } 
            } //else { do nothing }
          })        
        }
      // console.log(" chartOptions " + JSON.stringify( chartOptions) );
    }

    function makeStep(data){
      var calculatedXMoveLeftStep = 0;
      var maxLastXValue = 0;      
      maxLastXValue = findMaxXValue();
      moveXToLeft();
      addNewDataY();
      findMaxAndMinY();      
      calculateAproximateLine();
      calculateNewPointY(); 
      drawRim();
      makeAxises();
      // functions :
      function findMaxXValue(){
        // look for value of 'maxLastXValue'
        _.forEach(graphObjects, function(value, key){
          if( graphs[key].lastXValue > maxLastXValue){
            maxLastXValue = graphs[key].lastXValue;
          }
        });
        return maxLastXValue;             
      }
      function moveXToLeft(){
        // array for data which should be deleted
        var dataIdToDelete = [];
        if( (maxLastXValue ) > availableMainWidth ){
          calculatedXMoveLeftStep = maxLastXValue  - availableMainWidth;
          // move previous data to left border on required value - calculate it
          var newBeginNotchX = notches.beginNotchX + (chartOptions.properties.updateXStep - calculatedXMoveLeftStep);
          notches.beginNotchX = newBeginNotchX;
          notches.lastNotchValue += chartOptions.properties.notchXStep;

          _.forEach(graphObjects, function(value, key){
            var newlastXValue = graphs[key].lastXValue - (calculatedXMoveLeftStep);            
            graphs[key].lastXValue = newlastXValue < 0  ? 0 : newlastXValue;
            var paddingXLeft = chartOptions.properties.paddingXLeft;
            _.forEach(graphs[key].data, function(value2, key2){              
                var flagToDelete = true;
                var idPointToDelete = -1;                
                for (var i=0; i < value2.dataY.length; i++){
                  // move left dataX value                  
                  value2.pointX[i] -= calculatedXMoveLeftStep;
                  graphs[_strAprox+key].data[key2].pointX[i] -= calculatedXMoveLeftStep;
                  if( value2.pointX[i] <= paddingXLeft){
                    idPointToDelete = i;
                  }
                  if (value2.pointX[i] > paddingXLeft){
                    flagToDelete = false;
                  }
                }
                // check if current dataObj all pointX < 0
                if(flagToDelete){
                  dataIdToDelete.push(key2);
                } else {
                  if (idPointToDelete >=0){
                    value2.dataY = _.drop(value2.dataY, 1+idPointToDelete);
                    value2.pointX = _.drop(value2.pointX, 1+idPointToDelete);
                    value2.pointY = _.drop(value2.pointY, 1+idPointToDelete);
                    value2.points = _.drop(value2.points, 1+idPointToDelete);
                    value2.stepPointsAmount -= idPointToDelete;
                    graphs[_strAprox+key].data[key2].dataY = _.drop(graphs[_strAprox+key].data[key2].dataY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointX = _.drop(graphs[_strAprox+key].data[key2].pointX, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointY = _.drop(graphs[_strAprox+key].data[key2].pointY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].points = _.drop(graphs[_strAprox+key].data[key2].points, 1+idPointToDelete);
                  }
                }                              
            })
            // delete dataObj with all pointX < 0
            _.forEach(dataIdToDelete, function(value3){
              delete graphs[key].data[value3];
              delete graphs[_strAprox+key].data[value3];
            })
            dataIdToDelete = [];
          })
        };             
      }

      function addNewDataY(){
        _.forEach(graphObjects, function(value, key){
          // amount of points in current step
          var tempUpdateStep = _.clone(chartOptions.streamsProperties[key].updateStep);          
          // add new points to graphs[key].lastXValue
          if(tempUpdateStep > 0){
            // increase lastXValue
            graphs[key].lastXValue += chartOptions.properties.updateXStep;
            // set to zero 'updateStep' in 'streamsProperties'
            chartOptions.streamsProperties[key].updateStep = 0;
            // process it
            if(tempUpdateStep > 0 ){
              var tempId = _idGenerator();
              // create object 'data' : graphs[key].data[tempId]
              graphs[key].data[tempId] = {};
              // get amount 'tempUpdateStep' last data from the stream
              var tempArray = _.takeRight(chartOptions.streams[key].data, tempUpdateStep);
              graphs[key].data[tempId].dataY = _.cloneDeep(tempArray);
              graphs[key].data[tempId].pointX = [];
              graphs[key].data[tempId].pointY = [];
              graphs[key].data[tempId].points = [];
              // amount of points in current step
              graphs[key].data[tempId].stepPointsAmount = tempUpdateStep;
              // length of current step per point (round to 0.001)
              graphs[key].data[tempId].stepX = 
                _.round(chartOptions.properties.updateXStep / tempUpdateStep , 3);
              
              var tempLastXValue = graphs[key].lastXValue - chartOptions.properties.updateXStep;
              for (var i=0; i < tempUpdateStep; i++){
                graphs[key].data[tempId].pointX[i] = chartOptions.properties.paddingXLeft +
                  tempLastXValue + graphs[key].data[tempId].stepX * i;
              }
            }
          }
        });        
      }
      
      function findMaxAndMinY(){
        var currentMinHeight = 0;
        var currentMaxHeight = 0;   
        _.forEach(graphObjects, function(value, key){           
          // calculate height step (look through all datas in graph)
          _.forEach(graphs[value.id].data, function(value2, key2){
              _.forEach(value2.dataY, function(value3, key3){
                var tempValue3 = parseInt(value3)
                if (currentMinHeight > tempValue3){
                  currentMinHeight = tempValue3;
                }
                if (minHeightValue > tempValue3){
                  minHeightValue = tempValue3;
                }
                if (currentMaxHeight < tempValue3){
                  currentMaxHeight = tempValue3;
                }
                if (maxHeightValue < tempValue3){
                  maxHeightValue = tempValue3;
                }
                // correct global max and min value
                if (minHeightValue < currentMinHeight){
                  minHeightValue++;
                }
                if (maxHeightValue > currentMaxHeight){
                  maxHeightValue--;
                }                
              })
          });
        });        
        // calculate heightstep
        heightStep = _.round(availableMainHeight / (maxHeightValue + Math.abs(minHeightValue)) , 9);
      }
      
      //calculate aproximate line and add it to graph
      function calculateAproximateLine(){
        var aproximateRatePercent = 21;
        _.forEach(graphObjects, function(value, key){
            if( !graphs[_strAprox+key]) {
              graphs[_strAprox+key] = {};
              graphs[_strAprox+key].pointstodraw = '';
              graphs[_strAprox+key].data = {};
              graphs[_strAprox+key].color = graphObjects[key].aproximatecolor;
            }
            _.forEach(graphs[key].data, function(value3, key3){              
              if ( ! graphs[_strAprox+key].data[key3] ) { // if undefined
                graphs[_strAprox+key].data[key3] = {};
                graphs[_strAprox+key].data[key3].dataY = [];
                graphs[_strAprox+key].data[key3].pointX = [];
                graphs[_strAprox+key].data[key3].pointY = [];
                graphs[_strAprox+key].data[key3].points = [];
                // calculate aproximate line                
                  if (value3.stepPointsAmount > 2){
                    // find aproximate rate of data in current step                     
                    // callculate available aproximate rate
                    var aproximateRate = Math.round((aproximateRatePercent/100) * (value3.stepPointsAmount));
                    if (aproximateRate < 2) {
                      aproximateRate = 2;
                    }
                    var aproximateBegin = Math.floor(aproximateRate/2);
                    var aproximateEnd = Math.ceil(aproximateRate/2);                    
                    // calculate aproximate dataY
                    for (var i=aproximateBegin; i < (value3.stepPointsAmount - aproximateEnd); i++){
                      var point;    
                      var currentPoint = 0;
                      var a = 0;
                      var b = 0;                             
                      var sumXY = 0;
                      var sumX = 0;
                      var sumY = 0;
                      var sumX2 = 0;               
                      for (var j= 0-aproximateBegin; j<aproximateEnd; j++ ){
                        sumXY += (i+j)*graphs[key].data[key3].dataY[i+j];
                        sumX += (i+j);
                        sumY += graphs[key].data[key3].dataY[i+j];
                        sumX2 += (i+j)*(i+j);
                      }
                      a = (aproximateRate*sumXY - sumX*sumY) / ( aproximateRate * sumX2 - sumX*sumX);
                      b = (sumY - a * sumX) / aproximateRate;
                      // calculate begin of data
                      if ( i === aproximateBegin){
                        // save beginner point
                        graphs[_strAprox+key].data[key3].dataY[0] = graphs[key].data[key3].dataY[0]; 
                        graphs[_strAprox+key].data[key3].pointX[0] = graphs[key].data[key3].pointX[0];
                        graphs[_strAprox+key].data[key3].pointY[0] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[0] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[0] + 
                          "," + graphs[_strAprox+key].data[key3].pointY[0];
                        graphs[_strAprox+key].data[key3].points.push(point);
                        if(aproximateBegin > 1){
                          for (var n=1; n < aproximateBegin; n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } // else { do nothing }
                      }    
                      // calculate aproximated valiu in current point
                      currentPoint = _.round( (a * i + b) , 3);
                      if (!isNaN(currentPoint)){
                        graphs[_strAprox+key].data[key3].dataY[i] = currentPoint; 
                        graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                        graphs[_strAprox+key].data[key3].pointY[i] = 
                          (availableMainHeight + chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                        graphs[_strAprox+key].data[key3].points.push(point);
                      }
                      var tempStepPointsAmount = value3.dataY.length;
                      // calculate end of data
                      if ( i === (tempStepPointsAmount - aproximateEnd -1) ){
                        var end = tempStepPointsAmount -1;
                        if( tempStepPointsAmount - aproximateEnd > 1){
                          for (var n = (end - aproximateEnd + 1); n < (end ); n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                                chartOptions.properties.paddingYTop - 
                                (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } else{ }
                          // end point from received data
                          graphs[_strAprox+key].data[key3].dataY[end] = graphs[key].data[key3].dataY[end]; 
                          graphs[_strAprox+key].data[key3].pointX[end] = graphs[key].data[key3].pointX[end];
                          graphs[_strAprox+key].data[key3].pointY[end] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[end] + 
                              Math.abs(minHeightValue))));
                          point = graphs[_strAprox+key].data[key3].pointX[end] + "," + graphs[_strAprox+key].data[key3].pointY[end];
                          graphs[_strAprox+key].data[key3].points.push(point);                        
                      }
                    }                  
                    // graphs[_strAprox+key].pointstodraw = String.concat(graphs[_strAprox+key].pointstodraw, 
                    //         " ",
                    //         graphs[_strAprox+key].data[key3].points.join(' ') );
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw +  
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
                  else{
                    // copy points from original data
                    for (var i=0; i < (graphs[key].stepPointsAmount); i++){
                      graphs[_strAprox+key].data[key3].dataY[i] = currentPoint;  
                      graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                      graphs[_strAprox+key].data[key3].pointY[i] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                      point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                      graphs[_strAprox+key].data[key3].points.push(point);
                    }    
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw + 
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
              }
            })    
        }) 
      }

      function calculateNewPointY(){
        // calculate 'point to draw'
        _.forEach(graphObjects, function(value, key){ 
          graphs[key].pointstodraw = '';
          graphs[_strAprox+key].pointstodraw = '';
          var firstFlag = true;
          _.forEach(graphs[key].data, function(value2, key2){
            for(var i=0; i < value2.dataY.length; i++){
              value2.pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              value2.points[i] = value2.pointX[i] + "," + value2.pointY[i];
              graphs[_strAprox+key].data[key2].pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[_strAprox+key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              graphs[_strAprox+key].data[key2].points[i] = 
                graphs[_strAprox+key].data[key2].pointX[i] + 
                "," + 
                graphs[_strAprox+key].data[key2].pointY[i];
            }
            // add pointstodraw to 'value.pointstodraw'
            if(firstFlag){
              graphs[key].pointstodraw
            }
            graphs[key].pointstodraw = 
              String(graphs[key].pointstodraw +  
              ' ' + 
              graphs[key].data[key2].points.join(' '));
            graphs[_strAprox+key].pointstodraw = 
              String(graphs[_strAprox+key].pointstodraw + 
              ' ' +
              graphs[_strAprox+key].data[key2].points.join(' '));            
          });          
        });        
      }

      // object to keep notches, which should be deleted from view
      var notchesToDelete = {};  
      function makeAxises( ){
        var zeroLine = calculateZeroLine();
        var zeroLineGraph = zeroLine.getLine();
        var zeroLineText = zeroLine.getText();
        var zeroNotch = zeroLine.getNotch();
        // copy previous lines delete old lines after
        notchesToDelete = _.cloneDeep(notches);    
        delete notchesToDelete.lastNotchValue;        // little fix. it should stay in obj 'notches'
        delete notchesToDelete.beginNotchX;           // little fix. it should stay in obj 'notches'
        svgTextToDelete = _.cloneDeep(svgTexts);        
        calculateYNotches();
        calculateXNotches(); 
        // clean 'notches' to delete
        if ( !_.isEmpty(notchesToDelete)){
          _.forEach(notchesToDelete, function(value, key){ 
            console.log(" Notch to delete (id): " + value.id);   //
            delete notches[value.id];                 
          })
          // reset linesToDelete obj;
          notchesToDelete = {};
        } 
        if ( !_.isEmpty(svgTextToDelete)){
          _.forEach(svgTextToDelete, function(value, key){
            delete svgTexts[value.id];
          })               
          svgTextToDelete = {};
        }
        // add zero line
        graphs[zeroLineGraph.id] = zeroLineGraph;
        svgTexts[zeroLineText.id] = zeroLineText;
        notches[zeroNotch.id] = zeroNotch;
      };

      function calculateXNotches(){
          var xNotchString = "xNotch";   // id name word
          // for xNotch from 'paddingXLeft' to 'paddingXLeft + availableMainWidth'
          var paddingXLeft = chartOptions.properties.paddingXLeft;
          var notchWidth = chartOptions.properties.notchYWidth;
          var coordinateX = notches.beginNotchX;
          var y = chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom;
          var notchStep = chartOptions.properties.notchXStep;         
          for (var i=0; ((i<25) && (coordinateX < (paddingXLeft + availableMainWidth))); i++ ){
              var notch = {
                "id" : (xNotchString+i),
                "x1" : (coordinateX),
                "y1" : (y),
                "x2" : (coordinateX),
                "y2" : (y + notchWidth),
                "col" : "#1f1f1f",
                "width" : 1
              }
              // notches.lastNotchValue
              var textVal = String.toString(notches.lastNotchValue);
              var text = {
                  "id" : (xNotchString+i),
                  "text" : (notches.lastNotchValue + i*notchStep) ,
                  "x" : (coordinateX),
                  "y" : (y + notchWidth + oneSymbolHeight) ,
                  "col" : "#F44336"
                };
              notches[notch.id] = notch;
              delete notchesToDelete[notch.id];
              coordinateX += chartOptions.properties.updateXStep;
              svgTexts[text.id] = text;
              delete svgTextToDelete[text.id];
          }
      }

      // the least size between lines - 20 px
      function calculateYNotches(){
        // calculate amount of above 0x lines
        var availableNotchSteps = [5, 25, 50, 100, 500, 1000];
        var notchStringAbove = "aboveNotchX";
        var notchStringUnder = "underNotchX";        
        calculateNotchFor("+" , notchStringAbove, 1, maxHeightValue);
        calculateNotchFor("-" , notchStringUnder, -1, Math.abs(minHeightValue));
        // internal function. Is used only here
        function calculateNotchFor(sign , name, direction, heightValue){
          _.forEach(availableNotchSteps, function(value, key){
            var amount =  _.floor(heightValue / value) ;
            if( amount > 0){
              if (heightStep*value > 20){
                for(var i=1; i < (amount+1); i++){
                    var y = (chartOptions.properties.mainHeight - 
                      chartOptions.properties.paddingYBottom - 
                      Math.abs(minHeightValue*heightStep) -
                      direction*heightStep*value*i
                      );
                    var notch = {
                      "id" : (value+name+i),
                      "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
                      "y1" : (y),
                      "x2" : (chartOptions.properties.paddingXLeft),
                      "y2" : (y),
                      "col" : "#1f1f1f",
                      "width" : 1
                    }
                    var textVal = sign+value*i;
                    var text = {
                      "id" : (value+name+i),
                      "text" : (textVal) ,
                      "x" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth - (oneSymbolWidth * textVal.length)),
                      "y" : (y - 1) ,
                      "col" : "#F44336"
                    }
                    notches[notch.id] = notch;
                    delete notchesToDelete[notch.id];
                    svgTexts[text.id] = text;
                    delete svgTextToDelete[text.id];
                  }
              }
            };
          });
        }        
      };

      function calculateZeroLine( ){
        return {
          getLine : function (){
            return{
              "id":"0xaxis",
              "color": "#808080",
              "data": [ ],
              "pointstodraw": (chartOptions.properties.paddingXLeft) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) + 
                  " " + 
                  (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep))
            }
          },
          getText : function (){
            return {
              "text" : "0",
              "x" : (chartOptions.properties.paddingXLeft - oneSymbolWidth - chartOptions.properties.notchXWidth),
              "y" : (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) ,
              "col" : "#F44336"
            }
          },
          getNotch : function (){            
            var y = (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep));
            return {
              "id":"0xaxis",
              "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
              "y1" : (y),
              "x2" : (chartOptions.properties.paddingXLeft),
              "y2" : (y),
              "col" : "#1f1f1f",
              "width" : 1
            }
          }
        }
      };

      // draw rim around the chart
      function drawRim(){
        var rim = {
          "id":"rim",
          "color": "#4E342E",
          "data": [ ],
          "pointstodraw": (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) + 
              " " + 
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) +
              " " +
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom)
        }
        graphs[rim.id] = rim;
      };  
    }  
    function getGraph(){
      return graphs;
    }
    function getText(){
      return svgTexts;
    }
    function getNotch(){
      return notches;
    }
    return {
      makeStep : makeStep,
      getGraph : getGraph,
      getText : getText,
      getNotch : getNotch,
      init : init
    }
  }
])

var feedbackModalModule = angular.module('FeedbackModalModule',
	[]);


feedbackModalModule.factory('feedbackModalService', ['$uibModal', '$q',
	function($uibModal, $q){
		var dataString = "";
		function openModal(dataStr){
			var deferred = $q.defer();
			dataString = dataStr;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",
	  			controller: function($uibModalInstance){
	  				this.datamessage = dataString;
	  				console.log("  dataString   " + dataString);
	  				this.submit = function(){
	  					close(dataString);
	  				};
	  				function close(result) {     
				      $uibModalInstance.close(result);      
				    }
	  			},
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){ 	  			
				deferred.resolve(result);  				
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            deferred.reject(error);
	  		})
	  		return deferred.promise;
		}
		return {
			openModal : openModal
		}
	}
])
var loadMaskModule = angular.module('LoadMaskModule',[]);

var ModalModule = angular.module('ModalModule',[]);
ModalModule.controller('ModalController', 
  [ '$scope', '$translate', 'myModalWindowService', '$uibModalInstance',   
  function( $scope, $translate, myModalWindowService, $uibModalInstance) {
    $scope.close = function(result) {     
      $uibModalInstance.close();      
    };
}]);
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

'use strict';
var appDecorators = angular.module('appDecorators', []);



'use strict';
var appDirectives = angular.module('appDirectives', []);



'use strict';
var appProviders = angular.module('appProviders', []);



'use strict';
var appServices = angular.module('appServices', []);


loadMaskModule.directive('loadmask',[
	function () {
		
		return {
			restrict: 'E',
			templateUrl: 'app/loadmask/loadmask.html',
			controller: function(){
				console.log(" Load mask is shown.")
			},
			link: function(scope, element, attr, ctrl){

			}
		}		
	}
])

loadMaskModule.factory('LoadMaskService', ['htmlClassModifierService',
  	function(htmlClassModifierService){
		function activateLoadMask(){
			htmlClassModifierService.removeClass("myloadmask", "hidden");
		};
		function deactivateLoadMask(){
			htmlClassModifierService.addClass("myloadmask", "hidden");
		};
		return {
			activateLoadMask : activateLoadMask,
			deactivateLoadMask : deactivateLoadMask
		}
	}
]);
ModalModule.factory('myModalWindowService', ['$uibModal', '$rootScope',
	function($uibModal, $rootScope){
		var _ispresent = false;
		function showModal(errorType){
			if ( !_ispresent){
				_ispresent = true;
		  		var isolation = true;
		  		var modalScope = $rootScope.$new(isolation);
		  		modalScope.errortype = 'errormodalwindow.message.'+errorType;
		  		var modalInstance = $uibModal.open({
		  			animation: true,
		  			size: "sm",
		  			templateUrl: "/app/modal/modal.html",
		  			controller: "ModalController",
		  			scope: modalScope		  			
		  		});		  		
		  		modalInstance.result.then(function(){
		  			// console.log(" ispresent setted to false");
		  			_ispresent = false;
		  			modalScope.$destroy();
		  		}, function(error){
          			// error contains a detailed error message.
		            console.log("Modal window error: " + error);
		            _ispresent = false;
		  		})
			}
		}
		return{
			showModal : showModal			
		}
	}
]);
// available languages
//appServices.factory('languagesStorage', ['$http', '$q', 'LANG',
rootModule.factory('languagesStorage', ['$http', '$q', 'LANG',
	function($http, $q, LANG){
		function getAvailableLanguages(){			
			var deferred = $q.defer();
			$http({
				method: "GET",
				url: '/lang/languages.json'
			}).then(function successCallback(response){	
				console.log(" load languages.json success." );
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log(" load languages.json error." );
				deferred.reject(error);
			})
			return deferred.promise;			
		}
		return {
			getAvailableLanguages : getAvailableLanguages
		}
	}
])
app.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
app.config([ '$provide', function($provide){
		/*
			string into decorator have to be “{0} {1} – {2}{3}“ 
				where 
				{0} current date – “dd-MMM-yyyy”, 
				{1} – current time – “HH:MM:SS:MS”, 
				{2} – class name, 
				{3} – string that need to log
		*/
		var monthesStor = {
			"01":{"short":"JAN"},
			"02":{"short":"FEB"},
			"03":{"short":"MAR"},
			"04":{"short":"APR"},
			"05":{"short":"MAY"},
			"06":{"short":"JUN"},
			"07":{"short":"JUL"},
			"08":{"short":"AUG"},
			"09":{"short":"SEP"},
			"10":{"short":"OCT"},
			"11":{"short":"NOV"},
			"12":{"short":"DEC"}
		}
		var support = function(template, valuesArray){
			var result = new String(template);
			for (var val in valuesArray){
				// console.log( " val =  " + val);
				result = result.replace("{"+val+"}", valuesArray[val]);
			}
			return result;
		}
		$provide.decorator('$log', [ '$delegate', 
			function($delegate){
				function currentTime(){					
					var time = new Date();
					var timeStr = String(time.getHours() + ":" +
						time.getMinutes() + ":" +
						time.getSeconds() + ":" +
						time.getMilliseconds()
					);
					return timeStr;
				};
				function currentDate(){
					var time = new Date();
					var date = time.getDate();
					var month = time.getMonth() + 1;
					date = date < 10 ? new String("0"+ date) : new String(date);
					monthStr = month < 10 ? monthesStor[new String("0"+ month)].short
						: monthesStor[new String(month)].short;					
					var dateStr = new String(date + "-" + 
						monthStr + "-" + 
						time.getFullYear());
					return dateStr;
				};
				function updateFunctions(object, className){
					function prepareFunction(object, funcName, className){
						return function () {			                
			                var now = String (currentTime() + " " + currentDate());		
			                var arg = !!(arguments[0]) ? new String(arguments[0]) : "";
			                className = className ? className : '';
			                console[funcName](support("{0} - {1} {2} ", [now, className, arg]));
			            };
					};
					object.log = prepareFunction(object, "log", className);
					object.info = prepareFunction(object, "info", className);
					object.warn = prepareFunction(object, "warn", className);
					object.debug = prepareFunction(object, "debug", className);
					object.error = prepareFunction(object, "error", className);
					return object;
				};
				$delegate.getInstance = function(className){
					className = (className !== undefined) ? className : "";
					$delegate = updateFunctions($delegate, className);
				};
				return $delegate;
			}
		])
	}
]);
appDirectives.directive('myagevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',
      link: function(scope, element, attr, mCtrl){
        function myAgeValidator(value){          
          var result = validatorsService.agevalidator(value);
          if (result){
            mCtrl.$setValidity('ageFormat', true);
            // custom
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return value;
          } else {
            mCtrl.$setValidity('ageFormat', false); 
            //custom
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return '';
          }
        }
        mCtrl.$parsers.push(myAgeValidator);
      }
    }
}])
appDirectives.directive('mydatevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
	  return {
	    require: 'ngModel',
	    link: function (scope, element, attr, mCtrl){
	      function myDateValidator(value){         
          var result = validatorsService.datevalidator(value);
          if (result){
            mCtrl.$setValidity('dateFormat', true);    
            //custom 
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('dateFormat', false);
            //custom
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);   
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);
            return '';
          }
	      }
	      mCtrl.$parsers.push(myDateValidator);
	    } 
	  }
}])
appDirectives.directive('mynamevalidator', ['validatorsService',
 'htmlClassModifierService', 'VALIDATORS',  
  function(validatorsService,htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',      
      link: function(scope, element, attr, mCtrl){
        function myNameValidator(value){
          var result = validatorsService.namevalidator(value);
          if (result){
            mCtrl.$setValidity('nameFormat', true);   
            //custom   
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('nameFormat', false); 
            //custom     
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME); 
            return '';
          }
        }
        mCtrl.$parsers.push(myNameValidator);
      }
    }
}])
appProviders.provider('log', 
	function logProvider(){
		var time = new Date();
		var currentTimeMillis = time.getTime();	
		var timeStr = String(time.getHours() + ":" +
			time.getMinutes() + ":" +
			time.getSeconds() + ":" +
			time.getMilliseconds()
		);
		this.getTimeCreation = function(){			
			return timeStr;
		};		
		this.getTimeCreationMillis = function(){
			return currentTime;
		};
		this.$get = function(){				
			return new log();				
		};		
	}	
)
appServices.factory('checkCredentialsServise', ['$http', '$q', 
	'userCreditsStorage', 'loginService',
	function($http, $q, userCreditsStorage, loginService){
		// var access = false;
		var _userCredentials;
		function checkUserCredentials(login, password){
			var deferred = $q.defer();			
			loginService.login(login, password).then(
				function successCallback(details){
					// console.log(" access alowed");
					access = true;
					deferred.resolve(details);				
				}, function errorCallback(response){
					// console.log(" access forbiden");					
					deferred.reject(false);
				}
			)
			return deferred.promise;	
		}
		function checkSession(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/checksession'
			}).then(function successCallback(response){
				_userCredentials = response.data;
				console.log("Session is valid.");
				deferred.resolve(response.data);
			}, function errorCallback(error){
				_userCredentials = null;				
				console.log("Session not valid.");
				deferred.reject(error);
			})
			return deferred.promise;
		};
		function getUserCredits(){
				var deferred = $q.defer();
				if ( ! userCreditsStorage.getUserCredits()){
					checkSession().then(function(details){
						console.log("provide userCredits from post request");	
						userCreditsStorage.setUserCredits( details
							// {"login": details['login']} 							
						);
						deferred.resolve(details);
					}, function(error){
						console.log("Cann't get user credits details.");
						userCreditsStorage.setUserCredits(null);
						deferred.reject(error);
					})				
				} else{
					console.log("provide userCredits from storage");
					deferred.resolve(userCreditsStorage.getUserCredits());					
				}
			return deferred.promise;
		}
		return {
			checkCredentials:  checkUserCredentials,
			checkSession : checkSession,
			getUserCredits : getUserCredits
		}
	}
]);
appServices.factory('htmlClassModifierService', [ function(){
	return {
		addClass : function(classSelector, classToAdd){
			angular.element(document.querySelector("."+classSelector)).addClass(classToAdd);
		},
		removeClass : function(classSelector, classToRemove){
			angular.element(document.querySelector("."+classSelector)).removeClass(classToRemove);
		}
	}	
}])

appServices.factory('myInterceptor', [
	function(){
		var timeMarker = {
			request: function(config){
				config.requestTimePoint = new Date().getTime();
				return config;
			},
			response: function(response){
				response.config.responseTimePoint = new Date().getTime();
				// log only post requests
				if ( String(response.config.method).toLowerCase() === "post" ){
					// log it 
					console.log(" - request-response time: " + 					
						(response.config.responseTimePoint - response.config.requestTimePoint) +
						" ms. " + " URl: " + response.config.url);
				}
				return response;
			}
		}
		return timeMarker;
	}
])
//monthes storage
appServices.factory('monthesStorage', [ '$http', '$q',
	function($http, $q){
		var monthes;
		var _promiseLoad = _loadMonthes();
		function _loadMonthes(){			
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: "/app/public/date.json"
			}).then(function successCallback(response){
				// save monthes				
				deferred.resolve(response.data);
			}, function errorCallback(error){
				// error in monthes load 				
				console.log(" Cann't receive date.json file.");
				deferred.reject( "Cann't receive date.json file." );
			}	
			)	
			return deferred.promise;
		}
		function getMonthes(){
			if (monthes === undefined){
				_promiseLoad.then(function(details){
						console.log(" Loading monthes from server.")
						monthes = details;
						// console.log("monthes:"+ monthes);
						return monthes;
					}, 
					function(reason){
						// show modal error message.
						monthes = undefined;
						console.log("Error in downloading monthes. " + reason);
					}
				);				
			} else {				
				return monthes;
			}
		}
		function checkLeapYear(year){
			if ( (year) % 4 === 0 ){    
			    if (year % 100 === 0 && year % 400 !== 0){
			      return false;
				}
			    return true;   
			} else {
			    return false;
			}
		}
		return {
			getMonthes : getMonthes,
			checkLeapYear : checkLeapYear
		}
		
	}
])
// save login of user
appServices.factory('userCreditsStorage', function(){
	var userCredits = null;
	return {
		setUserCredits: function(credits){
			console.log("set credits in storage: " + userCredits);
			userCredits = credits;
		},
		getUserCredits: function(){
			console.log("get credits from storage: " + userCredits);
			return userCredits;
		}
	}
})
// save different user data
appServices.factory('userDataStorage', function(){
	var userData = {};
	return {
		setUserData: function(data, key){
			userData[key] = data;
		},
		getByKeyUserData: function(key){
			return userData[key];
		},
		getAllUserData: function(){
			return userData;
		},
		removeAll: function(){
			// delete userData;
			userData = null;
			userData = {};
		}
	}
})
appServices.factory('userDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;
		function getUserDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/userdetails'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				console.log("error. unauthorised ? ");
				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getUserDetails : getUserDetails
		}
	}
])
appServices.factory('validatorsService', ['VALIDATORS', 'monthesStorage',
	function(VALIDATORS, monthesStorage){
		var _nameRegEx = VALIDATORS.NAME_VALIDATOR.NAME_REGEX;
		var _minage = VALIDATORS.AGE_VALIDATOR.MIN_AGE;
    	var _maxage = VALIDATORS.AGE_VALIDATOR.MAX_AGE;
    	var _ageRegex = VALIDATORS.AGE_VALIDATOR.AGE_REGEX;

    	var _dateRegEx = VALIDATORS.DATE_VALIDATOR.DATE_REGEX; 
	    var _separator = VALIDATORS.DATE_VALIDATOR.SEPARATOR;
	    var _minyear = VALIDATORS.DATE_VALIDATOR.MIN_YEAR;
	    var _maxyear = VALIDATORS.DATE_VALIDATOR.MAX_YEAR;
	    var _februarynumber = VALIDATORS.DATE_VALIDATOR.FEBRUARY_NUMBER;
	    var _februaryleapdays = VALIDATORS.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS;
	    var _numyear = VALIDATORS.DATE_VALIDATOR.NUMBER_YEAR;
	    var _nummonth = VALIDATORS.DATE_VALIDATOR.NUMBER_MONTH;
	    var _numday = VALIDATORS.DATE_VALIDATOR.NUMBER_DAY;
    
		var _isvalid = false;
		var _parts = null;
		var _maxdays = 0;

		var monthes;

		return {
			namevalidator: function(value){
				var isvalid = false;
				if (_nameRegEx.test(value)){
		        	isvalid = true;		            
		        } else {		            
		            isvalid = false;
		        }
		        return isvalid;
			},
			agevalidator: function(value){
				var isvalid = false;
				if (value <= _maxage && value >= _minage && _ageRegex.test(value)){
		            isvalid = true;		            
		        } else {
		             isvalid = false;
		        }
		        return isvalid;
			},
			datevalidator : function(value){
				var _isvalid = false;
				monthes = monthesStorage.getMonthes();
		        if (_dateRegEx.test(value)){
		          _parts = value.split(_separator);
		          // check year
		          if(_parts[_numyear] > _minyear && _parts[_numyear] < _maxyear){            
		            // check february for leap year
		            if (_parts[_nummonth] === _februarynumber ){
		              if (monthesStorage.checkLeapYear(_parts[_numyear])){
		                _maxdays = _februaryleapdays;
		              } else{
		                _maxdays = monthes[_parts[_nummonth]].days;
		              }               
		            } else {
		                _maxdays = monthes[_parts[_nummonth]].days;	               
		            }
		            // check amount of days for max value
		            if (_parts[_numday] <= _maxdays && _parts[_numday] > 0){
		              _isvalid = true;
		            } else {
		              _isvalid = false;
		            }
		          } else {
		            _isvalid = false;
		          }          
		        } else {
		            _isvalid = false;
		        }
				return _isvalid;				
			}
		}
	}
]);

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
              // console.log(" Login is success! ");
              $log.info("User login success.");
              var isAdmin = details.admin;
              // console.log(" Hello. You have admin rights: " + isAdmin);              
              userCreditsStorage.setUserCredits(
                {"login": login,
                  "admin": !!isAdmin}
              );   
              LoadMaskService.deactivateLoadMask();
              $state.go('root.main.dashboard', {"admin":!!isAdmin});
          }, function(reason){
              // console.log(" Login is incorect. " + reason);
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
          // console.log("Logout is successful.");
          $log.info("User logout success.");
          LoadMaskService.deactivateLoadMask();
          $state.go('root.login');
        }, function(reason){
          // console.log("Logout fail.");      
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
loginModule.service('loginService', [ '$q', '$http',
	function($q, $http){
		var deferred = $q.defer();
		function login(login, password){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/login',
				data: {
					"login": login,
					"password": password
				}
			}).then(function successCallback(response){			
				deferred.resolve(response.data);				
			}, function errorCallback(response){				
				deferred.reject(false);
			})	
			return deferred.promise;
		}
		return {
			login : login
		}
	}
])
tabSwitcherModule.factory('logoutService', ['$http', '$q', 'userCreditsStorage', 
	'userDataStorage', 'userDataStorage',
	function($http, $q, userCreditsStorage, userDataStorage){
		function logout(){
			userDataStorage.removeAll();
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/logout'				
			}).then(function successCallback(response){
				console.log("Logout is allowed.");
				userCreditsStorage.setUserCredits(null);
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log("Error while logout.");
				deferred.reject(error);
			})
			return deferred.promise;
		}
		return {
			logout : logout
		}
	}
])

var adminModule = angular.module('AdminModule',
	['AdminAddUserModalModule', 'AdminDeleteUserModalModule', 'AdminUpdateUserModalModule']);

adminModule.controller('AdminController', [ 'allUsersDetailsModel',
	'$uibModal', '$state', 'userCreditsStorage', 'myModalWindowService',
	'LoadMaskService', '$log', 
	function(allUsersDetailsModel, $uibModal, $state, userCreditsStorage,
			myModalWindowService, LoadMaskService, $log){
		var thisPointer = this;
		var allUsersDetails = null;

		$log.getInstance("Admin");

		// load data about all users. 
		loadUsersDetails();
		// show in table.
		function loadUsersDetails(){
			LoadMaskService.activateLoadMask();
			allUsersDetailsModel.getDetails().then(
				function successCallBack(details){	
					$log.info("Users data was loaded.");
					thisPointer.alldetails = details;
					allUsersDetails = details;
					LoadMaskService.deactivateLoadMask();					
				} , 
				function errorCallBack(){
					LoadMaskService.deactivateLoadMask();
					$log.warn("Users data loading error.");
					// show modal about error
					myModalWindowService.showModal("type10");
					// send redirect if user hasn't admin access					
					// or redirect him to anywhere
				}
			);
		}

		// add new user
		thisPointer.adduser = function (login, password, name, age, date){
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",
	  			controller: "AdminAddUserModal",
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if (!_.isEmpty(result)){									
					// activate loadmask	  			
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.addUser(result.login, 
							result.password, result.name, result.age, result.date).then(
						function successCallBack(){
							$log.info("New user \'" + result.login + "\' was added.");
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
							// deactivate loadmask
						}, function errorCallBack(){
							$log.warn("User \'" + result.login + "\' creation error.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type13");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
				// myModalWindowService.showModal("type13");
	  		})
		}

		// update user
		thisPointer.update = function (login){
			// login, password, name, age, date
			// open modal window for updating fields
			var isAdmin = userCreditsStorage.getUserCredits().admin;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",
	  			controller: "AdminUpdateUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userDetails : function(){
	  					// console.log(" login " + login + " allUsersDetails[login] " + JSON.stringify(allUsersDetails[login]));
	  					return allUsersDetails[login];
	  				}
	  			}	  				
	  		});	
	  		modalInstance.result.then(function(result){ 
	  			if (!_.isEmpty(result)){
					// activate loadmask

	  				LoadMaskService.activateLoadMask();					
					allUsersDetailsModel.updateUser(result.login, 
							result.password, result.name, result.age, result.date, login).then(
						function successCallBack(){							
							$log.info("Update user. Submited data: " + JSON.stringify(result));
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
						}, function errorCallBack(){
							$log.warn("User cann't be updated.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type12");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;	
	  		})
		}

		// delete user
		thisPointer.delete = function (login){			
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",
	  			controller: "AdminDeleteUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userLoginDelete : function(){	  					
	  					return login;
	  				}
	  			}	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
				// console.log(" submited result " + JSON.stringify(result));	  			
	  			if ( result.deleteFlag ){
					// console.log(" try to delete "  + result.deleteFlag);
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.deleteUser(login).then(
						function successCallBack(){
							$log.info("User was deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();
						}, function errorCallBack(){
							$log.warn("User cann't be deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type11");
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;
	  		})
		}
	}
])
var dashboardModule = angular.module('DashboardModule',
	['DiagramModule']);

dashboardModule.controller('DashboardController', ['$scope', '$state', '$interval',
  'userDataStorage', 'userDetailsService', 'loadChartDataService', 'LoadMaskService',
  function($scope, $state, $interval, userDataStorage, 
      userDetailsService, loadChartDataService, LoadMaskService){
    // show chart. stream from server
    var thisPointer = this;
    
    // initial parameters for charts: 
    var initParameters = {
      "1": {
        "stream":"/app/chartdata1", 
        "color":"#FFCC80", 
        "aproximatecolor":"#EF6C00"
      }, 
      "2": { "id": 2,
        "stream":"/app/chartdata2", 
        "color":"#80CBC4", 
        "aproximatecolor": "#00695C"
      }
    }

  /*  "maxAmountOfPoints" : 480,
      "updateTimeout" : 500,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStep" : 40,      - step in px per notch  
      "notchXName" : "point", - notch name
      "notchXWidth" : 5,      - width of notch-line      
      "notchYStep" : 100,   
      "notchYName" : "point", - notch name

      notice: chart height = main-height - (paddingYTop + paddingYBottom)
              chart width = main-width - (paddingXLeft + paddingXRight)  
  */    
    var chartProperties = {
      "mainWidth" : 480,
      "mainHeight" : 400,     
      "updateTimeout" : 1500,
      "updateXStep": 50,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStartValue" : 10,
      "notchXStep" : 40,
      "notchXWidth" : 5,      
      "notchXName" : "point",      
      "notchYWidth" : 5,
      "notchYName" : "point",
    }

    var maxAmountOfPoints = chartProperties.mainWidth;    
    // timeout for redraw diagram
    var updateTimeout = chartProperties.updateTimeout; // ms
    // make graph object
    var graphObjects = {};
    _.forEach(initParameters, function(value, key){      
      graphObjects[key] = {
          "id": key,
          "stream": value.stream,
          "color": value.color,
          "aproximatecolor": value.aproximatecolor
      }      
    });
    // data storage for downloadded datas
    var dataDownloaded = {};
    var dataDownloadedProperties = {};
    // amount of points availale to make step
    var updateStep = 0;    
    // object-storage for $interval's
    var intervalObject;
    function destroyInterval(){      
        if (angular.isDefined(intervalObject)){
          $interval.cancel(intervalObject);
          intervalObject = undefined;
        }      
    }
    $scope.$on('$destroy', function(){
        destroyInterval();
      }
    );
    function startUpdate(){
      // deactivate load mask in case of showing diagram
      LoadMaskService.deactivateLoadMask();
      intervalObject = $interval(function(){
            // console.log(" update timeout ");
        thisPointer.chartOptions.properties = chartProperties;
        _.forEach(graphObjects, function(value, key){ 
          if (!dataDownloaded[key]){
            dataDownloaded[key] = {};
            dataDownloaded[key].id = key;
            dataDownloaded[key].data = [];
            dataDownloaded[key].color = value.color;
            dataDownloaded[key].aproximatecolor = value.aproximatecolor;
            dataDownloadedProperties[key] = {};
            dataDownloadedProperties[key].iswaitingload = false;
            dataDownloadedProperties[key].updateStep = 0; 
          }          
          if (!dataDownloadedProperties[key].iswaitingload){            
            dataDownloadedProperties[key].updateStep = 0;            
            dataDownloadedProperties[key].iswaitingload = true;
            // load data for current stream
            loadChartDataService.loadData(value.stream).then(
              function successCallBack( details ){
                dataDownloadedProperties[key].updateStep = details.data.length;
                dataDownloaded[key].data = _.concat(dataDownloaded[key].data , details.data);
                dataDownloadedProperties[key].iswaitingload = false;
                thisPointer.chartOptions.streams[key] = dataDownloaded[key];
              }, function errorCallBack(reason){
                // show error modal message                
                $state.go("root.login");
                console.log("Cann't load chart data from server. Reason: " + reason);
              }
            )          
          }
        })
        var currentMaxLengthOfStream = 0;
        _.forEach(graphObjects, function(value, key){
          if (dataDownloaded[key].data.length > currentMaxLengthOfStream) {
            currentMaxLengthOfStream = dataDownloaded[key].data.length;
          }
          if (dataDownloadedProperties[key].updateStep > updateStep) {
            updateStep = dataDownloadedProperties[key].updateStep;
          }
        })
        var temp = currentMaxLengthOfStream - maxAmountOfPoints;
        if (temp > 0){
          _.forEach(graphObjects, function(value, key){
            dataDownloaded[key].data.splice(0, temp);
          })          
        }        
        userDataStorage.setUserData(dataDownloaded, "chartData");
        userDataStorage.setUserData(dataDownloaded, "chartDataProperties");
        userDataStorage.setUserData(chartProperties, "chartProperties");        
        thisPointer.chartOptions = { 
          "streams": dataDownloaded,
          "streamsProperties": dataDownloadedProperties,          
          "properties" : chartProperties        
        }        
      }, updateTimeout);
    }

    // take data from userStorage
    if (_.isEmpty(dataDownloaded)){      
      var temp = userDataStorage.getByKeyUserData("chartData");
      if (temp !== undefined){
        dataDownloaded = _.cloneDeep(temp);
        dataDownloadedProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartDataProperties"));
        chartProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartProperties"));
      }
      thisPointer.chartOptions = { 
        "streams": dataDownloaded,
        "streamsProperties": dataDownloadedProperties, 
        "properties" : chartProperties        
      } 
    }
    startUpdate();
  }
])
var feedbackModule = angular.module('FeedbackModule',
	['FeedbackModalModule']);

feedbackModule.controller('FeedbackController', ['$state',
  'myModalWindowService', 'LoadMaskService', '$log', 
  'feedbackService', 'feedbackModalService',
  function($state, myModalWindowService, LoadMaskService, $log, 
  			feedbackService, feedbackModalService){      
	    var thisPointer = this;
	    $log.getInstance("Feedback");
	    thisPointer.sendemail = function(){		    
		    var data = {
		    	"from" : thisPointer.name,
			    "to" : thisPointer.email,
			    "content" : thisPointer.textarea
		    }
		    // process data		       
		    var processedData = "From: \"" + data.from + "\". " + 
				"To: \"" + data.to + "\". " + 
				"Content: \"" + data.content + "\".";		    
		    // open modal
			feedbackModalService.openModal(processedData).then(
				function successCallBack(resultMessage){					
					LoadMaskService.activateLoadMask();
					var jsonResultMessage = {
				    	"from" : thisPointer.name,
					    "to" : thisPointer.email,
					    "content" : thisPointer.textarea
				    }
				    // read all available email in address-email and try send 
				    //untill it will be sent

					// feedbackService.sendFeedback(
					// 		jsonResultMessage.from, 
					// 		jsonResultMessage.to,
					// 		jsonResultMessage.content ).then(
					var toArray = jsonResultMessage.to.split(",");
					feedbackService.setContent(jsonResultMessage.content);
					feedbackService.sendFromDecorator(
							jsonResultMessage.from, 
							toArray ).then(
						function successCallBack(result){
							LoadMaskService.deactivateLoadMask();
							$log.info("Feedback is sent.");
							// clear feedback form
							thisPointer.name = "";
		    				thisPointer.email = "";
		    				thisPointer.textarea = "";
							//ok
						}, function errorCallBack(error){
							// don't clear feedback form
							LoadMaskService.deactivateLoadMask();		
							$log.warn("Feedback cann't be sent.");
							// show modal error
							myModalWindowService.showModal("type20");
						}
					)
				}, function errorCallBack(error){
					// don't send
					// don't clear feedback form
					// log	
					$log.log("Feedback wasn't sent. Canseled.");				
				}
			)
	    }     
  }
])
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
            // console.log (" error in user details. " + reason);
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
            // console.log (" error in user details. " + reason);
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
          // console.log("Data check is not passed.");
          $log.warn("Entered data is not valid.");
          myModalWindowService.showModal("type4");
        }
      }
  }
])
adminModule.service('allUsersDetailsModel', ['allUsersDetailsService', '$q',
	function(allUsersDetailsService , $q){
		var allUsersDetails = {};
		function deleteUser(login){
			var deferred = $q.defer();
			allUsersDetailsService.deleteUser(login).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}
			)
			return deferred.promise;
		}
		// login cann't be updated
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			allUsersDetailsService.updateUser(login, password, name, age, date, oldLogin).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}			
			);
			return deferred.promise;
		};
		function getDetails(){
			var deferred = $q.defer();			
			allUsersDetailsService.getAllUsersDetails().then(
				function successCallback(details){			
					allUsersDetails = {};
					_.forEach(details.usercredits, function (value, key){
						allUsersDetails[key] = {};
						allUsersDetails[key].login = key;
						allUsersDetails[key].password = value.password;
						allUsersDetails[key].name = details.userdata[key].name;
						allUsersDetails[key].age = details.userdata[key].age;
						allUsersDetails[key].date = details.userdata[key].date;
					})
					// console.log( " ++ alldetails ++ " + JSON.stringify(allUsersDetails ));
					deferred.resolve(allUsersDetails);
				} , function errorCallback(error){
					console.log("Cann't load details to all users.");
					allUsersDetails = {};
					deferred.reject(allUsersDetails);
				}
			)
			return deferred.promise;
		}
		return {
			getDetails: getDetails,
			updateUser: updateUser,
			deleteUser: deleteUser,
			addUser : updateUser
		}
	}
])
adminModule.factory('allUsersDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;

		// function addNewUser(login, password, name, age, date){
			// function 'updateUser' is used in this case
		// }

		function deleteUser(login){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/deleteuser',
				data: {
					userdeletelogin : login
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden. Status: " + error.status);	
				// console.log(" why : " + JSON.stringify(error));
				deferred.reject(error.status);
			})
			return deferred.promise;
		}
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/updateuserdata',
				data: {
					login : login, 
					password : password, 
					name : name, 
					age : age , 
					date : date,
					oldlogin : oldLogin
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden.");				
				deferred.reject();
			})
			return deferred.promise;
		}
		function getAllUsersDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/getusersdata'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				// console.log("error. unauthorised ? ");
				console.log("Action is forbidden.");	
				// show modal 

				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getAllUsersDetails : getAllUsersDetails,
			updateUser : updateUser,
			deleteUser : deleteUser
		}
	}
])
dashboardModule.factory('loadChartDataService', [ '$http', '$q', 
	function($http, $q){

		return {
			loadData : function(urlstream){
				var deferred = $q.defer();
				var urlString = urlstream.toString(urlstream);
				$http({
					method : 'POST',
					url : urlString
				}). then( function successCallback(response){
					deferred.resolve(response.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				})
				return deferred.promise;
			}
		}
	}])
feedbackModule.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
feedbackModule.factory('feedbackService', ['$uibModal', '$http', '$q',
	function($uibModal, $http, $q){
		function sendFeedback(from, to, content){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/feedback/send',
				data: {
					"from" : from,
					"to" : to,
					"content" : content
				}
			}).then( function successCallback(details){
					deferred.resolve(details.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				}
			)
			return deferred.promise;			
		}
		return {			
			sendFeedback : sendFeedback
		}
	}
])
tabTwoModule.factory('updateUserDetailsService', ['$http', '$q', 
	function($http, $q){
		function updateUserDetails(json){
			var deferred = $q.defer();
			$http({
				method : 'POST',
				url: '/app/updateuserdetails',
				data: json
			}).then(function successCallback(response){
					// ok
					deferred.resolve(response.data);
				}, function errorCallback(error){
					// error
					deferred.reject(error);
				}
			)
			return deferred.promise;
		}
		return {
			updateUserDetails : updateUserDetails
		}
	}
])

var adminAddUserModalModule = angular.module('AdminAddUserModalModule',
	[]);

adminAddUserModalModule.controller('AdminAddUserModal', 
  [ '$translate', '$uibModalInstance',  
  	'userCreditsStorage',
  function($translate, $uibModalInstance,  
  	userCreditsStorage) {     
   	this.submit = function(){
  		// read input data 
  		var resultData = {
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var adminDeleteUserModalModule = angular.module('AdminDeleteUserModalModule',
	[]);

adminDeleteUserModalModule.controller('AdminDeleteUserModal', 
  [ '$scope', '$translate', '$uibModalInstance', 'userLoginDelete',
  function( $scope, $translate, $uibModalInstance, userLoginDelete) {     
    var deleteFlag = false;
    this.userLoginDelete = userLoginDelete;
   	this.submit = function(){
  		//this.userdetails.login
      deleteFlag = true;
  		close(deleteFlag);
  	}
  	this.cansel = function(){
  		close(deleteFlag);
  	}
    function close(deleteFlag) {     
      $uibModalInstance.close({deleteFlag : deleteFlag});      
    };
}]);

var adminUpdateUserModalModule = angular.module('AdminUpdateUserModalModule',
	[]);

adminUpdateUserModalModule.controller('AdminUpdateUserModal', 
  [ '$scope', '$uibModalInstance', 'userDetails', 
  	'userCreditsStorage',
  function( $scope, $uibModalInstance, userDetails, 
  	userCreditsStorage) {     
    // make clone to avoid unexpected changing
  	this.userdetails = _.clone(userDetails);
   	this.logindisabled = false;
		if ( String(userCreditsStorage.getUserCredits().login) === userDetails.login){
			this.logindisabled = true;
		}
  	this.submit = function(){
  		// read input data 
  		var resultData = {        
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var diagramModule = angular.module('DiagramModule',[]);

diagramModule.controller('DiagramController', [ '$scope', '$state', 
  '$interval', 'ChartHelperService',
  function($scope, $state, $interval, ChartHelperService){
    var thisPointer = this;    
    var graphs = this.graphs;
    var svgtexts = this.svgtext;

    // object (streams, properties) from 'dashboardController'           
    this.mainwidth = this.chartOptions.properties.mainWidth;
    this.mainheight = this.chartOptions.properties.mainHeight;
       
    // initial data for graph object of chart
    var graphObjects = {};   
    // main data storage (from here polyline is drawn)
    var data = {};   
    // flag for first start graphObjects
    var firstStartGraphObjects = true; 
    var enableStep = false;
    var watcherOne = $scope.$watch( function(){return thisPointer.chartOptions.streams}, 
      function(newValue, oldValue){        
        enableStep = false;
        // init graphObjects if it isn't inited
        if (_.isEmpty(graphObjects)){
          if (!_.isEmpty(thisPointer.chartOptions.streams)){
            _.forEach(thisPointer.chartOptions.streams, function(value, key){ 
              graphObjects[key] = {
                "id": key,
                "color": value["color"],
                "aproximatecolor": value["aproximatecolor"]
              }
            })
            ChartHelperService.init(graphObjects, thisPointer.chartOptions);
          }
        }
        _.forEach(graphObjects, function(value, key){
          if(!data[key]){
            data[key] = {};
            data[key].id = key;
            data[key].color = value.color;
            data[key].data = {};
          }
          if(thisPointer.chartOptions.streamsProperties[key].updateStep > 0){
            enableStep = true;
          }
        })
        if (enableStep){
          ChartHelperService.makeStep(data, thisPointer.chartOptions);
        }
        // get calculated datas and send it to draw        
        thisPointer.graphs = ChartHelperService.getGraph();
        thisPointer.svgtexts = ChartHelperService.getText();
        thisPointer.notches = ChartHelperService.getNotch();
      },
      true
    );
    $scope.$on('$destroy', function(){
        watcherOne();
      }
    ); 
  }
])
diagramModule.factory('ChartHelperService', [
	function(){
    var graphs = {};   
    var svgTexts = {};
    var notches = {};

    var graphObjects = {};     
    var heightStep = 1;     // 'y' - height step to draw chart (float)
    var maxHeightValue = 1;    // max height value2             (int)
    var minHeightValue = 0; // min height value2                (int)
    // var step = 1;             // 'x' step to draw chart         (int)      
    var idsArray = [];
    var idsAproxAray = [];
    var idsAllArray = [];
    var _strAprox = "aprox";
    // id value and generator for objects 'data' in 'graph'
    var _idCounter = 0;
    function _idGenerator(){
      return ++_idCounter;
    }
    // available dimensions for drawing chart
    var availableMainHeight;
    var availableMainWidth;
    // symbol dimensions:
    var oneSymbolWidth = 8; // 10 px
    var oneSymbolHeight = 14; // 14 px
    // object of initial data for chart
    var chartOptions;
    // init function for helper.
    function init(graphObj, chartOpt){
      graphObjects = graphObj;
      chartOptions = chartOpt;
      if( _.isEmpty(chartOptions.streams)){
          console.log(" - object 'chartOptions.streams' is empty")
        } else {
          // init availableMainHeight and 
          availableMainHeight = chartOptions.properties.mainHeight - 
            (chartOptions.properties.paddingYTop + chartOptions.properties.paddingYBottom);
          availableMainWidth = chartOptions.properties.mainWidth - 
            (chartOptions.properties.paddingXLeft + chartOptions.properties.paddingXRight);

          _.forEach(chartOptions.streams, function(value, key){
            if (_.indexOf(idsArray, value.id) < 0){
              idsArray.push(value.id);
              idsAllArray.push(value.id);
              // init graph
              if (!graphs[key]){
                graphs[key] = {};
                graphs[key].id = value.id;
                graphs[key].color = value.color;
                graphs[key].aproximatecolor = value.aproximatecolor;
                graphs[key].data = {}; 
                graphs[key].pointstodraw = '';
                graphs[key].lastXValue = 0;
                notches.lastNotchValue = chartOptions.properties.notchXStartValue;
                notches.beginNotchX = chartOptions.properties.paddingXLeft;
              } 
            } //else { do nothing }
          })        
        }
      // console.log(" chartOptions " + JSON.stringify( chartOptions) );
    }

    function makeStep(data){
      var calculatedXMoveLeftStep = 0;
      var maxLastXValue = 0;      
      maxLastXValue = findMaxXValue();
      moveXToLeft();
      addNewDataY();
      findMaxAndMinY();      
      calculateAproximateLine();
      calculateNewPointY(); 
      drawRim();
      makeAxises();
      // functions :
      function findMaxXValue(){
        // look for value of 'maxLastXValue'
        _.forEach(graphObjects, function(value, key){
          if( graphs[key].lastXValue > maxLastXValue){
            maxLastXValue = graphs[key].lastXValue;
          }
        });
        return maxLastXValue;             
      }
      function moveXToLeft(){
        // array for data which should be deleted
        var dataIdToDelete = [];
        if( (maxLastXValue ) > availableMainWidth ){
          calculatedXMoveLeftStep = maxLastXValue  - availableMainWidth;
          // move previous data to left border on required value - calculate it
          var newBeginNotchX = notches.beginNotchX + (chartOptions.properties.updateXStep - calculatedXMoveLeftStep);
          notches.beginNotchX = newBeginNotchX;
          notches.lastNotchValue += chartOptions.properties.notchXStep;

          _.forEach(graphObjects, function(value, key){
            var newlastXValue = graphs[key].lastXValue - (calculatedXMoveLeftStep);            
            graphs[key].lastXValue = newlastXValue < 0  ? 0 : newlastXValue;
            var paddingXLeft = chartOptions.properties.paddingXLeft;
            _.forEach(graphs[key].data, function(value2, key2){              
                var flagToDelete = true;
                var idPointToDelete = -1;                
                for (var i=0; i < value2.dataY.length; i++){
                  // move left dataX value                  
                  value2.pointX[i] -= calculatedXMoveLeftStep;
                  graphs[_strAprox+key].data[key2].pointX[i] -= calculatedXMoveLeftStep;
                  if( value2.pointX[i] <= paddingXLeft){
                    idPointToDelete = i;
                  }
                  if (value2.pointX[i] > paddingXLeft){
                    flagToDelete = false;
                  }
                }
                // check if current dataObj all pointX < 0
                if(flagToDelete){
                  dataIdToDelete.push(key2);
                } else {
                  if (idPointToDelete >=0){
                    value2.dataY = _.drop(value2.dataY, 1+idPointToDelete);
                    value2.pointX = _.drop(value2.pointX, 1+idPointToDelete);
                    value2.pointY = _.drop(value2.pointY, 1+idPointToDelete);
                    value2.points = _.drop(value2.points, 1+idPointToDelete);
                    value2.stepPointsAmount -= idPointToDelete;
                    graphs[_strAprox+key].data[key2].dataY = _.drop(graphs[_strAprox+key].data[key2].dataY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointX = _.drop(graphs[_strAprox+key].data[key2].pointX, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointY = _.drop(graphs[_strAprox+key].data[key2].pointY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].points = _.drop(graphs[_strAprox+key].data[key2].points, 1+idPointToDelete);
                  }
                }                              
            })
            // delete dataObj with all pointX < 0
            _.forEach(dataIdToDelete, function(value3){
              delete graphs[key].data[value3];
              delete graphs[_strAprox+key].data[value3];
            })
            dataIdToDelete = [];
          })
        };             
      }

      function addNewDataY(){
        _.forEach(graphObjects, function(value, key){
          // amount of points in current step
          var tempUpdateStep = _.clone(chartOptions.streamsProperties[key].updateStep);          
          // add new points to graphs[key].lastXValue
          if(tempUpdateStep > 0){
            // increase lastXValue
            graphs[key].lastXValue += chartOptions.properties.updateXStep;
            // set to zero 'updateStep' in 'streamsProperties'
            chartOptions.streamsProperties[key].updateStep = 0;
            // process it
            if(tempUpdateStep > 0 ){
              var tempId = _idGenerator();
              // create object 'data' : graphs[key].data[tempId]
              graphs[key].data[tempId] = {};
              // get amount 'tempUpdateStep' last data from the stream
              var tempArray = _.takeRight(chartOptions.streams[key].data, tempUpdateStep);
              graphs[key].data[tempId].dataY = _.cloneDeep(tempArray);
              graphs[key].data[tempId].pointX = [];
              graphs[key].data[tempId].pointY = [];
              graphs[key].data[tempId].points = [];
              // amount of points in current step
              graphs[key].data[tempId].stepPointsAmount = tempUpdateStep;
              // length of current step per point (round to 0.001)
              graphs[key].data[tempId].stepX = 
                _.round(chartOptions.properties.updateXStep / tempUpdateStep , 3);
              
              var tempLastXValue = graphs[key].lastXValue - chartOptions.properties.updateXStep;
              for (var i=0; i < tempUpdateStep; i++){
                graphs[key].data[tempId].pointX[i] = chartOptions.properties.paddingXLeft +
                  tempLastXValue + graphs[key].data[tempId].stepX * i;
              }
            }
          }
        });        
      }
      
      function findMaxAndMinY(){
        var currentMinHeight = 0;
        var currentMaxHeight = 0;   
        _.forEach(graphObjects, function(value, key){           
          // calculate height step (look through all datas in graph)
          _.forEach(graphs[value.id].data, function(value2, key2){
              _.forEach(value2.dataY, function(value3, key3){
                var tempValue3 = parseInt(value3)
                if (currentMinHeight > tempValue3){
                  currentMinHeight = tempValue3;
                }
                if (minHeightValue > tempValue3){
                  minHeightValue = tempValue3;
                }
                if (currentMaxHeight < tempValue3){
                  currentMaxHeight = tempValue3;
                }
                if (maxHeightValue < tempValue3){
                  maxHeightValue = tempValue3;
                }
                // correct global max and min value
                if (minHeightValue < currentMinHeight){
                  minHeightValue++;
                }
                if (maxHeightValue > currentMaxHeight){
                  maxHeightValue--;
                }                
              })
          });
        });        
        // calculate heightstep
        heightStep = _.round(availableMainHeight / (maxHeightValue + Math.abs(minHeightValue)) , 9);
      }
      
      //calculate aproximate line and add it to graph
      function calculateAproximateLine(){
        var aproximateRatePercent = 21;
        _.forEach(graphObjects, function(value, key){
            if( !graphs[_strAprox+key]) {
              graphs[_strAprox+key] = {};
              graphs[_strAprox+key].pointstodraw = '';
              graphs[_strAprox+key].data = {};
              graphs[_strAprox+key].color = graphObjects[key].aproximatecolor;
            }
            _.forEach(graphs[key].data, function(value3, key3){              
              if ( ! graphs[_strAprox+key].data[key3] ) { // if undefined
                graphs[_strAprox+key].data[key3] = {};
                graphs[_strAprox+key].data[key3].dataY = [];
                graphs[_strAprox+key].data[key3].pointX = [];
                graphs[_strAprox+key].data[key3].pointY = [];
                graphs[_strAprox+key].data[key3].points = [];
                // calculate aproximate line                
                  if (value3.stepPointsAmount > 2){
                    // find aproximate rate of data in current step                     
                    // callculate available aproximate rate
                    var aproximateRate = Math.round((aproximateRatePercent/100) * (value3.stepPointsAmount));
                    if (aproximateRate < 2) {
                      aproximateRate = 2;
                    }
                    var aproximateBegin = Math.floor(aproximateRate/2);
                    var aproximateEnd = Math.ceil(aproximateRate/2);                    
                    // calculate aproximate dataY
                    for (var i=aproximateBegin; i < (value3.stepPointsAmount - aproximateEnd); i++){
                      var point;    
                      var currentPoint = 0;
                      var a = 0;
                      var b = 0;                             
                      var sumXY = 0;
                      var sumX = 0;
                      var sumY = 0;
                      var sumX2 = 0;               
                      for (var j= 0-aproximateBegin; j<aproximateEnd; j++ ){
                        sumXY += (i+j)*graphs[key].data[key3].dataY[i+j];
                        sumX += (i+j);
                        sumY += graphs[key].data[key3].dataY[i+j];
                        sumX2 += (i+j)*(i+j);
                      }
                      a = (aproximateRate*sumXY - sumX*sumY) / ( aproximateRate * sumX2 - sumX*sumX);
                      b = (sumY - a * sumX) / aproximateRate;
                      // calculate begin of data
                      if ( i === aproximateBegin){
                        // save beginner point
                        graphs[_strAprox+key].data[key3].dataY[0] = graphs[key].data[key3].dataY[0]; 
                        graphs[_strAprox+key].data[key3].pointX[0] = graphs[key].data[key3].pointX[0];
                        graphs[_strAprox+key].data[key3].pointY[0] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[0] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[0] + 
                          "," + graphs[_strAprox+key].data[key3].pointY[0];
                        graphs[_strAprox+key].data[key3].points.push(point);
                        if(aproximateBegin > 1){
                          for (var n=1; n < aproximateBegin; n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } // else { do nothing }
                      }    
                      // calculate aproximated valiu in current point
                      currentPoint = _.round( (a * i + b) , 3);
                      if (!isNaN(currentPoint)){
                        graphs[_strAprox+key].data[key3].dataY[i] = currentPoint; 
                        graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                        graphs[_strAprox+key].data[key3].pointY[i] = 
                          (availableMainHeight + chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                        graphs[_strAprox+key].data[key3].points.push(point);
                      }
                      var tempStepPointsAmount = value3.dataY.length;
                      // calculate end of data
                      if ( i === (tempStepPointsAmount - aproximateEnd -1) ){
                        var end = tempStepPointsAmount -1;
                        if( tempStepPointsAmount - aproximateEnd > 1){
                          for (var n = (end - aproximateEnd + 1); n < (end ); n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                                chartOptions.properties.paddingYTop - 
                                (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } else{ }
                          // end point from received data
                          graphs[_strAprox+key].data[key3].dataY[end] = graphs[key].data[key3].dataY[end]; 
                          graphs[_strAprox+key].data[key3].pointX[end] = graphs[key].data[key3].pointX[end];
                          graphs[_strAprox+key].data[key3].pointY[end] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[end] + 
                              Math.abs(minHeightValue))));
                          point = graphs[_strAprox+key].data[key3].pointX[end] + "," + graphs[_strAprox+key].data[key3].pointY[end];
                          graphs[_strAprox+key].data[key3].points.push(point);                        
                      }
                    }                  
                    // graphs[_strAprox+key].pointstodraw = String.concat(graphs[_strAprox+key].pointstodraw, 
                    //         " ",
                    //         graphs[_strAprox+key].data[key3].points.join(' ') );
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw +  
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
                  else{
                    // copy points from original data
                    for (var i=0; i < (graphs[key].stepPointsAmount); i++){
                      graphs[_strAprox+key].data[key3].dataY[i] = currentPoint;  
                      graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                      graphs[_strAprox+key].data[key3].pointY[i] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                      point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                      graphs[_strAprox+key].data[key3].points.push(point);
                    }    
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw + 
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
              }
            })    
        }) 
      }

      function calculateNewPointY(){
        // calculate 'point to draw'
        _.forEach(graphObjects, function(value, key){ 
          graphs[key].pointstodraw = '';
          graphs[_strAprox+key].pointstodraw = '';
          var firstFlag = true;
          _.forEach(graphs[key].data, function(value2, key2){
            for(var i=0; i < value2.dataY.length; i++){
              value2.pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              value2.points[i] = value2.pointX[i] + "," + value2.pointY[i];
              graphs[_strAprox+key].data[key2].pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[_strAprox+key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              graphs[_strAprox+key].data[key2].points[i] = 
                graphs[_strAprox+key].data[key2].pointX[i] + 
                "," + 
                graphs[_strAprox+key].data[key2].pointY[i];
            }
            // add pointstodraw to 'value.pointstodraw'
            if(firstFlag){
              graphs[key].pointstodraw
            }
            graphs[key].pointstodraw = 
              String(graphs[key].pointstodraw +  
              ' ' + 
              graphs[key].data[key2].points.join(' '));
            graphs[_strAprox+key].pointstodraw = 
              String(graphs[_strAprox+key].pointstodraw + 
              ' ' +
              graphs[_strAprox+key].data[key2].points.join(' '));            
          });          
        });        
      }

      // object to keep notches, which should be deleted from view
      var notchesToDelete = {};  
      function makeAxises( ){
        var zeroLine = calculateZeroLine();
        var zeroLineGraph = zeroLine.getLine();
        var zeroLineText = zeroLine.getText();
        var zeroNotch = zeroLine.getNotch();
        // copy previous lines delete old lines after
        notchesToDelete = _.cloneDeep(notches);    
        delete notchesToDelete.lastNotchValue;        // little fix. it should stay in obj 'notches'
        delete notchesToDelete.beginNotchX;           // little fix. it should stay in obj 'notches'
        svgTextToDelete = _.cloneDeep(svgTexts);        
        calculateYNotches();
        calculateXNotches(); 
        // clean 'notches' to delete
        if ( !_.isEmpty(notchesToDelete)){
          _.forEach(notchesToDelete, function(value, key){ 
            console.log(" Notch to delete (id): " + value.id);   //
            delete notches[value.id];                 
          })
          // reset linesToDelete obj;
          notchesToDelete = {};
        } 
        if ( !_.isEmpty(svgTextToDelete)){
          _.forEach(svgTextToDelete, function(value, key){
            delete svgTexts[value.id];
          })               
          svgTextToDelete = {};
        }
        // add zero line
        graphs[zeroLineGraph.id] = zeroLineGraph;
        svgTexts[zeroLineText.id] = zeroLineText;
        notches[zeroNotch.id] = zeroNotch;
      };

      function calculateXNotches(){
          var xNotchString = "xNotch";   // id name word
          // for xNotch from 'paddingXLeft' to 'paddingXLeft + availableMainWidth'
          var paddingXLeft = chartOptions.properties.paddingXLeft;
          var notchWidth = chartOptions.properties.notchYWidth;
          var coordinateX = notches.beginNotchX;
          var y = chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom;
          var notchStep = chartOptions.properties.notchXStep;         
          for (var i=0; ((i<25) && (coordinateX < (paddingXLeft + availableMainWidth))); i++ ){
              var notch = {
                "id" : (xNotchString+i),
                "x1" : (coordinateX),
                "y1" : (y),
                "x2" : (coordinateX),
                "y2" : (y + notchWidth),
                "col" : "#1f1f1f",
                "width" : 1
              }
              // notches.lastNotchValue
              var textVal = String.toString(notches.lastNotchValue);
              var text = {
                  "id" : (xNotchString+i),
                  "text" : (notches.lastNotchValue + i*notchStep) ,
                  "x" : (coordinateX),
                  "y" : (y + notchWidth + oneSymbolHeight) ,
                  "col" : "#F44336"
                };
              notches[notch.id] = notch;
              delete notchesToDelete[notch.id];
              coordinateX += chartOptions.properties.updateXStep;
              svgTexts[text.id] = text;
              delete svgTextToDelete[text.id];
          }
      }

      // the least size between lines - 20 px
      function calculateYNotches(){
        // calculate amount of above 0x lines
        var availableNotchSteps = [5, 25, 50, 100, 500, 1000];
        var notchStringAbove = "aboveNotchX";
        var notchStringUnder = "underNotchX";        
        calculateNotchFor("+" , notchStringAbove, 1, maxHeightValue);
        calculateNotchFor("-" , notchStringUnder, -1, Math.abs(minHeightValue));
        // internal function. Is used only here
        function calculateNotchFor(sign , name, direction, heightValue){
          _.forEach(availableNotchSteps, function(value, key){
            var amount =  _.floor(heightValue / value) ;
            if( amount > 0){
              if (heightStep*value > 20){
                for(var i=1; i < (amount+1); i++){
                    var y = (chartOptions.properties.mainHeight - 
                      chartOptions.properties.paddingYBottom - 
                      Math.abs(minHeightValue*heightStep) -
                      direction*heightStep*value*i
                      );
                    var notch = {
                      "id" : (value+name+i),
                      "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
                      "y1" : (y),
                      "x2" : (chartOptions.properties.paddingXLeft),
                      "y2" : (y),
                      "col" : "#1f1f1f",
                      "width" : 1
                    }
                    var textVal = sign+value*i;
                    var text = {
                      "id" : (value+name+i),
                      "text" : (textVal) ,
                      "x" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth - (oneSymbolWidth * textVal.length)),
                      "y" : (y - 1) ,
                      "col" : "#F44336"
                    }
                    notches[notch.id] = notch;
                    delete notchesToDelete[notch.id];
                    svgTexts[text.id] = text;
                    delete svgTextToDelete[text.id];
                  }
              }
            };
          });
        }        
      };

      function calculateZeroLine( ){
        return {
          getLine : function (){
            return{
              "id":"0xaxis",
              "color": "#808080",
              "data": [ ],
              "pointstodraw": (chartOptions.properties.paddingXLeft) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) + 
                  " " + 
                  (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep))
            }
          },
          getText : function (){
            return {
              "text" : "0",
              "x" : (chartOptions.properties.paddingXLeft - oneSymbolWidth - chartOptions.properties.notchXWidth),
              "y" : (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) ,
              "col" : "#F44336"
            }
          },
          getNotch : function (){            
            var y = (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep));
            return {
              "id":"0xaxis",
              "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
              "y1" : (y),
              "x2" : (chartOptions.properties.paddingXLeft),
              "y2" : (y),
              "col" : "#1f1f1f",
              "width" : 1
            }
          }
        }
      };

      // draw rim around the chart
      function drawRim(){
        var rim = {
          "id":"rim",
          "color": "#4E342E",
          "data": [ ],
          "pointstodraw": (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) + 
              " " + 
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) +
              " " +
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom)
        }
        graphs[rim.id] = rim;
      };  
    }  
    function getGraph(){
      return graphs;
    }
    function getText(){
      return svgTexts;
    }
    function getNotch(){
      return notches;
    }
    return {
      makeStep : makeStep,
      getGraph : getGraph,
      getText : getText,
      getNotch : getNotch,
      init : init
    }
  }
])
diagramModule.directive('mychart', [ 
  function(){
    
    return {
      restrict: 'E',
      controller: 'DiagramController',
      controllerAs: 'chart',
      templateUrl: 'app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html',       
      bindToController: {          
        chartOptions: '=chartOptions' 
      },   
      link: function (scope, element, attr, ctrl){        
        var chartAllPoints = attr.chartAllPoints;       
      }
    }
  }
])

var feedbackModalModule = angular.module('FeedbackModalModule',
	[]);


feedbackModalModule.factory('feedbackModalService', ['$uibModal', '$q',
	function($uibModal, $q){
		var dataString = "";
		function openModal(dataStr){
			var deferred = $q.defer();
			dataString = dataStr;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",
	  			controller: function($uibModalInstance){
	  				this.datamessage = dataString;
	  				console.log("  dataString   " + dataString);
	  				this.submit = function(){
	  					close(dataString);
	  				};
	  				function close(result) {     
				      $uibModalInstance.close(result);      
				    }
	  			},
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){ 	  			
				deferred.resolve(result);  				
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            deferred.reject(error);
	  		})
	  		return deferred.promise;
		}
		return {
			openModal : openModal
		}
	}
])
var loadMaskModule=angular.module("LoadMaskModule",[]),ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(e,t,a,o){e.close=function(e){o.close()}}]);var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Root"),r.value?(i.info("User session is valid. Available to show dashboard."),o.go("root.main.dashboard")):(i.info("User session isn't valid. Redirect to loginpage."),o.go("root.login")),e.getAvailableLanguages().then(function(e){d.languages=e,d.selectedLanguage=t.DEFAULT_LANG},function(e){i.warn("Error while download languages. Set to use default: "+t.DEFAULT_LANG),d.languages={1:{code:t.DEFAULT_LANG,name:t.DEFAULT_LANG_NAME}},d.selectedLanguage=t.DEFAULT_LANG}),d.translate=function(){i.info("User select language: "+d.selectedLanguage),a.use(d.selectedLanguage)}}]);var appDecorators=angular.module("appDecorators",[]),appDirectives=angular.module("appDirectives",[]),appProviders=angular.module("appProviders",[]),appServices=angular.module("appServices",[]);loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(e,t,a,o){}}}]),loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(e){function t(){e.removeClass("myloadmask","hidden")}function a(){e.addClass("myloadmask","hidden")}return{activateLoadMask:t,deactivateLoadMask:a}}]),ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(e,t){function a(a){if(!o){o=!0;var n=!0,r=t.$new(n);r.errortype="errormodalwindow.message."+a;var i=e.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:r});i.result.then(function(){o=!1,r.$destroy()},function(e){console.log("Modal window error: "+e),o=!1})}}var o=!1;return{showModal:a}}]),rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,t,a){function o(){var a=t.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),a.resolve(e.data)},function(e){console.log(" load languages.json error."),a.reject(e)}),a.promise}return{getAvailableLanguages:o}}]),app.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),app.config(["$provide",function(e){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},a=function(e,t){var a=new String(e);for(var o in t)a=a.replace("{"+o+"}",t[o]);return a};e.decorator("$log",["$delegate",function(e){function o(){var e=new Date,t=String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds());return t}function n(){var e=new Date,a=e.getDate(),o=e.getMonth()+1;a=a<10?new String("0"+a):new String(a),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var n=new String(a+"-"+monthStr+"-"+e.getFullYear());return n}function r(e,t){function r(e,t,r){return function(){var e=String(o()+" "+n()),i=arguments[0]?new String(arguments[0]):"";r=r?r:"",console[t](a("{0} - {1} {2} ",[e,r,i]))}}return e.log=r(e,"log",t),e.info=r(e,"info",t),e.warn=r(e,"warn",t),e.debug=r(e,"debug",t),e.error=r(e,"error",t),e}return e.getInstance=function(t){t=void 0!==t?t:"",e=r(e,t)},e}])}]),appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.agevalidator(o);return n?(i.$setValidity("ageFormat",!0),t.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("ageFormat",!1),t.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.datevalidator(o);return n?(i.$setValidity("dateFormat",!0),t.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("dateFormat",!1),t.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.namevalidator(o);return n?(i.$setValidity("nameFormat",!0),t.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("nameFormat",!1),t.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}}),appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,t,a,o){function n(e,a){var n=t.defer();return o.login(e,a).then(function(e){access=!0,n.resolve(e)},function(e){n.reject(!1)}),n.promise}function r(){var a=t.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){d=e.data,console.log("Session is valid."),a.resolve(e.data)},function(e){d=null,console.log("Session not valid."),a.reject(e)}),a.promise}function i(){var e=t.defer();return a.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(a.getUserCredits())):r().then(function(t){console.log("provide userCredits from post request"),a.setUserCredits(t),e.resolve(t)},function(t){console.log("Cann't get user credits details."),a.setUserCredits(null),e.reject(t)}),e.promise}var d;return{checkCredentials:n,checkSession:r,getUserCredits:i}}]),appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,t){angular.element(document.querySelector("."+e)).addClass(t)},removeClass:function(e,t){angular.element(document.querySelector("."+e)).removeClass(t)}}}]),appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]),appServices.factory("monthesStorage",["$http","$q",function(e,t){function a(){var a=t.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){a.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),a.reject("Cann't receive date.json file.")}),a.promise}function o(){return void 0!==r?r:void i.then(function(e){return console.log(" Loading monthes from server."),r=e},function(e){r=void 0,console.log("Error in downloading monthes. "+e)})}function n(e){return e%4===0&&(e%100!==0||e%400===0)}var r,i=a();return{getMonthes:o,checkLeapYear:n}}]),appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(t){console.log("set credits in storage: "+e),e=t},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}}),appServices.factory("userDataStorage",function(){var e={};return{setUserData:function(t,a){e[a]=t},getByKeyUserData:function(t){return e[t]},getAllUserData:function(){return e},removeAll:function(){e=null,e={}}}}),appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(){var o=t.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,o.resolve(n)},function(e){console.log("error. unauthorised ? "),a.setUserCredits(null),o.reject(e.data)}),o.promise}var n=null;return{getUserDetails:o}}]),appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(e,t){var a,o=e.NAME_VALIDATOR.NAME_REGEX,n=e.AGE_VALIDATOR.MIN_AGE,r=e.AGE_VALIDATOR.MAX_AGE,i=e.AGE_VALIDATOR.AGE_REGEX,d=e.DATE_VALIDATOR.DATE_REGEX,s=e.DATE_VALIDATOR.SEPARATOR,l=e.DATE_VALIDATOR.MIN_YEAR,c=e.DATE_VALIDATOR.MAX_YEAR,u=e.DATE_VALIDATOR.FEBRUARY_NUMBER,p=e.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,f=e.DATE_VALIDATOR.NUMBER_YEAR,g=e.DATE_VALIDATOR.NUMBER_MONTH,h=e.DATE_VALIDATOR.NUMBER_DAY,m=null,v=0;return{namevalidator:function(e){var t=!1;return t=!!o.test(e)},agevalidator:function(e){var t=!1;return t=!!(e<=r&&e>=n&&i.test(e))},datevalidator:function(e){var o=!1;return a=t.getMonthes(),d.test(e)?(m=e.split(s),m[f]>l&&m[f]<c?(v=m[g]===u&&t.checkLeapYear(m[f])?p:a[m[g]].days,o=m[h]<=v&&m[h]>0):o=!1):o=!1,o}}}]);var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,t,a,o,n){n.getInstance("CheckSession"),a.getUserCredits().then(function(t){n.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(t){n.info("User session isn't valid. Redirect to loginpage."),o.showModal("type2"),e.go("root.login")})}]);var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Login"),r.activateLoadMask(),a.getUserCredits().then(function(e){var a=e.admin;i.info("User check session success."),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!a})},function(e){i.warn("User check session fail."),r.deactivateLoadMask(),t.go("root.login")}),d.submit=function(){var e=d.login,s=d.password;null!==e&&void 0!==e&&""!==e&&null!==s&&void 0!==s&&""!==s?(d.password=null,r.activateLoadMask(),a.checkCredentials(e,s).then(function(a){i.info("User login success.");var n=a.admin;o.setUserCredits({login:e,admin:!!n}),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!n})},function(e){i.warn("User login fail."),r.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,r.deactivateLoadMask(),n.showModal("type1"))}}]);var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;d.isFeedback=!d.isAdmin,a.getUserCredits().then(function(e){d.login=e.login,d.isAdmin=e.admin,d.isFeedback=!d.isAdmin},function(t){e.go("root.login")}),d.logout=function(){r.activateLoadMask(),t.removeAll(),o.logout().then(function(t){i.info("User logout success."),r.deactivateLoadMask(),e.go("root.login")},function(e){i.warn("User logout fail."),r.deactivateLoadMask(),n.showModal("type3")})},d.go=function(t){i.info("User change state to :"+t),e.go(t)}}]),loginModule.service("loginService",["$q","$http",function(e,t){function a(a,o){var n=e.defer();return t({method:"POST",url:"/app/login",data:{login:a,password:o}}).then(function(e){n.resolve(e.data)},function(e){n.reject(!1)}),n.promise}e.defer();return{login:a}}]),tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,t,a,o){function n(){o.removeAll();var n=t.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),a.setUserCredits(null),n.resolve(e.data)},function(e){console.log("Error while logout."),n.reject(e)}),n.promise}return{logout:n}}]);var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){function d(){r.activateLoadMask(),e.getDetails().then(function(e){i.info("Users data was loaded."),s.alldetails=e,l=e,r.deactivateLoadMask()},function(){r.deactivateLoadMask(),i.warn("Users data loading error."),n.showModal("type10")})}var s=this,l=null;i.getInstance("Admin"),d(),s.adduser=function(a,o,s,l,c){var u=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});u.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.addUser(t.login,t.password,t.name,t.age,t.date).then(function(){i.info("New user '"+t.login+"' was added."),r.deactivateLoadMask(),d()},function(){i.warn("User '"+t.login+"' creation error."),r.deactivateLoadMask(),n.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},s.update=function(a){var s=(o.getUserCredits().admin,t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return l[a]}}}));s.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.updateUser(t.login,t.password,t.name,t.age,t.date,a).then(function(){i.info("Update user. Submited data: "+JSON.stringify(t)),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be updated."),r.deactivateLoadMask(),n.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},s["delete"]=function(a){var o=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return a}}});o.result.then(function(t){t.deleteFlag&&(r.activateLoadMask(),e.deleteUser(a).then(function(){i.info("User was deleted."),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be deleted."),r.deactivateLoadMask(),n.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(e,t,a,o,n,r,i){function d(){angular.isDefined(h)&&(a.cancel(h),h=void 0)}function s(){i.deactivateLoadMask(),h=a(function(){l.chartOptions.properties=u,_.forEach(g,function(e,a){m[a]||(m[a]={},m[a].id=a,m[a].data=[],m[a].color=e.color,m[a].aproximatecolor=e.aproximatecolor,v[a]={},v[a].iswaitingload=!1,v[a].updateStep=0),v[a].iswaitingload||(v[a].updateStep=0,v[a].iswaitingload=!0,r.loadData(e.stream).then(function(e){v[a].updateStep=e.data.length,m[a].data=_.concat(m[a].data,e.data),v[a].iswaitingload=!1,l.chartOptions.streams[a]=m[a]},function(e){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+e)}))});var e=0;_.forEach(g,function(t,a){m[a].data.length>e&&(e=m[a].data.length),v[a].updateStep>M&&(M=v[a].updateStep)});var a=e-p;a>0&&_.forEach(g,function(e,t){m[t].data.splice(0,a)}),o.setUserData(m,"chartData"),o.setUserData(m,"chartDataProperties"),o.setUserData(u,"chartProperties"),l.chartOptions={streams:m,streamsProperties:v,properties:u}},f)}var l=this,c={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},u={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},p=u.mainWidth,f=u.updateTimeout,g={};_.forEach(c,function(e,t){g[t]={id:t,stream:e.stream,color:e.color,aproximatecolor:e.aproximatecolor}});var h,m={},v={},M=0;if(e.$on("$destroy",function(){d()}),_.isEmpty(m)){var S=o.getByKeyUserData("chartData");void 0!==S&&(m=_.cloneDeep(S),v=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),u=_.cloneDeep(o.getByKeyUserData("chartProperties"))),l.chartOptions={streams:m,streamsProperties:v,properties:u}}s()}]);var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,t,a,o,n,r){var i=this;o.getInstance("Feedback"),i.sendemail=function(){var e={from:i.name,to:i.email,content:i.textarea},d='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';r.openModal(d).then(function(e){a.activateLoadMask();var r={from:i.name,to:i.email,content:i.textarea},d=r.to.split(",");n.setContent(r.content),n.sendFromDecorator(r.from,d).then(function(e){a.deactivateLoadMask(),o.info("Feedback is sent."),i.name="",i.email="",i.textarea=""},function(e){a.deactivateLoadMask(),o.warn("Feedback cann't be sent."),t.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n){var r=this;n.getInstance("Tab one"),o.activateLoadMask(),t.getUserDetails().then(function(e){n.info("User data was downloaded."),r.userdetails=e,o.deactivateLoadMask()},function(t){n.warn("Error while downloading user data."),o.deactivateLoadMask(),a.showModal("type2"),e.go("root.login")})}]);var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,t,a,o,n,r,i,d){var s=this;d.getInstance("Tab two"),r.getMonthes(),i.activateLoadMask(),t.getUserDetails().then(function(e){d.info("User data was downloaded."),s.userdetails=e,s.newusername=e.name,s.newuserage=e.age,s.newuserdate=e.date,i.deactivateLoadMask()},function(t){d.warn("Error while downloading user data."),i.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),s.submit=function(){if(i.activateLoadMask(),n.namevalidator(s.newusername)&&n.agevalidator(s.newuserage)&&n.datevalidator(s.newuserdate)){var t={newusername:s.newusername,newuserage:s.newuserage,newuserdate:s.newuserdate};a.updateUserDetails(t).then(function(t){d.info("User data was updated."),i.deactivateLoadMask(),e.go("^.tab1")},function(e){d.warn("User data cann't be updated."),i.deactivateLoadMask(),o.showModal("type4")})}else i.deactivateLoadMask(),d.warn("Entered data is not valid."),o.showModal("type4")}}]),adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,t){function a(a){var o=t.defer();return e.deleteUser(a).then(function(e){o.resolve()},function(){o.reject()}),o.promise}function o(a,o,n,r,i,d){var s=t.defer();return e.updateUser(a,o,n,r,i,d).then(function(e){s.resolve()},function(){s.reject()}),s.promise}function n(){var a=t.defer();return e.getAllUsersDetails().then(function(e){r={},_.forEach(e.usercredits,function(t,a){r[a]={},r[a].login=a,r[a].password=t.password,r[a].name=e.userdata[a].name,r[a].age=e.userdata[a].age,r[a].date=e.userdata[a].date}),a.resolve(r)},function(e){console.log("Cann't load details to all users."),r={},a.reject(r)}),a.promise}var r={};return{getDetails:n,updateUser:o,deleteUser:a,addUser:o}}]),adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(a){var o=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:a}}).then(function(e){o.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),o.reject(e.status)}),o.promise}function n(a,o,n,r,i,d){var s=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:a,password:o,name:n,age:r,date:i,oldlogin:d}}).then(function(e){s.resolve()},function(e){console.log("Action is forbidden."),s.reject()}),s.promise}function r(){var o=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){i=e.data,o.resolve(i)},function(e){console.log("Action is forbidden."),a.setUserCredits(null),o.reject(e.data)}),o.promise}var i=null;return{getAllUsersDetails:r,updateUser:n,deleteUser:o}}]),dashboardModule.factory("loadChartDataService",["$http","$q",function(e,t){return{loadData:function(a){var o=t.defer(),n=a.toString(a);return e({method:"POST",url:n}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}}}]),feedbackModule.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,a){function o(e,o,n){var r=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:n}}).then(function(e){r.resolve(e.data)},function(e){r.reject(e)}),r.promise}return{sendFeedback:o}}]),tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function a(a){var o=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:a}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}return{updateUserDetails:a}}]);var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,t,a){function o(e){t.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};o(e)},this.cansel=function(){o({})}}]);var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,t,a,o){function n(e){a.close({deleteFlag:e})}var r=!1;this.userLoginDelete=o,this.submit=function(){r=!0,n(r)},this.cansel=function(){n(r)}}]);var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,t,a,o){function n(e){t.close(e)}this.userdetails=_.clone(a),this.logindisabled=!1,String(o.getUserCredits().login)===a.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};n(e)},this.cansel=function(){n({})}}]);var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(e,t,a,o){var n=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var r={},i={},d=!1,s=e.$watch(function(){return n.chartOptions.streams},function(e,t){d=!1,_.isEmpty(r)&&(_.isEmpty(n.chartOptions.streams)||(_.forEach(n.chartOptions.streams,function(e,t){r[t]={id:t,color:e.color,aproximatecolor:e.aproximatecolor}}),o.init(r,n.chartOptions))),_.forEach(r,function(e,t){i[t]||(i[t]={},i[t].id=t,i[t].color=e.color,i[t].data={}),n.chartOptions.streamsProperties[t].updateStep>0&&(d=!0)}),d&&o.makeStep(i,n.chartOptions),n.graphs=o.getGraph(),n.svgtexts=o.getText(),n.notches=o.getNotch()},!0);e.$on("$destroy",function(){s()})}]),diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(e,t,a,o){a.chartAllPoints}}}]),diagramModule.factory("ChartHelperService",[function(){function e(){return++S}function t(e,t){p=e,s=t,_.isEmpty(s.streams)?console.log(" - object 'chartOptions.streams' is empty"):(i=s.properties.mainHeight-(s.properties.paddingYTop+s.properties.paddingYBottom),d=s.properties.mainWidth-(s.properties.paddingXLeft+s.properties.paddingXRight),_.forEach(s.streams,function(e,t){_.indexOf(m,e.id)<0&&(m.push(e.id),v.push(e.id),l[t]||(l[t]={},l[t].id=e.id,l[t].color=e.color,l[t].aproximatecolor=e.aproximatecolor,l[t].data={},l[t].pointstodraw="",l[t].lastXValue=0,u.lastNotchValue=s.properties.notchXStartValue,u.beginNotchX=s.properties.paddingXLeft))}))}function a(t){function a(){return _.forEach(p,function(e,t){l[t].lastXValue>U&&(U=l[t].lastXValue)}),U}function o(){var e=[];if(U>d){T=U-d;var t=u.beginNotchX+(s.properties.updateXStep-T);u.beginNotchX=t,u.lastNotchValue+=s.properties.notchXStep,_.forEach(p,function(t,a){var o=l[a].lastXValue-T;l[a].lastXValue=o<0?0:o;var n=s.properties.paddingXLeft;_.forEach(l[a].data,function(t,o){for(var r=!0,i=-1,d=0;d<t.dataY.length;d++)t.pointX[d]-=T,l[M+a].data[o].pointX[d]-=T,t.pointX[d]<=n&&(i=d),t.pointX[d]>n&&(r=!1);r?e.push(o):i>=0&&(t.dataY=_.drop(t.dataY,1+i),t.pointX=_.drop(t.pointX,1+i),t.pointY=_.drop(t.pointY,1+i),t.points=_.drop(t.points,1+i),t.stepPointsAmount-=i,l[M+a].data[o].dataY=_.drop(l[M+a].data[o].dataY,1+i),l[M+a].data[o].pointX=_.drop(l[M+a].data[o].pointX,1+i),l[M+a].data[o].pointY=_.drop(l[M+a].data[o].pointY,1+i),l[M+a].data[o].points=_.drop(l[M+a].data[o].points,1+i))}),_.forEach(e,function(e){delete l[a].data[e],delete l[M+a].data[e]}),e=[]})}}function n(){_.forEach(p,function(t,a){var o=_.clone(s.streamsProperties[a].updateStep);if(o>0&&(l[a].lastXValue+=s.properties.updateXStep,s.streamsProperties[a].updateStep=0,o>0)){var n=e();l[a].data[n]={};var r=_.takeRight(s.streams[a].data,o);l[a].data[n].dataY=_.cloneDeep(r),l[a].data[n].pointX=[],l[a].data[n].pointY=[],l[a].data[n].points=[],l[a].data[n].stepPointsAmount=o,l[a].data[n].stepX=_.round(s.properties.updateXStep/o,3);for(var i=l[a].lastXValue-s.properties.updateXStep,d=0;d<o;d++)l[a].data[n].pointX[d]=s.properties.paddingXLeft+i+l[a].data[n].stepX*d}})}function r(){var e=0,t=0;_.forEach(p,function(a,o){_.forEach(l[a.id].data,function(a,o){_.forEach(a.dataY,function(a,o){var n=parseInt(a);e>n&&(e=n),h>n&&(h=n),t<n&&(t=n),g<n&&(g=n),h<e&&h++,g>t&&g--})})}),f=_.round(i/(g+Math.abs(h)),9)}function m(){var e=21;_.forEach(p,function(t,a){l[M+a]||(l[M+a]={},l[M+a].pointstodraw="",l[M+a].data={},l[M+a].color=p[a].aproximatecolor),_.forEach(l[a].data,function(t,o){if(!l[M+a].data[o])if(l[M+a].data[o]={},l[M+a].data[o].dataY=[],l[M+a].data[o].pointX=[],l[M+a].data[o].pointY=[],l[M+a].data[o].points=[],t.stepPointsAmount>2){var n=Math.round(e/100*t.stepPointsAmount);n<2&&(n=2);for(var r=Math.floor(n/2),d=Math.ceil(n/2),c=r;c<t.stepPointsAmount-d;c++){for(var u,p=0,g=0,m=0,v=0,S=0,A=0,L=0,w=0-r;w<d;w++)v+=(c+w)*l[a].data[o].dataY[c+w],S+=c+w,A+=l[a].data[o].dataY[c+w],L+=(c+w)*(c+w);if(g=(n*v-S*A)/(n*L-S*S),m=(A-g*S)/n,c===r&&(l[M+a].data[o].dataY[0]=l[a].data[o].dataY[0],l[M+a].data[o].pointX[0]=l[a].data[o].pointX[0],l[M+a].data[o].pointY[0]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[0]+Math.abs(h)),u=l[M+a].data[o].pointX[0]+","+l[M+a].data[o].pointY[0],l[M+a].data[o].points.push(u),r>1))for(var E=1;E<r;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);p=_.round(g*c+m,3),isNaN(p)||(l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u));var C=t.dataY.length;if(c===C-d-1){var D=C-1;if(C-d>1)for(var E=D-d+1;E<D;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);l[M+a].data[o].dataY[D]=l[a].data[o].dataY[D],l[M+a].data[o].pointX[D]=l[a].data[o].pointX[D],l[M+a].data[o].pointY[D]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[D]+Math.abs(h)),u=l[M+a].data[o].pointX[D]+","+l[M+a].data[o].pointY[D],l[M+a].data[o].points.push(u)}}l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}else{for(var c=0;c<l[a].stepPointsAmount;c++)l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u);l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}})})}function v(){_.forEach(p,function(e,t){l[t].pointstodraw="",l[M+t].pointstodraw="";var a=!0;_.forEach(l[t].data,function(e,o){for(var n=0;n<e.dataY.length;n++)e.pointY[n]=s.properties.paddingYTop+i-f*(l[t].data[o].dataY[n]+Math.abs(h)),e.points[n]=e.pointX[n]+","+e.pointY[n],l[M+t].data[o].pointY[n]=s.properties.paddingYTop+i-f*(l[M+t].data[o].dataY[n]+Math.abs(h)),l[M+t].data[o].points[n]=l[M+t].data[o].pointX[n]+","+l[M+t].data[o].pointY[n];a&&l[t].pointstodraw,l[t].pointstodraw=String(l[t].pointstodraw+" "+l[t].data[o].points.join(" ")),l[M+t].pointstodraw=String(l[M+t].pointstodraw+" "+l[M+t].data[o].points.join(" "))})})}function S(){var e=C(),t=e.getLine(),a=e.getText(),o=e.getNotch();b=_.cloneDeep(u),delete b.lastNotchValue,delete b.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),w(),_.isEmpty(b)||(_.forEach(b,function(e,t){console.log(" Notch to delete (id): "+e.id),
delete u[e.id]}),b={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(e,t){delete c[e.id]}),svgTextToDelete={}),l[t.id]=t,c[a.id]=a,u[o.id]=o}function w(){for(var e="xNotch",t=s.properties.paddingXLeft,a=s.properties.notchYWidth,o=u.beginNotchX,n=s.properties.mainHeight-s.properties.paddingYBottom,r=s.properties.notchXStep,i=0;i<25&&o<t+d;i++){var l={id:e+i,x1:o,y1:n,x2:o,y2:n+a,col:"#1f1f1f",width:1},p=(String.toString(u.lastNotchValue),{id:e+i,text:u.lastNotchValue+i*r,x:o,y:n+a+L,col:"#F44336"});u[l.id]=l,delete b[l.id],o+=s.properties.updateXStep,c[p.id]=p,delete svgTextToDelete[p.id]}}function E(){function e(e,a,o,n){_.forEach(t,function(t,r){var i=_.floor(n/t);if(i>0&&f*t>20)for(var d=1;d<i+1;d++){var l=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f)-o*f*t*d,p={id:t+a+d,x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:l,x2:s.properties.paddingXLeft,y2:l,col:"#1f1f1f",width:1},g=e+t*d,m={id:t+a+d,text:g,x:s.properties.paddingXLeft-s.properties.notchXWidth-A*g.length,y:l-1,col:"#F44336"};u[p.id]=p,delete b[p.id],c[m.id]=m,delete svgTextToDelete[m.id]}})}var t=[5,25,50,100,500,1e3],a="aboveNotchX",o="underNotchX";e("+",a,1,g),e("-",o,-1,Math.abs(h))}function C(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))}},getText:function(){return{text:"0",x:s.properties.paddingXLeft-A-s.properties.notchXWidth,y:s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f),col:"#F44336"}},getNotch:function(){var e=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f);return{id:"0xaxis",x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:e,x2:s.properties.paddingXLeft,y2:e,col:"#1f1f1f",width:1}}}}function D(){var e={id:"rim",color:"#4E342E",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)};l[e.id]=e}var T=0,U=0;U=a(),o(),n(),r(),m(),v(),D(),S();var b={}}function o(){return l}function n(){return c}function r(){return u}var i,d,s,l={},c={},u={},p={},f=1,g=1,h=0,m=[],v=[],M="aprox",S=0,A=8,L=14;return{makeStep:a,getGraph:o,getText:n,getNotch:r,init:t}}]);var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,t){function a(a){var n=t.defer();o=a;var r=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function t(t){e.close(t)}this.datamessage=o,console.log("  dataString   "+o),this.submit=function(){t(o)}},controllerAs:"vm"});return r.result.then(function(e){n.resolve(e)},function(e){console.log("Modal window: "+e),n.reject(e)}),n.promise}var o="";return{openModal:a}}]);var loadMaskModule=angular.module("LoadMaskModule",[]),ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(e,t,a,o){e.close=function(e){o.close()}}]);var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Root"),r.value?(i.info("User session is valid. Available to show dashboard."),o.go("root.main.dashboard")):(i.info("User session isn't valid. Redirect to loginpage."),o.go("root.login")),e.getAvailableLanguages().then(function(e){d.languages=e,d.selectedLanguage=t.DEFAULT_LANG},function(e){i.warn("Error while download languages. Set to use default: "+t.DEFAULT_LANG),d.languages={1:{code:t.DEFAULT_LANG,name:t.DEFAULT_LANG_NAME}},d.selectedLanguage=t.DEFAULT_LANG}),d.translate=function(){i.info("User select language: "+d.selectedLanguage),a.use(d.selectedLanguage)}}]);var appDecorators=angular.module("appDecorators",[]),appDirectives=angular.module("appDirectives",[]),appProviders=angular.module("appProviders",[]),appServices=angular.module("appServices",[]);loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(e,t,a,o){}}}]),loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(e){function t(){e.removeClass("myloadmask","hidden")}function a(){e.addClass("myloadmask","hidden")}return{activateLoadMask:t,deactivateLoadMask:a}}]),ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(e,t){function a(a){if(!o){o=!0;var n=!0,r=t.$new(n);r.errortype="errormodalwindow.message."+a;var i=e.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:r});i.result.then(function(){o=!1,r.$destroy()},function(e){console.log("Modal window error: "+e),o=!1})}}var o=!1;return{showModal:a}}]),rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,t,a){function o(){var a=t.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),a.resolve(e.data)},function(e){console.log(" load languages.json error."),a.reject(e)}),a.promise}return{getAvailableLanguages:o}}]),app.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),app.config(["$provide",function(e){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},a=function(e,t){var a=new String(e);for(var o in t)a=a.replace("{"+o+"}",t[o]);return a};e.decorator("$log",["$delegate",function(e){function o(){var e=new Date,t=String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds());return t}function n(){var e=new Date,a=e.getDate(),o=e.getMonth()+1;a=a<10?new String("0"+a):new String(a),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var n=new String(a+"-"+monthStr+"-"+e.getFullYear());return n}function r(e,t){function r(e,t,r){return function(){var e=String(o()+" "+n()),i=arguments[0]?new String(arguments[0]):"";r=r?r:"",console[t](a("{0} - {1} {2} ",[e,r,i]))}}return e.log=r(e,"log",t),e.info=r(e,"info",t),e.warn=r(e,"warn",t),e.debug=r(e,"debug",t),e.error=r(e,"error",t),e}return e.getInstance=function(t){t=void 0!==t?t:"",e=r(e,t)},e}])}]),appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.agevalidator(o);return n?(i.$setValidity("ageFormat",!0),t.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("ageFormat",!1),t.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.datevalidator(o);return n?(i.$setValidity("dateFormat",!0),t.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("dateFormat",!1),t.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.namevalidator(o);return n?(i.$setValidity("nameFormat",!0),t.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("nameFormat",!1),t.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}}),appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,t,a,o){function n(e,a){var n=t.defer();return o.login(e,a).then(function(e){access=!0,n.resolve(e)},function(e){n.reject(!1)}),n.promise}function r(){var a=t.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){d=e.data,console.log("Session is valid."),a.resolve(e.data)},function(e){d=null,console.log("Session not valid."),a.reject(e)}),a.promise}function i(){var e=t.defer();return a.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(a.getUserCredits())):r().then(function(t){console.log("provide userCredits from post request"),a.setUserCredits(t),e.resolve(t)},function(t){console.log("Cann't get user credits details."),a.setUserCredits(null),e.reject(t)}),e.promise}var d;return{checkCredentials:n,checkSession:r,getUserCredits:i}}]),appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,t){angular.element(document.querySelector("."+e)).addClass(t)},removeClass:function(e,t){angular.element(document.querySelector("."+e)).removeClass(t)}}}]),appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]),appServices.factory("monthesStorage",["$http","$q",function(e,t){function a(){var a=t.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){a.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),a.reject("Cann't receive date.json file.")}),a.promise}function o(){return void 0!==r?r:void i.then(function(e){return console.log(" Loading monthes from server."),r=e},function(e){r=void 0,console.log("Error in downloading monthes. "+e)})}function n(e){return e%4===0&&(e%100!==0||e%400===0)}var r,i=a();return{getMonthes:o,checkLeapYear:n}}]),appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(t){console.log("set credits in storage: "+e),e=t},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}}),appServices.factory("userDataStorage",function(){var e={};return{setUserData:function(t,a){e[a]=t},getByKeyUserData:function(t){return e[t]},getAllUserData:function(){return e},removeAll:function(){e=null,e={}}}}),appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(){var o=t.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,o.resolve(n)},function(e){console.log("error. unauthorised ? "),a.setUserCredits(null),o.reject(e.data)}),o.promise}var n=null;return{getUserDetails:o}}]),appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(e,t){var a,o=e.NAME_VALIDATOR.NAME_REGEX,n=e.AGE_VALIDATOR.MIN_AGE,r=e.AGE_VALIDATOR.MAX_AGE,i=e.AGE_VALIDATOR.AGE_REGEX,d=e.DATE_VALIDATOR.DATE_REGEX,s=e.DATE_VALIDATOR.SEPARATOR,l=e.DATE_VALIDATOR.MIN_YEAR,c=e.DATE_VALIDATOR.MAX_YEAR,u=e.DATE_VALIDATOR.FEBRUARY_NUMBER,p=e.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,f=e.DATE_VALIDATOR.NUMBER_YEAR,g=e.DATE_VALIDATOR.NUMBER_MONTH,h=e.DATE_VALIDATOR.NUMBER_DAY,m=null,v=0;return{namevalidator:function(e){var t=!1;return t=!!o.test(e)},agevalidator:function(e){var t=!1;return t=!!(e<=r&&e>=n&&i.test(e))},datevalidator:function(e){var o=!1;return a=t.getMonthes(),d.test(e)?(m=e.split(s),m[f]>l&&m[f]<c?(v=m[g]===u&&t.checkLeapYear(m[f])?p:a[m[g]].days,o=m[h]<=v&&m[h]>0):o=!1):o=!1,o}}}]);var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,t,a,o,n){n.getInstance("CheckSession"),a.getUserCredits().then(function(t){n.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(t){n.info("User session isn't valid. Redirect to loginpage."),o.showModal("type2"),e.go("root.login")})}]);var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Login"),r.activateLoadMask(),a.getUserCredits().then(function(e){var a=e.admin;i.info("User check session success."),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!a})},function(e){i.warn("User check session fail."),r.deactivateLoadMask(),t.go("root.login")}),d.submit=function(){var e=d.login,s=d.password;null!==e&&void 0!==e&&""!==e&&null!==s&&void 0!==s&&""!==s?(d.password=null,r.activateLoadMask(),a.checkCredentials(e,s).then(function(a){i.info("User login success.");var n=a.admin;o.setUserCredits({login:e,admin:!!n}),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!n})},function(e){i.warn("User login fail."),r.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,r.deactivateLoadMask(),n.showModal("type1"))}}]);var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;d.isFeedback=!d.isAdmin,a.getUserCredits().then(function(e){d.login=e.login,d.isAdmin=e.admin,d.isFeedback=!d.isAdmin},function(t){e.go("root.login")}),d.logout=function(){r.activateLoadMask(),t.removeAll(),o.logout().then(function(t){i.info("User logout success."),r.deactivateLoadMask(),e.go("root.login")},function(e){i.warn("User logout fail."),r.deactivateLoadMask(),n.showModal("type3")})},d.go=function(t){i.info("User change state to :"+t),e.go(t)}}]),loginModule.service("loginService",["$q","$http",function(e,t){function a(a,o){var n=e.defer();return t({method:"POST",url:"/app/login",data:{login:a,password:o}}).then(function(e){n.resolve(e.data)},function(e){n.reject(!1)}),n.promise}e.defer();return{login:a}}]),tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,t,a,o){function n(){o.removeAll();var n=t.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),a.setUserCredits(null),n.resolve(e.data)},function(e){console.log("Error while logout."),n.reject(e)}),n.promise}return{logout:n}}]);var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){function d(){r.activateLoadMask(),e.getDetails().then(function(e){i.info("Users data was loaded."),s.alldetails=e,l=e,r.deactivateLoadMask()},function(){r.deactivateLoadMask(),i.warn("Users data loading error."),n.showModal("type10")})}var s=this,l=null;i.getInstance("Admin"),d(),s.adduser=function(a,o,s,l,c){var u=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});u.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.addUser(t.login,t.password,t.name,t.age,t.date).then(function(){i.info("New user '"+t.login+"' was added."),r.deactivateLoadMask(),d()},function(){i.warn("User '"+t.login+"' creation error."),r.deactivateLoadMask(),n.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},s.update=function(a){var s=(o.getUserCredits().admin,t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return l[a]}}}));s.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.updateUser(t.login,t.password,t.name,t.age,t.date,a).then(function(){i.info("Update user. Submited data: "+JSON.stringify(t)),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be updated."),r.deactivateLoadMask(),n.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},s["delete"]=function(a){var o=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return a}}});o.result.then(function(t){t.deleteFlag&&(r.activateLoadMask(),e.deleteUser(a).then(function(){i.info("User was deleted."),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be deleted."),r.deactivateLoadMask(),n.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(e,t,a,o,n,r,i){function d(){angular.isDefined(h)&&(a.cancel(h),h=void 0)}function s(){i.deactivateLoadMask(),h=a(function(){l.chartOptions.properties=u,_.forEach(g,function(e,a){m[a]||(m[a]={},m[a].id=a,m[a].data=[],m[a].color=e.color,m[a].aproximatecolor=e.aproximatecolor,v[a]={},v[a].iswaitingload=!1,v[a].updateStep=0),v[a].iswaitingload||(v[a].updateStep=0,v[a].iswaitingload=!0,r.loadData(e.stream).then(function(e){v[a].updateStep=e.data.length,m[a].data=_.concat(m[a].data,e.data),v[a].iswaitingload=!1,l.chartOptions.streams[a]=m[a]},function(e){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+e)}))});var e=0;_.forEach(g,function(t,a){m[a].data.length>e&&(e=m[a].data.length),v[a].updateStep>M&&(M=v[a].updateStep)});var a=e-p;a>0&&_.forEach(g,function(e,t){m[t].data.splice(0,a)}),o.setUserData(m,"chartData"),o.setUserData(m,"chartDataProperties"),o.setUserData(u,"chartProperties"),l.chartOptions={streams:m,streamsProperties:v,properties:u}},f)}var l=this,c={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},u={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},p=u.mainWidth,f=u.updateTimeout,g={};_.forEach(c,function(e,t){g[t]={id:t,stream:e.stream,color:e.color,aproximatecolor:e.aproximatecolor}});var h,m={},v={},M=0;if(e.$on("$destroy",function(){d()}),_.isEmpty(m)){var S=o.getByKeyUserData("chartData");void 0!==S&&(m=_.cloneDeep(S),v=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),u=_.cloneDeep(o.getByKeyUserData("chartProperties"))),l.chartOptions={streams:m,streamsProperties:v,properties:u}}s()}]);var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,t,a,o,n,r){var i=this;o.getInstance("Feedback"),i.sendemail=function(){var e={from:i.name,to:i.email,content:i.textarea},d='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';r.openModal(d).then(function(e){a.activateLoadMask();var r={from:i.name,to:i.email,content:i.textarea},d=r.to.split(",");n.setContent(r.content),n.sendFromDecorator(r.from,d).then(function(e){a.deactivateLoadMask(),o.info("Feedback is sent."),i.name="",i.email="",i.textarea=""},function(e){a.deactivateLoadMask(),o.warn("Feedback cann't be sent."),t.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n){var r=this;n.getInstance("Tab one"),o.activateLoadMask(),t.getUserDetails().then(function(e){n.info("User data was downloaded."),r.userdetails=e,o.deactivateLoadMask()},function(t){n.warn("Error while downloading user data."),o.deactivateLoadMask(),a.showModal("type2"),e.go("root.login")})}]);var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,t,a,o,n,r,i,d){var s=this;d.getInstance("Tab two"),r.getMonthes(),i.activateLoadMask(),t.getUserDetails().then(function(e){d.info("User data was downloaded."),s.userdetails=e,s.newusername=e.name,s.newuserage=e.age,s.newuserdate=e.date,i.deactivateLoadMask()},function(t){d.warn("Error while downloading user data."),i.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),s.submit=function(){if(i.activateLoadMask(),n.namevalidator(s.newusername)&&n.agevalidator(s.newuserage)&&n.datevalidator(s.newuserdate)){var t={newusername:s.newusername,newuserage:s.newuserage,newuserdate:s.newuserdate};a.updateUserDetails(t).then(function(t){d.info("User data was updated."),i.deactivateLoadMask(),e.go("^.tab1")},function(e){d.warn("User data cann't be updated."),i.deactivateLoadMask(),o.showModal("type4")})}else i.deactivateLoadMask(),d.warn("Entered data is not valid."),o.showModal("type4")}}]),adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,t){function a(a){var o=t.defer();return e.deleteUser(a).then(function(e){o.resolve()},function(){o.reject()}),o.promise}function o(a,o,n,r,i,d){var s=t.defer();return e.updateUser(a,o,n,r,i,d).then(function(e){s.resolve()},function(){s.reject()}),s.promise}function n(){var a=t.defer();return e.getAllUsersDetails().then(function(e){r={},_.forEach(e.usercredits,function(t,a){r[a]={},r[a].login=a,r[a].password=t.password,r[a].name=e.userdata[a].name,r[a].age=e.userdata[a].age,r[a].date=e.userdata[a].date}),a.resolve(r)},function(e){console.log("Cann't load details to all users."),r={},a.reject(r)}),a.promise}var r={};return{getDetails:n,updateUser:o,deleteUser:a,addUser:o}}]),adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(a){var o=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:a}}).then(function(e){o.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),o.reject(e.status)}),o.promise}function n(a,o,n,r,i,d){var s=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:a,password:o,name:n,age:r,date:i,oldlogin:d}}).then(function(e){s.resolve()},function(e){console.log("Action is forbidden."),s.reject()}),s.promise}function r(){var o=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){i=e.data,o.resolve(i)},function(e){console.log("Action is forbidden."),a.setUserCredits(null),o.reject(e.data)}),o.promise}var i=null;return{getAllUsersDetails:r,updateUser:n,deleteUser:o}}]),dashboardModule.factory("loadChartDataService",["$http","$q",function(e,t){return{loadData:function(a){var o=t.defer(),n=a.toString(a);return e({method:"POST",url:n}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}}}]),feedbackModule.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,a){function o(e,o,n){var r=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:n}}).then(function(e){r.resolve(e.data)},function(e){r.reject(e)}),r.promise}return{sendFeedback:o}}]),tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function a(a){var o=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:a}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}return{updateUserDetails:a}}]);var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,t,a){function o(e){t.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};o(e)},this.cansel=function(){o({})}}]);var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,t,a,o){function n(e){a.close({deleteFlag:e})}var r=!1;this.userLoginDelete=o,this.submit=function(){r=!0,n(r)},this.cansel=function(){n(r)}}]);var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,t,a,o){function n(e){t.close(e)}this.userdetails=_.clone(a),this.logindisabled=!1,String(o.getUserCredits().login)===a.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};n(e)},this.cansel=function(){n({})}}]);var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(e,t,a,o){var n=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var r={},i={},d=!1,s=e.$watch(function(){return n.chartOptions.streams},function(e,t){d=!1,_.isEmpty(r)&&(_.isEmpty(n.chartOptions.streams)||(_.forEach(n.chartOptions.streams,function(e,t){r[t]={id:t,color:e.color,aproximatecolor:e.aproximatecolor}}),o.init(r,n.chartOptions))),_.forEach(r,function(e,t){i[t]||(i[t]={},i[t].id=t,i[t].color=e.color,i[t].data={}),n.chartOptions.streamsProperties[t].updateStep>0&&(d=!0)}),d&&o.makeStep(i,n.chartOptions),n.graphs=o.getGraph(),n.svgtexts=o.getText(),n.notches=o.getNotch()},!0);e.$on("$destroy",function(){s()})}]),diagramModule.factory("ChartHelperService",[function(){function e(){return++S}function t(e,t){p=e,s=t,_.isEmpty(s.streams)?console.log(" - object 'chartOptions.streams' is empty"):(i=s.properties.mainHeight-(s.properties.paddingYTop+s.properties.paddingYBottom),d=s.properties.mainWidth-(s.properties.paddingXLeft+s.properties.paddingXRight),_.forEach(s.streams,function(e,t){_.indexOf(m,e.id)<0&&(m.push(e.id),v.push(e.id),l[t]||(l[t]={},l[t].id=e.id,l[t].color=e.color,l[t].aproximatecolor=e.aproximatecolor,l[t].data={},l[t].pointstodraw="",l[t].lastXValue=0,u.lastNotchValue=s.properties.notchXStartValue,u.beginNotchX=s.properties.paddingXLeft))}))}function a(t){function a(){return _.forEach(p,function(e,t){l[t].lastXValue>U&&(U=l[t].lastXValue)}),U}function o(){var e=[];if(U>d){T=U-d;var t=u.beginNotchX+(s.properties.updateXStep-T);u.beginNotchX=t,u.lastNotchValue+=s.properties.notchXStep,_.forEach(p,function(t,a){var o=l[a].lastXValue-T;l[a].lastXValue=o<0?0:o;var n=s.properties.paddingXLeft;_.forEach(l[a].data,function(t,o){for(var r=!0,i=-1,d=0;d<t.dataY.length;d++)t.pointX[d]-=T,l[M+a].data[o].pointX[d]-=T,t.pointX[d]<=n&&(i=d),t.pointX[d]>n&&(r=!1);r?e.push(o):i>=0&&(t.dataY=_.drop(t.dataY,1+i),t.pointX=_.drop(t.pointX,1+i),t.pointY=_.drop(t.pointY,1+i),t.points=_.drop(t.points,1+i),t.stepPointsAmount-=i,l[M+a].data[o].dataY=_.drop(l[M+a].data[o].dataY,1+i),l[M+a].data[o].pointX=_.drop(l[M+a].data[o].pointX,1+i),l[M+a].data[o].pointY=_.drop(l[M+a].data[o].pointY,1+i),l[M+a].data[o].points=_.drop(l[M+a].data[o].points,1+i))}),_.forEach(e,function(e){delete l[a].data[e],delete l[M+a].data[e]}),e=[]})}}function n(){_.forEach(p,function(t,a){var o=_.clone(s.streamsProperties[a].updateStep);if(o>0&&(l[a].lastXValue+=s.properties.updateXStep,s.streamsProperties[a].updateStep=0,o>0)){var n=e();l[a].data[n]={};var r=_.takeRight(s.streams[a].data,o);l[a].data[n].dataY=_.cloneDeep(r),l[a].data[n].pointX=[],l[a].data[n].pointY=[],l[a].data[n].points=[],l[a].data[n].stepPointsAmount=o,l[a].data[n].stepX=_.round(s.properties.updateXStep/o,3);for(var i=l[a].lastXValue-s.properties.updateXStep,d=0;d<o;d++)l[a].data[n].pointX[d]=s.properties.paddingXLeft+i+l[a].data[n].stepX*d}})}function r(){var e=0,t=0;_.forEach(p,function(a,o){_.forEach(l[a.id].data,function(a,o){_.forEach(a.dataY,function(a,o){var n=parseInt(a);e>n&&(e=n),h>n&&(h=n),t<n&&(t=n),g<n&&(g=n),h<e&&h++,g>t&&g--})})}),f=_.round(i/(g+Math.abs(h)),9)}function m(){var e=21;_.forEach(p,function(t,a){l[M+a]||(l[M+a]={},l[M+a].pointstodraw="",l[M+a].data={},l[M+a].color=p[a].aproximatecolor),_.forEach(l[a].data,function(t,o){if(!l[M+a].data[o])if(l[M+a].data[o]={},l[M+a].data[o].dataY=[],l[M+a].data[o].pointX=[],l[M+a].data[o].pointY=[],l[M+a].data[o].points=[],t.stepPointsAmount>2){var n=Math.round(e/100*t.stepPointsAmount);n<2&&(n=2);for(var r=Math.floor(n/2),d=Math.ceil(n/2),c=r;c<t.stepPointsAmount-d;c++){
for(var u,p=0,g=0,m=0,v=0,S=0,A=0,L=0,w=0-r;w<d;w++)v+=(c+w)*l[a].data[o].dataY[c+w],S+=c+w,A+=l[a].data[o].dataY[c+w],L+=(c+w)*(c+w);if(g=(n*v-S*A)/(n*L-S*S),m=(A-g*S)/n,c===r&&(l[M+a].data[o].dataY[0]=l[a].data[o].dataY[0],l[M+a].data[o].pointX[0]=l[a].data[o].pointX[0],l[M+a].data[o].pointY[0]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[0]+Math.abs(h)),u=l[M+a].data[o].pointX[0]+","+l[M+a].data[o].pointY[0],l[M+a].data[o].points.push(u),r>1))for(var E=1;E<r;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);p=_.round(g*c+m,3),isNaN(p)||(l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u));var C=t.dataY.length;if(c===C-d-1){var D=C-1;if(C-d>1)for(var E=D-d+1;E<D;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);l[M+a].data[o].dataY[D]=l[a].data[o].dataY[D],l[M+a].data[o].pointX[D]=l[a].data[o].pointX[D],l[M+a].data[o].pointY[D]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[D]+Math.abs(h)),u=l[M+a].data[o].pointX[D]+","+l[M+a].data[o].pointY[D],l[M+a].data[o].points.push(u)}}l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}else{for(var c=0;c<l[a].stepPointsAmount;c++)l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u);l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}})})}function v(){_.forEach(p,function(e,t){l[t].pointstodraw="",l[M+t].pointstodraw="";var a=!0;_.forEach(l[t].data,function(e,o){for(var n=0;n<e.dataY.length;n++)e.pointY[n]=s.properties.paddingYTop+i-f*(l[t].data[o].dataY[n]+Math.abs(h)),e.points[n]=e.pointX[n]+","+e.pointY[n],l[M+t].data[o].pointY[n]=s.properties.paddingYTop+i-f*(l[M+t].data[o].dataY[n]+Math.abs(h)),l[M+t].data[o].points[n]=l[M+t].data[o].pointX[n]+","+l[M+t].data[o].pointY[n];a&&l[t].pointstodraw,l[t].pointstodraw=String(l[t].pointstodraw+" "+l[t].data[o].points.join(" ")),l[M+t].pointstodraw=String(l[M+t].pointstodraw+" "+l[M+t].data[o].points.join(" "))})})}function S(){var e=C(),t=e.getLine(),a=e.getText(),o=e.getNotch();b=_.cloneDeep(u),delete b.lastNotchValue,delete b.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),w(),_.isEmpty(b)||(_.forEach(b,function(e,t){console.log(" Notch to delete (id): "+e.id),delete u[e.id]}),b={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(e,t){delete c[e.id]}),svgTextToDelete={}),l[t.id]=t,c[a.id]=a,u[o.id]=o}function w(){for(var e="xNotch",t=s.properties.paddingXLeft,a=s.properties.notchYWidth,o=u.beginNotchX,n=s.properties.mainHeight-s.properties.paddingYBottom,r=s.properties.notchXStep,i=0;i<25&&o<t+d;i++){var l={id:e+i,x1:o,y1:n,x2:o,y2:n+a,col:"#1f1f1f",width:1},p=(String.toString(u.lastNotchValue),{id:e+i,text:u.lastNotchValue+i*r,x:o,y:n+a+L,col:"#F44336"});u[l.id]=l,delete b[l.id],o+=s.properties.updateXStep,c[p.id]=p,delete svgTextToDelete[p.id]}}function E(){function e(e,a,o,n){_.forEach(t,function(t,r){var i=_.floor(n/t);if(i>0&&f*t>20)for(var d=1;d<i+1;d++){var l=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f)-o*f*t*d,p={id:t+a+d,x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:l,x2:s.properties.paddingXLeft,y2:l,col:"#1f1f1f",width:1},g=e+t*d,m={id:t+a+d,text:g,x:s.properties.paddingXLeft-s.properties.notchXWidth-A*g.length,y:l-1,col:"#F44336"};u[p.id]=p,delete b[p.id],c[m.id]=m,delete svgTextToDelete[m.id]}})}var t=[5,25,50,100,500,1e3],a="aboveNotchX",o="underNotchX";e("+",a,1,g),e("-",o,-1,Math.abs(h))}function C(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))}},getText:function(){return{text:"0",x:s.properties.paddingXLeft-A-s.properties.notchXWidth,y:s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f),col:"#F44336"}},getNotch:function(){var e=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f);return{id:"0xaxis",x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:e,x2:s.properties.paddingXLeft,y2:e,col:"#1f1f1f",width:1}}}}function D(){var e={id:"rim",color:"#4E342E",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)};l[e.id]=e}var T=0,U=0;U=a(),o(),n(),r(),m(),v(),D(),S();var b={}}function o(){return l}function n(){return c}function r(){return u}var i,d,s,l={},c={},u={},p={},f=1,g=1,h=0,m=[],v=[],M="aprox",S=0,A=8,L=14;return{makeStep:a,getGraph:o,getText:n,getNotch:r,init:t}}]),diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(e,t,a,o){a.chartAllPoints}}}]);var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,t){function a(a){var n=t.defer();o=a;var r=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function t(t){e.close(t)}this.datamessage=o,console.log("  dataString   "+o),this.submit=function(){t(o)}},controllerAs:"vm"});return r.result.then(function(e){n.resolve(e)},function(e){console.log("Modal window: "+e),n.reject(e)}),n.promise}var o="";return{openModal:a}}]);
var loadMaskModule=angular.module("LoadMaskModule",[]);
var ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(o,l,e,a){o.close=function(o){a.close()}}]);
var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,o,a,n,l,t,s){var g=this;s.getInstance("Root"),t.value?(s.info("User session is valid. Available to show dashboard."),n.go("root.main.dashboard")):(s.info("User session isn't valid. Redirect to loginpage."),n.go("root.login")),e.getAvailableLanguages().then(function(e){g.languages=e,g.selectedLanguage=o.DEFAULT_LANG},function(e){s.warn("Error while download languages. Set to use default: "+o.DEFAULT_LANG),g.languages={1:{code:o.DEFAULT_LANG,name:o.DEFAULT_LANG_NAME}},g.selectedLanguage=o.DEFAULT_LANG}),g.translate=function(){s.info("User select language: "+g.selectedLanguage),a.use(g.selectedLanguage)}}]);
"use strict";var appDecorators=angular.module("appDecorators",[]);
"use strict";var appDirectives=angular.module("appDirectives",[]);
"use strict";var appProviders=angular.module("appProviders",[]);
"use strict";var appServices=angular.module("appServices",[]);
loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(o,l,a,n){}}}]);
loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(a){function d(){a.removeClass("myloadmask","hidden")}function e(){a.addClass("myloadmask","hidden")}return{activateLoadMask:d,deactivateLoadMask:e}}]);
ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(o,r){function e(e){if(!l){l=!0;var n=!0,a=r.$new(n);a.errortype="errormodalwindow.message."+e;var t=o.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:a});t.result.then(function(){l=!1,a.$destroy()},function(o){console.log("Modal window error: "+o),l=!1})}}var l=!1;return{showModal:e}}]);
rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,o,n){function a(){var n=o.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),n.resolve(e.data)},function(e){console.log(" load languages.json error."),n.reject(e)}),n.promise}return{getAvailableLanguages:a}}]);
app.config(["$provide",function(t){t.decorator("feedbackService",["$delegate","$http","$q",function(t,n,e){return t.data={from:"",to:[""],content:"",signature:""},t.setContent=function(n){t.data.content=n,console.log(" Content in decorator "+n)},t.setFrom=function(n){t.data.from=n},t.setTo=function(n){t.data.to=n},t.setSignature=function(n){t.data.signature=n},t.sendFromDecorator=function(o,a,r){function c(t,o,a,r){var i=e.defer();return n({method:"POST",url:"/app/feedback/send",data:{from:o,to:a[t],content:r}}).then(function(t){i.resolve(t)},function(n){t+1<a.length?c(t+1,o,a,r).then(function(t){i.resolve(t)},function(t){i.reject(t)}):i.reject("Cann't send email")}),i.promise}var i=(o?o:t.data.from,a?a:t.data.to,t.data.content),d=(r?r:t.data.signature,e.defer()),f=0;return c(f,o,a,i).then(function(t){d.resolve(t.data)},function(t){d.reject(t)}),d.promise},t}])}]);
app.config(["$provide",function(r){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},n=function(r,t){var n=new String(r);for(var o in t)n=n.replace("{"+o+"}",t[o]);return n};r.decorator("$log",["$delegate",function(r){function o(){var r=new Date,t=String(r.getHours()+":"+r.getMinutes()+":"+r.getSeconds()+":"+r.getMilliseconds());return t}function e(){var r=new Date,n=r.getDate(),o=r.getMonth()+1;n=n<10?new String("0"+n):new String(n),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var e=new String(n+"-"+monthStr+"-"+r.getFullYear());return e}function i(r,t){function i(r,t,i){return function(){var r=String(o()+" "+e()),g=arguments[0]?new String(arguments[0]):"";i=i?i:"",console[t](n("{0} - {1} {2} ",[r,i,g]))}}return r.log=i(r,"log",t),r.info=i(r,"info",t),r.warn=i(r,"warn",t),r.debug=i(r,"debug",t),r.error=i(r,"error",t),r}return r.getInstance=function(t){t=void 0!==t?t:"",r=i(r,t)},r}])}]);
appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,i){function R(L){var _=A.agevalidator(L);return _?(i.$setValidity("ageFormat",!0),e.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(i.$setValidity("ageFormat",!1),e.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(R)}}}]);
appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,t){function i(L){var _=A.datevalidator(L);return _?(t.$setValidity("dateFormat",!0),e.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(t.$setValidity("dateFormat",!1),e.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}t.$parsers.push(i)}}}]);
appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,i){function R(L){var _=A.namevalidator(L);return _?(i.$setValidity("nameFormat",!0),e.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(i.$setValidity("nameFormat",!1),e.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(R)}}}]);
appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}});
appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,r,s,t){function o(e,s){var o=r.defer();return t.login(e,s).then(function(e){access=!0,o.resolve(e)},function(e){o.reject(!1)}),o.promise}function n(){var s=r.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){c=e.data,console.log("Session is valid."),s.resolve(e.data)},function(e){c=null,console.log("Session not valid."),s.reject(e)}),s.promise}function i(){var e=r.defer();return s.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(s.getUserCredits())):n().then(function(r){console.log("provide userCredits from post request"),s.setUserCredits(r),e.resolve(r)},function(r){console.log("Cann't get user credits details."),s.setUserCredits(null),e.reject(r)}),e.promise}var c;return{checkCredentials:o,checkSession:n,getUserCredits:i}}]);
appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,r){angular.element(document.querySelector("."+e)).addClass(r)},removeClass:function(e,r){angular.element(document.querySelector("."+e)).removeClass(r)}}}]);
appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]);
appServices.factory("monthesStorage",["$http","$q",function(e,n){function o(){var o=n.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){o.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),o.reject("Cann't receive date.json file.")}),o.promise}function t(){return void 0!==i?i:void c.then(function(e){return console.log(" Loading monthes from server."),i=e},function(e){i=void 0,console.log("Error in downloading monthes. "+e)})}function r(e){return e%4===0&&(e%100!==0||e%400===0)}var i,c=o();return{getMonthes:t,checkLeapYear:r}}]);
appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(r){console.log("set credits in storage: "+e),e=r},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}});
appServices.factory("userDataStorage",function(){var t={};return{setUserData:function(e,r){t[r]=e},getByKeyUserData:function(e){return t[e]},getAllUserData:function(){return t},removeAll:function(){t=null,t={}}}});
appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,r,t){function s(){var s=r.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,s.resolve(n)},function(e){console.log("error. unauthorised ? "),t.setUserCredits(null),s.reject(e.data)}),s.promise}var n=null;return{getUserDetails:s}}]);
appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(A,E){var R,D=A.NAME_VALIDATOR.NAME_REGEX,T=A.AGE_VALIDATOR.MIN_AGE,_=A.AGE_VALIDATOR.MAX_AGE,t=A.AGE_VALIDATOR.AGE_REGEX,a=A.DATE_VALIDATOR.DATE_REGEX,e=A.DATE_VALIDATOR.SEPARATOR,r=A.DATE_VALIDATOR.MIN_YEAR,n=A.DATE_VALIDATOR.MAX_YEAR,I=A.DATE_VALIDATOR.FEBRUARY_NUMBER,L=A.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,O=A.DATE_VALIDATOR.NUMBER_YEAR,V=A.DATE_VALIDATOR.NUMBER_MONTH,o=A.DATE_VALIDATOR.NUMBER_DAY,M=null,i=0;return{namevalidator:function(A){var E=!1;return E=!!D.test(A)},agevalidator:function(A){var E=!1;return E=!!(A<=_&&A>=T&&t.test(A))},datevalidator:function(A){var D=!1;return R=E.getMonthes(),a.test(A)?(M=A.split(e),M[O]>r&&M[O]<n?(i=M[V]===I&&E.checkLeapYear(M[O])?L:R[M[V]].days,D=M[o]<=i&&M[o]>0):D=!1):D=!1,D}}}]);
var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,o,s,n,i){i.getInstance("CheckSession"),s.getUserCredits().then(function(o){i.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(o){i.info("User session isn't valid. Redirect to loginpage."),n.showModal("type2"),e.go("root.login")})}]);
var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(a,o,e,i,n,s,t){var d=this;t.getInstance("Login"),s.activateLoadMask(),e.getUserCredits().then(function(a){var e=a.admin;t.info("User check session success."),s.deactivateLoadMask(),o.go("root.main.dashboard",{admin:!!e})},function(a){t.warn("User check session fail."),s.deactivateLoadMask(),o.go("root.login")}),d.submit=function(){var a=d.login,r=d.password;null!==a&&void 0!==a&&""!==a&&null!==r&&void 0!==r&&""!==r?(d.password=null,s.activateLoadMask(),e.checkCredentials(a,r).then(function(e){t.info("User login success.");var n=e.admin;i.setUserCredits({login:a,admin:!!n}),s.deactivateLoadMask(),o.go("root.main.dashboard",{admin:!!n})},function(a){t.warn("User login fail."),s.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,s.deactivateLoadMask(),n.showModal("type1"))}}]);
var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(o,e,t,a,i,n,l){var d=this;d.isFeedback=!d.isAdmin,t.getUserCredits().then(function(o){d.login=o.login,d.isAdmin=o.admin,d.isFeedback=!d.isAdmin},function(e){o.go("root.login")}),d.logout=function(){n.activateLoadMask(),e.removeAll(),a.logout().then(function(e){l.info("User logout success."),n.deactivateLoadMask(),o.go("root.login")},function(o){l.warn("User logout fail."),n.deactivateLoadMask(),i.showModal("type3")})},d.go=function(e){l.info("User change state to :"+e),o.go(e)}}]);
loginModule.service("loginService",["$q","$http",function(e,n){function o(o,r){var t=e.defer();return n({method:"POST",url:"/app/login",data:{login:o,password:r}}).then(function(e){t.resolve(e.data)},function(e){t.reject(!1)}),t.promise}e.defer();return{login:o}}]);
tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,o,t,r){function l(){r.removeAll();var l=o.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),t.setUserCredits(null),l.resolve(e.data)},function(e){console.log("Error while logout."),l.reject(e)}),l.promise}return{logout:l}}]);
var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,a,o,t,d,n,l){function s(){n.activateLoadMask(),e.getDetails().then(function(e){l.info("Users data was loaded."),i.alldetails=e,r=e,n.deactivateLoadMask()},function(){n.deactivateLoadMask(),l.warn("Users data loading error."),d.showModal("type10")})}var i=this,r=null;l.getInstance("Admin"),s(),i.adduser=function(o,t,i,r,u){var c=a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});c.result.then(function(a){_.isEmpty(a)||(n.activateLoadMask(),e.addUser(a.login,a.password,a.name,a.age,a.date).then(function(){l.info("New user '"+a.login+"' was added."),n.deactivateLoadMask(),s()},function(){l.warn("User '"+a.login+"' creation error."),n.deactivateLoadMask(),d.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},i.update=function(o){var i=(t.getUserCredits().admin,a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return r[o]}}}));i.result.then(function(a){_.isEmpty(a)||(n.activateLoadMask(),e.updateUser(a.login,a.password,a.name,a.age,a.date,o).then(function(){l.info("Update user. Submited data: "+JSON.stringify(a)),n.deactivateLoadMask(),s()},function(){l.warn("User cann't be updated."),n.deactivateLoadMask(),d.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},i["delete"]=function(o){var t=a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return o}}});t.result.then(function(a){a.deleteFlag&&(n.activateLoadMask(),e.deleteUser(o).then(function(){l.info("User was deleted."),n.deactivateLoadMask(),s()},function(){l.warn("User cann't be deleted."),n.deactivateLoadMask(),d.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);
var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(a,t,e,o,r,i,n){function c(){angular.isDefined(g)&&(e.cancel(g),g=void 0)}function s(){n.deactivateLoadMask(),g=e(function(){d.chartOptions.properties=l,_.forEach(m,function(a,e){D[e]||(D[e]={},D[e].id=e,D[e].data=[],D[e].color=a.color,D[e].aproximatecolor=a.aproximatecolor,f[e]={},f[e].iswaitingload=!1,f[e].updateStep=0),f[e].iswaitingload||(f[e].updateStep=0,f[e].iswaitingload=!0,i.loadData(a.stream).then(function(a){f[e].updateStep=a.data.length,D[e].data=_.concat(D[e].data,a.data),f[e].iswaitingload=!1,d.chartOptions.streams[e]=D[e]},function(a){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+a)}))});var a=0;_.forEach(m,function(t,e){D[e].data.length>a&&(a=D[e].data.length),f[e].updateStep>v&&(v=f[e].updateStep)});var e=a-h;e>0&&_.forEach(m,function(a,t){D[t].data.splice(0,e)}),o.setUserData(D,"chartData"),o.setUserData(D,"chartDataProperties"),o.setUserData(l,"chartProperties"),d.chartOptions={streams:D,streamsProperties:f,properties:l}},u)}var d=this,p={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},l={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},h=l.mainWidth,u=l.updateTimeout,m={};_.forEach(p,function(a,t){m[t]={id:t,stream:a.stream,color:a.color,aproximatecolor:a.aproximatecolor}});var g,D={},f={},v=0;if(a.$on("$destroy",function(){c()}),_.isEmpty(D)){var S=o.getByKeyUserData("chartData");void 0!==S&&(D=_.cloneDeep(S),f=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),l=_.cloneDeep(o.getByKeyUserData("chartProperties"))),d.chartOptions={streams:D,streamsProperties:f,properties:l}}s()}]);
var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,a,t,o,n,c){var d=this;o.getInstance("Feedback"),d.sendemail=function(){var e={from:d.name,to:d.email,content:d.textarea},r='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';c.openModal(r).then(function(e){t.activateLoadMask();var c={from:d.name,to:d.email,content:d.textarea},r=c.to.split(",");n.setContent(c.content),n.sendFromDecorator(c.from,r).then(function(e){t.deactivateLoadMask(),o.info("Feedback is sent."),d.name="",d.email="",d.textarea=""},function(e){t.deactivateLoadMask(),o.warn("Feedback cann't be sent."),a.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);
var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(a,e,o,t,n){var d=this;n.getInstance("Tab one"),t.activateLoadMask(),e.getUserDetails().then(function(a){n.info("User data was downloaded."),d.userdetails=a,t.deactivateLoadMask()},function(e){n.warn("Error while downloading user data."),t.deactivateLoadMask(),o.showModal("type2"),a.go("root.login")})}]);
var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,a,t,o,n,d,s,r){var i=this;r.getInstance("Tab two"),d.getMonthes(),s.activateLoadMask(),a.getUserDetails().then(function(e){r.info("User data was downloaded."),i.userdetails=e,i.newusername=e.name,i.newuserage=e.age,i.newuserdate=e.date,s.deactivateLoadMask()},function(a){r.warn("Error while downloading user data."),s.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),i.submit=function(){if(s.activateLoadMask(),n.namevalidator(i.newusername)&&n.agevalidator(i.newuserage)&&n.datevalidator(i.newuserdate)){var a={newusername:i.newusername,newuserage:i.newuserage,newuserdate:i.newuserdate};t.updateUserDetails(a).then(function(a){r.info("User data was updated."),s.deactivateLoadMask(),e.go("^.tab1")},function(e){r.warn("User data cann't be updated."),s.deactivateLoadMask(),o.showModal("type4")})}else s.deactivateLoadMask(),r.warn("Entered data is not valid."),o.showModal("type4")}}]);
adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,r){function t(t){var n=r.defer();return e.deleteUser(t).then(function(e){n.resolve()},function(){n.reject()}),n.promise}function n(t,n,s,a,o,i){var l=r.defer();return e.updateUser(t,n,s,a,o,i).then(function(e){l.resolve()},function(){l.reject()}),l.promise}function s(){var t=r.defer();return e.getAllUsersDetails().then(function(e){a={},_.forEach(e.usercredits,function(r,t){a[t]={},a[t].login=t,a[t].password=r.password,a[t].name=e.userdata[t].name,a[t].age=e.userdata[t].age,a[t].date=e.userdata[t].date}),t.resolve(a)},function(e){console.log("Cann't load details to all users."),a={},t.reject(a)}),t.promise}var a={};return{getDetails:s,updateUser:n,deleteUser:t,addUser:n}}]);
adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,n){function r(n){var r=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:n}}).then(function(e){r.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),r.reject(e.status)}),r.promise}function o(n,r,o,a,s,i){var d=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:n,password:r,name:o,age:a,date:s,oldlogin:i}}).then(function(e){d.resolve()},function(e){console.log("Action is forbidden."),d.reject()}),d.promise}function a(){var r=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){s=e.data,r.resolve(s)},function(e){console.log("Action is forbidden."),n.setUserCredits(null),r.reject(e.data)}),r.promise}var s=null;return{getAllUsersDetails:a,updateUser:o,deleteUser:r}}]);
dashboardModule.factory("loadChartDataService",["$http","$q",function(t,r){return{loadData:function(e){var a=r.defer(),o=e.toString(e);return t({method:"POST",url:o}).then(function(t){a.resolve(t.data)},function(t){a.reject(t)}),a.promise}}}]);
feedbackModule.config(["$provide",function(t){t.decorator("feedbackService",["$delegate","$http","$q",function(t,e,n){return t.data={from:"",to:[""],content:"",signature:""},t.setContent=function(e){t.data.content=e,console.log(" Content in decorator "+e)},t.setFrom=function(e){t.data.from=e},t.setTo=function(e){t.data.to=e},t.setSignature=function(e){t.data.signature=e},t.sendFromDecorator=function(o,a,r){function c(t,o,a,r){var d=n.defer();return e({method:"POST",url:"/app/feedback/send",data:{from:o,to:a[t],content:r}}).then(function(t){d.resolve(t)},function(e){t+1<a.length?c(t+1,o,a,r).then(function(t){d.resolve(t)},function(t){d.reject(t)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:t.data.from,a?a:t.data.to,t.data.content),i=(r?r:t.data.signature,n.defer()),f=0;return c(f,o,a,d).then(function(t){i.resolve(t.data)},function(t){i.reject(t)}),i.promise},t}])}]);
feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,n){function o(e,o,r){var a=n.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:r}}).then(function(e){a.resolve(e.data)},function(e){a.reject(e)}),a.promise}return{sendFeedback:o}}]);
tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function r(r){var a=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:r}).then(function(e){a.resolve(e.data)},function(e){a.reject(e)}),a.promise}return{updateUserDetails:r}}]);
var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,s,d){function a(e){s.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};a(e)},this.cansel=function(){a({})}}]);
var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,l,n,o){function t(e){n.close({deleteFlag:e})}var a=!1;this.userLoginDelete=o,this.submit=function(){a=!0,t(a)},this.cansel=function(){t(a)}}]);
var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,s,i,a){function t(e){s.close(e)}this.userdetails=_.clone(i),this.logindisabled=!1,String(a.getUserCredits().login)===i.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};t(e)},this.cansel=function(){t({})}}]);
var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(t,r,a,i){var o=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var e={},s={},n=!1,h=t.$watch(function(){return o.chartOptions.streams},function(t,r){n=!1,_.isEmpty(e)&&(_.isEmpty(o.chartOptions.streams)||(_.forEach(o.chartOptions.streams,function(t,r){e[r]={id:r,color:t.color,aproximatecolor:t.aproximatecolor}}),i.init(e,o.chartOptions))),_.forEach(e,function(t,r){s[r]||(s[r]={},s[r].id=r,s[r].color=t.color,s[r].data={}),o.chartOptions.streamsProperties[r].updateStep>0&&(n=!0)}),n&&i.makeStep(s,o.chartOptions),o.graphs=i.getGraph(),o.svgtexts=i.getText(),o.notches=i.getNotch()},!0);t.$on("$destroy",function(){h()})}]);
diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(r,t,o,a){o.chartAllPoints}}}]);
diagramModule.factory("ChartHelperService",[function(){function t(){return++v}function a(t,a){f=t,r=a,_.isEmpty(r.streams)?console.log(" - object 'chartOptions.streams' is empty"):(d=r.properties.mainHeight-(r.properties.paddingYTop+r.properties.paddingYBottom),n=r.properties.mainWidth-(r.properties.paddingXLeft+r.properties.paddingXRight),_.forEach(r.streams,function(t,a){_.indexOf(l,t.id)<0&&(l.push(t.id),Y.push(t.id),s[a]||(s[a]={},s[a].id=t.id,s[a].color=t.color,s[a].aproximatecolor=t.aproximatecolor,s[a].data={},s[a].pointstodraw="",s[a].lastXValue=0,h.lastNotchValue=r.properties.notchXStartValue,h.beginNotchX=r.properties.paddingXLeft))}))}function o(a){function o(){return _.forEach(f,function(t,a){s[a].lastXValue>S&&(S=s[a].lastXValue)}),S}function i(){var t=[];if(S>n){w=S-n;var a=h.beginNotchX+(r.properties.updateXStep-w);h.beginNotchX=a,h.lastNotchValue+=r.properties.notchXStep,_.forEach(f,function(a,o){var i=s[o].lastXValue-w;s[o].lastXValue=i<0?0:i;var e=r.properties.paddingXLeft;_.forEach(s[o].data,function(a,i){for(var p=!0,d=-1,n=0;n<a.dataY.length;n++)a.pointX[n]-=w,s[m+o].data[i].pointX[n]-=w,a.pointX[n]<=e&&(d=n),a.pointX[n]>e&&(p=!1);p?t.push(i):d>=0&&(a.dataY=_.drop(a.dataY,1+d),a.pointX=_.drop(a.pointX,1+d),a.pointY=_.drop(a.pointY,1+d),a.points=_.drop(a.points,1+d),a.stepPointsAmount-=d,s[m+o].data[i].dataY=_.drop(s[m+o].data[i].dataY,1+d),s[m+o].data[i].pointX=_.drop(s[m+o].data[i].pointX,1+d),s[m+o].data[i].pointY=_.drop(s[m+o].data[i].pointY,1+d),s[m+o].data[i].points=_.drop(s[m+o].data[i].points,1+d))}),_.forEach(t,function(t){delete s[o].data[t],delete s[m+o].data[t]}),t=[]})}}function e(){_.forEach(f,function(a,o){var i=_.clone(r.streamsProperties[o].updateStep);if(i>0&&(s[o].lastXValue+=r.properties.updateXStep,r.streamsProperties[o].updateStep=0,i>0)){var e=t();s[o].data[e]={};var p=_.takeRight(r.streams[o].data,i);s[o].data[e].dataY=_.cloneDeep(p),s[o].data[e].pointX=[],s[o].data[e].pointY=[],s[o].data[e].points=[],s[o].data[e].stepPointsAmount=i,s[o].data[e].stepX=_.round(r.properties.updateXStep/i,3);for(var d=s[o].lastXValue-r.properties.updateXStep,n=0;n<i;n++)s[o].data[e].pointX[n]=r.properties.paddingXLeft+d+s[o].data[e].stepX*n}})}function p(){var t=0,a=0;_.forEach(f,function(o,i){_.forEach(s[o.id].data,function(o,i){_.forEach(o.dataY,function(o,i){var e=parseInt(o);t>e&&(t=e),X>e&&(X=e),a<e&&(a=e),g<e&&(g=e),X<t&&X++,g>a&&g--})})}),u=_.round(d/(g+Math.abs(X)),9)}function l(){var t=21;_.forEach(f,function(a,o){s[m+o]||(s[m+o]={},s[m+o].pointstodraw="",s[m+o].data={},s[m+o].color=f[o].aproximatecolor),_.forEach(s[o].data,function(a,i){if(!s[m+o].data[i])if(s[m+o].data[i]={},s[m+o].data[i].dataY=[],s[m+o].data[i].pointX=[],s[m+o].data[i].pointY=[],s[m+o].data[i].points=[],a.stepPointsAmount>2){var e=Math.round(t/100*a.stepPointsAmount);e<2&&(e=2);for(var p=Math.floor(e/2),n=Math.ceil(e/2),c=p;c<a.stepPointsAmount-n;c++){for(var h,f=0,g=0,l=0,Y=0,v=0,x=0,T=0,b=0-p;b<n;b++)Y+=(c+b)*s[o].data[i].dataY[c+b],v+=c+b,x+=s[o].data[i].dataY[c+b],T+=(c+b)*(c+b);if(g=(e*Y-v*x)/(e*T-v*v),l=(x-g*v)/e,c===p&&(s[m+o].data[i].dataY[0]=s[o].data[i].dataY[0],s[m+o].data[i].pointX[0]=s[o].data[i].pointX[0],s[m+o].data[i].pointY[0]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[0]+Math.abs(X)),h=s[m+o].data[i].pointX[0]+","+s[m+o].data[i].pointY[0],s[m+o].data[i].points.push(h),p>1))for(var E=1;E<p;E++)f=_.round(g*E+l,3),s[m+o].data[i].dataY[E]=f,s[m+o].data[i].pointX[E]=s[o].data[i].pointX[E],s[m+o].data[i].pointY[E]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[E]+Math.abs(X)),h=s[m+o].data[i].pointX[E]+","+s[m+o].data[i].pointY[E],s[m+o].data[i].points.push(h);f=_.round(g*c+l,3),isNaN(f)||(s[m+o].data[i].dataY[c]=f,s[m+o].data[i].pointX[c]=s[o].data[i].pointX[c],s[m+o].data[i].pointY[c]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[c]+Math.abs(X)),h=s[m+o].data[i].pointX[c]+","+s[m+o].data[i].pointY[c],s[m+o].data[i].points.push(h));var M=a.dataY.length;if(c===M-n-1){var N=M-1;if(M-n>1)for(var E=N-n+1;E<N;E++)f=_.round(g*E+l,3),s[m+o].data[i].dataY[E]=f,s[m+o].data[i].pointX[E]=s[o].data[i].pointX[E],s[m+o].data[i].pointY[E]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[E]+Math.abs(X)),h=s[m+o].data[i].pointX[E]+","+s[m+o].data[i].pointY[E],s[m+o].data[i].points.push(h);s[m+o].data[i].dataY[N]=s[o].data[i].dataY[N],s[m+o].data[i].pointX[N]=s[o].data[i].pointX[N],s[m+o].data[i].pointY[N]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[N]+Math.abs(X)),h=s[m+o].data[i].pointX[N]+","+s[m+o].data[i].pointY[N],s[m+o].data[i].points.push(h)}}s[m+o].pointstodraw=String(s[m+o].pointstodraw+" "+s[m+o].data[i].points.join(" "))}else{for(var c=0;c<s[o].stepPointsAmount;c++)s[m+o].data[i].dataY[c]=f,s[m+o].data[i].pointX[c]=s[o].data[i].pointX[c],s[m+o].data[i].pointY[c]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[c]+Math.abs(X)),h=s[m+o].data[i].pointX[c]+","+s[m+o].data[i].pointY[c],s[m+o].data[i].points.push(h);s[m+o].pointstodraw=String(s[m+o].pointstodraw+" "+s[m+o].data[i].points.join(" "))}})})}function Y(){_.forEach(f,function(t,a){s[a].pointstodraw="",s[m+a].pointstodraw="";var o=!0;_.forEach(s[a].data,function(t,i){for(var e=0;e<t.dataY.length;e++)t.pointY[e]=r.properties.paddingYTop+d-u*(s[a].data[i].dataY[e]+Math.abs(X)),t.points[e]=t.pointX[e]+","+t.pointY[e],s[m+a].data[i].pointY[e]=r.properties.paddingYTop+d-u*(s[m+a].data[i].dataY[e]+Math.abs(X)),s[m+a].data[i].points[e]=s[m+a].data[i].pointX[e]+","+s[m+a].data[i].pointY[e];o&&s[a].pointstodraw,s[a].pointstodraw=String(s[a].pointstodraw+" "+s[a].data[i].points.join(" ")),s[m+a].pointstodraw=String(s[m+a].pointstodraw+" "+s[m+a].data[i].points.join(" "))})})}function v(){var t=M(),a=t.getLine(),o=t.getText(),i=t.getNotch();L=_.cloneDeep(h),delete L.lastNotchValue,delete L.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),b(),_.isEmpty(L)||(_.forEach(L,function(t,a){console.log(" Notch to delete (id): "+t.id),delete h[t.id]}),L={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(t,a){delete c[t.id]}),svgTextToDelete={}),s[a.id]=a,c[o.id]=o,h[i.id]=i}function b(){for(var t="xNotch",a=r.properties.paddingXLeft,o=r.properties.notchYWidth,i=h.beginNotchX,e=r.properties.mainHeight-r.properties.paddingYBottom,p=r.properties.notchXStep,d=0;d<25&&i<a+n;d++){var s={id:t+d,x1:i,y1:e,x2:i,y2:e+o,col:"#1f1f1f",width:1},f=(String.toString(h.lastNotchValue),{id:t+d,text:h.lastNotchValue+d*p,x:i,y:e+o+T,col:"#F44336"});h[s.id]=s,delete L[s.id],i+=r.properties.updateXStep,c[f.id]=f,delete svgTextToDelete[f.id]}}function E(){function t(t,o,i,e){_.forEach(a,function(a,p){var d=_.floor(e/a);if(d>0&&u*a>20)for(var n=1;n<d+1;n++){var s=r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u)-i*u*a*n,f={id:a+o+n,x1:r.properties.paddingXLeft-r.properties.notchXWidth,y1:s,x2:r.properties.paddingXLeft,y2:s,col:"#1f1f1f",width:1},g=t+a*n,l={id:a+o+n,text:g,x:r.properties.paddingXLeft-r.properties.notchXWidth-x*g.length,y:s-1,col:"#F44336"};h[f.id]=f,delete L[f.id],c[l.id]=l,delete svgTextToDelete[l.id]}})}var a=[5,25,50,100,500,1e3],o="aboveNotchX",i="underNotchX";t("+",o,1,g),t("-",i,-1,Math.abs(X))}function M(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u))+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+(r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u))}},getText:function(){return{text:"0",x:r.properties.paddingXLeft-x-r.properties.notchXWidth,y:r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u),col:"#F44336"}},getNotch:function(){var t=r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u);return{id:"0xaxis",x1:r.properties.paddingXLeft-r.properties.notchXWidth,y1:t,x2:r.properties.paddingXLeft,y2:t,col:"#1f1f1f",width:1}}}}function N(){var t={id:"rim",color:"#4E342E",data:[],pointstodraw:r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom)+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+(r.properties.mainHeight-r.properties.paddingYBottom)+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+r.properties.paddingYTop+" "+r.properties.paddingXLeft+","+r.properties.paddingYTop+" "+r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom)};s[t.id]=t}var w=0,S=0;S=o(),i(),e(),p(),l(),Y(),N(),v();var L={}}function i(){return s}function e(){return c}function p(){return h}var d,n,r,s={},c={},h={},f={},u=1,g=1,X=0,l=[],Y=[],m="aprox",v=0,x=8,T=14;return{makeStep:o,getGraph:i,getText:e,getNotch:p,init:a}}]);
var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,o){function a(a){var d=o.defer();l=a;var n=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function o(o){e.close(o)}this.datamessage=l,console.log("  dataString   "+l),this.submit=function(){o(l)}},controllerAs:"vm"});return n.result.then(function(e){d.resolve(e)},function(e){console.log("Modal window: "+e),d.reject(e)}),d.promise}var l="";return{openModal:a}}]);
var loadMaskModule = angular.module('LoadMaskModule',[]);

var ModalModule = angular.module('ModalModule',[]);
ModalModule.controller('ModalController', 
  [ '$scope', '$translate', 'myModalWindowService', '$uibModalInstance',   
  function( $scope, $translate, myModalWindowService, $uibModalInstance) {
    $scope.close = function(result) {     
      $uibModalInstance.close();      
    };
}]);
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

'use strict';
var appDecorators = angular.module('appDecorators', []);



'use strict';
var appDirectives = angular.module('appDirectives', []);



'use strict';
var appProviders = angular.module('appProviders', []);



'use strict';
var appServices = angular.module('appServices', []);


loadMaskModule.directive('loadmask',[
	function () {
		
		return {
			restrict: 'E',
			templateUrl: 'app/loadmask/loadmask.html',
			controller: function(){
				console.log(" Load mask is shown.")
			},
			link: function(scope, element, attr, ctrl){

			}
		}		
	}
])

loadMaskModule.service('LoadMaskService', ['htmlClassModifierService',
  	function(htmlClassModifierService){
		function activateLoadMask(){
			htmlClassModifierService.removeClass("myloadmask", "hidden");
		};
		function deactivateLoadMask(){
			htmlClassModifierService.addClass("myloadmask", "hidden");
		};
		return {
			activateLoadMask : activateLoadMask,
			deactivateLoadMask : deactivateLoadMask
		}
	}
]);
ModalModule.service('myModalWindowService', ['$uibModal', '$rootScope',
	function($uibModal, $rootScope){
		var _ispresent = false;
		function showModal(errorType){
			if ( !_ispresent){
				_ispresent = true;
		  		var isolation = true;
		  		var modalScope = $rootScope.$new(isolation);
		  		modalScope.errortype = 'errormodalwindow.message.'+errorType;
		  		var modalInstance = $uibModal.open({
		  			animation: true,
		  			size: "sm",
		  			templateUrl: "/app/modal/modal.html",
		  			controller: "ModalController",
		  			scope: modalScope		  			
		  		});		  		
		  		modalInstance.result.then(function(){
		  			// console.log(" ispresent setted to false");
		  			_ispresent = false;
		  			modalScope.$destroy();
		  		}, function(error){
          			// error contains a detailed error message.
		            console.log("Modal window error: " + error);
		            _ispresent = false;
		  		})
			}
		}
		return{
			showModal : showModal			
		}
	}
]);
// available languages
//appServices.factory('languagesStorage', ['$http', '$q', 'LANG',
rootModule.service('languagesStorage', ['$http', '$q', 'LANG',
	function($http, $q, LANG){
		function getAvailableLanguages(){			
			var deferred = $q.defer();
			$http({
				method: "GET",
				url: '/lang/languages.json'
			}).then(function successCallback(response){	
				console.log(" load languages.json success." );
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log(" load languages.json error." );
				deferred.reject(error);
			})
			return deferred.promise;			
		}
		return {
			getAvailableLanguages : getAvailableLanguages
		}
	}
])
app.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
app.config([ '$provide', function($provide){
		/*
			string into decorator have to be “{0} {1} – {2}{3}“ 
				where 
				{0} current date – “dd-MMM-yyyy”, 
				{1} – current time – “HH:MM:SS:MS”, 
				{2} – class name, 
				{3} – string that need to log
		*/
		var monthesStor = {
			"01":{"short":"JAN"},
			"02":{"short":"FEB"},
			"03":{"short":"MAR"},
			"04":{"short":"APR"},
			"05":{"short":"MAY"},
			"06":{"short":"JUN"},
			"07":{"short":"JUL"},
			"08":{"short":"AUG"},
			"09":{"short":"SEP"},
			"10":{"short":"OCT"},
			"11":{"short":"NOV"},
			"12":{"short":"DEC"}
		}
		var support = function(template, valuesArray){
			var result = new String(template);
			for (var val in valuesArray){
				// console.log( " val =  " + val);
				result = result.replace("{"+val+"}", valuesArray[val]);
			}
			return result;
		}
		$provide.decorator('$log', [ '$delegate', 
			function($delegate){
				function currentTime(){					
					var time = new Date();
					var timeStr = String(time.getHours() + ":" +
						time.getMinutes() + ":" +
						time.getSeconds() + ":" +
						time.getMilliseconds()
					);
					return timeStr;
				};
				function currentDate(){
					var time = new Date();
					var date = time.getDate();
					var month = time.getMonth() + 1;
					date = date < 10 ? new String("0"+ date) : new String(date);
					monthStr = month < 10 ? monthesStor[new String("0"+ month)].short
						: monthesStor[new String(month)].short;					
					var dateStr = new String(date + "-" + 
						monthStr + "-" + 
						time.getFullYear());
					return dateStr;
				};
				function updateFunctions(object, className){
					function prepareFunction(object, funcName, className){
						return function () {			                
			                var now = String (currentTime() + " " + currentDate());		
			                var arg = !!(arguments[0]) ? new String(arguments[0]) : "";
			                className = className ? className : '';
			                console[funcName](support("{0} - {1} {2} ", [now, className, arg]));
			            };
					};
					object.log = prepareFunction(object, "log", className);
					object.info = prepareFunction(object, "info", className);
					object.warn = prepareFunction(object, "warn", className);
					object.debug = prepareFunction(object, "debug", className);
					object.error = prepareFunction(object, "error", className);
					return object;
				};
				$delegate.getInstance = function(className){
					className = (className !== undefined) ? className : "";
					$delegate = updateFunctions($delegate, className);
				};
				return $delegate;
			}
		])
	}
]);
appDirectives.directive('myagevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',
      link: function(scope, element, attr, mCtrl){
        function myAgeValidator(value){          
          var result = validatorsService.agevalidator(value);
          if (result){
            mCtrl.$setValidity('ageFormat', true);
            // custom
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return value;
          } else {
            mCtrl.$setValidity('ageFormat', false); 
            //custom
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return '';
          }
        }
        mCtrl.$parsers.push(myAgeValidator);
      }
    }
}])
appDirectives.directive('mydatevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
	  return {
	    require: 'ngModel',
	    link: function (scope, element, attr, mCtrl){
	      function myDateValidator(value){         
          var result = validatorsService.datevalidator(value);
          if (result){
            mCtrl.$setValidity('dateFormat', true);    
            //custom 
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('dateFormat', false);
            //custom
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);   
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);
            return '';
          }
	      }
	      mCtrl.$parsers.push(myDateValidator);
	    } 
	  }
}])
appDirectives.directive('mynamevalidator', ['validatorsService',
 'htmlClassModifierService', 'VALIDATORS',  
  function(validatorsService,htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',      
      link: function(scope, element, attr, mCtrl){
        function myNameValidator(value){
          var result = validatorsService.namevalidator(value);
          if (result){
            mCtrl.$setValidity('nameFormat', true);   
            //custom   
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('nameFormat', false); 
            //custom     
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME); 
            return '';
          }
        }
        mCtrl.$parsers.push(myNameValidator);
      }
    }
}])
appServices.service('checkCredentialsServise', ['$http', '$q', 
	'userCreditsStorage', 'loginService',
	function($http, $q, userCreditsStorage, loginService){
		// var access = false;
		var _userCredentials;
		function checkUserCredentials(login, password){
			var deferred = $q.defer();			
			loginService.login(login, password).then(
				function successCallback(details){
					// console.log(" access alowed");
					access = true;
					deferred.resolve(details);				
				}, function errorCallback(response){
					// console.log(" access forbiden");					
					deferred.reject(false);
				}
			)
			return deferred.promise;	
		}
		function checkSession(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/checksession'
			}).then(function successCallback(response){
				_userCredentials = response.data;
				console.log("Session is valid.");
				deferred.resolve(response.data);
			}, function errorCallback(error){
				_userCredentials = null;				
				console.log("Session not valid.");
				deferred.reject(error);
			})
			return deferred.promise;
		};
		function getUserCredits(){
				var deferred = $q.defer();
				if ( ! userCreditsStorage.getUserCredits()){
					checkSession().then(function(details){
						console.log("provide userCredits from post request");	
						userCreditsStorage.setUserCredits( details
							// {"login": details['login']} 							
						);
						deferred.resolve(details);
					}, function(error){
						console.log("Cann't get user credits details.");
						userCreditsStorage.setUserCredits(null);
						deferred.reject(error);
					})				
				} else{
					console.log("provide userCredits from storage");
					deferred.resolve(userCreditsStorage.getUserCredits());					
				}
			return deferred.promise;
		}
		return {
			checkCredentials:  checkUserCredentials,
			checkSession : checkSession,
			getUserCredits : getUserCredits
		}
	}
]);
appServices.service('htmlClassModifierService', [ function(){
	return {
		addClass : function(classSelector, classToAdd){
			angular.element(document.querySelector("."+classSelector)).addClass(classToAdd);
		},
		removeClass : function(classSelector, classToRemove){
			angular.element(document.querySelector("."+classSelector)).removeClass(classToRemove);
		}
	}	
}])

appServices.service('myInterceptor', [
	function(){
		var timeMarker = {
			request: function(config){
				config.requestTimePoint = new Date().getTime();
				return config;
			},
			response: function(response){
				response.config.responseTimePoint = new Date().getTime();
				// log only post requests
				if ( String(response.config.method).toLowerCase() === "post" ){
					// log it 
					console.log(" - request-response time: " + 					
						(response.config.responseTimePoint - response.config.requestTimePoint) +
						" ms. " + " URl: " + response.config.url);
				}
				return response;
			}
		}
		return timeMarker;
	}
])
//monthes storage
appServices.service('monthesStorage', [ '$http', '$q',
	function($http, $q){
		var monthes;
		var _promiseLoad = _loadMonthes();
		function _loadMonthes(){			
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: "/app/public/date.json"
			}).then(function successCallback(response){
				// save monthes				
				deferred.resolve(response.data);
			}, function errorCallback(error){
				// error in monthes load 				
				console.log(" Cann't receive date.json file.");
				deferred.reject( "Cann't receive date.json file." );
			}	
			)	
			return deferred.promise;
		}
		function getMonthes(){
			if (monthes === undefined){
				_promiseLoad.then(function(details){
						console.log(" Loading monthes from server.")
						monthes = details;
						// console.log("monthes:"+ monthes);
						return monthes;
					}, 
					function(reason){
						// show modal error message.
						monthes = undefined;
						console.log("Error in downloading monthes. " + reason);
					}
				);				
			} else {				
				return monthes;
			}
		}
		function checkLeapYear(year){
			if ( (year) % 4 === 0 ){    
			    if (year % 100 === 0 && year % 400 !== 0){
			      return false;
				}
			    return true;   
			} else {
			    return false;
			}
		}
		return {
			getMonthes : getMonthes,
			checkLeapYear : checkLeapYear
		}
		
	}
])
// save login of user
appServices.service('userCreditsStorage', function(){
	var userCredits = null;
	return {
		setUserCredits: function(credits){
			console.log("set credits in storage: " + userCredits);
			userCredits = credits;
		},
		getUserCredits: function(){
			console.log("get credits from storage: " + userCredits);
			return userCredits;
		}
	}
})
// save different user data
appServices.service('userDataStorage', function(){
	var userData = {};
	return {
		setUserData: function(data, key){
			userData[key] = data;
		},
		getByKeyUserData: function(key){
			return userData[key];
		},
		getAllUserData: function(){
			return userData;
		},
		removeAll: function(){
			// delete userData;
			userData = null;
			userData = {};
		}
	}
})
appServices.service('userDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;
		function getUserDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/userdetails'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				console.log("error. unauthorised ? ");
				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getUserDetails : getUserDetails
		}
	}
])
appServices.service('validatorsService', ['VALIDATORS', 'monthesStorage',
	function(VALIDATORS, monthesStorage){
		var _nameRegEx = VALIDATORS.NAME_VALIDATOR.NAME_REGEX;
		var _minage = VALIDATORS.AGE_VALIDATOR.MIN_AGE;
    	var _maxage = VALIDATORS.AGE_VALIDATOR.MAX_AGE;
    	var _ageRegex = VALIDATORS.AGE_VALIDATOR.AGE_REGEX;

    	var _dateRegEx = VALIDATORS.DATE_VALIDATOR.DATE_REGEX; 
	    var _separator = VALIDATORS.DATE_VALIDATOR.SEPARATOR;
	    var _minyear = VALIDATORS.DATE_VALIDATOR.MIN_YEAR;
	    var _maxyear = VALIDATORS.DATE_VALIDATOR.MAX_YEAR;
	    var _februarynumber = VALIDATORS.DATE_VALIDATOR.FEBRUARY_NUMBER;
	    var _februaryleapdays = VALIDATORS.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS;
	    var _numyear = VALIDATORS.DATE_VALIDATOR.NUMBER_YEAR;
	    var _nummonth = VALIDATORS.DATE_VALIDATOR.NUMBER_MONTH;
	    var _numday = VALIDATORS.DATE_VALIDATOR.NUMBER_DAY;
    
		var _isvalid = false;
		var _parts = null;
		var _maxdays = 0;

		var monthes;

		return {
			namevalidator: function(value){
				var isvalid = false;
				if (_nameRegEx.test(value)){
		        	isvalid = true;		            
		        } else {		            
		            isvalid = false;
		        }
		        return isvalid;
			},
			agevalidator: function(value){
				var isvalid = false;
				if (value <= _maxage && value >= _minage && _ageRegex.test(value)){
		            isvalid = true;		            
		        } else {
		             isvalid = false;
		        }
		        return isvalid;
			},
			datevalidator : function(value){
				var _isvalid = false;
				monthes = monthesStorage.getMonthes();
		        if (_dateRegEx.test(value)){
		          _parts = value.split(_separator);
		          // check year
		          if(_parts[_numyear] > _minyear && _parts[_numyear] < _maxyear){            
		            // check february for leap year
		            if (_parts[_nummonth] === _februarynumber ){
		              if (monthesStorage.checkLeapYear(_parts[_numyear])){
		                _maxdays = _februaryleapdays;
		              } else{
		                _maxdays = monthes[_parts[_nummonth]].days;
		              }               
		            } else {
		                _maxdays = monthes[_parts[_nummonth]].days;	               
		            }
		            // check amount of days for max value
		            if (_parts[_numday] <= _maxdays && _parts[_numday] > 0){
		              _isvalid = true;
		            } else {
		              _isvalid = false;
		            }
		          } else {
		            _isvalid = false;
		          }          
		        } else {
		            _isvalid = false;
		        }
				return _isvalid;				
			}
		}
	}
]);
appProviders.provider('log', 
	function logProvider(){
		var time = new Date();
		var currentTimeMillis = time.getTime();	
		var timeStr = String(time.getHours() + ":" +
			time.getMinutes() + ":" +
			time.getSeconds() + ":" +
			time.getMilliseconds()
		);
		this.getTimeCreation = function(){			
			return timeStr;
		};		
		this.getTimeCreationMillis = function(){
			return currentTime;
		};
		this.$get = function(){				
			return new log();				
		};		
	}	
)

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
              // console.log(" Login is success! ");
              $log.info("User login success.");
              var isAdmin = details.admin;
              // console.log(" Hello. You have admin rights: " + isAdmin);              
              userCreditsStorage.setUserCredits(
                {"login": login,
                  "admin": !!isAdmin}
              );   
              LoadMaskService.deactivateLoadMask();
              $state.go('root.main.dashboard', {"admin":!!isAdmin});
          }, function(reason){
              // console.log(" Login is incorect. " + reason);
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
          // console.log("Logout is successful.");
          $log.info("User logout success.");
          LoadMaskService.deactivateLoadMask();
          $state.go('root.login');
        }, function(reason){
          // console.log("Logout fail.");      
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
loginModule.service('loginService', [ '$q', '$http',
	function($q, $http){
		var deferred = $q.defer();
		function login(login, password){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/login',
				data: {
					"login": login,
					"password": password
				}
			}).then(function successCallback(response){			
				deferred.resolve(response.data);				
			}, function errorCallback(response){				
				deferred.reject(false);
			})	
			return deferred.promise;
		}
		return {
			login : login
		}
	}
])
tabSwitcherModule.service('logoutService', ['$http', '$q', 'userCreditsStorage', 
	'userDataStorage', 'userDataStorage',
	function($http, $q, userCreditsStorage, userDataStorage){
		function logout(){
			userDataStorage.removeAll();
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/logout'				
			}).then(function successCallback(response){
				console.log("Logout is allowed.");
				userCreditsStorage.setUserCredits(null);
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log("Error while logout.");
				deferred.reject(error);
			})
			return deferred.promise;
		}
		return {
			logout : logout
		}
	}
])

var adminModule = angular.module('AdminModule',
	['AdminAddUserModalModule', 'AdminDeleteUserModalModule', 'AdminUpdateUserModalModule']);

adminModule.controller('AdminController', [ 'allUsersDetailsModel',
	'$uibModal', '$state', 'userCreditsStorage', 'myModalWindowService',
	'LoadMaskService', '$log', 
	function(allUsersDetailsModel, $uibModal, $state, userCreditsStorage,
			myModalWindowService, LoadMaskService, $log){
		var thisPointer = this;
		var allUsersDetails = null;

		$log.getInstance("Admin");

		// load data about all users. 
		loadUsersDetails();
		// show in table.
		function loadUsersDetails(){
			LoadMaskService.activateLoadMask();
			allUsersDetailsModel.getDetails().then(
				function successCallBack(details){	
					$log.info("Users data was loaded.");
					thisPointer.alldetails = details;
					allUsersDetails = details;
					LoadMaskService.deactivateLoadMask();					
				} , 
				function errorCallBack(){
					LoadMaskService.deactivateLoadMask();
					$log.warn("Users data loading error.");
					// show modal about error
					myModalWindowService.showModal("type10");
					// send redirect if user hasn't admin access					
					// or redirect him to anywhere
				}
			);
		}

		// add new user
		thisPointer.adduser = function (login, password, name, age, date){
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",
	  			controller: "AdminAddUserModal",
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if (!_.isEmpty(result)){									
					// activate loadmask	  			
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.addUser(result.login, 
							result.password, result.name, result.age, result.date).then(
						function successCallBack(){
							$log.info("New user \'" + result.login + "\' was added.");
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
							// deactivate loadmask
						}, function errorCallBack(){
							$log.warn("User \'" + result.login + "\' creation error.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type13");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
				// myModalWindowService.showModal("type13");
	  		})
		}

		// update user
		thisPointer.update = function (login){
			// login, password, name, age, date
			// open modal window for updating fields
			var isAdmin = userCreditsStorage.getUserCredits().admin;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",
	  			controller: "AdminUpdateUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userDetails : function(){
	  					// console.log(" login " + login + " allUsersDetails[login] " + JSON.stringify(allUsersDetails[login]));
	  					return allUsersDetails[login];
	  				}
	  			}	  				
	  		});	
	  		modalInstance.result.then(function(result){ 
	  			if (!_.isEmpty(result)){
					// activate loadmask

	  				LoadMaskService.activateLoadMask();					
					allUsersDetailsModel.updateUser(result.login, 
							result.password, result.name, result.age, result.date, login).then(
						function successCallBack(){							
							$log.info("Update user. Submited data: " + JSON.stringify(result));
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
						}, function errorCallBack(){
							$log.warn("User cann't be updated.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type12");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;	
	  		})
		}

		// delete user
		thisPointer.delete = function (login){			
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",
	  			controller: "AdminDeleteUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userLoginDelete : function(){	  					
	  					return login;
	  				}
	  			}	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
				// console.log(" submited result " + JSON.stringify(result));	  			
	  			if ( result.deleteFlag ){
					// console.log(" try to delete "  + result.deleteFlag);
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.deleteUser(login).then(
						function successCallBack(){
							$log.info("User was deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();
						}, function errorCallBack(){
							$log.warn("User cann't be deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type11");
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;
	  		})
		}
	}
])
var dashboardModule = angular.module('DashboardModule',
	['DiagramModule']);

dashboardModule.controller('DashboardController', ['$scope', '$state', '$interval',
  'userDataStorage', 'userDetailsService', 'loadChartDataService', 'LoadMaskService',
  function($scope, $state, $interval, userDataStorage, 
      userDetailsService, loadChartDataService, LoadMaskService){
    // show chart. stream from server
    var thisPointer = this;
    
    // initial parameters for charts: 
    var initParameters = {
      "1": {
        "stream":"/app/chartdata1", 
        "color":"#FFCC80", 
        "aproximatecolor":"#EF6C00"
      }, 
      "2": { "id": 2,
        "stream":"/app/chartdata2", 
        "color":"#80CBC4", 
        "aproximatecolor": "#00695C"
      }
    }

  /*  "maxAmountOfPoints" : 480,
      "updateTimeout" : 500,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStep" : 40,      - step in px per notch  
      "notchXName" : "point", - notch name
      "notchXWidth" : 5,      - width of notch-line      
      "notchYStep" : 100,   
      "notchYName" : "point", - notch name

      notice: chart height = main-height - (paddingYTop + paddingYBottom)
              chart width = main-width - (paddingXLeft + paddingXRight)  
  */    
    var chartProperties = {
      "mainWidth" : 480,
      "mainHeight" : 400,     
      "updateTimeout" : 1500,
      "updateXStep": 50,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStartValue" : 10,
      "notchXStep" : 40,
      "notchXWidth" : 5,      
      "notchXName" : "point",      
      "notchYWidth" : 5,
      "notchYName" : "point",
    }

    var maxAmountOfPoints = chartProperties.mainWidth;    
    // timeout for redraw diagram
    var updateTimeout = chartProperties.updateTimeout; // ms
    // make graph object
    var graphObjects = {};
    _.forEach(initParameters, function(value, key){      
      graphObjects[key] = {
          "id": key,
          "stream": value.stream,
          "color": value.color,
          "aproximatecolor": value.aproximatecolor
      }      
    });
    // data storage for downloadded datas
    var dataDownloaded = {};
    var dataDownloadedProperties = {};
    // amount of points availale to make step
    var updateStep = 0;    
    // object-storage for $interval's
    var intervalObject;
    function destroyInterval(){      
        if (angular.isDefined(intervalObject)){
          $interval.cancel(intervalObject);
          intervalObject = undefined;
        }      
    }
    $scope.$on('$destroy', function(){
        destroyInterval();
      }
    );
    function startUpdate(){
      // deactivate load mask in case of showing diagram
      LoadMaskService.deactivateLoadMask();
      intervalObject = $interval(function(){
            // console.log(" update timeout ");
        thisPointer.chartOptions.properties = chartProperties;
        _.forEach(graphObjects, function(value, key){ 
          if (!dataDownloaded[key]){
            dataDownloaded[key] = {};
            dataDownloaded[key].id = key;
            dataDownloaded[key].data = [];
            dataDownloaded[key].color = value.color;
            dataDownloaded[key].aproximatecolor = value.aproximatecolor;
            dataDownloadedProperties[key] = {};
            dataDownloadedProperties[key].iswaitingload = false;
            dataDownloadedProperties[key].updateStep = 0; 
          }          
          if (!dataDownloadedProperties[key].iswaitingload){            
            dataDownloadedProperties[key].updateStep = 0;            
            dataDownloadedProperties[key].iswaitingload = true;
            // load data for current stream
            loadChartDataService.loadData(value.stream).then(
              function successCallBack( details ){
                dataDownloadedProperties[key].updateStep = details.data.length;
                dataDownloaded[key].data = _.concat(dataDownloaded[key].data , details.data);
                dataDownloadedProperties[key].iswaitingload = false;
                thisPointer.chartOptions.streams[key] = dataDownloaded[key];
              }, function errorCallBack(reason){
                // show error modal message                
                $state.go("root.login");
                console.log("Cann't load chart data from server. Reason: " + reason);
              }
            )          
          }
        })
        var currentMaxLengthOfStream = 0;
        _.forEach(graphObjects, function(value, key){
          if (dataDownloaded[key].data.length > currentMaxLengthOfStream) {
            currentMaxLengthOfStream = dataDownloaded[key].data.length;
          }
          if (dataDownloadedProperties[key].updateStep > updateStep) {
            updateStep = dataDownloadedProperties[key].updateStep;
          }
        })
        var temp = currentMaxLengthOfStream - maxAmountOfPoints;
        if (temp > 0){
          _.forEach(graphObjects, function(value, key){
            dataDownloaded[key].data.splice(0, temp);
          })          
        }        
        userDataStorage.setUserData(dataDownloaded, "chartData");
        userDataStorage.setUserData(dataDownloaded, "chartDataProperties");
        userDataStorage.setUserData(chartProperties, "chartProperties");        
        thisPointer.chartOptions = { 
          "streams": dataDownloaded,
          "streamsProperties": dataDownloadedProperties,          
          "properties" : chartProperties        
        }        
      }, updateTimeout);
    }

    // take data from userStorage
    if (_.isEmpty(dataDownloaded)){      
      var temp = userDataStorage.getByKeyUserData("chartData");
      if (temp !== undefined){
        dataDownloaded = _.cloneDeep(temp);
        dataDownloadedProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartDataProperties"));
        chartProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartProperties"));
      }
      thisPointer.chartOptions = { 
        "streams": dataDownloaded,
        "streamsProperties": dataDownloadedProperties, 
        "properties" : chartProperties        
      } 
    }
    startUpdate();
  }
])
var feedbackModule = angular.module('FeedbackModule',
	['FeedbackModalModule']);

feedbackModule.controller('FeedbackController', ['$state',
  'myModalWindowService', 'LoadMaskService', '$log', 
  'feedbackService', 'feedbackModalService',
  function($state, myModalWindowService, LoadMaskService, $log, 
  			feedbackService, feedbackModalService){      
	    var thisPointer = this;
	    $log.getInstance("Feedback");
	    thisPointer.sendemail = function(){		    
		    var data = {
		    	"from" : thisPointer.name,
			    "to" : thisPointer.email,
			    "content" : thisPointer.textarea
		    }
		    // process data		       
		    var processedData = "From: \"" + data.from + "\". " + 
				"To: \"" + data.to + "\". " + 
				"Content: \"" + data.content + "\".";		    
		    // open modal
			feedbackModalService.openModal(processedData).then(
				function successCallBack(resultMessage){					
					LoadMaskService.activateLoadMask();
					var jsonResultMessage = {
				    	"from" : thisPointer.name,
					    "to" : thisPointer.email,
					    "content" : thisPointer.textarea
				    }
				    // read all available email in address-email and try send 
				    //untill it will be sent

					// feedbackService.sendFeedback(
					// 		jsonResultMessage.from, 
					// 		jsonResultMessage.to,
					// 		jsonResultMessage.content ).then(
					var toArray = jsonResultMessage.to.split(",");
					feedbackService.setContent(jsonResultMessage.content);
					feedbackService.sendFromDecorator(
							jsonResultMessage.from, 
							toArray ).then(
						function successCallBack(result){
							LoadMaskService.deactivateLoadMask();
							$log.info("Feedback is sent.");
							// clear feedback form
							thisPointer.name = "";
		    				thisPointer.email = "";
		    				thisPointer.textarea = "";
							//ok
						}, function errorCallBack(error){
							// don't clear feedback form
							LoadMaskService.deactivateLoadMask();		
							$log.warn("Feedback cann't be sent.");
							// show modal error
							myModalWindowService.showModal("type20");
						}
					)
				}, function errorCallBack(error){
					// don't send
					// don't clear feedback form
					// log	
					$log.log("Feedback wasn't sent. Canseled.");				
				}
			)
	    }     
  }
])
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
            // console.log (" error in user details. " + reason);
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
            // console.log (" error in user details. " + reason);
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
          // console.log("Data check is not passed.");
          $log.warn("Entered data is not valid.");
          myModalWindowService.showModal("type4");
        }
      }
  }
])
adminModule.service('allUsersDetailsModel', ['allUsersDetailsService', '$q',
	function(allUsersDetailsService , $q){
		var allUsersDetails = {};
		function deleteUser(login){
			var deferred = $q.defer();
			allUsersDetailsService.deleteUser(login).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}
			)
			return deferred.promise;
		}
		// login cann't be updated
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			allUsersDetailsService.updateUser(login, password, name, age, date, oldLogin).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}			
			);
			return deferred.promise;
		};
		function getDetails(){
			var deferred = $q.defer();			
			allUsersDetailsService.getAllUsersDetails().then(
				function successCallback(details){			
					allUsersDetails = {};
					_.forEach(details.usercredits, function (value, key){
						allUsersDetails[key] = {};
						allUsersDetails[key].login = key;
						allUsersDetails[key].password = value.password;
						allUsersDetails[key].name = details.userdata[key].name;
						allUsersDetails[key].age = details.userdata[key].age;
						allUsersDetails[key].date = details.userdata[key].date;
					})
					// console.log( " ++ alldetails ++ " + JSON.stringify(allUsersDetails ));
					deferred.resolve(allUsersDetails);
				} , function errorCallback(error){
					console.log("Cann't load details to all users.");
					allUsersDetails = {};
					deferred.reject(allUsersDetails);
				}
			)
			return deferred.promise;
		}
		return {
			getDetails: getDetails,
			updateUser: updateUser,
			deleteUser: deleteUser,
			addUser : updateUser
		}
	}
])
adminModule.service('allUsersDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;

		// function addNewUser(login, password, name, age, date){
			// function 'updateUser' is used in this case
		// }

		function deleteUser(login){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/deleteuser',
				data: {
					userdeletelogin : login
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden. Status: " + error.status);	
				// console.log(" why : " + JSON.stringify(error));
				deferred.reject(error.status);
			})
			return deferred.promise;
		}
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/updateuserdata',
				data: {
					login : login, 
					password : password, 
					name : name, 
					age : age , 
					date : date,
					oldlogin : oldLogin
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden.");				
				deferred.reject();
			})
			return deferred.promise;
		}
		function getAllUsersDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/getusersdata'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				// console.log("error. unauthorised ? ");
				console.log("Action is forbidden.");	
				// show modal 

				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getAllUsersDetails : getAllUsersDetails,
			updateUser : updateUser,
			deleteUser : deleteUser
		}
	}
])
dashboardModule.service('loadChartDataService', [ '$http', '$q', 
	function($http, $q){

		return {
			loadData : function(urlstream){
				var deferred = $q.defer();
				var urlString = urlstream.toString(urlstream);
				$http({
					method : 'POST',
					url : urlString
				}). then( function successCallback(response){
					deferred.resolve(response.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				})
				return deferred.promise;
			}
		}
	}])
feedbackModule.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
feedbackModule.service('feedbackService', ['$uibModal', '$http', '$q',
	function($uibModal, $http, $q){
		function sendFeedback(from, to, content){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/feedback/send',
				data: {
					"from" : from,
					"to" : to,
					"content" : content
				}
			}).then( function successCallback(details){
					deferred.resolve(details.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				}
			)
			return deferred.promise;			
		}
		return {			
			sendFeedback : sendFeedback
		}
	}
])
tabTwoModule.service('updateUserDetailsService', ['$http', '$q', 
	function($http, $q){
		function updateUserDetails(json){
			var deferred = $q.defer();
			$http({
				method : 'POST',
				url: '/app/updateuserdetails',
				data: json
			}).then(function successCallback(response){
					// ok
					deferred.resolve(response.data);
				}, function errorCallback(error){
					// error
					deferred.reject(error);
				}
			)
			return deferred.promise;
		}
		return {
			updateUserDetails : updateUserDetails
		}
	}
])

var adminAddUserModalModule = angular.module('AdminAddUserModalModule',
	[]);

adminAddUserModalModule.controller('AdminAddUserModal', 
  [ '$translate', '$uibModalInstance',  
  	'userCreditsStorage',
  function($translate, $uibModalInstance,  
  	userCreditsStorage) {     
   	this.submit = function(){
  		// read input data 
  		var resultData = {
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var adminDeleteUserModalModule = angular.module('AdminDeleteUserModalModule',
	[]);

adminDeleteUserModalModule.controller('AdminDeleteUserModal', 
  [ '$scope', '$translate', '$uibModalInstance', 'userLoginDelete',
  function( $scope, $translate, $uibModalInstance, userLoginDelete) {     
    var deleteFlag = false;
    this.userLoginDelete = userLoginDelete;
   	this.submit = function(){
  		//this.userdetails.login
      deleteFlag = true;
  		close(deleteFlag);
  	}
  	this.cansel = function(){
  		close(deleteFlag);
  	}
    function close(deleteFlag) {     
      $uibModalInstance.close({deleteFlag : deleteFlag});      
    };
}]);

var adminUpdateUserModalModule = angular.module('AdminUpdateUserModalModule',
	[]);

adminUpdateUserModalModule.controller('AdminUpdateUserModal', 
  [ '$scope', '$uibModalInstance', 'userDetails', 
  	'userCreditsStorage',
  function( $scope, $uibModalInstance, userDetails, 
  	userCreditsStorage) {     
    // make clone to avoid unexpected changing
  	this.userdetails = _.clone(userDetails);
   	this.logindisabled = false;
		if ( String(userCreditsStorage.getUserCredits().login) === userDetails.login){
			this.logindisabled = true;
		}
  	this.submit = function(){
  		// read input data 
  		var resultData = {        
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var diagramModule = angular.module('DiagramModule',[]);

diagramModule.controller('DiagramController', [ '$scope', '$state', 
  '$interval', 'ChartHelperService',
  function($scope, $state, $interval, ChartHelperService){
    var thisPointer = this;    
    var graphs = this.graphs;
    var svgtexts = this.svgtext;

    // object (streams, properties) from 'dashboardController'           
    this.mainwidth = this.chartOptions.properties.mainWidth;
    this.mainheight = this.chartOptions.properties.mainHeight;
       
    // initial data for graph object of chart
    var graphObjects = {};   
    // main data storage (from here polyline is drawn)
    var data = {};   
    // flag for first start graphObjects
    var firstStartGraphObjects = true; 
    var enableStep = false;
    var watcherOne = $scope.$watch( function(){return thisPointer.chartOptions.streams}, 
      function(newValue, oldValue){        
        enableStep = false;
        // init graphObjects if it isn't inited
        if (_.isEmpty(graphObjects)){
          if (!_.isEmpty(thisPointer.chartOptions.streams)){
            _.forEach(thisPointer.chartOptions.streams, function(value, key){ 
              graphObjects[key] = {
                "id": key,
                "color": value["color"],
                "aproximatecolor": value["aproximatecolor"]
              }
            })
            ChartHelperService.init(graphObjects, thisPointer.chartOptions);
          }
        }
        _.forEach(graphObjects, function(value, key){
          if(!data[key]){
            data[key] = {};
            data[key].id = key;
            data[key].color = value.color;
            data[key].data = {};
          }
          if(thisPointer.chartOptions.streamsProperties[key].updateStep > 0){
            enableStep = true;
          }
        })
        if (enableStep){
          ChartHelperService.makeStep(data, thisPointer.chartOptions);
        }
        // get calculated datas and send it to draw        
        thisPointer.graphs = ChartHelperService.getGraph();
        thisPointer.svgtexts = ChartHelperService.getText();
        thisPointer.notches = ChartHelperService.getNotch();
      },
      true
    );
    $scope.$on('$destroy', function(){
        watcherOne();
      }
    ); 
  }
])
diagramModule.directive('mychart', [ 
  function(){
    
    return {
      restrict: 'E',
      controller: 'DiagramController',
      controllerAs: 'chart',
      templateUrl: 'app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html',       
      bindToController: {          
        chartOptions: '=chartOptions' 
      },   
      link: function (scope, element, attr, ctrl){        
        var chartAllPoints = attr.chartAllPoints;       
      }
    }
  }
])
diagramModule.factory('ChartHelperService', [
	function(){
    var graphs = {};   
    var svgTexts = {};
    var notches = {};

    var graphObjects = {};     
    var heightStep = 1;     // 'y' - height step to draw chart (float)
    var maxHeightValue = 1;    // max height value2             (int)
    var minHeightValue = 0; // min height value2                (int)
    // var step = 1;             // 'x' step to draw chart         (int)      
    var idsArray = [];
    var idsAproxAray = [];
    var idsAllArray = [];
    var _strAprox = "aprox";
    // id value and generator for objects 'data' in 'graph'
    var _idCounter = 0;
    function _idGenerator(){
      return ++_idCounter;
    }
    // available dimensions for drawing chart
    var availableMainHeight;
    var availableMainWidth;
    // symbol dimensions:
    var oneSymbolWidth = 8; // 10 px
    var oneSymbolHeight = 14; // 14 px
    // object of initial data for chart
    var chartOptions;
    // init function for helper.
    function init(graphObj, chartOpt){
      graphObjects = graphObj;
      chartOptions = chartOpt;
      if( _.isEmpty(chartOptions.streams)){
          console.log(" - object 'chartOptions.streams' is empty")
        } else {
          // init availableMainHeight and 
          availableMainHeight = chartOptions.properties.mainHeight - 
            (chartOptions.properties.paddingYTop + chartOptions.properties.paddingYBottom);
          availableMainWidth = chartOptions.properties.mainWidth - 
            (chartOptions.properties.paddingXLeft + chartOptions.properties.paddingXRight);

          _.forEach(chartOptions.streams, function(value, key){
            if (_.indexOf(idsArray, value.id) < 0){
              idsArray.push(value.id);
              idsAllArray.push(value.id);
              // init graph
              if (!graphs[key]){
                graphs[key] = {};
                graphs[key].id = value.id;
                graphs[key].color = value.color;
                graphs[key].aproximatecolor = value.aproximatecolor;
                graphs[key].data = {}; 
                graphs[key].pointstodraw = '';
                graphs[key].lastXValue = 0;
                notches.lastNotchValue = chartOptions.properties.notchXStartValue;
                notches.beginNotchX = chartOptions.properties.paddingXLeft;
              } 
            } //else { do nothing }
          })        
        }
      // console.log(" chartOptions " + JSON.stringify( chartOptions) );
    }

    function makeStep(data){
      var calculatedXMoveLeftStep = 0;
      var maxLastXValue = 0;      
      maxLastXValue = findMaxXValue();
      moveXToLeft();
      addNewDataY();
      findMaxAndMinY();      
      calculateAproximateLine();
      calculateNewPointY(); 
      drawRim();
      makeAxises();
      // functions :
      function findMaxXValue(){
        // look for value of 'maxLastXValue'
        _.forEach(graphObjects, function(value, key){
          if( graphs[key].lastXValue > maxLastXValue){
            maxLastXValue = graphs[key].lastXValue;
          }
        });
        return maxLastXValue;             
      }
      function moveXToLeft(){
        // array for data which should be deleted
        var dataIdToDelete = [];
        if( (maxLastXValue ) > availableMainWidth ){
          calculatedXMoveLeftStep = maxLastXValue  - availableMainWidth;
          // move previous data to left border on required value - calculate it
          var newBeginNotchX = notches.beginNotchX + (chartOptions.properties.updateXStep - calculatedXMoveLeftStep);
          notches.beginNotchX = newBeginNotchX;
          notches.lastNotchValue += chartOptions.properties.notchXStep;

          _.forEach(graphObjects, function(value, key){
            var newlastXValue = graphs[key].lastXValue - (calculatedXMoveLeftStep);            
            graphs[key].lastXValue = newlastXValue < 0  ? 0 : newlastXValue;
            var paddingXLeft = chartOptions.properties.paddingXLeft;
            _.forEach(graphs[key].data, function(value2, key2){              
                var flagToDelete = true;
                var idPointToDelete = -1;                
                for (var i=0; i < value2.dataY.length; i++){
                  // move left dataX value                  
                  value2.pointX[i] -= calculatedXMoveLeftStep;
                  graphs[_strAprox+key].data[key2].pointX[i] -= calculatedXMoveLeftStep;
                  if( value2.pointX[i] <= paddingXLeft){
                    idPointToDelete = i;
                  }
                  if (value2.pointX[i] > paddingXLeft){
                    flagToDelete = false;
                  }
                }
                // check if current dataObj all pointX < 0
                if(flagToDelete){
                  dataIdToDelete.push(key2);
                } else {
                  if (idPointToDelete >=0){
                    value2.dataY = _.drop(value2.dataY, 1+idPointToDelete);
                    value2.pointX = _.drop(value2.pointX, 1+idPointToDelete);
                    value2.pointY = _.drop(value2.pointY, 1+idPointToDelete);
                    value2.points = _.drop(value2.points, 1+idPointToDelete);
                    value2.stepPointsAmount -= idPointToDelete;
                    graphs[_strAprox+key].data[key2].dataY = _.drop(graphs[_strAprox+key].data[key2].dataY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointX = _.drop(graphs[_strAprox+key].data[key2].pointX, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointY = _.drop(graphs[_strAprox+key].data[key2].pointY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].points = _.drop(graphs[_strAprox+key].data[key2].points, 1+idPointToDelete);
                  }
                }                              
            })
            // delete dataObj with all pointX < 0
            _.forEach(dataIdToDelete, function(value3){
              delete graphs[key].data[value3];
              delete graphs[_strAprox+key].data[value3];
            })
            dataIdToDelete = [];
          })
        };             
      }

      function addNewDataY(){
        _.forEach(graphObjects, function(value, key){
          // amount of points in current step
          var tempUpdateStep = _.clone(chartOptions.streamsProperties[key].updateStep);          
          // add new points to graphs[key].lastXValue
          if(tempUpdateStep > 0){
            // increase lastXValue
            graphs[key].lastXValue += chartOptions.properties.updateXStep;
            // set to zero 'updateStep' in 'streamsProperties'
            chartOptions.streamsProperties[key].updateStep = 0;
            // process it
            if(tempUpdateStep > 0 ){
              var tempId = _idGenerator();
              // create object 'data' : graphs[key].data[tempId]
              graphs[key].data[tempId] = {};
              // get amount 'tempUpdateStep' last data from the stream
              var tempArray = _.takeRight(chartOptions.streams[key].data, tempUpdateStep);
              graphs[key].data[tempId].dataY = _.cloneDeep(tempArray);
              graphs[key].data[tempId].pointX = [];
              graphs[key].data[tempId].pointY = [];
              graphs[key].data[tempId].points = [];
              // amount of points in current step
              graphs[key].data[tempId].stepPointsAmount = tempUpdateStep;
              // length of current step per point (round to 0.001)
              graphs[key].data[tempId].stepX = 
                _.round(chartOptions.properties.updateXStep / tempUpdateStep , 3);
              
              var tempLastXValue = graphs[key].lastXValue - chartOptions.properties.updateXStep;
              for (var i=0; i < tempUpdateStep; i++){
                graphs[key].data[tempId].pointX[i] = chartOptions.properties.paddingXLeft +
                  tempLastXValue + graphs[key].data[tempId].stepX * i;
              }
            }
          }
        });        
      }
      
      function findMaxAndMinY(){
        var currentMinHeight = 0;
        var currentMaxHeight = 0;   
        _.forEach(graphObjects, function(value, key){           
          // calculate height step (look through all datas in graph)
          _.forEach(graphs[value.id].data, function(value2, key2){
              _.forEach(value2.dataY, function(value3, key3){
                var tempValue3 = parseInt(value3)
                if (currentMinHeight > tempValue3){
                  currentMinHeight = tempValue3;
                }
                if (minHeightValue > tempValue3){
                  minHeightValue = tempValue3;
                }
                if (currentMaxHeight < tempValue3){
                  currentMaxHeight = tempValue3;
                }
                if (maxHeightValue < tempValue3){
                  maxHeightValue = tempValue3;
                }
                // correct global max and min value
                if (minHeightValue < currentMinHeight){
                  minHeightValue++;
                }
                if (maxHeightValue > currentMaxHeight){
                  maxHeightValue--;
                }                
              })
          });
        });        
        // calculate heightstep
        heightStep = _.round(availableMainHeight / (maxHeightValue + Math.abs(minHeightValue)) , 9);
      }
      
      //calculate aproximate line and add it to graph
      function calculateAproximateLine(){
        var aproximateRatePercent = 21;
        _.forEach(graphObjects, function(value, key){
            if( !graphs[_strAprox+key]) {
              graphs[_strAprox+key] = {};
              graphs[_strAprox+key].pointstodraw = '';
              graphs[_strAprox+key].data = {};
              graphs[_strAprox+key].color = graphObjects[key].aproximatecolor;
            }
            _.forEach(graphs[key].data, function(value3, key3){              
              if ( ! graphs[_strAprox+key].data[key3] ) { // if undefined
                graphs[_strAprox+key].data[key3] = {};
                graphs[_strAprox+key].data[key3].dataY = [];
                graphs[_strAprox+key].data[key3].pointX = [];
                graphs[_strAprox+key].data[key3].pointY = [];
                graphs[_strAprox+key].data[key3].points = [];
                // calculate aproximate line                
                  if (value3.stepPointsAmount > 2){
                    // find aproximate rate of data in current step                     
                    // callculate available aproximate rate
                    var aproximateRate = Math.round((aproximateRatePercent/100) * (value3.stepPointsAmount));
                    if (aproximateRate < 2) {
                      aproximateRate = 2;
                    }
                    var aproximateBegin = Math.floor(aproximateRate/2);
                    var aproximateEnd = Math.ceil(aproximateRate/2);                    
                    // calculate aproximate dataY
                    for (var i=aproximateBegin; i < (value3.stepPointsAmount - aproximateEnd); i++){
                      var point;    
                      var currentPoint = 0;
                      var a = 0;
                      var b = 0;                             
                      var sumXY = 0;
                      var sumX = 0;
                      var sumY = 0;
                      var sumX2 = 0;               
                      for (var j= 0-aproximateBegin; j<aproximateEnd; j++ ){
                        sumXY += (i+j)*graphs[key].data[key3].dataY[i+j];
                        sumX += (i+j);
                        sumY += graphs[key].data[key3].dataY[i+j];
                        sumX2 += (i+j)*(i+j);
                      }
                      a = (aproximateRate*sumXY - sumX*sumY) / ( aproximateRate * sumX2 - sumX*sumX);
                      b = (sumY - a * sumX) / aproximateRate;
                      // calculate begin of data
                      if ( i === aproximateBegin){
                        // save beginner point
                        graphs[_strAprox+key].data[key3].dataY[0] = graphs[key].data[key3].dataY[0]; 
                        graphs[_strAprox+key].data[key3].pointX[0] = graphs[key].data[key3].pointX[0];
                        graphs[_strAprox+key].data[key3].pointY[0] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[0] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[0] + 
                          "," + graphs[_strAprox+key].data[key3].pointY[0];
                        graphs[_strAprox+key].data[key3].points.push(point);
                        if(aproximateBegin > 1){
                          for (var n=1; n < aproximateBegin; n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } // else { do nothing }
                      }    
                      // calculate aproximated valiu in current point
                      currentPoint = _.round( (a * i + b) , 3);
                      if (!isNaN(currentPoint)){
                        graphs[_strAprox+key].data[key3].dataY[i] = currentPoint; 
                        graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                        graphs[_strAprox+key].data[key3].pointY[i] = 
                          (availableMainHeight + chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                        graphs[_strAprox+key].data[key3].points.push(point);
                      }
                      var tempStepPointsAmount = value3.dataY.length;
                      // calculate end of data
                      if ( i === (tempStepPointsAmount - aproximateEnd -1) ){
                        var end = tempStepPointsAmount -1;
                        if( tempStepPointsAmount - aproximateEnd > 1){
                          for (var n = (end - aproximateEnd + 1); n < (end ); n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                                chartOptions.properties.paddingYTop - 
                                (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } else{ }
                          // end point from received data
                          graphs[_strAprox+key].data[key3].dataY[end] = graphs[key].data[key3].dataY[end]; 
                          graphs[_strAprox+key].data[key3].pointX[end] = graphs[key].data[key3].pointX[end];
                          graphs[_strAprox+key].data[key3].pointY[end] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[end] + 
                              Math.abs(minHeightValue))));
                          point = graphs[_strAprox+key].data[key3].pointX[end] + "," + graphs[_strAprox+key].data[key3].pointY[end];
                          graphs[_strAprox+key].data[key3].points.push(point);                        
                      }
                    }                  
                    // graphs[_strAprox+key].pointstodraw = String.concat(graphs[_strAprox+key].pointstodraw, 
                    //         " ",
                    //         graphs[_strAprox+key].data[key3].points.join(' ') );
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw +  
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
                  else{
                    // copy points from original data
                    for (var i=0; i < (graphs[key].stepPointsAmount); i++){
                      graphs[_strAprox+key].data[key3].dataY[i] = currentPoint;  
                      graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                      graphs[_strAprox+key].data[key3].pointY[i] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                      point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                      graphs[_strAprox+key].data[key3].points.push(point);
                    }    
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw + 
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
              }
            })    
        }) 
      }

      function calculateNewPointY(){
        // calculate 'point to draw'
        _.forEach(graphObjects, function(value, key){ 
          graphs[key].pointstodraw = '';
          graphs[_strAprox+key].pointstodraw = '';
          var firstFlag = true;
          _.forEach(graphs[key].data, function(value2, key2){
            for(var i=0; i < value2.dataY.length; i++){
              value2.pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              value2.points[i] = value2.pointX[i] + "," + value2.pointY[i];
              graphs[_strAprox+key].data[key2].pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[_strAprox+key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              graphs[_strAprox+key].data[key2].points[i] = 
                graphs[_strAprox+key].data[key2].pointX[i] + 
                "," + 
                graphs[_strAprox+key].data[key2].pointY[i];
            }
            // add pointstodraw to 'value.pointstodraw'
            if(firstFlag){
              graphs[key].pointstodraw
            }
            graphs[key].pointstodraw = 
              String(graphs[key].pointstodraw +  
              ' ' + 
              graphs[key].data[key2].points.join(' '));
            graphs[_strAprox+key].pointstodraw = 
              String(graphs[_strAprox+key].pointstodraw + 
              ' ' +
              graphs[_strAprox+key].data[key2].points.join(' '));            
          });          
        });        
      }

      // object to keep notches, which should be deleted from view
      var notchesToDelete = {};  
      function makeAxises( ){
        var zeroLine = calculateZeroLine();
        var zeroLineGraph = zeroLine.getLine();
        var zeroLineText = zeroLine.getText();
        var zeroNotch = zeroLine.getNotch();
        // copy previous lines delete old lines after
        notchesToDelete = _.cloneDeep(notches);    
        delete notchesToDelete.lastNotchValue;        // little fix. it should stay in obj 'notches'
        delete notchesToDelete.beginNotchX;           // little fix. it should stay in obj 'notches'
        svgTextToDelete = _.cloneDeep(svgTexts);        
        calculateYNotches();
        calculateXNotches(); 
        // clean 'notches' to delete
        if ( !_.isEmpty(notchesToDelete)){
          _.forEach(notchesToDelete, function(value, key){ 
            console.log(" Notch to delete (id): " + value.id);   //
            delete notches[value.id];                 
          })
          // reset linesToDelete obj;
          notchesToDelete = {};
        } 
        if ( !_.isEmpty(svgTextToDelete)){
          _.forEach(svgTextToDelete, function(value, key){
            delete svgTexts[value.id];
          })               
          svgTextToDelete = {};
        }
        // add zero line
        graphs[zeroLineGraph.id] = zeroLineGraph;
        svgTexts[zeroLineText.id] = zeroLineText;
        notches[zeroNotch.id] = zeroNotch;
      };

      function calculateXNotches(){
          var xNotchString = "xNotch";   // id name word
          // for xNotch from 'paddingXLeft' to 'paddingXLeft + availableMainWidth'
          var paddingXLeft = chartOptions.properties.paddingXLeft;
          var notchWidth = chartOptions.properties.notchYWidth;
          var coordinateX = notches.beginNotchX;
          var y = chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom;
          var notchStep = chartOptions.properties.notchXStep;         
          for (var i=0; ((i<25) && (coordinateX < (paddingXLeft + availableMainWidth))); i++ ){
              var notch = {
                "id" : (xNotchString+i),
                "x1" : (coordinateX),
                "y1" : (y),
                "x2" : (coordinateX),
                "y2" : (y + notchWidth),
                "col" : "#1f1f1f",
                "width" : 1
              }
              // notches.lastNotchValue
              var textVal = String.toString(notches.lastNotchValue);
              var text = {
                  "id" : (xNotchString+i),
                  "text" : (notches.lastNotchValue + i*notchStep) ,
                  "x" : (coordinateX),
                  "y" : (y + notchWidth + oneSymbolHeight) ,
                  "col" : "#F44336"
                };
              notches[notch.id] = notch;
              delete notchesToDelete[notch.id];
              coordinateX += chartOptions.properties.updateXStep;
              svgTexts[text.id] = text;
              delete svgTextToDelete[text.id];
          }
      }

      // the least size between lines - 20 px
      function calculateYNotches(){
        // calculate amount of above 0x lines
        var availableNotchSteps = [5, 25, 50, 100, 500, 1000];
        var notchStringAbove = "aboveNotchX";
        var notchStringUnder = "underNotchX";        
        calculateNotchFor("+" , notchStringAbove, 1, maxHeightValue);
        calculateNotchFor("-" , notchStringUnder, -1, Math.abs(minHeightValue));
        // internal function. Is used only here
        function calculateNotchFor(sign , name, direction, heightValue){
          _.forEach(availableNotchSteps, function(value, key){
            var amount =  _.floor(heightValue / value) ;
            if( amount > 0){
              if (heightStep*value > 20){
                for(var i=1; i < (amount+1); i++){
                    var y = (chartOptions.properties.mainHeight - 
                      chartOptions.properties.paddingYBottom - 
                      Math.abs(minHeightValue*heightStep) -
                      direction*heightStep*value*i
                      );
                    var notch = {
                      "id" : (value+name+i),
                      "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
                      "y1" : (y),
                      "x2" : (chartOptions.properties.paddingXLeft),
                      "y2" : (y),
                      "col" : "#1f1f1f",
                      "width" : 1
                    }
                    var textVal = sign+value*i;
                    var text = {
                      "id" : (value+name+i),
                      "text" : (textVal) ,
                      "x" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth - (oneSymbolWidth * textVal.length)),
                      "y" : (y - 1) ,
                      "col" : "#F44336"
                    }
                    notches[notch.id] = notch;
                    delete notchesToDelete[notch.id];
                    svgTexts[text.id] = text;
                    delete svgTextToDelete[text.id];
                  }
              }
            };
          });
        }        
      };

      function calculateZeroLine( ){
        return {
          getLine : function (){
            return{
              "id":"0xaxis",
              "color": "#808080",
              "data": [ ],
              "pointstodraw": (chartOptions.properties.paddingXLeft) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) + 
                  " " + 
                  (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep))
            }
          },
          getText : function (){
            return {
              "text" : "0",
              "x" : (chartOptions.properties.paddingXLeft - oneSymbolWidth - chartOptions.properties.notchXWidth),
              "y" : (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) ,
              "col" : "#F44336"
            }
          },
          getNotch : function (){            
            var y = (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep));
            return {
              "id":"0xaxis",
              "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
              "y1" : (y),
              "x2" : (chartOptions.properties.paddingXLeft),
              "y2" : (y),
              "col" : "#1f1f1f",
              "width" : 1
            }
          }
        }
      };

      // draw rim around the chart
      function drawRim(){
        var rim = {
          "id":"rim",
          "color": "#4E342E",
          "data": [ ],
          "pointstodraw": (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) + 
              " " + 
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) +
              " " +
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom)
        }
        graphs[rim.id] = rim;
      };  
    }  
    function getGraph(){
      return graphs;
    }
    function getText(){
      return svgTexts;
    }
    function getNotch(){
      return notches;
    }
    return {
      makeStep : makeStep,
      getGraph : getGraph,
      getText : getText,
      getNotch : getNotch,
      init : init
    }
  }
])

var feedbackModalModule = angular.module('FeedbackModalModule',
	[]);


feedbackModalModule.factory('feedbackModalService', ['$uibModal', '$q',
	function($uibModal, $q){
		var dataString = "";
		function openModal(dataStr){
			var deferred = $q.defer();
			dataString = dataStr;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",
	  			controller: function($uibModalInstance){
	  				this.datamessage = dataString;
	  				console.log("  dataString   " + dataString);
	  				this.submit = function(){
	  					close(dataString);
	  				};
	  				function close(result) {     
				      $uibModalInstance.close(result);      
				    }
	  			},
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){ 	  			
				deferred.resolve(result);  				
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            deferred.reject(error);
	  		})
	  		return deferred.promise;
		}
		return {
			openModal : openModal
		}
	}
])
var loadMaskModule=angular.module("LoadMaskModule",[]),ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(e,t,a,o){e.close=function(e){o.close()}}]);var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Root"),r.value?(i.info("User session is valid. Available to show dashboard."),o.go("root.main.dashboard")):(i.info("User session isn't valid. Redirect to loginpage."),o.go("root.login")),e.getAvailableLanguages().then(function(e){d.languages=e,d.selectedLanguage=t.DEFAULT_LANG},function(e){i.warn("Error while download languages. Set to use default: "+t.DEFAULT_LANG),d.languages={1:{code:t.DEFAULT_LANG,name:t.DEFAULT_LANG_NAME}},d.selectedLanguage=t.DEFAULT_LANG}),d.translate=function(){i.info("User select language: "+d.selectedLanguage),a.use(d.selectedLanguage)}}]);var appDecorators=angular.module("appDecorators",[]),appDirectives=angular.module("appDirectives",[]),appProviders=angular.module("appProviders",[]),appServices=angular.module("appServices",[]);loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(e,t,a,o){}}}]),loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(e){function t(){e.removeClass("myloadmask","hidden")}function a(){e.addClass("myloadmask","hidden")}return{activateLoadMask:t,deactivateLoadMask:a}}]),ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(e,t){function a(a){if(!o){o=!0;var n=!0,r=t.$new(n);r.errortype="errormodalwindow.message."+a;var i=e.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:r});i.result.then(function(){o=!1,r.$destroy()},function(e){console.log("Modal window error: "+e),o=!1})}}var o=!1;return{showModal:a}}]),rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,t,a){function o(){var a=t.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),a.resolve(e.data)},function(e){console.log(" load languages.json error."),a.reject(e)}),a.promise}return{getAvailableLanguages:o}}]),app.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),app.config(["$provide",function(e){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},a=function(e,t){var a=new String(e);for(var o in t)a=a.replace("{"+o+"}",t[o]);return a};e.decorator("$log",["$delegate",function(e){function o(){var e=new Date,t=String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds());return t}function n(){var e=new Date,a=e.getDate(),o=e.getMonth()+1;a=a<10?new String("0"+a):new String(a),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var n=new String(a+"-"+monthStr+"-"+e.getFullYear());return n}function r(e,t){function r(e,t,r){return function(){var e=String(o()+" "+n()),i=arguments[0]?new String(arguments[0]):"";r=r?r:"",console[t](a("{0} - {1} {2} ",[e,r,i]))}}return e.log=r(e,"log",t),e.info=r(e,"info",t),e.warn=r(e,"warn",t),e.debug=r(e,"debug",t),e.error=r(e,"error",t),e}return e.getInstance=function(t){t=void 0!==t?t:"",e=r(e,t)},e}])}]),appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.agevalidator(o);return n?(i.$setValidity("ageFormat",!0),t.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("ageFormat",!1),t.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.datevalidator(o);return n?(i.$setValidity("dateFormat",!0),t.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("dateFormat",!1),t.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.namevalidator(o);return n?(i.$setValidity("nameFormat",!0),t.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("nameFormat",!1),t.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}}),appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,t,a,o){function n(e,a){var n=t.defer();return o.login(e,a).then(function(e){access=!0,n.resolve(e)},function(e){n.reject(!1)}),n.promise}function r(){var a=t.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){d=e.data,console.log("Session is valid."),a.resolve(e.data)},function(e){d=null,console.log("Session not valid."),a.reject(e)}),a.promise}function i(){var e=t.defer();return a.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(a.getUserCredits())):r().then(function(t){console.log("provide userCredits from post request"),a.setUserCredits(t),e.resolve(t)},function(t){console.log("Cann't get user credits details."),a.setUserCredits(null),e.reject(t)}),e.promise}var d;return{checkCredentials:n,checkSession:r,getUserCredits:i}}]),appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,t){angular.element(document.querySelector("."+e)).addClass(t)},removeClass:function(e,t){angular.element(document.querySelector("."+e)).removeClass(t)}}}]),appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]),appServices.factory("monthesStorage",["$http","$q",function(e,t){function a(){var a=t.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){a.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),a.reject("Cann't receive date.json file.")}),a.promise}function o(){return void 0!==r?r:void i.then(function(e){return console.log(" Loading monthes from server."),r=e},function(e){r=void 0,console.log("Error in downloading monthes. "+e)})}function n(e){return e%4===0&&(e%100!==0||e%400===0)}var r,i=a();return{getMonthes:o,checkLeapYear:n}}]),appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(t){console.log("set credits in storage: "+e),e=t},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}}),appServices.factory("userDataStorage",function(){var e={};return{setUserData:function(t,a){e[a]=t},getByKeyUserData:function(t){return e[t]},getAllUserData:function(){return e},removeAll:function(){e=null,e={}}}}),appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(){var o=t.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,o.resolve(n)},function(e){console.log("error. unauthorised ? "),a.setUserCredits(null),o.reject(e.data)}),o.promise}var n=null;return{getUserDetails:o}}]),appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(e,t){var a,o=e.NAME_VALIDATOR.NAME_REGEX,n=e.AGE_VALIDATOR.MIN_AGE,r=e.AGE_VALIDATOR.MAX_AGE,i=e.AGE_VALIDATOR.AGE_REGEX,d=e.DATE_VALIDATOR.DATE_REGEX,s=e.DATE_VALIDATOR.SEPARATOR,l=e.DATE_VALIDATOR.MIN_YEAR,c=e.DATE_VALIDATOR.MAX_YEAR,u=e.DATE_VALIDATOR.FEBRUARY_NUMBER,p=e.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,f=e.DATE_VALIDATOR.NUMBER_YEAR,g=e.DATE_VALIDATOR.NUMBER_MONTH,h=e.DATE_VALIDATOR.NUMBER_DAY,m=null,v=0;return{namevalidator:function(e){var t=!1;return t=!!o.test(e)},agevalidator:function(e){var t=!1;return t=!!(e<=r&&e>=n&&i.test(e))},datevalidator:function(e){var o=!1;return a=t.getMonthes(),d.test(e)?(m=e.split(s),m[f]>l&&m[f]<c?(v=m[g]===u&&t.checkLeapYear(m[f])?p:a[m[g]].days,o=m[h]<=v&&m[h]>0):o=!1):o=!1,o}}}]);var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,t,a,o,n){n.getInstance("CheckSession"),a.getUserCredits().then(function(t){n.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(t){n.info("User session isn't valid. Redirect to loginpage."),o.showModal("type2"),e.go("root.login")})}]);var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Login"),r.activateLoadMask(),a.getUserCredits().then(function(e){var a=e.admin;i.info("User check session success."),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!a})},function(e){i.warn("User check session fail."),r.deactivateLoadMask(),t.go("root.login")}),d.submit=function(){var e=d.login,s=d.password;null!==e&&void 0!==e&&""!==e&&null!==s&&void 0!==s&&""!==s?(d.password=null,r.activateLoadMask(),a.checkCredentials(e,s).then(function(a){i.info("User login success.");var n=a.admin;o.setUserCredits({login:e,admin:!!n}),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!n})},function(e){i.warn("User login fail."),r.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,r.deactivateLoadMask(),n.showModal("type1"))}}]);var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;d.isFeedback=!d.isAdmin,a.getUserCredits().then(function(e){d.login=e.login,d.isAdmin=e.admin,d.isFeedback=!d.isAdmin},function(t){e.go("root.login")}),d.logout=function(){r.activateLoadMask(),t.removeAll(),o.logout().then(function(t){i.info("User logout success."),r.deactivateLoadMask(),e.go("root.login")},function(e){i.warn("User logout fail."),r.deactivateLoadMask(),n.showModal("type3")})},d.go=function(t){i.info("User change state to :"+t),e.go(t)}}]),loginModule.service("loginService",["$q","$http",function(e,t){function a(a,o){var n=e.defer();return t({method:"POST",url:"/app/login",data:{login:a,password:o}}).then(function(e){n.resolve(e.data)},function(e){n.reject(!1)}),n.promise}e.defer();return{login:a}}]),tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,t,a,o){function n(){o.removeAll();var n=t.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),a.setUserCredits(null),n.resolve(e.data)},function(e){console.log("Error while logout."),n.reject(e)}),n.promise}return{logout:n}}]);var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){function d(){r.activateLoadMask(),e.getDetails().then(function(e){i.info("Users data was loaded."),s.alldetails=e,l=e,r.deactivateLoadMask()},function(){r.deactivateLoadMask(),i.warn("Users data loading error."),n.showModal("type10")})}var s=this,l=null;i.getInstance("Admin"),d(),s.adduser=function(a,o,s,l,c){var u=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});u.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.addUser(t.login,t.password,t.name,t.age,t.date).then(function(){i.info("New user '"+t.login+"' was added."),r.deactivateLoadMask(),d()},function(){i.warn("User '"+t.login+"' creation error."),r.deactivateLoadMask(),n.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},s.update=function(a){var s=(o.getUserCredits().admin,t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return l[a]}}}));s.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.updateUser(t.login,t.password,t.name,t.age,t.date,a).then(function(){i.info("Update user. Submited data: "+JSON.stringify(t)),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be updated."),r.deactivateLoadMask(),n.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},s["delete"]=function(a){var o=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return a}}});o.result.then(function(t){t.deleteFlag&&(r.activateLoadMask(),e.deleteUser(a).then(function(){i.info("User was deleted."),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be deleted."),r.deactivateLoadMask(),n.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(e,t,a,o,n,r,i){function d(){angular.isDefined(h)&&(a.cancel(h),h=void 0)}function s(){i.deactivateLoadMask(),h=a(function(){l.chartOptions.properties=u,_.forEach(g,function(e,a){m[a]||(m[a]={},m[a].id=a,m[a].data=[],m[a].color=e.color,m[a].aproximatecolor=e.aproximatecolor,v[a]={},v[a].iswaitingload=!1,v[a].updateStep=0),v[a].iswaitingload||(v[a].updateStep=0,v[a].iswaitingload=!0,r.loadData(e.stream).then(function(e){v[a].updateStep=e.data.length,m[a].data=_.concat(m[a].data,e.data),v[a].iswaitingload=!1,l.chartOptions.streams[a]=m[a]},function(e){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+e)}))});var e=0;_.forEach(g,function(t,a){m[a].data.length>e&&(e=m[a].data.length),v[a].updateStep>M&&(M=v[a].updateStep)});var a=e-p;a>0&&_.forEach(g,function(e,t){m[t].data.splice(0,a)}),o.setUserData(m,"chartData"),o.setUserData(m,"chartDataProperties"),o.setUserData(u,"chartProperties"),l.chartOptions={streams:m,streamsProperties:v,properties:u}},f)}var l=this,c={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},u={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},p=u.mainWidth,f=u.updateTimeout,g={};_.forEach(c,function(e,t){g[t]={id:t,stream:e.stream,color:e.color,aproximatecolor:e.aproximatecolor}});var h,m={},v={},M=0;if(e.$on("$destroy",function(){d()}),_.isEmpty(m)){var S=o.getByKeyUserData("chartData");void 0!==S&&(m=_.cloneDeep(S),v=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),u=_.cloneDeep(o.getByKeyUserData("chartProperties"))),l.chartOptions={streams:m,streamsProperties:v,properties:u}}s()}]);var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,t,a,o,n,r){var i=this;o.getInstance("Feedback"),i.sendemail=function(){var e={from:i.name,to:i.email,content:i.textarea},d='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';r.openModal(d).then(function(e){a.activateLoadMask();var r={from:i.name,to:i.email,content:i.textarea},d=r.to.split(",");n.setContent(r.content),n.sendFromDecorator(r.from,d).then(function(e){a.deactivateLoadMask(),o.info("Feedback is sent."),i.name="",i.email="",i.textarea=""},function(e){a.deactivateLoadMask(),o.warn("Feedback cann't be sent."),t.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n){var r=this;n.getInstance("Tab one"),o.activateLoadMask(),t.getUserDetails().then(function(e){n.info("User data was downloaded."),r.userdetails=e,o.deactivateLoadMask()},function(t){n.warn("Error while downloading user data."),o.deactivateLoadMask(),a.showModal("type2"),e.go("root.login")})}]);var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,t,a,o,n,r,i,d){var s=this;d.getInstance("Tab two"),r.getMonthes(),i.activateLoadMask(),t.getUserDetails().then(function(e){d.info("User data was downloaded."),s.userdetails=e,s.newusername=e.name,s.newuserage=e.age,s.newuserdate=e.date,i.deactivateLoadMask()},function(t){d.warn("Error while downloading user data."),i.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),s.submit=function(){if(i.activateLoadMask(),n.namevalidator(s.newusername)&&n.agevalidator(s.newuserage)&&n.datevalidator(s.newuserdate)){var t={newusername:s.newusername,newuserage:s.newuserage,newuserdate:s.newuserdate};a.updateUserDetails(t).then(function(t){d.info("User data was updated."),i.deactivateLoadMask(),e.go("^.tab1")},function(e){d.warn("User data cann't be updated."),i.deactivateLoadMask(),o.showModal("type4")})}else i.deactivateLoadMask(),d.warn("Entered data is not valid."),o.showModal("type4")}}]),adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,t){function a(a){var o=t.defer();return e.deleteUser(a).then(function(e){o.resolve()},function(){o.reject()}),o.promise}function o(a,o,n,r,i,d){var s=t.defer();return e.updateUser(a,o,n,r,i,d).then(function(e){s.resolve()},function(){s.reject()}),s.promise}function n(){var a=t.defer();return e.getAllUsersDetails().then(function(e){r={},_.forEach(e.usercredits,function(t,a){r[a]={},r[a].login=a,r[a].password=t.password,r[a].name=e.userdata[a].name,r[a].age=e.userdata[a].age,r[a].date=e.userdata[a].date}),a.resolve(r)},function(e){console.log("Cann't load details to all users."),r={},a.reject(r)}),a.promise}var r={};return{getDetails:n,updateUser:o,deleteUser:a,addUser:o}}]),adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(a){var o=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:a}}).then(function(e){o.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),o.reject(e.status)}),o.promise}function n(a,o,n,r,i,d){var s=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:a,password:o,name:n,age:r,date:i,oldlogin:d}}).then(function(e){s.resolve()},function(e){console.log("Action is forbidden."),s.reject()}),s.promise}function r(){var o=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){i=e.data,o.resolve(i)},function(e){console.log("Action is forbidden."),a.setUserCredits(null),o.reject(e.data)}),o.promise}var i=null;return{getAllUsersDetails:r,updateUser:n,deleteUser:o}}]),dashboardModule.factory("loadChartDataService",["$http","$q",function(e,t){return{loadData:function(a){var o=t.defer(),n=a.toString(a);return e({method:"POST",url:n}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}}}]),feedbackModule.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,a){function o(e,o,n){var r=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:n}}).then(function(e){r.resolve(e.data)},function(e){r.reject(e)}),r.promise}return{sendFeedback:o}}]),tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function a(a){var o=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:a}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}return{updateUserDetails:a}}]);var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,t,a){function o(e){t.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};o(e)},this.cansel=function(){o({})}}]);var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,t,a,o){function n(e){a.close({deleteFlag:e})}var r=!1;this.userLoginDelete=o,this.submit=function(){r=!0,n(r)},this.cansel=function(){n(r)}}]);var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,t,a,o){function n(e){t.close(e)}this.userdetails=_.clone(a),this.logindisabled=!1,String(o.getUserCredits().login)===a.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};n(e)},this.cansel=function(){n({})}}]);var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(e,t,a,o){var n=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var r={},i={},d=!1,s=e.$watch(function(){return n.chartOptions.streams},function(e,t){d=!1,_.isEmpty(r)&&(_.isEmpty(n.chartOptions.streams)||(_.forEach(n.chartOptions.streams,function(e,t){r[t]={id:t,color:e.color,aproximatecolor:e.aproximatecolor}}),o.init(r,n.chartOptions))),_.forEach(r,function(e,t){i[t]||(i[t]={},i[t].id=t,i[t].color=e.color,i[t].data={}),n.chartOptions.streamsProperties[t].updateStep>0&&(d=!0)}),d&&o.makeStep(i,n.chartOptions),n.graphs=o.getGraph(),n.svgtexts=o.getText(),n.notches=o.getNotch()},!0);e.$on("$destroy",function(){s()})}]),diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(e,t,a,o){a.chartAllPoints}}}]),diagramModule.factory("ChartHelperService",[function(){function e(){return++S}function t(e,t){p=e,s=t,_.isEmpty(s.streams)?console.log(" - object 'chartOptions.streams' is empty"):(i=s.properties.mainHeight-(s.properties.paddingYTop+s.properties.paddingYBottom),d=s.properties.mainWidth-(s.properties.paddingXLeft+s.properties.paddingXRight),_.forEach(s.streams,function(e,t){_.indexOf(m,e.id)<0&&(m.push(e.id),v.push(e.id),l[t]||(l[t]={},l[t].id=e.id,l[t].color=e.color,l[t].aproximatecolor=e.aproximatecolor,l[t].data={},l[t].pointstodraw="",l[t].lastXValue=0,u.lastNotchValue=s.properties.notchXStartValue,u.beginNotchX=s.properties.paddingXLeft))}))}function a(t){function a(){return _.forEach(p,function(e,t){l[t].lastXValue>U&&(U=l[t].lastXValue)}),U}function o(){var e=[];if(U>d){T=U-d;var t=u.beginNotchX+(s.properties.updateXStep-T);u.beginNotchX=t,u.lastNotchValue+=s.properties.notchXStep,_.forEach(p,function(t,a){var o=l[a].lastXValue-T;l[a].lastXValue=o<0?0:o;var n=s.properties.paddingXLeft;_.forEach(l[a].data,function(t,o){for(var r=!0,i=-1,d=0;d<t.dataY.length;d++)t.pointX[d]-=T,l[M+a].data[o].pointX[d]-=T,t.pointX[d]<=n&&(i=d),t.pointX[d]>n&&(r=!1);r?e.push(o):i>=0&&(t.dataY=_.drop(t.dataY,1+i),t.pointX=_.drop(t.pointX,1+i),t.pointY=_.drop(t.pointY,1+i),t.points=_.drop(t.points,1+i),t.stepPointsAmount-=i,l[M+a].data[o].dataY=_.drop(l[M+a].data[o].dataY,1+i),l[M+a].data[o].pointX=_.drop(l[M+a].data[o].pointX,1+i),l[M+a].data[o].pointY=_.drop(l[M+a].data[o].pointY,1+i),l[M+a].data[o].points=_.drop(l[M+a].data[o].points,1+i))}),_.forEach(e,function(e){delete l[a].data[e],delete l[M+a].data[e]}),e=[]})}}function n(){_.forEach(p,function(t,a){var o=_.clone(s.streamsProperties[a].updateStep);if(o>0&&(l[a].lastXValue+=s.properties.updateXStep,s.streamsProperties[a].updateStep=0,o>0)){var n=e();l[a].data[n]={};var r=_.takeRight(s.streams[a].data,o);l[a].data[n].dataY=_.cloneDeep(r),l[a].data[n].pointX=[],l[a].data[n].pointY=[],l[a].data[n].points=[],l[a].data[n].stepPointsAmount=o,l[a].data[n].stepX=_.round(s.properties.updateXStep/o,3);for(var i=l[a].lastXValue-s.properties.updateXStep,d=0;d<o;d++)l[a].data[n].pointX[d]=s.properties.paddingXLeft+i+l[a].data[n].stepX*d}})}function r(){var e=0,t=0;_.forEach(p,function(a,o){_.forEach(l[a.id].data,function(a,o){_.forEach(a.dataY,function(a,o){var n=parseInt(a);e>n&&(e=n),h>n&&(h=n),t<n&&(t=n),g<n&&(g=n),h<e&&h++,g>t&&g--})})}),f=_.round(i/(g+Math.abs(h)),9)}function m(){var e=21;_.forEach(p,function(t,a){l[M+a]||(l[M+a]={},l[M+a].pointstodraw="",l[M+a].data={},l[M+a].color=p[a].aproximatecolor),_.forEach(l[a].data,function(t,o){if(!l[M+a].data[o])if(l[M+a].data[o]={},l[M+a].data[o].dataY=[],l[M+a].data[o].pointX=[],l[M+a].data[o].pointY=[],l[M+a].data[o].points=[],t.stepPointsAmount>2){var n=Math.round(e/100*t.stepPointsAmount);n<2&&(n=2);for(var r=Math.floor(n/2),d=Math.ceil(n/2),c=r;c<t.stepPointsAmount-d;c++){for(var u,p=0,g=0,m=0,v=0,S=0,A=0,L=0,w=0-r;w<d;w++)v+=(c+w)*l[a].data[o].dataY[c+w],S+=c+w,A+=l[a].data[o].dataY[c+w],L+=(c+w)*(c+w);if(g=(n*v-S*A)/(n*L-S*S),m=(A-g*S)/n,c===r&&(l[M+a].data[o].dataY[0]=l[a].data[o].dataY[0],l[M+a].data[o].pointX[0]=l[a].data[o].pointX[0],l[M+a].data[o].pointY[0]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[0]+Math.abs(h)),u=l[M+a].data[o].pointX[0]+","+l[M+a].data[o].pointY[0],l[M+a].data[o].points.push(u),r>1))for(var E=1;E<r;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);p=_.round(g*c+m,3),isNaN(p)||(l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u));var C=t.dataY.length;if(c===C-d-1){var D=C-1;if(C-d>1)for(var E=D-d+1;E<D;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);l[M+a].data[o].dataY[D]=l[a].data[o].dataY[D],l[M+a].data[o].pointX[D]=l[a].data[o].pointX[D],l[M+a].data[o].pointY[D]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[D]+Math.abs(h)),u=l[M+a].data[o].pointX[D]+","+l[M+a].data[o].pointY[D],l[M+a].data[o].points.push(u)}}l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}else{for(var c=0;c<l[a].stepPointsAmount;c++)l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u);l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}})})}function v(){_.forEach(p,function(e,t){l[t].pointstodraw="",l[M+t].pointstodraw="";var a=!0;_.forEach(l[t].data,function(e,o){for(var n=0;n<e.dataY.length;n++)e.pointY[n]=s.properties.paddingYTop+i-f*(l[t].data[o].dataY[n]+Math.abs(h)),e.points[n]=e.pointX[n]+","+e.pointY[n],l[M+t].data[o].pointY[n]=s.properties.paddingYTop+i-f*(l[M+t].data[o].dataY[n]+Math.abs(h)),l[M+t].data[o].points[n]=l[M+t].data[o].pointX[n]+","+l[M+t].data[o].pointY[n];a&&l[t].pointstodraw,l[t].pointstodraw=String(l[t].pointstodraw+" "+l[t].data[o].points.join(" ")),l[M+t].pointstodraw=String(l[M+t].pointstodraw+" "+l[M+t].data[o].points.join(" "))})})}function S(){var e=C(),t=e.getLine(),a=e.getText(),o=e.getNotch();b=_.cloneDeep(u),delete b.lastNotchValue,delete b.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),w(),_.isEmpty(b)||(_.forEach(b,function(e,t){console.log(" Notch to delete (id): "+e.id),
delete u[e.id]}),b={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(e,t){delete c[e.id]}),svgTextToDelete={}),l[t.id]=t,c[a.id]=a,u[o.id]=o}function w(){for(var e="xNotch",t=s.properties.paddingXLeft,a=s.properties.notchYWidth,o=u.beginNotchX,n=s.properties.mainHeight-s.properties.paddingYBottom,r=s.properties.notchXStep,i=0;i<25&&o<t+d;i++){var l={id:e+i,x1:o,y1:n,x2:o,y2:n+a,col:"#1f1f1f",width:1},p=(String.toString(u.lastNotchValue),{id:e+i,text:u.lastNotchValue+i*r,x:o,y:n+a+L,col:"#F44336"});u[l.id]=l,delete b[l.id],o+=s.properties.updateXStep,c[p.id]=p,delete svgTextToDelete[p.id]}}function E(){function e(e,a,o,n){_.forEach(t,function(t,r){var i=_.floor(n/t);if(i>0&&f*t>20)for(var d=1;d<i+1;d++){var l=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f)-o*f*t*d,p={id:t+a+d,x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:l,x2:s.properties.paddingXLeft,y2:l,col:"#1f1f1f",width:1},g=e+t*d,m={id:t+a+d,text:g,x:s.properties.paddingXLeft-s.properties.notchXWidth-A*g.length,y:l-1,col:"#F44336"};u[p.id]=p,delete b[p.id],c[m.id]=m,delete svgTextToDelete[m.id]}})}var t=[5,25,50,100,500,1e3],a="aboveNotchX",o="underNotchX";e("+",a,1,g),e("-",o,-1,Math.abs(h))}function C(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))}},getText:function(){return{text:"0",x:s.properties.paddingXLeft-A-s.properties.notchXWidth,y:s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f),col:"#F44336"}},getNotch:function(){var e=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f);return{id:"0xaxis",x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:e,x2:s.properties.paddingXLeft,y2:e,col:"#1f1f1f",width:1}}}}function D(){var e={id:"rim",color:"#4E342E",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)};l[e.id]=e}var T=0,U=0;U=a(),o(),n(),r(),m(),v(),D(),S();var b={}}function o(){return l}function n(){return c}function r(){return u}var i,d,s,l={},c={},u={},p={},f=1,g=1,h=0,m=[],v=[],M="aprox",S=0,A=8,L=14;return{makeStep:a,getGraph:o,getText:n,getNotch:r,init:t}}]);var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,t){function a(a){var n=t.defer();o=a;var r=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function t(t){e.close(t)}this.datamessage=o,console.log("  dataString   "+o),this.submit=function(){t(o)}},controllerAs:"vm"});return r.result.then(function(e){n.resolve(e)},function(e){console.log("Modal window: "+e),n.reject(e)}),n.promise}var o="";return{openModal:a}}]);var loadMaskModule=angular.module("LoadMaskModule",[]),ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(e,t,a,o){e.close=function(e){o.close()}}]);var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Root"),r.value?(i.info("User session is valid. Available to show dashboard."),o.go("root.main.dashboard")):(i.info("User session isn't valid. Redirect to loginpage."),o.go("root.login")),e.getAvailableLanguages().then(function(e){d.languages=e,d.selectedLanguage=t.DEFAULT_LANG},function(e){i.warn("Error while download languages. Set to use default: "+t.DEFAULT_LANG),d.languages={1:{code:t.DEFAULT_LANG,name:t.DEFAULT_LANG_NAME}},d.selectedLanguage=t.DEFAULT_LANG}),d.translate=function(){i.info("User select language: "+d.selectedLanguage),a.use(d.selectedLanguage)}}]);var appDecorators=angular.module("appDecorators",[]),appDirectives=angular.module("appDirectives",[]),appProviders=angular.module("appProviders",[]),appServices=angular.module("appServices",[]);loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(e,t,a,o){}}}]),loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(e){function t(){e.removeClass("myloadmask","hidden")}function a(){e.addClass("myloadmask","hidden")}return{activateLoadMask:t,deactivateLoadMask:a}}]),ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(e,t){function a(a){if(!o){o=!0;var n=!0,r=t.$new(n);r.errortype="errormodalwindow.message."+a;var i=e.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:r});i.result.then(function(){o=!1,r.$destroy()},function(e){console.log("Modal window error: "+e),o=!1})}}var o=!1;return{showModal:a}}]),rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,t,a){function o(){var a=t.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),a.resolve(e.data)},function(e){console.log(" load languages.json error."),a.reject(e)}),a.promise}return{getAvailableLanguages:o}}]),app.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),app.config(["$provide",function(e){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},a=function(e,t){var a=new String(e);for(var o in t)a=a.replace("{"+o+"}",t[o]);return a};e.decorator("$log",["$delegate",function(e){function o(){var e=new Date,t=String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds());return t}function n(){var e=new Date,a=e.getDate(),o=e.getMonth()+1;a=a<10?new String("0"+a):new String(a),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var n=new String(a+"-"+monthStr+"-"+e.getFullYear());return n}function r(e,t){function r(e,t,r){return function(){var e=String(o()+" "+n()),i=arguments[0]?new String(arguments[0]):"";r=r?r:"",console[t](a("{0} - {1} {2} ",[e,r,i]))}}return e.log=r(e,"log",t),e.info=r(e,"info",t),e.warn=r(e,"warn",t),e.debug=r(e,"debug",t),e.error=r(e,"error",t),e}return e.getInstance=function(t){t=void 0!==t?t:"",e=r(e,t)},e}])}]),appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.agevalidator(o);return n?(i.$setValidity("ageFormat",!0),t.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("ageFormat",!1),t.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.datevalidator(o);return n?(i.$setValidity("dateFormat",!0),t.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("dateFormat",!1),t.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.namevalidator(o);return n?(i.$setValidity("nameFormat",!0),t.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("nameFormat",!1),t.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}}),appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,t,a,o){function n(e,a){var n=t.defer();return o.login(e,a).then(function(e){access=!0,n.resolve(e)},function(e){n.reject(!1)}),n.promise}function r(){var a=t.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){d=e.data,console.log("Session is valid."),a.resolve(e.data)},function(e){d=null,console.log("Session not valid."),a.reject(e)}),a.promise}function i(){var e=t.defer();return a.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(a.getUserCredits())):r().then(function(t){console.log("provide userCredits from post request"),a.setUserCredits(t),e.resolve(t)},function(t){console.log("Cann't get user credits details."),a.setUserCredits(null),e.reject(t)}),e.promise}var d;return{checkCredentials:n,checkSession:r,getUserCredits:i}}]),appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,t){angular.element(document.querySelector("."+e)).addClass(t)},removeClass:function(e,t){angular.element(document.querySelector("."+e)).removeClass(t)}}}]),appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]),appServices.factory("monthesStorage",["$http","$q",function(e,t){function a(){var a=t.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){a.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),a.reject("Cann't receive date.json file.")}),a.promise}function o(){return void 0!==r?r:void i.then(function(e){return console.log(" Loading monthes from server."),r=e},function(e){r=void 0,console.log("Error in downloading monthes. "+e)})}function n(e){return e%4===0&&(e%100!==0||e%400===0)}var r,i=a();return{getMonthes:o,checkLeapYear:n}}]),appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(t){console.log("set credits in storage: "+e),e=t},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}}),appServices.factory("userDataStorage",function(){var e={};return{setUserData:function(t,a){e[a]=t},getByKeyUserData:function(t){return e[t]},getAllUserData:function(){return e},removeAll:function(){e=null,e={}}}}),appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(){var o=t.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,o.resolve(n)},function(e){console.log("error. unauthorised ? "),a.setUserCredits(null),o.reject(e.data)}),o.promise}var n=null;return{getUserDetails:o}}]),appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(e,t){var a,o=e.NAME_VALIDATOR.NAME_REGEX,n=e.AGE_VALIDATOR.MIN_AGE,r=e.AGE_VALIDATOR.MAX_AGE,i=e.AGE_VALIDATOR.AGE_REGEX,d=e.DATE_VALIDATOR.DATE_REGEX,s=e.DATE_VALIDATOR.SEPARATOR,l=e.DATE_VALIDATOR.MIN_YEAR,c=e.DATE_VALIDATOR.MAX_YEAR,u=e.DATE_VALIDATOR.FEBRUARY_NUMBER,p=e.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,f=e.DATE_VALIDATOR.NUMBER_YEAR,g=e.DATE_VALIDATOR.NUMBER_MONTH,h=e.DATE_VALIDATOR.NUMBER_DAY,m=null,v=0;return{namevalidator:function(e){var t=!1;return t=!!o.test(e)},agevalidator:function(e){var t=!1;return t=!!(e<=r&&e>=n&&i.test(e))},datevalidator:function(e){var o=!1;return a=t.getMonthes(),d.test(e)?(m=e.split(s),m[f]>l&&m[f]<c?(v=m[g]===u&&t.checkLeapYear(m[f])?p:a[m[g]].days,o=m[h]<=v&&m[h]>0):o=!1):o=!1,o}}}]);var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,t,a,o,n){n.getInstance("CheckSession"),a.getUserCredits().then(function(t){n.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(t){n.info("User session isn't valid. Redirect to loginpage."),o.showModal("type2"),e.go("root.login")})}]);var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Login"),r.activateLoadMask(),a.getUserCredits().then(function(e){var a=e.admin;i.info("User check session success."),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!a})},function(e){i.warn("User check session fail."),r.deactivateLoadMask(),t.go("root.login")}),d.submit=function(){var e=d.login,s=d.password;null!==e&&void 0!==e&&""!==e&&null!==s&&void 0!==s&&""!==s?(d.password=null,r.activateLoadMask(),a.checkCredentials(e,s).then(function(a){i.info("User login success.");var n=a.admin;o.setUserCredits({login:e,admin:!!n}),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!n})},function(e){i.warn("User login fail."),r.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,r.deactivateLoadMask(),n.showModal("type1"))}}]);var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;d.isFeedback=!d.isAdmin,a.getUserCredits().then(function(e){d.login=e.login,d.isAdmin=e.admin,d.isFeedback=!d.isAdmin},function(t){e.go("root.login")}),d.logout=function(){r.activateLoadMask(),t.removeAll(),o.logout().then(function(t){i.info("User logout success."),r.deactivateLoadMask(),e.go("root.login")},function(e){i.warn("User logout fail."),r.deactivateLoadMask(),n.showModal("type3")})},d.go=function(t){i.info("User change state to :"+t),e.go(t)}}]),loginModule.service("loginService",["$q","$http",function(e,t){function a(a,o){var n=e.defer();return t({method:"POST",url:"/app/login",data:{login:a,password:o}}).then(function(e){n.resolve(e.data)},function(e){n.reject(!1)}),n.promise}e.defer();return{login:a}}]),tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,t,a,o){function n(){o.removeAll();var n=t.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),a.setUserCredits(null),n.resolve(e.data)},function(e){console.log("Error while logout."),n.reject(e)}),n.promise}return{logout:n}}]);var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){function d(){r.activateLoadMask(),e.getDetails().then(function(e){i.info("Users data was loaded."),s.alldetails=e,l=e,r.deactivateLoadMask()},function(){r.deactivateLoadMask(),i.warn("Users data loading error."),n.showModal("type10")})}var s=this,l=null;i.getInstance("Admin"),d(),s.adduser=function(a,o,s,l,c){var u=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});u.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.addUser(t.login,t.password,t.name,t.age,t.date).then(function(){i.info("New user '"+t.login+"' was added."),r.deactivateLoadMask(),d()},function(){i.warn("User '"+t.login+"' creation error."),r.deactivateLoadMask(),n.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},s.update=function(a){var s=(o.getUserCredits().admin,t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return l[a]}}}));s.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.updateUser(t.login,t.password,t.name,t.age,t.date,a).then(function(){i.info("Update user. Submited data: "+JSON.stringify(t)),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be updated."),r.deactivateLoadMask(),n.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},s["delete"]=function(a){var o=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return a}}});o.result.then(function(t){t.deleteFlag&&(r.activateLoadMask(),e.deleteUser(a).then(function(){i.info("User was deleted."),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be deleted."),r.deactivateLoadMask(),n.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(e,t,a,o,n,r,i){function d(){angular.isDefined(h)&&(a.cancel(h),h=void 0)}function s(){i.deactivateLoadMask(),h=a(function(){l.chartOptions.properties=u,_.forEach(g,function(e,a){m[a]||(m[a]={},m[a].id=a,m[a].data=[],m[a].color=e.color,m[a].aproximatecolor=e.aproximatecolor,v[a]={},v[a].iswaitingload=!1,v[a].updateStep=0),v[a].iswaitingload||(v[a].updateStep=0,v[a].iswaitingload=!0,r.loadData(e.stream).then(function(e){v[a].updateStep=e.data.length,m[a].data=_.concat(m[a].data,e.data),v[a].iswaitingload=!1,l.chartOptions.streams[a]=m[a]},function(e){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+e)}))});var e=0;_.forEach(g,function(t,a){m[a].data.length>e&&(e=m[a].data.length),v[a].updateStep>M&&(M=v[a].updateStep)});var a=e-p;a>0&&_.forEach(g,function(e,t){m[t].data.splice(0,a)}),o.setUserData(m,"chartData"),o.setUserData(m,"chartDataProperties"),o.setUserData(u,"chartProperties"),l.chartOptions={streams:m,streamsProperties:v,properties:u}},f)}var l=this,c={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},u={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},p=u.mainWidth,f=u.updateTimeout,g={};_.forEach(c,function(e,t){g[t]={id:t,stream:e.stream,color:e.color,aproximatecolor:e.aproximatecolor}});var h,m={},v={},M=0;if(e.$on("$destroy",function(){d()}),_.isEmpty(m)){var S=o.getByKeyUserData("chartData");void 0!==S&&(m=_.cloneDeep(S),v=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),u=_.cloneDeep(o.getByKeyUserData("chartProperties"))),l.chartOptions={streams:m,streamsProperties:v,properties:u}}s()}]);var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,t,a,o,n,r){var i=this;o.getInstance("Feedback"),i.sendemail=function(){var e={from:i.name,to:i.email,content:i.textarea},d='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';r.openModal(d).then(function(e){a.activateLoadMask();var r={from:i.name,to:i.email,content:i.textarea},d=r.to.split(",");n.setContent(r.content),n.sendFromDecorator(r.from,d).then(function(e){a.deactivateLoadMask(),o.info("Feedback is sent."),i.name="",i.email="",i.textarea=""},function(e){a.deactivateLoadMask(),o.warn("Feedback cann't be sent."),t.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n){var r=this;n.getInstance("Tab one"),o.activateLoadMask(),t.getUserDetails().then(function(e){n.info("User data was downloaded."),r.userdetails=e,o.deactivateLoadMask()},function(t){n.warn("Error while downloading user data."),o.deactivateLoadMask(),a.showModal("type2"),e.go("root.login")})}]);var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,t,a,o,n,r,i,d){var s=this;d.getInstance("Tab two"),r.getMonthes(),i.activateLoadMask(),t.getUserDetails().then(function(e){d.info("User data was downloaded."),s.userdetails=e,s.newusername=e.name,s.newuserage=e.age,s.newuserdate=e.date,i.deactivateLoadMask()},function(t){d.warn("Error while downloading user data."),i.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),s.submit=function(){if(i.activateLoadMask(),n.namevalidator(s.newusername)&&n.agevalidator(s.newuserage)&&n.datevalidator(s.newuserdate)){var t={newusername:s.newusername,newuserage:s.newuserage,newuserdate:s.newuserdate};a.updateUserDetails(t).then(function(t){d.info("User data was updated."),i.deactivateLoadMask(),e.go("^.tab1")},function(e){d.warn("User data cann't be updated."),i.deactivateLoadMask(),o.showModal("type4")})}else i.deactivateLoadMask(),d.warn("Entered data is not valid."),o.showModal("type4")}}]),adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,t){function a(a){var o=t.defer();return e.deleteUser(a).then(function(e){o.resolve()},function(){o.reject()}),o.promise}function o(a,o,n,r,i,d){var s=t.defer();return e.updateUser(a,o,n,r,i,d).then(function(e){s.resolve()},function(){s.reject()}),s.promise}function n(){var a=t.defer();return e.getAllUsersDetails().then(function(e){r={},_.forEach(e.usercredits,function(t,a){r[a]={},r[a].login=a,r[a].password=t.password,r[a].name=e.userdata[a].name,r[a].age=e.userdata[a].age,r[a].date=e.userdata[a].date}),a.resolve(r)},function(e){console.log("Cann't load details to all users."),r={},a.reject(r)}),a.promise}var r={};return{getDetails:n,updateUser:o,deleteUser:a,addUser:o}}]),adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(a){var o=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:a}}).then(function(e){o.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),o.reject(e.status)}),o.promise}function n(a,o,n,r,i,d){var s=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:a,password:o,name:n,age:r,date:i,oldlogin:d}}).then(function(e){s.resolve()},function(e){console.log("Action is forbidden."),s.reject()}),s.promise}function r(){var o=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){i=e.data,o.resolve(i)},function(e){console.log("Action is forbidden."),a.setUserCredits(null),o.reject(e.data)}),o.promise}var i=null;return{getAllUsersDetails:r,updateUser:n,deleteUser:o}}]),dashboardModule.factory("loadChartDataService",["$http","$q",function(e,t){return{loadData:function(a){var o=t.defer(),n=a.toString(a);return e({method:"POST",url:n}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}}}]),feedbackModule.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,a){function o(e,o,n){var r=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:n}}).then(function(e){r.resolve(e.data)},function(e){r.reject(e)}),r.promise}return{sendFeedback:o}}]),tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function a(a){var o=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:a}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}return{updateUserDetails:a}}]);var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,t,a){function o(e){t.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};o(e)},this.cansel=function(){o({})}}]);var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,t,a,o){function n(e){a.close({deleteFlag:e})}var r=!1;this.userLoginDelete=o,this.submit=function(){r=!0,n(r)},this.cansel=function(){n(r)}}]);var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,t,a,o){function n(e){t.close(e)}this.userdetails=_.clone(a),this.logindisabled=!1,String(o.getUserCredits().login)===a.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};n(e)},this.cansel=function(){n({})}}]);var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(e,t,a,o){var n=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var r={},i={},d=!1,s=e.$watch(function(){return n.chartOptions.streams},function(e,t){d=!1,_.isEmpty(r)&&(_.isEmpty(n.chartOptions.streams)||(_.forEach(n.chartOptions.streams,function(e,t){r[t]={id:t,color:e.color,aproximatecolor:e.aproximatecolor}}),o.init(r,n.chartOptions))),_.forEach(r,function(e,t){i[t]||(i[t]={},i[t].id=t,i[t].color=e.color,i[t].data={}),n.chartOptions.streamsProperties[t].updateStep>0&&(d=!0)}),d&&o.makeStep(i,n.chartOptions),n.graphs=o.getGraph(),n.svgtexts=o.getText(),n.notches=o.getNotch()},!0);e.$on("$destroy",function(){s()})}]),diagramModule.factory("ChartHelperService",[function(){function e(){return++S}function t(e,t){p=e,s=t,_.isEmpty(s.streams)?console.log(" - object 'chartOptions.streams' is empty"):(i=s.properties.mainHeight-(s.properties.paddingYTop+s.properties.paddingYBottom),d=s.properties.mainWidth-(s.properties.paddingXLeft+s.properties.paddingXRight),_.forEach(s.streams,function(e,t){_.indexOf(m,e.id)<0&&(m.push(e.id),v.push(e.id),l[t]||(l[t]={},l[t].id=e.id,l[t].color=e.color,l[t].aproximatecolor=e.aproximatecolor,l[t].data={},l[t].pointstodraw="",l[t].lastXValue=0,u.lastNotchValue=s.properties.notchXStartValue,u.beginNotchX=s.properties.paddingXLeft))}))}function a(t){function a(){return _.forEach(p,function(e,t){l[t].lastXValue>U&&(U=l[t].lastXValue)}),U}function o(){var e=[];if(U>d){T=U-d;var t=u.beginNotchX+(s.properties.updateXStep-T);u.beginNotchX=t,u.lastNotchValue+=s.properties.notchXStep,_.forEach(p,function(t,a){var o=l[a].lastXValue-T;l[a].lastXValue=o<0?0:o;var n=s.properties.paddingXLeft;_.forEach(l[a].data,function(t,o){for(var r=!0,i=-1,d=0;d<t.dataY.length;d++)t.pointX[d]-=T,l[M+a].data[o].pointX[d]-=T,t.pointX[d]<=n&&(i=d),t.pointX[d]>n&&(r=!1);r?e.push(o):i>=0&&(t.dataY=_.drop(t.dataY,1+i),t.pointX=_.drop(t.pointX,1+i),t.pointY=_.drop(t.pointY,1+i),t.points=_.drop(t.points,1+i),t.stepPointsAmount-=i,l[M+a].data[o].dataY=_.drop(l[M+a].data[o].dataY,1+i),l[M+a].data[o].pointX=_.drop(l[M+a].data[o].pointX,1+i),l[M+a].data[o].pointY=_.drop(l[M+a].data[o].pointY,1+i),l[M+a].data[o].points=_.drop(l[M+a].data[o].points,1+i))}),_.forEach(e,function(e){delete l[a].data[e],delete l[M+a].data[e]}),e=[]})}}function n(){_.forEach(p,function(t,a){var o=_.clone(s.streamsProperties[a].updateStep);if(o>0&&(l[a].lastXValue+=s.properties.updateXStep,s.streamsProperties[a].updateStep=0,o>0)){var n=e();l[a].data[n]={};var r=_.takeRight(s.streams[a].data,o);l[a].data[n].dataY=_.cloneDeep(r),l[a].data[n].pointX=[],l[a].data[n].pointY=[],l[a].data[n].points=[],l[a].data[n].stepPointsAmount=o,l[a].data[n].stepX=_.round(s.properties.updateXStep/o,3);for(var i=l[a].lastXValue-s.properties.updateXStep,d=0;d<o;d++)l[a].data[n].pointX[d]=s.properties.paddingXLeft+i+l[a].data[n].stepX*d}})}function r(){var e=0,t=0;_.forEach(p,function(a,o){_.forEach(l[a.id].data,function(a,o){_.forEach(a.dataY,function(a,o){var n=parseInt(a);e>n&&(e=n),h>n&&(h=n),t<n&&(t=n),g<n&&(g=n),h<e&&h++,g>t&&g--})})}),f=_.round(i/(g+Math.abs(h)),9)}function m(){var e=21;_.forEach(p,function(t,a){l[M+a]||(l[M+a]={},l[M+a].pointstodraw="",l[M+a].data={},l[M+a].color=p[a].aproximatecolor),_.forEach(l[a].data,function(t,o){if(!l[M+a].data[o])if(l[M+a].data[o]={},l[M+a].data[o].dataY=[],l[M+a].data[o].pointX=[],l[M+a].data[o].pointY=[],l[M+a].data[o].points=[],t.stepPointsAmount>2){var n=Math.round(e/100*t.stepPointsAmount);n<2&&(n=2);for(var r=Math.floor(n/2),d=Math.ceil(n/2),c=r;c<t.stepPointsAmount-d;c++){
for(var u,p=0,g=0,m=0,v=0,S=0,A=0,L=0,w=0-r;w<d;w++)v+=(c+w)*l[a].data[o].dataY[c+w],S+=c+w,A+=l[a].data[o].dataY[c+w],L+=(c+w)*(c+w);if(g=(n*v-S*A)/(n*L-S*S),m=(A-g*S)/n,c===r&&(l[M+a].data[o].dataY[0]=l[a].data[o].dataY[0],l[M+a].data[o].pointX[0]=l[a].data[o].pointX[0],l[M+a].data[o].pointY[0]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[0]+Math.abs(h)),u=l[M+a].data[o].pointX[0]+","+l[M+a].data[o].pointY[0],l[M+a].data[o].points.push(u),r>1))for(var E=1;E<r;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);p=_.round(g*c+m,3),isNaN(p)||(l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u));var C=t.dataY.length;if(c===C-d-1){var D=C-1;if(C-d>1)for(var E=D-d+1;E<D;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);l[M+a].data[o].dataY[D]=l[a].data[o].dataY[D],l[M+a].data[o].pointX[D]=l[a].data[o].pointX[D],l[M+a].data[o].pointY[D]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[D]+Math.abs(h)),u=l[M+a].data[o].pointX[D]+","+l[M+a].data[o].pointY[D],l[M+a].data[o].points.push(u)}}l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}else{for(var c=0;c<l[a].stepPointsAmount;c++)l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u);l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}})})}function v(){_.forEach(p,function(e,t){l[t].pointstodraw="",l[M+t].pointstodraw="";var a=!0;_.forEach(l[t].data,function(e,o){for(var n=0;n<e.dataY.length;n++)e.pointY[n]=s.properties.paddingYTop+i-f*(l[t].data[o].dataY[n]+Math.abs(h)),e.points[n]=e.pointX[n]+","+e.pointY[n],l[M+t].data[o].pointY[n]=s.properties.paddingYTop+i-f*(l[M+t].data[o].dataY[n]+Math.abs(h)),l[M+t].data[o].points[n]=l[M+t].data[o].pointX[n]+","+l[M+t].data[o].pointY[n];a&&l[t].pointstodraw,l[t].pointstodraw=String(l[t].pointstodraw+" "+l[t].data[o].points.join(" ")),l[M+t].pointstodraw=String(l[M+t].pointstodraw+" "+l[M+t].data[o].points.join(" "))})})}function S(){var e=C(),t=e.getLine(),a=e.getText(),o=e.getNotch();b=_.cloneDeep(u),delete b.lastNotchValue,delete b.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),w(),_.isEmpty(b)||(_.forEach(b,function(e,t){console.log(" Notch to delete (id): "+e.id),delete u[e.id]}),b={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(e,t){delete c[e.id]}),svgTextToDelete={}),l[t.id]=t,c[a.id]=a,u[o.id]=o}function w(){for(var e="xNotch",t=s.properties.paddingXLeft,a=s.properties.notchYWidth,o=u.beginNotchX,n=s.properties.mainHeight-s.properties.paddingYBottom,r=s.properties.notchXStep,i=0;i<25&&o<t+d;i++){var l={id:e+i,x1:o,y1:n,x2:o,y2:n+a,col:"#1f1f1f",width:1},p=(String.toString(u.lastNotchValue),{id:e+i,text:u.lastNotchValue+i*r,x:o,y:n+a+L,col:"#F44336"});u[l.id]=l,delete b[l.id],o+=s.properties.updateXStep,c[p.id]=p,delete svgTextToDelete[p.id]}}function E(){function e(e,a,o,n){_.forEach(t,function(t,r){var i=_.floor(n/t);if(i>0&&f*t>20)for(var d=1;d<i+1;d++){var l=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f)-o*f*t*d,p={id:t+a+d,x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:l,x2:s.properties.paddingXLeft,y2:l,col:"#1f1f1f",width:1},g=e+t*d,m={id:t+a+d,text:g,x:s.properties.paddingXLeft-s.properties.notchXWidth-A*g.length,y:l-1,col:"#F44336"};u[p.id]=p,delete b[p.id],c[m.id]=m,delete svgTextToDelete[m.id]}})}var t=[5,25,50,100,500,1e3],a="aboveNotchX",o="underNotchX";e("+",a,1,g),e("-",o,-1,Math.abs(h))}function C(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))}},getText:function(){return{text:"0",x:s.properties.paddingXLeft-A-s.properties.notchXWidth,y:s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f),col:"#F44336"}},getNotch:function(){var e=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f);return{id:"0xaxis",x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:e,x2:s.properties.paddingXLeft,y2:e,col:"#1f1f1f",width:1}}}}function D(){var e={id:"rim",color:"#4E342E",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)};l[e.id]=e}var T=0,U=0;U=a(),o(),n(),r(),m(),v(),D(),S();var b={}}function o(){return l}function n(){return c}function r(){return u}var i,d,s,l={},c={},u={},p={},f=1,g=1,h=0,m=[],v=[],M="aprox",S=0,A=8,L=14;return{makeStep:a,getGraph:o,getText:n,getNotch:r,init:t}}]),diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(e,t,a,o){a.chartAllPoints}}}]);var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,t){function a(a){var n=t.defer();o=a;var r=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function t(t){e.close(t)}this.datamessage=o,console.log("  dataString   "+o),this.submit=function(){t(o)}},controllerAs:"vm"});return r.result.then(function(e){n.resolve(e)},function(e){console.log("Modal window: "+e),n.reject(e)}),n.promise}var o="";return{openModal:a}}]);
var loadMaskModule=angular.module("LoadMaskModule",[]);
var ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(o,l,e,a){o.close=function(o){a.close()}}]);
var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,o,a,n,l,t,s){var g=this;s.getInstance("Root"),t.value?(s.info("User session is valid. Available to show dashboard."),n.go("root.main.dashboard")):(s.info("User session isn't valid. Redirect to loginpage."),n.go("root.login")),e.getAvailableLanguages().then(function(e){g.languages=e,g.selectedLanguage=o.DEFAULT_LANG},function(e){s.warn("Error while download languages. Set to use default: "+o.DEFAULT_LANG),g.languages={1:{code:o.DEFAULT_LANG,name:o.DEFAULT_LANG_NAME}},g.selectedLanguage=o.DEFAULT_LANG}),g.translate=function(){s.info("User select language: "+g.selectedLanguage),a.use(g.selectedLanguage)}}]);
"use strict";var appDecorators=angular.module("appDecorators",[]);
"use strict";var appDirectives=angular.module("appDirectives",[]);
"use strict";var appProviders=angular.module("appProviders",[]);
"use strict";var appServices=angular.module("appServices",[]);
loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(o,l,a,n){}}}]);
loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(a){function d(){a.removeClass("myloadmask","hidden")}function e(){a.addClass("myloadmask","hidden")}return{activateLoadMask:d,deactivateLoadMask:e}}]);
ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(o,r){function e(e){if(!l){l=!0;var n=!0,a=r.$new(n);a.errortype="errormodalwindow.message."+e;var t=o.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:a});t.result.then(function(){l=!1,a.$destroy()},function(o){console.log("Modal window error: "+o),l=!1})}}var l=!1;return{showModal:e}}]);
rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,o,n){function a(){var n=o.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),n.resolve(e.data)},function(e){console.log(" load languages.json error."),n.reject(e)}),n.promise}return{getAvailableLanguages:a}}]);
app.config(["$provide",function(t){t.decorator("feedbackService",["$delegate","$http","$q",function(t,n,e){return t.data={from:"",to:[""],content:"",signature:""},t.setContent=function(n){t.data.content=n,console.log(" Content in decorator "+n)},t.setFrom=function(n){t.data.from=n},t.setTo=function(n){t.data.to=n},t.setSignature=function(n){t.data.signature=n},t.sendFromDecorator=function(o,a,r){function c(t,o,a,r){var i=e.defer();return n({method:"POST",url:"/app/feedback/send",data:{from:o,to:a[t],content:r}}).then(function(t){i.resolve(t)},function(n){t+1<a.length?c(t+1,o,a,r).then(function(t){i.resolve(t)},function(t){i.reject(t)}):i.reject("Cann't send email")}),i.promise}var i=(o?o:t.data.from,a?a:t.data.to,t.data.content),d=(r?r:t.data.signature,e.defer()),f=0;return c(f,o,a,i).then(function(t){d.resolve(t.data)},function(t){d.reject(t)}),d.promise},t}])}]);
app.config(["$provide",function(r){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},n=function(r,t){var n=new String(r);for(var o in t)n=n.replace("{"+o+"}",t[o]);return n};r.decorator("$log",["$delegate",function(r){function o(){var r=new Date,t=String(r.getHours()+":"+r.getMinutes()+":"+r.getSeconds()+":"+r.getMilliseconds());return t}function e(){var r=new Date,n=r.getDate(),o=r.getMonth()+1;n=n<10?new String("0"+n):new String(n),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var e=new String(n+"-"+monthStr+"-"+r.getFullYear());return e}function i(r,t){function i(r,t,i){return function(){var r=String(o()+" "+e()),g=arguments[0]?new String(arguments[0]):"";i=i?i:"",console[t](n("{0} - {1} {2} ",[r,i,g]))}}return r.log=i(r,"log",t),r.info=i(r,"info",t),r.warn=i(r,"warn",t),r.debug=i(r,"debug",t),r.error=i(r,"error",t),r}return r.getInstance=function(t){t=void 0!==t?t:"",r=i(r,t)},r}])}]);
appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,i){function R(L){var _=A.agevalidator(L);return _?(i.$setValidity("ageFormat",!0),e.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(i.$setValidity("ageFormat",!1),e.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(R)}}}]);
appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,t){function i(L){var _=A.datevalidator(L);return _?(t.$setValidity("dateFormat",!0),e.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(t.$setValidity("dateFormat",!1),e.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}t.$parsers.push(i)}}}]);
appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,i){function R(L){var _=A.namevalidator(L);return _?(i.$setValidity("nameFormat",!0),e.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(i.$setValidity("nameFormat",!1),e.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(R)}}}]);
appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}});
appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,r,s,t){function o(e,s){var o=r.defer();return t.login(e,s).then(function(e){access=!0,o.resolve(e)},function(e){o.reject(!1)}),o.promise}function n(){var s=r.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){c=e.data,console.log("Session is valid."),s.resolve(e.data)},function(e){c=null,console.log("Session not valid."),s.reject(e)}),s.promise}function i(){var e=r.defer();return s.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(s.getUserCredits())):n().then(function(r){console.log("provide userCredits from post request"),s.setUserCredits(r),e.resolve(r)},function(r){console.log("Cann't get user credits details."),s.setUserCredits(null),e.reject(r)}),e.promise}var c;return{checkCredentials:o,checkSession:n,getUserCredits:i}}]);
appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,r){angular.element(document.querySelector("."+e)).addClass(r)},removeClass:function(e,r){angular.element(document.querySelector("."+e)).removeClass(r)}}}]);
appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]);
appServices.factory("monthesStorage",["$http","$q",function(e,n){function o(){var o=n.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){o.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),o.reject("Cann't receive date.json file.")}),o.promise}function t(){return void 0!==i?i:void c.then(function(e){return console.log(" Loading monthes from server."),i=e},function(e){i=void 0,console.log("Error in downloading monthes. "+e)})}function r(e){return e%4===0&&(e%100!==0||e%400===0)}var i,c=o();return{getMonthes:t,checkLeapYear:r}}]);
appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(r){console.log("set credits in storage: "+e),e=r},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}});
appServices.factory("userDataStorage",function(){var t={};return{setUserData:function(e,r){t[r]=e},getByKeyUserData:function(e){return t[e]},getAllUserData:function(){return t},removeAll:function(){t=null,t={}}}});
appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,r,t){function s(){var s=r.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,s.resolve(n)},function(e){console.log("error. unauthorised ? "),t.setUserCredits(null),s.reject(e.data)}),s.promise}var n=null;return{getUserDetails:s}}]);
appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(A,E){var R,D=A.NAME_VALIDATOR.NAME_REGEX,T=A.AGE_VALIDATOR.MIN_AGE,_=A.AGE_VALIDATOR.MAX_AGE,t=A.AGE_VALIDATOR.AGE_REGEX,a=A.DATE_VALIDATOR.DATE_REGEX,e=A.DATE_VALIDATOR.SEPARATOR,r=A.DATE_VALIDATOR.MIN_YEAR,n=A.DATE_VALIDATOR.MAX_YEAR,I=A.DATE_VALIDATOR.FEBRUARY_NUMBER,L=A.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,O=A.DATE_VALIDATOR.NUMBER_YEAR,V=A.DATE_VALIDATOR.NUMBER_MONTH,o=A.DATE_VALIDATOR.NUMBER_DAY,M=null,i=0;return{namevalidator:function(A){var E=!1;return E=!!D.test(A)},agevalidator:function(A){var E=!1;return E=!!(A<=_&&A>=T&&t.test(A))},datevalidator:function(A){var D=!1;return R=E.getMonthes(),a.test(A)?(M=A.split(e),M[O]>r&&M[O]<n?(i=M[V]===I&&E.checkLeapYear(M[O])?L:R[M[V]].days,D=M[o]<=i&&M[o]>0):D=!1):D=!1,D}}}]);
var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,o,s,n,i){i.getInstance("CheckSession"),s.getUserCredits().then(function(o){i.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(o){i.info("User session isn't valid. Redirect to loginpage."),n.showModal("type2"),e.go("root.login")})}]);
var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(a,o,e,i,n,s,t){var d=this;t.getInstance("Login"),s.activateLoadMask(),e.getUserCredits().then(function(a){var e=a.admin;t.info("User check session success."),s.deactivateLoadMask(),o.go("root.main.dashboard",{admin:!!e})},function(a){t.warn("User check session fail."),s.deactivateLoadMask(),o.go("root.login")}),d.submit=function(){var a=d.login,r=d.password;null!==a&&void 0!==a&&""!==a&&null!==r&&void 0!==r&&""!==r?(d.password=null,s.activateLoadMask(),e.checkCredentials(a,r).then(function(e){t.info("User login success.");var n=e.admin;i.setUserCredits({login:a,admin:!!n}),s.deactivateLoadMask(),o.go("root.main.dashboard",{admin:!!n})},function(a){t.warn("User login fail."),s.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,s.deactivateLoadMask(),n.showModal("type1"))}}]);
var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(o,e,t,a,i,n,l){var d=this;d.isFeedback=!d.isAdmin,t.getUserCredits().then(function(o){d.login=o.login,d.isAdmin=o.admin,d.isFeedback=!d.isAdmin},function(e){o.go("root.login")}),d.logout=function(){n.activateLoadMask(),e.removeAll(),a.logout().then(function(e){l.info("User logout success."),n.deactivateLoadMask(),o.go("root.login")},function(o){l.warn("User logout fail."),n.deactivateLoadMask(),i.showModal("type3")})},d.go=function(e){l.info("User change state to :"+e),o.go(e)}}]);
loginModule.service("loginService",["$q","$http",function(e,n){function o(o,r){var t=e.defer();return n({method:"POST",url:"/app/login",data:{login:o,password:r}}).then(function(e){t.resolve(e.data)},function(e){t.reject(!1)}),t.promise}e.defer();return{login:o}}]);
tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,o,t,r){function l(){r.removeAll();var l=o.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),t.setUserCredits(null),l.resolve(e.data)},function(e){console.log("Error while logout."),l.reject(e)}),l.promise}return{logout:l}}]);
var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,a,o,t,d,n,l){function s(){n.activateLoadMask(),e.getDetails().then(function(e){l.info("Users data was loaded."),i.alldetails=e,r=e,n.deactivateLoadMask()},function(){n.deactivateLoadMask(),l.warn("Users data loading error."),d.showModal("type10")})}var i=this,r=null;l.getInstance("Admin"),s(),i.adduser=function(o,t,i,r,u){var c=a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});c.result.then(function(a){_.isEmpty(a)||(n.activateLoadMask(),e.addUser(a.login,a.password,a.name,a.age,a.date).then(function(){l.info("New user '"+a.login+"' was added."),n.deactivateLoadMask(),s()},function(){l.warn("User '"+a.login+"' creation error."),n.deactivateLoadMask(),d.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},i.update=function(o){var i=(t.getUserCredits().admin,a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return r[o]}}}));i.result.then(function(a){_.isEmpty(a)||(n.activateLoadMask(),e.updateUser(a.login,a.password,a.name,a.age,a.date,o).then(function(){l.info("Update user. Submited data: "+JSON.stringify(a)),n.deactivateLoadMask(),s()},function(){l.warn("User cann't be updated."),n.deactivateLoadMask(),d.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},i["delete"]=function(o){var t=a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return o}}});t.result.then(function(a){a.deleteFlag&&(n.activateLoadMask(),e.deleteUser(o).then(function(){l.info("User was deleted."),n.deactivateLoadMask(),s()},function(){l.warn("User cann't be deleted."),n.deactivateLoadMask(),d.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);
var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(a,t,e,o,r,i,n){function c(){angular.isDefined(g)&&(e.cancel(g),g=void 0)}function s(){n.deactivateLoadMask(),g=e(function(){d.chartOptions.properties=l,_.forEach(m,function(a,e){D[e]||(D[e]={},D[e].id=e,D[e].data=[],D[e].color=a.color,D[e].aproximatecolor=a.aproximatecolor,f[e]={},f[e].iswaitingload=!1,f[e].updateStep=0),f[e].iswaitingload||(f[e].updateStep=0,f[e].iswaitingload=!0,i.loadData(a.stream).then(function(a){f[e].updateStep=a.data.length,D[e].data=_.concat(D[e].data,a.data),f[e].iswaitingload=!1,d.chartOptions.streams[e]=D[e]},function(a){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+a)}))});var a=0;_.forEach(m,function(t,e){D[e].data.length>a&&(a=D[e].data.length),f[e].updateStep>v&&(v=f[e].updateStep)});var e=a-h;e>0&&_.forEach(m,function(a,t){D[t].data.splice(0,e)}),o.setUserData(D,"chartData"),o.setUserData(D,"chartDataProperties"),o.setUserData(l,"chartProperties"),d.chartOptions={streams:D,streamsProperties:f,properties:l}},u)}var d=this,p={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},l={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},h=l.mainWidth,u=l.updateTimeout,m={};_.forEach(p,function(a,t){m[t]={id:t,stream:a.stream,color:a.color,aproximatecolor:a.aproximatecolor}});var g,D={},f={},v=0;if(a.$on("$destroy",function(){c()}),_.isEmpty(D)){var S=o.getByKeyUserData("chartData");void 0!==S&&(D=_.cloneDeep(S),f=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),l=_.cloneDeep(o.getByKeyUserData("chartProperties"))),d.chartOptions={streams:D,streamsProperties:f,properties:l}}s()}]);
var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,a,t,o,n,c){var d=this;o.getInstance("Feedback"),d.sendemail=function(){var e={from:d.name,to:d.email,content:d.textarea},r='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';c.openModal(r).then(function(e){t.activateLoadMask();var c={from:d.name,to:d.email,content:d.textarea},r=c.to.split(",");n.setContent(c.content),n.sendFromDecorator(c.from,r).then(function(e){t.deactivateLoadMask(),o.info("Feedback is sent."),d.name="",d.email="",d.textarea=""},function(e){t.deactivateLoadMask(),o.warn("Feedback cann't be sent."),a.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);
var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(a,e,o,t,n){var d=this;n.getInstance("Tab one"),t.activateLoadMask(),e.getUserDetails().then(function(a){n.info("User data was downloaded."),d.userdetails=a,t.deactivateLoadMask()},function(e){n.warn("Error while downloading user data."),t.deactivateLoadMask(),o.showModal("type2"),a.go("root.login")})}]);
var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,a,t,o,n,d,s,r){var i=this;r.getInstance("Tab two"),d.getMonthes(),s.activateLoadMask(),a.getUserDetails().then(function(e){r.info("User data was downloaded."),i.userdetails=e,i.newusername=e.name,i.newuserage=e.age,i.newuserdate=e.date,s.deactivateLoadMask()},function(a){r.warn("Error while downloading user data."),s.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),i.submit=function(){if(s.activateLoadMask(),n.namevalidator(i.newusername)&&n.agevalidator(i.newuserage)&&n.datevalidator(i.newuserdate)){var a={newusername:i.newusername,newuserage:i.newuserage,newuserdate:i.newuserdate};t.updateUserDetails(a).then(function(a){r.info("User data was updated."),s.deactivateLoadMask(),e.go("^.tab1")},function(e){r.warn("User data cann't be updated."),s.deactivateLoadMask(),o.showModal("type4")})}else s.deactivateLoadMask(),r.warn("Entered data is not valid."),o.showModal("type4")}}]);
adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,r){function t(t){var n=r.defer();return e.deleteUser(t).then(function(e){n.resolve()},function(){n.reject()}),n.promise}function n(t,n,s,a,o,i){var l=r.defer();return e.updateUser(t,n,s,a,o,i).then(function(e){l.resolve()},function(){l.reject()}),l.promise}function s(){var t=r.defer();return e.getAllUsersDetails().then(function(e){a={},_.forEach(e.usercredits,function(r,t){a[t]={},a[t].login=t,a[t].password=r.password,a[t].name=e.userdata[t].name,a[t].age=e.userdata[t].age,a[t].date=e.userdata[t].date}),t.resolve(a)},function(e){console.log("Cann't load details to all users."),a={},t.reject(a)}),t.promise}var a={};return{getDetails:s,updateUser:n,deleteUser:t,addUser:n}}]);
adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,n){function r(n){var r=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:n}}).then(function(e){r.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),r.reject(e.status)}),r.promise}function o(n,r,o,a,s,i){var d=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:n,password:r,name:o,age:a,date:s,oldlogin:i}}).then(function(e){d.resolve()},function(e){console.log("Action is forbidden."),d.reject()}),d.promise}function a(){var r=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){s=e.data,r.resolve(s)},function(e){console.log("Action is forbidden."),n.setUserCredits(null),r.reject(e.data)}),r.promise}var s=null;return{getAllUsersDetails:a,updateUser:o,deleteUser:r}}]);
dashboardModule.factory("loadChartDataService",["$http","$q",function(t,r){return{loadData:function(e){var a=r.defer(),o=e.toString(e);return t({method:"POST",url:o}).then(function(t){a.resolve(t.data)},function(t){a.reject(t)}),a.promise}}}]);
feedbackModule.config(["$provide",function(t){t.decorator("feedbackService",["$delegate","$http","$q",function(t,e,n){return t.data={from:"",to:[""],content:"",signature:""},t.setContent=function(e){t.data.content=e,console.log(" Content in decorator "+e)},t.setFrom=function(e){t.data.from=e},t.setTo=function(e){t.data.to=e},t.setSignature=function(e){t.data.signature=e},t.sendFromDecorator=function(o,a,r){function c(t,o,a,r){var d=n.defer();return e({method:"POST",url:"/app/feedback/send",data:{from:o,to:a[t],content:r}}).then(function(t){d.resolve(t)},function(e){t+1<a.length?c(t+1,o,a,r).then(function(t){d.resolve(t)},function(t){d.reject(t)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:t.data.from,a?a:t.data.to,t.data.content),i=(r?r:t.data.signature,n.defer()),f=0;return c(f,o,a,d).then(function(t){i.resolve(t.data)},function(t){i.reject(t)}),i.promise},t}])}]);
feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,n){function o(e,o,r){var a=n.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:r}}).then(function(e){a.resolve(e.data)},function(e){a.reject(e)}),a.promise}return{sendFeedback:o}}]);
tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function r(r){var a=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:r}).then(function(e){a.resolve(e.data)},function(e){a.reject(e)}),a.promise}return{updateUserDetails:r}}]);
var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,s,d){function a(e){s.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};a(e)},this.cansel=function(){a({})}}]);
var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,l,n,o){function t(e){n.close({deleteFlag:e})}var a=!1;this.userLoginDelete=o,this.submit=function(){a=!0,t(a)},this.cansel=function(){t(a)}}]);
var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,s,i,a){function t(e){s.close(e)}this.userdetails=_.clone(i),this.logindisabled=!1,String(a.getUserCredits().login)===i.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};t(e)},this.cansel=function(){t({})}}]);
var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(t,r,a,i){var o=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var e={},s={},n=!1,h=t.$watch(function(){return o.chartOptions.streams},function(t,r){n=!1,_.isEmpty(e)&&(_.isEmpty(o.chartOptions.streams)||(_.forEach(o.chartOptions.streams,function(t,r){e[r]={id:r,color:t.color,aproximatecolor:t.aproximatecolor}}),i.init(e,o.chartOptions))),_.forEach(e,function(t,r){s[r]||(s[r]={},s[r].id=r,s[r].color=t.color,s[r].data={}),o.chartOptions.streamsProperties[r].updateStep>0&&(n=!0)}),n&&i.makeStep(s,o.chartOptions),o.graphs=i.getGraph(),o.svgtexts=i.getText(),o.notches=i.getNotch()},!0);t.$on("$destroy",function(){h()})}]);
diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(r,t,o,a){o.chartAllPoints}}}]);
diagramModule.factory("ChartHelperService",[function(){function t(){return++v}function a(t,a){f=t,r=a,_.isEmpty(r.streams)?console.log(" - object 'chartOptions.streams' is empty"):(d=r.properties.mainHeight-(r.properties.paddingYTop+r.properties.paddingYBottom),n=r.properties.mainWidth-(r.properties.paddingXLeft+r.properties.paddingXRight),_.forEach(r.streams,function(t,a){_.indexOf(l,t.id)<0&&(l.push(t.id),Y.push(t.id),s[a]||(s[a]={},s[a].id=t.id,s[a].color=t.color,s[a].aproximatecolor=t.aproximatecolor,s[a].data={},s[a].pointstodraw="",s[a].lastXValue=0,h.lastNotchValue=r.properties.notchXStartValue,h.beginNotchX=r.properties.paddingXLeft))}))}function o(a){function o(){return _.forEach(f,function(t,a){s[a].lastXValue>S&&(S=s[a].lastXValue)}),S}function i(){var t=[];if(S>n){w=S-n;var a=h.beginNotchX+(r.properties.updateXStep-w);h.beginNotchX=a,h.lastNotchValue+=r.properties.notchXStep,_.forEach(f,function(a,o){var i=s[o].lastXValue-w;s[o].lastXValue=i<0?0:i;var e=r.properties.paddingXLeft;_.forEach(s[o].data,function(a,i){for(var p=!0,d=-1,n=0;n<a.dataY.length;n++)a.pointX[n]-=w,s[m+o].data[i].pointX[n]-=w,a.pointX[n]<=e&&(d=n),a.pointX[n]>e&&(p=!1);p?t.push(i):d>=0&&(a.dataY=_.drop(a.dataY,1+d),a.pointX=_.drop(a.pointX,1+d),a.pointY=_.drop(a.pointY,1+d),a.points=_.drop(a.points,1+d),a.stepPointsAmount-=d,s[m+o].data[i].dataY=_.drop(s[m+o].data[i].dataY,1+d),s[m+o].data[i].pointX=_.drop(s[m+o].data[i].pointX,1+d),s[m+o].data[i].pointY=_.drop(s[m+o].data[i].pointY,1+d),s[m+o].data[i].points=_.drop(s[m+o].data[i].points,1+d))}),_.forEach(t,function(t){delete s[o].data[t],delete s[m+o].data[t]}),t=[]})}}function e(){_.forEach(f,function(a,o){var i=_.clone(r.streamsProperties[o].updateStep);if(i>0&&(s[o].lastXValue+=r.properties.updateXStep,r.streamsProperties[o].updateStep=0,i>0)){var e=t();s[o].data[e]={};var p=_.takeRight(r.streams[o].data,i);s[o].data[e].dataY=_.cloneDeep(p),s[o].data[e].pointX=[],s[o].data[e].pointY=[],s[o].data[e].points=[],s[o].data[e].stepPointsAmount=i,s[o].data[e].stepX=_.round(r.properties.updateXStep/i,3);for(var d=s[o].lastXValue-r.properties.updateXStep,n=0;n<i;n++)s[o].data[e].pointX[n]=r.properties.paddingXLeft+d+s[o].data[e].stepX*n}})}function p(){var t=0,a=0;_.forEach(f,function(o,i){_.forEach(s[o.id].data,function(o,i){_.forEach(o.dataY,function(o,i){var e=parseInt(o);t>e&&(t=e),X>e&&(X=e),a<e&&(a=e),g<e&&(g=e),X<t&&X++,g>a&&g--})})}),u=_.round(d/(g+Math.abs(X)),9)}function l(){var t=21;_.forEach(f,function(a,o){s[m+o]||(s[m+o]={},s[m+o].pointstodraw="",s[m+o].data={},s[m+o].color=f[o].aproximatecolor),_.forEach(s[o].data,function(a,i){if(!s[m+o].data[i])if(s[m+o].data[i]={},s[m+o].data[i].dataY=[],s[m+o].data[i].pointX=[],s[m+o].data[i].pointY=[],s[m+o].data[i].points=[],a.stepPointsAmount>2){var e=Math.round(t/100*a.stepPointsAmount);e<2&&(e=2);for(var p=Math.floor(e/2),n=Math.ceil(e/2),c=p;c<a.stepPointsAmount-n;c++){for(var h,f=0,g=0,l=0,Y=0,v=0,x=0,T=0,b=0-p;b<n;b++)Y+=(c+b)*s[o].data[i].dataY[c+b],v+=c+b,x+=s[o].data[i].dataY[c+b],T+=(c+b)*(c+b);if(g=(e*Y-v*x)/(e*T-v*v),l=(x-g*v)/e,c===p&&(s[m+o].data[i].dataY[0]=s[o].data[i].dataY[0],s[m+o].data[i].pointX[0]=s[o].data[i].pointX[0],s[m+o].data[i].pointY[0]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[0]+Math.abs(X)),h=s[m+o].data[i].pointX[0]+","+s[m+o].data[i].pointY[0],s[m+o].data[i].points.push(h),p>1))for(var E=1;E<p;E++)f=_.round(g*E+l,3),s[m+o].data[i].dataY[E]=f,s[m+o].data[i].pointX[E]=s[o].data[i].pointX[E],s[m+o].data[i].pointY[E]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[E]+Math.abs(X)),h=s[m+o].data[i].pointX[E]+","+s[m+o].data[i].pointY[E],s[m+o].data[i].points.push(h);f=_.round(g*c+l,3),isNaN(f)||(s[m+o].data[i].dataY[c]=f,s[m+o].data[i].pointX[c]=s[o].data[i].pointX[c],s[m+o].data[i].pointY[c]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[c]+Math.abs(X)),h=s[m+o].data[i].pointX[c]+","+s[m+o].data[i].pointY[c],s[m+o].data[i].points.push(h));var M=a.dataY.length;if(c===M-n-1){var N=M-1;if(M-n>1)for(var E=N-n+1;E<N;E++)f=_.round(g*E+l,3),s[m+o].data[i].dataY[E]=f,s[m+o].data[i].pointX[E]=s[o].data[i].pointX[E],s[m+o].data[i].pointY[E]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[E]+Math.abs(X)),h=s[m+o].data[i].pointX[E]+","+s[m+o].data[i].pointY[E],s[m+o].data[i].points.push(h);s[m+o].data[i].dataY[N]=s[o].data[i].dataY[N],s[m+o].data[i].pointX[N]=s[o].data[i].pointX[N],s[m+o].data[i].pointY[N]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[N]+Math.abs(X)),h=s[m+o].data[i].pointX[N]+","+s[m+o].data[i].pointY[N],s[m+o].data[i].points.push(h)}}s[m+o].pointstodraw=String(s[m+o].pointstodraw+" "+s[m+o].data[i].points.join(" "))}else{for(var c=0;c<s[o].stepPointsAmount;c++)s[m+o].data[i].dataY[c]=f,s[m+o].data[i].pointX[c]=s[o].data[i].pointX[c],s[m+o].data[i].pointY[c]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[c]+Math.abs(X)),h=s[m+o].data[i].pointX[c]+","+s[m+o].data[i].pointY[c],s[m+o].data[i].points.push(h);s[m+o].pointstodraw=String(s[m+o].pointstodraw+" "+s[m+o].data[i].points.join(" "))}})})}function Y(){_.forEach(f,function(t,a){s[a].pointstodraw="",s[m+a].pointstodraw="";var o=!0;_.forEach(s[a].data,function(t,i){for(var e=0;e<t.dataY.length;e++)t.pointY[e]=r.properties.paddingYTop+d-u*(s[a].data[i].dataY[e]+Math.abs(X)),t.points[e]=t.pointX[e]+","+t.pointY[e],s[m+a].data[i].pointY[e]=r.properties.paddingYTop+d-u*(s[m+a].data[i].dataY[e]+Math.abs(X)),s[m+a].data[i].points[e]=s[m+a].data[i].pointX[e]+","+s[m+a].data[i].pointY[e];o&&s[a].pointstodraw,s[a].pointstodraw=String(s[a].pointstodraw+" "+s[a].data[i].points.join(" ")),s[m+a].pointstodraw=String(s[m+a].pointstodraw+" "+s[m+a].data[i].points.join(" "))})})}function v(){var t=M(),a=t.getLine(),o=t.getText(),i=t.getNotch();L=_.cloneDeep(h),delete L.lastNotchValue,delete L.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),b(),_.isEmpty(L)||(_.forEach(L,function(t,a){console.log(" Notch to delete (id): "+t.id),delete h[t.id]}),L={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(t,a){delete c[t.id]}),svgTextToDelete={}),s[a.id]=a,c[o.id]=o,h[i.id]=i}function b(){for(var t="xNotch",a=r.properties.paddingXLeft,o=r.properties.notchYWidth,i=h.beginNotchX,e=r.properties.mainHeight-r.properties.paddingYBottom,p=r.properties.notchXStep,d=0;d<25&&i<a+n;d++){var s={id:t+d,x1:i,y1:e,x2:i,y2:e+o,col:"#1f1f1f",width:1},f=(String.toString(h.lastNotchValue),{id:t+d,text:h.lastNotchValue+d*p,x:i,y:e+o+T,col:"#F44336"});h[s.id]=s,delete L[s.id],i+=r.properties.updateXStep,c[f.id]=f,delete svgTextToDelete[f.id]}}function E(){function t(t,o,i,e){_.forEach(a,function(a,p){var d=_.floor(e/a);if(d>0&&u*a>20)for(var n=1;n<d+1;n++){var s=r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u)-i*u*a*n,f={id:a+o+n,x1:r.properties.paddingXLeft-r.properties.notchXWidth,y1:s,x2:r.properties.paddingXLeft,y2:s,col:"#1f1f1f",width:1},g=t+a*n,l={id:a+o+n,text:g,x:r.properties.paddingXLeft-r.properties.notchXWidth-x*g.length,y:s-1,col:"#F44336"};h[f.id]=f,delete L[f.id],c[l.id]=l,delete svgTextToDelete[l.id]}})}var a=[5,25,50,100,500,1e3],o="aboveNotchX",i="underNotchX";t("+",o,1,g),t("-",i,-1,Math.abs(X))}function M(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u))+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+(r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u))}},getText:function(){return{text:"0",x:r.properties.paddingXLeft-x-r.properties.notchXWidth,y:r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u),col:"#F44336"}},getNotch:function(){var t=r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u);return{id:"0xaxis",x1:r.properties.paddingXLeft-r.properties.notchXWidth,y1:t,x2:r.properties.paddingXLeft,y2:t,col:"#1f1f1f",width:1}}}}function N(){var t={id:"rim",color:"#4E342E",data:[],pointstodraw:r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom)+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+(r.properties.mainHeight-r.properties.paddingYBottom)+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+r.properties.paddingYTop+" "+r.properties.paddingXLeft+","+r.properties.paddingYTop+" "+r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom)};s[t.id]=t}var w=0,S=0;S=o(),i(),e(),p(),l(),Y(),N(),v();var L={}}function i(){return s}function e(){return c}function p(){return h}var d,n,r,s={},c={},h={},f={},u=1,g=1,X=0,l=[],Y=[],m="aprox",v=0,x=8,T=14;return{makeStep:o,getGraph:i,getText:e,getNotch:p,init:a}}]);
var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,o){function a(a){var d=o.defer();l=a;var n=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function o(o){e.close(o)}this.datamessage=l,console.log("  dataString   "+l),this.submit=function(){o(l)}},controllerAs:"vm"});return n.result.then(function(e){d.resolve(e)},function(e){console.log("Modal window: "+e),d.reject(e)}),d.promise}var l="";return{openModal:a}}]);
var loadMaskModule = angular.module('LoadMaskModule',[]);

var ModalModule = angular.module('ModalModule',[]);
ModalModule.controller('ModalController', 
  [ '$scope', '$translate', 'myModalWindowService', '$uibModalInstance',   
  function( $scope, $translate, myModalWindowService, $uibModalInstance) {
    $scope.close = function(result) {     
      $uibModalInstance.close();      
    };
}]);
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

'use strict';
var appDecorators = angular.module('appDecorators', []);



'use strict';
var appDirectives = angular.module('appDirectives', []);



'use strict';
var appProviders = angular.module('appProviders', []);



'use strict';
var appServices = angular.module('appServices', []);


loadMaskModule.directive('loadmask',[
	function () {
		
		return {
			restrict: 'E',
			templateUrl: 'app/loadmask/loadmask.html',
			controller: function(){
				console.log(" Load mask is shown.")
			},
			link: function(scope, element, attr, ctrl){

			}
		}		
	}
])

loadMaskModule.service('LoadMaskService', ['htmlClassModifierService',
  	function(htmlClassModifierService){
		function activateLoadMask(){
			htmlClassModifierService.removeClass("myloadmask", "hidden");
		};
		function deactivateLoadMask(){
			htmlClassModifierService.addClass("myloadmask", "hidden");
		};
		return {
			activateLoadMask : activateLoadMask,
			deactivateLoadMask : deactivateLoadMask
		}
	}
]);
ModalModule.service('myModalWindowService', ['$uibModal', '$rootScope',
	function($uibModal, $rootScope){
		var _ispresent = false;
		function showModal(errorType){
			if ( !_ispresent){
				_ispresent = true;
		  		var isolation = true;
		  		var modalScope = $rootScope.$new(isolation);
		  		modalScope.errortype = 'errormodalwindow.message.'+errorType;
		  		var modalInstance = $uibModal.open({
		  			animation: true,
		  			size: "sm",
		  			templateUrl: "/app/modal/modal.html",
		  			controller: "ModalController",
		  			scope: modalScope		  			
		  		});		  		
		  		modalInstance.result.then(function(){
		  			// console.log(" ispresent setted to false");
		  			_ispresent = false;
		  			modalScope.$destroy();
		  		}, function(error){
          			// error contains a detailed error message.
		            console.log("Modal window error: " + error);
		            _ispresent = false;
		  		})
			}
		}
		return{
			showModal : showModal			
		}
	}
]);
// available languages
//appServices.factory('languagesStorage', ['$http', '$q', 'LANG',
rootModule.service('languagesStorage', ['$http', '$q', 'LANG',
	function($http, $q, LANG){
		function getAvailableLanguages(){			
			var deferred = $q.defer();
			$http({
				method: "GET",
				url: '/lang/languages.json'
			}).then(function successCallback(response){	
				console.log(" load languages.json success." );
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log(" load languages.json error." );
				deferred.reject(error);
			})
			return deferred.promise;			
		}
		return {
			getAvailableLanguages : getAvailableLanguages
		}
	}
])
app.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
app.config([ '$provide', function($provide){
		/*
			string into decorator have to be “{0} {1} – {2}{3}“ 
				where 
				{0} current date – “dd-MMM-yyyy”, 
				{1} – current time – “HH:MM:SS:MS”, 
				{2} – class name, 
				{3} – string that need to log
		*/
		var monthesStor = {
			"01":{"short":"JAN"},
			"02":{"short":"FEB"},
			"03":{"short":"MAR"},
			"04":{"short":"APR"},
			"05":{"short":"MAY"},
			"06":{"short":"JUN"},
			"07":{"short":"JUL"},
			"08":{"short":"AUG"},
			"09":{"short":"SEP"},
			"10":{"short":"OCT"},
			"11":{"short":"NOV"},
			"12":{"short":"DEC"}
		}
		var support = function(template, valuesArray){
			var result = new String(template);
			for (var val in valuesArray){
				// console.log( " val =  " + val);
				result = result.replace("{"+val+"}", valuesArray[val]);
			}
			return result;
		}
		$provide.decorator('$log', [ '$delegate', 
			function($delegate){
				function currentTime(){					
					var time = new Date();
					var timeStr = String(time.getHours() + ":" +
						time.getMinutes() + ":" +
						time.getSeconds() + ":" +
						time.getMilliseconds()
					);
					return timeStr;
				};
				function currentDate(){
					var time = new Date();
					var date = time.getDate();
					var month = time.getMonth() + 1;
					date = date < 10 ? new String("0"+ date) : new String(date);
					monthStr = month < 10 ? monthesStor[new String("0"+ month)].short
						: monthesStor[new String(month)].short;					
					var dateStr = new String(date + "-" + 
						monthStr + "-" + 
						time.getFullYear());
					return dateStr;
				};
				function updateFunctions(object, className){
					function prepareFunction(object, funcName, className){
						return function () {			                
			                var now = String (currentTime() + " " + currentDate());		
			                var arg = !!(arguments[0]) ? new String(arguments[0]) : "";
			                className = className ? className : '';
			                console[funcName](support("{0} - {1} {2} ", [now, className, arg]));
			            };
					};
					object.log = prepareFunction(object, "log", className);
					object.info = prepareFunction(object, "info", className);
					object.warn = prepareFunction(object, "warn", className);
					object.debug = prepareFunction(object, "debug", className);
					object.error = prepareFunction(object, "error", className);
					return object;
				};
				$delegate.getInstance = function(className){
					className = (className !== undefined) ? className : "";
					$delegate = updateFunctions($delegate, className);
				};
				return $delegate;
			}
		])
	}
]);
appProviders.provider('log', 
	function logProvider(){
		var time = new Date();
		var currentTimeMillis = time.getTime();	
		var timeStr = String(time.getHours() + ":" +
			time.getMinutes() + ":" +
			time.getSeconds() + ":" +
			time.getMilliseconds()
		);
		this.getTimeCreation = function(){			
			return timeStr;
		};		
		this.getTimeCreationMillis = function(){
			return currentTime;
		};
		this.$get = function(){				
			return new log();				
		};		
	}	
)
appDirectives.directive('myagevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',
      link: function(scope, element, attr, mCtrl){
        function myAgeValidator(value){          
          var result = validatorsService.agevalidator(value);
          if (result){
            mCtrl.$setValidity('ageFormat', true);
            // custom
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return value;
          } else {
            mCtrl.$setValidity('ageFormat', false); 
            //custom
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return '';
          }
        }
        mCtrl.$parsers.push(myAgeValidator);
      }
    }
}])
appDirectives.directive('mydatevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
	  return {
	    require: 'ngModel',
	    link: function (scope, element, attr, mCtrl){
	      function myDateValidator(value){         
          var result = validatorsService.datevalidator(value);
          if (result){
            mCtrl.$setValidity('dateFormat', true);    
            //custom 
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('dateFormat', false);
            //custom
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);   
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);
            return '';
          }
	      }
	      mCtrl.$parsers.push(myDateValidator);
	    } 
	  }
}])
appDirectives.directive('mynamevalidator', ['validatorsService',
 'htmlClassModifierService', 'VALIDATORS',  
  function(validatorsService,htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',      
      link: function(scope, element, attr, mCtrl){
        function myNameValidator(value){
          var result = validatorsService.namevalidator(value);
          if (result){
            mCtrl.$setValidity('nameFormat', true);   
            //custom   
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('nameFormat', false); 
            //custom     
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME); 
            return '';
          }
        }
        mCtrl.$parsers.push(myNameValidator);
      }
    }
}])
appServices.service('checkCredentialsServise', ['$http', '$q', 
	'userCreditsStorage', 'loginService',
	function($http, $q, userCreditsStorage, loginService){
		// var access = false;
		var _userCredentials;
		function checkUserCredentials(login, password){
			var deferred = $q.defer();			
			loginService.login(login, password).then(
				function successCallback(details){
					// console.log(" access alowed");
					access = true;
					deferred.resolve(details);				
				}, function errorCallback(response){
					// console.log(" access forbiden");					
					deferred.reject(false);
				}
			)
			return deferred.promise;	
		};
		function checkSession(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/checksession'
			}).then(function successCallback(response){
				_userCredentials = response.data;
				console.log("Session is valid.");
				deferred.resolve(response.data);
			}, function errorCallback(error){
				_userCredentials = null;				
				console.log("Session not valid.");
				deferred.reject(error);
			})
			return deferred.promise;
		};
		function getUserCredits(){
				var deferred = $q.defer();
				if ( ! userCreditsStorage.getUserCredits()){
					checkSession().then(function(details){
						console.log("provide userCredits from post request");	
						userCreditsStorage.setUserCredits( details
							// {"login": details['login']} 							
						);
						deferred.resolve(details);
					}, function(error){
						console.log("Cann't get user credits details.");
						userCreditsStorage.setUserCredits(null);
						deferred.reject(error);
					})				
				} else{
					console.log("provide userCredits from storage");
					deferred.resolve(userCreditsStorage.getUserCredits());					
				}
			return deferred.promise;
		};
		return {
			checkCredentials:  checkUserCredentials,
			checkSession : checkSession,
			getUserCredits : getUserCredits
		}
	}
]);
appServices.service('htmlClassModifierService', [ function(){
	return {
		addClass : function(classSelector, classToAdd){
			angular.element(document.querySelector("."+classSelector)).addClass(classToAdd);
		},
		removeClass : function(classSelector, classToRemove){
			angular.element(document.querySelector("."+classSelector)).removeClass(classToRemove);
		}
	}	
}])

appServices.service('myInterceptor', [
	function(){
		var timeMarker = {
			request: function(config){
				config.requestTimePoint = new Date().getTime();
				return config;
			},
			response: function(response){
				response.config.responseTimePoint = new Date().getTime();
				// log only post requests
				if ( String(response.config.method).toLowerCase() === "post" ){
					// log it 
					console.log(" - request-response time: " + 					
						(response.config.responseTimePoint - response.config.requestTimePoint) +
						" ms. " + " URl: " + response.config.url);
				}
				return response;
			}
		}
		return timeMarker;
	}
])
//monthes storage
appServices.service('monthesStorage', [ '$http', '$q',
	function($http, $q){
		var monthes;
		var _promiseLoad = _loadMonthes();
		function _loadMonthes(){			
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: "/app/public/date.json"
			}).then(function successCallback(response){
				// save monthes				
				deferred.resolve(response.data);
			}, function errorCallback(error){
				// error in monthes load 				
				console.log(" Cann't receive date.json file.");
				deferred.reject( "Cann't receive date.json file." );
			}	
			)	
			return deferred.promise;
		}
		function getMonthes(){
			if (monthes === undefined){
				_promiseLoad.then(function(details){
						console.log(" Loading monthes from server.")
						monthes = details;
						// console.log("monthes:"+ monthes);
						return monthes;
					}, 
					function(reason){
						// show modal error message.
						monthes = undefined;
						console.log("Error in downloading monthes. " + reason);
					}
				);				
			} else {				
				return monthes;
			}
		}
		function checkLeapYear(year){
			if ( (year) % 4 === 0 ){    
			    if (year % 100 === 0 && year % 400 !== 0){
			      return false;
				}
			    return true;   
			} else {
			    return false;
			}
		}
		return {
			getMonthes : getMonthes,
			checkLeapYear : checkLeapYear
		}
		
	}
])
// save login of user
appServices.service('userCreditsStorage', function(){
	var userCredits = null;
	return {
		setUserCredits: function(credits){
			console.log("set credits in storage: " + userCredits);
			userCredits = credits;
		},
		getUserCredits: function(){
			console.log("get credits from storage: " + userCredits);
			return userCredits;
		}
	}
})
// save different user data
appServices.service('userDataStorage', function(){
	var userData = {};
	return {
		setUserData: function(data, key){
			userData[key] = data;
		},
		getByKeyUserData: function(key){
			return userData[key];
		},
		getAllUserData: function(){
			return userData;
		},
		removeAll: function(){
			// delete userData;
			userData = null;
			userData = {};
		}
	}
})
appServices.service('userDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;
		function getUserDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/userdetails'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				console.log("error. unauthorised ? ");
				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getUserDetails : getUserDetails
		}
	}
])
appServices.service('validatorsService', ['VALIDATORS', 'monthesStorage',
	function(VALIDATORS, monthesStorage){
		var _nameRegEx = VALIDATORS.NAME_VALIDATOR.NAME_REGEX;
		var _minage = VALIDATORS.AGE_VALIDATOR.MIN_AGE;
    	var _maxage = VALIDATORS.AGE_VALIDATOR.MAX_AGE;
    	var _ageRegex = VALIDATORS.AGE_VALIDATOR.AGE_REGEX;

    	var _dateRegEx = VALIDATORS.DATE_VALIDATOR.DATE_REGEX; 
	    var _separator = VALIDATORS.DATE_VALIDATOR.SEPARATOR;
	    var _minyear = VALIDATORS.DATE_VALIDATOR.MIN_YEAR;
	    var _maxyear = VALIDATORS.DATE_VALIDATOR.MAX_YEAR;
	    var _februarynumber = VALIDATORS.DATE_VALIDATOR.FEBRUARY_NUMBER;
	    var _februaryleapdays = VALIDATORS.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS;
	    var _numyear = VALIDATORS.DATE_VALIDATOR.NUMBER_YEAR;
	    var _nummonth = VALIDATORS.DATE_VALIDATOR.NUMBER_MONTH;
	    var _numday = VALIDATORS.DATE_VALIDATOR.NUMBER_DAY;
    
		var _isvalid = false;
		var _parts = null;
		var _maxdays = 0;

		var monthes;

		return {
			namevalidator: function(value){
				var isvalid = false;
				if (_nameRegEx.test(value)){
		        	isvalid = true;		            
		        } else {		            
		            isvalid = false;
		        }
		        return isvalid;
			},
			agevalidator: function(value){
				var isvalid = false;
				if (value <= _maxage && value >= _minage && _ageRegex.test(value)){
		            isvalid = true;		            
		        } else {
		             isvalid = false;
		        }
		        return isvalid;
			},
			datevalidator : function(value){
				var _isvalid = false;
				monthes = monthesStorage.getMonthes();
		        if (_dateRegEx.test(value)){
		          _parts = value.split(_separator);
		          // check year
		          if(_parts[_numyear] > _minyear && _parts[_numyear] < _maxyear){            
		            // check february for leap year
		            if (_parts[_nummonth] === _februarynumber ){
		              if (monthesStorage.checkLeapYear(_parts[_numyear])){
		                _maxdays = _februaryleapdays;
		              } else{
		                _maxdays = monthes[_parts[_nummonth]].days;
		              }               
		            } else {
		                _maxdays = monthes[_parts[_nummonth]].days;	               
		            }
		            // check amount of days for max value
		            if (_parts[_numday] <= _maxdays && _parts[_numday] > 0){
		              _isvalid = true;
		            } else {
		              _isvalid = false;
		            }
		          } else {
		            _isvalid = false;
		          }          
		        } else {
		            _isvalid = false;
		        }
				return _isvalid;				
			}
		}
	}
]);

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
              // console.log(" Login is success! ");
              $log.info("User login success.");
              var isAdmin = details.admin;
              // console.log(" Hello. You have admin rights: " + isAdmin);              
              userCreditsStorage.setUserCredits(
                {"login": login,
                  "admin": !!isAdmin}
              );   
              LoadMaskService.deactivateLoadMask();
              $state.go('root.main.dashboard', {"admin":!!isAdmin});
          }, function(reason){
              // console.log(" Login is incorect. " + reason);
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
          // console.log("Logout is successful.");
          $log.info("User logout success.");
          LoadMaskService.deactivateLoadMask();
          $state.go('root.login');
        }, function(reason){
          // console.log("Logout fail.");      
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
loginModule.service('loginService', [ '$q', '$http',
	function($q, $http){
		var deferred = $q.defer();
		function login(login, password){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/login',
				data: {
					"login": login,
					"password": password
				}
			}).then(function successCallback(response){			
				deferred.resolve(response.data);				
			}, function errorCallback(response){				
				deferred.reject(false);
			})	
			return deferred.promise;
		}
		return {
			login : login
		}
	}
])
tabSwitcherModule.service('logoutService', ['$http', '$q', 'userCreditsStorage', 
	'userDataStorage', 'userDataStorage',
	function($http, $q, userCreditsStorage, userDataStorage){
		function logout(){
			userDataStorage.removeAll();
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/logout'				
			}).then(function successCallback(response){
				console.log("Logout is allowed.");
				userCreditsStorage.setUserCredits(null);
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log("Error while logout.");
				deferred.reject(error);
			})
			return deferred.promise;
		}
		return {
			logout : logout
		}
	}
])

var adminModule = angular.module('AdminModule',
	['AdminAddUserModalModule', 'AdminDeleteUserModalModule', 'AdminUpdateUserModalModule']);

adminModule.controller('AdminController', [ 'allUsersDetailsModel',
	'$uibModal', '$state', 'userCreditsStorage', 'myModalWindowService',
	'LoadMaskService', '$log', 
	function(allUsersDetailsModel, $uibModal, $state, userCreditsStorage,
			myModalWindowService, LoadMaskService, $log){
		var thisPointer = this;
		var allUsersDetails = null;

		$log.getInstance("Admin");

		// load data about all users. 
		loadUsersDetails();
		// show in table.
		function loadUsersDetails(){
			LoadMaskService.activateLoadMask();
			allUsersDetailsModel.getDetails().then(
				function successCallBack(details){	
					$log.info("Users data was loaded.");
					thisPointer.alldetails = details;
					allUsersDetails = details;
					LoadMaskService.deactivateLoadMask();					
				} , 
				function errorCallBack(){
					LoadMaskService.deactivateLoadMask();
					$log.warn("Users data loading error.");
					// show modal about error
					myModalWindowService.showModal("type10");
					// send redirect if user hasn't admin access					
					// or redirect him to anywhere
				}
			);
		}

		// add new user
		thisPointer.adduser = function (login, password, name, age, date){
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",
	  			controller: "AdminAddUserModal",
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if (!_.isEmpty(result)){									
					// activate loadmask	  			
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.addUser(result.login, 
							result.password, result.name, result.age, result.date).then(
						function successCallBack(){
							$log.info("New user \'" + result.login + "\' was added.");
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
							// deactivate loadmask
						}, function errorCallBack(){
							$log.warn("User \'" + result.login + "\' creation error.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type13");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
				// myModalWindowService.showModal("type13");
	  		})
		}

		// update user
		thisPointer.update = function (login){
			// login, password, name, age, date
			// open modal window for updating fields
			var isAdmin = userCreditsStorage.getUserCredits().admin;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",
	  			controller: "AdminUpdateUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userDetails : function(){
	  					// console.log(" login " + login + " allUsersDetails[login] " + JSON.stringify(allUsersDetails[login]));
	  					return allUsersDetails[login];
	  				}
	  			}	  				
	  		});	
	  		modalInstance.result.then(function(result){ 
	  			if (!_.isEmpty(result)){
					// activate loadmask

	  				LoadMaskService.activateLoadMask();					
					allUsersDetailsModel.updateUser(result.login, 
							result.password, result.name, result.age, result.date, login).then(
						function successCallBack(){							
							$log.info("Update user. Submited data: " + JSON.stringify(result));
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
						}, function errorCallBack(){
							$log.warn("User cann't be updated.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type12");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;	
	  		})
		}

		// delete user
		thisPointer.delete = function (login){			
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",
	  			controller: "AdminDeleteUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userLoginDelete : function(){	  					
	  					return login;
	  				}
	  			}	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
				// console.log(" submited result " + JSON.stringify(result));	  			
	  			if ( result.deleteFlag ){
					// console.log(" try to delete "  + result.deleteFlag);
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.deleteUser(login).then(
						function successCallBack(){
							$log.info("User was deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();
						}, function errorCallBack(){
							$log.warn("User cann't be deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type11");
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            // _ispresent = false;
	  		})
		}
	}
])
var dashboardModule = angular.module('DashboardModule',
	['DiagramModule']);

dashboardModule.controller('DashboardController', ['$scope', '$state', '$interval',
  'userDataStorage', 'userDetailsService', 'loadChartDataService', 'LoadMaskService',
  function($scope, $state, $interval, userDataStorage, 
      userDetailsService, loadChartDataService, LoadMaskService){
    // show chart. stream from server
    var thisPointer = this;
    
    // initial parameters for charts: 
    var initParameters = {
      "1": {
        "stream":"/app/chartdata1", 
        "color":"#FFCC80", 
        "aproximatecolor":"#EF6C00"
      }, 
      "2": { "id": 2,
        "stream":"/app/chartdata2", 
        "color":"#80CBC4", 
        "aproximatecolor": "#00695C"
      }
    }

  /*  "maxAmountOfPoints" : 480,
      "updateTimeout" : 500,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStep" : 40,      - step in px per notch  
      "notchXName" : "point", - notch name
      "notchXWidth" : 5,      - width of notch-line      
      "notchYStep" : 100,   
      "notchYName" : "point", - notch name

      notice: chart height = main-height - (paddingYTop + paddingYBottom)
              chart width = main-width - (paddingXLeft + paddingXRight)  
  */    
    var chartProperties = {
      "mainWidth" : 480,
      "mainHeight" : 400,     
      "updateTimeout" : 1500,
      "updateXStep": 50,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStartValue" : 10,
      "notchXStep" : 40,
      "notchXWidth" : 5,      
      "notchXName" : "point",      
      "notchYWidth" : 5,
      "notchYName" : "point",
    }

    var maxAmountOfPoints = chartProperties.mainWidth;    
    // timeout for redraw diagram
    var updateTimeout = chartProperties.updateTimeout; // ms
    // make graph object
    var graphObjects = {};
    _.forEach(initParameters, function(value, key){      
      graphObjects[key] = {
          "id": key,
          "stream": value.stream,
          "color": value.color,
          "aproximatecolor": value.aproximatecolor
      }      
    });
    // data storage for downloadded datas
    var dataDownloaded = {};
    var dataDownloadedProperties = {};
    // amount of points availale to make step
    var updateStep = 0;    
    // object-storage for $interval's
    var intervalObject;
    function destroyInterval(){      
        if (angular.isDefined(intervalObject)){
          $interval.cancel(intervalObject);
          intervalObject = undefined;
        }      
    }
    $scope.$on('$destroy', function(){
        destroyInterval();
      }
    );
    function startUpdate(){
      // deactivate load mask in case of showing diagram
      LoadMaskService.deactivateLoadMask();
      intervalObject = $interval(function(){
            // console.log(" update timeout ");
        thisPointer.chartOptions.properties = chartProperties;
        _.forEach(graphObjects, function(value, key){ 
          if (!dataDownloaded[key]){
            dataDownloaded[key] = {};
            dataDownloaded[key].id = key;
            dataDownloaded[key].data = [];
            dataDownloaded[key].color = value.color;
            dataDownloaded[key].aproximatecolor = value.aproximatecolor;
            dataDownloadedProperties[key] = {};
            dataDownloadedProperties[key].iswaitingload = false;
            dataDownloadedProperties[key].updateStep = 0; 
          }          
          if (!dataDownloadedProperties[key].iswaitingload){            
            dataDownloadedProperties[key].updateStep = 0;            
            dataDownloadedProperties[key].iswaitingload = true;
            // load data for current stream
            loadChartDataService.loadData(value.stream).then(
              function successCallBack( details ){
                dataDownloadedProperties[key].updateStep = details.data.length;
                dataDownloaded[key].data = _.concat(dataDownloaded[key].data , details.data);
                dataDownloadedProperties[key].iswaitingload = false;
                thisPointer.chartOptions.streams[key] = dataDownloaded[key];
              }, function errorCallBack(reason){
                // show error modal message                
                $state.go("root.login");
                console.log("Cann't load chart data from server. Reason: " + reason);
              }
            )          
          }
        })
        var currentMaxLengthOfStream = 0;
        _.forEach(graphObjects, function(value, key){
          if (dataDownloaded[key].data.length > currentMaxLengthOfStream) {
            currentMaxLengthOfStream = dataDownloaded[key].data.length;
          }
          if (dataDownloadedProperties[key].updateStep > updateStep) {
            updateStep = dataDownloadedProperties[key].updateStep;
          }
        })
        var temp = currentMaxLengthOfStream - maxAmountOfPoints;
        if (temp > 0){
          _.forEach(graphObjects, function(value, key){
            dataDownloaded[key].data.splice(0, temp);
          })          
        }        
        userDataStorage.setUserData(dataDownloaded, "chartData");
        userDataStorage.setUserData(dataDownloaded, "chartDataProperties");
        userDataStorage.setUserData(chartProperties, "chartProperties");        
        thisPointer.chartOptions = { 
          "streams": dataDownloaded,
          "streamsProperties": dataDownloadedProperties,          
          "properties" : chartProperties        
        }        
      }, updateTimeout);
    }

    // take data from userStorage
    if (_.isEmpty(dataDownloaded)){      
      var temp = userDataStorage.getByKeyUserData("chartData");
      if (temp !== undefined){
        dataDownloaded = _.cloneDeep(temp);
        dataDownloadedProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartDataProperties"));
        chartProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartProperties"));
      }
      thisPointer.chartOptions = { 
        "streams": dataDownloaded,
        "streamsProperties": dataDownloadedProperties, 
        "properties" : chartProperties        
      } 
    }
    startUpdate();
  }
])
var feedbackModule = angular.module('FeedbackModule',
	['FeedbackModalModule']);

feedbackModule.controller('FeedbackController', ['$state',
  'myModalWindowService', 'LoadMaskService', '$log', 
  'feedbackService', 'feedbackModalService',
  function($state, myModalWindowService, LoadMaskService, $log, 
  			feedbackService, feedbackModalService){      
	    var thisPointer = this;
	    $log.getInstance("Feedback");
	    thisPointer.sendemail = function(){		    
		    var data = {
		    	"from" : thisPointer.name,
			    "to" : thisPointer.email,
			    "content" : thisPointer.textarea
		    }
		    // process data		       
		    var processedData = "From: \"" + data.from + "\". " + 
				"To: \"" + data.to + "\". " + 
				"Content: \"" + data.content + "\".";		    
		    // open modal
			feedbackModalService.openModal(processedData).then(
				function successCallBack(resultMessage){					
					LoadMaskService.activateLoadMask();
					var jsonResultMessage = {
				    	"from" : thisPointer.name,
					    "to" : thisPointer.email,
					    "content" : thisPointer.textarea
				    }
				    // read all available email in address-email and try send 
				    //untill it will be sent

					// feedbackService.sendFeedback(
					// 		jsonResultMessage.from, 
					// 		jsonResultMessage.to,
					// 		jsonResultMessage.content ).then(
					var toArray = jsonResultMessage.to.split(",");
					feedbackService.setContent(jsonResultMessage.content);
					feedbackService.sendFromDecorator(
							jsonResultMessage.from, 
							toArray ).then(
						function successCallBack(result){
							LoadMaskService.deactivateLoadMask();
							$log.info("Feedback is sent.");
							// clear feedback form
							thisPointer.name = "";
		    				thisPointer.email = "";
		    				thisPointer.textarea = "";
							//ok
						}, function errorCallBack(error){
							// don't clear feedback form
							LoadMaskService.deactivateLoadMask();		
							$log.warn("Feedback cann't be sent.");
							// show modal error
							myModalWindowService.showModal("type20");
						}
					)
				}, function errorCallBack(error){
					// don't send
					// don't clear feedback form
					// log	
					$log.log("Feedback wasn't sent. Canseled.");				
				}
			)
	    }     
  }
])
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
            // console.log (" error in user details. " + reason);
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
            // console.log (" error in user details. " + reason);
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
          // console.log("Data check is not passed.");
          $log.warn("Entered data is not valid.");
          myModalWindowService.showModal("type4");
        }
      }
  }
])
adminModule.service('allUsersDetailsModel', ['allUsersDetailsService', '$q',
	function(allUsersDetailsService , $q){
		var allUsersDetails = {};
		function deleteUser(login){
			var deferred = $q.defer();
			allUsersDetailsService.deleteUser(login).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}
			)
			return deferred.promise;
		}
		// login cann't be updated
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			allUsersDetailsService.updateUser(login, password, name, age, date, oldLogin).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}			
			);
			return deferred.promise;
		};
		function getDetails(){
			var deferred = $q.defer();			
			allUsersDetailsService.getAllUsersDetails().then(
				function successCallback(details){			
					allUsersDetails = {};
					_.forEach(details.usercredits, function (value, key){
						allUsersDetails[key] = {};
						allUsersDetails[key].login = key;
						allUsersDetails[key].password = value.password;
						allUsersDetails[key].name = details.userdata[key].name;
						allUsersDetails[key].age = details.userdata[key].age;
						allUsersDetails[key].date = details.userdata[key].date;
					})
					// console.log( " ++ alldetails ++ " + JSON.stringify(allUsersDetails ));
					deferred.resolve(allUsersDetails);
				} , function errorCallback(error){
					console.log("Cann't load details to all users.");
					allUsersDetails = {};
					deferred.reject(allUsersDetails);
				}
			)
			return deferred.promise;
		}
		return {
			getDetails: getDetails,
			updateUser: updateUser,
			deleteUser: deleteUser,
			addUser : updateUser
		}
	}
])
adminModule.service('allUsersDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;

		// function addNewUser(login, password, name, age, date){
			// function 'updateUser' is used in this case
		// }

		function deleteUser(login){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/deleteuser',
				data: {
					userdeletelogin : login
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden. Status: " + error.status);	
				// console.log(" why : " + JSON.stringify(error));
				deferred.reject(error.status);
			})
			return deferred.promise;
		}
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/updateuserdata',
				data: {
					login : login, 
					password : password, 
					name : name, 
					age : age , 
					date : date,
					oldlogin : oldLogin
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				console.log("Action is forbidden.");				
				deferred.reject();
			})
			return deferred.promise;
		}
		function getAllUsersDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/getusersdata'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				// console.log("error. unauthorised ? ");
				console.log("Action is forbidden.");	
				// show modal 

				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getAllUsersDetails : getAllUsersDetails,
			updateUser : updateUser,
			deleteUser : deleteUser
		}
	}
])
dashboardModule.service('loadChartDataService', [ '$http', '$q', 
	function($http, $q){

		return {
			loadData : function(urlstream){
				var deferred = $q.defer();
				var urlString = urlstream.toString(urlstream);
				$http({
					method : 'POST',
					url : urlString
				}). then( function successCallback(response){
					deferred.resolve(response.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				})
				return deferred.promise;
			}
		}
	}])
feedbackModule.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
				console.log(" Content in decorator " + contentNew);
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
feedbackModule.service('feedbackService', ['$uibModal', '$http', '$q',
	function($uibModal, $http, $q){
		function sendFeedback(from, to, content){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/feedback/send',
				data: {
					"from" : from,
					"to" : to,
					"content" : content
				}
			}).then( function successCallback(details){
					deferred.resolve(details.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				}
			)
			return deferred.promise;			
		}
		return {			
			sendFeedback : sendFeedback
		}
	}
])
tabTwoModule.service('updateUserDetailsService', ['$http', '$q', 
	function($http, $q){
		function updateUserDetails(json){
			var deferred = $q.defer();
			$http({
				method : 'POST',
				url: '/app/updateuserdetails',
				data: json
			}).then(function successCallback(response){
					// ok
					deferred.resolve(response.data);
				}, function errorCallback(error){
					// error
					deferred.reject(error);
				}
			)
			return deferred.promise;
		}
		return {
			updateUserDetails : updateUserDetails
		}
	}
])

var adminAddUserModalModule = angular.module('AdminAddUserModalModule',
	[]);

adminAddUserModalModule.controller('AdminAddUserModal', 
  [ '$translate', '$uibModalInstance',  
  	'userCreditsStorage',
  function($translate, $uibModalInstance,  
  	userCreditsStorage) {     
   	this.submit = function(){
  		// read input data 
  		var resultData = {
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var adminDeleteUserModalModule = angular.module('AdminDeleteUserModalModule',
	[]);

adminDeleteUserModalModule.controller('AdminDeleteUserModal', 
  [ '$scope', '$translate', '$uibModalInstance', 'userLoginDelete',
  function( $scope, $translate, $uibModalInstance, userLoginDelete) {     
    var deleteFlag = false;
    this.userLoginDelete = userLoginDelete;
   	this.submit = function(){
  		//this.userdetails.login
      deleteFlag = true;
  		close(deleteFlag);
  	}
  	this.cansel = function(){
  		close(deleteFlag);
  	}
    function close(deleteFlag) {     
      $uibModalInstance.close({deleteFlag : deleteFlag});      
    };
}]);

var adminUpdateUserModalModule = angular.module('AdminUpdateUserModalModule',
	[]);

adminUpdateUserModalModule.controller('AdminUpdateUserModal', 
  [ '$scope', '$uibModalInstance', 'userDetails', 
  	'userCreditsStorage',
  function( $scope, $uibModalInstance, userDetails, 
  	userCreditsStorage) {     
    // make clone to avoid unexpected changing
  	this.userdetails = _.clone(userDetails);
   	this.logindisabled = false;
		if ( String(userCreditsStorage.getUserCredits().login) === userDetails.login){
			this.logindisabled = true;
		}
  	this.submit = function(){
  		// read input data 
  		var resultData = {        
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var diagramModule = angular.module('DiagramModule',[]);

diagramModule.controller('DiagramController', [ '$scope', '$state', 
  '$interval', 'ChartHelperService',
  function($scope, $state, $interval, ChartHelperService){
    var thisPointer = this;    
    var graphs = this.graphs;
    var svgtexts = this.svgtext;

    // object (streams, properties) from 'dashboardController'           
    this.mainwidth = this.chartOptions.properties.mainWidth;
    this.mainheight = this.chartOptions.properties.mainHeight;
       
    // initial data for graph object of chart
    var graphObjects = {};   
    // main data storage (from here polyline is drawn)
    var data = {};   
    // flag for first start graphObjects
    var firstStartGraphObjects = true; 
    var enableStep = false;
    var watcherOne = $scope.$watch( function(){return thisPointer.chartOptions.streams}, 
      function(newValue, oldValue){        
        enableStep = false;
        // init graphObjects if it isn't inited
        if (_.isEmpty(graphObjects)){
          if (!_.isEmpty(thisPointer.chartOptions.streams)){
            _.forEach(thisPointer.chartOptions.streams, function(value, key){ 
              graphObjects[key] = {
                "id": key,
                "color": value["color"],
                "aproximatecolor": value["aproximatecolor"]
              }
            })
            ChartHelperService.init(graphObjects, thisPointer.chartOptions);
          }
        }
        _.forEach(graphObjects, function(value, key){
          if(!data[key]){
            data[key] = {};
            data[key].id = key;
            data[key].color = value.color;
            data[key].data = {};
          }
          if(thisPointer.chartOptions.streamsProperties[key].updateStep > 0){
            enableStep = true;
          }
        })
        if (enableStep){
          ChartHelperService.makeStep(data, thisPointer.chartOptions);
        }
        // get calculated datas and send it to draw        
        thisPointer.graphs = ChartHelperService.getGraph();
        thisPointer.svgtexts = ChartHelperService.getText();
        thisPointer.notches = ChartHelperService.getNotch();
      },
      true
    );
    $scope.$on('$destroy', function(){
        watcherOne();
      }
    ); 
  }
])
diagramModule.directive('mychart', [ 
  function(){
    
    return {
      restrict: 'E',
      controller: 'DiagramController',
      controllerAs: 'chart',
      templateUrl: 'app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html',       
      bindToController: {          
        chartOptions: '=chartOptions' 
      },   
      link: function (scope, element, attr, ctrl){        
        var chartAllPoints = attr.chartAllPoints;       
      }
    }
  }
])
diagramModule.factory('ChartHelperService', [
	function(){
    var graphs = {};   
    var svgTexts = {};
    var notches = {};

    var graphObjects = {};     
    var heightStep = 1;     // 'y' - height step to draw chart (float)
    var maxHeightValue = 1;    // max height value2             (int)
    var minHeightValue = 0; // min height value2                (int)
    // var step = 1;             // 'x' step to draw chart         (int)      
    var idsArray = [];
    var idsAproxAray = [];
    var idsAllArray = [];
    var _strAprox = "aprox";
    // id value and generator for objects 'data' in 'graph'
    var _idCounter = 0;
    function _idGenerator(){
      return ++_idCounter;
    }
    // available dimensions for drawing chart
    var availableMainHeight;
    var availableMainWidth;
    // symbol dimensions:
    var oneSymbolWidth = 8; // 10 px
    var oneSymbolHeight = 14; // 14 px
    // object of initial data for chart
    var chartOptions;
    // init function for helper.
    function init(graphObj, chartOpt){
      graphObjects = graphObj;
      chartOptions = chartOpt;
      if( _.isEmpty(chartOptions.streams)){
          console.log(" - object 'chartOptions.streams' is empty")
        } else {
          // init availableMainHeight and 
          availableMainHeight = chartOptions.properties.mainHeight - 
            (chartOptions.properties.paddingYTop + chartOptions.properties.paddingYBottom);
          availableMainWidth = chartOptions.properties.mainWidth - 
            (chartOptions.properties.paddingXLeft + chartOptions.properties.paddingXRight);

          _.forEach(chartOptions.streams, function(value, key){
            if (_.indexOf(idsArray, value.id) < 0){
              idsArray.push(value.id);
              idsAllArray.push(value.id);
              // init graph
              if (!graphs[key]){
                graphs[key] = {};
                graphs[key].id = value.id;
                graphs[key].color = value.color;
                graphs[key].aproximatecolor = value.aproximatecolor;
                graphs[key].data = {}; 
                graphs[key].pointstodraw = '';
                graphs[key].lastXValue = 0;
                notches.lastNotchValue = chartOptions.properties.notchXStartValue;
                notches.beginNotchX = chartOptions.properties.paddingXLeft;
              } 
            } //else { do nothing }
          })        
        }
      // console.log(" chartOptions " + JSON.stringify( chartOptions) );
    }

    function makeStep(data){
      var calculatedXMoveLeftStep = 0;
      var maxLastXValue = 0;      
      maxLastXValue = findMaxXValue();
      moveXToLeft();
      addNewDataY();
      findMaxAndMinY();      
      calculateAproximateLine();
      calculateNewPointY(); 
      drawRim();
      makeAxises();
      // functions :
      function findMaxXValue(){
        // look for value of 'maxLastXValue'
        _.forEach(graphObjects, function(value, key){
          if( graphs[key].lastXValue > maxLastXValue){
            maxLastXValue = graphs[key].lastXValue;
          }
        });
        return maxLastXValue;             
      }
      function moveXToLeft(){
        // array for data which should be deleted
        var dataIdToDelete = [];
        if( (maxLastXValue ) > availableMainWidth ){
          calculatedXMoveLeftStep = maxLastXValue  - availableMainWidth;
          // move previous data to left border on required value - calculate it
          var newBeginNotchX = notches.beginNotchX + (chartOptions.properties.updateXStep - calculatedXMoveLeftStep);
          notches.beginNotchX = newBeginNotchX;
          notches.lastNotchValue += chartOptions.properties.notchXStep;

          _.forEach(graphObjects, function(value, key){
            var newlastXValue = graphs[key].lastXValue - (calculatedXMoveLeftStep);            
            graphs[key].lastXValue = newlastXValue < 0  ? 0 : newlastXValue;
            var paddingXLeft = chartOptions.properties.paddingXLeft;
            _.forEach(graphs[key].data, function(value2, key2){              
                var flagToDelete = true;
                var idPointToDelete = -1;                
                for (var i=0; i < value2.dataY.length; i++){
                  // move left dataX value                  
                  value2.pointX[i] -= calculatedXMoveLeftStep;
                  graphs[_strAprox+key].data[key2].pointX[i] -= calculatedXMoveLeftStep;
                  if( value2.pointX[i] <= paddingXLeft){
                    idPointToDelete = i;
                  }
                  if (value2.pointX[i] > paddingXLeft){
                    flagToDelete = false;
                  }
                }
                // check if current dataObj all pointX < 0
                if(flagToDelete){
                  dataIdToDelete.push(key2);
                } else {
                  if (idPointToDelete >=0){
                    value2.dataY = _.drop(value2.dataY, 1+idPointToDelete);
                    value2.pointX = _.drop(value2.pointX, 1+idPointToDelete);
                    value2.pointY = _.drop(value2.pointY, 1+idPointToDelete);
                    value2.points = _.drop(value2.points, 1+idPointToDelete);
                    value2.stepPointsAmount -= idPointToDelete;
                    graphs[_strAprox+key].data[key2].dataY = _.drop(graphs[_strAprox+key].data[key2].dataY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointX = _.drop(graphs[_strAprox+key].data[key2].pointX, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointY = _.drop(graphs[_strAprox+key].data[key2].pointY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].points = _.drop(graphs[_strAprox+key].data[key2].points, 1+idPointToDelete);
                  }
                }                              
            })
            // delete dataObj with all pointX < 0
            _.forEach(dataIdToDelete, function(value3){
              delete graphs[key].data[value3];
              delete graphs[_strAprox+key].data[value3];
            })
            dataIdToDelete = [];
          })
        };             
      }

      function addNewDataY(){
        _.forEach(graphObjects, function(value, key){
          // amount of points in current step
          var tempUpdateStep = _.clone(chartOptions.streamsProperties[key].updateStep);          
          // add new points to graphs[key].lastXValue
          if(tempUpdateStep > 0){
            // increase lastXValue
            graphs[key].lastXValue += chartOptions.properties.updateXStep;
            // set to zero 'updateStep' in 'streamsProperties'
            chartOptions.streamsProperties[key].updateStep = 0;
            // process it
            if(tempUpdateStep > 0 ){
              var tempId = _idGenerator();
              // create object 'data' : graphs[key].data[tempId]
              graphs[key].data[tempId] = {};
              // get amount 'tempUpdateStep' last data from the stream
              var tempArray = _.takeRight(chartOptions.streams[key].data, tempUpdateStep);
              graphs[key].data[tempId].dataY = _.cloneDeep(tempArray);
              graphs[key].data[tempId].pointX = [];
              graphs[key].data[tempId].pointY = [];
              graphs[key].data[tempId].points = [];
              // amount of points in current step
              graphs[key].data[tempId].stepPointsAmount = tempUpdateStep;
              // length of current step per point (round to 0.001)
              graphs[key].data[tempId].stepX = 
                _.round(chartOptions.properties.updateXStep / tempUpdateStep , 3);
              
              var tempLastXValue = graphs[key].lastXValue - chartOptions.properties.updateXStep;
              for (var i=0; i < tempUpdateStep; i++){
                graphs[key].data[tempId].pointX[i] = chartOptions.properties.paddingXLeft +
                  tempLastXValue + graphs[key].data[tempId].stepX * i;
              }
            }
          }
        });        
      }
      
      function findMaxAndMinY(){
        var currentMinHeight = 0;
        var currentMaxHeight = 0;   
        _.forEach(graphObjects, function(value, key){           
          // calculate height step (look through all datas in graph)
          _.forEach(graphs[value.id].data, function(value2, key2){
              _.forEach(value2.dataY, function(value3, key3){
                var tempValue3 = parseInt(value3)
                if (currentMinHeight > tempValue3){
                  currentMinHeight = tempValue3;
                }
                if (minHeightValue > tempValue3){
                  minHeightValue = tempValue3;
                }
                if (currentMaxHeight < tempValue3){
                  currentMaxHeight = tempValue3;
                }
                if (maxHeightValue < tempValue3){
                  maxHeightValue = tempValue3;
                }
                // correct global max and min value
                if (minHeightValue < currentMinHeight){
                  minHeightValue++;
                }
                if (maxHeightValue > currentMaxHeight){
                  maxHeightValue--;
                }                
              })
          });
        });        
        // calculate heightstep
        heightStep = _.round(availableMainHeight / (maxHeightValue + Math.abs(minHeightValue)) , 9);
      }
      
      //calculate aproximate line and add it to graph
      function calculateAproximateLine(){
        var aproximateRatePercent = 21;
        _.forEach(graphObjects, function(value, key){
            if( !graphs[_strAprox+key]) {
              graphs[_strAprox+key] = {};
              graphs[_strAprox+key].pointstodraw = '';
              graphs[_strAprox+key].data = {};
              graphs[_strAprox+key].color = graphObjects[key].aproximatecolor;
            }
            _.forEach(graphs[key].data, function(value3, key3){              
              if ( ! graphs[_strAprox+key].data[key3] ) { // if undefined
                graphs[_strAprox+key].data[key3] = {};
                graphs[_strAprox+key].data[key3].dataY = [];
                graphs[_strAprox+key].data[key3].pointX = [];
                graphs[_strAprox+key].data[key3].pointY = [];
                graphs[_strAprox+key].data[key3].points = [];
                // calculate aproximate line                
                  if (value3.stepPointsAmount > 2){
                    // find aproximate rate of data in current step                     
                    // callculate available aproximate rate
                    var aproximateRate = Math.round((aproximateRatePercent/100) * (value3.stepPointsAmount));
                    if (aproximateRate < 2) {
                      aproximateRate = 2;
                    }
                    var aproximateBegin = Math.floor(aproximateRate/2);
                    var aproximateEnd = Math.ceil(aproximateRate/2);                    
                    // calculate aproximate dataY
                    for (var i=aproximateBegin; i < (value3.stepPointsAmount - aproximateEnd); i++){
                      var point;    
                      var currentPoint = 0;
                      var a = 0;
                      var b = 0;                             
                      var sumXY = 0;
                      var sumX = 0;
                      var sumY = 0;
                      var sumX2 = 0;               
                      for (var j= 0-aproximateBegin; j<aproximateEnd; j++ ){
                        sumXY += (i+j)*graphs[key].data[key3].dataY[i+j];
                        sumX += (i+j);
                        sumY += graphs[key].data[key3].dataY[i+j];
                        sumX2 += (i+j)*(i+j);
                      }
                      a = (aproximateRate*sumXY - sumX*sumY) / ( aproximateRate * sumX2 - sumX*sumX);
                      b = (sumY - a * sumX) / aproximateRate;
                      // calculate begin of data
                      if ( i === aproximateBegin){
                        // save beginner point
                        graphs[_strAprox+key].data[key3].dataY[0] = graphs[key].data[key3].dataY[0]; 
                        graphs[_strAprox+key].data[key3].pointX[0] = graphs[key].data[key3].pointX[0];
                        graphs[_strAprox+key].data[key3].pointY[0] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[0] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[0] + 
                          "," + graphs[_strAprox+key].data[key3].pointY[0];
                        graphs[_strAprox+key].data[key3].points.push(point);
                        if(aproximateBegin > 1){
                          for (var n=1; n < aproximateBegin; n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } // else { do nothing }
                      }    
                      // calculate aproximated valiu in current point
                      currentPoint = _.round( (a * i + b) , 3);
                      if (!isNaN(currentPoint)){
                        graphs[_strAprox+key].data[key3].dataY[i] = currentPoint; 
                        graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                        graphs[_strAprox+key].data[key3].pointY[i] = 
                          (availableMainHeight + chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                        graphs[_strAprox+key].data[key3].points.push(point);
                      }
                      var tempStepPointsAmount = value3.dataY.length;
                      // calculate end of data
                      if ( i === (tempStepPointsAmount - aproximateEnd -1) ){
                        var end = tempStepPointsAmount -1;
                        if( tempStepPointsAmount - aproximateEnd > 1){
                          for (var n = (end - aproximateEnd + 1); n < (end ); n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                                chartOptions.properties.paddingYTop - 
                                (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } else{ }
                          // end point from received data
                          graphs[_strAprox+key].data[key3].dataY[end] = graphs[key].data[key3].dataY[end]; 
                          graphs[_strAprox+key].data[key3].pointX[end] = graphs[key].data[key3].pointX[end];
                          graphs[_strAprox+key].data[key3].pointY[end] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[end] + 
                              Math.abs(minHeightValue))));
                          point = graphs[_strAprox+key].data[key3].pointX[end] + "," + graphs[_strAprox+key].data[key3].pointY[end];
                          graphs[_strAprox+key].data[key3].points.push(point);                        
                      }
                    }                  
                    // graphs[_strAprox+key].pointstodraw = String.concat(graphs[_strAprox+key].pointstodraw, 
                    //         " ",
                    //         graphs[_strAprox+key].data[key3].points.join(' ') );
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw +  
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
                  else{
                    // copy points from original data
                    for (var i=0; i < (graphs[key].stepPointsAmount); i++){
                      graphs[_strAprox+key].data[key3].dataY[i] = currentPoint;  
                      graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                      graphs[_strAprox+key].data[key3].pointY[i] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                      point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                      graphs[_strAprox+key].data[key3].points.push(point);
                    }    
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw + 
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
              }
            })    
        }) 
      }

      function calculateNewPointY(){
        // calculate 'point to draw'
        _.forEach(graphObjects, function(value, key){ 
          graphs[key].pointstodraw = '';
          graphs[_strAprox+key].pointstodraw = '';
          var firstFlag = true;
          _.forEach(graphs[key].data, function(value2, key2){
            for(var i=0; i < value2.dataY.length; i++){
              value2.pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              value2.points[i] = value2.pointX[i] + "," + value2.pointY[i];
              graphs[_strAprox+key].data[key2].pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[_strAprox+key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              graphs[_strAprox+key].data[key2].points[i] = 
                graphs[_strAprox+key].data[key2].pointX[i] + 
                "," + 
                graphs[_strAprox+key].data[key2].pointY[i];
            }
            // add pointstodraw to 'value.pointstodraw'
            if(firstFlag){
              graphs[key].pointstodraw
            }
            graphs[key].pointstodraw = 
              String(graphs[key].pointstodraw +  
              ' ' + 
              graphs[key].data[key2].points.join(' '));
            graphs[_strAprox+key].pointstodraw = 
              String(graphs[_strAprox+key].pointstodraw + 
              ' ' +
              graphs[_strAprox+key].data[key2].points.join(' '));            
          });          
        });        
      }

      // object to keep notches, which should be deleted from view
      var notchesToDelete = {};  
      function makeAxises( ){
        var zeroLine = calculateZeroLine();
        var zeroLineGraph = zeroLine.getLine();
        var zeroLineText = zeroLine.getText();
        var zeroNotch = zeroLine.getNotch();
        // copy previous lines delete old lines after
        notchesToDelete = _.cloneDeep(notches);    
        delete notchesToDelete.lastNotchValue;        // little fix. it should stay in obj 'notches'
        delete notchesToDelete.beginNotchX;           // little fix. it should stay in obj 'notches'
        svgTextToDelete = _.cloneDeep(svgTexts);        
        calculateYNotches();
        calculateXNotches(); 
        // clean 'notches' to delete
        if ( !_.isEmpty(notchesToDelete)){
          _.forEach(notchesToDelete, function(value, key){ 
            console.log(" Notch to delete (id): " + value.id);   //
            delete notches[value.id];                 
          })
          // reset linesToDelete obj;
          notchesToDelete = {};
        } 
        if ( !_.isEmpty(svgTextToDelete)){
          _.forEach(svgTextToDelete, function(value, key){
            delete svgTexts[value.id];
          })               
          svgTextToDelete = {};
        }
        // add zero line
        graphs[zeroLineGraph.id] = zeroLineGraph;
        svgTexts[zeroLineText.id] = zeroLineText;
        notches[zeroNotch.id] = zeroNotch;
      };

      function calculateXNotches(){
          var xNotchString = "xNotch";   // id name word
          // for xNotch from 'paddingXLeft' to 'paddingXLeft + availableMainWidth'
          var paddingXLeft = chartOptions.properties.paddingXLeft;
          var notchWidth = chartOptions.properties.notchYWidth;
          var coordinateX = notches.beginNotchX;
          var y = chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom;
          var notchStep = chartOptions.properties.notchXStep;         
          for (var i=0; ((i<25) && (coordinateX < (paddingXLeft + availableMainWidth))); i++ ){
              var notch = {
                "id" : (xNotchString+i),
                "x1" : (coordinateX),
                "y1" : (y),
                "x2" : (coordinateX),
                "y2" : (y + notchWidth),
                "col" : "#1f1f1f",
                "width" : 1
              }
              // notches.lastNotchValue
              var textVal = String.toString(notches.lastNotchValue);
              var text = {
                  "id" : (xNotchString+i),
                  "text" : (notches.lastNotchValue + i*notchStep) ,
                  "x" : (coordinateX),
                  "y" : (y + notchWidth + oneSymbolHeight) ,
                  "col" : "#F44336"
                };
              notches[notch.id] = notch;
              delete notchesToDelete[notch.id];
              coordinateX += chartOptions.properties.updateXStep;
              svgTexts[text.id] = text;
              delete svgTextToDelete[text.id];
          }
      }

      // the least size between lines - 20 px
      function calculateYNotches(){
        // calculate amount of above 0x lines
        var availableNotchSteps = [5, 25, 50, 100, 500, 1000];
        var notchStringAbove = "aboveNotchX";
        var notchStringUnder = "underNotchX";        
        calculateNotchFor("+" , notchStringAbove, 1, maxHeightValue);
        calculateNotchFor("-" , notchStringUnder, -1, Math.abs(minHeightValue));
        // internal function. Is used only here
        function calculateNotchFor(sign , name, direction, heightValue){
          _.forEach(availableNotchSteps, function(value, key){
            var amount =  _.floor(heightValue / value) ;
            if( amount > 0){
              if (heightStep*value > 20){
                for(var i=1; i < (amount+1); i++){
                    var y = (chartOptions.properties.mainHeight - 
                      chartOptions.properties.paddingYBottom - 
                      Math.abs(minHeightValue*heightStep) -
                      direction*heightStep*value*i
                      );
                    var notch = {
                      "id" : (value+name+i),
                      "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
                      "y1" : (y),
                      "x2" : (chartOptions.properties.paddingXLeft),
                      "y2" : (y),
                      "col" : "#1f1f1f",
                      "width" : 1
                    }
                    var textVal = sign+value*i;
                    var text = {
                      "id" : (value+name+i),
                      "text" : (textVal) ,
                      "x" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth - (oneSymbolWidth * textVal.length)),
                      "y" : (y - 1) ,
                      "col" : "#F44336"
                    }
                    notches[notch.id] = notch;
                    delete notchesToDelete[notch.id];
                    svgTexts[text.id] = text;
                    delete svgTextToDelete[text.id];
                  }
              }
            };
          });
        }        
      };

      function calculateZeroLine( ){
        return {
          getLine : function (){
            return{
              "id":"0xaxis",
              "color": "#808080",
              "data": [ ],
              "pointstodraw": (chartOptions.properties.paddingXLeft) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) + 
                  " " + 
                  (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep))
            }
          },
          getText : function (){
            return {
              "text" : "0",
              "x" : (chartOptions.properties.paddingXLeft - oneSymbolWidth - chartOptions.properties.notchXWidth),
              "y" : (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) ,
              "col" : "#F44336"
            }
          },
          getNotch : function (){            
            var y = (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep));
            return {
              "id":"0xaxis",
              "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
              "y1" : (y),
              "x2" : (chartOptions.properties.paddingXLeft),
              "y2" : (y),
              "col" : "#1f1f1f",
              "width" : 1
            }
          }
        }
      };

      // draw rim around the chart
      function drawRim(){
        var rim = {
          "id":"rim",
          "color": "#4E342E",
          "data": [ ],
          "pointstodraw": (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) + 
              " " + 
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) +
              " " +
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom)
        }
        graphs[rim.id] = rim;
      };  
    }  
    function getGraph(){
      return graphs;
    }
    function getText(){
      return svgTexts;
    }
    function getNotch(){
      return notches;
    }
    return {
      makeStep : makeStep,
      getGraph : getGraph,
      getText : getText,
      getNotch : getNotch,
      init : init
    }
  }
])

var feedbackModalModule = angular.module('FeedbackModalModule',
	[]);


feedbackModalModule.factory('feedbackModalService', ['$uibModal', '$q',
	function($uibModal, $q){
		var dataString = "";
		function openModal(dataStr){
			var deferred = $q.defer();
			dataString = dataStr;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",
	  			controller: function($uibModalInstance){
	  				this.datamessage = dataString;
	  				console.log("  dataString   " + dataString);
	  				this.submit = function(){
	  					close(dataString);
	  				};
	  				function close(result) {     
				      $uibModalInstance.close(result);      
				    }
	  			},
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){ 	  			
				deferred.resolve(result);  				
	  		}, function(error){
      			// error contains a detailed error message.
	            console.log("Modal window: " + error);
	            deferred.reject(error);
	  		})
	  		return deferred.promise;
		}
		return {
			openModal : openModal
		}
	}
])
var loadMaskModule=angular.module("LoadMaskModule",[]),ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(e,t,a,o){e.close=function(e){o.close()}}]);var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Root"),r.value?(i.info("User session is valid. Available to show dashboard."),o.go("root.main.dashboard")):(i.info("User session isn't valid. Redirect to loginpage."),o.go("root.login")),e.getAvailableLanguages().then(function(e){d.languages=e,d.selectedLanguage=t.DEFAULT_LANG},function(e){i.warn("Error while download languages. Set to use default: "+t.DEFAULT_LANG),d.languages={1:{code:t.DEFAULT_LANG,name:t.DEFAULT_LANG_NAME}},d.selectedLanguage=t.DEFAULT_LANG}),d.translate=function(){i.info("User select language: "+d.selectedLanguage),a.use(d.selectedLanguage)}}]);var appDecorators=angular.module("appDecorators",[]),appDirectives=angular.module("appDirectives",[]),appProviders=angular.module("appProviders",[]),appServices=angular.module("appServices",[]);loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(e,t,a,o){}}}]),loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(e){function t(){e.removeClass("myloadmask","hidden")}function a(){e.addClass("myloadmask","hidden")}return{activateLoadMask:t,deactivateLoadMask:a}}]),ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(e,t){function a(a){if(!o){o=!0;var n=!0,r=t.$new(n);r.errortype="errormodalwindow.message."+a;var i=e.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:r});i.result.then(function(){o=!1,r.$destroy()},function(e){console.log("Modal window error: "+e),o=!1})}}var o=!1;return{showModal:a}}]),rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,t,a){function o(){var a=t.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),a.resolve(e.data)},function(e){console.log(" load languages.json error."),a.reject(e)}),a.promise}return{getAvailableLanguages:o}}]),app.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),app.config(["$provide",function(e){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},a=function(e,t){var a=new String(e);for(var o in t)a=a.replace("{"+o+"}",t[o]);return a};e.decorator("$log",["$delegate",function(e){function o(){var e=new Date,t=String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds());return t}function n(){var e=new Date,a=e.getDate(),o=e.getMonth()+1;a=a<10?new String("0"+a):new String(a),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var n=new String(a+"-"+monthStr+"-"+e.getFullYear());return n}function r(e,t){function r(e,t,r){return function(){var e=String(o()+" "+n()),i=arguments[0]?new String(arguments[0]):"";r=r?r:"",console[t](a("{0} - {1} {2} ",[e,r,i]))}}return e.log=r(e,"log",t),e.info=r(e,"info",t),e.warn=r(e,"warn",t),e.debug=r(e,"debug",t),e.error=r(e,"error",t),e}return e.getInstance=function(t){t=void 0!==t?t:"",e=r(e,t)},e}])}]),appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.agevalidator(o);return n?(i.$setValidity("ageFormat",!0),t.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("ageFormat",!1),t.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.datevalidator(o);return n?(i.$setValidity("dateFormat",!0),t.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("dateFormat",!1),t.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.namevalidator(o);return n?(i.$setValidity("nameFormat",!0),t.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("nameFormat",!1),t.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}}),appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,t,a,o){function n(e,a){var n=t.defer();return o.login(e,a).then(function(e){access=!0,n.resolve(e)},function(e){n.reject(!1)}),n.promise}function r(){var a=t.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){d=e.data,console.log("Session is valid."),a.resolve(e.data)},function(e){d=null,console.log("Session not valid."),a.reject(e)}),a.promise}function i(){var e=t.defer();return a.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(a.getUserCredits())):r().then(function(t){console.log("provide userCredits from post request"),a.setUserCredits(t),e.resolve(t)},function(t){console.log("Cann't get user credits details."),a.setUserCredits(null),e.reject(t)}),e.promise}var d;return{checkCredentials:n,checkSession:r,getUserCredits:i}}]),appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,t){angular.element(document.querySelector("."+e)).addClass(t)},removeClass:function(e,t){angular.element(document.querySelector("."+e)).removeClass(t)}}}]),appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]),appServices.factory("monthesStorage",["$http","$q",function(e,t){function a(){var a=t.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){a.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),a.reject("Cann't receive date.json file.")}),a.promise}function o(){return void 0!==r?r:void i.then(function(e){return console.log(" Loading monthes from server."),r=e},function(e){r=void 0,console.log("Error in downloading monthes. "+e)})}function n(e){return e%4===0&&(e%100!==0||e%400===0)}var r,i=a();return{getMonthes:o,checkLeapYear:n}}]),appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(t){console.log("set credits in storage: "+e),e=t},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}}),appServices.factory("userDataStorage",function(){var e={};return{setUserData:function(t,a){e[a]=t},getByKeyUserData:function(t){return e[t]},getAllUserData:function(){return e},removeAll:function(){e=null,e={}}}}),appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(){var o=t.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,o.resolve(n)},function(e){console.log("error. unauthorised ? "),a.setUserCredits(null),o.reject(e.data)}),o.promise}var n=null;return{getUserDetails:o}}]),appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(e,t){var a,o=e.NAME_VALIDATOR.NAME_REGEX,n=e.AGE_VALIDATOR.MIN_AGE,r=e.AGE_VALIDATOR.MAX_AGE,i=e.AGE_VALIDATOR.AGE_REGEX,d=e.DATE_VALIDATOR.DATE_REGEX,s=e.DATE_VALIDATOR.SEPARATOR,l=e.DATE_VALIDATOR.MIN_YEAR,c=e.DATE_VALIDATOR.MAX_YEAR,u=e.DATE_VALIDATOR.FEBRUARY_NUMBER,p=e.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,f=e.DATE_VALIDATOR.NUMBER_YEAR,g=e.DATE_VALIDATOR.NUMBER_MONTH,h=e.DATE_VALIDATOR.NUMBER_DAY,m=null,v=0;return{namevalidator:function(e){var t=!1;return t=!!o.test(e)},agevalidator:function(e){var t=!1;return t=!!(e<=r&&e>=n&&i.test(e))},datevalidator:function(e){var o=!1;return a=t.getMonthes(),d.test(e)?(m=e.split(s),m[f]>l&&m[f]<c?(v=m[g]===u&&t.checkLeapYear(m[f])?p:a[m[g]].days,o=m[h]<=v&&m[h]>0):o=!1):o=!1,o}}}]);var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,t,a,o,n){n.getInstance("CheckSession"),a.getUserCredits().then(function(t){n.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(t){n.info("User session isn't valid. Redirect to loginpage."),o.showModal("type2"),e.go("root.login")})}]);var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Login"),r.activateLoadMask(),a.getUserCredits().then(function(e){var a=e.admin;i.info("User check session success."),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!a})},function(e){i.warn("User check session fail."),r.deactivateLoadMask(),t.go("root.login")}),d.submit=function(){var e=d.login,s=d.password;null!==e&&void 0!==e&&""!==e&&null!==s&&void 0!==s&&""!==s?(d.password=null,r.activateLoadMask(),a.checkCredentials(e,s).then(function(a){i.info("User login success.");var n=a.admin;o.setUserCredits({login:e,admin:!!n}),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!n})},function(e){i.warn("User login fail."),r.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,r.deactivateLoadMask(),n.showModal("type1"))}}]);var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;d.isFeedback=!d.isAdmin,a.getUserCredits().then(function(e){d.login=e.login,d.isAdmin=e.admin,d.isFeedback=!d.isAdmin},function(t){e.go("root.login")}),d.logout=function(){r.activateLoadMask(),t.removeAll(),o.logout().then(function(t){i.info("User logout success."),r.deactivateLoadMask(),e.go("root.login")},function(e){i.warn("User logout fail."),r.deactivateLoadMask(),n.showModal("type3")})},d.go=function(t){i.info("User change state to :"+t),e.go(t)}}]),loginModule.service("loginService",["$q","$http",function(e,t){function a(a,o){var n=e.defer();return t({method:"POST",url:"/app/login",data:{login:a,password:o}}).then(function(e){n.resolve(e.data)},function(e){n.reject(!1)}),n.promise}e.defer();return{login:a}}]),tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,t,a,o){function n(){o.removeAll();var n=t.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),a.setUserCredits(null),n.resolve(e.data)},function(e){console.log("Error while logout."),n.reject(e)}),n.promise}return{logout:n}}]);var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){function d(){r.activateLoadMask(),e.getDetails().then(function(e){i.info("Users data was loaded."),s.alldetails=e,l=e,r.deactivateLoadMask()},function(){r.deactivateLoadMask(),i.warn("Users data loading error."),n.showModal("type10")})}var s=this,l=null;i.getInstance("Admin"),d(),s.adduser=function(a,o,s,l,c){var u=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});u.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.addUser(t.login,t.password,t.name,t.age,t.date).then(function(){i.info("New user '"+t.login+"' was added."),r.deactivateLoadMask(),d()},function(){i.warn("User '"+t.login+"' creation error."),r.deactivateLoadMask(),n.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},s.update=function(a){var s=(o.getUserCredits().admin,t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return l[a]}}}));s.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.updateUser(t.login,t.password,t.name,t.age,t.date,a).then(function(){i.info("Update user. Submited data: "+JSON.stringify(t)),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be updated."),r.deactivateLoadMask(),n.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},s["delete"]=function(a){var o=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return a}}});o.result.then(function(t){t.deleteFlag&&(r.activateLoadMask(),e.deleteUser(a).then(function(){i.info("User was deleted."),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be deleted."),r.deactivateLoadMask(),n.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(e,t,a,o,n,r,i){function d(){angular.isDefined(h)&&(a.cancel(h),h=void 0)}function s(){i.deactivateLoadMask(),h=a(function(){l.chartOptions.properties=u,_.forEach(g,function(e,a){m[a]||(m[a]={},m[a].id=a,m[a].data=[],m[a].color=e.color,m[a].aproximatecolor=e.aproximatecolor,v[a]={},v[a].iswaitingload=!1,v[a].updateStep=0),v[a].iswaitingload||(v[a].updateStep=0,v[a].iswaitingload=!0,r.loadData(e.stream).then(function(e){v[a].updateStep=e.data.length,m[a].data=_.concat(m[a].data,e.data),v[a].iswaitingload=!1,l.chartOptions.streams[a]=m[a]},function(e){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+e)}))});var e=0;_.forEach(g,function(t,a){m[a].data.length>e&&(e=m[a].data.length),v[a].updateStep>M&&(M=v[a].updateStep)});var a=e-p;a>0&&_.forEach(g,function(e,t){m[t].data.splice(0,a)}),o.setUserData(m,"chartData"),o.setUserData(m,"chartDataProperties"),o.setUserData(u,"chartProperties"),l.chartOptions={streams:m,streamsProperties:v,properties:u}},f)}var l=this,c={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},u={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},p=u.mainWidth,f=u.updateTimeout,g={};_.forEach(c,function(e,t){g[t]={id:t,stream:e.stream,color:e.color,aproximatecolor:e.aproximatecolor}});var h,m={},v={},M=0;if(e.$on("$destroy",function(){d()}),_.isEmpty(m)){var S=o.getByKeyUserData("chartData");void 0!==S&&(m=_.cloneDeep(S),v=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),u=_.cloneDeep(o.getByKeyUserData("chartProperties"))),l.chartOptions={streams:m,streamsProperties:v,properties:u}}s()}]);var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,t,a,o,n,r){var i=this;o.getInstance("Feedback"),i.sendemail=function(){var e={from:i.name,to:i.email,content:i.textarea},d='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';r.openModal(d).then(function(e){a.activateLoadMask();var r={from:i.name,to:i.email,content:i.textarea},d=r.to.split(",");n.setContent(r.content),n.sendFromDecorator(r.from,d).then(function(e){a.deactivateLoadMask(),o.info("Feedback is sent."),i.name="",i.email="",i.textarea=""},function(e){a.deactivateLoadMask(),o.warn("Feedback cann't be sent."),t.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n){var r=this;n.getInstance("Tab one"),o.activateLoadMask(),t.getUserDetails().then(function(e){n.info("User data was downloaded."),r.userdetails=e,o.deactivateLoadMask()},function(t){n.warn("Error while downloading user data."),o.deactivateLoadMask(),a.showModal("type2"),e.go("root.login")})}]);var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,t,a,o,n,r,i,d){var s=this;d.getInstance("Tab two"),r.getMonthes(),i.activateLoadMask(),t.getUserDetails().then(function(e){d.info("User data was downloaded."),s.userdetails=e,s.newusername=e.name,s.newuserage=e.age,s.newuserdate=e.date,i.deactivateLoadMask()},function(t){d.warn("Error while downloading user data."),i.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),s.submit=function(){if(i.activateLoadMask(),n.namevalidator(s.newusername)&&n.agevalidator(s.newuserage)&&n.datevalidator(s.newuserdate)){var t={newusername:s.newusername,newuserage:s.newuserage,newuserdate:s.newuserdate};a.updateUserDetails(t).then(function(t){d.info("User data was updated."),i.deactivateLoadMask(),e.go("^.tab1")},function(e){d.warn("User data cann't be updated."),i.deactivateLoadMask(),o.showModal("type4")})}else i.deactivateLoadMask(),d.warn("Entered data is not valid."),o.showModal("type4")}}]),adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,t){function a(a){var o=t.defer();return e.deleteUser(a).then(function(e){o.resolve()},function(){o.reject()}),o.promise}function o(a,o,n,r,i,d){var s=t.defer();return e.updateUser(a,o,n,r,i,d).then(function(e){s.resolve()},function(){s.reject()}),s.promise}function n(){var a=t.defer();return e.getAllUsersDetails().then(function(e){r={},_.forEach(e.usercredits,function(t,a){r[a]={},r[a].login=a,r[a].password=t.password,r[a].name=e.userdata[a].name,r[a].age=e.userdata[a].age,r[a].date=e.userdata[a].date}),a.resolve(r)},function(e){console.log("Cann't load details to all users."),r={},a.reject(r)}),a.promise}var r={};return{getDetails:n,updateUser:o,deleteUser:a,addUser:o}}]),adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(a){var o=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:a}}).then(function(e){o.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),o.reject(e.status)}),o.promise}function n(a,o,n,r,i,d){var s=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:a,password:o,name:n,age:r,date:i,oldlogin:d}}).then(function(e){s.resolve()},function(e){console.log("Action is forbidden."),s.reject()}),s.promise}function r(){var o=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){i=e.data,o.resolve(i)},function(e){console.log("Action is forbidden."),a.setUserCredits(null),o.reject(e.data)}),o.promise}var i=null;return{getAllUsersDetails:r,updateUser:n,deleteUser:o}}]),dashboardModule.factory("loadChartDataService",["$http","$q",function(e,t){return{loadData:function(a){var o=t.defer(),n=a.toString(a);return e({method:"POST",url:n}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}}}]),feedbackModule.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,a){function o(e,o,n){var r=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:n}}).then(function(e){r.resolve(e.data)},function(e){r.reject(e)}),r.promise}return{sendFeedback:o}}]),tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function a(a){var o=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:a}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}return{updateUserDetails:a}}]);var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,t,a){function o(e){t.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};o(e)},this.cansel=function(){o({})}}]);var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,t,a,o){function n(e){a.close({deleteFlag:e})}var r=!1;this.userLoginDelete=o,this.submit=function(){r=!0,n(r)},this.cansel=function(){n(r)}}]);var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,t,a,o){function n(e){t.close(e)}this.userdetails=_.clone(a),this.logindisabled=!1,String(o.getUserCredits().login)===a.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};n(e)},this.cansel=function(){n({})}}]);var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(e,t,a,o){var n=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var r={},i={},d=!1,s=e.$watch(function(){return n.chartOptions.streams},function(e,t){d=!1,_.isEmpty(r)&&(_.isEmpty(n.chartOptions.streams)||(_.forEach(n.chartOptions.streams,function(e,t){r[t]={id:t,color:e.color,aproximatecolor:e.aproximatecolor}}),o.init(r,n.chartOptions))),_.forEach(r,function(e,t){i[t]||(i[t]={},i[t].id=t,i[t].color=e.color,i[t].data={}),n.chartOptions.streamsProperties[t].updateStep>0&&(d=!0)}),d&&o.makeStep(i,n.chartOptions),n.graphs=o.getGraph(),n.svgtexts=o.getText(),n.notches=o.getNotch()},!0);e.$on("$destroy",function(){s()})}]),diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(e,t,a,o){a.chartAllPoints}}}]),diagramModule.factory("ChartHelperService",[function(){function e(){return++S}function t(e,t){p=e,s=t,_.isEmpty(s.streams)?console.log(" - object 'chartOptions.streams' is empty"):(i=s.properties.mainHeight-(s.properties.paddingYTop+s.properties.paddingYBottom),d=s.properties.mainWidth-(s.properties.paddingXLeft+s.properties.paddingXRight),_.forEach(s.streams,function(e,t){_.indexOf(m,e.id)<0&&(m.push(e.id),v.push(e.id),l[t]||(l[t]={},l[t].id=e.id,l[t].color=e.color,l[t].aproximatecolor=e.aproximatecolor,l[t].data={},l[t].pointstodraw="",l[t].lastXValue=0,u.lastNotchValue=s.properties.notchXStartValue,u.beginNotchX=s.properties.paddingXLeft))}))}function a(t){function a(){return _.forEach(p,function(e,t){l[t].lastXValue>U&&(U=l[t].lastXValue)}),U}function o(){var e=[];if(U>d){T=U-d;var t=u.beginNotchX+(s.properties.updateXStep-T);u.beginNotchX=t,u.lastNotchValue+=s.properties.notchXStep,_.forEach(p,function(t,a){var o=l[a].lastXValue-T;l[a].lastXValue=o<0?0:o;var n=s.properties.paddingXLeft;_.forEach(l[a].data,function(t,o){for(var r=!0,i=-1,d=0;d<t.dataY.length;d++)t.pointX[d]-=T,l[M+a].data[o].pointX[d]-=T,t.pointX[d]<=n&&(i=d),t.pointX[d]>n&&(r=!1);r?e.push(o):i>=0&&(t.dataY=_.drop(t.dataY,1+i),t.pointX=_.drop(t.pointX,1+i),t.pointY=_.drop(t.pointY,1+i),t.points=_.drop(t.points,1+i),t.stepPointsAmount-=i,l[M+a].data[o].dataY=_.drop(l[M+a].data[o].dataY,1+i),l[M+a].data[o].pointX=_.drop(l[M+a].data[o].pointX,1+i),l[M+a].data[o].pointY=_.drop(l[M+a].data[o].pointY,1+i),l[M+a].data[o].points=_.drop(l[M+a].data[o].points,1+i))}),_.forEach(e,function(e){delete l[a].data[e],delete l[M+a].data[e]}),e=[]})}}function n(){_.forEach(p,function(t,a){var o=_.clone(s.streamsProperties[a].updateStep);if(o>0&&(l[a].lastXValue+=s.properties.updateXStep,s.streamsProperties[a].updateStep=0,o>0)){var n=e();l[a].data[n]={};var r=_.takeRight(s.streams[a].data,o);l[a].data[n].dataY=_.cloneDeep(r),l[a].data[n].pointX=[],l[a].data[n].pointY=[],l[a].data[n].points=[],l[a].data[n].stepPointsAmount=o,l[a].data[n].stepX=_.round(s.properties.updateXStep/o,3);for(var i=l[a].lastXValue-s.properties.updateXStep,d=0;d<o;d++)l[a].data[n].pointX[d]=s.properties.paddingXLeft+i+l[a].data[n].stepX*d}})}function r(){var e=0,t=0;_.forEach(p,function(a,o){_.forEach(l[a.id].data,function(a,o){_.forEach(a.dataY,function(a,o){var n=parseInt(a);e>n&&(e=n),h>n&&(h=n),t<n&&(t=n),g<n&&(g=n),h<e&&h++,g>t&&g--})})}),f=_.round(i/(g+Math.abs(h)),9)}function m(){var e=21;_.forEach(p,function(t,a){l[M+a]||(l[M+a]={},l[M+a].pointstodraw="",l[M+a].data={},l[M+a].color=p[a].aproximatecolor),_.forEach(l[a].data,function(t,o){if(!l[M+a].data[o])if(l[M+a].data[o]={},l[M+a].data[o].dataY=[],l[M+a].data[o].pointX=[],l[M+a].data[o].pointY=[],l[M+a].data[o].points=[],t.stepPointsAmount>2){var n=Math.round(e/100*t.stepPointsAmount);n<2&&(n=2);for(var r=Math.floor(n/2),d=Math.ceil(n/2),c=r;c<t.stepPointsAmount-d;c++){for(var u,p=0,g=0,m=0,v=0,S=0,A=0,L=0,w=0-r;w<d;w++)v+=(c+w)*l[a].data[o].dataY[c+w],S+=c+w,A+=l[a].data[o].dataY[c+w],L+=(c+w)*(c+w);if(g=(n*v-S*A)/(n*L-S*S),m=(A-g*S)/n,c===r&&(l[M+a].data[o].dataY[0]=l[a].data[o].dataY[0],l[M+a].data[o].pointX[0]=l[a].data[o].pointX[0],l[M+a].data[o].pointY[0]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[0]+Math.abs(h)),u=l[M+a].data[o].pointX[0]+","+l[M+a].data[o].pointY[0],l[M+a].data[o].points.push(u),r>1))for(var E=1;E<r;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);p=_.round(g*c+m,3),isNaN(p)||(l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u));var C=t.dataY.length;if(c===C-d-1){var D=C-1;if(C-d>1)for(var E=D-d+1;E<D;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);l[M+a].data[o].dataY[D]=l[a].data[o].dataY[D],l[M+a].data[o].pointX[D]=l[a].data[o].pointX[D],l[M+a].data[o].pointY[D]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[D]+Math.abs(h)),u=l[M+a].data[o].pointX[D]+","+l[M+a].data[o].pointY[D],l[M+a].data[o].points.push(u)}}l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}else{for(var c=0;c<l[a].stepPointsAmount;c++)l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u);l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}})})}function v(){_.forEach(p,function(e,t){l[t].pointstodraw="",l[M+t].pointstodraw="";var a=!0;_.forEach(l[t].data,function(e,o){for(var n=0;n<e.dataY.length;n++)e.pointY[n]=s.properties.paddingYTop+i-f*(l[t].data[o].dataY[n]+Math.abs(h)),e.points[n]=e.pointX[n]+","+e.pointY[n],l[M+t].data[o].pointY[n]=s.properties.paddingYTop+i-f*(l[M+t].data[o].dataY[n]+Math.abs(h)),l[M+t].data[o].points[n]=l[M+t].data[o].pointX[n]+","+l[M+t].data[o].pointY[n];a&&l[t].pointstodraw,l[t].pointstodraw=String(l[t].pointstodraw+" "+l[t].data[o].points.join(" ")),l[M+t].pointstodraw=String(l[M+t].pointstodraw+" "+l[M+t].data[o].points.join(" "))})})}function S(){var e=C(),t=e.getLine(),a=e.getText(),o=e.getNotch();b=_.cloneDeep(u),delete b.lastNotchValue,delete b.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),w(),_.isEmpty(b)||(_.forEach(b,function(e,t){console.log(" Notch to delete (id): "+e.id),
delete u[e.id]}),b={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(e,t){delete c[e.id]}),svgTextToDelete={}),l[t.id]=t,c[a.id]=a,u[o.id]=o}function w(){for(var e="xNotch",t=s.properties.paddingXLeft,a=s.properties.notchYWidth,o=u.beginNotchX,n=s.properties.mainHeight-s.properties.paddingYBottom,r=s.properties.notchXStep,i=0;i<25&&o<t+d;i++){var l={id:e+i,x1:o,y1:n,x2:o,y2:n+a,col:"#1f1f1f",width:1},p=(String.toString(u.lastNotchValue),{id:e+i,text:u.lastNotchValue+i*r,x:o,y:n+a+L,col:"#F44336"});u[l.id]=l,delete b[l.id],o+=s.properties.updateXStep,c[p.id]=p,delete svgTextToDelete[p.id]}}function E(){function e(e,a,o,n){_.forEach(t,function(t,r){var i=_.floor(n/t);if(i>0&&f*t>20)for(var d=1;d<i+1;d++){var l=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f)-o*f*t*d,p={id:t+a+d,x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:l,x2:s.properties.paddingXLeft,y2:l,col:"#1f1f1f",width:1},g=e+t*d,m={id:t+a+d,text:g,x:s.properties.paddingXLeft-s.properties.notchXWidth-A*g.length,y:l-1,col:"#F44336"};u[p.id]=p,delete b[p.id],c[m.id]=m,delete svgTextToDelete[m.id]}})}var t=[5,25,50,100,500,1e3],a="aboveNotchX",o="underNotchX";e("+",a,1,g),e("-",o,-1,Math.abs(h))}function C(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))}},getText:function(){return{text:"0",x:s.properties.paddingXLeft-A-s.properties.notchXWidth,y:s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f),col:"#F44336"}},getNotch:function(){var e=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f);return{id:"0xaxis",x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:e,x2:s.properties.paddingXLeft,y2:e,col:"#1f1f1f",width:1}}}}function D(){var e={id:"rim",color:"#4E342E",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)};l[e.id]=e}var T=0,U=0;U=a(),o(),n(),r(),m(),v(),D(),S();var b={}}function o(){return l}function n(){return c}function r(){return u}var i,d,s,l={},c={},u={},p={},f=1,g=1,h=0,m=[],v=[],M="aprox",S=0,A=8,L=14;return{makeStep:a,getGraph:o,getText:n,getNotch:r,init:t}}]);var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,t){function a(a){var n=t.defer();o=a;var r=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function t(t){e.close(t)}this.datamessage=o,console.log("  dataString   "+o),this.submit=function(){t(o)}},controllerAs:"vm"});return r.result.then(function(e){n.resolve(e)},function(e){console.log("Modal window: "+e),n.reject(e)}),n.promise}var o="";return{openModal:a}}]);var loadMaskModule=angular.module("LoadMaskModule",[]),ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(e,t,a,o){e.close=function(e){o.close()}}]);var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Root"),r.value?(i.info("User session is valid. Available to show dashboard."),o.go("root.main.dashboard")):(i.info("User session isn't valid. Redirect to loginpage."),o.go("root.login")),e.getAvailableLanguages().then(function(e){d.languages=e,d.selectedLanguage=t.DEFAULT_LANG},function(e){i.warn("Error while download languages. Set to use default: "+t.DEFAULT_LANG),d.languages={1:{code:t.DEFAULT_LANG,name:t.DEFAULT_LANG_NAME}},d.selectedLanguage=t.DEFAULT_LANG}),d.translate=function(){i.info("User select language: "+d.selectedLanguage),a.use(d.selectedLanguage)}}]);var appDecorators=angular.module("appDecorators",[]),appDirectives=angular.module("appDirectives",[]),appProviders=angular.module("appProviders",[]),appServices=angular.module("appServices",[]);loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(e,t,a,o){}}}]),loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(e){function t(){e.removeClass("myloadmask","hidden")}function a(){e.addClass("myloadmask","hidden")}return{activateLoadMask:t,deactivateLoadMask:a}}]),ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(e,t){function a(a){if(!o){o=!0;var n=!0,r=t.$new(n);r.errortype="errormodalwindow.message."+a;var i=e.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:r});i.result.then(function(){o=!1,r.$destroy()},function(e){console.log("Modal window error: "+e),o=!1})}}var o=!1;return{showModal:a}}]),rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,t,a){function o(){var a=t.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),a.resolve(e.data)},function(e){console.log(" load languages.json error."),a.reject(e)}),a.promise}return{getAvailableLanguages:o}}]),app.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),app.config(["$provide",function(e){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},a=function(e,t){var a=new String(e);for(var o in t)a=a.replace("{"+o+"}",t[o]);return a};e.decorator("$log",["$delegate",function(e){function o(){var e=new Date,t=String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds());return t}function n(){var e=new Date,a=e.getDate(),o=e.getMonth()+1;a=a<10?new String("0"+a):new String(a),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var n=new String(a+"-"+monthStr+"-"+e.getFullYear());return n}function r(e,t){function r(e,t,r){return function(){var e=String(o()+" "+n()),i=arguments[0]?new String(arguments[0]):"";r=r?r:"",console[t](a("{0} - {1} {2} ",[e,r,i]))}}return e.log=r(e,"log",t),e.info=r(e,"info",t),e.warn=r(e,"warn",t),e.debug=r(e,"debug",t),e.error=r(e,"error",t),e}return e.getInstance=function(t){t=void 0!==t?t:"",e=r(e,t)},e}])}]),appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.agevalidator(o);return n?(i.$setValidity("ageFormat",!0),t.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("ageFormat",!1),t.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.datevalidator(o);return n?(i.$setValidity("dateFormat",!0),t.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("dateFormat",!1),t.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(e,t,a){return{require:"ngModel",link:function(o,n,r,i){function d(o){var n=e.namevalidator(o);return n?(i.$setValidity("nameFormat",!0),t.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),o):(i.$setValidity("nameFormat",!1),t.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),t.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(d)}}}]),appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}}),appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,t,a,o){function n(e,a){var n=t.defer();return o.login(e,a).then(function(e){access=!0,n.resolve(e)},function(e){n.reject(!1)}),n.promise}function r(){var a=t.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){d=e.data,console.log("Session is valid."),a.resolve(e.data)},function(e){d=null,console.log("Session not valid."),a.reject(e)}),a.promise}function i(){var e=t.defer();return a.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(a.getUserCredits())):r().then(function(t){console.log("provide userCredits from post request"),a.setUserCredits(t),e.resolve(t)},function(t){console.log("Cann't get user credits details."),a.setUserCredits(null),e.reject(t)}),e.promise}var d;return{checkCredentials:n,checkSession:r,getUserCredits:i}}]),appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,t){angular.element(document.querySelector("."+e)).addClass(t)},removeClass:function(e,t){angular.element(document.querySelector("."+e)).removeClass(t)}}}]),appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]),appServices.factory("monthesStorage",["$http","$q",function(e,t){function a(){var a=t.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){a.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),a.reject("Cann't receive date.json file.")}),a.promise}function o(){return void 0!==r?r:void i.then(function(e){return console.log(" Loading monthes from server."),r=e},function(e){r=void 0,console.log("Error in downloading monthes. "+e)})}function n(e){return e%4===0&&(e%100!==0||e%400===0)}var r,i=a();return{getMonthes:o,checkLeapYear:n}}]),appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(t){console.log("set credits in storage: "+e),e=t},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}}),appServices.factory("userDataStorage",function(){var e={};return{setUserData:function(t,a){e[a]=t},getByKeyUserData:function(t){return e[t]},getAllUserData:function(){return e},removeAll:function(){e=null,e={}}}}),appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(){var o=t.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,o.resolve(n)},function(e){console.log("error. unauthorised ? "),a.setUserCredits(null),o.reject(e.data)}),o.promise}var n=null;return{getUserDetails:o}}]),appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(e,t){var a,o=e.NAME_VALIDATOR.NAME_REGEX,n=e.AGE_VALIDATOR.MIN_AGE,r=e.AGE_VALIDATOR.MAX_AGE,i=e.AGE_VALIDATOR.AGE_REGEX,d=e.DATE_VALIDATOR.DATE_REGEX,s=e.DATE_VALIDATOR.SEPARATOR,l=e.DATE_VALIDATOR.MIN_YEAR,c=e.DATE_VALIDATOR.MAX_YEAR,u=e.DATE_VALIDATOR.FEBRUARY_NUMBER,p=e.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,f=e.DATE_VALIDATOR.NUMBER_YEAR,g=e.DATE_VALIDATOR.NUMBER_MONTH,h=e.DATE_VALIDATOR.NUMBER_DAY,m=null,v=0;return{namevalidator:function(e){var t=!1;return t=!!o.test(e)},agevalidator:function(e){var t=!1;return t=!!(e<=r&&e>=n&&i.test(e))},datevalidator:function(e){var o=!1;return a=t.getMonthes(),d.test(e)?(m=e.split(s),m[f]>l&&m[f]<c?(v=m[g]===u&&t.checkLeapYear(m[f])?p:a[m[g]].days,o=m[h]<=v&&m[h]>0):o=!1):o=!1,o}}}]);var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,t,a,o,n){n.getInstance("CheckSession"),a.getUserCredits().then(function(t){n.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(t){n.info("User session isn't valid. Redirect to loginpage."),o.showModal("type2"),e.go("root.login")})}]);var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;i.getInstance("Login"),r.activateLoadMask(),a.getUserCredits().then(function(e){var a=e.admin;i.info("User check session success."),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!a})},function(e){i.warn("User check session fail."),r.deactivateLoadMask(),t.go("root.login")}),d.submit=function(){var e=d.login,s=d.password;null!==e&&void 0!==e&&""!==e&&null!==s&&void 0!==s&&""!==s?(d.password=null,r.activateLoadMask(),a.checkCredentials(e,s).then(function(a){i.info("User login success.");var n=a.admin;o.setUserCredits({login:e,admin:!!n}),r.deactivateLoadMask(),t.go("root.main.dashboard",{admin:!!n})},function(e){i.warn("User login fail."),r.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,r.deactivateLoadMask(),n.showModal("type1"))}}]);var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){var d=this;d.isFeedback=!d.isAdmin,a.getUserCredits().then(function(e){d.login=e.login,d.isAdmin=e.admin,d.isFeedback=!d.isAdmin},function(t){e.go("root.login")}),d.logout=function(){r.activateLoadMask(),t.removeAll(),o.logout().then(function(t){i.info("User logout success."),r.deactivateLoadMask(),e.go("root.login")},function(e){i.warn("User logout fail."),r.deactivateLoadMask(),n.showModal("type3")})},d.go=function(t){i.info("User change state to :"+t),e.go(t)}}]),loginModule.service("loginService",["$q","$http",function(e,t){function a(a,o){var n=e.defer();return t({method:"POST",url:"/app/login",data:{login:a,password:o}}).then(function(e){n.resolve(e.data)},function(e){n.reject(!1)}),n.promise}e.defer();return{login:a}}]),tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,t,a,o){function n(){o.removeAll();var n=t.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),a.setUserCredits(null),n.resolve(e.data)},function(e){console.log("Error while logout."),n.reject(e)}),n.promise}return{logout:n}}]);var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n,r,i){function d(){r.activateLoadMask(),e.getDetails().then(function(e){i.info("Users data was loaded."),s.alldetails=e,l=e,r.deactivateLoadMask()},function(){r.deactivateLoadMask(),i.warn("Users data loading error."),n.showModal("type10")})}var s=this,l=null;i.getInstance("Admin"),d(),s.adduser=function(a,o,s,l,c){var u=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});u.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.addUser(t.login,t.password,t.name,t.age,t.date).then(function(){i.info("New user '"+t.login+"' was added."),r.deactivateLoadMask(),d()},function(){i.warn("User '"+t.login+"' creation error."),r.deactivateLoadMask(),n.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},s.update=function(a){var s=(o.getUserCredits().admin,t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return l[a]}}}));s.result.then(function(t){_.isEmpty(t)||(r.activateLoadMask(),e.updateUser(t.login,t.password,t.name,t.age,t.date,a).then(function(){i.info("Update user. Submited data: "+JSON.stringify(t)),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be updated."),r.deactivateLoadMask(),n.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},s["delete"]=function(a){var o=t.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return a}}});o.result.then(function(t){t.deleteFlag&&(r.activateLoadMask(),e.deleteUser(a).then(function(){i.info("User was deleted."),r.deactivateLoadMask(),d()},function(){i.warn("User cann't be deleted."),r.deactivateLoadMask(),n.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(e,t,a,o,n,r,i){function d(){angular.isDefined(h)&&(a.cancel(h),h=void 0)}function s(){i.deactivateLoadMask(),h=a(function(){l.chartOptions.properties=u,_.forEach(g,function(e,a){m[a]||(m[a]={},m[a].id=a,m[a].data=[],m[a].color=e.color,m[a].aproximatecolor=e.aproximatecolor,v[a]={},v[a].iswaitingload=!1,v[a].updateStep=0),v[a].iswaitingload||(v[a].updateStep=0,v[a].iswaitingload=!0,r.loadData(e.stream).then(function(e){v[a].updateStep=e.data.length,m[a].data=_.concat(m[a].data,e.data),v[a].iswaitingload=!1,l.chartOptions.streams[a]=m[a]},function(e){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+e)}))});var e=0;_.forEach(g,function(t,a){m[a].data.length>e&&(e=m[a].data.length),v[a].updateStep>M&&(M=v[a].updateStep)});var a=e-p;a>0&&_.forEach(g,function(e,t){m[t].data.splice(0,a)}),o.setUserData(m,"chartData"),o.setUserData(m,"chartDataProperties"),o.setUserData(u,"chartProperties"),l.chartOptions={streams:m,streamsProperties:v,properties:u}},f)}var l=this,c={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},u={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},p=u.mainWidth,f=u.updateTimeout,g={};_.forEach(c,function(e,t){g[t]={id:t,stream:e.stream,color:e.color,aproximatecolor:e.aproximatecolor}});var h,m={},v={},M=0;if(e.$on("$destroy",function(){d()}),_.isEmpty(m)){var S=o.getByKeyUserData("chartData");void 0!==S&&(m=_.cloneDeep(S),v=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),u=_.cloneDeep(o.getByKeyUserData("chartProperties"))),l.chartOptions={streams:m,streamsProperties:v,properties:u}}s()}]);var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,t,a,o,n,r){var i=this;o.getInstance("Feedback"),i.sendemail=function(){var e={from:i.name,to:i.email,content:i.textarea},d='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';r.openModal(d).then(function(e){a.activateLoadMask();var r={from:i.name,to:i.email,content:i.textarea},d=r.to.split(",");n.setContent(r.content),n.sendFromDecorator(r.from,d).then(function(e){a.deactivateLoadMask(),o.info("Feedback is sent."),i.name="",i.email="",i.textarea=""},function(e){a.deactivateLoadMask(),o.warn("Feedback cann't be sent."),t.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(e,t,a,o,n){var r=this;n.getInstance("Tab one"),o.activateLoadMask(),t.getUserDetails().then(function(e){n.info("User data was downloaded."),r.userdetails=e,o.deactivateLoadMask()},function(t){n.warn("Error while downloading user data."),o.deactivateLoadMask(),a.showModal("type2"),e.go("root.login")})}]);var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,t,a,o,n,r,i,d){var s=this;d.getInstance("Tab two"),r.getMonthes(),i.activateLoadMask(),t.getUserDetails().then(function(e){d.info("User data was downloaded."),s.userdetails=e,s.newusername=e.name,s.newuserage=e.age,s.newuserdate=e.date,i.deactivateLoadMask()},function(t){d.warn("Error while downloading user data."),i.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),s.submit=function(){if(i.activateLoadMask(),n.namevalidator(s.newusername)&&n.agevalidator(s.newuserage)&&n.datevalidator(s.newuserdate)){var t={newusername:s.newusername,newuserage:s.newuserage,newuserdate:s.newuserdate};a.updateUserDetails(t).then(function(t){d.info("User data was updated."),i.deactivateLoadMask(),e.go("^.tab1")},function(e){d.warn("User data cann't be updated."),i.deactivateLoadMask(),o.showModal("type4")})}else i.deactivateLoadMask(),d.warn("Entered data is not valid."),o.showModal("type4")}}]),adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,t){function a(a){var o=t.defer();return e.deleteUser(a).then(function(e){o.resolve()},function(){o.reject()}),o.promise}function o(a,o,n,r,i,d){var s=t.defer();return e.updateUser(a,o,n,r,i,d).then(function(e){s.resolve()},function(){s.reject()}),s.promise}function n(){var a=t.defer();return e.getAllUsersDetails().then(function(e){r={},_.forEach(e.usercredits,function(t,a){r[a]={},r[a].login=a,r[a].password=t.password,r[a].name=e.userdata[a].name,r[a].age=e.userdata[a].age,r[a].date=e.userdata[a].date}),a.resolve(r)},function(e){console.log("Cann't load details to all users."),r={},a.reject(r)}),a.promise}var r={};return{getDetails:n,updateUser:o,deleteUser:a,addUser:o}}]),adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,a){function o(a){var o=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:a}}).then(function(e){o.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),o.reject(e.status)}),o.promise}function n(a,o,n,r,i,d){var s=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:a,password:o,name:n,age:r,date:i,oldlogin:d}}).then(function(e){s.resolve()},function(e){console.log("Action is forbidden."),s.reject()}),s.promise}function r(){var o=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){i=e.data,o.resolve(i)},function(e){console.log("Action is forbidden."),a.setUserCredits(null),o.reject(e.data)}),o.promise}var i=null;return{getAllUsersDetails:r,updateUser:n,deleteUser:o}}]),dashboardModule.factory("loadChartDataService",["$http","$q",function(e,t){return{loadData:function(a){var o=t.defer(),n=a.toString(a);return e({method:"POST",url:n}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}}}]),feedbackModule.config(["$provide",function(e){e.decorator("feedbackService",["$delegate","$http","$q",function(e,t,a){return e.data={from:"",to:[""],content:"",signature:""},e.setContent=function(t){e.data.content=t,console.log(" Content in decorator "+t)},e.setFrom=function(t){e.data.from=t},e.setTo=function(t){e.data.to=t},e.setSignature=function(t){e.data.signature=t},e.sendFromDecorator=function(o,n,r){function i(e,o,n,r){var d=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:o,to:n[e],content:r}}).then(function(e){d.resolve(e)},function(t){e+1<n.length?i(e+1,o,n,r).then(function(e){d.resolve(e)},function(e){d.reject(e)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:e.data.from,n?n:e.data.to,e.data.content),s=(r?r:e.data.signature,a.defer()),l=0;return i(l,o,n,d).then(function(e){s.resolve(e.data)},function(e){s.reject(e)}),s.promise},e}])}]),feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,a){function o(e,o,n){var r=a.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:n}}).then(function(e){r.resolve(e.data)},function(e){r.reject(e)}),r.promise}return{sendFeedback:o}}]),tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function a(a){var o=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:a}).then(function(e){o.resolve(e.data)},function(e){o.reject(e)}),o.promise}return{updateUserDetails:a}}]);var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,t,a){function o(e){t.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};o(e)},this.cansel=function(){o({})}}]);var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,t,a,o){function n(e){a.close({deleteFlag:e})}var r=!1;this.userLoginDelete=o,this.submit=function(){r=!0,n(r)},this.cansel=function(){n(r)}}]);var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,t,a,o){function n(e){t.close(e)}this.userdetails=_.clone(a),this.logindisabled=!1,String(o.getUserCredits().login)===a.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};n(e)},this.cansel=function(){n({})}}]);var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(e,t,a,o){var n=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var r={},i={},d=!1,s=e.$watch(function(){return n.chartOptions.streams},function(e,t){d=!1,_.isEmpty(r)&&(_.isEmpty(n.chartOptions.streams)||(_.forEach(n.chartOptions.streams,function(e,t){r[t]={id:t,color:e.color,aproximatecolor:e.aproximatecolor}}),o.init(r,n.chartOptions))),_.forEach(r,function(e,t){i[t]||(i[t]={},i[t].id=t,i[t].color=e.color,i[t].data={}),n.chartOptions.streamsProperties[t].updateStep>0&&(d=!0)}),d&&o.makeStep(i,n.chartOptions),n.graphs=o.getGraph(),n.svgtexts=o.getText(),n.notches=o.getNotch()},!0);e.$on("$destroy",function(){s()})}]),diagramModule.factory("ChartHelperService",[function(){function e(){return++S}function t(e,t){p=e,s=t,_.isEmpty(s.streams)?console.log(" - object 'chartOptions.streams' is empty"):(i=s.properties.mainHeight-(s.properties.paddingYTop+s.properties.paddingYBottom),d=s.properties.mainWidth-(s.properties.paddingXLeft+s.properties.paddingXRight),_.forEach(s.streams,function(e,t){_.indexOf(m,e.id)<0&&(m.push(e.id),v.push(e.id),l[t]||(l[t]={},l[t].id=e.id,l[t].color=e.color,l[t].aproximatecolor=e.aproximatecolor,l[t].data={},l[t].pointstodraw="",l[t].lastXValue=0,u.lastNotchValue=s.properties.notchXStartValue,u.beginNotchX=s.properties.paddingXLeft))}))}function a(t){function a(){return _.forEach(p,function(e,t){l[t].lastXValue>U&&(U=l[t].lastXValue)}),U}function o(){var e=[];if(U>d){T=U-d;var t=u.beginNotchX+(s.properties.updateXStep-T);u.beginNotchX=t,u.lastNotchValue+=s.properties.notchXStep,_.forEach(p,function(t,a){var o=l[a].lastXValue-T;l[a].lastXValue=o<0?0:o;var n=s.properties.paddingXLeft;_.forEach(l[a].data,function(t,o){for(var r=!0,i=-1,d=0;d<t.dataY.length;d++)t.pointX[d]-=T,l[M+a].data[o].pointX[d]-=T,t.pointX[d]<=n&&(i=d),t.pointX[d]>n&&(r=!1);r?e.push(o):i>=0&&(t.dataY=_.drop(t.dataY,1+i),t.pointX=_.drop(t.pointX,1+i),t.pointY=_.drop(t.pointY,1+i),t.points=_.drop(t.points,1+i),t.stepPointsAmount-=i,l[M+a].data[o].dataY=_.drop(l[M+a].data[o].dataY,1+i),l[M+a].data[o].pointX=_.drop(l[M+a].data[o].pointX,1+i),l[M+a].data[o].pointY=_.drop(l[M+a].data[o].pointY,1+i),l[M+a].data[o].points=_.drop(l[M+a].data[o].points,1+i))}),_.forEach(e,function(e){delete l[a].data[e],delete l[M+a].data[e]}),e=[]})}}function n(){_.forEach(p,function(t,a){var o=_.clone(s.streamsProperties[a].updateStep);if(o>0&&(l[a].lastXValue+=s.properties.updateXStep,s.streamsProperties[a].updateStep=0,o>0)){var n=e();l[a].data[n]={};var r=_.takeRight(s.streams[a].data,o);l[a].data[n].dataY=_.cloneDeep(r),l[a].data[n].pointX=[],l[a].data[n].pointY=[],l[a].data[n].points=[],l[a].data[n].stepPointsAmount=o,l[a].data[n].stepX=_.round(s.properties.updateXStep/o,3);for(var i=l[a].lastXValue-s.properties.updateXStep,d=0;d<o;d++)l[a].data[n].pointX[d]=s.properties.paddingXLeft+i+l[a].data[n].stepX*d}})}function r(){var e=0,t=0;_.forEach(p,function(a,o){_.forEach(l[a.id].data,function(a,o){_.forEach(a.dataY,function(a,o){var n=parseInt(a);e>n&&(e=n),h>n&&(h=n),t<n&&(t=n),g<n&&(g=n),h<e&&h++,g>t&&g--})})}),f=_.round(i/(g+Math.abs(h)),9)}function m(){var e=21;_.forEach(p,function(t,a){l[M+a]||(l[M+a]={},l[M+a].pointstodraw="",l[M+a].data={},l[M+a].color=p[a].aproximatecolor),_.forEach(l[a].data,function(t,o){if(!l[M+a].data[o])if(l[M+a].data[o]={},l[M+a].data[o].dataY=[],l[M+a].data[o].pointX=[],l[M+a].data[o].pointY=[],l[M+a].data[o].points=[],t.stepPointsAmount>2){var n=Math.round(e/100*t.stepPointsAmount);n<2&&(n=2);for(var r=Math.floor(n/2),d=Math.ceil(n/2),c=r;c<t.stepPointsAmount-d;c++){
for(var u,p=0,g=0,m=0,v=0,S=0,A=0,L=0,w=0-r;w<d;w++)v+=(c+w)*l[a].data[o].dataY[c+w],S+=c+w,A+=l[a].data[o].dataY[c+w],L+=(c+w)*(c+w);if(g=(n*v-S*A)/(n*L-S*S),m=(A-g*S)/n,c===r&&(l[M+a].data[o].dataY[0]=l[a].data[o].dataY[0],l[M+a].data[o].pointX[0]=l[a].data[o].pointX[0],l[M+a].data[o].pointY[0]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[0]+Math.abs(h)),u=l[M+a].data[o].pointX[0]+","+l[M+a].data[o].pointY[0],l[M+a].data[o].points.push(u),r>1))for(var E=1;E<r;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);p=_.round(g*c+m,3),isNaN(p)||(l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u));var C=t.dataY.length;if(c===C-d-1){var D=C-1;if(C-d>1)for(var E=D-d+1;E<D;E++)p=_.round(g*E+m,3),l[M+a].data[o].dataY[E]=p,l[M+a].data[o].pointX[E]=l[a].data[o].pointX[E],l[M+a].data[o].pointY[E]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[E]+Math.abs(h)),u=l[M+a].data[o].pointX[E]+","+l[M+a].data[o].pointY[E],l[M+a].data[o].points.push(u);l[M+a].data[o].dataY[D]=l[a].data[o].dataY[D],l[M+a].data[o].pointX[D]=l[a].data[o].pointX[D],l[M+a].data[o].pointY[D]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[D]+Math.abs(h)),u=l[M+a].data[o].pointX[D]+","+l[M+a].data[o].pointY[D],l[M+a].data[o].points.push(u)}}l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}else{for(var c=0;c<l[a].stepPointsAmount;c++)l[M+a].data[o].dataY[c]=p,l[M+a].data[o].pointX[c]=l[a].data[o].pointX[c],l[M+a].data[o].pointY[c]=i+s.properties.paddingYTop-f*(l[M+a].data[o].dataY[c]+Math.abs(h)),u=l[M+a].data[o].pointX[c]+","+l[M+a].data[o].pointY[c],l[M+a].data[o].points.push(u);l[M+a].pointstodraw=String(l[M+a].pointstodraw+" "+l[M+a].data[o].points.join(" "))}})})}function v(){_.forEach(p,function(e,t){l[t].pointstodraw="",l[M+t].pointstodraw="";var a=!0;_.forEach(l[t].data,function(e,o){for(var n=0;n<e.dataY.length;n++)e.pointY[n]=s.properties.paddingYTop+i-f*(l[t].data[o].dataY[n]+Math.abs(h)),e.points[n]=e.pointX[n]+","+e.pointY[n],l[M+t].data[o].pointY[n]=s.properties.paddingYTop+i-f*(l[M+t].data[o].dataY[n]+Math.abs(h)),l[M+t].data[o].points[n]=l[M+t].data[o].pointX[n]+","+l[M+t].data[o].pointY[n];a&&l[t].pointstodraw,l[t].pointstodraw=String(l[t].pointstodraw+" "+l[t].data[o].points.join(" ")),l[M+t].pointstodraw=String(l[M+t].pointstodraw+" "+l[M+t].data[o].points.join(" "))})})}function S(){var e=C(),t=e.getLine(),a=e.getText(),o=e.getNotch();b=_.cloneDeep(u),delete b.lastNotchValue,delete b.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),w(),_.isEmpty(b)||(_.forEach(b,function(e,t){console.log(" Notch to delete (id): "+e.id),delete u[e.id]}),b={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(e,t){delete c[e.id]}),svgTextToDelete={}),l[t.id]=t,c[a.id]=a,u[o.id]=o}function w(){for(var e="xNotch",t=s.properties.paddingXLeft,a=s.properties.notchYWidth,o=u.beginNotchX,n=s.properties.mainHeight-s.properties.paddingYBottom,r=s.properties.notchXStep,i=0;i<25&&o<t+d;i++){var l={id:e+i,x1:o,y1:n,x2:o,y2:n+a,col:"#1f1f1f",width:1},p=(String.toString(u.lastNotchValue),{id:e+i,text:u.lastNotchValue+i*r,x:o,y:n+a+L,col:"#F44336"});u[l.id]=l,delete b[l.id],o+=s.properties.updateXStep,c[p.id]=p,delete svgTextToDelete[p.id]}}function E(){function e(e,a,o,n){_.forEach(t,function(t,r){var i=_.floor(n/t);if(i>0&&f*t>20)for(var d=1;d<i+1;d++){var l=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f)-o*f*t*d,p={id:t+a+d,x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:l,x2:s.properties.paddingXLeft,y2:l,col:"#1f1f1f",width:1},g=e+t*d,m={id:t+a+d,text:g,x:s.properties.paddingXLeft-s.properties.notchXWidth-A*g.length,y:l-1,col:"#F44336"};u[p.id]=p,delete b[p.id],c[m.id]=m,delete svgTextToDelete[m.id]}})}var t=[5,25,50,100,500,1e3],a="aboveNotchX",o="underNotchX";e("+",a,1,g),e("-",o,-1,Math.abs(h))}function C(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f))}},getText:function(){return{text:"0",x:s.properties.paddingXLeft-A-s.properties.notchXWidth,y:s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f),col:"#F44336"}},getNotch:function(){var e=s.properties.mainHeight-s.properties.paddingYBottom-Math.abs(h*f);return{id:"0xaxis",x1:s.properties.paddingXLeft-s.properties.notchXWidth,y1:e,x2:s.properties.paddingXLeft,y2:e,col:"#1f1f1f",width:1}}}}function D(){var e={id:"rim",color:"#4E342E",data:[],pointstodraw:s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+(s.properties.mainHeight-s.properties.paddingYBottom)+" "+(s.properties.mainWidth-s.properties.paddingXRight)+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+s.properties.paddingYTop+" "+s.properties.paddingXLeft+","+(s.properties.mainHeight-s.properties.paddingYBottom)};l[e.id]=e}var T=0,U=0;U=a(),o(),n(),r(),m(),v(),D(),S();var b={}}function o(){return l}function n(){return c}function r(){return u}var i,d,s,l={},c={},u={},p={},f=1,g=1,h=0,m=[],v=[],M="aprox",S=0,A=8,L=14;return{makeStep:a,getGraph:o,getText:n,getNotch:r,init:t}}]),diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(e,t,a,o){a.chartAllPoints}}}]);var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,t){function a(a){var n=t.defer();o=a;var r=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function t(t){e.close(t)}this.datamessage=o,console.log("  dataString   "+o),this.submit=function(){t(o)}},controllerAs:"vm"});return r.result.then(function(e){n.resolve(e)},function(e){console.log("Modal window: "+e),n.reject(e)}),n.promise}var o="";return{openModal:a}}]);
var loadMaskModule=angular.module("LoadMaskModule",[]);
var ModalModule=angular.module("ModalModule",[]);ModalModule.controller("ModalController",["$scope","$translate","myModalWindowService","$uibModalInstance",function(o,l,e,a){o.close=function(o){a.close()}}]);
var rootModule=angular.module("RootModule",["LoginModule","CheckSessionModule","TabSwitcherModule","ModalModule","LoadMaskModule"]);rootModule.controller("RootController",["languagesStorage","LANG","$translate","$state","myModalWindowService","authenticated","$log",function(e,o,a,n,l,t,s){var g=this;s.getInstance("Root"),t.value?(s.info("User session is valid. Available to show dashboard."),n.go("root.main.dashboard")):(s.info("User session isn't valid. Redirect to loginpage."),n.go("root.login")),e.getAvailableLanguages().then(function(e){g.languages=e,g.selectedLanguage=o.DEFAULT_LANG},function(e){s.warn("Error while download languages. Set to use default: "+o.DEFAULT_LANG),g.languages={1:{code:o.DEFAULT_LANG,name:o.DEFAULT_LANG_NAME}},g.selectedLanguage=o.DEFAULT_LANG}),g.translate=function(){s.info("User select language: "+g.selectedLanguage),a.use(g.selectedLanguage)}}]);
"use strict";var appDecorators=angular.module("appDecorators",[]);
"use strict";var appDirectives=angular.module("appDirectives",[]);
"use strict";var appProviders=angular.module("appProviders",[]);
"use strict";var appServices=angular.module("appServices",[]);
loadMaskModule.directive("loadmask",[function(){return{restrict:"E",templateUrl:"app/loadmask/loadmask.html",controller:function(){console.log(" Load mask is shown.")},link:function(o,l,a,n){}}}]);
loadMaskModule.factory("LoadMaskService",["htmlClassModifierService",function(a){function d(){a.removeClass("myloadmask","hidden")}function e(){a.addClass("myloadmask","hidden")}return{activateLoadMask:d,deactivateLoadMask:e}}]);
ModalModule.factory("myModalWindowService",["$uibModal","$rootScope",function(o,r){function e(e){if(!l){l=!0;var n=!0,a=r.$new(n);a.errortype="errormodalwindow.message."+e;var t=o.open({animation:!0,size:"sm",templateUrl:"/app/modal/modal.html",controller:"ModalController",scope:a});t.result.then(function(){l=!1,a.$destroy()},function(o){console.log("Modal window error: "+o),l=!1})}}var l=!1;return{showModal:e}}]);
rootModule.factory("languagesStorage",["$http","$q","LANG",function(e,o,n){function a(){var n=o.defer();return e({method:"GET",url:"/lang/languages.json"}).then(function(e){console.log(" load languages.json success."),n.resolve(e.data)},function(e){console.log(" load languages.json error."),n.reject(e)}),n.promise}return{getAvailableLanguages:a}}]);
app.config(["$provide",function(t){t.decorator("feedbackService",["$delegate","$http","$q",function(t,n,e){return t.data={from:"",to:[""],content:"",signature:""},t.setContent=function(n){t.data.content=n,console.log(" Content in decorator "+n)},t.setFrom=function(n){t.data.from=n},t.setTo=function(n){t.data.to=n},t.setSignature=function(n){t.data.signature=n},t.sendFromDecorator=function(o,a,r){function c(t,o,a,r){var i=e.defer();return n({method:"POST",url:"/app/feedback/send",data:{from:o,to:a[t],content:r}}).then(function(t){i.resolve(t)},function(n){t+1<a.length?c(t+1,o,a,r).then(function(t){i.resolve(t)},function(t){i.reject(t)}):i.reject("Cann't send email")}),i.promise}var i=(o?o:t.data.from,a?a:t.data.to,t.data.content),d=(r?r:t.data.signature,e.defer()),f=0;return c(f,o,a,i).then(function(t){d.resolve(t.data)},function(t){d.reject(t)}),d.promise},t}])}]);
app.config(["$provide",function(r){var t={"01":{"short":"JAN"},"02":{"short":"FEB"},"03":{"short":"MAR"},"04":{"short":"APR"},"05":{"short":"MAY"},"06":{"short":"JUN"},"07":{"short":"JUL"},"08":{"short":"AUG"},"09":{"short":"SEP"},10:{"short":"OCT"},11:{"short":"NOV"},12:{"short":"DEC"}},n=function(r,t){var n=new String(r);for(var o in t)n=n.replace("{"+o+"}",t[o]);return n};r.decorator("$log",["$delegate",function(r){function o(){var r=new Date,t=String(r.getHours()+":"+r.getMinutes()+":"+r.getSeconds()+":"+r.getMilliseconds());return t}function e(){var r=new Date,n=r.getDate(),o=r.getMonth()+1;n=n<10?new String("0"+n):new String(n),monthStr=o<10?t[new String("0"+o)]["short"]:t[new String(o)]["short"];var e=new String(n+"-"+monthStr+"-"+r.getFullYear());return e}function i(r,t){function i(r,t,i){return function(){var r=String(o()+" "+e()),g=arguments[0]?new String(arguments[0]):"";i=i?i:"",console[t](n("{0} - {1} {2} ",[r,i,g]))}}return r.log=i(r,"log",t),r.info=i(r,"info",t),r.warn=i(r,"warn",t),r.debug=i(r,"debug",t),r.error=i(r,"error",t),r}return r.getInstance=function(t){t=void 0!==t?t:"",r=i(r,t)},r}])}]);
appDirectives.directive("myagevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,i){function R(L){var _=A.agevalidator(L);return _?(i.$setValidity("ageFormat",!0),e.removeClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(i.$setValidity("ageFormat",!1),e.addClass(a.AGE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.AGE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(R)}}}]);
appDirectives.directive("mydatevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,t){function i(L){var _=A.datevalidator(L);return _?(t.$setValidity("dateFormat",!0),e.removeClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(t.$setValidity("dateFormat",!1),e.addClass(a.DATE_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.DATE_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}t.$parsers.push(i)}}}]);
appDirectives.directive("mynamevalidator",["validatorsService","htmlClassModifierService","VALIDATORS",function(A,e,a){return{require:"ngModel",link:function(L,_,r,i){function R(L){var _=A.namevalidator(L);return _?(i.$setValidity("nameFormat",!0),e.removeClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.removeClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),L):(i.$setValidity("nameFormat",!1),e.addClass(a.NAME_VALIDATOR.FORM_CLASS,a.ERROR_INPUT_CLASS_NAME),e.addClass(a.NAME_VALIDATOR.TABLE_CELL_CLASS,a.ERROR_CELL_CLASS_NAME),"")}i.$parsers.push(R)}}}]);
appProviders.provider("log",function(){var e=new Date,t=(e.getTime(),String(e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+":"+e.getMilliseconds()));this.getTimeCreation=function(){return t},this.getTimeCreationMillis=function(){return currentTime},this.$get=function(){return new log}});
appServices.factory("checkCredentialsServise",["$http","$q","userCreditsStorage","loginService",function(e,r,s,t){function o(e,s){var o=r.defer();return t.login(e,s).then(function(e){access=!0,o.resolve(e)},function(e){o.reject(!1)}),o.promise}function n(){var s=r.defer();return e({method:"POST",url:"/app/checksession"}).then(function(e){c=e.data,console.log("Session is valid."),s.resolve(e.data)},function(e){c=null,console.log("Session not valid."),s.reject(e)}),s.promise}function i(){var e=r.defer();return s.getUserCredits()?(console.log("provide userCredits from storage"),e.resolve(s.getUserCredits())):n().then(function(r){console.log("provide userCredits from post request"),s.setUserCredits(r),e.resolve(r)},function(r){console.log("Cann't get user credits details."),s.setUserCredits(null),e.reject(r)}),e.promise}var c;return{checkCredentials:o,checkSession:n,getUserCredits:i}}]);
appServices.factory("htmlClassModifierService",[function(){return{addClass:function(e,r){angular.element(document.querySelector("."+e)).addClass(r)},removeClass:function(e,r){angular.element(document.querySelector("."+e)).removeClass(r)}}}]);
appServices.factory("myInterceptor",[function(){var e={request:function(e){return e.requestTimePoint=(new Date).getTime(),e},response:function(e){return e.config.responseTimePoint=(new Date).getTime(),"post"===String(e.config.method).toLowerCase()&&console.log(" - request-response time: "+(e.config.responseTimePoint-e.config.requestTimePoint)+" ms.  URl: "+e.config.url),e}};return e}]);
appServices.factory("monthesStorage",["$http","$q",function(e,n){function o(){var o=n.defer();return e({method:"GET",url:"/app/public/date.json"}).then(function(e){o.resolve(e.data)},function(e){console.log(" Cann't receive date.json file."),o.reject("Cann't receive date.json file.")}),o.promise}function t(){return void 0!==i?i:void c.then(function(e){return console.log(" Loading monthes from server."),i=e},function(e){i=void 0,console.log("Error in downloading monthes. "+e)})}function r(e){return e%4===0&&(e%100!==0||e%400===0)}var i,c=o();return{getMonthes:t,checkLeapYear:r}}]);
appServices.factory("userCreditsStorage",function(){var e=null;return{setUserCredits:function(r){console.log("set credits in storage: "+e),e=r},getUserCredits:function(){return console.log("get credits from storage: "+e),e}}});
appServices.factory("userDataStorage",function(){var t={};return{setUserData:function(e,r){t[r]=e},getByKeyUserData:function(e){return t[e]},getAllUserData:function(){return t},removeAll:function(){t=null,t={}}}});
appServices.factory("userDetailsService",["$http","$q","userCreditsStorage",function(e,r,t){function s(){var s=r.defer();return e({method:"POST",url:"/app/userdetails"}).then(function(e){n=e.data,s.resolve(n)},function(e){console.log("error. unauthorised ? "),t.setUserCredits(null),s.reject(e.data)}),s.promise}var n=null;return{getUserDetails:s}}]);
appServices.factory("validatorsService",["VALIDATORS","monthesStorage",function(A,E){var R,D=A.NAME_VALIDATOR.NAME_REGEX,T=A.AGE_VALIDATOR.MIN_AGE,_=A.AGE_VALIDATOR.MAX_AGE,t=A.AGE_VALIDATOR.AGE_REGEX,a=A.DATE_VALIDATOR.DATE_REGEX,e=A.DATE_VALIDATOR.SEPARATOR,r=A.DATE_VALIDATOR.MIN_YEAR,n=A.DATE_VALIDATOR.MAX_YEAR,I=A.DATE_VALIDATOR.FEBRUARY_NUMBER,L=A.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS,O=A.DATE_VALIDATOR.NUMBER_YEAR,V=A.DATE_VALIDATOR.NUMBER_MONTH,o=A.DATE_VALIDATOR.NUMBER_DAY,M=null,i=0;return{namevalidator:function(A){var E=!1;return E=!!D.test(A)},agevalidator:function(A){var E=!1;return E=!!(A<=_&&A>=T&&t.test(A))},datevalidator:function(A){var D=!1;return R=E.getMonthes(),a.test(A)?(M=A.split(e),M[O]>r&&M[O]<n?(i=M[V]===I&&E.checkLeapYear(M[O])?L:R[M[V]].days,D=M[o]<=i&&M[o]>0):D=!1):D=!1,D}}}]);
var checkSessionModule=angular.module("CheckSessionModule",[]);checkSessionModule.controller("CheckSessionController",["$state","$scope","checkCredentialsServise","myModalWindowService","$log",function(e,o,s,n,i){i.getInstance("CheckSession"),s.getUserCredits().then(function(o){i.info("User session is valid. Available to show dashboard."),e.go("root.main.dashboard")},function(o){i.info("User session isn't valid. Redirect to loginpage."),n.showModal("type2"),e.go("root.login")})}]);
var loginModule=angular.module("LoginModule",[]);loginModule.controller("LoginController",["$scope","$state","checkCredentialsServise","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(a,o,e,i,n,s,t){var d=this;t.getInstance("Login"),s.activateLoadMask(),e.getUserCredits().then(function(a){var e=a.admin;t.info("User check session success."),s.deactivateLoadMask(),o.go("root.main.dashboard",{admin:!!e})},function(a){t.warn("User check session fail."),s.deactivateLoadMask(),o.go("root.login")}),d.submit=function(){var a=d.login,r=d.password;null!==a&&void 0!==a&&""!==a&&null!==r&&void 0!==r&&""!==r?(d.password=null,s.activateLoadMask(),e.checkCredentials(a,r).then(function(e){t.info("User login success.");var n=e.admin;i.setUserCredits({login:a,admin:!!n}),s.deactivateLoadMask(),o.go("root.main.dashboard",{admin:!!n})},function(a){t.warn("User login fail."),s.deactivateLoadMask(),n.showModal("type1")})):(d.password=null,s.deactivateLoadMask(),n.showModal("type1"))}}]);
var tabSwitcherModule=angular.module("TabSwitcherModule",["DashboardModule","TabOneModule","TabTwoModule","FeedbackModule","AdminModule"]);tabSwitcherModule.controller("TabSwitcherController",["$state","userDataStorage","checkCredentialsServise","logoutService","myModalWindowService","LoadMaskService","$log",function(o,e,t,a,i,n,l){var d=this;d.isFeedback=!d.isAdmin,t.getUserCredits().then(function(o){d.login=o.login,d.isAdmin=o.admin,d.isFeedback=!d.isAdmin},function(e){o.go("root.login")}),d.logout=function(){n.activateLoadMask(),e.removeAll(),a.logout().then(function(e){l.info("User logout success."),n.deactivateLoadMask(),o.go("root.login")},function(o){l.warn("User logout fail."),n.deactivateLoadMask(),i.showModal("type3")})},d.go=function(e){l.info("User change state to :"+e),o.go(e)}}]);
loginModule.service("loginService",["$q","$http",function(e,n){function o(o,r){var t=e.defer();return n({method:"POST",url:"/app/login",data:{login:o,password:r}}).then(function(e){t.resolve(e.data)},function(e){t.reject(!1)}),t.promise}e.defer();return{login:o}}]);
tabSwitcherModule.factory("logoutService",["$http","$q","userCreditsStorage","userDataStorage","userDataStorage",function(e,o,t,r){function l(){r.removeAll();var l=o.defer();return e({method:"POST",url:"/app/logout"}).then(function(e){console.log("Logout is allowed."),t.setUserCredits(null),l.resolve(e.data)},function(e){console.log("Error while logout."),l.reject(e)}),l.promise}return{logout:l}}]);
var adminModule=angular.module("AdminModule",["AdminAddUserModalModule","AdminDeleteUserModalModule","AdminUpdateUserModalModule"]);adminModule.controller("AdminController",["allUsersDetailsModel","$uibModal","$state","userCreditsStorage","myModalWindowService","LoadMaskService","$log",function(e,a,o,t,d,n,l){function s(){n.activateLoadMask(),e.getDetails().then(function(e){l.info("Users data was loaded."),i.alldetails=e,r=e,n.deactivateLoadMask()},function(){n.deactivateLoadMask(),l.warn("Users data loading error."),d.showModal("type10")})}var i=this,r=null;l.getInstance("Admin"),s(),i.adduser=function(o,t,i,r,u){var c=a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",controller:"AdminAddUserModal",controllerAs:"vm"});c.result.then(function(a){_.isEmpty(a)||(n.activateLoadMask(),e.addUser(a.login,a.password,a.name,a.age,a.date).then(function(){l.info("New user '"+a.login+"' was added."),n.deactivateLoadMask(),s()},function(){l.warn("User '"+a.login+"' creation error."),n.deactivateLoadMask(),d.showModal("type13")}))},function(e){console.log("Modal window: "+e)})},i.update=function(o){var i=(t.getUserCredits().admin,a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",controller:"AdminUpdateUserModal",controllerAs:"vm",resolve:{userDetails:function(){return r[o]}}}));i.result.then(function(a){_.isEmpty(a)||(n.activateLoadMask(),e.updateUser(a.login,a.password,a.name,a.age,a.date,o).then(function(){l.info("Update user. Submited data: "+JSON.stringify(a)),n.deactivateLoadMask(),s()},function(){l.warn("User cann't be updated."),n.deactivateLoadMask(),d.showModal("type12")}))},function(e){console.log("Modal window: "+e)})},i["delete"]=function(o){var t=a.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",controller:"AdminDeleteUserModal",controllerAs:"vm",resolve:{userLoginDelete:function(){return o}}});t.result.then(function(a){a.deleteFlag&&(n.activateLoadMask(),e.deleteUser(o).then(function(){l.info("User was deleted."),n.deactivateLoadMask(),s()},function(){l.warn("User cann't be deleted."),n.deactivateLoadMask(),d.showModal("type11")}))},function(e){console.log("Modal window: "+e)})}}]);
var dashboardModule=angular.module("DashboardModule",["DiagramModule"]);dashboardModule.controller("DashboardController",["$scope","$state","$interval","userDataStorage","userDetailsService","loadChartDataService","LoadMaskService",function(a,t,e,o,r,i,n){function c(){angular.isDefined(g)&&(e.cancel(g),g=void 0)}function s(){n.deactivateLoadMask(),g=e(function(){d.chartOptions.properties=l,_.forEach(m,function(a,e){D[e]||(D[e]={},D[e].id=e,D[e].data=[],D[e].color=a.color,D[e].aproximatecolor=a.aproximatecolor,f[e]={},f[e].iswaitingload=!1,f[e].updateStep=0),f[e].iswaitingload||(f[e].updateStep=0,f[e].iswaitingload=!0,i.loadData(a.stream).then(function(a){f[e].updateStep=a.data.length,D[e].data=_.concat(D[e].data,a.data),f[e].iswaitingload=!1,d.chartOptions.streams[e]=D[e]},function(a){t.go("root.login"),console.log("Cann't load chart data from server. Reason: "+a)}))});var a=0;_.forEach(m,function(t,e){D[e].data.length>a&&(a=D[e].data.length),f[e].updateStep>v&&(v=f[e].updateStep)});var e=a-h;e>0&&_.forEach(m,function(a,t){D[t].data.splice(0,e)}),o.setUserData(D,"chartData"),o.setUserData(D,"chartDataProperties"),o.setUserData(l,"chartProperties"),d.chartOptions={streams:D,streamsProperties:f,properties:l}},u)}var d=this,p={1:{stream:"/app/chartdata1",color:"#FFCC80",aproximatecolor:"#EF6C00"},2:{id:2,stream:"/app/chartdata2",color:"#80CBC4",aproximatecolor:"#00695C"}},l={mainWidth:480,mainHeight:400,updateTimeout:1500,updateXStep:50,paddingXLeft:40,paddingXRight:20,paddingYTop:10,paddingYBottom:40,notchXStartValue:10,notchXStep:40,notchXWidth:5,notchXName:"point",notchYWidth:5,notchYName:"point"},h=l.mainWidth,u=l.updateTimeout,m={};_.forEach(p,function(a,t){m[t]={id:t,stream:a.stream,color:a.color,aproximatecolor:a.aproximatecolor}});var g,D={},f={},v=0;if(a.$on("$destroy",function(){c()}),_.isEmpty(D)){var S=o.getByKeyUserData("chartData");void 0!==S&&(D=_.cloneDeep(S),f=_.cloneDeep(o.getByKeyUserData("chartDataProperties")),l=_.cloneDeep(o.getByKeyUserData("chartProperties"))),d.chartOptions={streams:D,streamsProperties:f,properties:l}}s()}]);
var feedbackModule=angular.module("FeedbackModule",["FeedbackModalModule"]);feedbackModule.controller("FeedbackController",["$state","myModalWindowService","LoadMaskService","$log","feedbackService","feedbackModalService",function(e,a,t,o,n,c){var d=this;o.getInstance("Feedback"),d.sendemail=function(){var e={from:d.name,to:d.email,content:d.textarea},r='From: "'+e.from+'". To: "'+e.to+'". Content: "'+e.content+'".';c.openModal(r).then(function(e){t.activateLoadMask();var c={from:d.name,to:d.email,content:d.textarea},r=c.to.split(",");n.setContent(c.content),n.sendFromDecorator(c.from,r).then(function(e){t.deactivateLoadMask(),o.info("Feedback is sent."),d.name="",d.email="",d.textarea=""},function(e){t.deactivateLoadMask(),o.warn("Feedback cann't be sent."),a.showModal("type20")})},function(e){o.log("Feedback wasn't sent. Canseled.")})}}]);
var tabOneModule=angular.module("TabOneModule",[]);tabOneModule.controller("TabOneController",["$state","userDetailsService","myModalWindowService","LoadMaskService","$log",function(a,e,o,t,n){var d=this;n.getInstance("Tab one"),t.activateLoadMask(),e.getUserDetails().then(function(a){n.info("User data was downloaded."),d.userdetails=a,t.deactivateLoadMask()},function(e){n.warn("Error while downloading user data."),t.deactivateLoadMask(),o.showModal("type2"),a.go("root.login")})}]);
var tabTwoModule=angular.module("TabTwoModule",[]);tabTwoModule.controller("TabTwoController",["$state","userDetailsService","updateUserDetailsService","myModalWindowService","validatorsService","monthesStorage","LoadMaskService","$log",function(e,a,t,o,n,d,s,r){var i=this;r.getInstance("Tab two"),d.getMonthes(),s.activateLoadMask(),a.getUserDetails().then(function(e){r.info("User data was downloaded."),i.userdetails=e,i.newusername=e.name,i.newuserage=e.age,i.newuserdate=e.date,s.deactivateLoadMask()},function(a){r.warn("Error while downloading user data."),s.deactivateLoadMask(),o.showModal("type2"),e.go("root.login")}),i.submit=function(){if(s.activateLoadMask(),n.namevalidator(i.newusername)&&n.agevalidator(i.newuserage)&&n.datevalidator(i.newuserdate)){var a={newusername:i.newusername,newuserage:i.newuserage,newuserdate:i.newuserdate};t.updateUserDetails(a).then(function(a){r.info("User data was updated."),s.deactivateLoadMask(),e.go("^.tab1")},function(e){r.warn("User data cann't be updated."),s.deactivateLoadMask(),o.showModal("type4")})}else s.deactivateLoadMask(),r.warn("Entered data is not valid."),o.showModal("type4")}}]);
adminModule.service("allUsersDetailsModel",["allUsersDetailsService","$q",function(e,r){function t(t){var n=r.defer();return e.deleteUser(t).then(function(e){n.resolve()},function(){n.reject()}),n.promise}function n(t,n,s,a,o,i){var l=r.defer();return e.updateUser(t,n,s,a,o,i).then(function(e){l.resolve()},function(){l.reject()}),l.promise}function s(){var t=r.defer();return e.getAllUsersDetails().then(function(e){a={},_.forEach(e.usercredits,function(r,t){a[t]={},a[t].login=t,a[t].password=r.password,a[t].name=e.userdata[t].name,a[t].age=e.userdata[t].age,a[t].date=e.userdata[t].date}),t.resolve(a)},function(e){console.log("Cann't load details to all users."),a={},t.reject(a)}),t.promise}var a={};return{getDetails:s,updateUser:n,deleteUser:t,addUser:n}}]);
adminModule.factory("allUsersDetailsService",["$http","$q","userCreditsStorage",function(e,t,n){function r(n){var r=t.defer();return e({method:"POST",url:"/app/admin/deleteuser",data:{userdeletelogin:n}}).then(function(e){r.resolve()},function(e){console.log("Action is forbidden. Status: "+e.status),r.reject(e.status)}),r.promise}function o(n,r,o,a,s,i){var d=t.defer();return e({method:"POST",url:"/app/admin/updateuserdata",data:{login:n,password:r,name:o,age:a,date:s,oldlogin:i}}).then(function(e){d.resolve()},function(e){console.log("Action is forbidden."),d.reject()}),d.promise}function a(){var r=t.defer();return e({method:"POST",url:"/app/admin/getusersdata"}).then(function(e){s=e.data,r.resolve(s)},function(e){console.log("Action is forbidden."),n.setUserCredits(null),r.reject(e.data)}),r.promise}var s=null;return{getAllUsersDetails:a,updateUser:o,deleteUser:r}}]);
dashboardModule.factory("loadChartDataService",["$http","$q",function(t,r){return{loadData:function(e){var a=r.defer(),o=e.toString(e);return t({method:"POST",url:o}).then(function(t){a.resolve(t.data)},function(t){a.reject(t)}),a.promise}}}]);
feedbackModule.config(["$provide",function(t){t.decorator("feedbackService",["$delegate","$http","$q",function(t,e,n){return t.data={from:"",to:[""],content:"",signature:""},t.setContent=function(e){t.data.content=e,console.log(" Content in decorator "+e)},t.setFrom=function(e){t.data.from=e},t.setTo=function(e){t.data.to=e},t.setSignature=function(e){t.data.signature=e},t.sendFromDecorator=function(o,a,r){function c(t,o,a,r){var d=n.defer();return e({method:"POST",url:"/app/feedback/send",data:{from:o,to:a[t],content:r}}).then(function(t){d.resolve(t)},function(e){t+1<a.length?c(t+1,o,a,r).then(function(t){d.resolve(t)},function(t){d.reject(t)}):d.reject("Cann't send email")}),d.promise}var d=(o?o:t.data.from,a?a:t.data.to,t.data.content),i=(r?r:t.data.signature,n.defer()),f=0;return c(f,o,a,d).then(function(t){i.resolve(t.data)},function(t){i.reject(t)}),i.promise},t}])}]);
feedbackModule.factory("feedbackService",["$uibModal","$http","$q",function(e,t,n){function o(e,o,r){var a=n.defer();return t({method:"POST",url:"/app/feedback/send",data:{from:e,to:o,content:r}}).then(function(e){a.resolve(e.data)},function(e){a.reject(e)}),a.promise}return{sendFeedback:o}}]);
tabTwoModule.factory("updateUserDetailsService",["$http","$q",function(e,t){function r(r){var a=t.defer();return e({method:"POST",url:"/app/updateuserdetails",data:r}).then(function(e){a.resolve(e.data)},function(e){a.reject(e)}),a.promise}return{updateUserDetails:r}}]);
var adminAddUserModalModule=angular.module("AdminAddUserModalModule",[]);adminAddUserModalModule.controller("AdminAddUserModal",["$translate","$uibModalInstance","userCreditsStorage",function(e,s,d){function a(e){s.close(e)}this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};a(e)},this.cansel=function(){a({})}}]);
var adminDeleteUserModalModule=angular.module("AdminDeleteUserModalModule",[]);adminDeleteUserModalModule.controller("AdminDeleteUserModal",["$scope","$translate","$uibModalInstance","userLoginDelete",function(e,l,n,o){function t(e){n.close({deleteFlag:e})}var a=!1;this.userLoginDelete=o,this.submit=function(){a=!0,t(a)},this.cansel=function(){t(a)}}]);
var adminUpdateUserModalModule=angular.module("AdminUpdateUserModalModule",[]);adminUpdateUserModalModule.controller("AdminUpdateUserModal",["$scope","$uibModalInstance","userDetails","userCreditsStorage",function(e,s,i,a){function t(e){s.close(e)}this.userdetails=_.clone(i),this.logindisabled=!1,String(a.getUserCredits().login)===i.login&&(this.logindisabled=!0),this.submit=function(){var e={login:this.userdetails.login,password:this.userdetails.password,name:this.userdetails.name,age:this.userdetails.age,date:this.userdetails.date};t(e)},this.cansel=function(){t({})}}]);
var diagramModule=angular.module("DiagramModule",[]);diagramModule.controller("DiagramController",["$scope","$state","$interval","ChartHelperService",function(t,r,a,i){var o=this;this.graphs,this.svgtext;this.mainwidth=this.chartOptions.properties.mainWidth,this.mainheight=this.chartOptions.properties.mainHeight;var e={},s={},n=!1,h=t.$watch(function(){return o.chartOptions.streams},function(t,r){n=!1,_.isEmpty(e)&&(_.isEmpty(o.chartOptions.streams)||(_.forEach(o.chartOptions.streams,function(t,r){e[r]={id:r,color:t.color,aproximatecolor:t.aproximatecolor}}),i.init(e,o.chartOptions))),_.forEach(e,function(t,r){s[r]||(s[r]={},s[r].id=r,s[r].color=t.color,s[r].data={}),o.chartOptions.streamsProperties[r].updateStep>0&&(n=!0)}),n&&i.makeStep(s,o.chartOptions),o.graphs=i.getGraph(),o.svgtexts=i.getText(),o.notches=i.getNotch()},!0);t.$on("$destroy",function(){h()})}]);
diagramModule.directive("mychart",[function(){return{restrict:"E",controller:"DiagramController",controllerAs:"chart",templateUrl:"app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html",bindToController:{chartOptions:"=chartOptions"},link:function(r,t,o,a){o.chartAllPoints}}}]);
diagramModule.factory("ChartHelperService",[function(){function t(){return++v}function a(t,a){f=t,r=a,_.isEmpty(r.streams)?console.log(" - object 'chartOptions.streams' is empty"):(d=r.properties.mainHeight-(r.properties.paddingYTop+r.properties.paddingYBottom),n=r.properties.mainWidth-(r.properties.paddingXLeft+r.properties.paddingXRight),_.forEach(r.streams,function(t,a){_.indexOf(l,t.id)<0&&(l.push(t.id),Y.push(t.id),s[a]||(s[a]={},s[a].id=t.id,s[a].color=t.color,s[a].aproximatecolor=t.aproximatecolor,s[a].data={},s[a].pointstodraw="",s[a].lastXValue=0,h.lastNotchValue=r.properties.notchXStartValue,h.beginNotchX=r.properties.paddingXLeft))}))}function o(a){function o(){return _.forEach(f,function(t,a){s[a].lastXValue>S&&(S=s[a].lastXValue)}),S}function i(){var t=[];if(S>n){w=S-n;var a=h.beginNotchX+(r.properties.updateXStep-w);h.beginNotchX=a,h.lastNotchValue+=r.properties.notchXStep,_.forEach(f,function(a,o){var i=s[o].lastXValue-w;s[o].lastXValue=i<0?0:i;var e=r.properties.paddingXLeft;_.forEach(s[o].data,function(a,i){for(var p=!0,d=-1,n=0;n<a.dataY.length;n++)a.pointX[n]-=w,s[m+o].data[i].pointX[n]-=w,a.pointX[n]<=e&&(d=n),a.pointX[n]>e&&(p=!1);p?t.push(i):d>=0&&(a.dataY=_.drop(a.dataY,1+d),a.pointX=_.drop(a.pointX,1+d),a.pointY=_.drop(a.pointY,1+d),a.points=_.drop(a.points,1+d),a.stepPointsAmount-=d,s[m+o].data[i].dataY=_.drop(s[m+o].data[i].dataY,1+d),s[m+o].data[i].pointX=_.drop(s[m+o].data[i].pointX,1+d),s[m+o].data[i].pointY=_.drop(s[m+o].data[i].pointY,1+d),s[m+o].data[i].points=_.drop(s[m+o].data[i].points,1+d))}),_.forEach(t,function(t){delete s[o].data[t],delete s[m+o].data[t]}),t=[]})}}function e(){_.forEach(f,function(a,o){var i=_.clone(r.streamsProperties[o].updateStep);if(i>0&&(s[o].lastXValue+=r.properties.updateXStep,r.streamsProperties[o].updateStep=0,i>0)){var e=t();s[o].data[e]={};var p=_.takeRight(r.streams[o].data,i);s[o].data[e].dataY=_.cloneDeep(p),s[o].data[e].pointX=[],s[o].data[e].pointY=[],s[o].data[e].points=[],s[o].data[e].stepPointsAmount=i,s[o].data[e].stepX=_.round(r.properties.updateXStep/i,3);for(var d=s[o].lastXValue-r.properties.updateXStep,n=0;n<i;n++)s[o].data[e].pointX[n]=r.properties.paddingXLeft+d+s[o].data[e].stepX*n}})}function p(){var t=0,a=0;_.forEach(f,function(o,i){_.forEach(s[o.id].data,function(o,i){_.forEach(o.dataY,function(o,i){var e=parseInt(o);t>e&&(t=e),X>e&&(X=e),a<e&&(a=e),g<e&&(g=e),X<t&&X++,g>a&&g--})})}),u=_.round(d/(g+Math.abs(X)),9)}function l(){var t=21;_.forEach(f,function(a,o){s[m+o]||(s[m+o]={},s[m+o].pointstodraw="",s[m+o].data={},s[m+o].color=f[o].aproximatecolor),_.forEach(s[o].data,function(a,i){if(!s[m+o].data[i])if(s[m+o].data[i]={},s[m+o].data[i].dataY=[],s[m+o].data[i].pointX=[],s[m+o].data[i].pointY=[],s[m+o].data[i].points=[],a.stepPointsAmount>2){var e=Math.round(t/100*a.stepPointsAmount);e<2&&(e=2);for(var p=Math.floor(e/2),n=Math.ceil(e/2),c=p;c<a.stepPointsAmount-n;c++){for(var h,f=0,g=0,l=0,Y=0,v=0,x=0,T=0,b=0-p;b<n;b++)Y+=(c+b)*s[o].data[i].dataY[c+b],v+=c+b,x+=s[o].data[i].dataY[c+b],T+=(c+b)*(c+b);if(g=(e*Y-v*x)/(e*T-v*v),l=(x-g*v)/e,c===p&&(s[m+o].data[i].dataY[0]=s[o].data[i].dataY[0],s[m+o].data[i].pointX[0]=s[o].data[i].pointX[0],s[m+o].data[i].pointY[0]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[0]+Math.abs(X)),h=s[m+o].data[i].pointX[0]+","+s[m+o].data[i].pointY[0],s[m+o].data[i].points.push(h),p>1))for(var E=1;E<p;E++)f=_.round(g*E+l,3),s[m+o].data[i].dataY[E]=f,s[m+o].data[i].pointX[E]=s[o].data[i].pointX[E],s[m+o].data[i].pointY[E]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[E]+Math.abs(X)),h=s[m+o].data[i].pointX[E]+","+s[m+o].data[i].pointY[E],s[m+o].data[i].points.push(h);f=_.round(g*c+l,3),isNaN(f)||(s[m+o].data[i].dataY[c]=f,s[m+o].data[i].pointX[c]=s[o].data[i].pointX[c],s[m+o].data[i].pointY[c]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[c]+Math.abs(X)),h=s[m+o].data[i].pointX[c]+","+s[m+o].data[i].pointY[c],s[m+o].data[i].points.push(h));var M=a.dataY.length;if(c===M-n-1){var N=M-1;if(M-n>1)for(var E=N-n+1;E<N;E++)f=_.round(g*E+l,3),s[m+o].data[i].dataY[E]=f,s[m+o].data[i].pointX[E]=s[o].data[i].pointX[E],s[m+o].data[i].pointY[E]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[E]+Math.abs(X)),h=s[m+o].data[i].pointX[E]+","+s[m+o].data[i].pointY[E],s[m+o].data[i].points.push(h);s[m+o].data[i].dataY[N]=s[o].data[i].dataY[N],s[m+o].data[i].pointX[N]=s[o].data[i].pointX[N],s[m+o].data[i].pointY[N]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[N]+Math.abs(X)),h=s[m+o].data[i].pointX[N]+","+s[m+o].data[i].pointY[N],s[m+o].data[i].points.push(h)}}s[m+o].pointstodraw=String(s[m+o].pointstodraw+" "+s[m+o].data[i].points.join(" "))}else{for(var c=0;c<s[o].stepPointsAmount;c++)s[m+o].data[i].dataY[c]=f,s[m+o].data[i].pointX[c]=s[o].data[i].pointX[c],s[m+o].data[i].pointY[c]=d+r.properties.paddingYTop-u*(s[m+o].data[i].dataY[c]+Math.abs(X)),h=s[m+o].data[i].pointX[c]+","+s[m+o].data[i].pointY[c],s[m+o].data[i].points.push(h);s[m+o].pointstodraw=String(s[m+o].pointstodraw+" "+s[m+o].data[i].points.join(" "))}})})}function Y(){_.forEach(f,function(t,a){s[a].pointstodraw="",s[m+a].pointstodraw="";var o=!0;_.forEach(s[a].data,function(t,i){for(var e=0;e<t.dataY.length;e++)t.pointY[e]=r.properties.paddingYTop+d-u*(s[a].data[i].dataY[e]+Math.abs(X)),t.points[e]=t.pointX[e]+","+t.pointY[e],s[m+a].data[i].pointY[e]=r.properties.paddingYTop+d-u*(s[m+a].data[i].dataY[e]+Math.abs(X)),s[m+a].data[i].points[e]=s[m+a].data[i].pointX[e]+","+s[m+a].data[i].pointY[e];o&&s[a].pointstodraw,s[a].pointstodraw=String(s[a].pointstodraw+" "+s[a].data[i].points.join(" ")),s[m+a].pointstodraw=String(s[m+a].pointstodraw+" "+s[m+a].data[i].points.join(" "))})})}function v(){var t=M(),a=t.getLine(),o=t.getText(),i=t.getNotch();L=_.cloneDeep(h),delete L.lastNotchValue,delete L.beginNotchX,svgTextToDelete=_.cloneDeep(c),E(),b(),_.isEmpty(L)||(_.forEach(L,function(t,a){console.log(" Notch to delete (id): "+t.id),delete h[t.id]}),L={}),_.isEmpty(svgTextToDelete)||(_.forEach(svgTextToDelete,function(t,a){delete c[t.id]}),svgTextToDelete={}),s[a.id]=a,c[o.id]=o,h[i.id]=i}function b(){for(var t="xNotch",a=r.properties.paddingXLeft,o=r.properties.notchYWidth,i=h.beginNotchX,e=r.properties.mainHeight-r.properties.paddingYBottom,p=r.properties.notchXStep,d=0;d<25&&i<a+n;d++){var s={id:t+d,x1:i,y1:e,x2:i,y2:e+o,col:"#1f1f1f",width:1},f=(String.toString(h.lastNotchValue),{id:t+d,text:h.lastNotchValue+d*p,x:i,y:e+o+T,col:"#F44336"});h[s.id]=s,delete L[s.id],i+=r.properties.updateXStep,c[f.id]=f,delete svgTextToDelete[f.id]}}function E(){function t(t,o,i,e){_.forEach(a,function(a,p){var d=_.floor(e/a);if(d>0&&u*a>20)for(var n=1;n<d+1;n++){var s=r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u)-i*u*a*n,f={id:a+o+n,x1:r.properties.paddingXLeft-r.properties.notchXWidth,y1:s,x2:r.properties.paddingXLeft,y2:s,col:"#1f1f1f",width:1},g=t+a*n,l={id:a+o+n,text:g,x:r.properties.paddingXLeft-r.properties.notchXWidth-x*g.length,y:s-1,col:"#F44336"};h[f.id]=f,delete L[f.id],c[l.id]=l,delete svgTextToDelete[l.id]}})}var a=[5,25,50,100,500,1e3],o="aboveNotchX",i="underNotchX";t("+",o,1,g),t("-",i,-1,Math.abs(X))}function M(){return{getLine:function(){return{id:"0xaxis",color:"#808080",data:[],pointstodraw:r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u))+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+(r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u))}},getText:function(){return{text:"0",x:r.properties.paddingXLeft-x-r.properties.notchXWidth,y:r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u),col:"#F44336"}},getNotch:function(){var t=r.properties.mainHeight-r.properties.paddingYBottom-Math.abs(X*u);return{id:"0xaxis",x1:r.properties.paddingXLeft-r.properties.notchXWidth,y1:t,x2:r.properties.paddingXLeft,y2:t,col:"#1f1f1f",width:1}}}}function N(){var t={id:"rim",color:"#4E342E",data:[],pointstodraw:r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom)+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+(r.properties.mainHeight-r.properties.paddingYBottom)+" "+(r.properties.mainWidth-r.properties.paddingXRight)+","+r.properties.paddingYTop+" "+r.properties.paddingXLeft+","+r.properties.paddingYTop+" "+r.properties.paddingXLeft+","+(r.properties.mainHeight-r.properties.paddingYBottom)};s[t.id]=t}var w=0,S=0;S=o(),i(),e(),p(),l(),Y(),N(),v();var L={}}function i(){return s}function e(){return c}function p(){return h}var d,n,r,s={},c={},h={},f={},u=1,g=1,X=0,l=[],Y=[],m="aprox",v=0,x=8,T=14;return{makeStep:o,getGraph:i,getText:e,getNotch:p,init:a}}]);
var feedbackModalModule=angular.module("FeedbackModalModule",[]);feedbackModalModule.factory("feedbackModalService",["$uibModal","$q",function(e,o){function a(a){var d=o.defer();l=a;var n=e.open({animation:!0,size:"md",templateUrl:"/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",controller:function(e){function o(o){e.close(o)}this.datamessage=l,console.log("  dataString   "+l),this.submit=function(){o(l)}},controllerAs:"vm"});return n.result.then(function(e){d.resolve(e)},function(e){console.log("Modal window: "+e),d.reject(e)}),d.promise}var l="";return{openModal:a}}]);
var loadMaskModule = angular.module('LoadMaskModule',[]);

var ModalModule = angular.module('ModalModule',[]);
ModalModule.controller('ModalController', 
  [ '$scope', '$translate', 'myModalWindowService', '$uibModalInstance',   
  function( $scope, $translate, myModalWindowService, $uibModalInstance) {
    $scope.close = function(result) {     
      $uibModalInstance.close();      
    };
}]);
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

'use strict';
var appDecorators = angular.module('appDecorators', []);



'use strict';
var appDirectives = angular.module('appDirectives', []);



'use strict';
var appProviders = angular.module('appProviders', []);



'use strict';
var appServices = angular.module('appServices', []);


loadMaskModule.directive('loadmask',[
	function () {
		
		return {
			restrict: 'E',
			templateUrl: 'app/loadmask/loadmask.html',
			controller: function(){
				console.log(" Load mask is shown.")
			},
			link: function(scope, element, attr, ctrl){

			}
		}		
	}
])

loadMaskModule.service('LoadMaskService', ['htmlClassModifierService',
  	function(htmlClassModifierService){
		function activateLoadMask(){
			htmlClassModifierService.removeClass("myloadmask", "hidden");
		};
		function deactivateLoadMask(){
			htmlClassModifierService.addClass("myloadmask", "hidden");
		};
		return {
			activateLoadMask : activateLoadMask,
			deactivateLoadMask : deactivateLoadMask
		}
	}
]);
ModalModule.service('myModalWindowService', ['$uibModal', '$rootScope',
	function($uibModal, $rootScope){
		var _ispresent = false;
		function showModal(errorType){
			if ( !_ispresent){
				_ispresent = true;
		  		var isolation = true;
		  		var modalScope = $rootScope.$new(isolation);
		  		modalScope.errortype = 'errormodalwindow.message.'+errorType;
		  		var modalInstance = $uibModal.open({
		  			animation: true,
		  			size: "sm",
		  			templateUrl: "/app/modal/modal.html",
		  			controller: "ModalController",
		  			scope: modalScope		  			
		  		});		  		
		  		modalInstance.result.then(function(){		  			
		  			_ispresent = false;
		  			modalScope.$destroy();
		  		}, function(error){
          			// error contains a detailed error message.		            
		            _ispresent = false;
		  		})
			}
		}
		return{
			showModal : showModal			
		}
	}
]);
// available languages
//appServices.factory('languagesStorage', ['$http', '$q', 
rootModule.service('languagesStorage', ['$http', '$q', 
	function($http, $q){
		function getAvailableLanguages(){			
			var deferred = $q.defer();
			$http({
				method: "GET",
				url: '/lang/languages.json'
			}).then(function successCallback(response){					
				deferred.resolve(response.data);
			}, function errorCallback(error){				
				deferred.reject(error);
			})
			return deferred.promise;			
		}
		return {
			getAvailableLanguages : getAvailableLanguages
		}
	}
])
app.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;				
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
app.config([ '$provide', function($provide){
		/*
			string into decorator have to be “{0} {1} – {2}{3}“ 
				where 
				{0} current date – “dd-MMM-yyyy”, 
				{1} – current time – “HH:MM:SS:MS”, 
				{2} – class name, 
				{3} – string that need to log
		*/
		var monthesStor = {
			"01":{"short":"JAN"},
			"02":{"short":"FEB"},
			"03":{"short":"MAR"},
			"04":{"short":"APR"},
			"05":{"short":"MAY"},
			"06":{"short":"JUN"},
			"07":{"short":"JUL"},
			"08":{"short":"AUG"},
			"09":{"short":"SEP"},
			"10":{"short":"OCT"},
			"11":{"short":"NOV"},
			"12":{"short":"DEC"}
		}
		var support = function(template, valuesArray){
			var result = new String(template);
			for (var val in valuesArray){
				result = result.replace("{"+val+"}", valuesArray[val]);
			}
			return result;
		}
		$provide.decorator('$log', [ '$delegate', 
			function($delegate){
				function currentTime(){		
					var time = new Date();
					var timeStr = String(time.getHours() + ":" +
						time.getMinutes() + ":" +
						time.getSeconds() + ":" +
						time.getMilliseconds()
					);
					return timeStr;
				};
				function currentDate(){
					var time = new Date();
					var date = time.getDate();
					var month = time.getMonth() + 1;
					date = date < 10 ? new String("0"+ date) : new String(date);
					monthStr = month < 10 ? monthesStor[new String("0"+ month)].short
						: monthesStor[new String(month)].short;					
					var dateStr = new String(date + "-" + 
						monthStr + "-" + 
						time.getFullYear());
					return dateStr;
				};
				function updateFunctions(object, className){
					function prepareFunction(object, funcName, className){
						return function () {			                
			                var now = String (currentTime() + " " + currentDate());		
			                var arg = !!(arguments[0]) ? new String(arguments[0]) : "";
			                className = className ? className : '';
			                console[funcName](support("{0} - {1} {2} ", [now, className, arg]));
			            };
					};
					object.log = prepareFunction(object, "log", className);
					object.info = prepareFunction(object, "info", className);
					object.warn = prepareFunction(object, "warn", className);
					object.debug = prepareFunction(object, "debug", className);
					object.error = prepareFunction(object, "error", className);
					return object;
				};
				$delegate.getInstance = function(className){
					className = (className !== undefined) ? className : "";
					$delegate = updateFunctions($delegate, className);
				};
				return $delegate;
			}
		])
	}
]);
appDirectives.directive('myagevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',
      link: function(scope, element, attr, mCtrl){
        function myAgeValidator(value){          
          var result = validatorsService.agevalidator(value);
          if (result){
            mCtrl.$setValidity('ageFormat', true);
            // custom
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return value;
          } else {
            mCtrl.$setValidity('ageFormat', false); 
            //custom
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return '';
          }
        }
        mCtrl.$parsers.push(myAgeValidator);
      }
    }
}])
appDirectives.directive('mydatevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
	  return {
	    require: 'ngModel',
	    link: function (scope, element, attr, mCtrl){
	      function myDateValidator(value){         
          var result = validatorsService.datevalidator(value);
          if (result){
            mCtrl.$setValidity('dateFormat', true);    
            //custom 
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('dateFormat', false);
            //custom
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);   
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);
            return '';
          }
	      }
	      mCtrl.$parsers.push(myDateValidator);
	    } 
	  }
}])
appDirectives.directive('mynamevalidator', ['validatorsService',
 'htmlClassModifierService', 'VALIDATORS',  
  function(validatorsService,htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',      
      link: function(scope, element, attr, mCtrl){
        function myNameValidator(value){
          var result = validatorsService.namevalidator(value);
          if (result){
            mCtrl.$setValidity('nameFormat', true);   
            //custom   
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('nameFormat', false); 
            //custom     
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME); 
            return '';
          }
        }
        mCtrl.$parsers.push(myNameValidator);
      }
    }
}])
appProviders.provider('log', 
	function logProvider(){
		var time = new Date();
		var currentTimeMillis = time.getTime();	
		var timeStr = String(time.getHours() + ":" +
			time.getMinutes() + ":" +
			time.getSeconds() + ":" +
			time.getMilliseconds()
		);
		this.getTimeCreation = function(){			
			return timeStr;
		};		
		this.getTimeCreationMillis = function(){
			return currentTime;
		};
		this.$get = function(){				
			return new log();				
		};		
	}	
)
appServices.service('checkCredentialsServise', ['$http', '$q', 
	'userCreditsStorage', 'loginService',
	function($http, $q, userCreditsStorage, loginService){		
		var _userCredentials;
		function checkUserCredentials(login, password){
			var deferred = $q.defer();
			loginService.login(login, password).then(
				function successCallback(details){
					access = true;
					deferred.resolve(details);				
				}, function errorCallback(response){
					
					deferred.reject(false);
				}
			)
			return deferred.promise;	
		};
		function checkSession(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/checksession'
			}).then(function successCallback(response){
				_userCredentials = response.data;
				console.log("Session is valid.");
				deferred.resolve(response.data);
			}, function errorCallback(error){
				_userCredentials = null;				
				console.log("Session not valid.");
				deferred.reject(error);
			})
			return deferred.promise;
		};
		function getUserCredits(){
				var deferred = $q.defer();
				if ( ! userCreditsStorage.getUserCredits()){
					checkSession().then(function(details){
						console.log("provide userCredits from post request");	
						userCreditsStorage.setUserCredits(details);
						deferred.resolve(details);
					}, function(error){
						console.log("Cann't get user credits details.");
						userCreditsStorage.setUserCredits(null);
						deferred.reject(error);
					})
				} else{					
					deferred.resolve(userCreditsStorage.getUserCredits());					
				}
			return deferred.promise;
		};
		return {
			checkCredentials:  checkUserCredentials,
			checkSession : checkSession,
			getUserCredits : getUserCredits
		}
	}
]);
appServices.service('htmlClassModifierService', [ function(){
	return {
		addClass : function(classSelector, classToAdd){
			angular.element(document.querySelector("."+classSelector)).addClass(classToAdd);
		},
		removeClass : function(classSelector, classToRemove){
			angular.element(document.querySelector("."+classSelector)).removeClass(classToRemove);
		}
	}	
}])

appServices.service('myInterceptor', [
	function(){
		var timeMarker = {
			request: function(config){
				config.requestTimePoint = new Date().getTime();
				return config;
			},
			response: function(response){
				response.config.responseTimePoint = new Date().getTime();
				// log only post requests
				if ( String(response.config.method).toLowerCase() === "post" ){
					// log it 
					console.log(" - request-response time: " + 					
						(response.config.responseTimePoint - response.config.requestTimePoint) +
						" ms. " + " URl: " + response.config.url);
				}
				return response;
			}
		}
		return timeMarker;
	}
])
//monthes storage
appServices.service('monthesStorage', [ '$http', '$q',
	function($http, $q){
		var monthes;
		var _promiseLoad = _loadMonthes();
		function _loadMonthes(){			
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: "/app/public/date.json"
			}).then(function successCallback(response){
				// save monthes				
				deferred.resolve(response.data);
			}, function errorCallback(error){
				// error in monthes load 								
				deferred.reject( "Cann't receive date.json file." );
			}	
			)	
			return deferred.promise;
		}
		function getMonthes(){
			if (monthes === undefined){
				_promiseLoad.then(function(details){						
						monthes = details;						
						return monthes;
					}, 
					function(reason){
						// show modal error message.
						monthes = undefined;						
					}
				);				
			} else {				
				return monthes;
			}
		}
		function checkLeapYear(year){
			if ( (year) % 4 === 0 ){    
			    if (year % 100 === 0 && year % 400 !== 0){
			      return false;
				}
			    return true;   
			} else {
			    return false;
			}
		}
		return {
			getMonthes : getMonthes,
			checkLeapYear : checkLeapYear
		}
		
	}
])
// save login of user
appServices.service('userCreditsStorage', function(){
	var userCredits = null;
	return {
		setUserCredits: function(credits){			
			userCredits = credits;
		},
		getUserCredits: function(){			
			return userCredits;
		}
	}
})
// save different user data
appServices.service('userDataStorage', function(){
	var userData = {};
	return {
		setUserData: function(data, key){
			userData[key] = data;
		},
		getByKeyUserData: function(key){
			return userData[key];
		},
		getAllUserData: function(){
			return userData;
		},
		removeAll: function(){
			// delete userData;
			userData = null;
			userData = {};
		}
	}
})
appServices.service('userDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;
		function getUserDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/userdetails'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){				
				userCreditsStorage.setUserCredits(null);
				// make some message ?
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getUserDetails : getUserDetails
		}
	}
])
appServices.service('validatorsService', ['VALIDATORS', 'monthesStorage',
	function(VALIDATORS, monthesStorage){
		var _nameRegEx = VALIDATORS.NAME_VALIDATOR.NAME_REGEX;
		var _minage = VALIDATORS.AGE_VALIDATOR.MIN_AGE;
    	var _maxage = VALIDATORS.AGE_VALIDATOR.MAX_AGE;
    	var _ageRegex = VALIDATORS.AGE_VALIDATOR.AGE_REGEX;

    	var _dateRegEx = VALIDATORS.DATE_VALIDATOR.DATE_REGEX; 
	    var _separator = VALIDATORS.DATE_VALIDATOR.SEPARATOR;
	    var _minyear = VALIDATORS.DATE_VALIDATOR.MIN_YEAR;
	    var _maxyear = VALIDATORS.DATE_VALIDATOR.MAX_YEAR;
	    var _februarynumber = VALIDATORS.DATE_VALIDATOR.FEBRUARY_NUMBER;
	    var _februaryleapdays = VALIDATORS.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS;
	    var _numyear = VALIDATORS.DATE_VALIDATOR.NUMBER_YEAR;
	    var _nummonth = VALIDATORS.DATE_VALIDATOR.NUMBER_MONTH;
	    var _numday = VALIDATORS.DATE_VALIDATOR.NUMBER_DAY;
    
		var _isvalid = false;
		var _parts = null;
		var _maxdays = 0;

		var monthes;

		return {
			namevalidator: function(value){
				var isvalid = false;
				if (_nameRegEx.test(value)){
		        	isvalid = true;		            
		        } else {		            
		            isvalid = false;
		        }
		        return isvalid;
			},
			agevalidator: function(value){
				var isvalid = false;
				if (value <= _maxage && value >= _minage && _ageRegex.test(value)){
		            isvalid = true;		            
		        } else {
		             isvalid = false;
		        }
		        return isvalid;
			},
			datevalidator : function(value){
				var _isvalid = false;
				monthes = monthesStorage.getMonthes();
		        if (_dateRegEx.test(value)){
		          _parts = value.split(_separator);
		          // check year
		          if(_parts[_numyear] > _minyear && _parts[_numyear] < _maxyear){            
		            // check february for leap year
		            if (_parts[_nummonth] === _februarynumber ){
		              if (monthesStorage.checkLeapYear(_parts[_numyear])){
		                _maxdays = _februaryleapdays;
		              } else{
		                _maxdays = monthes[_parts[_nummonth]].days;
		              }               
		            } else {
		                _maxdays = monthes[_parts[_nummonth]].days;	               
		            }
		            // check amount of days for max value
		            if (_parts[_numday] <= _maxdays && _parts[_numday] > 0){
		              _isvalid = true;
		            } else {
		              _isvalid = false;
		            }
		          } else {
		            _isvalid = false;
		          }          
		        } else {
		            _isvalid = false;
		        }
				return _isvalid;				
			}
		}
	}
]);

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
loginModule.service('loginService', [ '$q', '$http',
	function($q, $http){
		var deferred = $q.defer();
		function login(login, password){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/login',
				data: {
					"login": login,
					"password": password
				}
			}).then(function successCallback(response){			
				deferred.resolve(response.data);				
			}, function errorCallback(response){				
				deferred.reject(false);
			})	
			return deferred.promise;
		}
		return {
			login : login
		}
	}
])
tabSwitcherModule.service('logoutService', ['$http', '$q', 'userCreditsStorage', 
	'userDataStorage', 
	function($http, $q, userCreditsStorage, userDataStorage){
		function logout(){
			userDataStorage.removeAll();
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/logout'				
			}).then(function successCallback(response){
				console.log("Logout is allowed.");
				userCreditsStorage.setUserCredits(null);
				deferred.resolve(response.data);
			}, function errorCallback(error){
				console.log("Error while logout.");
				deferred.reject(error);
			})
			return deferred.promise;
		}
		return {
			logout : logout
		}
	}
])

var adminModule = angular.module('AdminModule',
	['AdminAddUserModalModule', 'AdminDeleteUserModalModule', 'AdminUpdateUserModalModule']);

adminModule.controller('AdminController', [ 'allUsersDetailsModel',
	'$uibModal', 'userCreditsStorage', 'myModalWindowService',
	'LoadMaskService', '$log', 
	function(allUsersDetailsModel, $uibModal, userCreditsStorage,
			myModalWindowService, LoadMaskService, $log){
		var thisPointer = this;
		var allUsersDetails = null;
		$log.getInstance("Admin");
		// load data about all users. 
		loadUsersDetails();
		// show in table.
		function loadUsersDetails(){
			LoadMaskService.activateLoadMask();
			allUsersDetailsModel.getDetails().then(
				function successCallBack(details){	
					$log.info("Users data was loaded.");
					thisPointer.alldetails = details;
					allUsersDetails = details;
					LoadMaskService.deactivateLoadMask();					
				} , 
				function errorCallBack(){
					LoadMaskService.deactivateLoadMask();
					$log.warn("Users data loading error.");
					// show modal about error
					myModalWindowService.showModal("type10");
					// send redirect if user hasn't admin access					
					// or redirect him to anywhere
				}
			);
		}
		// add new user
		thisPointer.adduser = function (login, password, name, age, date){
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",
	  			controller: "AdminAddUserModal",
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if (!_.isEmpty(result)){									
					// activate loadmask	  			
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.addUser(result.login, 
							result.password, result.name, result.age, result.date).then(
						function successCallBack(){
							$log.info("New user \'" + result.login + "\' was added.");
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
							// deactivate loadmask
						}, function errorCallBack(){
							$log.warn("User \'" + result.login + "\' creation error.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type13");							
						}
					)	  				
	  			}
	  		}, function(error){      			
				// myModalWindowService.showModal("type13");
	  		})
		}
		// update user
		thisPointer.update = function (login){
			// login, password, name, age, date
			// open modal window for updating fields
			var isAdmin = userCreditsStorage.getUserCredits().admin;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",
	  			controller: "AdminUpdateUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userDetails : function(){	  					
	  					return allUsersDetails[login];
	  				}
	  			}	  				
	  		});	
	  		modalInstance.result.then(function(result){ 
	  			if (!_.isEmpty(result)){
					// activate loadmask

	  				LoadMaskService.activateLoadMask();					
					allUsersDetailsModel.updateUser(result.login, 
							result.password, result.name, result.age, result.date, login).then(
						function successCallBack(){							
							$log.info("Update user. Submited data: " + JSON.stringify(result));
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
						}, function errorCallBack(){
							$log.warn("User cann't be updated.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type12");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	  		})
		}
		// delete user
		thisPointer.delete = function (login){			
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",
	  			controller: "AdminDeleteUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userLoginDelete : function(){	  					
	  					return login;
	  				}
	  			}	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if ( result.deleteFlag ){
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.deleteUser(login).then(
						function successCallBack(){
							$log.info("User was deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();
						}, function errorCallBack(){
							$log.warn("User cann't be deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type11");
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	  		})
		}
	}
])
var dashboardModule = angular.module('DashboardModule',
	['DiagramModule']);

dashboardModule.controller('DashboardController', ['$scope', '$state', '$interval',
  'userDataStorage', 'userDetailsService', 'loadChartDataService', 'LoadMaskService',
  function($scope, $state, $interval, userDataStorage, 
      userDetailsService, loadChartDataService, LoadMaskService){
    // show chart. stream from server
    var thisPointer = this;
    
    // initial parameters for charts: 
    var initParameters = {
      "1": {
        "stream":"/app/chartdata1", 
        "color":"#FFCC80", 
        "aproximatecolor":"#EF6C00"
      }, 
      "2": { "id": 2,
        "stream":"/app/chartdata2", 
        "color":"#80CBC4", 
        "aproximatecolor": "#00695C"
      }
    }

  /*  "maxAmountOfPoints" : 480,
      "updateTimeout" : 500,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStep" : 40,      - step in px per notch  
      "notchXName" : "point", - notch name
      "notchXWidth" : 5,      - width of notch-line      
      "notchYStep" : 100,   
      "notchYName" : "point", - notch name

      notice: chart height = main-height - (paddingYTop + paddingYBottom)
              chart width = main-width - (paddingXLeft + paddingXRight)  
  */    
    var chartProperties = {
      "mainWidth" : 480,
      "mainHeight" : 400,     
      "updateTimeout" : 1500,
      "updateXStep": 50,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStartValue" : 10,
      "notchXStep" : 40,
      "notchXWidth" : 5,      
      "notchXName" : "point",      
      "notchYWidth" : 5,
      "notchYName" : "point",
    }

    var maxAmountOfPoints = chartProperties.mainWidth;    
    // timeout for redraw diagram
    var updateTimeout = chartProperties.updateTimeout; // ms
    // make graph object
    var graphObjects = {};
    _.forEach(initParameters, function(value, key){      
      graphObjects[key] = {
          "id": key,
          "stream": value.stream,
          "color": value.color,
          "aproximatecolor": value.aproximatecolor
      }      
    });
    // data storage for downloadded datas
    var dataDownloaded = {};
    var dataDownloadedProperties = {};
    // amount of points availale to make step
    var updateStep = 0;    
    // object-storage for $interval's
    var intervalObject;
    function destroyInterval(){      
        if (angular.isDefined(intervalObject)){
          $interval.cancel(intervalObject);
          intervalObject = undefined;
        }      
    }
    $scope.$on('$destroy', function(){
        destroyInterval();
      }
    );
    function startUpdate(){
      // deactivate load mask in case of showing diagram
      LoadMaskService.deactivateLoadMask();
      intervalObject = $interval(function(){
        thisPointer.chartOptions.properties = chartProperties;
        _.forEach(graphObjects, function(value, key){ 
          if (!dataDownloaded[key]){
            dataDownloaded[key] = {};
            dataDownloaded[key].id = key;
            dataDownloaded[key].data = [];
            dataDownloaded[key].color = value.color;
            dataDownloaded[key].aproximatecolor = value.aproximatecolor;
            dataDownloadedProperties[key] = {};
            dataDownloadedProperties[key].iswaitingload = false;
            dataDownloadedProperties[key].updateStep = 0; 
          }          
          if (!dataDownloadedProperties[key].iswaitingload){            
            dataDownloadedProperties[key].updateStep = 0;            
            dataDownloadedProperties[key].iswaitingload = true;
            // load data for current stream
            loadChartDataService.loadData(value.stream).then(
              function successCallBack( details ){
                dataDownloadedProperties[key].updateStep = details.data.length;
                dataDownloaded[key].data = _.concat(dataDownloaded[key].data , details.data);
                dataDownloadedProperties[key].iswaitingload = false;
                thisPointer.chartOptions.streams[key] = dataDownloaded[key];
              }, function errorCallBack(reason){
                // show error modal message                
                $state.go("root.login");                
              }
            )          
          }
        })
        var currentMaxLengthOfStream = 0;
        _.forEach(graphObjects, function(value, key){
          if (dataDownloaded[key].data.length > currentMaxLengthOfStream) {
            currentMaxLengthOfStream = dataDownloaded[key].data.length;
          }
          if (dataDownloadedProperties[key].updateStep > updateStep) {
            updateStep = dataDownloadedProperties[key].updateStep;
          }
        })
        var temp = currentMaxLengthOfStream - maxAmountOfPoints;
        if (temp > 0){
          _.forEach(graphObjects, function(value, key){
            dataDownloaded[key].data.splice(0, temp);
          })          
        }        
        userDataStorage.setUserData(dataDownloaded, "chartData");
        userDataStorage.setUserData(dataDownloaded, "chartDataProperties");
        userDataStorage.setUserData(chartProperties, "chartProperties");        
        thisPointer.chartOptions = { 
          "streams": dataDownloaded,
          "streamsProperties": dataDownloadedProperties,          
          "properties" : chartProperties        
        }        
      }, updateTimeout);
    }

    // take data from userStorage
    if (_.isEmpty(dataDownloaded)){      
      var temp = userDataStorage.getByKeyUserData("chartData");
      if (temp !== undefined){
        dataDownloaded = _.cloneDeep(temp);
        dataDownloadedProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartDataProperties"));
        chartProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartProperties"));
      }
      thisPointer.chartOptions = { 
        "streams": dataDownloaded,
        "streamsProperties": dataDownloadedProperties, 
        "properties" : chartProperties        
      } 
    }
    startUpdate();
  }
])
var feedbackModule = angular.module('FeedbackModule',
	['FeedbackModalModule']);

feedbackModule.controller('FeedbackController', ['$state',
  'myModalWindowService', 'LoadMaskService', '$log', 
  'feedbackService', 'feedbackModalService',
  function($state, myModalWindowService, LoadMaskService, $log, 
  			feedbackService, feedbackModalService){      
	    var thisPointer = this;
	    $log.getInstance("Feedback");
	    thisPointer.sendemail = function(){		    
		    var data = {
		    	"from" : thisPointer.name,
			    "to" : thisPointer.email,
			    "content" : thisPointer.textarea
		    }
		    // process data		       
		    var processedData = "From: \"" + data.from + "\". " + 
				"To: \"" + data.to + "\". " + 
				"Content: \"" + data.content + "\".";		    
		    // open modal
			feedbackModalService.openModal(processedData).then(
				function successCallBack(resultMessage){					
					LoadMaskService.activateLoadMask();
					var jsonResultMessage = {
				    	"from" : thisPointer.name,
					    "to" : thisPointer.email,
					    "content" : thisPointer.textarea
				    }
				    // read all available email in address-email and try send 
				    //untill it will be sent
					// method from decorator is called
					var toArray = jsonResultMessage.to.split(",");
					feedbackService.setContent(jsonResultMessage.content);
					feedbackService.sendFromDecorator(
							jsonResultMessage.from, 
							toArray ).then(
						function successCallBack(result){
							LoadMaskService.deactivateLoadMask();
							$log.info("Feedback is sent.");
							// clear feedback form
							thisPointer.name = "";
		    				thisPointer.email = "";
		    				thisPointer.textarea = "";
							//ok
						}, function errorCallBack(error){
							// don't clear feedback form
							LoadMaskService.deactivateLoadMask();		
							$log.warn("Feedback cann't be sent.");
							// show modal error
							myModalWindowService.showModal("type20");
						}
					)
				}, function errorCallBack(error){
					// don't send
					// don't clear feedback form
					// log	
					$log.log("Feedback wasn't sent. Canseled.");				
				}
			)
	    }     
  }
])
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
adminModule.service('allUsersDetailsModel', ['allUsersDetailsService', '$q',
	function(allUsersDetailsService , $q){
		var allUsersDetails = {};
		function deleteUser(login){
			var deferred = $q.defer();
			allUsersDetailsService.deleteUser(login).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}
			)
			return deferred.promise;
		}
		// login cann't be updated
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			allUsersDetailsService.updateUser(login, password, name, age, date, oldLogin).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}			
			);
			return deferred.promise;
		};
		function getDetails(){
			var deferred = $q.defer();			
			allUsersDetailsService.getAllUsersDetails().then(
				function successCallback(details){			
					allUsersDetails = {};
					_.forEach(details.usercredits, function (value, key){
						allUsersDetails[key] = {};
						allUsersDetails[key].login = key;
						allUsersDetails[key].password = value.password;
						allUsersDetails[key].name = details.userdata[key].name;
						allUsersDetails[key].age = details.userdata[key].age;
						allUsersDetails[key].date = details.userdata[key].date;
					})					
					deferred.resolve(allUsersDetails);
				} , function errorCallback(error){					
					allUsersDetails = {};
					deferred.reject(allUsersDetails);
				}
			)
			return deferred.promise;
		}
		return {
			getDetails: getDetails,
			updateUser: updateUser,
			deleteUser: deleteUser,
			addUser : updateUser
		}
	}
])
adminModule.service('allUsersDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;

		// function addNewUser(login, password, name, age, date){
			// function 'updateUser' is used in this case
		// }

		function deleteUser(login){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/deleteuser',
				data: {
					userdeletelogin : login
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				deferred.reject(error.status);
			})
			return deferred.promise;
		}
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/updateuserdata',
				data: {
					login : login, 
					password : password, 
					name : name, 
					age : age , 
					date : date,
					oldlogin : oldLogin
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				deferred.reject();
			})
			return deferred.promise;
		}
		function getAllUsersDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/getusersdata'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				userCreditsStorage.setUserCredits(null);
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getAllUsersDetails : getAllUsersDetails,
			updateUser : updateUser,
			deleteUser : deleteUser
		}
	}
])
dashboardModule.service('loadChartDataService', [ '$http', '$q', 
	function($http, $q){
		return {
			loadData : function(urlstream){
				var deferred = $q.defer();
				var urlString = urlstream.toString(urlstream);
				$http({
					method : 'POST',
					url : urlString
				}). then( function successCallback(response){
					deferred.resolve(response.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				})
				return deferred.promise;
			}
		}
	}])
feedbackModule.config([ '$provide', function($provide){
	$provide.decorator('feedbackService', ['$delegate','$http', '$q',
		function($delegate, $http, $q){
			$delegate.data = {
				"from" : "",
				"to" : [""],
				"content" : "",
				"signature" : ""
			}
			$delegate.setContent = function(contentNew){
				$delegate.data.content = contentNew;
			}
			$delegate.setFrom = function(fromNew){
				$delegate.data.from = fromNew;
			}
			$delegate.setTo = function(toNew){
				$delegate.data.to = toNew;
			}
			$delegate.setSignature = function(signatureNew){
				$delegate.data.signature = signatureNew;
			}
			$delegate.sendFromDecorator = function(from, toArray, signature){
				var dataFrom = !!from ? from : $delegate.data.from;
				var dataTo = !!toArray ? toArray : $delegate.data.to;
				var dataContent = $delegate.data.content;
				var dataSignature = !!signature ? signature : $delegate.data.signature;
				// $q object
				var deferred = $q.defer();
				var i=0; // counter
				sendData(i, from, toArray, dataContent).then(
					function successCallback(details){
						deferred.resolve(details.data);
					}, function errorCallback(reason){
						deferred.reject(reason);
					}
				)				
				function sendData(i, from, toArr, content){
					var deferred2 = $q.defer();
					$http({
						method: 'POST',
						url: '/app/feedback/send',
						data: {
							"from" : from,
							"to" : toArr[i],
							"content" : content
						}
					}).then( function successCallback(details){						
							deferred2.resolve(details);
						}, function errorCallback(reason){	
							if (i+1<toArr.length){
								sendData(i+1, from, toArr, content).then(
									function successCallback(details2){
										deferred2.resolve(details2);
									}, function errorCallback(reason2){
										deferred2.reject(reason2);
									}
								)							
							}
							else {
								deferred2.reject("Cann't send email");
							}
						}
					)	
					return deferred2.promise;			
				}
				return deferred.promise;
			}
			return $delegate;
		}
	])
}
])
feedbackModule.service('feedbackService', ['$uibModal', '$http', '$q',
	function($uibModal, $http, $q){
		function sendFeedback(from, to, content){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/feedback/send',
				data: {
					"from" : from,
					"to" : to,
					"content" : content
				}
			}).then( function successCallback(details){
					deferred.resolve(details.data);
				}, function errorCallback(reason){
					deferred.reject(reason);
				}
			)
			return deferred.promise;			
		}
		return {			
			sendFeedback : sendFeedback
		}
	}
])
tabTwoModule.service('updateUserDetailsService', ['$http', '$q', 
	function($http, $q){
		function updateUserDetails(json){
			var deferred = $q.defer();
			$http({
				method : 'POST',
				url: '/app/updateuserdetails',
				data: json
			}).then(function successCallback(response){
					// ok
					deferred.resolve(response.data);
				}, function errorCallback(error){
					// error
					deferred.reject(error);
				}
			)
			return deferred.promise;
		}
		return {
			updateUserDetails : updateUserDetails
		}
	}
])

var adminAddUserModalModule = angular.module('AdminAddUserModalModule',
	[]);

adminAddUserModalModule.controller('AdminAddUserModal', 
  ['$uibModalInstance', 'userCreditsStorage',
  function($uibModalInstance,  
  	userCreditsStorage) {     
   	this.submit = function(){
  		// read input data 
  		var resultData = {
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var adminDeleteUserModalModule = angular.module('AdminDeleteUserModalModule',
	[]);

adminDeleteUserModalModule.controller('AdminDeleteUserModal', 
  ['$translate', '$uibModalInstance', 'userLoginDelete',
  function($translate, $uibModalInstance, userLoginDelete) {     
    var deleteFlag = false;
    this.userLoginDelete = userLoginDelete;
   	this.submit = function(){
      deleteFlag = true;
  		close(deleteFlag);
  	}
  	this.cansel = function(){
  		close(deleteFlag);
  	}
    function close(deleteFlag) {     
      $uibModalInstance.close({deleteFlag : deleteFlag});      
    };
}]);

var adminUpdateUserModalModule = angular.module('AdminUpdateUserModalModule',
	[]);

adminUpdateUserModalModule.controller('AdminUpdateUserModal', 
  [ '$scope', '$uibModalInstance', 'userDetails', 
  	'userCreditsStorage',
  function( $scope, $uibModalInstance, userDetails, 
  	userCreditsStorage) {     
    // make clone to avoid unexpected changing
  	this.userdetails = _.clone(userDetails);
   	this.logindisabled = false;
		if ( String(userCreditsStorage.getUserCredits().login) === userDetails.login){
			this.logindisabled = true;
		}
  	this.submit = function(){
  		// read input data 
  		var resultData = {        
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);

var diagramModule = angular.module('DiagramModule',[]);

diagramModule.controller('DiagramController', [ '$scope', '$state', 
  '$interval', 'ChartHelperService',
  function($scope, $state, $interval, ChartHelperService){
    var thisPointer = this;    
    var graphs = this.graphs;
    var svgtexts = this.svgtext;

    // object (streams, properties) from 'dashboardController'           
    this.mainwidth = this.chartOptions.properties.mainWidth;
    this.mainheight = this.chartOptions.properties.mainHeight;
       
    // initial data for graph object of chart
    var graphObjects = {};   
    // main data storage (from here polyline is drawn)
    var data = {};   
    // flag for first start graphObjects
    var firstStartGraphObjects = true; 
    var enableStep = false;
    var watcherOne = $scope.$watch( function(){return thisPointer.chartOptions.streams}, 
      function(newValue, oldValue){        
        enableStep = false;
        // init graphObjects if it isn't inited
        if (_.isEmpty(graphObjects)){
          if (!_.isEmpty(thisPointer.chartOptions.streams)){
            _.forEach(thisPointer.chartOptions.streams, function(value, key){ 
              graphObjects[key] = {
                "id": key,
                "color": value["color"],
                "aproximatecolor": value["aproximatecolor"]
              }
            })
            ChartHelperService.init(graphObjects, thisPointer.chartOptions);
          }
        }
        _.forEach(graphObjects, function(value, key){
          if(!data[key]){
            data[key] = {};
            data[key].id = key;
            data[key].color = value.color;
            data[key].data = {};
          }
          if(thisPointer.chartOptions.streamsProperties[key].updateStep > 0){
            enableStep = true;
          }
        })
        if (enableStep){
          ChartHelperService.makeStep(data, thisPointer.chartOptions);
        }
        // get calculated datas and send it to draw        
        thisPointer.graphs = ChartHelperService.getGraph();
        thisPointer.svgtexts = ChartHelperService.getText();
        thisPointer.notches = ChartHelperService.getNotch();
      },
      true
    );
    $scope.$on('$destroy', function(){
        watcherOne();
      }
    ); 
  }
])
diagramModule.directive('mychart', [ 
  function(){
    
    return {
      restrict: 'E',
      controller: 'DiagramController',
      controllerAs: 'chart',
      templateUrl: 'app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html',       
      bindToController: {          
        chartOptions: '=chartOptions' 
      },   
      link: function (scope, element, attr, ctrl){        
        var chartAllPoints = attr.chartAllPoints;       
      }
    }
  }
])
diagramModule.service('ChartHelperService', [
	function(){
    var graphs = {};   
    var svgTexts = {};
    var notches = {};

    var graphObjects = {};     
    var heightStep = 1;     // 'y' - height step to draw chart (float)
    var maxHeightValue = 1;    // max height value2             (int)
    var minHeightValue = 0; // min height value2                (int)
    // var step = 1;             // 'x' step to draw chart         (int)      
    var idsArray = [];
    var idsAproxAray = [];
    var idsAllArray = [];
    var _strAprox = "aprox";
    // id value and generator for objects 'data' in 'graph'
    var _idCounter = 0;
    function _idGenerator(){
      return ++_idCounter;
    }
    // available dimensions for drawing chart
    var availableMainHeight;
    var availableMainWidth;
    // symbol dimensions:
    var oneSymbolWidth = 8; // 10 px
    var oneSymbolHeight = 14; // 14 px
    // object of initial data for chart
    var chartOptions;
    // init function for helper.
    function init(graphObj, chartOpt){
      graphObjects = graphObj;
      chartOptions = chartOpt;
      if( _.isEmpty(chartOptions.streams)){
          //console.log(" - object 'chartOptions.streams' is empty")		  
        } else {
          // init availableMainHeight and 
          availableMainHeight = chartOptions.properties.mainHeight - 
            (chartOptions.properties.paddingYTop + chartOptions.properties.paddingYBottom);
          availableMainWidth = chartOptions.properties.mainWidth - 
            (chartOptions.properties.paddingXLeft + chartOptions.properties.paddingXRight);

          _.forEach(chartOptions.streams, function(value, key){
            if (_.indexOf(idsArray, value.id) < 0){
              idsArray.push(value.id);
              idsAllArray.push(value.id);
              // init graph
              if (!graphs[key]){
                graphs[key] = {};
                graphs[key].id = value.id;
                graphs[key].color = value.color;
                graphs[key].aproximatecolor = value.aproximatecolor;
                graphs[key].data = {}; 
                graphs[key].pointstodraw = '';
                graphs[key].lastXValue = 0;
                notches.lastNotchValue = chartOptions.properties.notchXStartValue;
                notches.beginNotchX = chartOptions.properties.paddingXLeft;
              } 
            } //else { do nothing }
          })        
        }
    }

    function makeStep(data){
      var calculatedXMoveLeftStep = 0;
      var maxLastXValue = 0;      
      maxLastXValue = findMaxXValue();
      moveXToLeft();
      addNewDataY();
      findMaxAndMinY();      
      calculateAproximateLine();
      calculateNewPointY(); 
      drawRim();
      makeAxises();
      // functions :
      function findMaxXValue(){
        // look for value of 'maxLastXValue'
        _.forEach(graphObjects, function(value, key){
          if( graphs[key].lastXValue > maxLastXValue){
            maxLastXValue = graphs[key].lastXValue;
          }
        });
        return maxLastXValue;             
      }
      function moveXToLeft(){
        // array for data which should be deleted
        var dataIdToDelete = [];
        if( (maxLastXValue ) > availableMainWidth ){
          calculatedXMoveLeftStep = maxLastXValue  - availableMainWidth;
          // move previous data to left border on required value - calculate it
          var newBeginNotchX = notches.beginNotchX + (chartOptions.properties.updateXStep - calculatedXMoveLeftStep);
          notches.beginNotchX = newBeginNotchX;
          notches.lastNotchValue += chartOptions.properties.notchXStep;

          _.forEach(graphObjects, function(value, key){
            var newlastXValue = graphs[key].lastXValue - (calculatedXMoveLeftStep);            
            graphs[key].lastXValue = newlastXValue < 0  ? 0 : newlastXValue;
            var paddingXLeft = chartOptions.properties.paddingXLeft;
            _.forEach(graphs[key].data, function(value2, key2){              
                var flagToDelete = true;
                var idPointToDelete = -1;                
                for (var i=0; i < value2.dataY.length; i++){
                  // move left dataX value                  
                  value2.pointX[i] -= calculatedXMoveLeftStep;
                  graphs[_strAprox+key].data[key2].pointX[i] -= calculatedXMoveLeftStep;
                  if( value2.pointX[i] <= paddingXLeft){
                    idPointToDelete = i;
                  }
                  if (value2.pointX[i] > paddingXLeft){
                    flagToDelete = false;
                  }
                }
                // check if current dataObj all pointX < 0
                if(flagToDelete){
                  dataIdToDelete.push(key2);
                } else {
                  if (idPointToDelete >=0){
                    value2.dataY = _.drop(value2.dataY, 1+idPointToDelete);
                    value2.pointX = _.drop(value2.pointX, 1+idPointToDelete);
                    value2.pointY = _.drop(value2.pointY, 1+idPointToDelete);
                    value2.points = _.drop(value2.points, 1+idPointToDelete);
                    value2.stepPointsAmount -= idPointToDelete;
                    graphs[_strAprox+key].data[key2].dataY = _.drop(graphs[_strAprox+key].data[key2].dataY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointX = _.drop(graphs[_strAprox+key].data[key2].pointX, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointY = _.drop(graphs[_strAprox+key].data[key2].pointY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].points = _.drop(graphs[_strAprox+key].data[key2].points, 1+idPointToDelete);
                  }
                }                              
            })
            // delete dataObj with all pointX < 0
            _.forEach(dataIdToDelete, function(value3){
              delete graphs[key].data[value3];
              delete graphs[_strAprox+key].data[value3];
            })
            dataIdToDelete = [];
          })
        };             
      }

      function addNewDataY(){
        _.forEach(graphObjects, function(value, key){
          // amount of points in current step
          var tempUpdateStep = _.clone(chartOptions.streamsProperties[key].updateStep);          
          // add new points to graphs[key].lastXValue
          if(tempUpdateStep > 0){
            // increase lastXValue
            graphs[key].lastXValue += chartOptions.properties.updateXStep;
            // set to zero 'updateStep' in 'streamsProperties'
            chartOptions.streamsProperties[key].updateStep = 0;
            // process it
            if(tempUpdateStep > 0 ){
              var tempId = _idGenerator();
              // create object 'data' : graphs[key].data[tempId]
              graphs[key].data[tempId] = {};
              // get amount 'tempUpdateStep' last data from the stream
              var tempArray = _.takeRight(chartOptions.streams[key].data, tempUpdateStep);
              graphs[key].data[tempId].dataY = _.cloneDeep(tempArray);
              graphs[key].data[tempId].pointX = [];
              graphs[key].data[tempId].pointY = [];
              graphs[key].data[tempId].points = [];
              // amount of points in current step
              graphs[key].data[tempId].stepPointsAmount = tempUpdateStep;
              // length of current step per point (round to 0.001)
              graphs[key].data[tempId].stepX = 
                _.round(chartOptions.properties.updateXStep / tempUpdateStep , 3);
              
              var tempLastXValue = graphs[key].lastXValue - chartOptions.properties.updateXStep;
              for (var i=0; i < tempUpdateStep; i++){
                graphs[key].data[tempId].pointX[i] = chartOptions.properties.paddingXLeft +
                  tempLastXValue + graphs[key].data[tempId].stepX * i;
              }
            }
          }
        });        
      }
      
      function findMaxAndMinY(){
        var currentMinHeight = 0;
        var currentMaxHeight = 0;   
        _.forEach(graphObjects, function(value, key){           
          // calculate height step (look through all datas in graph)
          _.forEach(graphs[value.id].data, function(value2, key2){
              _.forEach(value2.dataY, function(value3, key3){
                var tempValue3 = parseInt(value3)
                if (currentMinHeight > tempValue3){
                  currentMinHeight = tempValue3;
                }
                if (minHeightValue > tempValue3){
                  minHeightValue = tempValue3;
                }
                if (currentMaxHeight < tempValue3){
                  currentMaxHeight = tempValue3;
                }
                if (maxHeightValue < tempValue3){
                  maxHeightValue = tempValue3;
                }
                // correct global max and min value
                if (minHeightValue < currentMinHeight){
                  minHeightValue++;
                }
                if (maxHeightValue > currentMaxHeight){
                  maxHeightValue--;
                }                
              })
          });
        });        
        // calculate heightstep
        heightStep = _.round(availableMainHeight / (maxHeightValue + Math.abs(minHeightValue)) , 9);
      }
      
      //calculate aproximate line and add it to graph
      function calculateAproximateLine(){
        var aproximateRatePercent = 21;
        _.forEach(graphObjects, function(value, key){
            if( !graphs[_strAprox+key]) {
              graphs[_strAprox+key] = {};
              graphs[_strAprox+key].pointstodraw = '';
              graphs[_strAprox+key].data = {};
              graphs[_strAprox+key].color = graphObjects[key].aproximatecolor;
            }
            _.forEach(graphs[key].data, function(value3, key3){              
              if ( ! graphs[_strAprox+key].data[key3] ) { // if undefined
                graphs[_strAprox+key].data[key3] = {};
                graphs[_strAprox+key].data[key3].dataY = [];
                graphs[_strAprox+key].data[key3].pointX = [];
                graphs[_strAprox+key].data[key3].pointY = [];
                graphs[_strAprox+key].data[key3].points = [];
                // calculate aproximate line                
                  if (value3.stepPointsAmount > 2){
                    // find aproximate rate of data in current step                     
                    // callculate available aproximate rate
                    var aproximateRate = Math.round((aproximateRatePercent/100) * (value3.stepPointsAmount));
                    if (aproximateRate < 2) {
                      aproximateRate = 2;
                    }
                    var aproximateBegin = Math.floor(aproximateRate/2);
                    var aproximateEnd = Math.ceil(aproximateRate/2);                    
                    // calculate aproximate dataY
                    for (var i=aproximateBegin; i < (value3.stepPointsAmount - aproximateEnd); i++){
                      var point;    
                      var currentPoint = 0;
                      var a = 0;
                      var b = 0;                             
                      var sumXY = 0;
                      var sumX = 0;
                      var sumY = 0;
                      var sumX2 = 0;               
                      for (var j= 0-aproximateBegin; j<aproximateEnd; j++ ){
                        sumXY += (i+j)*graphs[key].data[key3].dataY[i+j];
                        sumX += (i+j);
                        sumY += graphs[key].data[key3].dataY[i+j];
                        sumX2 += (i+j)*(i+j);
                      }
                      a = (aproximateRate*sumXY - sumX*sumY) / ( aproximateRate * sumX2 - sumX*sumX);
                      b = (sumY - a * sumX) / aproximateRate;
                      // calculate begin of data
                      if ( i === aproximateBegin){
                        // save beginner point
                        graphs[_strAprox+key].data[key3].dataY[0] = graphs[key].data[key3].dataY[0]; 
                        graphs[_strAprox+key].data[key3].pointX[0] = graphs[key].data[key3].pointX[0];
                        graphs[_strAprox+key].data[key3].pointY[0] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[0] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[0] + 
                          "," + graphs[_strAprox+key].data[key3].pointY[0];
                        graphs[_strAprox+key].data[key3].points.push(point);
                        if(aproximateBegin > 1){
                          for (var n=1; n < aproximateBegin; n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } // else { do nothing }
                      }    
                      // calculate aproximated valiu in current point
                      currentPoint = _.round( (a * i + b) , 3);
                      if (!isNaN(currentPoint)){
                        graphs[_strAprox+key].data[key3].dataY[i] = currentPoint; 
                        graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                        graphs[_strAprox+key].data[key3].pointY[i] = 
                          (availableMainHeight + chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                        graphs[_strAprox+key].data[key3].points.push(point);
                      }
                      var tempStepPointsAmount = value3.dataY.length;
                      // calculate end of data
                      if ( i === (tempStepPointsAmount - aproximateEnd -1) ){
                        var end = tempStepPointsAmount -1;
                        if( tempStepPointsAmount - aproximateEnd > 1){
                          for (var n = (end - aproximateEnd + 1); n < (end ); n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                                chartOptions.properties.paddingYTop - 
                                (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } else{ }
                          // end point from received data
                          graphs[_strAprox+key].data[key3].dataY[end] = graphs[key].data[key3].dataY[end]; 
                          graphs[_strAprox+key].data[key3].pointX[end] = graphs[key].data[key3].pointX[end];
                          graphs[_strAprox+key].data[key3].pointY[end] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[end] + 
                              Math.abs(minHeightValue))));
                          point = graphs[_strAprox+key].data[key3].pointX[end] + "," + graphs[_strAprox+key].data[key3].pointY[end];
                          graphs[_strAprox+key].data[key3].points.push(point);                        
                      }
                    }                  
                    // graphs[_strAprox+key].pointstodraw = String.concat(graphs[_strAprox+key].pointstodraw, 
                    //         " ",
                    //         graphs[_strAprox+key].data[key3].points.join(' ') );
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw +  
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
                  else{
                    // copy points from original data
                    for (var i=0; i < (graphs[key].stepPointsAmount); i++){
                      graphs[_strAprox+key].data[key3].dataY[i] = currentPoint;  
                      graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                      graphs[_strAprox+key].data[key3].pointY[i] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                      point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                      graphs[_strAprox+key].data[key3].points.push(point);
                    }    
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw + 
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
              }
            })    
        }) 
      }

      function calculateNewPointY(){
        // calculate 'point to draw'
        _.forEach(graphObjects, function(value, key){ 
          graphs[key].pointstodraw = '';
          graphs[_strAprox+key].pointstodraw = '';
          var firstFlag = true;
          _.forEach(graphs[key].data, function(value2, key2){
            for(var i=0; i < value2.dataY.length; i++){
              value2.pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              value2.points[i] = value2.pointX[i] + "," + value2.pointY[i];
              graphs[_strAprox+key].data[key2].pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[_strAprox+key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              graphs[_strAprox+key].data[key2].points[i] = 
                graphs[_strAprox+key].data[key2].pointX[i] + 
                "," + 
                graphs[_strAprox+key].data[key2].pointY[i];
            }
            // add pointstodraw to 'value.pointstodraw'
            if(firstFlag){
              graphs[key].pointstodraw
            }
            graphs[key].pointstodraw = 
              String(graphs[key].pointstodraw +  
              ' ' + 
              graphs[key].data[key2].points.join(' '));
            graphs[_strAprox+key].pointstodraw = 
              String(graphs[_strAprox+key].pointstodraw + 
              ' ' +
              graphs[_strAprox+key].data[key2].points.join(' '));            
          });          
        });        
      }

      // object to keep notches, which should be deleted from view
      var notchesToDelete = {};  
      function makeAxises( ){
        var zeroLine = calculateZeroLine();
        var zeroLineGraph = zeroLine.getLine();
        var zeroLineText = zeroLine.getText();
        var zeroNotch = zeroLine.getNotch();
        // copy previous lines delete old lines after
        notchesToDelete = _.cloneDeep(notches);    
        delete notchesToDelete.lastNotchValue;        // little fix. it should stay in obj 'notches'
        delete notchesToDelete.beginNotchX;           // little fix. it should stay in obj 'notches'
        svgTextToDelete = _.cloneDeep(svgTexts);        
        calculateYNotches();
        calculateXNotches(); 
        // clean 'notches' to delete
        if ( !_.isEmpty(notchesToDelete)){
          _.forEach(notchesToDelete, function(value, key){ 
            //console.log(" Notch to delete (id): " + value.id);   //
            delete notches[value.id];                 
          })
          // reset linesToDelete obj;
          notchesToDelete = {};
        } 
        if ( !_.isEmpty(svgTextToDelete)){
          _.forEach(svgTextToDelete, function(value, key){
            delete svgTexts[value.id];
          })               
          svgTextToDelete = {};
        }
        // add zero line
        graphs[zeroLineGraph.id] = zeroLineGraph;
        svgTexts[zeroLineText.id] = zeroLineText;
        notches[zeroNotch.id] = zeroNotch;
      };

      function calculateXNotches(){
          var xNotchString = "xNotch";   // id name word
          // for xNotch from 'paddingXLeft' to 'paddingXLeft + availableMainWidth'
          var paddingXLeft = chartOptions.properties.paddingXLeft;
          var notchWidth = chartOptions.properties.notchYWidth;
          var coordinateX = notches.beginNotchX;
          var y = chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom;
          var notchStep = chartOptions.properties.notchXStep;         
          for (var i=0; ((i<25) && (coordinateX < (paddingXLeft + availableMainWidth))); i++ ){
              var notch = {
                "id" : (xNotchString+i),
                "x1" : (coordinateX),
                "y1" : (y),
                "x2" : (coordinateX),
                "y2" : (y + notchWidth),
                "col" : "#1f1f1f",
                "width" : 1
              }
              // notches.lastNotchValue
              var textVal = String.toString(notches.lastNotchValue);
              var text = {
                  "id" : (xNotchString+i),
                  "text" : (notches.lastNotchValue + i*notchStep) ,
                  "x" : (coordinateX),
                  "y" : (y + notchWidth + oneSymbolHeight) ,
                  "col" : "#F44336"
                };
              notches[notch.id] = notch;
              delete notchesToDelete[notch.id];
              coordinateX += chartOptions.properties.updateXStep;
              svgTexts[text.id] = text;
              delete svgTextToDelete[text.id];
          }
      }

      // the least size between lines - 20 px
      function calculateYNotches(){
        // calculate amount of above 0x lines
        var availableNotchSteps = [5, 25, 50, 100, 500, 1000];
        var notchStringAbove = "aboveNotchX";
        var notchStringUnder = "underNotchX";        
        calculateNotchFor("+" , notchStringAbove, 1, maxHeightValue);
        calculateNotchFor("-" , notchStringUnder, -1, Math.abs(minHeightValue));
        // internal function. Is used only here
        function calculateNotchFor(sign , name, direction, heightValue){
          _.forEach(availableNotchSteps, function(value, key){
            var amount =  _.floor(heightValue / value) ;
            if( amount > 0){
              if (heightStep*value > 20){
                for(var i=1; i < (amount+1); i++){
                    var y = (chartOptions.properties.mainHeight - 
                      chartOptions.properties.paddingYBottom - 
                      Math.abs(minHeightValue*heightStep) -
                      direction*heightStep*value*i
                      );
                    var notch = {
                      "id" : (value+name+i),
                      "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
                      "y1" : (y),
                      "x2" : (chartOptions.properties.paddingXLeft),
                      "y2" : (y),
                      "col" : "#1f1f1f",
                      "width" : 1
                    }
                    var textVal = sign+value*i;
                    var text = {
                      "id" : (value+name+i),
                      "text" : (textVal) ,
                      "x" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth - (oneSymbolWidth * textVal.length)),
                      "y" : (y - 1) ,
                      "col" : "#F44336"
                    }
                    notches[notch.id] = notch;
                    delete notchesToDelete[notch.id];
                    svgTexts[text.id] = text;
                    delete svgTextToDelete[text.id];
                  }
              }
            };
          });
        }        
      };

      function calculateZeroLine( ){
        return {
          getLine : function (){
            return{
              "id":"0xaxis",
              "color": "#808080",
              "data": [ ],
              "pointstodraw": (chartOptions.properties.paddingXLeft) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) + 
                  " " + 
                  (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep))
            }
          },
          getText : function (){
            return {
              "text" : "0",
              "x" : (chartOptions.properties.paddingXLeft - oneSymbolWidth - chartOptions.properties.notchXWidth),
              "y" : (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) ,
              "col" : "#F44336"
            }
          },
          getNotch : function (){            
            var y = (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep));
            return {
              "id":"0xaxis",
              "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
              "y1" : (y),
              "x2" : (chartOptions.properties.paddingXLeft),
              "y2" : (y),
              "col" : "#1f1f1f",
              "width" : 1
            }
          }
        }
      };

      // draw rim around the chart
      function drawRim(){
        var rim = {
          "id":"rim",
          "color": "#4E342E",
          "data": [ ],
          "pointstodraw": (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) + 
              " " + 
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) +
              " " +
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom)
        }
        graphs[rim.id] = rim;
      };  
    }  
    function getGraph(){
      return graphs;
    }
    function getText(){
      return svgTexts;
    }
    function getNotch(){
      return notches;
    }
    return {
      makeStep : makeStep,
      getGraph : getGraph,
      getText : getText,
      getNotch : getNotch,
      init : init
    }
  }
])

var feedbackModalModule = angular.module('FeedbackModalModule',
	[]);


feedbackModalModule.factory('feedbackModalService', ['$uibModal', '$q',
	function($uibModal, $q){
		var dataString = "";
		function openModal(dataStr){
			var deferred = $q.defer();
			dataString = dataStr;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",
	  			controller: function($uibModalInstance){
	  				this.datamessage = dataString;	  				
	  				this.submit = function(){
	  					close(dataString);
	  				};
	  				function close(result) {     
				      $uibModalInstance.close(result);      
				    }
	  			},
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){ 	  			
				deferred.resolve(result);  				
	  		}, function(error){
      			// error contains a detailed error message.
	            deferred.reject(error);
	  		})
	  		return deferred.promise;
		}
		return {
			openModal : openModal
		}
	}
])