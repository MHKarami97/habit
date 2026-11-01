/**
 * سرویس مدیریت سهمیه حافظه و ماندگاری داده‌ها (StorageManager API)
 * استاندارد W3C Storage API بدون نیاز به هیچ وابستگی خارجی
 */

export interface StorageQuotaInfo {
  readonly isSupported: boolean;
  readonly usageBytes: number;
  readonly quotaBytes: number;
  readonly usageFormatted: string;
  readonly quotaFormatted: string;
  readonly percentUsed: number;
  readonly isPersisted: boolean;
}

export class StorageManagerService {
  /**
   * دریافت سهمیه و وضعیت ماندگاری حافظه از مرورگر
   */
  static async getStorageInfo(): Promise<StorageQuotaInfo> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
      return {
        isSupported: false,
        usageBytes: 0,
        quotaBytes: 0,
        usageFormatted: 'غیرقابل تخمین',
        quotaFormatted: 'نامحدود',
        percentUsed: 0,
        isPersisted: false
      };
    }

    try {
      const [estimate, isPersisted] = await Promise.all([
        navigator.storage.estimate(),
        navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false)
      ]);

      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percent = quota > 0 ? Number(((usage / quota) * 100).toFixed(2)) : 0;

      return {
        isSupported: true,
        usageBytes: usage,
        quotaBytes: quota,
        usageFormatted: this.formatBytes(usage),
        quotaFormatted: this.formatBytes(quota),
        percentUsed: percent,
        isPersisted
      };
    } catch {
      return {
        isSupported: false,
        usageBytes: 0,
        quotaBytes: 0,
        usageFormatted: 'خطا در ارزیابی',
        quotaFormatted: 'نامشخص',
        percentUsed: 0,
        isPersisted: false
      };
    }
  }

  /**
   * درخواست فعال‌سازی ذخیره‌سازی پایدار (Persistent Storage)
   * جلوگیری از پاک‌شدن خودکار داده‌های IndexedDB توسط مرورگر در شرایط کمبود فضا
   */
  static async requestPersistence(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
      return false;
    }

    try {
      const isGranted = await navigator.storage.persist();
      return isGranted;
    } catch {
      return false;
    }
  }

  /**
   * تبدیل بایت به رشته خوانا با واحدهای کیلوبایت، مگابایت و گیگابایت
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '۰ بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت', 'ترابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

    // تبدیل ارقام به فارسی
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const formattedVal = String(value).replace(/[0-9]/g, w => farsiDigits[Number(w)] ?? w);

    return `${formattedVal} ${sizes[i] || 'بایت'}`;
  }
}
