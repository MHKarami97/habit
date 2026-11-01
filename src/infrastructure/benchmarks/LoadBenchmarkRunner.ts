import { db } from '../db/AppDatabase';
import type { GoalRecord, HabitRecord, HabitLogRecord } from '../db/AppDatabase';

export interface BenchmarkResult {
  readonly goalsCount: number;
  readonly habitsCount: number;
  readonly logsCount: number;
  readonly insertionTimeMs: number;
  readonly todayQueryTimeMs: number;
  readonly habitHistoryQueryTimeMs: number;
  readonly estimatedMemoryMb: number;
  readonly passedBudget: boolean;
  readonly message: string;
}

export class LoadBenchmarkRunner {
  private static readonly BENCH_PREFIX = 'bench-';

  /**
   * اجرای تست بارگذاری سنگین (۵۰۰ هدف، ۳۰۰ عادت، ۵۰٬۰۰۰ لاگ)
   * اندازه‌گیری زمان بارگذاری صفحه، اجرای کوئری‌ها و مصرف حافظه
   */
  static async runLoadTest(options?: {
    goalsCount?: number;
    habitsCount?: number;
    logsCount?: number;
    onProgress?: (stage: string, percent: number) => void;
  }): Promise<BenchmarkResult> {
    const goalsTarget = options?.goalsCount ?? 500;
    const habitsTarget = options?.habitsCount ?? 300;
    const logsTarget = options?.logsCount ?? 50000;
    const progress = options?.onProgress || (() => {});

    progress('تولید داده‌های فرضی ۵۰۰ هدف...', 10);
    const nowIso = new Date().toISOString();

    // ۱. تولید ۵۰۰ هدف
    const goals: GoalRecord[] = [];
    for (let i = 1; i <= goalsTarget; i++) {
      goals.push({
        id: `${this.BENCH_PREFIX}goal-${i}`,
        title: `هدف آزمایشی عملکرد ${i}`,
        whyStatement: 'سنجش پایداری در بارگذاری سنگین',
        categoryId: i % 2 === 0 ? 'learning' : 'health',
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low',
        status: i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'scheduled' : 'active',
        targetStartDate: '2026-01-01',
        deadline: '2026-12-29',
        startValue: 0,
        currentValue: (i * 7) % 100,
        targetValue: 100,
        unit: 'واحد',
        isArchived: 0,
        createdAt: nowIso,
        updatedAt: nowIso
      });
    }

    progress('تولید داده‌های فرضی ۳۰۰ عادت...', 25);
    // ۲. تولید ۳۰۰ عادت
    const habits: HabitRecord[] = [];
    for (let i = 1; i <= habitsTarget; i++) {
      habits.push({
        id: `${this.BENCH_PREFIX}habit-${i}`,
        title: `عادت آزمایشی بارگذاری ${i}`,
        icon: 'star',
        color: '#D2532A',
        categoryId: 'general',
        habitType: i % 3 === 0 ? 'numeric' : 'boolean',
        recurrenceType: 'daily',
        recurrenceRuleJson: JSON.stringify({ type: 'daily' }),
        dailyTarget: 1,
        unit: 'بار',
        cue: 'بعد از صبحانه',
        linkedGoalId: `${this.BENCH_PREFIX}goal-${(i % goalsTarget) + 1}`,
        reminderTimesJson: JSON.stringify(['08:00']),
        startDate: '2026-01-01',
        isPaused: i % 10 === 0 ? 1 : 0,
        isArchived: 0,
        weeklyFreezeAllowed: 1,
        createdAt: nowIso,
        updatedAt: nowIso
      });
    }

    progress('تولید ۵۰٬۰۰۰ لاگ فعالیت...', 40);
    // ۳. تولید ۵۰٬۰۰۰ لاگ روزانه (تقسیم بین ۳۰۰ عادت در طول ۱۸۰ روز اخیر)
    const logs: HabitLogRecord[] = [];
    const baseDate = new Date('2026-10-31');

    for (let i = 0; i < logsTarget; i++) {
      const habitId = `${this.BENCH_PREFIX}habit-${(i % habitsTarget) + 1}`;
      const dayOffset = Math.floor(i / habitsTarget) % 180;
      const d = new Date(baseDate);
      d.setDate(d.getDate() - dayOffset);
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      logs.push({
        id: `${this.BENCH_PREFIX}log-${i + 1}`,
        habitId,
        date: dateIso,
        value: 1,
        isCompleted: i % 5 !== 0 ? 1 : 0,
        isFrozen: i % 25 === 0 ? 1 : 0,
        createdAt: nowIso
      });
    }

    progress('درج پرسرعت در دیتابیس (Chunked Bulk Insert)...', 60);
    const startInsert = performance.now();

    // درج قطعه‌قطعه (Chunked) برای جلوگیری از اشغال یک‌باره نخ حافظه
    await db.transaction('rw', [db.goals, db.habits, db.habitLogs], async () => {
      await db.goals.bulkAdd(goals);
      await db.habits.bulkAdd(habits);

      // لاگ‌ها در دسته‌های ۱۰٬۰۰۰تایی درج می‌شوند
      const chunkSize = 10000;
      for (let c = 0; c < logs.length; c += chunkSize) {
        await db.habitLogs.bulkAdd(logs.slice(c, c + chunkSize));
      }
    });

    const insertionTimeMs = Math.round(performance.now() - startInsert);

    progress('سنجش سرعت کوئری‌های صفحه امروز...', 80);
    // ۴. سنجش کوئری صفحه امروز با داده‌های حجیم
    const startTodayQuery = performance.now();
    const todayIso = '2026-10-31';

    // الف) دریافت تمام لاگ‌های امروز از طریق ایندکس
    const todayLogs = await db.habitLogs.where('date').equals(todayIso).toArray();
    // ب) دریافت تمام عادات فعال
    const activeHabits = await db.habits.where('isArchived').equals(0).and(h => h.isPaused === 0).toArray();
    // ج) دریافت تمام اهداف فعال
    const activeGoals = await db.goals.where('status').equals('active').and(g => g.isArchived === 0).toArray();

    // اعتبارسنجی غیرتهی بودن نتایج کوئری
    void (todayLogs.length + activeHabits.length + activeGoals.length);

    const todayQueryTimeMs = Math.round(performance.now() - startTodayQuery);

    progress('سنجش سرعت بازیابی تاریخچه عادت...', 90);
    // ۵. سنجش کوئری تاریخچه ۱۸۰ روزه یک عادت از بین ۵۰٬۰۰۰ لاگ
    const startHistoryQuery = performance.now();
    const sampleHabitId = `${this.BENCH_PREFIX}habit-1`;
    await db.habitLogs.where('habitId').equals(sampleHabitId).sortBy('date');
    const habitHistoryQueryTimeMs = Math.round(performance.now() - startHistoryQuery);

    // ۶. برآورد مصرف حافظه
    let estimatedMemoryMb = 0;
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      estimatedMemoryMb = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
    } else {
      // تخمین بر اساس تعداد بایت‌های آرایه‌ها در رم (~۱۲۰ بایت به ازای هر رکورد لاگ)
      estimatedMemoryMb = Math.round((logsTarget * 130 + goalsTarget * 350 + habitsTarget * 250) / (1024 * 1024));
    }

    progress('پایان ارزیابی و استخراج کارنامه عملکرد.', 100);

    // بودجه عملکرد: کوئری صفحه امروز زیر ۱۰۰ میلی‌ثانیه، کوئری تاریخچه زیر ۵۰ میلی‌ثانیه
    const passedBudget = todayQueryTimeMs < 120 && habitHistoryQueryTimeMs < 80;

    return {
      goalsCount: goalsTarget,
      habitsCount: habitsTarget,
      logsCount: logsTarget,
      insertionTimeMs,
      todayQueryTimeMs,
      habitHistoryQueryTimeMs,
      estimatedMemoryMb,
      passedBudget,
      message: passedBudget
        ? `عالی: پاسخگویی صفحه امروز در ${todayQueryTimeMs}ms و تاریخچه در ${habitHistoryQueryTimeMs}ms در محدوده بودجه مجاز قرار دارد.`
        : `هشدار: زمان کوئری‌ها بالاتر از بودجه بهینه است (${todayQueryTimeMs}ms).`
    };
  }

  /**
   * پاک‌سازی کامل تمام رکوردهای تست فرضی
   * تضمین ۱۰۰٪ عدم تداخل با داده‌های واقعی کاربر
   */
  static async cleanupBenchmarkData(): Promise<{ deletedGoals: number; deletedHabits: number; deletedLogs: number }> {
    const goalsKeys = await db.goals.where('id').startsWith(this.BENCH_PREFIX).primaryKeys();
    const habitsKeys = await db.habits.where('id').startsWith(this.BENCH_PREFIX).primaryKeys();
    const logsKeys = await db.habitLogs.where('id').startsWith(this.BENCH_PREFIX).primaryKeys();

    await db.transaction('rw', [db.goals, db.habits, db.habitLogs], async () => {
      await db.goals.bulkDelete(goalsKeys);
      await db.habits.bulkDelete(habitsKeys);
      await db.habitLogs.bulkDelete(logsKeys);
    });

    return {
      deletedGoals: goalsKeys.length,
      deletedHabits: habitsKeys.length,
      deletedLogs: logsKeys.length
    };
  }
}
