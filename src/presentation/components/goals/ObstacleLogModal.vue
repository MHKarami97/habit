<script setup lang="ts">
import { ref } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppSelect from '../common/AppSelect.vue';
import AppButton from '../common/AppButton.vue';
import AppHelpTip from '../common/AppHelpTip.vue';
import { ObstacleCategory } from '@/domain/entities/ObstacleLog';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

const props = defineProps<{
  isOpen: boolean;
  goalId: string;
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
    await goalStore.recordObstacle({
      goalId: props.goalId,
      date: effectiveTodayIso.value,
      category: category.value,
      customCategory: category.value === 'custom' ? customCategory.value : undefined,
      note: note.value,
      ifThenPlan: ifThenPlan.value
    });

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
  <AppModal :is-open="isOpen" title="ثبت مانع و برنامه اگر-آنگاه" @close="$emit('close')">
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
          <label class="field-label">برنامه اگر-آنگاه (If-Then Plan) *</label>
          <AppHelpTip
            tip="قصد اجرایی (Implementation Intentions): تعیین کنید در مواجهه دوباره با این مانع دقیقاً چه واکنشی نشان می‌دهید."
            good-example="اگر گوشی مرا وسوسه کرد، آنگاه آن را در کشوی اتاق دیگر می‌گذارم و تایمر ۲۵ دقیقه می‌گذارم."
            bad-example="سعی می‌کنم کمتر گوشی دست بگیرم."
            source-note="پیتر گولویتزر (Peter Gollwitzer, 1999)"
          />
        </div>
        <textarea
          v-model="ifThenPlan"
          class="app-textarea"
          rows="3"
          placeholder="اگر [مانع رخ داد]، آنگاه [واکنش مشخص من این خواهد بود]..."
          required
        />
      </div>

      <div class="form-actions">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting">
          ثبت مانع
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
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.app-textarea {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  resize: vertical;
}
.app-textarea:focus {
  border-color: var(--color-accent);
  background-color: var(--color-bg-surface);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
