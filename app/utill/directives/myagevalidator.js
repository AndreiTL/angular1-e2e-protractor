appDirectives.directive('myagevalidator', ['validatorsService', 
  'htmlClassModifierService', 'VALIDATORS',
  function(validatorsService, htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',
      link: function(scope, element, attr, mCtrl){
        function myAgeValidator(value){          
          var result = validatorsService.agevalidator(value);
          if (result){
            mCtrl.$setValidity('ageFormat', true);
            // custom
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.removeClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return value;
          } else {
            mCtrl.$setValidity('ageFormat', false); 
            //custom
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.addClass(VALIDATORS.AGE_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);             
            return '';
          }
        }
        mCtrl.$parsers.push(myAgeValidator);
      }
    }
}])