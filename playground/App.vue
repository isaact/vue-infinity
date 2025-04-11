<template>
  <div class="playground">
    <h1>InfiniteGallery Playground</h1>
    
    <div class="controls">
      <button @click="resetGallery">Reset Gallery</button>
      <label>
        Items per page:
        <input type="number" v-model.number="itemsPerPage" min="1" max="100" />
      </label>
    </div>

    <InfiniteGallery
      :fetch-items="fetchItems"
      :total-items="numItems"
      height="'33vh'"
      width="auto"
      :num-items-to-show="3"
      :items-per-page="itemsPerPage"
      :maxPagesToCache="3"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import InfiniteGallery from '../src/InfiniteGallery.vue'
import { fetchMockImages, getMockImageCount } from './mockApi'

const itemsPerPage = ref(20)
const numItems = ref(0)

onBeforeMount(async () => {
  numItems.value = await getMockImageCount()
})

const fetchItems = async (page: number, signal: AbortSignal) => {
    console.log('Fetching items for page:', page)
  return await fetchMockImages(page, itemsPerPage.value, signal)
}

const resetGallery = () => {
  // This would need to be implemented if we expose a reset method
  window.location.reload()
}

// onBeforeMount(async () => {
//   numItems.value = await getMockImageCount()
// })
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