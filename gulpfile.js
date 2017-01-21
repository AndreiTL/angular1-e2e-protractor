var gulp = require('gulp');
var concat = require('gulp-concat');

var uglify = require('gulp-uglify');
var pump = require('pump');

gulp.task('webdriver_update', function(cb){
	return require('gulp-protractor').webdriver_update(cb);
});
gulp.task('e2e', ['webdriver_update'], function(cb){
	var protractor = require('gulp-protractor').protractor;
	gulp.src([
		'./e2e/tests/project_title.spec.js',
		'./e2e/tests/login.spec.js',
		'./e2e/tests/feedback.spec.js',
		'./e2e/tests/admin_user_create.spec.js',
		'./e2e/tests/user_self_update.spec.js'

		// './e2e/tests/*.spec.js'

	]).pipe(protractor({
		configFile: './e2e/protractor.config.js',
		args: ['--baseUrl', 'http://localhost:8080/']
	})).on('end', cb);	
});
gulp.task('run-e2e', function(done){
	var server = require("./app");
	var exec = require('child_process').exec;
	var child = exec('gulp e2e', function(err, stdErr, stdOut){
		console.log(err);
		console.log(stdErr);
		console.log(stdOut);
		server.close();
		done();
	});
	child.stdout.pipe(process.stdout);
	child.stderr.pipe(process.stderr);	
});

gulp.task('build', function(){
	return gulp.src('./app/**/*.js')
		.pipe(concat('common.js'))
		.pipe(gulp.dest('./app/'));
});

// gulp.task('compress', function(cb){
// 	pump([
// 		gulp.src('./app/**/*.js'),
// 		uglify(),
// 		gulp.dest('comp')
// 	], 
// 	cb)
// })
// gulp.task('build-compressed', function(){
// 	return gulp.src('./comp/**/*.js')
// 		.pipe(concat('compressed.js'))
// 		.pipe(gulp.dest('./app/'));
// });