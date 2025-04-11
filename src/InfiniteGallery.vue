<template>
  <div class="infinite-gallery" ref="container" v-resize-observer="onResizeObserver">
    <div class="gallery">
      <template v-for="(page_status, index) in pageStatuses" :key="`page-status-${index}`">
        <template v-if="page_status === 'resolved'">
          <div v-if="pages[index]" v-for="(item, itemIndex) in pages[index].items" :key="`${index}-${itemIndex}`"
            class="gallery-item">
            <img :src="item.url" :alt="`Image ${index}-${itemIndex}`" />
          </div>
        </template>
        <template v-else-if="page_status === 'pending'">
          <div v-for="(_, itemIdx) in itemsPerPage" :key="`${index}-loading-${itemIdx}`" class="gallery-item">
            <div class="loading-overlay">Loading...</div>
          </div>
        </template>
        <template v-else>
          <div class="gallery-item not-loaded">
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useInfiniteList } from './useInfiniteList'
import { vResizeObserver } from '@vueuse/components'
import { get } from 'http';
import { an } from 'vitest/dist/chunks/reporters.d.CfRkRKN2';

interface GalleryItem {
  url: string
  loading?: boolean
}

const props = withDefaults(
  defineProps<{
    fetchItems: (page: number, signal: AbortSignal) => Promise<GalleryItem[]>
    totalItems: number
    height: string
    width: string
    numItemsToShow: number
    itemsPerPage?: number
    maxPagesToCache?: number
  }>(), 
  {
    itemsPerPage: 20,
    maxPagesToCache: 5}
)

const container = ref<HTMLElement | null>(null)
const container_size = ref({ width: 0, height: 0 })
const loading = ref(false)
const error = ref(false)
const startPage = ref(0)
const pageStatuses = ref<Record<number, string>>({})

const { pages, getItem, fetchPage } = useInfiniteList<GalleryItem>({
  fetchItems: props.fetchItems,
  totalItems: props.totalItems,
  itemsPerPage: props.itemsPerPage,
  maxPagesToCache: props.maxPagesToCache
})

const numPages = ref(0)
const initPages = () => {
  numPages.value = Math.ceil(props.totalItems / (props.itemsPerPage || 20))
  console.log('numPages:', numPages.value, props.totalItems, props.itemsPerPage)
  // Initialize all pages with not-loaded status
  pageStatuses.value = {}
  for (let i = 0; i < numPages.value; i++) {
    pageStatuses.value[i] = 'not-loaded'
  }
  startPage.value = 0
}
const onResizeObserver = (entries: any) =>{
  const [entry] = entries
  const { width, height } = entry.contentRect
  container_size.value = { width, height }
}

initPages()

watch(() => props.totalItems, () => {
  initPages()
  loadMore() // Trigger initial load
})

const loadMore = async () => {
  pageStatuses.value[startPage.value] = 'pending'
  await fetchPage(startPage.value)
  pageStatuses.value[startPage.value] = 'resolved'
  startPage.value += 1
  console.log('numPages2:', numPages.value)
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
  console.log('InfiniteGallery props:', props)
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
  height: 100%;
  overflow-y: auto;
}

.gallery {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow-x: scroll;
  height: 30vh;
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