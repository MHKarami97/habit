import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { container } from '@/infrastructure/di/container';
import {
  UserTemplate,
  type GoalTemplateData,
  type HabitTemplateData
} from '@/domain/entities/UserTemplate';
import { Goal } from '@/domain/entities/Goal';
import { Habit } from '@/domain/entities/Habit';
import {
  PREDEFINED_GOAL_TEMPLATES,
  type PredefinedGoalTemplate
} from '@/data/templates/goalTemplates';
import {
  PREDEFINED_HABIT_TEMPLATES,
  type PredefinedHabitTemplate
} from '@/data/templates/habitTemplates';
import {
  TEMPLATE_CATEGORIES,
  type TemplateCategory
} from '@/data/templates/categories';

export const useTemplateStore = defineStore('templates', () => {
  const userTemplates = ref<readonly UserTemplate[]>([]);
  const selectedCategoryId = ref<string>('all');
  const searchQuery = ref<string>('');
  const activeTab = ref<'goal' | 'habit'>('goal');
  const isLoading = ref(false);

  const categories = computed<readonly TemplateCategory[]>(() => TEMPLATE_CATEGORIES);

  const loadUserTemplates = async () => {
    isLoading.value = true;
    try {
      userTemplates.value = await container.userTemplateRepo.findAll();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * فیلتر قالب‌های آماده اهداف بر اساس دسته‌بندی و عبارت جستجو
   */
  const filteredPredefinedGoalTemplates = computed<readonly PredefinedGoalTemplate[]>(() => {
    return PREDEFINED_GOAL_TEMPLATES.filter(tmpl => {
      if (selectedCategoryId.value !== 'all' && tmpl.categoryId !== selectedCategoryId.value) {
        return false;
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase();
        return (
          tmpl.title.toLowerCase().includes(q) ||
          tmpl.description.toLowerCase().includes(q) ||
          tmpl.whyStatement.toLowerCase().includes(q)
        );
      }
      return true;
    });
  });

  /**
   * فیلتر قالب‌های آماده عادت‌ها بر اساس دسته‌بندی و عبارت جستجو
   */
  const filteredPredefinedHabitTemplates = computed<readonly PredefinedHabitTemplate[]>(() => {
    return PREDEFINED_HABIT_TEMPLATES.filter(tmpl => {
      if (selectedCategoryId.value !== 'all' && tmpl.categoryId !== selectedCategoryId.value) {
        return false;
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase();
        return (
          tmpl.title.toLowerCase().includes(q) ||
          tmpl.description.toLowerCase().includes(q) ||
          tmpl.cue.toLowerCase().includes(q)
        );
      }
      return true;
    });
  });

  /**
   * فیلتر قالب‌های شخصی کاربر
   */
  const filteredUserTemplates = computed<readonly UserTemplate[]>(() => {
    return userTemplates.value.filter(tmpl => {
      if (tmpl.type !== activeTab.value) {
        return false;
      }
      if (
        selectedCategoryId.value !== 'all' &&
        selectedCategoryId.value !== 'personal' &&
        tmpl.categoryId !== selectedCategoryId.value
      ) {
        return false;
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase();
        return (
          tmpl.title.toLowerCase().includes(q) ||
          (tmpl.description && tmpl.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  });

  /**
   * ذخیره هدف فعلی کاربر به عنوان قالب شخصی
   */
  const saveGoalAsTemplate = async (
    goal: Goal,
    customTitle?: string,
    description?: string
  ): Promise<UserTemplate> => {
    const nowIso = new Date().toISOString();
    const id = `tmpl_goal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const templateData: GoalTemplateData = {
      title: customTitle?.trim() || goal.title,
      whyStatement: goal.whyStatement,
      priority: goal.priority,
      startValue: goal.metric.startValue,
      targetValue: goal.metric.targetValue,
      unit: goal.metric.unit,
      guidance: 'قالب ذخیره‌شده از روی هدف شخصی کاربر'
    };

    const userTmpl = new UserTemplate({
      id,
      type: 'goal',
      title: customTitle?.trim() || goal.title,
      description: description?.trim() || `الگوی ساخته‌شده بر اساس هدف «${goal.title}»`,
      categoryId: goal.categoryId || 'personal',
      templateData,
      createdAt: nowIso,
      updatedAt: nowIso
    });

    await container.userTemplateRepo.save(userTmpl);
    await loadUserTemplates();
    return userTmpl;
  };

  /**
   * ذخیره عادت فعلی کاربر به عنوان قالب شخصی
   */
  const saveHabitAsTemplate = async (
    habit: Habit,
    customTitle?: string,
    description?: string
  ): Promise<UserTemplate> => {
    const nowIso = new Date().toISOString();
    const id = `tmpl_habit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const templateData: HabitTemplateData = {
      title: customTitle?.trim() || habit.title,
      habitType: habit.habitType,
      dailyTarget: habit.dailyTarget,
      unit: habit.unit,
      recurrenceType: habit.recurrence.type,
      recurrenceRuleJson: JSON.stringify(habit.recurrence),
      cue: habit.cue || '',
      guidance: 'قالب ذخیره‌شده از روی عادت شخصی کاربر'
    };

    const userTmpl = new UserTemplate({
      id,
      type: 'habit',
      title: customTitle?.trim() || habit.title,
      description: description?.trim() || `الگوی ساخته‌شده بر اساس عادت «${habit.title}»`,
      categoryId: habit.categoryId || 'personal',
      templateData,
      createdAt: nowIso,
      updatedAt: nowIso
    });

    await container.userTemplateRepo.save(userTmpl);
    await loadUserTemplates();
    return userTmpl;
  };

  /**
   * حذف یک قالب شخصی
   */
  const deleteUserTemplate = async (templateId: string): Promise<void> => {
    await container.userTemplateRepo.delete(templateId);
    await loadUserTemplates();
  };

  return {
    userTemplates,
    categories,
    selectedCategoryId,
    searchQuery,
    activeTab,
    isLoading,
    loadUserTemplates,
    filteredPredefinedGoalTemplates,
    filteredPredefinedHabitTemplates,
    filteredUserTemplates,
    saveGoalAsTemplate,
    saveHabitAsTemplate,
    deleteUserTemplate
  };
});
