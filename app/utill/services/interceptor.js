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