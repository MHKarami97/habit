<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { CLOUD_CONFIG } from '@/infrastructure/cloud/cloudConfig';
import { toUserMessage } from '@/infrastructure/cloud/CloudSyncError';
import { useCloudSyncStore } from '@/presentation/stores/useCloudSyncStore';
import { usePersianCalendar } from '@/presentation/composables/usePersianCalendar';
import AppButton from '@/presentation/components/common/AppButton.vue';
import AppIcon from '@/presentation/components/common/AppIcon.vue';
import AppInput from '@/presentation/components/common/AppInput.vue';

const emit = defineEmits<{
  (e: 'toast', message: string, type?: 'success' | 'warning' | 'danger' | 'info'): void;
}>();

const store = useCloudSyncStore();
const { localizeDigits } = usePersianCalendar();

const minLength = CLOUD_CONFIG.minPassphraseLength;
const snapshot = computed(() => store.snapshot);
const passphrase = ref('');
const passphraseConfirm = ref('');
const isWorking = ref(false);

onMounted(() => {
  store.preload();
});

const pillClass = computed(() => {
  switch (snapshot.value.status) {
    case 'success':
    case 'idle':
      return snapshot.value.connected ? 'pill-success' : 'pill-muted';
    case 'syncing':
      return 'pill-info animate-pulse';
    case 'needs-reconnect':
    case 'decision-pending':
      return 'pill-warning';
    case 'error':
      return 'pill-danger';
    default:
      return 'pill-muted';
  }
});

async function run(action: () => Promise<void>, successMessage?: string) {
  isWorking.value = true;
  try {
    await action();
    if (successMessage) emit('toast', successMessage, 'success');
  } catch (error) {
    emit('toast', toUserMessage(error), 'danger');
  } finally {
    isWorking.value = false;
  }
}

function handleConnect() {
  return run(() => store.connect(), 'اتصال به Google Drive با موفقیت برقرار شد.');
}

function handleBackupNow() {
  return run(() => store.backupNow(), 'پشتیبان‌گیری در Google Drive انجام شد.');
}

async function handleDisconnect() {
  if (!confirm('اتصال به Google Drive قطع شود؟ پشتیبان‌گیری خودکار متوقف می‌شود.')) return;
  const removeRemote = confirm(
    'آیا نسخه‌های پشتیبان موجود در پوشه مخفی Google Drive هم حذف شوند؟\nتأیید = حذف نسخه‌های ابری، لغو = نگه‌داشتن فایل‌ها در Drive'
  );
  await run(() => store.disconnect(removeRemote), 'اتصال با موفقیت قطع شد.');
}

async function handleEnableEncryption() {
  if (passphrase.value.length < minLength) {
    emit('toast', `رمز عبور باید حداقل ${localizeDigits(minLength)} نویسه باشد.`, 'warning');
    return;
  }
  if (passphrase.value !== passphraseConfirm.value) {
    emit('toast', 'رمز عبور و تکرار آن یکسان نیستند.', 'warning');
    return;
  }
  await run(async () => {
    await store.enableEncryption(passphrase.value);
    passphrase.value = '';
    passphraseConfirm.value = '';
  }, 'رمزنگاری سمت کلاینت با موفقیت فعال شد.');
}

async function handleDisableEncryption() {
  if (!confirm('از این پس پشتیبان‌های ابری بدون رمزنگاری ذخیره می‌شوند. آیا ادامه می‌دهید؟')) return;
  await run(() => store.disableEncryption(), 'رمزنگاری غیرفعال شد.');
}

async function handleRollback() {
  if (!confirm('اطلاعات این دستگاه به وضعیت قبل از آخرین بازیابی ابری بازمی‌گردد. آیا ادامه می‌دهید؟')) return;
  await run(() => store.rollbackLastRestore(), 'داده‌ها به وضعیت پیش از بازیابی برگشت.');
}
</script>

<template>
  <section class="settings-card cloud-backup-card">
    <div class="card-header-with-badge">
      <h3 class="card-heading">
        <AppIcon name="cloud" size="20" class="text-accent" />
        <span>پشتیبان‌گیری خودکار در Google Drive</span>
      </h3>
      <span :class="['status-pill', pillClass]">
        {{ store.statusText }}
      </span>
    </div>

    <p class="section-notice">
      نسخه‌ی پشتیبان در پوشه‌ی مخفی اختصاصی همین برنامه در Google Drive شخصی شما (appDataFolder) ذخیره می‌شود
      و سایر برنامه‌ها به آن دسترسی ندارند. پس از هر تغییر دیتا، پشتیبان‌گیری به صورت خودکار با چند ثانیه تأخیر انجام می‌شود.
    </p>

    <!-- پنل وضعیت و آخرین هماهنگ‌سازی -->
    <div class="cloud-status-panel">
      <div class="status-detail-row">
        <span class="detail-label">وضعیت اتصال:</span>
        <strong class="detail-val">{{ store.statusText }}</strong>
      </div>
      <div v-if="store.isConnected && store.lastSuccessText" class="status-detail-row">
        <span class="detail-label">آخرین پشتیبان موفق:</span>
        <strong class="detail-val">{{ localizeDigits(store.lastSuccessText) }}</strong>
      </div>
      <p v-if="store.isConnected && snapshot.status !== 'error' && snapshot.lastError" class="status-error-hint">
        {{ snapshot.lastError }}
      </p>
    </div>

    <!-- دکمه‌های عملیات اصلی -->
    <div class="cloud-actions-row">
      <AppButton
        v-if="!store.isConnected"
        variant="primary"
        size="md"
        :loading="isWorking"
        @click="handleConnect"
      >
        <AppIcon name="link" size="18" />
        اتصال به Google Drive
      </AppButton>

      <template v-else>
        <AppButton
          v-if="snapshot.status === 'needs-reconnect' || snapshot.status === 'error'"
          variant="secondary"
          size="md"
          :loading="isWorking"
          @click="handleConnect"
        >
          <AppIcon name="refresh" size="18" />
          اتصال دوباره
        </AppButton>

        <AppButton
          v-if="snapshot.decision && snapshot.decision.dismissed"
          variant="secondary"
          size="md"
          @click="store.reopenDecision()"
        >
          <AppIcon name="cloud" size="18" />
          بررسی نسخه‌ی ابری
        </AppButton>

        <AppButton
          variant="primary"
          size="md"
          :loading="isWorking || store.isBusy || !!snapshot.decision"
          @click="handleBackupNow"
        >
          <AppIcon name="refresh" size="18" :class="store.isBusy ? 'icon-spin' : ''" />
          پشتیبان‌گیری همین حالا
        </AppButton>

        <AppButton
          variant="outline"
          size="md"
          :loading="isWorking"
          @click="handleDisconnect"
        >
          <AppIcon name="unlink" size="18" />
          قطع اتصال
        </AppButton>
      </template>
    </div>

    <!-- جعبه رمزنگاری سمت کلاینت (Zero-Knowledge) -->
    <div class="encryption-subpanel">
      <div class="subpanel-title-row">
        <AppIcon name="lock" size="16" class="text-accent" />
        <h4 class="subpanel-title">رمزنگاری سرتاسری اختیاری (Zero-Knowledge Encryption)</h4>
      </div>

      <template v-if="snapshot.encryptionEnabled">
        <div class="encryption-active-box">
          <AppIcon name="shield" size="18" class="text-success" />
          <div>
            <strong class="text-success">رمزنگاری با استاندارد نظامی AES-GCM ۲۵۶ فعال است.</strong>
            <p class="encryption-desc">
              تمام اطلاعات پیش از خروج از دستگاه شما رمز می‌شوند و حتی گوگل نیز به محتوای عادات و اهداف شما دسترسی ندارد.
            </p>
          </div>
        </div>
        <div>
          <button
            type="button"
            :disabled="isWorking"
            class="text-btn danger-link"
            @click="handleDisableEncryption"
          >
            غیرفعال‌سازی رمزنگاری
          </button>
        </div>
      </template>

      <template v-else>
        <p class="encryption-desc">
          بدون رمزنگاری، محتوای فایل به صورت استاندارد ذخیره می‌شود. با فعال‌سازی، فایل‌ها با کلید مشتق‌شده از گذرواژه شما رمزگذاری می‌شوند.
          <strong class="text-danger">توجه: کلید شما روی سرور ذخیره نمی‌شود؛ در صورت فراموشی گذرواژه، پشتیبان ابری هرگز قابل بازیابی نخواهد بود.</strong>
        </p>

        <div class="encryption-inputs-grid">
          <AppInput
            v-model="passphrase"
            type="password"
            :label="`گذرواژه رمزنگاری (حداقل ${localizeDigits(minLength)} نویسه)`"
            placeholder="گذرواژه قوی..."
          />
          <AppInput
            v-model="passphraseConfirm"
            type="password"
            label="تکرار گذرواژه"
            placeholder="تکرار همان گذرواژه..."
          />
        </div>

        <div>
          <AppButton
            variant="secondary"
            size="sm"
            :loading="isWorking"
            :disabled="passphrase.length < minLength || passphrase !== passphraseConfirm"
            @click="handleEnableEncryption"
          >
            <AppIcon name="shield" size="16" />
            فعال‌سازی رمزنگاری
          </AppButton>
        </div>
      </template>
    </div>

    <!-- بخش تنظیم اعلان و بازگشت به عقب -->
    <div class="preferences-subpanel">
      <label class="toggle-checkbox-row">
        <input
          type="checkbox"
          class="checkbox-input"
          :checked="snapshot.notifyFailures"
          @change="store.setNotifyFailures(($event.target as HTMLInputElement).checked)"
        />
        <span>نمایش نوار هشدار پایین صفحه در صورت عدم موفقیت همگام‌سازی (فقط در حالت آنلاین)</span>
      </label>

      <div v-if="snapshot.hasRollbackSnapshot" class="rollback-box">
        <div class="rollback-info">
          <AppIcon name="alert-triangle" size="18" class="text-warning" />
          <span>پیش از آخرین بازیابی ابری، یک نسخه‌ی محلی از دیتای شما ذخیره شده است.</span>
        </div>
        <AppButton
          variant="outline"
          size="sm"
          :loading="isWorking"
          @click="handleRollback"
        >
          <AppIcon name="undo" size="16" />
          بازگرداندن به نسخه پیش از بازیابی
        </AppButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cloud-backup-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card-header-with-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.status-pill {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 3px var(--spacing-sm);
  border-radius: var(--radius-full);
}

.pill-success {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}

.pill-muted {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-muted);
}

.pill-warning {
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
}

.pill-danger {
  background-color: var(--color-danger-subtle);
  color: var(--color-danger);
}

.pill-info {
  background-color: var(--color-info-subtle);
  color: var(--color-info);
}

.cloud-status-panel {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.status-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-xs);
}

.detail-label {
  color: var(--color-text-secondary);
}

.detail-val {
  color: var(--color-text-primary);
  font-weight: 600;
}

.status-error-hint {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  margin: 0;
}

.cloud-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.encryption-subpanel {
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  background-color: var(--color-bg-app);
}

.subpanel-title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.subpanel-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.encryption-active-box {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
}

.encryption-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin: 0;
}

.encryption-inputs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

@media (min-width: 600px) {
  .encryption-inputs-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.preferences-subpanel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-xs);
}

.toggle-checkbox-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
  cursor: pointer;
}

.rollback-box {
  background-color: var(--color-warning-subtle);
  border: var(--border-width-hairline) solid var(--color-warning);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.rollback-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
}

.text-accent {
  color: var(--color-accent);
}

.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}

.text-warning {
  color: var(--color-warning);
}

.text-btn {
  background: none;
  border: none;
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: 0;
}

.danger-link {
  color: var(--color-danger);
  text-decoration: underline;
}

.danger-link:hover {
  opacity: 0.8;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
