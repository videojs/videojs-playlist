/*! videojs-playlist-ui - v0.0.0 - 2015-3-12
 * Copyright (c) 2015 Brightcove
 * Licensed under the Apache-2.0 license. */
var realIsHtmlSupported,
    player,

    playlist = [{
      name: 'Movie 1',
      description: 'Movie 1 description',
      duration: 100,
      sources: [{
        src: '//example.com/movie1.mp4',
        type: 'video/mp4'
      }]
    }, {
      sources: [{
        src: '//example.com/movie2.mp4',
        type: 'video/mp4'
      }],
      thumbnail: '//example.com/movie2.jpg'
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

const resolveUrl = url => {
  let a = document.createElement('a');
  a.href = url;
  return a.href;
};


test('the environment is sane', function() {
  ok(true, 'everything is swell');
});

QUnit.module('Playlist UI', {
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

    // create a default playlist element
    let elem = document.createElement('ol');
    elem.className = 'vjs-playlist';
    document.querySelector('#qunit-fixture').appendChild(elem);
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
  var elem = document.createElement('ol');
  player.playlist(playlist);
  player.playlistUi(elem);

  equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

test('can auto-setup elements with the class vjs-playlist', function() {
  var elem = document.createElement('ol');
  elem.className = 'vjs-playlist';
  document.querySelector('#qunit-fixture').appendChild(elem);

  player.playlist(playlist);
  player.playlistUi();
  equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

test('can auto-setup elements with a custom class', function() {
  var elem = document.createElement('ol');
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

test('includes the video name if provided', function() {
  player.playlist(playlist);
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');
  equal(items[0].querySelector('.vjs-playlist-name').textContent,
        playlist[0].name,
        'wrote the name');
  equal(items[1].querySelector('.vjs-playlist-name'),
        null,
        'skipped the video with the missing name');
});

test('includes the video description if provided', function() {
  player.playlist(playlist);
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');
  equal(items[0].querySelector('.vjs-playlist-description').textContent,
        playlist[0].description,
        'wrote the name');
  equal(items[1].querySelector('.vjs-playlist-description'),
        null,
        'skipped the video with the missing name');
});

test('outputs a <picture> for simple thumbnails', function() {
  player.playlist(playlist);
  player.playlistUi();

  let pictures = document.querySelectorAll('.vjs-playlist-item picture');
  equal(pictures.length, 1, 'output one picture');
  let imgs = pictures[0].querySelectorAll('img');
  equal(imgs.length, 1, 'output one img');
  equal(imgs[0].src, window.location.protocol + playlist[1].thumbnail, 'set the src attribute');
});

test('outputs a <picture> for responsive thumbnails', function() {
  const playlist = [{
    sources: [{
      src: '//example.com/movie.mp4',
      type: 'video/mp4'
    }],
    thumbnail: [{
      srcset: 'test/example/oceans.jpg',
      type: 'image/jpeg',
      media: '(min-width: 400px;)'
    }, {
      src: 'test/example/oceans-low.jpg'
    }]
  }];
  player.playlist(playlist);
  player.playlistUi();

  let sources = document.querySelectorAll('.vjs-playlist-item picture source');
  let imgs = document.querySelectorAll('.vjs-playlist-item picture img');
  equal(sources.length, 1, 'output one source');
  equal(sources[0].srcset,
        playlist[0].thumbnail[0].srcset,
        'wrote the srcset attribute');
  equal(sources[0].type,
        playlist[0].thumbnail[0].type,
        'wrote the type attribute');
  equal(sources[0].media,
        playlist[0].thumbnail[0].media,
        'wrote the type attribute');
  equal(imgs.length, 1, 'output one img');
  equal(imgs[0].src,
        resolveUrl(playlist[0].thumbnail[1].src),
        'output the img src attribute');
});

test('includes the duration if one is provided', function() {
  player.playlist(playlist);
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');
  equal(items[0].querySelector('.vjs-playlist-duration').textContent,
        100,
        'wrote the duration');
  equal(items[1].querySelector('.vjs-playlist-duration'),
        null,
        'skipped the item without a duration');
});
