describe('login-check', function(){
	var properties = require("./login.json");
	it('open browser', function(done){
		browser.restart();
		browser.get(properties.main.link.login);
		done();		
	});
	
	it('close modal window', function(done){	
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		element(by.id('buttonok')).click();
		done();		
	});

	it('user1/user1 should login', function(done){
		element(by.model('vm.login')).sendKeys(properties.main.users.user1.login);
		element(by.model('vm.password')).sendKeys(properties.main.users.user1.password);
		element(by.id('loginform')).submit();		
		expect(browser.getCurrentUrl()).toBe(properties.main.link.main);
		done();		
	});

	it('user1/user1 should logout', function(done){
		element(by.id('logoutbtn')).click();
		expect(browser.getCurrentUrl()).toBe(properties.main.link.login);
		done();		
	});
})