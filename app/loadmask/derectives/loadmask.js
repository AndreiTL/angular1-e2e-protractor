loadMaskModule.directive('loadmask',[
	function () {
		
		return {
			restrict: 'E',
			templateUrl: 'app/loadmask/loadmask.html',
			controller: function(){
				console.log(" Load mask is shown.")
			},
			link: function(scope, element, attr, ctrl){

			}
		}		
	}
])