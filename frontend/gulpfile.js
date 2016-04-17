var gulp = require('gulp');
var eslint = require('gulp-eslint');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var gutil = require('gulp-util');
var shell = require('gulp-shell');
var glob = require('glob');
var jasminePhantomJs = require('gulp-jasmine2-phantomjs');

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
	'react',
  'react-addons-test-utils',
  'flux-react'
];

var browserifyTask = function (options) {

  // Our app bundler
	var appBundler = browserify({
		entries: [options.src], // Only need initial file, browserify finds the rest
    extensions: ['.js'],
   	transform: [babelify], // We want to convert JSX to normal javascript
		debug: options.development, // Gives us sourcemapping
		cache: {}, packageCache: {}, fullPaths: options.development, // Requirement of watchify
    paths: ['./app/']
	});

	// We set our dependencies as externals on our app bundler when developing.
  // You might consider doing this for production also and load two javascript
  // files (main.js and vendors.js), as vendors.js will probably not change and
  // takes full advantage of caching
	appBundler.external(options.development ? dependencies : []);


  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    console.log('Building APP bundle');
    appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('main.js'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulp.dest(options.dest))
      .pipe(notify(function () {
        console.log('APP bundle built in ' + (Date.now() - start) + 'ms');
      }));
  };

  // Fire up Watchify when developing
  if (options.development) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  rebundle();

  // We create a separate bundle for our dependencies as they
  // should not rebundle on file changes. This only happens when
  // we develop. When deploying the dependencies will be included
  // in the application bundle
  if (options.development) {

  	var testFiles = glob.sync('./specs/**/*-spec.js');
		var testBundler = browserify({
			entries: testFiles,
			debug: true, // Gives us sourcemapping
			transform: [babelify],
			cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
		});

    testBundler.external(dependencies);

  	var rebundleTests = function () {
  		var start = Date.now();
  		console.log('Building TEST bundle');
  		testBundler.bundle()
      .on('error', gutil.log)
	      .pipe(source('specs.js'))
	      .pipe(gulp.dest(options.dest))
	      .pipe(notify(function () {
	        console.log('TEST bundle built in ' + (Date.now() - start) + 'ms');
	      }));
  	};

    testBundler = watchify(testBundler);
    testBundler.on('update', rebundleTests);
    rebundleTests();

    // Remove react-addons when deploying, as it is only for
    // testing
    if (!options.development) {
      dependencies.splice(dependencies.indexOf('react/addons'), 1);
    }

    var vendorsBundler = browserify({
      debug: true,
      require: dependencies
    });

    // Run the vendor bundle
    var start = new Date();
    console.log('Building VENDORS bundle');
    vendorsBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('vendors.js'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulp.dest(options.dest))
      .pipe(notify(function () {
        console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
      }));

  }

}

var radioPlayerJSTask = function (options) {
  // Our app bundler
	var appBundler = browserify({
		entries: [options.src], // Only need initial file, browserify finds the rest
    extensions: ['.js'],
   	transform: [babelify], // We want to convert JSX to normal javascript
		debug: options.development, // Gives us sourcemapping
		cache: {}, packageCache: {}, fullPaths: options.development, // Requirement of watchify
    paths: ['./player/']
	});

	// We set our dependencies as externals on our app bundler when developing.
  // You might consider doing this for production also and load two javascript
  // files (main.js and vendors.js), as vendors.js will probably not change and
  // takes full advantage of caching
	appBundler.external(options.development ? dependencies : []);


  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    console.log('Building RADIOPLAYER bundle');
    appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('player.js'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulp.dest(options.dest))
      .pipe(notify(function () {
        console.log('RADIOPLAYER bundle built in ' + (Date.now() - start) + 'ms');
      }));
  };
  // Fire up Watchify when developing
  if (options.development) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  rebundle();


};

var cssTask = function (options) {
    if (options.development) {
      var run = function () {
        console.log(arguments);
        var start = new Date();
        console.log('Building CSS bundle');
        gulp.src(options.src)
          .pipe(concat('css/main.css'))
          .pipe(gulp.dest(options.dest))
          .pipe(notify(function () {
            console.log('CSS bundle built in ' + (Date.now() - start) + 'ms');
          }));
      };
      run();
      gulp.watch(options.src, run);
    } else {
      gulp.src(options.src)
        .pipe(concat('css/main.css'))
        .pipe(cssmin())
        .pipe(gulp.dest(options.dest));
    }
}

var vendorCSSTask = function (options) {
    if (options.development) {
      var run = function () {
        console.log(arguments);
        var start = new Date();
        console.log('Building vendor CSS bundle');
        gulp.src(options.src)
          .pipe(concat('css/vendors.css'))
          .pipe(gulp.dest(options.dest))
          .pipe(notify(function () {
            console.log('Vendor CSS bundle built in ' + (Date.now() - start) + 'ms');
          }));
      };
      run();
      gulp.watch(options.src, run);
    } else {
      gulp.src(options.src)
        .pipe(concat('css/vendors.css'))
        .pipe(cssmin())
        .pipe(gulp.dest(options.dest));
    }
}

var copyTask = function (options) {
  gulp.src(options.src)
    .pipe(gulp.dest(options.dest));
}

gulp.task('lint', function () {
	return gulp.src(['**/*.js', '!node_modules/**'])
		.pipe(eslint())
		.pipe(eslint.format())
});

// Starts our development workflow
gulp.task('default', ['lint'], function () {

  browserifyTask({
    development: true,
    src: './app/main.js',
    dest: './build'
  });

	radioPlayerJSTask({
		development: true,
		src: './player.js',
		dest: './build'
	});

  cssTask({
    development: true,
    src: './styles/**/*.css',
    dest: './build'
  });

  vendorCSSTask({
    development: true,
    src: './node_modules/sir-trevor/build/sir-trevor.css',
    dest: './build'
  });

  copyTask({
    development: true,
    src: './static/**/*',
    dest: './build'
  });

});

gulp.task('deploy', function () {

  browserifyTask({
    development: false,
    src: './app/main.js',
    dest: './dist'
  });

  cssTask({
    development: false,
    src: './styles/**/*.css',
    dest: './dist'
  });

  vendorCSSTask({
    development: false,
    src: './node_modules/sir-trevor/build/sir-trevor.css',
    dest: './dist'
  });

  copyTask({
    development: false,
    src: './static/**/*',
    dest: './dist'
  });

});

gulp.task('test', function () {
    return gulp.src('./build/testrunner-phantomjs.html').pipe(jasminePhantomJs());
});
