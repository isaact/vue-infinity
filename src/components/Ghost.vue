<template>
  <div ref="ghostElement" class="ghost-container">
    <!-- Default slot -->
    <div class="default-slot" ref="defaultSlotContentRef" v-if="isVisible">
      <slot></slot>
    </div>
    <!-- Not visible slot -->
    <div class="not-visible-slot" v-else :style="notVisibleSlotStyle">
      <slot name="not-visible"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, defineEmits, watch } from 'vue';
import { AutoObserver, useAutoObserver } from '../composables/useAutoObserver';

const emit = defineEmits(['on-load', 'before-unload', 'on-unload']);

const ghostElement = ref<HTMLElement | null>(null);
const isVisible = ref(false); // Start as false, observer will determine actual state
const isContentVisible = ref(false);
const defaultSlotContentRef = ref<HTMLElement | null>(null);
const width = ref(0);
const height = ref(0);
let contentObserver: AutoObserver | null = null;

const measureSlotContent = () => {
  if (defaultSlotContentRef.value) {
    const rect = defaultSlotContentRef.value.getBoundingClientRect();
    width.value = rect.width;
    height.value = rect.height;
  }
};

const setupObserver = () => {
  contentObserver = useAutoObserver(ghostElement, (entries) => {
    console.log('AutoObserver entries:', entries);
    const newVisibility = entries[0].isIntersecting;

    if (newVisibility) { // Transition to visible
      isVisible.value = true;
      nextTick(() => {
        if (defaultSlotContentRef.value) { // Ensure Vue has populated the ref
          measureSlotContent();
          isContentVisible.value = true;
          emit('on-load');
        } else {
          console.warn('Ghost: defaultSlotContentRef not available after becoming visible.');
        }
      });
    } else if (!newVisibility && isVisible.value) { // Transition to not visible
      isVisible.value = false;
      isContentVisible.value = false; // Content becomes hidden
      emit('before-unload'); // Emit before-unload in the same tick
      nextTick(() => {
        emit('on-unload'); // Emit on-unload in the next tick
      });
    }
    // If newVisibility === isVisible.value, no change in state, do nothing.
  }, {
    root: null, // Use the viewport as the root
    rootMargin: '0px',
    filter: (entry) => {
      return entry.classList.contains('default-slot') || entry.classList.contains('not-visible-slot');
    },
    // Filter is intentionally removed here based on previous fix for contentObserver
  });
};

onMounted(() => {
  setupObserver();
});

onUnmounted(() => {
  if (contentObserver && typeof (contentObserver as any).disconnect === 'function') {
    (contentObserver as any).disconnect();
    contentObserver = null; // Good practice to nullify after disconnect
  }
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
</script>

<style scoped>
.not-visible-slot {
  /* Keep contain: content as requested */
  contain: content;
}
</style>