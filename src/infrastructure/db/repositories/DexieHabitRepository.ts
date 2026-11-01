import { IHabitRepository } from '@/domain/ports/IHabitRepository';
import { Habit } from '@/domain/entities/Habit';
import { db, AppDatabase } from '../AppDatabase';
import { HabitMapper } from '../mappers/HabitMapper';

export class DexieHabitRepository implements IHabitRepository {
  constructor(private readonly database: AppDatabase = db) {}

  async findById(id: string): Promise<Habit | null> {
    const record = await this.database.habits.get(id);
    return record ? HabitMapper.toDomain(record) : null;
  }

  async findAll(includeArchived = false): Promise<readonly Habit[]> {
    let records = await this.database.habits.toArray();
    if (!includeArchived) {
      records = records.filter(r => r.isArchived === 0);
    }
    return records.map(HabitMapper.toDomain);
  }

  async findByGoalId(goalId: string): Promise<readonly Habit[]> {
    const records = await this.database.habits
      .where('linkedGoalId')
      .equals(goalId)
      .toArray();
    return records.map(HabitMapper.toDomain);
  }

  async save(habit: Habit): Promise<void> {
    const record = HabitMapper.toPersistence(habit);
    await this.database.habits.put(record);
  }

  async delete(id: string): Promise<void> {
    await this.database.transaction('rw', [this.database.habits, this.database.habitLogs], async () => {
      await this.database.habits.delete(id);
      await this.database.habitLogs.where('habitId').equals(id).delete();
    });
  }
}
