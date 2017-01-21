app.config([ '$provide', function($provide){
		/*
			string into decorator have to be “{0} {1} – {2}{3}“ 
				where 
				{0} current date – “dd-MMM-yyyy”, 
				{1} – current time – “HH:MM:SS:MS”, 
				{2} – class name, 
				{3} – string that need to log
		*/
		var monthesStor = {
			"01":{"short":"JAN"},
			"02":{"short":"FEB"},
			"03":{"short":"MAR"},
			"04":{"short":"APR"},
			"05":{"short":"MAY"},
			"06":{"short":"JUN"},
			"07":{"short":"JUL"},
			"08":{"short":"AUG"},
			"09":{"short":"SEP"},
			"10":{"short":"OCT"},
			"11":{"short":"NOV"},
			"12":{"short":"DEC"}
		}
		var support = function(template, valuesArray){
			var result = new String(template);
			for (var val in valuesArray){
				result = result.replace("{"+val+"}", valuesArray[val]);
			}
			return result;
		}
		$provide.decorator('$log', [ '$delegate', 
			function($delegate){
				function currentTime(){		
					var time = new Date();
					var timeStr = String(time.getHours() + ":" +
						time.getMinutes() + ":" +
						time.getSeconds() + ":" +
						time.getMilliseconds()
					);
					return timeStr;
				};
				function currentDate(){
					var time = new Date();
					var date = time.getDate();
					var month = time.getMonth() + 1;
					date = date < 10 ? new String("0"+ date) : new String(date);
					monthStr = month < 10 ? monthesStor[new String("0"+ month)].short
						: monthesStor[new String(month)].short;					
					var dateStr = new String(date + "-" + 
						monthStr + "-" + 
						time.getFullYear());
					return dateStr;
				};
				function updateFunctions(object, className){
					function prepareFunction(object, funcName, className){
						return function () {			                
			                var now = String (currentTime() + " " + currentDate());		
			                var arg = !!(arguments[0]) ? new String(arguments[0]) : "";
			                className = className ? className : '';
			                console[funcName](support("{0} - {1} {2} ", [now, className, arg]));
			            };
					};
					object.log = prepareFunction(object, "log", className);
					object.info = prepareFunction(object, "info", className);
					object.warn = prepareFunction(object, "warn", className);
					object.debug = prepareFunction(object, "debug", className);
					object.error = prepareFunction(object, "error", className);
					return object;
				};
				$delegate.getInstance = function(className){
					className = (className !== undefined) ? className : "";
					$delegate = updateFunctions($delegate, className);
				};
				return $delegate;
			}
		])
	}
]);