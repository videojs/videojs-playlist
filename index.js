var playItem = require('./src/playitem.js');
var setupAutoadvance = require('./src/autoadvance.js');

var playlistMaker = function(player, plist) {
  var currentIndex = 0;
  var autoadvanceTimeout = null;

  var playlist = function playlist(list) {
    this.playlist = playlistMaker(this, list);
  };

  playlist.list = function list() {
    return plist.slice();
  };

  playlist.item = function item(index) {
    if (typeof index === 'number' && index >= 0 && index < plist.length) {
      currentIndex = index;
      return playItem(player, autoadvanceTimeout, plist[currentIndex]);
    }

    return currentIndex;
  };

  playlist.next = function next() {
    var prevIndex = currentIndex;
    currentIndex = Math.min(currentIndex + 1, plist.length - 1);
    if (prevIndex === currentIndex) {
      return;
    }
    return playItem(player, autoadvanceTimeout, plist[currentIndex]);
  };

  playlist.previous = function previous() {
    var prevIndex = currentIndex;
    currentIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex === currentIndex) {
      return;
    }
    return playItem(player, autoadvanceTimeout, plist[currentIndex]);
  };

  playlist.autoadvance = function autoadvance(timeout) {
    if (typeof timeout !== 'number') {
      autoadvance = null;
    }

    autoadvanceTimeout = timeout;

    setupAutoadvance(player, autoadvanceTimeout);
  };

  playlist.item(0);

  return playlist;
};

var playlist = function playlist(list) {
  this.playlist = playlistMaker(this, list);
};


videojs.plugin('playlist', playlist);
