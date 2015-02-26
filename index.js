var playlistMaker = require('./src/playlist-maker.js');
var videojs = require('video.js');

var playlist = function playlist(list) {
  this.playlist = playlistMaker(this, list);
};

module.exports = playlist;
videojs.plugin('playlist', playlist);
