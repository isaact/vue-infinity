<template>
  <div>
    <h3 style="">Ghost component demo (Unloaded: {{ videoUnloadCount }})</h3>
    <p>Ghost component demo: video unloads when not visible.</p>
    <p class="video-credit">
      Video by Giorgi Chkhaidze from Pexels:<br/>
      <a href="https://www.pexels.com/video/drone-footage-of-a-forested-mountain-range-at-sunset-19453544/" target="_blank" rel="noopener noreferrer">
        Drone footage of a forested mountain range at sunset
      </a>
    </p>
    <div class="scrollable-ghost-container">
      <Ghost @on-load="handleGhostVisible" @on-unload="handleGhostNotVisible" style="padding-bottom: 80vh;">
        <div>
        <video ref="videoPlayer" width="100%" height="100%" loop controls>
          <source src="/gliding.mp4" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <p style="text-align: center;">Scroll down to unload the video.</p>
        </div>
      </Ghost>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import Ghost from '../src/components/Ghost.vue'; // Adjusted path

const videoPlayer = ref<HTMLVideoElement | null>(null);
const videoPlaybackTime = ref(0);
const videoUnloadCount = ref(0);
const videoIsPlaying = ref(false);

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
        if (videoPlayer.value) {
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
  console.log('GhostDemo: Ghost became visible');
  setupVideoPlayer();
};

const handleGhostNotVisible = (e) => {
  console.log('GhostDemo: Ghost became not visible (on-unload)');
  if (!videoPlayer.value) {
    // videoIsPlaying.value is updated by the 'pause' event listener
    // videoPlaybackTime.value is updated by 'timeupdate' and 'pause'
    // videoPlayer.value.pause(); // Ensure it's paused if necessary, though Ghost might handle this
    videoUnloadCount.value++;
  }
};
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
</style>