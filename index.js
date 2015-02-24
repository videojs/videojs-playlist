var playItem = require('./src/playitem.js');

var playlistMaker = function(player, plist) {
  var currentIndex = 0;
  var playlist = function playlist(list) {
    this.playlist = playlistMaker(this, list);
  };

  playlist.list = function list() {
    return plist.slice();
  };

  playlist.item = function item(index) {
    if (typeof index === 'number' && index >= 0 && index < plist.length) {
      currentIndex = index;
      return playItem(player, plist[currentIndex]);
    }

    return currentIndex;
  };

  playlist.next = function next() {
    var prevIndex = currentIndex;
    currentIndex = Math.min(currentIndex + 1, plist.length - 1);
    if (prevIndex === currentIndex) {
      return;
    }
    return playItem(player, plist[currentIndex]);
  };

  playlist.previous = function previous() {
    var prevIndex = currentIndex;
    currentIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex === currentIndex) {
      return;
    }
    return playItem(player, plist[currentIndex]);
  };

  playlist.item(0);

  return playlist;
};

var playlist = function playlist(list) {
  this.playlist = playlistMaker(this, list);
};


videojs.plugin('playlist', playlist);
