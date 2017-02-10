import videojs from 'video.js';
import playlistMaker from './playlist-maker';

// Video.js 5/6 cross-compatible.
const registerPlugin = videojs.registerPlugin || videojs.plugin;

/**
 * The video.js playlist plugin. Invokes the playlist-maker to create a
 * playlist function on the specific player.
 *
 * @param {Array} list
 */
const plugin = function(list, item) {
  playlistMaker(this, list, item);
};

registerPlugin('playlist', plugin);

export default plugin;
