import window from 'global/window';
import assign from 'object.assign';
import playItem from './play-item';
import * as autoadvance from './auto-advance';

/**
 * Look through an array of playlist items for a specific `source`;
 * checking both the value of elements and the value of their `src`
 * property.
 *
 * @param  {Array} arr
 * @param  {String} src
 * @return {Number}
 */
const indexInSources = (arr, src) => {
  for (let i = 0; i < arr.length; i++) {
    let sources = arr[i].sources;

    if (Array.isArray(sources)) {
      for (let j = 0; j < sources.length; j++) {
        let source = sources[j];

        if (source && (source === src || source.src === src)) {
          return i;
        }
      }
    }
  }

  return -1;
};

/**
 * Factory function for creating new playlists on the given player.
 *
 * @param  {Player} player
 * @param  {Array} initialList
 * @return {[type]}
 */
const factory = (player, initialList) => {
  let list = Array.isArray(initialList) ? initialList.slice() : [];

  /**
   * Get/set the playlist for a player.
   *
   * @param  {Array} [newList]
   * @return {Array}
   */
  const playlist = player.playlist = function(newList) {
    if (Array.isArray(newList)) {
      list = newList.slice();
      playlist.first();
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
     * @param  {String|Array[String|Object]|Object} value
     * @return {Boolean}
     */
    contains(value) {
      return playlist.indexOf(value) !== -1;
    },

    /**
     * Gets the index of a value in the playlist or -1 if not found.
     *
     * @param  {String|Array[String|Object]|Object} value
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
     * Plays the next item in the playlist.
     *
     * @return {Object|undefined}
     *         Returns undefined and has no side effects if on last item.
     */
    next() {

      // Make sure we don't go past the end of the playlist.
      let index = Math.min(playlist.currentIndex_ + 1, list.length - 1);

      if (index !== playlist.currentIndex_) {
        return list[playlist.currentItem(index)];
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
     * @param  {Number} seconds
     */
    autoadvance(seconds) {
      playlist.autoadvance_.delay = seconds;
      autoadvance.setup(playlist.player_, seconds);
    }
  });

  playlist.first();

  return playlist;
};

export default factory;
