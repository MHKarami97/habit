import { describe, it, expect } from 'vitest';
import { db } from '../../src/infrastructure/db/AppDatabase';
import { GoalMapper } from '../../src/infrastructure/db/mappers/GoalMapper';
import { Goal } from '../../src/domain/entities/Goal';
import { MetricTarget } from '../../src/domain/value-objects/MetricTarget';

describe('Phase 3 Package 1: Database Schema Migration V4 & GoalMapper', () => {
  it('verifies that Dexie schema is migrated to version 4 with parentId and hierarchyLevel indexes on goals', () => {
    // 1. Check version is at least 4
    expect(db.verno).toBeGreaterThanOrEqual(4);

    // 2. Check goals table schema
    const goalsTable = db.table('goals');
    expect(goalsTable).toBeDefined();
    expect(goalsTable.schema.primKey.name).toBe('id');

    const indexNames = goalsTable.schema.indexes.map(idx => idx.name);
    expect(indexNames).toContain('status');
    expect(indexNames).toContain('categoryId');
    expect(indexNames).toContain('deadline');
    expect(indexNames).toContain('isArchived');
    // Phase 3 new indexes
    expect(indexNames).toContain('parentId');
    expect(indexNames).toContain('hierarchyLevel');
  });

  it('maps correctly between Goal domain entity with hierarchy/dependencies and IndexedDB record', () => {
    const domainGoal = new Goal({
      id: 'goal-migrated-123',
      title: 'هدف مرحله‌ای فصلی',
      whyStatement: 'تست یکپارچگی نقشه داده و مایگریشن',
      categoryId: 'growth',
      priority: 'high',
      status: 'active',
      targetStartDate: '2026-03-21',
      deadline: '2026-06-20',
      metric: new MetricTarget({
        startValue: 0,
        targetValue: 50,
        currentValue: 20,
        unit: 'صفحه'
      }),
      parentId: 'goal-parent-root',
      hierarchyLevel: 2,
      weight: 3,
      blockedByGoalIds: ['goal-prereq-1', 'goal-prereq-2'],
      createdAt: '2026-03-21T10:00:00Z',
      updatedAt: '2026-03-21T10:00:00Z'
    });

    // 1. To Record
    const record = GoalMapper.toRecord(domainGoal);
    expect(record.id).toBe('goal-migrated-123');
    expect(record.title).toBe('هدف مرحله‌ای فصلی');
    expect(record.parentId).toBe('goal-parent-root');
    expect(record.hierarchyLevel).toBe(2);
    expect(record.weight).toBe(3);
    expect(record.blockedByGoalIdsJson).toBe(JSON.stringify(['goal-prereq-1', 'goal-prereq-2']));

    // 2. To Domain
    const mappedBack = GoalMapper.toDomain(record);
    expect(mappedBack).toBeInstanceOf(Goal);
    expect(mappedBack.id).toBe('goal-migrated-123');
    expect(mappedBack.parentId).toBe('goal-parent-root');
    expect(mappedBack.hierarchyLevel).toBe(2);
    expect(mappedBack.weight).toBe(3);
    expect(mappedBack.blockedByGoalIds).toEqual(['goal-prereq-1', 'goal-prereq-2']);
    expect(mappedBack.hierarchyLevelLabel).toBe('هدف فصلی (مرحله‌ای)');
    expect(mappedBack.canHaveChildren).toBe(true);
  });

  it('handles defaults gracefully for legacy records lacking hierarchy attributes', () => {
    const legacyRecord = {
      id: 'legacy-goal-1',
      title: 'هدف فاز ۱',
      whyStatement: 'انگیزه بدون فیلدهای فاز ۳',
      categoryId: 'general',
      priority: 'medium' as const,
      status: 'active' as const,
      targetStartDate: '2026-03-21',
      deadline: '2026-06-20',
      metricStart: 0,
      metricTarget: 10,
      metricCurrent: 0,
      metricUnit: 'واحد',
      isArchived: 0 as const,
      createdAt: '2026-03-21T00:00:00Z',
      updatedAt: '2026-03-21T00:00:00Z'
      // No parentId, hierarchyLevel, weight, blockedByGoalIdsJson
    };

    const domain = GoalMapper.toDomain(legacyRecord);
    expect(domain.parentId).toBeUndefined();
    expect(domain.hierarchyLevel).toBe(1);
    expect(domain.weight).toBe(1);
    expect(domain.blockedByGoalIds).toEqual([]);
    expect(domain.isRoot).toBe(true);
  });
});
