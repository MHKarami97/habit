import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ReminderCoordinator } from '@/application/reminders/ReminderCoordinator';
import type { DueInAppAlert } from '@/application/reminders/strategies/InAppReminderScheduler';
import { IcsExportScheduler } from '@/application/reminders/strategies/IcsExportScheduler';
import type { HabitRecord, GoalRecord } from '@/infrastructure/db/AppDatabase';

export const useReminderStore = defineStore('reminders', () => {
  const coordinator = ReminderCoordinator.getInstance();
  const dueAlerts = ref<DueInAppAlert[]>([]);
  const capabilities = ref(coordinator.getCapabilities());
  const preferredScheduler = ref(coordinator.getPreferredSchedulerType());

  // اشتراک روی هشدارهای درون‌برنامه
  coordinator.inAppScheduler.subscribe(alerts => {
    dueAlerts.value = [...alerts];
  });

  const refreshCapabilities = () => {
    capabilities.value = coordinator.getCapabilities();
    preferredScheduler.value = coordinator.getPreferredSchedulerType();
  };

  const evaluateTodayAlerts = async (todayIso: string, currentMinutes: number) => {
    const alerts = await coordinator.checkDueRemindersToday(todayIso, currentMinutes);
    dueAlerts.value = [...alerts];
    return alerts;
  };

  const dismissAlert = (alertId: string) => {
    dueAlerts.value = dueAlerts.value.filter(a => a.id !== alertId);
  };

  const downloadHabitIcs = (habit: HabitRecord) => {
    const { icsContent, limitationNotice } = coordinator.generateHabitIcs(habit);
    IcsExportScheduler.downloadIcsFile(`kavosh-habit-${habit.id}.ics`, icsContent);
    return limitationNotice;
  };

  const downloadGoalDeadlineIcs = (goal: GoalRecord) => {
    const icsContent = coordinator.generateGoalDeadlineIcs(goal);
    IcsExportScheduler.downloadIcsFile(`kavosh-goal-${goal.id}.ics`, icsContent);
  };

  const syncHabitReminders = async (habit: HabitRecord, endOfDayHour = 0) => {
    return await coordinator.scheduleHabitReminders(habit, endOfDayHour);
  };

  const cancelHabitReminders = async (habitId: string) => {
    await coordinator.cancelHabitReminders(habitId);
  };

  return {
    dueAlerts,
    capabilities,
    preferredScheduler,
    refreshCapabilities,
    evaluateTodayAlerts,
    dismissAlert,
    downloadHabitIcs,
    downloadGoalDeadlineIcs,
    syncHabitReminders,
    cancelHabitReminders
  };
});
