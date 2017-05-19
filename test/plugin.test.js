import document from 'global/document';
import window from 'global/window';
import QUnit from 'qunit';
import videojs from 'video.js';

import '../src/plugin';

let realIsHtmlSupported;
let player;

const playlist = [{
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
}];

const resolveUrl = url => {
  const a = document.createElement('a');

  a.href = url;
  return a.href;
};

const Html5 = videojs.getTech('Html5');

QUnit.test('the environment is sane', function(assert) {
  assert.ok(true, 'everything is swell');
});

function setup() {
  const fixture = document.querySelector('#qunit-fixture');

  // force HTML support so the tests run in a reasonable
  // environment under phantomjs
  realIsHtmlSupported = Html5.isSupported;
  Html5.isSupported = function() {
    return true;
  };

  // create a video element
  const video = document.createElement('video');

  fixture.appendChild(video);

  // create a video.js player
  player = videojs(video);

  // create a default playlist element
  const elem = document.createElement('ol');

  elem.className = 'vjs-playlist';
  fixture.appendChild(elem);
}

function teardown() {
  Html5.isSupported = realIsHtmlSupported;
  player.dispose();
  player = null;
}

QUnit.module('Playlist Plugin', {setup, teardown});

QUnit.test('registers itself', function(assert) {
  assert.ok(player.playlistUi, 'registered the plugin');
});

QUnit.test('errors if used without the playlist plugin', function(assert) {
  assert.throws(function() {
    player.playlist = null;
    player.playlistUi();
  }, 'threw on init');
});

QUnit.test('is empty if the playlist plugin isn\'t initialized', function(assert) {
  player.playlistUi();

  const items = document.querySelectorAll('.vjs-playlist-item');

  assert.ok(document.querySelector('.vjs-playlist'), 'created the menu');
  assert.equal(items.length, 0, 'displayed no items');
});

QUnit.test('can be initialized to replace a pre-existing element', function(assert) {
  const parent = document.createElement('div');
  const elem = document.createElement('ol');

  parent.appendChild(elem);
  player.playlist(playlist);
  player.playlistUi(elem);

  assert.equal(parent.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

QUnit.test('can auto-setup elements with the class vjs-playlist', function(assert) {
  const parent = document.querySelector('#qunit-fixture');
  const elem = parent.querySelector('.vjs-playlist');

  player.playlist(playlist);
  player.playlistUi();

  const menus = parent.querySelectorAll('.vjs-playlist');

  assert.equal(menus.length, 1, 'created one child node');
  assert.strictEqual(menus[0], elem, 're-used the existing element');
  assert.equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

QUnit.test('can auto-setup elements with a custom class', function(assert) {
  const elem = document.createElement('ol');

  elem.className = 'super-playlist';
  document.querySelector('#qunit-fixture').appendChild(elem);

  player.playlist(playlist);
  player.playlistUi({
    className: 'super-playlist'
  });
  assert.equal(elem.querySelectorAll('li.vjs-playlist-item').length,
        playlist.length,
        'created an element for each playlist item');
});

QUnit.test('specializes the class name if touch input is absent', function(assert) {
  const touchEnabled = videojs.browser.TOUCH_ENABLED;

  videojs.browser.TOUCH_ENABLED = videojs.TOUCH_ENABLED = false;

  player.playlist(playlist);
  player.playlistUi();

  assert.ok(player.playlistMenu.hasClass('vjs-mouse'), 'marked the playlist menu');

  videojs.browser.TOUCH_ENABLED = videojs.TOUCH_ENABLED = touchEnabled;
});

QUnit.module('Playlist Component', {setup, teardown});

// --------------------
// Creation and Updates
// --------------------

QUnit.test('includes the video name if provided', function(assert) {
  player.playlist(playlist);
  player.playlistUi();

  const items = document.querySelectorAll('.vjs-playlist-item');

  assert.equal(items[0].querySelector('.vjs-playlist-name').textContent,
        playlist[0].name,
        'wrote the name');
  assert.equal(items[1].querySelector('.vjs-playlist-name').textContent,
        'Untitled Video',
        'wrote a placeholder for the name');
});

QUnit.test('outputs a <picture> for simple thumbnails', function(assert) {
  player.playlist(playlist);
  player.playlistUi();

  const pictures = document.querySelectorAll('.vjs-playlist-item picture');

  assert.equal(pictures.length, 1, 'output one picture');
  const imgs = pictures[0].querySelectorAll('img');

  assert.equal(imgs.length, 1, 'output one img');
  assert.equal(imgs[0].src, window.location.protocol + playlist[1].thumbnail, 'set the src attribute');
});

QUnit.test('outputs a <picture> for responsive thumbnails', function(assert) {
  const playlistOverride = [{
    sources: [{
      src: '//example.com/movie.mp4',
      type: 'video/mp4'
    }],
    thumbnail: [{
      srcset: '/test/example/oceans.jpg',
      type: 'image/jpeg',
      media: '(min-width: 400px;)'
    }, {
      src: '/test/example/oceans-low.jpg'
    }]
  }];

  player.playlist(playlistOverride);
  player.playlistUi();

  const sources = document.querySelectorAll('.vjs-playlist-item picture source');
  const imgs = document.querySelectorAll('.vjs-playlist-item picture img');

  assert.equal(sources.length, 1, 'output one source');
  assert.equal(sources[0].srcset,
        playlistOverride[0].thumbnail[0].srcset,
        'wrote the srcset attribute');
  assert.equal(sources[0].type,
        playlistOverride[0].thumbnail[0].type,
        'wrote the type attribute');
  assert.equal(sources[0].media,
        playlistOverride[0].thumbnail[0].media,
        'wrote the type attribute');
  assert.equal(imgs.length, 1, 'output one img');
  assert.equal(imgs[0].src,
        resolveUrl(playlistOverride[0].thumbnail[1].src),
        'output the img src attribute');
});

QUnit.test('outputs a placeholder for items without thumbnails', function(assert) {
  player.playlist(playlist);
  player.playlistUi();

  const thumbnails = document.querySelectorAll('.vjs-playlist-item .vjs-playlist-thumbnail');

  assert.equal(thumbnails.length, playlist.length, 'output two thumbnails');
  assert.equal(thumbnails[0].nodeName.toLowerCase(), 'div', 'the second is a placeholder');
});

QUnit.test('includes the duration if one is provided', function(assert) {
  player.playlist(playlist);
  player.playlistUi();

  const durations = document.querySelectorAll('.vjs-playlist-item .vjs-playlist-duration');

  assert.equal(durations.length, 1, 'skipped the item without a duration');
  assert.equal(durations[0].textContent,
        '1:40',
        'wrote the duration');
  assert.equal(durations[0].getAttribute('datetime'),
        'PT0H0M' + playlist[0].duration + 'S',
        'wrote a machine-readable datetime');
});

QUnit.test('marks the selected playlist item on startup', function(assert) {
  player.playlist(playlist);
  player.currentSrc = () => playlist[0].sources[0].src;
  player.playlistUi();

  const selectedItems = document.querySelectorAll('.vjs-playlist-item.vjs-selected');

  assert.equal(selectedItems.length, 1, 'marked one playlist item');
  assert.equal(selectedItems[0].querySelector('.vjs-playlist-name').textContent,
        playlist[0].name,
        'marked the first playlist item');
});

QUnit.test('updates the selected playlist item on loadstart', function(assert) {
  player.playlist(playlist);
  player.playlistUi();

  player.playlist.currentItem(1);
  player.currentSrc = () => playlist[1].sources[0].src;
  player.trigger('loadstart');

  const selectedItems = document.querySelectorAll('.vjs-playlist-item.vjs-selected');

  assert.equal(document.querySelectorAll('.vjs-playlist-item').length,
        playlist.length,
        'displayed the correct number of items');
  assert.equal(selectedItems.length, 1, 'marked one playlist item');
  assert.equal(selectedItems[0].querySelector('img').src,
        resolveUrl(playlist[1].thumbnail),
        'marked the second playlist item');
});

QUnit.test('selects no item if the playlist is not in use', function(assert) {
  player.playlist(playlist);
  player.playlist.currentItem = () => -1;
  player.playlistUi();

  player.trigger('loadstart');

  assert.equal(document.querySelectorAll('.vjs-playlist-item.vjs-selected').length,
        0,
        'no items selected');
});

QUnit.test('updates on "playlistchange", different lengths', function(assert) {
  player.playlist([]);
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');

  assert.equal(items.length, 0, 'no items initially');

  player.playlist(playlist);
  player.trigger('playlistchange');
  items = document.querySelectorAll('.vjs-playlist-item');
  assert.equal(items.length, playlist.length, 'updated with the new items');
});

QUnit.test('updates on "playlistchange", equal lengths', function(assert) {
  player.playlist([{sources: []}, {sources: []}]);
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');

  assert.equal(items.length, 2, 'two items initially');

  player.playlist(playlist);
  player.trigger('playlistchange');
  items = document.querySelectorAll('.vjs-playlist-item');
  assert.equal(items.length, playlist.length, 'updated with the new items');
  assert.equal(player.playlistMenu.items[0].item, playlist[0], 'we have updated items');
  assert.equal(player.playlistMenu.items[1].item, playlist[1], 'we have updated items');
});

QUnit.test('updates on "playlistchange", update selection', function(assert) {
  player.playlist(playlist);
  player.currentSrc = function() {
    return playlist[0].sources[0].src;
  };
  player.playlistUi();

  let items = document.querySelectorAll('.vjs-playlist-item');

  assert.equal(items.length, 2, 'two items initially');

  assert.ok((/vjs-selected/).test(items[0].getAttribute('class')), 'first item is selected by default');
  player.playlist.currentItem(1);
  player.currentSrc = function() {
    return playlist[1].sources[0].src;
  };

  player.trigger('playlistchange');
  items = document.querySelectorAll('.vjs-playlist-item');
  assert.equal(items.length, playlist.length, 'updated with the new items');
  assert.ok((/vjs-selected/).test(items[1].getAttribute('class')), 'second item is selected after update');
  assert.ok(!(/vjs-selected/).test(items[0].getAttribute('class')), 'first item is not selected after update');
});

QUnit.test('tracks when an ad is playing', function(assert) {
  player.playlist([]);
  player.playlistUi();

  player.duration = () => 5;

  const playlistMenu = player.playlistMenu;

  assert.ok(!playlistMenu.hasClass('vjs-ad-playing'),
     'does not have class vjs-ad-playing');
  player.trigger('adstart');
  assert.ok(playlistMenu.hasClass('vjs-ad-playing'),
     'has class vjs-ad-playing');

  player.trigger('adend');
  assert.ok(!playlistMenu.hasClass('vjs-ad-playing'),
     'does not have class vjs-ad-playing');
});

// -----------
// Interaction
// -----------

QUnit.test('changes the selection when tapped', function(assert) {
  let playCalled = false;

  player.playlist(playlist);
  player.playlistUi({playOnSelect: true});
  player.play = function() {
    playCalled = true;
  };

  let sources;

  player.src = (src) => {
    if (src) {
      sources = src;
    }
    return sources[0];
  };
  player.currentSrc = () => sources[0].src;
  player.playlistMenu.items[1].trigger('tap');
  // trigger a loadstart synchronously to simplify the test
  player.trigger('loadstart');

  assert.ok(player.playlistMenu.items[1].hasClass('vjs-selected'),
     'selected the new item');
  assert.ok(!player.playlistMenu.items[0].hasClass('vjs-selected'),
     'deselected the old item');
  assert.equal(playCalled, true, 'play gets called if option is set');
});

QUnit.test('play should not get called by default upon selection of menu items ', function(assert) {
  let playCalled = false;

  player.playlist(playlist);
  player.playlistUi();
  player.play = function() {
    playCalled = true;
  };

  let sources;

  player.src = (src) => {
    if (src) {
      sources = src;
    }
    return sources[0];
  };
  player.currentSrc = () => sources[0].src;
  player.playlistMenu.items[1].trigger('tap');
  // trigger a loadstart synchronously to simplify the test
  player.trigger('loadstart');
  assert.equal(playCalled, false, 'play should not get called by default');
});
