import videojs from 'video.js';
import Playlist from './playlist.js';
import AutoAdvance from './auto-advance.js';
import { isIndexInBounds } from './utils.js';

const Plugin = videojs.getPlugin('plugin');

// Exported for testing purposes
export const log = videojs.log.createLogger('videojs-playlist');

export default class PlaylistPlugin extends Plugin {
  /**
   * Creates a new Playlist instance from an array of items.
   *
   * @param {Object[]} items - The array of playlist items.
   * @return {Playlist} The created Playlist instance.
   */
  static createPlaylistFrom(items) {
    return Playlist.from(items, { onError: log.error, onWarn: log.warn });
  }

  /**
   * Constructs a PlaylistPlugin instance.
   *
   * @param {Object} player - The video.js player instance.
   * @param {Object} options - The plugin options.
   */
  constructor(player, options) {
    super(player);

    this.playlist_ = null;
    this.autoAdvance_ = null;
  }

  /**
   * Loads a playlist and sets up related functionality.
   *
   * @param {Playlist} playlist - The playlist to load.
   */
  loadPlaylist(playlist) {
    // Clean up any existing playlist
    this.unloadPlaylist();

    this.playlist_ = playlist;
    this.autoAdvance_ = new AutoAdvance(this.player, this.playNext_);

    this.setupEventForwarding_();

    // Begin handling non-playlist source changes.
    this.player.on('loadstart', this.handleSourceChange_);
  }

  /**
   * Unloads the current playlist and associated functionality.
   */
  unloadPlaylist() {
    if (this.playlist_) {
      this.playlist_.reset();
      this.cleanupEventForwarding_();
    }

    if (this.autoAdvance_) {
      this.autoAdvance_.fullReset();
    }

    // Stop handling non-playlist source changes
    this.player.off('loadstart', this.handleSourceChange_);
  }

  /**
   * Retrieves the currently loaded playlist object
   *
   * @return {Playlist|null} The current Playlist instance, or null if one is not loaded.
   */
  getPlaylist() {
    return this.playlist_;
  }

  /**
   * Sets the auto-advance delay.
   *
   * @param {number} delayInSeconds - The delay in seconds.
   */
  setAutoadvanceDelay(delayInSeconds) {
    if (!this.autoAdvance_) {
      return;
    }

    this.autoAdvance_.setDelay(delayInSeconds);
  }

  /**
   * Retrieves the current auto-advance delay.
   *
   * @return {number|null} The delay in seconds, or null if not set.
   */
  getAutoadvanceDelay() {
    if (!this.autoAdvance_) {
      return null;
    }

    return this.autoAdvance_.getDelay();
  }

  /**
   * Loads a specific playlist item by index.
   *
   * @param {number} index - The index of the item to load.
   * @param {boolean} options.loadPoster - Whether or not the item's poster image should be loaded
   * @return {boolean} True if the item was loaded successfully, false otherwise.
   */
  loadPlaylistItem(index, { loadPoster = true } = {}) {
    const items = this.playlist_.get();

    if (!isIndexInBounds(items, index)) {
      log.error('Index is out of bounds.');
      return false;
    }

    this.loadItem_(items[index], { loadPoster });
    this.playlist_.setCurrentIndex(index);

    return true;
  }

  /**
   * Loads the first item in the playlist.
   *
   * @return {boolean} True if the first item was loaded successfully, false otherwise.
   */
  loadFirstItem() {
    return this.loadPlaylistItem(0);
  }

  /**
   * Loads the last item in the playlist.
   *
   * @return {boolean} True if the last item was loaded successfully, false otherwise.
   */
  loadLastItem() {
    const lastIndex = this.playlist_.getLastIndex();

    return this.loadPlaylistItem(lastIndex);
  }

  /**
   * Loads the next item in the playlist.
   *
   * @param {boolean} options.loadPoster - Whether or not the next item's poster image should be loaded
   * @return {boolean} True if the next item was loaded successfully, false otherwise.
   */
  loadNextItem({ loadPoster = true } = {}) {
    const nextIndex = this.playlist_.getNextIndex();

    if (nextIndex === -1) {
      return false;
    }

    return this.loadPlaylistItem(nextIndex, { loadPoster });
  }

  /**
   * Loads the previous item in the playlist.
   *
   * @return {boolean} True if the previous item was loaded successfully, false otherwise.
   */
  loadPreviousItem() {
    const previousIndex = this.playlist_.getPreviousIndex();

    if (previousIndex === -1) {
      return false;
    }

    return this.loadPlaylistItem(previousIndex);
  }

  /**
   * Loads a specific playlist item.
   *
   * @param {Object} item - The playlist item to load.
   * @param {boolean} options.loadPoster - Whether or not the item's poster image should be loaded
   * @private
   */
  loadItem_(item, { loadPoster = true } = {}) {
    this.player.trigger('beforeplaylistitem', item);

    // Remove any textTracks from a previous item
    this.clearExistingItemTextTracks_();

    this.player.poster(loadPoster ? item.poster : '');
    this.player.src(item.sources);

    this.player.ready(() => {
      this.addItemTextTracks_(item);

      this.player.trigger('playlistitem', item);
    });
  }

  /**
   * Sets up event forwarding from the playlist to the player.
   *
   * @private
   */
  setupEventForwarding_() {
    const playlistEvents = ['playlistchange', 'playlistadd', 'playlistremove', 'playlistsorted'];

    playlistEvents.forEach((eventType) => this.playlist_.on(eventType, (event) => this.player.trigger(event)));
  }

  /**
   * Cleans up event forwarding from the playlist to the player.
   *
   * @private
   */
  cleanupEventForwarding_() {
    const playlistEvents = ['playlistchange', 'playlistadd', 'playlistremove', 'playlistsorted'];

    playlistEvents.forEach((eventType) => this.playlist_.off(eventType, this.handlePlaylistEvent_));
  }

  /**
   * Plays the next item in the playlist.
   *
   * @private
   */
  playNext_ = () => {
    const shouldLoadPoster = this.player.options_.audioPosterMode ? true : false;
    const loadedNext = this.loadNextItem({ loadPoster: shouldLoadPoster });

    if (loadedNext) {
      this.player.play();
    }
  };

  /**
   * Clears text tracks of the currently loaded item.
   *
   * @private
   */
  clearExistingItemTextTracks_() {
    const textTracks = this.player.remoteTextTracks();
    let i = textTracks && textTracks.length || 0;

    // This uses a `while` loop rather than `forEach` because the
    // `TextTrackList` object is a live DOM list (not an array).
    while (i--) {
      this.player.removeRemoteTextTrack(textTracks[i]);
    }
  }

  /**
   * Adds text tracks for a playlist item.
   *
   * @param {Object} item - The playlist item.
   * @private
   */
  addItemTextTracks_(item) {
    item.textTracks.forEach(this.player.addRemoteTextTrack.bind(this.player));
  }

  /**
   * Handles changes to the player's source.
   *
   * @private
   */
  handleSourceChange_ = () => {
    const currentSrc = this.player.currentSrc();

    if (!this.isSourceInPlaylist_(currentSrc)) {
      this.handleNonPlaylistSource_();
    }
  };

  /**
   * Checks if the current source is in the playlist.
   *
   * @param {string} src - The source URL to check.
   * @return {boolean} True if the source is in the playlist, false otherwise.
   * @private
   */
  isSourceInPlaylist_(src) {
    const itemList = this.playlist_.get();

    return itemList.some(item => item.sources.some(source => source.src === src));
  }

  /**
   * Handles playback when the current source is not in the playlist.
   *
   * @private
   */
  handleNonPlaylistSource_() {
    this.autoAdvance_.fullReset();
    this.playlist_.setCurrentIndex(null);
  }
}
