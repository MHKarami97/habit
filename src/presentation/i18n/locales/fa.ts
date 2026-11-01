export const fa = {
  // ناوبری و هدر
  nav: {
    today: 'امروز',
    goals: 'اهداف',
    habits: 'عادت‌ها',
    analytics: 'آمار و موانع',
    guide: 'راهنما',
    settings: 'تنظیمات'
  },
  // دکمه‌ها و عملیات عمومی
  common: {
    save: 'ذخیره',
    cancel: 'انصراف',
    edit: 'ویرایش',
    delete: 'حذف',
    confirm: 'تایید',
    close: 'بستن',
    back: 'بازگشت',
    next: 'بعدی',
    search: 'جستجو...',
    download: 'دانلود',
    upload: 'بارگذاری',
    emptyList: 'موردی یافت نشد.',
    loading: 'در حال بارگذاری...',
    all: 'همه',
    active: 'فعال',
    inactive: 'غیرفعال'
  },
  // اهداف
  goals: {
    title: 'اهداف من',
    newGoal: 'هدف جدید',
    hierarchyView: 'نمای درختی',
    kanbanView: 'نمای کانبان',
    cardView: 'نمای کارتی',
    status: {
      draft: 'پیش‌نویس',
      scheduled: 'زمان‌بندی‌شده',
      active: 'در حال پیشرفت',
      paused: 'متوقف‌شده',
      completed: 'تکمیل‌شده',
      abandoned: 'رها‌شده'
    },
    levels: {
      annual: 'هدف سالانه',
      quarterly: 'هدف فصلی',
      monthly: 'هدف ماهانه'
    },
    priority: {
      high: 'اولویت بالا',
      medium: 'اولویت متوسط',
      low: 'اولویت پایین'
    },
    progress: 'پیشرفت',
    subgoals: 'اهداف فرعی',
    dependencies: 'وابستگی‌ها و پیش‌نیازها'
  },
  // عادات
  habits: {
    title: 'عادت‌های من',
    newHabit: 'عادت جدید',
    streak: 'استریک جاری',
    bestStreak: 'بهترین استریک',
    adherence: 'نرخ پایبندی',
    checkin: 'ثبت عملکرد',
    habitLoop: 'حلقه عادت',
    cue: 'نشانه محرک',
    routine: 'روتین اجرا',
    reward: 'پاداش تثبیت'
  },
  // امنیت و تنظیمات
  security: {
    title: 'امنیت و حریم خصوصی',
    pinLock: 'قفل ورود (PIN)',
    pinEnabled: 'قفل فعال است',
    pinDisabled: 'قفل غیرفعال است',
    setupPin: 'فعال‌سازی قفل با PIN',
    changePin: 'تغییر پین',
    removePin: 'حذف پین',
    lockNow: 'قفل کردن اکنون برنامه',
    disclaimerTitle: 'یادداشت امنیتی',
    disclaimerText: 'این قفل صرفاً حفاظت سطحی در برابر نگاه دیگران است و امنیت واقعی داده‌های ذخیره‌شده روی حافظه دستگاه نیست، مگر آنکه کل داده‌ها در IndexedDB رمزگذاری شوند.',
    encryptedBackup: 'پشتیبان رمزنگاری‌شده (AES-GCM)',
    exportEncrypted: 'دانلود نسخه رمزشده (AES-GCM ۲۵۶)',
    backupWarning: 'فراموشی گذرواژه به منزله از دست رفتن قطعی و غیرقابل بازیابی اطلاعات فایل خواهد بود.'
  },
  // زبان و تقویم
  settings: {
    language: 'زبان برنامه',
    theme: 'تم ظاهری',
    calendar: 'نوع تقویم و ارقام',
    persian: 'فارسی (تقویم خورشیدی)',
    english: 'English (Gregorian Calendar)'
  }
} as const;

type DeepStringRecord<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringRecord<T[K]>;
};

export type TranslationDictionary = DeepStringRecord<typeof fa>;
