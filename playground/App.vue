<template>
  <div class="playground">
    <h1>InfiniteCarousel Playground</h1>
    
    <div class="controls">
      <button @click="resetGallery">Reset Gallery</button>
      <label>
        Items per page:
        <input type="number" v-model.number="itemsPerPage" min="1" max="100" />
      </label>
    </div>

    <InfiniteCarousel
      :fetch-items="fetchItems"
      :total-items="numItems"
      height="33vh"
      width="100%"
      :num-items-to-show="1.1"
      :items-per-page="itemsPerPage"
      :maxPagesToCache="3"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import InfiniteCarousel from '../src/InfiniteCarousel.vue'
import { fetchMockImages } from './mockApi'

const itemsPerPage = ref(20)
const numItems = ref(1000)

const fetchItems = async (page: number, signal: AbortSignal) => {
    console.log('Fetching items for page:', page)
  return await fetchMockImages(page, itemsPerPage.value, signal)
}

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
  gap: 20px;
  align-items: center;
}
</style>