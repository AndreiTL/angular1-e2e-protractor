
var adminModule = angular.module('AdminModule',
	['AdminAddUserModalModule', 'AdminDeleteUserModalModule', 'AdminUpdateUserModalModule']);

adminModule.controller('AdminController', [ 'allUsersDetailsModel',
	'$uibModal', 'userCreditsStorage', 'myModalWindowService',
	'LoadMaskService', '$log', 
	function(allUsersDetailsModel, $uibModal, userCreditsStorage,
			myModalWindowService, LoadMaskService, $log){
		var thisPointer = this;
		var allUsersDetails = null;
		$log.getInstance("Admin");
		// load data about all users. 
		loadUsersDetails();
		// show in table.
		function loadUsersDetails(){
			LoadMaskService.activateLoadMask();
			allUsersDetailsModel.getDetails().then(
				function successCallBack(details){	
					$log.info("Users data was loaded.");
					thisPointer.alldetails = details;
					allUsersDetails = details;
					LoadMaskService.deactivateLoadMask();					
				} , 
				function errorCallBack(){
					LoadMaskService.deactivateLoadMask();
					$log.warn("Users data loading error.");
					// show modal about error
					myModalWindowService.showModal("type10");
					// send redirect if user hasn't admin access					
					// or redirect him to anywhere
				}
			);
		}
		// add new user
		thisPointer.adduser = function (login, password, name, age, date){
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/adduser/modaladd.html",
	  			controller: "AdminAddUserModal",
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if (!_.isEmpty(result)){									
					// activate loadmask	  			
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.addUser(result.login, 
							result.password, result.name, result.age, result.date).then(
						function successCallBack(){
							$log.info("New user \'" + result.login + "\' was added.");
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
							// deactivate loadmask
						}, function errorCallBack(){
							$log.warn("User \'" + result.login + "\' creation error.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type13");							
						}
					)	  				
	  			}
	  		}, function(error){      			
				// myModalWindowService.showModal("type13");
	  		})
		}
		// update user
		thisPointer.update = function (login){
			// login, password, name, age, date
			// open modal window for updating fields
			var isAdmin = userCreditsStorage.getUserCredits().admin;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/updateuser/modalupdate.html",
	  			controller: "AdminUpdateUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userDetails : function(){	  					
	  					return allUsersDetails[login];
	  				}
	  			}	  				
	  		});	
	  		modalInstance.result.then(function(result){ 
	  			if (!_.isEmpty(result)){
					// activate loadmask

	  				LoadMaskService.activateLoadMask();					
					allUsersDetailsModel.updateUser(result.login, 
							result.password, result.name, result.age, result.date, login).then(
						function successCallBack(){							
							$log.info("Update user. Submited data: " + JSON.stringify(result));
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();						
						}, function errorCallBack(){
							$log.warn("User cann't be updated.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type12");							
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	  		})
		}
		// delete user
		thisPointer.delete = function (login){			
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/admin/modules/deleteuser/modaldelete.html",
	  			controller: "AdminDeleteUserModal",
	  			controllerAs: "vm",
	  			resolve : {
	  				userLoginDelete : function(){	  					
	  					return login;
	  				}
	  			}	  				  				
	  		});	
	  		modalInstance.result.then(function(result){
	  			if ( result.deleteFlag ){
					LoadMaskService.activateLoadMask();
					allUsersDetailsModel.deleteUser(login).then(
						function successCallBack(){
							$log.info("User was deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							loadUsersDetails();
						}, function errorCallBack(){
							$log.warn("User cann't be deleted.");
							// deactivate loadmask
							LoadMaskService.deactivateLoadMask();
							// show modal error
							myModalWindowService.showModal("type11");
						}
					)	  				
	  			}
	  		}, function(error){
      			// error contains a detailed error message.
	  		})
		}
	}
])