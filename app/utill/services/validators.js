appServices.service('validatorsService', ['VALIDATORS', 'monthesStorage',
	function(VALIDATORS, monthesStorage){
		var _nameRegEx = VALIDATORS.NAME_VALIDATOR.NAME_REGEX;
		var _minage = VALIDATORS.AGE_VALIDATOR.MIN_AGE;
    	var _maxage = VALIDATORS.AGE_VALIDATOR.MAX_AGE;
    	var _ageRegex = VALIDATORS.AGE_VALIDATOR.AGE_REGEX;

    	var _dateRegEx = VALIDATORS.DATE_VALIDATOR.DATE_REGEX; 
	    var _separator = VALIDATORS.DATE_VALIDATOR.SEPARATOR;
	    var _minyear = VALIDATORS.DATE_VALIDATOR.MIN_YEAR;
	    var _maxyear = VALIDATORS.DATE_VALIDATOR.MAX_YEAR;
	    var _februarynumber = VALIDATORS.DATE_VALIDATOR.FEBRUARY_NUMBER;
	    var _februaryleapdays = VALIDATORS.DATE_VALIDATOR.FEBRUARY_LEAP_DAYS;
	    var _numyear = VALIDATORS.DATE_VALIDATOR.NUMBER_YEAR;
	    var _nummonth = VALIDATORS.DATE_VALIDATOR.NUMBER_MONTH;
	    var _numday = VALIDATORS.DATE_VALIDATOR.NUMBER_DAY;
    
		var _isvalid = false;
		var _parts = null;
		var _maxdays = 0;

		var monthes;

		return {
			namevalidator: function(value){
				var isvalid = false;
				if (_nameRegEx.test(value)){
		        	isvalid = true;		            
		        } else {		            
		            isvalid = false;
		        }
		        return isvalid;
			},
			agevalidator: function(value){
				var isvalid = false;
				if (value <= _maxage && value >= _minage && _ageRegex.test(value)){
		            isvalid = true;		            
		        } else {
		             isvalid = false;
		        }
		        return isvalid;
			},
			datevalidator : function(value){
				var _isvalid = false;
				monthes = monthesStorage.getMonthes();
		        if (_dateRegEx.test(value)){
		          _parts = value.split(_separator);
		          // check year
		          if(_parts[_numyear] > _minyear && _parts[_numyear] < _maxyear){            
		            // check february for leap year
		            if (_parts[_nummonth] === _februarynumber ){
		              if (monthesStorage.checkLeapYear(_parts[_numyear])){
		                _maxdays = _februaryleapdays;
		              } else{
		                _maxdays = monthes[_parts[_nummonth]].days;
		              }               
		            } else {
		                _maxdays = monthes[_parts[_nummonth]].days;	               
		            }
		            // check amount of days for max value
		            if (_parts[_numday] <= _maxdays && _parts[_numday] > 0){
		              _isvalid = true;
		            } else {
		              _isvalid = false;
		            }
		          } else {
		            _isvalid = false;
		          }          
		        } else {
		            _isvalid = false;
		        }
				return _isvalid;				
			}
		}
	}
]);