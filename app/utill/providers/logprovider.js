appProviders.provider('log', 
	function logProvider(){
		var time = new Date();
		var currentTimeMillis = time.getTime();	
		var timeStr = String(time.getHours() + ":" +
			time.getMinutes() + ":" +
			time.getSeconds() + ":" +
			time.getMilliseconds()
		);
		this.getTimeCreation = function(){			
			return timeStr;
		};		
		this.getTimeCreationMillis = function(){
			return currentTime;
		};
		this.$get = function(){				
			return new log();				
		};		
	}	
)