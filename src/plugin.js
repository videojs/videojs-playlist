import videojs from 'video.js';
import playlistMaker from './playlist-maker';

/**
 * The video.js plugin.
 *
 * @function plugin
 * @param    {Array} list
 */
const plugin = function(list) {
  playlistMaker(this, list);
};

videojs.plugin('playlist', plugin);

export default plugin;
