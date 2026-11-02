import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Habit } from '@/domain/entities/Habit';
import { HabitLog } from '@/domain/entities/HabitLog';
import { StreakCalculator, StreakAnalysisResult } from '@/domain/services/StreakCalculator';
import { container } from '@/infrastructure/di/container';
import { CreateHabitUseCase, CreateHabitInput } from '@/application/use-cases/habits/CreateHabitUseCase';
import { UpdateHabitUseCase, UpdateHabitInput } from '@/application/use-cases/habits/UpdateHabitUseCase';
import { CheckInHabitUseCase, CheckInHabitInput } from '@/application/use-cases/habits/CheckInHabitUseCase';
import { BackfillHabitLogUseCase, BackfillHabitLogInput } from '@/application/use-cases/habits/BackfillHabitLogUseCase';
import { ToggleFreezeHabitUseCase } from '@/application/use-cases/habits/ToggleFreezeHabitUseCase';
import { db } from '@/infrastructure/db/AppDatabase';
import { ReminderCoordinator } from '@/application/reminders/ReminderCoordinator';

export const useHabitStore = defineStore('habits', () => {
  const habits = ref<readonly Habit[]>([]);
  const todayLogs = ref<readonly HabitLog[]>([]);
  const habitLogsMap = ref<Map<string, readonly HabitLog[]>>(new Map());
  const isLoading = ref(false);

  const createHabitUseCase = new CreateHabitUseCase(container.habitRepo);
  const updateHabitUseCase = new UpdateHabitUseCase(container.habitRepo);
  const checkInHabitUseCase = new CheckInHabitUseCase(container.habitRepo, container.habitLogRepo, container.goalRepo);
  const backfillHabitLogUseCase = new BackfillHabitLogUseCase(container.habitRepo, container.habitLogRepo);
  const toggleFreezeHabitUseCase = new ToggleFreezeHabitUseCase(container.habitRepo, container.habitLogRepo);

  const loadHabits = async (includeArchived = false) => {
    isLoading.value = true;
    try {
      habits.value = await container.habitRepo.findAll(includeArchived);
    } finally {
      isLoading.value = false;
    }
  };

  const loadTodayLogs = async (todayIso: string) => {
    todayLogs.value = await container.habitLogRepo.findAllLogsForDate(todayIso);
  };

  const loadLogsForHabit = async (habitId: string) => {
    const logs = await container.habitLogRepo.findLogsByHabitId(habitId);
    habitLogsMap.value.set(habitId, logs);
  };

  const isHabitCompletedToday = (habitId: string): boolean => {
    const log = todayLogs.value.find(l => l.habitId === habitId);
    return Boolean(log?.isCompleted);
  };

  const isHabitFrozenToday = (habitId: string): boolean => {
    const log = todayLogs.value.find(l => l.habitId === habitId);
    return Boolean(log?.isFrozen);
  };

  const getTodayLogForHabit = (habitId: string): HabitLog | undefined => {
    return todayLogs.value.find(l => l.habitId === habitId);
  };

  const getStreakAnalysis = (habit: Habit, todayIso: string): StreakAnalysisResult => {
    const logs = habitLogsMap.value.get(habit.id) || [];
    return StreakCalculator.calculate(habit, logs, todayIso);
  };

  const createHabit = async (input: CreateHabitInput) => {
    const habit = await createHabitUseCase.execute(input);
    await loadHabits();
    const habitRecord = await db.habits.get(habit.id);
    if (habitRecord) {
      await ReminderCoordinator.getInstance().scheduleHabitReminders(habitRecord);
    }
    return habit;
  };

  const updateHabit = async (input: UpdateHabitInput) => {
    const habit = await updateHabitUseCase.execute(input);
    await loadHabits();
    const habitRecord = await db.habits.get(habit.id);
    if (habitRecord) {
      await ReminderCoordinator.getInstance().scheduleHabitReminders(habitRecord);
    }
    return habit;
  };

  const checkIn = async (input: CheckInHabitInput) => {
    const log = await checkInHabitUseCase.execute(input);
    await loadTodayLogs(input.date);
    await loadLogsForHabit(input.habitId);
    if (log.isCompleted) {
      await ReminderCoordinator.getInstance().onHabitCompletedToday(input.habitId, input.date);
    }
    return log;
  };

  const backfillLog = async (input: BackfillHabitLogInput) => {
    const log = await backfillHabitLogUseCase.execute(input);
    await loadTodayLogs(input.todayIso);
    await loadLogsForHabit(input.habitId);
    return log;
  };

  const toggleFreeze = async (habitId: string, date: string) => {
    const log = await toggleFreezeHabitUseCase.execute(habitId, date);
    await loadTodayLogs(date);
    await loadLogsForHabit(habitId);
    return log;
  };

  const togglePause = async (habit: Habit) => {
    const updated = habit.togglePaused(new Date().toISOString());
    await container.habitRepo.save(updated);
    await loadHabits();
    const habitRecord = await db.habits.get(habit.id);
    if (habitRecord) {
      await ReminderCoordinator.getInstance().scheduleHabitReminders(habitRecord);
    }
  };

  const updateHabitReminders = async (habitId: string, reminderTimes: string[]) => {
    const habit = habits.value.find(h => h.id === habitId);
    if (!habit) return;
    const nowIso = new Date().toISOString();
    const updated = new Habit({
      id: habit.id,
      title: habit.title,
      icon: habit.icon,
      color: habit.color,
      categoryId: habit.categoryId,
      habitType: habit.habitType,
      recurrence: habit.recurrence,
      dailyTarget: habit.dailyTarget,
      unit: habit.unit,
      cue: habit.cue,
      linkedGoalId: habit.linkedGoalId,
      reminderTimes,
      startDate: habit.startDate,
      endDate: habit.endDate,
      isPaused: habit.isPaused,
      isArchived: habit.isArchived,
      weeklyFreezeAllowed: habit.weeklyFreezeAllowed,
      createdAt: habit.createdAt,
      updatedAt: nowIso
    });
    await container.habitRepo.save(updated);
    await loadHabits();
    const habitRecord = await db.habits.get(habitId);
    if (habitRecord) {
      await ReminderCoordinator.getInstance().scheduleHabitReminders(habitRecord);
    }
  };

  const deleteHabit = async (habitId: string) => {
    await container.habitRepo.delete(habitId);
    await ReminderCoordinator.getInstance().cancelHabitReminders(habitId);
    await loadHabits();
  };

  return {
    habits,
    todayLogs,
    habitLogsMap,
    isLoading,
    loadHabits,
    loadTodayLogs,
    loadLogsForHabit,
    isHabitCompletedToday,
    isHabitFrozenToday,
    getTodayLogForHabit,
    getStreakAnalysis,
    createHabit,
    updateHabit,
    checkIn,
    backfillLog,
    toggleFreeze,
    togglePause,
    updateHabitReminders,
    deleteHabit
  };
});
