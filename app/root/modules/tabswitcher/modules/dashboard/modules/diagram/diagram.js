
var diagramModule = angular.module('DiagramModule',[]);

diagramModule.controller('DiagramController', [ '$scope', '$state', 
  '$interval', 'ChartHelperService',
  function($scope, $state, $interval, ChartHelperService){
    var thisPointer = this;    
    var graphs = this.graphs;
    var svgtexts = this.svgtext;

    // object (streams, properties) from 'dashboardController'           
    this.mainwidth = this.chartOptions.properties.mainWidth;
    this.mainheight = this.chartOptions.properties.mainHeight;
       
    // initial data for graph object of chart
    var graphObjects = {};   
    // main data storage (from here polyline is drawn)
    var data = {};   
    // flag for first start graphObjects
    var firstStartGraphObjects = true; 
    var enableStep = false;
    var watcherOne = $scope.$watch( function(){return thisPointer.chartOptions.streams}, 
      function(newValue, oldValue){        
        enableStep = false;
        // init graphObjects if it isn't inited
        if (_.isEmpty(graphObjects)){
          if (!_.isEmpty(thisPointer.chartOptions.streams)){
            _.forEach(thisPointer.chartOptions.streams, function(value, key){ 
              graphObjects[key] = {
                "id": key,
                "color": value["color"],
                "aproximatecolor": value["aproximatecolor"]
              }
            })
            ChartHelperService.init(graphObjects, thisPointer.chartOptions);
          }
        }
        _.forEach(graphObjects, function(value, key){
          if(!data[key]){
            data[key] = {};
            data[key].id = key;
            data[key].color = value.color;
            data[key].data = {};
          }
          if(thisPointer.chartOptions.streamsProperties[key].updateStep > 0){
            enableStep = true;
          }
        })
        if (enableStep){
          ChartHelperService.makeStep(data, thisPointer.chartOptions);
        }
        // get calculated datas and send it to draw        
        thisPointer.graphs = ChartHelperService.getGraph();
        thisPointer.svgtexts = ChartHelperService.getText();
        thisPointer.notches = ChartHelperService.getNotch();
      },
      true
    );
    $scope.$on('$destroy', function(){
        watcherOne();
      }
    ); 
  }
])