[![Build Status](https://travis-ci.org/brightcove/videojs-playlist-ui.svg?branch=master)](https://travis-ci.org/brightcove/videojs-playlist-ui)

# Video.js Playlist UI

A playlist video picker for video.js and videojs-playlist

## Getting Started

Include the plugin script in your page, and a placeholder list element with the class `vjs-playlist` to house the playlist menu:

```html
<!-- Include the playlist menu styles somewhere in your page: -->
<link href="videojs-playlist-ui.vertical.css" rel="stylesheet">

<!-- The playlist menu will be built automatically in here: -->
<ol class="vjs-playlist"></ol>

<!-- Include video.js, the videojs-playlist plugin and this plugin: -->
<script src="video.js"></script>
<script src="videojs-playlist.js"></script>
<script src="videojs-playlist-ui.js"></script>

<script>
  // Initialize the plugin and build the playlist!
  videojs(document.querySelector('video')).playlistUi();
</script>
```

There's also a [working example](example.html) of the plugin you can check out if you're having trouble.

## Documentation

Before this plugin will work at all, it needs an element in the DOM to which to attach itself. There are three ways to find/provide this element:

### Default Implementation

By default, the plugin will search for _the first element in the DOM with the `vjs-playlist` class_.

> [See an example.](example.html)

### Using a Custom Class

A custom `className` option can be passed to override the class the plugin will search for to find the root element.

```js
player.playlistUi({className: 'hello-world'});
```

> [See an example.](example-custom-class.html)

### Using a Custom Element

A custom element can be passed _in lieu of an options object_ to explicitly define a specific root element.

```js
player.playlistUi({document.getElementById('hello-world'));
```

> [See an example.](example-custom-element.html)

### Other Options

_Extra options cannot be passed if passing a custom element._

The options passed to the plugin are passed to the internal `PlaylistMenu` [video.js Component][components]; so, you may pass in [any option][components-options] that is accepted by a component.

In addition, the options object may contain the following specialized properties:

#### `className`
Type: `string`
Default: `"vjs-playlist"`

As mentioned [above](#using-a-custom-class), the name of the class to search for to populate the playlist menu.

#### playOnSelect
Type: `boolean`
Default: `false`

The default behavior is that the play state is expected to stay the same between videos. If the player is playing when switching playlist items, continue playing. If paused, stay paused.

When this boolean is set to `true`, clicking on the playlist menu items will always play the video.

## Playlists and Advertisements

The `PlaylistMenu` automatically adapts to ad integrations based on [videojs-contrib-ads][contrib-ads]. When a linear ad is being played, the menu will darken and stop responding to click or touch events. If you'd prefer to allow your viewers to change videos during ad playback, you can override this behavior through CSS. You will also need to make sure that your ad integration is properly cancelled and cleaned up before switching -- consult the documentation for your ad library for details on how to do that.


[components]: https://github.com/videojs/video.js/blob/master/docs/guides/components.md
[components-options]: https://github.com/videojs/video.js/blob/master/docs/guides/options.md#component-options
[contrib-ads]: https://github.com/videojs/videojs-contrib-ads
