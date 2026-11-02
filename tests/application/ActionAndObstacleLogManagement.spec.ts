import { describe, it, expect } from 'vitest';
import { UpdateActionLogUseCase } from '@/application/use-cases/goals/UpdateActionLogUseCase';
import { DeleteActionLogUseCase } from '@/application/use-cases/goals/DeleteActionLogUseCase';
import { UpdateObstacleLogUseCase } from '@/application/use-cases/goals/UpdateObstacleLogUseCase';
import { DeleteObstacleLogUseCase } from '@/application/use-cases/goals/DeleteObstacleLogUseCase';
import { CheckInHabitUseCase } from '@/application/use-cases/habits/CheckInHabitUseCase';
import { Goal } from '@/domain/entities/Goal';
import { Habit } from '@/domain/entities/Habit';
import { ActionLog } from '@/domain/entities/ActionLog';
import { ObstacleLog } from '@/domain/entities/ObstacleLog';
import { HabitLog } from '@/domain/entities/HabitLog';
import { MetricTarget } from '@/domain/value-objects/MetricTarget';
import type { IGoalRepository } from '@/domain/ports/IGoalRepository';
import type { IHabitRepository } from '@/domain/ports/IHabitRepository';
import type { IHabitLogRepository } from '@/domain/ports/IHabitLogRepository';

class MockGoalRepo implements IGoalRepository {
  goals: Goal[] = [];
  actionLogs: ActionLog[] = [];
  obstacleLogs: ObstacleLog[] = [];

  async findById(id: string): Promise<Goal | null> {
    return this.goals.find(g => g.id === id) || null;
  }
  async findAll(): Promise<readonly Goal[]> {
    return [...this.goals];
  }
  async save(goal: Goal): Promise<void> {
    const idx = this.goals.findIndex(g => g.id === goal.id);
    if (idx >= 0) this.goals[idx] = goal;
    else this.goals.push(goal);
  }
  async delete(id: string): Promise<void> {
    this.goals = this.goals.filter(g => g.id !== id);
  }
  async findMilestonesByGoalId(): Promise<any[]> { return []; }
  async saveMilestone(): Promise<void> {}
  async deleteMilestone(): Promise<void> {}

  async findActionLogsByGoalId(goalId: string): Promise<readonly ActionLog[]> {
    return this.actionLogs.filter(a => a.goalId === goalId);
  }
  async saveActionLog(actionLog: ActionLog): Promise<void> {
    const idx = this.actionLogs.findIndex(a => a.id === actionLog.id);
    if (idx >= 0) this.actionLogs[idx] = actionLog;
    else this.actionLogs.push(actionLog);
  }
  async deleteActionLog(actionLogId: string): Promise<void> {
    this.actionLogs = this.actionLogs.filter(a => a.id !== actionLogId);
  }

  async findObstacleLogsByGoalId(goalId: string): Promise<readonly ObstacleLog[]> {
    return this.obstacleLogs.filter(o => o.goalId === goalId);
  }
  async saveObstacleLog(obstacleLog: ObstacleLog): Promise<void> {
    const idx = this.obstacleLogs.findIndex(o => o.id === obstacleLog.id);
    if (idx >= 0) this.obstacleLogs[idx] = obstacleLog;
    else this.obstacleLogs.push(obstacleLog);
  }
  async deleteObstacleLog(obstacleLogId: string): Promise<void> {
    this.obstacleLogs = this.obstacleLogs.filter(o => o.id !== obstacleLogId);
  }
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
    if (idx >= 0) this.habits[idx] = habit;
    else this.habits.push(habit);
  }
  async delete(id: string): Promise<void> {
    this.habits = this.habits.filter(h => h.id !== id);
  }
}

class MockHabitLogRepo implements IHabitLogRepository {
  logs: HabitLog[] = [];

  async findById(id: string): Promise<HabitLog | null> {
    return this.logs.find(l => l.id === id) || null;
  }
  async findByHabitAndDate(habitId: string, date: string): Promise<HabitLog | null> {
    return this.logs.find(l => l.habitId === habitId && l.date === date) || null;
  }
  async findLogsByHabitId(habitId: string): Promise<readonly HabitLog[]> {
    return this.logs.filter(l => l.habitId === habitId);
  }
  async findAllLogsForDate(date: string): Promise<readonly HabitLog[]> {
    return this.logs.filter(l => l.date === date);
  }
  async save(log: HabitLog): Promise<void> {
    const idx = this.logs.findIndex(l => l.id === log.id);
    if (idx >= 0) this.logs[idx] = log;
    else this.logs.push(log);
  }
  async delete(id: string): Promise<void> {
    this.logs = this.logs.filter(l => l.id !== id);
  }
  async deleteByHabitId(habitId: string): Promise<void> {
    this.logs = this.logs.filter(l => l.habitId !== habitId);
  }
}

describe('مدیریت لاگ‌های اقدام و مانع (Action & Obstacle Logs) و ویرایش عادات تعدادی', () => {
  describe('UpdateActionLogUseCase', () => {
    it('باید فیلدهای اقدام را ویرایش کرده و اختلاف دلتا را روی سنجه هدف اعمال کند (افزایش پیشرفت)', async () => {
      const repo = new MockGoalRepo();
      const goal = new Goal({
        id: 'g-1',
        title: 'هدف تست',
        whyStatement: 'علت',
        categoryId: 'work',
        priority: 'high',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-01',
        metric: new MetricTarget({
          startValue: 0,
          currentValue: 10,
          targetValue: 50,
          unit: 'صفحه'
        }),
        isArchived: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z'
      });
      await repo.save(goal);

      const action = new ActionLog({
        id: 'act-1',
        goalId: 'g-1',
        date: '2026-11-01',
        description: 'مطالعه ۵ صفحه اول',
        progressDelta: 5,
        durationMinutes: 30,
        nextStep: 'مطالعه فصل دوم',
        createdAt: '2026-11-01T10:00:00.000Z'
      });
      await repo.saveActionLog(action);

      const useCase = new UpdateActionLogUseCase(repo);
      const updated = await useCase.execute({
        id: 'act-1',
        goalId: 'g-1',
        date: '2026-11-01',
        description: 'مطالعه ۸ صفحه اول (اصلاح شده)',
        progressDelta: 8, // +3 افزایش
        durationMinutes: 45,
        nextStep: 'مطالعه فصل سوم'
      });

      expect(updated.progressDelta).toBe(8);
      expect(updated.description).toBe('مطالعه ۸ صفحه اول (اصلاح شده)');
      expect(updated.nextStep).toBe('مطالعه فصل سوم');

      const updatedGoal = await repo.findById('g-1');
      // مقدار سنجه هدف قبلاً ۱۰ بود، با افزایش ۳ تایی دلتای اقدام باید به ۱۳ برسد
      expect(updatedGoal?.metric.currentValue).toBe(13);
    });

    it('باید در صورت کاهش دلتا، سنجه هدف را به تناسب کاهش دهد', async () => {
      const repo = new MockGoalRepo();
      const goal = new Goal({
        id: 'g-1',
        title: 'هدف تست',
        whyStatement: 'علت',
        categoryId: 'work',
        priority: 'high',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-01',
        metric: new MetricTarget({
          startValue: 0,
          currentValue: 10,
          targetValue: 50,
          unit: 'صفحه'
        }),
        isArchived: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z'
      });
      await repo.save(goal);

      const action = new ActionLog({
        id: 'act-1',
        goalId: 'g-1',
        date: '2026-11-01',
        description: 'ثبت اشتباه ۵ صفحه',
        progressDelta: 5,
        durationMinutes: 20,
        createdAt: '2026-11-01T10:00:00.000Z'
      });
      await repo.saveActionLog(action);

      const useCase = new UpdateActionLogUseCase(repo);
      await useCase.execute({
        id: 'act-1',
        goalId: 'g-1',
        date: '2026-11-01',
        description: 'اصلاح به ۲ صفحه',
        progressDelta: 2, // -3 کاهش
        durationMinutes: 20
      });

      const updatedGoal = await repo.findById('g-1');
      expect(updatedGoal?.metric.currentValue).toBe(7); // 10 - 3 = 7
    });

    it('اگر اقدام وجود نداشته باشد باید خطای مناسب پرتاب کند', async () => {
      const repo = new MockGoalRepo();
      const useCase = new UpdateActionLogUseCase(repo);

      await expect(useCase.execute({
        id: 'non-existent',
        goalId: 'g-1',
        date: '2026-11-01',
        description: 'تست',
        progressDelta: 1,
        durationMinutes: 10
      })).rejects.toThrow('اقدام با شناسه non-existent یافت نشد.');
    });
  });

  describe('DeleteActionLogUseCase', () => {
    it('باید اقدام را حذف کرده و مقدار پیشرفت آن را از سنجه هدف کسر کند', async () => {
      const repo = new MockGoalRepo();
      const goal = new Goal({
        id: 'g-1',
        title: 'هدف تست',
        whyStatement: 'علت',
        categoryId: 'work',
        priority: 'medium',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-01',
        metric: new MetricTarget({
          startValue: 0,
          currentValue: 15,
          targetValue: 50,
          unit: 'صفحه'
        }),
        isArchived: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z'
      });
      await repo.save(goal);

      const action = new ActionLog({
        id: 'act-del',
        goalId: 'g-1',
        date: '2026-11-01',
        description: 'اقدامی که باید حذف شود',
        progressDelta: 6,
        durationMinutes: 30,
        createdAt: '2026-11-01T10:00:00.000Z'
      });
      await repo.saveActionLog(action);

      const useCase = new DeleteActionLogUseCase(repo);
      await useCase.execute({ id: 'act-del', goalId: 'g-1' });

      const remainingActions = await repo.findActionLogsByGoalId('g-1');
      expect(remainingActions.length).toBe(0);

      const updatedGoal = await repo.findById('g-1');
      expect(updatedGoal?.metric.currentValue).toBe(9); // 15 - 6 = 9
    });
  });

  describe('UpdateObstacleLogUseCase & DeleteObstacleLogUseCase', () => {
    it('باید مانع ثبت‌شده و برنامه اگر-آنگاه را به‌روزرسانی کند', async () => {
      const repo = new MockGoalRepo();
      const obstacle = new ObstacleLog({
        id: 'obs-1',
        goalId: 'g-1',
        date: '2026-11-01',
        category: 'distraction',
        note: 'حواس‌پرتی با گوشی',
        ifThenPlan: 'گوشی در اتاق دیگر بماند',
        createdAt: '2026-11-01T10:00:00.000Z'
      });
      await repo.saveObstacleLog(obstacle);

      const useCase = new UpdateObstacleLogUseCase(repo);
      const updated = await useCase.execute({
        id: 'obs-1',
        goalId: 'g-1',
        category: 'custom',
        customCategory: 'خستگی مفرط',
        note: 'خستگی بعد از کار روزانه',
        ifThenPlan: 'اگر خسته بودم، ابتدا ۲۰ دقیقه استراحت و سپس ۱۵ دقیقه مطالعه می‌کنم'
      });

      expect(updated.category).toBe('custom');
      expect(updated.customCategory).toBe('خستگی مفرط');
      expect(updated.ifThenPlan).toContain('۲۰ دقیقه استراحت');
    });

    it('باید مانع ثبت‌شده را حذف کند', async () => {
      const repo = new MockGoalRepo();
      const obstacle = new ObstacleLog({
        id: 'obs-del',
        goalId: 'g-1',
        date: '2026-11-01',
        category: 'time',
        note: 'کمبود وقت',
        ifThenPlan: 'برنامه‌ریزی اول صبح',
        createdAt: '2026-11-01T10:00:00.000Z'
      });
      await repo.saveObstacleLog(obstacle);

      const useCase = new DeleteObstacleLogUseCase(repo);
      await useCase.execute({ id: 'obs-del', goalId: 'g-1' });

      const remainingObstacles = await repo.findObstacleLogsByGoalId('g-1');
      expect(remainingObstacles.length).toBe(0);
    });
  });

  describe('CheckInHabitUseCase - برگشت زدن و ویرایش عادات تعدادی', () => {
    it('باید امکان کم کردن مقدار ثبت‌شده اشتباه و بازگشت به مقدار کمتر (مثلاً از ۱ به ۰) را فراهم کند', async () => {
      const habitRepo = new MockHabitRepo();
      const logRepo = new MockHabitLogRepo();

      const habit = new Habit({
        id: 'h-numeric',
        title: 'نوشیدن آب',
        icon: 'droplet',
        color: 'blue',
        categoryId: 'health',
        habitType: 'numeric',
        recurrence: { type: 'daily' },
        dailyTarget: 8,
        unit: 'لیوان',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z'
      });
      await habitRepo.save(habit);

      const checkInUseCase = new CheckInHabitUseCase(habitRepo, logRepo);

      // کاربر اشتباهاً ۱ لیوان ثبت می‌کند
      const log1 = await checkInUseCase.execute({
        habitId: 'h-numeric',
        date: '2026-11-02',
        customValue: 1
      });
      expect(log1.value).toBe(1);
      expect(log1.isCompleted).toBe(false);

      // کاربر دستش خورده و می‌خواهد برگشت بزند و صفرش کند
      const log2 = await checkInUseCase.execute({
        habitId: 'h-numeric',
        date: '2026-11-02',
        customValue: 0
      });
      expect(log2.value).toBe(0);
      expect(log2.isCompleted).toBe(false);
    });

    it('اگر مقدار به زیر صفر ارسال شود، باید به صفر کلمپ (Clamp) شود و منفی نشود', async () => {
      const habitRepo = new MockHabitRepo();
      const logRepo = new MockHabitLogRepo();

      const habit = new Habit({
        id: 'h-numeric',
        title: 'نوشیدن آب',
        icon: 'droplet',
        color: 'blue',
        categoryId: 'health',
        habitType: 'numeric',
        recurrence: { type: 'daily' },
        dailyTarget: 8,
        unit: 'لیوان',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z'
      });
      await habitRepo.save(habit);

      const checkInUseCase = new CheckInHabitUseCase(habitRepo, logRepo);

      const log = await checkInUseCase.execute({
        habitId: 'h-numeric',
        date: '2026-11-02',
        customValue: -5
      });
      expect(log.value).toBe(0);
    });

    it('اگر عادت تکمیل‌شده بود و به هدف متصل بود، با برگشت زدن به زیر سقف هدف، سهم آن از سنجه هدف کسر شود', async () => {
      const habitRepo = new MockHabitRepo();
      const logRepo = new MockHabitLogRepo();
      const goalRepo = new MockGoalRepo();

      const goal = new Goal({
        id: 'g-linked',
        title: 'سلامت عمومی',
        whyStatement: 'علت',
        categoryId: 'health',
        priority: 'high',
        status: 'active',
        targetStartDate: '2026-11-01',
        deadline: '2026-12-01',
        metric: new MetricTarget({
          startValue: 0,
          currentValue: 0,
          targetValue: 100,
          unit: 'امتیاز'
        }),
        isArchived: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z'
      });
      await goalRepo.save(goal);

      const habit = new Habit({
        id: 'h-linked',
        title: 'ورزش روزانه',
        icon: 'dumbbell',
        color: 'green',
        categoryId: 'health',
        habitType: 'duration',
        recurrence: { type: 'daily' },
        dailyTarget: 30,
        unit: 'دقیقه',
        linkedGoalId: 'g-linked',
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z'
      });
      await habitRepo.save(habit);

      const checkInUseCase = new CheckInHabitUseCase(habitRepo, logRepo, goalRepo);

      // ثبت تکمیل عادت (۳۰ دقیقه) -> هدف مرتبط ۳۰ واحد دریافت می‌کند
      await checkInUseCase.execute({
        habitId: 'h-linked',
        date: '2026-11-02',
        customValue: 30
      });
      let currentGoal = await goalRepo.findById('g-linked');
      expect(currentGoal?.metric.currentValue).toBe(30);

      // کاربر اصلاح می‌کند: اشتباه شده بود، ۱۵ دقیقه انجام شده بود نه ۳۰ دقیقه (زیر سقف هدف)
      await checkInUseCase.execute({
        habitId: 'h-linked',
        date: '2026-11-02',
        customValue: 15
      });

      currentGoal = await goalRepo.findById('g-linked');
      // سهم هدف به درستی بازگشت خورده و کسر می‌شود
      expect(currentGoal?.metric.currentValue).toBe(0);
    });
  });
});
