import { db } from '../db/AppDatabase';
import { UserSettings } from '@/domain/entities/UserSettings';
import { WebCryptoAdapter } from '../crypto/WebCryptoAdapter';
import { BackupValidatorService } from './BackupValidatorService';

export interface BackupPayload {
  readonly appName: 'KavoshHabitGoal';
  readonly schemaVersion: number;
  readonly exportedAt: string;
  readonly data: {
    readonly goals: readonly any[];
    readonly milestones: readonly any[];
    readonly actionLogs: readonly any[];
    readonly obstacleLogs: readonly any[];
    readonly habits: readonly any[];
    readonly habitLogs: readonly any[];
    readonly settings?: any;
    readonly reminderLogs?: readonly any[];
    readonly periodicReviews?: readonly any[];
    readonly userTemplates?: readonly any[];
  };
}

export interface ImportPreviewResult {
  readonly isValid: boolean;
  readonly isEncrypted: boolean;
  readonly requiresPassword?: boolean;
  readonly schemaVersion: number;
  readonly exportedAt: string;
  readonly goalsCount: number;
  readonly habitsCount: number;
  readonly habitLogsCount: number;
  readonly userTemplatesCount: number;
  readonly periodicReviewsCount: number;
  readonly errorMessage?: string;
  readonly decryptedPayload?: BackupPayload;
}

export class JsonBackupService {
  /**
   * بررسی اینکه آیا فایل پشتیبان رمزگذاری شده است یا خیر
   */
  static isEncrypted(rawContent: string): boolean {
    return WebCryptoAdapter.isEncryptedContent(rawContent);
  }

  /**
   * تهیه خروجی کامل از پایگاه داده (به صورت عادی یا رمزگذاری‌شده با گذرواژه)
   */
  /**
   * تهیه شیء استاندارد پشتیبان داده‌ها به همراه فیلتر تنظیمات اختصاصی دستگاه در صورت نیاز
   */
  static async buildPayload(options: { excludeDeviceSettings?: boolean } = {}): Promise<BackupPayload> {
    const [
      goals,
      milestones,
      actionLogs,
      obstacleLogs,
      habits,
      habitLogs,
      settings,
      reminderLogs,
      periodicReviews,
      userTemplates
    ] = await Promise.all([
      db.goals.toArray(),
      db.milestones.toArray(),
      db.actionLogs.toArray(),
      db.obstacleLogs.toArray(),
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.settings.get(UserSettings.SINGLETON_ID),
      db.reminderLogs.toArray(),
      db.periodicReviews.toArray(),
      db.userTemplates.toArray()
    ]);

    const settingsMap = settings ? { ...settings } : {};
    if (options.excludeDeviceSettings) {
      delete (settingsMap as any).isPinLockEnabled;
      delete (settingsMap as any).pinHashHex;
      delete (settingsMap as any).pinSaltHex;
      delete (settingsMap as any).lockTimeoutMinutes;
    }

    return {
      appName: 'KavoshHabitGoal',
      schemaVersion: UserSettings.CURRENT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        goals,
        milestones,
        actionLogs,
        obstacleLogs,
        habits,
        habitLogs,
        settings: settingsMap,
        reminderLogs,
        periodicReviews,
        userTemplates
      }
    };
  }

  /**
   * تهیه خروجی کامل از پایگاه داده (به صورت عادی یا رمزگذاری‌شده با گذرواژه)
   */
  static async exportData(password?: string): Promise<string> {
    const payload = await this.buildPayload();
    const jsonString = JSON.stringify(payload, null, 2);

    if (password && password.trim()) {
      return await WebCryptoAdapter.encrypt(jsonString, password.trim());
    }

    return jsonString;
  }

  /**
   * اعتبارسنجی اولیه ساختار فایل پشتیبان و استخراج پیش‌نمایش آماری
   * پشتیبانی خودکار از فایل‌های عادی و فایل‌های رمزگذاری‌شده با گذرواژه
   */
  static async validateAndPreview(
    rawContent: string,
    password?: string
  ): Promise<ImportPreviewResult> {
    const isEncrypted = this.isEncrypted(rawContent);

    if (isEncrypted) {
      if (!password || !password.trim()) {
        return {
          isValid: false,
          isEncrypted: true,
          requiresPassword: true,
          schemaVersion: 0,
          exportedAt: '',
          goalsCount: 0,
          habitsCount: 0,
          habitLogsCount: 0,
          userTemplatesCount: 0,
          periodicReviewsCount: 0,
          errorMessage: 'این فایل با گذرواژه رمزگذاری شده است. لطفاً گذرواژه بازگشایی را وارد کنید.'
        };
      }

      try {
        const decryptedJson = await WebCryptoAdapter.decrypt(rawContent, password.trim());
        const validation = BackupValidatorService.validate(decryptedJson);

        if (!validation.isValid || !validation.sanitizedPayload) {
          return {
            isValid: false,
            isEncrypted: true,
            schemaVersion: 0,
            exportedAt: '',
            goalsCount: 0,
            habitsCount: 0,
            habitLogsCount: 0,
            userTemplatesCount: 0,
            periodicReviewsCount: 0,
            errorMessage: validation.error || 'ساختار فایل رمزگشایی‌شده نامعتبر است.'
          };
        }

        const payload = validation.sanitizedPayload;
        return {
          isValid: true,
          isEncrypted: true,
          schemaVersion: payload.schemaVersion ?? 1,
          exportedAt: payload.exportedAt ?? '',
          goalsCount: Array.isArray(payload.data.goals) ? payload.data.goals.length : 0,
          habitsCount: Array.isArray(payload.data.habits) ? payload.data.habits.length : 0,
          habitLogsCount: Array.isArray(payload.data.habitLogs) ? payload.data.habitLogs.length : 0,
          userTemplatesCount: Array.isArray(payload.data.userTemplates) ? payload.data.userTemplates.length : 0,
          periodicReviewsCount: Array.isArray(payload.data.periodicReviews) ? payload.data.periodicReviews.length : 0,
          decryptedPayload: payload
        };
      } catch (err: any) {
        return {
          isValid: false,
          isEncrypted: true,
          schemaVersion: 0,
          exportedAt: '',
          goalsCount: 0,
          habitsCount: 0,
          habitLogsCount: 0,
          userTemplatesCount: 0,
          periodicReviewsCount: 0,
          errorMessage: err.message || 'گذرواژه نادرست است یا فایل رمزشده آسیب دیده است.'
        };
      }
    }

    // فایل متنی بدون رمز
    const validation = BackupValidatorService.validate(rawContent);
    if (!validation.isValid || !validation.sanitizedPayload) {
      return {
        isValid: false,
        isEncrypted: false,
        schemaVersion: 0,
        exportedAt: '',
        goalsCount: 0,
        habitsCount: 0,
        habitLogsCount: 0,
        userTemplatesCount: 0,
        periodicReviewsCount: 0,
        errorMessage: validation.error || 'ساختار فایل پشتیبان نامعتبر است.'
      };
    }

    const payload = validation.sanitizedPayload;
    return {
      isValid: true,
      isEncrypted: false,
      schemaVersion: payload.schemaVersion ?? 1,
      exportedAt: payload.exportedAt ?? '',
      goalsCount: Array.isArray(payload.data.goals) ? payload.data.goals.length : 0,
      habitsCount: Array.isArray(payload.data.habits) ? payload.data.habits.length : 0,
      habitLogsCount: Array.isArray(payload.data.habitLogs) ? payload.data.habitLogs.length : 0,
      userTemplatesCount: Array.isArray(payload.data.userTemplates) ? payload.data.userTemplates.length : 0,
      periodicReviewsCount: Array.isArray(payload.data.periodicReviews) ? payload.data.periodicReviews.length : 0,
      decryptedPayload: payload
    };
  }

  /**
   * ورود داده با دو حالت «ادغام» (Merge) یا «جایگزینی کامل» (Replace)
   */
  static async importData(
    rawContent: string,
    mode: 'merge' | 'replace',
    password?: string
  ): Promise<void> {
    const preview = await this.validateAndPreview(rawContent, password);
    if (!preview.isValid || !preview.decryptedPayload) {
      throw new Error(preview.errorMessage || 'فایل پشتیبان معتبر نیست.');
    }

    const payload = preview.decryptedPayload;
    const {
      goals,
      milestones,
      actionLogs,
      obstacleLogs,
      habits,
      habitLogs,
      userTemplates,
      periodicReviews
    } = payload.data;

    await db.transaction(
      'rw',
      [
        db.goals,
        db.milestones,
        db.actionLogs,
        db.obstacleLogs,
        db.habits,
        db.habitLogs,
        db.userTemplates,
        db.periodicReviews
      ],
      async () => {
        if (mode === 'replace') {
          await Promise.all([
            db.goals.clear(),
            db.milestones.clear(),
            db.actionLogs.clear(),
            db.obstacleLogs.clear(),
            db.habits.clear(),
            db.habitLogs.clear(),
            db.userTemplates.clear(),
            db.periodicReviews.clear()
          ]);
        }

        if (Array.isArray(goals) && goals.length > 0) {
          await db.goals.bulkPut(goals);
        }
        if (Array.isArray(milestones) && milestones.length > 0) {
          await db.milestones.bulkPut(milestones);
        }
        if (Array.isArray(actionLogs) && actionLogs.length > 0) {
          await db.actionLogs.bulkPut(actionLogs);
        }
        if (Array.isArray(obstacleLogs) && obstacleLogs.length > 0) {
          await db.obstacleLogs.bulkPut(obstacleLogs);
        }
        if (Array.isArray(habits) && habits.length > 0) {
          await db.habits.bulkPut(habits);
        }
        if (Array.isArray(habitLogs) && habitLogs.length > 0) {
          await db.habitLogs.bulkPut(habitLogs);
        }
        if (Array.isArray(userTemplates) && userTemplates.length > 0) {
          await db.userTemplates.bulkPut(userTemplates);
        }
        if (Array.isArray(periodicReviews) && periodicReviews.length > 0) {
          await db.periodicReviews.bulkPut(periodicReviews);
        }
      }
    );
  }

  /**
   * بازیابی داده‌های ابری به صورت مستقیم با امکان انتخاب جایگزینی یا ادغام هوشمند
   */
  static async restoreCloudPayload(
    payload: BackupPayload,
    mode: 'merge' | 'replace'
  ): Promise<{ restoredCount: number }> {
    if (!payload.data) {
      throw new Error('هیچ داده‌ای در این فایل پشتیبان یافت نشد.');
    }

    const {
      goals = [],
      milestones = [],
      actionLogs = [],
      obstacleLogs = [],
      habits = [],
      habitLogs = [],
      settings,
      reminderLogs = [],
      periodicReviews = [],
      userTemplates = []
    } = payload.data;

    await db.transaction(
      'rw',
      [
        db.goals,
        db.milestones,
        db.actionLogs,
        db.obstacleLogs,
        db.habits,
        db.habitLogs,
        db.settings,
        db.reminderLogs,
        db.periodicReviews,
        db.userTemplates
      ],
      async () => {
        if (mode === 'replace') {
          await Promise.all([
            db.goals.clear(),
            db.milestones.clear(),
            db.actionLogs.clear(),
            db.obstacleLogs.clear(),
            db.habits.clear(),
            db.habitLogs.clear(),
            db.reminderLogs.clear(),
            db.periodicReviews.clear(),
            db.userTemplates.clear()
          ]);
          if (Array.isArray(goals) && goals.length > 0) await db.goals.bulkPut(goals as any);
          if (Array.isArray(habits) && habits.length > 0) await db.habits.bulkPut(habits as any);
        } else {
          // در حالت ادغام: مقایسه تاریخ بروزرسانی برای اهداف و عادات
          if (Array.isArray(goals) && goals.length > 0) {
            const current = await db.goals.bulkGet(goals.map((g: any) => g.id));
            const newer = goals.filter((g: any, i: number) => {
              const existing = current[i];
              return !existing || (g.updatedAt || '') >= (existing.updatedAt || '');
            });
            if (newer.length > 0) await db.goals.bulkPut(newer as any);
          }
          if (Array.isArray(habits) && habits.length > 0) {
            const current = await db.habits.bulkGet(habits.map((h: any) => h.id));
            const newer = habits.filter((h: any, i: number) => {
              const existing = current[i];
              return !existing || (h.updatedAt || '') >= (existing.updatedAt || '');
            });
            if (newer.length > 0) await db.habits.bulkPut(newer as any);
          }
        }

        if (Array.isArray(milestones) && milestones.length > 0) await db.milestones.bulkPut(milestones as any);
        if (Array.isArray(actionLogs) && actionLogs.length > 0) await db.actionLogs.bulkPut(actionLogs as any);
        if (Array.isArray(obstacleLogs) && obstacleLogs.length > 0) await db.obstacleLogs.bulkPut(obstacleLogs as any);
        if (Array.isArray(habitLogs) && habitLogs.length > 0) await db.habitLogs.bulkPut(habitLogs as any);
        if (Array.isArray(reminderLogs) && reminderLogs.length > 0) await db.reminderLogs.bulkPut(reminderLogs as any);
        if (Array.isArray(periodicReviews) && periodicReviews.length > 0) await db.periodicReviews.bulkPut(periodicReviews as any);
        if (Array.isArray(userTemplates) && userTemplates.length > 0) await db.userTemplates.bulkPut(userTemplates as any);

        if (settings && typeof settings === 'object') {
          const currentSettings = await db.settings.get(UserSettings.SINGLETON_ID);
          const mergedSettings = {
            ...settings,
            // حفظ تنظیمات امنیتی محلی دستگاه فعلی
            isPinLockEnabled: currentSettings?.isPinLockEnabled ?? false,
            pinHashHex: currentSettings?.pinHashHex,
            pinSaltHex: currentSettings?.pinSaltHex,
            lockTimeoutMinutes: currentSettings?.lockTimeoutMinutes ?? 0,
            id: UserSettings.SINGLETON_ID
          };
          await db.settings.put(mergedSettings as any);
        }
      }
    );

    return { restoredCount: (goals?.length || 0) + (habits?.length || 0) };
  }
}
