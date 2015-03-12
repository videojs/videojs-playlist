/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
(function(window, videojs) {
  'use strict';

  var defaults = {
        option: true
      },
      playlistUi;

  /**
   * Initialize the plugin.
   * @param options (optional) {object} configuration for the plugin
   */
  playlistUi = function(options) {
    var settings = videojs.util.mergeOptions(defaults, options),
        player = this;

    // TODO: write some amazing plugin code
  };

  // register the plugin
  videojs.plugin('playlistUi', playlistUi);
})(window, window.videojs);
