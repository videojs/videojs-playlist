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

Or Bower:

```sh
$ bower install videojs-playlist
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
const playlistPlugin = player.playlist({
  // Play through the playlist automatically with no delay between videos
  autoadvanceDelay: 0,
  // Loop the playlist back to the beginning after the last video 
  repeat: true
});

playlistPlugin.setPlaylist([{
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
}, {
  sources: [{
    src: 'http://media.w3.org/2010/05/bunny/movie.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/bunny/poster.png'
}, {
  sources: [{
    src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/video/poster.png'
}]);

// Load the first playlist item
playlistPlugin.loadItem(0);

// Play the first item. While auto-advance is enabled, subsequent play() calls will happen automatically.
player.play();

// Programatically modify playlist behaviors set at initialization

// Disable autoadvance (videos will not automatically progress to the next one)
playlistPlugin.setAutoadvanceDelay(null);

// Disable repeat mode (the playlist will not loop back to the first video after the last one)
playlistPlugin.disableRepeat();
```

## License

Apache-2.0. Copyright (c) Brightcove, Inc.
