import document from 'global/document';
import videojs from 'video.js';

export function destroyFixturePlayer(context) {
  context.player.dispose();
}

export function createFixturePlayer(context) {
  context.video = document.createElement('video');
  context.fixture = document.querySelector('#qunit-fixture');
  context.fixture.appendChild(context.video);

  context.playerIsReady = false;
  context.player = videojs(context.video, {}, () => {
    context.playerIsReady = true;
  });

  context.player.playlist();
}
