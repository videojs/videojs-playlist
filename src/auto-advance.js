import window from 'global/window';

/**
 * Validates a number of seconds to use as the auto-advance delay.
 *
 * @param  {Number} s
 * @return {Boolean}
 */
const validSeconds = s =>
  typeof s === 'number' && !isNaN(s) && s >= 0 && s < Infinity;

/**
 * Resets the auto-advance behavior of a player.
 *
 * @param  {Player} player
 */
const reset = (player) => {
  if (player.playlist.autoadvance_.timeout) {
    window.clearTimeout(player.playlist.autoadvance_.timeout);
  }

  if (player.playlist.autoadvance_.trigger) {
    player.off('ended', player.playlist.autoadvance_.trigger);
  }

  player.playlist.autoadvance_.timeout = null;
  player.playlist.autoadvance_.trigger = null;
};

/**
 * Sets up auto-advance behavior on a player.
 *
 * @param  {Player} player
 * @param  {Number} seconds
 */
const setup = (player, seconds) => {
  reset(player);

  // Before queuing up auto-advance behavior, check if `seconds` was
  // called with a valid value and make sure the playlist is not currently
  // between videos.
  if (validSeconds(seconds) && !player.playlist.autoadvance_.timeout) {

    player.playlist.autoadvance_.trigger = function() {
      player.playlist.autoadvance_.timeout = window.setTimeout(() => {
        reset(player);
        player.playlist.next();
      }, seconds * 1000);
    };

    player.one('ended', player.playlist.autoadvance_.trigger);
  }
};

export {
  reset,
  setup
};
