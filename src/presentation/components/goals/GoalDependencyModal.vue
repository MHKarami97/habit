<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppButton from '../common/AppButton.vue';
import AppIcon from '../common/AppIcon.vue';
import { useGoalStore } from '../../stores/useGoalStore';
import { GoalDependencyService } from '@/domain/services/GoalDependencyService';
import { getGoalStatusLabel } from '@/domain/value-objects/GoalStatus';

const props = defineProps<{
  isOpen: boolean;
  goalId: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated'): void;
}>();

const goalStore = useGoalStore();

const selectedPrereqIds = ref<string[]>([]);
const validationError = ref('');
const isSubmitting = ref(false);

const currentGoal = computed(() => goalStore.goals.find(g => g.id === props.goalId));

// پیدا کردن تمام زیرمجموعه‌ها و نوادگان هدف برای جلوگیری از وابستگی به فرزندان خود
const descendantIds = computed<Set<string>>(() => {
  const result = new Set<string>();
  if (!props.goalId) return result;

  const stack = [props.goalId];
  while (stack.length > 0) {
    const parentId = stack.pop()!;
    const children = goalStore.goals.filter(g => g.parentId === parentId);
    for (const child of children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        stack.push(child.id);
      }
    }
  }
  return result;
});

// اهداف مجاز برای انتخاب به عنوان پیش‌نیاز (بدون خود هدف و بدون فرزندان آن)
const availableCandidates = computed(() => {
  return goalStore.goals.filter(
    g => g.id !== props.goalId && !descendantIds.value.has(g.id) && !g.isArchived
  );
});

watch(
  () => [props.isOpen, props.goalId],
  () => {
    if (props.isOpen && currentGoal.value) {
      selectedPrereqIds.value = [...currentGoal.value.blockedByGoalIds];
      validationError.value = '';
    }
  },
  { immediate: true }
);

const togglePrerequisite = (candidateId: string) => {
  validationError.value = '';
  const current = new Set(selectedPrereqIds.value);

  if (current.has(candidateId)) {
    current.delete(candidateId);
  } else {
    current.add(candidateId);
  }

  const nextSelection = Array.from(current);

  // بررسی بی‌درنگ عدم وجود دور وابستگی چرخشی
  try {
    GoalDependencyService.validateNoCycle(props.goalId, nextSelection, goalStore.goals);
    selectedPrereqIds.value = nextSelection;
  } catch (err: any) {
    validationError.value = err?.message || 'این وابستگی باعث ایجاد دور چرخشی نامعتبر در اهداف می‌شود.';
  }
};

const handleSave = async () => {
  if (!currentGoal.value) return;
  validationError.value = '';
  isSubmitting.value = true;

  try {
    await goalStore.updateGoalDependencies(props.goalId, selectedPrereqIds.value);
    emit('updated');
    emit('close');
  } catch (err: any) {
    validationError.value = err?.message || 'خطا در ثبت وابستگی‌ها';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal
    :is-open="isOpen"
    title="مدیریت پیش‌نیازها و وابستگی‌های هدف"
    @close="$emit('close')"
  >
    <div v-if="currentGoal" class="dependency-modal-body">
      <!-- راهنمای قانون وابستگی -->
      <div class="info-alert">
        <AppIcon name="info" size="18" class="text-accent" />
        <div class="info-alert-text">
          <strong>قانون پیش‌نیازها:</strong>
          تا زمانی که تمام اهداف انتخابی در این فهرست «تکمیل» نشوند، هدف «{{ currentGoal.title }}» نمی‌تواند به وضعیت فعال منتقل شود.
        </div>
      </div>

      <p v-if="validationError" class="error-banner">
        <AppIcon name="alert" size="16" />
        <span>{{ validationError }}</span>
      </p>

      <div class="candidates-section">
        <h4 class="candidates-heading">انتخاب اهدافی که باید قبل از این هدف تمام شوند:</h4>

        <div v-if="availableCandidates.length > 0" class="candidates-list">
          <label
            v-for="candidate in availableCandidates"
            :key="candidate.id"
            :class="[
              'candidate-item',
              { 'item-selected': selectedPrereqIds.includes(candidate.id) }
            ]"
          >
            <input
              type="checkbox"
              class="candidate-checkbox"
              :checked="selectedPrereqIds.includes(candidate.id)"
              @change="togglePrerequisite(candidate.id)"
            />

            <div class="candidate-info">
              <div class="candidate-header">
                <span class="candidate-title">{{ candidate.title }}</span>
                <span :class="['status-tag', `status-${candidate.status}`]">
                  {{ getGoalStatusLabel(candidate.status) }}
                </span>
              </div>
              <div class="candidate-sub">
                <span class="level-text">سطح: {{ candidate.hierarchyLevelLabel }}</span>
                <span v-if="candidate.status === 'completed'" class="done-note text-success">
                  (پیش‌نیاز محقق شده)
                </span>
                <span v-else class="pending-note text-warning">
                  (در انتظار تکمیل)
                </span>
              </div>
            </div>
          </label>
        </div>

        <p v-else class="empty-candidates">
          هیچ هدف دیگری برای ایجاد وابستگی در دسترس نیست.
        </p>
      </div>

      <!-- دکمه‌های فرم -->
      <div class="modal-actions">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton
          variant="primary"
          size="md"
          :loading="isSubmitting"
          @click="handleSave"
        >
          ذخیره پیش‌نیازها
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
.dependency-modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-relaxed);
}

.info-alert-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
  border: var(--border-width-hairline) solid var(--color-danger);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.candidates-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.candidates-heading {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.candidates-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 280px;
  overflow-y: auto;
  padding-inline-end: 2px;
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.candidate-item:hover {
  border-color: var(--color-border-strong);
  background-color: var(--color-bg-surface-soft);
}

.item-selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-subtle);
}

.candidate-checkbox {
  width: 18px;
  height: 18px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 2px;
}

.candidate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs);
}

.candidate-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
}

.status-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.status-active {
  background-color: var(--color-info-subtle);
  color: var(--color-info);
}

.status-completed {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.status-paused {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.status-scheduled {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.status-draft {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-secondary);
}

.candidate-sub {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 11px;
  color: var(--color-text-muted);
}

.empty-candidates {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--spacing-md);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}
</style>
