import QUnit from 'qunit';
import playItem from '../src/play-item';
import {clearTracks} from '../src/play-item';
import playerProxyMaker from './player-proxy-maker';

QUnit.module('play-item');

QUnit.test('clearTracks will try and remove all tracks', function(assert) {
  let player = playerProxyMaker();
  let remoteTracks = [1, 2, 3];
  let removedTracks = [];

  player.remoteTextTracks = function() {
    return {tracks_: remoteTracks};
  };

  player.removeRemoteTextTrack = function(tt) {
    removedTracks.push(tt);
  };

  clearTracks(player);

  assert.deepEqual(
    removedTracks.sort(),
    remoteTracks.sort(),
    'the removed tracks are equivalent to our remote tracks'
  );
});

QUnit.test(
  'playItem() works as expected for setting sources, poster, and tracks',
  function(assert) {
    let player = playerProxyMaker();
    let setSrc;
    let setPoster;
    let setTracks = [];

    player.src = function(src) {
      setSrc = src;
    };

    player.poster = function(poster) {
      setPoster = poster;
    };

    player.addRemoteTextTrack = function(tt) {
      setTracks.push(tt);
    };

    playItem(player, null, {
      sources: [1, 2, 3],
      textTracks: [4, 5, 6],
      poster: 'http://example.com/poster.png'
    });

    assert.deepEqual(setSrc, [1, 2, 3], 'sources are what we expected');
    assert.deepEqual(setTracks.sort(), [4, 5, 6].sort(), 'tracks are what we expected');

    assert.equal(
      setPoster,
      'http://example.com/poster.png',
      'poster is what we expected'
    );
  }
);

QUnit.test('will not try to play if paused', function(assert) {
  let player = playerProxyMaker();
  let tryPlay = false;

  player.paused = function() {
    return true;
  };

  player.play = function() {
    tryPlay = true;
  };

  playItem(player, null, {
    sources: [1, 2, 3],
    textTracks: [4, 5, 6],
    poster: 'http://example.com/poster.png'
  });

  assert.ok(!tryPlay, 'we did not reply on paused');
});

QUnit.test('will try to play if not paused', function(assert) {
  let player = playerProxyMaker();
  let tryPlay = false;

  player.paused = function() {
    return false;
  };

  player.play = function() {
    tryPlay = true;
  };

  playItem(player, null, {
    sources: [1, 2, 3],
    textTracks: [4, 5, 6],
    poster: 'http://example.com/poster.png'
  });

  assert.ok(tryPlay, 'we replayed on not-paused');
});

QUnit.test('will not try to play if paused and not ended', function(assert) {
  let player = playerProxyMaker();
  let tryPlay = false;

  player.paused = function() {
    return true;
  };

  player.ended = function() {
    return false;
  };

  player.play = function() {
    tryPlay = true;
  };

  playItem(player, null, {
    sources: [1, 2, 3],
    textTracks: [4, 5, 6],
    poster: 'http://example.com/poster.png'
  });

  assert.ok(!tryPlay, 'we did not replaye on paused and not ended');
});

QUnit.test('will try to play if paused and ended', function(assert) {
  let player = playerProxyMaker();
  let tryPlay = false;

  player.paused = function() {
    return true;
  };

  player.ended = function() {
    return true;
  };

  player.play = function() {
    tryPlay = true;
  };

  playItem(player, null, {
    sources: [1, 2, 3],
    textTracks: [4, 5, 6],
    poster: 'http://example.com/poster.png'
  });

  assert.ok(tryPlay, 'we replayed on not-paused');
});
