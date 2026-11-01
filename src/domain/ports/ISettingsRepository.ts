import { UserSettings } from '../entities/UserSettings';

export interface ISettingsRepository {
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
  wipeAllData(): Promise<void>;
}
