import window from 'global/window';
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
  let Cue = window.VTTCue || window.TextTrackCue;
  let replay = !player.paused() || player.ended();

  player.poster(item.poster || '');
  player.src(item.sources);

  clearTracks(player);

  if (item.cuePoints && item.cuePoints.length) {
    let trackEl = player.addRemoteTextTrack({ kind: 'metadata' });

    item.cuePoints.forEach(cue => {
      let vttCue = new Cue(
        cue.startTime || cue.time || 0,
        cue.endTime || cue.time || 0,
        cue.type
      );

      trackEl.track.addCue(vttCue);
    });
  }

  (item.textTracks || []).forEach(player.addRemoteTextTrack.bind(player));

  if (replay) {
    player.play();
  }

  setup(player, delay);

  return player;
};

export default playItem;
export {clearTracks};
