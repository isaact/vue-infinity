<template>
  <div
    class="infinite-gallery"
    ref="container"
    v-resize-observer="onResizeObserver"
    :style="{
      '--item-width': `${itemWidth}px`,
      '--not-loaded-width': `${notLoadedWidth}px`,
      '--container-height': props.height,
      '--container-width': props.width
    }"
  >
    <div class="gallery">
      <template v-for="pageNum in numPages" :key="`page-status-${pageNum}`">
        <template v-if="pages[pageNum].status === 'resolved'">
          <div
            v-for="(item, itemIndex) in pages[pageNum].items"
            :key="`${pageNum}-${itemIndex}`"
            class="gallery-item"
          >
            <img :src="item.url" :alt="`Image ${pageNum}-${itemIndex}`" />
          </div>
        </template>

        <template v-else-if="pages[pageNum].status === 'pending'">
          <div v-for="(_, itemIdx) in itemsPerPage" :key="`${pageNum}-loading-${itemIdx}`" class="gallery-item">
            <div class="loading-overlay">Loading...</div>
          </div>
        </template>

        <template v-else>
          <div class="gallery-item not-loaded" :ref="notLoadedPages.set">
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
import { ref, computed, onMounted, onUnmounted, watch, useTemplateRef } from 'vue'
import { useTemplateRefsList } from '@vueuse/core'
import { vResizeObserver } from '@vueuse/components'
import { useInfiniteList } from './useInfiniteList'

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
    maxPagesToCache: 5
  }
)

const container = useTemplateRef('container')
const container_size = ref({ width: 0, height: 0 })
const loading = ref(false)
const error = ref(false)
const startPage = ref(0)
// const pageStatuses = ref<Record<number, string>>({})

const notLoadedPages = useTemplateRefsList()

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
// const initPages = () => {
//   numPages.value = Math.ceil(props.totalItems / (props.itemsPerPage || 20))
//   pageStatuses.value = {}
//   for (let i = 0; i < numPages.value; i++) {
//     pageStatuses.value[i] = 'not-loaded'
//   }
//   startPage.value = 0
// }

const onResizeObserver = (entries: any) => {
  const [entry] = entries
  const { width, height } = entry.contentRect
  container_size.value = { width, height }
}

// watch(() => props.totalItems, () => {
//   initPages()
//   loadMore()
// })

const loadMore = async () => {
  // pageStatuses.value[startPage.value] = 'pending'
  await fetchPage(startPage.value)
  // pageStatuses.value[startPage.value] = 'resolved'
  startPage.value += 1
}

let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (!container.value) return
  console.log('Setting up observer for container:', container.value)
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        console.log('Page is in view:', entry.target)
        const pageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0')
        if (pages[pageIndex].status === 'not-loaded') {
          fetchPage(pageIndex)
        }
      }
    })
  }, {
    root: container.value,
    threshold: 0.1
  })

  // Observe all not-loaded pages
  notLoadedPages.value.forEach((page, index) => {
    page.setAttribute('data-page-index', index.toString())
    observer?.observe(page)
  })
}

onMounted(() => {
  numPages.value = Math.ceil(props.totalItems / (props.itemsPerPage || 20))
  console.log('Number of pages:', numPages.value, 'Items per page:', props.itemsPerPage, 'Total items:', props.totalItems)
  setupObserver()
  // loadMore()
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
