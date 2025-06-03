// useCompressedSpanIndexMap.ts
import { ref } from 'vue';

type Span = [number, number]; // [colSpan, rowSpan]
export type ItemSpan = {
  colSpan: number
  rowSpan: number
}


export function useCompressedSpanMap(defaultSpan: ItemSpan = { colSpan: 1, rowSpan: 1 }) {
  const reverseDict: Span[] = [[defaultSpan.colSpan, defaultSpan.rowSpan]]; // 0 is the default span
  const spanDict = new Map<string, number>(); // "col:row" → spanId
  const indexToSpanId = ref(new Map<number, number>()); // index → spanId

  function getSpanId(col: number, row: number): number {
    if (col === defaultSpan.colSpan && row === defaultSpan.rowSpan) return 0;

    const key = `${col}:${row}`;
    if (!spanDict.has(key)) {
      const id = reverseDict.length;
      spanDict.set(key, id);
      reverseDict.push([col, row]);
      return id;
    }
    return spanDict.get(key)!;
  }

  function set(index: number, span: ItemSpan) {
    const spanId = getSpanId(span.colSpan, span.rowSpan);
    if (spanId === 0) {
      indexToSpanId.value.delete(index);
    } else {
      indexToSpanId.value.set(index, spanId);
    }
  }

  function get(index: number): ItemSpan {
    const spanId = indexToSpanId.value.get(index) ?? 0;
    return {
      colSpan: reverseDict[spanId][0],
      rowSpan: reverseDict[spanId][1],
    };
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
