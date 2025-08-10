<template>
  <div class="gallery-demo">
    <vue-gallery
      ref="galleryRef"
      :items="JSON.stringify([])"
      height="43vh"
      :numColsToShow="2.5"
      gap="1rem"
      :onGetItemAspectRatio="getItemAspectRatio"
    />
    
    <div class="controls">
      <input
        type="range"
        min="0"
        :max="galleryItems.length - 1"
        v-model="currentItemIndex"
        @change="onSliderChange"
        @input="onSliderInput"
        class="slider"
      />
      <p>Current Item: {{ currentItemIndex }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue';
import { fetchMockImages, GalleryItem } from './mockApi';

const galleryRef = useTemplateRef('galleryRef')
const galleryItems = ref<GalleryItem[]>([]);
const currentItemIndex = ref(0);

// Function to calculate aspect ratio for images
const getItemAspectRatio = (item: GalleryItem) => {
  if (item.url) {
    // Extract width and height from the URL
    const urlParts = item.url.split('/');
    const width = parseInt(urlParts[urlParts.length - 2], 10);
    const height = parseInt(urlParts[urlParts.length - 1].split('?')[0], 10);
    
    if (width && height) {
      return width / height;
    }
  }
  return 1; // default
};

// Fetch images from mock API
const fetchImages = async () => {
  try {
    const items = await fetchMockImages(300, 0, 300);
    galleryItems.value = items;
  } catch (error) {
    console.error('Error fetching images:', error);
  }
};

// Handle slider input (while dragging)
const onSliderInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  currentItemIndex.value = parseInt(target.value, 10);
};

// Handle slider change (when released)
const onSliderChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const index = parseInt(target.value, 10);
  currentItemIndex.value = index;
  
  // Scroll to the selected item
  if (galleryRef.value && typeof galleryRef.value.scrollToItem === 'function') {
    galleryRef.value.scrollToItem(index);
  }
};

// Update gallery items using the updateImages method
const updateGalleryItems = () => {
  if (galleryRef.value && typeof galleryRef.value.updateImages === 'function') {
    galleryRef.value.updateImages(galleryItems.value);
  }
};

onMounted(() => {
  fetchImages().then(() => {
    // Update gallery items after fetching
    setTimeout(updateGalleryItems, 0);
  });
});
</script>

<style scoped>
.gallery-demo {
  width: 100%;
  margin: 0 auto;
}

.controls {
  margin-top: 20px;
  text-align: center;
}

.slider {
  width: 80%;
  margin: 10px auto;
  display: block;
}
</style>