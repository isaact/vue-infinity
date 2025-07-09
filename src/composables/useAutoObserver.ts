export interface AutoObserverOptions extends IntersectionObserverInit {
  selector?: string
  filter?: (el: Element) => boolean
}

export interface AutoObserver {
  observedElements: Set<Element>,
  // intersectionObserver: IntersectionObserver,
  // mutationObserver: MutationObserver,
  observeContainer: (container: HTMLElement | null) => void,
  disconnect: () => void
}

export function useAutoObserver(
  // containerRef: Ref<HTMLElement | null>,
  callback: IntersectionObserverCallback,
  options: AutoObserverOptions = {}
): AutoObserver {
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

  const observeContainer = (container: HTMLElement | null) => {
    cleanup()
    if (container) {
      mutationObserver.observe(container, {
        childList: true,
        subtree: false,
      })
      console.log('Observing container:', container)
      // observeChildren()
    }
  }

  // const observeChildren = () => {
  //   if (!containerRef.value) return

  //   const elements = Array.from(containerRef.value.querySelectorAll(selector))
  //   elements.forEach(el => {
  //     if (!observedElements.has(el) && filter(el)) {
  //       observer.observe(el)
  //       observedElements.add(el)
  //     }
  //   })
  // }

  const observeAdded = (nodes: NodeList) => {
    nodes.forEach((node) => {
      if (node.nodeType !== 1) return
      const element = node as Element

      if (element.matches(selector) && !observedElements.has(element) && filter(element)) {
        observer.observe(element)
        observedElements.add(element)
      }
    })
  }

  const unobserveRemoved = (nodes: NodeList) => {
    nodes.forEach((node) => {
      if (node.nodeType !== 1) return
      const element = node as Element

      if (observedElements.has(element)) {
        observer.unobserve(element)
        observedElements.delete(element)
      }
    })
  }

  const mutationObserver = new MutationObserver((mutations) => {
    console.log('MutationObserver detected changes:', mutations)
    for (const mutation of mutations) {
      unobserveRemoved(mutation.removedNodes)
      observeAdded(mutation.addedNodes)
    }
  })

  const cleanup = () => {
    observer.disconnect()
    mutationObserver.disconnect()
    observedElements.clear()
  }

  // watch(containerRef, (newVal) => {
  //   cleanup()
  //   if (newVal) {
  //     console.log('Container ref changed:', newVal)
  //     mutationObserver.observe(newVal, {
  //       childList: true,
  //       subtree: false,
  //     })
  //     // observeChildren()
  //   }
  // }, { immediate: true })

  // onBeforeUnmount(cleanup)
  // onMounted(() => {
  //   if (containerRef.value) {
  //     mutationObserver.observe(containerRef.value, {
  //       childList: true,
  //       subtree: true,
  //     })
  //     // observeChildren()
  //   }
  // })

  return {
    observedElements,
    // intersectionObserver: observer,
    // mutationObserver,
    observeContainer,
    disconnect: cleanup,
  }
}
