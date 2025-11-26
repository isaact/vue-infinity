import { ref } from 'vue'

export function useSortedElements() {
  // Reactive, sorted array of HTMLElements
  const sortedElements = ref<Element[]>([])

  // Helper: get bounding rect
  const rect = (el: Element): DOMRect => el.getBoundingClientRect()

  // Insert element at the correct position
  const insert = (el: Element): void => {
    // Avoid duplicates
    if (sortedElements.value.includes(el)) return

    const r = rect(el)
    const arr = sortedElements.value
    let i = 0

    while (i < arr.length) {
      const ri = rect(arr[i])
      if (r.top < ri.top || (r.top === ri.top && r.left < ri.left)) break
      i++
    }

    arr.splice(i, 0, el)
  }

  // Remove element
  const remove = (el: Element): void => {
    const idx = sortedElements.value.indexOf(el)
    if (idx !== -1) sortedElements.value.splice(idx, 1)
  }

  // Reset the list completely
  const clear = (): void => {
    sortedElements.value = []
  }

  return {
    sortedElements,
    insert,
    remove,
    clear,
  }
}
