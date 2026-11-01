import { describe, it, expect } from 'vitest';
import { db } from '../../src/infrastructure/db/AppDatabase';
import { UserTemplateMapper } from '../../src/infrastructure/db/mappers/UserTemplateMapper';
import { UserTemplate } from '../../src/domain/entities/UserTemplate';

describe('Phase 3 Package 2: Database Schema Migration V5 & UserTemplate Repository', () => {
  it('verifies that Dexie schema is migrated to version 5 with userTemplates table and indexes', () => {
    // 1. Check database version is at least 5
    expect(db.verno).toBeGreaterThanOrEqual(5);

    // 2. Check userTemplates table schema
    const table = db.table('userTemplates');
    expect(table).toBeDefined();
    expect(table.schema.primKey.name).toBe('id');

    const indexNames = table.schema.indexes.map(idx => idx.name);
    expect(indexNames).toContain('type');
    expect(indexNames).toContain('categoryId');
    expect(indexNames).toContain('createdAt');
  });

  it('correctly maps between Goal UserTemplate domain entity and IndexedDB record via UserTemplateMapper', () => {
    const domain = new UserTemplate({
      id: 'template-mapper-test',
      type: 'goal',
      title: 'قالب هدف آزمایشی',
      description: 'توضیحات تست مپر',
      categoryId: 'finance',
      templateData: {
        title: 'پس‌انداز هدفمند',
        whyStatement: 'امنیت مالی',
        priority: 'high',
        startValue: 0,
        targetValue: 50,
        unit: 'میلیون تومان',
        durationDays: 90,
        suggestedMilestones: ['افتتاح حساب', 'واریز اولیه'],
        guidance: 'هر ماه حداقل ۱۰ درصد درآمد را واریز کنید'
      },
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z'
    });

    const record = UserTemplateMapper.toRecord(domain);
    expect(record.id).toBe('template-mapper-test');
    expect(record.type).toBe('goal');
    expect(typeof record.templateDataJson).toBe('string');
    expect(record.templateDataJson).toContain('پس‌انداز هدفمند');

    const restoredDomain = UserTemplateMapper.toDomain(record);
    expect(restoredDomain.id).toBe(domain.id);
    expect(restoredDomain.title).toBe(domain.title);
    expect(restoredDomain.categoryId).toBe(domain.categoryId);
    expect(restoredDomain.templateData).toEqual(domain.templateData);
    expect(restoredDomain.isGoalTemplate()).toBe(true);
    expect(restoredDomain.asGoalTemplate()?.targetValue).toBe(50);
  });

  it('correctly maps between Habit UserTemplate domain entity and IndexedDB record via UserTemplateMapper', () => {
    const habitDomain = new UserTemplate({
      id: 'habit-template-mapper-test',
      type: 'habit',
      title: 'قالب عادت مطالعه',
      categoryId: 'reading',
      templateData: {
        title: 'مطالعه روزانه',
        habitType: 'duration',
        dailyTarget: 25,
        unit: 'دقیقه',
        recurrenceType: 'daily',
        recurrenceRuleJson: '{"days":[0,1,2,3,4,5,6]}',
        cue: 'بعد از شام',
        routine: 'خواندن کتاب',
        reward: 'ثبت در اپ'
      },
      createdAt: '2026-11-01T11:00:00.000Z',
      updatedAt: '2026-11-01T11:00:00.000Z'
    });

    const record = UserTemplateMapper.toRecord(habitDomain);
    expect(record.id).toBe('habit-template-mapper-test');
    expect(record.type).toBe('habit');

    const restoredDomain = UserTemplateMapper.toDomain(record);
    expect(restoredDomain.isHabitTemplate()).toBe(true);
    expect(restoredDomain.asHabitTemplate()?.dailyTarget).toBe(25);
    expect(restoredDomain.asHabitTemplate()?.cue).toBe('بعد از شام');
  });

  it('gracefully handles corrupted templateDataJson in legacy records', () => {
    const corruptedRecord = {
      id: 'corrupted-1',
      type: 'goal' as const,
      title: 'قالب خراب',
      categoryId: 'general',
      templateDataJson: '{invalid json',
      createdAt: '2026-11-01T12:00:00.000Z',
      updatedAt: '2026-11-01T12:00:00.000Z'
    };

    const domain = UserTemplateMapper.toDomain(corruptedRecord);
    expect(domain.id).toBe('corrupted-1');
    expect(domain.title).toBe('قالب خراب');
    expect(domain.templateData).toEqual({});
  });
});
