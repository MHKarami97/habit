import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { usePwa } from '@/presentation/composables/usePwa';

describe('PWA & Security Directives Verification', () => {
  it('CSP meta tag in index.html contains the approved script hash and worker-src', () => {
    const htmlPath = resolve(__dirname, '../../index.html');
    const htmlContent = readFileSync(htmlPath, 'utf-8');

    // تایید تطابق هش دقیق اعلام شده توسط مرورگر
    expect(htmlContent).toContain("'sha256-oHxty2Q6IJ3TsFHpEAazclqLNvVHpc+k+xc0xAvHtDk='");
    // تایید وجود سیاست worker-src برای پشتیبانی ایمن از وب‌ورکر و سرویس‌ورکر
    expect(htmlContent).toContain("worker-src 'self' blob:;");
    // اطمینان از عدم استفاده از unsafe-inline در بخش script-src
    const scriptSrcMatch = htmlContent.match(/script-src\s+([^;]+);/);
    expect(scriptSrcMatch).toBeTruthy();
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
});
