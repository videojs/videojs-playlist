[![Build Status](https://travis-ci.org/brightcove/videojs-playlist.svg?branch=master)](https://travis-ci.org/brightcove/videojs-playlist)

# Playlist plugin for videojs

## Usage

```js
require('videojs-playlist');

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

player.playlist.next();
```

## API

* [Methods](#methods)
  * [`player.playlist([Array newPlaylist])`](#playerplaylistarray-newplaylist---array)
  * [`player.playlist.currentItem([Number newIndex])`](#playerplaylistcurrentitemnumber-newindex---number)
  * [`player.playlist.contains(Any item)`](#playerplaylistcontainsany-item---boolean)
  * [`player.playlist.indexOf(Any item)`](#playerplaylistindexofany-item---number)
  * [`player.playlist.next()`](#playerplaylistnext---object)
  * [`player.playlist.previous()`](#playerplaylistprevious---object)
  * [`player.playlist.autoadvance()`](#playerplaylistautoadvancenumber-timeout---undefined)
* [Events](#events)
  * [`playlistchange`](#playlistchange)

### Methods
#### `player.playlist([Array newPlaylist]) -> Array`
This function allows you to either set or get the current playlist.
If called without arguments, it is a getter, with an argument, it is a setter.

```js
player.playlist();
// [{
//   sources: [{
//     src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
//     type: 'video/mp4'
//   }],
//   poster: 'http://media.w3.org/2010/05/sintel/poster.png'
// }, {
//   sources: [{
//     src: 'http://media.w3.org/2010/05/bunny/trailer.mp4',
//     type: 'video/mp4'
//   }],
// ...

player.playlist([{
  sources: [{
    src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/video/poster.png'
}]);
// [{
//   sources: [{
//     src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
//     type: 'video/mp4'
//   }],
//   poster: 'http://media.w3.org/2010/05/video/poster.png'
// }]
```

#### `player.playlist.currentItem([Number newIndex]) -> Number`
This functions allows you to either set or get the current item index.
If called without arguments, it is a getter, with an argument, it is a setter.

If the player is currently playing a non-playlist video, `currentItem` will return `-1`.

```js
player.currentItem();
// 0

player.currentItem(2);
// 2
```

```js
player.playlist(samplePlaylist);
player.src('http://example.com/video.mp4');
player.playlist.currentItem(); // -1
```

#### `player.playlist.contains(Any item) -> Boolean`
This function allows you to ask the playlist whether a string, source object, or playlist item is contained within it.
Assuming the above playlist, consider the following example:

```js
playlist.contains('http://media.w3.org/2010/05/sintel/trailer.mp4')
// true

playlist.contains([{
  src: 'http://media.w3.org/2010/05/sintel/poster.png',
  type: 'image/png'
}])
// false

playlist.contains({
  sources: [{
    src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
    type: 'video/mp4'
  }]
});
// true
```

#### `player.playlist.indexOf(Any item) -> Number`
This function allows you to ask the playlist whether a string, source object, or playlist item is contained within it and at what index. It returns `-1` for non-existent items, otherwise, the corresponding index.
Assuming the above playlist, consider the following example:

```js
playlist.indexOf('http://media.w3.org/2010/05/bunny/trailer.mp4')
// 1

playlist.contains([{
  src: 'http://media.w3.org/2010/05/bunny/movie.mp4',
  type: 'video/mp4'
}])
// 3

playlist.contains({
  sources: [{
    src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
    type: 'video/mp4'
  }]
});
// 4
```

#### `player.playlist.next() -> Object`
This functions allows you to advance to the next item in the playlist. You will receive the new playlist item back from this call. `player.playlist.currentItem` will be updated to return the new index.
If you are at the end of the playlist, you will not be able to proceed past the end and instead will not receive anything back;

```js
player.playlist.next();
// {
//   sources: [{
//     src: 'http://media.w3.org/2010/05/bunny/trailer.mp4',
//     type: 'video/mp4'
//   }],
//   poster: 'http://media.w3.org/2010/05/bunny/poster.png'
// }


player.playlist.currenItem(player.playlist().length - 1); // set to last item
// 4
player.playlist.next();
// undefined
```

#### `player.playlist.previous() -> Object`
This functions allows you to return to the previous item in the playlist. You will receive the new playlist item back from this call. `player.playlist.currentItem` will be updated to return the new index.
If you are at the start of the playlist, you will not be able to proceed past the start and instead will not receive anything back;

```js
player.playlist.currenItem(1); // set to second item in the playlist
// 1
player.playlist.previous();
// {
//   sources: [{
//     src: 'http://media.w3.org/2010/05/sintel/trailer.mp4',
//     type: 'video/mp4'
//   }],
//   poster: 'http://media.w3.org/2010/05/sintel/poster.png'
// }


player.playlist.currenItem();
// 0
player.playlist.previous();
// undefined
```

#### `player.playlist.autoadvance([Number timeout]) -> undefined`
This function allows you to set up playlist auto advancement. Once enabled it will wait a `timeout` amount of seconds at the end of a video before proceeding automatically to the next video.
Any value which is not a positive, finite, integer, will be treated as a request to cancel and reset the auto advancing.
If you change autoadvance during a timeout period, the auto advance will be canceled and it will not advance the next video but it will use the new timeout value for the following videos.

```js
player.playlist.autoadvance(0); // will not wait before loading in the next item
player.playlist.autoadvance(5); // will wait for 5 seconds before loading in the next item
player.playlist.autoadvance(null); // reset and cancel the auto advance
```

### Events

#### `playlistchange`
This event is fired asynchronously whenever the playlist is changed.
It is fired asynchronously to let the browser start loading the first video in the new playlist.

```js
player.on('playlistchange', function() {
  console.log(player.playlist());
});

player.playlist([1,2,3]);
// [1,2,3]

player.playlist([4,5,6]);
// [4,5,6]
```

## Development

### npm scripts
* `npm run build` - Build `dist/bundle.js` file only. Alias for `build-dist`
* `npm run watch` - Watch and rebuild `dist/bundle.js` and `dist/tests.js` files as necessary
* `npm run buildall` - Build both `dist/bundle.js` and `dist/tests.js`
* `npm run build-dist` - Build only `dist/bundle.js`
* `npm run watch-dist` - watch and rebuild `dist/bundle.js` file as necessary
* `npm run build-tests` - Build only `dist/tests.js`
* `npm run watch-tests` - watch and rebuild `dist/tests.js` file as necessary
* `npm test` - Run jshint on all javascript files, build `dist/tests.js` file, and do a single run of karma
* `npm run test-watch` - Watch and rebuild `dist/tests.js` file as necessary and run karma watch to re-run tests as necessary
* `npm run jshint` - Just run jshint on all files

### Building
You should either include this project directly in your browserify or you can build it by running
`npm run build`

### Running tests
You can run a single test run, which includes running jshint as well as karma by running
```sh
npm test
```
For development, consider running
```sh
npm run test-watch
```
Which will re-run the karma tests as you save your files to let you know your test results automatically.

## [LICENSE](https://github.com/brightcove/videojs-playlist/blob/master/LICENSE.md)
