import extend from 'node.extend';
import videojs from 'video.js';

const proxy = (props) => {
  let player = extend(true, {}, videojs.EventTarget.prototype, {
    play: Function.prototype,
    paused: Function.prototype,
    ended: Function.prototype,
    poster: Function.prototype,
    src: Function.prototype,
    addRemoteTextTrack: Function.prototype,
    removeRemoteTextTrack: Function.prototype,
    remoteTextTracks: Function.prototype,
    currentSrc: Function.prototype,
    playlist: {
      autoadvance_: {},
      currentIndex_: -1,
      autoadvance: Function.prototype,
      contains: Function.prototype,
      currentItem: Function.prototype,
      first: Function.prototype,
      indexOf: Function.prototype,
      next: Function.prototype,
      previous: Function.prototype
    }
  }, props);

  player.constructor = videojs.getComponent('Player');
  player.playlist.player_ = player;

  return player;
};

export default proxy;
