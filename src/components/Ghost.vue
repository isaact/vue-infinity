<template>
  <div ref="ghostElement" class="ghost-component">
    <!-- Default slot -->
    <div ref="defaultSlotContentRef" v-if="isVisible" :style="{ visibility: isContentVisible ? 'visible' : 'hidden' }">
      <slot></slot>
    </div>
    <!-- Not visible slot -->
    <div class="not-visible-slot" v-else :style="notVisibleSlotStyle">
      <slot name="not-visible"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
// Remove useElementVisibility import
// Remove render and h imports

export default defineComponent({
  name: 'Ghost',
  setup(props, { slots }) { // Access slots
    const ghostElement = ref<HTMLElement | null>(null);
    const isVisible = ref(true);
    const isContentVisible = ref(false);
    const defaultSlotContentRef = ref<HTMLElement | null>(null); // Still needed for ResizeObserver when visible
    const width = ref(0);
    const height = ref(0);
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const measureSlotContent = () => {
      // This function handles measurement in the main DOM when visible
      if (defaultSlotContentRef.value) {
        const rect = defaultSlotContentRef.value.getBoundingClientRect();
        width.value = rect.width;
        height.value = rect.height;
      }
    };

    onMounted(() => {
      // Setup IntersectionObserver
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          isVisible.value = entries[0].isIntersecting;
        },
        {
          root: null, // Use the viewport as the root
          rootMargin: '0px',
          threshold: 0.1, // Trigger when 10% of the element is visible
        }
      );

      if (ghostElement.value) {
        intersectionObserver.observe(ghostElement.value);
      }

      // Setup ResizeObserver for when the default slot is in the main DOM
      // This will update dimensions if the size changes while visible
      watch(defaultSlotContentRef, (newValue) => {
        if (newValue) {
           resizeObserver = new ResizeObserver((entries) => {
             for (const entry of entries) {
               width.value = entry.contentRect.width;
               height.value = entry.contentRect.height;
             }
           });
           resizeObserver.observe(newValue);
        } else if (resizeObserver) {
           // Disconnect observer when the default slot is removed from the DOM
           resizeObserver.disconnect();
           resizeObserver = null;
        }
      }, { immediate: false });
      
      // Measure initial size after the component is mounted and the default slot is rendered (but hidden)
      // This will only happen if v-if="isIntersecting" is true on mount
      nextTick(() => {
        measureSlotContent();
        isContentVisible.value = true; // Set content to visible after measurement
      });
    });

    onUnmounted(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (intersectionObserver && ghostElement.value) {
        intersectionObserver.unobserve(ghostElement.value);
        intersectionObserver.disconnect();
      }
    });

    // Watch for intersection changes to update dimensions if needed
    watch(isVisible, (newValue, oldValue) => {
      if (newValue === true && oldValue === false) {
        // Component became visible, re-measure the default slot content in the main DOM
        // This will also happen on initial intersection if not visible on mount
        measureSlotContent();
      }
      // No need to measure when becoming not visible, we use the last known dimensions
    });

    const notVisibleSlotStyle = computed(() => {
      // Apply dimensions only when not intersecting and dimensions are available
      if (!isVisible.value && width.value > 0 && height.value > 0) {
        return {
          width: `${width.value}px`,
          height: `${height.value}px`,
        };
      }
      return {}; // Return empty object when intersecting or size is not determined
    });

    return {
      ghostElement,
      isVisible, // Expose the new flag
      isContentVisible, // Expose the visibility style flag
      defaultSlotContentRef,
      notVisibleSlotStyle,
    };
  },
});
</script>

<style scoped>
.not-visible-slot {
  /* Keep contain: content as requested */
  contain: content;
}
</style>