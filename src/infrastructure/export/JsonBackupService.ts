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
  static async exportData(password?: string): Promise<string> {
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

    const payload: BackupPayload = {
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
        settings: settings || {},
        reminderLogs,
        periodicReviews,
        userTemplates
      }
    };

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
}
