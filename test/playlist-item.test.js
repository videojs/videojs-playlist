import document from 'global/document';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';
import PlaylistItem from '../src/playlist-item.js';

QUnit.module('PlaylistItem', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);

    // Stubs and spies
    this.player.trigger = sinon.spy();
    this.player.poster = sinon.spy();
    this.player.src = sinon.spy();
    this.player.addRemoteTextTrack = sinon.spy();
    this.player.remoteTextTracks = sinon.stub().returns([]);
    this.player.removeRemoteTextTrack = sinon.spy();

    // Test data
    this.fakeSources = [{ src: 'video.mp4', type: 'video/mp4' }];
    this.fakePoster = 'poster.jpg';
    this.fakeTextTracks = [{ kind: 'subtitles', src: 'subs.vtt', srclang: 'en' }];

    this.playlistItem = new PlaylistItem({
      sources: this.fakeSources,
      poster: this.fakePoster,
      textTracks: this.fakeTextTracks
    });
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('constructor initializes all properties correctly, including additional ones', function(assert) {
  const basicSourceProps = { sources: this.fakeSources, poster: this.fakePoster, textTracks: this.fakeTextTracks };
  const additionalSourceProps = { title: 'Test Video', description: 'A test video.' };

  this.playlistItem = new PlaylistItem(Object.assign({}, basicSourceProps, additionalSourceProps));

  assert.deepEqual(this.playlistItem.sources, this.fakeSources, 'Sources are set correctly');
  assert.equal(this.playlistItem.poster, this.fakePoster, 'Poster is set correctly');
  assert.deepEqual(this.playlistItem.textTracks, this.fakeTextTracks, 'Text tracks are set correctly');
  assert.equal(this.playlistItem.title, additionalSourceProps.title, 'Additional title property is set correctly');
  assert.equal(this.playlistItem.description, additionalSourceProps.description, 'Additional description property is set correctly');
});

QUnit.test('load - loads sources and poster based on options', function(assert) {
  this.playlistItem.load(this.player, { loadPoster: true });
  this.clock.tick(1);

  assert.ok(this.player.poster.calledWith(this.fakePoster), 'Poster is loaded when loadPoster is true');
  assert.ok(this.player.src.calledWith(this.fakeSources), 'Sources are set correctly');

  this.player.poster.resetHistory();
  this.player.src.resetHistory();

  this.playlistItem.load(this.player, { loadPoster: false });
  assert.ok(this.player.poster.calledWith(''), 'Poster is not loaded when loadPoster is false');
  assert.ok(this.player.src.calledWith(this.fakeSources), 'Sources are still set correctly');
});

QUnit.test('load - triggers events in the correct order', function(assert) {
  this.playlistItem.load(this.player, { loadPoster: true });
  this.clock.tick(1);

  const triggerCalls = this.player.trigger.getCalls().map(call => call.args[0]);
  const beforePlaylistItemIndex = triggerCalls.indexOf('beforeplaylistitem');
  const playlistItemIndex = triggerCalls.indexOf('playlistitem');

  assert.ok(beforePlaylistItemIndex !== -1, "'beforeplaylistitem' event was triggered");
  assert.ok(playlistItemIndex !== -1, "'playlistitem' event was triggered");
  assert.ok(beforePlaylistItemIndex < playlistItemIndex, "'beforeplaylistitem' is triggered before 'playlistitem'");
});

QUnit.test('addTextTracks - adds text tracks', function(assert) {
  this.playlistItem.addTextTracks(this.player);

  assert.ok(this.player.addRemoteTextTrack.calledWith(this.fakeTextTracks[0]), 'Text track added');
});

QUnit.test('clearExistingTextTracks - removes text tracks', function(assert) {
  this.player.remoteTextTracks = sinon.stub().returns(this.fakeTextTracks);

  this.playlistItem.clearExistingTextTracks(this.player);

  assert.ok(this.player.removeRemoteTextTrack.calledWith(this.fakeTextTracks[0]), 'Text track removed');
});
