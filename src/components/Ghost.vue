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
import { ref, computed, onMounted, onUnmounted, nextTick, defineEmits, watch } from 'vue';
import { AutoObserver, useAutoObserver } from '../composables/useAutoObserver';

const emit = defineEmits(['on-load', 'before-unload', 'on-unload']);

const ghostElement = ref<HTMLElement | null>(null);
const isVisible = ref(true); // Start as false, observer will determine actual state
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
    // console.log('AutoObserver entries:', entries);
    
    for (const entry of entries) {
      const newVisibility = entry.isIntersecting;
      if (newVisibility && !isVisible.value) { // Transition to visible
        isVisible.value = true;
        nextTick(() => {
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
    }
  }, {
    root: null, // Use the viewport as the root
    rootMargin: '0px',
    filter: (entry) => {
      return entry.classList.contains('default-slot') || entry.classList.contains('not-visible-container');
    },
    // Filter is intentionally removed here based on previous fix for contentObserver
  });
};

onMounted(() => {
  measureSlotContent();
  setupObserver();
});

onUnmounted(() => {
  if (contentObserver && typeof (contentObserver as any).disconnect === 'function') {
    (contentObserver as any).disconnect();
    contentObserver = null; // Good practice to nullify after disconnect
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