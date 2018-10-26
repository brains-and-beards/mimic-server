var gulp = require('gulp');
var ts = require('gulp-typescript');
var uglify = require('gulp-uglify-es').default;

let tsProject = ts.createProject("tsconfig.json");

gulp.task('compile', function() {
  return tsProject
  .src()
  .pipe(tsProject())
  .pipe(uglify())
  .pipe(gulp.dest('dist/'));
})