<template>
  <div ref="ghostElement" class="ghost-component">
    <template v-if="isVisible">
      <!-- Default slot -->
      <div ref="defaultSlotContentRef">
        <slot></slot>
      </div>
    </template>
    <template v-else>
      <!-- Not visible slot -->
      <div class="not-visible-slot" :style="notVisibleSlotStyle">
        <slot name="not-visible"></slot>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useElementVisibility } from '@vueuse/core';
import { render, h } from 'vue'; // Import render and h for manual VNode rendering

export default defineComponent({
  name: 'Ghost',
  setup(props, { slots }) { // Access slots
    const ghostElement = ref<HTMLElement | null>(null);
    const isVisible = useElementVisibility(ghostElement);

    const defaultSlotContentRef = ref<HTMLElement | null>(null); // Still needed for ResizeObserver when visible
    const width = ref(0);
    const height = ref(0);
    let resizeObserver: ResizeObserver | null = null;

    const measureSlotContent = () => {
      // This function handles measurement in the main DOM when visible
      if (defaultSlotContentRef.value) {
        const rect = defaultSlotContentRef.value.getBoundingClientRect();
        width.value = rect.width;
        height.value = rect.height;
      }
    };

    const measureInitialSizeInShadowDom = async () => {
      if (slots.default && !isVisible.value && ghostElement.value) {
        // Create a temporary element and attach shadow DOM
        const tempDiv = document.createElement('div');
        // Append to body or ghostElement to ensure it's in a document, but hidden
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        const shadowRoot = tempDiv.attachShadow({ mode: 'open' });

        // Get default slot VNodes
        const slotContent = slots.default();

        // Create a container element inside shadow DOM to render slot content into
        const container = document.createElement('div');
        shadowRoot.appendChild(container);

        // Create a simple component wrapper to render the slot content
        const wrapperComponent = defineComponent({
          render() {
            // Render the slot content VNodes
            return h('div', slotContent);
          }
        });

        // Create a VNode for the wrapper component
        const wrapperVNode = h(wrapperComponent);

        // Render the wrapper component VNode into the container in the shadow DOM
        render(wrapperVNode, container);

        // Wait for rendering to complete
        await nextTick();

        // Measure the content in the shadow DOM
        const contentElement = container.firstChild as HTMLElement; // Assuming slot renders a single root element
        if (contentElement) {
           const rect = contentElement.getBoundingClientRect();
           width.value = rect.width;
           height.value = rect.height;
        }

        // Clean up
        render(null, container); // Unmount the component
        document.body.removeChild(tempDiv);
      }
    };


    onMounted(() => {
      // Attempt initial measurement in shadow DOM if not visible
      if (!isVisible.value) {
         measureInitialSizeInShadowDom();
      }

      // Setup ResizeObserver for when the default slot is in the main DOM
      // This will update dimensions if the size changes while visible
      // We need to watch defaultSlotContentRef because it's only available when v-if="isVisible" is true
      watch(defaultSlotContentRef, (newValue, oldValue) => {
        if (newValue && isVisible.value) {
           resizeObserver = new ResizeObserver((entries) => {
             for (const entry of entries) {
               width.value = entry.contentRect.width;
               height.value = entry.contentRect.height;
             }
           });
           resizeObserver.observe(newValue);
        } else if (!newValue && resizeObserver) {
           // Disconnect observer when the default slot is removed from the DOM
           resizeObserver.disconnect();
           resizeObserver = null;
        }
      }, { immediate: false }); // No immediate run, wait for isVisible to become true and ref to be set
    });

    onUnmounted(() => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    });

    // Watch for visibility changes to update dimensions
    watch(isVisible, (newValue, oldValue) => {
      if (newValue === true && oldValue === false) {
        // Component became visible, re-measure the default slot content in the main DOM
        // The watch on defaultSlotContentRef will handle setting up the ResizeObserver
        measureSlotContent();
      } else if (newValue === false && oldValue === true) {
        // Component became not visible, attempt initial measurement in shadow DOM
        measureInitialSizeInShadowDom();
      }
    });

    const notVisibleSlotStyle = computed(() => {
      // Apply dimensions only when not visible and dimensions are available
      if (!isVisible.value && width.value > 0 && height.value > 0) {
        return {
          width: `${width.value}px`,
          height: `${height.value}px`,
        };
      }
      return {}; // Return empty object when visible or size is not determined
    });

    return {
      ghostElement,
      isVisible,
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