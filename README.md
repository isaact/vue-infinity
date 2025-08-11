<div style="background-color: #444; width:100%;height:250px">
  <!-- Cloud background (behind) -->
  <img
    width="100%"
    height="250"
    src="assets/cloudsLogo.svg"
    alt="Decorative clouds"
    style="width:100%; height:250px"
  />
</div>

# Vue-Infinity

*Build lightning-fast Vue apps that only render what is on-screen*

Vue-Infinity brings a radical efficiency boost to your UI by applying the same principle that powers 3D engines: if it’s not in visible, it doesn’t get rendered. This lets your app handle hundreds or thousands of elements without bloating memory, janking or killing batteries.

Whether you’re building infinite feeds, carousels, media galleries, or dashboards—Vue-Infinity keeps your app fast, smooth, and efficient.

## Table of Contents

- [Gallery Web Component](#-gallery-web-component)
- [Carousel Component](#-carousel-component)
- [InfiniteCarousel](#-infinitecarousel)
- [Ghost Component](#-ghost-component)
- [AutoObserver](#-autoobserver)
- [Installation](#-installation)
- [Live Demo](#-live-demo)
- [Run Playground App](#-run-playground-app)
- [Releases](#releases)
- [License](#-license)

## 🖼️ Gallery Web Component

The `gallery-ce` is a web component built on top of the Carousel component that provides an easy way to display a gallery of images with features like lazy loading, responsive layout, and dynamic sizing. It's designed to efficiently handle large collections of images while maintaining smooth performance.

- **Easy to use**: Suitable when you have a big static list of images you want to browse
- **Framework agnostic**: Can be used without Vue in any framework or vanilla JavaScript
- **Flexible Layout**: Configurable grid layout with customizable columns and rows
- **Lazy Loading**: Only renders visible images for optimal performance

### Usage Examples

#### Plain JavaScript

```html
<gallery-ce id="gallery" height="400px" num-cols-to-show="3"></gallery-ce>

<script type="module">
  import { registerElements } from 'vue-infinity';
  registerElements();
  
  const gallery = document.getElementById('gallery');
  gallery.updateImages([
    'image1.jpg',
    'image2.jpg',
    'image3.jpg'
  ]);
</script>
```

#### React

```jsx
import { useEffect, useRef } from 'react';
import { registerElements } from 'vue-infinity';

registerElements();

function Gallery() {
  const galleryRef = useRef(null);
  
  useEffect(() => {
    if (galleryRef.current) {
      galleryRef.current.updateImages([
        'image1.jpg',
        'image2.jpg',
        'image3.jpg'
      ]);
    }
  }, []);
  
  return <gallery-ce ref={galleryRef} height="400px" num-cols-to-show="3" />;
}
```

#### Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { registerElements } from 'vue-infinity';
  
  registerElements();
  
  let gallery;
  
  onMount(() => {
    gallery.updateImages([
      'image1.jpg',
      'image2.jpg',
      'image3.jpg'
    ]);
  });
</script>

<gallery-ce bind:this={gallery} height="400px" num-cols-to-show="3" />
```

#### Vue

```vue
<template>
  <gallery-ce ref="galleryRef" height="400px" :num-cols-to-show="3" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { registerElements } from 'vue-infinity';

registerElements();

const galleryRef = ref(null);

onMounted(() => {
  galleryRef.value.updateImages([
    'image1.jpg',
    'image2.jpg',
    'image3.jpg'
  ]);
});
</script>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | String (JSON) | `'[]'` | Array of image URLs or objects with `url`, `title`, and `alt` properties |
| `height` | String | `'400px'` | Height of the gallery container |
| `width` | String | `'100%'` | Width of the gallery container |
| `num-cols-to-show` | Number | `1` | Number of columns to show (can be fractional for partial items) |
| `num-rows-to-show` | Number | `1` | Number of rows to show |
| `gap` | String | `'1rem'` | Gap between items |
| `vertical-scroll` | Boolean | `false` | Whether to scroll vertically instead of horizontally |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `updateImages` | `newItems` (Array or JSON string) | Update the gallery with new images |
| `scrollToItem` | `itemIndex` (Number) | Scroll to a specific item by index |

**Note:** The `registerElements()` function must be called once before using any vue-infinity web components.

## 🎠 Carousel Component

The Carousel component works like the Gallery but for any type of content. It provides a flexible way to display any kind of content in a carousel layout with lazy loading and responsive design.

```vue
<template>
  <Carousel
    :items="items"
    height="400px"
    :numColsToShow="3"
    gap="1rem"
  >
    <template #item="{ item, index }">
      <div class="carousel-item">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </div>
    </template>
  </Carousel>
</template>

<script setup>
import { Carousel } from 'vue-infinity';

const items = [
  { title: 'Item 1', description: 'Description 1' },
  { title: 'Item 2', description: 'Description 2' },
  { title: 'Item 3', description: 'Description 3' }
];
</script>
```

## 🪂 InfiniteCarousel

The InfiniteCarousel works like the Carousel but with the ability to fetch more data as the user scrolls. It integrates with the `useInfiniteList` composable to handle data fetching and caching.

### Creating an InfiniteList

```javascript
import { useInfiniteList } from 'vue-infinity';

const infiniteList = useInfiniteList({
  fetchItems: async (page, signal) => {
    const response = await fetch(`/api/items?page=${page}`, { signal });
    return response.json();
  },
  itemsPerPage: 50,
  maxPagesToCache: 5
});
```

### Using with InfiniteList

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
  itemsPerPage: 20,
  maxPagesToCache: 5
});
</script>
```

## 👻 Ghost Component

The Ghost component is useful when you want to apply visibility based rendering to anything. It optimizes performance by conditionally rendering its slot content. When off-screen, the content is replaced by a dimensionally-identical placeholder.

### Component Usage

```vue
<template>
  <Ghost @on-load="handleLoad" @before-unload="handleBeforeUnload" @on-unload="handleUnload">
    <div style="height: 300px; background-color: lightblue;">
      This content will be replaced when not visible.
    </div>
  </Ghost>
</template>

<script setup>
const handleLoad = () => {
  console.log('Content is now visible and rendered.');
};

const handleBeforeUnload = () => {
  console.log('Content is about to be hidden.');
};

const handleUnload = () => {
  console.log('Content is hidden and replaced by a placeholder.');
};
</script>
```

### Directive Usage

```vue
<template>
  <div v-ghost="{
    rootMargin: '100px',
    onLoad: handleLoad,
    beforeUnload: handleBeforeUnload,
    onUnload: handleUnload
  }">
    <!-- Heavy content goes here -->
  </div>
</template>

<script setup>
const handleLoad = () => {
  console.log('Content is now visible and rendered.');
};

const handleBeforeUnload = () => {
  console.log('Content is about to be hidden.');
};

const handleUnload = () => {
  console.log('Content is hidden and replaced by a placeholder.');
};
</script>
```

## 🔎 AutoObserver

The AutoObserver combines a MutationObserver and IntersectionObserver to allow you to track a container's child elements. It automatically handles new elements and cleaning up removed ones.

- Get notified when elements get added
- Get notified when elements become visible or when they are scrolled out of view

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

## Releases

### v0.8.0 (2025-08-11)

#### New Components and Features
**Gallery Web Component**:
- Simple: Easy to use web component for displaying image galleries with lazy loading, responsive layout and memory efficiency.
- Framework Agnostic: Use in any frontend framework or even plain JavaScript.
- Flexible: Methods to update images and scroll to specific items
- Playground App: Added a demo for the Gallery component in the playground app.
- Documentation Updates: Added comprehensive examples for Vue, React, Svelte, and plain JavaScript
**Carousel Component**:
- Similar to the Gallery but for any type of content.
- Supports lazy loading, easy layout and memory efficiency.
- Supports custom item templates and dynamic content sizing.

### v0.7.0 (2024-07-01)

- **v-ghost Directive**: Introduced the new `v-ghost` directive to optimize performance by automatically unloading off-screen content.
- **Dynamic Item Sizing**: The `InfiniteCarousel` now supports an `onGetItemAspectRatio` callback, enabling it to render items with variable heights.
- **Documentation Updates**: Added instructions for the `v-ghost` directive and the dynamic sizing feature.

## 📄 License

Apache 2.0 License - [https://opensource.org/licenses/Apache-2.0](https://opensource.org/licenses/Apache-2.0)
