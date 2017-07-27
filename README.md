[![Build Status](https://travis-ci.org/brightcove/videojs-playlist.svg?branch=master)](https://travis-ci.org/brightcove/videojs-playlist)

# Filmweb fork of Brightcove Playlist Plugin for video.js

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Fork changes](#fork-changes)
  - [playlistautoadvance event](#playlistautoadvance-event)
  - [Custom setSource function](#custom-setsource-function)
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

### playlistautoadvance event
Event fires on autoadvance, but not in other playlist change circumstances.
 
### Custom setSource function
Allows to override default change source behaviour provided by videojs
on item change. Function is used between `beforeplaylistitem`
and `playlistitem` events, and allows you extend or replace the default
`player.src()` method.
```javascript
player.playlist.customSrcFunction(function(player,item) { 
    /*...*/ 
})
```

Use case - google IMA plugin:
````javascript
player.playlist.customSrcFunction(function(player, item){
        if (player.ima && typeof player.ima.setContentWithAdTag === 'function') {
            player.ima.setContentWithAdTag(item.sources, null, true);
            player.ima.requestAds();
        } else {
            player.src(item.sources);
        }
    });
````

## License

Apache-2.0. Copyright (c) Brightcove, Inc.
