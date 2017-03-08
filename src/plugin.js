import videojs from 'video.js';
import playlistMaker from './playlist-maker';

/**
 * The video.js playlist plugin. Invokes the playlist-maker to create a
 * playlist function on the specific player.
 *
 * @param {Array} list
 */
const plugin = function(list, item) {
  playlistMaker(this, list, item);
};

plugin.shuffle_ = false;

plugin.shuffle = function(val) {
  if (val !== undefined) {
    plugin.shuffle_ = val;
  }
  return plugin.shuffle_;
}

plugin.repeat_ = false;

plugin.repeat = function(val) {
  if (val !== undefined) {
    plugin.repeat_ = val;
  }
  return plugin.repeat_;
}

videojs.plugin('playlist', plugin);

export default plugin;
