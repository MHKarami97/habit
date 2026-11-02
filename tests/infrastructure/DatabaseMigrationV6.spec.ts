import { describe, it, expect } from 'vitest';
import { db } from '@/infrastructure/db/AppDatabase';
import { GoalMapper } from '@/infrastructure/db/mappers/GoalMapper';
import { Goal } from '@/domain/entities/Goal';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import { SolarDateMath } from '@/infrastructure/calendar/SolarDateMath';

describe('Database Schema Migration V6 & Goal Timeframe Support', () => {
  it('verifies that Dexie schema is migrated to version 6 with timeframe index on goals', () => {
    // 1. Check database version is at least 6
    expect(db.verno).toBeGreaterThanOrEqual(6);

    // 2. Check goals table schema contains timeframe index
    const table = db.table('goals');
    expect(table).toBeDefined();

    const indexNames = table.schema.indexes.map(idx => idx.name);
    expect(indexNames).toContain('timeframe');
    expect(indexNames).toContain('hierarchyLevel');
    expect(indexNames).toContain('parentId');
  });

  it('correctly maps 10-year and 5-year goals between domain entity and IndexedDB record via GoalMapper', () => {
    const goal10Year = new Goal({
      id: 'goal-10y-test',
      title: 'خرید ملک مسکونی مستقل',
      whyStatement: 'تأمین امنیت و آرامش بلندمدت خانواده',
      categoryId: 'finance',
      priority: 'high',
      status: 'active',
      targetStartDate: '2026-11-02',
      deadline: '2036-11-02',
      metric: new MetricTarget({
        startValue: 0,
        currentValue: 10,
        targetValue: 100,
        unit: 'درصد پیشرفت سرمایه'
      }),
      isArchived: false,
      hierarchyLevel: 1,
      timeframe: '10_year',
      weight: 1,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z'
    });

    const record = GoalMapper.toRecord(goal10Year);
    expect(record.timeframe).toBe('10_year');
    expect(record.hierarchyLevel).toBe(1);

    const restored = GoalMapper.toDomain(record);
    expect(restored.timeframe).toBe('10_year');
    expect(restored.timeframeLabel).toContain('۱۰ ساله');
    expect(restored.hierarchyLevelLabel).toContain('۱۰ ساله (چشم‌انداز)');
  });

  it('correctly calculates SolarDateMath.addSolarYears for 5-year and 10-year presets', () => {
    const baseIso = '2026-11-02'; // معادل ۱۲ آبان ۱۴۰۵ شمسی
    const in5Years = SolarDateMath.addSolarYears(baseIso, 5); // معادل ۱۲ آبان ۱۴۱۰ شمسی
    const in10Years = SolarDateMath.addSolarYears(baseIso, 10); // معادل ۱۲ آبان ۱۴۱۵ شمسی

    const sBase = SolarDateMath.gregorianToSolar(2026, 11, 2);
    expect(sBase.year).toBe(1405);
    expect(sBase.month).toBe(8);
    expect(sBase.day).toBe(11);

    const parts5 = in5Years.split('-').map(Number);
    const s5 = SolarDateMath.gregorianToSolar(parts5[0]!, parts5[1]!, parts5[2]!);
    expect(s5.year).toBe(1410);
    expect(s5.month).toBe(8);
    expect(s5.day).toBe(11);

    const parts10 = in10Years.split('-').map(Number);
    const s10 = SolarDateMath.gregorianToSolar(parts10[0]!, parts10[1]!, parts10[2]!);
    expect(s10.year).toBe(1415);
    expect(s10.month).toBe(8);
    expect(s10.day).toBe(11);
  });

  it('correctly calculates SolarDateMath.addSolarMonths for 1-month and 3-month (quarterly) presets', () => {
    const baseIso = '2026-11-02'; // ۱۱ آبان ۱۴۰۵
    const in1Month = SolarDateMath.addSolarMonths(baseIso, 1); // ۱۱ آذر ۱۴۰۵
    const in3Months = SolarDateMath.addSolarMonths(baseIso, 3); // ۱۱ بهمن ۱۴۰۵

    const parts1 = in1Month.split('-').map(Number);
    const s1 = SolarDateMath.gregorianToSolar(parts1[0]!, parts1[1]!, parts1[2]!);
    expect(s1.year).toBe(1405);
    expect(s1.month).toBe(9);
    expect(s1.day).toBe(11);

    const parts3 = in3Months.split('-').map(Number);
    const s3 = SolarDateMath.gregorianToSolar(parts3[0]!, parts3[1]!, parts3[2]!);
    expect(s3.year).toBe(1405);
    expect(s3.month).toBe(11);
    expect(s3.day).toBe(11);
  });

  it('provides appropriate default timeframe based on hierarchy level when timeframe is omitted', () => {
    const rootGoal = new Goal({
      id: 'g-def-root',
      title: 'هدف ریشه بدون افق مشخص',
      whyStatement: 'تست',
      categoryId: 'general',
      priority: 'medium',
      status: 'active',
      targetStartDate: '2026-11-02',
      deadline: '2027-11-02',
      metric: new MetricTarget({ startValue: 0, currentValue: 0, targetValue: 1, unit: 'مورد' }),
      isArchived: false,
      hierarchyLevel: 1,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z'
    });
    expect(rootGoal.timeframe).toBe('annual');
    expect(rootGoal.timeframeLabel).toContain('سالانه');

    const seasonalChild = new Goal({
      id: 'g-def-seasonal',
      title: 'هدف فرزند فصلی',
      whyStatement: 'تست',
      categoryId: 'general',
      priority: 'medium',
      status: 'active',
      targetStartDate: '2026-11-02',
      deadline: '2027-02-02',
      metric: new MetricTarget({ startValue: 0, currentValue: 0, targetValue: 1, unit: 'مورد' }),
      isArchived: false,
      hierarchyLevel: 2,
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z'
    });
    expect(seasonalChild.timeframe).toBe('quarterly');
    expect(seasonalChild.timeframeLabel).toContain('فصلی');
  });
});
