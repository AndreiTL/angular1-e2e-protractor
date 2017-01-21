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