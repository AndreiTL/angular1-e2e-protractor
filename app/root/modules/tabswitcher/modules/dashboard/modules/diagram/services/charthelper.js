diagramModule.service('ChartHelperService', [
	function(){
    var graphs = {};   
    var svgTexts = {};
    var notches = {};

    var graphObjects = {};     
    var heightStep = 1;     // 'y' - height step to draw chart (float)
    var maxHeightValue = 1;    // max height value2             (int)
    var minHeightValue = 0; // min height value2                (int)
    // var step = 1;             // 'x' step to draw chart         (int)      
    var idsArray = [];
    var idsAproxAray = [];
    var idsAllArray = [];
    var _strAprox = "aprox";
    // id value and generator for objects 'data' in 'graph'
    var _idCounter = 0;
    function _idGenerator(){
      return ++_idCounter;
    }
    // available dimensions for drawing chart
    var availableMainHeight;
    var availableMainWidth;
    // symbol dimensions:
    var oneSymbolWidth = 8; // 10 px
    var oneSymbolHeight = 14; // 14 px
    // object of initial data for chart
    var chartOptions;
    // init function for helper.
    function init(graphObj, chartOpt){
      graphObjects = graphObj;
      chartOptions = chartOpt;
      if( _.isEmpty(chartOptions.streams)){
          //console.log(" - object 'chartOptions.streams' is empty")		  
        } else {
          // init availableMainHeight and 
          availableMainHeight = chartOptions.properties.mainHeight - 
            (chartOptions.properties.paddingYTop + chartOptions.properties.paddingYBottom);
          availableMainWidth = chartOptions.properties.mainWidth - 
            (chartOptions.properties.paddingXLeft + chartOptions.properties.paddingXRight);

          _.forEach(chartOptions.streams, function(value, key){
            if (_.indexOf(idsArray, value.id) < 0){
              idsArray.push(value.id);
              idsAllArray.push(value.id);
              // init graph
              if (!graphs[key]){
                graphs[key] = {};
                graphs[key].id = value.id;
                graphs[key].color = value.color;
                graphs[key].aproximatecolor = value.aproximatecolor;
                graphs[key].data = {}; 
                graphs[key].pointstodraw = '';
                graphs[key].lastXValue = 0;
                notches.lastNotchValue = chartOptions.properties.notchXStartValue;
                notches.beginNotchX = chartOptions.properties.paddingXLeft;
              } 
            } //else { do nothing }
          })        
        }
    }

    function makeStep(data){
      var calculatedXMoveLeftStep = 0;
      var maxLastXValue = 0;      
      maxLastXValue = findMaxXValue();
      moveXToLeft();
      addNewDataY();
      findMaxAndMinY();      
      calculateAproximateLine();
      calculateNewPointY(); 
      drawRim();
      makeAxises();
      // functions :
      function findMaxXValue(){
        // look for value of 'maxLastXValue'
        _.forEach(graphObjects, function(value, key){
          if( graphs[key].lastXValue > maxLastXValue){
            maxLastXValue = graphs[key].lastXValue;
          }
        });
        return maxLastXValue;             
      }
      function moveXToLeft(){
        // array for data which should be deleted
        var dataIdToDelete = [];
        if( (maxLastXValue ) > availableMainWidth ){
          calculatedXMoveLeftStep = maxLastXValue  - availableMainWidth;
          // move previous data to left border on required value - calculate it
          var newBeginNotchX = notches.beginNotchX + (chartOptions.properties.updateXStep - calculatedXMoveLeftStep);
          notches.beginNotchX = newBeginNotchX;
          notches.lastNotchValue += chartOptions.properties.notchXStep;

          _.forEach(graphObjects, function(value, key){
            var newlastXValue = graphs[key].lastXValue - (calculatedXMoveLeftStep);            
            graphs[key].lastXValue = newlastXValue < 0  ? 0 : newlastXValue;
            var paddingXLeft = chartOptions.properties.paddingXLeft;
            _.forEach(graphs[key].data, function(value2, key2){              
                var flagToDelete = true;
                var idPointToDelete = -1;                
                for (var i=0; i < value2.dataY.length; i++){
                  // move left dataX value                  
                  value2.pointX[i] -= calculatedXMoveLeftStep;
                  graphs[_strAprox+key].data[key2].pointX[i] -= calculatedXMoveLeftStep;
                  if( value2.pointX[i] <= paddingXLeft){
                    idPointToDelete = i;
                  }
                  if (value2.pointX[i] > paddingXLeft){
                    flagToDelete = false;
                  }
                }
                // check if current dataObj all pointX < 0
                if(flagToDelete){
                  dataIdToDelete.push(key2);
                } else {
                  if (idPointToDelete >=0){
                    value2.dataY = _.drop(value2.dataY, 1+idPointToDelete);
                    value2.pointX = _.drop(value2.pointX, 1+idPointToDelete);
                    value2.pointY = _.drop(value2.pointY, 1+idPointToDelete);
                    value2.points = _.drop(value2.points, 1+idPointToDelete);
                    value2.stepPointsAmount -= idPointToDelete;
                    graphs[_strAprox+key].data[key2].dataY = _.drop(graphs[_strAprox+key].data[key2].dataY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointX = _.drop(graphs[_strAprox+key].data[key2].pointX, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].pointY = _.drop(graphs[_strAprox+key].data[key2].pointY, 1+idPointToDelete);
                    graphs[_strAprox+key].data[key2].points = _.drop(graphs[_strAprox+key].data[key2].points, 1+idPointToDelete);
                  }
                }                              
            })
            // delete dataObj with all pointX < 0
            _.forEach(dataIdToDelete, function(value3){
              delete graphs[key].data[value3];
              delete graphs[_strAprox+key].data[value3];
            })
            dataIdToDelete = [];
          })
        };             
      }

      function addNewDataY(){
        _.forEach(graphObjects, function(value, key){
          // amount of points in current step
          var tempUpdateStep = _.clone(chartOptions.streamsProperties[key].updateStep);          
          // add new points to graphs[key].lastXValue
          if(tempUpdateStep > 0){
            // increase lastXValue
            graphs[key].lastXValue += chartOptions.properties.updateXStep;
            // set to zero 'updateStep' in 'streamsProperties'
            chartOptions.streamsProperties[key].updateStep = 0;
            // process it
            if(tempUpdateStep > 0 ){
              var tempId = _idGenerator();
              // create object 'data' : graphs[key].data[tempId]
              graphs[key].data[tempId] = {};
              // get amount 'tempUpdateStep' last data from the stream
              var tempArray = _.takeRight(chartOptions.streams[key].data, tempUpdateStep);
              graphs[key].data[tempId].dataY = _.cloneDeep(tempArray);
              graphs[key].data[tempId].pointX = [];
              graphs[key].data[tempId].pointY = [];
              graphs[key].data[tempId].points = [];
              // amount of points in current step
              graphs[key].data[tempId].stepPointsAmount = tempUpdateStep;
              // length of current step per point (round to 0.001)
              graphs[key].data[tempId].stepX = 
                _.round(chartOptions.properties.updateXStep / tempUpdateStep , 3);
              
              var tempLastXValue = graphs[key].lastXValue - chartOptions.properties.updateXStep;
              for (var i=0; i < tempUpdateStep; i++){
                graphs[key].data[tempId].pointX[i] = chartOptions.properties.paddingXLeft +
                  tempLastXValue + graphs[key].data[tempId].stepX * i;
              }
            }
          }
        });        
      }
      
      function findMaxAndMinY(){
        var currentMinHeight = 0;
        var currentMaxHeight = 0;   
        _.forEach(graphObjects, function(value, key){           
          // calculate height step (look through all datas in graph)
          _.forEach(graphs[value.id].data, function(value2, key2){
              _.forEach(value2.dataY, function(value3, key3){
                var tempValue3 = parseInt(value3)
                if (currentMinHeight > tempValue3){
                  currentMinHeight = tempValue3;
                }
                if (minHeightValue > tempValue3){
                  minHeightValue = tempValue3;
                }
                if (currentMaxHeight < tempValue3){
                  currentMaxHeight = tempValue3;
                }
                if (maxHeightValue < tempValue3){
                  maxHeightValue = tempValue3;
                }
                // correct global max and min value
                if (minHeightValue < currentMinHeight){
                  minHeightValue++;
                }
                if (maxHeightValue > currentMaxHeight){
                  maxHeightValue--;
                }                
              })
          });
        });        
        // calculate heightstep
        heightStep = _.round(availableMainHeight / (maxHeightValue + Math.abs(minHeightValue)) , 9);
      }
      
      //calculate aproximate line and add it to graph
      function calculateAproximateLine(){
        var aproximateRatePercent = 21;
        _.forEach(graphObjects, function(value, key){
            if( !graphs[_strAprox+key]) {
              graphs[_strAprox+key] = {};
              graphs[_strAprox+key].pointstodraw = '';
              graphs[_strAprox+key].data = {};
              graphs[_strAprox+key].color = graphObjects[key].aproximatecolor;
            }
            _.forEach(graphs[key].data, function(value3, key3){              
              if ( ! graphs[_strAprox+key].data[key3] ) { // if undefined
                graphs[_strAprox+key].data[key3] = {};
                graphs[_strAprox+key].data[key3].dataY = [];
                graphs[_strAprox+key].data[key3].pointX = [];
                graphs[_strAprox+key].data[key3].pointY = [];
                graphs[_strAprox+key].data[key3].points = [];
                // calculate aproximate line                
                  if (value3.stepPointsAmount > 2){
                    // find aproximate rate of data in current step                     
                    // callculate available aproximate rate
                    var aproximateRate = Math.round((aproximateRatePercent/100) * (value3.stepPointsAmount));
                    if (aproximateRate < 2) {
                      aproximateRate = 2;
                    }
                    var aproximateBegin = Math.floor(aproximateRate/2);
                    var aproximateEnd = Math.ceil(aproximateRate/2);                    
                    // calculate aproximate dataY
                    for (var i=aproximateBegin; i < (value3.stepPointsAmount - aproximateEnd); i++){
                      var point;    
                      var currentPoint = 0;
                      var a = 0;
                      var b = 0;                             
                      var sumXY = 0;
                      var sumX = 0;
                      var sumY = 0;
                      var sumX2 = 0;               
                      for (var j= 0-aproximateBegin; j<aproximateEnd; j++ ){
                        sumXY += (i+j)*graphs[key].data[key3].dataY[i+j];
                        sumX += (i+j);
                        sumY += graphs[key].data[key3].dataY[i+j];
                        sumX2 += (i+j)*(i+j);
                      }
                      a = (aproximateRate*sumXY - sumX*sumY) / ( aproximateRate * sumX2 - sumX*sumX);
                      b = (sumY - a * sumX) / aproximateRate;
                      // calculate begin of data
                      if ( i === aproximateBegin){
                        // save beginner point
                        graphs[_strAprox+key].data[key3].dataY[0] = graphs[key].data[key3].dataY[0]; 
                        graphs[_strAprox+key].data[key3].pointX[0] = graphs[key].data[key3].pointX[0];
                        graphs[_strAprox+key].data[key3].pointY[0] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[0] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[0] + 
                          "," + graphs[_strAprox+key].data[key3].pointY[0];
                        graphs[_strAprox+key].data[key3].points.push(point);
                        if(aproximateBegin > 1){
                          for (var n=1; n < aproximateBegin; n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } // else { do nothing }
                      }    
                      // calculate aproximated valiu in current point
                      currentPoint = _.round( (a * i + b) , 3);
                      if (!isNaN(currentPoint)){
                        graphs[_strAprox+key].data[key3].dataY[i] = currentPoint; 
                        graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                        graphs[_strAprox+key].data[key3].pointY[i] = 
                          (availableMainHeight + chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                        point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                        graphs[_strAprox+key].data[key3].points.push(point);
                      }
                      var tempStepPointsAmount = value3.dataY.length;
                      // calculate end of data
                      if ( i === (tempStepPointsAmount - aproximateEnd -1) ){
                        var end = tempStepPointsAmount -1;
                        if( tempStepPointsAmount - aproximateEnd > 1){
                          for (var n = (end - aproximateEnd + 1); n < (end ); n++){
                            currentPoint = _.round( (a * n + b) , 3);
                            graphs[_strAprox+key].data[key3].dataY[n] = currentPoint; 
                            graphs[_strAprox+key].data[key3].pointX[n] = graphs[key].data[key3].pointX[n];
                            graphs[_strAprox+key].data[key3].pointY[n] = (availableMainHeight + 
                                chartOptions.properties.paddingYTop - 
                                (heightStep*(graphs[_strAprox+key].data[key3].dataY[n] + Math.abs(minHeightValue))));
                            point = graphs[_strAprox+key].data[key3].pointX[n] + 
                              "," + 
                              graphs[_strAprox+key].data[key3].pointY[n];
                            graphs[_strAprox+key].data[key3].points.push(point);
                          }
                        } else{ }
                          // end point from received data
                          graphs[_strAprox+key].data[key3].dataY[end] = graphs[key].data[key3].dataY[end]; 
                          graphs[_strAprox+key].data[key3].pointX[end] = graphs[key].data[key3].pointX[end];
                          graphs[_strAprox+key].data[key3].pointY[end] = (availableMainHeight + 
                              chartOptions.properties.paddingYTop - 
                              (heightStep*(graphs[_strAprox+key].data[key3].dataY[end] + 
                              Math.abs(minHeightValue))));
                          point = graphs[_strAprox+key].data[key3].pointX[end] + "," + graphs[_strAprox+key].data[key3].pointY[end];
                          graphs[_strAprox+key].data[key3].points.push(point);                        
                      }
                    }                  
                    // graphs[_strAprox+key].pointstodraw = String.concat(graphs[_strAprox+key].pointstodraw, 
                    //         " ",
                    //         graphs[_strAprox+key].data[key3].points.join(' ') );
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw +  
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
                  else{
                    // copy points from original data
                    for (var i=0; i < (graphs[key].stepPointsAmount); i++){
                      graphs[_strAprox+key].data[key3].dataY[i] = currentPoint;  
                      graphs[_strAprox+key].data[key3].pointX[i] = graphs[key].data[key3].pointX[i];
                      graphs[_strAprox+key].data[key3].pointY[i] = (availableMainHeight + 
                          chartOptions.properties.paddingYTop - 
                          (heightStep*(graphs[_strAprox+key].data[key3].dataY[i] + 
                          Math.abs(minHeightValue))));
                      point = graphs[_strAprox+key].data[key3].pointX[i] + "," + graphs[_strAprox+key].data[key3].pointY[i];
                      graphs[_strAprox+key].data[key3].points.push(point);
                    }    
                    graphs[_strAprox+key].pointstodraw = String(graphs[_strAprox+key].pointstodraw + 
                            " " +
                            graphs[_strAprox+key].data[key3].points.join(' ')) ;
                  }
              }
            })    
        }) 
      }

      function calculateNewPointY(){
        // calculate 'point to draw'
        _.forEach(graphObjects, function(value, key){ 
          graphs[key].pointstodraw = '';
          graphs[_strAprox+key].pointstodraw = '';
          var firstFlag = true;
          _.forEach(graphs[key].data, function(value2, key2){
            for(var i=0; i < value2.dataY.length; i++){
              value2.pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              value2.points[i] = value2.pointX[i] + "," + value2.pointY[i];
              graphs[_strAprox+key].data[key2].pointY[i] = (chartOptions.properties.paddingYTop + availableMainHeight - 
                (heightStep*(graphs[_strAprox+key].data[key2].dataY[i] + Math.abs(minHeightValue))))
              graphs[_strAprox+key].data[key2].points[i] = 
                graphs[_strAprox+key].data[key2].pointX[i] + 
                "," + 
                graphs[_strAprox+key].data[key2].pointY[i];
            }
            // add pointstodraw to 'value.pointstodraw'
            if(firstFlag){
              graphs[key].pointstodraw
            }
            graphs[key].pointstodraw = 
              String(graphs[key].pointstodraw +  
              ' ' + 
              graphs[key].data[key2].points.join(' '));
            graphs[_strAprox+key].pointstodraw = 
              String(graphs[_strAprox+key].pointstodraw + 
              ' ' +
              graphs[_strAprox+key].data[key2].points.join(' '));            
          });          
        });        
      }

      // object to keep notches, which should be deleted from view
      var notchesToDelete = {};  
      function makeAxises( ){
        var zeroLine = calculateZeroLine();
        var zeroLineGraph = zeroLine.getLine();
        var zeroLineText = zeroLine.getText();
        var zeroNotch = zeroLine.getNotch();
        // copy previous lines delete old lines after
        notchesToDelete = _.cloneDeep(notches);    
        delete notchesToDelete.lastNotchValue;        // little fix. it should stay in obj 'notches'
        delete notchesToDelete.beginNotchX;           // little fix. it should stay in obj 'notches'
        svgTextToDelete = _.cloneDeep(svgTexts);        
        calculateYNotches();
        calculateXNotches(); 
        // clean 'notches' to delete
        if ( !_.isEmpty(notchesToDelete)){
          _.forEach(notchesToDelete, function(value, key){ 
            //console.log(" Notch to delete (id): " + value.id);   //
            delete notches[value.id];                 
          })
          // reset linesToDelete obj;
          notchesToDelete = {};
        } 
        if ( !_.isEmpty(svgTextToDelete)){
          _.forEach(svgTextToDelete, function(value, key){
            delete svgTexts[value.id];
          })               
          svgTextToDelete = {};
        }
        // add zero line
        graphs[zeroLineGraph.id] = zeroLineGraph;
        svgTexts[zeroLineText.id] = zeroLineText;
        notches[zeroNotch.id] = zeroNotch;
      };

      function calculateXNotches(){
          var xNotchString = "xNotch";   // id name word
          // for xNotch from 'paddingXLeft' to 'paddingXLeft + availableMainWidth'
          var paddingXLeft = chartOptions.properties.paddingXLeft;
          var notchWidth = chartOptions.properties.notchYWidth;
          var coordinateX = notches.beginNotchX;
          var y = chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom;
          var notchStep = chartOptions.properties.notchXStep;         
          for (var i=0; ((i<25) && (coordinateX < (paddingXLeft + availableMainWidth))); i++ ){
              var notch = {
                "id" : (xNotchString+i),
                "x1" : (coordinateX),
                "y1" : (y),
                "x2" : (coordinateX),
                "y2" : (y + notchWidth),
                "col" : "#1f1f1f",
                "width" : 1
              }
              // notches.lastNotchValue
              var textVal = String.toString(notches.lastNotchValue);
              var text = {
                  "id" : (xNotchString+i),
                  "text" : (notches.lastNotchValue + i*notchStep) ,
                  "x" : (coordinateX),
                  "y" : (y + notchWidth + oneSymbolHeight) ,
                  "col" : "#F44336"
                };
              notches[notch.id] = notch;
              delete notchesToDelete[notch.id];
              coordinateX += chartOptions.properties.updateXStep;
              svgTexts[text.id] = text;
              delete svgTextToDelete[text.id];
          }
      }

      // the least size between lines - 20 px
      function calculateYNotches(){
        // calculate amount of above 0x lines
        var availableNotchSteps = [5, 25, 50, 100, 500, 1000];
        var notchStringAbove = "aboveNotchX";
        var notchStringUnder = "underNotchX";        
        calculateNotchFor("+" , notchStringAbove, 1, maxHeightValue);
        calculateNotchFor("-" , notchStringUnder, -1, Math.abs(minHeightValue));
        // internal function. Is used only here
        function calculateNotchFor(sign , name, direction, heightValue){
          _.forEach(availableNotchSteps, function(value, key){
            var amount =  _.floor(heightValue / value) ;
            if( amount > 0){
              if (heightStep*value > 20){
                for(var i=1; i < (amount+1); i++){
                    var y = (chartOptions.properties.mainHeight - 
                      chartOptions.properties.paddingYBottom - 
                      Math.abs(minHeightValue*heightStep) -
                      direction*heightStep*value*i
                      );
                    var notch = {
                      "id" : (value+name+i),
                      "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
                      "y1" : (y),
                      "x2" : (chartOptions.properties.paddingXLeft),
                      "y2" : (y),
                      "col" : "#1f1f1f",
                      "width" : 1
                    }
                    var textVal = sign+value*i;
                    var text = {
                      "id" : (value+name+i),
                      "text" : (textVal) ,
                      "x" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth - (oneSymbolWidth * textVal.length)),
                      "y" : (y - 1) ,
                      "col" : "#F44336"
                    }
                    notches[notch.id] = notch;
                    delete notchesToDelete[notch.id];
                    svgTexts[text.id] = text;
                    delete svgTextToDelete[text.id];
                  }
              }
            };
          });
        }        
      };

      function calculateZeroLine( ){
        return {
          getLine : function (){
            return{
              "id":"0xaxis",
              "color": "#808080",
              "data": [ ],
              "pointstodraw": (chartOptions.properties.paddingXLeft) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) + 
                  " " + 
                  (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
                  "," + 
                  (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep))
            }
          },
          getText : function (){
            return {
              "text" : "0",
              "x" : (chartOptions.properties.paddingXLeft - oneSymbolWidth - chartOptions.properties.notchXWidth),
              "y" : (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep)) ,
              "col" : "#F44336"
            }
          },
          getNotch : function (){            
            var y = (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom - Math.abs(minHeightValue*heightStep));
            return {
              "id":"0xaxis",
              "x1" : (chartOptions.properties.paddingXLeft - chartOptions.properties.notchXWidth),
              "y1" : (y),
              "x2" : (chartOptions.properties.paddingXLeft),
              "y2" : (y),
              "col" : "#1f1f1f",
              "width" : 1
            }
          }
        }
      };

      // draw rim around the chart
      function drawRim(){
        var rim = {
          "id":"rim",
          "color": "#4E342E",
          "data": [ ],
          "pointstodraw": (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) + 
              " " + 
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom) +
              " " +
              (chartOptions.properties.mainWidth - chartOptions.properties.paddingXRight) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," +
              (chartOptions.properties.paddingYTop) +
              " " +
              (chartOptions.properties.paddingXLeft) + 
              "," + 
              (chartOptions.properties.mainHeight - chartOptions.properties.paddingYBottom)
        }
        graphs[rim.id] = rim;
      };  
    }  
    function getGraph(){
      return graphs;
    }
    function getText(){
      return svgTexts;
    }
    function getNotch(){
      return notches;
    }
    return {
      makeStep : makeStep,
      getGraph : getGraph,
      getText : getText,
      getNotch : getNotch,
      init : init
    }
  }
])