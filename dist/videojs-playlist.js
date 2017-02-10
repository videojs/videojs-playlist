/**
 * videojs-playlist
 * @version 3.0.2
 * @copyright 2017 Brightcove, Inc.
 * @license Apache-2.0
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.videojsPlaylist = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.setup = exports.reset = undefined;

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Validates a number of seconds to use as the auto-advance delay.
 *
 * @private
 * @param   {Number} s
 * @return  {Boolean}
 */
var validSeconds = function validSeconds(s) {
  return typeof s === 'number' && !isNaN(s) && s >= 0 && s < Infinity;
};

/**
 * Resets the auto-advance behavior of a player.
 *
 * @param {Player} player
 */
var reset = function reset(player) {
  if (player.playlist.autoadvance_.timeout) {
    _window2['default'].clearTimeout(player.playlist.autoadvance_.timeout);
  }

  if (player.playlist.autoadvance_.trigger) {
    player.off('ended', player.playlist.autoadvance_.trigger);
  }

  player.playlist.autoadvance_.timeout = null;
  player.playlist.autoadvance_.trigger = null;
};

/**
 * Sets up auto-advance behavior on a player.
 *
 * @param  {Player} player
 * @param  {Number} delay
 *         The number of seconds to wait before each auto-advance.
 */
var setup = function setup(player, delay) {
  reset(player);

  // Before queuing up new auto-advance behavior, check if `seconds` was
  // called with a valid value.
  if (!validSeconds(delay)) {
    return;
  }

  player.playlist.autoadvance_.trigger = function () {
    player.playlist.autoadvance_.timeout = _window2['default'].setTimeout(function () {
      reset(player);
      player.playlist.next();
    }, delay * 1000);
  };

  player.one('ended', player.playlist.autoadvance_.trigger);
};

exports.reset = reset;
exports.setup = setup;
},{"global/window":4}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.clearTracks = undefined;

var _autoAdvance = require('./auto-advance.js');

/**
 * Removes all remote text tracks from a player.
 *
 * @param  {Player} player
 */
var clearTracks = function clearTracks(player) {
  var tracks = player.remoteTextTracks();
  var i = tracks && tracks.length || 0;

  // This uses a `while` loop rather than `forEach` because the
  // `TextTrackList` object is a live DOM list (not an array).
  while (i--) {
    player.removeRemoteTextTrack(tracks[i]);
  }
};

/**
 * Plays an item on a player's playlist.
 *
 * @param  {Player} player
 * @param  {Number} delay
 *         The number of seconds to wait before each auto-advance.
 *
 * @param  {Object} item
 *         A source from the playlist.
 *
 * @return {Player}
 */
var playItem = function playItem(player, delay, item) {
  var replay = !player.paused() || player.ended();

  player.trigger('beforeplaylistitem', item);
  player.poster(item.poster || '');
  player.src(item.sources);
  clearTracks(player);
  (item.textTracks || []).forEach(player.addRemoteTextTrack.bind(player));
  player.trigger('playlistitem', item);

  if (replay) {
    player.play();
  }

  (0, _autoAdvance.setup)(player, delay);

  return player;
};

exports['default'] = playItem;
exports.clearTracks = clearTracks;
},{"./auto-advance.js":1}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _playItem = require('./play-item');

var _playItem2 = _interopRequireDefault(_playItem);

var _autoAdvance = require('./auto-advance');

var _autoadvance = _interopRequireWildcard(_autoAdvance);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// Lightweight Object.assign alternative.
var assign = function assign(target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
};

/**
 * Given two sources, check to see whether the two sources are equal.
 * If both source urls have a protocol, the protocols must match, otherwise, protocols
 * are ignored.
 *
 * @private
 * @param {String|Object} source1
 * @param {String|Object} source2
 * @return {Boolean}
 */
var sourceEquals = function sourceEquals(source1, source2) {
  var src1 = source1;
  var src2 = source2;

  if ((typeof source1 === 'undefined' ? 'undefined' : _typeof(source1)) === 'object') {
    src1 = source1.src;
  }
  if ((typeof source2 === 'undefined' ? 'undefined' : _typeof(source2)) === 'object') {
    src2 = source2.src;
  }

  if (/^\/\//.test(src1)) {
    src2 = src2.slice(src2.indexOf('//'));
  }
  if (/^\/\//.test(src2)) {
    src1 = src1.slice(src1.indexOf('//'));
  }

  return src1 === src2;
};

/**
 * Look through an array of playlist items for a specific `source`;
 * checking both the value of elements and the value of their `src`
 * property.
 *
 * @private
 * @param   {Array} arr
 * @param   {String} src
 * @return  {Number}
 */
var indexInSources = function indexInSources(arr, src) {
  for (var i = 0; i < arr.length; i++) {
    var sources = arr[i].sources;

    if (Array.isArray(sources)) {
      for (var j = 0; j < sources.length; j++) {
        var source = sources[j];

        if (source && sourceEquals(source, src)) {
          return i;
        }
      }
    }
  }

  return -1;
};

/**
 * Factory function for creating new playlist implementation on the given player.
 *
 * API summary:
 *
 * playlist(['a', 'b', 'c']) // setter
 * playlist() // getter
 * playlist.currentItem() // getter, 0
 * playlist.currentItem(1) // setter, 1
 * playlist.next() // 'c'
 * playlist.previous() // 'b'
 * playlist.first() // 'a'
 * playlist.last() // 'c'
 * playlist.autoadvance(5) // 5 second delay
 * playlist.autoadvance() // cancel autoadvance
 *
 * @param  {Player} player
 * @param  {Array}  [initialList]
 *         If given, an initial list of sources with which to populate
 *         the playlist.
 * @param  {Number}  [initialIndex]
 *         If given, the index of the item in the list that should
 *         be loaded first. If -1, no video is loaded. If omitted, The
 *         the first video is loaded.
 *
 * @return {Function}
 *         Returns the playlist function specific to the given player.
 */
var factory = function factory(player, initialList) {
  var initialIndex = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  var list = Array.isArray(initialList) ? initialList.slice() : [];

  /**
   * Get/set the playlist for a player.
   *
   * This function is added as an own property of the player and has its
   * own methods which can be called to manipulate the internal state.
   *
   * @param  {Array} [newList]
   *         If given, a new list of sources with which to populate the
   *         playlist. Without this, the function acts as a getter.
   * @param  {Number}  [newIndex]
   *         If given, the index of the item in the list that should
   *         be loaded first. If -1, no video is loaded. If omitted, The
   *         the first video is loaded.
   *
   * @return {Array}
   */
  var playlist = player.playlist = function (newList) {
    var newIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    if (Array.isArray(newList)) {
      list = newList.slice();
      if (newIndex !== -1) {
        playlist.currentItem(newIndex);
      }
      playlist.changeTimeout_ = _window2['default'].setTimeout(function () {
        player.trigger('playlistchange');
      }, 0);
    }

    // Always return a shallow clone of the playlist list.
    return list.slice();
  };

  player.on('loadstart', function () {
    if (playlist.currentItem() === -1) {
      _autoadvance.reset(player);
    }
  });

  player.on('dispose', function () {
    _window2['default'].clearTimeout(playlist.changeTimeout_);
  });

  assign(playlist, {
    currentIndex_: -1,
    player_: player,
    autoadvance_: {},

    /**
     * Get or set the current item in the playlist.
     *
     * @param  {Number} [index]
     *         If given as a valid value, plays the playlist item at that index.
     *
     * @return {Number}
     *         The current item index.
     */
    currentItem: function currentItem(index) {
      if (typeof index === 'number' && playlist.currentIndex_ !== index && index >= 0 && index < list.length) {
        playlist.currentIndex_ = index;
        (0, _playItem2['default'])(playlist.player_, playlist.autoadvance_.delay, list[playlist.currentIndex_]);
      } else {
        playlist.currentIndex_ = playlist.indexOf(playlist.player_.currentSrc() || '');
      }

      return playlist.currentIndex_;
    },


    /**
     * Checks if the playlist contains a value.
     *
     * @param  {String|Object|Array} value
     * @return {Boolean}
     */
    contains: function contains(value) {
      return playlist.indexOf(value) !== -1;
    },


    /**
     * Gets the index of a value in the playlist or -1 if not found.
     *
     * @param  {String|Object|Array} value
     * @return {Number}
     */
    indexOf: function indexOf(value) {
      if (typeof value === 'string') {
        return indexInSources(list, value);
      }

      var sources = Array.isArray(value) ? value : value.sources;

      for (var i = 0; i < sources.length; i++) {
        var source = sources[i];

        if (typeof source === 'string') {
          return indexInSources(list, source);
        } else if (source.src) {
          return indexInSources(list, source.src);
        }
      }

      return -1;
    },


    /**
     * Plays the first item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if the list is empty.
     */
    first: function first() {
      if (list.length) {
        return list[playlist.currentItem(0)];
      }

      playlist.currentIndex_ = -1;
    },


    /**
     * Plays the last item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if the list is empty.
     */
    last: function last() {
      if (list.length) {
        return list[playlist.currentItem(list.length - 1)];
      }

      playlist.currentIndex_ = -1;
    },


    /**
     * Plays the next item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if on last item.
     */
    next: function next() {

      // Make sure we don't go past the end of the playlist.
      var index = Math.min(playlist.currentIndex_ + 1, list.length - 1);

      if (index !== playlist.currentIndex_) {
        return list[playlist.currentItem(index)];
      }
    },


    /**
     * Plays the previous item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if on first item.
     */
    previous: function previous() {

      // Make sure we don't go past the start of the playlist.
      var index = Math.max(playlist.currentIndex_ - 1, 0);

      if (index !== playlist.currentIndex_) {
        return list[playlist.currentItem(index)];
      }
    },


    /**
     * Sets up auto-advance on the playlist.
     *
     * @param {Number} delay
     *        The number of seconds to wait before each auto-advance.
     */
    autoadvance: function autoadvance(delay) {
      playlist.autoadvance_.delay = delay;
      _autoadvance.setup(playlist.player_, delay);
    }
  });

  playlist.currentItem(initialIndex);

  return playlist;
};

exports['default'] = factory;
},{"./auto-advance":1,"./play-item":2,"global/window":4}],4:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;

var _video = (typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null);

var _video2 = _interopRequireDefault(_video);

var _playlistMaker = require('./playlist-maker');

var _playlistMaker2 = _interopRequireDefault(_playlistMaker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// Video.js 5/6 cross-compatible.
var registerPlugin = _video2['default'].registerPlugin || _video2['default'].plugin;

/**
 * The video.js playlist plugin. Invokes the playlist-maker to create a
 * playlist function on the specific player.
 *
 * @param {Array} list
 */
var plugin = function plugin(list, item) {
  (0, _playlistMaker2['default'])(this, list, item);
};

registerPlugin('playlist', plugin);

exports['default'] = plugin;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./playlist-maker":3}]},{},[5])(5)
});