<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useHabitStore } from '../stores/useHabitStore';
import { useReminderStore } from '../stores/useReminderStore';
import { useTheme, ThemeMode } from '../composables/useTheme';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import { JsonBackupService } from '@/infrastructure/export/JsonBackupService';
import { CsvExportService } from '@/infrastructure/export/CsvExportService';
import { NotificationService } from '@/infrastructure/notifications/NotificationService';
import { ReminderCoordinator } from '@/application/reminders/ReminderCoordinator';
import { IcsExportScheduler } from '@/application/reminders/strategies/IcsExportScheduler';
import { db } from '@/infrastructure/db/AppDatabase';
import { usePwa } from '../composables/usePwa';
import AppButton from '../components/common/AppButton.vue';
import AppInput from '../components/common/AppInput.vue';
import AppSelect from '../components/common/AppSelect.vue';
import AppIcon from '../components/common/AppIcon.vue';
import AppModal from '../components/common/AppModal.vue';
import IosInstallModal from '../components/layout/IosInstallModal.vue';
import OnboardingModal from '../components/onboarding/OnboardingModal.vue';
import StorageManagerCard from '../components/settings/StorageManagerCard.vue';
import PinSetupModal from '../components/security/PinSetupModal.vue';
import { useAppLockStore } from '../stores/useAppLockStore';
import { useI18n, type AppLanguage } from '../i18n/useI18n';

const settingsStore = useSettingsStore();
const habitStore = useHabitStore();
const reminderStore = useReminderStore();
const appLockStore = useAppLockStore();
const { currentLocale, setLocale } = useI18n();
const { applyTheme } = useTheme();
const { localizeDigits, effectiveTodayIso } = usePersianCalendar();
const { isInstalled, isInstallable, promptInstall, isIos } = usePwa();

const languageOptions = [
  { value: 'fa', label: 'فارسی (تقویم خورشیدی و راست‌به‌چپ)' },
  { value: 'en', label: 'English (Gregorian Calendar & LTR)' }
];

const handleLanguageChange = async (val: string) => {
  await setLocale(val as AppLanguage);
  showToast(val === 'fa' ? 'زبان برنامه به فارسی تغییر یافت.' : 'App language changed to English.');
};

const isWipeModalOpen = ref(false);
const isOnboardingModalOpen = ref(false);
const isIosInstallModalOpen = ref(false);
const isImportModalOpen = ref(false);
const isEncryptModalOpen = ref(false);
const isPinModalOpen = ref(false);
const pinModalMode = ref<'setup' | 'change' | 'remove'>('setup');

const encryptPassword = ref('');
const encryptConfirmPassword = ref('');
const encryptError = ref('');
const importFileText = ref('');
const importMode = ref<'merge' | 'replace'>('merge');
const importPreview = ref<any>(null);
const importPassword = ref('');
const isImportEncrypted = ref(false);
const decryptError = ref('');
const isDecryptingPreview = ref(false);
const messageToast = ref('');
const isTestingNotification = ref(false);

const notificationCaps = ref(NotificationService.getCapabilities());

onMounted(async () => {
  await settingsStore.loadSettings();
  notificationCaps.value = NotificationService.getCapabilities();
});

const themeOptions = [
  { value: 'system', label: 'خودکار (مطابق سیستم‌عامل)' },
  { value: 'light', label: 'روشن (پالت سفال گرم)' },
  { value: 'dark', label: 'تاریک (پالت ذغالی گرم)' }
];

const numberFormatOptions = [
  { value: 'persian', label: 'ارقام فارسی (۱۲۳۴۵۶۷۸۹۰)' },
  { value: 'latin', label: 'ارقام انگلیسی (1234567890)' }
];

const endOfDayOptions = [
  { value: '0', label: '۱۲ نیمه‌شب (استاندارد تقویم)' },
  { value: '1', label: '۱ بامداد' },
  { value: '2', label: '۲ بامداد' },
  { value: '3', label: '۳ بامداد' },
  { value: '4', label: '۴ بامداد (ویژه شب‌زنده‌داران)' }
];

const isBackupOverdue = computed(() => {
  return settingsStore.settings.isBackupOverdue(effectiveTodayIso.value);
});

const showToast = (msg: string) => {
  messageToast.value = msg;
  setTimeout(() => {
    messageToast.value = '';
  }, 4000);
};

const handleThemeChange = (newTheme: string) => {
  applyTheme(newTheme as ThemeMode);
  settingsStore.updateSettings({ theme: newTheme as ThemeMode });
};

const handleNumberFormatChange = (newFormat: string) => {
  settingsStore.updateSettings({ numberFormat: newFormat as 'persian' | 'latin' });
};

const handleEndOfDayChange = (newHour: string) => {
  settingsStore.updateSettings({ endOfDayHour: Number(newHour) });
};

const handleTestNotification = async () => {
  isTestingNotification.value = true;
  try {
    const success = await NotificationService.showTestNotification();
    if (success) {
      showToast('اعلان آزمایشی با موفقیت ارسال شد.');
    } else {
      showToast('دسترسی اعلان رد شده است یا در این محیط پشتیبانی نمی‌شود.');
    }
  } finally {
    isTestingNotification.value = false;
    notificationCaps.value = NotificationService.getCapabilities();
    reminderStore.refreshCapabilities();
  }
};

const handleDownloadAllHabitsIcs = async () => {
  await habitStore.loadHabits();
  const activeHabits = habitStore.habits.filter(h => !h.isArchived && !h.isPaused);
  if (activeHabits.length === 0) {
    showToast('عادت فعالی برای صدور تقویم یافت نشد.');
    return;
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kavosh Habit Goal//FA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const habit of activeHabits) {
    const habitRecord = await db.habits.get(habit.id);
    if (habitRecord) {
      const { icsContent } = ReminderCoordinator.getInstance().generateHabitIcs(habitRecord);
      const eventPart = icsContent.split('BEGIN:VEVENT')[1]?.split('END:VEVENT')[0];
      if (eventPart) {
        lines.push('BEGIN:VEVENT' + eventPart + 'END:VEVENT');
      }
    }
  }

  lines.push('END:VCALENDAR');
  const fullIcs = lines.join('\r\n');
  IcsExportScheduler.downloadIcsFile('kavosh-all-habits.ics', fullIcs);
  showToast('فایل تقویم تمام عادات با موفقیت دانلود شد.');
};

const openPinSetupModal = (mode: 'setup' | 'change' | 'remove') => {
  pinModalMode.value = mode;
  isPinModalOpen.value = true;
};

const handleTimeoutChange = async (event: Event) => {
  const select = event.target as HTMLSelectElement;
  await settingsStore.updateSettings({ lockTimeoutMinutes: parseInt(select.value, 10) });
  showToast('زمان قفل خودکار به‌روزرسانی شد.');
};

const handleExportJson = async () => {
  try {
    const json = await JsonBackupService.exportData();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kavosh-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    await settingsStore.updateSettings({ lastBackupDate: new Date().toISOString() });
    showToast('فایل پشتیبان با موفقیت دانلود شد.');
  } catch (err: any) {
    showToast(`خطا در صدور پشتیبان: ${err?.message}`);
  }
};

const handleOpenEncryptModal = () => {
  encryptPassword.value = '';
  encryptConfirmPassword.value = '';
  encryptError.value = '';
  isEncryptModalOpen.value = true;
};

const handleConfirmEncryptExport = async () => {
  encryptError.value = '';
  if (!encryptPassword.value || encryptPassword.value.length < 6) {
    encryptError.value = 'گذرواژه باید حداقل ۶ کاراکتر باشد.';
    return;
  }
  if (encryptPassword.value !== encryptConfirmPassword.value) {
    encryptError.value = 'تکرار گذرواژه با گذرواژه واردشده یکسان نیست.';
    return;
  }

  try {
    const json = await JsonBackupService.exportData(encryptPassword.value);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kavosh-backup-encrypted-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    isEncryptModalOpen.value = false;
    encryptPassword.value = '';
    encryptConfirmPassword.value = '';
    await settingsStore.updateSettings({ lastBackupDate: new Date().toISOString() });
    showToast('فایل پشتیبان رمزنگاری‌شده (AES-GCM ۲۵۶ بیتی) با موفقیت دانلود شد.');
  } catch (err: any) {
    encryptError.value = `خطا در رمزنگاری: ${err?.message}`;
  }
};

const handleExportGoalsCsv = async () => {
  try {
    const csv = await CsvExportService.exportGoalsCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kavosh-goals-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('خروجی اکسل/CSV اهداف با موفقیت دریافت شد.');
  } catch (err: any) {
    showToast(`خطا در صدور CSV اهداف: ${err?.message}`);
  }
};

const handleExportHabitsCsv = async () => {
  try {
    const csv = await CsvExportService.exportHabitsCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kavosh-habits-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('خروجی اکسل/CSV عادات با موفقیت دریافت شد.');
  } catch (err: any) {
    showToast(`خطا در صدور CSV عادات: ${err?.message}`);
  }
};

const handleInstallClick = async () => {
  if (isIos()) {
    isIosInstallModalOpen.value = true;
  } else if (isInstallable.value) {
    await promptInstall();
  } else {
    showToast('امکان نصب خودکار در مرورگر فعلی فراهم نیست. لطفاً از منوی مرورگر Add to Home Screen را بزنید.');
  }
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async e => {
    const content = e.target?.result as string;
    importFileText.value = content;
    isImportEncrypted.value = JsonBackupService.isEncrypted(content);
    importPassword.value = '';
    decryptError.value = '';

    const preview = await JsonBackupService.validateAndPreview(content);
    importPreview.value = preview;
    isImportModalOpen.value = true;
    input.value = '';
  };
  reader.readAsText(file);
};

const handleDecryptPreview = async () => {
  if (!importPassword.value.trim()) {
    decryptError.value = 'لطفاً گذرواژه بازگشایی را وارد کنید.';
    return;
  }

  isDecryptingPreview.value = true;
  decryptError.value = '';
  try {
    const preview = await JsonBackupService.validateAndPreview(
      importFileText.value,
      importPassword.value.trim()
    );
    if (!preview.isValid) {
      decryptError.value = preview.errorMessage || 'گذرواژه نادرست است یا فایل آسیب دیده است.';
    } else {
      importPreview.value = preview;
    }
  } catch (err: any) {
    decryptError.value = err?.message || 'خطا در رمزگشایی فایل';
  } finally {
    isDecryptingPreview.value = false;
  }
};

const handleExecuteImport = async () => {
  try {
    await JsonBackupService.importData(
      importFileText.value,
      importMode.value,
      isImportEncrypted.value ? importPassword.value.trim() : undefined
    );
    isImportModalOpen.value = false;
    importFileText.value = '';
    importPassword.value = '';
    showToast('اطلاعات پشتیبان با موفقیت بازیابی شدند.');
    setTimeout(() => window.location.reload(), 1000);
  } catch (err: any) {
    showToast(`خطا در ورود داده: ${err?.message}`);
  }
};

const handleWipeData = async () => {
  await settingsStore.wipeAllData();
  isWipeModalOpen.value = false;
  showToast('تمام اطلاعات با موفقیت پاک‌سازی شدند.');
  setTimeout(() => window.location.reload(), 1000);
};
</script>

<template>
  <div class="settings-view-container">
    <!-- پیام اعلان موفقیت / خطا -->
    <div v-if="messageToast" class="toast-floating-banner animate-slide-up">
      {{ messageToast }}
    </div>

    <!-- هشدار نیاز به پشتیبان‌گیری دوره‌ای -->
    <div v-if="isBackupOverdue" class="backup-overdue-alert">
      <AppIcon name="alert" size="18" />
      <div>
        <strong>بیش از ۳۰ روز از آخرین نسخه پشتیبان گذشته است!</strong>
        <p>به دلیل ذخیره‌سازی محلی روی این مرورگر، توصیه می‌شود هم‌اکنون از داده‌های خود خروجی بگیرید.</p>
      </div>
    </div>

    <!-- بخش ظاهر و رابط کاربری -->
    <section class="settings-card">
      <h3 class="card-heading">ظاهر و زبان</h3>
      <div class="fields-list">
        <AppSelect
          :model-value="currentLocale"
          :options="languageOptions"
          label="زبان برنامه / Language"
          @update:model-value="handleLanguageChange"
        />

        <AppSelect
          :model-value="settingsStore.settings.theme"
          :options="themeOptions"
          label="پوسته نمایشی"
          @update:model-value="handleThemeChange"
        />

        <AppSelect
          :model-value="settingsStore.settings.numberFormat"
          :options="numberFormatOptions"
          label="نوع نمایش ارقام"
          @update:model-value="handleNumberFormatChange"
        />

        <AppSelect
          :model-value="String(settingsStore.settings.endOfDayHour)"
          :options="endOfDayOptions"
          label="ساعت پایان روز (Cut-off Hour)"
          @update:model-value="handleEndOfDayChange"
        />
      </div>
    </section>

    <!-- بخش اعلان‌ها و یادآورها (معماری چندلایه بدون سرور) -->
    <section class="settings-card">
      <div class="card-header-row">
        <h3 class="card-heading">سیستم یادآورها و اعلان‌ها (معماری چندلایه)</h3>
        <span class="status-pill pill-success">
          استراتژی فعال: {{ reminderStore.preferredScheduler === 'notification_trigger' ? 'اعلان سیستمی' : 'یادآور درون‌برنامه' }}
        </span>
      </div>

      <p class="section-notice">
        <strong>شفاف‌سازی معماری و محدودیت‌ها:</strong> کاوش ۱۰۰٪ کلاینت‌محور است و فاقد هرگونه سرور ابری است. مرورگرهای موبایل (به‌ویژه سافاری در iOS و کروم در اندروید با حالت صرفه‌جویی باتری) در صورت بسته شدن کامل برنامه، سرویس‌ورکر را تعلیق می‌کنند. از این رو، سه استراتژی موازی برای شما در نظر گرفته شده است:
      </p>

      <div class="scheduler-capabilities-list">
        <div
          v-for="cap in reminderStore.capabilities"
          :key="cap.id"
          class="capability-card"
        >
          <div class="cap-header">
            <div class="cap-title-col">
              <strong class="cap-name">{{ cap.name }}</strong>
              <span v-if="cap.isExperimental" class="badge-experimental">آزمایشی (Experimental)</span>
            </div>
            <span :class="['status-pill', cap.isAvailable ? 'pill-success' : 'pill-muted']">
              {{ cap.isAvailable ? 'آماده / فعال' : 'غیرفعال در این مرورگر' }}
            </span>
          </div>
          <p class="cap-desc">{{ cap.description }}</p>
          <span class="cap-limitations"><strong>محدودیت:</strong> {{ cap.limitations }}</span>
        </div>
      </div>

      <div class="notification-actions-row">
        <AppButton
          variant="secondary"
          size="sm"
          :loading="isTestingNotification"
          @click="handleTestNotification"
        >
          <AppIcon name="clock" size="16" />
          آزمایش ارسال اعلان مرورگر
        </AppButton>

        <AppButton
          variant="primary"
          size="sm"
          @click="handleDownloadAllHabitsIcs"
        >
          <AppIcon name="download" size="16" />
          دریافت فایل تقویم همه عادات (.ics)
        </AppButton>
      </div>
    </section>

    <!-- بخش سهمیه حافظه، ماندگاری داده‌ها، سلامت IndexedDB و بنچ‌مارک ۵۰K لاگ -->
    <StorageManagerCard />

    <!-- بخش پشتیبان‌گیری و خروجی داده -->
    <section class="settings-card">
      <h3 class="card-heading">ورود و خروج داده‌ها</h3>
      <p class="section-notice">
        تمام اهداف، عادات، لاگ‌ها و موانع خود را به صورت فایل استاندارد JSON ذخیره کنید تا در هر دستگاه دیگر قابل بازیابی باشد، یا از خروجی سازگار با اکسل (CSV UTF-8) بهره ببرید.
      </p>

      <div class="backup-buttons-row">
        <AppButton variant="primary" size="md" @click="handleExportJson">
          <AppIcon name="download" size="18" />
          دانلود نسخه پشتیبان کامل (JSON)
        </AppButton>

        <AppButton variant="secondary" size="md" @click="handleOpenEncryptModal">
          <AppIcon name="shield" size="18" />
          دانلود نسخه رمزشده (AES-GCM ۲۵۶)
        </AppButton>

        <label class="file-import-label">
          <AppIcon name="upload" size="18" />
          <span>بارگذاری فایل پشتیبان</span>
          <input type="file" accept=".json" class="hidden-input" @change="handleFileSelect" />
        </label>
      </div>

      <div class="csv-export-row">
        <AppButton variant="outline" size="sm" @click="handleExportGoalsCsv">
          <AppIcon name="download" size="16" />
          خروجی اکسل/CSV اهداف
        </AppButton>
        <AppButton variant="outline" size="sm" @click="handleExportHabitsCsv">
          <AppIcon name="download" size="16" />
          خروجی اکسل/CSV عادات و لاگ‌ها
        </AppButton>
      </div>
    </section>

    <!-- امنیت و قفل ورود به برنامه (PIN Lock) -->
    <section class="settings-card">
      <div class="card-header-with-badge">
        <h3 class="card-heading">قفل ورود به برنامه (PIN) و امنیت نشست</h3>
        <span :class="['status-pill', appLockStore.isPinConfigured ? 'pill-success' : 'pill-muted']">
          {{ appLockStore.isPinConfigured ? 'قفل فعال است' : 'قفل غیرفعال است' }}
        </span>
      </div>

      <p class="section-notice">
        می‌توانید برای جلوگیری از مشاهده اطلاعات توسط دیگران در مواقعی که دستگاه باز است، یک رمز عددی ۴ تا ۶ رقمی برای ورود به کاوش تعیین کنید.
      </p>

      <!-- هشدار و تبیین صادقانه سطح امنیت -->
      <div class="privacy-disclaimer-alert">
        <div class="disclaimer-header">
          <AppIcon name="alert-triangle" size="18" />
          <span>توضیح صادقانه درباره سطح امنیت قفل PIN</span>
        </div>
        <p class="disclaimer-body">
          توجه داشته باشید که این قفل صرفاً حفاظت سطحی (Privacy Screen) در برابر نگاه دیگران است و امنیت واقعی داده‌های ذخیره‌شده روی حافظه دستگاه نیست، مگر آنکه داده‌ها در IndexedDB نیز رمزگذاری شوند. رمزگذاری بلادرنگ کل داده‌های محلی به دلیل هزینه‌ی عملکردی بالا (افت سرعت کوئری‌ها) و خطر غیرقابل بازیابی شدن دائمی داده‌ها در صورت فراموشی کلید، به صورت پیش‌فرض فعال نشده است.
        </p>
      </div>

      <!-- کنترل‌های پین -->
      <div class="pin-controls-container">
        <div v-if="!appLockStore.isPinConfigured" class="pin-action-buttons">
          <AppButton variant="primary" size="md" @click="openPinSetupModal('setup')">
            <AppIcon name="lock" size="18" />
            فعال‌سازی قفل با PIN
          </AppButton>
        </div>

        <div v-else class="pin-active-settings">
          <div class="pin-timeout-row">
            <label class="setting-label">زمان قفل خودکار پس از خروج یا عدم فعالیت:</label>
            <select
              :value="String(settingsStore.settings.lockTimeoutMinutes)"
              class="timeout-select"
              @change="handleTimeoutChange"
            >
              <option value="0">بلافاصله پس از رفتن به پس‌زمینه یا بستن</option>
              <option value="1">پس از ۱ دقیقه عدم فعالیت</option>
              <option value="5">پس از ۵ دقیقه عدم فعالیت</option>
              <option value="15">پس از ۱۵ دقیقه عدم فعالیت</option>
            </select>
          </div>

          <div class="pin-buttons-grid">
            <AppButton variant="secondary" size="sm" @click="openPinSetupModal('change')">
              <AppIcon name="edit" size="16" />
              تغییر پین ورود
            </AppButton>

            <AppButton variant="outline" size="sm" @click="appLockStore.lock()">
              <AppIcon name="lock" size="16" />
              قفل کردن اکنون برنامه
            </AppButton>

            <AppButton variant="danger" size="sm" @click="openPinSetupModal('remove')">
              <AppIcon name="trash" size="16" />
              غیرفعال‌سازی قفل PIN
            </AppButton>
          </div>
        </div>
      </div>
    </section>

    <!-- نصب و راه‌اندازی PWA -->
    <section class="settings-card">
      <h3 class="card-heading">نصب نرم‌افزار (PWA)</h3>
      <p class="section-notice">
        کاوش یک Progressive Web App است. با افزودن آن به صفحه اصلی دستگاه خود، از باز شدن سریع، تجربه تمام‌صفحه و کارکرد بی‌وقفه آفلاین لذت ببرید.
      </p>
      <div class="pwa-status-box">
        <div class="pwa-status-row">
          <span>وضعیت نصب در این دستگاه:</span>
          <span :class="['status-pill', isInstalled ? 'pill-success' : 'pill-muted']">
            {{ isInstalled ? 'نصب‌شده روی صفحه اصلی' : 'در حال اجرا در مرورگر' }}
          </span>
        </div>
      </div>
      <div class="guide-actions-row">
        <AppButton v-if="!isInstalled" variant="secondary" size="sm" @click="handleInstallClick">
          <AppIcon name="download" size="16" />
          {{ isIos() ? 'راهنمای نصب روی آیفون/آیپد' : 'نصب مستقیم روی دستگاه' }}
        </AppButton>
      </div>
    </section>

    <!-- راهنما و معارفه -->
    <section class="settings-card">
      <h3 class="card-heading">معارفه و راهنما</h3>
      <div class="guide-actions-row">
        <AppButton variant="secondary" size="sm" @click="isOnboardingModalOpen = true">
          مشاهده دوباره راهنمای معارفه کاوش
        </AppButton>
      </div>
    </section>

    <!-- حریم خصوصی و امنیت داده‌ها -->
    <section class="settings-card">
      <h3 class="card-heading">حریم خصوصی و معماری ۱۰۰٪ محلی</h3>
      <div class="privacy-notice-box">
        <AppIcon name="shield" size="24" class="text-accent" />
        <div class="privacy-text">
          <strong>داده‌های شما فقط و فقط روی دستگاه شما ذخیره می‌شوند.</strong>
          <p>
            این برنامه فاقد هرگونه سرور پشتیبان، پایگاه داده ابری، سیستم لاگین یا ابزار تحلیلی و ردیابی (Analytics/Tracking) است. هیچ داده‌ای به هیچ سرور خارجی فرستاده نمی‌شود. در صورت پاک کردن کش مرورگر، اطلاعات از بین می‌روند؛ بنابراین توصیه می‌شود هر ۳۰ روز یک‌بار نسخه پشتیبان JSON دانلود کنید.
          </p>
        </div>
      </div>
    </section>

    <!-- درباره سازنده -->
    <section class="settings-card">
      <h3 class="card-heading">درباره کاوش</h3>
      <div class="about-content">
        <p>
          سامانه «کاوش» یک نرم‌افزار تحت وب پیشرونده (PWA) کلاینت‌محور است که با هدف ارتقای شفافیت اهداف و پایداری عادات برای فارسی‌زبانان طراحی شده است.
        </p>
        <p>
          <strong>نسخه:</strong> ۱.۰.۰ (فاز ۱)<br />
          <strong>توسعه‌دهنده:</strong> محمدحسن کرمی<br />
          <strong>وب‌سایت شخصی:</strong>
          <a href="https://mhkarami97.ir" target="_blank" rel="noopener noreferrer" class="link-author">
            mhkarami97.ir
          </a>
        </p>
      </div>
    </section>

    <!-- منطقه خطر (Danger Zone) -->
    <section class="settings-card card-danger-zone">
      <h3 class="card-heading text-danger">منطقه حساس</h3>
      <p class="section-notice">
        پاک‌سازی کل اطلاعات دیتابیس دستگاه. این اقدام غیرقابل بازگشت است.
      </p>
      <AppButton variant="danger" size="md" @click="isWipeModalOpen = true">
        <AppIcon name="trash" size="18" />
        پاک‌کردن کل داده‌های برنامه
      </AppButton>
    </section>

    <!-- مودال تأیید حذف دو مرحله‌ای -->
    <AppModal :is-open="isWipeModalOpen" title="تأیید پاک‌سازی داده‌ها" @close="isWipeModalOpen = false">
      <div class="wipe-modal-body">
        <AppIcon name="alert" size="32" class="text-danger" />
        <p>
          آیا کاملاً مطمئن هستید؟ تمامی اهداف، عادات، لاگ‌ها و تاریخچه‌های ثبت‌شده برای همیشه از روی این مرورگر حذف خواهند شد و قابل بازیابی نخواهند بود (مگر آنکه قبلاً نسخه پشتیبان تهیه کرده باشید).
        </p>
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="isWipeModalOpen = false">
          انصراف
        </AppButton>
        <AppButton variant="danger" size="md" @click="handleWipeData">
          بله، همه داده‌ها پاک شود
        </AppButton>
      </template>
    </AppModal>

    <!-- مودال رمزگذاری پشتیبان -->
    <AppModal :is-open="isEncryptModalOpen" title="رمزگذاری نسخه پشتیبان" @close="isEncryptModalOpen = false">
      <div class="encrypt-modal-body">
        <div class="crypto-specs-box">
          <div class="crypto-specs-header">
            <AppIcon name="shield" size="18" />
            <span>استاندارد رمزنگاری: AES-GCM 256-bit + PBKDF2</span>
          </div>
          <p class="crypto-specs-desc">
            این فایل طبق استانداردهای امنیتی <strong>NIST SP 800-132</strong> و <strong>OWASP</strong> با ۲۵۰,۰۰۰ دور مشتق‌سازی کلید PBKDF2 و الگوریتم AES-GCM ۲۵۶ بیتی رمزگذاری می‌شود.
          </p>
        </div>

        <div class="password-loss-warning">
          <AppIcon name="alert-triangle" size="20" class="text-danger" />
          <p>
            <strong>هشدار بسیار مهم:</strong> گذرواژه در هیچ سرور یا دیتابیسی ذخیره نمی‌شود. در صورت فراموشی این گذرواژه، داده‌های این فایل به هیچ عنوان قابل بازیابی نخواهند بود!
          </p>
        </div>

        <div v-if="encryptError" class="encrypt-error-alert" role="alert">
          <AppIcon name="alert-triangle" size="16" />
          <span>{{ encryptError }}</span>
        </div>

        <AppInput
          v-model="encryptPassword"
          type="password"
          label="گذرواژه امن (حداقل ۶ کاراکتر)"
          placeholder="گذرواژه..."
          required
        />

        <AppInput
          v-model="encryptConfirmPassword"
          type="password"
          label="تکرار گذرواژه"
          placeholder="تکرار گذرواژه..."
          required
        />
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="isEncryptModalOpen = false">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" @click="handleConfirmEncryptExport">
          تولید و دانلود فایل رمزشده
        </AppButton>
      </template>
    </AppModal>

    <!-- مودال پیش‌نمایش و تأیید ورود داده -->
    <AppModal :is-open="isImportModalOpen" title="ورود اطلاعات پشتیبان" @close="isImportModalOpen = false">
      <div class="import-modal-body">
        <!-- اگر فایل رمزشده است و هنوز رمزگشایی نشده -->
        <div v-if="isImportEncrypted && (!importPreview || !importPreview.isValid)" class="encrypted-notice">
          <div class="encrypted-header">
            <AppIcon name="lock" size="24" class="text-accent" />
            <div>
              <strong>فایل پشتیبان رمزگذاری‌شده است</strong>
              <p class="encrypted-subtext">این فایل با استاندارد AES-GCM رمزنگاری شده است. لطفاً گذرواژه بازگشایی را وارد کنید:</p>
            </div>
          </div>

          <div v-if="decryptError" class="encrypt-error-alert" role="alert">
            <AppIcon name="alert-triangle" size="16" />
            <span>{{ decryptError }}</span>
          </div>

          <div class="decrypt-row">
            <AppInput
              v-model="importPassword"
              type="password"
              label="گذرواژه فایل پشتیبان"
              placeholder="رمز عبور..."
              required
            />
            <AppButton variant="secondary" size="md" :loading="isDecryptingPreview" @click="handleDecryptPreview">
              رمزگشایی و بررسی
            </AppButton>
          </div>
        </div>

        <!-- پیش‌نمایش محتوا پس از رمزگشایی یا برای فایل‌های عادی -->
        <div v-else-if="importPreview?.isValid" class="preview-box">
          <div class="preview-header">
            <AppIcon name="check" size="20" class="text-success" />
            <h4 class="preview-title">پیش‌نمایش محتوای تاییدشده فایل:</h4>
          </div>
          <ul class="preview-stats-list">
            <li>تعداد اهداف: <strong>{{ localizeDigits(importPreview.goalsCount) }}</strong></li>
            <li>تعداد عادات: <strong>{{ localizeDigits(importPreview.habitsCount) }}</strong></li>
            <li>تعداد لاگ‌های عادت: <strong>{{ localizeDigits(importPreview.habitLogsCount) }}</strong></li>
            <li v-if="importPreview.userTemplatesCount > 0">
              تعداد قالب‌های شخصی: <strong>{{ localizeDigits(importPreview.userTemplatesCount) }}</strong>
            </li>
            <li v-if="importPreview.periodicReviewsCount > 0">
              تعداد بازبینی‌های دوره‌ای: <strong>{{ localizeDigits(importPreview.periodicReviewsCount) }}</strong>
            </li>
          </ul>

          <div class="mode-selection">
            <label class="mode-label">شیوه اعمال داده‌ها:</label>
            <div class="radio-row">
              <label class="radio-item">
                <input v-model="importMode" type="radio" value="merge" />
                <span>ادغام با داده‌های فعلی (Merge)</span>
              </label>
              <label class="radio-item">
                <input v-model="importMode" type="radio" value="replace" />
                <span class="text-danger">جایگزینی کامل (حذف داده‌های پیشین)</span>
              </label>
            </div>
          </div>
        </div>

        <div v-else class="import-error-box">
          <AppIcon name="alert-triangle" size="20" class="text-danger" />
          <span>{{ importPreview?.errorMessage || 'فایل نامعتبر است' }}</span>
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="isImportModalOpen = false">
          انصراف
        </AppButton>
        <AppButton
          v-if="importPreview?.isValid"
          variant="primary"
          size="md"
          @click="handleExecuteImport"
        >
          ورود اطلاعات
        </AppButton>
      </template>
    </AppModal>

    <!-- مودال مدیریت و تنظیم PIN -->
    <PinSetupModal
      :is-open="isPinModalOpen"
      :mode="pinModalMode"
      @close="isPinModalOpen = false"
      @success="showToast(pinModalMode === 'remove' ? 'قفل PIN با موفقیت غیرفعال شد.' : 'پین ورود با موفقیت ذخیره شد.')"
    />

    <!-- مودال معارفه مجدد -->
    <OnboardingModal
      :is-open="isOnboardingModalOpen"
      @close="isOnboardingModalOpen = false"
    />

    <!-- راهنمای گام‌به‌گام نصب در iOS -->
    <IosInstallModal
      :is-open="isIosInstallModalOpen"
      @close="isIosInstallModalOpen = false"
    />
  </div>
</template>

<style scoped>
.settings-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
}

.toast-floating-banner {
  position: fixed;
  top: var(--spacing-lg);
  left: var(--spacing-md);
  right: var(--spacing-md);
  max-width: 450px;
  margin: 0 auto;
  background-color: var(--color-accent);
  color: #ffffff;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-weight: 600;
  font-size: var(--font-size-sm);
  z-index: 200;
  text-align: center;
}

.backup-overdue-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  background-color: var(--color-warning-subtle);
  border: var(--border-width-regular) solid var(--color-warning);
  color: var(--color-warning);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
}

.settings-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.card-heading {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text-primary);
}

.section-notice {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.scheduler-capabilities-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.capability-card {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.cap-title-col {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.cap-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.badge-experimental {
  font-size: 10px;
  font-weight: 700;
  background-color: var(--color-warning-subtle);
  color: var(--color-warning);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
}

.cap-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.cap-limitations {
  font-size: 11px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.notification-actions-row {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-top: var(--spacing-xs);
}

.text-success {
  color: var(--color-success);
}
.text-danger {
  color: var(--color-danger);
}
.text-muted {
  color: var(--color-text-muted);
}

.storage-info-box {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-surface-soft);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.storage-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.pill-success {
  background-color: var(--color-success-subtle);
  color: var(--color-success);
}
.pill-muted {
  background-color: var(--color-bg-surface-elevated);
  color: var(--color-text-muted);
}

.backup-buttons-row {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.file-import-label {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-md);
  min-height: var(--touch-target-min);
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-regular) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.file-import-label:hover {
  background-color: var(--color-border-subtle);
}

.hidden-input {
  display: none;
}

.about-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.link-author {
  color: var(--color-accent);
  font-weight: 700;
  text-decoration: underline;
}

.card-danger-zone {
  border-color: var(--color-danger);
  background-color: var(--color-bg-surface);
}

.wipe-modal-body, .encrypt-modal-body, .import-modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.preview-box {
  background-color: var(--color-bg-surface-soft);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.preview-title {
  font-size: var(--font-size-xs);
  font-weight: 700;
  margin-bottom: var(--spacing-xxs);
}

.preview-box ul {
  padding-right: var(--spacing-md);
  font-size: var(--font-size-xs);
}

.mode-selection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.mode-label {
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.radio-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.radio-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-size-xs);
}

.csv-export-row {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: var(--border-width-hairline) dashed var(--color-border-subtle);
}

.pwa-status-box {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  font-size: var(--font-size-sm);
  background-color: var(--color-bg-surface-soft);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
}

.pwa-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.privacy-notice-box {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-accent);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.privacy-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.privacy-text strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.card-header-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.privacy-disclaimer-alert {
  background: var(--color-bg-hover, #fdf8f5);
  border: 1px solid var(--color-border, #f0dfd5);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  margin: var(--spacing-xs) 0;
}

.privacy-disclaimer-alert .disclaimer-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary, #d2532a);
  font-weight: 700;
  font-size: var(--font-size-xs);
  margin-bottom: var(--spacing-xxs);
}

.privacy-disclaimer-alert .disclaimer-body {
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0;
}

.pin-controls-container {
  margin-top: var(--spacing-xs);
}

.pin-action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.pin-active-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.pin-timeout-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
}

.timeout-select {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border, #e5ded8);
  background: var(--color-card, #ffffff);
  color: var(--color-text-main, #201a18);
  font-size: var(--font-size-sm);
}

.pin-buttons-grid {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.crypto-specs-box {
  background: var(--color-bg-surface-soft, #f4efe9);
  border: 1px solid var(--color-border-subtle, #e5ded8);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.crypto-specs-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 700;
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xxs);
}

.crypto-specs-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.password-loss-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  background: #fde8e8;
  border: 1px solid #f8b4b4;
  color: var(--color-danger, #d32f2f);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  line-height: 1.5;
  margin-bottom: var(--spacing-sm);
}

.password-loss-warning p {
  margin: 0;
}

.encrypt-error-alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: #fde8e8;
  color: var(--color-danger, #d32f2f);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.encrypted-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.encrypted-subtext {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: var(--spacing-xxs) 0 0;
}

.decrypt-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-end;
}

.preview-stats-list {
  list-style: none;
  padding: 0;
  margin: var(--spacing-xs) 0 var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.import-error-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: #fde8e8;
  color: var(--color-danger, #d32f2f);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
</style>
