import window from 'global/window';
import {setup} from './auto-advance.js';

/**
 * Plays an item on a player's playlist.
 *
 * @param  {Player} player
 * @param  {Number} delay
 *         The number of seconds to wait before each auto-advance.
 *
 * @param  {Object} item
 *         A source from the playlist.
 *
 * @return {Player}
 */
const playItem = (player, delay, item) => {
  player.trigger('beforeplaylistitem', item);

  let replay = !player.paused() || player.ended();

  player.poster(item.poster || '');
  player.src(item.sources);
  player.trigger('playlistitem', item);

  if (replay) {
    player.play();
  }

  setup(player, delay);

  return player;
};

export default playItem;
