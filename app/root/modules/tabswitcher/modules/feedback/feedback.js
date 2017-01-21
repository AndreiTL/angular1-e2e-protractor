var feedbackModule = angular.module('FeedbackModule',
	['FeedbackModalModule']);

feedbackModule.controller('FeedbackController', ['$state',
  'myModalWindowService', 'LoadMaskService', '$log', 
  'feedbackService', 'feedbackModalService',
  function($state, myModalWindowService, LoadMaskService, $log, 
  			feedbackService, feedbackModalService){      
	    var thisPointer = this;
	    $log.getInstance("Feedback");
	    thisPointer.sendemail = function(){		    
		    var data = {
		    	"from" : thisPointer.name,
			    "to" : thisPointer.email,
			    "content" : thisPointer.textarea
		    }
		    // process data		       
		    var processedData = "From: \"" + data.from + "\". " + 
				"To: \"" + data.to + "\". " + 
				"Content: \"" + data.content + "\".";		    
		    // open modal
			feedbackModalService.openModal(processedData).then(
				function successCallBack(resultMessage){					
					LoadMaskService.activateLoadMask();
					var jsonResultMessage = {
				    	"from" : thisPointer.name,
					    "to" : thisPointer.email,
					    "content" : thisPointer.textarea
				    }
				    // read all available email in address-email and try send 
				    //untill it will be sent
					// method from decorator is called
					var toArray = jsonResultMessage.to.split(",");
					feedbackService.setContent(jsonResultMessage.content);
					feedbackService.sendFromDecorator(
							jsonResultMessage.from, 
							toArray ).then(
						function successCallBack(result){
							LoadMaskService.deactivateLoadMask();
							$log.info("Feedback is sent.");
							// clear feedback form
							thisPointer.name = "";
		    				thisPointer.email = "";
		    				thisPointer.textarea = "";
							//ok
						}, function errorCallBack(error){
							// don't clear feedback form
							LoadMaskService.deactivateLoadMask();		
							$log.warn("Feedback cann't be sent.");
							// show modal error
							myModalWindowService.showModal("type20");
						}
					)
				}, function errorCallBack(error){
					// don't send
					// don't clear feedback form
					// log	
					$log.log("Feedback wasn't sent. Canseled.");				
				}
			)
	    }     
  }
])