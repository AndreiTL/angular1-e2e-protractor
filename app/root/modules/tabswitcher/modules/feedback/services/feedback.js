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