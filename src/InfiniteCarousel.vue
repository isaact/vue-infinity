<template>
  <div
    class="infinite-carousel"
    ref="container"
    v-resize-observer="onResizeObserver"
    :style="{
      '--item-width': `${itemWidth}px`,
      '--not-loaded-width': `${notLoadedWidth}px`,
      '--container-height': props.height,
      '--container-width': props.width
    }"
  >
    <div class="carousel" ref="carousel">
      <template v-for="(page, index) in pages" :key="`page-status-${index}`">
        <template v-if="page.status === 'resolved'">
          <div
            v-for="(item, itemIndex) in pages[index].items"
            :key="`${index}-${itemIndex}`"
            :data-img-index="`${index}-${itemIndex}`"
            :ref="carouselItems.set"
            class="carousel-item"
          >
            <slot name="item" v-if="visibleImages.has(`${index}-${itemIndex}`)" :item="item" :index="`${index}-${itemIndex}`" />
            <slot name="loading" v-else :item="item" :index="`${index}-${itemIndex}`">
              <div class="loading-overlay">Loading...</div>
            </slot>
          </div>
        </template>

        <template v-else>
          <div class="carousel-item not-loaded" :ref="notLoadedPages.set" :data-page-index="index">
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
import { InfiniteList } from './useInfiniteList'

const props = withDefaults(
  defineProps<{
    infiniteList: InfiniteList<any>
    height: string
    width: string
    numItemsToShow: number
    itemsPerPage?: number
  }>(),
  {
    itemsPerPage: 20,
    maxPagesToCache: 5
  }
)

const carousel = useTemplateRef('carousel')
const container_size = ref({ width: 0, height: 0 })
const loading = ref(false)
const error = ref(false)
const visibleImages = ref(new Set<string>())
// const pageStatuses = ref<Record<number, string>>({})

const notLoadedPages = useTemplateRefsList()
const carouselItems = useTemplateRefsList()

let pageObserver: IntersectionObserver | null = null
let carouselItemObserver: IntersectionObserver | null = null

const { pages, getItem, fetchPage } = props.infiniteList

const itemWidth = computed(() => {
  const gap = 0 // 1rem in pixels
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
  if (!carousel.value) return
  // console.log('Setting up observer for container:', carousel.value)
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
    root: carousel.value,
    rootMargin: '200%'
  })

  carouselItemObserver = new IntersectionObserver((entries) => {
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
    root: carousel.value,
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
  carouselItems.value.forEach((image, index) => {
    const imgIndex = image.getAttribute('data-img-index') || '0'
    // console.log('Observing image:', image, 'Image index:', imgIndex)
    if (!observedImages.has(image)) {
      // console.log('Observing image:', image)
      carouselItemObserver?.observe(image)
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
  if (!carouselItemObserver) return
  
  newImages.forEach(image => {
    const imgIndex = image.getAttribute('data-img-index') || '0'
    if (!observedImages.has(image)) {
      // console.log('Observing new image:', imgIndex)
      carouselItemObserver?.observe(image)
      observedImages.add(image)
    }
  })
}
watch(carouselItems, (newImages) => {
  observeNewImages(newImages)
}, { deep: true })

onMounted(() => {
  numPages.value = Object.keys(pages).length
  console.log('Number of pages:', numPages.value)
  setupObserver()
  observeNewPages(notLoadedPages.value)
})

onUnmounted(() => {
  pageObserver?.disconnect()
  carouselItemObserver?.disconnect()
})
</script>

<style scoped>
.infinite-carousel {
  overflow-y: auto;
}

.carousel {
  display: flex;
  overflow-x: scroll;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  height: var(--container-height);
  width: var(--container-width);
  flex-direction: column;
  flex-wrap: wrap;
}

.carousel-item {
  position: relative;
  width: var(--item-width);
  height: var(--container-height);
  scroll-snap-align: start;
  transition: transform 0.2s ease;
}

.carousel-item.currentSlide {
  transform: scale(1.03);
}

.carousel-item.not-loaded {
  width: var(--not-loaded-width);
  height: var(--container-height);
}

.carousel-item img {
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

.carousel-item.not-loaded .loading-overlay {
  width: var(--not-loaded-width);
  height: var(--container-height);
}

.loading-indicator,
.error-message {
  padding: 16px;
  text-align: center;
}
</style>
