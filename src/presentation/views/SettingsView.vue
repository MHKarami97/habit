<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useHabitStore } from '../stores/useHabitStore';
import { useReminderStore } from '../stores/useReminderStore';
import { useTheme, ThemeMode } from '../composables/useTheme';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import { JsonBackupService } from '@/infrastructure/export/JsonBackupService';
import { CsvExportService } from '@/infrastructure/export/CsvExportService';
import { WebCryptoAdapter } from '@/infrastructure/crypto/WebCryptoAdapter';
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

const settingsStore = useSettingsStore();
const habitStore = useHabitStore();
const reminderStore = useReminderStore();
const { applyTheme } = useTheme();
const { localizeDigits, effectiveTodayIso } = usePersianCalendar();
const { isInstalled, isInstallable, promptInstall, isIos } = usePwa();

const isWipeModalOpen = ref(false);
const isOnboardingModalOpen = ref(false);
const isIosInstallModalOpen = ref(false);
const isImportModalOpen = ref(false);
const isEncryptModalOpen = ref(false);

const encryptPassword = ref('');
const importFileText = ref('');
const importMode = ref<'merge' | 'replace'>('merge');
const importPreview = ref<any>(null);
const importPassword = ref('');
const isImportEncrypted = ref(false);
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

const handleExportJson = async () => {
  try {
    let json = await JsonBackupService.exportData();
    if (encryptPassword.value.trim()) {
      json = await WebCryptoAdapter.encrypt(json, encryptPassword.value.trim());
      encryptPassword.value = '';
      isEncryptModalOpen.value = false;
    }

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
  reader.onload = e => {
    const content = e.target?.result as string;
    importFileText.value = content;
    isImportEncrypted.value = content.includes('cipherTextHex');
    if (!isImportEncrypted.value) {
      importPreview.value = JsonBackupService.validateAndPreview(content);
    }
    isImportModalOpen.value = true;
  };
  reader.readAsText(file);
};

const handleExecuteImport = async () => {
  try {
    let raw = importFileText.value;
    if (isImportEncrypted.value) {
      if (!importPassword.value) {
        showToast('لطفاً گذرواژه رمزگشایی فایل پشتیبان را وارد کنید.');
        return;
      }
      raw = await WebCryptoAdapter.decrypt(raw, importPassword.value);
    }

    await JsonBackupService.importData(raw, importMode.value);
    isImportModalOpen.value = false;
    importFileText.value = '';
    importPassword.value = '';
    showToast('داده‌های پشتیبان با موفقیت وارد سامانه شدند.');
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

        <AppButton variant="secondary" size="md" @click="isEncryptModalOpen = true">
          <AppIcon name="shield" size="18" />
          دانلود نسخه رمزشده (AES-GCM)
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
        <p class="modal-hint">
          گذرواژه‌ای برای محافظت از فایل پشتیبان وارد نمایید. این فایل با الگوریتم قدرتمند AES-GCM 256-bit رمزنگاری می‌شود.
        </p>
        <AppInput
          v-model="encryptPassword"
          type="password"
          label="گذرواژه محافظ"
          placeholder="حداقل ۶ کاراکتر..."
          required
        />
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="isEncryptModalOpen = false">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" @click="handleExportJson">
          تولید و دانلود فایل رمزشده
        </AppButton>
      </template>
    </AppModal>

    <!-- مودال پیش‌نمایش و تأیید ورود داده -->
    <AppModal :is-open="isImportModalOpen" title="ورود اطلاعات پشتیبان" @close="isImportModalOpen = false">
      <div class="import-modal-body">
        <div v-if="isImportEncrypted" class="encrypted-notice">
          <AppIcon name="shield" size="20" class="text-accent" />
          <p>این فایل دارای رمزگذاری امن است. لطفاً گذرواژه آن را وارد کنید:</p>
          <AppInput
            v-model="importPassword"
            type="password"
            label="گذرواژه فایل"
            placeholder="رمز فایل..."
            required
          />
        </div>

        <div v-else-if="importPreview?.isValid" class="preview-box">
          <h4 class="preview-title">پیش‌نمایش محتوای فایل:</h4>
          <ul>
            <li>تعداد اهداف: {{ localizeDigits(importPreview.goalsCount) }}</li>
            <li>تعداد عادات: {{ localizeDigits(importPreview.habitsCount) }}</li>
            <li>تعداد لاگ‌های ثبت‌شده: {{ localizeDigits(importPreview.habitLogsCount) }}</li>
          </ul>
        </div>

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
      <template #footer>
        <AppButton variant="ghost" size="md" @click="isImportModalOpen = false">
          انصراف
        </AppButton>
        <AppButton variant="primary" size="md" @click="handleExecuteImport">
          ورود اطلاعات
        </AppButton>
      </template>
    </AppModal>

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
</style>
