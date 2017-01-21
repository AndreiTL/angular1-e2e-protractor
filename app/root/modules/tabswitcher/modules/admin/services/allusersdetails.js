adminModule.service('allUsersDetailsService', ['$http', '$q', 'userCreditsStorage',
	function($http, $q, userCreditsStorage){
		var _userDetails = null;

		// function addNewUser(login, password, name, age, date){
			// function 'updateUser' is used in this case
		// }

		function deleteUser(login){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/deleteuser',
				data: {
					userdeletelogin : login
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				deferred.reject(error.status);
			})
			return deferred.promise;
		}
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/updateuserdata',
				data: {
					login : login, 
					password : password, 
					name : name, 
					age : age , 
					date : date,
					oldlogin : oldLogin
				}
			}).then(function successCallback(response){				
				deferred.resolve();
			}, function errorCallback(error){
				deferred.reject();
			})
			return deferred.promise;
		}
		function getAllUsersDetails(){
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: '/app/admin/getusersdata'
			}).then(function successCallback(response){
				// save user data							
				_userDetails = response.data;
				deferred.resolve(_userDetails);
			}, function errorCallback(response){
				userCreditsStorage.setUserCredits(null);
				deferred.reject(response.data);
			})
			return deferred.promise;
		}
		return {
			getAllUsersDetails : getAllUsersDetails,
			updateUser : updateUser,
			deleteUser : deleteUser
		}
	}
])