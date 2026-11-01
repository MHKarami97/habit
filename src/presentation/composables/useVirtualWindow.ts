import { ref, computed, watch, type Ref } from 'vue';

export function useVirtualWindow<T>(
  items: Ref<readonly T[]> | (() => readonly T[]),
  options?: {
    pageSize?: number;
    initialSize?: number;
  }
) {
  const pageSize = options?.pageSize ?? 24;
  const initialSize = options?.initialSize ?? 24;

  const currentCount = ref(initialSize);

  const allItems = computed(() => {
    return typeof items === 'function' ? items() : items.value;
  });

  const visibleItems = computed(() => {
    return allItems.value.slice(0, currentCount.value);
  });

  const hasMore = computed(() => {
    return currentCount.value < allItems.value.length;
  });

  const loadMore = () => {
    if (hasMore.value) {
      currentCount.value = Math.min(allItems.value.length, currentCount.value + pageSize);
    }
  };

  const reset = () => {
    currentCount.value = initialSize;
  };

  // هر بار فیلتر یا لیست کلی تغییر کرد، به پنجره اولیه بازگرد
  watch(
    () => allItems.value.length,
    () => {
      reset();
    }
  );

  return {
    visibleItems,
    hasMore,
    totalCount: computed(() => allItems.value.length),
    visibleCount: computed(() => visibleItems.value.length),
    loadMore,
    reset
  };
}
