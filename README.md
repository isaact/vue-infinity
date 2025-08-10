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

- [Key Features](#-key-features)
  - [Ghost Component](#-ghost-component)
  - [v-ghost Directive](#-v-ghost-directive)
  - [InfiniteCarousel](#-infinitecarousel)
  - [InfiniteList](#-infinitelist)
  - [AutoObserver](#-autoobserver)
  - [Gallery Web Component](#-gallery-web-component)
- [Installation](#-installation)
- [Live Demo](#-live-demo)
- [Run Playground App](#-run-playground-app)
- [Releases](#releases)
- [License](#-license)

## 🚀 Key Features

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

**Basic Example (Video):**

```vue
<template>
  <video controls muted playsinline v-ghost>
    <source src="your-video.mp4" type="video/mp4" />
  </video>
</template>
```

**Advanced Example (All Options):**

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

### 🖼️ Gallery Web Component

The `vue-gallery` is a web component built on top of the Carousel component that provides an easy way to display a gallery of images with features like lazy loading, responsive layout, and dynamic sizing. It's designed to efficiently handle large collections of images while maintaining smooth performance.

- **Web Component**: Can be used in any framework or vanilla JavaScript
- **Flexible Layout**: Configurable grid layout with customizable columns and rows
- **Image Handling**: Supports both simple URL arrays and complex objects with metadata
- **Responsive Design**: Automatically adapts to container size
- **Lazy Loading**: Only renders visible images for optimal performance
- **Error Handling**: Gracefully handles broken images with fallback placeholders
- **Dynamic Sizing**: Supports variable aspect ratios for images
- **Programmatic Control**: Exposes methods for updating images and scrolling to specific items

**Basic Example (Simple URLs):**

```html
<vue-gallery
  items='["image1.jpg", "image2.jpg", "image3.jpg"]'
  height="400px"
  width="100%"
  num-cols-to-show="3"
  gap="1rem"
/>
```

**Advanced Example (With Metadata):**

```html
<vue-gallery
  id="my-gallery"
  items='[
    {"url": "image1.jpg", "title": "Beautiful Landscape", "alt": "Mountain landscape"},
    {"url": "image2.jpg", "title": "Ocean View", "alt": "Beach with blue water"},
    {"url": "image3.jpg", "title": "City Skyline", "alt": "Night view of city"}
  ]'
  height="50vh"
  width="100%"
  num-cols-to-show="2.5"
  gap="1rem"
  :on-get-item-aspect-ratio="getItemAspectRatio"
/>
```

**JavaScript Integration:**

```javascript
// Get reference to the gallery
const gallery = document.getElementById('my-gallery');

// Update images programmatically
gallery.updateImages([
  'newImage1.jpg',
  'newImage2.jpg',
  'newImage3.jpg'
]);

// Scroll to a specific item
gallery.scrollToItem(5);

// Function to calculate aspect ratio (for dynamic sizing)
function getItemAspectRatio(item) {
  // Extract from URL or use item metadata
  if (item.width && item.height) {
    return item.width / item.height;
  }
  return 1; // Default square aspect ratio
}
```

**Vue Integration:**

```vue
<template>
  <vue-gallery
    ref="galleryRef"
    :items="JSON.stringify(galleryItems)"
    height="43vh"
    :num-cols-to-show="2.5"
    gap="1rem"
    :on-get-item-aspect-ratio="getItemAspectRatio"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';

const galleryRef = ref();
const galleryItems = ref([
  { url: 'image1.jpg', title: 'Beautiful Landscape', alt: 'Mountain landscape' },
  { url: 'image2.jpg', title: 'Ocean View', alt: 'Beach with blue water' },
  { url: 'image3.jpg', title: 'City Skyline', alt: 'Night view of city' }
]);

const getItemAspectRatio = (item) => {
  if (item.width && item.height) {
    return item.width / item.height;
  }
  return 1; // Default square aspect ratio
};

// Update gallery items
const updateGallery = (newItems) => {
  galleryItems.value = newItems;
};

// Scroll to item
const scrollToItem = (index) => {
  galleryRef.value.scrollToItem(index);
};
</script>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | String (JSON) | `'[]'` | Array of image URLs or objects with `url`, `title`, and `alt` properties |
| `height` | String | `'400px'` | Height of the gallery container |
| `width` | String | `'100%'` | Width of the gallery container |
| `num-cols-to-show` | Number | `1` | Number of columns to show (can be fractional for partial items) |
| `num-rows-to-show` | Number | `1` | Number of rows to show |
| `gap` | String | `'1rem'` | Gap between items |
| `vertical-scroll` | Boolean | `false` | Whether to scroll vertically instead of horizontally |
| `carousel-style` | Object | `{}` | Additional styles to apply to the carousel |
| `on-get-item-aspect-ratio` | Function | `undefined` | Function to calculate aspect ratio for dynamic sizing |

**Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `updateImages` | `newItems` (Array or JSON string) | Update the gallery with new images |
| `scrollToItem` | `itemIndex` (Number) | Scroll to a specific item by index |

### 🌐 Using Gallery as a Web Component Outside of Vue

The Gallery component can be used as a standalone web component in any framework or even in vanilla HTML/JavaScript projects. To use it outside of Vue, you need to register the custom elements first.

**Installation:**

```bash
npm install vue-infinity
```

**Usage in HTML/JavaScript:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Gallery Web Component Demo</title>
</head>
<body>
  <vue-gallery
    id="my-gallery"
    height="50vh"
    width="100%"
    num-cols-to-show="3"
    gap="1rem">
  </vue-gallery>

  <script type="module">
    // Import and register the custom elements
    import { registerElements } from 'vue-infinity';
    
    // Register custom elements
    registerElements();
    
    // Now you can use the gallery
    const gallery = document.getElementById('my-gallery');
    
    // Set the images (must be valid JSON string)
    gallery.items = JSON.stringify([
      'image1.jpg',
      'image2.jpg',
      'image3.jpg'
    ]);
    
    // You can also update images later
    setTimeout(() => {
      gallery.updateImages([
        'newImage1.jpg',
        'newImage2.jpg',
        'newImage3.jpg'
      ]);
    }, 5000);
  </script>
</body>
</html>
```

**Usage in Other Frameworks (e.g., React):**

```jsx
import React, { useEffect } from 'react';
import { registerElements } from 'vue-infinity';

// Register custom elements once
registerElements();

function GalleryComponent() {
  const galleryRef = React.useRef(null);
  
  useEffect(() => {
    if (galleryRef.current) {
      // Set the images
      galleryRef.current.items = JSON.stringify([
        { url: 'image1.jpg', title: 'Image 1' },
        { url: 'image2.jpg', title: 'Image 2' },
        { url: 'image3.jpg', title: 'Image 3' }
      ]);
    }
  }, []);
  
  const updateImages = () => {
    if (galleryRef.current) {
      galleryRef.current.updateImages([
        'newImage1.jpg',
        'newImage2.jpg'
      ]);
    }
  };
  
  return (
    <div>
      <vue-gallery
        ref={galleryRef}
        height="50vh"
        width="100%"
        num-cols-to-show="2.5"
        gap="1rem"
      />
      <button onClick={updateImages}>Update Images</button>
    </div>
  );
}

export default GalleryComponent;
```

**Important Notes:**

1. The `items` attribute must be a valid JSON string. When setting it programmatically, use `JSON.stringify()` to convert your array to a JSON string.
2. The `registerElements()` function must be called once before using any vue-infinity web components.
3. All component methods like `updateImages()` and `scrollToItem()` are available on the DOM element.
4. Event handling follows standard web component patterns.

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
