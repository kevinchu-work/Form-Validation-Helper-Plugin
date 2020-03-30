/**
 * devDependencies:
 * yarn add -D @babel/core @babel/polyfill @babel/preset-env autoprefixer cssnano gulp gulp-babel gulp-cli gulp-concat gulp-minify gulp-plumber gulp-postcss gulp-replace gulp-sass gulp-sourcemaps
 */

// Modules
const { src, dest, watch, series, parallel } = require("gulp");

// Importing all the Gulp-related packages we want to use
const babel   = require("gulp-babel"),
      plumber = require("gulp-plumber");

// Wrap up
const sourcemaps = require("gulp-sourcemaps"),
    //   uglify     = require("gulp-uglify"),       // Replaced by minify
      minify     = require("gulp-minify");

// for CSS/SASS/SCSS
const sass         = require("gulp-sass"),
      postcss      = require("gulp-postcss"),
      autoprefixer = require("autoprefixer"),
      cssnano      = require("cssnano")
      //, cleanCss     = require("gulp-clean-css");
      ;

// for Cache Bust
const replace = require("gulp-replace");

// General
// const concat = require("gulp-concat");

// Sources File(s)
const files = {
    scssPath: "src/**/*.scss",
    scssExamplePath: "example/**/*.scss",
    jsPath: ["src/**/*.js", '!src/js/jQuery.FormHelper-3.js', '!src/js/jQuery.FormHelper-2.js', '!src/js/jQuery.FormHelper.js']
};

// Praser SASS/SCSS for Production
function scssTask() {
  return src(files.scssPath)
        .pipe(sourcemaps.init()) // initialize sourcemaps first
        .pipe(sass()) // compile SCSS to CSS
        .pipe(postcss([autoprefixer(), cssnano()]))
        // .pipe(cleanCss())
        .pipe(
            sourcemaps.mapSources(function(sourcePath, file) {
                // source paths are prefixed with '../src/'
                return "../src/" + sourcePath;
            })
        )
        .pipe(sourcemaps.write("../maps"))
        .pipe(dest("example"))
        .pipe(dest("dist"));
}

// Praser SASS/SCSS for Example HTML only
function scssExampleTask() {
  return src(files.scssExamplePath)
        .pipe(sass()) // compile SCSS to CSS
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(dest("example"));
}

// Praser JS
function jsTask() {
  return src(files.jsPath) //[ files.jsPath ])
        .pipe(sourcemaps.init())
        .pipe(plumber())        // Stop if any error
        .pipe(babel())
        // .pipe(concat("jQuery.BGMedia.js"))
        // .pipe(uglify())      // Replaced by minify
        .pipe(minify())
        .pipe(
            sourcemaps.mapSources(function(sourcePath, file) {
                // if source paths are prefixed with '../src/'
                return "../src/" + sourcePath;
            })
        )
        .pipe(sourcemaps.write("../maps"))
        .pipe(dest("example"))
        .pipe(dest("dist"));
}

// Cachebust
function cacheBustTask() {
  var cbString = new Date().getTime();
  return src(["example/*.html"])
        .pipe(replace(/cb_timestamp=\d+/g, "cb_timestamp=" + cbString))
        .pipe(dest("example"));
}

function exec() {
  return series(
    (cb) => { console.log('\n- Compile ['+new Date().toLocaleTimeString()+'] ---'); return cb() },
    parallel(scssTask, scssExampleTask, jsTask),
    cacheBustTask
  );
}

const watchOpt = {interval: 2500, usePolling: true};  //Makes docker work
// Watch task: watch SCSS and JS files for changes
function watchTask() {
  watch(
    [files.scssPath, files.scssExamplePath].concat(files.jsPath),
    {interval: 2500, usePolling: true},     //Makes docker work
    exec()
  );
}

exports.default = series(
  exec(),
  watchTask
);
