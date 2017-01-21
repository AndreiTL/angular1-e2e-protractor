describe('User', function(){
	var properties = require("./user_self_update.json");
	var hasClass = function(element, cls){
		return element.getAttribute('class').then(function(classes){
			return classes.split(' ').indexOf(cls) !== -1;
		})
	}
	
	it('open browser', function(){
		browser.restart();
		// function for looking for specified class in element classes
		browser.get(properties.main.link.login);
	})

	it('user close modal window', function(){
		expect(element(by.className('modal-body')).isPresent()).toBe(true);
		element(by.id('buttonok')).click();
	})
	it('user login', function(){
		element(by.model('vm.login')).sendKeys(properties.main.users.user2.login);
		element(by.model('vm.password')).sendKeys(properties.main.users.user2.password);
		element(by.id('loginform')).submit();
		expect(browser.getCurrentUrl()).toBe(properties.main.link.main);
	})

	var name;
	var age;
	var date;
	it('user switch tab and see his data', function(){
		element(by.id('uitabtwo')).click();

		name = element(by.model('vm.newusername'));
		age = element(by.model('vm.newuserage'));
		date = element(by.model('vm.newuserdate'));

		expect(name.getAttribute('value')).toBe(properties.main.details.user2.name);
		expect(age.getAttribute('value')).toBe(properties.main.details.user2.age);
		expect(date.getAttribute('value')).toBe(properties.main.details.user2.date);
	})
	
	var messageName;// = element(by.id('nameFormatWrap'));
	it('message about error in data.name should be inactive', function(){
		messageName = element(by.id('nameFormatWrap'));
		expect(hasClass(messageName, 'ng-inactive')).toBe(true);		
	})
	it('user delete text from input data.name. message should be active.',function(){
		name.clear();
		expect(hasClass(messageName, 'ng-active')).toBe(true);
		expect(hasClass(name, 'ng-invalid')).toBe(true);		
	})
	it('user enter lowercase symbols in data.name', function(){
		name.sendKeys('startlowcase');		
		expect(hasClass(name, 'ng-invalid')).toBe(true);
	})
	it('user enter not only symbols in data.name', function(){
		name.clear();
		name.sendKeys('Alex');
		name.sendKeys('2');
		expect(hasClass(name, 'ng-invalid')).toBe(true);
	})
	it('user enter space symbols in data.name', function(){
		name.clear();
		name.sendKeys('Alex');
		name.sendKeys(' ');
		name.sendKeys('Rome');
		expect(hasClass(name, 'ng-invalid')).toBe(true);
	})
	it('user enter right symbols in data.name', function(){
		name.clear();
		name.sendKeys(properties.main.details.user2upd.name);
		expect(hasClass(messageName, 'ng-inactive')).toBe(true);
	})
	
	var messageAge;// = element(by.id('ageFormatWrap'));
	it('message about error in data.age should be inactive', function(){
		messageAge = element(by.id('ageFormatWrap'));
		expect(hasClass(messageAge, 'ng-inactive')).toBe(true);
	})
	it('user delete text from input data.age. message should be active.', function(){
		age.clear();
		expect(hasClass(messageAge, 'ng-active')).toBe(true);
		expect(hasClass(age, 'ng-invalid')).toBe(true);
	})
	it('user enter lower value then required in input data.age', function(){
		age.sendKeys('17');			// test min age
		expect(hasClass(age, 'ng-invalid')).toBe(true);	
	})
	it('user enter higher value then required in input data.age', function(){
		age.clear();
		age.sendKeys('66');			// test max age
		expect(hasClass(age, 'ng-invalid')).toBe(true);
	})
	it('user enter right parameters in input data.age', function(){
		age.clear();
		age.sendKeys(properties.main.details.user2upd.age);
		expect(hasClass(messageAge, 'ng-inactive')).toBe(true);
	})

	var messageDate;// = element(by.id('dateFormatWrap'));
	it('message about error in data.date should be inactive', function(){
		messageDate = element(by.id('dateFormatWrap'));
		expect(hasClass(messageDate, 'ng-inactive')).toBe(true);
	})
	it('user delete text from input data.date. message should be active.', function(){
		date.clear();
		expect(hasClass(messageDate, 'ng-active')).toBe(true);
		expect(hasClass(date, 'ng-invalid')).toBe(true);
	})
	it('user enter lower value then required in input data.date', function(){
		date.sendKeys('1899/09/29');	// test min date
		expect(hasClass(date, 'ng-invalid')).toBe(true);
	})
	it('user enter higher value then required in input data.date', function(){
		date.clear();
		date.sendKeys('2100/01/01');	// test max date
		expect(hasClass(date, 'ng-invalid')).toBe(true);		
	})
	it('user enter feb-29 not leap year in input data.date', function(){
		date.clear();
		date.sendKeys('2001/02/29');	// test not-leap 29 feb
		expect(hasClass(date, 'ng-invalid')).toBe(true);
	})
	it('user enter feb-29 leap year in input data.date', function(){
		date.clear();
		date.sendKeys('2000/02/29');	// test leap 29 feb
		expect(hasClass(date, 'ng-valid')).toBe(true);
	})
	it('user enter right value in input data.date', function(){
		date.clear();
		date.sendKeys(properties.main.details.user2upd.date);
		expect(hasClass(messageDate, 'ng-inactive')).toBe(true);
	})
	it('user submit his data', function(){
		element(by.name('newDataForm')).submit();
		// check rightness of new data on tab 1
	})
	it('user check his new data', function(){
		var username = element(by.binding('vm.userdetails.name'));
		var userage = element(by.binding('vm.userdetails.age'));
		var userdate = element(by.binding('vm.userdetails.date'));

		expect(username.getText()).toBe(properties.main.details.user2upd.name);
		expect(userage.getText()).toBe(properties.main.details.user2upd.age);
		expect(userdate.getText()).toBe(properties.main.details.user2upd.date);
	})
})