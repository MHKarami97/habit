import { DexieGoalRepository } from '../db/repositories/DexieGoalRepository';
import { DexieHabitRepository } from '../db/repositories/DexieHabitRepository';
import { DexieHabitLogRepository } from '../db/repositories/DexieHabitLogRepository';
import { DexieSettingsRepository } from '../db/repositories/DexieSettingsRepository';
import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { IHabitLogRepository } from '@/domain/ports/IHabitLogRepository';
import { ISettingsRepository } from '@/domain/ports/ISettingsRepository';

export interface ServiceContainer {
  readonly goalRepo: IGoalRepository;
  readonly habitRepo: IHabitRepository;
  readonly habitLogRepo: IHabitLogRepository;
  readonly settingsRepo: ISettingsRepository;
}

class Container implements ServiceContainer {
  readonly goalRepo: IGoalRepository = new DexieGoalRepository();
  readonly habitRepo: IHabitRepository = new DexieHabitRepository();
  readonly habitLogRepo: IHabitLogRepository = new DexieHabitLogRepository();
  readonly settingsRepo: ISettingsRepository = new DexieSettingsRepository();
}

export const container: ServiceContainer = new Container();
