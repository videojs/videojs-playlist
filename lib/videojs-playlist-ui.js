/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
import * as playlist from 'videojs-playlist';

const defaults = {
  playlistClass: 'vjs-playlist'
};

const createThumbnail = function(thumbnail) {
  let picture = document.createElement('picture');

  if (typeof thumbnail === 'string') {
    // simple thumbnails
    let img = document.createElement('img');
    img.src = thumbnail;
    picture.appendChild(img);
  } else {
    // responsive thumbnails

    // additional variations of a <picture> are specified as
    // <source> elements
    for (let i = 0; i < thumbnail.length - 1; i++) {
      let variant = thumbnail[i];
      let source = document.createElement('source');
      // transfer the properties of each variant onto a <source>
      for (let prop in variant) {
        source[prop] = variant[prop];
      }
      picture.appendChild(source);
    }

    // the default version of a <picture> is specified by an <img>
    let variant = thumbnail[thumbnail.length - 1];
    let img = document.createElement('img');
    for (let prop in variant) {
      img[prop] = variant[prop];
    }
    picture.appendChild(img);
  }
  return picture;
};

const createPlaylistItem = function(item) {
  let li = document.createElement('li');
  li.className = 'vjs-playlist-item';

  // Thumbnail image
  if (item.thumbnail) {
    li.appendChild(createThumbnail(item.thumbnail));
  }

  // Duration
  if (item.duration) {
    let duration = document.createElement('span');
    duration.className = 'vjs-playlist-duration';
    duration.appendChild(document.createTextNode(item.duration));
    li.appendChild(duration);
  }

  // Name and description
  if (item.name) {
    let name = document.createElement('cite');
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
  return li;
};

/**
 * Build a playlist inside the specified HTMLElement.
 * @param elem {HTMLElement} the container for the playlist component.
 */
const createPlaylist = function(player, elem) {
  const items = player.playlist();
  const fragment = document.createDocumentFragment();

  for (let i in items) {
    fragment.appendChild(createPlaylistItem(items[i]));
  }
  elem.appendChild(fragment);
};

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */
const playlistUi = function(options) {
  const player = this;
  let settings, elems;

  if (!player.playlist || player.playlist() === undefined) {
    throw new Error('videojs-playlist is required for the playlist UI');
  }

  // if the first argument is a DOM element, use it to build the component
  if ((typeof HTMLElement !== 'undefined' && options instanceof HTMLElement) ||
      // IE8 does not define HTMLElement so use a hackier type check
      (options && options.nodeType === 1)) {
    elems = [options];
    settings = videojs.util.mergeOptions(defaults, {});
  } else {
    // lookup the elements to use by class name
    settings = videojs.util.mergeOptions(defaults, options);
    elems = Array.prototype.slice.call(document.querySelectorAll('.' + settings.playlistClass));
  }

  // build the playlist components
  let i = elems.length;
  while (i--) {
    createPlaylist(player, elems[i]);
  }
};

// register the plugin
videojs.plugin('playlistUi', playlistUi);
