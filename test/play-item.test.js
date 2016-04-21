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
    return remoteTracks;
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
  'playItem() works as expected for setting sources, poster, tracks and cue points',
  function(assert) {
    let oldVttCue = window.VTTCue;
    let player = playerProxyMaker();
    let setSrc;
    let setPoster;
    let setTracks = [];
    let cues = [];

    window.VTTCue = (startTime, endTime, type) => ({startTime, endTime, type });

    player.src = function(src) {
      setSrc = src;
    };

    player.poster = function(poster) {
      setPoster = poster;
    };

    player.addRemoteTextTrack = function(tt) {
      setTracks.push(tt);
      return {
        track: {
          addCue(cue) {
            cues.push(cue);
          }
        }
      };
    };

    playItem(player, null, {
      sources: [1, 2, 3],
      textTracks: [4, 5, 6],
      poster: 'http://example.com/poster.png',
      cuePoints: [{startTime: 0, endTime: 0.01667, type: 'foo' },
      {startTime: 1, endTime: 1.01667, type: 'bar' }]
    });

    assert.deepEqual(setSrc, [1, 2, 3], 'sources are what we expected');
    assert.deepEqual(
      setTracks.sort(),
      [4, 5, 6, { kind: 'metadata' }].sort(),
      'tracks are what we expected'
    );

    assert.equal(
      setPoster,
      'http://example.com/poster.png',
      'poster is what we expected'
    );

    assert.deepEqual(
      cues,
      [{startTime: 0, endTime: 0.01667, type: 'foo' },
      {startTime: 1, endTime: 1.01667, type: 'bar' }],
      'cues are what we expected'
    );
    window.VTTCue = oldVttCue;
  }
);

QUnit.test(
  'Backwards compatibility test for old cue points property using just time',
  function(assert) {
    let oldVttCue = window.VTTCue;
    let player = playerProxyMaker();
    let setTracks = [];
    let cues = [];

    window.VTTCue = (startTime, endTime, type) => ({startTime, endTime, type });

    player.addRemoteTextTrack = function(tt) {
      setTracks.push(tt);
      return {
        track: {
          addCue(cue) {
            cues.push(cue);
          }
        }
      };
    };

    playItem(player, null, {
      cuePoints: [{time: 0, type: 'foo' },
      {time: 1, type: 'bar' }]
    });

    assert.deepEqual(
      cues,
      [{startTime: 0, endTime: 0, type: 'foo' },
      {startTime: 1, endTime: 1, type: 'bar' }],
      'cues are what we expected'
    );

    window.VTTCue = oldVttCue;
  }
);

QUnit.test(
  'ensure we are using startTime/endTime rather than time if possible',
  function(assert) {
    let oldVttCue = window.VTTCue;
    let player = playerProxyMaker();
    let setTracks = [];
    let cues = [];

    window.VTTCue = (startTime, endTime, type) => ({startTime, endTime, type});

    player.addRemoteTextTrack = function(tt) {
      setTracks.push(tt);
      return {
        track: {
          addCue(cue) {
            cues.push(cue);
          }
        }
      };
    };

    playItem(player, null, {
      cuePoints: [
        {time: 0, endTime: 0.0166, startTime: 0.0111, type: 'foo' },
        {time: 1, endTime: 1.0166, startTime: 1.0111, type: 'bar' }
      ]
    });

    assert.deepEqual(
      cues,
      [
        {endTime: 0.0166, startTime: 0.0111, type: 'foo' },
        {endTime: 1.0166, startTime: 1.0111, type: 'bar' }
      ],
      'We are not choosing the property endTime correctly'
    );

    window.VTTCue = oldVttCue;
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
