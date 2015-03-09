var playItem = require('./playitem.js');
var setupAutoadvance = require('./autoadvance.js');
var isArray = Array.isArray || function(array) {
  return Object.prototype.toString.call(array) === '[object Array]';
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

  if (plist && isArray(plist)) {
    list = plist.slice();
  }

  var playlist = function playlist(plist) {
    if (plist && isArray(plist)) {
      list = plist.slice();
      player.playlist.currentItem(0);
    }

    return list.slice();
  };

  playlist.currentItem = function item(index) {
    if (typeof index === 'number' && index >= 0 && index < list.length) {
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

  if (list.length) {
    playlist.currentItem(0);
  }

  return playlist;
};

module.exports = playlistMaker;
