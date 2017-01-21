appServices.service('htmlClassModifierService', [ function(){
	return {
		addClass : function(classSelector, classToAdd){
			angular.element(document.querySelector("."+classSelector)).addClass(classToAdd);
		},
		removeClass : function(classSelector, classToRemove){
			angular.element(document.querySelector("."+classSelector)).removeClass(classToRemove);
		}
	}	
}])
