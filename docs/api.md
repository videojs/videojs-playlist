# video.js Playlist Plugin API

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Playlist Item Object](#playlist-item-object)
- [Methods](#methods)
  - [`player.playlist([Array newList]) -> Array`](#playerplaylistarray-newlist---array)
    - [`player.playlist.currentItem([Number index]) -> Number`](#playerplaylistcurrentitemnumber-index---number)
    - [`player.playlist.contains(String|Object|Array value) -> Boolean`](#playerplaylistcontainsstringobjectarray-value---boolean)
    - [`player.playlist.indexOf(String|Object|Array value) -> Number`](#playerplaylistindexofstringobjectarray-value---number)
    - [`player.playlist.first() -> Object|undefined`](#playerplaylistfirst---objectundefined)
    - [`player.playlist.last() -> Object|undefined`](#playerplaylistlast---objectundefined)
    - [`player.playlist.next() -> Object`](#playerplaylistnext---object)
    - [`player.playlist.previous() -> Object`](#playerplaylistprevious---object)
    - [`player.playlist.autoadvance([Number delay]) -> undefined`](#playerplaylistautoadvancenumber-delay---undefined)
- [Events](#events)
    - [`playlistchange`](#playlistchange)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Playlist Item Object

A playlist is an array of playlist items. A playlist item is an object with the following properties:

Property   | Type   | Optional | Description
---------- | ------ | -------- | -----------
`sources`  | Array  |          | An array of sources that video.js understands.
`poster`   | String | ✓        | A poster image to display for these sources.

## Methods

### `player.playlist([Array newList]) -> Array`

Get or set the current playlist for a player.

If called without arguments, it is a getter. With an argument, it is a setter.

```js
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
// [{ ... }, ... ]

player.playlist([{
  sources: [{
    src: 'http://media.w3.org/2010/05/video/movie_300.mp4',
    type: 'video/mp4'
  }],
  poster: 'http://media.w3.org/2010/05/video/poster.png'
}]);
// [{ ... }]
```

#### `player.playlist.currentItem([Number index]) -> Number`

Get or set the current item index.

If called without arguments, it is a getter. With an argument, it is a setter.

If the player is currently playing a non-playlist video, it will return `-1`.

```js
player.currentItem();
// 0

player.currentItem(2);
// 2

player.playlist(samplePlaylist);
player.src('http://example.com/video.mp4');
player.playlist.currentItem();
// -1
```

#### `player.playlist.contains(String|Object|Array value) -> Boolean`

Determine whether a string, source object, or playlist item is contained within a playlist.

Assuming the playlist used above, consider the following example:

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

#### `player.playlist.indexOf(String|Object|Array value) -> Number`

Get the index of a string, source object, or playlist item in the playlist. If not found, returns `-1`.

Assuming the playlist used above, consider the following example:

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

#### `player.playlist.first() -> Object|undefined`

Play the first item in the playlist.

Returns the activated playlist item unless the playlist is empty (in which case, returns `undefined`).

```js
player.playlist.first();
// { ... }

player.playlist([]);
player.playlist.first();
// undefined
```

#### `player.playlist.last() -> Object|undefined`

Play the last item in the playlist.

Returns the activated playlist item unless the playlist is empty (in which case, returns `undefined`).

```js
player.playlist.last();
// { ... }

player.playlist([]);
player.playlist.last();
// undefined
```

#### `player.playlist.next() -> Object`

Advance to the next item in the playlist.

Returns the activated playlist item unless the playlist is at the end (in which case, returns `undefined`).

```js
player.playlist.next();
// { ... }


player.playlist.last();
player.playlist.next();
// undefined
```

#### `player.playlist.previous() -> Object`

Go back to the previous item in the playlist.

Returns the activated playlist item unless the playlist is at the beginning (in which case, returns `undefined`).

```js
player.playlist.next();
// { ... }

player.playlist.previous();
// { ... }

player.playlist.first();
// { ... }

player.playlist.previous();
// undefined
```

#### `player.playlist.autoadvance([Number delay]) -> undefined`

Sets up playlist auto-advance behavior.

Once invoked, at the end of each video in the playlist, the plugin will wait `delay` seconds before proceeding automatically to the next video.

Any value which is not a positive, finite integer, will be treated as a request to cancel and reset the auto-advance behavior.

If you change auto-advance during a delay, the auto-advance will be canceled and it will not advance the next video, but it will use the new timeout value for the following videos.

```js
// no wait before loading in the next item
player.playlist.autoadvance(0);

// wait 5 seconds before loading in the next item
player.playlist.autoadvance(5); 

// reset and cancel the auto-advance
player.playlist.autoadvance();
```

## Events

#### `playlistchange`

This event is fired asynchronously whenever the contents of the playlist are changed (i.e., when `player.playlist()` is called with an argument).

It is fired asynchronously to let the browser start loading the first video in the new playlist.

```js
player.on('playlistchange', function() {
  console.log(player.playlist());
});

player.playlist([ ... ]);
// [ ... ]

player.playlist([ ... ]);
// [ ... ]
```
