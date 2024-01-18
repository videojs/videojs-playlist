# Video.js Playlist API

## Playlist Item Structure

A playlist is an array of playlist item objects that conform to the following structure:

```ts
interface PlaylistItem {
  /**
   * An array of source objects representing the media sources for the video.
   * Each source object includes the URL and MIME type of the video source.
   */
  sources: Array<{
    src: string;
    type: string;
  }>;

  /**
   * The URL of the poster image displayed before the video plays.
   * This property is optional.
   */
  poster?: string;

  /**
   * An optional array of text track objects for subtitles, captions, etc.
   * Each object in this array follows the structure of the Video.js TextTrack object.
   */
  textTracks?: Array<{
    kind?: string;
    label?: string;
    language?: string;
    src?: string;
    srcLang?: string;
    default?: boolean;
  }>;

  /**
   * Additional dynamic properties that may be specific to the video
   * or required by the playlist system.
   */
  [key: string]: any;
}
```

## Plugin Methods
TODO

## Playlist Methods
TODO
