/**
 * مدیریت ماندگاری ذخیره‌سازی محلی (Storage Persistence) و تخمین سهمیه حافظه
 * بر اساس W3C StorageManager API
 */

export interface StorageQuotaEstimate {
  readonly usageBytes: number;
  readonly quotaBytes: number;
  readonly usageFormatted: string;
  readonly quotaFormatted: string;
  readonly percentageUsed: number;
}

export class PersistenceManager {
  /**
   * بررسی آیا حافظه دستگاه پایدار (Persisted) است و از پاک‌شدن خودکار در امان است
   */
  static async isPersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * درخواست پایدارسازی دیتابیس (باید صرفاً در پی تعامل مستقیم کاربر مثل کلیک فراخوانی شود)
   */
  static async requestPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * تخمین حجم مصرف‌شده و سهمیه مجاز IndexedDB
   */
  static async getEstimate(): Promise<StorageQuotaEstimate> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const usage = est.usage ?? 0;
        const quota = est.quota ?? 1;
        const percentage = Math.min(100, Math.round((usage / quota) * 100));

        return {
          usageBytes: usage,
          quotaBytes: quota,
          usageFormatted: PersistenceManager.formatBytes(usage),
          quotaFormatted: PersistenceManager.formatBytes(quota),
          percentageUsed: percentage
        };
      } catch {
        // نادیده گرفتن در محیط‌های بدون پشتیبانی
      }
    }

    return {
      usageBytes: 0,
      quotaBytes: 0,
      usageFormatted: '۰ کیلوبایت',
      quotaFormatted: 'نامشخص',
      percentageUsed: 0
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '۰ بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = (bytes / Math.pow(k, i)).toFixed(1);
    return `${val} ${sizes[i] ?? ''}`;
  }
}
