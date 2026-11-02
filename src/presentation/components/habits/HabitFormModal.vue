<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppSelect from '../common/AppSelect.vue';
import AppButton from '../common/AppButton.vue';
import AppHelpTip from '../common/AppHelpTip.vue';
import AppIcon from '../common/AppIcon.vue';
import InteractiveHabitGuideModal from '../help/InteractiveHabitGuideModal.vue';
import TemplatePickerModal from '../templates/TemplatePickerModal.vue';
import type { HabitExampleTemplate } from '../../data/interactiveExamples';
import type { HabitTemplateData } from '@/domain/entities/UserTemplate';
import { Habit } from '@/domain/entities/Habit';
import { HabitType } from '@/domain/value-objects/HabitType';
import { RecurrenceType, RecurrenceConfig } from '@/domain/value-objects/RecurrenceConfig';
import { useHabitStore } from '../../stores/useHabitStore';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

const props = defineProps<{
  isOpen: boolean;
  initialHabit?: Habit | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const habitStore = useHabitStore();
const goalStore = useGoalStore();
const { effectiveTodayIso } = usePersianCalendar();

// حالت ساخت: ویزارد گام‌به‌گام یا ساخت سریع
const formMode = ref<'wizard' | 'quick'>('wizard');
const wizardStep = ref<1 | 2 | 3>(1);

const title = ref('');
const habitType = ref<HabitType>('boolean');
const recurrenceType = ref<RecurrenceType>('daily');
// روزهای انتخابی هفته (۰=شنبه، ۶=جمعه)
const selectedWeekdays = ref<number[]>([0, 1, 2, 3, 4, 5, 6]);
const intervalDays = ref(2);
const dailyTarget = ref(1);
const unit = ref('بار');
const cue = ref('');
const linkedGoalId = ref<string>('');
const reminderTime = ref('20:00');
const weeklyFreezeAllowed = ref(true);
const isSubmitting = ref(false);
const error = ref('');
const isGuideModalOpen = ref(false);
const modalTitle = computed(() => (props.initialHabit ? 'ویرایش عادت' : 'تعریف عادت جدید'));

watch(
  () => [props.isOpen, props.initialHabit] as const,
  ([isOpen, initHabit]) => {
    if (isOpen) {
      if (initHabit) {
        title.value = initHabit.title;
        habitType.value = initHabit.habitType;
        recurrenceType.value = initHabit.recurrence.type;
        if (initHabit.recurrence.type === 'weekly_days' && initHabit.recurrence.daysOfWeek) {
          selectedWeekdays.value = [...initHabit.recurrence.daysOfWeek];
        } else {
          selectedWeekdays.value = [0, 1, 2, 3, 4, 5, 6];
        }
        if (initHabit.recurrence.type === 'interval' && initHabit.recurrence.everyXDays) {
          intervalDays.value = initHabit.recurrence.everyXDays;
        } else {
          intervalDays.value = 2;
        }
        dailyTarget.value = initHabit.dailyTarget;
        unit.value = initHabit.unit;
        cue.value = initHabit.cue || '';
        linkedGoalId.value = initHabit.linkedGoalId || '';
        reminderTime.value = (initHabit.reminderTimes && initHabit.reminderTimes[0]) || '';
        weeklyFreezeAllowed.value = initHabit.weeklyFreezeAllowed;
        formMode.value = 'quick';
      } else {
        title.value = '';
        habitType.value = 'boolean';
        recurrenceType.value = 'daily';
        selectedWeekdays.value = [0, 1, 2, 3, 4, 5, 6];
        intervalDays.value = 2;
        dailyTarget.value = 1;
        unit.value = 'بار';
        cue.value = '';
        linkedGoalId.value = '';
        reminderTime.value = '20:00';
        weeklyFreezeAllowed.value = true;
        wizardStep.value = 1;
        formMode.value = 'wizard';
      }
    }
  },
  { immediate: true }
);

const handleSelectTemplate = (tmpl: HabitExampleTemplate['data']) => {
  title.value = tmpl.title;
  habitType.value = tmpl.habitType;
  recurrenceType.value = tmpl.recurrenceType;
  if (tmpl.recurrenceDays) {
    selectedWeekdays.value = [...tmpl.recurrenceDays];
  }
  dailyTarget.value = tmpl.dailyTarget;
  unit.value = tmpl.unit;
  cue.value = tmpl.cue;
  if (tmpl.reminderTimes && tmpl.reminderTimes.length > 0) {
    reminderTime.value = tmpl.reminderTimes[0] || '20:00';
  }
};

const isTemplateModalOpen = ref(false);

const handleSelectHabitTemplate = (tmpl: HabitTemplateData) => {
  title.value = tmpl.title;
  habitType.value = tmpl.habitType;
  dailyTarget.value = tmpl.dailyTarget;
  unit.value = tmpl.unit;
  recurrenceType.value = tmpl.recurrenceType;
  if (tmpl.recurrenceRuleJson) {
    try {
      const rule = JSON.parse(tmpl.recurrenceRuleJson);
      if (rule.daysOfWeek) {
        selectedWeekdays.value = [...rule.daysOfWeek];
      }
      if (rule.everyXDays) {
        intervalDays.value = rule.everyXDays;
      }
    } catch {
      // fallback
    }
  }
  cue.value = tmpl.cue || '';
};

const weekDayNames = [
  { index: 0, label: 'شنبه' },
  { index: 1, label: '۱ش' },
  { index: 2, label: '۲ش' },
  { index: 3, label: '۳ش' },
  { index: 4, label: '۴ش' },
  { index: 5, label: '۵ش' },
  { index: 6, label: 'جمعه' }
];

const habitTypeOptions = [
  { value: 'boolean', label: 'انجام شد / نشد (بولی)' },
  { value: 'numeric', label: 'مقداری (تعداد، صفحه و...)' },
  { value: 'duration', label: 'مدت‌دار (دقیقه)' },
  { value: 'quit', label: 'ترک رفتار (پرهیز)' }
];

const recurrenceTypeOptions = [
  { value: 'daily', label: 'هر روز' },
  { value: 'weekly_days', label: 'روزهای مشخص هفته' },
  { value: 'interval', label: 'هر چند روز یک‌بار' }
];

const goalOptions = computed(() => {
  const options = [{ value: '', label: 'بدون اتصال به هدف' }];
  for (const g of goalStore.goals) {
    if (g.status === 'active') {
      options.push({ value: g.id, label: g.title });
    }
  }
  return options;
});

const toggleWeekday = (idx: number) => {
  if (selectedWeekdays.value.includes(idx)) {
    selectedWeekdays.value = selectedWeekdays.value.filter(d => d !== idx);
  } else {
    selectedWeekdays.value = [...selectedWeekdays.value, idx].sort((a, b) => a - b);
  }
};

const validateStep1 = (): boolean => {
  error.value = '';
  if (!title.value.trim()) {
    error.value = 'عنوان عادت الزامی است.';
    return false;
  }
  return true;
};

const nextWizardStep = () => {
  if (wizardStep.value === 1 && !validateStep1()) return;
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
  error.value = '';
  if (!validateStep1()) return;

  let recurrence: RecurrenceConfig;
  if (recurrenceType.value === 'daily') {
    recurrence = { type: 'daily' };
  } else if (recurrenceType.value === 'weekly_days') {
    if (selectedWeekdays.value.length === 0) {
      error.value = 'حداقل یک روز از هفته را انتخاب کنید.';
      return;
    }
    recurrence = { type: 'weekly_days', daysOfWeek: selectedWeekdays.value };
  } else {
    recurrence = {
      type: 'interval',
      everyXDays: Number(intervalDays.value),
      anchorDate: effectiveTodayIso.value
    };
  }

  isSubmitting.value = true;
  try {
    if (props.initialHabit) {
      await habitStore.updateHabit({
        id: props.initialHabit.id,
        title: title.value,
        habitType: habitType.value,
        recurrence,
        dailyTarget: Number(dailyTarget.value) || 1,
        unit: unit.value,
        cue: cue.value || undefined,
        linkedGoalId: linkedGoalId.value || undefined,
        reminderTimes: reminderTime.value ? [reminderTime.value] : [],
        weeklyFreezeAllowed: weeklyFreezeAllowed.value
      });
    } else {
      await habitStore.createHabit({
        title: title.value,
        habitType: habitType.value,
        recurrence,
        dailyTarget: Number(dailyTarget.value) || 1,
        unit: unit.value,
        cue: cue.value || undefined,
        linkedGoalId: linkedGoalId.value || undefined,
        reminderTimes: reminderTime.value ? [reminderTime.value] : [],
        startDate: effectiveTodayIso.value,
        weeklyFreezeAllowed: weeklyFreezeAllowed.value
      });
    }

    title.value = '';
    cue.value = '';
    wizardStep.value = 1;
    emit('close');
  } catch (err: any) {
    error.value = err?.message || 'خطا در ثبت عادت';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal :is-open="isOpen" :title="modalTitle" @close="$emit('close')">
    <!-- راهنمای تعاملی و قالب‌های آماده -->
    <div class="interactive-guide-trigger-box">
      <button
        type="button"
        class="interactive-guide-trigger-btn touch-target"
        @click="isGuideModalOpen = true"
      >
        <AppIcon name="info" size="18" class="text-accent" />
        <span>چطور عادت بسازم؟ (مشاهده مثال‌های آماده و اصول Tiny Habits)</span>
      </button>

      <button
        type="button"
        class="interactive-guide-trigger-btn template-picker-btn touch-target"
        @click="isTemplateModalOpen = true"
      >
        <AppIcon name="flame" size="18" class="text-accent" />
        <span>انتخاب از کتابخانه قالب‌های آماده و شخصی عادت‌ها</span>
      </button>
    </div>

    <!-- انتخاب حالت: ویزارد یا ساخت سریع -->
    <div class="mode-switcher-row">
      <button
        type="button"
        :class="['mode-btn', { 'mode-btn-active': formMode === 'wizard' }]"
        @click="formMode = 'wizard'"
      >
        ویزارد گام‌به‌گام
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
        ۱. هویت رفتار
      </div>
      <div :class="['step-pill', { active: wizardStep === 2, done: wizardStep > 2 }]">
        ۲. تکرار و هدف
      </div>
      <div :class="['step-pill', { active: wizardStep === 3 }]">
        ۳. زمان و اتصال
      </div>
    </div>

    <form class="habit-form" @submit.prevent="handleSubmit">
      <p v-if="error" class="form-error">{{ error }}</p>

      <!-- گام ۱: هویت رفتار -->
      <section v-show="formMode === 'quick' || wizardStep === 1" class="step-section">
        <!-- عنوان عادت با راهنمای شروع کوچک -->
        <div class="field-container">
          <div class="label-with-tip">
            <label class="field-label">عنوان عادت *</label>
            <AppHelpTip
              tip="عادت را به اندازه‌ای کوچک طراحی کنید که انجام آن در سخت‌ترین روزها هم زحمتی نداشته باشد (شروع بسیار کوچک)."
              good-example="خواندن ۵ صفحه کتاب قبل از خواب"
              bad-example="روزی ۲ ساعت کتاب خواندن"
            />
          </div>
          <AppInput
            v-model="title"
            placeholder="مثلاً: نوشیدن ۲ لیوان آب ناشتا"
            required
          />
        </div>

        <!-- محرک / لنگر رفتاری (Cue) با راهنما -->
        <div class="field-container">
          <div class="label-with-tip">
            <label class="field-label">محرک یا لنگر رفتاری (Cue)</label>
            <AppHelpTip
              tip="عادت جدید را بلافاصله به یک روال همیشگی و تثبیت‌شده در روز گره بزنید (تکنیک قلاب‌گذاری عادت)."
              good-example="بلافاصله بعد از دم کردن چای صبحانه..."
              bad-example="هر وقت یادم افتاد..."
            />
          </div>
          <AppInput
            v-model="cue"
            placeholder="مثلاً: بعد از مسواک زدن شب..."
          />
        </div>

        <AppSelect v-model="habitType" :options="habitTypeOptions" label="نوع عادت" />
      </section>

      <!-- گام ۲: تکرار و اهداف روزانه -->
      <section v-show="formMode === 'quick' || wizardStep === 2" class="step-section">
        <AppSelect v-model="recurrenceType" :options="recurrenceTypeOptions" label="قاعده تکرار" />

        <!-- انتخاب روزهای هفته در صورت انتخاب weekly_days -->
        <div v-if="recurrenceType === 'weekly_days'" class="weekday-selector">
          <label class="field-label">روزهای موعد انجام:</label>
          <div class="weekdays-buttons">
            <button
              v-for="w in weekDayNames"
              :key="w.index"
              type="button"
              :class="['weekday-pill', { 'pill-active': selectedWeekdays.includes(w.index) }]"
              @click="toggleWeekday(w.index)"
            >
              {{ w.label }}
            </button>
          </div>
        </div>

        <!-- فاصله چند روز یک‌بار -->
        <div v-else-if="recurrenceType === 'interval'" class="form-row">
          <AppInput
            v-model.number="intervalDays"
            type="number"
            label="هر چند روز یک‌بار؟"
          />
        </div>

        <!-- هدف روزانه و واحد (اگر بولی نباشد) -->
        <div v-if="habitType !== 'boolean' && habitType !== 'quit'" class="form-row">
          <AppInput v-model.number="dailyTarget" type="number" label="هدف روزانه" />
          <AppInput v-model="unit" label="واحد (صفحه، دقیقه، بار)" />
        </div>

        <!-- امکان روز آزاد هفتگی (Freeze) -->
        <label class="checkbox-label">
          <input v-model="weeklyFreezeAllowed" type="checkbox" class="app-checkbox" />
          <span>امکان سهمیه استراحت هفتگی (Freeze) برای حفظ استریک</span>
        </label>
      </section>

      <!-- گام ۳: زمان‌بندی و اتصال به هدف -->
      <section v-show="formMode === 'quick' || wizardStep === 3" class="step-section">
        <!-- اتصال به یک هدف -->
        <AppSelect
          v-model="linkedGoalId"
          :options="goalOptions"
          label="اتصال به هدف کلان (اختیاری)"
        />

        <!-- ساعت یادآور -->
        <AppInput
          v-model="reminderTime"
          type="time"
          label="ساعت یادآور روزانه"
        />
      </section>

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
          {{ initialHabit ? 'ذخیره تغییرات عادت' : (formMode === 'quick' ? 'ذخیره سریع عادت' : 'ثبت نهایی عادت') }}
        </AppButton>
      </div>
    </form>

    <!-- راهنمای تعاملی و مثال‌های آماده -->
    <InteractiveHabitGuideModal
      :is-open="isGuideModalOpen"
      @close="isGuideModalOpen = false"
      @select-template="handleSelectTemplate"
    />

    <!-- کتابخانه جامع قالب‌های آماده و شخصی عادت‌ها -->
    <TemplatePickerModal
      :is-open="isTemplateModalOpen"
      initial-type="habit"
      @close="isTemplateModalOpen = false"
      @select-habit="handleSelectHabitTemplate"
    />
  </AppModal>
</template>

<style scoped>
.interactive-guide-trigger-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: var(--spacing-xs);
}

.template-picker-btn {
  background-color: var(--color-bg-surface-soft);
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.interactive-guide-trigger-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-accent-subtle);
  border: 1px dashed var(--color-accent);
  border-radius: var(--radius-md);
  color: var(--color-accent);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.interactive-guide-trigger-btn:hover {
  background: var(--color-accent);
  color: #ffffff;
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

.habit-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.step-section {
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

.form-row {
  display: flex;
  gap: var(--spacing-sm);
}
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
  }
}

.weekday-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.weekdays-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.weekday-pill {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  transition: all var(--transition-fast);
}

.weekday-pill.pill-active {
  background-color: var(--color-accent);
  color: #ffffff;
  border-color: var(--color-accent);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  margin-top: var(--spacing-xxs);
}

.app-checkbox {
  accent-color: var(--color-accent);
  width: 16px;
  height: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
