var express = require('express');
var parseurl = require('parseurl');
var session = require('express-session');
var bodyparser = require('body-parser');
var fs = require('fs');
var path = require('path');

var expr = express();

// time to live session 
var minute = 60000;
var timeToLive = minute*15;

// user data storage (source)
var userdao;
var usercredentionals;

// response delay
var responseTimeOut = 700; //ms

// READ 'data.json' ONLY ONE TIME AT FIRST REQUEST. THEN USE 'userdao' THAT SAVE ALL CHANGES IN MEMORY.
function readUsersData(){
    if (userdao === undefined) {
      // check user for register
      fs.readFile(__dirname + '/data/data.json', function(err, data){
        if (err) {
         return console.error(err);
        }    
        userdao = JSON.parse(data);
        console.log("User data is read.");
        })        
    }
    if (usercredentionals === undefined){
      fs.readFile(__dirname + '/data/credentionals.json', function(err, data){
        if (err) {
         return console.error(err);
        }    
        usercredentionals = JSON.parse(data);
        console.log("User credentionals is read.");
        })   
    }
}
readUsersData();

// add body parser for parsing request body
expr.use(bodyparser.json());

expr.use('/', express.static(__dirname + '/'));

// session settings
expr.use(session({
    cookie: {
      _expires : new Date(Date.now() + timeToLive),
      originalMaxAge : timeToLive*5
    },
    secret: 'keyboard cat',
    resave: true,
    rolling: true,
    saveUninitialized: false
}));


expr.post("/app/checksession", function(req, res){
	var tempSessionLogin = req.session.userlogin
  res.setTimeout(responseTimeOut, function(){
    if( !!tempSessionLogin ){    
      // res.statusCode = 200;
      // res.send({"login": req.session.userlogin});
      var bool = checkAdminRights(tempSessionLogin);
        if (bool){
            res.status(200).json({"login": tempSessionLogin, "admin": true});
        } else {          
            res.status(200).json({"login": tempSessionLogin});          
        }
    } else{
      res.statusCode = 401;
      res.send("");
    }
    res.end();
  });  
})

expr.post("/app/login", function(req, res){    
    console.log(req.body);
    var loginreq = req.body.login;
    var passwordreq = req.body.password; 
    if (checkLogin(loginreq, passwordreq)){   
      // save login in session     
      req.session.userlogin = loginreq;      
      res.setTimeout(responseTimeOut, function(){        
        var bool = checkAdminRights(loginreq);
        if (bool){
          res.status(200).json({admin: true});
        } else {
          res.status(200).json({});
        }
      });      
    } else {            
      res.setTimeout(responseTimeOut, function(){
        res.statusCode = 401;
        res.statusMessage = "relogin";
        res.send("");
      }); 
    }    
})

expr.use("/app/logout", function(req,res){

  res.setTimeout(responseTimeOut, function(){
    req.session.destroy();
    res.statusCode = 200;
    res.send("");
    res.end();
    console.log (" User logouted. ");
  });
})

expr.post("/app/admin/getusersdata", function(req, res){
  var login = req.session.userlogin;
  var bool = checkAdminRights(login);
  // console.log("Provide admin access: " + bool);
  res.setTimeout(responseTimeOut, function(){  
    if (bool){
      var responseJson = {
        "userdata" : userdao.users,
        "usercredits" : usercredentionals.users 
      };
      res.json(responseJson);
    } else {
      res.statusCode = 403;
      res.send("");      
      // res.statusMessage = "relogin";    
    }
  });
});
expr.post("/app/admin/updateuserdata", function(req, res){
  var loginSession = req.session.userlogin;  
  var bool = checkAdminRights(loginSession);
  res.setTimeout(responseTimeOut, function(){  
    if (bool ){
      var login = req.body.login;
      var password = req.body.password;
      var name = req.body.name;
      var age = req.body.age;
      var date = req.body.date;
      // if 'req.body.oldlogin' present - use it. 
      // Othewise use 'req.body.login'.
      var loginToUpdate = !!req.body.oldlogin ? req.body.oldlogin : login;      
      if ( !!login && loginSession !== loginToUpdate){
        // in this case have to delete old data
        if (login !== loginToUpdate){          
          delete usercredentionals.users[loginToUpdate];
          delete userdao.users[loginToUpdate];
        }
        // create if not exist
        if (!usercredentionals.users[login]){
          usercredentionals.users[login] = {};
          userdao.users[login]={}
          console.log("User \'" + login + "\' was created.")
        };
        usercredentionals.users[login] = {"password" : password};
        userdao.users[login] = { "name" : name,
            "age" : age,
            "date" : date
          };
        console.log("Update \'" + login + "\' user : " + JSON.stringify(userdao.users[login]) + 
          " User credits: " + JSON.stringify(usercredentionals.users[login])) 
        res.statusCode = 202;
        res.send("");  
      } else {
        res.statusCode = 400;
        res.send("Bad request"); 
      }
    } else {
      res.statusCode = 403; // forbidden
      res.send("");  
    }
  });    
});
expr.post("/app/admin/deleteuser", function(req, res){
  var login = req.session.userlogin;
  var deletelogin = req.body.userdeletelogin;
  var bool = checkAdminRights(login);
  res.setTimeout(responseTimeOut, function(){  
    if (bool && String(login)!==String(deletelogin)){
      delete userdao.users[deletelogin];
      delete usercredentionals.users[deletelogin];
      console.log("User \'" + deletelogin + "\' was deleted.");
      res.statusCode = 202;
      res.send(""); 
    } else {
      res.statusCode = 403;
      res.send("");      
      // res.statusMessage = "relogin";    
    }
  });
});
// expr.post("/app/admin/adduser", function(req, res){
//   var bool = checkAdminRights();
//   if (bool){
//     var login = req.body.login;
//     var password = req.body.password;
//     var name = req.body.name;
//     var age = req.body.age;
//     var date = req.body.date;

//     if ( !!login ){
//       usercredentionals.users = {login : {"password" : password}};
//       userdao.users = {login : 
//         { "name" : name,
//           "age" : age,
//           "date" : date
//         }
//       };
//       res.statusCode = 202;
//       res.send("");  
//     } else {
//       res.statusCode = 400;
//       res.send("Bad request"); 
//     }


//   } else {
//     res.statusCode = 403; // forbidden
//     res.send("");  
//   }
// });


function checkAdminRights(userLogin){
  if (userLogin !== null &&
      userLogin !== undefined &&
      userLogin === usercredentionals.admin){
    return true;
  } else {
    return false;
  }
}

expr.post("/app/feedback/send", function(req, res){
    if (req.session.userlogin !== null && req.session.userlogin !== undefined){
      
      res.setTimeout(responseTimeOut, function(){     
        var acceptGen = Math.round(Math.random());  // random generator to accept email or not
        if (acceptGen === 1){ // case: accept email
          console.log("Feedback : " + JSON.stringify(req.body));
          res.statusCode = 200;
          res.send("");
        } else {              // case: not accept email
          console.log("Declined feedback: " + JSON.stringify(req.body));
          res.statusCode = 406;
          res.send("");
        }
      });
    } else {
      res.setTimeout(responseTimeOut, function(){
        res.statusCode = 401;
        res.send("");      
        res.statusMessage = "relogin";
      });
    }
})

expr.post("/app/userdetails", function(req, res){
    if (req.session.userlogin !== null && req.session.userlogin !== undefined){
      var userdata = userdao.users[req.session.userlogin]; 
      res.setTimeout(responseTimeOut, function(){     
        res.json(userdata);
      });
    } else {
      res.setTimeout(responseTimeOut, function(){
        res.statusCode = 401;
        res.send("");      
        res.statusMessage = "relogin";
      });
    }
})

expr.post("/app/updateuserdetails", function(req, res){
  if (req.session.userlogin !== null && req.session.userlogin !== undefined){

    console.log(" newUserName:" + req.body.newusername);
    console.log(" newUserAge:" + req.body.newuserage);
    console.log(" newUserDate:" + req.body.newuserdate);

    var userlogin = req.session.userlogin;

    userdao.users[userlogin].name = req.body.newusername;
    userdao.users[userlogin].age = req.body.newuserage;
    userdao.users[userlogin].date = req.body.newuserdate;

    res.setTimeout(responseTimeOut, function(){
      res.statusCode = 202;
      res.send("");
      res.end();
    });
  } else {
    res.setTimeout(responseTimeOut, function(){
      res.statusCode = 401;
      res.send("");
      res.end();
    });
  }
})


var chart1; 
var chart2; 
var _dataLength = 30; // max amount of point, which will be generated
var _allowedDeviationProcent = 9; // procent from maxValue
var _allowedStepDeviationProcent = 7; // procent from maxValue
var _stepMinValue = 2;  // max step to deviate
var _stepMaxValue = 16; // max step to deviate

// chart service
expr.post("/app/chartdata1", function(req, res){
	var responseJson = {};
	if (!chart1){
		chart1 = new ChartProvider(20, 320, _dataLength);		
	}	

  if (req.session.userlogin !== null && req.session.userlogin !== undefined){    
  	responseJson = chart1.getChartJson();
  	res.json(responseJson);
  	// res.end();
  } else {
    res.statusCode = 401;
    res.send("");      
    res.statusMessage = "relogin";
  }
})

expr.post("/app/chartdata2", function(req, res){
	var responseJson = {};
	if (!chart2){
		chart2 = new ChartProvider(10, 200, _dataLength);		
	}
  if (req.session.userlogin !== null && req.session.userlogin !== undefined){
    responseJson = chart2.getChartJson();
    res.json(responseJson);
    // res.end();      
  } else {
    res.statusCode = 401;
    res.send("");      
    res.statusMessage = "relogin";
  }
})


function ChartProvider( minValue, maxValue, dataLength){
	
	var _minValue = minValue;
	var _maxValue = maxValue;	
	var dataGenerator = new DataGenerator(_minValue, _maxValue, dataLength);


	return {
		getChartJson : function(){
			// generate data
			// convert to json. return it.
			return {
				"data": dataGenerator.getData()
			}				
		}
	}
}

function DataGenerator(minValue, maxValue, length){
  

	var initValue;
	var _startStepValue; // begin y
	var _endStepValue;	// end y
	var _stepCounter;	// counter x
	var _step;		// current x step length
	var _allowedDeviation;	// allowed y deviation
	var _stepSign;	// step y sign
	var _stepDeviate; 	//  y deviate in cuurent step 

	function _gen_initValue(){
      do {
        initValue = Math.floor(Math.random()*(maxValue - minValue) + minValue);
      } while (initValue < minValue || initValue>maxValue);   
    }
    function _gen_step(){
      // do {
        _step = 1 + Math.round(Math.random()*(_stepMaxValue - _stepMinValue) + _stepMinValue);
        _stepCounter = _step;
      // } while (_step < _stepMinValue);
    }
    function _gen_stepDeviate(){
      _stepDeviate = Math.floor(maxValue * _allowedStepDeviationProcent / 100);       
    }
    function _gen_stepSign(){
      _stepSign = !!Math.round(Math.random());
    }
    function _gen_allowedDeviation(){
      _allowedDeviation = Math.floor(maxValue * _allowedDeviationProcent / 100);
    }

	if (!initValue){
      _gen_initValue();   
      _gen_stepDeviate();
      _gen_step();
      _gen_stepSign();
      _gen_allowedDeviation();
      _startStepValue = initValue;
      _endStepValue = _startStepValue + _step;

    }

	function _calculateNext(){
      var result = 0;
      // calculate step variation
      var _stepVar;
      if (_stepSign){
        _stepVar = Math.floor( (_step - _stepCounter) * _stepDeviate / _step );
      } else {
        _stepVar = 0 - Math.floor( (_step - _stepCounter) * _stepDeviate / _step );
      }

      // calculate result value
      if (!!Math.round(Math.random())){
        result = _startStepValue + Math.round(Math.random()*_allowedDeviation) + _stepVar;
      } else {
        result = _startStepValue - Math.round(Math.random()*_allowedDeviation) + _stepVar;
      }
      if (result > maxValue){
        _stepSign = false; // decrease order
        _stepDeviate += 2; 
      }
      if (result < minValue){
        _stepSign = true; // increase order
        _stepDeviate += 4; 
      }
      return result;
    }

	function nextValue(){
      var value;
      if(!!_stepCounter){
        value = _calculateNext();
        _stepCounter--;

      } else {
        _gen_step();
        _startStepValue = _endStepValue;
        _gen_stepDeviate();
        _gen_stepSign();      
        if (_stepSign){
          _endStepValue = _startStepValue + _stepDeviate
        } else {
          _endStepValue = _startStepValue - _stepDeviate
        } 
        if (_endStepValue > maxValue){
          _stepSign = false; // decrease order
        } else {
          _stepSign = true; // increase order
        }
        value = _calculateNext();
      }   
      return value;
    };
	function generateNextArray(){      
      // generate amount of point in current step
      var amountOfPoints = 4 + Math.round((length-1)* Math.random());

      // var array = new Array(amountOfPoints);      //amountOfPoints
      var array = [];      //amountOfPoints

      for (var i=0; i<amountOfPoints; i++){
        array[i] = nextValue();
      }
      return array;
    };
    return {
      getData: function(){
        var currentArray = generateNextArray();
        return currentArray;
      }
    }
	// console.log(" -- responseJson from generator " + JSON.stringify(responseJson));
	return JSON.stringify(responseJson);
}

// function for checking login properties
function checkLogin(loginreq, passwordreq){        
    var userlogined = usercredentionals.users[loginreq];
    var passed = false;
    if ( userlogined !== undefined){
     if (passwordreq !== '' && passwordreq !== undefined){
       if (passwordreq ===  userlogined.password){
         passed = true;
       }
     }
    }
    console.log(" Logining is enabled: " + passed);  
    return passed; 
};

// messages in console of nodejs
console.log("To stop program press 'Ctrl+C'.");
console.log("Application is started on 'localhost:8080'.");
var app = expr.listen(8080);

module.exports = app;