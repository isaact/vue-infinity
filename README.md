<div align="center"><img src="https://github.com/tewolde/vue-infinity/raw/main/assets/logo.svg" alt="Vue Infinity Logo" style="width: 50%;"></div>

# Vue-Infinity
Vue Infinity is a lightweight library that allows you to use the fact that users only view a portion of the content at any given time. This enables you to build high-performance applications that scale to arbitrarily large data sets—without a hit to memory or speed.

This is done on two levels, on the API level and at the UI level.

API Level:
- Fetch only the data you need
- Pages are automatically evicted from cache based on last-recently-used basis

UI Level:
- Render only content that is visible to the user
- This is a big advantage for image/video rich content which can take up a lot of memory

## ✨Core Features

### 🌀 InfiniteList

`InfiniteList` provides reactive, paginated access to large datasets with full type support. It is ideal for applications that need to browse vast amounts of data without loading everything into memory.

**Key Capabilities:**

- Paginated data access
- Caching with automatic unloading of older pages based on least-recently-used basis
- Item access by index
- Supports cancellation of in-flight network requests using AbortController

**Example:**

```ts
const { pages, getItem, fetchPage } = useInfiniteList({
  fetchItems: async (page, signal) => {
    const response = await fetch(`/api/items?page=${page}`, { signal })
    return response.json()
  },
  totalItems: 1000,
  itemsPerPage: 50,
  maxPagesToCache: 5
})
```

### 🪂 InfiniteCarousel

`InfiniteCarousel` is a general-purpose virtual scroll component optimized for grid-like or carousel-based layouts. It renders only what’s visible and a small buffer, making it highly efficient for rendering large, media-rich collections.

**Key Capabilities:**

- Integrates directly with `InfiniteList` for managing the data access
- Customizable number of rows and columns
- Configurable as a horizontal or vertical scroller
- Supports custom templates for each item
- Supports custom loading templates
- Allows scrolling to any item with css based scroll snapping

**Example:**

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

### 🔍 AutoObserver

`AutoObserver` enhances the native `IntersectionObserver` by automatically handling new elements and cleaning up removed ones. This is especially useful for dynamic content or virtualized lists.

**Key Capabilities:**

- Automatically observes newly added elements
- Stops observing removed elements
- Filters elements to observe using custom logic
- Cleans up automatically on component unmount

**Example:**

```ts
const containerRef = ref<HTMLElement>()

const { disconnect } = useAutoObserver(
  containerRef,
  (entries) => {
    entries.forEach(entry => {
      console.log('Element visibility changed:', entry.isIntersecting)
    })
  },
  {
    rootMargin: '200px',
    threshold: 0.1,
    filter: el => el.classList.contains('observe-me')
  }
)
```

## 📦 Installation

To install Vue Infinity, run the following command:

```bash
npm install vue-infinity
```

## 🚀 Demo

Check out the live demo here: [https://tewolde.co/vueInfinity/](https://tewolde.co/vueInfinity/)
## ▶️ Run Playground App

To run the playground application locally, use the following command:

```bash
npm run playground
```

## 📝 License

MIT License - [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)
