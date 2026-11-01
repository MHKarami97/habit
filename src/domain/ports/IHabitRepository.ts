import { Habit } from '../entities/Habit';

export interface IHabitRepository {
  findById(id: string): Promise<Habit | null>;
  findAll(includeArchived?: boolean): Promise<readonly Habit[]>;
  findByGoalId(goalId: string): Promise<readonly Habit[]>;
  save(habit: Habit): Promise<void>;
  delete(id: string): Promise<void>;
}
