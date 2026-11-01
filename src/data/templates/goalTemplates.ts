import { GoalPriority } from '@/domain/value-objects/GoalPriority';

export interface PredefinedGoalTemplate {
  readonly id: string;
  readonly categoryId: string;
  readonly title: string;
  readonly description: string;
  readonly whyStatement: string;
  readonly priority: GoalPriority;
  readonly startValue: number;
  readonly targetValue: number;
  readonly unit: string;
  readonly durationDays: number;
  readonly suggestedMilestones: readonly string[];
  readonly guidance: string;
  readonly disclaimer?: string;
}

export const PREDEFINED_GOAL_TEMPLATES: readonly PredefinedGoalTemplate[] = [
  // دسته سلامت و تندرستی
  {
    id: 'goal_tmpl_health_run5k',
    categoryId: 'health',
    title: 'دویدن پیوسته ۵ کیلومتر بدون توقف',
    description: 'تقویت استقامت قلبی-عروقی و رسیدن به توانایی دویدن پیوسته ۵ کیلومتر در مدت ۱۲ هفته',
    whyStatement: 'برای دستیابی به نشاط روزانه، ارتقای سلامت قلب و افزایش چشمگیر انرژی برای کارهای فکری',
    priority: 'high',
    startValue: 1,
    targetValue: 5,
    unit: 'کیلومتر',
    durationDays: 84,
    suggestedMilestones: [
      'هفته ۴: دویدن مداوم ۲ کیلومتر بدون خستگی شدید',
      'هفته ۸: ثبت رکورد ۳.۵ کیلومتر پیوسته',
      'هفته ۱۲: دویدن رسمی مسافت ۵ کیلومتر کامل در پارک'
    ],
    guidance: 'افزایش مسافت را آهسته و طبق اصل بیش‌از ۱۰ درصد در هفته انجام ندهید تا از آسیب زانو جلوگیری شود.',
    disclaimer: 'این اپ مشاوره‌ی تخصصی نیست. در صورت داشتن سابقه بیماری قلبی، تنفسی یا مفصلی با پزشک مشورت کنید.'
  },
  {
    id: 'goal_tmpl_health_weight',
    categoryId: 'health',
    title: 'کاهش ۶ کیلوگرم وزن از طریق سبک زندگی سالم',
    description: 'دستیابی به وزن مطلوب پایدار با تنظیم رژیم متعادل و ورزش مستمر در طول ۳ ماه',
    whyStatement: 'سبک‌تر شدن بدن، کاهش فشار بر مفاصل و بهبود اعتمادبه‌نفس در تعاملات روزمره',
    priority: 'medium',
    startValue: 0,
    targetValue: 6,
    unit: 'کیلوگرم',
    durationDays: 90,
    suggestedMilestones: [
      'ماه اول: ۲ کیلوگرم کاهش وزن اولیه و حذف نوشابه‌های قندی',
      'ماه دوم: تثبیت کاهش ۴ کیلوگرم و تنظیم ساعت خواب شبانه',
      'ماه سوم: رسیدن به هدف ۶ کیلوگرم و ثبت برنامه نگهداری وزن'
    ],
    guidance: 'کاهش وزن استاندارد بین ۵۰۰ گرم تا ۱ کیلوگرم در هفته است؛ از رژیم‌های شوک‌آور و خودسرانه پرهیز کنید.',
    disclaimer: 'این اپ مشاوره‌ی تخصصی پزشکی و تغذیه نیست. هرگونه رژیم خاص نیازمند مشورت با کارشناس تغذیه است.'
  },

  // دسته مطالعه و رشد فردی
  {
    id: 'goal_tmpl_reading_12books',
    categoryId: 'reading',
    title: 'مطالعه و خلاصه‌نویسی ۱۲ جلد کتاب تخصصی و عمومی',
    description: 'گسترش بینش عمیق فکری از طریق خواندن ماهانه یک کتاب باکیفیت و استخراج نکات کاربردی',
    whyStatement: 'برای دستیابی به دیدگاه‌های نوین در زندگی و کار، و فاصله گرفتن از مصرف‌زدگی محتواهای سطحی فضای مجازی',
    priority: 'high',
    startValue: 0,
    targetValue: 12,
    unit: 'جلد',
    durationDays: 365,
    suggestedMilestones: [
      'فصل بهار: اتمام ۳ کتاب اول و یادداشت‌برداری فصول کلیدی',
      'فصل تابستان: تکمیل ۶ کتاب و بازخوانی یادداشت‌ها',
      'فصل پاییز: مطالعه کتاب‌های ۹ام و ثبت آموخته‌ها',
      'فصل زمستان: تکمیل ۱۲ کتاب و تدوین فهرست کتاب‌های سال بعد'
    ],
    guidance: 'کیفیت درک مفاهیم مهم‌تر از سرعت تندخوانی است. روزی ۱۵ الی ۲۰ صفحه برای یک جلد کتاب ماهانه کافی است.'
  },

  // دسته مالی و پس‌انداز
  {
    id: 'goal_tmpl_finance_emergency_fund',
    categoryId: 'finance',
    title: 'ایجاد صندوق اضطراری معادل ۶ ماه هزینه‌های ضروری',
    description: 'تأمین سپر امن مالی برای آسودگی خاطر در برابر پیشامدهای ناگهانی شغلی و درمانی',
    whyStatement: 'برای برقراری امنیت روانی، دوری از اضطراب بی‌پولی و عدم نیاز به قرض در مواقع بحرانی',
    priority: 'high',
    startValue: 0,
    targetValue: 6,
    unit: 'ماه هزینه',
    durationDays: 180,
    suggestedMilestones: [
      'ماه دوم: پس‌انداز معادل ۲ ماه هزینه‌های پایه در حساب جداگانه',
      'ماه چهارم: تکمیل ۴ ماه پوشش مالی اضطراری',
      'ماه ششم: تکمیل کامل صندوق ۶ ماهه و قفل کردن برداشت آن'
    ],
    guidance: 'صندوق اضطراری باید در جایی با نقدشوندگی بسیار بالا و ریسک صفر نگهداری شود، نه در بازارهای پرریسک.',
    disclaimer: 'این اپلیکیشن مشاوره‌ی تخصصی مالی و سرمایه‌گذاری نیست. تصمیمات مالی را بر اساس شرایط شخصی اتخاذ نمایید.'
  },

  // دسته یادگیری مهارت و زبان
  {
    id: 'goal_tmpl_learning_english_b2',
    categoryId: 'learning',
    title: 'تسلط به مکالمه و نگارش انگلیسی در سطح B2',
    description: 'توانایی برقراری ارتباط روان بدون لکنت و شرکت در جلسات کاری یا آزمون‌های بین‌المللی',
    whyStatement: 'دستیابی به فرصت‌های تحصیلی و شغلی بین‌المللی و استفاده مستقیم از منابع به‌روز دنیا',
    priority: 'high',
    startValue: 0,
    targetValue: 100,
    unit: 'جلسه تمرین',
    durationDays: 150,
    suggestedMilestones: [
      'جلسه ۳۰: گسترش دایره واژگان پایه به ۱۰۰۰ واژه پرکاربرد',
      'جلسه ۶۰: توانایی مکالمه پیوسته به مدت ۱۰ دقیقه بدون وقفه',
      'جلسه ۱۰۰: نگارش ۳ مقاله و شرکت در آزمون تعیین سطح استاندارد'
    ],
    guidance: 'مداومت روزانه حتی ۲۰ دقیقه بسیار اثربخش‌تر از تمرین طولانی‌مدت یک‌بار در هفته است.'
  }
];

export const getPredefinedGoalTemplates = (categoryId?: string): readonly PredefinedGoalTemplate[] => {
  if (!categoryId || categoryId === 'all') {
    return PREDEFINED_GOAL_TEMPLATES;
  }
  return PREDEFINED_GOAL_TEMPLATES.filter(t => t.categoryId === categoryId);
};

export const getGoalTemplatesByCategory = getPredefinedGoalTemplates;

