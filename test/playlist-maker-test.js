var q = QUnit,
    playlistMaker = require('../src/playlist-maker.js');

q.module('playlist');

q.test('playlistMaker takes a player and a list and returns a playlist', function() {
  var playlist = playlistMaker({}, []);

  q.ok(playlist, 'we got a playlist');
  q.equal(typeof playlist, 'function', 'playlist is a function');
  q.equal(typeof playlist.list, 'function', 'we have a list function');
  q.equal(typeof playlist.item, 'function', 'we have a item function');
  q.equal(typeof playlist.next, 'function', 'we have a next function');
  q.equal(typeof playlist.previous, 'function', 'we have a previous function');
  q.equal(typeof playlist.autoadvance, 'function', 'we have a autoadvance function');
});
