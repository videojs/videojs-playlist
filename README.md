[![Build Status](https://travis-ci.org/brightcove/videojs-playlist-ui.svg?branch=master)](https://travis-ci.org/brightcove/videojs-playlist-ui)

# Video.js Playlist UI

A playlist video picker for video.js

## Getting Started

Include the plugin script in your page, and a placeholder list element
with the class `vjs-playlist` to house the playlist menu:

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
  // Now you can initialize the plugin and build the playlist whenever
  // you're ready!
  videojs(document.querySelector('video')).playlistUi();
</script>
```

There's also a [working example](example.html) of the plugin you can
check out if you're having trouble.

## Documentation

### Plugin Options

You may pass in an options object to the plugin upon initialization.
The PlaylistMenu is a regular [video.js
Component](https://github.com/videojs/video.js/blob/master/docs/guides/components.md)
so you may pass in [any
option](https://github.com/videojs/video.js/blob/master/docs/guides/options.md#component-options)
that is accepted by Components. In addition, this object may contain
this specialized property:

#### className
Type: `string`
Default: "vjs-playlist"

The name of the class to search for to populate the playlist menu.

#### playOnSelect
Type: `Boolean`
Default: false

The default behavior is that the play state is expected to stay the same between videos, if playing continue playing and if paused stay paused when playlist menu items are clicked. When this boolean is set to true, clicking on the playlist menu items will always play the video.

## Playlists and Advertisements

The Playlist Menu automatically adapts to ad integrations based on
[videojs-contrib-ads](https://github.com/videojs/videojs-contrib-ads). When
a linear ad is being played, the menu will darken and stop responding
to click or touch events. If you'd prefer to allow your viewers to
change videos during ad playback, you can override this behavior
through CSS. You will also need to make sure that your ad integration
is properly cancelled and cleaned up before switching-- consult the
documentation for your ad library for details on how to do that.

## Release History

 - 0.1.0: Initial release
