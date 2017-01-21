// save different user data
appServices.service('userDataStorage', function(){
	var userData = {};
	return {
		setUserData: function(data, key){
			userData[key] = data;
		},
		getByKeyUserData: function(key){
			return userData[key];
		},
		getAllUserData: function(){
			return userData;
		},
		removeAll: function(){
			// delete userData;
			userData = null;
			userData = {};
		}
	}
})