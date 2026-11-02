<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CloudRestoreMode } from '@/domain/entities/CloudSync';
import { CloudSyncError, toUserMessage } from '@/infrastructure/cloud/CloudSyncError';
import { formatDateTimeFa } from '@/infrastructure/cloud/cloudFormat';
import { useAppLockStore } from '@/presentation/stores/useAppLockStore';
import { useCloudSyncStore } from '@/presentation/stores/useCloudSyncStore';
import { usePersianCalendar } from '@/presentation/composables/usePersianCalendar';
import AppModal from '@/presentation/components/common/AppModal.vue';
import AppButton from '@/presentation/components/common/AppButton.vue';
import AppInput from '@/presentation/components/common/AppInput.vue';
import AppIcon from '@/presentation/components/common/AppIcon.vue';

const emit = defineEmits<{
  (e: 'toast', message: string, type?: 'success' | 'warning' | 'danger' | 'info'): void;
}>();

const store = useCloudSyncStore();
const appLockStore = useAppLockStore();
const { localizeDigits } = usePersianCalendar();

const decision = computed(() => store.snapshot.decision);
const isOpen = computed(() => Boolean(decision.value && !decision.value.dismissed && !appLockStore.isLocked));

const mode = ref<CloudRestoreMode>('replace');
const passphrase = ref('');
const errorText = ref('');
const isWorking = ref(false);
const passphraseRequested = ref(false);

const needsPassphrase = computed(
  () => passphraseRequested.value || (!!decision.value?.remoteEncrypted && !store.snapshot.encryptionEnabled)
);

const title = computed(() => {
  switch (decision.value?.kind) {
    case 'conflict':
      return 'تفاوت بین دیتای این دستگاه و Google Drive';
    case 'remote-only':
      return 'پشتیبان ابری پیدا شد';
    default:
      return 'نسخه‌ی جدیدتری در Google Drive هست';
  }
});

const description = computed(() => {
  switch (decision.value?.kind) {
    case 'conflict':
      return 'هم این دستگاه و هم نسخه‌ی ابری از آخرین همگام‌سازی تغییر کرده‌اند. یکی از گزینه‌های زیر را انتخاب کنید.';
    case 'remote-only':
      return 'این دستگاه هنوز داده‌ای ندارد، اما در Google Drive شما نسخه‌ی پشتیبان موجود است. مایل به بازیابی هستید؟';
    default:
      return 'دیتای این دستگاه تغییری نکرده است و نسخه‌ی ابری (احتمالاً از دستگاه دیگر) جدیدتر است.';
  }
});

watch(
  () => decision.value?.remote.id,
  () => {
    mode.value = decision.value?.kind === 'conflict' ? 'merge' : 'replace';
    passphrase.value = '';
    errorText.value = '';
    passphraseRequested.value = false;
  },
  { immediate: true }
);

async function handleRestore() {
  errorText.value = '';
  isWorking.value = true;
  try {
    await store.resolveRestore(mode.value, needsPassphrase.value ? passphrase.value : undefined);
    emit('toast', 'داده‌ها با موفقیت از Google Drive بازیابی شد.', 'success');
  } catch (error) {
    if (
      error instanceof CloudSyncError &&
      (error.code === 'PASSPHRASE_REQUIRED' || error.code === 'PASSPHRASE_INVALID')
    ) {
      passphraseRequested.value = true;
      errorText.value = error.message;
    } else {
      errorText.value = toUserMessage(error);
    }
  } finally {
    isWorking.value = false;
  }
}

async function handleKeepLocal() {
  errorText.value = '';
  isWorking.value = true;
  try {
    await store.resolveKeepLocal();
    emit('toast', 'دیتای این دستگاه در Google Drive ذخیره شد.', 'success');
  } catch (error) {
    errorText.value = toUserMessage(error);
  } finally {
    isWorking.value = false;
  }
}
</script>

<template>
  <AppModal
    :is-open="isOpen"
    :title="title"
    @close="store.dismissDecision()"
  >
    <div v-if="decision" class="conflict-modal-body">
      <div class="conflict-intro">
        <div class="intro-icon-wrap">
          <AppIcon name="download" size="20" class="text-accent" />
        </div>
        <p class="intro-desc">{{ description }}</p>
      </div>

      <!-- مقایسه وضعیت ابری و محلی -->
      <div class="comparison-panel">
        <div class="comp-row">
          <span class="comp-label">تاریخ آخرین نسخه ابری:</span>
          <span class="comp-val font-num">{{ localizeDigits(formatDateTimeFa(decision.remote.modifiedTime)) }}</span>
        </div>
        <div class="comp-row">
          <span class="comp-label">تعداد اهداف و عادات در Drive:</span>
          <span class="comp-val text-accent font-num">{{ localizeDigits(decision.remoteItemsCount) }}</span>
        </div>
        <div class="comp-row">
          <span class="comp-label">تعداد اهداف و عادات این دستگاه:</span>
          <span class="comp-val font-num">{{ localizeDigits(decision.localItemsCount) }}</span>
        </div>
        <div class="comp-row">
          <span class="comp-label">نوع رمزنگاری فایل ابری:</span>
          <span class="comp-val">{{ decision.remoteEncrypted ? 'AES-GCM (رمزشده)' : 'ندارد (ساده)' }}</span>
        </div>
      </div>

      <!-- گذرواژه در صورت رمزشده بودن -->
      <div v-if="needsPassphrase" class="passphrase-section">
        <AppInput
          v-model="passphrase"
          type="password"
          label="گذرواژه رمزگشایی فایل پشتیبان ابری"
          placeholder="گذرواژه‌ای که هنگام ایجاد نسخه تعیین کردید..."
          required
        />
      </div>

      <!-- انتخاب نحوه بازیابی -->
      <div class="restore-mode-section">
        <label class="section-label">نحوه اعمال نسخه ابری:</label>
        <div class="mode-options-grid">
          <label
            :class="['mode-card', mode === 'merge' ? 'mode-active-merge' : '']"
          >
            <input v-model="mode" type="radio" value="merge" class="radio-input" />
            <div class="mode-text">
              <strong class="mode-title">ادغام هوشمند (Merge)</strong>
              <span class="mode-desc">نسخه‌ی جدیدتر هر هدف یا عادت باقی می‌ماند و آیتم‌های جدید اضافه می‌شوند.</span>
            </div>
          </label>

          <label
            :class="['mode-card', mode === 'replace' ? 'mode-active-replace' : '']"
          >
            <input v-model="mode" type="radio" value="replace" class="radio-input" />
            <div class="mode-text">
              <strong class="mode-title text-danger">جایگزینی کامل (Replace)</strong>
              <span class="mode-desc">تمام اطلاعات این دستگاه دقیقاً با نسخه‌ی ابری جایگزین می‌شود.</span>
            </div>
          </label>
        </div>
        <p class="rollback-reassurance">
          * نگران نباشید: پیش از هرگونه بازیابی، به صورت خودکار یک اسنپ‌شات محلی از دیتای فعلی ذخیره می‌شود و قابل بازگشت است.
        </p>
      </div>

      <p v-if="errorText" class="error-banner">{{ errorText }}</p>

      <div class="modal-actions-bar">
        <AppButton
          variant="primary"
          size="md"
          :loading="isWorking"
          :disabled="isWorking || (needsPassphrase && passphrase.length === 0)"
          @click="handleRestore"
        >
          <AppIcon name="download" size="18" />
          بازیابی از Google Drive
        </AppButton>

        <AppButton
          v-if="decision.localItemsCount > 0"
          variant="secondary"
          size="md"
          :disabled="isWorking"
          @click="handleKeepLocal"
        >
          نگه‌داشتن دیتای این دستگاه
        </AppButton>

        <AppButton
          variant="outline"
          size="md"
          :disabled="isWorking"
          @click="store.dismissDecision()"
        >
          بعداً
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

<style scoped>
.conflict-modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.conflict-intro {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.intro-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background-color: var(--color-accent-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.intro-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.comparison-panel {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.comp-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
}

.comp-label {
  color: var(--color-text-secondary);
}

.comp-val {
  color: var(--color-text-primary);
  font-weight: 600;
}

.font-num {
  font-feature-settings: 'tnum';
}

.passphrase-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.restore-mode-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.section-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
}

.mode-options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-xs);
}

@media (min-width: 600px) {
  .mode-options-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.mode-card {
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
  cursor: pointer;
  background-color: var(--color-bg-surface);
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
}

.mode-active-merge {
  border-color: var(--color-accent);
  background-color: var(--color-accent-subtle);
}

.mode-active-replace {
  border-color: var(--color-danger);
  background-color: var(--color-danger-subtle);
}

.radio-input {
  margin-top: 3px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.mode-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-title {
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
}

.mode-desc {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.4;
}

.rollback-reassurance {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: var(--line-height-relaxed);
  margin: var(--spacing-xxs) 0 0 0;
}

.error-banner {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  margin: 0;
}

.modal-actions-bar {
  display: flex;
  flex-direction: column-reverse;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-xs);
}

@media (min-width: 600px) {
  .modal-actions-bar {
    flex-direction: row-reverse;
  }
}

.text-accent {
  color: var(--color-accent);
}

.text-danger {
  color: var(--color-danger);
}
</style>
