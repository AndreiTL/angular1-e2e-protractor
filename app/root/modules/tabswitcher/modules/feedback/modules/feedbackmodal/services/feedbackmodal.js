
var feedbackModalModule = angular.module('FeedbackModalModule',
	[]);


feedbackModalModule.factory('feedbackModalService', ['$uibModal', '$q',
	function($uibModal, $q){
		var dataString = "";
		function openModal(dataStr){
			var deferred = $q.defer();
			dataString = dataStr;
			var modalInstance = $uibModal.open({
	  			animation: true,
	  			size: "md",
	  			templateUrl: "/app/root/modules/tabswitcher/modules/feedback/modules/feedbackmodal/feedbackmodal.html",
	  			controller: function($uibModalInstance){
	  				this.datamessage = dataString;	  				
	  				this.submit = function(){
	  					close(dataString);
	  				};
	  				function close(result) {     
				      $uibModalInstance.close(result);      
				    }
	  			},
	  			controllerAs: "vm"	  				  				
	  		});	
	  		modalInstance.result.then(function(result){ 	  			
				deferred.resolve(result);  				
	  		}, function(error){
      			// error contains a detailed error message.
	            deferred.reject(error);
	  		})
	  		return deferred.promise;
		}
		return {
			openModal : openModal
		}
	}
])