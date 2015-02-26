var q = QUnit,
    playitem = require('../src/playitem.js'),
    playerProxy = require('./player-proxy.js'),
    extend = require('util')._extend;

q.module('playitem')

q.test('clearTracks will try and remove all tracks', function() {
  var player = extend({}, playerProxy),
      remoteTracks = [1,2,3],
      removedTracks = [];

  player.remoteTextTracks = function() {
    return remoteTracks;
  };
  player.removeRemoteTextTrack = function(tt) {
    removedTracks.push(tt);
  };

  playitem.clearTracks(player);

  q.deepEqual(removedTracks.sort(), remoteTracks.sort(), 'the removed tracks are equivalent to our remote tracks');
});

q.test('playItem() works as expected for setting sources, poster, and tracks', function() {
  var player = extend({}, playerProxy),
      setSrc,
      setPoster,
      setTracks = [];

  player.src = function(src) {
    setSrc = src;
  };

  player.poster = function(poster) {
    setPoster = poster;
  };

  player.addRemoteTextTrack = function(tt) {
    setTracks.push(tt);
  };

  playitem(player, null, {
    sources: [1,2,3],
    textTracks: [4,5,6],
    poster: 'http://example.com/poster.png'
  });

  q.deepEqual(setSrc, [1,2,3], 'sources are what we expected');
  q.deepEqual(setTracks.sort(), [4,5,6].sort(), 'tracks are what we expected');
  q.equal(setPoster, 'http://example.com/poster.png', 'poster is what we expected');
});

q.test('will not try to play if paused', function() {
  var player = extend({}, playerProxy),
      tryPlay = false,
      setSrc,
      setPoster,
      setTracks = [];

  player.paused = function() {
    return true;
  };

  player.play = function() {
    tryPlay = true;
  };

  playitem(player, null, {
    sources: [1,2,3],
    textTracks: [4,5,6],
    poster: 'http://example.com/poster.png'
  });

  q.ok(!tryPlay, 'we did not reply on paused');
});

q.test('will try to play if not paused', function() {
  var player = extend({}, playerProxy),
      tryPlay = false,
      setSrc,
      setPoster,
      setTracks = [];

  player.paused = function() {
    return false;
  };

  player.play = function() {
    tryPlay = true;
  };

  playitem(player, null, {
    sources: [1,2,3],
    textTracks: [4,5,6],
    poster: 'http://example.com/poster.png'
  });

  q.ok(tryPlay, 'we replayed on not-paused');
});

q.test('will not try to play if paused and not ended', function() {
  var player = extend({}, playerProxy),
      tryPlay = false,
      setSrc,
      setPoster,
      setTracks = [];

  player.paused = function() {
    return true;
  };

  player.ended = function() {
    return false;
  };

  player.play = function() {
    tryPlay = true;
  };

  playitem(player, null, {
    sources: [1,2,3],
    textTracks: [4,5,6],
    poster: 'http://example.com/poster.png'
  });

  q.ok(!tryPlay, 'we did not replaye on paused and not ended');
});

q.test('will try to play if paused and ended', function() {
  var player = extend({}, playerProxy),
      tryPlay = false,
      setSrc,
      setPoster,
      setTracks = [];

  player.paused = function() {
    return true;
  };

  player.ended = function() {
    return true;
  };

  player.play = function() {
    tryPlay = true;
  };

  playitem(player, null, {
    sources: [1,2,3],
    textTracks: [4,5,6],
    poster: 'http://example.com/poster.png'
  });

  q.ok(tryPlay, 'we replayed on not-paused');
});
