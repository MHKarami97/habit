import { describe, it, expect } from 'vitest';
import { db } from '../../src/infrastructure/db/AppDatabase';
import { PeriodicReviewMapper } from '../../src/infrastructure/db/mappers/PeriodicReviewMapper';
import { PeriodicReview } from '../../src/domain/entities/PeriodicReview';

describe('Phase 2 Package 3: Database Schema Migration V3 & PeriodicReviewMapper', () => {
  it('verifies that Dexie schema is migrated to version 3 with periodicReviews table and compound index', () => {
    // 1. Check version is at least 3
    expect(db.verno).toBeGreaterThanOrEqual(3);

    // 2. Check table exists
    const tableNames = db.tables.map(t => t.name);
    expect(tableNames).toContain('periodicReviews');
    expect(tableNames).toContain('reminderLogs');
    expect(tableNames).toContain('goals');
    expect(tableNames).toContain('habits');

    // 3. Check schema indices on periodicReviews
    const reviewTable = db.table('periodicReviews');
    expect(reviewTable).toBeDefined();
    expect(reviewTable.schema.primKey.name).toBe('id');

    const indexNames = reviewTable.schema.indexes.map(idx => idx.name);
    expect(indexNames).toContain('type');
    expect(indexNames).toContain('periodKey');
    expect(indexNames).toContain('[type+periodKey]');
    expect(indexNames).toContain('solarYear');
    expect(indexNames).toContain('createdAt');
  });

  it('maps correctly between PeriodicReview domain entity and IndexedDB record', () => {
    const domainEntity = new PeriodicReview({
      id: 'rev-test-123',
      type: 'weekly',
      periodKey: '1405-W33',
      solarYear: 1405,
      solarPeriod: 33,
      periodLabel: 'هفته ۳۳ سال ۱۴۰۵',
      startDateIso: '2026-10-31',
      endDateIso: '2026-11-06',
      whatWorked: 'تکمیل روزانه مطالعه',
      whatDidntWork: 'فراموشی پیاده‌روی در روز بارانی',
      primaryObstacle: 'پیشامد غیرمنتظره',
      actionPlan: 'ورزش خانگی در روزهای بارانی',
      adherenceRate: 86,
      completedHabitsCount: 12,
      totalExpectedHabits: 14,
      activeGoalsCount: 2,
      createdAt: '2026-11-01T10:00:00Z',
      updatedAt: '2026-11-01T10:00:00Z'
    });

    // 1. To Record
    const record = PeriodicReviewMapper.toRecord(domainEntity);
    expect(record.id).toBe('rev-test-123');
    expect(record.type).toBe('weekly');
    expect(record.periodKey).toBe('1405-W33');
    expect(record.adherenceRate).toBe(86);
    expect(record.whatWorked).toBe('تکمیل روزانه مطالعه');

    // 2. To Domain
    const mappedBack = PeriodicReviewMapper.toDomain(record);
    expect(mappedBack).toBeInstanceOf(PeriodicReview);
    expect(mappedBack.id).toBe(domainEntity.id);
    expect(mappedBack.periodLabel).toBe('هفته ۳۳ سال ۱۴۰۵');
    expect(mappedBack.adherenceRate).toBe(86);
    expect(mappedBack.completedHabitsCount).toBe(12);
  });
});
