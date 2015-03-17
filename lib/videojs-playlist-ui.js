/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
import * as playlist from 'videojs-playlist';

const defaults = {
  className: 'vjs-playlist'
};

const createThumbnail = function(thumbnail) {
  if (!thumbnail) {
    let placeholder = document.createElement('div');
    placeholder.className = 'vjs-playlist-thumbnail';
    return placeholder;
  }

  let picture = document.createElement('picture');
  picture.className = 'vjs-playlist-thumbnail';

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

videojs.PlaylistMenuItem = videojs.Component.extend({
  init: function(player, options) {
    if (!options.item) {
      throw new Error('Cannot construct a PlaylistMenuItem without an item option');
    }
    this.el_ = this.createEl(options.item);
    options.el = this.el_;
    videojs.Component.call(this, player, options);

    this.item_ = options.item;
    this.emitTapEvents();

    this.on(['click', 'tap'], (event) => {
      const currentIndex = player.playlist().indexOf(this.item_);
      if (currentIndex >= 0) {
        player.playlist.currentItem(currentIndex);
      }
    });
  },
  createEl: function(item) {
    let li = document.createElement('li');
    li.className = 'vjs-playlist-item';

    // Thumbnail image
    li.appendChild(createThumbnail(item.thumbnail));

    // Duration
    if (item.duration) {
      let duration = document.createElement('time');
      let time = videojs.formatTime(item.duration);
      duration.className = 'vjs-playlist-duration';
      duration.setAttribute('datetime', 'PT0H0M' + item.duration + 'S');
      duration.appendChild(document.createTextNode(time));
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
  }
});

videojs.PlaylistMenu = videojs.Component.extend({
  init: function(player, options) {

    if (!player.playlist || player.playlist() === undefined) {
      throw new Error('videojs-playlist is required for the playlist component');
    }

    if (!options.el) {
      this.el_ = document.createElement('ol');
      this.el_.className = options.className;
      options.el = this.el_;
    }

    videojs.Component.call(this, player, options);
    this.createPlaylist_();

    player.on('loadstart', (event) => {
      this.update();
    });
  },
  createPlaylist_: function() {
    const playlist = this.player_.playlist();

    this.items = [];
    for (let i in playlist) {
      let item = new videojs.PlaylistMenuItem(this.player_, {
        item: playlist[i]
      });
      this.items.push(item);
      this.addChild(item);
    }
    // select the current playlist item
    let selectedIndex = this.player_.playlist.currentItem();
    if (selectedIndex >= 0) {
      this.items[selectedIndex].el_.className += ' vjs-selected';
    }
  },
  update: function() {
    // reset the selection
    for (let i in this.items) {
      this.items[i].removeClass('vjs-selected');
    }
    const currentItem = this.player_.playlist.currentItem();
    if (currentItem >= 0) {
      this.items[currentItem].addClass('vjs-selected');
    }
  }
});

/**
 * Initialize the plugin.
 * @param options (optional) {object} configuration for the plugin
 */
const playlistUi = function(options) {
  const player = this;
  let settings, elem;

  if (!player.playlist || player.playlist() === undefined) {
    throw new Error('videojs-playlist is required for the playlist component');
  }

  // if the first argument is a DOM element, use it to build the component
  if ((typeof HTMLElement !== 'undefined' && options instanceof HTMLElement) ||
      // IE8 does not define HTMLElement so use a hackier type check
      (options && options.nodeType === 1)) {
    elem = options;
    settings = videojs.util.mergeOptions(defaults, {});
  } else {
    // lookup the elements to use by class name
    settings = videojs.util.mergeOptions(defaults, options);
    elem = document.querySelector('.' + settings.className);
  }

  // build the playlist menu
  settings.el = elem;
  player.playlistMenu = new videojs.PlaylistMenu(player, settings);
};

// register the plugin
videojs.plugin('playlistUi', playlistUi);
