import document from 'global/document';
import videojs from 'video.js';

// support VJS5 & VJS6 at the same time
const dom = videojs.dom || videojs;
const registerPlugin = videojs.registerPlugin || videojs.plugin;

// Array#indexOf analog for IE8
const indexOf = function(array, target) {
  for (let i = 0, length = array.length; i < length; i++) {
    if (array[i] === target) {
      return i;
    }
  }
  return -1;
};

// see https://github.com/Modernizr/Modernizr/blob/master/feature-detects/css/pointerevents.js
const supportsCssPointerEvents = (() => {
  const element = document.createElement('x');

  element.style.cssText = 'pointer-events:auto';
  return element.style.pointerEvents === 'auto';
})();

const defaults = {
  className: 'vjs-playlist',
  playOnSelect: false,
  supportsCssPointerEvents
};

// we don't add `vjs-playlist-now-playing` in addSelectedClass
// so it won't conflict with `vjs-icon-play
// since it'll get added when we mouse out
const addSelectedClass = function(el) {
  el.addClass('vjs-selected');
};
const removeSelectedClass = function(el) {
  el.removeClass('vjs-selected');

  if (el.thumbnail) {
    dom.removeClass(el.thumbnail, 'vjs-playlist-now-playing');
  }
};

const upNext = function(el) {
  el.addClass('vjs-up-next');
};
const notUpNext = function(el) {
  el.removeClass('vjs-up-next');
};

const createThumbnail = function(thumbnail) {
  if (!thumbnail) {
    const placeholder = document.createElement('div');

    placeholder.className = 'vjs-playlist-thumbnail vjs-playlist-thumbnail-placeholder';
    return placeholder;
  }

  const picture = document.createElement('picture');

  picture.className = 'vjs-playlist-thumbnail';

  if (typeof thumbnail === 'string') {
    // simple thumbnails
    const img = document.createElement('img');

    img.src = thumbnail;
    img.alt = '';
    picture.appendChild(img);
  } else {
    // responsive thumbnails

    // additional variations of a <picture> are specified as
    // <source> elements
    for (let i = 0; i < thumbnail.length - 1; i++) {
      const variant = thumbnail[i];
      const source = document.createElement('source');

      // transfer the properties of each variant onto a <source>
      for (const prop in variant) {
        source[prop] = variant[prop];
      }
      picture.appendChild(source);
    }

    // the default version of a <picture> is specified by an <img>
    const variant = thumbnail[thumbnail.length - 1];
    const img = document.createElement('img');

    img.alt = '';
    for (const prop in variant) {
      img[prop] = variant[prop];
    }
    picture.appendChild(img);
  }
  return picture;
};

const Component = videojs.getComponent('Component');

class PlaylistMenuItem extends Component {

  constructor(player, playlistItem, settings) {
    if (!playlistItem.item) {
      throw new Error('Cannot construct a PlaylistMenuItem without an item option');
    }

    super(player, playlistItem);
    this.item = playlistItem.item;

    this.playOnSelect = settings.playOnSelect;

    this.emitTapEvents();

    this.on(['click', 'tap'], this.switchPlaylistItem_);
    this.on('keydown', this.handleKeyDown_);

  }

  handleKeyDown_(event) {
    // keycode 13 is <Enter>
    // keycode 32 is <Space>
    if (event.which === 13 || event.which === 32) {
      this.switchPlaylistItem_();
    }
  }

  switchPlaylistItem_(event) {
    this.player_.playlist.currentItem(indexOf(this.player_.playlist(), this.item));
    if (this.playOnSelect) {
      this.player_.play();
    }
  }

  createEl() {
    const li = document.createElement('li');
    const item = this.options_.item;

    li.className = 'vjs-playlist-item';
    li.setAttribute('tabIndex', 0);

    // Thumbnail image
    this.thumbnail = createThumbnail(item.thumbnail);
    li.appendChild(this.thumbnail);

    // Duration
    if (item.duration) {
      const duration = document.createElement('time');
      const time = videojs.formatTime(item.duration);

      duration.className = 'vjs-playlist-duration';
      duration.setAttribute('datetime', 'PT0H0M' + item.duration + 'S');
      duration.appendChild(document.createTextNode(time));
      li.appendChild(duration);
    }

    // Now playing
    const nowPlayingEl = document.createElement('span');
    const nowPlayingText = this.localize('Now Playing');

    nowPlayingEl.className = 'vjs-playlist-now-playing-text';
    nowPlayingEl.appendChild(document.createTextNode(nowPlayingText));
    nowPlayingEl.setAttribute('title', nowPlayingText);
    this.thumbnail.appendChild(nowPlayingEl);

    // Title container contains title and "up next"
    const titleContainerEl = document.createElement('div');

    titleContainerEl.className = 'vjs-playlist-title-container';
    this.thumbnail.appendChild(titleContainerEl);

    // Up next
    const upNextEl = document.createElement('span');
    const upNextText = this.localize('Up Next');

    upNextEl.className = 'vjs-up-next-text';
    upNextEl.appendChild(document.createTextNode(upNextText));
    upNextEl.setAttribute('title', upNextText);
    titleContainerEl.appendChild(upNextEl);

    // Video title
    const titleEl = document.createElement('cite');
    const titleText = item.name || this.localize('Untitled Video');

    titleEl.className = 'vjs-playlist-name';
    titleEl.appendChild(document.createTextNode(titleText));
    titleEl.setAttribute('title', titleText);
    titleContainerEl.appendChild(titleEl);

    return li;
  }
}

class PlaylistMenu extends Component {

  constructor(player, options) {
    if (!player.playlist) {
      throw new Error('videojs-playlist is required for the playlist component');
    }

    super(player, options);
    this.items = [];

    if (options.horizontal) {
      this.addClass('vjs-playlist-horizontal');
    } else {
      this.addClass('vjs-playlist-vertical');
    }

    // If CSS pointer events aren't supported, we have to prevent
    // clicking on playlist items during ads with slightly more
    // invasive techniques. Details in the stylesheet.
    if (options.supportsCssPointerEvents) {
      this.addClass('vjs-csspointerevents');
    }

    this.createPlaylist_();

    if (!videojs.browser.TOUCH_ENABLED) {
      this.addClass('vjs-mouse');
    }

    player.on(['loadstart', 'playlistchange', 'playlistsorted'], (event) => {
      this.update();
    });

    // Keep track of whether an ad is playing so that the menu
    // appearance can be adapted appropriately
    player.on('adstart', () => {
      this.addClass('vjs-ad-playing');
    });

    player.on('adend', () => {
      this.removeClass('vjs-ad-playing');
    });
  }

  createEl() {
    return dom.createEl('div', {className: this.options_.className});
  }

  createPlaylist_() {
    const playlist = this.player_.playlist() || [];
    let list = this.el_.querySelector('.vjs-playlist-item-list');
    let overlay = this.el_.querySelector('.vjs-playlist-ad-overlay');

    if (!list) {
      list = document.createElement('ol');
      list.className = 'vjs-playlist-item-list';
      this.el_.appendChild(list);
    }

    // remove any existing items
    for (let i = 0; i < this.items.length; i++) {
      list.removeChild(this.items[i].el_);
    }
    this.items.length = 0;

    // create new items
    for (let i = 0; i < playlist.length; i++) {
      const item = new PlaylistMenuItem(this.player_, {
        item: playlist[i]
      }, this.options_);

      this.items.push(item);
      list.appendChild(item.el_);
    }

    // Inject the ad overlay. IE<11 doesn't support "pointer-events:
    // none" so we use this element to block clicks during ad
    // playback.
    if (!overlay) {
      overlay = document.createElement('li');
      overlay.className = 'vjs-playlist-ad-overlay';
      list.appendChild(overlay);
    } else {
      // Move overlay to end of list
      list.appendChild(overlay);
    }

    // select the current playlist item
    const selectedIndex = this.player_.playlist.currentItem();

    if (this.items.length && selectedIndex >= 0) {
      addSelectedClass(this.items[selectedIndex]);

      const thumbnail = this.items[selectedIndex].$('.vjs-playlist-thumbnail');

      if (thumbnail) {
        dom.addClass(thumbnail, 'vjs-playlist-now-playing');
      }
    }
  }

  update() {
    // replace the playlist items being displayed, if necessary
    const playlist = this.player_.playlist();

    if (this.items.length !== playlist.length) {
      // if the menu is currently empty or the state is obviously out
      // of date, rebuild everything.
      this.createPlaylist_();
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].item !== playlist[i]) {
        // if any of the playlist items have changed, rebuild the
        // entire playlist
        this.createPlaylist_();
        return;
      }
    }

    // the playlist itself is unchanged so just update the selection
    const currentItem = this.player_.playlist.currentItem();

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      if (i === currentItem) {
        addSelectedClass(item);
        if (document.activeElement !== item.el()) {
          dom.addClass(item.thumbnail, 'vjs-playlist-now-playing');
        }
        notUpNext(item);
      } else if (i === currentItem + 1) {
        removeSelectedClass(item);
        upNext(item);
      } else {
        removeSelectedClass(item);
        notUpNext(item);
      }
    }
  }
}

/**
 * Returns a boolean indicating whether an element has child elements.
 *
 * Note that this is distinct from whether it has child _nodes_.
 *
 * @param  {HTMLElement} el
 *         A DOM element.
 *
 * @return {boolean}
 *         Whether the element has child elements.
 */
const hasChildEls = (el) => {
  for (let i = 0; i < el.childNodes.length; i++) {
    if (dom.isEl(el.childNodes[i])) {
      return true;
    }
  }
  return false;
};

/**
 * Finds the first empty root element.
 *
 * @param  {string} className
 *         An HTML class name to search for.
 *
 * @return {HTMLElement}
 *         A DOM element to use as the root for a playlist.
 */
const findRoot = (className) => {
  const all = document.querySelectorAll('.' + className);
  let el;

  for (let i = 0; i < all.length; i++) {
    if (!hasChildEls(all[i])) {
      el = all[i];
      break;
    }
  }

  return el;
};

/**
 * Initialize the plugin on a player.
 *
 * @param  {Object} [options]
 *         An options object.
 *
 * @param  {HTMLElement} [options.el]
 *         A DOM element to use as a root node for the playlist.
 *
 * @param  {string} [options.className]
 *         An HTML class name to use to find a root node for the playlist.
 *
 * @param  {boolean} [options.playOnSelect = false]
 *         If true, will attempt to begin playback upon selecting a new
 *         playlist item in the UI.
 */
const playlistUi = function(options) {
  const player = this;

  if (!player.playlist) {
    throw new Error('videojs-playlist plugin is required by the videojs-playlist-ui plugin');
  }

  if (dom.isEl(options)) {
    videojs.log.warn('videojs-playlist-ui: Passing an element directly to playlistUi() is deprecated, use the "el" option instead!');
    options = {el: options};
  }

  options = videojs.mergeOptions(defaults, options);

  // If the player is already using this plugin, remove the pre-existing
  // PlaylistMenu, but retain the element and its location in the DOM because
  // it will be re-used.
  if (player.playlistMenu) {
    const el = player.playlistMenu.el();

    // Catch cases where the menu may have been disposed elsewhere or the
    // element removed from the DOM.
    if (el) {
      const parentNode = el.parentNode;
      const nextSibling = el.nextSibling;

      // Disposing the menu will remove `el` from the DOM, but we need to
      // empty it ourselves to be sure.
      player.playlistMenu.dispose();
      dom.emptyEl(el);

      // Put the element back in its place.
      if (nextSibling) {
        parentNode.insertBefore(el, nextSibling);
      } else {
        parentNode.appendChild(el);
      }

      options.el = el;
    }
  }

  if (!dom.isEl(options.el)) {
    options.el = findRoot(options.className);
  }

  player.playlistMenu = new PlaylistMenu(player, options);
};

// register components
videojs.registerComponent('PlaylistMenu', PlaylistMenu);
videojs.registerComponent('PlaylistMenuItem', PlaylistMenuItem);

// register the plugin
registerPlugin('playlistUi', playlistUi);

export default playlistUi;
