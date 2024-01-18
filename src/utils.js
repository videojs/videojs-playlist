/**
 * Checks if the given index is within the bounds of the array.
 *
 * @param {Array} array - The array to check against.
 * @param {number} index - The index to verify.
 * @return {boolean} - Returns true if the index is a number and lies within the array's bounds, otherwise false.
 */
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
