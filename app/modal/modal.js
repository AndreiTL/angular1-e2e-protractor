
var ModalModule = angular.module('ModalModule',[]);
ModalModule.controller('ModalController', 
  [ '$scope', '$translate', 'myModalWindowService', '$uibModalInstance',   
  function( $scope, $translate, myModalWindowService, $uibModalInstance) {
    $scope.close = function(result) {     
      $uibModalInstance.close();      
    };
}]);