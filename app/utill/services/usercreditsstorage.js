// save login of user
appServices.service('userCreditsStorage', function(){
	var userCredits = null;
	return {
		setUserCredits: function(credits){			
			userCredits = credits;
		},
		getUserCredits: function(){			
			return userCredits;
		}
	}
})