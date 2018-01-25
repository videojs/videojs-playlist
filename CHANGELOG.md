<a name="4.2.0"></a>
# [4.2.0](https://github.com/brightcove/videojs-playlist/compare/v4.1.1...v4.2.0) (2018-01-25)

### Features

* Add 'duringplaylistchange' event. ([#92](https://github.com/brightcove/videojs-playlist/issues/92)) ([eb80503](https://github.com/brightcove/videojs-playlist/commit/eb80503))
* Add 'rest' option to the shuffle method. ([#91](https://github.com/brightcove/videojs-playlist/issues/91)) ([57d5f0c](https://github.com/brightcove/videojs-playlist/commit/57d5f0c))

<a name="4.1.1"></a>
## [4.1.1](https://github.com/brightcove/videojs-playlist/compare/v4.1.0...v4.1.1) (2018-01-08)

### Bug Fixes

* Fix an issue where we could auto-advance even if the user restarted playback after an ended event. ([#88](https://github.com/brightcove/videojs-playlist/issues/88)) ([5d872d1](https://github.com/brightcove/videojs-playlist/commit/5d872d1))

<a name="4.1.0"></a>
# [4.1.0](https://github.com/brightcove/videojs-playlist/compare/v4.0.2...v4.1.0) (2017-11-28)

### Features

* Add new methods: `currentIndex`, `nextIndex`, `previousIndex`, `lastIndex`, `sort`, `reverse`, and `shuffle`. ([#87](https://github.com/brightcove/videojs-playlist/issues/87)) ([271a27b](https://github.com/brightcove/videojs-playlist/commit/271a27b))

### Documentation

* Fix missing call to playlist ([#86](https://github.com/brightcove/videojs-playlist/issues/86)) ([a7ffd57](https://github.com/brightcove/videojs-playlist/commit/a7ffd57))

<a name="4.0.2"></a>
## [4.0.2](https://github.com/brightcove/videojs-playlist/compare/v4.0.1...v4.0.2) (2017-11-13)

### Bug Fixes

* Fix item switching for asynchronous source setting in Video.js 6. ([#85](https://github.com/brightcove/videojs-playlist/issues/85)) ([8a77bf0](https://github.com/brightcove/videojs-playlist/commit/8a77bf0))

<a name="4.0.1"></a>
## [4.0.1](https://github.com/brightcove/videojs-playlist/compare/v4.0.0...v4.0.1) (2017-10-16)

### Chores

* depend on either vjs 5.x or 6.x ([#84](https://github.com/brightcove/videojs-playlist/issues/84)) ([3f3c946](https://github.com/brightcove/videojs-playlist/commit/3f3c946))

<a name="4.0.0"></a>
# [4.0.0](https://github.com/brightcove/videojs-playlist/compare/v2.0.0...v4.0.0) (2017-05-19)

### Chores

* Update tooling using generator v5 prerelease. ([#79](https://github.com/brightcove/videojs-playlist/issues/79)) ([0b53140](https://github.com/brightcove/videojs-playlist/commit/0b53140))


### BREAKING CHANGES

* Remove Bower support.

## 3.1.1 (2017-04-27)
_(none)_

## 3.1.0 (2017-04-03)
* @incompl Add repeat functionality to plugin [#71](https://github.com/brightcove/videojs-playlist/pull/71)

## 3.0.2 (2017-02-10)
* @misteroneill Suppress videojs.plugin deprecation warning in Video.js 6 [#68](https://github.com/brightcove/videojs-playlist/pull/68)

## 3.0.1 (2017-01-30)
* @misteroneill Update project to use latest version of plugin generator as well as ensure cross-version support between Video.js 5 and 6. [#63](https://github.com/brightcove/videojs-playlist/pull/63)

## 3.0.0 (2016-09-12)
* @misteroneill Remove Brightcove VideoCloud-specific Code [#51](https://github.com/brightcove/videojs-playlist/pull/51)

## 2.5.0 (2016-09-12)
* @mister-ben Load playlist with initial video at specified index or no starting video [#38](https://github.com/brightcove/videojs-playlist/pull/38)

## 2.4.1 (2016-04-21)
* @gkatsev fixed build scripts to only apply browserify-shim for dist files. Fixes [#36](https://github.com/brightcove/videojs-playlist/issues/36). [#44](https://github.com/brightcove/videojs-playlist/pull/44)

## 2.4.0 (2016-04-21)
* @vdeshpande Fixed an issue where incorrect end time value was used [#43](https://github.com/brightcove/videojs-playlist/pull/43)

## 2.3.0 (2016-04-19)
* @vdeshpande Support cue point intervals [#37](https://github.com/brightcove/videojs-playlist/pull/37)

## 2.2.0 (2016-01-29)
* @forbesjo Support turning a list of cue points into a TextTrack [#24](https://github.com/brightcove/videojs-playlist/pull/24)

## 2.1.0 (2015-12-30)
* @misteroneill Moved to the generator-videojs-plugin format and added `last()` method [#23](https://github.com/brightcove/videojs-playlist/pull/23)

## 2.0.0 (2015-11-25)
* @misteroneill Updates for video.js 5.x [#22](https://github.com/brightcove/videojs-playlist/pull/22)
* @saramartinez Fix typos in examples for `currentItem()` method [#18](https://github.com/brightcove/videojs-playlist/pull/18)

## 1.0.3 (2015-08-24)
* @forbesjo README update [#16](https://github.com/brightcove/videojs-playlist/pull/16)
* @forbesjo Fix for playlist items without a `src` [#14](https://github.com/brightcove/videojs-playlist/pull/14)

## 1.0.2 (2015-04-09)
* @gkatsev Explicitly define which files are included.

## 1.0.1 (2015-03-30)
* @gkatsev Added missing repository field to `package.json`.

## 1.0.0 (2015-03-30)
* @gkatsev Initial release.
