var clearTracks = function(player) {
  var remoteTT = player.remoteTextTracks();
  var i = (remoteTT && remoteTT.length) || 0;

  while (i--) {
    player.removeRemoteTextTrack(remoteTT[i]);
  }
};

var playItem = function(player, obj) {
  var i, replay;

  replay = !player.paused();

  player.poster(obj.poster);
  player.src(obj.sources);

  clearTracks(player);

  i = (obj.textTracks && obj.textTracks.length) || 0;
  while (i--) {
    player.addRemoteTextTrack(obj.textTracks[i]);
  }

  if (replay) {
    player.play();
  }

  return player;
};

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
