/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
var realIsHtmlSupported,
    player,

    playlist = [{
      sources: [{
        src: '//example.com/movie1.mp4',
        type: 'video/mp4'
      }]
    }, {
      sources: [{
        src: '//example.com/movie2.mp4',
        type: 'video/mp4'
      }]
    }],

    // local QUnit aliases
    // http://api.qunitjs.com/

    // test(name, callback)
    test = QUnit.test,
    // ok(value, [message])
    ok = QUnit.ok,
    // equal(actual, expected, [message])
    equal = QUnit.equal,
    // strictEqual(actual, expected, [message])
    strictEqual = QUnit.strictEqual,
    // deepEqual(actual, expected, [message])
    deepEqual = QUnit.deepEqual,
    // notEqual(actual, expected, [message])
    notEqual = QUnit.notEqual,
    // throws(block, [expected], [message])
    throws = QUnit.throws;


test('the environment is sane', function() {
  ok(true, 'everything is swell');
});

QUnit.module('videojs-playlist-ui', {
  setup: function() {
    // force HTML support so the tests run in a reasonable
    // environment under phantomjs
    realIsHtmlSupported = videojs.Html5.isSupported;
    videojs.Html5.isSupported = function() {
      return true;
    };

    // create a video element
    var video = document.createElement('video');
    document.querySelector('#qunit-fixture').appendChild(video);

    // create a video.js player
    player = videojs(video);
  },
  teardown: function() {
    videojs.Html5.isSupported = realIsHtmlSupported;
  }
});

test('registers itself', function() {
  ok(player.playlistUi, 'registered the plugin');
});

test('errors if used without the playlist plugin', function() {
  throws(function() {
    player.playlist = null;
    player.playlistUi();
  }, 'threw on init');
});

test('can be initialized with a pre-existing element', function() {
  var elem = document.createElement('ul');
  player.playlist(playlist);
  player.playlistUi(elem);

  equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

test('can auto-setup elements with the class vjs-playlist', function() {
  var elem = document.createElement('ul');
  elem.className = 'vjs-playlist';
  document.querySelector('#qunit-fixture').appendChild(elem);

  player.playlist(playlist);
  player.playlistUi();
  equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

test('can auto-setup elements with a custom class', function() {
  var elem = document.createElement('ul');
  elem.className = 'super-playlist';
  document.querySelector('#qunit-fixture').appendChild(elem);

  player.playlist(playlist);
  player.playlistUi({
    playlistClass: 'super-playlist'
  });
  equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});
