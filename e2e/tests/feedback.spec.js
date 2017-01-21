describe('Feedback', function(){
	// open json file with line values
	var properties = require("./feedback.json");

	it('open browser', function(done){
		browser.get(properties.main.link.login);		
		done();
	});
	it('user close modal window', function(done){
		expect(element(by.className("modal-body")).isPresent()).toBe(true);
		element(by.css('button[ng-click="close(false)"]')).click();
		done();
	});
	it('user login', function(done){
		element(by.model("vm.login")).sendKeys(properties.main.login);
		element(by.model("vm.password")).sendKeys(properties.main.password);
		// element(by.id('loginform')).submit();
		element(by.css('form[ng-submit="vm.submit()"]')).submit();
		expect(browser.getCurrentUrl()).toBe(properties.main.link.main);
		done();
	});
	var name;
	var email;
	var message;
	it('user switch tab and see his data', function(done){
		element(by.css('li[ui-sref=".feedback"]')).click();
		name = element(by.model("vm.name"));
		email = element(by.model("vm.email"));
		message = element(by.model("vm.textarea"));
		name.sendKeys(properties.main.feedback.name);
		email.sendKeys(properties.main.feedback.email);
		message.sendKeys(properties.main.feedback.message);
		element(by.css('form[ng-submit="vm.sendemail()"]')).submit();
		done();
	});
	it('modal present check', function(done){
		expect(element(by.className("modal-body")).isPresent()).toBe(true);
		done();		
	});
	it('modal message check', function(done){		
		expect(element(by.binding("vm.datamessage")).getText()).toBe(properties.modal.text);
		done();		
	});
	it('modal window close by button "send"', function(done){	
		element(by.css('button[ng-click="vm.submit()"]')).click();
		done();		
	});
	it('modal shutdown check', function(done){
		expect(element(by.className("modal-body")).isPresent()).toBe(false);
		done();
	});
	it('input fields should be empty', function(done){
		name = element(by.model("vm.name"));
		email = element(by.model("vm.email"));
		message = element(by.model("vm.textarea"));
		expect(name.getAttribute('value')).toBe(properties.main.empty);
		expect(name.getAttribute('value')).toBe(properties.main.empty);
		expect(name.getAttribute('value')).toBe(properties.main.empty);
		done();
	});
})