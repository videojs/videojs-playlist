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
