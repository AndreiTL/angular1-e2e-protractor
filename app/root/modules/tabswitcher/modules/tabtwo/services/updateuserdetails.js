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