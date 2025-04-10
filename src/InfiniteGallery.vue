<template>
  <div class="infinite-gallery" ref="container">
    <div class="gallery-grid">
        <template v-for="pageNum in numPages" :key="pageNum">
          <template v-if="pages[pageNum]?.status === 'resolved'">
            <div v-for="(item, itemIndex) in pages[pageNum].items" :key="itemIndex" class="gallery-item">
              <img :src="item.url" :alt="`Image ${pageNum}-${itemIndex}`" @load="" />
            </div>
          </template>
          <template v-else-if="pages[pageNum]?.status === 'pending'">
            <div v-for="(_, index) in Array(pages[pageNum].items.length)" :key="index" class="gallery-item">
              <div class="loading-overlay">Loading...</div>
            </div>
          </template>
          <template v-else>
            <div class="gallery-item">
              <div class="loading-overlay">Page not loaded</div>
            </div>
          </template>
        </template>
      </div>
    <div v-if="loading" class="loading-indicator">Loading more images...</div>
    <div v-if="error" class="error-message">Error loading images</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInfiniteList } from './useInfiniteList'
import { get } from 'http';

interface GalleryItem {
  url: string
  loading?: boolean
}

const props = defineProps<{
  fetchItems: (page: number, signal: AbortSignal) => Promise<GalleryItem[]>
  getItemCount: () => Promise<number>
  itemsPerPage?: number
  maxPages?: number
}>()

const container = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref(false)
const numItems = ref(0)
const startPage = ref(0)

const { pages, getItem, getItemCount, fetchPage } = useInfiniteList<GalleryItem>({
  fetchItems: props.fetchItems,
  getItemCount: props.getItemCount,
  itemsPerPage: props.itemsPerPage || 20,
  maxPages: props.maxPages || 5
})
console.log('pages', pages)

const numPages = computed(() => {
  return Math.ceil(numItems.value / (props.itemsPerPage || 20))
})

const loadMore = async () => {
  numItems.value = await props.getItemCount()
  await fetchPage(startPage.value)
  startPage.value += 1
}

const onScroll = () => {
  if (!container.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = container.value
  const threshold = 700 // pixels from bottom
  
  if (scrollHeight - (scrollTop + clientHeight) < threshold) {
    loadMore()
  }
}

onMounted(() => {
  if (container.value) {
    container.value.addEventListener('scroll', onScroll)
  }
  loadMore() // Initial load
})

onUnmounted(() => {
  if (container.value) {
    container.value.removeEventListener('scroll', onScroll)
  }
})
</script>

<style scoped>
.infinite-gallery {
  height: 100vh;
  overflow-y: auto;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  background-color: #f0f0f0;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.1);
}

.loading-indicator,
.error-message {
  padding: 16px;
  text-align: center;
}
</style>