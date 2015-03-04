var q = QUnit,
    playlistMaker = require('../src/playlist-maker.js'),
    playerProxy = require('./player-proxy.js');

q.module('playlist');

q.test('playlistMaker takes a player and a list and returns a playlist', function() {
  var playlist = playlistMaker({}, []);

  q.ok(playlist, 'we got a playlist');
  q.equal(typeof playlist, 'function', 'playlist is a function');
  q.equal(typeof playlist.item, 'function', 'we have a item function');
  q.equal(typeof playlist.next, 'function', 'we have a next function');
  q.equal(typeof playlist.previous, 'function', 'we have a previous function');
  q.equal(typeof playlist.autoadvance, 'function', 'we have a autoadvance function');
});

q.test('playlist() is a getter and setter for the list', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.deepEqual(playlist(), [1,2,3], 'equal to input list');
  q.deepEqual(playlist([1,2,3,4,5]), [1,2,3,4,5], 'equal to input list, arguments ignored');
  q.deepEqual(playlist(), [1,2,3,4,5], 'equal to input list');

  var list = playlist();
  list.unshift(10);

  q.equal(playlist.item(0), 1, 'changing the list did not affect the playlist');

});

q.test('playlist.item() works as expected', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.equal(playlist.item(), 0, 'begin at the first item, item 0');

  q.equal(playlist.item(2), 3, 'setting to item 2 gives us the value 3');
  q.equal(playlist.item(), 2, 'the current item is now 2');

  q.equal(playlist.item(5), 2, 'cannot change to an out-of-bounds item');
  q.equal(playlist.item(-1), 2, 'cannot change to an out-of-bounds item');
  q.equal(playlist.item(null), 2, 'cannot change to an invalid item');
});

q.test('playlist.next() works as expected', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.equal(playlist.item(), 0, 'we start on item 0');
  q.equal(playlist.next(), 2, 'we get back the value of item 2');
  q.equal(playlist.item(), 1, 'we are now on item 1');
  q.equal(playlist.next(), 3, 'we get back the value of item 3');
  q.equal(playlist.item(), 2, 'we are now on item 2');
  q.equal(playlist.next(), undefined, 'we get nothing back if we try to go out of bounds');
});

q.test('playlist.previous() works as expected', function() {
  var playlist = playlistMaker(playerProxy, [1,2,3]);

  q.equal(playlist.item(), 0, 'we start on item 0');
  q.equal(playlist.previous(), undefined, 'we get nothing back if we try to go out of bounds');

  playlist.next();
  playlist.next();

  q.equal(playlist.item(), 2, 'we are on item 2');
  q.equal(playlist.previous(), 2, 'we get back value of item 1');
  q.equal(playlist.item(), 1, 'we are on item 1');
  q.equal(playlist.previous(), 1, 'we get back value of item 0');
  q.equal(playlist.item(), 0, 'we are on item 0');
  q.equal(playlist.previous(), undefined, 'we get nothing back if we try to go out of bounds');
});
