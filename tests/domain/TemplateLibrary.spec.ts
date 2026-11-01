import { describe, it, expect } from 'vitest';
import { TEMPLATE_CATEGORIES, getCategoryById, isSensitiveCategory } from '../../src/data/templates/categories';
import { PREDEFINED_GOAL_TEMPLATES, getGoalTemplatesByCategory } from '../../src/data/templates/goalTemplates';
import { PREDEFINED_HABIT_TEMPLATES, getHabitTemplatesByCategory } from '../../src/data/templates/habitTemplates';
import { UserTemplate } from '../../src/domain/entities/UserTemplate';

describe('Phase 3 Package 2: Template Library & Custom Templates', () => {
  describe('Predefined Categories & Safety Disclaimers', () => {
    it('contains all required categories with icons and descriptions', () => {
      const categoryIds = TEMPLATE_CATEGORIES.map(c => c.id);
      expect(categoryIds).toContain('health');
      expect(categoryIds).toContain('reading');
      expect(categoryIds).toContain('finance');
      expect(categoryIds).toContain('learning');
    });

    it('marks health and finance as sensitive categories with explicit non-professional disclaimers', () => {
      const healthCategory = getCategoryById('health');
      expect(healthCategory).toBeDefined();
      expect(healthCategory?.isSensitive).toBe(true);
      expect(healthCategory?.disclaimer).toContain('جایگزین مشاوره پزشکی');
      expect(isSensitiveCategory('health')).toBe(true);

      const financeCategory = getCategoryById('finance');
      expect(financeCategory).toBeDefined();
      expect(financeCategory?.isSensitive).toBe(true);
      expect(financeCategory?.disclaimer).toContain('مشاوره سرمایه‌گذاری');
      expect(isSensitiveCategory('finance')).toBe(true);

      const readingCategory = getCategoryById('reading');
      expect(readingCategory?.isSensitive).toBe(false);
      expect(isSensitiveCategory('reading')).toBe(false);
    });
  });

  describe('Predefined Goal Templates Data Integrity', () => {
    it('has valid goal templates with required fields and suggested milestones', () => {
      expect(PREDEFINED_GOAL_TEMPLATES.length).toBeGreaterThan(0);

      for (const t of PREDEFINED_GOAL_TEMPLATES) {
        expect(t.id).toBeDefined();
        expect(t.title.trim().length).toBeGreaterThan(0);
        expect(t.categoryId).toBeDefined();
        expect(t.priority).toBeDefined();
        expect(t.targetValue).toBeGreaterThan(0);
        expect(t.unit.trim().length).toBeGreaterThan(0);
        expect(t.whyStatement.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(t.suggestedMilestones)).toBe(true);
        expect(t.suggestedMilestones.length).toBeGreaterThan(0);
      }
    });

    it('filters goal templates by category', () => {
      const healthTemplates = getGoalTemplatesByCategory('health');
      expect(healthTemplates.length).toBeGreaterThan(0);
      expect(healthTemplates.every(t => t.categoryId === 'health')).toBe(true);
    });
  });

  describe('Predefined Habit Templates Data Integrity', () => {
    it('has valid habit templates with habit loop components (cue, routine, reward)', () => {
      expect(PREDEFINED_HABIT_TEMPLATES.length).toBeGreaterThan(0);

      for (const h of PREDEFINED_HABIT_TEMPLATES) {
        expect(h.id).toBeDefined();
        expect(h.title.trim().length).toBeGreaterThan(0);
        expect(h.categoryId).toBeDefined();
        expect(h.habitType).toBeDefined();
        expect(h.dailyTarget).toBeGreaterThan(0);
        expect(h.unit.trim().length).toBeGreaterThan(0);
        expect(h.recurrenceType).toBeDefined();
        expect(h.recurrenceRuleJson).toBeDefined();
        expect(h.cue).toBeDefined();
        expect(h.routine).toBeDefined();
        expect(h.reward).toBeDefined();
      }
    });

    it('filters habit templates by category', () => {
      const readingHabits = getHabitTemplatesByCategory('reading');
      expect(readingHabits.length).toBeGreaterThan(0);
      expect(readingHabits.every(h => h.categoryId === 'reading')).toBe(true);
    });
  });

  describe('UserTemplate Entity Domain Rules', () => {
    it('creates a valid custom goal template entity', () => {
      const template = new UserTemplate({
        id: 'custom-goal-1',
        type: 'goal',
        title: 'قالب اختصاصی آزمون',
        description: 'برای اهداف مطالعاتی شخصی',
        categoryId: 'learning',
        templateData: {
          title: 'مطالعه آزمون',
          whyStatement: 'قبولی با نمره بالا',
          priority: 'high',
          startValue: 0,
          targetValue: 100,
          unit: 'درصد',
          suggestedMilestones: ['مرور خلاصه', 'تست‌زنی جامع']
        },
        createdAt: '2026-11-01T08:00:00.000Z',
        updatedAt: '2026-11-01T08:00:00.000Z'
      });

      expect(template.id).toBe('custom-goal-1');
      expect(template.type).toBe('goal');
      expect(template.title).toBe('قالب اختصاصی آزمون');
      expect(template.isGoalTemplate()).toBe(true);
      expect(template.isHabitTemplate()).toBe(false);
      expect(template.asGoalTemplate()?.targetValue).toBe(100);
    });

    it('creates a valid custom habit template entity', () => {
      const template = new UserTemplate({
        id: 'custom-habit-1',
        type: 'habit',
        title: 'قالب عادت پیاده‌روی عصرگاهی',
        categoryId: 'health',
        templateData: {
          title: 'پیاده‌روی عصرگاهی',
          habitType: 'duration',
          dailyTarget: 30,
          unit: 'دقیقه',
          recurrenceType: 'daily',
          recurrenceRuleJson: '{"days":[0,1,2,3,4,5,6]}'
        },
        createdAt: '2026-11-01T08:00:00.000Z',
        updatedAt: '2026-11-01T08:00:00.000Z'
      });

      expect(template.isHabitTemplate()).toBe(true);
      expect(template.asHabitTemplate()?.dailyTarget).toBe(30);
    });

    it('throws validation error when id or title is empty', () => {
      expect(() => {
        new UserTemplate({
          id: '',
          type: 'goal',
          title: 'عنوان',
          categoryId: 'health',
          templateData: {
            title: 'عنوان',
            whyStatement: 'چرا',
            priority: 'medium',
            startValue: 0,
            targetValue: 10,
            unit: 'عدد'
          },
          createdAt: '2026-11-01T08:00:00.000Z',
          updatedAt: '2026-11-01T08:00:00.000Z'
        });
      }).toThrow('شناسه قالب الزامی است');

      expect(() => {
        new UserTemplate({
          id: 'valid-id',
          type: 'goal',
          title: '   ',
          categoryId: 'health',
          templateData: {
            title: 'عنوان',
            whyStatement: 'چرا',
            priority: 'medium',
            startValue: 0,
            targetValue: 10,
            unit: 'عدد'
          },
          createdAt: '2026-11-01T08:00:00.000Z',
          updatedAt: '2026-11-01T08:00:00.000Z'
        });
      }).toThrow('عنوان قالب الزامی است');
    });
  });
});
