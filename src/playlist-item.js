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
    // Default values for known properties.
    const { sources, poster = '', textTracks = [] } = videoProperties;

    this.sources = sources;
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
   * Loads a playlist item
   *
   * @param {Player} player
   *        A Video.js Player instance.
   * @param {boolean} [options.loadPoster = true]
   *        Whether or not to load the poster image
   * @fires beforeplaylistitem
   *        Triggered before a source is loaded.
   *        This event passes the current instance of PlaylistItem as an argument to the event handlers.
   * @fires playlistitem
   *        Triggered after a source has been loaded and the player is ready.
   *        This event passes the current instance of PlaylistItem as an argument to the event handlers.
   */
  load(player, { loadPoster = true } = {}) {
    player.trigger('beforeplaylistitem', this);

    // Remove any textTracks from a previous item
    this.clearExistingTextTracks(player);

    player.poster(loadPoster ? this.poster : '');
    player.src(this.sources);

    player.ready(() => {
      this.addTextTracks(player);

      player.trigger('playlistitem', this);
    });
  }

  /**
   * Adds text tracks to the player based on the textTracks property of this playlist item.
   *
   * @param {Player} player
   *        A Video.js Player instance.
   */
  addTextTracks(player) {
    this.textTracks.forEach(player.addRemoteTextTrack.bind(player));
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
