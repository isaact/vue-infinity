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
      '--not-loaded-col-span': notLoadedColSpan,
      '--not-loaded-row-span': notLoadedRowSpan,
      '--not-loaded-width': `${notLoadedWidth}px`,
      '--not-loaded-height': `${notLoadedHeight}px`,
      '--container-height': props.height,
      '--container-width': props.width
    }"
    v-resize-observer="updateDimensions"
  >
    <div class="carousel"
        ref="carousel" 
        :style="{ gap: props.gap }" 
        :class="{ vertical: props.verticalScroll }">
      <div
        v-for="(item in pageItems" :key="`item-${item.id}`" :id="item.id" class="carousel-item"
        :class="item.status"
        :data-page-index="item.page"
        :data-img-index="item.status === 'loaded' ? item.id : ''">
        <slot name="item" v-if="visibleImages.has(`${item.id}`) && item.status === 'loaded'" :item="fetchItem(item)" :index="item.index" :page="item.page">
          Item {{ item.index }}
        </slot>
        <slot name="loading" v-else :index="`${item.index}`" :page="item.page">
          <div class="loading-overlay">Loading...</div>
        </slot>
      </div>
    </div>

    
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, useTemplateRef, nextTick, onServerPrefetch, onBeforeMount, useSSRContext } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import { vResizeObserver } from '@vueuse/components'
import { InfiniteList, type InfiniteListPage } from '../composables/useInfiniteList'
import { useAutoObserver, type AutoObserver } from '../composables/useAutoObserver'

interface ItemMetaData {
  index: number
  itemIndex?: number // Optional, used for resolved items to track their index in the page
  isPageMarker: boolean
  page: number
  rowSpan: number
  colSpan: number
  status: 'loaded' | 'pending' | 'not-loaded' | 'not-loaded-item'
  id: string
}

const props = withDefaults(
  defineProps<{
    infiniteList: InfiniteList<any>
    height: string
    width: string
    numColsToShow?: number
    numRowsToShow?: number
    gap?: string
    verticalScroll?: boolean
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

const { pages, getItem, fetchPage: realfetchPage } = props.infiniteList
const initialNextPage = (pages[0] && (pages[0].status === 'resolved' || pages[0].status === 'pending')) ? 1 : 0;
const nextPageToTry = ref(initialNextPage);
const previousPageToTry = ref(0);
const tryNextPage = ref(true)
const tryPreviousPage = ref(false)
const gapInPixels = ref(0)

//Add return type
const pageItems = computed((): Array<ItemMetaData> => {
  const items: Array<ItemMetaData>= []
  for (let i = 0; i <= nextPageToTry.value; i++) {
    // console.log('Page items:', i, nextPageToTry.value, previousPageToTry.value)
    if (pages[i]?.status === 'resolved') {
      // items.push(...pages[i].items)
      
      for (let [itemIndex, item] of pages[i].items.entries()) {
        const itemId = `${i}-${itemIndex}`
        const itemInfo: ItemMetaData = {
          index: i * itemsPerPage + itemIndex,
          itemIndex, // Store the index of the item in the page
          isPageMarker: itemIndex === 0,
          page: i,
          rowSpan: 1,
          colSpan: 1,
          status: 'loaded',
          id: itemId
        }
        items.push(itemInfo)
      }
    }else if (pages[i]?.status === 'pending') {
      // items.push(...Array(itemsPerPage).fill({rowSpan: 1, colSpan: 1, index:}))
      for (let itemIndex = 0; itemIndex < itemsPerPage; itemIndex++) {
        const itemId = `${i}-${itemIndex}`
        const pageIdx = itemIndex === 0 ? i : ''
        const itemInfo: ItemMetaData = {
          index: i * itemsPerPage + itemIndex,
          isPageMarker: itemIndex === 0,
          page: i,
          rowSpan: 1,
          colSpan: 1,
          status: 'pending',
          id: itemId
        }
        // items.push({status: 'pending', rowSpan: 1, colSpan: 1, index: i * itemsPerPage + itemIndex, page: pageIdx, id: itemId})
        items.push(itemInfo)
      }
    } else if(!pages[i] || pages[i].status === 'not-loaded') {
      const itemId = `${i}-0`
      if(notLoadedRemainingItems.value > 0) {
        // items.push({status: 'not-loaded-item', rowSpan: 1, colSpan: 1, page: i, id: itemId})
        for (let itemIndex = 1; itemIndex < notLoadedRemainingItems.value; itemIndex++) {
          const itemId = `${i}-${itemIndex}`
          const itemInfo: ItemMetaData = {
            index: i * itemsPerPage + itemIndex,
            isPageMarker: itemIndex === 0,
            page: i,
            rowSpan: 1,
            colSpan: 1,
            status: 'not-loaded-item',
            id: itemId
          }
          // items.push({status: itemStatus, rowSpan: 1, colSpan: 1, index: i * itemsPerPage + itemIndex, page: pageIndex, id: itemId})
          items.push(itemInfo)
        }
      }
      const itemInfo: ItemMetaData = {
        index: i * itemsPerPage,
        isPageMarker: true,
        page: i,
        rowSpan: notLoadedRowSpan.value,
        colSpan: notLoadedColSpan.value,
        status: 'not-loaded',
        id: itemId
      }
      // items.push({status: 'not-loaded', rowSpan: notLoadedRowSpan, colSpan: notLoadedColSpan, page: i, id: itemId})
      items.push(itemInfo)
    }
  }
  return items
})

const totalGapHeight = computed(() => {
  // if(!props.verticalScroll) {
  //   return (props.numRowsToShow - 1) * gapInPixels.value
  // }
  return (adjustedNumRowsToShow.value - 1) * gapInPixels.value
})
const totalGapWidth = computed(() => {
  // if(!props.verticalScroll) {
  //   return props.numColsToShow * gapInPixels.value
  // }
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

const notLoadedColSpan = computed(() => {
  if (!props.verticalScroll) {
    return Math.floor(itemsPerPage / props.numColsToShow)
  }
  return Math.floor(props.numColsToShow)
})

const notLoadedRowSpan = computed(() => {
  if (!props.verticalScroll) {
    return Math.floor(props.numRowsToShow)
  }
  return Math.floor(itemsPerPage / props.numRowsToShow)
})

const notLoadedRemainingItems = computed(() => {
  // console.log('Not loaded remaining items:', itemsPerPage, props.numColsToShow, props.numRowsToShow)
  if (!props.verticalScroll) {
    return itemsPerPage % adjustedNumRowsToShow.value
  }
  return itemsPerPage % adjustedNumColsToShow.value
})

const notLoadedWidth = computed(() => {
  return itemWidth.value * notLoadedColSpan.value
})

const notLoadedHeight = computed(() => {
  return itemHeight.value * notLoadedRowSpan.value
})

// Fetch the page, if it is not undefined and the pageNumber is > than nextPageToTry to set nextPageToTry to that page + 1. If the page is <= previousPageToTry, set previousPageToTry to that page - 1 unless it is 0
const fetchPage = async (pageNumber: number) => {
  // console.log('Fetching page1:', pageNumber)
  if (pages[pageNumber] && pages[pageNumber].status === 'pending') {
    // console.log('Page is already loading:', pageNumber)
    return
  }
  loading.value = true
  error.value = false
  try {
    // console.log('Fetching page2:', pageNumber)
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
        if (pageNumber === nextPageToTry.value) {
          tryNextPage.value = false
        } else if (pageNumber === previousPageToTry.value) {
          tryPreviousPage.value = false
        }
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
        // useThrottleFn(() => {
          // console.log('Page is in view:', entry)
          const pageIndex = entry.target.getAttribute('data-page-index')
          if (pageIndex) {
            fetchPage(+pageIndex)
          }
        // }, 30)()
      }else {
        //Abort the fetch if the page is not in view
        // console.log('Page is not in view:', entry)
        const pageIndex = entry.target.getAttribute('data-page-index')
        if (pageIndex) {
          // console.log('Aborting fetch for page:', pageIndex)
          const page = pages[+pageIndex]
          if (page && page.status === 'pending') {
            // console.log('Aborting fetch for page:', pageIndex)
            page.abortController?.abort()
            page.status = 'not-loaded'
          }
        }
      }
    })
  }, {
    // Filter only elements with that have the class .carousel-item.not-loaded
    filter: el => {
      return el.classList.contains('carousel-item') && el.classList.contains('not-loaded')
    },
    // filter: el => notLoadedPages.value.includes(el),
    root: carouselContainer.value,
    rootMargin: '300%'
  })

  carouselItemObserver = useAutoObserver(carouselContainer, (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // console.log('Image is in view:', entry)
        const imgIndex = entry.target.getAttribute('data-img-index') || ''
        visibleImages.value.add(imgIndex)
      } else {
        useThrottleFn(() => {
          // console.log('Image is not in view:', entry)
          const imgIndex = entry.target.getAttribute('data-img-index') || ''
          visibleImages.value.delete(imgIndex)
        }, 100)()
      }
    })
  }, {
    root: carouselContainer.value,
    filter: el => {
      return el.classList.contains('carousel-item') && el.classList.contains('loaded')
    },
    rootMargin: "200%"
  }) 
}

const initFirstPage = async () => {
  if (!pages[0] || (pages[0].status !== 'resolved' && pages[0].status !== 'pending')) {
    // console.log('Fetching first page')
    await fetchPage(0)
  }
  // Seed visibleImages for SSR
  const numVisible = props.numColsToShow * props.numRowsToShow
  for (let i = 0; i < numVisible; i++) {
    const itemData = pageItems.value[i]
    console.log('Seeding visible image:', itemData.id, itemData.status)
    visibleImages.value.add(itemData.id);
  }
  console.log('Initial visible images:', visibleImages.value)
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
const fetchItem = (itemInfo: ItemMetaData): any => {
  console.log('Fetching item:', itemInfo.id, itemInfo.status, itemInfo.page, itemInfo.itemIndex)
  if (itemInfo.status === 'loaded' && itemInfo.itemIndex !== undefined && pages[itemInfo.page]) {
    console.log('Returning loaded item:', pages[itemInfo.page].items[itemInfo.itemIndex])
    return pages[itemInfo.page].items[itemInfo.itemIndex]
  } else if (itemInfo.status === 'pending') {
    console.log('Item is pending, returning null:', itemInfo.id)
    return null
  } else if (itemInfo.status === 'not-loaded' || itemInfo.status === 'not-loaded-item') {
    console.log('Item is not loaded, returning null:', itemInfo.id)
    return null
  }
  console.warn('Unknown item status:', itemInfo.status, 'for item:', itemInfo.id)
  return null
}

onMounted(async () => {
  await initFirstPage()
  if (carouselContainer.value) {
    // console.log('Carousel element:', carousel.value)
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
      pageObserver?.disconnect();
      carouselItemObserver?.disconnect();
      nextTick(() => {
        updateDimensions();
        setupObserver();
      });
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
  grid-auto-flow: column;
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
  grid-auto-flow: row;
  /* grid-auto-rows: calc(
    (var(--container-height) - (var(--gap-in-px) * (var(--num-rows-to-show) - 1))) / var(--num-rows-to-show)
  ); */
  scroll-snap-type: y mandatory;
}

.carousel-item, .carousel-item.not-loaded-item {
  scroll-snap-align: start;
  width: var(--item-width);
  height: var(--item-height);
}

/* .carousel-item.currentSlide {
  transform: scale(1.03);
} */

.carousel-item.not-loaded {
  grid-row: span var(--not-loaded-row-span);
  grid-column: span var(--not-loaded-col-span);
  width: var(--not-loaded-width);
  height: var(--not-loaded-height);
}

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
