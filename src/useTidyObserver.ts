import { onBeforeUnmount, watch, type Ref } from 'vue'

export interface TidyObserverOptions extends IntersectionObserverInit {
  selector?: string
  filter?: (el: Element) => boolean
}

export interface TidyObserver {
  observedElements: Set<Element>
  disconnect: () => void
}

export function useTidyObserver(
  containerRef: Ref<HTMLElement | null>,
  callback: IntersectionObserverCallback,
  options: TidyObserverOptions = {}
): TidyObserver {
  const {
    selector = '*',
    filter = () => true,
    root = null,
    rootMargin,
    threshold,
  } = options

  const observer = new IntersectionObserver(callback, {
    root,
    rootMargin,
    threshold,
  })

  const observedElements = new Set<Element>()

  const observeChildren = () => {
    if (!containerRef.value) return

    const elements = Array.from(containerRef.value.querySelectorAll(selector))
    elements.forEach(el => {
      if (!observedElements.has(el) && filter(el)) {
        observer.observe(el)
        observedElements.add(el)
      }
    })
  }

  const unobserveRemoved = (nodes: NodeList) => {
    nodes.forEach(node => {
      if (node.nodeType === 1) {
        const element = node as Element
        if (observedElements.has(element)) {
          observer.unobserve(element)
          observedElements.delete(element)
        }
      }
    })
  }

  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      unobserveRemoved(mutation.removedNodes)
      observeChildren() // in case new nodes were added
    }
  })

  const cleanup = () => {
    observer.disconnect()
    mutationObserver.disconnect()
    observedElements.clear()
  }

  watch(containerRef, (newVal) => {
    cleanup()
    if (newVal) {
      mutationObserver.observe(newVal, {
        childList: true,
        subtree: true,
      })
      observeChildren()
    }
  }, { immediate: true })

  onBeforeUnmount(cleanup)

  return {
    observedElements,
    disconnect: cleanup,
  }
}
