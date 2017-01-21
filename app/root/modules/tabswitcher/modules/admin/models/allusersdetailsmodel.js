adminModule.service('allUsersDetailsModel', ['allUsersDetailsService', '$q',
	function(allUsersDetailsService , $q){
		var allUsersDetails = {};
		function deleteUser(login){
			var deferred = $q.defer();
			allUsersDetailsService.deleteUser(login).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}
			)
			return deferred.promise;
		}
		// login cann't be updated
		function updateUser(login, password, name, age, date, oldLogin){
			var deferred = $q.defer();
			allUsersDetailsService.updateUser(login, password, name, age, date, oldLogin).then(
				function successCallback(details){
					deferred.resolve();
				}, function errorCallback(){
					deferred.reject();
				}			
			);
			return deferred.promise;
		};
		function getDetails(){
			var deferred = $q.defer();			
			allUsersDetailsService.getAllUsersDetails().then(
				function successCallback(details){			
					allUsersDetails = {};
					_.forEach(details.usercredits, function (value, key){
						allUsersDetails[key] = {};
						allUsersDetails[key].login = key;
						allUsersDetails[key].password = value.password;
						allUsersDetails[key].name = details.userdata[key].name;
						allUsersDetails[key].age = details.userdata[key].age;
						allUsersDetails[key].date = details.userdata[key].date;
					})					
					deferred.resolve(allUsersDetails);
				} , function errorCallback(error){					
					allUsersDetails = {};
					deferred.reject(allUsersDetails);
				}
			)
			return deferred.promise;
		}
		return {
			getDetails: getDetails,
			updateUser: updateUser,
			deleteUser: deleteUser,
			addUser : updateUser
		}
	}
])