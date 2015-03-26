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
        } else {
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
