<div style="background-color: #444; width:100%;height:200px">
  <!-- Cloud background (behind) -->
  <img
    src="assets/cloudsLogo.svg"
    alt="Decorative clouds"
    style="width:100%; height:200px"
  />
</div>

# Vue-Infinity

*Build lightning-fast Vue apps that only render what is on-screen*

Vue-Infinity brings a radical efficiency boost to your UI by applying the same principle that powers 3D engines: if it’s not in visible, it doesn’t get rendered. This lets your app handle hundreds or thousands of elements without bloating memory, janking or killing batteries.

Whether you’re building infinite feeds, carousels, media galleries, or dashboards—Vue-Infinity keeps your app fast, smooth, and efficient.

## 🚀 Key Features

### 👻 Ghost Component

The `Ghost` component optimizes performance by conditionally rendering its slot content. When off-screen, the content is replaced by a dimensionally-identical placeholder, "unloading" heavy elements (like videos) while preserving layout.

- **Performance Boost:** Unloads off-screen content to free up resources.
- **Layout Stability:** Replaces hidden content with a correctly-sized placeholder.
- **Event-Driven:** Emits events when its content becomes visible or hidden:
    - `on-load`: Fired when the component's content becomes visible and is rendered.
    - `before-unload`: Fired in the same tick that the component's content starts to become hidden.
    - `on-unload`: Fired in the next tick after the component's content has become hidden and replaced by the placeholder.

**Example:**

```vue
  <Ghost @on-load="handleLoad" @before-unload="handleBeforeUnload" @on-unload="handleUnload">
    <div style="height: 300px; background-color: lightblue;">
      This content will be replaced when not visible.
    </div>
  </Ghost>
```

### 👻 v-ghost Directive

The `v-ghost` directive offers a lightweight, flexible alternative to the `Ghost` component for optimizing performance. By applying `v-ghost` to any element, you can ensure its content is only rendered when it enters the viewport. When off-screen, the element's content is replaced by a placeholder, preserving layout integrity while freeing up system resources.

- **Minimalist Approach:** A simple directive-based solution for lazy rendering.
- **Layout Preservation:** Automatically measures the element and maintains its dimensions when off-screen.
- **Event-Driven Control:** Provides `onLoad`, `beforeUnload`, and `onUnload` callbacks for fine-grained control over the element's lifecycle.

**Example:**

```vue
<template>
  <heavy-component v-ghost="{ onLoad: handleLoad, onUnload: handleUnload }"/>
</template>

<script setup>
const handleLoad = () => {
  console.log('Component loaded!');
};

const handleUnload = () => {
  console.log('Component unloaded!');
};
</script>
```

### 🪂 InfiniteCarousel

A general-purpose virtual scroll component optimized for grid-like or carousel-based layouts.

- Integrates directly with `InfiniteList` for managing data access
- Customizable number of rows and columns
- Configurable as a horizontal or vertical scroller
- Supports custom templates for each item
- Supports custom loading templates
- Allows scrolling to any item with CSS-based scroll snapping
- Supports dynamic item sizing by providing an `onGetItemAspectRatio` callback function that returns the aspect ratio of an item. 

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
  itemsPerPage: 20,
  maxPagesToCache: 5
});
</script>
```

 **Example with Dynamic Item Sizing:**

 ```vue
 <template>
   <InfiniteCarousel
     :infinite-list="infiniteList"
     :height="'60vh'"
     :width="'100%'"
     :numColsToShow="4"
     :numRowsToShow="3"
     :onGetItemAspectRatio="getItemAspectRatio"
   >
     <template #item="{ item }">
       <img :src="item.url" :alt="item.title" class="carousel-img"/>
     </template>
   </InfiniteCarousel>
 </template>

 <script setup>
 import { useInfiniteList } from 'vue-infinity';

 const fetchItems = async (page) => {
   // Replace with your actual data fetching logic
   const response = await fetch(`/api/items?page=${page}`);
   return response.json();
 };

 const infiniteList = useInfiniteList({
   fetchItems,
   itemsPerPage: 30, // Adjust based on your data
   maxPagesToCache: 5
 });

 const getItemAspectRatio = (item) => {
   // Assuming item has width and height properties, or can be parsed from URL
   if (!item || !item.url) {
     return 1; // Default to square if aspect ratio cannot be determined
   }
   try {
     const urlParts = item.url.split('/');
     const width = parseInt(urlParts[urlParts.length - 2], 10);
     const height = parseInt(urlParts[urlParts.length - 1].split('?')[0], 10);
     return width / height;
   } catch (e) {
     console.error("Error parsing item aspect ratio:", e);
     return 1;
   }
 };
 </script>
 ```

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

 ### 🔎 AutoObserver

Enhances the native `IntersectionObserver` by automatically handling new elements and cleaning up removed ones.
- Assign it to a target container and it automatically:
  - observes newly added elements
  - Stops observing removed elements
- Allows filtering elements to observe using custom logic
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

## Releases

### v0.7.0 (2024-07-01)

- **v-ghost Directive**: Introduced the new `v-ghost` directive to optimize performance by automatically unloading off-screen content.
- **Dynamic Item Sizing**: The `InfiniteCarousel` now supports an `onGetItemAspectRatio` callback, enabling it to render items with variable heights.
- **Documentation Updates**: Added instructions for the `v-ghost` directive and the dynamic sizing feature.

## 📄 License

Apache 2.0 License - [https://opensource.org/licenses/Apache-2.0](https://opensource.org/licenses/Apache-2.0)
