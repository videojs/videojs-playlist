[![Build Status](https://travis-ci.org/brightcove/videojs-playlist.svg?branch=master)](https://travis-ci.org/brightcove/videojs-playlist)

# Filmweb fork of Brightcove Playlist Plugin for video.js

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Fork changes](#fork-changes)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

Install fw-videojs-playlist via npm (preferred):

```sh
$ npm install fw-videojs-playlist
```

## Basic Usage

For full details on how to use the playlist plugin can be found in [the API documentation](docs/api.md).

```js
var player = videojs('video');

player.playlist([{
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

// Play through the playlist automatically.
player.playlist.autoadvance(0);
```

## Fork changes

* Event `playlistautoadvance` added to easily distinguish between playlist change and autoadvance 
* **TODO** Custom `setSource` function (primarily to allow google-ima integration)

## License

Apache-2.0. Copyright (c) Brightcove, Inc.
