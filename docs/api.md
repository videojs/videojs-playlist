# Video.js Playlist API

## PlaylistItem Structure

A playlist is an array of `PlaylistItem` objects that conform to the following structure:

```ts
interface PlaylistItem {
  /**
   * An array of source objects representing the media sources for the video.
   * Each source object includes the URL and MIME type of the video source.
   */
  sources: Array<{
    src: string;
    type: string;
  }>;

  /**
   * The URL of the poster image displayed before the video plays.
   * This property is optional.
   */
  poster?: string;

  /**
   * An optional array of text track objects for subtitles, captions, etc.
   * Each object in this array follows the structure of the Video.js TextTrack object.
   */
  textTracks?: Array<{
    kind?: string;
    label?: string;
    language?: string;
    src?: string;
    srcLang?: string;
    default?: boolean;
  }>;

  /**
   * Additional dynamic properties that may be specific to the video
   * or required by the playlist system.
   */
  [key: string]: any;
}
```

## Plugin Methods
### `setPlaylist(items: Array<Object>, index?: number)`

Sets the current playlist for a player.

#### Parameters
* `items` (`Array<Object>`): An array of object literals conforming to the `PlaylistItem` structure. These objects are used to create instances of the `PlaylistItem` class. Each object in the array represents a video and should include:
  * `sources` (`Array<{ src: string, type: string }>`): Required. An array of source objects for the video. Each source object must include:
    * `src` (`string`): The URL of the video.
    * `type` (`string`): The MIME type of the video.
  * `poster` (`string`, optional): An optional URL string pointing to the image displayed before the video plays.
  * `textTracks` (`Array<Object>`, optional): An optional array of text track objects that follow the structure of the Video.js [TextTrack](https://docs.videojs.com/texttrack) object.
  * Additional properties (like `title` or `description`) can be included, but note that the plugin will not utilize these properties. They can be used for custom implementations or metadata storage.
* `index` (`number`, optional): The starting index in the playlist from which playback should begin. If omitted, the first video is loaded. If `-1`, no video is loaded.

#### Events
* Fires a `playlistchange` event after the contents of the playlist are changed and the current playlist item is set. This is triggered asynchronously as to not interrupt the loading of the first video.

#### Example
```js
playlistPlugin.setPlaylist([{
  sources: [{
    src: '//media.w3.org/2010/05/sintel/trailer.mp4',
    type: 'video/mp4'
  }],
  poster: '//media.w3.org/2010/05/sintel/poster.png',
  textTracks: [
    {
      kind: 'subtitles',
      src: '//example.com/subtitles.vtt',
      language: 'en',
      label: 'English'
    }
  ],
  title: 'Sintel Trailer',
  description: 'A short animated film'
}, {
  sources: [{
    src: '//media.w3.org/2010/05/bunny/trailer.mp4',
    type: 'video/mp4'
  }],
  poster: '//media.w3.org/2010/05/bunny/poster.png'
}]);
```

### `getPlaylist() -> Array<PlaylistItem>`
Retrieves the current playlist from the player.

#### Returns
* Returns an array of `PlaylistItem` objects currently loaded in the player. Each object in the array represents a video and includes the video properties as the `items` listed above

### `setAutoadvanceDelay(delay?: number | null)`
Sets the auto-advance delay for the playlist or disables auto-advance. When a video ends, the playlist will automatically advance to the next video after the specified delay. Calling this method with null or without any argument cancels auto-advance.

#### Parameters
* `delay` (`number | null`, optional): The delay in seconds before advancing to the next item in the playlist. If this argument is `null`, not a positive number, or omitted, auto-advance is disabled.

### `getAutoadvanceDelay() -> number|null`
Retrieves the current auto-advance delay for the playlist. This method returns the delay in seconds before the playlist advances to the next video automatically.

#### Returns
* Returns a number representing the delay in seconds, or `null` if auto-advance is disabled.

### `enableRepeat()`
Enables repeat mode for the playlist. When repeat mode is enabled, the playlist will automatically loop back to the first item after the last item finishes playing.

### `disableRepeat()`
Disables repeat mode for the playlist. When repeat mode is disabled, the playlist will not loop back to the first item after the last item finishes playing.

### `isRepeatEnabled() -> boolean`
Retrieves the current repeat mode status of the playlist.

#### Returns
* Returns true if repeat mode is currently enabled, and false otherwise.

### `setCurrentItem(index: Number) -> boolean`
Sets the current playlist item based on the given index. The method attempts to load and play the playlist item at the specified index.

#### Events
* Fires a `beforeplaylistitem` before the specified item is loaded
* Fires a `playlistitem` after the specified item is loaded but before it is played

#### Parameters
* `index` (`number`): The index of the item to play in the playlist.

#### Returns
* Returns true if the current item is successfully set, and false otherwise (e.g., if the index is out of bounds).

### `getCurrentItem() -> PlaylistItem | undefined`
Retrieves the currently active PlaylistItem from the playlist.

#### Returns
* Returns the current `PlaylistItem` if available. If there is no current item (e.g., if the current index is not set or out of bounds), it returns `undefined`.

### `getCurrentIndex() -> number`
Retrieves the index of the currently active item in the playlist.

#### Returns
* Returns the current item's index if available. If there is no current item, it returns -1.

### `getLastIndex() -> number`
Gets the index of the last item in the playlist.

#### Returns
* Returns the index of the last item in the playlist. If the playlist is empty, it returns -1.

### `getNextIndex() -> number`
Gets the index of the next item in the playlist.

#### Returns
* Returns the index of the next item. If at the end of the playlist and repeat is enabled, it returns 0. If repeat is disabled, it returns -1.

### `getPreviousItem() -> number`
Gets the index of the previous item in the playlist.

#### Returns
* Returns the index of the previous item. If at the beginning of the playlist and repeat is enabled, it returns the last index. If repeat is disabled, it returns -1.

### `first() -> boolean`
Sets the first item in the playlist as the current item.

#### Returns
* Returns true if the first item is successfully set as the current item. Returns false otherwise (e.g., if the playlist is empty).

#### Events
* Fires a `beforeplaylistitem` before the first item is loaded
* Fires a `playlistitem` after the first item is loaded but before it is played

### `last() -> boolean`
Sets the last item in the playlist as the current item.

#### Returns
* Returns true if the last item is successfully set as the current item. Returns false otherwise (e.g., if the playlist is empty).

#### Events
* Fires a `beforeplaylistitem` before the last item is loaded
* Fires a `playlistitem` after the last item is loaded but before it is played

### `next() -> boolean`
Sets the next item in the playlist as the current item.

#### Returns

* Returns true if the next item is successfully set as the current item. If at the end of the playlist and repeat is not enabled, it returns false.

#### Events
* Fires a `beforeplaylistitem` before the next item is loaded
* Fires a `playlistitem` after the next item is loaded but before it is played

### `previous() -> boolean`
Sets the previous item in the playlist as the current item.

#### Returns
* Returns true if the previous item is successfully set as the current item. If at the beginning of the playlist and repeat is not enabled, it returns false.

#### Events
* Fires a `beforeplaylistitem` before the previous item is loaded
* Fires a `playlistitem` after the previous item is loaded but before it is played

### `add(items: Object | Array<Object>, index?: number) -> Array<PlaylistItem>`
Adds one or more items to the playlist at a specified index, or at the end if the index is not provided or invalid.

#### Parameters
* `items` (`Object | Array<Object>`): The item or array of items to add to the playlist. Each item should follow the required structure described above.
* `index` (`number`, optional): The index at which to add the items. Defaults to the end of the playlist if not provided or if provided index is invalid.

#### Returns
* Returns an array of `PlaylistItem` objects that were added, or an empty array if none were.

#### Events
* Fires a `playlistadd` event when items are successfully added.

#### Example
```js
// Adds one new item at index 2
const addedItems = playlistPlugin.add({
  sources: [{ src: '//example.com/new-video.mp4', type: 'video/mp4' }],
  poster: '//example.com/new-poster.jpg'
}, 2);

console.log(addedItems); // -> [PlaylistItem]
```

### `remove(index: number, count?: number) -> Array<PlaylistItem>`
Removes a specified number of items from the playlist, starting at the given index.

#### Parameters
* `index` (`number`): The starting index to remove items from. Removal occurs only if the index is within bounds.
* `count` (`number`, optional): The number of items to remove, defaulting to 1. Removal occurs only if the count is a positive number. If count exceeds the number of available items to remove, the method will remove as many items as possible starting from the specified index.

#### Returns
* Returns an array of `PlaylistItem` objects that were removed, or an empty array if none were.

#### Events
* Fires a `playlistremove` event when items are successfully removed.

#### Example
```js
// Removes 2 items starting from index 1
const removedItems = playlistPlugin.remove(1, 2);

console.log(removedItems); // -> [PlaylistItem, PlaylistItem]
```

### `sort(compare: Function)`
Sorts the playlist array using a comparator function in a manner identical to the native [Array#sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) method.

#### Parameters
* `compare` (`Function`): A comparator function used to determine the order of the elements.

#### Events
* Fires a `playlistsorted` event after the playlist is sorted internally.

### `reverse()`
Reverses the order of the items in the playlist in a manner identical to [Array#reverse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse)

#### Events
Fires a `playlistsorted` event after the playlist is reversed internally.

### `shuffle(options?: { rest: boolean })`
Shuffles the contents of the playlist randomly. By default, it shuffles items after the current item unless specified otherwise.

#### Parameters
* `options` (`Object`, optional): An object containing shuffle options.
  * `rest` (`boolean`, default: true): If true, only shuffles items after the current item. If false, shuffles the entire playlist.

#### Events
Fires a `playlistsorted` event after the playlist is shuffled internally.

## Events
### `playlistchange`
Triggered whenever there is an entirely new playlist set. This event is fired after the `setPlaylist()` method successfully adds a new playlist.

```js
player.on('playlistchange', () => {
  const newPlaylist = playlistPlugin.getPlaylist();

  console.log(newPlaylist); // -> [PlaylistItem, PlaylistItem, ...]
});
```

### `playlistadd`
Triggered when one or more items are successfully added to the playlist. This event is fired after the `add()` method successfully adds new items.

#### Event Details
* `count`: The number of items added.
* `index`: The index at which the items were added.

#### Example
```js
player.on('playlistadd', (e) => {
  console.log(`${e.count} item(s) added at index ${e.index}.`);
});
```

### `playlistremove`
Triggered when items are successfully removed from the playlist. This event is fired after the `remove()` method successfully removes items.

#### Event Details
* `count`: The number of items removed.
* `index`: The starting index from where items were removed.

#### Example
```js
player.on('playlistremove', (e) => {
  console.log(`${e.count} item(s) removed starting from index ${e.index}.`);
});
```

### `playlistsorted`
Triggered after the playlist is sorted internally. This event occurs when the `sort()`, `reverse()`, or `shuffle()` methods are called and successfully alter the order of the playlist.

#### Example
```js
player.on('playlistsorted', () => {
  const newlyOrderedPlaylist = playlistPlugin.getPlaylist();

  console.log(newlyOrderedPlaylist);
});
```

### `beforeplaylistitem`
Triggered before switching to a new content source within a playlist (i.e., after any of `setCurrentItem()`, `first()`, or `last()`, `next()`, or `previous()` are called, but before the new source has been loaded and the player's state has been changed).

#### Event Details
* **Event Argument:** The current instance of `PlaylistItem` that is about to be loaded.

#### Example
```js
player.on('beforeplaylistitem', (playlistItem) => {
  console.log(playlistItem); // -> PlaylistItem
  // Actions to take before the new item is loaded
});
```

### `playlistitem`
Triggered after a source has been loaded and the player state has changed, but before the `play()` method is called on the new source.

#### Event Details
* **Event Argument:** The current instance of PlaylistItem that has just been loaded.

#### Example
```js
player.on('playlistitem', (playlistItem) => {
  console.log(playlistItem); // -> PlaylistItem
  // Actions to take after the new item is loaded, but before playback
});
```
