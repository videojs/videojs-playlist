import QUnit from 'qunit';
import sinon from 'sinon';
import '../src/plugin';

import {createFixturePlayer, destroyFixturePlayer} from './util';

const samplePlaylist = [{
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
}];

QUnit.module('current-item', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    createFixturePlayer(this);
  },
  afterEach() {
    destroyFixturePlayer(this);
    this.clock.restore();
  }
});

QUnit.test('without a playlist, without a source', function(assert) {
  assert.strictEqual(this.player.playlist.currentItem(), -1, 'initial currentItem() before tech ready');

  // Tick forward to ready the playback tech.
  this.clock.tick(1);

  assert.strictEqual(this.player.playlist.currentItem(), -1, 'initial currentItem() after tech ready');
});

QUnit.test('without a playlist, with a source', function(assert) {
  assert.strictEqual(this.player.playlist.currentItem(), -1, 'initial currentItem() before tech ready');

  // Tick forward to ready the playback tech.
  this.clock.tick(1);

  this.player.src({
    src: 'http://vjs.zencdn.net/v/oceans.mp4',
    type: 'video/mp4'
  });

  assert.strictEqual(this.player.playlist.currentItem(), -1, 'initial currentItem() after tech ready');
});

QUnit.test('with a playlist', function(assert) {
  this.player.playlist(samplePlaylist);

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() before tech ready');

  // Tick forward to ready the playback tech.
  this.clock.tick(1);

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() after tech ready');

  this.player.playlist.currentItem(1);

  assert.strictEqual(this.player.playlist.currentItem(), 1, 'currentItem() changes the current item');
});

QUnit.test('with a playlist, set a new source in the playlist', function(assert) {
  this.player.playlist(samplePlaylist);

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() before tech ready');

  // Tick forward to ready the playback tech.
  this.clock.tick(1);

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() after tech ready');

  this.player.src({
    src: 'http://vjs.zencdn.net/v/oceans.mp4',
    type: 'video/mp4'
  });

  assert.strictEqual(this.player.playlist.currentItem(), 2, 'src() changes the current item');
});

QUnit.test('with a playlist, set a new source not in the playlist', function(assert) {

  // Populate the player with a playlist without oceans.mp4
  this.player.playlist(samplePlaylist.slice(0, 2));

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() before tech ready');

  // Tick forward to ready the playback tech.
  this.clock.tick(1);

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() after tech ready');

  this.player.src({
    src: 'http://vjs.zencdn.net/v/oceans.mp4',
    type: 'video/mp4'
  });

  assert.strictEqual(this.player.playlist.currentItem(), -1, 'src() changes the current item');
});

QUnit.test('with a playlist with repeated sources, with a source in the playlist', function(assert) {

  // Populate the player with a playlist with another sintel on the end.
  this.player.playlist(samplePlaylist.concat([{
    sources: [{
      src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
      type: 'video/mp4'
    }],
    poster: 'http://media.w3.org/2010/05/sintel/poster.png'
  }]));

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() before tech ready');

  // Tick forward to ready the playback tech.
  this.clock.tick(1);

  assert.strictEqual(this.player.playlist.currentItem(), 0, 'initial currentItem() after tech ready');

  // Set the playlist to the last item.
  this.player.playlist.currentItem(3);

  assert.strictEqual(this.player.playlist.currentItem(), 3, 'the currentItem() is matches the duplicated item that was actually selected');
});
