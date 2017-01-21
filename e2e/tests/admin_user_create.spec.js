describe('Admin', function(){
	var properties = require("./admin_user_create.json");
	it('open browser', function(done){
		browser.restart();
		browser.get(properties.main.link.login);
		done();
	})

	it('user close modal window', function(done){
		// modal window is opened
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		element(by.css('button[ng-click="close(false)"]')).click();	
		done();
	})
	it('user(admin) login', function(done){
		element(by.model('vm.login')).sendKeys(properties.main.users.user1.login);
		element(by.model('vm.password')).sendKeys(properties.main.users.user1.password);
		element(by.css('form[ng-submit="vm.submit()"]')).submit(); // submit login form

		done();		
	})
	it('user should switch tab to "admin tab"', function(done){		
		expect(element(by.css('li[ui-sref=".admin"]')).isDisplayed()).toBe(true);
		element(by.css('li[ui-sref=".admin"]')).click();		
		done();
	})
	it('user check amount of available users on admin tab', function(done){
		var list = element.all(by.css('tr td[ng-bind="user.login"]'));
		expect(list.count()).toBe(properties.main.expected.amount1);		
		done();
	})
	it('user should open modal window "add new user"', function(done){
		element(by.id('adduserbtn')).click();
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		done();
	})
	it('user should enter data for new user and submit', function(done){
		element(by.model('vm.userdetails.login')).sendKeys(properties.main.details.user3.login);
		element(by.model('vm.userdetails.password')).sendKeys(properties.main.details.user3.password);
		element(by.model('vm.userdetails.name')).sendKeys(properties.main.details.user3.name);
		element(by.model('vm.userdetails.age')).sendKeys(properties.main.details.user3.age);
		element(by.model('vm.userdetails.date')).sendKeys(properties.main.details.user3.date);
		element(by.id('adduserform')).submit();
		done();
	})
	it('modal window "add new user" should be closed', function(done){		
		expect(element(by.className('modal-body')).isPresent()).toBe(false);
		done();
	})
	it('amount of available users on admin tab should be +1 ', function(done){
		list = element.all(by.css('tr[ng-repeat="user in vm.alldetails"]'));
		expect(list.count()).toBe(properties.main.expected.amount2);
		done();
	})
	it('should check new data in table of users on admin tab', function(done){
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.login')).getText()).toBe(properties.main.details.user3.login);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.password')).getText()).toBe(properties.main.details.user3.password);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.name')).getText()).toBe(properties.main.details.user3.name);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.age')).getText()).toBe(properties.main.details.user3.age);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.date')).getText()).toBe(properties.main.details.user3.date);
		done();
	})
	it('user should logout', function(done){
		element(by.id('logoutbtn')).click();
		done();
	})

	var hasClass = function(element, cls){
		return element.getAttribute('class').then(function(classes){
			return classes.split(' ').indexOf(cls) !== -1;
		})
	}
	it('restart browser', function(done){
		// function for looking for specified class in element classes
		browser.restart();
		done();
	})
	it('get page', function(done){
		browser.get(properties.main.link.login);
		done();
	})
	it('user close modal window', function(done){
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		element(by.css('button[ng-click="close(false)"]')).click();	
		done();
	})
	it('user(admin) login', function(done){
		element(by.model('vm.login')).sendKeys(properties.main.users.user1.login);
		element(by.model('vm.password')).sendKeys(properties.main.users.user1.password);
		element(by.id('loginform')).submit();
		done();
	})
	it('check login', function(done){
		expect(browser.getCurrentUrl()).toBe(properties.main.link.main);
		done();
	})
	it('user should switch tab to "admin tab"', function(done){
		expect(element(by.css('li[ui-sref=".admin"]')).isDisplayed()).toBe(true);
		element(by.css('li[ui-sref=".admin"]')).click();
		done();
	});
	var list;
	it('user should check amount of users', function(done){	
		list = element.all(by.css('tr[ng-repeat="user in vm.alldetails"]'));
		expect(list.count()).toBe(properties.main.expected.amount3);
		done();
	})
	it('should check previously created user', function(done){		
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.login')).getText()).toBe(properties.main.details.user3.login);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.password')).getText()).toBe(properties.main.details.user3.password);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.name')).getText()).toBe(properties.main.details.user3.name);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.age')).getText()).toBe(properties.main.details.user3.age);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.date')).getText()).toBe(properties.main.details.user3.date);	
		done();
	})
	it('should open update modal window for previously created user ', function(done){
		(((list.get(2)).element(by.id('actionbtns'))).element(by.css('button[ng-click="vm.update(user.login)"]'))).click();
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		done();
	})
	var login;
	var password;
	var name;
	var age;
	var date;
	it('input fields in opened update modal should be filled up by user data', function(done){
		login = element(by.model('vm.userdetails.login'));
		password = element(by.model('vm.userdetails.password'));
		name = element(by.model('vm.userdetails.name'));
		age = element(by.model('vm.userdetails.age'));
		date = element(by.model('vm.userdetails.date'));		
		expect(login.getAttribute('value')).toBe(properties.main.details.user3.login);
		expect(password.getAttribute('value')).toBe(properties.main.details.user3.password);
		expect(name.getAttribute('value')).toBe(properties.main.details.user3.name);
		expect(age.getAttribute('value')).toBe(properties.main.details.user3.age);
		expect(date.getAttribute('value')).toBe(properties.main.details.user3.date);
		done();
	})
	it('admin should enter new data to update user and submit', function(done){
		// enter login
		login.clear();
		login.sendKeys(properties.main.details.user4.login);
		// enter password
		password.clear();
		password.sendKeys(properties.main.details.user4.password);		
		//test name
		name.clear();		
		expect(hasClass(name, 'ng-invalid')).toBe(true);
		name.sendKeys('startlowcase');		
		expect(hasClass(name, 'ng-invalid')).toBe(true);
		name.clear();
		name.sendKeys('Alex');
		name.sendKeys('2');
		expect(hasClass(name, 'ng-invalid')).toBe(true);
		name.clear();
		name.sendKeys('Alex');
		name.sendKeys(' ');
		name.sendKeys('Rome');
		expect(hasClass(name, 'ng-invalid')).toBe(true);
		name.clear();	
		name.sendKeys(properties.main.details.user4.name);
		expect(hasClass(name, 'ng-valid')).toBe(true);			
		//test age
		age.clear();
		expect(hasClass(age, 'ng-invalid')).toBe(true);	
		age.clear();
		age.sendKeys('17');			// test min age
		expect(hasClass(age, 'ng-invalid')).toBe(true);	
		age.clear();
		age.sendKeys('66');			// test max age
		expect(hasClass(age, 'ng-invalid')).toBe(true);
		age.clear();
		age.sendKeys(properties.main.details.user4.age);
		expect(hasClass(age, 'ng-valid')).toBe(true);
		// test date
		date.clear();
		expect(hasClass(date, 'ng-invalid')).toBe(true);
		date.sendKeys('1899/09/29');	// test min date
		expect(hasClass(date, 'ng-invalid')).toBe(true);
		date.clear();
		date.sendKeys('2100/01/01');	// test max date
		expect(hasClass(date, 'ng-invalid')).toBe(true);		
		date.clear();
		date.sendKeys('2001/02/29');	// test not-leap 29 feb
		expect(hasClass(date, 'ng-invalid')).toBe(true);
		date.clear();
		date.sendKeys('2000/02/29');	// test leap 29 feb
		expect(hasClass(date, 'ng-valid')).toBe(true);
		date.clear();
		date.sendKeys(properties.main.details.user4.date);
		expect(hasClass(date, 'ng-valid')).toBe(true);
		// submit new data
		element(by.id('updateuserform')).submit();
		done();
	})
	it('modal window should be closed', function(done){
		expect(element(by.className('modal-body')).isPresent()).toBe(false);
		done();
	})
	it('amount of users should be the same', function(done){
		// check new values
		list = element.all(by.css('tr[ng-repeat="user in vm.alldetails"]'))
		expect(list.count()).toBe(properties.main.expected.amount4);
		done();
	})
	it('should check previously created user', function(done){		
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.login')).getText()).toBe(properties.main.details.user4.login);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.password')).getText()).toBe(properties.main.details.user4.password);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.name')).getText()).toBe(properties.main.details.user4.name);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.age')).getText()).toBe(properties.main.details.user4.age);
		expect(element(by.repeater('user in vm.alldetails').row(2).column('user.date')).getText()).toBe(properties.main.details.user4.date);
		done();
	})
	it('admin should logout', function(done){		
		element(by.css('button[ng-click="vm.logout()"]')).click(); 
		expect(browser.getCurrentUrl()).toBe(properties.main.link.login);
		done();
	});

	it('check login for new user', function(done){
		browser.restart();
		browser.get(properties.main.link.login);
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		element(by.css('button[ng-click="close(false)"]')).click();		
		element(by.model('vm.login')).sendKeys(properties.main.details.user4.login);
		element(by.model('vm.password')).sendKeys(properties.main.details.user4.password);
		element(by.css('form[ng-submit="vm.submit()"]')).submit(); // submit login form
		expect(browser.getCurrentUrl()).toBe(properties.main.link.main);
		done();
	})
	it('should logout', function(done){	
		element(by.css('button[ng-click="vm.logout()"]')).click();
		expect(browser.getCurrentUrl()).toBe(properties.main.link.login);
		done();
	});

	// tests for removing user
	it('user(admin) login', function(done){
		element(by.model('vm.login')).sendKeys(properties.main.users.user1.login);
		element(by.model('vm.password')).sendKeys(properties.main.users.user1.password);		
		element(by.css('form[ng-submit="vm.submit()"]')).submit(); // submit login form
		done();		
	})
	it('user should switch tab to "admin tab"', function(done){		
		expect(element(by.css('li[ui-sref=".admin"]')).isDisplayed()).toBe(true);
		element(by.css('li[ui-sref=".admin"]')).click();		
		done();
	})
	var list;
	it('admin check amount of available users on admin tab', function(done){
		list = element.all(by.css('tr[ng-repeat="user in vm.alldetails"]'));
		expect(list.count()).toBe(properties.main.expected.amount5);		
		done();		
	})
	it('should open delete modal window for previously created user ', function(done){
		(((list.get(2)).element(by.id('actionbtns'))).element(by.css('button[ng-click="vm.delete(user.login)"]'))).click();	
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		done();
	})
	it('should submit delete action on modal window', function(done){		
		element(by.css('button[type="submit"]')).click(); 
		expect(element(by.className('modal-body')).isPresent()).toBe(false);
		done();
	});
	it('admin check amount of available users on admin tab', function(done){
		list = element.all(by.css('tr[ng-repeat="user in vm.alldetails"]'));
		expect(list.count()).toBe(properties.main.expected.amount6);		
		done();		
	});
	it('admin try to delete himself ', function(done){
		(((list.get(0)).element(by.id('actionbtns'))).element(by.css('button[ng-click="vm.delete(user.login)"]'))).click();	
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		done();
	});
	it('should submit delete action on modal window', function(done){		
		element(by.css('button[type="submit"]')).click(); 
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		done();
	});
	it('should close error modal window', function(done){
		element(by.css('button[ng-click="close(false)"]')).click();
		done();
	});
	it('admin check amount of available users on admin tab', function(done){
		list = element.all(by.css('tr[ng-repeat="user in vm.alldetails"]'));
		expect(list.count()).toBe(properties.main.expected.amount6);		
		done();		
	})

})