// Karma configuration
var browsers = ['PhantomJS'];

if (!process.env.TRAVIS_PULL_REQUEST) {
  browsers.push('Chrome', 'Firefox', 'Safari');
}

module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['qunit'],

    browsers: browsers,

    files: [
      '../node_modules/video.js/dist/video.js',
      '../dist/tests.js'
    ],

    reporters: ['dots'],

    port: 9876,

    colors: true,

    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    autoWatch: true
  });
};
