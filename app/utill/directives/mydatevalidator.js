appDirectives.directive('mydatevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
	  return {
	    require: 'ngModel',
	    link: function (scope, element, attr, mCtrl){
	      function myDateValidator(value){         
          var result = validatorsService.datevalidator(value);
          if (result){
            mCtrl.$setValidity('dateFormat', true);    
            //custom 
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('dateFormat', false);
            //custom
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);   
            htmlClassModifierService.addClass(VALIDATORS.DATE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);
            return '';
          }
	      }
	      mCtrl.$parsers.push(myDateValidator);
	    } 
	  }
}])