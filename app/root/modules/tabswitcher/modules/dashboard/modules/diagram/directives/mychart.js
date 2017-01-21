diagramModule.directive('mychart', [ 
  function(){
    
    return {
      restrict: 'E',
      controller: 'DiagramController',
      controllerAs: 'chart',
      templateUrl: 'app/root/modules/tabswitcher/modules/dashboard/modules/diagram/diagram.html',       
      bindToController: {          
        chartOptions: '=chartOptions' 
      },   
      link: function (scope, element, attr, ctrl){        
        var chartAllPoints = attr.chartAllPoints;       
      }
    }
  }
])