
var adminDeleteUserModalModule = angular.module('AdminDeleteUserModalModule',
	[]);

adminDeleteUserModalModule.controller('AdminDeleteUserModal', 
  ['$translate', '$uibModalInstance', 'userLoginDelete',
  function($translate, $uibModalInstance, userLoginDelete) {     
    var deleteFlag = false;
    this.userLoginDelete = userLoginDelete;
   	this.submit = function(){
      deleteFlag = true;
  		close(deleteFlag);
  	}
  	this.cansel = function(){
  		close(deleteFlag);
  	}
    function close(deleteFlag) {     
      $uibModalInstance.close({deleteFlag : deleteFlag});      
    };
}]);