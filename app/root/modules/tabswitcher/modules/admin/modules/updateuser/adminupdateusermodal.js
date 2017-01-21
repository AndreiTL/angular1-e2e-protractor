
var adminUpdateUserModalModule = angular.module('AdminUpdateUserModalModule',
	[]);

adminUpdateUserModalModule.controller('AdminUpdateUserModal', 
  [ '$scope', '$uibModalInstance', 'userDetails', 
  	'userCreditsStorage',
  function( $scope, $uibModalInstance, userDetails, 
  	userCreditsStorage) {     
    // make clone to avoid unexpected changing
  	this.userdetails = _.clone(userDetails);
   	this.logindisabled = false;
		if ( String(userCreditsStorage.getUserCredits().login) === userDetails.login){
			this.logindisabled = true;
		}
  	this.submit = function(){
  		// read input data 
  		var resultData = {        
  			"login" : this.userdetails.login,
  			"password" : this.userdetails.password,
	  		"name" : this.userdetails.name,
	  		"age" : this.userdetails.age,
	  		"date" : this.userdetails.date
  		};
  		close(resultData);
  	}
  	this.cansel = function(){
  		close({});
  	}
    function close(result) {     
      $uibModalInstance.close(result);      
    };
}]);