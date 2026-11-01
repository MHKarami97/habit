import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { usePwa } from '@/presentation/composables/usePwa';

describe('PWA & Security Directives Verification', () => {
  it('validates index.html integrity and PWA manifest links', () => {
    const htmlPath = resolve(__dirname, '../../index.html');
    const htmlContent = readFileSync(htmlPath, 'utf-8');

    expect(htmlContent).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(htmlContent).toContain('<script src="/theme-init.js"></script>');
    expect(htmlContent).toContain('<script type="module" src="/src/main.ts"></script>');
    // در صورت وجود سیاست CSP نباید از unsafe-inline برای اسکریپت استفاده شود
    const scriptSrcMatch = htmlContent.match(/script-src\s+([^;]+);/);
    if (scriptSrcMatch) {
      expect(scriptSrcMatch[1]).not.toContain("'unsafe-inline'");
    }
  });

  it('usePwa provides reactive update states and updateServiceWorker trigger', async () => {
    const { needRefresh, updateServiceWorker, isInstalled, isInstallable, isIos } = usePwa();

    expect(typeof needRefresh.value).toBe('boolean');
    expect(typeof isInstalled.value).toBe('boolean');
    expect(typeof isInstallable.value).toBe('boolean');
    expect(typeof updateServiceWorker).toBe('function');
    expect(typeof isIos).toBe('function');

    // فراخوانی متد به‌روزرسانی نباید خطای مدیریت‌نشده تولید کند
    await expect(updateServiceWorker()).resolves.not.toThrow();
  });

  it('ensures GitHub Pages SPA fallback configuration is present (.nojekyll and 404 handling)', () => {
    const nojekyllPath = resolve(__dirname, '../../public/.nojekyll');
    const viteConfigPath = resolve(__dirname, '../../vite.config.ts');
    const viteConfigContent = readFileSync(viteConfigPath, 'utf-8');

    expect(readFileSync(nojekyllPath, 'utf-8')).toBeDefined();
    expect(viteConfigContent).toContain('copy-404-html');
    expect(viteConfigContent).toContain('404.html');
  });
});
