<template>
  <div class="gallery-demo">
    <Carousel
      ref="galleryRef"
      :items="galleryItems"
      height="43vh"
      width="100%"
      :numColsToShow="2.5"
      gap="1rem"
      :onGetItemAspectRatio="getItemAspectRatio"
      @image-click="handleImageClick"
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
    
    <!-- Full-screen modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click="isModalOpen = false">
      <div class="modal-content" @click.stop>
        <button class="close-button" @click="isModalOpen = false">&times;</button>
        <img v-if="selectedImage" :src="selectedImage.url" class="modal-image" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue'
import { Carousel } from '@vue-infinity/core'
import type { GalleryImage } from '@vue-infinity/core'
import { fetchMockImages } from './mockApi'

const galleryRef = useTemplateRef('galleryRef')
const galleryItems = ref<GalleryImage[]>([])
const currentItemIndex = ref(0)
const isModalOpen = ref(false)
const selectedImage = ref<GalleryImage | null>(null)

const getItemAspectRatio = (item: GalleryImage) => {
  if (item.url) {
    const urlParts = item.url.split('/')
    const width = parseInt(urlParts[urlParts.length - 2], 10)
    const height = parseInt(urlParts[urlParts.length - 1].split('?')[0], 10)
    if (width && height) {
      return width / height
    }
  }
  return 1
}

const handleImageClick = (event: CustomEvent) => {
  console.log('Image clicked:', event)
  const payload = event.detail[0]
  selectedImage.value = payload.image
  isModalOpen.value = true
}

const fetchImages = async () => {
  try {
    const items = await fetchMockImages(300, 0, 300)
    galleryItems.value = items as GalleryImage[]
  } catch (error) {
    console.error('Error fetching images:', error)
  }
}

const onSliderInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  currentItemIndex.value = parseInt(target.value, 10)
}

const onSliderChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const index = parseInt(target.value, 10)
  currentItemIndex.value = index
  
  if (galleryRef.value && typeof galleryRef.value.scrollToItem === 'function') {
    galleryRef.value.scrollToItem(index)
  }
}

const updateGalleryItems = () => {
  if (galleryRef.value && typeof galleryRef.value.updateImages === 'function') {
    galleryRef.value.updateImages(galleryItems.value)
  }
}

onMounted(() => {
  fetchImages().then(() => {
    setTimeout(updateGalleryItems, 0)
  })
})
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.close-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 36px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.7);
}

.modal-image {
  max-width: 80vw;
  max-height: 80vh;
  object-fit: contain;
}
</style>