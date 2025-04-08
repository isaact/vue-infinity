<template>
  <div class="infinite-gallery" ref="container">
    <div class="gallery-grid">
      <div v-for="(item, index) in visibleItems" :key="index" class="gallery-item">
        <img :src="item.url" :alt="`Image ${index}`" @load="onImageLoad" />
        <div v-if="item.loading" class="loading-overlay">Loading...</div>
      </div>
    </div>
    <div v-if="loading" class="loading-indicator">Loading more images...</div>
    <div v-if="error" class="error-message">Error loading images</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInfiniteList } from './useInfiniteList'

interface GalleryItem {
  url: string
  loading?: boolean
}

const props = defineProps<{
  fetchItems: (page: number, signal: AbortSignal) => Promise<GalleryItem[]>
  getItemCount: () => Promise<number>
  itemsPerPage?: number
  maxPages?: number
}>()

const container = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref(false)

const { pages, getItem, getItemCount, fetchPage } = useInfiniteList<GalleryItem>({
  fetchItems: props.fetchItems,
  getItemCount: props.getItemCount,
  itemsPerPage: props.itemsPerPage || 20,
  maxPages: props.maxPages || 5
})

const visibleItems = computed(() => {
  const items: GalleryItem[] = []
  if (!pages.value) return items
  
  for (const pageNum in pages.value) {
    const page = pages.value[pageNum]
    if (page.status === 'resolved') {
      items.push(...page.items)
    } else if (page.status === 'pending') {
      // Add placeholder items for pending pages
      items.push(...Array(page.items.length).fill({ url: '', loading: true }))
    }
  }
  return items
})

const loadMore = async () => {
  if (loading.value) return
  
  loading.value = true
  error.value = false
  
  try {
    const currentCount = await getItemCount()
    const loadedCount = pages.value ? Object.values(pages.value).reduce(
      (sum, page) => sum + (page.status === 'resolved' ? page.items.length : 0),
      0
    ) : 0
    
    if (loadedCount < currentCount) {
      const nextPage = Math.floor(loadedCount / (props.itemsPerPage || 20))
      await fetchPage(nextPage)
    }
  } catch (err) {
    console.error('Error loading more items:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const onScroll = () => {
  if (!container.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = container.value
  const threshold = 200 // pixels from bottom
  
  if (scrollHeight - (scrollTop + clientHeight) < threshold) {
    loadMore()
  }
}

onMounted(() => {
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
  height: 100vh;
  overflow-y: auto;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
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