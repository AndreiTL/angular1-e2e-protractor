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