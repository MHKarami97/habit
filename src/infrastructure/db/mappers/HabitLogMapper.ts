import { HabitLog } from '@/domain/entities/HabitLog';
import { HabitLogRecord } from '../AppDatabase';

export class HabitLogMapper {
  static toDomain(record: HabitLogRecord): HabitLog {
    return new HabitLog({
      id: record.id,
      habitId: record.habitId,
      date: record.date,
      value: record.value,
      isCompleted: record.isCompleted === 1,
      isFrozen: record.isFrozen === 1,
      note: record.note,
      createdAt: record.createdAt
    });
  }

  static toPersistence(log: HabitLog): HabitLogRecord {
    return {
      id: log.id,
      habitId: log.habitId,
      date: log.date,
      value: log.value,
      isCompleted: log.isCompleted ? 1 : 0,
      isFrozen: log.isFrozen ? 1 : 0,
      note: log.note,
      createdAt: log.createdAt
    };
  }
}
