import { ref, onMounted } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'kavosh_theme';
const currentTheme = ref<ThemeMode>('system');
const resolvedTheme = ref<'light' | 'dark'>('light');

export function useTheme() {
  const applyTheme = (theme: ThemeMode) => {
    currentTheme.value = theme;
    localStorage.setItem(STORAGE_KEY, theme);

    let isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    resolvedTheme.value = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolvedTheme.value);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#181513' : '#FAF7F2');
    }
  };

  onMounted(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system';
    applyTheme(saved);

    // شنود تغییر تم سیستم‌عامل در حالت خودکار
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (currentTheme.value === 'system') {
        applyTheme('system');
      }
    });
  });

  return {
    currentTheme,
    resolvedTheme,
    applyTheme
  };
}
