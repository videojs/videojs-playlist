/**
 * Manages the auto-advance functionality in a media player.
 * Auto-advance automatically moves to the next item after a specified delay.
 */
export default class AutoAdvance {

  /**
   * Creates an instance of the AutoAdvance class.
   *
   * @param {Object} player
   *        The media player instance.
   * @param {Function} advanceCallback
   *        The callback function to execute when advancing to the next item.
   */
  constructor(player, advanceCallback) {
    this.player_ = player;
    this.advanceCallback_ = advanceCallback;
    this.delay_ = null;
    this.timeoutId_ = null;
  }

  /**
   * Sets the delay for auto-advance.
   * If the delay is invalid or not zero or a positive number, auto-advance is cancelled.
   *
   * @param {number} seconds
   *        The delay in seconds before auto-advancing.
   */
  setDelay(seconds) {
    // Cancel any existing auto-advance behavior and start fresh
    this.fullReset();

    // If delay is invalid or undefined, do nothing further (auto-advance already cancelled)
    if (typeof seconds !== 'number' || seconds < 0 || !isFinite(seconds)) {
      return;
    }

    // Set the new delay and start listening for 'ended' to trigger auto-advance
    this.delay_ = seconds;
    this.player_.on('ended', this.startTimeout_);
  }

  /**
   * Gets the delay for auto-advance.
   */
  getDelay() {
    return this.delay_;
  }

  /**
   * Starts the auto-advance timeout.
   *
   * @private
   */
  startTimeout_ = () => {
    // Ensure we don't stack timeouts
    this.clearTimeout_();

    if (this.delay_ === null) {
      return;
    }

    // Listen for a play event to cancel auto-advance if it occurs before the timeout completes
    this.player_.one('play', this.clearTimeout_);

    // Set a new timeout for auto-advancing
    this.timeoutId_ = setTimeout(() => {
      this.advanceCallback_();

      // Clean up the listener for the play event when the auto-advance triggers
      this.clearTimeout_();
    }, this.delay_ * 1000);
  };

  /**
   * Clears the current auto-advance timeout and removes the 'play' event listener.
   *
   * @private
   */
  clearTimeout_ = () => {
    if (this.timeoutId_) {
      clearTimeout(this.timeoutId_);
      this.timeoutId_ = null;
      this.player_.off('play', this.clearTimeout_);
    }
  };

  /**
   * Cancels and resets all auto-advance behavior
   */
  fullReset() {
    this.clearTimeout_();

    this.player_.off('ended', this.startTimeout_);
    this.delay_ = null;
  }
}
