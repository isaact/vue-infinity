<template>
  <div class="gallery-demo">
    <h1>Image Gallery Demo</h1>
    
    <!-- Gallery with fetched images -->
    <h2>Gallery with Mock API Images</h2>
    <vue-gallery
      :items="JSON.stringify(galleryItems)"
      height="400px"
      :numColsToShow="3"
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
    const items = await fetchMockImages(20, 0, 20);
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
}

h2 {
  margin-top: 3rem;
  margin-bottom: 1rem;
}
</style>