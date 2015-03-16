var q = QUnit,
    autoadvance = require('../src/autoadvance.js'),
    playerProxy = require('./player-proxy.js'),
    extend = require('node.extend');

q.module('autoadvance');

q.test('set up ended listener if one does not exist yet', function() {
  var player = extend(true, {}, playerProxy),
      ones = [];

  player.one = function(type) {
    ones.push(type);
  };

  autoadvance(player, 0);

  q.equal(ones.length, 1, 'there should have been only one one event added');
  q.equal(ones[0], 'ended', 'the event we want to one is "ended"');
});

q.test('off previous listener if exists before adding a new one', function() {
  var player = extend(true, {}, playerProxy),
      ones = [],
      offs = [];


  player.one = function(type) {
    ones.push(type);
  };
  player.off = function(type) {
    offs.push(type);
  };

  autoadvance(player, 0);
  q.equal(ones.length, 1, 'there should have been only one one event added');
  q.equal(ones[0], 'ended', 'the event we want to one is "ended"');
  q.equal(offs.length, 0, 'we should not have off-ed anything yet');

  autoadvance(player, 10);

  q.equal(ones.length, 2, 'there should have been only two one event added');
  q.equal(ones[0], 'ended', 'the event we want to one is "ended"');
  q.equal(ones[1], 'ended', 'the event we want to one is "ended"');
  q.equal(offs.length, 1, 'there should have been only one off event added');
  q.equal(offs[0], 'ended', 'the event we want to off is "ended"');
});

q.test('do nothing if timeout is weird', function() {
  var player = extend(true, {}, playerProxy),
      ones = [],
      offs = [];

  player.one = function(type) {
    ones.push(type);
  };
  player.off = function(type) {
    offs.push(type);
  };

  autoadvance(player, -1);
  autoadvance(player, -100);
  autoadvance(player, null);
  autoadvance(player, {});
  autoadvance(player, []);

  q.equal(offs.length, 0, 'we did nothing');
  q.equal(ones.length, 0, 'we did nothing');
});

q.test('reset if timeout is weird after we advance', function() {
  var player = extend(true, {}, playerProxy),
      ones = [],
      offs = [];

  player.one = function(type) {
    ones.push(type);
  };
  player.off = function(type) {
    offs.push(type);
  };

  autoadvance(player, 0);
  autoadvance(player, -1);
  autoadvance(player, 0);
  autoadvance(player, -100);
  autoadvance(player, 0);
  autoadvance(player, null);
  autoadvance(player, 0);
  autoadvance(player, {});
  autoadvance(player, 0);
  autoadvance(player, []);
  autoadvance(player, 0);
  autoadvance(player, NaN);
  autoadvance(player, 0);
  autoadvance(player, Infinity);
  autoadvance(player, 0);
  autoadvance(player, -Infinity);

  q.equal(offs.length, 8, 'we reset the advance 8 times');
  q.equal(ones.length, 8, 'we autoadvanced 8 times');
});

q.test('reset if we have already started advancing', function() {
  var player = extend(true, {}, playerProxy),
      oldClearTimeout = window.clearTimeout,
      clears = 0;

  window.clearTimeout = function() {
    clears++;
  };

  // pretend we started autoadvancing
  player.playlist._timeoutId = 1;
  autoadvance(player, 0);

  q.equal(clears, 1, 'we reset the auto advance');

  window.clearTimeout = oldClearTimeout;
});

q.test('timeout is given in seconds', function() {
  var player = new videojs.EventEmitter(),
      oldSetTimeout = window.setTimeout;

  player.addEventListener = null;
  player.playlist = {};

  window.setTimeout = function(fn, timeout) {
    q.equal(timeout, 10*1000, 'timeout was given in seconds');
  };

  autoadvance(player, 10);
  player.trigger('ended');

  window.setTimeout = oldSetTimeout;
});
