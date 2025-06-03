<template>
  <div class="playground">
    
    <h1 style="text-align: center;"><img src="/logo.svg" alt="Vue Infinity Logo" class="logo" />Vue-Infinity</h1>
    <h2 style="text-align: center;">InfiniteCarousel Playground</h2>
    
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
      :ItemSpanFn="getItemSpan"
    >
      <template #item="{ item, index }: { item: GalleryItem, index: number }">
        <img :src="item.url" :alt="item.title || `Image ${index}`" class="carousel-img"/>
      </template>
    </InfiniteCarousel>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useInfiniteList } from '../src/composables/useInfiniteList'
import InfiniteCarousel from '../src/components/InfiniteCarousel.vue'
import { fetchMockImages } from './mockApi'
import type { GalleryItem } from './mockApi'


const numRowsToShow = ref(2)
const numColsToShow = ref(2)
const carouselHeight = ref('45vh')
const carouselWidth = ref('100%')
const gapValue = ref('10px')
const numItems = ref(3000)
const verticalScroll = ref(false)
const itemsPerPage = ref(7) // Still needed for the infinite list
const scrollToIndex = ref(0)
const carouselRef = ref<InstanceType<typeof InfiniteCarousel>>()

const scrollToItem = () => {
  if (carouselRef.value) {
    carouselRef.value.scrollToItem(scrollToIndex.value)
  }
}

const getItemSpan = (item: GalleryItem) => {
  if (!item || !item.url) {
    return { colSpan: 1, rowSpan: 1 };
  }

  try {
    const urlParts = item.url.split('/');
    const width = parseInt(urlParts[urlParts.length - 2], 10);
    const height = parseInt(urlParts[urlParts.length - 1].split('?')[0], 10);

    if (width > height) {
      // Landscape
      return { colSpan: 2, rowSpan: 1 };
    } else if (height > width) {
      // Portrait
      return { colSpan: 1, rowSpan: 2 };
    } else {
      // Square
      return { colSpan: 1, rowSpan: 1 };
    }
  } catch (e) {
    console.error("Error parsing image dimensions:", e);
    return { colSpan: 1, rowSpan: 1 };
  }
};

const maxPagesToCache = ref(3)//ref(Math.ceil(numRowsToShow.value * numColsToShow.value * 3 / itemsPerPage.value) + 2) // 3 pages of items to cache

const maxSlides = computed(() => itemsPerPage.value * maxPagesToCache.value)

watch(numRowsToShow, (newVal) => {
  if (newVal > maxSlides.value) {
    console.warn(`Cannot show more than ${maxSlides.value} slides (itemsPerPage * maxPagesToCache)`)
    numRowsToShow.value = Math.min(newVal, maxSlides.value)
  }
})

const fetchItems = async (page: number, signal: AbortSignal) => {
  // console.log('Fetching items for page:', page)
  return await fetchMockImages(numItems.value, page, itemsPerPage.value, signal)
}
const infiniteList = useInfiniteList<GalleryItem>({
  fetchItems,
  itemsPerPage: itemsPerPage.value,
  maxPagesToCache: maxPagesToCache.value
})
const resetGallery = () => {
  // This would need to be implemented if we expose a reset method
  window.location.reload()
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.logo {
  display: block;
  margin: 0 auto 2rem;
  width: 125px; /* Adjust size as needed */
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
  margin-left: auto; /* Push the value to the right */
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