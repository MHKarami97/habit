<script setup lang="ts">
import { ref } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppInput from '../common/AppInput.vue';
import AppButton from '../common/AppButton.vue';
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

const description = ref('');
const progressDelta = ref(1);
const durationMinutes = ref(30);
const nextStep = ref('');
const isSubmitting = ref(false);
const error = ref('');

const handleSubmit = async () => {
  error.value = '';
  if (!description.value.trim()) {
    error.value = 'شرح اقدام الزامی است.';
    return;
  }

  isSubmitting.value = true;
  try {
    await goalStore.logAction({
      goalId: props.goalId,
      date: effectiveTodayIso.value,
      description: description.value,
      progressDelta: Number(progressDelta.value),
      durationMinutes: Number(durationMinutes.value),
      nextStep: nextStep.value || undefined
    });

    description.value = '';
    nextStep.value = '';
    emit('close');
  } catch (err: any) {
    error.value = err?.message || 'خطا در ثبت اقدام';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <AppModal :is-open="isOpen" title="ثبت اقدام انجام‌شده (Action Log)" @close="$emit('close')">
    <form class="action-form" @submit.prevent="handleSubmit">
      <p v-if="error" class="form-error">{{ error }}</p>

      <AppInput
        v-model="description"
        label="چه اقدامی انجام دادید؟ *"
        placeholder="مثلاً: حل ۱۰ تمرین از فصل سوم"
        required
      />

      <div class="form-row">
        <AppInput
          v-model.number="progressDelta"
          type="number"
          label="میزان پیشرفت افزوده شده"
        />
        <AppInput
          v-model.number="durationMinutes"
          type="number"
          label="مدت زمان صرف‌شده (دقیقه)"
        />
      </div>

      <AppInput
        v-model="nextStep"
        label="قدم بعدی بلافاصله (Next Step)"
        placeholder="مثلاً: مرور خلاصه‌نویسی‌ها فردا صبح"
        hint="مشخص کردن قدم بعدی از افتادن در دام تعویق جلوگیری می‌کند."
      />

      <div class="form-actions">
        <AppButton variant="ghost" size="md" @click="$emit('close')">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" type="submit" :loading="isSubmitting">
          ثبت اقدام
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.action-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-error {
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.form-row {
  display: flex;
  gap: var(--spacing-sm);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
</style>
