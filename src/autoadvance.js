var resetadvance;

module.exports = function autoadvance(player, timeout) {
  // we want to cancel the auto advance or auto advance was called with a bogus value
  if (typeof timeout !== 'number' || timeout !== timeout || timeout < 0 || timeout === Infinity) {
    return resetadvance(player);
  }

  var ontimeout = function() {
    player.playlist._timeoutId = window.setTimeout(function() {
      resetadvance(player);
      player.playlist.next();
    }, timeout * 1000);
  };

  // we called auto advance while an auto-advance was in progress
  if (player.playlist._timeoutId) {
    return resetadvance(player);
  }

  // we are starting a new video and don't have a timeout handler for it
  if (!player.playlist._ontimeout) {
    player.playlist._ontimeout = ontimeout;
    return player.one('ended', ontimeout);
  }

  // we want to reset the timeout for auto advance
  resetadvance(player);
  player.playlist._ontimeout = ontimeout;
  player.one('ended', ontimeout);
};

module.exports.resetadvance = resetadvance = function resetadvance(player) {
  if (player.playlist._timeoutId) {
    window.clearTimeout(player.playlist._timeoutId);
  }

  if (player.playlist._ontimeout) {
    player.off('ended', player.playlist._ontimeout);
  }

  player.playlist._timeoutId = null;
  player.playlist._ontimeout = null;
};
