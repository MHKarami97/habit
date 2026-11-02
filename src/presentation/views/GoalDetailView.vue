<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GoalStatus, getGoalStatusLabel } from '@/domain/value-objects/GoalStatus';
import { GoalStateMachine } from '@/domain/state-machine/GoalStateMachine';
import { Goal } from '@/domain/entities/Goal';
import { Milestone } from '@/domain/entities/Milestone';
import { ActionLog } from '@/domain/entities/ActionLog';
import { ObstacleLog, getObstacleCategoryLabel } from '@/domain/entities/ObstacleLog';
import { db } from '@/infrastructure/db/AppDatabase';
import AppButton from '../components/common/AppButton.vue';
import AppProgressBar from '../components/common/AppProgressBar.vue';
import AppIcon from '../components/common/AppIcon.vue';
import ActionLogModal from '../components/goals/ActionLogModal.vue';
import ObstacleLogModal from '../components/goals/ObstacleLogModal.vue';
import GoalDependencyModal from '../components/goals/GoalDependencyModal.vue';
import GoalFormModal from '../components/goals/GoalFormModal.vue';

import { useGoalStore } from '../stores/useGoalStore';
import { useReminderStore } from '../stores/useReminderStore';
import { useTemplateStore } from '../stores/useTemplateStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';

const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const reminderStore = useReminderStore();
const templateStore = useTemplateStore();
const saveTemplateSuccess = ref(false);
const { formatShortDate, localizeDigits } = usePersianCalendar();

const goalId = computed(() => String(route.params.id));
const goal = computed(() => goalStore.goals.find(g => g.id === goalId.value));

const isActionModalOpen = ref(false);
const isObstacleModalOpen = ref(false);
const isDependencyModalOpen = ref(false);
const isAddChildModalOpen = ref(false);
const isEditModalOpen = ref(false);
const selectedActionToEdit = ref<ActionLog | null>(null);
const selectedObstacleToEdit = ref<ObstacleLog | null>(null);
const newMilestoneTitle = ref('');
const statusError = ref('');

const openCreateActionModal = () => {
  selectedActionToEdit.value = null;
  isActionModalOpen.value = true;
};

const handleEditAction = (action: ActionLog) => {
  selectedActionToEdit.value = action;
  isActionModalOpen.value = true;
};

const handleDeleteAction = async (action: ActionLog) => {
  if (confirm(`آیا از حذف اقدام «${action.description}» مطمئن هستید؟`)) {
    await goalStore.deleteActionLog(action.id, goalId.value);
  }
};

const openCreateObstacleModal = () => {
  selectedObstacleToEdit.value = null;
  isObstacleModalOpen.value = true;
};

const handleEditObstacle = (obstacle: ObstacleLog) => {
  selectedObstacleToEdit.value = obstacle;
  isObstacleModalOpen.value = true;
};

const handleDeleteObstacle = async (obstacle: ObstacleLog) => {
  if (confirm('آیا از حذف این مانع و برنامه اگر-آنگاه آن مطمئن هستید؟')) {
    await goalStore.deleteObstacleLog(obstacle.id, goalId.value);
  }
};

const parentGoal = computed(() => {
  return goalStore.getGoalParent(goalId.value);
});

const childrenGoals = computed(() => {
  return goalStore.getGoalChildren(goalId.value);
});

const hasChildren = computed(() => childrenGoals.value.length > 0);

const effectiveProgress = computed(() => {
  return goalStore.getGoalEffectiveProgress(goalId.value);
});

const prerequisiteGoals = computed<Goal[]>(() => {
  if (!goal.value) return [];
  return goal.value.blockedByGoalIds
    .map(id => goalStore.goals.find(g => g.id === id))
    .filter((g): g is Goal => !!g);
});

const uncompletedPrerequisites = computed(() => {
  return prerequisiteGoals.value.filter(g => g.status !== 'completed');
});

const isBlocked = computed(() => uncompletedPrerequisites.value.length > 0);

onMounted(async () => {
  if (goalStore.goals.length === 0) {
    await goalStore.loadGoals();
  }
  await goalStore.loadGoalDetails(goalId.value);
});

const allowedNextStatuses = computed(() => {
  if (!goal.value) return [];
  return GoalStateMachine.getAllowedNextStatuses(goal.value.status);
});

const handleStatusChange = async (targetStatus: GoalStatus) => {
  statusError.value = '';
  try {
    await goalStore.transitionStatus(goalId.value, targetStatus);
  } catch (err: any) {
    statusError.value = err?.message || 'انتقال وضعیت نامعتبر است';
  }
};

const handleAddMilestone = async () => {
  if (!newMilestoneTitle.value.trim() || !goal.value) return;
  const m = new Milestone({
    id: `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    goalId: goal.value.id,
    title: newMilestoneTitle.value.trim(),
    isCompleted: false,
    sortOrder: goalStore.currentGoalMilestones.length
  });
  await goalStore.addMilestone(m);
  newMilestoneTitle.value = '';
};

const handleExportDeadlineIcs = async () => {
  if (!goal.value) return;
  const goalRecord = await db.goals.get(goal.value.id);
  if (goalRecord) {
    reminderStore.downloadGoalDeadlineIcs(goalRecord);
  }
};

const handleDuplicate = async () => {
  if (!goal.value) return;
  const dup = await goalStore.duplicateGoal(goal.value.id);
  router.push(`/goals/${dup.id}`);
};

const handleSaveAsTemplate = async () => {
  if (!goal.value) return;
  await templateStore.saveGoalAsTemplate(goal.value);
  saveTemplateSuccess.value = true;
  setTimeout(() => {
    saveTemplateSuccess.value = false;
  }, 2500);
};

const handleDelete = async () => {
  if (!goal.value) return;
  if (confirm(`آیا از حذف کامل هدف «${goal.value.title}» و تمام لاگ‌های آن مطمئن هستید؟`)) {
    await goalStore.deleteGoal(goal.value.id);
    router.push('/goals');
  }
};
</script>

<template>
  <div v-if="goal" class="goal-detail-container">
    <!-- هدر و دکمه بازگشت -->
    <div class="top-nav-bar">
      <RouterLink to="/goals" class="back-link">
        <AppIcon name="chevron-right" size="20" />
        بازگشت به اهداف
      </RouterLink>

      <div class="header-actions">
        <AppButton variant="primary" size="sm" @click="isEditModalOpen = true">
          <AppIcon name="edit" size="16" />
          ویرایش هدف
        </AppButton>
        <AppButton variant="outline" size="sm" @click="handleExportDeadlineIcs">
          <AppIcon name="clock" size="16" />
          تقویم مهلت (.ics)
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="handleSaveAsTemplate">
          <AppIcon name="settings" size="16" />
          {{ saveTemplateSuccess ? 'قالب ذخیره شد!' : 'ذخیره به عنوان قالب' }}
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="handleDuplicate">
          تکثیر هدف
        </AppButton>
        <AppButton variant="ghost" size="sm" @click="handleDelete">
          <AppIcon name="trash" size="16" />
        </AppButton>
      </div>
    </div>

    <!-- بنر ارجاع به هدف والد (در صورت وجود) -->
    <div v-if="parentGoal" class="parent-goal-banner">
      <div class="parent-banner-content">
        <AppIcon name="target" size="18" class="text-accent" />
        <span class="parent-desc-lbl">این هدف زیرمجموعه‌ای از:</span>
        <RouterLink :to="`/goals/${parentGoal.id}`" class="parent-link">
          <strong class="parent-title">{{ parentGoal.title }}</strong>
          <span class="parent-lvl-badge">({{ parentGoal.hierarchyLevelLabel }})</span>
          <AppIcon name="chevron-left" size="14" />
        </RouterLink>
      </div>
      <span v-if="goal.weight && goal.weight > 1" class="parent-weight-info">
        وزن در والد: {{ localizeDigits(goal.weight) }}
      </span>
    </div>

    <!-- کارت اطلاعات کلی هدف -->
    <article class="detail-overview-card">
      <header class="detail-header">
        <div class="title-and-badges">
          <span :class="['level-badge-tag', `lvl-${goal.hierarchyLevel}`]">
            {{ goal.hierarchyLevelLabel }}
          </span>
          <h2 class="detail-title">{{ goal.title }}</h2>
        </div>

        <div class="header-status-group">
          <span v-if="isBlocked" class="blocked-badge" title="دارای پیش‌نیاز تکمیل‌نشده">
            <AppIcon name="lock" size="14" />
            مسدود ({{ localizeDigits(uncompletedPrerequisites.length) }} پیش‌نیاز)
          </span>
          <span class="detail-status-pill">
            {{ getGoalStatusLabel(goal.status) }}
          </span>
        </div>
      </header>

      <p class="why-box">
        <strong>چرایی و انگیزه اصلی:</strong> {{ goal.whyStatement }}
      </p>

      <div class="dates-meta-row">
        <span>مهلت پایانی: {{ formatShortDate(goal.deadline) }}</span>
        <span>مدت سپری‌شده: {{ localizeDigits(goal.durationInDays) }} روز</span>
      </div>

      <!-- سنجه موفقیت و درصد -->
      <div class="metric-progress-box">
        <div class="metric-numbers-row">
          <span v-if="hasChildren">
            پیشرفت کلی: <strong>میانگین وزنی {{ localizeDigits(childrenGoals.length) }} هدف فرزند</strong>
          </span>
          <span v-else>
            سنجه فعلی: <strong>{{ localizeDigits(goal.metric.currentValue) }}</strong> / {{ localizeDigits(goal.metric.targetValue) }} {{ goal.metric.unit }}
          </span>
          <span class="metric-percent-label">
            {{ localizeDigits(effectiveProgress) }}٪ پیشرفت
          </span>
        </div>
        <AppProgressBar :percentage="effectiveProgress" :height="10" />
      </div>

      <!-- انتقال وضعیت با ماشین وضعیت و راهنمای قوانین -->
      <div class="status-transitions-box">
        <div class="transition-header-row">
          <span class="transition-label">تغییر وضعیت مجاز:</span>
          <span class="rules-tip-lbl">(طبق قوانین ماشین وضعیت و سلسله‌مراتب)</span>
        </div>

        <p v-if="statusError" class="status-error-text">
          <AppIcon name="alert" size="14" />
          <span>{{ statusError }}</span>
        </p>

        <div class="status-buttons-row">
          <button
            v-for="st in allowedNextStatuses"
            :key="st"
            type="button"
            class="transition-btn touch-target"
            @click="handleStatusChange(st)"
          >
            تغییر به «{{ getGoalStatusLabel(st) }}»
          </button>
        </div>
      </div>
    </article>

    <!-- بخش زیرمجموعه‌ها و فرزندان (سلسله‌مراتب) -->
    <section v-if="goal.canHaveChildren" class="sub-section">
      <div class="section-header-row">
        <div>
          <h3 class="section-heading">اهداف فرزند (سطح {{ localizeDigits(goal.hierarchyLevel + 1) }})</h3>
          <p class="section-sub-desc">پیشرفت این هدف بر اساس مجموع وزنی این فرزندان محاسبه می‌شود.</p>
        </div>
        <AppButton variant="primary" size="sm" @click="isAddChildModalOpen = true">
          <AppIcon name="plus" size="16" />
          افزودن فرزند
        </AppButton>
      </div>

      <div v-if="childrenGoals.length > 0" class="children-grid">
        <RouterLink
          v-for="child in childrenGoals"
          :key="child.id"
          :to="`/goals/${child.id}`"
          class="child-card-link"
        >
          <div class="child-card-header">
            <strong class="child-title">{{ child.title }}</strong>
            <span :class="['child-status-badge', `status-${child.status}`]">
              {{ getGoalStatusLabel(child.status) }}
            </span>
          </div>

          <div class="child-meta-row">
            <span class="child-weight-tag">وزن: {{ localizeDigits(child.weight) }}</span>
            <span class="child-progress-tag">
              پیشرفت: {{ localizeDigits(goalStore.getGoalEffectiveProgress(child.id)) }}٪
            </span>
          </div>
          <AppProgressBar :percentage="goalStore.getGoalEffectiveProgress(child.id)" :height="6" />
        </RouterLink>
      </div>
      <p v-else class="empty-hint">هنوز هیچ هدف فرزندی برای این هدف تعریف نشده است.</p>
    </section>

    <!-- بخش پیش‌نیازها و وابستگی‌ها -->
    <section class="sub-section">
      <div class="section-header-row">
        <div>
          <h3 class="section-heading">پیش‌نیازها و وابستگی‌ها</h3>
          <p class="section-sub-desc">اهدافی که باید قبل از آغاز و فعال شدن این هدف تکمیل شوند.</p>
        </div>
        <AppButton variant="secondary" size="sm" @click="isDependencyModalOpen = true">
          <AppIcon name="lock" size="16" />
          مدیریت وابستگی‌ها
        </AppButton>
      </div>

      <div v-if="prerequisiteGoals.length > 0" class="prereqs-detail-list">
        <div
          v-for="prereq in prerequisiteGoals"
          :key="prereq.id"
          class="prereq-item-card"
        >
          <div class="prereq-status-icon">
            <AppIcon v-if="prereq.status === 'completed'" name="check" size="16" class="text-success" />
            <AppIcon v-else name="lock" size="16" class="text-warning" />
          </div>
          <div class="prereq-item-info">
            <RouterLink :to="`/goals/${prereq.id}`" class="prereq-item-link">
              {{ prereq.title }}
            </RouterLink>
            <span class="prereq-state-note">
              {{ prereq.status === 'completed' ? 'تکمیل‌شده (مانع برطرف شد)' : 'در حال انجام / پیش‌نویس (مانع فعال)' }}
            </span>
          </div>
          <span :class="['child-status-badge', `status-${prereq.status}`]">
            {{ getGoalStatusLabel(prereq.status) }}
          </span>
        </div>
      </div>
      <p v-else class="empty-hint">هیچ پیش‌نیازی برای این هدف تعیین نشده است (شروع آزاد).</p>
    </section>

    <!-- بخش زیرهدف‌ها / مایلستون‌ها -->
    <section class="sub-section">
      <h3 class="section-heading">زیرهدف‌ها و نقاط عطف (Milestones)</h3>
      <div class="milestones-list">
        <div
          v-for="ms in goalStore.currentGoalMilestones"
          :key="ms.id"
          class="milestone-item"
        >
          <button
            type="button"
            :class="['ms-checkbox touch-target', { 'ms-done': ms.isCompleted }]"
            @click="goalStore.toggleMilestone(ms)"
          >
            <AppIcon v-if="ms.isCompleted" name="check" size="16" />
          </button>
          <span :class="['ms-title', { 'text-strike': ms.isCompleted }]">
            {{ ms.title }}
          </span>
        </div>

        <form class="add-milestone-form" @submit.prevent="handleAddMilestone">
          <input
            v-model="newMilestoneTitle"
            placeholder="افزودن زیرهدف جدید..."
            class="milestone-input"
          />
          <AppButton variant="secondary" size="sm" type="submit">
            افزودن
          </AppButton>
        </form>
      </div>
    </section>

    <!-- بخش لاگ اقدامات انجام‌شده (Action Log) -->
    <section class="sub-section">
      <div class="section-header-row">
        <h3 class="section-heading">قدم‌های برداشته‌شده (Action Log)</h3>
        <AppButton variant="primary" size="sm" @click="openCreateActionModal">
          <AppIcon name="plus" size="16" />
          ثبت اقدام جدید
        </AppButton>
      </div>

      <div v-if="goalStore.currentGoalActionLogs.length > 0" class="actions-list">
        <article
          v-for="act in goalStore.currentGoalActionLogs"
          :key="act.id"
          class="action-item-card"
        >
          <div class="action-top-row">
            <div class="action-meta-left">
              <span class="action-date">{{ formatShortDate(act.date) }}</span>
              <span class="action-duration">{{ localizeDigits(act.durationMinutes) }} دقیقه</span>
              <span v-if="act.progressDelta > 0" class="action-delta">
                {{ localizeDigits(act.progressDelta) }}+ سنجه
              </span>
            </div>

            <div class="card-item-actions">
              <button
                type="button"
                class="item-icon-btn touch-target"
                title="ویرایش اقدام"
                @click="handleEditAction(act)"
              >
                <AppIcon name="edit" size="14" />
              </button>
              <button
                type="button"
                class="item-icon-btn text-danger touch-target"
                title="حذف اقدام"
                @click="handleDeleteAction(act)"
              >
                <AppIcon name="trash" size="14" />
              </button>
            </div>
          </div>
          <p class="action-desc">{{ act.description }}</p>
          <div v-if="act.nextStep" class="next-step-box">
            <strong>قدم بعدی:</strong> {{ act.nextStep }}
          </div>
        </article>
      </div>
      <p v-else class="empty-hint">هنوز هیچ اقدامی برای این هدف ثبت نشده است.</p>
    </section>

    <!-- بخش موانع و برنامه‌های اگر-آنگاه -->
    <section class="sub-section">
      <div class="section-header-row">
        <h3 class="section-heading">موانع و برنامه‌های اگر-آنگاه</h3>
        <AppButton variant="secondary" size="sm" @click="openCreateObstacleModal">
          <AppIcon name="plus" size="16" />
          ثبت مانع
        </AppButton>
      </div>

      <div v-if="goalStore.currentGoalObstacleLogs.length > 0" class="obstacles-list">
        <article
          v-for="obs in goalStore.currentGoalObstacleLogs"
          :key="obs.id"
          class="obstacle-item-card"
        >
          <div class="obs-top-row">
            <div class="obs-meta-left">
              <span class="obs-category-badge">
                {{ getObstacleCategoryLabel(obs.category, obs.customCategory) }}
              </span>
              <span class="obs-date">{{ formatShortDate(obs.date) }}</span>
            </div>

            <div class="card-item-actions">
              <button
                type="button"
                class="item-icon-btn touch-target"
                title="ویرایش مانع"
                @click="handleEditObstacle(obs)"
              >
                <AppIcon name="edit" size="14" />
              </button>
              <button
                type="button"
                class="item-icon-btn text-danger touch-target"
                title="حذف مانع"
                @click="handleDeleteObstacle(obs)"
              >
                <AppIcon name="trash" size="14" />
              </button>
            </div>
          </div>
          <p v-if="obs.note" class="obs-note">{{ obs.note }}</p>
          <div class="if-then-box">
            <strong>برنامه اگر-آنگاه:</strong> {{ obs.ifThenPlan }}
          </div>
        </article>
      </div>
      <p v-else class="empty-hint">هیچ مانعی گزارش نشده است.</p>
    </section>

    <!-- مودال‌ها -->
    <ActionLogModal
      :is-open="isActionModalOpen"
      :goal-id="goal.id"
      :initial-action="selectedActionToEdit"
      @close="isActionModalOpen = false; selectedActionToEdit = null"
    />
    <ObstacleLogModal
      :is-open="isObstacleModalOpen"
      :goal-id="goal.id"
      :initial-obstacle="selectedObstacleToEdit"
      @close="isObstacleModalOpen = false; selectedObstacleToEdit = null"
    />
    <GoalDependencyModal
      :is-open="isDependencyModalOpen"
      :goal-id="goal.id"
      @close="isDependencyModalOpen = false"
    />
    <GoalFormModal
      :is-open="isAddChildModalOpen"
      :initial-parent-id="goal.id"
      @close="isAddChildModalOpen = false"
    />
    <GoalFormModal
      :is-open="isEditModalOpen"
      :initial-goal="goal"
      @close="isEditModalOpen = false"
    />
  </div>
</template>

<style scoped>
.goal-detail-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: clip;
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xxs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
  flex-shrink: 0;
}
.back-link:hover {
  color: var(--color-accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.detail-overview-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.detail-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-text-primary);
}

.detail-status-pill {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.parent-goal-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-xs);
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.parent-banner-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.parent-desc-lbl {
  color: var(--color-text-muted);
}

.parent-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-accent);
  font-weight: 600;
}

.parent-title {
  color: var(--color-accent);
}

.parent-lvl-badge {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.parent-weight-info {
  color: var(--color-text-muted);
  font-size: 11px;
}

.title-and-badges {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.level-badge-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.lvl-1 {
  background-color: var(--color-info-subtle);
  color: var(--color-info);
}
.lvl-2 {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}
.lvl-3 {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-primary);
}

.header-status-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.blocked-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.why-box {
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.dates-meta-row {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.metric-progress-box {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  padding-top: var(--spacing-xs);
}

.metric-numbers-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.metric-percent-label {
  font-weight: 700;
  color: var(--color-accent);
}

.status-transitions-box {
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
  padding-top: var(--spacing-xs);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.transition-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

.status-error-text {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.status-buttons-row {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.transition-btn {
  padding: 6px 12px;
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  transition: all var(--transition-fast);
}
.transition-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.transition-header-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.rules-tip-lbl {
  font-size: 11px;
  color: var(--color-text-muted);
}

.section-sub-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin-top: 2px;
}

.children-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xs);
}

@media (min-width: 640px) {
  .children-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.child-card-link {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  transition: all var(--transition-fast);
}

.child-card-link:hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-bg-surface-soft);
}

.child-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.child-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.child-status-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.child-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-muted);
}

.prereqs-detail-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.prereq-item-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.prereq-status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.prereq-item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
}

.prereq-item-link {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.prereq-item-link:hover {
  color: var(--color-accent);
}

.prereq-state-note {
  font-size: 11px;
  color: var(--color-text-muted);
}

.sub-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-heading {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.milestone-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.ms-checkbox {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-xs);
  border: var(--border-width-regular) solid var(--color-border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}
.ms-checkbox.ms-done {
  background-color: var(--color-success);
  border-color: var(--color-success);
}

.ms-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}
.text-strike {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.add-milestone-form {
  display: flex;
  gap: var(--spacing-xs);
}

.milestone-input {
  flex: 1;
  padding: 0 var(--spacing-md);
  min-height: 40px;
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.actions-list, .obstacles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.action-item-card, .obstacle-item-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.action-top-row, .obs-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  gap: var(--spacing-xs);
}

.action-meta-left, .obs-meta-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.action-delta {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.card-item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.item-icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.item-icon-btn:hover {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-primary);
}

.item-icon-btn.text-danger:hover {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}

.action-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.next-step-box {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-xs);
}

.obs-category-badge {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
  font-weight: 600;
}

.obs-note {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.if-then-box {
  background-color: var(--color-bg-surface-soft);
  border-right: 3px solid var(--color-accent);
  padding: 6px var(--spacing-sm);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.empty-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .top-nav-bar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .detail-overview-card {
    padding: var(--spacing-md);
  }
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  .section-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  .dates-meta-row {
    flex-direction: column;
    gap: var(--spacing-xxs);
  }
  .metric-numbers-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .prereq-item-card {
    flex-wrap: wrap;
  }
}
</style>
