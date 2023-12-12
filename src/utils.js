import videojs from 'video.js';

export const log = videojs.log.createLogger('videojs-playlist');

export const isIndexInBounds = (array, index) => {
  return typeof index === 'number' && index >= 0 && index < array.length;
};

/**
 * Randomizes array elements in place.
 *
 * @param {Array} array - The array to shuffle.
 */
export const randomize = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }
};
