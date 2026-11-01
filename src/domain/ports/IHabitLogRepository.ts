import { HabitLog } from '../entities/HabitLog';

export interface IHabitLogRepository {
  findById(id: string): Promise<HabitLog | null>;
  findByHabitAndDate(habitId: string, date: string): Promise<HabitLog | null>;
  findLogsByHabitId(habitId: string, fromDate?: string, toDate?: string): Promise<readonly HabitLog[]>;
  findAllLogsForDate(date: string): Promise<readonly HabitLog[]>;
  save(log: HabitLog): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByHabitId(habitId: string): Promise<void>;
}
