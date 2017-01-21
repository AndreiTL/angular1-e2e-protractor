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