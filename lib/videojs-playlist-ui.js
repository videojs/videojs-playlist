/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
import * as playlist from 'videojs-playlist';

let defaults = {
  playlistClass: 'vjs-playlist'
};

let createPlaylistItem = function(item, parent) {
  let li = document.createElement('li');
  li.className = 'vjs-playlist-item';

  if (item.name) {
    let name = document.createElement('label');
    name.className = 'vjs-playlist-name';
    name.appendChild(document.createTextNode(item.name));
    li.appendChild(name);
  }

  if (item.description) {
    let description = document.createElement('p');
    description.className = 'vjs-playlist-description';
    description.appendChild(document.createTextNode(item.description));
    li.appendChild(description);
  }

  parent.appendChild(li);
  return li;
};

/**
 * Build a playlist inside the specified HTMLElement.
 * @param elem {HTMLElement} the container for the playlist component.
 */
let createPlaylist = function(player, elem) {
  const items = player.playlist();
  const fragment = document.createDocumentFragment();

  for (let item of items) {
    createPlaylistItem(item, fragment);
  }
  elem.appendChild(fragment);
};

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */
let playlistUi = function(options) {
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
