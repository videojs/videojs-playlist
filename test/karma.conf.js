module.exports = function(config) {
  var detectBrowsers = {
    enabled: false,
    usePhantomJS: false
  };

  // On Travis CI, we can only run in Firefox.
  if (process.env.TRAVIS) {
    config.browsers = ['Firefox', 'travisChrome'];
  }

  // If no browsers are specified, we enable `karma-detect-browsers`
  // this will detect all browsers that are available for testing
  if (!config.browsers.length) {
    detectBrowsers.enabled = true;
  }

  config.set({
    basePath: '..',
    frameworks: ['qunit', 'detectBrowsers'],

    files: [
      'node_modules/video.js/dist/video.js',
      'node_modules/video.js/dist/video-js.css',
      'node_modules/videojs-playlist/dist/videojs-playlist.js',
      'dist/videojs-playlist-ui.js',
      'dist/videojs-playlist-ui.test.js',
      {pattern: 'test/example/*.jpg', served: true, included: false}
    ],
    // proxy the default karma serve location: /base/test/example
    // to the place you would expect: /test/example/
    proxies: {
      "/test/example/": "/base/test/example/"
    },
    customLaunchers: {
      travisChrome: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    detectBrowsers: detectBrowsers,
    reporters: ['dots'],
    port: 9876,
    colors: true,
    autoWatch: false,
    singleRun: true,
    concurrency: Infinity
  });
};
