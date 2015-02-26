// Karma configuration

module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['qunit'],

    files: [
      '../node_modules/video.js/dist/video-js/video.dev.js',
      '../dist/bundle.js',
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
