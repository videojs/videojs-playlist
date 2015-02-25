module.exports = function autoadvance(player, timeout) {
  var resetadvance = function resetadvance() {
    if (player.playlist._timeoutId) {
      window.clearTimeout(player.playlist._timeoutId);
    }

    if (player.playlist._ontimeout) {
      player.off('ended', player.playlist._ontimeout);
    }

    player.playlist._timeoutId = null;
    player.playlist._ontimeout = null;
  };

  // we are want to cancel the auto advance or accidentally called it with a bogus value
  if (typeof timeout !== 'number' || timeout < 0) {
    return resetadvance();
  }

  var ontimeout = function() {
    player.playlist._timeoutId = window.setTimeout(function() {
      resetadvance();
      player.playlist.next();
    }, timeout);
  };

  // we called auto advance while an auto-advance was in progress
  if (player.playlist._timeoutId) {
    return resetadvance();
  }

  // we are starting a new video and don't have a timeout handler for it
  if (!player.playlist._ontimeout) {
    player.playlist._ontimeout = ontimeout;
    return player.one('ended', ontimeout);
  }

  // we want to reset the timeout for auto advance
  resetadvance();
  player.playlist._ontimeout = ontimeout;
  player.one('ended', ontimeout);
};
