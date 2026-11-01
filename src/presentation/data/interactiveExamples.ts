/**
 * الگوها و مثال‌های تعاملی آماده برای ایجاد اهداف و عادات
 * همراه با قابلیت «استفاده از این مثال» برای پر کردن سریع فرم‌ها
 */

export interface GoalExampleTemplate {
  readonly id: string;
  readonly badge: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly whyItWorks: string;
  readonly data: {
    readonly title: string;
    readonly whyStatement: string;
    readonly categoryId: string;
    readonly priority: 'low' | 'medium' | 'high';
    readonly startValue: number;
    readonly targetValue: number;
    readonly unit: string;
    readonly durationDays: number;
  };
}

export interface HabitExampleTemplate {
  readonly id: string;
  readonly badge: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly whyItWorks: string;
  readonly data: {
    readonly title: string;
    readonly habitType: 'boolean' | 'numeric' | 'duration' | 'quit';
    readonly recurrenceType: 'daily' | 'weekly_days' | 'frequency' | 'interval';
    readonly recurrenceDays?: number[];
    readonly dailyTarget: number;
    readonly unit: string;
    readonly cue: string;
    readonly reminderTimes: string[];
  };
}

export const GOAL_EXAMPLE_TEMPLATES: readonly GoalExampleTemplate[] = [
  {
    id: 'goal-eng-b2',
    badge: 'مهارت و شغل',
    title: 'تسلط بر مکالمه انگلیسی (سطح B2)',
    tagline: 'هدف مشخص، با انگیزه کاری و سنجه عددی شفاف',
    description: 'هدف‌گذاری برای سپری کردن ۳۰۰ ساعت تمرین شنیداری و مکالمه در ۶ ماه به منظور قبولی در مصاحبه شغلی بین‌المللی.',
    whyItWorks: 'به جای تمرکز روی نتیجه مبهم «روان شدن»، سنجه روی ورودی قابل کنترل (ساعت تمرین متمرکز) متمرکز شده است.',
    data: {
      title: 'تسلط بر مکالمه انگلیسی شغلی (سطح B2)',
      whyStatement: 'می‌خواهم در مصاحبه‌های شرکت‌های بین‌المللی بدون لکنت و با اعتمادبه‌نفس توانایی‌های فنی‌ام را پرزنت کنم.',
      categoryId: 'career',
      priority: 'high',
      startValue: 0,
      targetValue: 300,
      unit: 'ساعت تمرین',
      durationDays: 180
    }
  },
  {
    id: 'goal-running-10k',
    badge: 'سلامت و تندرستی',
    title: 'دویدن پیوسته ۱۰ کیلومتر بدون توقف',
    tagline: 'هدف پله‌پله از نقطه صفر تا مسافت استاندارد',
    description: 'افزایش گام‌به‌گام استقامت قلبی‌عروقی از پیاده‌روی سریع تا دویدن ۱۰ کیلومتر استاندارد در ۴ ماه.',
    whyItWorks: 'تفکیک هدف بزرگ به کیلومتراژ هفتگی از آسیب‌های بدنی و دلسردی زودرس جلوگیری می‌کند.',
    data: {
      title: 'دویدن پیوسته مسافت ۱۰ کیلومتر',
      whyStatement: 'می‌خواهم سطح انرژی روزانه‌ام بالا برود و استقامت بدنی را به دوران اوج سلامتی بازگردانم.',
      categoryId: 'health',
      priority: 'medium',
      startValue: 1,
      targetValue: 10,
      unit: 'کیلومتر پیوسته',
      durationDays: 120
    }
  },
  {
    id: 'goal-saving-emergency',
    badge: 'مالی و امنیت شخصی',
    title: 'ساخت صندوق اضطراری ۱۰۰ میلیون تومانی',
    tagline: 'پشتوانه مالی امن برای آرامش روانی ۶ ماهه',
    description: 'تخصیص پس‌انداز ماهانه برای ایجاد پس‌انداز نقدینگی معادل مخارج ضروری چند ماه زندگی.',
    whyItWorks: 'هدف عددی دقیق با واحد پولی شفاف، شفافیت درآمد و هزینه را الزامی می‌کند.',
    data: {
      title: 'تشکیل صندوق پس‌انداز اضطراری ۱۰۰ میلیون تومانی',
      whyStatement: 'داشتن حاشیه امن مالی در مواجهه با هزینه‌های غیرمنتظره و رهایی از استرس‌های اقتصادی روزمره.',
      categoryId: 'finance',
      priority: 'high',
      startValue: 10,
      targetValue: 100,
      unit: 'میلیون تومان',
      durationDays: 240
    }
  },
  {
    id: 'goal-reading-12-books',
    badge: 'رشد فردی',
    title: 'مطالعه و خلاصه ۱۲ کتاب تخصصی',
    tagline: 'توسعه عمیق دانش بدون غرق شدن در روزمرگی',
    description: 'مطالعه ۱ کتاب در هر ماه همراه با نگارش خلاصه‌ی یک‌صفحه‌ای نکات کلیدی.',
    whyItWorks: 'هدف‌گذاری بر اساس تعداد کتاب‌های تمام‌شده به همراه خلاصه، خواندن سطحی را به یادگیری تبدیل می‌کند.',
    data: {
      title: 'مطالعه و خلاصه‌نویسی ۱۲ جلد کتاب تخصصی',
      whyStatement: 'عمیق‌تر کردن دیدگاهم در معماری نرم‌افزار و تصمیم‌گیری‌های پیچیده مهندسی.',
      categoryId: 'learning',
      priority: 'medium',
      startValue: 0,
      targetValue: 12,
      unit: 'جلد کتاب',
      durationDays: 365
    }
  }
];

export const HABIT_EXAMPLE_TEMPLATES: readonly HabitExampleTemplate[] = [
  {
    id: 'habit-reading-tiny',
    badge: 'رشد فردی',
    title: 'مطالعه ۲ صفحه کتاب غیرداستانی',
    tagline: 'شروع بسیار کوچک با قلاب چای عصرانه',
    description: 'خواندنی که کمتر از ۳ دقیقه وقت می‌گیرد اما در طول سال به بیش از ۷۰۰ صفحه می‌انجامد.',
    whyItWorks: 'طبق آزمایشگاه رفتار استنفورد، کوچک بودن حجم کار مقاومت مغز در شروع را به صفر می‌رساند.',
    data: {
      title: 'مطالعه ۲ صفحه کتاب غیرداستانی',
      habitType: 'numeric',
      recurrenceType: 'daily',
      dailyTarget: 2,
      unit: 'صفحه',
      cue: 'بلافاصله بعد از نوشیدن چای عصرگاهی، کتاب کنار کاناپه را باز می‌کنم.',
      reminderTimes: ['18:30']
    }
  },
  {
    id: 'habit-morning-walk',
    badge: 'سلامت جسم و ذهن',
    title: '۱۰ دقیقه پیاده‌روی صبحگاهی',
    tagline: 'دریافت نور خورشید اول صبح برای تنظیم ریتم شبانه‌روزی',
    description: 'پیاده‌روی آرام بدون گوشی در هوای آزاد پس از بیدار شدن.',
    whyItWorks: 'محرک بلافاصله پس از بیداری و پوشیدن لباس، نیاز به تصمیم‌گیری ذهنی را حذف می‌کند.',
    data: {
      title: '۱۰ دقیقه پیاده‌روی سبک صبحگاهی',
      habitType: 'duration',
      recurrenceType: 'weekly_days',
      recurrenceDays: [0, 1, 2, 3, 4], // شنبه تا چهارشنبه
      dailyTarget: 10,
      unit: 'دقیقه',
      cue: 'بلافاصله بعد از مسواک صبحگاهی، کفش‌ها را می‌پوشم و از درب خارج می‌شوم.',
      reminderTimes: ['07:15']
    }
  },
  {
    id: 'habit-water-glass',
    badge: 'سلامت و هیدراتاسیون',
    title: 'نوشیدن یک لیوان آب اول صبح',
    tagline: 'ساده‌ترین عادت ممکن برای بازیابی رطوبت بدن',
    description: 'نوشیدن یک لیوان آب ولرم قبل از صرف صبحانه یا هر نوشیدنی دیگر.',
    whyItWorks: 'قرار دادن لیوان آب کنار تختخواب از شب قبل، اصطکاک اجرای رفتار را ناچیز می‌کند.',
    data: {
      title: 'نوشیدن یک لیوان آب بلافاصله پس از بیداری',
      habitType: 'boolean',
      recurrenceType: 'daily',
      dailyTarget: 1,
      unit: 'بار',
      cue: 'وقتی پایم را از تختخواب روی زمین می‌گذارم، بطری روی میز را برمی‌دارم.',
      reminderTimes: ['07:00']
    }
  },
  {
    id: 'habit-quit-screen-bed',
    badge: 'بهداشت خواب / ترک عادت',
    title: 'ترک بردن گوشی به رختخواب',
    tagline: 'جداسازی محرک محیطی برای بهبود کیفیت خواب عمیق',
    description: 'قرار دادن گوشی روی شارژر در پذیرایی ۳۰ دقیقه قبل از خواب.',
    whyItWorks: 'تغییر طراحی محیطی (قرار ندادن فیزیکی گوشی در دسترس دست) برتر از جنگیدن با اراده است.',
    data: {
      title: 'پرهیز از نگاه به صفحه گوشی در رختخواب',
      habitType: 'quit',
      recurrenceType: 'daily',
      dailyTarget: 1,
      unit: 'شب موفق',
      cue: 'ساعت ۲۳:۰۰ وقتی زنگ خاموشی به صدا درآمد، گوشی را روی میز هال می‌گذارم.',
      reminderTimes: ['23:00']
    }
  }
];
