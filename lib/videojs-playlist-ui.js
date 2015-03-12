/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
import * as playlist from 'videojs-playlist';

var defaults = {
      playlistClass: 'vjs-playlist'
    },
    playlistUi,
    createPlaylist;

/**
 * Build a playlist inside the specified HTMLElement.
 * @param elem {HTMLElement} the container for the playlist component.
 */
createPlaylist = function(player, elem) {
  const items = player.playlist();
  const fragment = document.createDocumentFragment();

  for (let item in items) {
    let li = document.createElement('li');
    li.textContent = 'Video ' + item;
    li.className = 'vjs-playlist-item';
    fragment.appendChild(li);
  }
  elem.appendChild(fragment);
};

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */
playlistUi = function(options) {
  var player = this,
      i, settings, elems;

  if (!player.playlist || player.playlist() === undefined) {
    throw new Error('videojs-playlist is required for the playlist UI');
  }

  // if the first argument is a DOM element, use it to build the component
  if (options instanceof HTMLElement) {
    elems = [options];
    settings = videojs.util.mergeOptions(defaults, {});
  } else {
    // lookup the elements to use by class name
    settings = videojs.util.mergeOptions(defaults, options);
    elems = Array.prototype.slice.call(document.querySelectorAll('.' + settings.playlistClass));
  }

  // build the playlist components
  i = elems.length;
  while (i--) {
    createPlaylist(player, elems[i]);
  }
};

// register the plugin
videojs.plugin('playlistUi', playlistUi);
