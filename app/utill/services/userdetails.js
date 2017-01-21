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