var EC = protractor.ExpectedConditions;
describe('project title:', function(){

  it('should have a title', function(done) {
    browser.get('http://localhost:8080/#/root/login');

    expect(browser.getTitle()).toEqual('Task 5');
    done();
  });
});
