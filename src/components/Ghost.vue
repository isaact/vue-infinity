<template>
  <div ref="ghostElement" class="ghost-container">
    <!-- Default slot -->
    <div class="default-slot" ref="defaultSlotContentRef">
      <slot v-if="isVisible"></slot>
      <div v-else class="not-visible-container" :style="notVisibleSlotStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, defineEmits, defineProps } from 'vue';
import { useSharedObserver } from '../composables/useSharedObserver';

const props = defineProps({
  rootMargin: {
    type: String,
    default: '22%',
  },
});

const emit = defineEmits(['on-load', 'before-unload', 'on-unload']);

const ghostElement = ref<HTMLElement | null>(null);
const isVisible = ref(true); // Start as true, observer will determine actual state
const defaultSlotContentRef = ref<HTMLElement | null>(null);
const width = ref(0);
const height = ref(0);

const { observe, unobserve } = useSharedObserver();

const measureSlotContent = () => {
  if (defaultSlotContentRef.value) {
    const rect = defaultSlotContentRef.value.getBoundingClientRect();
    width.value = rect.width;
    height.value = rect.height;
  }
};

const handleIntersection = (isNowVisible: boolean) => {
  if (isNowVisible && !isVisible.value) {
    // Transition to visible
    isVisible.value = true;
    nextTick(() => {
      measureSlotContent();
      emit('on-load');
    });
  } else if (!isNowVisible && isVisible.value) {
    // Transition to not visible
    emit('before-unload');
    isVisible.value = false;
    nextTick(() => {
      emit('on-unload');
    });
  }
};

onMounted(() => {
  if (defaultSlotContentRef.value) {
    measureSlotContent();
    observe(defaultSlotContentRef.value, handleIntersection, props.rootMargin);
  }
});

onUnmounted(() => {
  if (defaultSlotContentRef.value) {
    unobserve(defaultSlotContentRef.value);
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
.not-visible-container {
  contain: size;
  content-visibility: auto;
}
</style>