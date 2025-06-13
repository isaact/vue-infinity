<template>
  <div
    class="infinite-carousel"
    ref="container"
    :style="{
      '--item-width': `${itemWidth}px`,
      '--item-height': `${itemHeight}px`,
      '--num-cols-to-show': adjustedNumColsToShow,
      '--num-rows-to-show': adjustedNumRowsToShow,
      '--gap-in-px': `${gapInPixels}px`,
      '--container-height': props.height,
      '--container-width': props.width
    }"
    v-resize-observer="updateDimensions"
  >
    <div class="carousel"
        ref="carousel"
        :style="[ { gap: props.gap }, props.carouselStyle ]"
        :class="{ vertical: props.verticalScroll }">
      <template v-for="i in nextPageToTry + 1" :key="i - 1">
        <template v-if="pages[i - 1] && pages[i - 1].status === 'resolved'">
          <div
            v-for="(item, index) in pages[i - 1].items" :key="`${i - 1}-${index}`" class="carousel-item"
            :class="pages[i - 1].status"
            :data-page-index="i - 1"
            :data-item-index="index"
            :data-load-page="index === 0 ? i - 1 : ''"
            :style="getItemStyle(item, i - 1, index)"
          >
            <slot name="item" v-if="visibleImages.has(`${i - 1}-${index}`)" :item="item" :index="index" :page="i - 1">
              <div>Page: {{ i - 1 }}, Item {{ index }}</div>
            </slot>
            <slot name="loading" v-else :index="`${item.index}`" :page="item.page">
              <div class="loading-overlay">Loading Page: {{ i - 1 }}, Item {{ index }}...</div>
            </slot>
          </div>
        </template>
        <template v-else>
          <div
            v-for="index in props.infiniteList.itemsPerPage" :key="`${i - 1}-${index}`" class="carousel-item"
            :class="pages[i - 1]?.status || 'not-loaded'"
            :data-page-index="i - 1"
            :data-item-index="index - 1"
            :data-load-page="index === 0 ? i - 1 : ''"
            :style="getNotLoadedItemStyle(i - 1, index - 1)"
          >
            <slot name="loading" :index="index" :page="i - 1">
              <div class="loading-overlay">Page: {{ i - 1 }}, Item {{ index }}...</div>
            </slot>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, useTemplateRef, nextTick } from 'vue'
import { useThrottleFn, useDebounceFn } from '@vueuse/core'
import { vResizeObserver } from '@vueuse/components'
import { InfiniteList, type InfiniteListPage } from '../composables/useInfiniteList'
import { useAutoObserver, type AutoObserver } from '../composables/useAutoObserver'

type ItemSpan = {
  colSpan: number
  rowSpan: number
}
type ItemAspectRatioFn = (item: any) => number
const itemAspectMap = new Map<number, number>() //useCompressedSpanMap()

const props = withDefaults(
  defineProps<{
    infiniteList: InfiniteList<any>
    height: string
    width: string
    numColsToShow?: number
    numRowsToShow?: number
    gap?: string
    verticalScroll?: boolean
    carouselStyle?: any
    onGetItemAspectRatio?: ItemAspectRatioFn
  }>(),
  {
    gap: '1rem',
    numColsToShow: 1,
    numRowsToShow: 1,
    maxPagesToCache: 5,
    verticalScroll: false
  }
)

const carouselContainer = useTemplateRef('carousel')
const container_size = ref({ width: 0, height: 0 })
const itemsPerPage = props.infiniteList.itemsPerPage
const loading = ref(false)
const error = ref(false)
const visibleImages = ref(new Set<string>())

let pageObserver: AutoObserver | null = null
let carouselItemObserver: AutoObserver | null = null

const { pages, getItem, fetchPage: realfetchPage, updateMaxPagesToCache } = props.infiniteList
const initialNextPage = (pages[0] && (pages[0].status === 'resolved' || pages[0].status === 'pending')) ? 1 : 0;
const nextPageToTry = ref(initialNextPage);
const previousPageToTry = ref(0);
const gapInPixels = ref(0)

const totalGapHeight = computed(() => {
  return (adjustedNumRowsToShow.value - 1) * gapInPixels.value
})
const totalGapWidth = computed(() => {
  return (adjustedNumColsToShow.value - 1) * gapInPixels.value
})

const adjustedNumColsToShow = computed(() => {
  if (props.verticalScroll) {
    return Math.ceil(props.numColsToShow)
  }
  return props.numColsToShow
})
const adjustedNumRowsToShow = computed(() => {
  if (props.verticalScroll) {
    return props.numRowsToShow
  }
  return Math.ceil(props.numRowsToShow)
})

const itemWidth = computed(() => {
  return (container_size.value.width - totalGapWidth.value) / adjustedNumColsToShow.value
})

const itemHeight = computed(() => {
  return (container_size.value.height - totalGapHeight.value) / adjustedNumRowsToShow.value
})

const getItemStyle = (item: any, pageIndex: number, itemIndex: number) => {
  const globalIndex = pageIndex * props.infiniteList.itemsPerPage + itemIndex;
  if(props.onGetItemAspectRatio) {
    // Get the aspect ratio from the map
    const aspectRatio = props.onGetItemAspectRatio(item)
    // console.log('Aspect Ratio for item:', globalIndex, aspectRatio)
    const itemSpan = getItemSpan(globalIndex, aspectRatio);
    if(itemSpan) {
      return {
        gridColumn: `span ${itemSpan.colSpan}`,
        gridRow: `span ${itemSpan.rowSpan}`,
      }
    }
  }
}

const getItemSpan = (globalIndex: number, aspectRatio: number): ItemSpan | undefined => {
  if (aspectRatio !== 1) {
    // const aspectRatio = props.onGetItemAspectRatio(item)
    itemAspectMap.set(globalIndex, aspectRatio);
    let colSpan = 1;
    let rowSpan = 1;

    if (aspectRatio > 1) { // Landscape
      colSpan = Math.min(adjustedNumColsToShow.value, Math.max(1, Math.round(aspectRatio)));
      rowSpan = 1;
    } else if (aspectRatio < 1) { // Portrait
      rowSpan = Math.min(adjustedNumRowsToShow.value, Math.max(1, Math.round(1 / aspectRatio)));
      colSpan = 1;
    }
    // console.log(`Item ${globalIndex} aspect ratio: ${aspectRatio}, colSpan: ${colSpan}, rowSpan: ${rowSpan}`);
    return { colSpan, rowSpan };
  }
}

const getNotLoadedItemStyle = (pageIndex: number, itemIndex: number) => {
  const globalIndex = pageIndex * props.infiniteList.itemsPerPage + itemIndex;
  // const itemSpan = spanMap.get(globalIndex);
  const aspectRatio = itemAspectMap.get(globalIndex);
  if(aspectRatio) {
    const itemSpan = getItemSpan(globalIndex, aspectRatio);
    if (itemSpan) {
      return {
        gridColumn: `span ${itemSpan.colSpan}`,
        gridRow: `span ${itemSpan.rowSpan}`,
      };
    }
  }
};

// Fetch the page, if it is not undefined and the pageNumber is > than nextPageToTry to set nextPageToTry to that page + 1. If the page is <= previousPageToTry, set previousPageToTry to that page - 1 unless it is 0
const fetchPage = async (pageNumber: number) => {
  // console.log('Fetching page:', pageNumber)
  if (pages[pageNumber] && pages[pageNumber].status === 'pending' || pages[pageNumber]?.status === 'resolved') {
    // console.log('Page is already loading:', pageNumber)
    return
  }
  loading.value = true
  error.value = false
  try {
    // console.log('Fetching page:', pageNumber)
    await realfetchPage(pageNumber).then(() => {
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
        // If the page is not resolved and the page number is === nextPageToTry, set tryNextPage to false. Or if the page number is === to previousPageToTry, set tryPreviousPage to false
        // if (pageNumber === nextPageToTry.value) {
        //   tryNextPage.value = false
        // } else if (pageNumber === previousPageToTry.value) {
        //   tryPreviousPage.value = false
        // }
      }
    })
  } catch (err) {
    console.error('Error fetching page:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const updateDimensions = () => {
  if (carouselContainer.value) {
    const { width, height } = carouselContainer.value.getBoundingClientRect()
    container_size.value = { width, height }
    gapInPixels.value = parseFloat(getComputedStyle(carouselContainer.value).gap)
    // console.log('Updated dimensions:', container_size.value)
    // console.log('Updated gap in pixels:', gapInPixels.value, carousel.value, 'gap:', getComputedStyle(carousel.value).gap)
  }
}

const setupObserver = () => {
  if (!carouselContainer.value) return
  // console.log('Setting up observer for container:', carousel.value)

  pageObserver =  useAutoObserver(carouselContainer, (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // console.log('Page is in view:', entry)
        const pageIndex = entry.target.getAttribute('data-page-index')
        if (pageIndex) {
          // console.log('Page in view:', pageIndex, 'Status:', pages[+pageIndex]?.status)
          fetchPage(+pageIndex)
        }
      }else {
        const pageIndex = entry.target.getAttribute('data-')
        if (pageIndex) {
          const page = pages[+pageIndex]
          if (page && page.status === 'pending') {
            console.log('Aborting fetch for page:', pageIndex)
            page.abortController?.abort()
            // nextTick(() => {
              console.log('Clearing page:', pageIndex)
              props.infiniteList.clearPage(+pageIndex)
            // })
          }
        }
      }
    })
  }, {
    // Filter only elements with that have the class .carousel-item.not-loaded
    filter: el => {
      // return true if the element has data-page-index attribute
      return el.classList.contains('carousel-item') && el.classList.contains('not-loaded') && el.hasAttribute('data-load-page')
    },
    // filter: el => notLoadedPages.value.includes(el),
    root: carouselContainer.value,
    rootMargin: '300%'
  })
  carouselItemObserver = useAutoObserver(carouselContainer, (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // console.log('Image is in view:', entry)
        // const imgIndex = entry.target.getAttribute('data-img-index') || ''
        // visibleImages.value.add(imgIndex)
        // throttledAddVisibleImage(imgIndex)
        const itemIndex = entry.target.getAttribute('data-item-index') || ''
        const pageIndex = entry.target.getAttribute('data-page-index') || ''
        if (itemIndex && pageIndex && pages[+pageIndex] && pages[+pageIndex].items) {
          const itemData = pages[+pageIndex].items[+itemIndex]
          if (itemData) {
             visibleImages.value.add(`${pageIndex}-${itemIndex}`)
          }
        }
      } else {
        // console.log('Image is not in view:', entry)
        const imgIndex = entry.target.getAttribute('data-img-index') || ''
        // visibleImages.value.delete(imgIndex)
        visibleImages.value.delete(imgIndex)
      }
    })
  }, {
    root: carouselContainer.value,
    filter: el => {
      return el.classList.contains('carousel-item') && el.classList.contains('resolved')
    },
    rootMargin: "200%"
  }) 
}

const initFirstPage = async () => {
  if (!pages[0] || (pages[0].status !== 'resolved')) {
    // console.log('Fetching first page')
    await fetchPage(0)
  }
  // Seed visibleImages for SSR
  const numVisible = props.numColsToShow * props.numRowsToShow
  for (let i = 0; i < numVisible; i++) {
    const itemData = pages[0].items[i]
    console.log('Seeding visible image:', itemData.id, 'at index:', i)
    visibleImages.value.add(itemData.id);
  }
  // console.log('Initial visible images:', visibleImages.value)
}

const scrollToItem = async (itemIndex: number) => {
  if (!carouselContainer.value) return

  // Disconnect observers before scrolling
  pageObserver?.disconnect();
  carouselItemObserver?.disconnect();
  
  const pageIndex = Math.floor(itemIndex / itemsPerPage)
  const itemInPage = itemIndex % itemsPerPage
  
  // First ensure the page is loaded
  if (!pages[pageIndex] || pages[pageIndex]?.status !== 'resolved') {
    // console.log('Fetching page to scroll to:', pageIndex)
    await fetchPage(pageIndex)
  }
  // Reconnect observers after scrolling
  setupObserver();

  // Wait for the item to be rendered
  const checkItem = () => {
    return new Promise<void>((resolve) => {
      const itemId = `${pageIndex}-${itemInPage}`;
      const itemElement = document.getElementById(itemId);
      
      if (itemElement) {
        itemElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        })
        resolve()
      } else {
        // If not found yet, wait and check again
        setTimeout(() => checkItem().then(resolve), 150)
      }
    })
  }

  await checkItem()
}
const fixCacheSize = () => {
  const newMaxPagesToCache = Math.ceil(props.numRowsToShow * props.numColsToShow * 3 * 3 * 2 / itemsPerPage)
  if( props.infiniteList.maxPagesToCache >= newMaxPagesToCache) {
    return
  }
  console.log('Updating max pages to cache:', newMaxPagesToCache);
  updateMaxPagesToCache(newMaxPagesToCache);
}

onMounted(async () => {
  fixCacheSize()
  await initFirstPage()
  if (carouselContainer.value) {
    gapInPixels.value = parseFloat(getComputedStyle(carouselContainer.value).gap)
  }
  nextTick(() => {
    setupObserver()
  })
})

watch(
  [() => props.numColsToShow, () => props.numRowsToShow, () => props.gap, () => props.verticalScroll],
  () => {
    if (carouselContainer.value) {
      // pageObserver?.disconnect();
      // carouselItemObserver?.disconnect();
      // nextTick(() => {
        // visibleImages.value.clear();
        fixCacheSize();
        updateDimensions();
        scrollToItem(0); // Scroll to the first item after updating dimensions
        // setupObserver();
        // Update maxPagesToCache based on visible items + buffer
        
        
      // });
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  pageObserver?.disconnect()
  carouselItemObserver?.disconnect()
})

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
  grid-template-columns: repeat(var(--num-cols-to-show), var(--item-width));
  grid-auto-flow: column dense;
  grid-auto-columns: var(--item-width);
  grid-auto-rows: var(--item-height);
  gap: var(--gap-in-px);
  overflow-x: scroll;
  overflow-y: scroll;
  scroll-snap-type: x mandatory;
  height: var(--container-height);
  width: var(--container-width);
}

.carousel.vertical {
  grid-auto-flow: row dense;
  /* grid-auto-rows: calc(
    (var(--container-height) - (var(--gap-in-px) * (var(--num-rows-to-show) - 1))) / var(--num-rows-to-show)
  ); */
  scroll-snap-type: y mandatory;
}

.carousel-item {
  scroll-snap-align: start;
  /* width: var(--item-width);
  height: var(--item-height); */
}

/* .carousel-item.currentSlide {
  transform: scale(1.03);
} */
/*
.carousel-item.not-loaded {
  grid-row: span var(--not-loaded-row-span);
  grid-column: span var(--not-loaded-col-span);
  width: var(--not-loaded-width);
  height: var(--not-loaded-height);
}*/

/* .carousel-item img {
  width: var(--item-width);
  height: var(--container-height);
  object-fit: cover;
} */

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.1);
  width: var(--item-width);
  height: var(--item-height);
}

/* .carousel-item.not-loaded .loading-overlay {
  width: var(--not-loaded-width);
  height: var(--container-height);
} */

.loading-indicator,
.error-message {
  padding: 16px;
  text-align: center;
}
</style>
