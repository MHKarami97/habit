<script setup lang="ts">
import { ref } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppSelect from '../common/AppSelect.vue';
import AppButton from '../common/AppButton.vue';
import AppHelpTip from '../common/AppHelpTip.vue';
import AppIcon from '../common/AppIcon.vue';
import PersianDatePickerBottomSheet from '../calendar/PersianDatePickerBottomSheet.vue';
import InteractiveGoalGuideModal from '../help/InteractiveGoalGuideModal.vue';
import type { GoalExampleTemplate } from '../../data/interactiveExamples';
import { GoalPriority } from '@/domain/value-objects/GoalPriority';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const goalStore = useGoalStore();
const { effectiveTodayIso, formatShortDate } = usePersianCalendar();

// حالت ساخت: ویزارد گام‌به‌گام یا ساخت سریع
const formMode = ref<'wizard' | 'quick'>('wizard');
const wizardStep = ref<1 | 2 | 3>(1);

const title = ref('');
const whyStatement = ref('');
const priority = ref<GoalPriority>('medium');
const status = ref<GoalStatus>('active');
const targetStartDate = ref(effectiveTodayIso.value);
const deadline = ref(effectiveTodayIso.value);
const startValue = ref(0);
const targetValue = ref(10);
const unit = ref('مورد');

// کنترل باز شدن DatePicker
const isStartDatePickerOpen = ref(false);
const isDeadlinePickerOpen = ref(false);
const isSubmitting = ref(false);
const formError = ref('');
const isGuideModalOpen = ref(false);

const handleSelectTemplate = (tmpl: GoalExampleTemplate['data']) => {
  title.value = tmpl.title;
  whyStatement.value = tmpl.whyStatement;
  priority.value = tmpl.priority;
  startValue.value = tmpl.startValue;
  targetValue.value = tmpl.targetValue;
  unit.value = tmpl.unit;

  const d = new Date();
  d.setDate(d.getDate() + tmpl.durationDays);
  deadline.value = d.toISOString().slice(0, 10);
};

const priorityOptions = [
  { value: 'low', label: 'پایین' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'بالا (ضروری)' }
];

const statusOptions = [
  { value: 'active', label: 'فعال (آغاز اقدام)' },
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'scheduled', label: 'برنامه‌ریزی‌شده برای آینده' }
];

const validateStep1 = (): boolean => {
  formError.value = '';
  if (!title.value.trim()) {
    formError.value = 'لطفاً عنوان مشخص هدف را بنویسید.';
    return false;
  }
  if (!whyStatement.value.trim()) {
    formError.value = 'بیان دلیل و چرایی هدف (Why) برای استمرار انگیزه الزامی است.';
    return false;
  }
  return true;
};

const validateStep2 = (): boolean => {
  formError.value = '';
  if (targetValue.value === undefined || isNaN(targetValue.value)) {
    formError.value = 'تعیین مقدار هدف الزامی است.';
    return false;
  }
  if (!unit.value.trim()) {
    formError.value = 'تعیین واحد سنجه الزامی است.';
    return false;
  }
  return true;
};

const nextWizardStep = () => {
  if (wizardStep.value === 1 && !validateStep1()) return;
  if (wizardStep.value === 2 && !validateStep2()) return;
  if (wizardStep.value < 3) {
    wizardStep.value = (wizardStep.value + 1) as 2 | 3;
  }
};

const prevWizardStep = () => {
  if (wizardStep.value > 1) {
    wizardStep.value = (wizardStep.value - 1) as 1 | 2;
  }
};

const handleSubmit = async () => {
  formError.value = '';
  if (!validateStep1() || !validateStep2()) return;
  if (!deadline.value) {
    formError.value = 'تعیین مهلت پایان هدف الزامی است.';
    return;
  }

  isSubmitting.value = true;
  try {
    await goalStore.createGoal({
      title: title.value,
      whyStatement: whyStatement.value,
      priority: priority.value,
      status: status.value,
      targetStartDate: targetStartDate.value,
      deadline: deadline.value,
      startValue: Number(startValue.value),
      targetValue: Number(targetValue.value),
      unit: unit.value
    });

    // ریست فرم
    title.value = '';
    whyStatement.value = '';
    wizardStep.value = 1;
    emit('close');
  } catch (err: any) {
    formError.value = err?.message || 'خطایی در ثبت هدف رخ داد';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal :is-open="isOpen" title="تعریف هدف جدید" @close="$emit('close')">
    <!-- راهنمای تعاملی و مثال‌های آماده -->
    <div class="interactive-guide-trigger-box">
      <button
        type="button"
        class="interactive-guide-trigger-btn touch-target"
        @click="isGuideModalOpen = true"
      >
        <AppIcon name="info" size="18" class="text-accent" />
        <span>چطور هدف بسازم؟ (مشاهده مثال‌های آماده و اصول SMART)</span>
      </button>
    </div>

    <!-- انتخاب حالت: ویزارد یا ساخت سریع -->
    <div class="mode-switcher-row">
      <button
        type="button"
        :class="['mode-btn', { 'mode-btn-active': formMode === 'wizard' }]"
        @click="formMode = 'wizard'"
      >
        ویزارد گام‌به‌گام (پیشنهادی)
      </button>
      <button
        type="button"
        :class="['mode-btn', { 'mode-btn-active': formMode === 'quick' }]"
        @click="formMode = 'quick'"
      >
        ساخت سریع
      </button>
    </div>

    <!-- نشانگر گام‌های ویزارد -->
    <div v-if="formMode === 'wizard'" class="wizard-steps-indicator">
      <div :class="['step-pill', { active: wizardStep === 1, done: wizardStep > 1 }]">
        ۱. چرایی و هویت
      </div>
      <div :class="['step-pill', { active: wizardStep === 2, done: wizardStep > 2 }]">
        ۲. سنجه و رقم
      </div>
      <div :class="['step-pill', { active: wizardStep === 3 }]">
        ۳. زمان و اولویت
      </div>
    </div>

    <form class="goal-form" @submit.prevent="handleSubmit">
      <p v-if="formError" class="form-error-banner">{{ formError }}</p>

      <!-- بخش گام ۱ یا کل فرم سریع: عنوان و چرایی -->
      <section v-show="formMode === 'quick' || wizardStep === 1" class="step-section">
        <!-- فیلد عنوان با راهنما و نمونه -->
        <div class="field-container">
          <div class="label-with-tip">
            <label class="field-label">عنوان شفاف هدف *</label>
            <AppHelpTip
              tip="هدفی اثربخش است که نتیجه نهایی آن واضح، سنجش‌پذیر و زمان‌دار باشد."
              good-example="تا پایان دی، ۸ کیلوگرم کاهش وزن داشته باشم"
              bad-example="ورزش کنم و لاغر شوم"
            />
          </div>
          <AppInput
            v-model="title"
            placeholder="مثلاً: قبولی در آزمون زبان تا پایان بهمن"
            required
          />
        </div>

        <!-- فیلد چرایی با راهنما -->
        <div class="field-container">
          <div class="label-with-tip">
            <label class="field-label">دلیل و انگیزه اصلی (Why) *</label>
            <AppHelpTip
              tip="دلیل عمیق رسیدن به این هدف چیست؟ در روزهای بی‌انگیزگی، این متن به شما یادآوری می‌کند چرا شروع کردید."
              good-example="برای اینکه بتوانم موقعیت شغلی بین‌المللی به دست آورم و مستقل شوم"
              bad-example="چون بقیه هم زبان می‌خوانند"
              source-note="برگرفته از اصل انگیزش درونی (Simon Sinek - Start with Why)"
            />
          </div>
          <textarea
            v-model="whyStatement"
            class="app-textarea"
            rows="2"
            placeholder="علت اهمیت این هدف برای شما..."
            required
          />
        </div>
      </section>

      <!-- بخش گام ۲ یا کل فرم سریع: سنجه -->
      <section v-show="formMode === 'quick' || wizardStep === 2" class="step-section">
        <div class="field-container">
          <div class="label-with-tip">
            <label class="field-label">سنجه عددی موفقیت *</label>
            <AppHelpTip
              tip="هدف باید معیاری عینی برای سنجش داشته باشد تا پیشرفت دقیقاً قابل رصد باشد."
              good-example="از وزن ۹۰ تا ۸۲ کیلوگرم (واحد: کیلوگرم)"
              bad-example="خوب ورزش کردن"
            />
          </div>
          <div class="form-row">
            <AppInput v-model.number="startValue" type="number" label="مقدار شروع" />
            <AppInput v-model.number="targetValue" type="number" label="مقدار هدف" />
            <AppInput v-model="unit" label="واحد سنجه (صفحه، کیلو و...)" />
          </div>
        </div>
      </section>

      <!-- بخش گام ۳ یا کل فرم سریع: زمان و اولویت -->
      <section v-show="formMode === 'quick' || wizardStep === 3" class="step-section">
        <div class="form-row">
          <AppSelect v-model="priority" :options="priorityOptions" label="اولویت هدف" />
          <AppSelect v-model="status" :options="statusOptions" label="وضعیت آغاز" />
        </div>

        <div class="form-row">
          <div class="date-picker-trigger-col">
            <label class="field-label">تاریخ شروع</label>
            <button type="button" class="date-btn" @click="isStartDatePickerOpen = true">
              {{ formatShortDate(targetStartDate) }}
            </button>
          </div>

          <div class="date-picker-trigger-col">
            <div class="label-with-tip">
              <label class="field-label">مهلت دستیابی (Deadline) *</label>
              <AppHelpTip
                tip="قانون پارکینسون می‌گوید کارها به اندازه مهلت تعیین‌شده کش می‌آیند؛ مهلت واقعی و معقول تعیین کنید."
                good-example="تعیین یک روز مشخص تقویمی (مثلاً ۳۰ بهمن)"
                bad-example="هر وقت شد"
              />
            </div>
            <button type="button" class="date-btn" @click="isDeadlinePickerOpen = true">
              {{ formatShortDate(deadline) }}
            </button>
          </div>
        </div>
      </section>

      <!-- دکمه‌های ناوبری فرم -->
      <div class="form-actions">
        <AppButton
          v-if="formMode === 'wizard' && wizardStep > 1"
          variant="secondary"
          size="md"
          type="button"
          @click="prevWizardStep"
        >
          گام قبلی
        </AppButton>

        <AppButton variant="ghost" size="md" type="button" @click="$emit('close')">
          انصراف
        </AppButton>

        <AppButton
          v-if="formMode === 'wizard' && wizardStep < 3"
          variant="primary"
          size="md"
          type="button"
          @click="nextWizardStep"
        >
          گام بعدی
        </AppButton>

        <AppButton
          v-else
          variant="primary"
          size="md"
          type="submit"
          :loading="isSubmitting"
        >
          {{ formMode === 'quick' ? 'ذخیره سریع هدف' : 'ثبت نهایی هدف' }}
        </AppButton>
      </div>
    </form>

    <!-- پیکرهای تقویم شمسی -->
    <PersianDatePickerBottomSheet
      :is-open="isStartDatePickerOpen"
      :model-value="targetStartDate"
      title="انتخاب تاریخ شروع هدف"
      @update:model-value="targetStartDate = $event"
      @close="isStartDatePickerOpen = false"
    />

    <PersianDatePickerBottomSheet
      :is-open="isDeadlinePickerOpen"
      :model-value="deadline"
      title="انتخاب مهلت پایان هدف"
      @update:model-value="deadline = $event"
      @close="isDeadlinePickerOpen = false"
    />

    <!-- راهنمای تعاملی و مثال‌های آماده -->
    <InteractiveGoalGuideModal
      :is-open="isGuideModalOpen"
      @close="isGuideModalOpen = false"
      @select-template="handleSelectTemplate"
    />
  </AppModal>
</template>

<style scoped>
.interactive-guide-trigger-box {
  margin-bottom: var(--spacing-xs);
}

.interactive-guide-trigger-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  background-color: var(--color-accent-subtle);
  border: var(--border-width-hairline) dashed var(--color-accent);
  color: var(--color-accent);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.interactive-guide-trigger-btn:hover {
  background-color: var(--color-bg-surface-elevated);
}

.mode-switcher-row {
  display: flex;
  background-color: var(--color-bg-surface-soft);
  border-radius: var(--radius-md);
  padding: 4px;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
}

.mode-btn {
  flex: 1;
  min-height: 36px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  background: transparent;
  transition: all var(--transition-fast);
}

.mode-btn-active {
  background-color: var(--color-bg-surface);
  color: var(--color-accent);
  box-shadow: var(--shadow-xs);
  font-weight: 700;
}

.wizard-steps-indicator {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.step-pill {
  flex: 1;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 4px;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  transition: all var(--transition-fast);
}

.step-pill.active {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

.step-pill.done {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
  border-color: var(--color-success);
}

.goal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.step-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-error-banner {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
  border: var(--border-width-hairline) solid var(--color-danger);
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
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

.form-row {
  display: flex;
  gap: var(--spacing-sm);
}
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }
}

.date-picker-trigger-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  flex: 1;
}

.date-btn {
  min-height: var(--touch-target-min);
  padding: 0 var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  text-align: right;
  display: flex;
  align-items: center;
}
.date-btn:hover {
  border-color: var(--color-border-strong);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
