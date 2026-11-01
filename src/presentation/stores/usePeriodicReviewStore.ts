import { defineStore } from 'pinia';
import { ref } from 'vue';
import { PeriodicReview, type PeriodicReviewType } from '@/domain/entities/PeriodicReview';
import { PeriodicReviewService, type PeriodStatsCalculation } from '@/domain/services/PeriodicReviewService';
import { container } from '@/infrastructure/di/container';
import { useHabitStore } from './useHabitStore';
import { useGoalStore } from './useGoalStore';

export const usePeriodicReviewStore = defineStore('periodicReviews', () => {
  const reviews = ref<PeriodicReview[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const habitStore = useHabitStore();
  const goalStore = useGoalStore();

  const loadReviews = async (type?: PeriodicReviewType) => {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await container.periodicReviewRepo.findAll(type);
      reviews.value = [...result];
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'خطا در بارگذاری بازبینی‌های دوره‌ای';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * محاسبه پیش‌فرض آمار و اطلاعات دوره بر اساس نوع دوره و تاریخ هدف
   */
  const computePeriodData = (type: PeriodicReviewType, targetDateIso: string) => {
    const periodInfo = PeriodicReviewService.getPeriodInfo(type, targetDateIso);

    // تجمیع کلیه لاگ‌های ثبت‌شده عادات در حافظه
    const allHabitLogs = Array.from(habitStore.habitLogsMap.values()).flat();

    const stats: PeriodStatsCalculation = PeriodicReviewService.calculatePeriodStats({
      startDateIso: periodInfo.startDateIso,
      endDateIso: periodInfo.endDateIso,
      habits: habitStore.habits,
      habitLogs: allHabitLogs,
      goals: goalStore.goals
    });

    return {
      ...periodInfo,
      ...stats
    };
  };

  /**
   * ذخیره یا به‌روزرسانی بازبینی
   */
  const saveReview = async (params: {
    id?: string;
    type: PeriodicReviewType;
    periodKey: string;
    solarYear: number;
    solarPeriod: number;
    periodLabel: string;
    startDateIso: string;
    endDateIso: string;
    whatWorked: string;
    whatDidntWork: string;
    primaryObstacle: string;
    actionPlan: string;
    adherenceRate: number;
    completedHabitsCount: number;
    totalExpectedHabits: number;
    activeGoalsCount: number;
  }) => {
    isLoading.value = true;
    error.value = null;
    try {
      const reviewId = params.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const review = PeriodicReviewService.createReview({
        ...params,
        id: reviewId
      });

      await container.periodicReviewRepo.save(review);
      const existingIdx = reviews.value.findIndex(r => r.id === review.id);
      if (existingIdx >= 0) {
        reviews.value[existingIdx] = review;
      } else {
        reviews.value.unshift(review);
      }
      return review;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'خطا در ذخیره بازبینی دوره‌ای';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await container.periodicReviewRepo.delete(id);
      reviews.value = reviews.value.filter(r => r.id !== id);
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'خطا در حذف بازبینی';
      throw err;
    }
  };

  return {
    reviews,
    isLoading,
    error,
    loadReviews,
    computePeriodData,
    saveReview,
    deleteReview
  };
});
