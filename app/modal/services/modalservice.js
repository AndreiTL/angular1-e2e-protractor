ModalModule.service('myModalWindowService', ['$uibModal', '$rootScope',
	function($uibModal, $rootScope){
		var _ispresent = false;
		function showModal(errorType){
			if ( !_ispresent){
				_ispresent = true;
		  		var isolation = true;
		  		var modalScope = $rootScope.$new(isolation);
		  		modalScope.errortype = 'errormodalwindow.message.'+errorType;
		  		var modalInstance = $uibModal.open({
		  			animation: true,
		  			size: "sm",
		  			templateUrl: "/app/modal/modal.html",
		  			controller: "ModalController",
		  			scope: modalScope		  			
		  		});		  		
		  		modalInstance.result.then(function(){		  			
		  			_ispresent = false;
		  			modalScope.$destroy();
		  		}, function(error){
          			// error contains a detailed error message.		            
		            _ispresent = false;
		  		})
			}
		}
		return{
			showModal : showModal			
		}
	}
]);