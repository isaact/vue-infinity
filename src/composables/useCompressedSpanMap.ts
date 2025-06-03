// useCompressedSpanIndexMap.ts
import { ref } from 'vue';

type Span = [number, number]; // [colSpan, rowSpan]

export function useCompressedSpanMap(defaultSpan: Span = [1, 1]) {
  const reverseDict: Span[] = [defaultSpan];
  const spanDict = new Map<string, number>(); // "col:row" → spanId
  const indexToSpanId = ref(new Map<number, number>()); // index → spanId

  function getSpanId(col: number, row: number): number {
    if (col === defaultSpan[0] && row === defaultSpan[1]) return 0;

    const key = `${col}:${row}`;
    if (!spanDict.has(key)) {
      const id = reverseDict.length;
      spanDict.set(key, id);
      reverseDict.push([col, row]);
      return id;
    }
    return spanDict.get(key)!;
  }

  function set(index: number, col: number, row: number) {
    const spanId = getSpanId(col, row);
    if (spanId === 0) {
      indexToSpanId.value.delete(index);
    } else {
      indexToSpanId.value.set(index, spanId);
    }
  }

  function get(index: number): Span {
    const spanId = indexToSpanId.value.get(index) ?? 0;
    return reverseDict[spanId];
  }

  function has(index: number): boolean {
    return indexToSpanId.value.has(index);
  }

  function deleteSpan(index: number) {
    indexToSpanId.value.delete(index);
  }

  function clear() {
    indexToSpanId.value.clear();
  }

  function size(): number {
    return indexToSpanId.value.size;
  }

  return {
    get,
    set,
    has,
    delete: deleteSpan,
    clear,
    size,
    map: indexToSpanId,
  };
}
