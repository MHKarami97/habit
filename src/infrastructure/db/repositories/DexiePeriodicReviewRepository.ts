import { db } from '../AppDatabase';
import { PeriodicReview, type PeriodicReviewType } from '@/domain/entities/PeriodicReview';
import type { IPeriodicReviewRepository } from '@/domain/ports/IPeriodicReviewRepository';
import { PeriodicReviewMapper } from '../mappers/PeriodicReviewMapper';

export class DexiePeriodicReviewRepository implements IPeriodicReviewRepository {
  async findById(id: string): Promise<PeriodicReview | null> {
    const record = await db.periodicReviews.get(id);
    return record ? PeriodicReviewMapper.toDomain(record) : null;
  }

  async findByTypeAndKey(type: PeriodicReviewType, periodKey: string): Promise<PeriodicReview | null> {
    const record = await db.periodicReviews
      .where('[type+periodKey]')
      .equals([type, periodKey])
      .first();
    return record ? PeriodicReviewMapper.toDomain(record) : null;
  }

  async findAll(type?: PeriodicReviewType): Promise<readonly PeriodicReview[]> {
    let records;
    if (type) {
      records = await db.periodicReviews.where('type').equals(type).reverse().sortBy('createdAt');
    } else {
      records = await db.periodicReviews.toCollection().reverse().sortBy('createdAt');
    }
    return records.map(PeriodicReviewMapper.toDomain);
  }

  async save(review: PeriodicReview): Promise<void> {
    const record = PeriodicReviewMapper.toRecord(review);
    await db.periodicReviews.put(record);
  }

  async delete(id: string): Promise<void> {
    await db.periodicReviews.delete(id);
  }
}
