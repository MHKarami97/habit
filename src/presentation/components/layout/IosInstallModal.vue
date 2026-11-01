<script setup lang="ts">
import AppModal from '../common/AppModal.vue';
import AppButton from '../common/AppButton.vue';
import AppIcon from '../common/AppIcon.vue';

defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <AppModal :is-open="isOpen" title="نصب روی آیفون و آیپد (iOS)" @close="$emit('close')">
    <div class="ios-install-steps">
      <p class="intro-text">
        جهت عملکرد روان، دسترسی آفلاین و فعال‌سازی یادآورها در iOS، برنامه را به صفحه اصلی بیفزایید:
      </p>

      <ol class="steps-list">
        <li class="step-item">
          <span class="step-num">۱</span>
          <div class="step-content">
            در نوار پایین مرورگر سافاری، دکمه <strong>اشتراک‌گذاری (Share)</strong>
            <AppIcon name="share" size="16" /> را لمس کنید.
          </div>
        </li>
        <li class="step-item">
          <span class="step-num">۲</span>
          <div class="step-content">
            در منوی بازشده به سمت پایین اسکرول کرده و گزینه
            <strong>«Add to Home Screen» (افزودن به صفحه اصلی)</strong> را انتخاب کنید.
          </div>
        </li>
        <li class="step-item">
          <span class="step-num">۳</span>
          <div class="step-content">
            در گوشه بالا سمت راست، روی دکمه <strong>Add (افزودن)</strong> بزنید.
          </div>
        </li>
      </ol>
    </div>

    <template #footer>
      <AppButton variant="primary" size="md" @click="$emit('close')">
        متوجه شدم
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.ios-install-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.intro-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.steps-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: var(--font-size-xs);
}

.step-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.5;
}
</style>
