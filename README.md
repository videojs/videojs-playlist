# Video.js Playlist Ui

A playlist video picker for video.js

## Getting Started

Once you've added the plugin script to your page, you can use it with any video:

```html
<script src="video.js"></script>
<script src="videojs-playlist-ui.js"></script>
<script>
  videojs(document.querySelector('video')).playlistUi();
</script>
```

There's also a [working example](example.html) of the plugin you can check out if you're having trouble.

## Documentation

The Playlist Menu automatically adapts to ad integrations based on
[videojs-contrib-ads](https://github.com/videojs/videojs-contrib-ads). When
a linear ad is being played, the menu will darken and stop responding
to click or touch events. If you'd prefer to allow your viewers to
change videos during ad playback, you can override this behavior
through CSS. You will also need to make sure that your ad integration
is properly cancelled and cleaned up before switching-- consult the
documentation for your ad library for details on how to do that.

### Plugin Options

You may pass in an options object to the plugin upon initialization. This
object may contain any of the following properties:

#### option
Type: `boolean`
Default: true

An example boolean option that has no effect.

## Release History

 - 0.1.0: Initial release
