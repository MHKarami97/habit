<script setup lang="ts">
import { ref, computed } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppSelect from '../common/AppSelect.vue';
import AppButton from '../common/AppButton.vue';
import AppHelpTip from '../common/AppHelpTip.vue';
import { HabitType } from '@/domain/value-objects/HabitType';
import { RecurrenceType, RecurrenceConfig } from '@/domain/value-objects/RecurrenceConfig';
import { useHabitStore } from '../../stores/useHabitStore';
import { useGoalStore } from '../../stores/useGoalStore';
import { usePersianCalendar } from '../../composables/usePersianCalendar';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const habitStore = useHabitStore();
const goalStore = useGoalStore();
const { effectiveTodayIso } = usePersianCalendar();

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

const handleSubmit = async () => {
  error.value = '';
  if (!title.value.trim()) {
    error.value = 'عنوان عادت الزامی است.';
    return;
  }

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

    title.value = '';
    cue.value = '';
    emit('close');
  } catch (err: any) {
    error.value = err?.message || 'خطا در تعریف عادت';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal :is-open="isOpen" title="تعریف عادت جدید" @close="$emit('close')">
    <form class="habit-form" @submit.prevent="handleSubmit">
      <p v-if="error" class="form-error">{{ error }}</p>

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

      <!-- نوع عادت و قاعده تکرار -->
      <div class="form-row">
        <AppSelect v-model="habitType" :options="habitTypeOptions" label="نوع عادت" />
        <AppSelect v-model="recurrenceType" :options="recurrenceTypeOptions" label="قاعده تکرار" />
      </div>

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

      <!-- اتصال به یک هدف -->
      <AppSelect
        v-model="linkedGoalId"
        :options="goalOptions"
        label="اتصال به هدف کلان (اختیاری)"
      />

      <!-- ساعت یادآور -->
      <div class="form-row">
        <AppInput
          v-model="reminderTime"
          type="time"
          label="ساعت یادآور روزانه"
        />
      </div>

      <!-- امکان روز آزاد هفتگی (Freeze) -->
      <label class="checkbox-label">
        <input v-model="weeklyFreezeAllowed" type="checkbox" class="app-checkbox" />
        <span>اجازه استفاده از سهمیه استراحت هفتگی (Freeze) برای حفظ استریک</span>
      </label>

      <div class="form-actions">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting">
          ثبت عادت
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.habit-form {
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
