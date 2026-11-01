import type { BackupPayload } from './JsonBackupService';

export const MAX_BACKUP_SIZE_BYTES = 15 * 1024 * 1024; // حداکثر ۱۵ مگابایت جهت جلوگیری از سرریز حافظه کلاینت
export const MAX_RECORDS_PER_TABLE = 50000;

export interface ValidationReport {
  readonly isValid: boolean;
  readonly error?: string;
  readonly warnings: readonly string[];
  readonly sanitizedPayload?: BackupPayload;
}

export class BackupValidatorService {
  /**
   * پالایش و خنثی‌سازی کلیدهای خطرناک برای جلوگیری از حمله Prototype Pollution
   */
  private static sanitizeObject<T>(input: any): T {
    if (input === null || typeof input !== 'object') {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeObject(item)) as unknown as T;
    }

    const cleanObj: Record<string, any> = {};
    for (const key of Object.keys(input)) {
      // حذف کلیدهای مخرب
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleanObj[key] = this.sanitizeObject(input[key]);
    }
    return cleanObj as T;
  }

  /**
   * اعتبارسنجی سخت‌گیرانه اندازه، ساختار و محتوای داده‌های فایل پشتیبان
   */
  static validate(rawContent: string, fileSizeBytes?: number): ValidationReport {
    const warnings: string[] = [];

    // ۱. بررسی اندازه فایل
    const actualSize = fileSizeBytes ?? new TextEncoder().encode(rawContent).length;
    if (actualSize > MAX_BACKUP_SIZE_BYTES) {
      return {
        isValid: false,
        error: `اندازه فایل بیش از حد مجاز است (${(actualSize / (1024 * 1024)).toFixed(1)} مگابایت). حداکثر اندازه مجاز ۱۵ مگابایت می‌باشد.`,
        warnings
      };
    }

    // ۲. بررسی سینتکس JSON
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return {
        isValid: false,
        error: 'فایل ورودی ساختار معتبر JSON ندارد یا دچار فساد داده‌ای است.',
        warnings
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        isValid: false,
        error: 'ساختار کلی فایل پشتیبان نامعتبر است (باید شیء معتبر باشد).',
        warnings
      };
    }

    // ۳. پالایش در برابر Prototype Pollution
    const sanitized = this.sanitizeObject<any>(parsed);

    // ۴. بررسی هدر و نشانگر اپلیکیشن
    if (sanitized.appName !== 'KavoshHabitGoal') {
      return {
        isValid: false,
        error: 'این فایل متعلق به نسخه پشتیبان برنامه «کاوش» نیست (نشانگر برنامه یافت نشد).',
        warnings
      };
    }

    if (typeof sanitized.schemaVersion !== 'number' || sanitized.schemaVersion <= 0) {
      return {
        isValid: false,
        error: 'شماره نسخه اسکیمای فایل پشتیبان نامعتبر است.',
        warnings
      };
    }

    if (!sanitized.data || typeof sanitized.data !== 'object' || Array.isArray(sanitized.data)) {
      return {
        isValid: false,
        error: 'بخش داده‌های پایگاه داده (data) در فایل پشتیبان وجود ندارد یا معیوب است.',
        warnings
      };
    }

    const { goals, habits, milestones, actionLogs, obstacleLogs, habitLogs, userTemplates } = sanitized.data;

    // ۵. اعتبارسنجی بخش اهداف
    if (goals !== undefined) {
      if (!Array.isArray(goals)) {
        return { isValid: false, error: 'بخش اهداف (goals) باید آرایه باشد.', warnings };
      }
      if (goals.length > MAX_RECORDS_PER_TABLE) {
        return { isValid: false, error: 'تعداد رکوردهای اهداف از سقف مجاز فراتر است.', warnings };
      }
      for (let i = 0; i < goals.length; i++) {
        const g = goals[i];
        if (!g || typeof g !== 'object' || !g.id || typeof g.title !== 'string') {
          return {
            isValid: false,
            error: `رکورد هدف شماره ${i + 1} فاقد شناسه یا عنوان معتبر است.`,
            warnings
          };
        }
      }
    }

    // ۶. اعتبارسنجی بخش عادت‌ها
    if (habits !== undefined) {
      if (!Array.isArray(habits)) {
        return { isValid: false, error: 'بخش عادت‌ها (habits) باید آرایه باشد.', warnings };
      }
      if (habits.length > MAX_RECORDS_PER_TABLE) {
        return { isValid: false, error: 'تعداد رکوردهای عادت‌ها از سقف مجاز فراتر است.', warnings };
      }
      for (let i = 0; i < habits.length; i++) {
        const h = habits[i];
        if (!h || typeof h !== 'object' || !h.id || typeof h.title !== 'string') {
          return {
            isValid: false,
            error: `رکورد عادت شماره ${i + 1} فاقد شناسه یا عنوان معتبر است.`,
            warnings
          };
        }
      }
    }

    // ۷. اعتبارسنجی مابقی جداول در صورت وجود
    const tablesToCheck = [
      { name: 'milestones', data: milestones },
      { name: 'actionLogs', data: actionLogs },
      { name: 'obstacleLogs', data: obstacleLogs },
      { name: 'habitLogs', data: habitLogs },
      { name: 'userTemplates', data: userTemplates }
    ];

    for (const tbl of tablesToCheck) {
      if (tbl.data !== undefined) {
        if (!Array.isArray(tbl.data)) {
          return { isValid: false, error: `بخش ${tbl.name} باید آرایه باشد.`, warnings };
        }
        if (tbl.data.length > MAX_RECORDS_PER_TABLE) {
          return { isValid: false, error: `تعداد رکوردهای جدول ${tbl.name} بیش از حد مجاز است.`, warnings };
        }
      }
    }

    return {
      isValid: true,
      warnings,
      sanitizedPayload: sanitized as BackupPayload
    };
  }
}
