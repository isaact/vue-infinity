<template>
  <Carousel
    ref="carouselRef"
    :items="parsedItems"
    :height="height"
    :width="width"
    :numColsToShow="numColsToShow"
    :numRowsToShow="numRowsToShow"
    :gap="gap"
    :verticalScroll="verticalScroll"
    :carouselStyle="carouselStyle"
    :onGetItemAspectRatio="onGetItemAspectRatio"
  >
    <template #item="{ item, index }">
      <div class="gallery-item">
        <img 
          :src="getImageUrl(item)" 
          :alt="getImageAlt(item)" 
          class="gallery-image"
          @error="handleImageError"
        />
        <div v-if="hasTitle(item)" class="image-title">
          {{ getImageTitle(item) }}
        </div>
      </div>
    </template>
    <template #loading="{ index }">
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>Loading image...</p>
      </div>
    </template>
  </Carousel>
</template>

<script setup lang="ts">
import { computed, defineProps, useTemplateRef, ref, watch } from 'vue';
import Carousel from './Carousel.ce.vue';

const carouselRef = useTemplateRef<typeof Carousel>('carouselRef')

// Internal ref to store items
const internalItems = ref<any[]>([])

// Define props for Gallery component
const props = defineProps({
  items: {
    type: String,
    default: '[]',
    validator: (value: string) => {
      if (typeof value !== 'string') return false;
      try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return false;
        if (parsed.length === 0) return true;
        if (typeof parsed[0] === 'string') {
          return parsed.every(item => typeof item === 'string');
        } else if (typeof parsed[0] === 'object' && parsed[0] !== null) {
          return parsed.every(item => typeof item === 'object' && item !== null && 'url' in item);
        }
        return false;
      } catch (e) {
        return false;
      }
    }
  },
  height: {
    type: String,
    default: '400px'
  },
  width: {
    type: String,
    default: '100%'
  },
  numColsToShow: {
    type: Number,
    default: 1
  },
  numRowsToShow: {
    type: Number,
    default: 1
  },
  gap: {
    type: String,
    default: '1rem'
  },
  verticalScroll: {
    type: Boolean,
    default: false
  },
  carouselStyle: {
    type: Object,
    default: () => ({})
  },
  onGetItemAspectRatio: {
    type: Function as unknown as () => (item: any) => number,
    default: undefined
  }
});

// Parse items from JSON string
const parsedItems = computed(() => {
  return internalItems.value;
});

// Watch for changes to the items prop and update internal ref
watch(
  () => props.items,
  (newItems) => {
    try {
      internalItems.value = JSON.parse(newItems);
    } catch (e) {
      internalItems.value = [];
    }
  },
  { immediate: true }
);

// Helper functions to handle different item types
const getImageUrl = (item: any): string => {
  if (typeof item === 'string') {
    return item;
  } else if (typeof item === 'object' && item !== null && 'url' in item) {
    return item.url;
  }
  return '';
};

const getImageAlt = (item: any): string => {
  if (typeof item === 'object' && item !== null && 'alt' in item) {
    return item.alt;
  } else if (typeof item === 'object' && item !== null && 'title' in item) {
    return item.title;
  }
  return 'Gallery image';
};

const getImageTitle = (item: any): string => {
  if (typeof item === 'object' && item !== null && 'title' in item) {
    return item.title;
  }
  return '';
};

const hasTitle = (item: any): boolean => {
  return typeof item === 'object' && item !== null && 'title' in item && item.title;
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKAlCBJbWFnZSBOb3QgRm91bmQg4oCUITwvdGV4dD48L3N2Zz4=';
};

// Exposed methods
const updateImages = (newItems: string | any[]) => {
  try {
    if (typeof newItems === 'string') {
      internalItems.value = JSON.parse(newItems);
    } else if (Array.isArray(newItems)) {
      internalItems.value = newItems;
    } else {
      console.warn('Invalid items format provided to updateImages');
      internalItems.value = [];
    }
  } catch (e) {
    console.error('Error updating images:', e);
    internalItems.value = [];
  }
};

const scrollToItem = (itemIndex: number) => {
  if (carouselRef.value && typeof carouselRef.value.scrollToItem === 'function') {
    carouselRef.value.scrollToItem(itemIndex);
  } else {
    console.warn('Carousel ref is not available or scrollToItem method is missing');
  }
};

defineExpose({
  updateImages,
  scrollToItem
});
</script>

<style scoped>
.gallery-item {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.image-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100%;
  color: #333;
  font-weight: bold;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>