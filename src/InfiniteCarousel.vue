<template>
  <div
    class="infinite-carousel"
    ref="container"
    :style="{
      '--item-width': `${itemWidth}px`,
      '--item-height': `${itemHeight}px`,
      '--num-cols-to-show': props.numColsToShow,
      '--num-rows-to-show': props.numRowsToShow,
      '--gap-in-px': `${gapInPixels}px`,
      '--not-loaded-col-span': notLoadedColSpan,
      '--not-loaded-row-span': notLoadedRowSpan,
      '--container-height': props.height,
      '--container-width': props.width
    }"
  >
    <div class="carousel"
          ref="carousel" 
          :style="{ gap: props.gap }" 
          :class="{ vertical: props.verticalScroll }"
          v-resize-observer="onResizeObserver">
      <!-- <template v-if="tryPreviousPage">
        <div class="carousel-item not-loaded" :ref="notLoadedPages.set" :data-page-index="nextPageToTry">
          <div class="loading-overlay">Page not loaded</div>
        </div>
      </template> -->
      <template v-for="index in pagesToTry" :key="`page-status-${index}`">
        <template v-if="pages[index] && (pages[index].status === 'resolved' || pages[index].status === 'pending')">
          <div
            v-for="(item, itemIndex) in getPageItems(index)"
            :key="`${index}-${itemIndex}`"
            :data-img-index="`${index}-${itemIndex}`"
            :data-page-index="index"
            :ref="carouselItems.set"
            class="carousel-item"
          >
            <slot name="item" v-if="visibleImages.has(`${index}-${itemIndex}`) && pages[index].status === 'resolved'" :item="item" :index="`${index}-${itemIndex}`" />
            <slot name="loading" v-else :index="`${index}-${itemIndex}`">
              <div class="loading-overlay">Loading...</div>
            </slot>
          </div>
        </template>
        <template v-if="!pages[index] || pages[index].status === 'not-loaded'">
          <div class="carousel-item not-loaded" :ref="notLoadedPages.set" :data-page-index="index" :key="`${index}-0`">
            <div class="loading-overlay">Page not loaded</div>
          </div>
        </template>
      </template>
      <template v-if="tryNextPage">
        <div class="carousel-item not-loaded" :ref="notLoadedPages.set" :data-page-index="nextPageToTry" :key="`${nextPageToTry}-0`">
          <div class="loading-overlay">Page not loaded</div>
        </div>
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
import { InfiniteList } from './useInfiniteList'
import { useAutoObserver, type AutoObserver } from './useAutoObserver'

const props = withDefaults(
  defineProps<{
    infiniteList: InfiniteList<any>
    startIndex?: number
    height: string
    width: string
    numColsToShow?: number
    numRowsToShow?: number
    itemsPerPage?: number
    gap?: string
    verticalScroll?: boolean
  }>(),
  {
    gap: '1rem',
    startIndex: 0,
    numColsToShow: 1,
    numRowsToShow: 1,
    itemsPerPage: 20,
    maxPagesToCache: 5,
    verticalScroll: false
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

const { pages, getItem, fetchPage: realfetchPage } = props.infiniteList
const nextPageToTry = ref(0)
const previousPageToTry = ref(0)
const tryNextPage = ref(true)
const tryPreviousPage = ref(false)

const pagesToTry = computed(() => {
  const pages = []
  for (let i = previousPageToTry.value; i <= nextPageToTry.value; i++) {
    pages.push(i)
  }
  return pages
})

// Fetch the page, if it is not undefined and the pageNumber is > than nextPageToTry to set nextPageToTry to that page + 1. If the page is <= previousPageToTry, set previousPageToTry to that page - 1 unless it is 0
const fetchPage = async (pageNumber: number) => {
  if (pages[pageNumber] && pages[pageNumber].status === 'pending') {
    return
  }
  loading.value = true
  error.value = false
  try {
    realfetchPage(pageNumber).then(() => {
      if (pages[pageNumber]?.status === 'resolved') {
        if (pageNumber >= nextPageToTry.value) {
          // console.log('NextPage resolved:', pageNumber)
          nextPageToTry.value = pageNumber + 1
          // console.log('NextPageToTry:', nextPageToTry.value)
        }
        if (previousPageToTry.value > 0 && pageNumber <= previousPageToTry.value) {
          // console.log('Page resolved:', pageNumber)
          previousPageToTry.value = pageNumber - 1
        }
      } else {
        // If the page is not resolved and the page number is === to nextPageToTry, set tryNextPage to false. Or if the page number is === to previousPageToTry, set tryPreviousPage to false
        if (pageNumber === nextPageToTry.value) {
          tryNextPage.value = false
        } else if (pageNumber === previousPageToTry.value) {
          tryPreviousPage.value = false
        }
      }
    })
  } catch (err) {
    error.value = true
  } finally {
    loading.value = false
  }
}

const getPageItems = (index: number) => {
  if (pages[index].status === 'pending') {
    return Array(props.itemsPerPage).fill(null)
  }
  return pages[index].items
}

const gapInPixels = ref(0) // 1rem in pixels

const totalGapHeight = computed(() => {
  if(!props.verticalScroll) {
    return (props.numRowsToShow - 1) * gapInPixels.value
  }
  return props.numRowsToShow * gapInPixels.value
})
const totalGapWidth = computed(() => {
  if(!props.verticalScroll) {
    return props.numColsToShow * gapInPixels.value
  }
  return (props.numColsToShow - 1) * gapInPixels.value
})

const itemWidth = computed(() => {
  return (container_size.value.width - totalGapWidth.value) / props.numColsToShow
})

const itemHeight = computed(() => {
  return (container_size.value.height - totalGapHeight.value) / props.numRowsToShow
})

const notLoadedColSpan = computed(() => {
  // return props.numColsToShow * itemWidth.value + (props.numColsToShow - 1) * gapInPixels.value
  if (!props.verticalScroll) {
    return Math.floor(props.itemsPerPage / props.numColsToShow)
  }
  return Math.floor(props.numColsToShow)
})

const notLoadedRowSpan = computed(() => {
  if (!props.verticalScroll) {
    return Math.floor(props.numRowsToShow)
  }
  return Math.floor(props.itemsPerPage / props.numRowsToShow)
})

const numPages = ref(0)

const onResizeObserver = (entries: any) => {
  // const [entry] = entries
  // const { width, height } = entry.contentRect
  // container_size.value = { width, height }
  // if (carousel.value) {
  //   gapInPixels.value = parseFloat(getComputedStyle(carousel.value).gap) // 1rem in pixels
  // }
  nextTick(() => {
    updateDimensions()
  })
}

const updateDimensions = () => {
  if (carousel.value) {
    const { width, height } = carousel.value.getBoundingClientRect()
    container_size.value = { width, height }
    gapInPixels.value = parseFloat(getComputedStyle(carousel.value).gap) // 1rem in pixels
    // console.log('Updated dimensions:', container_size.value)
    // console.log('Updated gap in pixels:', gapInPixels.value, carousel.value, 'gap:', getComputedStyle(carousel.value).gap)
  }
}

const setupObserver = () => {
  if (!carousel.value) return
  // console.log('Setting up observer for container:', carousel.value)
  pageObserver =  useAutoObserver(carousel, (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const pageIndex = entry.target.getAttribute('data-page-index')
        // console.log('Page is in view:', pageIndex)
        if (pageIndex) {
          fetchPage(+pageIndex)
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
  nextTick(() => {
    scrollToItem(0)
  })
  // updateObservedPages(notLoadedPages.value, [])
})

watch(
  [() => props.numColsToShow, () => props.numRowsToShow, () => props.gap, () => props.verticalScroll],
  () => {
    if (carousel.value) {
      // console.log('Updating carousel dimensions')
      // gapInPixels.value = parseFloat(getComputedStyle(carousel.value).gap)
      // // Force recalculate container dimensions
      // // const { width, height } = carousel.value.getBoundingClientRect()
      // // container_size.value = { width, height }
      nextTick(() => {
        updateDimensions()
      })
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  pageObserver?.disconnect()
  carouselItemObserver?.disconnect()
})

const scrollToItem = async (itemIndex: number) => {
  if (!carousel.value) return
  
  const pageIndex = Math.floor(itemIndex / props.itemsPerPage)
  const itemInPage = itemIndex % props.itemsPerPage
  
  // First ensure the page is loaded
  if (!pages[pageIndex] || pages[pageIndex]?.status !== 'resolved') {
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
  display: grid;
  grid-template-rows: repeat(var(--num-rows-to-show), var(--item-height));
  grid-auto-flow: column;
  grid-auto-columns: var(--item-width);
  gap: var(--gap-in-px);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  height: var(--container-height);
  width: var(--container-width);
}

.carousel-item {
  scroll-snap-align: start;

  /* Make sure it fills the available grid cell */
  /* width: 100%;
  height: 100%; */
}

.carousel.vertical {
  grid-template-columns: repeat(var(--num-cols-to-show), 1fr);
  grid-auto-flow: row;
  grid-auto-rows: calc(
    (var(--container-height) - (var(--gap-in-px) * (var(--num-rows-to-show) - 1))) / var(--num-rows-to-show)
  );
  overflow-y: scroll;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
}

.carousel-item.currentSlide {
  transform: scale(1.03);
}

.carousel-item.not-loaded {
  grid-row: span var(--not-loaded-row-span);
  grid-column: span var(--not-loaded-col-span);
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
