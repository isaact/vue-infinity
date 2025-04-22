# 🚀 Vue Infinity

Vue 3 utilities for efficient memory management of large datasets and infinite lists.

## 🧠 Core Features

### Memory Management
- 🧹 Automatically unloads non-visible items from memory
- ⚙️ Configurable caching limits
- 🧼 Clean resource disposal

## 📦 Components

### ♾️ InfiniteCarousel
- 👁️ Renders only visible items (+ configurable buffer)
- 🔗 Integrates with useInfiniteList for data management
- 🎨 Supports custom item templates

```vue
<template>
  <InfiniteCarousel
    :infinite-list="infiniteList"
    :height="'50vh'"
    :width="'100%'"
    :numColsToShow="3"
    :numRowsToShow="2"
  >
    <template #item="{ item, index }">
      <img :src="item.url" :alt="item.title" class="carousel-img"/>
    </template>
  </InfiniteCarousel>
</template>

<script setup>
import { useInfiniteList } from 'vue-infinity'

const infiniteList = useInfiniteList({
  fetchItems: (page) => fetchPage(page),
  totalItems: 1000,
  itemsPerPage: 20,
  maxPagesToCache: 5
})
</script>
```

### 🔄 useInfiniteList
- 📦 Manages paginated data loading
- 🗑️ Automatically unloads oldest pages when cache limit reached
- 🔍 Provides item access by index

```ts
const { pages, getItem, fetchPage } = useInfiniteList({
  fetchItems: async (page, signal) => {
    const response = await fetch(`/api/items?page=${page}`, { signal })
    return response.json()
  },
  totalItems: 10000,
  itemsPerPage: 50,
  maxPagesToCache: 5
})
```

### 👀 Observer Utilities
- 🔭 `useAutoObserver`: Clean IntersectionObserver wrapper

```ts
const { isVisible } = useAutoObserver(ref)
```

## 📥 Installation
```bash
npm install vue-infinity
```

## 📚 API Documentation
See [API Reference](#) for detailed usage.