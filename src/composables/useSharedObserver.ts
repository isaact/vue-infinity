import type { DirectiveBinding } from 'vue';

// Map to hold shared IntersectionObservers, keyed by rootMargin.
const observers = new Map<
  string,
  {
    observer: IntersectionObserver;
    elements: Map<HTMLElement, (isIntersecting: boolean) => void>; // Map elements to their callbacks
  }
>();

// The shared callback for all IntersectionObservers.
const intersectionCallback = (entries: IntersectionObserverEntry[]) => {
  for (const entry of entries) {
    const el = entry.target as HTMLElement;
    const rootMargin = getObserverKeyForElement(el);
    if (rootMargin) {
      const callback = observers.get(rootMargin)?.elements.get(el);
      if (callback) {
        callback(entry.isIntersecting);
      }
    }
  }
};

// WeakMap to track which observer an element belongs to.
const elementObserverMap = new WeakMap<HTMLElement, string>();

function getObserverKeyForElement(el: HTMLElement): string | undefined {
  return elementObserverMap.get(el);
}

export function useSharedObserver() {
  const observe = (
    el: HTMLElement,
    callback: (isIntersecting: boolean) => void,
    rootMargin: string,
  ) => {
    let observerData = observers.get(rootMargin);
    if (!observerData) {
      const observer = new IntersectionObserver(intersectionCallback, {
        root: null,
        rootMargin,
        threshold: 0.0,
      });
      observerData = { observer, elements: new Map() };
      observers.set(rootMargin, observerData);
    }

    observerData.elements.set(el, callback);
    elementObserverMap.set(el, rootMargin);
    observerData.observer.observe(el);
  };

  const unobserve = (el: HTMLElement) => {
    const rootMargin = getObserverKeyForElement(el);
    if (rootMargin) {
      const observerData = observers.get(rootMargin);
      if (observerData) {
        observerData.observer.unobserve(el);
        observerData.elements.delete(el);
        elementObserverMap.delete(el);

        if (observerData.elements.size === 0) {
          observerData.observer.disconnect();
          observers.delete(rootMargin);
        }
      }
    }
  };

  return { observe, unobserve };
}