<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppSelect from '../common/AppSelect.vue';
import AppButton from '../common/AppButton.vue';
import AppHelpTip from '../common/AppHelpTip.vue';
import { ObstacleLog, ObstacleCategory } from '@/domain/entities/ObstacleLog';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

const props = defineProps<{
  isOpen: boolean;
  goalId: string;
  initialObstacle?: ObstacleLog | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const goalStore = useGoalStore();
const { effectiveTodayIso } = usePersianCalendar();

const category = ref<ObstacleCategory>('fatigue');
const customCategory = ref('');
const note = ref('');
const ifThenPlan = ref('');
const isSubmitting = ref(false);
const error = ref('');

const modalTitle = computed(() =>
  props.initialObstacle ? 'ویرایش مانع و برنامه اگر-آنگاه' : 'ثبت مانع و برنامه اگر-آنگاه'
);

watch(
  () => [props.isOpen, props.initialObstacle] as const,
  ([isOpen, initObs]) => {
    if (isOpen) {
      if (initObs) {
        category.value = initObs.category;
        customCategory.value = initObs.customCategory || '';
        note.value = initObs.note;
        ifThenPlan.value = initObs.ifThenPlan;
      } else {
        category.value = 'fatigue';
        customCategory.value = '';
        note.value = '';
        ifThenPlan.value = '';
      }
      error.value = '';
    }
  },
  { immediate: true }
);

const categoryOptions = [
  { value: 'fatigue', label: 'خستگی جسمی یا ذهنی' },
  { value: 'screen_time', label: 'حواس‌پرتی با گوشی / شبکه‌های اجتماعی' },
  { value: 'work_pressure', label: 'فشار کاری و کمبود زمان' },
  { value: 'low_motivation', label: 'بی‌انگیزگی یا تردید' },
  { value: 'procrastination', label: 'اهمال‌کاری و تعویق' },
  { value: 'unexpected_event', label: 'پیشامد غیرمنتظره' },
  { value: 'custom', label: 'دسته شخصی دیگر...' }
];

const handleSubmit = async () => {
  error.value = '';
  if (!ifThenPlan.value.trim()) {
    error.value = 'تعیین برنامه «اگر-آنگاه» برای خنثی کردن مانع ضروری است.';
    return;
  }

  isSubmitting.value = true;
  try {
    if (props.initialObstacle) {
      await goalStore.updateObstacleLog({
        id: props.initialObstacle.id,
        goalId: props.goalId,
        category: category.value,
        customCategory: category.value === 'custom' ? customCategory.value : undefined,
        note: note.value,
        ifThenPlan: ifThenPlan.value
      });
    } else {
      await goalStore.recordObstacle({
        goalId: props.goalId,
        date: effectiveTodayIso.value,
        category: category.value,
        customCategory: category.value === 'custom' ? customCategory.value : undefined,
        note: note.value,
        ifThenPlan: ifThenPlan.value
      });
    }

    note.value = '';
    ifThenPlan.value = '';
    emit('close');
  } catch (err: any) {
    error.value = err?.message || 'خطا در ثبت مانع';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal :is-open="isOpen" :title="modalTitle" @close="$emit('close')">
    <form class="obstacle-form" @submit.prevent="handleSubmit">
      <p v-if="error" class="form-error">{{ error }}</p>

      <AppSelect
        v-model="category"
        :options="categoryOptions"
        label="دسته مانع یا عامل دورکننده"
      />

      <AppInput
        v-if="category === 'custom'"
        v-model="customCategory"
        label="عنوان دسته شخصی"
        placeholder="مانع خود را نام‌گذاری کنید"
        required
      />

      <div class="field-container">
        <label class="field-label">توضیحات و مشاهده شما</label>
        <textarea
          v-model="note"
          class="app-textarea"
          rows="2"
          placeholder="چه چیزی باعث شد از مسیر دور شوید؟"
        />
      </div>

      <div class="field-container">
        <div class="label-with-tip">
          <label class="field-label">
            برنامه اگر-آنگاه (Implementation Intention) *
          </label>
          <AppHelpTip
            tip="برنامه اگر-آنگاه طبق پژوهش‌های پیتر گولویتزر شانس غلبه بر وسوسه را بیش از دو برابر می‌کند. ساختار: اگر [موقعیت رخ داد]، آنگاه [رفتار مشخصی انجام می‌دهم]."
            good-example="اگر ساعت ۱۰ شب احساس خستگی کردم، آنگاه گوشی را در اتاق دیگر می‌گذارم و ۵ صفحه کتاب کاغذی می‌خوانم."
            bad-example="سعی می‌کنم کمتر خسته بشم و بیشتر تلاش کنم."
            source-note="Gollwitzer (1999) - Implementation Intentions"
          />
        </div>

        <textarea
          v-model="ifThenPlan"
          class="app-textarea"
          rows="3"
          placeholder="اگر [مانع پیش آمد]، آنگاه [این واکنش مشخص را انجام می‌دهم]..."
          required
        />
        <span class="field-hint">
          فرمول طلایی: اگر (موقعیت/مانع) پیش آمد، آنگاه (یک کار کوچک مشخص) انجام می‌دهم.
        </span>
      </div>

      <div class="form-actions">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting">
          {{ initialObstacle ? 'ذخیره تغییرات' : 'ثبت مانع' }}
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.obstacle-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-error {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.field-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.label-with-tip {
  display: flex;
  align-items: center;
  gap: var(--spacing-xxs);
}

.field-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.field-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.app-textarea {
  width: 100%;
  padding: var(--spacing-sm);
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  resize: vertical;
}

.app-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
