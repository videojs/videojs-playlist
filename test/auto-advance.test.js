import document from 'global/document';
import QUnit from 'qunit';
import sinon from 'sinon';
import videojs from 'video.js';
import AutoAdvance from '../src/auto-advance.js';

QUnit.module('AutoAdvance', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.fixture = document.getElementById('qunit-fixture');
    this.video = document.createElement('video');
    this.fixture.appendChild(this.video);
    this.player = videojs(this.video);
    this.autoAdvance = new AutoAdvance(this.player, () => {});

    // Setup spies
    this.player.on = sinon.spy();
    this.player.one = sinon.spy();
    this.player.off = sinon.spy();
    this.player.trigger = sinon.spy();
  },

  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('constructor initializes properties correctly', function(assert) {
  assert.equal(this.autoAdvance.player_, this.player, 'Player is set correctly');
  assert.equal(this.autoAdvance.timeoutId_, null, 'Timeout ID is initially null');
  assert.equal(this.autoAdvance.delay_, null, 'Delay is initially null');
});

QUnit.test('setDelay - sets delay and registers ended event listener', function(assert) {
  this.autoAdvance.setDelay(5);
  assert.equal(this.autoAdvance.delay_, 5, 'Delay is set correctly');
  assert.ok(this.player.on.calledWith('ended'), 'Ended event listener registered');
});

QUnit.test('setDelay - does not set delay for invalid values', function(assert) {
  this.autoAdvance.setDelay(-1);
  assert.equal(this.autoAdvance.delay_, null, 'Delay remains null for negative value');
  assert.ok(this.player.on.notCalled, 'Ended event listener not registered for negative value');
});

QUnit.test('startTimeout - sets a timeout and registers play event listener', function(assert) {
  this.autoAdvance.setDelay(5);
  this.autoAdvance.startTimeout_();

  assert.ok(this.autoAdvance.timeoutId_, 'Timeout ID is set');

  this.clock.tick(5000);

  assert.ok(this.player.one.calledWith('play'), 'Play event listener registered');
  assert.equal(this.autoAdvance.timeoutId_, null, 'Timeout ID is reset after timeout is triggered');
});

QUnit.test('clearTimeout - clears the timeout and removes play event listener', function(assert) {
  this.autoAdvance.setDelay(5);
  this.autoAdvance.startTimeout_();
  this.autoAdvance.clearTimeout_();

  assert.equal(this.autoAdvance.timeoutId_, null, 'Timeout ID is cleared');
  assert.ok(this.player.off.calledWith('play'), 'Play event listener removed');
});

QUnit.test('fullReset - clears timeout and unregisters ended event listener', function(assert) {
  this.autoAdvance.setDelay(5);
  this.autoAdvance.fullReset();

  assert.equal(this.autoAdvance.delay_, null, 'Delay is reset');
  assert.ok(this.player.off.calledWith('ended'), 'Ended event listener unregistered');
});

QUnit.test('callback is executed after timeout', function(assert) {
  let callbackExecuted = false;

  this.autoAdvance = new AutoAdvance(this.player, () => {
    callbackExecuted = true;
  });

  this.autoAdvance.setDelay(5);
  this.autoAdvance.startTimeout_();

  this.clock.tick(5000);

  assert.ok(callbackExecuted, 'Callback is executed after timeout expires');
});
