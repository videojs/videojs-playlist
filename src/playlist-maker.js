import playItem from './play-item';
import * as autoadvance from './auto-advance';

/**
 * Given two sources, check to see whether the two sources are equal.
 * If both source urls have a protocol, the protocols must match, otherwise, protocols
 * are ignored.
 *
 * @private
 * @param {string|Object} source1
 *        The first source
 *
 * @param {string|Object} source2
 *        The second source
 *
 * @return {boolean}
 *         The result
 */
const sourceEquals = (source1, source2) => {
  let src1 = source1;
  let src2 = source2;

  if (typeof source1 === 'object') {
    src1 = source1.src;
  }
  if (typeof source2 === 'object') {
    src2 = source2.src;
  }

  if (/^\/\//.test(src1)) {
    src2 = src2.slice(src2.indexOf('//'));
  }
  if (/^\/\//.test(src2)) {
    src1 = src1.slice(src1.indexOf('//'));
  }

  return src1 === src2;
};

/**
 * Look through an array of playlist items for a specific `source`;
 * checking both the value of elements and the value of their `src`
 * property.
 *
 * @private
 * @param   {Array} arr
 *          An array of playlist items to look through
 *
 * @param   {string} src
 *          The source to look for
 *
 * @return  {number}
 *          The index of that source or -1
 */
const indexInSources = (arr, src) => {
  for (let i = 0; i < arr.length; i++) {
    const sources = arr[i].sources;

    if (Array.isArray(sources)) {
      for (let j = 0; j < sources.length; j++) {
        const source = sources[j];

        if (source && sourceEquals(source, src)) {
          return i;
        }
      }
    }
  }

  return -1;
};

/**
 * Factory function for creating new playlist implementation on the given player.
 *
 * API summary:
 *
 * playlist(['a', 'b', 'c']) // setter
 * playlist() // getter
 * playlist.currentItem() // getter, 0
 * playlist.currentItem(1) // setter, 1
 * playlist.next() // 'c'
 * playlist.previous() // 'b'
 * playlist.first() // 'a'
 * playlist.last() // 'c'
 * playlist.autoadvance(5) // 5 second delay
 * playlist.autoadvance() // cancel autoadvance
 *
 * @param  {Player} player
 *         The current player
 *
 * @param  {Array=} initialList
 *         If given, an initial list of sources with which to populate
 *         the playlist.
 *
 * @param  {number=}  initialIndex
 *         If given, the index of the item in the list that should
 *         be loaded first. If -1, no video is loaded. If omitted, The
 *         the first video is loaded.
 *
 * @return {Function}
 *         Returns the playlist function specific to the given player.
 */
export default function factory(player, initialList, initialIndex = 0) {
  let list = Array.isArray(initialList) ? initialList.slice() : [];

  /**
   * Get/set the playlist for a player.
   *
   * This function is added as an own property of the player and has its
   * own methods which can be called to manipulate the internal state.
   *
   * @param  {Array} [newList]
   *         If given, a new list of sources with which to populate the
   *         playlist. Without this, the function acts as a getter.
   *
   * @param  {number}  [newIndex]
   *         If given, the index of the item in the list that should
   *         be loaded first. If -1, no video is loaded. If omitted, The
   *         the first video is loaded.
   *
   * @return {Array}
   *         The playlist
   */
  const playlist = player.playlist = (newList, newIndex = 0) => {
    if (Array.isArray(newList)) {
      list = newList.slice();
      if (newIndex !== -1) {
        playlist.currentItem(newIndex);
      }
      player.setTimeout(() => player.trigger('playlistchange'), 0);
    }

    // Always return a shallow clone of the playlist list.
    return list.slice();
  };

  // On a new source, if there is no current item, disable auto-advance.
  player.on('loadstart', () => {
    if (playlist.currentItem() === -1) {
      autoadvance.reset(player);
    }
  });

  playlist.currentIndex_ = -1;
  playlist.player_ = player;
  playlist.autoadvance_ = {};
  playlist.repeat_ = false;

  /**
   * Get or set the current item in the playlist.
   *
   * @param  {number} [index]
   *         If given as a valid value, plays the playlist item at that index.
   *
   * @return {number}
   *         The current item index.
   */
  playlist.currentItem = (index) => {
    if (
      typeof index === 'number' &&
      playlist.currentIndex_ !== index &&
      index >= 0 &&
      index < list.length
    ) {
      playlist.currentIndex_ = index;
      playItem(
        playlist.player_,
        playlist.autoadvance_.delay,
        list[playlist.currentIndex_]
      );
    } else {
      playlist.currentIndex_ = playlist.indexOf(playlist.player_.currentSrc() || '');
    }

    return playlist.currentIndex_;
  };

  /**
   * Checks if the playlist contains a value.
   *
   * @param  {string|Object|Array} value
   *         The value to check
   *
   * @return {boolean}
   *         The result
   */
  playlist.contains = (value) => {
    return playlist.indexOf(value) !== -1;
  };

  /**
   * Gets the index of a value in the playlist or -1 if not found.
   *
   * @param  {string|Object|Array} value
   *         The value to find the index of
   *
   * @return {number}
   *         The index or -1
   */
  playlist.indexOf = (value) => {
    if (typeof value === 'string') {
      return indexInSources(list, value);
    }

    const sources = Array.isArray(value) ? value : value.sources;

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if (typeof source === 'string') {
        return indexInSources(list, source);
      } else if (source.src) {
        return indexInSources(list, source.src);
      }
    }

    return -1;
  };

  /**
   * Get the index of the last item in the playlist.
   *
   * @return {number}
   *         The index of the last item in the playlist or -1 if there are no
   *         items.
   */
  playlist.lastIndex = () => {
    return list.length - 1;
  };

  /**
   * Get the index of the next item in the playlist.
   *
   * @return {number}
   *         The index of the next item in the playlist or -1 if there is no
   *         current item.
   */
  playlist.nextIndex = () => {
    const current = playlist.currentItem();

    if (current === -1) {
      return -1;
    }

    const lastIndex = playlist.lastIndex();

    // When repeating, loop back to the beginning on the last item.
    if (playlist.repeat_ && current === lastIndex) {
      return 0;
    }

    // Don't go past the end of the playlist.
    return Math.min(current + 1, lastIndex);
  };

  /**
   * Get the index of the previous item in the playlist.
   *
   * @return {number}
   *         The index of the previous item in the playlist or -1 if there is
   *         no current item.
   */
  playlist.previousIndex = () => {
    const current = playlist.currentItem();

    if (current === -1) {
      return -1;
    }

    // When repeating, loop back to the end of the playlist.
    if (playlist.repeat_ && current === 0) {
      return playlist.lastIndex();
    }

    // Don't go past the beginning of the playlist.
    return Math.max(current - 1, 0);
  };

  /**
   * Plays the first item in the playlist.
   *
   * @return {Object|undefined}
   *         Returns undefined and has no side effects if the list is empty.
   */
  playlist.first = () => {
    if (list.length) {
      return list[playlist.currentItem(0)];
    }

    playlist.currentIndex_ = -1;
  };

  /**
   * Plays the last item in the playlist.
   *
   * @return {Object|undefined}
   *         Returns undefined and has no side effects if the list is empty.
   */
  playlist.last = () => {
    if (list.length) {
      return list[playlist.currentItem(playlist.lastIndex())];
    }

    playlist.currentIndex_ = -1;
  };

  /**
   * Plays the next item in the playlist.
   *
   * @return {Object|undefined}
   *         Returns undefined and has no side effects if on last item.
   */
  playlist.next = () => {
    const index = playlist.nextIndex();

    if (index !== playlist.currentIndex_) {
      return list[playlist.currentItem(index)];
    }
  };

  /**
   * Plays the previous item in the playlist.
   *
   * @return {Object|undefined}
   *         Returns undefined and has no side effects if on first item.
   */
  playlist.previous = () => {
    const index = playlist.previousIndex();

    if (index !== playlist.currentIndex_) {
      return list[playlist.currentItem(index)];
    }
  };

  /**
   * Set up auto-advance on the playlist.
   *
   * @param  {number} [delay]
   *         The number of seconds to wait before each auto-advance.
   */
  playlist.autoadvance = (delay) => {
    autoadvance.setup(playlist.player_, delay);
  };

  /**
   * Sets `repeat` option, which makes the "next" video of the last video in
   * the playlist be the first video in the playlist.
   *
   * @param  {boolean} [val]
   *         The value to set repeat to
   *
   * @return {boolean}
   *         The current value of repeat
   */
  playlist.repeat = (val) => {
    if (val === undefined) {
      return playlist.repeat_;
    }

    playlist.repeat_ = !!val;
    return playlist.repeat_;
  };

  /**
   * Sorts the playlist array.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort}
   * @fires playlistsorted
   *
   * @param {Function} compare
   *        A comparator function as per the native Array method.
   */
  playlist.sort = (compare) => {

    // Bail if the array is empty.
    if (!list.length) {
      return;
    }

    list.sort(compare);

    /**
     * Triggered after the playlist is sorted internally.
     *
     * @event playlistsorted
     * @type {Object}
     */
    player.trigger('playlistsorted');
  };

  /**
   * Reverses the playlist array.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse}
   * @fires playlistsorted
   */
  playlist.reverse = () => {

    // Bail if the array is empty.
    if (!list.length) {
      return;
    }

    list.reverse();

    /**
     * Triggered after the playlist is sorted internally.
     *
     * @event playlistsorted
     * @type {Object}
     */
    player.trigger('playlistsorted');
  };

  /**
   * Shuffle the contents of the list randomly.
   *
   * @see {@link https://github.com/lodash/lodash/blob/40e096b6d5291a025e365a0f4c010d9a0efb9a69/shuffle.js}
   * @fires playlistsorted
   */
  playlist.shuffle = () => {
    let index = -1;
    const length = list.length;

    // Bail if the array is empty.
    if (!length) {
      return;
    }

    const lastIndex = length - 1;

    while (++index < length) {
      const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
      const value = list[rand];

      list[rand] = list[index];
      list[index] = value;
    }

    /**
     * Triggered after the playlist is sorted internally.
     *
     * @event playlistsorted
     * @type {Object}
     */
    player.trigger('playlistsorted');
  };

  playlist.currentItem(initialIndex);

  return playlist;
}
