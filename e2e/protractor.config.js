exports.config = {
	framework: "jasmine",
    allScriptsTimeout: 30000,
    includeStackTrace: true,
    getPageTimeout: 10000,
    jasmineNodeOpts: {defaultTimeoutInterval: 120000},
    
    capabilities: {
      browserName: 'chrome'
    },

    onPrepare: function () {
        var jasmineReporters = require('jasmine-reporters');
        jasmine.getEnv().addReporter(new jasmineReporters.JUnitXmlReporter({
            consolidateAll: true,
            filePrefix: 'xmloutput',
            savePath: 'dist/e2e'
        }));
    }
};