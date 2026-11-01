import { db } from '../db/AppDatabase';
import { UserSettings } from '@/domain/entities/UserSettings';

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
    readonly settings: any;
  };
}

export interface ImportPreviewResult {
  readonly isValid: boolean;
  readonly schemaVersion: number;
  readonly exportedAt: string;
  readonly goalsCount: number;
  readonly habitsCount: number;
  readonly habitLogsCount: number;
  readonly errorMessage?: string;
}

export class JsonBackupService {
  /**
   * تهیه خروجی کامل JSON از پایگاه داده به صورت ساختارمند
   */
  static async exportData(): Promise<string> {
    const [goals, milestones, actionLogs, obstacleLogs, habits, habitLogs, settings] = await Promise.all([
      db.goals.toArray(),
      db.milestones.toArray(),
      db.actionLogs.toArray(),
      db.obstacleLogs.toArray(),
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.settings.get(UserSettings.SINGLETON_ID)
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
        settings: settings || {}
      }
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * اعتبارسنجی اولیه ساختار فایل پشتیبان و استخراج پیش‌نمایش آماری
   */
  static validateAndPreview(rawJson: string): ImportPreviewResult {
    try {
      const parsed = JSON.parse(rawJson) as Partial<BackupPayload>;
      if (parsed.appName !== 'KavoshHabitGoal' || !parsed.data) {
        return {
          isValid: false,
          schemaVersion: 0,
          exportedAt: '',
          goalsCount: 0,
          habitsCount: 0,
          habitLogsCount: 0,
          errorMessage: 'فایل واردشده ساختار استاندارد نسخه پشتیبان کاوش را ندارد.'
        };
      }

      return {
        isValid: true,
        schemaVersion: parsed.schemaVersion ?? 1,
        exportedAt: parsed.exportedAt ?? '',
        goalsCount: Array.isArray(parsed.data.goals) ? parsed.data.goals.length : 0,
        habitsCount: Array.isArray(parsed.data.habits) ? parsed.data.habits.length : 0,
        habitLogsCount: Array.isArray(parsed.data.habitLogs) ? parsed.data.habitLogs.length : 0
      };
    } catch {
      return {
        isValid: false,
        schemaVersion: 0,
        exportedAt: '',
        goalsCount: 0,
        habitsCount: 0,
        habitLogsCount: 0,
        errorMessage: 'فایل پشتیبان خوانا نیست (خطای سینتکس JSON).'
      };
    }
  }

  /**
   * ورود داده با دو حالت «ادغام» (Merge) یا «جایگزینی کامل» (Replace)
   */
  static async importData(rawJson: string, mode: 'merge' | 'replace'): Promise<void> {
    const preview = JsonBackupService.validateAndPreview(rawJson);
    if (!preview.isValid) {
      throw new Error(preview.errorMessage);
    }

    const payload = JSON.parse(rawJson) as BackupPayload;
    const { goals, milestones, actionLogs, obstacleLogs, habits, habitLogs } = payload.data;

    await db.transaction(
      'rw',
      [db.goals, db.milestones, db.actionLogs, db.obstacleLogs, db.habits, db.habitLogs],
      async () => {
        if (mode === 'replace') {
          await Promise.all([
            db.goals.clear(),
            db.milestones.clear(),
            db.actionLogs.clear(),
            db.obstacleLogs.clear(),
            db.habits.clear(),
            db.habitLogs.clear()
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
      }
    );
  }
}
