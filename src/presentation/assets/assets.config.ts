/**
 * پیکربندی متمرکز دارایی‌های بصری (فونت‌ها، آیکون‌های لانچر و منابع ثابت)
 * تمام ارجاعات به دارایی‌های ثابت موجود در پروژه از طریق این ماژول هدایت می‌شوند.
 */
export const ASSETS_CONFIG = {
  fonts: {
    fontFaceCss: '/fonts/Vazirmatn-font-face.css',
    family: 'Vazirmatn',
    webfontsBase: '/fonts/webfonts'
  },
  icons: {
    launcher48: '/icons/launchericon-48x48.png',
    launcher72: '/icons/launchericon-72x72.png',
    launcher96: '/icons/launchericon-96x96.png',
    launcher144: '/icons/launchericon-144x144.png',
    launcher192: '/icons/launchericon-192x192.png',
    launcher512: '/icons/launchericon-512x512.png',
    favicon: '/favicon.ico'
  },
  wellKnown: {
    assetlinks: '/.well-known/assetlinks.json'
  }
} as const;

export type AssetsConfig = typeof ASSETS_CONFIG;
