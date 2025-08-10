<template>
  <div
    class="carousel-container"
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
        <div
          v-for="(item, index) in props.items"
          class="carousel-item"
          :key="getItemId(index)"
          :id="getItemId(index)"
          :data-item-index="index"
          :style="getItemStyle(item, index)"
        >
          <slot name="item" v-if="visibleImages.has(getItemId(index))" :item="item" :index="index">
            <div>Item {{ index }}</div>
          </slot>
          <slot name="loading" v-else :index="`${item.index}`" :page="item.page">
            <div class="loading-overlay">Loading Item {{ index }}...</div>
          </slot>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, useTemplateRef, nextTick } from 'vue'
import { vResizeObserver } from '@vueuse/components'
import { useAutoObserver, type AutoObserver } from '../composables/useAutoObserver'

type ItemSpan = {
  colSpan: number
  rowSpan: number
}
type ItemAspectRatioFn = (item: any) => number
const itemAspectMap = new Map<number, number>() //useCompressedSpanMap()

const props = withDefaults(
  defineProps<{
    items: any[]
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
const carouselIdPrefix = `carousel-${Math.random().toString(36).substring(2, 9)}`;
const container_size = ref({ width: 0, height: 0 })
const loading = ref(false)
const error = ref(false)
const visibleImages = ref(new Set<string>())

// let pageObserver: AutoObserver
let carouselItemObserver: AutoObserver

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

const getItemStyle = (item: any, itemIndex: number) => {
  if(props.onGetItemAspectRatio) {
    // Get the aspect ratio from the map
    const aspectRatio = props.onGetItemAspectRatio(item)
    // console.log('Aspect Ratio for item:', globalIndex, aspectRatio)
    const itemSpan = getItemSpan(itemIndex, aspectRatio);
    if(itemSpan) {
      return {
        gridColumn: `span ${itemSpan.colSpan}`,
        gridRow: `span ${itemSpan.rowSpan}`,
      }
    }
  }
}

const getItemId = (itemIndex: number) => {
  return `${carouselIdPrefix}-${itemIndex}`;
}

const getItemSpan = (itemIndex: number, aspectRatio: number): ItemSpan | undefined => {
  if (aspectRatio !== 1) {
    // const aspectRatio = props.onGetItemAspectRatio(item)
    itemAspectMap.set(itemIndex, aspectRatio);
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
  console.log('Setting up observer for container:')

  carouselItemObserver = useAutoObserver((entries) => {
    entries.forEach(entry => {
      const itemIndex = entry.target.getAttribute('data-item-index') || ''
      if(itemIndex){
        const itemId = getItemId(+itemIndex)
        if (entry.isIntersecting) {          
            const itemData = props.items[+itemIndex]
            if (itemData) {
                visibleImages.value.add(itemId)
            }
        } else {
          // console.log('Image is not in view:', entry)
          // const imgIndex = entry.target.getAttribute('data-img-index') || ''
          // visibleImages.value.delete(imgIndex)
          visibleImages.value.delete(itemId)
        }

      }
    })
  }, {
    root: carouselContainer.value,
    filter: el => {
      return el.classList.contains('carousel-item')
    },
    rootMargin: "200%"
  })
  carouselItemObserver.observeContainer(carouselContainer.value)
}


const initFirstPage = async () => {
  // Seed visibleImages for SSR
  const numVisible = props.numColsToShow * props.numRowsToShow
  for (let i = 0; i < numVisible; i++) {
    visibleImages.value.add(getItemId(i));
  }
}

const scrollToItem = async (itemIndex: number) => {
  if (!carouselContainer.value) return

  const elementId = getItemId(itemIndex)
  const itemElement = document.getElementById(elementId)
  if (itemElement && carouselContainer.value) {
    nextTick(() => {
        itemElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start'
        })
    })
  } else {
    console.warn(`Item with ID ${elementId} not found in the DOM.`);
  }
}

onMounted(async () => {
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
  carouselItemObserver?.disconnect()
})

defineExpose({
  scrollToItem
})
</script>

<style scoped>
.carousel-container {
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
.carousel-item.not-loaded {
  contain: size;
  content-visibility: auto;
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
