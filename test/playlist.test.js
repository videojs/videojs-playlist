import document from 'global/document';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';
import Playlist from '../src/playlist.js';

QUnit.module('Playlist', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);

    this.onError = sinon.spy();
    this.onWarn = sinon.spy();

    // Test data
    this.testItems = [
      { sources: [{ src: 'http://example.com/video1.mp4', type: 'video/mp4' }], title: 'Video 1' },
      { sources: [{ src: 'http://example.com/video2.mp4', type: 'video/mp4' }], title: 'Video 2' },
      { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' }
    ];

    this.playlist = new Playlist({ onError: this.onError, onWarn: this.onWarn });
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('Playlist.from - returns a Playlist instance and calls setItems()', function(assert) {
  const playlist = Playlist.from(this.testItems);

  assert.ok(playlist instanceof Playlist, 'Should be an instance of Playlist');
});

QUnit.test('constructor initializes properties correctly', function(assert) {
  assert.ok(Array.isArray(this.playlist.items_), 'items_ should be initialized as an array');
  assert.equal(this.playlist.items_.length, 0, 'items_ should initially be empty');
  assert.strictEqual(this.playlist.currentIndex_, null, 'currentIndex_ should initially be null');
  assert.strictEqual(this.playlist.repeat_, false, 'repeat_ should be false by default');
});

QUnit.test('sanitizePlaylistItem_ - with valid item', function(assert) {
  const validItem = {
    sources: [{ src: 'http://example.com/video.mp4', type: 'video/mp4' }],
    title: 'Valid Video'
  };

  const result = this.playlist.sanitizePlaylistItem_(validItem);

  assert.deepEqual(result.sources, validItem.sources, 'Sources of the returned item match the input');
  assert.strictEqual(result.title, validItem.title, 'Title property is retained');
});

QUnit.test('sanitizePlaylistItem_ - with some invalid sources', function(assert) {
  const itemWithInvalidSources = {
    sources: [
      { src: 'http://example.com/video.mp4', type: 'video/mp4' },
      { src: 'http://example.com/audio.mp3' }
    ],
    title: 'Mixed Sources'
  };

  const result = this.playlist.sanitizePlaylistItem_(itemWithInvalidSources);

  assert.equal(result.sources.length, 1, 'Only includes valid sources');
  assert.deepEqual(result.sources[0], itemWithInvalidSources.sources[0], 'Includes the correct valid source');
  assert.ok(this.onWarn.calledOnce, 'Logs a warning for disregarded invalid sources');
});

QUnit.test('sanitizePlaylistItem_ - with all invalid sources', function(assert) {
  const itemWithAllInvalidSources = {
    sources: [{ src: 'video.mp4' }, { type: 'video/mp4' }],
    title: 'Invalid Sources'
  };

  const result = this.playlist.sanitizePlaylistItem_(itemWithAllInvalidSources);

  assert.strictEqual(result, null, 'Returns null for an item with all invalid sources');
  assert.ok(this.onError.calledWith('Invalid playlist item: No valid sources were found.'), 'Logs an error for an item with no valid sources');
});

QUnit.test('sanitizePlaylistItem_ - with incorrect item structure', function(assert) {
  const invalidItem = { title: 'No Sources' };

  const result = this.playlist.sanitizePlaylistItem_(invalidItem);

  assert.strictEqual(result, null, 'Returns null for an item with incorrect structure');
  assert.ok(this.onError.calledWith('Invalid playlist item: Must be an object with a `sources` array.'), 'Logs an error for incorrect item structure');
});

QUnit.test('sanitizePlaylistItem_ - retains properties of the original item', function(assert) {
  const itemWithAdditionalProps = {
    sources: [{ src: 'http://example.com/video.mp4', type: 'video/mp4' }],
    title: 'Video with Additional Properties',
    description: 'A test video',
    customProperty: 'Custom Value'
  };

  const result = this.playlist.sanitizePlaylistItem_(itemWithAdditionalProps);

  assert.strictEqual(result.title, itemWithAdditionalProps.title, 'Retains the title property');
  assert.strictEqual(result.description, itemWithAdditionalProps.description, 'Retains the description property');
  assert.strictEqual(result.customProperty, itemWithAdditionalProps.customProperty, 'Retains custom properties');
});

QUnit.test('setItems - valid input should set playlist correctly', function(assert) {
  const result = this.playlist.setItems(this.testItems);

  assert.equal(result.length, this.testItems.length, 'Should return array with the correct number of items');
  assert.deepEqual(result[0].sources, this.testItems[0].sources, 'First item sources should match');
  assert.deepEqual(result[1].sources, this.testItems[1].sources, 'Second item sources should match');
});

QUnit.test('setItems - should log error and return if items is not an array', function(assert) {
  const result = this.playlist.setItems('not an array');

  assert.ok(this.onError.calledWith('The playlist must be an array.'), 'Should log error for non-array input');
  assert.deepEqual(result, [], 'Should return an empty array if items are not valid');
});

QUnit.test('setItems - should handle invalid item by logging error and continuing', function(assert) {
  const invalidItem = { sources: 'invalid' };
  const combinedItems = [this.testItems[0], invalidItem, this.testItems[1]];

  const result = this.playlist.setItems(combinedItems);

  assert.ok(this.onError.calledWith('Invalid playlist item: Must be an object with a `sources` array.'), 'Should log error for invalid item');
  assert.equal(result.length, 2, 'Should return array of correct length');
});

QUnit.test('setItems - should log error when all provided items are invalid', function(assert) {
  const invalidItems = [{ sources: 'invalid0' }, { sources: 'invalid1' }, { sources: 'invalid2' }];

  const result = this.playlist.setItems(invalidItems);

  assert.ok(this.onError.calledWith('Cannot set the playlist as none of the provided playlist items were valid.'), 'Should log error when all items invalid');
  assert.deepEqual(result, [], 'Should return an empty array if all items are invalid');
});

QUnit.test('setItems - should trigger playlistchange events with correct properties', function(assert) {
  const spy = sinon.spy();

  this.playlist.on('playlistchange', spy);

  this.playlist.setItems(this.testItems);

  assert.ok(spy.calledOnce, 'playlistchange event should be triggered');
});

QUnit.test('getItems - returns an empty array for a new playlist', function(assert) {
  const playlistItems = this.playlist.getItems();

  assert.ok(Array.isArray(playlistItems), 'Returned value should be an array');
  assert.strictEqual(playlistItems.length, 0, 'New playlist should be empty');
});

QUnit.test('getItems - returns all items in the playlist', function(assert) {
  this.playlist.setItems(this.testItems);

  const playlistItems = this.playlist.getItems();

  assert.strictEqual(playlistItems.length, this.testItems.length, 'Returned playlist should have the same number of items');
  assert.deepEqual(playlistItems[0].sources, this.testItems[0].sources, 'First item should match');
  assert.deepEqual(playlistItems[1].sources, this.testItems[1].sources, 'Second item should match');
  assert.deepEqual(playlistItems[2].sources, this.testItems[2].sources, 'Third item should match');
});

QUnit.test('getItems - returns a shallow clone of the playlist', function(assert) {
  this.playlist.setItems(this.testItems);

  const playlistItems = this.playlist.getItems();

  assert.notStrictEqual(playlistItems, this.playlist.items_, 'Returned playlist should not be the original array');

  // Modify the returned array and check if the original playlist is unaffected
  playlistItems.push({ sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }] });
  assert.strictEqual(this.playlist.items_.length, this.testItems.length, 'Original playlist should remain unchanged');
});

QUnit.test('resetItems - clears the playlist, resets currentIndex_, and triggers playlistchange event', function(assert) {
  const spy = sinon.spy();

  this.playlist.on('playlistchange', spy);
  this.playlist.setItems(this.testItems);

  // Set currentIndex_ to a non-null value
  this.playlist.currentIndex_ = 0;

  this.playlist.reset();

  this.clock.tick(1);

  assert.deepEqual(this.playlist.items_, [], 'Playlist should be empty after reset');
  assert.strictEqual(this.playlist.currentIndex_, null, 'currentIndex_ should be null after reset');
  assert.ok(spy.calledTwice, 'playlistchange event should be triggered once for setItems() and again after reset()');
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

QUnit.test('setCurrentIndex - sets a valid index', function(assert) {
  this.playlist.setItems(this.testItems);

  this.playlist.setCurrentIndex(0);
  assert.strictEqual(this.playlist.currentIndex_, 0, 'currentIndex_ should be set correctly for a valid index');

  this.playlist.setCurrentIndex(1);
  assert.strictEqual(this.playlist.currentIndex_, 1, 'currentIndex_ should be set correctly for a valid index');

  this.playlist.setCurrentIndex(this.testItems.length - 1);
  assert.strictEqual(this.playlist.currentIndex_, this.testItems.length - 1, 'currentIndex_ should be set correctly for a valid index');
});

QUnit.test('setCurrentIndex - does not set an out-of-bounds index', function(assert) {
  this.playlist.setItems(this.testItems);

  const outOfBoundsIndex = this.testItems.length;
  const originalIndex = this.playlist.currentIndex_;

  this.playlist.setCurrentIndex(outOfBoundsIndex);

  assert.strictEqual(this.playlist.currentIndex_, originalIndex, 'currentIndex_ should not change for an out-of-bounds index');
  assert.ok(this.onError.calledWith('Cannot set index that is out of bounds.'), 'Should log an error for an out-of-bounds index');
});

QUnit.test('getCurrentItem - retrieves the correct playlist item', function(assert) {
  this.playlist.setItems(this.testItems);
  this.playlist.setCurrentIndex(0);

  assert.strictEqual(this.playlist.getCurrentItem(), this.playlist.items_[0], 'Should return the correct playlist item for the initial index');

  this.playlist.setCurrentIndex(1);
  assert.strictEqual(this.playlist.getCurrentItem(), this.playlist.items_[1], 'Should return the correct playlist item for the current index');
});

QUnit.test('getCurrentItem - returns undefined when no current item', function(assert) {
  assert.strictEqual(this.playlist.getCurrentItem(), undefined, 'Should return undefined when no playlist set');

  this.playlist.setItems(this.testItems);

  assert.strictEqual(this.playlist.getCurrentItem(), undefined, 'Should still return undefined when no item loaded');
});

QUnit.test('getCurrentIndex - returns the correct current index', function(assert) {
  this.playlist.setItems(this.testItems);
  this.playlist.setCurrentIndex(0);

  assert.equal(this.playlist.getCurrentIndex(), 0, 'Should return the correct current index');

  this.playlist.setCurrentIndex(1);
  assert.equal(this.playlist.getCurrentIndex(), 1, 'Should return the correct current index');
});

QUnit.test('getCurrentIndex - returns -1 if no current item is set', function(assert) {
  assert.equal(this.playlist.getCurrentIndex(), -1, 'Should return -1 if no current item is set');
});

QUnit.test('getLastIndex - returns the index of the last item', function(assert) {
  this.playlist.setItems([]);
  assert.equal(this.playlist.getLastIndex(), -1, 'Should return -1 if the playlist is empty');

  this.playlist.setItems(this.testItems);
  assert.equal(this.playlist.getLastIndex(), this.testItems.length - 1, 'Should return the index of the last item');
});

QUnit.test('getNextIndex - returns the correct next index', function(assert) {
  this.playlist.setItems(this.testItems);

  this.playlist.setCurrentIndex(0);
  assert.equal(this.playlist.getNextIndex(), 1, 'Should return the next index');

  this.playlist.setCurrentIndex(this.testItems.length - 1);
  assert.equal(this.playlist.getNextIndex(), -1, 'Should return -1 if at the end and repeat is not enabled');

  this.playlist.enableRepeat();
  assert.equal(this.playlist.getNextIndex(), 0, 'Should return 0 if at the end and repeat is enabled');
});

QUnit.test('getNextIndex - returns -1 if no current item is set', function(assert) {
  assert.equal(this.playlist.getNextIndex(), -1, 'Should return -1 if no current item is set');
});

QUnit.test('getPreviousIndex - returns the correct previous index', function(assert) {
  this.playlist.setItems(this.testItems);

  this.playlist.setCurrentIndex(1);
  assert.equal(this.playlist.getPreviousIndex(), 0, 'Should return the previous index');

  this.playlist.setCurrentIndex(0);
  assert.equal(this.playlist.getPreviousIndex(), -1, 'Should return -1 if at the beginning and repeat is not enabled');

  this.playlist.enableRepeat();
  assert.equal(this.playlist.getPreviousIndex(), this.testItems.length - 1, 'Should return the last index if at the beginning and repeat is enabled');
});

QUnit.test('getPreviousIndex - returns -1 if no current item is set', function(assert) {
  assert.equal(this.playlist.getPreviousIndex(), -1, 'Should return -1 if no current item is set');
});

QUnit.test('add - adds a single item to the playlist', function(assert) {
  const added = this.playlist.add(this.testItems[0]);
  const expectedItem = this.testItems[0];

  expectedItem.poster = '';
  expectedItem.textTracks = [];

  assert.equal(this.playlist.items_.length, 1, 'Playlist should have one item');
  assert.deepEqual(this.playlist.items_[0], expectedItem, 'Should add item to playlist correctly');
  assert.deepEqual(added[0], expectedItem, 'Should return added item');
});

QUnit.test('add - adds multiple items to the playlist', function(assert) {
  const added = this.playlist.add(this.testItems);

  assert.equal(this.playlist.items_.length, this.testItems.length, 'Playlist should have correct number of items');
  assert.equal(added.length, this.testItems.length, 'Should return an array with correct number of items');
});

QUnit.test('add - adds items at specified index', function(assert) {
  this.playlist.setItems(this.testItems);

  const newItem = { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' };

  this.playlist.add(newItem, 1);

  assert.equal(this.playlist.items_.length, this.testItems.length + 1, 'Playlist should have correct number of items');
  assert.deepEqual(this.playlist.items_[1].sources.src, newItem.sources.src, 'New item should be at the specified index');
});

QUnit.test('add - adds items at the end for invalid index', function(assert) {
  this.playlist.setItems(this.testItems);

  const newItem = { sources: [{ src: 'http://example.com/video3.mp4', type: 'video/mp4' }], title: 'Video 3' };

  this.playlist.add(newItem, 10);

  assert.equal(this.playlist.items_.length, this.testItems.length + 1, 'Playlist should have correct number of items');
  assert.deepEqual(this.playlist.items_[this.playlist.items_.length - 1].sources.src, newItem.sources.src, 'New item should be added at the end for invalid index');
});

QUnit.test('add - handles invalid items correctly', function(assert) {
  // Invalid item with incorrect sources structure
  const invalidItem1 = { sources: 'invalid' };

  const added = this.playlist.add(invalidItem1);

  assert.equal(this.playlist.items_.length, 0, 'Playlist should not add an item with invalid sources');
  assert.ok(this.onError.calledWith('Invalid playlist item: Must be an object with a `sources` array.'), 'Error should be logged for item with invalid sources');
  assert.ok(this.onError.calledWith('Cannot add items to the playlist as none were valid.'), 'Error should be logged for item with invalid sources');
  assert.equal(added.length, 0, 'Should return an empty array');

  this.onError.resetHistory();

  // Invalid item of non-object type
  const invalidItem2 = 'not an object';

  const added2 = this.playlist.add(invalidItem2);

  assert.equal(this.playlist.items_.length, 0, 'Playlist should not add non-object items');
  assert.ok(this.onError.calledWith('Provided items must be an object or an array of objects.'), 'Error should be logged for non-object item');
  assert.equal(added2.length, 0, 'Should return an empty array');

  this.onError.resetHistory();

  // Invalid item as null
  const invalidItem3 = null;

  const added3 = this.playlist.add(invalidItem3);

  assert.equal(this.playlist.items_.length, 0, 'Playlist should not add null as an item');
  assert.ok(this.onError.calledWith('Provided items must be an object or an array of objects.'), 'Error should be logged for null item');
  assert.equal(added3.length, 0, 'Should return an empty array');
});

QUnit.test('add - updates currentIndex_ correctly when adding items', function(assert) {
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
    this.playlist.setItems(this.testItems);
    this.playlist.setCurrentIndex(scenario.currentIndex);
    assert.equal(this.playlist.getCurrentIndex(), scenario.currentIndex, `currentIndex_ set to ${scenario.currentIndex} before adding`);

    const added = this.playlist.add(scenario.addItems, scenario.addIndex);

    assert.equal(this.playlist.getCurrentIndex(), scenario.expectedIndex, scenario.description);
    assert.ok(Array.isArray(added), 'Returns array');
  });
});

QUnit.test('add - triggers playlistadd event', function(assert) {
  const spy = sinon.spy();

  this.playlist.on('playlistadd', spy);
  this.playlist.add(this.testItems[0]);

  assert.ok(spy.calledOnce, 'playlistadd event should be triggered');
  assert.equal(spy.args[0][0].type, 'playlistadd', 'event has correct type prop');
  assert.equal(spy.args[0][0].count, 1, 'event has correct count prop');
  assert.equal(spy.args[0][0].index, 0, 'event has correct index prop');
});

QUnit.test('remove - updates currentIndex_ correctly when removing items in different scenarios', function(assert) {
  // Setup a 5 item playlist for this test
  this.testItems.push(
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
      description: 'Remove a range before the current index',
      currentIndex: 3,
      removeCount: 2,
      removeIndex: 0,
      expectedIndex: 1
    },
    {
      description: 'Remove just the current item',
      currentIndex: 1,
      removeIndex: 1,
      expectedIndex: -1
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
      expectedIndex: -1
    },
    {
      description: 'Remove multiple items, including the current item (current at end)',
      currentIndex: 1,
      removeIndex: 0,
      removeCount: 2,
      expectedIndex: -1
    },
    {
      description: 'Remove items with the current item at the start and no items after',
      currentIndex: 2,
      removeIndex: 2,
      removeCount: 2,
      expectedIndex: -1
    },
    {
      description: 'Remove multiple items with the current item in the middle of the removal range',
      currentIndex: 2,
      removeIndex: 1,
      removeCount: 3,
      expectedIndex: -1
    },
    {
      description: 'Remove all items including the current item',
      currentIndex: 1,
      removeIndex: 0,
      removeCount: 5,
      expectedIndex: -1
    },
    {
      description: 'Remove the current item when it is at the start',
      currentIndex: 0,
      removeIndex: 0,
      expectedIndex: -1
    },
    {
      description: 'Remove a range at the start that includes the current item',
      currentIndex: 1,
      removeIndex: 0,
      removeCount: 2,
      expectedIndex: -1
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
    this.playlist.setItems(this.testItems);
    this.playlist.setCurrentIndex(scenario.currentIndex);
    assert.equal(this.playlist.getCurrentIndex(), scenario.currentIndex, `currentIndex_ set to ${scenario.currentIndex}`);

    const removed = this.playlist.remove(scenario.removeIndex, scenario.removeCount);

    assert.equal(this.playlist.getCurrentIndex(), scenario.expectedIndex, scenario.description);
    assert.equal(removed.length, scenario.removeCount || 1, 'Returns array of correct length');
  });
});

QUnit.test('remove - handles invalid inputs correctly', function(assert) {
  this.playlist.setItems(this.testItems);

  // Invalid index
  const removed1 = this.playlist.remove(-1);

  assert.ok(this.onError.calledWith('Index is out of bounds.'), 'Error logged for invalid index');
  assert.equal(removed1.length, 0, 'Should return an empty array');

  // Invalid count
  const removed2 = this.playlist.remove(0, -1);

  assert.ok(this.onError.calledWith('Invalid count for removal.'), 'Error logged for invalid count');
  assert.equal(removed2.length, 0, 'Should return an empty array');
});

QUnit.test('remove - triggers playlistremove event with correct properties', function(assert) {
  this.playlist.setItems(this.testItems);

  const spy = sinon.spy();

  this.playlist.on('playlistremove', spy);
  this.playlist.remove(1);

  assert.ok(spy.calledOnce, 'playlistremove event is triggered');
  assert.equal(spy.args[0][0].type, 'playlistremove', 'event has correct type prop');
  assert.equal(spy.args[0][0].count, 1, 'event has correct count prop');
  assert.equal(spy.args[0][0].index, 1, 'event has correct index prop');
});

QUnit.test('remove - resets currentIndex_ correctly when all items are removed', function(assert) {
  this.playlist.setItems(this.testItems);

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
  this.playlist.setItems(this.testItems);
  assert.deepEqual(this.playlist.getItems().map(item => item.title), ['Video 2', 'Video 3', 'Video 1'], 'Playlist should be initially unsorted');

  const compareFunction = (a, b) => a.title.localeCompare(b.title);
  const spy = sinon.spy();

  this.playlist.on('playlistsorted', spy);
  this.playlist.sort(compareFunction);

  assert.deepEqual(this.playlist.getItems().map(item => item.title), ['Video 1', 'Video 2', 'Video 3'], 'Playlist should be sorted');
  assert.ok(spy.calledOnce, 'playlistsorted event should be triggered');
});

QUnit.test('reverse - correctly reverses playlist items', function(assert) {
  this.playlist.setItems(this.testItems);
  assert.deepEqual(this.playlist.getItems().map(item => item.title), ['Video 1', 'Video 2', 'Video 3'], 'Playlist should be initially sequential');

  const spy = sinon.spy();

  this.playlist.on('playlistsorted', spy);
  this.playlist.reverse();

  assert.deepEqual(this.playlist.getItems().map(item => item.title), ['Video 3', 'Video 2', 'Video 1'], 'Playlist should be reversed');
  assert.ok(spy.calledOnce, 'playlistsorted event should be triggered');
});

QUnit.test('shuffle - correctly shuffles playlist items with rest option', function(assert) {
  assert.expect(11);

  const additionalItems = [
    { sources: [{ src: 'http://example.com/video4.mp4', type: 'video/mp4' }], title: 'Video 4' },
    { sources: [{ src: 'http://example.com/video5.mp4', type: 'video/mp4' }], title: 'Video 5' },
    { sources: [{ src: 'http://example.com/video6.mp4', type: 'video/mp4' }], title: 'Video 6' }
  ];

  // Setup a 6 item playlist
  this.testItems.push(...additionalItems);

  // Set the current item to the third one
  this.playlist.setItems(this.testItems);
  this.playlist.setCurrentIndex(2);

  const originalPlaylist = this.playlist.getItems();
  const spy = sinon.spy();

  this.playlist.on('playlistsorted', spy);

  // Shuffle with the `rest` option
  this.playlist.shuffle({ rest: true });

  const shuffledPlaylist = this.playlist.getItems();

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
