var playlist = require('./src/playlist.js');
var videojs = require('video.js');
videojs.plugin('playlist', playlist);
