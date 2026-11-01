import { describe, it, expect } from 'vitest';
import { StorageManagerService } from '../../src/infrastructure/storage/StorageManagerService';
import { IndexedDBHealthService } from '../../src/infrastructure/db/IndexedDBHealthService';

describe('Phase 2 Package 4: StorageManagerService & IndexedDBHealthService', () => {
  describe('StorageManagerService.formatBytes', () => {
    it('formats 0 bytes correctly in Persian', () => {
      expect(StorageManagerService.formatBytes(0)).toBe('۰ بایت');
    });

    it('formats Kilobytes with Persian digits and Persian unit', () => {
      const formatted = StorageManagerService.formatBytes(2048);
      expect(formatted).toContain('کیلوبایت');
      expect(formatted).toContain('۲');
    });

    it('formats Megabytes and Gigabytes accurately', () => {
      const mb = StorageManagerService.formatBytes(15 * 1024 * 1024);
      expect(mb).toContain('مگابایت');
      expect(mb).toContain('۱۵');

      const gb = StorageManagerService.formatBytes(2.5 * 1024 * 1024 * 1024);
      expect(gb).toContain('گیگابایت');
    });
  });

  describe('StorageManagerService.getStorageInfo', () => {
    it('returns a safe fallback structure in node/test environment without throwing', async () => {
      const info = await StorageManagerService.getStorageInfo();
      expect(info).toBeDefined();
      expect(typeof info.isSupported).toBe('boolean');
      expect(typeof info.usageBytes).toBe('number');
      expect(typeof info.quotaBytes).toBe('number');
      expect(info.usageFormatted).toBeTruthy();
      expect(info.quotaFormatted).toBeTruthy();
    });
  });

  describe('IndexedDBHealthService', () => {
    it('evaluates health report with availability and fallback status', async () => {
      const report = await IndexedDBHealthService.checkHealth();
      expect(report).toBeDefined();
      expect(typeof report.isHealthy).toBe('boolean');
      expect(typeof report.isAvailable).toBe('boolean');
      expect(typeof report.isMemoryFallbackActive).toBe('boolean');
      expect(report.statusMessage).toBeTruthy();
    });

    it('verifies fallback active flag accessor', () => {
      const isFallback = IndexedDBHealthService.isFallbackActive();
      expect(typeof isFallback).toBe('boolean');
    });
  });
});
