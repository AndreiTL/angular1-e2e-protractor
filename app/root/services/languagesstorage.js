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