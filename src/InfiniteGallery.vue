<template>
  <div class="infinite-gallery" ref="container" v-resize-observer="onResizeObserver"
    :style="{
      '--item-width': `${itemWidth}px`,
      '--not-loaded-width': `${notLoadedWidth}px`,
      '--container-height': props.height,
      '--container-width': props.width
    }">
    <div class="gallery">
      <template v-for="(page_status, index) in pageStatuses" :key="`page-status-${index}`">
        <template v-if="page_status === 'resolved'">
          <div v-if="pages[index]" v-for="(item, itemIndex) in pages[index].items" :key="`${index}-${itemIndex}`"
            class="gallery-item">
            <img :src="item.url" :alt="`Image ${index}-${itemIndex}`" />
          </div>
        </template>
        <template v-else-if="page_status === 'pending'" ref="pendingPages">
          <div v-for="(_, itemIdx) in itemsPerPage" :key="`${index}-loading-${itemIdx}`" class="gallery-item">
            <div class="loading-overlay">Loading...</div>
          </div>
        </template>
        <template v-else>
          <div class="gallery-item not-loaded" ref="notLoadedPages">
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

const container = useTemplateRef('container')
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

const itemWidth = computed(() => {
  const gap = 16 // 1rem in pixels
  return (container_size.value.width - (props.numItemsToShow - 1) * gap) / props.numItemsToShow
})

const notLoadedWidth = computed(() => {
  const gap = 16 // 1rem in pixels
  return itemWidth.value * props.itemsPerPage + (props.itemsPerPage - 1) * gap
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

let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (!container.value) return

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0')
        if (pageStatuses.value[pageIndex] === 'not-loaded') {
          loadMore()
        }
      }
    })
  }, {
    root: container.value,
    threshold: 0.1
  })

  // Observe all not-loaded pages
  const notLoadedPages = container.value.querySelectorAll('[ref="notLoadedPage"]')
  notLoadedPages.forEach((page, index) => {
    page.setAttribute('data-page-index', index.toString())
    observer?.observe(page)
  })
}

onMounted(() => {
  console.log('InfiniteGallery props:', props)
  setupObserver()
  loadMore() // Initial load
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.infinite-gallery {
  overflow-y: auto;
}

.gallery {
  display: flex;
  gap: 1rem;
  overflow-x: scroll;
  height: var(--container-height);
  width: var(--container-width);
}

.gallery-item {
  position: relative;
  background-color: #f0f0f0;
  width: var(--item-width);
  height: var(--container-height);
}

.gallery-item.not-loaded {
  width: var(--not-loaded-width);
  height: var(--container-height);
}

.gallery-item img {
  width: var(--item-width);
  height: var(--container-height);
  object-fit: cover;
}

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.1);
  width: var(--item-width);
  height: var(--container-height);
}
.gallery-item.not-loaded .loading-overlay {
  width: var(--not-loaded-width);
  height: var(--container-height);
}

.loading-indicator,
.error-message {
  padding: 16px;
  text-align: center;
}
</style>