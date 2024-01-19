import videojs from 'video.js';
import { isIndexInBounds, randomize } from './utils.js';

/**
 * This is standalone class that encapsulates all playlist logic that does not require a `player` instance
 */
export default class Playlist extends videojs.EventTarget {
  /**
   * Creates a new Playlist instance from a given array of items.
   *
   * @param {Object[]} items - An array of objects to initialize the playlist.
   * @param {Object} options - An options object to pass to the Playlist constructor
   * @return {Playlist} A new Playlist instance populated with the given items.
   */
  static from(items, options) {
    const playlist = new Playlist(options);

    playlist.setItems(items);

    return playlist;
  }

  constructor(options = {}) {
    super();

    this.items_ = [];
    this.currentIndex_ = null;
    this.repeat_ = false;
    this.onError_ = options.onError || (() => {});
    this.onWarn_ = options.onWarn || (() => {});
  }

  /**
   * Sets the playlist with a new list of items, overriding any existing items.
   *
   * @param {Object[]} items - An array of objects to set as the new playlist.
   * @return {Object[]} A shallow clone of the array of the playlist items.
   * @fires playlistchange - Triggered after the contents of the playlist are changed.
   *                         This event indicates that the current playlist has been updated.
   */
  setItems(items) {
    if (!Array.isArray(items)) {
      this.onError_('The playlist must be an array.');
      return [...this.items_];
    }

    const playlistItems = items.map(this.sanitizePlaylistItem_).filter(item => item !== null);

    if (playlistItems.length === 0) {
      this.onError_('Cannot set the playlist as none of the provided playlist items were valid.');
      return [...this.items_];
    }

    // If we have valid items, proceed to set the new playlist
    this.items_ = playlistItems;

    this.trigger('playlistchange');

    return [...this.items_];
  }

  /**
   * Retrieves the current list of playlist items.
   *
   * @return {Object[]} A shallow clone of the current list of playlist items.
   */
  getItems() {
    return [...this.items_];
  }

  /**
   * Removes the current playlist in its entirety without unloading the currently loaded source
   */
  reset() {
    this.currentIndex_ = null;
    this.items_ = [];

    this.trigger('playlistchange');
  }

  /**
   * Enables repeat mode. When enabled, the playlist will loop back to the first item after the last item.
   */
  enableRepeat() {
    this.repeat_ = true;
  }

  /**
   * Disables repeat mode. When disabled, the playlist will not loop back to the first item after the last item.
   */
  disableRepeat() {
    this.repeat_ = false;
  }

  /**
   * Retrieves the current repeat mode status of the playlist.
   *
   * @return {boolean} - True if repeat mode is enabled, false otherwise.
   */
  isRepeatEnabled() {
    return this.repeat_;
  }

  /**
   * Sets the current index to the specified value.
   *
   * @param {number} index - The index to be set as the current index.
   */
  setCurrentIndex(index) {
    if (!isIndexInBounds(this.items_, index)) {
      this.onError_('Cannot set index that is out of bounds.');
      return;
    }

    this.currentIndex_ = index;
  }

  /**
   * Retrieves the currently active playlist item object.
   *
   * @return {Object|undefined} The current playlist item if available, or undefined if no current item.
   */
  getCurrentItem() {
    return this.items_[this.currentIndex_];
  }

  /**
  * Retrieves the index of the currently active item in the playlist.
  *
  * @return {number} The current item's index if available, or -1 if no current item.
  */
  getCurrentIndex() {
    if (this.currentIndex_ === null) {
      return -1;
    }

    return this.currentIndex_;
  }

  /**
   * Get the index of the last item in the playlist.
   *
   * @return {number} The index of the last item in the playlist or -1 if there are no items.
   */
  getLastIndex() {
    return this.items_.length ? this.items_.length - 1 : -1;
  }

  /**
   * Calculates the index of the next item in the playlist.
   *
   * @return {number} The index of the next item or -1 if at the end of the playlist
   *                  and repeat is not enabled.
   */
  getNextIndex() {
    if (this.currentIndex_ === null) {
      return -1;
    }

    const nextIndex = (this.currentIndex_ + 1) % this.items_.length;

    return this.repeat_ || nextIndex !== 0 ? nextIndex : -1;
  }

  /**
   * Calculates the index of the previous item in the playlist.
   *
   * @return {number} The index of the previous item or -1 if at the beginning of the playlist
   *                  and repeat is not enabled.
   */
  getPreviousIndex() {
    if (this.currentIndex_ === null) {
      return -1;
    }

    const previousIndex = (this.currentIndex_ - 1 + this.items_.length) % this.items_.length;

    return this.repeat_ || previousIndex !== this.items_.length - 1 ? previousIndex : -1;
  }

  /**
   * A custom DOM event that is fired when new item(s) are added to the current
   * playlist (rather than replacing the entire playlist).
   *
   * @typedef  {Object} PlaylistAddEvent
   * @see      [CustomEvent Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
   * @property {string} type - Always "playlistadd"
   *
   * @property {number} count - The number of items that were added.
   *
   * @property {number} index - The starting index where item(s) were added.
   */

  /**
   * Adds one or more items to the playlist at the specified index or at the end if the index is not provided or invalid.
   * If items is empty or contains only invalid items, no items are added, and an empty array is returned.
   *
   * @param {Object|Object[]} items - The item or array of items to add.
   * @param {number} [index] - The index at which to add the items. Defaults to the end of the playlist.
   * @return {Object[]} The array of added playlist items or an empty array if no valid items were provided.
   * @fires playlistadd - Triggered when items are successfully added.
   */
  add(items, index) {
    if (!Array.isArray(items)) {
      if (typeof items === 'object' && items !== null) {
        items = [items];
      } else {
        this.onError_('Provided items must be an object or an array of objects.');
        return [];
      }
    }

    const resolvedIndex = (typeof index !== 'number' || index < 0 || index > this.items_.length) ? this.items_.length : index;
    const beforeItems = this.items_.slice(0, resolvedIndex);
    const afterItems = this.items_.slice(resolvedIndex);
    const newItems = items.map(this.sanitizePlaylistItem_).filter(item => item !== null);

    if (newItems.length === 0) {
      this.onError_('Cannot add items to the playlist as none were valid.');
      return [];
    }

    this.items_ = [...beforeItems, ...newItems, ...afterItems];

    // Update currentIndex if inserting new elements earlier in the array than the current item
    if (resolvedIndex <= this.currentIndex_) {
      this.currentIndex_ += newItems.length;
    }

    this.trigger({
      type: 'playlistadd',
      count: newItems.length,
      index: resolvedIndex
    });

    return [...newItems];
  }

  /**
   * A custom DOM event that is fired when new item(s) are removed from the
   * current playlist (rather than replacing the entire playlist).
   *
   * This is fired synchronously as it does not affect playback.
   *
   * @typedef  {Object} PlaylistRemoveEvent
   * @see      [CustomEvent Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
   * @property {string} type - Always "playlistremove"
   *
   * @property {number} count - The number of items that were removed.
   *
   * @property {number} index - The starting index where item(s) were removed.
   */

  /**
   * Removes a specified number of items from the playlist, starting at the given index.
   * Adjusts the current index if it falls within the range of the removed items.
   *
   * @param {number} index - The starting index to remove items from. If out of bounds, no removal occurs.
   * @param {number} [count=1] - The number of items to remove. Defaults to 1. Removal occurs only if count is a positive number.
   * @return {Object[]} An array of the removed playlist items.
   * @fires playlistremove - Triggered when items are successfully removed.
   */
  remove(index, count = 1) {
    if (!isIndexInBounds(this.items_, index)) {
      this.onError_('Index is out of bounds.');
      return [];
    }

    if (typeof count !== 'number' || count < 0) {
      this.onError_('Invalid count for removal.');
      return [];
    }

    // Constrain the removal count to the number of items that are actually available to remove starting at that index
    const actualCount = Math.min(count, this.items_.length - index);
    const removedItems = this.items_.splice(index, actualCount);

    this.adjustCurrentIndexAfterRemoval_(index, actualCount);

    this.trigger({
      type: 'playlistremove',
      count: actualCount,
      index
    });

    return [...removedItems];
  }

  /**
   * Sorts the playlist array.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort}
   * @param {Function} compare - A comparator function as per the native Array method.
   * @fires playlistsorted - Triggered after the playlist is sorted internally.
   */
  sort(compare) {
    if (!this.items_.length || typeof compare !== 'function') {
      return;
    }

    const currentItem = this.getCurrentItem();

    this.items_.sort(compare);

    // Update the current index after sorting
    this.currentIndex_ = this.items_.indexOf(currentItem);

    this.trigger('playlistsorted');
  }

  /**
   * Reverses the order of the items in the playlist.
   *
   * @fires playlistsorted - Triggered after the playlist is sorted internally.
   */
  reverse() {
    if (!this.items_.length) {
      return;
    }

    this.items_.reverse();

    // Invert the current index
    this.currentIndex_ = this.items_.length - 1 - this.currentIndex_;

    this.trigger('playlistsorted');
  }

  /**
   * Shuffle the contents of the list randomly.
   * If 'rest' is true, only items after the current item are shuffled.
   *
   * @param {boolean} [options.rest = true] - Shuffle only items after the current item.
   * @fires playlistsorted - Triggered after the playlist is sorted internally.
   */
  shuffle({ rest = true } = {}) {
    const startIndex = rest ? this.currentIndex_ + 1 : 0;
    const itemsToShuffle = this.items_.slice(startIndex);

    if (itemsToShuffle.length <= 1) {
      return;
    }

    const currentItem = this.getCurrentItem();

    randomize(itemsToShuffle);

    if (rest) {
      this.items_.splice(startIndex, itemsToShuffle.length, ...itemsToShuffle);
    } else {
      this.items_ = itemsToShuffle;
    }

    // Set the new index of the current item
    this.currentIndex_ = this.items_.indexOf(currentItem);

    this.trigger('playlistsorted');
  }

  /**
   * Validates and sanitizes the structure and sources of a single playlist item
   *
   * @param {Object} item - The playlist item to be processed. It should be an object with a `sources` array.
   * @return {Object|null} A sanitized playlist item object with valid sources, or null if the item is invalid.
   */
  sanitizePlaylistItem_ = (item) => {
    if (!item || typeof item !== 'object' || !Array.isArray(item.sources)) {
      this.onError_('Invalid playlist item: Must be an object with a `sources` array.');
      return null;
    }

    const validSources = item.sources.filter(source =>
      source &&
      typeof source === 'object' &&
      typeof source.src === 'string' &&
      typeof source.type === 'string');

    if (validSources.length === 0) {
      this.onError_('Invalid playlist item: No valid sources were found.');
      return null;
    }

    if (validSources.length < item.sources.length) {
      this.onWarn_('Some invalid playlist item sources were disregarded.');
    }

    const { poster = '', textTracks = [] } = item;

    return Object.assign({}, item, { poster, textTracks, sources: validSources });
  };

  /**
   * Adjusts the current index after items have been removed from the playlist.
   * This method accounts for the removal position relative to the current index.
   *
   * @param {number} index - The starting index from which items were removed.
   * @param {number} actualCount - The actual number of items removed.
   * @private
   */
  adjustCurrentIndexAfterRemoval_(index, actualCount) {
    // If the removals are happening after the current item, no index adjustment is needed
    if (this.currentIndex_ < index) {
      return;
    }

    // Removals are happening before the current item, but the current item is not within the removed range
    if (this.currentIndex_ >= index + actualCount) {
      this.currentIndex_ -= actualCount;
      return;
    }

    // The current item is within the removed range
    this.currentIndex_ = null;
  }
}
