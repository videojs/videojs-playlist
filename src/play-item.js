import {setup} from './auto-advance.js';

/**
 * Removes all remote text tracks from a player.
 *
 * @param  {Player} player
 */
const clearTracks = (player) => {
  let tracks = player.remoteTextTracks();

  // `remoteTextTracks` returns a `TextTrackList` object which stores its
  // tracks on the `tracks_` property.
  tracks = tracks ? tracks.tracks_ : [];
  tracks.forEach(player.removeRemoteTextTrack);
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
