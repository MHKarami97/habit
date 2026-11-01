<script setup lang="ts">
import { onMounted, computed } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppButton from '../common/AppButton.vue';
import AppIcon from '../common/AppIcon.vue';
import { useTemplateStore } from '../../stores/useTemplateStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';
import type { GoalTemplateData, HabitTemplateData } from '@/domain/entities/UserTemplate';

const props = defineProps<{
  isOpen: boolean;
  initialType?: 'goal' | 'habit';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-goal', template: GoalTemplateData): void;
  (e: 'select-habit', template: HabitTemplateData): void;
}>();

const templateStore = useTemplateStore();
const { localizeDigits } = usePersianCalendar();

onMounted(async () => {
  await templateStore.loadUserTemplates();
  if (props.initialType) {
    templateStore.activeTab = props.initialType;
  }
});

const currentCategory = computed(() => {
  return templateStore.categories.find(c => c.id === templateStore.selectedCategoryId);
});

const isCurrentCategorySensitive = computed(() => {
  return currentCategory.value?.isSensitive ?? false;
});

const handleSelectGoal = (data: GoalTemplateData) => {
  emit('select-goal', data);
  emit('close');
};

const handleSelectHabit = (data: HabitTemplateData) => {
  emit('select-habit', data);
  emit('close');
};

const handleDeleteUserTemplate = async (id: string, e: Event) => {
  e.stopPropagation();
  if (confirm('آیا از حذف این قالب شخصی اطمینان دارید؟')) {
    await templateStore.deleteUserTemplate(id);
  }
};

const isTemplatesEmpty = computed(() => {
  if (templateStore.activeTab === 'goal') {
    return (
      templateStore.filteredPredefinedGoalTemplates.length === 0 &&
      templateStore.filteredUserTemplates.length === 0
    );
  }
  return (
    templateStore.filteredPredefinedHabitTemplates.length === 0 &&
    templateStore.filteredUserTemplates.length === 0
  );
});
</script>

<template>
  <AppModal
    :is-open="isOpen"
    title="کتابخانه قالب‌های آماده و شخصی"
    @close="$emit('close')"
  >
    <div class="template-picker-container">
      <!-- تب سوئیچ بین اهداف و عادت‌ها -->
      <div class="type-tab-switcher">
        <button
          type="button"
          :class="['type-tab-btn', { 'tab-active': templateStore.activeTab === 'goal' }]"
          @click="templateStore.activeTab = 'goal'"
        >
          <AppIcon name="target" size="16" />
          <span>قالب‌های هدف</span>
        </button>
        <button
          type="button"
          :class="['type-tab-btn', { 'tab-active': templateStore.activeTab === 'habit' }]"
          @click="templateStore.activeTab = 'habit'"
        >
          <AppIcon name="flame" size="16" />
          <span>قالب‌های عادت</span>
        </button>
      </div>

      <!-- نوار جستجو -->
      <div class="search-bar-row">
        <input
          v-model="templateStore.searchQuery"
          type="search"
          placeholder="جستجو در میان قالب‌ها..."
          class="template-search-input"
        />
      </div>

      <!-- فیلتر دسته‌بندی‌ها -->
      <div class="categories-filter-bar">
        <button
          type="button"
          :class="['category-pill', { 'pill-active': templateStore.selectedCategoryId === 'all' }]"
          @click="templateStore.selectedCategoryId = 'all'"
        >
          همه دسته‌ها
        </button>
        <button
          v-for="cat in templateStore.categories"
          :key="cat.id"
          type="button"
          :class="['category-pill', { 'pill-active': templateStore.selectedCategoryId === cat.id }]"
          @click="templateStore.selectedCategoryId = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- یادداشت سلب مسئولیت تخصصی برای دسته‌های حساس (پزشکی و مالی) -->
      <div v-if="isCurrentCategorySensitive" class="sensitive-disclaimer-box">
        <AppIcon name="alert" size="18" class="text-warning" />
        <div class="disclaimer-text">
          {{ currentCategory?.disclaimer }}
        </div>
      </div>

      <!-- محتوای قالب‌ها بر اساس تب انتخابی -->
      <div class="templates-scroll-list">
        <!-- ۱. بخش قالب‌های شخصی کاربر در صورت وجود -->
        <div v-if="templateStore.filteredUserTemplates.length > 0" class="template-group-section">
          <h4 class="group-heading">
            <AppIcon name="settings" size="16" />
            <span>قالب‌های شخصی شما</span>
          </h4>

          <div class="cards-grid">
            <article
              v-for="tmpl in templateStore.filteredUserTemplates"
              :key="tmpl.id"
              class="template-card user-template-card"
            >
              <div class="card-header-row">
                <strong class="card-title">{{ tmpl.title }}</strong>
                <button
                  type="button"
                  class="delete-user-tmpl-btn touch-target"
                  title="حذف قالب"
                  @click="handleDeleteUserTemplate(tmpl.id, $event)"
                >
                  <AppIcon name="trash" size="14" />
                </button>
              </div>

              <p v-if="tmpl.description" class="card-desc">{{ tmpl.description }}</p>

              <div class="card-action-row">
                <AppButton
                  variant="primary"
                  size="sm"
                  @click="
                    tmpl.type === 'goal'
                      ? handleSelectGoal(tmpl.templateData as GoalTemplateData)
                      : handleSelectHabit(tmpl.templateData as HabitTemplateData)
                  "
                >
                  استفاده از این قالب
                </AppButton>
              </div>
            </article>
          </div>
        </div>

        <!-- ۲. بخش قالب‌های پیش‌فرض اهداف -->
        <div
          v-if="templateStore.activeTab === 'goal' && templateStore.filteredPredefinedGoalTemplates.length > 0"
          class="template-group-section"
        >
          <h4 class="group-heading">
            <AppIcon name="target" size="16" />
            <span>قالب‌های آماده اهداف</span>
          </h4>

          <div class="cards-grid">
            <article
              v-for="tmpl in templateStore.filteredPredefinedGoalTemplates"
              :key="tmpl.id"
              class="template-card"
            >
              <div class="card-header-row">
                <strong class="card-title">{{ tmpl.title }}</strong>
                <span class="category-badge">{{ tmpl.unit }}</span>
              </div>

              <p class="card-desc">{{ tmpl.description }}</p>

              <div class="card-why-preview">
                <strong>چرایی:</strong> {{ tmpl.whyStatement }}
              </div>

              <!-- زیرهدف‌های پیشنهادی -->
              <div v-if="tmpl.suggestedMilestones && tmpl.suggestedMilestones.length > 0" class="milestones-preview">
                <span class="milestones-preview-title">زیرهدف‌های پیشنهادی:</span>
                <ul class="milestones-bullets">
                  <li v-for="(ms, idx) in tmpl.suggestedMilestones" :key="idx">
                    {{ ms }}
                  </li>
                </ul>
              </div>

              <div v-if="tmpl.disclaimer" class="card-mini-disclaimer">
                {{ tmpl.disclaimer }}
              </div>

              <div class="card-action-row">
                <span class="duration-tag">
                  مدت پیشنهادی: {{ localizeDigits(tmpl.durationDays) }} روز
                </span>
                <AppButton
                  variant="primary"
                  size="sm"
                  @click="
                    handleSelectGoal({
                      title: tmpl.title,
                      whyStatement: tmpl.whyStatement,
                      priority: tmpl.priority,
                      startValue: tmpl.startValue,
                      targetValue: tmpl.targetValue,
                      unit: tmpl.unit,
                      durationDays: tmpl.durationDays,
                      suggestedMilestones: tmpl.suggestedMilestones,
                      guidance: tmpl.guidance
                    })
                  "
                >
                  استفاده از این قالب
                </AppButton>
              </div>
            </article>
          </div>
        </div>

        <!-- ۳. بخش قالب‌های پیش‌فرض عادت‌ها -->
        <div
          v-if="templateStore.activeTab === 'habit' && templateStore.filteredPredefinedHabitTemplates.length > 0"
          class="template-group-section"
        >
          <h4 class="group-heading">
            <AppIcon name="flame" size="16" />
            <span>قالب‌های آماده عادت‌ها</span>
          </h4>

          <div class="cards-grid">
            <article
              v-for="tmpl in templateStore.filteredPredefinedHabitTemplates"
              :key="tmpl.id"
              class="template-card"
            >
              <div class="card-header-row">
                <strong class="card-title">{{ tmpl.title }}</strong>
                <span class="category-badge">{{ tmpl.dailyTarget }} {{ tmpl.unit }}</span>
              </div>

              <p class="card-desc">{{ tmpl.description }}</p>

              <!-- فرمول محرک و پاداش -->
              <div class="habit-loop-preview">
                <div class="loop-item">
                  <span class="loop-lbl">محرک (Cue):</span>
                  <span class="loop-val">{{ tmpl.cue }}</span>
                </div>
                <div class="loop-item">
                  <span class="loop-lbl">پاداش (Reward):</span>
                  <span class="loop-val">{{ tmpl.reward }}</span>
                </div>
              </div>

              <div v-if="tmpl.disclaimer" class="card-mini-disclaimer">
                {{ tmpl.disclaimer }}
              </div>

              <div class="card-action-row">
                <span class="guidance-tag">{{ tmpl.guidance }}</span>
                <AppButton
                  variant="primary"
                  size="sm"
                  @click="
                    handleSelectHabit({
                      title: tmpl.title,
                      habitType: tmpl.habitType,
                      dailyTarget: tmpl.dailyTarget,
                      unit: tmpl.unit,
                      recurrenceType: tmpl.recurrenceType,
                      recurrenceRuleJson: tmpl.recurrenceRuleJson,
                      cue: tmpl.cue,
                      routine: tmpl.routine,
                      reward: tmpl.reward,
                      guidance: tmpl.guidance
                    })
                  "
                >
                  استفاده از این قالب
                </AppButton>
              </div>
            </article>
          </div>
        </div>

        <!-- حالت خالی -->
        <div
          v-if="isTemplatesEmpty"
          class="empty-templates-hint"
        >
          قالبی مطابق با فیلتر انتخابی شما یافت نشد.
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
.template-picker-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 75vh;
}

.type-tab-switcher {
  display: flex;
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 3px;
}

.type-tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  min-height: 38px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
}

.tab-active {
  background-color: var(--color-bg-surface);
  color: var(--color-accent);
  font-weight: 700;
  box-shadow: var(--shadow-xs);
}

.template-search-input {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}
.template-search-input:focus {
  border-color: var(--color-accent);
  background-color: var(--color-bg-surface);
}

.categories-filter-bar {
  display: flex;
  gap: var(--spacing-xxs);
  overflow-x: auto;
  padding-bottom: 2px;
}

.category-pill {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.pill-active {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

.sensitive-disclaimer-box {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  background-color: var(--color-warning-subtle);
  border: var(--border-width-hairline) solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 11px;
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
}

.templates-scroll-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
  padding-inline-end: 2px;
}

.template-group-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.group-heading {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xs);
}

.template-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  transition: all var(--transition-fast);
}

.template-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-xs);
}

.user-template-card {
  border-color: var(--color-accent-subtle);
  background-color: var(--color-bg-surface-soft);
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.card-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.category-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-secondary);
}

.delete-user-tmpl-btn {
  background: transparent;
  color: var(--color-text-muted);
  padding: 4px;
  border-radius: var(--radius-sm);
}
.delete-user-tmpl-btn:hover {
  color: var(--color-danger);
  background-color: var(--color-danger-subtle);
}

.card-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.card-why-preview {
  font-size: 11px;
  color: var(--color-text-muted);
  background-color: var(--color-bg-surface-soft);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
}

.milestones-preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background-color: var(--color-bg-surface-soft);
  padding: 6px var(--spacing-sm);
  border-radius: var(--radius-xs);
}

.milestones-preview-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.milestones-bullets {
  margin: 0;
  padding-inline-start: var(--spacing-md);
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.habit-loop-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  background-color: var(--color-bg-surface-soft);
  padding: 6px var(--spacing-sm);
  border-radius: var(--radius-xs);
  font-size: 11px;
}

.loop-item {
  display: flex;
  gap: var(--spacing-xs);
}

.loop-lbl {
  font-weight: 700;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.loop-val {
  color: var(--color-text-muted);
}

.card-mini-disclaimer {
  font-size: 10px;
  color: var(--color-warning);
  line-height: 1.4;
  border-top: 1px dashed var(--color-border-subtle);
  padding-top: 4px;
}

.card-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
  margin-top: 2px;
}

.duration-tag, .guidance-tag {
  font-size: 11px;
  color: var(--color-text-muted);
}

.empty-templates-hint {
  text-align: center;
  padding: var(--spacing-lg);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
