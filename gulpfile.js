var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('default', function(cb) {
    return gulp.src(['./test/index.js']).
        pipe(mocha());
});
