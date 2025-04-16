<template>
  <div class="playground">
    <h1>InfiniteCarousel Playground</h1>
    
    <div class="controls">
      <button @click="resetGallery">Reset Gallery</button>
      <label>
        Slides to show:
        <input type="number" v-model.number="numItemsToShow" min="1" max="10" step="0.1" />
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
        Total items:
        <input type="number" v-model.number="numItems" min="1" max="10000" />
      </label>
    </div>

    <InfiniteCarousel
      :infinite-list="infiniteList"
      :height="carouselHeight"
      :width="carouselWidth"
      :num-items-to-show="numItemsToShow"
    >
      <template #item="{ item, index }">
        <img :src="item.url" :alt="item.title || `Image ${index}`" class="carousel-img"/>
      </template>
    </InfiniteCarousel>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import type { InfiniteList } from '../src/useInfiniteList'
import { useInfiniteList } from '../src/useInfiniteList'
import InfiniteCarousel from '../src/InfiniteCarousel.vue'
import { fetchMockImages } from './mockApi'
import type { GalleryItem } from './mockApi'


const numItemsToShow = ref(1.1)
const carouselHeight = ref('33vh')
const carouselWidth = ref('100%')
const numItems = ref(1000)
const itemsPerPage = ref(20) // Still needed for the infinite list

const fetchItems = async (page: number, signal: AbortSignal) => {
    console.log('Fetching items for page:', page)
  return await fetchMockImages(numItems.value, page, itemsPerPage.value, signal)
}
const infiniteList = useInfiniteList<GalleryItem>({
  fetchItems,
  totalItems: numItems.value,
  itemsPerPage: itemsPerPage.value,
  maxPagesToCache: 3
})
const resetGallery = () => {
  // This would need to be implemented if we expose a reset method
  window.location.reload()
}

</script>

<style scoped>
.playground {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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
}

.controls input[type="number"],
.controls input[type="text"] {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 80px;
}
.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); */
  display: block;
}
</style>