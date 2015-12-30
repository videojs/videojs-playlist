import window from 'global/window';

/**
 * Validates a number of seconds to use as the auto-advance delay.
 *
 * @private
 * @param   {Number} s
 * @return  {Boolean}
 */
const validSeconds = s =>
  typeof s === 'number' && !isNaN(s) && s >= 0 && s < Infinity;

/**
 * Resets the auto-advance behavior of a player.
 *
 * @param {Player} player
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
 * @param  {Number} delay
 *         The number of seconds to wait before each auto-advance.
 */
const setup = (player, delay) => {
  reset(player);

  // Before queuing up new auto-advance behavior, check if `seconds` was
  // called with a valid value.
  if (!validSeconds(delay)) {
    return;
  }

  player.playlist.autoadvance_.trigger = function() {
    player.playlist.autoadvance_.timeout = window.setTimeout(() => {
      reset(player);
      player.playlist.next();
    }, delay * 1000);
  };

  player.one('ended', player.playlist.autoadvance_.trigger);
};

export {
  reset,
  setup
};
