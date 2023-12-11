import videojs from 'video.js';
import PlaylistItem from './playlist-item.js';
import AutoAdvance from './auto-advance.js';
import {log, isIndexInBounds, randomize } from './utils.js';

const Plugin = videojs.getPlugin('plugin');

const defaults = {
  repeat: false,
  autoadvanceDelay: null
};

/**
 * Represents an advanced playlist plugin for Video.js.
 * This class manages the playlist, handling operations like adding, removing, or updating items.
 */
export default class Playlist extends Plugin {
  /**
   * Processes a single playlist item by validating its structure and sources.
   *
   * @param {Object} item
   *        The playlist item to be processed. It should be an object with a `sources` array.
   * @return {PlaylistItem|null}
   *          A PlaylistItem object with valid sources, or null if the item is invalid.
   */
  static processPlaylistItem(item) {
    if (!item || typeof item !== 'object' || !Array.isArray(item.sources)) {
      log.error('Invalid playlist item: Must be an object with a `sources` array.');
      return null;
    }

    const validSources = item.sources.filter(source =>
      source &&
      typeof source === 'object' &&
      typeof source.src === 'string' &&
      typeof source.type === 'string');

    if (validSources.length === 0) {
      log.error('Invalid playlist item: No valid sources were found.');
      return null;
    }

    if (validSources.length < item.sources.length) {
      log.warn('Some invalid playlist item sources were disregarded.');
    }

    return new PlaylistItem(Object.assign({}, item, { sources: validSources }));
  }

  /**
     * Create a Playlist plugin instance.
     *
     * @param {Player} player
     *        A Video.js Player instance.
     *
     * @param {Object} [options]
     *        An optional options object.
     *
     */
  constructor(player, options) {
    // the parent class will add player under this.player
    super(player);

    this.options_ = videojs.obj.merge(defaults, options);
    this.list_ = [];
    this.currentIndex_ = null;
    this.autoAdvance_ = new AutoAdvance(this.player, () => this.next());
    this.repeat_ = this.options_.repeat;

    this.setAutoadvanceDelay(this.options_.autoadvanceDelay);

    this.player.on('loadstart', this.handleSourceChange_.bind(this));
  }

  /**
   * Sets the playlist with a new list of items and optionally starts playback from a specified index.
   *
   * @param {Object[]} items
   *        An array of objects to set as the new playlist.
   * @param {number} [index=0]
   *        The index at which to start playback. Defaults to 0.
   * @fires playlistchange
   *        Triggered after the contents of the playlist are changed and the current playlist item is set.
   *        This is triggered asynchronously as to not interrupt the loading of the first video.
   */
  setPlaylist(items, index = 0) {
    if (!Array.isArray(items)) {
      log.error('The playlist must be an array.');
      return [...this.list_];
    }

    if (typeof index !== 'number') {
      log.error('The index must be a number.');
      return [...this.list_];
    }

    const playlistItems = items.map(Playlist.processPlaylistItem).filter(item => item !== null);

    if (playlistItems.length === 0) {
      log.error('Cannot set the playlist as none of the provided playlist items were valid.');
      return [...this.list_];
    }

    // If we have valid items, proceed to set the new playlist
    this.list_ = playlistItems;

    // Load the item unless it is not desired
    if (index !== -1) {
      this.setCurrentItem(index);
    }

    this.player.setTimeout(() => {
      this.player.trigger('playlistchange');
    }, 0);

    return [...this.list_];
  }

  /**
   * Retrieves the current playlist.
   *
   * @return {PlaylistItem[]}
   *         The current list of playlist items.
   */
  getPlaylist() {
    // Return shallow clone of playlist array
    return [...this.list_];
  }

  /**
   * Sets the auto-advance delay for the playlist.
   * When a video ends, the playlist will automatically advance to the next video after this delay.
   *
   * @param {number} delay
   *        The delay in seconds before advancing to the next item.
   *        If not a positive number, auto-advance is canceled.
   */
  setAutoadvanceDelay(delay) {
    this.autoAdvance_.setDelay(delay);
  }

  /**
   * Gets the auto-advance delay for the playlist.
   *
   * @return {number|null}
   *         The delay in seconds before advancing to the next item, or null if auto-advance is disabled.
   */
  getAutoadvanceDelay() {
    return this.autoAdvance_.getDelay();
  }

  /**
   * Enables repeat mode. When enabled, the playlist will loop back to the first item after the last item.
   */
  enableRepeat() {
    this.repeat_ = true;
  }

  /**
   * Disables repeat mode. When enabled, the playlist will not loop back to the first item after the last item..
   */
  disableRepeat() {
    this.repeat_ = false;
  }

  /**
   * Retrieves the current repeat mode status of the playlist.
   *
   * @return {boolean}
   *         True if repeat mode is enabled, false otherwise.
   */
  isRepeatEnabled() {
    return this.repeat_;
  }

  /**
   * Sets the current playlist item based on the given index.
   *
   * @param {number} index
   *        The index of the item to play.
   * @return {boolean}
   *         Returns true if the current item is set, and false otherwise
   */
  setCurrentItem(index) {
    if (!isIndexInBounds(this.list_, index)) {
      log.error('Index is out of bounds.');
      return false;
    }

    this.list_[index].loadOrPlay(this.player);
    this.currentIndex_ = index;

    return true;
  }

  /**
   * Retrieves the currently active PlaylistItem.
   *
   * @return {PlaylistItem|undefined}
   *         The current PlaylistItem if available, or undefined if no current item.
   */
  getCurrentItem() {
    return this.list_[this.currentIndex_];
  }

  /**
  * Retrieves the index of the currently active item in the playlist.
  *
  * @return {number}
  *         The current item's index if available, or -1 if no current item.
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
   * @return {number}
   *         The index of the last item in the playlist or -1 if there are no
   *         items.
   */
  getLastIndex() {
    return this.list_.length ? this.list_.length - 1 : -1;
  }

  /**
   * Calculates the index of the next item in the playlist.
   *
   * @return {number}
   *         The index of the next item or -1 if at the end of the playlist
   *         and repeat is not enabled.
   */
  getNextIndex() {
    if (this.currentIndex_ === null) {
      return -1;
    }

    const nextIndex = (this.currentIndex_ + 1) % this.list_.length;

    return this.repeat_ || nextIndex !== 0 ? nextIndex : -1;
  }

  /**
   * Calculates the index of the previous item in the playlist.
   *
   * @return {number}
   *         The index of the previous item or -1 if at the beginning of the playlist
   *         and repeat is not enabled.
   */
  getPreviousIndex() {
    if (this.currentIndex_ === null) {
      return -1;
    }

    const previousIndex = (this.currentIndex_ - 1 + this.list_.length) % this.list_.length;

    return this.repeat_ || previousIndex !== this.list_.length - 1 ? previousIndex : -1;
  }

  /**
   * Sets the first item in the playlist as the current item.
   *
   * @return {boolean}
   *         Returns true if the first item is set, and false otherwise
   */
  first() {
    return this.setCurrentItem(0);
  }

  /**
   * Sets the last item in the playlist as the current item.
   *
   * @return {boolean}
   *         Returns true if the last item is set, and false otherwise
   */
  last() {
    const lastIndex = this.getLastIndex();

    return this.setCurrentItem(lastIndex);
  }

  /**
   * Advance to the next item in the playlist.
   *
   * @return {boolean}
   *         Returns true if the next item is set, and false otherwise
   */
  next() {
    const nextIndex = this.getNextIndex();

    // Check if we've reached the end of the playlist without repeating
    if (nextIndex === -1) {
      return false;
    }

    return this.setCurrentItem(nextIndex);
  }

  /**
   * Go back to the previous item in the playlist.
   *
   * @return {boolean}
   *         Returns true if the previous item is set, and false otherwise
   */
  previous() {
    const previousIndex = this.getPreviousIndex();

    // Check if we are on the first item and there is no previous index unless we are repeating
    if (previousIndex === -1) {
      return false;
    }

    return this.setCurrentItem(previousIndex);
  }

  /**
   * A custom DOM event that is fired when new item(s) are added to the current
   * playlist (rather than replacing the entire playlist).
   *
   * Unlike playlistchange, this is fired synchronously as it does not
   * affect playback.
   *
   * @typedef  {Object} PlaylistAddEvent
   * @see      [CustomEvent Properties]{@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
   * @property {string} type
   *           Always "playlistadd"
   *
   * @property {number} count
   *           The number of items that were added.
   *
   * @property {number} index
   *           The starting index where item(s) were added.
   */

  /**
   * Adds one or more items to the playlist at the specified index or at the end if the index is not provided or invalid.
   *
   * @param {Object|Object[]} items
   *         The item or array of items to add.
   * @param {number} [index]
   *        The index at which to add the items. Defaults to the end of the playlist.
   * @return {PlaylistItem[]}
   *         The array of added playlist items.
   * @fires playlistadd
   *        Triggered when items are successfully added.
   */
  add(items, index) {
    if (!Array.isArray(items)) {
      if (typeof items === 'object' && items !== null) {
        items = [items];
      } else {
        log.error('Provided items must be an object or an array of objects.');
        return [];
      }
    }

    const resolvedIndex = (typeof index !== 'number' || index < 0 || index > this.list_.length) ? this.list_.length : index;
    const beforeItems = this.list_.slice(0, resolvedIndex);
    const afterItems = this.list_.slice(resolvedIndex);
    const newItems = items.map(Playlist.processPlaylistItem).filter(item => item !== null);

    if (newItems.length === 0) {
      log.error('Cannot add items to the playlist as none were valid.');
      return [];
    }

    this.list_ = [...beforeItems, ...newItems, ...afterItems];

    // Update currentIndex if inserting new elements earlier in the array than the current item
    if (resolvedIndex <= this.currentIndex_) {
      this.currentIndex_ += items.length;
    }

    this.player.trigger({
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
   * @property {string} type
   *           Always "playlistremove"
   *
   * @property {number} count
   *           The number of items that were removed.
   *
   * @property {number} index
   *           The starting index where item(s) were removed.
   */

  /**
   * Removes a specified number of items from the playlist, starting at the given index.
   *
   * @param {number} index
   *        The starting index to remove items from. If out of bounds, no removal occurs.
   * @param {number} [count=1]
   *        The number of items to remove. Defaults to 1. Removal only occurs if count is positive number.
   * @return {PlaylistItem[]}
   *         An array of the removed playlist items.
   * @fires playlistremove
   *        Triggered when items are successfully removed.
   */
  remove(index, count = 1) {
    if (!isIndexInBounds(this.list_, index)) {
      log.error('Index is out of bounds.');
      return [];
    }

    if (typeof count !== 'number' || count < 0) {
      log.error('Invalid count for removal.');
      return [];
    }

    // Constrain the removal count to the number of items that are actually available to remove starting at that index
    const actualCount = Math.min(count, this.list_.length - index);
    const removedItems = this.list_.splice(index, actualCount);

    this.adjustCurrentIndexAfterRemoval_(index, actualCount);

    this.player.trigger({
      type: 'playlistremove',
      count: actualCount,
      index
    });

    return [...removedItems];
  }

  /**
   * Adjusts the current index after items have been removed from the playlist.
   *
   * @param {number} index
   *        The starting index from which items were removed.
   * @param {number} actualCount
   *        The actual number of items removed.
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
    this.currentIndex_ = index;
    this.handleCurrentIndexWithinRemovedRange_();
  }

  /**
   * Loads a new item when when the current one has been removed, if there is one to load.
   */
  handleCurrentIndexWithinRemovedRange_() {
    // Load next available item if there is one.
    // After the removal, the currentIndex_ now represents the first item after the removed range
    if (this.list_.length > this.currentIndex_) {
      this.setCurrentItem(this.currentIndex_);

    // Load first item if we are in repeat mode and the playlist still has items
    } else if (this.repeat_ && this.list_.length > 0) {
      this.first();

    // Unload the current item source and reset the current index
    } else {
      this.currentIndex_ = null;
      this.player.reset();
    }
  }

  /**
   * Sorts the playlist array.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort}
   * @param {Function} compare
   *        A comparator function as per the native Array method.
   * @fires playlistsorted
   *        Triggered after the playlist is sorted internally.
   */
  sort(compare) {
    if (!this.list_.length || typeof compare !== 'function') {
      return;
    }

    const currentItem = this.getCurrentItem();

    this.list_.sort(compare);

    // Update the current index after sorting
    this.currentIndex_ = this.list_.indexOf(currentItem);

    this.player.trigger('playlistsorted');
  }

  /**
   * Reverses the order of the items in the playlist.
   *
   * @fires playlistsorted
   *        Triggered after the playlist is sorted internally.
   */
  reverse() {
    if (!this.list_.length) {
      return;
    }

    this.list_.reverse();

    // Invert the current index
    this.currentIndex_ = this.list_.length - 1 - this.currentIndex_;

    this.player.trigger('playlistsorted');
  }

  /**
   * Shuffle the contents of the list randomly.
   *
   * @param {Object} [options]
   *        An object containing shuffle options.
   * @param {boolean} [options.rest = true]
   *        Shuffle only items after the current item.
   * @fires playlistsorted
   *        Triggered after the playlist is sorted internally.
   */
  shuffle({ rest = true } = {}) {
    const startIndex = rest ? this.currentIndex_ + 1 : 0;
    const itemsToShuffle = this.list_.slice(startIndex);

    if (itemsToShuffle.length <= 1) {
      return;
    }

    const currentItem = this.getCurrentItem();

    randomize(itemsToShuffle);

    if (rest) {
      this.list_.splice(startIndex, itemsToShuffle.length, ...itemsToShuffle);
    } else {
      this.list_ = itemsToShuffle;
    }

    // Set the new index of the current item
    this.currentIndex_ = this.list_.indexOf(currentItem);

    this.player.trigger('playlistsorted');
  }

  /**
   * Handles source changes for non-playlist sources
   */
  handleSourceChange_() {
    const currentSrc = this.player.currentSrc();

    if (!this.isSourceInPlaylist_(currentSrc)) {
      this.handleNonPlaylistSource_();
    }
  }

  /**
   * Checks if a given source URL is present in the current playlist.
   *
   * @param {string} src
   *        The source URL to check.
   * @return {boolean}
   *         Returns true if the source is in the playlist, false otherwise.
   */
  isSourceInPlaylist_(src) {
    return this.list_.some(item => item.sources.some(source => source.src === src));
  }

  /**
   * Disables autoadvance and sets current index for non-playlist source
   */
  handleNonPlaylistSource_() {
    this.autoAdvance_.fullReset();
    this.currentIndex_ = null;
  }
}
