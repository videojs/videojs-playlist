/**
 * Unique ID for an element or function
 * @type {Number}
 */
let guid = 1;

/**
 * Get a unique auto-incrementing ID by number that has not been returned before.
 *
 * @return {number}
 *         A new unique ID.
 */
export default function newGUID() {
  return guid++;
}
