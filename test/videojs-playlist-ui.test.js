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

const setup = function() {
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
};

const teardown = function() {
  videojs.Html5.isSupported = realIsHtmlSupported;
  player.dispose();
  player = null;
};

QUnit.module('Playlist Plugin', {
  setup,
  teardown
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

test('is empty if the playlist plugin isn\'t initialized', function() {
  player.playlistUi();

  const items = document.querySelectorAll('.vjs-playlist-item');
  ok(document.querySelector('.vjs-playlist'), 'created the menu');
  equal(items.length, 0, 'displayed no items');
});

test('can be initialized to replace a pre-existing element', function() {
  let parent = document.createElement('div');
  let elem = document.createElement('ol');
  parent.appendChild(elem);
  player.playlist(playlist);
  player.playlistUi(elem);

  equal(parent.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

test('can auto-setup elements with the class vjs-playlist', function() {
  let parent = document.querySelector('#qunit-fixture');
  let elem = parent.querySelector('.vjs-playlist');

  player.playlist(playlist);
  player.playlistUi();
  let menus = parent.querySelectorAll('.vjs-playlist');
  equal(menus.length, 1, 'created one child node');
  strictEqual(menus[0], elem, 're-used the existing element');
  equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

test('can auto-setup elements with a custom class', function() {
  let elem = document.createElement('ol');
  elem.className = 'super-playlist';
  document.querySelector('#qunit-fixture').appendChild(elem);

  player.playlist(playlist);
  player.playlistUi({
    className: 'super-playlist'
  });
  equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

test('specializes the class name if touch input is absent', function() {
  const touchEnabled = videojs.TOUCH_ENABLED;
  videojs.TOUCH_ENABLED = false;

  player.playlist(playlist);
  player.playlistUi();

  ok(player.playlistMenu.hasClass('vjs-mouse'), 'marked the playlist menu');

  videojs.TOUCH_ENABLED = touchEnabled;
});

QUnit.module('Playlist Component', {
  setup: setup,
  teardown: teardown
});

// --------------------
// Creation and Updates
// --------------------

test('includes the video name if provided', function() {
  player.playlist(playlist);
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');
  equal(items[0].querySelector('.vjs-playlist-name').textContent,
        playlist[0].name,
        'wrote the name');
  equal(items[1].querySelector('.vjs-playlist-name').textContent,
        'Untitled Video',
        'wrote a placeholder for the name');
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

test('outputs a placeholder for items without thumbnails', function() {
  player.playlist(playlist);
  player.playlistUi();

  let thumbnails = document.querySelectorAll('.vjs-playlist-item .vjs-playlist-thumbnail');
  equal(thumbnails.length, playlist.length, 'output two thumbnails');
  equal(thumbnails[0].nodeName.toLowerCase(), 'div', 'the second is a placeholder');
});

test('includes the duration if one is provided', function() {
  player.playlist(playlist);
  player.playlistUi();

  let durations = document.querySelectorAll('.vjs-playlist-item .vjs-playlist-duration');
  equal(durations.length, 1, 'skipped the item without a duration');
  equal(durations[0].textContent,
        '1:40',
        'wrote the duration');
  equal(durations[0].getAttribute('datetime'),
        'PT0H0M' + playlist[0].duration + 'S',
        'wrote a machine-readable datetime');
});

test('marks the selected playlist item on startup', function() {
  player.playlist(playlist);
  player.currentSrc = () => playlist[0].sources[0].src;
  player.playlistUi();

  let selectedItems = document.querySelectorAll('.vjs-playlist-item.vjs-selected');
  equal(selectedItems.length, 1, 'marked one playlist item');
  equal(selectedItems[0].querySelector('.vjs-playlist-name').textContent,
        playlist[0].name,
        'marked the first playlist item');
});

test('updates the selected playlist item on loadstart', function() {
  player.playlist(playlist);
  player.playlistUi();

  player.playlist.currentItem(1);
  if (/phantom/i.test(window.navigator.userAgent)) {
    player.currentSrc = () => playlist[1].sources[0].src;
  }
  player.trigger('loadstart');

  let selectedItems = document.querySelectorAll('.vjs-playlist-item.vjs-selected');
  equal(document.querySelectorAll('.vjs-playlist-item').length,
        playlist.length,
        'displayed the correct number of items');
  equal(selectedItems.length, 1, 'marked one playlist item');
  equal(selectedItems[0].querySelector('img').src,
        resolveUrl(playlist[1].thumbnail),
        'marked the second playlist item');
});

test('selects no item if the playlist is not in use', function() {
  player.playlist(playlist);
  player.playlist.currentItem = () => -1;
  player.playlistUi();

  player.trigger('loadstart');

  equal(document.querySelectorAll('.vjs-playlist-item.vjs-selected').length,
        0,
        'no items selected');
});

test('updates on "playlistchange"', function() {
  player.playlist([]);
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');
  equal(items.length, 0, 'no items initially');

  player.playlist(playlist);
  player.trigger('playlistchange');
  items = document.querySelectorAll('.vjs-playlist-item');
  equal(items.length, playlist.length, 'updated with the new items');
});

test('tracks when an ad is playing', function() {
  player.playlist([]);
  player.playlistUi();

  let playlistMenu = player.playlistMenu;
  ok(!playlistMenu.hasClass('vjs-ad-playing'),
     'does not have class vjs-ad-playing');
  player.trigger('adstart');
  ok(playlistMenu.hasClass('vjs-ad-playing'),
     'has class vjs-ad-playing');

  player.trigger('adend');
  ok(!playlistMenu.hasClass('vjs-ad-playing'),
     'does not have class vjs-ad-playing');
});

// -----------
// Interaction
// -----------

test('changes the selection when tapped', function(test) {
  player.playlist(playlist);
  player.playlistUi();

  if (/phantom/i.test(window.navigator.userAgent)) {
    let sources;
    player.src = (src) => {
      if (src) {
        sources = src;
      }
      return sources[0];
    };
    player.currentSrc = () => sources[0].src;
  }
  player.playlistMenu.items[1].trigger('tap');
  // trigger a loadstart synchronously to simplify the test
  player.trigger('loadstart');

  ok(player.playlistMenu.items[1].hasClass('vjs-selected'),
     'selected the new item');
  ok(!player.playlistMenu.items[0].hasClass('vjs-selected'),
     'deselected the old item');
});
