import { ref, type Ref } from 'vue';

export function useDebouncedRef<T>(initialValue: T, delay = 300): Ref<T> {
  const state = ref(initialValue) as Ref<T>;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return {
    get value() {
      return state.value;
    },
    set value(newValue: T) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        state.value = newValue;
      }, delay);
    }
  } as unknown as Ref<T>;
}

export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delay = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
