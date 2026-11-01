(function () {
  try {
    var saved = localStorage.getItem('kavosh_theme');
    var theme = saved || 'system';
    var isDark = false;
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'system' || !theme) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    var resolvedTheme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#181513' : '#FAF7F2');
    }
  } catch (e) {
    // در صورت بروز خطای دسترسی به localStorage در حالت incognito
  }
})();
