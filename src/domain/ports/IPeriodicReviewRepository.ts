import { PeriodicReview, PeriodicReviewType } from '../entities/PeriodicReview';

export interface IPeriodicReviewRepository {
  findById(id: string): Promise<PeriodicReview | null>;
  findByTypeAndKey(type: PeriodicReviewType, periodKey: string): Promise<PeriodicReview | null>;
  findAll(type?: PeriodicReviewType): Promise<readonly PeriodicReview[]>;
  save(review: PeriodicReview): Promise<void>;
  delete(id: string): Promise<void>;
}
