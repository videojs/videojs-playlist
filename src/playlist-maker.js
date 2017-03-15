import videojs from 'video.js';
import window from 'global/window';
import playItem from './play-item';
import * as autoadvance from './auto-advance';

// Lightweight Object.assign alternative.
const assign = (target, source) => {
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
};

/**
 * Given two sources, check to see whether the two sources are equal.
 * If both source urls have a protocol, the protocols must match, otherwise, protocols
 * are ignored.
 *
 * @private
 * @param {String|Object} source1
 * @param {String|Object} source2
 * @return {Boolean}
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
 * @param   {String} src
 * @return  {Number}
 */
const indexInSources = (arr, src) => {
  for (let i = 0; i < arr.length; i++) {
    let sources = arr[i].sources;

    if (Array.isArray(sources)) {
      for (let j = 0; j < sources.length; j++) {
        let source = sources[j];

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
 * @param  {Array}  [initialList]
 *         If given, an initial list of sources with which to populate
 *         the playlist.
 * @param  {Number}  [initialIndex]
 *         If given, the index of the item in the list that should
 *         be loaded first. If -1, no video is loaded. If omitted, The
 *         the first video is loaded.
 *
 * @return {Function}
 *         Returns the playlist function specific to the given player.
 */
const factory = (player, initialList, initialIndex = 0) => {
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
   * @param  {Number}  [newIndex]
   *         If given, the index of the item in the list that should
   *         be loaded first. If -1, no video is loaded. If omitted, The
   *         the first video is loaded.
   *
   * @return {Array}
   */
  const playlist = player.playlist = function(newList, newIndex = 0) {
    if (Array.isArray(newList)) {
      list = newList.slice();
      if (newIndex !== -1) {
        playlist.currentItem(newIndex);
      }
      playlist.changeTimeout_ = window.setTimeout(() => {
        player.trigger('playlistchange');
      }, 0);
    }

    // Always return a shallow clone of the playlist list.
    return list.slice();
  };

  player.on('loadstart', () => {
    if (playlist.currentItem() === -1) {
      autoadvance.reset(player);
    }
  });

  player.on('dispose', () => {
    window.clearTimeout(playlist.changeTimeout_);
  });

  assign(playlist, {
    currentIndex_: -1,
    player_: player,
    autoadvance_: {},
    repeat_: false,

    /**
     * Get or set the current item in the playlist.
     *
     * @param  {Number} [index]
     *         If given as a valid value, plays the playlist item at that index.
     *
     * @return {Number}
     *         The current item index.
     */
    currentItem(index) {
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
    },

    /**
     * Checks if the playlist contains a value.
     *
     * @param  {String|Object|Array} value
     * @return {Boolean}
     */
    contains(value) {
      return playlist.indexOf(value) !== -1;
    },

    /**
     * Gets the index of a value in the playlist or -1 if not found.
     *
     * @param  {String|Object|Array} value
     * @return {Number}
     */
    indexOf(value) {
      if (typeof value === 'string') {
        return indexInSources(list, value);
      }

      let sources = Array.isArray(value) ? value : value.sources;

      for (let i = 0; i < sources.length; i++) {
        let source = sources[i];

        if (typeof source === 'string') {
          return indexInSources(list, source);
        } else if (source.src) {
          return indexInSources(list, source.src);
        }
      }

      return -1;
    },

    /**
     * Plays the first item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if the list is empty.
     */
    first() {
      if (list.length) {
        return list[playlist.currentItem(0)];
      }

      playlist.currentIndex_ = -1;
    },

    /**
     * Plays the last item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if the list is empty.
     */
    last() {
      if (list.length) {
        return list[playlist.currentItem(list.length - 1)];
      }

      playlist.currentIndex_ = -1;
    },

    /**
     * Plays the next item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if on last item.
     */
    next() {

      let nextIndex;

      // Repeat
      if (playlist.repeat_) {
        nextIndex = playlist.currentIndex_ + 1;
        if (nextIndex > list.length - 1) {
          nextIndex = 0;
        }

      // Don't go past the end of the playlist.
      } else {
        nextIndex = Math.min(playlist.currentIndex_ + 1, list.length - 1);
      }

      // Make the change
      if (nextIndex !== playlist.currentIndex_) {
        return list[playlist.currentItem(nextIndex)];
      }
    },

    /**
     * Plays the previous item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if on first item.
     */
    previous() {

      // Make sure we don't go past the start of the playlist.
      let index = Math.max(playlist.currentIndex_ - 1, 0);

      if (index !== playlist.currentIndex_) {
        return list[playlist.currentItem(index)];
      }
    },

    /**
     * Sets up auto-advance on the playlist.
     *
     * @param {Number} delay
     *        The number of seconds to wait before each auto-advance.
     */
    autoadvance(delay) {
      playlist.autoadvance_.delay = delay;
      autoadvance.setup(playlist.player_, delay);
    },

    /**
     * Sets `repeat` option, which makes the "next" video of the last video in the
     * playlist be the first video in the playlist.
     *
     * @param {Boolean} val
     */
    repeat(val) {
      if (val !== undefined) {
        if (typeof val !== 'boolean') {
          videojs.log.error('Invalid value for repeat', val);
        } else {
          playlist.repeat_ = val;
        }
      }
      return playlist.repeat_;
    }

  });

  playlist.currentItem(initialIndex);

  return playlist;
};

export default factory;
