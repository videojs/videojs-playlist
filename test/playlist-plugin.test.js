import document from 'global/document';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';
import PlaylistPlugin from '../src/playlist-plugin.js';
import Playlist from '../src/playlist.js';
// import AutoAdvance from '../src/auto-advance.js';
import { log } from '../src/playlist-plugin.js';

QUnit.module('Playlist Plugin', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);

    this.player.poster = sinon.spy();
    this.player.src = sinon.spy();
    this.player.addRemoteTextTrack = sinon.spy();
    this.player.remoteTextTracks = sinon.stub().returns([]);
    this.player.removeRemoteTextTrack = sinon.spy();
    log.error = sinon.spy();
    log.warn = sinon.spy();

    // Test data
    this.testItems = [
      { sources: [{ src: 'http://example.com/video1.mp4', type: 'video/mp4' }], textTracks: [], title: 'Video 1' },
      { sources: [{ src: 'http://example.com/video2.mp4', type: 'video/mp4' }], textTracks: [], title: 'Video 2' },
      { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], textTracks: [], title: 'Video 3' }
    ];

    this.mockPlaylist = {
      on: sinon.spy(),
      off: sinon.spy(),
      reset: sinon.spy(),
      get: sinon.stub().returns([{}, {}, {}]),
      setCurrentIndex: sinon.spy()
    };

    this.playlistPlugin = new PlaylistPlugin(this.player, {});
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('createPlaylistFrom - handles input correctly', function(assert) {
  const playlist = PlaylistPlugin.createPlaylistFrom(this.testItems);

  assert.ok(playlist instanceof Playlist, 'Returns instance of Playlist');
  assert.equal(playlist.getItems().length, this.testItems.length, 'Returns correct number of items in Playlist');
});

QUnit.test('loadPlaylist - sets up playlist and logger correctly', function(assert) {
  this.playlistPlugin.handleSourceChange_ = sinon.spy();

  this.playlistPlugin.loadPlaylist(this.mockPlaylist);

  assert.deepEqual(this.playlistPlugin.playlist_, this.mockPlaylist, 'Playlist is set correctly');
  assert.ok(this.mockPlaylist.on.called, 'Event forwarding is set up');
  assert.ok(this.playlistPlugin.handleSourceChange_.notCalled, 'handleSourceChange_ not called');

  this.player.trigger('loadstart');

  assert.ok(this.playlistPlugin.handleSourceChange_.calledOnce, 'handleSourceChange_ called once');
});

QUnit.test('loadPlaylist - sets up event forwarding correctly', function(assert) {
  const done = assert.async();
  const mockPlaylist = new videojs.EventTarget();

  this.player.on('playlistchange', () => {
    assert.ok(true, 'Event is successfully forwarded from the playlist to the player');
    done();
  });

  this.playlistPlugin.loadPlaylist(mockPlaylist);

  mockPlaylist.trigger('playlistchange');
});

QUnit.test('loadPlaylist - cleans up existing playlist before loading new one', function(assert) {
  this.playlistPlugin.loadPlaylist(this.mockPlaylist);

  this.playlistPlugin.unloadPlaylist = sinon.spy();

  const newMockPlaylist = {
    new: true,
    on: sinon.spy(),
    off: sinon.spy(),
    reset: sinon.spy(),
    get: sinon.stub().returns([{}, {}, {}]),
    setCurrentIndex: sinon.spy()
  };

  // Load a new playlist
  this.playlistPlugin.loadPlaylist(newMockPlaylist);

  assert.ok(this.playlistPlugin.unloadPlaylist.calledOnce, 'unloadPlaylist is called to clean up existing playlist');
  assert.deepEqual(this.playlistPlugin.playlist_, newMockPlaylist, 'New playlist is loaded correctly');
});

QUnit.test('unloadPlaylist - resets and removes event handling correctly', function(assert) {
  const playlistEvents = ['playlistchange', 'playlistadd', 'playlistremove', 'playlistsorted'];

  this.playlistPlugin.playlist_ = this.mockPlaylist;
  this.playlistPlugin.autoAdvance_ = { fullReset: sinon.spy() };
  this.playlistPlugin.handleSourceChange_ = sinon.spy();

  this.playlistPlugin.unloadPlaylist();

  assert.ok(this.mockPlaylist.reset.called, 'Playlist reset is called');
  assert.ok(this.playlistPlugin.autoAdvance_.fullReset.called, 'AutoAdvance fullReset is called');
  assert.ok(this.playlistPlugin.handleSourceChange_.notCalled, 'handleSourceChange_ not called');

  playlistEvents.forEach(eventType => {
    assert.ok(this.mockPlaylist.off.calledWith(eventType), `Event forwarding for '${eventType}' removed`);
  });

  this.player.trigger('loadstart');

  assert.ok(this.playlistPlugin.handleSourceChange_.notCalled, 'handleSourceChange_ not called');
});

QUnit.test('getPlaylist - returns the current playlist', function(assert) {
  this.playlistPlugin.loadPlaylist(this.mockPlaylist);

  const retrievedPlaylist = this.playlistPlugin.getPlaylist();

  assert.deepEqual(retrievedPlaylist, this.mockPlaylist, 'getPlaylist returns the current playlist');
});

QUnit.test('setAutoadvanceDelay - sets the delay correctly', function(assert) {
  const testDelay = 20;

  this.playlistPlugin.autoAdvance_ = { setDelay: sinon.spy() };

  this.playlistPlugin.setAutoadvanceDelay(testDelay);

  assert.ok(this.playlistPlugin.autoAdvance_.setDelay.calledWith(testDelay), 'Auto-advance delay is set correctly');
});

QUnit.test('getAutoadvanceDelay - retrieves the current delay correctly', function(assert) {
  this.playlistPlugin.autoAdvance_ = { getDelay: sinon.stub().returns(10) };

  const currentDelay = this.playlistPlugin.getAutoadvanceDelay();

  assert.strictEqual(currentDelay, 10, 'Correct auto-advance delay is retrieved');
});

QUnit.test('getAutoadvanceDelay - returns null if autoAdvance_ is not set', function(assert) {
  this.playlistPlugin.autoAdvance_ = null;

  const currentDelay = this.playlistPlugin.getAutoadvanceDelay();

  assert.strictEqual(currentDelay, null, 'Returns null when autoAdvance_ is not set');
});

QUnit.test('loadPlaylistItem - successfully loads an item', function(assert) {
  this.playlistPlugin.loadPlaylist(this.mockPlaylist);

  this.playlistPlugin.loadItem_ = sinon.spy();

  const result = this.playlistPlugin.loadPlaylistItem(1, { loadPoster: true });

  assert.ok(this.playlistPlugin.loadItem_.called, 'loadItem_ is called for valid index');
  assert.ok(this.mockPlaylist.setCurrentIndex.calledWith(1), 'setCurrentIndex is called with correct index');
  assert.strictEqual(result, true, 'Returns true for successful load');
});

QUnit.test('loadPlaylistItem - handles out of bounds index', function(assert) {
  this.playlistPlugin.loadPlaylist(this.mockPlaylist);

  this.playlistPlugin.loadItem_ = sinon.spy();

  const result = this.playlistPlugin.loadPlaylistItem(-1);

  assert.ok(log.error.called, 'Logs error for out of bounds index');
  assert.notOk(this.playlistPlugin.loadItem_.called, 'loadItem_ is not called for invalid index');
  assert.strictEqual(result, false, 'Returns false for out of bounds index');
});

QUnit.test('loadPlaylistItem - respects the loadPoster option', function(assert) {
  this.playlistPlugin.loadPlaylist(this.mockPlaylist);

  this.playlistPlugin.loadItem_ = sinon.spy();

  this.playlistPlugin.loadPlaylistItem(0, { loadPoster: false });

  assert.ok(this.playlistPlugin.loadItem_.calledWith(sinon.match.any, { loadPoster: false }), 'loadItem_ is called with loadPoster set to false');
});

QUnit.test('loadFirstItem - loads the first item successfully', function(assert) {
  this.playlistPlugin.loadPlaylistItem = sinon.spy();

  this.playlistPlugin.loadFirstItem();

  assert.ok(this.playlistPlugin.loadPlaylistItem.calledWith(0), 'loadPlaylistItem is called with index 0 for non-empty playlist');
});

QUnit.test('loadLastItem - loads the last item successfully', function(assert) {
  const lastIndex = 2;

  this.mockPlaylist.getLastIndex = sinon.stub().returns(lastIndex);
  this.playlistPlugin.loadPlaylistItem = sinon.spy();

  this.playlistPlugin.loadPlaylist(this.mockPlaylist);
  this.playlistPlugin.loadLastItem();

  assert.ok(this.mockPlaylist.getLastIndex.called, 'getLastIndex is called');
  assert.ok(this.playlistPlugin.loadPlaylistItem.calledWith(lastIndex), 'loadPlaylistItem is called with the last index');
});

QUnit.test('loadNextItem - successfully loads the next item', function(assert) {
  const nextIndex = 1;

  this.mockPlaylist.getNextIndex = sinon.stub().returns(nextIndex);
  this.playlistPlugin.loadPlaylistItem = sinon.spy();

  this.playlistPlugin.loadPlaylist(this.mockPlaylist);
  this.playlistPlugin.loadNextItem({ loadPoster: true });

  assert.ok(this.mockPlaylist.getNextIndex.called, 'getNextIndex is called');
  assert.ok(this.playlistPlugin.loadPlaylistItem.calledWith(nextIndex, { loadPoster: true }), 'loadPlaylistItem is called with the next index and loadPoster option');
});

QUnit.test('loadNextItem - handles no next item', function(assert) {
  this.mockPlaylist.getNextIndex = sinon.stub().returns(-1);

  this.playlistPlugin.loadPlaylist(this.mockPlaylist);
  const result = this.playlistPlugin.loadNextItem();

  assert.ok(this.mockPlaylist.getNextIndex.called, 'getNextIndex is called');
  assert.strictEqual(result, false, 'Returns false when there is no next item');
});

QUnit.test('loadPreviousItem - successfully loads the previous item', function(assert) {
  const previousIndex = 0;

  this.mockPlaylist.getPreviousIndex = sinon.stub().returns(previousIndex);
  this.playlistPlugin.loadPlaylistItem = sinon.spy();

  this.playlistPlugin.loadPlaylist(this.mockPlaylist);
  this.playlistPlugin.loadPreviousItem();

  assert.ok(this.mockPlaylist.getPreviousIndex.called, 'getPreviousIndex is called');
  assert.ok(this.playlistPlugin.loadPlaylistItem.calledWith(previousIndex), 'loadPlaylistItem is called with the previous index');
});

QUnit.test('loadPreviousItem - handles no previous item', function(assert) {
  this.mockPlaylist.getPreviousIndex = sinon.stub().returns(-1);

  this.playlistPlugin.loadPlaylist(this.mockPlaylist);
  const result = this.playlistPlugin.loadPreviousItem();

  assert.ok(this.mockPlaylist.getPreviousIndex.called, 'getPreviousIndex is called');
  assert.strictEqual(result, false, 'Returns false when there is no previous item');
});

QUnit.test('loadItem_ - handles loading with poster', function(assert) {
  this.playlistPlugin.clearExistingItemTextTracks_ = sinon.spy();

  let beforePlaylistItemFired = false;

  this.player.on('beforeplaylistitem', () => {
    beforePlaylistItemFired = true;
  });

  this.playlistPlugin.loadItem_(this.testItems[0], { loadPoster: true });

  assert.ok(beforePlaylistItemFired, 'Triggers beforeplaylistitem event');
  assert.ok(this.player.poster.calledWith(this.testItems[0].poster), 'Sets the correct poster');
  assert.ok(this.player.src.calledWith(this.testItems[0].sources), 'Sets the correct sources');
  assert.ok(this.playlistPlugin.clearExistingItemTextTracks_.called, 'Clears existing text tracks');
});

QUnit.test('loadItem_ - handles loading without poster', function(assert) {
  this.playlistPlugin.loadItem_(this.testItems[0], { loadPoster: false });

  assert.ok(this.player.poster.calledWith(''), 'Does not set the poster when loadPoster is false');
});

QUnit.test('loadItem_ - triggers playlistitem event after ready', function(assert) {
  this.playlistPlugin.addItemTextTracks_ = sinon.spy();

  let playlistItemFired = false;

  this.player.on('playlistitem', () => {
    playlistItemFired = true;
  });

  this.playlistPlugin.loadItem_(this.testItems[0], { loadPoster: true });

  assert.notOk(this.playlistPlugin.addItemTextTracks_.calledWith(this.testItems[0]), 'Item text tracks not added yet');
  assert.notOk(playlistItemFired, 'playlistitem event not fired yet');

  // Tick clock forward to trigger ready()
  this.clock.tick(1);

  assert.ok(this.playlistPlugin.addItemTextTracks_.calledWith(this.testItems[0]), 'Item text tracks added');
  assert.ok(playlistItemFired, 'playlistitem event fired');
});

QUnit.test('setupEventForwarding_ - forwards events from playlist to player', function(assert) {
  const playlistEvents = ['playlistchange', 'playlistadd', 'playlistremove', 'playlistsorted'];
  let eventForwardedCount = 0;

  this.playlistPlugin.playlist_ = new videojs.EventTarget();
  this.playlistPlugin.setupEventForwarding_();

  playlistEvents.forEach(eventType => {
    this.player.on(eventType, () => {
      eventForwardedCount++;
      assert.ok(true, `${eventType} event forwarded to the player`);
    });
  });

  playlistEvents.forEach(eventType => this.playlistPlugin.playlist_.trigger(eventType));

  assert.strictEqual(eventForwardedCount, playlistEvents.length, 'All playlist events are forwarded to the player');
});

QUnit.test('playNext_ - plays next item when loaded successfully', function(assert) {
  this.playlistPlugin.loadNextItem = sinon.stub().returns(true);
  this.player.play = sinon.spy();

  this.playlistPlugin.playNext_();

  assert.ok(this.playlistPlugin.loadNextItem.calledWith({ loadPoster: false }), 'loadNextItem is called with loadPoster false');
  assert.ok(this.player.play.calledOnce, 'Player play method is called');
});

QUnit.test('playNext_ - does not play next item when loading is unsuccessful', function(assert) {
  this.playlistPlugin.loadNextItem = sinon.stub().returns(false);
  this.player.play = sinon.spy();

  this.playlistPlugin.playNext_();

  assert.ok(this.playlistPlugin.loadNextItem.calledWith({ loadPoster: false }), 'loadNextItem is called with loadPoster false');
  assert.ok(this.player.play.notCalled, 'Player play method is not called');
});

QUnit.test('clearExistingItemTextTracks_ - removes all text tracks', function(assert) {
  const mockTextTracks = [
    { kind: 'subtitles', label: 'English' },
    { kind: 'subtitles', label: 'French' },
    { kind: 'subtitles', label: 'Spanish' }
  ];

  this.player.remoteTextTracks = sinon.stub().returns(mockTextTracks);
  this.player.removeRemoteTextTrack = sinon.spy();

  this.playlistPlugin.clearExistingItemTextTracks_();

  assert.strictEqual(this.player.removeRemoteTextTrack.callCount, mockTextTracks.length, 'removeRemoteTextTrack called for each text track');
});

QUnit.test('addItemTextTracks_ - adds text tracks for a playlist item', function(assert) {
  const mockItem = {
    textTracks: [
      { kind: 'subtitles', label: 'English' },
      { kind: 'subtitles', label: 'Spanish' },
      { kind: 'subtitles', label: 'French' }
    ]
  };

  this.player.addRemoteTextTrack = sinon.spy();

  this.playlistPlugin.addItemTextTracks_(mockItem);

  assert.strictEqual(this.player.addRemoteTextTrack.callCount, mockItem.textTracks.length, 'addRemoteTextTrack called for each text track');
});

QUnit.test('handleSourceChange_ - does not call handleNonPlaylistSource_ when source is in playlist', function(assert) {
  this.player.currentSrc = sinon.stub().returns('http://example.com/video1.mp4');
  this.playlistPlugin.isSourceInPlaylist_ = sinon.stub().returns(true);
  this.playlistPlugin.handleNonPlaylistSource_ = sinon.spy();

  this.playlistPlugin.handleSourceChange_();

  assert.ok(this.playlistPlugin.isSourceInPlaylist_.calledWith('http://example.com/video1.mp4'), 'isSourceInPlaylist_ called with current source');
  assert.ok(this.playlistPlugin.handleNonPlaylistSource_.notCalled, 'handleNonPlaylistSource_ not called');
});

QUnit.test('handleSourceChange_ - calls handleNonPlaylistSource_ when source is not in playlist', function(assert) {
  this.player.currentSrc = sinon.stub().returns('http://example.com/other-video.mp4');
  this.playlistPlugin.isSourceInPlaylist_ = sinon.stub().returns(false);
  this.playlistPlugin.handleNonPlaylistSource_ = sinon.spy();

  this.playlistPlugin.handleSourceChange_();

  assert.ok(this.playlistPlugin.isSourceInPlaylist_.calledWith('http://example.com/other-video.mp4'), 'isSourceInPlaylist_ called with current source');
  assert.ok(this.playlistPlugin.handleNonPlaylistSource_.called, 'handleNonPlaylistSource_ called');
});

QUnit.test('isSourceInPlaylist_ - returns true when source is in playlist', function(assert) {
  this.playlistPlugin.playlist_ = {
    get: sinon.stub().returns([
      { sources: [{ src: 'http://example.com/video1.mp4', type: 'video/mp4' }] },
      { sources: [{ src: 'http://example.com/video2.mp4', type: 'video/mp4' }] }
    ])
  };

  const result = this.playlistPlugin.isSourceInPlaylist_('http://example.com/video1.mp4');

  assert.ok(result, 'Returns true for a source that is in the playlist');
});

QUnit.test('isSourceInPlaylist_ - returns false when source is not in playlist', function(assert) {
  this.playlistPlugin.playlist_ = {
    get: sinon.stub().returns([
      { sources: [{ src: 'http://example.com/video1.mp4', type: 'video/mp4' }] },
      { sources: [{ src: 'http://example.com/video2.mp4', type: 'video/mp4' }] }
    ])
  };

  const result = this.playlistPlugin.isSourceInPlaylist_('http://example.com/nonexistent.mp4');

  assert.notOk(result, 'Returns false for a source that is not in the playlist');
});

QUnit.test('handleNonPlaylistSource_ - resets autoAdvance and sets playlist index to null', function(assert) {
  this.playlistPlugin.autoAdvance_ = { fullReset: sinon.spy() };
  this.playlistPlugin.playlist_ = { setCurrentIndex: sinon.spy() };

  this.playlistPlugin.handleNonPlaylistSource_();

  assert.ok(this.playlistPlugin.autoAdvance_.fullReset.calledOnce, 'autoAdvance_.fullReset is called once');
  assert.ok(this.playlistPlugin.playlist_.setCurrentIndex.calledWith(null), 'setCurrentIndex is called with null');
});
