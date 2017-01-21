var dashboardModule = angular.module('DashboardModule',
	['DiagramModule']);

dashboardModule.controller('DashboardController', ['$scope', '$state', '$interval',
  'userDataStorage', 'userDetailsService', 'loadChartDataService', 'LoadMaskService',
  function($scope, $state, $interval, userDataStorage, 
      userDetailsService, loadChartDataService, LoadMaskService){
    // show chart. stream from server
    var thisPointer = this;
    
    // initial parameters for charts: 
    var initParameters = {
      "1": {
        "stream":"/app/chartdata1", 
        "color":"#FFCC80", 
        "aproximatecolor":"#EF6C00"
      }, 
      "2": { "id": 2,
        "stream":"/app/chartdata2", 
        "color":"#80CBC4", 
        "aproximatecolor": "#00695C"
      }
    }

  /*  "maxAmountOfPoints" : 480,
      "updateTimeout" : 500,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStep" : 40,      - step in px per notch  
      "notchXName" : "point", - notch name
      "notchXWidth" : 5,      - width of notch-line      
      "notchYStep" : 100,   
      "notchYName" : "point", - notch name

      notice: chart height = main-height - (paddingYTop + paddingYBottom)
              chart width = main-width - (paddingXLeft + paddingXRight)  
  */    
    var chartProperties = {
      "mainWidth" : 480,
      "mainHeight" : 400,     
      "updateTimeout" : 1500,
      "updateXStep": 50,
      "paddingXLeft" : 40,
      "paddingXRight" : 20,
      "paddingYTop" : 10,
      "paddingYBottom" : 40,
      "notchXStartValue" : 10,
      "notchXStep" : 40,
      "notchXWidth" : 5,      
      "notchXName" : "point",      
      "notchYWidth" : 5,
      "notchYName" : "point",
    }

    var maxAmountOfPoints = chartProperties.mainWidth;    
    // timeout for redraw diagram
    var updateTimeout = chartProperties.updateTimeout; // ms
    // make graph object
    var graphObjects = {};
    _.forEach(initParameters, function(value, key){      
      graphObjects[key] = {
          "id": key,
          "stream": value.stream,
          "color": value.color,
          "aproximatecolor": value.aproximatecolor
      }      
    });
    // data storage for downloadded datas
    var dataDownloaded = {};
    var dataDownloadedProperties = {};
    // amount of points availale to make step
    var updateStep = 0;    
    // object-storage for $interval's
    var intervalObject;
    function destroyInterval(){      
        if (angular.isDefined(intervalObject)){
          $interval.cancel(intervalObject);
          intervalObject = undefined;
        }      
    }
    $scope.$on('$destroy', function(){
        destroyInterval();
      }
    );
    function startUpdate(){
      // deactivate load mask in case of showing diagram
      LoadMaskService.deactivateLoadMask();
      intervalObject = $interval(function(){
        thisPointer.chartOptions.properties = chartProperties;
        _.forEach(graphObjects, function(value, key){ 
          if (!dataDownloaded[key]){
            dataDownloaded[key] = {};
            dataDownloaded[key].id = key;
            dataDownloaded[key].data = [];
            dataDownloaded[key].color = value.color;
            dataDownloaded[key].aproximatecolor = value.aproximatecolor;
            dataDownloadedProperties[key] = {};
            dataDownloadedProperties[key].iswaitingload = false;
            dataDownloadedProperties[key].updateStep = 0; 
          }          
          if (!dataDownloadedProperties[key].iswaitingload){            
            dataDownloadedProperties[key].updateStep = 0;            
            dataDownloadedProperties[key].iswaitingload = true;
            // load data for current stream
            loadChartDataService.loadData(value.stream).then(
              function successCallBack( details ){
                dataDownloadedProperties[key].updateStep = details.data.length;
                dataDownloaded[key].data = _.concat(dataDownloaded[key].data , details.data);
                dataDownloadedProperties[key].iswaitingload = false;
                thisPointer.chartOptions.streams[key] = dataDownloaded[key];
              }, function errorCallBack(reason){
                // show error modal message                
                $state.go("root.login");                
              }
            )          
          }
        })
        var currentMaxLengthOfStream = 0;
        _.forEach(graphObjects, function(value, key){
          if (dataDownloaded[key].data.length > currentMaxLengthOfStream) {
            currentMaxLengthOfStream = dataDownloaded[key].data.length;
          }
          if (dataDownloadedProperties[key].updateStep > updateStep) {
            updateStep = dataDownloadedProperties[key].updateStep;
          }
        })
        var temp = currentMaxLengthOfStream - maxAmountOfPoints;
        if (temp > 0){
          _.forEach(graphObjects, function(value, key){
            dataDownloaded[key].data.splice(0, temp);
          })          
        }        
        userDataStorage.setUserData(dataDownloaded, "chartData");
        userDataStorage.setUserData(dataDownloaded, "chartDataProperties");
        userDataStorage.setUserData(chartProperties, "chartProperties");        
        thisPointer.chartOptions = { 
          "streams": dataDownloaded,
          "streamsProperties": dataDownloadedProperties,          
          "properties" : chartProperties        
        }        
      }, updateTimeout);
    }

    // take data from userStorage
    if (_.isEmpty(dataDownloaded)){      
      var temp = userDataStorage.getByKeyUserData("chartData");
      if (temp !== undefined){
        dataDownloaded = _.cloneDeep(temp);
        dataDownloadedProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartDataProperties"));
        chartProperties = _.cloneDeep(userDataStorage.getByKeyUserData("chartProperties"));
      }
      thisPointer.chartOptions = { 
        "streams": dataDownloaded,
        "streamsProperties": dataDownloadedProperties, 
        "properties" : chartProperties        
      } 
    }
    startUpdate();
  }
])