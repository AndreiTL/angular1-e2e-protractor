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