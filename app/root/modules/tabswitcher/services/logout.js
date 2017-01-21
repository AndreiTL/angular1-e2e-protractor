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