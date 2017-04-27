import window from 'global/window';

/**
 * Validates a number of seconds to use as the auto-advance delay.
 *
 * @private
 * @param   {number} s
 *          The number to check
 *
 * @return  {boolean}
 *          Whether this is a valid second or not
 */
const validSeconds = s =>
  typeof s === 'number' && !isNaN(s) && s >= 0 && s < Infinity;

/**
 * Resets the auto-advance behavior of a player.
 *
 * @param {Player} player
 *        The player to reset the behavior on
 */
let reset = (player) => {
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
 *         the current player
 *
 * @param  {number} delay
 *         The number of seconds to wait before each auto-advance.
 *
 * @return {undefined}
 *         Used to short circuit function logic
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

/**
 * Used to change the reset function in this module at runtime
 * This should only be used in tests.
 *
 * @param {Function} fn
 *        The function to se the reset to
 */
const setReset_ = (fn) => {
  reset = fn;
};

export {
  setReset_,
  reset,
  setup
};
