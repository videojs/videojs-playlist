import window from 'global/window';
import extend from 'node.extend';
import videojs from 'video.js';

const proxy = (props) => {
  const player = extend(true, {}, videojs.EventTarget.prototype, {
    play: () => {},
    paused: () => {},
    ended: () => {},
    poster: () => {},
    src: () => {},
    currentSrc: () => {},
    addRemoteTextTrack: () => {},
    removeRemoteTextTrack: () => {},
    remoteTextTracks: () => {},
    playlist: {
      autoadvance_: {},
      currentIndex_: -1,
      autoadvance: () => {},
      contains: () => {},
      currentItem: () => {},
      first: () => {},
      indexOf: () => {},
      next: () => {},
      previous: () => {}
    },
    ready: (cb) => cb(),
    setTimeout: (cb, wait) => window.setTimeout(cb, wait),
    clearTimeout: (id) => window.clearTimeout(id)
  }, props);

  player.constructor = videojs.getComponent('Player');
  player.playlist.player_ = player;

  return player;
};

export default proxy;
