import { silencePromise } from './utils.js';

/**
 * Represents a single item in a video playlist.
 */
export default class PlaylistItem {

  /**
   * Creates an instance of the PlaylistItem class.
   *
   * @param {Object} videoProperties
   *        The video properties for the playlist item, including sources, poster, and text tracks.
   */
  constructor(videoProperties) {
    // Default values for known properties
    const { sources, poster = '', textTracks = [] } = videoProperties;

    this.sources = this.validateSources(sources);
    this.poster = poster;
    this.textTracks = textTracks;

    // Assign additional properties directly to this instance
    for (const key in videoProperties) {
      if (videoProperties.hasOwnProperty(key) && !['sources', 'poster', 'textTracks'].includes(key)) {
        this[key] = videoProperties[key];
      }
    }
  }

  /**
   * Validates the given sources array, ensuring each source object contains 'src' and 'type' properties.
   * Throws an error if sources are not an array or no valid sources are found.
   *
   * @param {Object[]} sources
   *        The array of source objects to validate.
   * @return {Object[]}
   *         An array of valid source objects.
   * @throws {Error}
   *         If sources are not an array or no valid sources are found.
   */
  validateSources(sources) {
    if (!Array.isArray(sources)) {
      throw new Error('Sources must be an array');
    }

    // Filter out invalid source objects
    const validSources = sources.filter(source => typeof source === 'object' && typeof source.src === 'string' && typeof source.type === 'string');

    // If no valid source objects are present, throw an error
    if (validSources.length === 0) {
      throw new Error('No valid sources found. Each source should be an object with "src" and "type" string properties.');
    }

    return validSources;
  }

  /**
   * Loads a playlist item. Initiates playback if certain conditions are met.
   *
   * @param {Player} player
   *        A Video.js Player instance.
   * @fires beforeplaylistitem
   *        Triggered before a source is loaded.
   *        This event passes the current instance of PlaylistItem as an argument to the event handlers.
   * @fires playlistitem
   *        Triggered after a source has been loaded and the player is ready, but before play() is called.
   *        This event passes the current instance of PlaylistItem as an argument to the event handlers.
   */
  loadOrPlay(player) {
    // We should only immediately play this item if:
    // - we are switching to it from one that was already playing, in which case continued playback is expected.
    // - the previous item has finished and playback of this item has been initiated, either manually or by AutoAdvance.
    const shouldCallPlay = !player.paused() || player.ended();

    player.trigger('beforeplaylistitem', this);

    // Only load the poster if we will not be playing this item immediately. This helps avoid poster flash.
    player.poster(!shouldCallPlay ? this.poster : '');
    player.src(this.sources);

    // Remove any textTracks from a previous item
    this.clearExistingTextTracks(player);

    player.ready(() => {
      this.addTextTracks(player);

      player.trigger('playlistitem', this);

      if (shouldCallPlay) {
        // silence any "uncaught play promise" rejection error messages
        silencePromise(player.play());
      }
    });
  }

  /**
   * Adds text tracks to the player based on the textTracks property of this playlist item.
   *
   * @param {Player} player
   *        A Video.js Player instance.
   */
  addTextTracks(player) {
    this.textTracks.forEach(player.addRemoteTextTrack.bind(this.player_));
  }

  /**
   * Clears all existing text tracks from the player associated with this playlist item.
   *
   * @param {Player} player
   *        A Video.js Player instance.
   */
  clearExistingTextTracks(player) {
    const textTracks = player.remoteTextTracks();
    let i = textTracks && textTracks.length || 0;

    // This uses a `while` loop rather than `forEach` because the
    // `TextTrackList` object is a live DOM list (not an array).
    while (i--) {
      player.removeRemoteTextTrack(textTracks[i]);
    }
  }
}
