
loadMaskModule.service('LoadMaskService', ['htmlClassModifierService',
  	function(htmlClassModifierService){
		function activateLoadMask(){
			htmlClassModifierService.removeClass("myloadmask", "hidden");
		};
		function deactivateLoadMask(){
			htmlClassModifierService.addClass("myloadmask", "hidden");
		};
		return {
			activateLoadMask : activateLoadMask,
			deactivateLoadMask : deactivateLoadMask
		}
	}
]);