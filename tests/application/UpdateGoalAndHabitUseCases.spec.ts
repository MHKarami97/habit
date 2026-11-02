import { describe, it, expect } from 'vitest';
import { UpdateGoalUseCase } from '@/application/use-cases/goals/UpdateGoalUseCase';
import { UpdateHabitUseCase } from '@/application/use-cases/habits/UpdateHabitUseCase';
import { Goal } from '@/domain/entities/Goal';
import { Habit } from '@/domain/entities/Habit';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import type { IGoalRepository } from '@/domain/ports/IGoalRepository';
import type { IHabitRepository } from '@/domain/ports/IHabitRepository';

class MockGoalRepo implements IGoalRepository {
  goals: Goal[] = [];

  async findById(id: string): Promise<Goal | null> {
    return this.goals.find(g => g.id === id) || null;
  }
  async findAll(): Promise<readonly Goal[]> {
    return [...this.goals];
  }
  async save(goal: Goal): Promise<void> {
    const idx = this.goals.findIndex(g => g.id === goal.id);
    if (idx >= 0) {
      this.goals[idx] = goal;
    } else {
      this.goals.push(goal);
    }
  }
  async delete(id: string): Promise<void> {
    this.goals = this.goals.filter(g => g.id !== id);
  }
  async findMilestonesByGoalId(): Promise<any[]> { return []; }
  async saveMilestone(): Promise<void> {}
  async deleteMilestone(): Promise<void> {}
  async findActionLogsByGoalId(): Promise<any[]> { return []; }
  async saveActionLog(): Promise<void> {}
  async deleteActionLog(): Promise<void> {}
  async findObstacleLogsByGoalId(): Promise<any[]> { return []; }
  async saveObstacleLog(): Promise<void> {}
  async deleteObstacleLog(): Promise<void> {}
}

class MockHabitRepo implements IHabitRepository {
  habits: Habit[] = [];

  async findById(id: string): Promise<Habit | null> {
    return this.habits.find(h => h.id === id) || null;
  }
  async findAll(): Promise<readonly Habit[]> {
    return [...this.habits];
  }
  async findByGoalId(goalId: string): Promise<readonly Habit[]> {
    return this.habits.filter(h => h.linkedGoalId === goalId);
  }
  async save(habit: Habit): Promise<void> {
    const idx = this.habits.findIndex(h => h.id === habit.id);
    if (idx >= 0) {
      this.habits[idx] = habit;
    } else {
      this.habits.push(habit);
    }
  }
  async delete(id: string): Promise<void> {
    this.habits = this.habits.filter(h => h.id !== id);
  }
}

describe('UpdateGoalUseCase & UpdateHabitUseCase', () => {
  describe('UpdateGoalUseCase', () => {
    it('باید مشخصات هدف موجود را با حفظ پیشرفت فعلی و شناسه به‌روزرسانی کند', async () => {
      const repo = new MockGoalRepo();
      const initialGoal = new Goal({
        id: 'g-1',
        title: 'هدف اولیه',
        whyStatement: 'دلیل اولیه',
        categoryId: 'general',
        priority: 'low',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-01',
        metric: new MetricTarget({
          startValue: 0,
          currentValue: 5,
          targetValue: 10,
          unit: 'صفحه'
        }),
        isArchived: false,
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-01T10:00:00.000Z'
      });
      await repo.save(initialGoal);

      const useCase = new UpdateGoalUseCase(repo);
      const updated = await useCase.execute({
        id: 'g-1',
        title: 'هدف ویرایش‌شده',
        whyStatement: 'دلیل ویرایش‌شده و قوی‌تر',
        priority: 'high',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-15',
        startValue: 0,
        targetValue: 20,
        unit: 'فصل'
      });

      expect(updated.id).toBe('g-1');
      expect(updated.title).toBe('هدف ویرایش‌شده');
      expect(updated.whyStatement).toBe('دلیل ویرایش‌شده و قوی‌تر');
      expect(updated.priority).toBe('high');
      expect(updated.deadline).toBe('2026-12-15');
      expect(updated.metric.targetValue).toBe(20);
      expect(updated.metric.unit).toBe('فصل');
      // مقدار پیشرفت فعلی (currentValue = 5) باید حفظ شود
      expect(updated.metric.currentValue).toBe(5);
      expect(updated.createdAt).toBe('2026-11-01T10:00:00.000Z');
      expect(updated.updatedAt).not.toBe('2026-11-01T10:00:00.000Z');
    });

    it('باید در صورت انتساب پیش‌نیاز دایره‌ای خطا پرتاب کند', async () => {
      const repo = new MockGoalRepo();
      const goalA = new Goal({
        id: 'g-A',
        title: 'هدف A',
        whyStatement: 'دلیل A',
        categoryId: 'general',
        priority: 'medium',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-01',
        metric: new MetricTarget({ startValue: 0, currentValue: 0, targetValue: 10, unit: 'مورد' }),
        isArchived: false,
        blockedByGoalIds: ['g-B'],
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-01T10:00:00.000Z'
      });
      const goalB = new Goal({
        id: 'g-B',
        title: 'هدف B',
        whyStatement: 'دلیل B',
        categoryId: 'general',
        priority: 'medium',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-01',
        metric: new MetricTarget({ startValue: 0, currentValue: 0, targetValue: 10, unit: 'مورد' }),
        isArchived: false,
        createdAt: '2026-11-01T10:00:00.000Z',
        updatedAt: '2026-11-01T10:00:00.000Z'
      });
      await repo.save(goalA);
      await repo.save(goalB);

      const useCase = new UpdateGoalUseCase(repo);
      // تلاش برای وابسته کردن B به A که دور A -> B -> A ایجاد می‌کند
      await expect(
        useCase.execute({
          id: 'g-B',
          title: 'هدف B',
          whyStatement: 'دلیل B',
          priority: 'medium',
          targetStartDate: '2026-11-01',
          deadline: '2026-12-01',
          startValue: 0,
          targetValue: 10,
          unit: 'مورد',
          blockedByGoalIds: ['g-A']
        })
      ).rejects.toThrow(/دور|وابستگی دایره‌ای/);
    });

    it('باید در صورت ناموجود بودن هدف خطا پرتاب کند', async () => {
      const repo = new MockGoalRepo();
      const useCase = new UpdateGoalUseCase(repo);
      await expect(
        useCase.execute({
          id: 'non-existing',
          title: 'تست',
          whyStatement: 'تست',
          priority: 'low',
          targetStartDate: '2026-11-01',
          deadline: '2026-12-01',
          startValue: 0,
          targetValue: 10,
          unit: 'بار'
        })
      ).rejects.toThrow('یافت نشد');
    });
  });

  describe('UpdateHabitUseCase', () => {
    it('باید مشخصات عادت موجود را به‌روزرسانی کند و تاریخ شروع و وضعیت فعال بودن را حفظ کند', async () => {
      const repo = new MockHabitRepo();
      const initialHabit = new Habit({
        id: 'h-1',
        title: 'ورزش صبحگاهی',
        icon: 'flame',
        color: '#D2532A',
        categoryId: 'health',
        habitType: 'duration',
        recurrence: { type: 'daily' },
        dailyTarget: 20,
        unit: 'دقیقه',
        cue: 'بعد از بیدار شدن',
        reminderTimes: ['07:00'],
        startDate: '2026-10-01',
        isPaused: false,
        isArchived: false,
        weeklyFreezeAllowed: true,
        createdAt: '2026-10-01T07:00:00.000Z',
        updatedAt: '2026-10-01T07:00:00.000Z'
      });
      await repo.save(initialHabit);

      const useCase = new UpdateHabitUseCase(repo);
      const updated = await useCase.execute({
        id: 'h-1',
        title: 'ورزش و حرکات کششی',
        habitType: 'duration',
        recurrence: { type: 'weekly_days', daysOfWeek: [0, 2, 4] },
        dailyTarget: 30,
        unit: 'دقیقه',
        cue: 'بلافاصله پس از نوشیدن آب صبحگاهی',
        reminderTimes: ['07:30'],
        weeklyFreezeAllowed: false
      });

      expect(updated.id).toBe('h-1');
      expect(updated.title).toBe('ورزش و حرکات کششی');
      expect(updated.dailyTarget).toBe(30);
      expect(updated.recurrence.type).toBe('weekly_days');
      expect(updated.cue).toBe('بلافاصله پس از نوشیدن آب صبحگاهی');
      expect(updated.reminderTimes).toEqual(['07:30']);
      expect(updated.weeklyFreezeAllowed).toBe(false);
      expect(updated.startDate).toBe('2026-10-01');
      expect(updated.createdAt).toBe('2026-10-01T07:00:00.000Z');
      expect(updated.updatedAt).not.toBe('2026-10-01T07:00:00.000Z');
    });

    it('باید در صورت ناموجود بودن عادت خطا پرتاب کند', async () => {
      const repo = new MockHabitRepo();
      const useCase = new UpdateHabitUseCase(repo);
      await expect(
        useCase.execute({
          id: 'non-existing-habit',
          title: 'تست',
          habitType: 'boolean',
          recurrence: { type: 'daily' },
          dailyTarget: 1,
          unit: 'بار'
        })
      ).rejects.toThrow('یافت نشد');
    });
  });
});
