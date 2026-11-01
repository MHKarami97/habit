import { db } from './AppDatabase';

export interface DatabaseHealthReport {
  readonly isHealthy: boolean;
  readonly isAvailable: boolean;
  readonly isPrivateBrowsingRestricted: boolean;
  readonly isQuotaExceeded: boolean;
  readonly isMemoryFallbackActive: boolean;
  readonly statusMessage: string;
}

export class IndexedDBHealthService {
  private static isMemoryFallback = false;

  /**
   * ارزیابی سلامت و دسترسی‌پذیری پایگاه داده مرورگر
   */
  static async checkHealth(): Promise<DatabaseHealthReport> {
    if (typeof indexedDB === 'undefined') {
      this.isMemoryFallback = true;
      return {
        isHealthy: false,
        isAvailable: false,
        isPrivateBrowsingRestricted: false,
        isQuotaExceeded: false,
        isMemoryFallbackActive: true,
        statusMessage: 'پایگاه داده IndexedDB در این مرورگر یا محیط موجود نیست. حالت موقت در رم فعال شد.'
      };
    }

    try {
      // آزمایش باز شدن دیتابیس
      if (!db.isOpen()) {
        await db.open();
      }

      // انجام یک کوئری خواندن سبک برای اطمینان از سلامت تراکنش
      await db.settings.get('singleton_settings');

      return {
        isHealthy: true,
        isAvailable: true,
        isPrivateBrowsingRestricted: false,
        isQuotaExceeded: false,
        isMemoryFallbackActive: false,
        statusMessage: 'پایگاه داده محلی پایدار، سالم و آماده کار است.'
      };
    } catch (err: unknown) {
      const errorStr = String(err);
      const isQuota = errorStr.includes('QuotaExceeded') || errorStr.includes('quota');
      const isSecurityOrPrivate =
        errorStr.includes('SecurityError') ||
        errorStr.includes('InvalidStateError') ||
        errorStr.includes('not allowed') ||
        errorStr.includes('Private');

      this.isMemoryFallback = true;

      let msg = 'خطا در ارتباط با پایگاه داده مرورگر.';
      if (isQuota) {
        msg = 'حافظه دستگاه پر است (QuotaExceeded). لطفاً فضای ذخیره‌سازی دستگاه را آزاد نمایید.';
      } else if (isSecurityOrPrivate) {
        msg = 'دسترسی در حالت مرور خصوصی (Private Browsing) محدود است. تغییرات فقط تا بستن تب در حافظه موقت می‌مانند.';
      }

      return {
        isHealthy: false,
        isAvailable: true,
        isPrivateBrowsingRestricted: isSecurityOrPrivate,
        isQuotaExceeded: isQuota,
        isMemoryFallbackActive: true,
        statusMessage: msg
      };
    }
  }

  /**
   * آیا حالت حافظه موقت به دلیل خطای مرورگر فعال است؟
   */
  static isFallbackActive(): boolean {
    return this.isMemoryFallback;
  }

  /**
   * بازنشانی اضطراری و تعمیر ساختار پایگاه داده
   */
  static async emergencyRepair(): Promise<boolean> {
    try {
      db.close();
      await db.open();
      this.isMemoryFallback = false;
      return true;
    } catch {
      return false;
    }
  }
}
