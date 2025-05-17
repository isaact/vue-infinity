<div align="center"><img width="300" src="https://tewolde.co/vi-logo.svg?width=200" alt="Vue Infinity Logo"></div>
# Vue-Infinity

**Vue Infinity** is a modular toolkit designed to help developers build high-performance, memory-efficient, and media-rich applications with Vue. By leveraging smart data fetching and virtualized rendering, it ensures smooth user experiences even with large datasets.

## 🚀 Key Features

### 🔄 InfiniteList

Provides reactive, paginated access to large datasets with full type support.

- Paginated data access
- Caching with automatic unloading of older pages based on least-recently-used basis
- Item access by index
- Supports cancellation of in-flight network requests using `AbortController`

**Example:**

```javascript
const { pages, getItem, fetchPage } = useInfiniteList({
  fetchItems: async (page, signal) => {
    const response = await fetch(`/api/items?page=${page}`, { signal });
    return response.json();
  },
  itemsPerPage: 50,
  maxPagesToCache: 5
});
```

### 🎠 InfiniteCarousel

A general-purpose virtual scroll component optimized for grid-like or carousel-based layouts.

- Integrates directly with `InfiniteList` for managing data access
- Customizable number of rows and columns
- Configurable as a horizontal or vertical scroller
- Supports custom templates for each item
- Supports custom loading templates
- Allows scrolling to any item with CSS-based scroll snapping

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
import { useInfiniteList } from 'vue-infinity';

const infiniteList = useInfiniteList({
  fetchItems: (page) => fetchPage(page),
  totalItems: 1000,
  itemsPerPage: 20,
  maxPagesToCache: 5
});
</script>
```

### 👁️ AutoObserver

Enhances the native `IntersectionObserver` by automatically handling new elements and cleaning up removed ones.

- Automatically observes newly added elements
- Stops observing removed elements
- Filters elements to observe using custom logic
- Cleans up automatically on component unmount

**Example:**

```javascript
const containerRef = ref<HTMLElement>();

const { disconnect } = useAutoObserver(
  containerRef,
  (entries) => {
    entries.forEach(entry => {
      console.log('Element visibility changed:', entry.isIntersecting);
    });
  },
  {
    rootMargin: '200px',
    threshold: 0.1,
    filter: el => el.classList.contains('observe-me')
  }
);
```

## 📦 Installation

```bash
npm install vue-infinity
```

## 🧪 Live Demo

Explore the live demo here: [https://tewolde.co/vueInfinity/](https://tewolde.co/vueInfinity/)

## 🧑‍💻 Run Playground App

To run the playground application locally:

```bash
npm run playground
```

## 📄 License

Apache 2.0 License - [https://opensource.org/licenses/Apache-2.0](https://opensource.org/licenses/Apache-2.0)
