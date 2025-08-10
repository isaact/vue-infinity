<template>
  <Carousel
    :items="items"
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
import { defineProps } from 'vue';
import Carousel from './Carousel.vue';

// Define props for Gallery component
const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (value: any[]) => {
      if (value.length === 0) return true;
      if (typeof value[0] === 'string') {
        return value.every(item => typeof item === 'string');
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        return value.every(item => typeof item === 'object' && item !== null && 'url' in item);
      }
      return false;
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