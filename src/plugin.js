import videojs from 'video.js';
import {version as VERSION} from '../package.json';
import PlaylistPlugin from './playlist-plugin.js';
import Playlist from './playlist.js';

// Include the version number.
PlaylistPlugin.VERSION = VERSION;

// Register the plugin with video.js.
videojs.registerPlugin('playlistPlugin', PlaylistPlugin);

export default PlaylistPlugin;
export { Playlist };
