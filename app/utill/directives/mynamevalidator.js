appDirectives.directive('mynamevalidator', ['validatorsService',
 'htmlClassModifierService', 'VALIDATORS',  
  function(validatorsService,htmlClassModifierService, VALIDATORS){
    return {
      require: 'ngModel',      
      link: function(scope, element, attr, mCtrl){
        function myNameValidator(value){
          var result = validatorsService.namevalidator(value);
          if (result){
            mCtrl.$setValidity('nameFormat', true);   
            //custom   
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);
            htmlClassModifierService.removeClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME);            
            return value;
          } else {
            mCtrl.$setValidity('nameFormat', false); 
            //custom     
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.FORM_CLASS, 
              VALIDATORS.ERROR_INPUT_CLASS_NAME);  
            htmlClassModifierService.addClass(VALIDATORS.NAME_VALIDATOR.TABLE_CELL_CLASS, 
              VALIDATORS.ERROR_CELL_CLASS_NAME); 
            return '';
          }
        }
        mCtrl.$parsers.push(myNameValidator);
      }
    }
}])