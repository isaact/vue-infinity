<template>
  <div class="gallery-demo">
    <vue-gallery
      :items="JSON.stringify(galleryItems)"
      height="43vh"
      :numColsToShow="2.5"
      gap="1rem"
      :onGetItemAspectRatio="getItemAspectRatio"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchMockImages, GalleryItem } from './mockApi';

const galleryItems = ref<GalleryItem[]>([]);

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

onMounted(() => {
  fetchImages();
});
</script>

<style scoped>
.gallery-demo {
  width: 100%;
  margin: 0 auto;
}
</style>