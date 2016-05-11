import window from 'global/window';
import QUnit from 'qunit';
import playlistMaker from '../src/playlist-maker';
import * as autoadvance from '../src/auto-advance';
import playerProxyMaker from './player-proxy-maker';

const videoList = [{
  sources: [{
    src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/sintel/poster.png'
}, {
  sources: [{
    src: 'http://media.w3.org/2010/05/bunny/trailer.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/bunny/poster.png'
}, {
  sources: [{
    src: 'http://vjs.zencdn.net/v/oceans.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://www.videojs.com/img/poster.jpg'
}, {
  sources: [{
    src: 'http://media.w3.org/2010/05/bunny/movie.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/bunny/poster.png'
}, {
  sources: [{
    src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/video/poster.png'
}];

QUnit.module('playlist', {

  beforeEach() {
    this.oldTimeout = window.setTimeout;
    window.setTimeout = Function.prototype;
  },

  afterEach() {
    window.setTimeout = this.oldTimeout;
  }
});

QUnit.test(
  'playlistMaker takes a player and a list and returns a playlist',
  function(assert) {
    let playlist = playlistMaker(playerProxyMaker(), []);

    assert.equal(typeof playlist, 'function', 'playlist is a function');
    assert.equal(
      typeof playlist.autoadvance,
      'function',
      'we have a autoadvance function'
    );

    assert.equal(
      typeof playlist.currentItem,
      'function',
      'we have a currentItem function'
    );

    assert.equal(typeof playlist.first, 'function', 'we have a first function');
    assert.equal(typeof playlist.indexOf, 'function', 'we have a indexOf function');
    assert.equal(typeof playlist.next, 'function', 'we have a next function');
    assert.equal(typeof playlist.previous, 'function', 'we have a previous function');
  }
);

QUnit.test('playlistMaker can either take nothing or only an Array', function(assert) {
  let playlist1 = playlistMaker(playerProxyMaker());
  let playlist2 = playlistMaker(playerProxyMaker(), 'foo');
  let playlist3 = playlistMaker(playerProxyMaker(), {foo: [1, 2, 3]});

  assert.deepEqual(
    playlist1(), [], 'if given no initial array, default to an empty array'
  );

  assert.deepEqual(
    playlist2(), [], 'if given no initial array, default to an empty array'
  );

  assert.deepEqual(
    playlist3(), [], 'if given no initial array, default to an empty array'
  );
});

QUnit.test('playlist() is a getter and setter for the list', function(assert) {
  let playlist = playlistMaker(playerProxyMaker(), [1, 2, 3]);

  assert.deepEqual(playlist(), [1, 2, 3], 'equal to input list');

  assert.deepEqual(
    playlist([1, 2, 3, 4, 5]),
    [1, 2, 3, 4, 5],
    'equal to input list, arguments ignored'
  );

  assert.deepEqual(playlist(), [1, 2, 3, 4, 5], 'equal to input list');

  let list = playlist();

  list.unshift(10);

  assert.deepEqual(
    playlist(),
    [1, 2, 3, 4, 5],
    'changing the list did not affect the playlist'
  );

  assert.notDeepEqual(
    playlist(),
    [10, 1, 2, 3, 4, 5],
    'changing the list did not affect the playlist'
  );
});

QUnit.test('playlist() should only accept an Array as a new playlist', function(assert) {
  let playlist = playlistMaker(playerProxyMaker(), [1, 2, 3]);

  assert.deepEqual(
    playlist('foo'),
    [1, 2, 3],
    'when given "foo", it should be treated as a getter'
  );

  assert.deepEqual(
    playlist({foo: [1, 2, 3]}),
    [1, 2, 3],
    'when given {foo: [1,2,3]}, it should be treated as a getter'
  );
});

QUnit.test('playlist.currentItem() works as expected', function(assert) {
  let player = playerProxyMaker();
  let playlist = playlistMaker(player, videoList);
  let src;

  player.src = function(s) {
    if (s) {
      if (typeof s === 'string') {
        src = s;
      } else if (Array.isArray(s)) {
        return player.src(s[0]);
      } else {
        return player.src(s.src);
      }
    }
  };

  player.currentSrc = function() {
    return src;
  };

  src = videoList[0].sources[0].src;

  assert.equal(playlist.currentItem(), 0, 'begin at the first item, item 0');

  assert.equal(
    playlist.currentItem(2),
    2,
    'setting to item 2 gives us back the new item index'
  );

  assert.equal(playlist.currentItem(), 2, 'the current item is now 2');
  assert.equal(playlist.currentItem(5), 2, 'cannot change to an out-of-bounds item');
  assert.equal(playlist.currentItem(-1), 2, 'cannot change to an out-of-bounds item');
  assert.equal(playlist.currentItem(null), 2, 'cannot change to an invalid item');
  assert.equal(playlist.currentItem(NaN), 2, 'cannot change to an invalid item');
  assert.equal(playlist.currentItem(Infinity), 2, 'cannot change to an invalid item');
  assert.equal(playlist.currentItem(-Infinity), 2, 'cannot change to an invalid item');
});

QUnit.test('playlist.currentItem() returns -1 with an empty playlist', function(assert) {
  let playlist = playlistMaker(playerProxyMaker(), []);

  assert.equal(playlist.currentItem(), -1, 'we should get a -1 with an empty playlist');
});

QUnit.test(
  'playlist.currentItem() does not change items if same index is given',
  function(assert) {
    let player = playerProxyMaker();
    let sources = 0;
    let playlist;
    let src;

    player.src = function(s) {
      if (s) {
        if (typeof s === 'string') {
          src = s;
        } else if (Array.isArray(s)) {
          return player.src(s[0]);
        } else {
          return player.src(s.src);
        }
      }

      sources++;
    };

    player.currentSrc = function() {
      return src;
    };

    playlist = playlistMaker(player, videoList);

    assert.equal(sources, 1, 'we switched to the first playlist item');
    sources = 0;

    assert.equal(playlist.currentItem(), 0, 'we start at index 0');

    playlist.currentItem(0);
    assert.equal(sources, 0, 'we did not try to set sources');

    playlist.currentItem(1);
    assert.equal(sources, 1, 'we did try to set sources');

    playlist.currentItem(1);
    assert.equal(sources, 1, 'we did not try to set sources');
  }
);

QUnit.test('playlist.contains() works as expected', function(assert) {
  let player = playerProxyMaker();
  let playlist = playlistMaker(player, videoList);

  player.playlist = playlist;

  assert.ok(
    playlist.contains('http://media.w3.org/2010/05/sintel/trailer.mp4'),
    'we can ask whether it contains a source string'
  );

  assert.ok(
    playlist.contains(['http://media.w3.org/2010/05/sintel/trailer.mp4']),
    'we can ask whether it contains a sources list of strings'
  );

  assert.ok(
    playlist.contains([{
      src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
      type: 'video/mp4'
    }]),
    'we can ask whether it contains a sources list of objects'
  );

  assert.ok(
    playlist.contains({
      sources: ['http://media.w3.org/2010/05/sintel/trailer.mp4']
    }),
    'we can ask whether it contains a playlist item'
  );

  assert.ok(
    playlist.contains({
      sources: [{
        src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
        type: 'video/mp4'
      }]
    }),
    'we can ask whether it contains a playlist item'
  );

  assert.ok(
    !playlist.contains('http://media.w3.org/2010/05/sintel/poster.png'),
    'we get false for a non-existent source string'
  );

  assert.ok(
    !playlist.contains(['http://media.w3.org/2010/05/sintel/poster.png']),
    'we get false for a non-existent source list of strings'
  );

  assert.ok(
    !playlist.contains([{
      src: 'http://media.w3.org/2010/05/sintel/poster.png',
      type: 'video/mp4'
    }]),
    'we get false for a non-existent source list of objects'
  );

  assert.ok(!playlist.contains({
    sources: ['http://media.w3.org/2010/05/sintel/poster.png']
  }), 'we can ask whether it contains a playlist item');

  assert.ok(
    !playlist.contains({
      sources: [{
        src: 'http://media.w3.org/2010/05/sintel/poster.png',
        type: 'video/mp4'
      }]
    }),
    'we get false for a non-existent playlist item'
  );
});

QUnit.test('playlist.indexOf() works as expected', function(assert) {
  let player = playerProxyMaker();
  let playlist = playlistMaker(player, videoList);

  let mixedSourcesPlaylist = playlistMaker(
    player,
    [{
      sources: [{
        src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
        type: 'video/mp4'
      }, {
        app_name: 'rtmp://example.com/sintel/trailer', // eslint-disable-line
        avg_bitrate: 4255000, // eslint-disable-line
        codec: 'H264',
        container: 'MP4'
      }],
      poster: 'http://media.w3.org/2010/05/sintel/poster.png'
    }]
  );

  player.playlist = playlist;

  assert.equal(
    playlist.indexOf('http://media.w3.org/2010/05/sintel/trailer.mp4'),
    0,
    'sintel trailer is first item'
  );

  assert.equal(
    playlist.indexOf('//media.w3.org/2010/05/sintel/trailer.mp4'),
    0,
    'sintel trailer is first item, protocol-relative url considered equal'
  );

  assert.equal(
    playlist.indexOf(['http://media.w3.org/2010/05/bunny/trailer.mp4']),
    1,
    'bunny trailer is second item'
  );

  assert.equal(
    playlist.indexOf([{
      src: 'http://vjs.zencdn.net/v/oceans.mp4',
      type: 'video/mp4'
    }]),
    2,
    'oceans is third item'
  );

  assert.equal(
    playlist.indexOf({
      sources: ['http://media.w3.org/2010/05/bunny/movie.mp4']
    }),
    3,
    'bunny movie is fourth item'
  );

  assert.equal(
    playlist.indexOf({
      sources: [{
        src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
        type: 'video/mp4'
      }]
    }),
    4,
    'timer video is fifth item'
  );

  assert.equal(
    playlist.indexOf('http://media.w3.org/2010/05/sintel/poster.png'),
    -1,
    'poster.png does not exist'
  );

  assert.equal(
    playlist.indexOf(['http://media.w3.org/2010/05/sintel/poster.png']),
    -1,
    'poster.png does not exist'
  );

  assert.equal(
    playlist.indexOf([{
      src: 'http://media.w3.org/2010/05/sintel/poster.png',
      type: 'video/mp4'
    }]),
    -1,
    'poster.png does not exist'
  );

  assert.equal(
    playlist.indexOf({
      sources: ['http://media.w3.org/2010/05/sintel/poster.png']
    }),
    -1,
    'poster.png does not exist'
  );

  assert.equal(
    playlist.indexOf({
      sources: [{
        src: 'http://media.w3.org/2010/05/sintel/poster.png',
        type: 'video/mp4'
      }]
    }),
    -1,
    'poster.png does not exist'
  );

  assert.equal(
    mixedSourcesPlaylist.indexOf({
      sources: [{
        src: 'http://media.w3.org/2010/05/bunny/movie.mp4',
        type: 'video/mp4'
      }, {
        app_name: 'rtmp://example.com/bunny/movie', // eslint-disable-line
        avg_bitrate: 4255000, // eslint-disable-line
        codec: 'H264',
        container: 'MP4'
      }],
      poster: 'http://media.w3.org/2010/05/sintel/poster.png'
    }),
    -1,
    'bunny movie does not exist'
  );

  assert.equal(
    mixedSourcesPlaylist.indexOf({
      sources: [{
        src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
        type: 'video/mp4'
      }, {
        app_name: 'rtmp://example.com/sintel/trailer',// eslint-disable-line
        avg_bitrate: 4255000,// eslint-disable-line
        codec: 'H264',
        container: 'MP4'
      }],
      poster: 'http://media.w3.org/2010/05/sintel/poster.png'
    }),
    0,
    'sintel trailer does exist'
  );
});

QUnit.test('playlist.next() works as expected', function(assert) {
  let player = playerProxyMaker();
  let playlist = playlistMaker(player, videoList);
  let src;

  player.currentSrc = function() {
    return src;
  };

  src = videoList[0].sources[0].src;
  assert.equal(playlist.currentItem(), 0, 'we start on item 0');

  assert.deepEqual(
    playlist.next(),
    videoList[1],
    'we get back the value of currentItem 2'
  );

  src = videoList[1].sources[0].src;
  assert.equal(playlist.currentItem(), 1, 'we are now on item 1');

  assert.deepEqual(
    playlist.next(),
    videoList[2],
    'we get back the value of currentItem 3'
  );

  src = videoList[2].sources[0].src;
  assert.equal(playlist.currentItem(), 2, 'we are now on item 2');
  src = videoList[4].sources[0].src;
  assert.equal(playlist.currentItem(4), 4, 'we are now on item 4');

  assert.equal(
    typeof playlist.next(),
    'undefined',
    'we get nothing back if we try to go out of bounds'
  );
});

QUnit.test('playlist.previous() works as expected', function(assert) {
  let player = playerProxyMaker();
  let playlist = playlistMaker(player, videoList);
  let src;

  player.currentSrc = function() {
    return src;
  };

  src = videoList[0].sources[0].src;
  assert.equal(playlist.currentItem(), 0, 'we start on item 0');

  assert.equal(
    typeof playlist.previous(),
    'undefined',
    'we get nothing back if we try to go out of bounds'
  );

  src = videoList[2].sources[0].src;
  assert.equal(playlist.currentItem(), 2, 'we are on item 2');

  assert.deepEqual(
    playlist.previous(),
    videoList[1],
    'we get back value of currentItem 1'
  );

  src = videoList[1].sources[0].src;
  assert.equal(playlist.currentItem(), 1, 'we are on item 1');

  assert.deepEqual(
    playlist.previous(),
    videoList[0],
    'we get back value of currentItem 0'
  );

  src = videoList[0].sources[0].src;
  assert.equal(playlist.currentItem(), 0, 'we are on item 0');

  assert.equal(
    typeof playlist.previous(),
    'undefined',
    'we get nothing back if we try to go out of bounds'
  );
});

QUnit.test(
  'loading a non-playlist video will cancel autoadvance and set index of -1',
  function(assert) {
    let playlist;
    let oldReset = autoadvance.reset;
    let player = playerProxyMaker();

    playlist = playlistMaker(player, [{
      sources: [{
        src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
        type: 'video/mp4'
      }],
      poster: 'http://media.w3.org/2010/05/sintel/poster.png'
    }, {
      sources: [{
        src: 'http://media.w3.org/2010/05/bunny/trailer.mp4',
        type: 'video/mp4'
      }],
      poster: 'http://media.w3.org/2010/05/bunny/poster.png'
    }]);

    player.currentSrc = function() {
      return 'http://vjs.zencdn.net/v/oceans.mp4';
    };

    autoadvance.reset = function() {
      assert.ok(true, 'autoadvance.reset was called');
    };

    player.trigger('loadstart');

    assert.equal(playlist.currentItem(), -1, 'new currentItem is -1');

    player.currentSrc = function() {
      return 'http://media.w3.org/2010/05/sintel/trailer.mp4';
    };

    autoadvance.reset = function() {
      assert.ok(false, 'autoadvance.reset should not be called');
    };

    player.trigger('loadstart');

    autoadvance.reset = oldReset;
  }
);

QUnit.test(
  'when loading a new playlist, trigger "playlistchange" on the player',
  function(assert) {
    let oldTimeout = window.setTimeout;
    let player = playerProxyMaker();
    let playlist;

    window.setTimeout = function(fn, timeout) {
      fn();
    };

    player.trigger = function(type) {
      assert.equal(type, 'playlistchange', 'trigger playlistchange on playlistchange');
    };

    playlist = playlistMaker(player, [1, 2, 3]);

    playlist([4, 5, 6]);

    window.setTimeout = oldTimeout;
  }
);

QUnit.test('clearTimeout on dispose', function(assert) {
  let oldTimeout = window.setTimeout;
  let oldClear = window.clearTimeout;
  let timeout = 1;
  let player = playerProxyMaker();
  let playlist = playlistMaker(player, [1, 2, 3]);

  window.setTimeout = function() {
    return timeout;
  };

  window.clearTimeout = function(to) {
    assert.equal(to, timeout, 'we cleared the timeout');
  };

  playlist([1, 2, 3]);
  player.trigger('dispose');

  window.setTimeout = oldTimeout;
  window.clearTimeout = oldClear;
});
