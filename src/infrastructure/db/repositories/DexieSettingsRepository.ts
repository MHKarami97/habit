import { ISettingsRepository } from '@/domain/ports/ISettingsRepository';
import { UserSettings } from '@/domain/entities/UserSettings';
import { db, AppDatabase } from '../AppDatabase';

export class DexieSettingsRepository implements ISettingsRepository {
  constructor(private readonly database: AppDatabase = db) {}

  async getSettings(): Promise<UserSettings> {
    const record = await this.database.settings.get(UserSettings.SINGLETON_ID);
    if (!record) {
      const defaultSettings = UserSettings.createDefault();
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    }

    return new UserSettings({
      id: record.id,
      theme: record.theme,
      accentColor: record.accentColor,
      fontSize: record.fontSize,
      numberFormat: record.numberFormat,
      weekStartDay: record.weekStartDay,
      endOfDayHour: record.endOfDayHour,
      notificationsEnabled: record.notificationsEnabled,
      defaultReminderTime: record.defaultReminderTime,
      lastBackupDate: record.lastBackupDate,
      hasCompletedOnboarding: record.hasCompletedOnboarding,
      isStoragePersisted: record.isStoragePersisted,
      schemaVersion: record.schemaVersion
    });
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this.database.settings.put({
      id: UserSettings.SINGLETON_ID,
      theme: settings.theme,
      accentColor: settings.accentColor,
      fontSize: settings.fontSize,
      numberFormat: settings.numberFormat,
      weekStartDay: settings.weekStartDay,
      endOfDayHour: settings.endOfDayHour,
      notificationsEnabled: settings.notificationsEnabled,
      defaultReminderTime: settings.defaultReminderTime,
      lastBackupDate: settings.lastBackupDate,
      hasCompletedOnboarding: settings.hasCompletedOnboarding,
      isStoragePersisted: settings.isStoragePersisted,
      schemaVersion: settings.schemaVersion
    });
  }

  async wipeAllData(): Promise<void> {
    await this.database.transaction(
      'rw',
      [
        this.database.goals,
        this.database.milestones,
        this.database.actionLogs,
        this.database.obstacleLogs,
        this.database.habits,
        this.database.habitLogs,
        this.database.settings
      ],
      async () => {
        await this.database.goals.clear();
        await this.database.milestones.clear();
        await this.database.actionLogs.clear();
        await this.database.obstacleLogs.clear();
        await this.database.habits.clear();
        await this.database.habitLogs.clear();
        await this.database.settings.clear();
      }
    );
  }
}
