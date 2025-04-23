<template>
  <div
    class="infinite-carousel"
    ref="container"
    v-resize-observer="onResizeObserver"
    :style="{
      '--item-width': `${itemWidth}px`,
      '--item-height': `${itemHeight}px`,
      '--not-loaded-width': `${notLoadedWidth}px`,
      '--container-height': props.height,
      '--container-width': props.width
    }"
  >
    <div class="carousel" ref="carousel" :style="{ gap: props.gap }">
      <template v-for="(page, index) in pages" :key="`page-status-${index}`">
        <template v-if="page.status === 'resolved' || page.status === 'pending'">
          <div
            v-for="(item, itemIndex) in getPageItems(index)"
            :key="`${index}-${itemIndex}`"
            :data-img-index="`${index}-${itemIndex}`"
            :data-page-index="index"
            :ref="carouselItems.set"
            class="carousel-item"
          >
            <slot name="item" v-if="visibleImages.has(`${index}-${itemIndex}`) && page.status === 'resolved'" :item="item" :index="`${index}-${itemIndex}`" />
            <slot name="loading" v-else :index="`${index}-${itemIndex}`">
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
import { useAutoObserver, type AutoObserver } from './useAutoObserver'

const props = withDefaults(
  defineProps<{
    infiniteList: InfiniteList<any>
    height: string
    width: string
    numColsToShow?: number
    numRowsToShow?: number
    itemsPerPage?: number
    gap?: string
  }>(),
  {
    gap: '1rem',
    numColsToShow: 1,
    numRowsToShow: 1,
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

let pageObserver: AutoObserver | null = null
let carouselItemObserver: AutoObserver | null = null

const { pages, getItem, fetchPage } = props.infiniteList

const getPageItems = (index: number) => {
  if (pages[index].status === 'pending') {
    return Array(props.itemsPerPage).fill(null)
  }
  return pages[index].items
}

const gapInPixels = ref(0) // 1rem in pixels

const itemWidth = computed(() => {
  const gap = 0 // 1rem in pixels
  return (container_size.value.width - (props.numColsToShow - 1) * gapInPixels.value) / props.numColsToShow
})

const itemHeight = computed(() => {
  return Math.floor((container_size.value.height - (props.numRowsToShow - 1) * gapInPixels.value) / props.numRowsToShow)
})

const notLoadedWidth = computed(() => {
  return itemWidth.value * props.itemsPerPage + (props.itemsPerPage - 1) * gapInPixels.value
})

const numPages = ref(0)

const onResizeObserver = (entries: any) => {
  const [entry] = entries
  const { width, height } = entry.contentRect
  container_size.value = { width, height }
  if (carousel.value) {
    gapInPixels.value = parseFloat(getComputedStyle(carousel.value).gap) // 1rem in pixels
  }
}


const setupObserver = () => {
  if (!carousel.value) return
  // console.log('Setting up observer for container:', carousel.value)
  pageObserver =  useAutoObserver(carousel, (entries) => {
    entries.forEach(entry => {
      // console.log('Page is in view:', entry)
      if (entry.isIntersecting) {
        // console.log('Page is in view:', entry)
        // console.log('Intersection ratio:', entry.intersectionRatio)
        const pageIndex = entry.target.getAttribute('data-page-index')
        if (pageIndex && pages[+pageIndex].status === 'not-loaded') {
          // observedPages.delete(entry.target)
          // pageObserver?.unobserve(entry.target)
          fetchPage(+pageIndex)
          // console.log('Unobserved page:', pageIndex)
        }
      }
    })
  }, {
    filter: el => notLoadedPages.value.includes(el),
    root: carousel.value,
    rootMargin: '300%'
  })

  carouselItemObserver = useAutoObserver(carousel, (entries) => {
    entries.forEach(entry => {
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
    filter: el => carouselItems.value.includes(el),
    rootMargin: "200%" //`${container_size.value.width * 3}px`,
  }) 
}

onMounted(() => {
  numPages.value = Object.keys(pages).length
  if (carousel.value) {
    console.log('Carousel element:', carousel.value)
    gapInPixels.value = parseFloat(getComputedStyle(carousel.value).gap) // 1rem in pixels
  }
  // console.log('Number of pages:', numPages.value)
  // console.log('notLoadedPages:', notLoadedPages.value)
  setupObserver()
  // updateObservedPages(notLoadedPages.value, [])
})

onUnmounted(() => {
  pageObserver?.disconnect()
  carouselItemObserver?.disconnect()
})

const scrollToItem = async (itemIndex: number) => {
  if (!carousel.value) return
  
  const pageIndex = Math.floor(itemIndex / props.itemsPerPage)
  const itemInPage = itemIndex % props.itemsPerPage
  
  // First ensure the page is loaded
  if (pages[pageIndex]?.status !== 'resolved') {
    await fetchPage(pageIndex)
  }

  // Wait for the item to be rendered
  const checkItem = () => {
    return new Promise<void>((resolve) => {
      const itemElement = carouselItems.value.find(el =>
        el?.getAttribute('data-img-index') === `${pageIndex}-${itemInPage}`
      )
      
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        })
        resolve()
      } else {
        // If not found yet, wait and check again
        setTimeout(() => checkItem().then(resolve), 50)
      }
    })
  }

  await checkItem()
}

defineExpose({
  scrollToItem
})
</script>

<style scoped>
.infinite-carousel {
  overflow: hidden;
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
  height: var(--item-height);
  scroll-snap-align: start;
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
