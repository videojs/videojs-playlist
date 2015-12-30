import {setup} from './auto-advance.js';

/**
 * Removes all remote text tracks from a player.
 *
 * @param  {Player} player
 */
const clearTracks = (player) => {
  let tracks = player.remoteTextTracks();
  let i = tracks && tracks.length || 0;

  // This uses a `while` loop rather than `forEach` because the
  // `TextTrackList` object is not a true array.
  while (i--) {
    player.removeRemoteTextTrack(tracks[i]);
  }
};

/**
 * Plays an item on a player's playlist.
 *
 * @param  {Player} player
 * @param  {Number} delay
 * @param  {Object} item
 * @return {Player}
 */
const playItem = (player, delay, item) => {
  let replay = !player.paused() || player.ended();

  player.poster(item.poster || '');
  player.src(item.sources);

  clearTracks(player);

  (item.textTracks || []).forEach(player.addRemoteTextTrack);

  if (replay) {
    player.play();
  }

  setup(player, delay);

  return player;
};

export default playItem;
export {clearTracks};