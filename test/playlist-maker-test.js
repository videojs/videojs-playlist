var extend = require('node.extend');
var q = QUnit;
var oldTimeout;
var playlistMaker = require('../src/playlist-maker.js');
var playerProxy = require('./player-proxy.js');
var isArray = Array.isArray || function(array) {
  return Object.prototype.toString.call(array) === '[object Array]';
};
var videoList = [{
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
  var player = extend(true, {}, playerProxy);
  var playlist = playlistMaker(player, videoList);
  var src;

  player.src = function(s) {
    if (s) {
      if (typeof s === 'string') {
        src = s;
      } else if (isArray(s)) {
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

q.test('playlist.currentItem() returns -1 with an empty playlist', function() {
  var playlist = playlistMaker(playerProxy, []);

  q.equal(playlist.currentItem(), -1, 'we should get a -1 with an empty playlist');
});

q.test('playlist.currentItem() does not change items if same index is given', function() {
  var player = extend(true, {}, playerProxy);
  var sources = 0;
  var playlist;
  var src;

  player.src = function(s) {
    if (s) {
      if (typeof s === 'string') {
        src = s;
      } else if (isArray(s)) {
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

  q.equal(sources, 1, 'we switched to the first playlist item');
  sources = 0;


  q.equal(playlist.currentItem(), 0, 'we start at index 0');

  playlist.currentItem(0);
  q.equal(sources, 0, 'we did not try to set sources');

  playlist.currentItem(1);
  q.equal(sources, 1, 'we did try to set sources');

  playlist.currentItem(1);
  q.equal(sources, 1, 'we did not try to set sources');
});

q.test('playlist.contains() works as expected', function() {
  var player = extend(true, {}, playerProxy);
  var playlist = playlistMaker(player, videoList);
  player.playlist = playlist;

  q.ok(playlist.contains('http://media.w3.org/2010/05/sintel/trailer.mp4'),
       'we can ask whether it contains a source string');

  q.ok(playlist.contains(['http://media.w3.org/2010/05/sintel/trailer.mp4']),
       'we can ask whether it contains a sources list of strings');

  q.ok(playlist.contains([{
    src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
    type: 'video/mp4'
  }]), 'we can ask whether it contains a sources list of objects');

  q.ok(playlist.contains({
    sources: ['http://media.w3.org/2010/05/sintel/trailer.mp4']
  }), 'we can ask whether it contains a playlist item');

  q.ok(playlist.contains({
    sources: [{
      src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
      type: 'video/mp4'
    }]
  }), 'we can ask whether it contains a playlist item');

  q.ok(!playlist.contains('http://media.w3.org/2010/05/sintel/poster.png'),
       'we get false for a non-existent source string');

  q.ok(!playlist.contains(['http://media.w3.org/2010/05/sintel/poster.png']),
       'we get false for a non-existent source list of strings');

  q.ok(!playlist.contains([{
    src: 'http://media.w3.org/2010/05/sintel/poster.png',
    type: 'video/mp4'
  }]), 'we get false for a non-existent source list of objects');

  q.ok(!playlist.contains({
    sources: ['http://media.w3.org/2010/05/sintel/poster.png']
  }), 'we can ask whether it contains a playlist item');

  q.ok(!playlist.contains({
    sources: [{
      src: 'http://media.w3.org/2010/05/sintel/poster.png',
      type: 'video/mp4'
    }]
  }), 'we get false for a non-existent playlist item');
});

q.test('playlist.indexOf() works as expected', function() {
  var player = extend(true, {}, playerProxy);
  var playlist = playlistMaker(player, videoList);
  player.playlist = playlist;

  q.equal(playlist.indexOf('http://media.w3.org/2010/05/sintel/trailer.mp4'),
          0, 'sintel trailer is first item');

  q.equal(playlist.indexOf(['http://media.w3.org/2010/05/bunny/trailer.mp4']),
          1, 'bunny trailer is second item');

  q.equal(playlist.indexOf([{
    src: 'http://vjs.zencdn.net/v/oceans.mp4',
    type: 'video/mp4'
  }]), 2, 'oceans is third item');

  q.equal(playlist.indexOf({
    sources: ['http://media.w3.org/2010/05/bunny/movie.mp4']
  }), 3, 'bunny movie is fourth item');

  q.equal(playlist.indexOf({
    sources: [{
      src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
      type: 'video/mp4'
    }]
  }), 4, 'timer video is fifth item');

  q.equal(playlist.indexOf('http://media.w3.org/2010/05/sintel/poster.png'),
          -1, 'poster.png does not exist');

  q.equal(playlist.indexOf(['http://media.w3.org/2010/05/sintel/poster.png']),
          -1, 'poster.png does not exist');

  q.equal(playlist.indexOf([{
    src: 'http://media.w3.org/2010/05/sintel/poster.png',
    type: 'video/mp4'
  }]), -1, 'poster.png does not exist');

  q.equal(playlist.indexOf({
    sources: ['http://media.w3.org/2010/05/sintel/poster.png']
  }), -1, 'poster.png does not exist');

  q.equal(playlist.indexOf({
    sources: [{
      src: 'http://media.w3.org/2010/05/sintel/poster.png',
      type: 'video/mp4'
    }]
  }), -1, 'poster.png does not exist');
});

q.test('playlist.next() works as expected', function() {
  var player = extend(true, {}, playerProxy);
  var playlist = playlistMaker(player, videoList);
  var src;

  player.currentSrc = function() {
    return src;
  };

  src = videoList[0].sources[0].src;
  q.equal(playlist.currentItem(), 0, 'we start on item 0');
  q.deepEqual(playlist.next(), videoList[1], 'we get back the value of currentItem 2');
  src = videoList[1].sources[0].src;
  q.equal(playlist.currentItem(), 1, 'we are now on item 1');
  q.deepEqual(playlist.next(), videoList[2], 'we get back the value of currentItem 3');
  src = videoList[2].sources[0].src;
  q.equal(playlist.currentItem(), 2, 'we are now on item 2');
  src = videoList[4].sources[0].src;
  q.equal(playlist.currentItem(4), 4, 'we are now on item 4');
  q.equal(playlist.next(), undefined, 'we get nothing back if we try to go out of bounds');
});

q.test('playlist.previous() works as expected', function() {
  var player = extend(true, {}, playerProxy);
  var playlist = playlistMaker(player, videoList);
  var src;

  player.currentSrc = function() {
    return src;
  };

  src = videoList[0].sources[0].src;
  q.equal(playlist.currentItem(), 0, 'we start on item 0');
  q.equal(playlist.previous(), undefined, 'we get nothing back if we try to go out of bounds');

  src = videoList[2].sources[0].src;
  q.equal(playlist.currentItem(), 2, 'we are on item 2');
  q.deepEqual(playlist.previous(), videoList[1], 'we get back value of currentItem 1');

  src = videoList[1].sources[0].src;
  q.equal(playlist.currentItem(), 1, 'we are on item 1');
  q.deepEqual(playlist.previous(), videoList[0], 'we get back value of currentItem 0');
  src = videoList[0].sources[0].src;
  q.equal(playlist.currentItem(), 0, 'we are on item 0');
  q.equal(playlist.previous(), undefined, 'we get nothing back if we try to go out of bounds');
});

q.test('loading a non-playlist video will cancel autoadvance and set index of -1', function() {
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

  player.playlist = playlist;

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

q.test('cleartimeout on dispose', function() {
  var oldTimeout = window.setTimeout;
  var oldClear = window.clearTimeout;
  var Player = function(proxy) {
    extend(true, this, proxy);
  };
  Player.prototype = Object.create(playerProxy);
  Player.prototype.constructor = Player;
  var playlist;
  var timeout = 1;

  window.setTimeout = function() {
    return timeout;
  };
  window.clearTimeout = function(to) {
    q.equal(to, timeout, 'we cleared the timeout');
  };

  player = new Player(videojs.EventEmitter.prototype);

  playlist = playlistMaker(player, [1,2,3]);

  playlist([1,2,3]);

  player.trigger('dispose');

  window.setTimeout = oldTimeout;
  window.clearTimeout = oldClear;
});
