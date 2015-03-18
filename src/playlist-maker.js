var playItem = require('./playitem.js');
var setupAutoadvance = require('./autoadvance.js');
var isArray = Array.isArray || function(array) {
  return Object.prototype.toString.call(array) === '[object Array]';
};
var isInSources = function(arr, src) {
  var i = 0;
  var j = 0;
  var item;
  var source;

  for (; i < arr.length; i++) {
    item = arr[i];
    for (j = 0; j < item.sources.length; j++) {
      source = item.sources[j];
      if (source && (source === src || source.src === src)) {
        return true;
      }
    }
  }

  return false;
};

// factory method to return a new playlist with the following API
// playlist(["a", "b", "c"]) // setter, ["a", "b", "c"]
// playlist() // getter, ["a", "b", "c"]
// playlist.currentItem() // getter, 0
// playlist.currentItem(1) // setter, 1
// playlist.next() // "c"
// playlist.previous() // "b"
var playlistMaker = function(player, plist) {
  var currentIndex = 0;
  var autoadvanceTimeout = null;
  var list = [];
  var loadFirstItem = function loadFirstItem() {
    if (list.length > 0) {
      playItem(player, autoadvanceTimeout, list[0]);
    }
  };

  if (plist && isArray(plist)) {
    list = plist.slice();
  }

  var playlist = function playlist(plist) {
    if (plist && isArray(plist)) {
      list = plist.slice();
      loadFirstItem();

      window.setTimeout(function() {
        player.trigger('playlistchange');
      }, 0);
    }

    return list.slice();
  };

  playlist.currentItem = function item(index) {
    if (typeof index === 'number' &&
        currentIndex !== index &&
        index >= 0 &&
        index < list.length) {
      currentIndex = index;
      playItem(player, autoadvanceTimeout, list[currentIndex]);
      return currentIndex;
    }

    return currentIndex;
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
    var currentSrc = player.currentSrc();
    if (!isInSources(list, currentSrc)) {
      currentIndex = -1;
      setupAutoadvance.resetadvance(player);
    }
  });

  return playlist;
};

module.exports = playlistMaker;
