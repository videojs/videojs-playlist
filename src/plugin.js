import videojs from 'video.js';
import {version as VERSION} from '../package.json';
import Playlist from './playlist.js';

// Include the version number.
Playlist.VERSION = VERSION;

// Register the plugin with video.js.
videojs.registerPlugin('playlist', Playlist);

export default Playlist;
