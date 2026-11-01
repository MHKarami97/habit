<script setup lang="ts">
import { ref } from 'vue';
import AppModal from '../common/AppModal.vue';
import AppButton from '../common/AppButton.vue';
import AppIcon from '../common/AppIcon.vue';
import { useSettingsStore } from '../../stores/useSettingsStore';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const settingsStore = useSettingsStore();
const currentStep = ref(1);
const totalSteps = 4;

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  } else {
    finishOnboarding();
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const finishOnboarding = async () => {
  await settingsStore.completeOnboarding();
  emit('close');
};
</script>

<template>
  <AppModal :is-open="isOpen" title="معرفی کاوش" @close="finishOnboarding">
    <div class="onboarding-container">
      <!-- نشانگر پیشرفت گام‌ها -->
      <div class="steps-progress-dots">
        <span
          v-for="s in totalSteps"
          :key="s"
          :class="['step-dot', { 'dot-active': s === currentStep, 'dot-done': s < currentStep }]"
        />
      </div>

      <!-- محتوای گام ۱: هدف چیست؟ -->
      <div v-if="currentStep === 1" class="onboarding-slide animate-fade-in">
        <div class="slide-icon-wrapper">
          <AppIcon name="target" size="40" />
        </div>
        <h4 class="slide-title">هدف چیست؟</h4>
        <p class="slide-text">
          هدف، <strong>«مقصد نهایی»</strong> و نتیجه‌ای مشخص و دارای مهلت است که قصد رسیدن به آن را دارید.
          یک هدف خوب، شفاف و سنجش‌پذیر است (مثلاً: «تا پایان آذرماه، یک زبان برنامه‌نویسی جدید یاد بگیرم» به جای «پیشرفت کنم»).
        </p>
      </div>

      <!-- محتوای گام ۲: عادت چیست؟ -->
      <div v-else-if="currentStep === 2" class="onboarding-slide animate-fade-in">
        <div class="slide-icon-wrapper">
          <AppIcon name="flame" size="40" />
        </div>
        <h4 class="slide-title">عادت چیست؟</h4>
        <p class="slide-text">
          عادت، <strong>«سیستم روزانه و تکرارشونده»</strong> است که رفتار شما را می‌سازد.
          عادات کوچک و پیوسته در طول زمان نتایج چشمگیر خلق می‌کنند (مثلاً: «هر شب ۱۵ دقیقه مطالعه بعد از مسواک»).
        </p>
      </div>

      <!-- محتوای گام ۳: تفاوت هدف و عادت -->
      <div v-else-if="currentStep === 3" class="onboarding-slide animate-fade-in">
        <div class="slide-icon-wrapper">
          <AppIcon name="chart" size="40" />
        </div>
        <h4 class="slide-title">تفاوت هدف و عادت</h4>
        <p class="slide-text">
          هدف، <strong>جهت حرکت</strong> را مشخص می‌کند؛ اما عادت‌ها، <strong>موتور پیشران</strong> شما هستند.
          در کاوش، اهداف و عادات در دو بخش تفکیک‌شده اما مرتبط با یکدیگر طراحی شده‌اند تا هم مقصد را گم نکنید و هم روتین روزانه‌تان منظم بماند.
        </p>
      </div>

      <!-- محتوای گام ۴: حریم خصوصی و هشدار پشتیبان‌گیری -->
      <div v-else-if="currentStep === 4" class="onboarding-slide animate-fade-in">
        <div class="slide-icon-wrapper shield-wrapper">
          <AppIcon name="shield" size="40" />
        </div>
        <h4 class="slide-title">داده‌ها فقط روی دستگاه شماست!</h4>
        <p class="slide-text">
          کاوش هیچ‌گونه سرور، دیتابیس ابری یا ردیاب ندارد. ۱۰۰٪ اطلاعات روی همین مرورگر ذخیره می‌شود.
        </p>
        <div class="backup-warning-box">
          <AppIcon name="alert" size="18" class="warning-icon" />
          <p class="warning-text">
            <strong>مهم:</strong> در صورت پاک کردن کش مرورگر یا بازنشانی دستگاه، اطلاعات شما پاک خواهد شد. لطفاً به صورت دوره‌ای از منوی تنظیمات، نسخه پشتیبان (JSON) تهیه فرمایید.
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="onboarding-footer-btns">
        <AppButton v-if="currentStep > 1" variant="ghost" size="md" @click="prevStep">
          قبلی
        </AppButton>
        <div class="spacer" />
        <AppButton variant="primary" size="md" @click="nextStep">
          {{ currentStep === totalSteps ? 'شروع کاوش' : 'بعدی' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.onboarding-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.steps-progress-dots {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-border-strong);
  transition: all var(--transition-fast);
}

.step-dot.dot-active {
  width: 22px;
  background-color: var(--color-accent);
}

.step-dot.dot-done {
  background-color: var(--color-accent-subtle);
}

.onboarding-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.slide-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-lg);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.slide-icon-wrapper.shield-wrapper {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.slide-title {
  font-size: var(--font-size-xl);
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.slide-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 380px;
}

.backup-warning-box {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  background-color: var(--color-warning-subtle);
  border: var(--border-width-hairline) solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  margin-top: var(--spacing-md);
  text-align: right;
}

.warning-icon {
  color: var(--color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.onboarding-footer-btns {
  display: flex;
  align-items: center;
  width: 100%;
}

.spacer {
  flex: 1;
}
</style>
