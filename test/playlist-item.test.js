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

    // Setup stubs and spies
    this.player.play = sinon.spy();
    this.player.paused = sinon.stub().returns(false);
    this.player.ended = sinon.stub().returns(false);
    this.player.trigger = sinon.spy();
    this.player.poster = sinon.spy();
    this.player.src = sinon.spy();
    this.player.ready = sinon.stub().callsFake(callback => callback());
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

QUnit.test('validateSources - handles different source formats correctly', function(assert) {
  const singleSource = { src: 'video.mp4', type: 'video/mp4' };
  const multipleSources = [{ src: 'video.mp4', type: 'video/mp4' }, { src: 'video.webm', type: 'video/webm' }];

  assert.deepEqual(PlaylistItem.validateSources([singleSource]), [singleSource], 'Single source is valid');
  assert.deepEqual(PlaylistItem.validateSources(multipleSources), multipleSources, 'Multiple sources are valid');
});

QUnit.test('validateSources - throws error for invalid sources', function(assert) {
  assert.throws(
    () => PlaylistItem.validateSources({}),
    /Sources must be an array/,
    'Throws error for non-array sources'
  );

  assert.throws(
    () => PlaylistItem.validateSources([{}]),
    /No valid sources found/,
    'Throws error for sources without required properties'
  );

  assert.throws(
    () => PlaylistItem.validateSources([{ src: 'video.mp4' }]),
    /No valid sources found/,
    'Throws error for sources without required properties'
  );

  assert.throws(
    () => PlaylistItem.validateSources([{ type: 'video/mp4' }]),
    /No valid sources found/,
    'Throws error for sources without required properties'
  );
});

QUnit.test('loadOrPlay - calls play() and loads poster conditional on player state', function(assert) {
  this.player.paused = sinon.stub().returns(true);
  this.player.ended = sinon.stub().returns(true);
  this.playlistItem.loadOrPlay(this.player);
  assert.ok(this.player.play.calledOnce, 'Play called when player is paused and ended');
  assert.notOk(this.player.poster.calledWith(this.fakePoster), 'Poster is not set when calling play');

  this.player.play.resetHistory();
  this.player.poster.resetHistory();

  this.player.paused = sinon.stub().returns(true);
  this.player.ended = sinon.stub().returns(false);
  this.playlistItem.loadOrPlay(this.player);
  assert.notOk(this.player.play.calledOnce, 'Play not called when player is paused but not ended');
  assert.ok(this.player.poster.calledWith(this.fakePoster), 'Poster is set when not playing');

  this.player.play.resetHistory();
  this.player.poster.resetHistory();

  this.player.paused = sinon.stub().returns(false);
  this.player.ended = sinon.stub().returns(true);
  this.playlistItem.loadOrPlay(this.player);
  assert.ok(this.player.play.calledOnce, 'Play called when player is not paused but ended');
  assert.notOk(this.player.poster.calledWith(this.fakePoster), 'Poster is not set when calling play');
});

QUnit.test('loadOrPlay - triggers beforeplaylistitem and playlistitem events', function(assert) {
  this.playlistItem.loadOrPlay(this.player);

  assert.ok(this.player.trigger.calledWith('beforeplaylistitem'), "'beforeplaylistitem' event is triggered before loading the item");
  assert.ok(this.player.trigger.calledWith('playlistitem'), "'playlistitem' event is triggered after loading the item");

  const callOrder = this.player.trigger.args.map(args => args[0]);

  assert.ok(callOrder.indexOf('beforeplaylistitem') < callOrder.indexOf('playlistitem'), "'beforeplaylistitem' event is triggered before 'playlistitem' event");
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
