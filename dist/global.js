(function(f){var g;if(typeof window!=='undefined'){g=window}else if(typeof self!=='undefined'){g=self}g.videojsPlaylist=f()})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var resetadvance;

module.exports = function autoadvance(player, timeout) {
  // we want to cancel the auto advance or auto advance was called with a bogus value
  if (typeof timeout !== 'number' || timeout !== timeout || timeout < 0 || timeout === Infinity) {
    return resetadvance(player);
  }

  var ontimeout = function() {
    player.playlist._timeoutId = window.setTimeout(function() {
      resetadvance(player);
      player.playlist.next();
    }, timeout * 1000);
  };

  // we called auto advance while an auto-advance was in progress
  if (player.playlist._timeoutId) {
    return resetadvance(player);
  }

  // we are starting a new video and don't have a timeout handler for it
  if (!player.playlist._ontimeout) {
    player.playlist._ontimeout = ontimeout;
    return player.one('ended', ontimeout);
  }

  // we want to reset the timeout for auto advance
  resetadvance(player);
  player.playlist._ontimeout = ontimeout;
  player.one('ended', ontimeout);
};

module.exports.resetadvance = resetadvance = function resetadvance(player) {
  if (player.playlist._timeoutId) {
    window.clearTimeout(player.playlist._timeoutId);
  }

  if (player.playlist._ontimeout) {
    player.off('ended', player.playlist._ontimeout);
  }

  player.playlist._timeoutId = null;
  player.playlist._ontimeout = null;
};

},{}],2:[function(require,module,exports){
var setupAutoadvance = require('./autoadvance.js');

var clearTracks = function(player) {
  var remoteTT = player.remoteTextTracks();
  var i = (remoteTT && remoteTT.length) || 0;

  while (i--) {
    player.removeRemoteTextTrack(remoteTT[i]);
  }
};

var playItem = function(player, autoadvanceTimeout, obj) {
  var i, replay;

  replay = !player.paused() || player.ended();

  player.poster(obj.poster || '');
  player.src(obj.sources);

  clearTracks(player);

  i = (obj.textTracks && obj.textTracks.length) || 0;
  while (i--) {
    player.addRemoteTextTrack(obj.textTracks[i]);
  }

  if (replay) {
    player.play();
  }

  setupAutoadvance(player, autoadvanceTimeout);

  return player;
};

module.exports = playItem;
module.exports.clearTracks = clearTracks;

},{"./autoadvance.js":1}],3:[function(require,module,exports){
var playItem = require('./playitem.js');
var setupAutoadvance = require('./autoadvance.js');
var isArray = Array.isArray || function(array) {
  return Object.prototype.toString.call(array) === '[object Array]';
};
var indexInSources = function(arr, src) {
  var i = 0;
  var j = 0;
  var item;
  var source;

  for (; i < arr.length; i++) {
    item = arr[i];
    for (j = 0; j < item.sources.length; j++) {
      source = item.sources[j];
      if (source && (source === src || source.src === src)) {
        return i;
      }
    }
  }

  return -1;
};

// factory method to return a new playlist with the following API
// playlist(["a", "b", "c"]) // setter, ["a", "b", "c"]
// playlist() // getter, ["a", "b", "c"]
// playlist.currentItem() // getter, 0
// playlist.currentItem(1) // setter, 1
// playlist.next() // "c"
// playlist.previous() // "b"
var playlistMaker = function(player, plist) {
  var currentIndex = -1;
  var autoadvanceTimeout = null;
  var list = [];
  var playlistchangeTimeout;
  var loadFirstItem = function loadFirstItem() {
    if (list.length > 0) {
      currentIndex = 0;
      playItem(player, autoadvanceTimeout, list[0]);
    } else {
      currentIndex = -1;
    }
  };

  if (plist && isArray(plist)) {
    list = plist.slice();
  }

  player.on('dispose', function() {
    window.clearTimeout(playlistchangeTimeout);
    playlistchangeTimeout = null;
  });

  var playlist = function playlist(plist) {
    if (plist && isArray(plist)) {
      list = plist.slice();
      loadFirstItem();

      playlistchangeTimeout = window.setTimeout(function() {
        player.trigger('playlistchange');
      }, 0);
    }

    return list.slice();
  };

  playlist.currentItem = function item(index) {
    var src;

    if (typeof index === 'number' &&
        currentIndex !== index &&
        index >= 0 &&
        index < list.length) {
      currentIndex = index;
      playItem(player, autoadvanceTimeout, list[currentIndex]);
      return currentIndex;
    }

    src = player.currentSrc() || '';
    currentIndex = playlist.indexOf(src);

    return currentIndex;
  };

  // item can be either
  //  * a string
  //  * an array of sources, which are either strings or {src, type} objects
  //  * a playlist item
  playlist.contains = function contains(item) {
    return player.playlist.indexOf(item) !== -1;
  };

  playlist.indexOf = function indexOf(item) {
    var ret = -1;
    var sources;
    var source;
    var i;

    if (typeof item === 'string') {
      ret = indexInSources(list, item);
    } else {
      if (isArray(item)) {
        sources = item;
      } else {
        sources = item.sources;
      }

      for (i = 0; i < sources.length; i++) {
        source = sources[i];
        if (typeof source === 'string') {
          ret = indexInSources(list, source);
        } else if (source.src) {
          ret = indexInSources(list, source.src);
        }

        if (ret !== -1) {
          break;
        }
      }
    }

    return ret;
  };

  playlist.next = function next() {
    var prevIndex = currentIndex;
    // make sure we don't go past the end of the playlist
    currentIndex = Math.min(currentIndex + 1, list.length - 1);
    if (prevIndex === currentIndex) {
      player.trigger('playlistended');
      return;
    }
    playItem(player, autoadvanceTimeout, list[currentIndex]);
    return list[currentIndex];
  };

  playlist.previous = function previous() {
    var prevIndex = currentIndex;
    // make sure we don't go past the start of the playlist
    currentIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex === currentIndex) {
      return;
    }
    playItem(player, autoadvanceTimeout, list[currentIndex]);
    return list[currentIndex];
  };

  playlist.autoadvance = function autoadvance(timeout) {
    autoadvanceTimeout = timeout;

    setupAutoadvance(player, autoadvanceTimeout);
  };

  loadFirstItem();

  player.on('loadstart', function() {
    if (player.playlist.currentItem() === -1) {
      setupAutoadvance.resetadvance(player);
    }
  });

  return playlist;
};

module.exports = playlistMaker;

},{"./autoadvance.js":1,"./playitem.js":2}],4:[function(require,module,exports){
(function (global){
var playlistMaker = require('./src/playlist-maker.js');
var videojs = (typeof window !== "undefined" ? window['videojs'] : typeof global !== "undefined" ? global['videojs'] : null);

var playlist = function playlist(list) {
  this.playlist = playlistMaker(this, list);
};

module.exports = playlist;
videojs.plugin('playlist', playlist);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./src/playlist-maker.js":3}]},{},[4])(4)
});