var q = QUnit,
    oldTimeout,
    playlistMaker = require('../src/playlist-maker.js'),
    playerProxy = require('./player-proxy.js'),
    extend = require('node.extend');

q.module('playlist', {
  setup: function() {
    oldTimeout = window.setTimeout;
    window.setTimeout = Function.prototype;
  },
  teardown: function() {
    window.setTimeout = oldTimeout;
  }
});

q.test('playlistMaker takes a player and a list and returns a playlist', function() {
  var playlist = playlistMaker(playerProxy, []);

  q.ok(playlist, 'we got a playlist');
  q.equal(typeof playlist, 'function', 'playlist is a function');
  q.equal(typeof playlist.currentItem, 'function', 'we have a currentItem function');
  q.equal(typeof playlist.next, 'function', 'we have a next function');
  q.equal(typeof playlist.previous, 'function', 'we have a previous function');
  q.equal(typeof playlist.autoadvance, 'function', 'we have a autoadvance function');
});

q.test('playlistMaker can either take nothing or only an Array', function() {
  var playlist1 = playlistMaker(playerProxy);
  var playlist2 = playlistMaker(playerProxy, 'foo');
  var playlist3 = playlistMaker(playerProxy, {foo: [1,2,3]});

  q.deepEqual(playlist1(), [], 'if given no initial array, default to an empty array');
  q.deepEqual(playlist2(), [], 'if given no initial array, default to an empty array');
  q.deepEqual(playlist3(), [], 'if given no initial array, default to an empty array');
});


q.test('playlist() is a getter and setter for the list', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.deepEqual(playlist(), [1,2,3], 'equal to input list');
  q.deepEqual(playlist([1,2,3,4,5]), [1,2,3,4,5], 'equal to input list, arguments ignored');
  q.deepEqual(playlist(), [1,2,3,4,5], 'equal to input list');

  var list = playlist();
  list.unshift(10);

  q.deepEqual(playlist(), [1,2,3,4,5], 'changing the list did not affect the playlist');
  q.notDeepEqual(playlist(), [10,1,2,3,4,5], 'changing the list did not affect the playlist');

});

q.test('playlist() should only accept an Array as a new playlist', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.deepEqual(playlist("foo"), [1,2,3], 'when given "foo", it should be treated as a getter');
  q.deepEqual(playlist({foo: [1,2,3]}), [1,2,3], 'when given {foo: [1,2,3]}, it should be treated as a getter');
});

q.test('playlist.currentItem() works as expected', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.equal(playlist.currentItem(), 0, 'begin at the first item, item 0');

  q.equal(playlist.currentItem(2), 2, 'setting to item 2 gives us back the new item index');
  q.equal(playlist.currentItem(), 2, 'the current item is now 2');

  q.equal(playlist.currentItem(5), 2, 'cannot change to an out-of-bounds item');
  q.equal(playlist.currentItem(-1), 2, 'cannot change to an out-of-bounds item');
  q.equal(playlist.currentItem(null), 2, 'cannot change to an invalid item');
  q.equal(playlist.currentItem(NaN), 2, 'cannot change to an invalid item');
  q.equal(playlist.currentItem(Infinity), 2, 'cannot change to an invalid item');
  q.equal(playlist.currentItem(-Infinity), 2, 'cannot change to an invalid item');
});

q.test('playlist.currentItem() does not change items if same index is given', function() {
  var player = extend(true, {}, playerProxy);
  var sources = 0;
  var playlist;

  player.src = function() {
    sources++;
  };

  playlist = playlistMaker(player, [{sources: 'sources'}, {sources: 'sources2'}]);

  q.equal(playlist.currentItem(), 0, 'we start at index 0');

  playlist.currentItem(0);
  q.equal(sources, 0, 'we did not try to set sources');

  playlist.currentItem(1);
  q.equal(sources, 1, 'we did try to set sources');

  playlist.currentItem(1);
  q.equal(sources, 1, 'we did not try to set sources');
});

q.test('playlist.next() works as expected', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.equal(playlist.currentItem(), 0, 'we start on item 0');
  q.equal(playlist.next(), 2, 'we get back the value of currentItem 2');
  q.equal(playlist.currentItem(), 1, 'we are now on item 1');
  q.equal(playlist.next(), 3, 'we get back the value of currentItem 3');
  q.equal(playlist.currentItem(), 2, 'we are now on item 2');
  q.equal(playlist.next(), undefined, 'we get nothing back if we try to go out of bounds');
});

q.test('playlist.previous() works as expected', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.equal(playlist.currentItem(), 0, 'we start on item 0');
  q.equal(playlist.previous(), undefined, 'we get nothing back if we try to go out of bounds');

  playlist.next();
  playlist.next();

  q.equal(playlist.currentItem(), 2, 'we are on item 2');
  q.equal(playlist.previous(), 2, 'we get back value of currentItem 1');
  q.equal(playlist.currentItem(), 1, 'we are on item 1');
  q.equal(playlist.previous(), 1, 'we get back value of currentItem 0');
  q.equal(playlist.currentItem(), 0, 'we are on item 0');
  q.equal(playlist.previous(), undefined, 'we get nothing back if we try to go out of bounds');
});

q.test('loading a non-playlist video will cancel autoadvanec and set index of -1', function() {
  var Player = function(proxy) {
    extend(true, this, proxy);
  };
  Player.prototype = Object.create(playerProxy);
  Player.prototype.constructor = Player;
  var playlist;
  var autoadvance = require('../src/autoadvance.js');
  var oldReset = autoadvance.resetadvance;

  player = new Player(videojs.EventEmitter.prototype);

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

  autoadvance.resetadvance = function() {
    q.ok(true, 'resetadvance was called');
  };

  player.trigger('loadstart');

  q.equal(playlist.currentItem(), -1, 'new currentItem is -1');

  player.currentSrc = function() {
    return 'http://media.w3.org/2010/05/sintel/trailer.mp4';
  };

  autoadvance.resetadvance = function() {
    q.ok(false, 'resetadvance should not be called');
  };

  player.trigger('loadstart');

  autoadvance.resetadvance = oldReset;
});

q.test('when loading a new playlist, trigger "playlistchange" on the player', function() {
  var oldTimeout = window.setTimeout;
  var player = extend(true, {}, playerProxy);
  var playlist;

  window.setTimeout = function(fn, timeout) {
    fn();
  };

  player.trigger = function(type) {
    q.equal(type, 'playlistchange', 'trigger playlistchange on playlistchange');
  };

  playlist = playlistMaker(player, [1,2,3]);

  playlist([4,5,6]);

  window.setTimeout = oldTimeout;
});
