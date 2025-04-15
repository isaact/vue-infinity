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
    <div class="gallery" ref="gallery">
      <template v-for="(page, index) in pages" :key="`page-status-${index}`">
        <template v-if="page.status === 'resolved'">
          <div
            v-for="(item, itemIndex) in pages[index].items"
            :key="`${index}-${itemIndex}`"
            :data-img-index="`${index}-${itemIndex}`"
            :ref="galleryImages.set"
            class="gallery-item"
          >
            <img v-if="visibleImages.has(`${index}-${itemIndex}`)" :src="item.url" :alt="`Image ${index}-${itemIndex}`" />
            <div v-else class="loading-overlay">Loading...</div>
          </div>
        </template>

        <!-- <template v-else-if="page.status === 'pending'">
          <div v-for="(_, itemIdx) in itemsPerPage" :key="`${index}-loading-${itemIdx}`" class="gallery-item">
            <div class="loading-overlay">Loading...</div>
          </div>
        </template> -->

        <template v-else>
          <div class="gallery-item not-loaded" :ref="notLoadedPages.set" :data-page-index="index">
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
import { ref, computed, onMounted, onUnmounted, watch, useTemplateRef, nextTick } from 'vue'
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
const gallery = useTemplateRef('gallery')
const container_size = ref({ width: 0, height: 0 })
const loading = ref(false)
const error = ref(false)
const visibleImages = ref(new Set<string>())
// const pageStatuses = ref<Record<number, string>>({})

const notLoadedPages = useTemplateRefsList()
const galleryImages = useTemplateRefsList()

let pageObserver: IntersectionObserver | null = null
let galleryItemObserver: IntersectionObserver | null = null

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

const onResizeObserver = (entries: any) => {
  const [entry] = entries
  const { width, height } = entry.contentRect
  container_size.value = { width, height }
}


const setupObserver = () => {
  if (!gallery.value) return
  // console.log('Setting up observer for container:', gallery.value)
  pageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // console.log('Page is in view:', entry)
      if (entry.isIntersecting) {
        // console.log('Page is in view:', entry.target)
        const pageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0')
        if (pages[pageIndex].status === 'not-loaded') {
          fetchPage(pageIndex)
        }
      }
    })
  }, {
    root: gallery.value,
    rootMargin: '200%'
  })

  galleryItemObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // console.log('Page is in view:', entry)
      if (entry.isIntersecting) {
        // console.log('Image is in view:', entry)
        const imgIndex = entry.target.getAttribute('data-img-index') || ''
        visibleImages.value.add(imgIndex)
      } else {
        // console.log('Image is not in view:', entry)
        const imgIndex = entry.target.getAttribute('data-img-index') || ''
        visibleImages.value.delete(imgIndex)
      }
    })
  }, {
    root: gallery.value,
    rootMargin: "200%" //`${container_size.value.width * 3}px`,
  }) 


  // Observe all not-loaded pages
  notLoadedPages.value.forEach((page, index) => {
    const pageNum = parseInt(page.getAttribute('data-page-index') || '0')
    // console.log('Observing page:', page, 'Page number:', pageNum)
    if (pages[pageNum]?.status === 'not-loaded') {
      // console.log('Observing page:', page)
      pageObserver?.observe(page)
    }
  })

  // Observe all not-loaded images
  galleryImages.value.forEach((image, index) => {
    const imgIndex = image.getAttribute('data-img-index') || '0'
    // console.log('Observing image:', image, 'Image index:', imgIndex)
    if (!observedImages.has(image)) {
      // console.log('Observing image:', image)
      galleryItemObserver?.observe(image)
    }
  })

}

const observedPages = new Set<Element>()
const observedImages = new Set<Element>()

const observeNewPages = (newPages: Element[]) => {
  if (!pageObserver) return
  
  newPages.forEach(page => {
    const pageNum = parseInt(page.getAttribute('data-page-index') || '0')
    if (pages[pageNum]?.status === 'not-loaded' && !observedPages.has(page)) {
      // console.log('Observing new page:', pageNum)
      pageObserver?.observe(page)
      observedPages.add(page)
    }
  })
}

watch(notLoadedPages, (newPages) => {
  observeNewPages(newPages)
}, { deep: true })

const observeNewImages = (newImages: Element[]) => {
  if (!galleryItemObserver) return
  
  newImages.forEach(image => {
    const imgIndex = image.getAttribute('data-img-index') || '0'
    if (!observedImages.has(image)) {
      // console.log('Observing new image:', imgIndex)
      galleryItemObserver?.observe(image)
      observedImages.add(image)
    }
  })
}
watch(galleryImages, (newImages) => {
  observeNewImages(newImages)
}, { deep: true })

onMounted(() => {
  numPages.value = Math.ceil(props.totalItems / (props.itemsPerPage || 20))
  console.log('Number of pages:', numPages.value, 'Items per page:', props.itemsPerPage, 'Total items:', props.totalItems)
  setupObserver()
  observeNewPages(notLoadedPages.value)
})

onUnmounted(() => {
  pageObserver?.disconnect()
  galleryItemObserver?.disconnect()
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
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  height: var(--container-height);
  width: var(--container-width);
}

.gallery-item {
  position: relative;
  background-color: #f0f0f0;
  width: var(--item-width);
  height: var(--container-height);
  scroll-snap-align: start;
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
