//monthes storage
appServices.service('monthesStorage', [ '$http', '$q',
	function($http, $q){
		var monthes;
		var _promiseLoad = _loadMonthes();
		function _loadMonthes(){			
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: "/app/public/date.json"
			}).then(function successCallback(response){
				// save monthes				
				deferred.resolve(response.data);
			}, function errorCallback(error){
				// error in monthes load 								
				deferred.reject( "Cann't receive date.json file." );
			}	
			)	
			return deferred.promise;
		}
		function getMonthes(){
			if (monthes === undefined){
				_promiseLoad.then(function(details){						
						monthes = details;						
						return monthes;
					}, 
					function(reason){
						// show modal error message.
						monthes = undefined;						
					}
				);				
			} else {				
				return monthes;
			}
		}
		function checkLeapYear(year){
			if ( (year) % 4 === 0 ){    
			    if (year % 100 === 0 && year % 400 !== 0){
			      return false;
				}
			    return true;   
			} else {
			    return false;
			}
		}
		return {
			getMonthes : getMonthes,
			checkLeapYear : checkLeapYear
		}
		
	}
])