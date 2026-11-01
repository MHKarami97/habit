<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGoalStore } from '../stores/useGoalStore';
import { useReminderStore } from '../stores/useReminderStore';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import { GoalStatus, getGoalStatusLabel } from '@/domain/value-objects/GoalStatus';
import { GoalStateMachine } from '@/domain/state-machine/GoalStateMachine';
import { Milestone } from '@/domain/entities/Milestone';
import { getObstacleCategoryLabel } from '@/domain/entities/ObstacleLog';
import { db } from '@/infrastructure/db/AppDatabase';
import AppButton from '../components/common/AppButton.vue';
import AppProgressBar from '../components/common/AppProgressBar.vue';
import AppIcon from '../components/common/AppIcon.vue';
import ActionLogModal from '../components/goals/ActionLogModal.vue';
import ObstacleLogModal from '../components/goals/ObstacleLogModal.vue';

const route = useRoute();
const router = useRouter();
const goalStore = useGoalStore();
const reminderStore = useReminderStore();
const { formatShortDate, localizeDigits } = usePersianCalendar();

const goalId = computed(() => String(route.params.id));
const goal = computed(() => goalStore.goals.find(g => g.id === goalId.value));

const isActionModalOpen = ref(false);
const isObstacleModalOpen = ref(false);
const newMilestoneTitle = ref('');
const statusError = ref('');

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
        <AppButton variant="outline" size="sm" @click="handleExportDeadlineIcs">
          <AppIcon name="clock" size="16" />
          تقویم مهلت (.ics)
        </AppButton>
        <AppButton variant="secondary" size="sm" @click="handleDuplicate">
          تکثیر هدف
        </AppButton>
        <AppButton variant="ghost" size="sm" @click="handleDelete">
          <AppIcon name="trash" size="16" />
        </AppButton>
      </div>
    </div>

    <!-- کارت اطلاعات کلی هدف -->
    <article class="detail-overview-card">
      <header class="detail-header">
        <h2 class="detail-title">{{ goal.title }}</h2>
        <span class="detail-status-pill">
          {{ getGoalStatusLabel(goal.status) }}
        </span>
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
          <span>
            سنجه فعلی: <strong>{{ localizeDigits(goal.metric.currentValue) }}</strong> / {{ localizeDigits(goal.metric.targetValue) }} {{ goal.metric.unit }}
          </span>
          <span class="metric-percent-label">
            {{ localizeDigits(goal.metric.progressPercentage) }}٪ پیشرفت
          </span>
        </div>
        <AppProgressBar :percentage="goal.metric.progressPercentage" :height="10" />
      </div>

      <!-- انتقال وضعیت با ماشین وضعیت -->
      <div class="status-transitions-box">
        <span class="transition-label">تغییر وضعیت مجاز:</span>
        <p v-if="statusError" class="status-error-text">{{ statusError }}</p>
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
        <AppButton variant="primary" size="sm" @click="isActionModalOpen = true">
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
            <span class="action-date">{{ formatShortDate(act.date) }}</span>
            <span class="action-duration">{{ localizeDigits(act.durationMinutes) }} دقیقه</span>
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
        <AppButton variant="secondary" size="sm" @click="isObstacleModalOpen = true">
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
            <span class="obs-category-badge">
              {{ getObstacleCategoryLabel(obs.category, obs.customCategory) }}
            </span>
            <span class="obs-date">{{ formatShortDate(obs.date) }}</span>
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
      @close="isActionModalOpen = false"
    />
    <ObstacleLogModal
      :is-open="isObstacleModalOpen"
      :goal-id="goal.id"
      @close="isObstacleModalOpen = false"
    />
  </div>
</template>

<style scoped>
.goal-detail-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
}

.top-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xxs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 600;
}
.back-link:hover {
  color: var(--color-accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
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
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
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
</style>
