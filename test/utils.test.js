import QUnit from 'qunit';
import { isIndexInBounds } from '../src/utils.js';

QUnit.module('Utils');

QUnit.test('isIndexInBounds should return true for valid indices and false for invalid indices', function(assert) {
  const testArray = [10, 20, 30, 40];

  assert.ok(isIndexInBounds(testArray, 0), 'Index 0 is within bounds');
  assert.ok(isIndexInBounds(testArray, 3), 'Index 3 is within bounds');
  assert.notOk(isIndexInBounds(testArray, -1), 'Negative index is out of bounds');
  assert.notOk(isIndexInBounds(testArray, 4), 'Index equal to array length is out of bounds');
  assert.notOk(isIndexInBounds(testArray, null), 'Null index is considered out of bounds');
});
