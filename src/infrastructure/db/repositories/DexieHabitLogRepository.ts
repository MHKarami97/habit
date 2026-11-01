import { IHabitLogRepository } from '@/domain/ports/IHabitLogRepository';
import { HabitLog } from '@/domain/entities/HabitLog';
import { db, AppDatabase } from '../AppDatabase';
import { HabitLogMapper } from '../mappers/HabitLogMapper';

export class DexieHabitLogRepository implements IHabitLogRepository {
  constructor(private readonly database: AppDatabase = db) {}

  async findById(id: string): Promise<HabitLog | null> {
    const record = await this.database.habitLogs.get(id);
    return record ? HabitLogMapper.toDomain(record) : null;
  }

  async findByHabitAndDate(habitId: string, date: string): Promise<HabitLog | null> {
    // بهره‌گیری از ایندکس ترکیبی [habitId+date] برای سرعت O(1)
    const record = await this.database.habitLogs.get({ habitId, date });
    return record ? HabitLogMapper.toDomain(record) : null;
  }

  async findLogsByHabitId(habitId: string, fromDate?: string, toDate?: string): Promise<readonly HabitLog[]> {
    let collection = this.database.habitLogs.where('habitId').equals(habitId);
    let records = await collection.toArray();

    if (fromDate) {
      records = records.filter(r => r.date >= fromDate);
    }
    if (toDate) {
      records = records.filter(r => r.date <= toDate);
    }

    records.sort((a, b) => a.date.localeCompare(b.date));
    return records.map(HabitLogMapper.toDomain);
  }

  async findAllLogsForDate(date: string): Promise<readonly HabitLog[]> {
    const records = await this.database.habitLogs.where('date').equals(date).toArray();
    return records.map(HabitLogMapper.toDomain);
  }

  async save(log: HabitLog): Promise<void> {
    const record = HabitLogMapper.toPersistence(log);
    await this.database.habitLogs.put(record);
  }

  async delete(id: string): Promise<void> {
    await this.database.habitLogs.delete(id);
  }

  async deleteByHabitId(habitId: string): Promise<void> {
    await this.database.habitLogs.where('habitId').equals(habitId).delete();
  }
}
