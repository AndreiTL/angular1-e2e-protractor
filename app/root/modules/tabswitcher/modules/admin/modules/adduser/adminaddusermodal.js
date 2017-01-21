
var adminAddUserModalModule = angular.module('AdminAddUserModalModule',
	[]);

adminAddUserModalModule.controller('AdminAddUserModal', 
  ['$uibModalInstance', 'userCreditsStorage',
  function($uibModalInstance,  
  	userCreditsStorage) {     
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