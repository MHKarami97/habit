import { DexieGoalRepository } from '../db/repositories/DexieGoalRepository';
import { DexieHabitRepository } from '../db/repositories/DexieHabitRepository';
import { DexieHabitLogRepository } from '../db/repositories/DexieHabitLogRepository';
import { DexieSettingsRepository } from '../db/repositories/DexieSettingsRepository';
import { DexiePeriodicReviewRepository } from '../db/repositories/DexiePeriodicReviewRepository';
import { DexieUserTemplateRepository } from '../db/repositories/DexieUserTemplateRepository';
import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { IHabitLogRepository } from '@/domain/ports/IHabitLogRepository';
import { ISettingsRepository } from '@/domain/ports/ISettingsRepository';
import { IPeriodicReviewRepository } from '@/domain/ports/IPeriodicReviewRepository';
import { IUserTemplateRepository } from '@/domain/ports/IUserTemplateRepository';

export interface ServiceContainer {
  readonly goalRepo: IGoalRepository;
  readonly habitRepo: IHabitRepository;
  readonly habitLogRepo: IHabitLogRepository;
  readonly settingsRepo: ISettingsRepository;
  readonly periodicReviewRepo: IPeriodicReviewRepository;
  readonly userTemplateRepo: IUserTemplateRepository;
}

class Container implements ServiceContainer {
  readonly goalRepo: IGoalRepository = new DexieGoalRepository();
  readonly habitRepo: IHabitRepository = new DexieHabitRepository();
  readonly habitLogRepo: IHabitLogRepository = new DexieHabitLogRepository();
  readonly settingsRepo: ISettingsRepository = new DexieSettingsRepository();
  readonly periodicReviewRepo: IPeriodicReviewRepository = new DexiePeriodicReviewRepository();
  readonly userTemplateRepo: IUserTemplateRepository = new DexieUserTemplateRepository();
}

export const container: ServiceContainer = new Container();
