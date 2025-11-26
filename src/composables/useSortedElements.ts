import { ref } from 'vue'

export function useSortedElements() {
  const sortedElements = ref<Element[]>([])
  const elementSet = new Set<Element>() // track membership

  // helper: get bounding rect
  const rect = (el: Element): DOMRect => el.getBoundingClientRect()

  const insert = (el: Element): void => {
    // O(1) check
    if (elementSet.has(el)) return

    const r = rect(el)
    const arr = sortedElements.value
    let i = 0

    while (i < arr.length) {
      const ri = rect(arr[i])
      if (r.top < ri.top || (r.top === ri.top && r.left < ri.left)) break
      i++
    }

    arr.splice(i, 0, el)
    elementSet.add(el)
  }

  const remove = (el: Element): void => {
    const idx = sortedElements.value.indexOf(el)
    if (idx !== -1) {
      sortedElements.value.splice(idx, 1)
      elementSet.delete(el)
    }
  }

  const clear = (): void => {
    sortedElements.value = []
    elementSet.clear()
  }

  return {
    sortedElements,
    insert,
    remove,
    clear,
  }
}
