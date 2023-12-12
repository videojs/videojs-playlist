import document from 'global/document';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';
import Playlist from '../src/playlist.js';
import PlaylistItem from '../src/playlist-item.js';
import AutoAdvance from '../src/auto-advance.js';
import { log } from '../src/utils.js';

QUnit.module('Playlist', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);

    log.error = sinon.spy();
    log.warn = sinon.spy();

    // Test data
    this.testItems = [
      { sources: [{ src: 'http://example.com/video1.mp4', type: 'video/mp4' }], title: 'Video 1' },
      { sources: [{ src: 'http://example.com/video2.mp4', type: 'video/mp4' }], title: 'Video 2' }
    ];

    this.playlist = new Playlist(this.player, {});
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('processPlaylistItem - with valid item', function(assert) {
  const validItem = {
    sources: [
      { src: 'http://example.com/video.mp4', type: 'video/mp4' }
    ],
    title: 'Valid Video'
  };

  const result = Playlist.processPlaylistItem(validItem);

  assert.ok(result instanceof PlaylistItem, 'Returns a PlaylistItem for a valid item');
  assert.deepEqual(result.sources, validItem.sources, 'Sources of the returned PlaylistItem match the input');
});

QUnit.test('processPlaylistItem - with some invalid sources', function(assert) {
  const itemWithInvalidSources = {
    sources: [
      { src: 'http://example.com/video.mp4', type: 'video/mp4' },
      { src: 'http://example.com/audio.mp3' }
    ],
    title: 'Mixed Sources'
  };

  const result = Playlist.processPlaylistItem(itemWithInvalidSources);

  assert.ok(result instanceof PlaylistItem, 'Returns a PlaylistItem even with some invalid sources');
  assert.equal(result.sources.length, 1, 'Only includes valid sources');
  assert.deepEqual(result.sources[0], itemWithInvalidSources.sources[0], 'Includes the correct valid source');
  assert.ok(log.warn.calledOnce, 'Logs a warning for disregarded invalid sources');
});

QUnit.test('processPlaylistItem - with all invalid sources', function(assert) {
  const itemWithAllInvalidSources = {
    sources: [
      { src: 'video.mp4' },
      { type: 'video/mp4' }
    ],
    title: 'Invalid Sources'
  };

  const result = Playlist.processPlaylistItem(itemWithAllInvalidSources);

  assert.strictEqual(result, null, 'Returns null for an item with all invalid sources');
  assert.ok(log.error.calledWith('Invalid playlist item: No valid sources were found.'), 'Logs an error for an item with no valid sources');
});

QUnit.test('processPlaylistItem - with incorrect item structure', function(assert) {
  // missing 'sources' array
  const invalidItem = {
    title: 'No Sources'
  };

  const result = Playlist.processPlaylistItem(invalidItem);

  assert.strictEqual(result, null, 'Returns null for an item with incorrect structure');
  assert.ok(log.error.calledWith('Invalid playlist item: Must be an object with a `sources` array.'), 'Logs an error for incorrect item structure');
});

QUnit.test('processPlaylistItem - retains properties of the original item', function(assert) {
  const itemWithAdditionalProps = {
    sources: [{ src: 'http://example.com/video.mp4', type: 'video/mp4' }],
    title: 'Video with Additional Properties',
    description: 'A test video',
    customProperty: 'Custom Value'
  };

  const result = Playlist.processPlaylistItem(itemWithAdditionalProps);

  assert.ok(result instanceof PlaylistItem, 'Returns a PlaylistItem for a valid item');
  assert.strictEqual(result.title, itemWithAdditionalProps.title, 'Retains the title property');
  assert.strictEqual(result.description, itemWithAdditionalProps.description, 'Retains the description property');
  assert.strictEqual(result.customProperty, itemWithAdditionalProps.customProperty, 'Retains custom properties');
});

QUnit.test('constructor initializes properties correctly', function(assert) {
  assert.ok(Array.isArray(this.playlist.list_), 'list_ should be initialized as an array');
  assert.equal(this.playlist.list_.length, 0, 'list_ should initially be empty');
  assert.strictEqual(this.playlist.currentIndex_, null, 'currentIndex_ should initially be null');
  assert.ok(this.playlist.autoAdvance_ instanceof AutoAdvance, 'autoAdvance_ should be an instance of AutoAdvance');
  assert.strictEqual(this.playlist.autoAdvance_.delay_, null, 'autoAdvance_ delay should be null by default after playlist initialization');
  assert.strictEqual(this.playlist.repeat_, false, 'repeat_ should be false by default');
});

QUnit.test('options - repeat mode can be set via option', function(assert) {
  this.playlist = new Playlist(this.player, { repeat: true });

  assert.strictEqual(this.playlist.repeat_, true, 'repeat_ should be set to true');
});

QUnit.test('options - autoadvanceDelay can be set via option', function(assert) {
  this.playlist = new Playlist(this.player, { autoadvanceDelay: 0 });

  assert.strictEqual(this.playlist.autoAdvance_.delay_, 0, 'autoAdvance delay should be 0 after playlist initialization');
});

QUnit.test('setPlaylist - valid input should set playlist correctly', function(assert) {
  const playlist = this.playlist.setPlaylist(this.testItems);

  assert.equal(playlist.length, this.testItems.length, 'Should return array with the correct number of items');
  assert.equal(this.playlist.list_.length, this.testItems.length, 'Playlist should have the correct number of items');
  assert.deepEqual(this.playlist.list_[0].sources, this.testItems[0].sources, 'First item sources should match');
  assert.deepEqual(this.playlist.list_[1].sources, this.testItems[1].sources, 'Second item sources should match');
  assert.equal(this.playlist.currentIndex_, null, 'currentIndex_ should be null until item is loaded');
});

QUnit.test('setPlaylist - should log error and return if items is not an array', function(assert) {
  const playlist = this.playlist.setPlaylist('not an array');

  assert.ok(log.error.calledWith('The playlist must be an array.'), 'Should log error for non-array input');
  assert.equal(playlist.length, 0, 'Should return empty array if playlist has not been set');
});

QUnit.test('setPlaylist - should handle invalid item by logging error and continuing', function(assert) {
  const invalidItem = { sources: 'invalid' };
  const combinedItems = [this.testItems[0], invalidItem, this.testItems[1]];

  const playlist = this.playlist.setPlaylist(combinedItems);

  assert.ok(log.error.calledWith('Invalid playlist item: Must be an object with a `sources` array.'), 'Should log error for invalid item');
  assert.equal(playlist.length, 2, 'Should return array of correct length');
  assert.equal(this.playlist.list_.length, 2, 'Should only add valid items to playlist');
});

QUnit.test('setPlaylist - should log error when all provided items are invalid', function(assert) {
  const invalidItems = [
    { sources: 'invalid0' },
    { sources: 'invalid1' },
    { sources: 'invalid2' }
  ];

  // Set a valid playlist initially
  const playlist = this.playlist.setPlaylist(this.testItems);

  assert.equal(playlist.length, this.testItems.length, 'Should return array with valid items');
  assert.notOk(log.error.calledWith('Cannot set the playlist as none of the provided playlist items were valid.'), 'Should not log error if valid items are passed');
  assert.equal(this.playlist.list_.length, this.testItems.length, 'Playlist should have the correct number of items');

  // Now set an invalid playlist
  this.playlist.setPlaylist(invalidItems);
  assert.equal(playlist.length, this.testItems.length, 'Should return previous array of valid items');
  assert.ok(log.error.calledWith('Cannot set the playlist as none of the provided playlist items were valid.'), 'Should log error when all items invalid');
  assert.strictEqual(this.playlist.list_.length, this.testItems.length, 'Playlist should be unchanged');
});

QUnit.test('setPlaylist - should trigger playlistchange events with correct properties', function(assert) {
  const spy = sinon.spy();

  this.player.on('playlistchange', spy);

  this.playlist.setPlaylist(this.testItems);

  assert.ok(spy.calledOnce, 'playlistchange event should not be triggered yet');
});

QUnit.test('setPlaylist - manages loadstart listener correctly', function(assert) {
  this.player.off = sinon.spy();
  this.player.on = sinon.spy();

  // First call to setPlaylist
  this.playlist.setPlaylist(this.testItems);
  assert.ok(this.player.on.calledWith('loadstart', this.playlist.handleSourceChange_), 'loadstart listener should be added on first call');
  assert.equal(this.player.on.callCount, 1, 'loadstart listener should be added once');

  // Second call to setPlaylist
  this.playlist.setPlaylist(this.testItems);
  assert.ok(this.player.off.calledWith('loadstart', this.playlist.handleSourceChange_), 'Existing loadstart listener should be removed on second call');
  assert.equal(this.player.on.callCount, 2, 'loadstart listener should be added again on second call');
});

QUnit.test('getPlaylist - returns an empty array for a new playlist', function(assert) {
  const playlistItems = this.playlist.getPlaylist();

  assert.ok(Array.isArray(playlistItems), 'Returned value should be an array');
  assert.strictEqual(playlistItems.length, 0, 'New playlist should be empty');
});

QUnit.test('getPlaylist - returns all items in the playlist', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  const playlistItems = this.playlist.getPlaylist();

  assert.strictEqual(playlistItems.length, this.testItems.length, 'Returned playlist should have the same number of items');
  assert.deepEqual(playlistItems[0].sources, this.testItems[0].sources, 'First item should match');
  assert.deepEqual(playlistItems[1].sources, this.testItems[1].sources, 'Second item should match');
});

QUnit.test('getPlaylist - returns a shallow clone of the playlist', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  const playlistItems = this.playlist.getPlaylist();

  assert.notStrictEqual(playlistItems, this.playlist.list_, 'Returned playlist should not be the original array');

  // Modify the returned array and check if the original playlist is unaffected
  playlistItems.push({ sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }] });
  assert.strictEqual(this.playlist.list_.length, this.testItems.length, 'Original playlist should remain unchanged');
});

QUnit.test('removePlaylist - removes the playlist correctly', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  this.playlist.autoAdvance_.fullReset = sinon.spy();
  this.player.off = sinon.spy();
  this.player.trigger = sinon.spy();

  this.playlist.removePlaylist();

  assert.ok(this.playlist.autoAdvance_.fullReset.calledOnce, 'autoAdvance_.fullReset() should be called');
  assert.strictEqual(this.playlist.currentIndex_, null, 'currentIndex_ should be null after removal');
  assert.deepEqual(this.playlist.list_, [], 'list_ should be empty after removal');
  assert.ok(this.player.off.calledWith('loadstart', this.playlist.handleSourceChange_), 'Event listener for loadstart should be removed');
  assert.ok(this.player.trigger.calledWith('playlistchange'), 'playlistchange event should be triggered asynchronously');
});

QUnit.test('setAutoadvanceDelay - sets delay correctly', function(assert) {
  this.playlist.setAutoadvanceDelay(5);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, 5, 'Delay should be set to 5 seconds');

  this.playlist.setAutoadvanceDelay(0);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, 0, 'Delay should be set to 0 seconds (immediate advance)');
});

QUnit.test('setAutoadvanceDelay - cancels auto-advance on invalid input', function(assert) {
  // Set valid value initially
  this.playlist.setAutoadvanceDelay(5);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, 5, 'Delay should be set to 5 seconds initially');

  this.playlist.setAutoadvanceDelay(-1);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, null, 'Negative delay should cancel auto-advance');

  // Reset to valid value
  this.playlist.setAutoadvanceDelay(5);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, 5, 'Delay should be reset to 5 seconds');

  this.playlist.setAutoadvanceDelay('invalid');
  assert.strictEqual(this.playlist.autoAdvance_.delay_, null, 'Non-numeric delay should cancel auto-advance');

  // Reset to valid value
  this.playlist.setAutoadvanceDelay(5);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, 5, 'Delay should be reset to 5 seconds');

  this.playlist.setAutoadvanceDelay(null);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, null, 'Null delay should cancel auto-advance');

  // Reset to valid value
  this.playlist.setAutoadvanceDelay(5);
  assert.strictEqual(this.playlist.autoAdvance_.delay_, 5, 'Delay should be reset to 5 seconds');

  this.playlist.setAutoadvanceDelay();
  assert.strictEqual(this.playlist.autoAdvance_.delay_, null, 'Undefined delay should cancel auto-advance');
});

QUnit.test('getAutoadvanceDelay - gets delay correctly', function(assert) {
  this.playlist.setAutoadvanceDelay(5);
  assert.strictEqual(this.playlist.getAutoadvanceDelay(), 5, 'Delay should be set to 5 seconds');

  this.playlist.setAutoadvanceDelay(0);
  assert.strictEqual(this.playlist.getAutoadvanceDelay(), 0, 'Delay should be set to 0 seconds');

  this.playlist.setAutoadvanceDelay(null);
  assert.strictEqual(this.playlist.getAutoadvanceDelay(), null, 'Delay should be set to 0 seconds');
});

QUnit.test('enableRepeat/disableRepeat - set repeat mode correctly', function(assert) {
  this.playlist.enableRepeat();
  assert.strictEqual(this.playlist.repeat_, true, 'Repeat mode should be enabled');

  this.playlist.disableRepeat();
  assert.strictEqual(this.playlist.repeat_, false, 'Repeat mode should be disabled');
});

QUnit.test('isRepeatEnabled - retrieves the current repeat mode status', function(assert) {
  this.playlist.enableRepeat();
  assert.strictEqual(this.playlist.isRepeatEnabled(), true, 'Should return true when repeat mode is enabled');

  this.playlist.disableRepeat();
  assert.strictEqual(this.playlist.isRepeatEnabled(), false, 'Should return false when repeat mode is disabled');
});

QUnit.test('loadItem - loads the current item correctly', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  const status = this.playlist.loadItem(1);

  assert.strictEqual(this.playlist.currentIndex_, 1, 'Current index should be set correctly');
  assert.ok(status, 'Returns true if the item is set');
});

QUnit.test('loadItem - logs error on invalid index', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  const status = this.playlist.loadItem(5);

  assert.ok(log.error.calledWith('Index is out of bounds.'), 'Should log error for out-of-bounds index');
  assert.strictEqual(this.playlist.currentIndex_, null, 'Current index should remain unchanged on invalid input');
  assert.notOk(status, 'Returns false if the item is not set');
});

QUnit.test('getCurrentItem - retrieves the correct PlaylistItem', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  this.playlist.loadItem(0);

  assert.ok(this.playlist.getCurrentItem() instanceof PlaylistItem, 'Should return an instance of PlaylistItem');
  assert.strictEqual(this.playlist.getCurrentItem(), this.playlist.list_[0], 'Should return the correct PlaylistItem for the initial index');

  this.playlist.loadItem(1);
  assert.ok(this.playlist.getCurrentItem() instanceof PlaylistItem, 'Should return an instance of PlaylistItem');
  assert.strictEqual(this.playlist.getCurrentItem(), this.playlist.list_[1], 'Should return the correct PlaylistItem for the current index');
});

QUnit.test('getCurrentItem - returns undefined when no current item', function(assert) {
  assert.strictEqual(this.playlist.getCurrentItem(), undefined, 'Should return undefined when no playlist set');

  this.playlist.setPlaylist(this.testItems);

  assert.strictEqual(this.playlist.getCurrentItem(), undefined, 'Should still return undefined when no item loaded');
});

QUnit.test('getCurrentIndex - returns the correct current index', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  this.playlist.loadItem(0);

  assert.equal(this.playlist.getCurrentIndex(), 0, 'Should return the correct current index');

  this.playlist.loadItem(1);
  assert.equal(this.playlist.getCurrentIndex(), 1, 'Should return the correct current index');
});

QUnit.test('getCurrentIndex - returns -1 if no current item is set', function(assert) {
  assert.equal(this.playlist.getCurrentIndex(), -1, 'Should return -1 if no current item is set');
});

QUnit.test('getLastIndex - returns the index of the last item', function(assert) {
  this.playlist.setPlaylist([]);
  assert.equal(this.playlist.getLastIndex(), -1, 'Should return -1 if the playlist is empty');

  this.playlist.setPlaylist(this.testItems);
  assert.equal(this.playlist.getLastIndex(), this.testItems.length - 1, 'Should return the index of the last item');
});

QUnit.test('getNextIndex - returns the correct next index', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  this.playlist.loadItem(0);
  assert.equal(this.playlist.getNextIndex(), 1, 'Should return the next index');

  this.playlist.loadItem(this.testItems.length - 1);
  assert.equal(this.playlist.getNextIndex(), -1, 'Should return -1 if at the end and repeat is not enabled');

  this.playlist.enableRepeat();
  assert.equal(this.playlist.getNextIndex(), 0, 'Should return 0 if at the end and repeat is enabled');
});

QUnit.test('getNextIndex - returns -1 if no current item is set', function(assert) {
  assert.equal(this.playlist.getNextIndex(), -1, 'Should return -1 if no current item is set');
});

QUnit.test('getPreviousIndex - returns the correct previous index', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  this.playlist.loadItem(1);
  assert.equal(this.playlist.getPreviousIndex(), 0, 'Should return the previous index');

  this.playlist.loadItem(0);
  assert.equal(this.playlist.getPreviousIndex(), -1, 'Should return -1 if at the beginning and repeat is not enabled');

  this.playlist.enableRepeat();
  assert.equal(this.playlist.getPreviousIndex(), this.testItems.length - 1, 'Should return the last index if at the beginning and repeat is enabled');
});

QUnit.test('getPreviousIndex - returns -1 if no current item is set', function(assert) {
  assert.equal(this.playlist.getPreviousIndex(), -1, 'Should return -1 if no current item is set');
});

QUnit.test('loadFirst - sets the first item as current', function(assert) {
  // Set initial index as something other than first item
  this.playlist.setPlaylist(this.testItems);

  assert.equal(this.playlist.getCurrentIndex(), -1, 'The initial index is -1 before item loaded');

  const status = this.playlist.loadFirst();

  assert.equal(this.playlist.getCurrentIndex(), 0, 'The first index should be set');
  assert.ok(status, 'Returns true if the item is set');
});

QUnit.test('loadFirst - does nothing if no playlist is set', function(assert) {
  const status = this.playlist.loadFirst();

  assert.equal(this.playlist.getCurrentIndex(), -1, 'Current item index still does not exist');
  assert.notOk(status, 'Returns false if the item is not set');
});

QUnit.test('loadLast - sets the last item as current', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  assert.equal(this.playlist.getCurrentIndex(), -1, 'The initial index is correct');

  const status = this.playlist.loadLast();

  assert.equal(this.playlist.getCurrentIndex(), 1, 'The last index should be set');
  assert.ok(status, 'Returns true if the item is set');
});

QUnit.test('last - does nothing if no playlist is set', function(assert) {
  const status = this.playlist.loadLast();

  assert.equal(this.playlist.getCurrentIndex(), -1, 'Current item index still does not exist');
  assert.notOk(status, 'Returns false if the item is not set');
});

QUnit.test('loadNext - advances to the next item', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  this.playlist.loadItem(0);

  assert.equal(this.playlist.getCurrentIndex(), 0, 'The initial index should be 0');

  const status = this.playlist.loadNext();

  assert.equal(this.playlist.getCurrentIndex(), 1, 'The next item index should be 1');
  assert.ok(status, 'Returns true if the item is set');
});

QUnit.test('loadNext - loops to the first item when repeat is enabled', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  this.playlist.enableRepeat();
  this.playlist.loadItem(this.testItems.length - 1);

  assert.equal(this.playlist.getCurrentIndex(), this.testItems.length - 1, 'The initial index should be at the last item');

  const status = this.playlist.loadNext();

  assert.equal(this.playlist.getCurrentIndex(), 0, 'Should loop back to the first item with repeat enabled');
  assert.ok(status, 'Returns true if the item is set');
});

QUnit.test('loadNext - does nothing at the end of the playlist without repeat', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  this.playlist.loadItem(this.testItems.length - 1);
  this.playlist.disableRepeat();

  assert.equal(this.playlist.getCurrentIndex(), this.testItems.length - 1, 'The initial index should be at the last item');

  const status = this.playlist.loadNext();

  assert.equal(this.playlist.getCurrentIndex(), this.testItems.length - 1, 'The last item index should remain unchanged without repeat');
  assert.notOk(status, 'Returns false if the item is not set');
});

QUnit.test('loadNext - does nothing if no playlist is set', function(assert) {
  const status = this.playlist.loadNext();

  assert.equal(this.playlist.getCurrentIndex(), -1, 'Current item index still does not exist');
  assert.notOk(status, 'Returns false if the item is not set');
});

QUnit.test('loadPrevious - goes back to the previous item', function(assert) {
  this.playlist.setPlaylist(this.testItems, 1);
  this.playlist.loadItem(1);

  assert.equal(this.playlist.getCurrentIndex(), 1, 'The initial index should be 1');

  const status = this.playlist.loadPrevious();

  assert.equal(this.playlist.getCurrentIndex(), 0, 'The previous item index should be 0');
  assert.ok(status, 'Returns true if the item is set');
});

QUnit.test('loadPrevious - loops to the last item when repeat is enabled', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  this.playlist.loadItem(0);
  this.playlist.enableRepeat();

  assert.equal(this.playlist.getCurrentIndex(), 0, 'The initial index should be 0');

  const status = this.playlist.loadPrevious();

  assert.equal(this.playlist.getCurrentIndex(), this.testItems.length - 1, 'Should loop back to the last item with repeat enabled');
  assert.ok(status, 'Returns true if the item is set');
});

QUnit.test('loadPrevious - does nothing at the start of the playlist without repeat', function(assert) {
  this.playlist.setPlaylist(this.testItems);
  this.playlist.loadItem(0);
  this.playlist.disableRepeat();

  assert.equal(this.playlist.getCurrentIndex(), 0, 'The initial index should be 0');

  const status = this.playlist.loadPrevious();

  assert.equal(this.playlist.getCurrentIndex(), 0, 'The first item index should remain unchanged without repeat');
  assert.notOk(status, 'Returns false if the item is not set');
});

QUnit.test('loadPrevious - does nothing if no playlist is set', function(assert) {
  const status = this.playlist.loadPrevious();

  assert.equal(this.playlist.getCurrentIndex(), -1, 'Current item index still does not exist');
  assert.notOk(status, 'Returns false if the item is not set');
});

QUnit.test('add - adds a single item to the playlist', function(assert) {
  const added = this.playlist.add(this.testItems[0]);

  assert.equal(this.playlist.list_.length, 1, 'Playlist should have one item');
  assert.ok(this.playlist.list_[0] instanceof PlaylistItem, 'Added item should be an instance of PlaylistItem');
  assert.ok(added[0] instanceof PlaylistItem, 'Should return an array with added PlaylistItem');
});

QUnit.test('add - adds multiple items to the playlist', function(assert) {
  const added = this.playlist.add(this.testItems);

  assert.equal(this.playlist.list_.length, 2, 'Playlist should have two items');
  assert.ok(this.playlist.list_[1] instanceof PlaylistItem, 'Items should be a instances of PlaylistItem');
  assert.equal(added.length, 2, 'Should return an array with two items');
});

QUnit.test('add - adds items at specified index', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  const newItem = { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' };

  this.playlist.add(newItem, 1);

  assert.equal(this.playlist.list_.length, 3, 'Playlist should have three items');
  assert.deepEqual(this.playlist.list_[1].sources.src, newItem.sources.src, 'New item should be at the specified index');
});

QUnit.test('add - adds items at the end for invalid index', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  const newItem = { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' };

  this.playlist.add(newItem, 10);

  assert.equal(this.playlist.list_.length, 3, 'Playlist should have three items');
  assert.deepEqual(this.playlist.list_[2].sources.src, newItem.sources.src, 'New item should be added at the end for invalid index');
});

QUnit.test('add - handles invalid items correctly', function(assert) {
  // Invalid item with incorrect sources structure
  const invalidItem1 = { sources: 'invalid' };

  const added = this.playlist.add(invalidItem1);

  assert.equal(this.playlist.list_.length, 0, 'Playlist should not add an item with invalid sources');
  assert.ok(log.error.calledWith('Invalid playlist item: Must be an object with a `sources` array.'), 'Error should be logged for item with invalid sources');
  assert.ok(log.error.calledWith('Cannot add items to the playlist as none were valid.'), 'Error should be logged for item with invalid sources');
  assert.equal(added.length, 0, 'Should return an empty array');

  log.error.resetHistory();

  // Invalid item of non-object type
  const invalidItem2 = 'not an object';

  const added2 = this.playlist.add(invalidItem2);

  assert.equal(this.playlist.list_.length, 0, 'Playlist should not add non-object items');
  assert.ok(log.error.calledWith('Provided items must be an object or an array of objects.'), 'Error should be logged for non-object item');
  assert.equal(added2.length, 0, 'Should return an empty array');

  log.error.resetHistory();

  // Invalid item as null
  const invalidItem3 = null;

  const added3 = this.playlist.add(invalidItem3);

  assert.equal(this.playlist.list_.length, 0, 'Playlist should not add null as an item');
  assert.ok(log.error.calledWith('Provided items must be an object or an array of objects.'), 'Error should be logged for null item');
  assert.equal(added3.length, 0, 'Should return an empty array');
});

QUnit.test('add - updates currentIndex_ correctly when adding items', function(assert) {
  // Setup a 3 item playlist for this test
  this.testItems.push({ sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' });

  const addTestScenarios = [
    {
      description: 'Add an item before the current index',
      currentIndex: 1,
      addIndex: 0,
      addItems: this.testItems[0],
      expectedIndex: 2
    },
    {
      description: 'Add an item at the current index',
      currentIndex: 1,
      addIndex: 1,
      addItems: this.testItems[0],
      expectedIndex: 2
    },
    {
      description: 'Add an item after the current index',
      currentIndex: 1,
      addIndex: 2,
      addItems: this.testItems[0],
      expectedIndex: 1
    },
    {
      description: 'Add multiple items before the current index',
      currentIndex: 1,
      addIndex: 0,
      addItems: [this.testItems[0], this.testItems[1]],
      expectedIndex: 3
    }
  ];

  addTestScenarios.forEach(scenario => {
    // Setup playlist for scenario
    this.playlist.setPlaylist(this.testItems);
    this.playlist.loadItem(scenario.currentIndex);
    assert.equal(this.playlist.getCurrentIndex(), scenario.currentIndex, `currentIndex_ set to ${scenario.currentIndex} before adding`);

    const added = this.playlist.add(scenario.addItems, scenario.addIndex);

    assert.equal(this.playlist.getCurrentIndex(), scenario.expectedIndex, scenario.description);
    assert.ok(Array.isArray(added), 'Returns array');
  });
});

QUnit.test('add - triggers playlistadd event', function(assert) {
  const spy = sinon.spy();

  this.player.on('playlistadd', spy);
  this.playlist.add(this.testItems[0]);

  assert.ok(spy.calledOnce, 'playlistadd event should be triggered');
});

QUnit.test('remove - updates currentIndex_ correctly when removing items in different scenarios', function(assert) {
  // Setup a 5 item playlist for this test
  this.testItems.push(
    { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' },
    { sources: [{ src: 'http://example.com/video4.mp4', type: 'video/mp4' }], title: 'Video 4' },
    { sources: [{ src: 'http://example.com/video5.mp4', type: 'video/mp4' }], title: 'Video 5' }
  );

  // Test scenarios
  const testScenarios = [
    {
      description: 'Remove the item before the current index',
      currentIndex: 1,
      removeIndex: 0,
      expectedIndex: 0
    },
    {
      description: 'Remove just the current item',
      currentIndex: 1,
      removeIndex: 1,
      expectedIndex: 1
    },
    {
      description: 'Remove the item after the current index',
      currentIndex: 1,
      removeIndex: 2,
      expectedIndex: 1
    },
    {
      description: 'Remove multiple items, including the current item (current at start)',
      currentIndex: 1,
      removeIndex: 1,
      removeCount: 2,
      expectedIndex: 1
    },
    {
      description: 'Remove multiple items, including the current item (current at end)',
      currentIndex: 1,
      removeIndex: 0,
      removeCount: 2,
      expectedIndex: 0
    },
    //
    {
      description: 'Remove items with the current item at the start and no items after',
      currentIndex: 2,
      removeIndex: 2,
      removeCount: 2,
      expectedIndex: 2
    },
    {
      description: 'Remove multiple items with the current item in the middle of the removal range',
      currentIndex: 2,
      removeIndex: 1,
      removeCount: 3,
      expectedIndex: 1
    },
    {
      description: 'Remove all items including the current item',
      currentIndex: 1,
      removeIndex: 0,
      removeCount: 5,
      expectedIndex: -1
    },
    {
      description: 'Remove the the current item when it is at the start',
      currentIndex: 0,
      removeIndex: 0,
      expectedIndex: 0
    },
    {
      description: 'Remove a range at the start that includes the current item',
      currentIndex: 1,
      removeIndex: 0,
      removeCount: 2,
      expectedIndex: 0
    },
    {
      description: 'Remove the the current item when it is at the end',
      currentIndex: 4,
      removeIndex: 4,
      expectedIndex: -1
    },
    {
      description: 'Remove a range at the end that includes the current item',
      currentIndex: 3,
      removeIndex: 3,
      removeCount: 2,
      expectedIndex: -1
    }
  ];

  testScenarios.forEach((scenario) => {
    // Setup playlist for scenario
    this.playlist.setPlaylist(this.testItems);
    this.playlist.loadItem(scenario.currentIndex);
    assert.equal(this.playlist.getCurrentIndex(), scenario.currentIndex, `currentIndex_ set to ${scenario.currentIndex}`);

    const removed = this.playlist.remove(scenario.removeIndex, scenario.removeCount);

    assert.equal(this.playlist.getCurrentIndex(), scenario.expectedIndex, scenario.description);
    assert.equal(removed.length, scenario.removeCount || 1, 'Returns array of correct length');
  });
});

QUnit.test('remove - handles invalid inputs correctly', function(assert) {
  // Setup a playlist with test items
  this.playlist.setPlaylist(this.testItems);

  // Invalid index
  const removed1 = this.playlist.remove(-1);

  assert.ok(log.error.calledWith('Index is out of bounds.'), 'Error logged for invalid index');
  assert.equal(removed1.length, 0, 'Should return an empty array');

  // Invalid count
  const removed2 = this.playlist.remove(0, -1);

  assert.ok(log.error.calledWith('Invalid count for removal.'), 'Error logged for invalid count');
  assert.equal(removed2.length, 0, 'Should return an empty array');
});

QUnit.test('remove - triggers playlistremove event with correct properties', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  const spy = sinon.spy();

  this.player.on('playlistremove', spy);
  this.playlist.remove(1);

  assert.ok(spy.calledOnce, 'playlistremove event is triggered');
  assert.equal(spy.args[0][0].type, 'playlistremove', 'event has correct type prop');
  assert.equal(spy.args[0][0].count, 1, 'event has correct count prop');
  assert.equal(spy.args[0][0].index, 1, 'event has correct index prop');
});

QUnit.test('remove - resets currentIndex_ correctly when all items are removed', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  this.playlist.remove(0, this.testItems.length);
  assert.strictEqual(this.playlist.currentIndex_, null, 'currentIndex_ should be null when all items are removed');
});

QUnit.test('sort - correctly sorts playlist items', function(assert) {
  // Start with unsorted items
  this.testItems = [
    { sources: [{ src: 'http://example.com/video2.mp4', type: 'video/mp4' }], title: 'Video 2' },
    { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' },
    { sources: [{ src: 'http://example.com/video1.mp4', type: 'video/mp4' }], title: 'Video 1' }
  ];
  this.playlist.setPlaylist(this.testItems);
  assert.deepEqual(this.playlist.getPlaylist().map(item => item.title), ['Video 2', 'Video 3', 'Video 1'], 'Playlist should be initially unsorted');

  const compareFunction = (a, b) => a.title.localeCompare(b.title);
  const spy = sinon.spy();

  this.player.on('playlistsorted', spy);
  this.playlist.sort(compareFunction);

  assert.deepEqual(this.playlist.getPlaylist().map(item => item.title), ['Video 1', 'Video 2', 'Video 3'], 'Playlist should be sorted');
  assert.ok(spy.calledOnce, 'playlistsorted event should be triggered');
});

QUnit.test('reverse - correctly reverses playlist items', function(assert) {
  this.testItems.push({ sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' });
  this.playlist.setPlaylist(this.testItems);
  assert.deepEqual(this.playlist.getPlaylist().map(item => item.title), ['Video 1', 'Video 2', 'Video 3'], 'Playlist should be initially sequential');

  const spy = sinon.spy();

  this.player.on('playlistsorted', spy);
  this.playlist.reverse();

  assert.deepEqual(this.playlist.getPlaylist().map(item => item.title), ['Video 3', 'Video 2', 'Video 1'], 'Playlist should be reversed');
  assert.ok(spy.calledOnce, 'playlistsorted event should be triggered');
});

QUnit.test('shuffle - correctly shuffles playlist items with rest option', function(assert) {
  assert.expect(11);

  const additionalItems = [
    { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' },
    { sources: [{ src: 'http://example.com/video4.mp4', type: 'video/mp4' }], title: 'Video 4' },
    { sources: [{ src: 'http://example.com/video5.mp4', type: 'video/mp4' }], title: 'Video 5' },
    { sources: [{ src: 'http://example.com/video6.mp4', type: 'video/mp4' }], title: 'Video 6' }
  ];

  // Setup a 6 item playlist
  this.testItems.push(...additionalItems);

  // Set the current item to the third one
  this.playlist.setPlaylist(this.testItems);
  this.playlist.loadItem(2);

  const originalPlaylist = this.playlist.getPlaylist();
  const spy = sinon.spy();

  this.player.on('playlistsorted', spy);

  // Shuffle with the `rest` option
  this.playlist.shuffle({ rest: true });

  const shuffledPlaylist = this.playlist.getPlaylist();

  assert.equal(shuffledPlaylist.length, originalPlaylist.length, 'Playlist should maintain the same length');

  // Check that all original items are present
  originalPlaylist.forEach(item => {
    assert.ok(shuffledPlaylist.includes(item), `Item ${item.title} should still be in the playlist`);
  });

  // Check that items before (and including) the current item have the same order
  assert.strictEqual(shuffledPlaylist[0], originalPlaylist[0], `Item ${originalPlaylist[0].title} should remain in place`);
  assert.strictEqual(shuffledPlaylist[1], originalPlaylist[1], `Item ${originalPlaylist[1].title} should remain in place`);
  assert.strictEqual(shuffledPlaylist[2], originalPlaylist[2], `Item ${originalPlaylist[2].title} should remain in place`);

  assert.ok(spy.called, 'playlistsorted event should be triggered');
});

QUnit.test('handleSourceChange_ - calls handleNonPlaylistSource_ for non-playlist source', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  // Mock non-playlist source
  this.player.currentSrc = () => 'http://example.com/not-in-playlist.mp4';

  this.playlist.handleNonPlaylistSource_ = sinon.spy();

  this.playlist.handleSourceChange_();

  assert.ok(this.playlist.handleNonPlaylistSource_.calledOnce, 'handleNonPlaylistSource_ should be called for a non-playlist source');
});

QUnit.test('isSourceInPlaylist_ - correctly identifies if a source is in the playlist', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  assert.ok(this.playlist.isSourceInPlaylist_(this.testItems[0].sources[0].src), 'Should return true for a source in the playlist');
  assert.notOk(this.playlist.isSourceInPlaylist_('http://example.com/not-in-playlist.mp4'), 'Should return false for a source not in the playlist');
});

QUnit.test('handleNonPlaylistSource_ - resets autoadvance and sets currentIndex to null', function(assert) {
  this.playlist.setPlaylist(this.testItems);

  this.playlist.autoAdvance_.fullReset = sinon.spy();

  this.playlist.handleNonPlaylistSource_();

  assert.ok(this.playlist.autoAdvance_.fullReset.calledOnce, 'autoAdvance_.fullReset() should be called');
  assert.strictEqual(this.playlist.currentIndex_, null, 'currentIndex_ should be null');
});
