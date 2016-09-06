import {setup} from './auto-advance.js';

/**
 * Removes all remote text tracks from a player.
 *
 * @param  {Player} player
 */
const clearTracks = (player) => {
  const tracks = player.remoteTextTracks();
  let i = tracks && tracks.length || 0;

  // This uses a `while` loop rather than `forEach` because the
  // `TextTrackList` object is a live DOM list (not an array).
  while (i--) {
    player.removeRemoteTextTrack(tracks[i]);
  }
};

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
  const replay = !player.paused() || player.ended();

  player.trigger('beforeplaylistitem', item);
  player.poster(item.poster || '');
  player.src(item.sources);
  clearTracks(player);
  (item.textTracks || []).forEach(player.addRemoteTextTrack.bind(player));
  player.trigger('playlistitem', item);

  if (replay) {
    player.play();
  }

  setup(player, delay);

  return player;
};

export default playItem;
export {clearTracks};
