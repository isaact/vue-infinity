<template>
  <div class="playground">
    
    <h1 style="text-align: center;"><img src="/logo.svg" alt="Vue Infinity Logo" class="logo" />Vue-Infinity</h1>
    <h2 style="text-align: center;">Vue-Infinity Demo</h2>

    <div class="demo-section">
      <h3>Ghost component demo</h3>
      <GhostDemo />
    </div>
    <div class="demo-section">
      <h3>Gallery web component demo</h3>
      <GalleryDemo />
    </div>
    <div class="demo-section">
      <h3>InfiniteCarousel component demo</h3>
      <div class="controls">
        <button @click="resetGallery">Reset Gallery</button>
        <label>
          Scroll to item:
          <input type="number" v-model.number="scrollToIndex" :min="0" :max="numItems - 1" />
          <button @click="scrollToItem">Go</button>
        </label>
        <label class="slider-label">
          Slides to show per row: <span>{{ numColsToShow.toFixed(1) }}</span>
          <input type="range" v-model.number="numColsToShow" :min="1" :max="3" step="0.1" />
        </label>
        <label class="slider-label">
          Number of rows: <span>{{ numRowsToShow.toFixed(1) }}</span>
          <input type="range" v-model.number="numRowsToShow" :min="1" :max="3" step="0.1" />
        </label>
        <label>
          Height:
          <input type="text" v-model="carouselHeight" />
        </label>
        <label>
          Width:
          <input type="text" v-model="carouselWidth" />
        </label>
        <label>
          Gap:
          <input type="text" v-model="gapValue" />
        </label>
        <label>
          <input type="checkbox" v-model="verticalScroll" />
          Vertical Scroll
        </label>
      </div>
      <InfiniteCarousel
        ref="carouselRef"
        :infinite-list="infiniteList"
        :height="carouselHeight"
        :width="carouselWidth"
        :numColsToShow="numColsToShow"
        :numRowsToShow="numRowsToShow"
        :gap="gapValue"
        :items-per-page="itemsPerPage"
        :verticalScroll="verticalScroll"
        :onGetItemAspectRatio="getItemAspectRatio"
      >
        <template #item="{ item, index }: { item: GalleryItem, index: number }">
          <img :src="item.url" :alt="item.title || `Image ${index}`" class="carousel-img"/>
        </template>
      </InfiniteCarousel>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, nextTick } from 'vue'
import { useInfiniteList, InfiniteCarousel } from '@vue-infinity/core'
import { fetchMockImages } from './mockApi'
import GhostDemo from './GhostDemo.vue'
import GalleryDemo from './GalleryDemo.vue'
import type { GalleryItem } from './mockApi'

const numRowsToShow = ref(3)
const numColsToShow = ref(3)
const carouselHeight = ref('45vh')
const carouselWidth = ref('100%')
const gapValue = ref('10px')
const numItems = ref(3000)
const verticalScroll = ref(false)
const itemsPerPage = ref(37)
const scrollToIndex = ref(0)
const carouselRef = ref<InstanceType<typeof InfiniteCarousel>>()

const scrollToItem = () => {
  if (carouselRef.value) {
    carouselRef.value.scrollToItem(scrollToIndex.value)
  }
}

const getItemAspectRatio = (item: GalleryItem): number => {
  if (!item || !item.url) {
    return 1
  }
  try {
    const urlParts = item.url.split('/')
    const width = parseInt(urlParts[urlParts.length - 2], 10)
    const height = parseInt(urlParts[urlParts.length - 1].split('?')[0], 10)
    return width / height
  } catch {
    return 1
  }
}

const maxPagesToCache = ref(5)

const maxSlides = computed(() => itemsPerPage.value * maxPagesToCache.value)

watch(numRowsToShow, (newVal) => {
  if (newVal > maxSlides.value) {
    console.warn(`Cannot show more than ${maxSlides.value} slides (itemsPerPage * maxPagesToCache)`)
    numRowsToShow.value = Math.min(newVal, maxSlides.value)
  }
})

const fetchItems = async (page: number, signal: AbortSignal) => {
  return await fetchMockImages(numItems.value, page, itemsPerPage.value, signal)
}

const infiniteList = useInfiniteList<GalleryItem>({
  fetchItems,
  itemsPerPage: itemsPerPage.value,
  maxPagesToCache: maxPagesToCache.value,
})

const resetGallery = () => {
  window.location.reload()
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.demo-section {
  margin-bottom: 2rem;
  background-color: #ffffff0d;
  padding: 2rem;
  border-radius: 10px;
  box-shadow:
    inset 0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.06),
    0 2px 6px rgba(0, 0, 0, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.06);
}

.logo {
  display: block;
  margin: 0 auto 2rem;
  width: 125px;
  height: auto;
}

.playground {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #1a1a1a;
  color: #ffffff;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

h1 {
  color: #42b883;
  font-weight: 600;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  line-height: 1.2;
}
h3 {
  color: #42b883;
  margin-top: 0;
  margin-bottom: 1rem;
}

.controls {
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e0e0e0;
}

.controls .slider-label {
  flex-direction: column;
  align-items: flex-start;
}

.controls .slider-label span {
  margin-left: auto;
  font-weight: bold;
}

.controls input[type="number"],
.controls input[type="text"] {
  padding: 6px 8px;
  border: 1px solid #35495e;
  border-radius: 4px;
  background-color: #2c3e50;
  color: #ffffff;
  width: 80px;
}

button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3aa876;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  display: block;
}
</style>