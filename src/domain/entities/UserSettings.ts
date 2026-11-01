export interface UserSettingsProps {
  readonly id: string;
  readonly theme: 'light' | 'dark' | 'system';
  readonly accentColor: string;
  readonly fontSize: 'small' | 'medium' | 'large';
  readonly numberFormat: 'persian' | 'latin';
  readonly weekStartDay: number; // 0 = شنبه, 6 = جمعه
  readonly endOfDayHour: number; // مثلا 0 یا 4 صبح
  readonly notificationsEnabled: boolean;
  readonly defaultReminderTime: string;
  readonly lastBackupDate?: string;
  readonly hasCompletedOnboarding: boolean;
  readonly isStoragePersisted: boolean;
  readonly schemaVersion: number;
  readonly isPinLockEnabled?: boolean;
  readonly pinHashHex?: string;
  readonly pinSaltHex?: string;
  readonly lockTimeoutMinutes?: number;
  readonly language?: 'fa' | 'en';
}

export class UserSettings {
  static readonly SINGLETON_ID = 'singleton_settings';
  static readonly CURRENT_SCHEMA_VERSION = 1;

  readonly id: string;
  readonly theme: 'light' | 'dark' | 'system';
  readonly accentColor: string;
  readonly fontSize: 'small' | 'medium' | 'large';
  readonly numberFormat: 'persian' | 'latin';
  readonly weekStartDay: number;
  readonly endOfDayHour: number;
  readonly notificationsEnabled: boolean;
  readonly defaultReminderTime: string;
  readonly lastBackupDate?: string;
  readonly hasCompletedOnboarding: boolean;
  readonly isStoragePersisted: boolean;
  readonly schemaVersion: number;
  readonly isPinLockEnabled: boolean;
  readonly pinHashHex?: string;
  readonly pinSaltHex?: string;
  readonly lockTimeoutMinutes: number;
  readonly language: 'fa' | 'en';

  constructor(props: Partial<UserSettingsProps>) {
    this.id = UserSettings.SINGLETON_ID;
    this.theme = props.theme || 'system';
    this.accentColor = props.accentColor || '#D2532A';
    this.fontSize = props.fontSize || 'medium';
    this.numberFormat = props.numberFormat || 'persian';
    this.weekStartDay = props.weekStartDay ?? 0; // پیش‌فرض: شنبه
    this.endOfDayHour = props.endOfDayHour ?? 0; // پیش‌فرض: نیمه‌شب
    this.notificationsEnabled = props.notificationsEnabled ?? false;
    this.defaultReminderTime = props.defaultReminderTime || '20:00';
    this.lastBackupDate = props.lastBackupDate;
    this.hasCompletedOnboarding = props.hasCompletedOnboarding ?? false;
    this.isStoragePersisted = props.isStoragePersisted ?? false;
    this.schemaVersion = props.schemaVersion ?? UserSettings.CURRENT_SCHEMA_VERSION;
    this.isPinLockEnabled = props.isPinLockEnabled ?? false;
    this.pinHashHex = props.pinHashHex;
    this.pinSaltHex = props.pinSaltHex;
    this.lockTimeoutMinutes = props.lockTimeoutMinutes ?? 0;
    this.language = props.language || 'fa';
  }

  static createDefault(): UserSettings {
    return new UserSettings({});
  }

  withUpdates(updates: Partial<UserSettingsProps>): UserSettings {
    return new UserSettings({
      ...this,
      ...updates
    });
  }

  isBackupOverdue(currentIsoDate: string, thresholdDays = 30): boolean {
    if (!this.lastBackupDate) return false;
    const last = new Date(this.lastBackupDate).getTime();
    const curr = new Date(currentIsoDate).getTime();
    if (isNaN(last) || isNaN(curr)) return false;
    const diff = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
    return diff >= thresholdDays;
  }
}
