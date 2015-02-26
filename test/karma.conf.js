// Karma configuration

module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['qunit'],

    browsers: ['Chrome', 'Firefox', 'Safari', 'PhantomJS'],

    files: [
      '../node_modules/video.js/dist/video-js/video.dev.js',
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
