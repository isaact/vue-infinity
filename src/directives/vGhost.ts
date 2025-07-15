import type { Directive, DirectiveBinding } from 'vue';
import { useSharedObserver } from '../composables/useSharedObserver';

/**
 * Interface for the binding value of the v-ghost directive.
 * @property {string} [rootMargin='22%'] - The root margin for the IntersectionObserver.
 * @property {() => void} [onLoad] - Callback executed when the element becomes visible.
 * @property {() => void} [beforeUnload] - Callback executed just before the element is hidden.
 * @property {() => void} [onUnload] - Callback executed after the element is hidden.
 */
interface GhostBinding {
  rootMargin?: string;
  onLoad?: () => void;
  beforeUnload?: () => void;
  onUnload?: () => void;
}

// Use a WeakMap to store state for each element, to avoid memory leaks.
const elementStateMap = new WeakMap<
  HTMLElement,
  {
    binding: DirectiveBinding<GhostBinding>;
    children: ChildNode[];
    isVisible: boolean;
    width: number;
    height: number;
  }
>();

/**
 * Measures the element's dimensions and stores them in the state.
 * @param {HTMLElement} el - The element to measure.
 */
const measure = (el: HTMLElement) => {
  const state = elementStateMap.get(el);
  if (state) {
    const rect = el.getBoundingClientRect();
    state.width = rect.width;
    state.height = rect.height;
  }
};

/**
 * Hides the element's content and replaces it with a placeholder.
 * @param {HTMLElement} el - The element to hide.
 * @param {DirectiveBinding<GhostBinding>} binding - The directive's binding object.
 */
const hide = (el: HTMLElement, binding: DirectiveBinding<GhostBinding>) => {
  const state = elementStateMap.get(el);
  if (!state || !state.isVisible) return;

  binding.value?.beforeUnload?.();

  measure(el);
  state.isVisible = false;
  state.children = Array.from(el.childNodes);

  // Replace content with a comment node to keep the element in the DOM.
  el.replaceChildren(document.createComment('v-ghost'));

  // Apply styles to maintain layout.
  el.style.width = `${state.width}px`;
  el.style.height = `${state.height}px`;
  el.style.contain = 'size';
  el.style.contentVisibility = 'auto';

  binding.value?.onUnload?.();
};

/**
 * Shows the element's original content.
 * @param {HTMLElement} el - The element to show.
 * @param {DirectiveBinding<GhostBinding>} binding - The directive's binding object.
 */
const show = (el: HTMLElement, binding: DirectiveBinding<GhostBinding>) => {
  const state = elementStateMap.get(el);
  if (!state || state.isVisible) return;

  state.isVisible = true;

  // Restore original styles and content.
  el.style.width = '';
  el.style.height = '';
  el.style.contain = '';
  el.style.contentVisibility = '';
  el.replaceChildren(...state.children);
  state.children = [];

  binding.value?.onLoad?.();
};

/**
 * The v-ghost directive.
 * Lazily renders the content of an element when it becomes visible in the viewport.
 */
const vGhost: Directive<HTMLElement, GhostBinding> = {
  mounted(el, binding) {
    const { observe } = useSharedObserver();
    const { rootMargin = '22%' } = binding.value || {};

    const intersectionCallback = (isIntersecting: boolean) => {
      const state = elementStateMap.get(el);
      if (!state) return;

      if (isIntersecting) {
        show(el, state.binding);
      } else {
        hide(el, state.binding);
      }
    };

    elementStateMap.set(el, {
      binding,
      children: [],
      isVisible: true, // Assume visible initially to hide it correctly
      width: 0,
      height: 0,
    });

    measure(el);
    observe(el, intersectionCallback, rootMargin);
  },

  updated(el, binding) {
    const state = elementStateMap.get(el);
    if (state) {
      state.binding = binding;
    }
  },

  unmounted(el) {
    const { unobserve } = useSharedObserver();
    unobserve(el);
    elementStateMap.delete(el);
  },
};

export default vGhost;