# videojs-playlist

[![Build Status](https://travis-ci.org/brightcove/videojs-playlist.svg?branch=master)](https://travis-ci.org/brightcove/videojs-playlist)
[![Greenkeeper badge](https://badges.greenkeeper.io/brightcove/videojs-playlist.svg)](https://greenkeeper.io/)
[![Slack Status](http://slack.videojs.com/badge.svg)](http://slack.videojs.com)

[![NPM](https://nodei.co/npm/videojs-playlist.png?downloads=true&downloadRank=true)](https://nodei.co/npm/videojs-playlist/)

A plugin to enable playlists in video.js

Maintenance Status: Stable

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Inclusion](#inclusion)
- [Basic Usage](#basic-usage)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install videojs-playlist via npm (preferred):

```sh
$ npm install videojs-playlist
```

## Inclusion

Include videojs-playlist on your website using the tool(s) of your choice.

The simplest method of inclusion is a `<script>` tag after the video.js `<script>` tag:

```html
<script src="path/to/video.js/dist/video.js"></script>
<script src="path/to/videojs-playlist/dist/videojs-playlist.js"></script>
```

When installed via npm, videojs-playlist supports Browserify-based workflows out of the box.

## Basic Usage

For full details on how to use the playlist plugin can be found in [the API documentation](docs/api.md).

```js
// Initialize Video.js player
const player = videojs('video');

// Initialize the playlist plugin
const playlistPlugin = player.playlistPlugin();

// Retrieve the PlaylistPlugin class
// This is used to access static methods of the PlaylistPlugin
const PlaylistPluginClass = videojs.getPlugin('playlistPlugin');

const videoList = [{
  sources: [{
    src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/sintel/poster.png'
}, {
  sources: [{
    src: 'http://media.w3.org/2010/05/bunny/trailer.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/bunny/poster.png'
}, {
  sources: [{
    src: 'http://vjs.zencdn.net/v/oceans.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://www.videojs.com/img/poster.jpg'
}];

// Create a new Playlist instance from the video list
// This utilizes a static method of the PlaylistPlugin class to create a Playlist instance
const playlist = PlaylistPluginClass.createPlaylistFrom(videoList);

// Playlist methods - Manage Playlist Content and Indexing
// Methods under Playlist are focused on direct manipulation of the playlist content (add, remove, shuffle, reverse etc)
// and controlling playlist indexing (getNextIndex, getPreviousIndex, enableRepeat, disableRepeat, etc), but not how the player uses the playlist
playlist.add({
  // video item details
});
playlist.remove(0);
playlist.shuffle();
playlist.reverse();
playlist.enableRepeat();
playlist.disableRepeat();

// Plugin methods - Integrate Playlist with the Player
// Methods under PlaylistPlugin are focused on how the playlist is used by the player
// This includes loading the playlist into the player, handling playback, and setting auto-advance behavior
playlistPlugin.loadPlaylist(playlist);
playlistPlugin.loadFirstItem();
playlistPlugin.setAutoadvanceDelay(0);

// Play the currently loaded playlist item
player.play();
```

## License

Apache-2.0. Copyright (c) Brightcove, Inc.
