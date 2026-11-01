export interface PredefinedHabitTemplate {
  readonly id: string;
  readonly categoryId: string;
  readonly title: string;
  readonly description: string;
  readonly habitType: 'boolean' | 'numeric' | 'duration' | 'quit';
  readonly dailyTarget: number;
  readonly unit: string;
  readonly recurrenceType: 'daily' | 'weekly_days' | 'frequency' | 'interval';
  readonly recurrenceRuleJson: string;
  readonly cue: string;
  readonly routine: string;
  readonly reward: string;
  readonly guidance: string;
  readonly disclaimer?: string;
}

export const PREDEFINED_HABIT_TEMPLATES: readonly PredefinedHabitTemplate[] = [
  // سلامت و تندرستی
  {
    id: 'habit_tmpl_health_walk',
    categoryId: 'health',
    title: 'پیاده‌روی روزانه ۶۰۰۰ قدم',
    description: 'تحرک حداقلی ضروری برای سلامت متابولیک و تنظیم قند خون',
    habitType: 'numeric',
    dailyTarget: 6000,
    unit: 'قدم',
    recurrenceType: 'daily',
    recurrenceRuleJson: '{"type":"daily"}',
    cue: 'بلافاصله بعد از صرف ناهار یا بازگشت از محل کار',
    routine: 'کفش ورزشی پوشیده و ۲۰ الی ۳۰ دقیقه پیاده‌روی سریع در هوای آزاد',
    reward: 'احساس سبکی در عضلات و علامت زدن روز موفق در اپلیکیشن',
    guidance: 'با روزی ۳۰۰۰ قدم شروع کنید و هر هفته ۱۰۰۰ قدم اضافه کنید تا به عادت پایدار تبدیل شود.',
    disclaimer: 'این اپ مشاوره‌ی تخصصی پزشکی نیست؛ افراد دارای درد مفاصل یا مشکل قلبی با احتیاط ورزش کنند.'
  },
  {
    id: 'habit_tmpl_health_water',
    categoryId: 'health',
    title: 'نوشیدن ۸ لیوان آب سالم در طول روز',
    description: 'تأمین کامل هیدراتاسیون بدن برای رفع خستگی و شادابی پوست',
    habitType: 'numeric',
    dailyTarget: 8,
    unit: 'لیوان',
    recurrenceType: 'daily',
    recurrenceRuleJson: '{"type":"daily"}',
    cue: 'گذاشتن بطری آب مشخص روی میز کار',
    routine: 'نوشیدن یک لیوان آب کامل در فواصل منظم کاری',
    reward: 'حس طراوت و شفافیت ذهنی',
    guidance: 'همیشه یک بطری آب تمیز در میدان دید خود داشته باشید تا محرک بصری فراموش نشود.'
  },
  {
    id: 'habit_tmpl_health_sleep',
    categoryId: 'health',
    title: '۷ ساعت خواب شبانه باکیفیت',
    description: 'خواب کافی و عمیق برای بازسازی هورمونی و ترمیم بافت‌های مغزی',
    habitType: 'duration',
    dailyTarget: 7,
    unit: 'ساعت',
    recurrenceType: 'daily',
    recurrenceRuleJson: '{"type":"daily"}',
    cue: 'تنظیم زنگ خاموشی تلفن همراه در ساعت ۲۲:۳۰ شب',
    routine: 'کنار گذاشتن تمام نمایشگرها و تاریک کردن اتاق خواب',
    reward: 'بیدار شدن با نشاط بالا در صبح بدون نیاز به چرت‌زدن‌های مکرر',
    guidance: 'نور آبی گوشی مانع ترشح ملاتونین می‌شود؛ حداقل ۴۵ دقیقه قبل خواب آن را در اتاق دیگری شارژ کنید.',
    disclaimer: 'این اپ ابزار درمانی اختلالات خواب نیست. در صورت بی‌خوابی مزمن با پزشک مشورت کنید.'
  },
  {
    id: 'habit_tmpl_health_no_sugar',
    categoryId: 'health',
    title: 'پرهیز از نوشیدنی‌ها و شیرینی‌های قندی صنعتی',
    description: 'عادت ترک‌کردنی برای کاهش التهاب بدن و پیشگیری از نوسانات شدید انسولین',
    habitType: 'quit',
    dailyTarget: 1,
    unit: 'روز پاکی',
    recurrenceType: 'daily',
    recurrenceRuleJson: '{"type":"daily"}',
    cue: 'هنگام احساس هوس قند بعد از کار یا همراه با چای/قهوه',
    routine: 'نوشیدن یک لیوان چای سبز یا خوردن دو عدد خرما/بادام به جای شیرینی صنعتی',
    reward: 'پایداری سطح انرژی و احساس تسلط بر نفس',
    guidance: 'در صورت وسوسه، قانون «۱۰ دقیقه مکث کن» را اجرا کنید. هوس قند معمولاً پس از چند دقیقه فروکش می‌کند.',
    disclaimer: 'این اپلیکیشن توصیه‌ی پزشکی و رژیم‌درمانی نیست.'
  },

  // مطالعه و رشد فردی
  {
    id: 'habit_tmpl_reading_pages',
    categoryId: 'reading',
    title: 'مطالعه ۱۵ صفحه کتاب غیرداستانی',
    description: 'ساخت زنجیره پیوسته یادگیری روزانه با حجم کم و اثر مرکب بالا',
    habitType: 'numeric',
    dailyTarget: 15,
    unit: 'صفحه',
    recurrenceType: 'daily',
    recurrenceRuleJson: '{"type":"daily"}',
    cue: 'بعد از ریختن چای عصرانه یا قبل از خواب',
    routine: 'کتاب را باز کرده و ۱۵ صفحه بدون وقفه مطالعه می‌کنم',
    reward: 'ثبت یک جمله تأمل‌برانگیز در دفترچه یادداشت روزانه',
    guidance: 'اگر یک روز خیلی خسته بودید، طبق قانون حداقل‌ها حتی ۱ صفحه بخوانید تا زنجیره عادت پاره نشود.'
  },

  // مالی و پس‌انداز
  {
    id: 'habit_tmpl_finance_daily_log',
    categoryId: 'finance',
    title: 'ثبت تمام هزینه‌های روزانه قبل از خواب',
    description: 'ایجاد آگاهی شفاف از جریان خروج پول و پیشگیری از نشتی‌های مالی کوچک',
    habitType: 'boolean',
    dailyTarget: 1,
    unit: 'بار',
    recurrenceType: 'daily',
    recurrenceRuleJson: '{"type":"daily"}',
    cue: 'در پایان روز کاری قبل از خاموش کردن کامپیوتر یا روی تختخواب',
    routine: 'باز کردن دفترچه یادداشت یا اپ و ثبت مبالغ خرج‌شده در طول روز',
    reward: 'آرامش خاطر از تسلط کامل بر ارقام مالی شخصی',
    guidance: 'خرج‌های کوچک مانند قهوه، اسنک یا کرایه‌ها معمولاً فراموش می‌شوند؛ هر شب آن‌ها را ثبت کنید.',
    disclaimer: 'این اپلیکیشن مشاوره‌ی مالی یا سرمایه‌گذاری نیست.'
  },

  // یادگیری مهارت و زبان
  {
    id: 'habit_tmpl_learning_vocab',
    categoryId: 'learning',
    title: 'مرور ۲۰ واژه و فلش‌کارت زبان',
    description: 'استفاده از تکرار فاصله‌دار (SRS) برای انتقال واژگان به حافظه بلندمدت',
    habitType: 'numeric',
    dailyTarget: 20,
    unit: 'واژه',
    recurrenceType: 'daily',
    recurrenceRuleJson: '{"type":"daily"}',
    cue: 'در مسیر رفت‌وآمد با مترو/تاکسی یا در وقت استراحت ۱۰ دقیقه‌ای کار',
    routine: 'مرور فلش‌کارت‌ها و تلفظ واژگان با صدای آرام',
    reward: 'دیدن افزایش تعداد کلمات تثبیت‌شده در حافظه',
    guidance: 'کلمات را درون جمله و با تصویر ذهنی یاد بگیرید نه به‌صورت ترجمه تحت‌اللفظی منفرد.'
  }
];

export const getPredefinedHabitTemplates = (categoryId?: string): readonly PredefinedHabitTemplate[] => {
  if (!categoryId || categoryId === 'all') {
    return PREDEFINED_HABIT_TEMPLATES;
  }
  return PREDEFINED_HABIT_TEMPLATES.filter(t => t.categoryId === categoryId);
};

export const getHabitTemplatesByCategory = getPredefinedHabitTemplates;
