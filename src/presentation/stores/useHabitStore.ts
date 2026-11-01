import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Habit } from '@/domain/entities/Habit';
import { HabitLog } from '@/domain/entities/HabitLog';
import { StreakCalculator, StreakAnalysisResult } from '@/domain/services/StreakCalculator';
import { container } from '@/infrastructure/di/container';
import { CreateHabitUseCase, CreateHabitInput } from '@/application/use-cases/habits/CreateHabitUseCase';
import { CheckInHabitUseCase, CheckInHabitInput } from '@/application/use-cases/habits/CheckInHabitUseCase';
import { BackfillHabitLogUseCase, BackfillHabitLogInput } from '@/application/use-cases/habits/BackfillHabitLogUseCase';
import { ToggleFreezeHabitUseCase } from '@/application/use-cases/habits/ToggleFreezeHabitUseCase';

export const useHabitStore = defineStore('habits', () => {
  const habits = ref<readonly Habit[]>([]);
  const todayLogs = ref<readonly HabitLog[]>([]);
  const habitLogsMap = ref<Map<string, readonly HabitLog[]>>(new Map());
  const isLoading = ref(false);

  const createHabitUseCase = new CreateHabitUseCase(container.habitRepo);
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
    return habit;
  };

  const checkIn = async (input: CheckInHabitInput) => {
    const log = await checkInHabitUseCase.execute(input);
    await loadTodayLogs(input.date);
    await loadLogsForHabit(input.habitId);
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
  };

  const deleteHabit = async (habitId: string) => {
    await container.habitRepo.delete(habitId);
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
    checkIn,
    backfillLog,
    toggleFreeze,
    togglePause,
    deleteHabit
  };
});
