var gulp = require('gulp');
var psi = require('psi');
var critical = require('critical');

// Generate & Inline Critical-path CSS
//gulp.task('critical', ['build', 'copystyles'], function (cb) {
gulp.task('critical', function (cb) {

    // At this point, we have our
    // production styles in main/styles.css

    // As we're going to overwrite this with
    // our critical-path CSS let's create a copy
    // of our site-wide styles so we can async
    // load them in later. We do this with
    // 'copystyles' above

    critical.generate({
        base: 'dist/',
        src: 'index.html',
        dest: 'dist/static/styles/site.css',
        width: 320,
        height: 480

        //minify: true,


    }).then(function(output){

        critical.inline({
            base: 'dist/',
            src: 'index.html',
            dest: 'dist/index.html',
            minify: true
        });
    }).error(function(err){
        console.log(err.message);
    });
});

gulp.task('critical-pizza', function (cb) {

    // At this point, we have our
    // production styles in main/styles.css

    // As we're going to overwrite this with
    // our critical-path CSS let's create a copy
    // of our site-wide styles so we can async
    // load them in later. We do this with
    // 'copystyles' above

    critical.generate({
        base: 'dist/views/pizza/',
        src: 'pizza.html',
        dest: 'dist/views/pizza/css/site.css',
        width: 320,
        height: 480

        //minify: true,


    }).then(function(output){

        critical.inline({
            base: 'dist/views/pizza/',
            src: 'pizza.html',
            dest: 'dist/views/pizza/pizza.html',
            minify: true
        });
    }).error(function(err){
        console.log(err.message);
    });
});


// Please feel free to use the `nokey` option to try out PageSpeed
// Insights as part of your build process. For more frequent use,
// we recommend registering for your own API key. For more info:
// https://developers.google.com/speed/docs/insights/v1/getting_started

gulp.task('mobile', function () {
    return psi(site, {
        // key: key
        nokey: 'true',
        strategy: 'mobile'
    }, function (err, data) {
        console.log(data.score);
        console.log(data.pageStats);
    });
});

gulp.task('desktop', function () {
    return psi(site, {
        nokey: 'true',
        // key: key,
        strategy: 'desktop'
    }, function (err, data) {
        console.log(data.score);
        console.log(data.pageStats);
    });
});

gulp.task('default', ['critical', 'critical-pizza']);