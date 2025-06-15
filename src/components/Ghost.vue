<template>
  <div ref="ghostElement" class="ghost-container">
    <!-- Default slot -->
    <div class="default-slot" ref="defaultSlotContentRef">
      <slot v-if="isVisible"></slot>
      <div v-else class="not-visible-container"  :style="notVisibleSlotStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, defineEmits, watch, defineProps } from 'vue';

const props = defineProps({
  rootMargin: {
    type: String,
    default: '22%',
  },
});

const emit = defineEmits(['on-load', 'before-unload', 'on-unload']);

const ghostElement = ref<HTMLElement | null>(null);
const isVisible = ref(true); // Start as false, observer will determine actual state
const defaultSlotContentRef = ref<HTMLElement | null>(null);
const width = ref(0);
const height = ref(0);
let intersectionObserver: IntersectionObserver | null = null;

const measureSlotContent = () => {
  if (defaultSlotContentRef.value) {
    const rect = defaultSlotContentRef.value.getBoundingClientRect();
    width.value = rect.width;
    height.value = rect.height;
  }
};

const setupObserver = () => {
  if (!defaultSlotContentRef.value) {
    console.warn('Ghost: defaultSlotContentRef not available to observe.');
    return;
  }

  const observerOptions = {
    root: null, // Use the viewport as the root
    rootMargin: props.rootMargin,
    threshold: 0.0, // Can be a single number or an array of numbers
  };

  intersectionObserver = new IntersectionObserver((entries) => {
    // console.log('IntersectionObserver entries:', entries);
    if (entries.length === 0) return;

    const entry = entries[0]; // We are observing a single element
    const newVisibility = entry.isIntersecting;

    if (newVisibility && !isVisible.value) { // Transition to visible
      isVisible.value = true;
      nextTick(() => {
        // Re-measure content in case actual slot content has different dimensions
        // though defaultSlotContentRef should resize with its content.
        measureSlotContent();
        emit('on-load');
      });
    } else if (!newVisibility && isVisible.value) { // Transition to not visible
      isVisible.value = false;
      emit('before-unload'); // Emit before-unload in the same tick
      nextTick(() => {
        emit('on-unload'); // Emit on-unload in the next tick
      });
    }
  }, observerOptions);

  intersectionObserver.observe(defaultSlotContentRef.value);
};

onMounted(() => {
  // Ensure initial dimensions are set for the placeholder
  measureSlotContent();
  // Setup the observer after the ref is available
  setupObserver();
});

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
});

const notVisibleSlotStyle = computed(() => {
    return {
      width: `${width.value}px`,
      height: `${height.value}px`,
    };
});
</script>

<style scoped>
</style>