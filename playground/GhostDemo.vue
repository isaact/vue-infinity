<template>
  <div>
    <p>Ghost component demo: video unloads when not visible.</p>
    <p class="video-credit">
      Video by Giorgi Chkhaidze from Pexels:<br/>
      <a href="https://www.pexels.com/video/drone-footage-of-a-forested-mountain-range-at-sunset-19453544/" target="_blank" rel="noopener noreferrer">
        Drone footage of a forested mountain range at sunset
      </a>
    </p>
    <p>Video Status: {{ activeTab === 'directive' ? directiveVideoStatus : componentVideoStatus }})</p>
    <div class="tabs">
      <button @click="activeTab = 'directive'" :class="{ active: activeTab === 'directive' }">Directive Mode</button>
      <button @click="activeTab = 'component'" :class="{ active: activeTab === 'component' }">Component Mode</button>
    </div>
    <div v-if="activeTab === 'directive'">
      <p>The <code>v-ghost</code> directive is used to conditionally render the video.</p>
      <div class="scrollable-ghost-container">
        <div
          style="padding-bottom: 80vh;"
        >
          <video
            v-ghost="{
              rootMargin: '22%',
              onLoad: handleGhostVisible,
              onUnload: handleGhostNotVisible,
            }"
            ref="videoPlayer" width="100%" height="100%" loop controls>
            <source src="/gliding.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <p style="text-align: center;">Scroll down to unload the video.</p>
        </div>
      </div>
    </div>
    <div v-if="activeTab === 'component'">
      <p>The <code>&lt;Ghost&gt;</code> component is used to conditionally render the video.</p>
      <div class="scrollable-ghost-container">
        <div
          style="padding-bottom: 80vh;"
        >
          <Ghost
            :rootMargin="'22%'"
            @on-load="handleGhostVisible"
            @on-unload="handleGhostNotVisible"
          >
            <video
              ref="videoPlayer" width="100%" height="100%" loop controls>
              <source src="/gliding.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Ghost>
          <p style="text-align: center;">Scroll down to unload the video.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import { vGhost, Ghost } from '../src/index';

const activeTab = ref('directive');

const videoPlayer = ref<HTMLVideoElement | null>(null);
const videoPlaybackTime = ref(0);
const videoIsPlaying = ref(false);
const directiveVideoStatus = ref('Loaded');
const componentVideoStatus = ref('Loaded');

const setupVideoPlayer = () => {
  if (videoPlayer.value) {
    const player = videoPlayer.value;
    player.currentTime = videoPlaybackTime.value; // Restore playback time
    player.playbackRate = 0.3; // Example: Reset playback rate if needed, or remove if not
    if (videoIsPlaying.value) {
      player.play().catch(error => console.error("Error playing video:", error));
    } else {
      player.pause(); // Ensure it's paused if not playing
    }

    // Remove existing listeners to prevent duplicates if setupVideoPlayer is called multiple times
    // This is a simplified approach; for robust listener management, consider named functions for removal.
    const timeUpdateHandler = () => {
      if (player) {
        videoPlaybackTime.value = player.currentTime;
      }
    };
    player.removeEventListener('timeupdate', timeUpdateHandler); // May not work if handler is redefined each call
    player.addEventListener('timeupdate', timeUpdateHandler);


    const playHandler = () => {
      videoIsPlaying.value = true;
    };
    player.removeEventListener('play', playHandler);
    player.addEventListener('play', playHandler);

    const pauseHandler = () => {
      nextTick(() => {
        if (videoPlayer.value) { // Pause only if videoPlayer is still in the DOM
          videoPlaybackTime.value = videoPlayer.value.currentTime;
          videoIsPlaying.value = false;
        }
      });
    };
    player.removeEventListener('pause', pauseHandler);
    player.addEventListener('pause', pauseHandler);

  } else {
    console.log('Video player not found in DOM yet for GhostDemo.');
  }
};

const handleGhostVisible = () => {
  // console.log('GhostDemo: Ghost became visible');
  if (activeTab.value === 'directive') {
    directiveVideoStatus.value = 'Loaded';
  } else {
    componentVideoStatus.value = 'Loaded';
  }
  setupVideoPlayer();
};

const handleGhostNotVisible = () => {
  // console.log('GhostDemo: Ghost became not visible (on-unload)');
  if (activeTab.value === 'directive') {
    directiveVideoStatus.value = 'Unloaded';
  } else {
    componentVideoStatus.value = 'Unloaded';
  }
  if (!videoPlayer.value) {
    // videoIsPlaying.value is updated by the 'pause' event listener
    // videoPlaybackTime.value is updated by 'timeupdate' and 'pause'
    // videoPlayer.value.pause(); // Ensure it's paused if necessary, though Ghost might handle this
  }
};
watch(activeTab, () => {
  videoPlaybackTime.value = 0;
  videoIsPlaying.value = false;
  nextTick(() => {
    if (videoPlayer.value) {
      setupVideoPlayer();
    }
  });
});
</script>

<style scoped>
.scrollable-ghost-container {
  max-height: 40vh;
  overflow-y: auto; /* Allow vertical scrolling */
  border: 1px dashed #42b883; /* Optional: to visualize the container */
  padding: 10px;
  margin-bottom: 20px; /* Space below the container */
  flex-direction: column; /* Stack children vertically */
}

p {
  color: #e0e0e0; /* Match playground style */
  margin-bottom: 0.5rem;
}

.video-credit {
  font-size: 0.8em;
  color: #aaa;
}

.video-credit a {
  color: #42b883;
}
h3 {
 color: #42b883; /* Match playground style */
 margin-top: 1.5rem;
 margin-bottom: 1rem;
}
.tabs {
  margin-bottom: 1rem;
}
.tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid #42b883;
  background-color: transparent;
  color: #42b883;
  cursor: pointer;
  margin-right: 0.5rem;
  border-radius: 4px;
}
.tabs button:hover {
  background-color: #42b883;
  color: #1e1e1e;
}
.tabs button.active {
  background-color: #42b883;
  color: #fff;
}
code {
  background-color: #2c2c2c;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: #e0e0e0;
}
</style>