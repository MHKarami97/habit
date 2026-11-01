/**
 * دانشنامه داده‌محور راهنمای فیلدهای هدف و عادت در کاوش
 * کاملاً مجزا از لایه کامپوننت‌ها برای سهولت توسعه، ترجمه و ارزیابی کیفی
 */

export interface FieldHelpItem {
  readonly fieldKey: string;
  readonly title: string;
  readonly tip: string;
  readonly goodExample: string;
  readonly badExample: string;
  readonly commonPitfall: string;
  readonly researchCitation?: string;
  readonly guideTopicId?: string;
}

export const FIELD_HELP_DATA: Record<string, FieldHelpItem> = {
  // فیلدهای هدف
  'goal.title': {
    fieldKey: 'goal.title',
    title: 'عنوان هدف',
    tip: 'عنوان هدف باید بیانگر دستاوردی شفاف، ملموس و الهام‌بخش باشد که وضعیت نهایی مطلوب را به تصویر می‌کشد.',
    goodExample: 'رسیدن به سطح B2 در مکالمه انگلیسی برای ارائه شغلی',
    badExample: 'زبان انگلیسی‌ام خوب شود',
    commonPitfall: 'اشتباه گرفتن هدف با عادت روزانه (مثلاً نوشتن «هر روز زبان خواندن» به‌جای دستاورد نهایی).',
    researchCitation: 'George T. Doran (1981) - There\'s a S.M.A.R.T. way to write management\'s goals and objectives.',
    guideTopicId: 'smart_goals'
  },
  'goal.whyStatement': {
    fieldKey: 'goal.whyStatement',
    title: 'چرایی و انگیزه درونی',
    tip: 'دلیل عمیق احساسی یا عقلانی شما برای رسیدن به این هدف. در روزهای دشوار، این جمله نیروی محرکه اراده شما خواهد بود.',
    goodExample: 'می‌خواهم در نشست‌های بین‌المللی بدون استرس و روان سخن بگویم و از فرصت‌های مهاجرت شغلی بهره‌مند شوم.',
    badExample: 'چون بقیه زبان یاد می‌گیرند.',
    commonPitfall: 'اکتفا به انگیزه‌های بیرونی سطحی بدون پیوند دادن هدف با ارزش‌های بنیادین زندگی فردی.',
    guideTopicId: 'goal_vs_habit'
  },
  'goal.priority': {
    fieldKey: 'goal.priority',
    title: 'اولویت هدف',
    tip: 'در هر مقطع زمانی بیش از ۳ هدف با اولویت بالا نداشته باشید. تمرکز پراکنده عامل اصلی شکست پروژه‌هاست.',
    goodExample: 'تنظیم اولویت بالا منحصراً برای ۱ یا ۲ هدف سرنوشت‌ساز فصل جاری',
    badExample: 'قرار دادن همه ۱۰ هدف در حالت اولویت بالا (High)',
    commonPitfall: 'ترس از اولویت‌بندی که منجر به توزیع ناکافی انرژی روی اهداف حیاتی می‌شود.',
    guideTopicId: 'smart_goals'
  },
  'goal.deadline': {
    fieldKey: 'goal.deadline',
    title: 'مهلت پایانی (Deadline)',
    tip: 'مهلت مشخص انگیزه زمانی ایجاد می‌کند. طبق قانون پارکینسون، کار تا پر کردن مهلت تعیین‌شده کش می‌آید.',
    goodExample: 'تعیین مهلت ۶ ماهه واقع‌بینانه همراه با در نظر گرفتن وقایع پیش‌بینی‌نشده',
    badExample: 'رها کردن مهلت بدون تاریخ یا تعیین زمان غیرممکن (مثلاً یادگیری کل آلمانی در ۳ هفته)',
    commonPitfall: 'عدم در نظر گرفتن زمان استراحت و حاشیه‌ی امن در تخمین مهلت پایان.',
    guideTopicId: 'smart_goals'
  },
  'goal.metric': {
    fieldKey: 'goal.metric',
    title: 'سنجه و مقدار هدف',
    tip: 'یک هدف بدون عدد، تنها یک آرزوست. سنجه مشخص می‌کند پیشرفت شما دقیقاً با چه معیاری سنجیده می‌شود.',
    goodExample: 'مقدار شروع: ۰، مقدار هدف: ۶۰۰ (ساعت مطالعه)، واحد: ساعت',
    badExample: 'مقدار شروع: ۱، مقدار هدف: ۱۰۰ بدون تعریف مشخص واحد',
    commonPitfall: 'انتخاب سنجه‌های غیرقابل کنترل (Lag Metrics) به‌جای سنجه‌های مستقیم قابل اندازه‌گیری.',
    researchCitation: 'Doran (1981) - تعریف شاخص‌های کمی قابل اندازه‌گیری (Measurable).',
    guideTopicId: 'smart_goals'
  },

  // فیلدهای عادت
  'habit.title': {
    fieldKey: 'habit.title',
    title: 'عنوان عادت',
    tip: 'رفتاری مشخص، روشن و بدون ابهام که دقیقاً می‌دانید چه زمانی آغاز شده و چه زمانی به پایان می‌رسد.',
    goodExample: 'خواندن ۲ صفحه از کتاب غیرداستانی',
    badExample: 'آدم کتاب‌خوانی شدن',
    commonPitfall: 'تعریف عادت در قالب آرزوی شخصیتی به‌جای کنش فیزیکی دقیق.',
    researchCitation: 'Dr. BJ Fogg (Stanford University, 2019) - رفتار باید کنشی فیزیکی و معین باشد.',
    guideTopicId: 'tiny_habits'
  },
  'habit.habitType': {
    fieldKey: 'habit.habitType',
    title: 'نوع عادت',
    tip: 'چهار الگوی رفتاری: انجام شد/نشد (Boolean)، عددی (مانند صفحات کتاب)، زمانی (مانند دقیقه مدیتیشن) و ترک رفتار (Quit).',
    goodExample: 'انتخاب نوع «زمانی» برای مدیتیشن روزانه با واحد دقیقه',
    badExample: 'تعریف زمان ورزش در قالب عادت Boolean بدون ثبت مقدار دقیق تمرین',
    commonPitfall: 'پیچیده کردن عادت‌های ساده با ثبت مقادیر غیرضروری در روزهای آغازین.',
    guideTopicId: 'tiny_habits'
  },
  'habit.cue': {
    fieldKey: 'habit.cue',
    title: 'لنگر رفتاری یا محرک (Cue)',
    tip: 'پیوند زدن عادت جدید به یک رویداد موجود در زندگی. ساختار: «بلافاصله بعد از [عادت قدیمی]، [عادت جدید] را انجام می‌دهم».',
    goodExample: 'بلافاصله بعد از ریختن چای صبحگاهی، ۲ صفحه کتاب می‌خوانم.',
    badExample: 'هر وقت فرصت شد کتاب می‌خوانم.',
    commonPitfall: 'تکیه بر حافظه بدون اتصال عادت به یک قلاب زمانی، مکانی یا رفتاری موجود.',
    researchCitation: 'Prof. Peter Gollwitzer (1999) - Implementation Intentions: پیوند محرک موقعیتی با پاسخ رفتاری.',
    guideTopicId: 'if_then_plans'
  },
  'habit.recurrence': {
    fieldKey: 'habit.recurrence',
    title: 'قاعده تکرار',
    tip: 'مشخص کنید این عادت در چه روزهایی اجرا می‌شود. ثبات در روزهای مشخص، مسیرهای عصبی را سریع‌تر تقویت می‌کند.',
    goodExample: 'تعیین روزهای فرد (شنبه، دوشنبه، چهارشنبه) برای ورزش باشگاه',
    badExample: 'تعیین «هر روز» برای کاری سنگین که منجر به فرسودگی زودهنگام در هفته دوم شود',
    commonPitfall: 'کمال‌گرایی در تعیین تکرار روزانه برای فعالیت‌های پرفشار ورزشی یا تحصیلی.',
    researchCitation: 'Phillippa Lally et al. (2009) - پیوستگی در روزهای منظم و عدم افت فرآیند با یک روز غیبت.',
    guideTopicId: 'soft_streaks'
  },
  'habit.dailyTarget': {
    fieldKey: 'habit.dailyTarget',
    title: 'هدف روزانه (حداقل شروع)',
    tip: 'در شروع، هدف را به قدری کوچک بگیرید که نتوانید انجام ندهید (کمتر از ۲ دقیقه). افزایش پس از تثبیت رخ می‌دهد.',
    goodExample: 'هدف روزانه: ۲ صفحه (و مجاز بودن برای خواندن بیشتر در صورت تمایل)',
    badExample: 'هدف روزانه: مطالعه روزی ۶۰ صفحه کتاب سنگین فلسفی',
    commonPitfall: 'تعیین سقف انگیزه بالا در روز اول به‌عنوان هدف اجباری هر روز.',
    researchCitation: 'BJ Fogg Tiny Habits (2009) - قاعده مقاومت شناختی و شروع بسیار کوچک.',
    guideTopicId: 'tiny_habits'
  },
  'habit.reminderTime': {
    fieldKey: 'habit.reminderTime',
    title: 'ساعت یادآور',
    tip: 'ساعتی را انتخاب کنید که معمولاً فراغت ذهنی دارید، یا با تقویم گوشی همگام‌سازی کنید تا زنگ هشدار بیدارباش دریافت کنید.',
    goodExample: 'تنظیم ساعت ۲۰:۳۰ پس از بازگشت از محل کار و شام',
    badExample: 'تنظیم در میانه ساعات اوج شلوغی کاری بدون امکان انجام کار',
    commonPitfall: 'تنظیم ساعتی که در آن دسترسی به ملزومات انجام عادت ندارید.',
    guideTopicId: 'if_then_plans'
  },

  // فیلدهای موانع
  'obstacle.category': {
    fieldKey: 'obstacle.category',
    title: 'دسته‌بندی مانع',
    tip: 'شناسایی ریشه ناکامی در انجام کار: خستگی انرژی، کمبود زمان، حواس‌پرتی یا مقاومت احساسی.',
    goodExample: 'انتخاب دسته «افت انرژی و خستگی» پس از یک شیفت کاری فشرده',
    badExample: 'ثبت بدون دسته‌بندی با برچسب کلی «تنبلی کردم»',
    commonPitfall: 'سرزنش خود و برچسب بی‌ارادگی زدن به‌جای تحلیل واقع‌بینانه عامل محیطی یا جسمی مانع.',
    guideTopicId: 'if_then_plans'
  },
  'obstacle.ifThenPlan': {
    fieldKey: 'obstacle.ifThenPlan',
    title: 'برنامه اگر-آنگاه (Implementation Intention)',
    tip: 'فرمول: «اگر [مانع پیش‌بینی‌شده رخ داد]، آنگاه [رفتار جایگزین مشخص را اجرا می‌کنم]».',
    goodExample: 'اگر ساعت ۲۰ به شدت خسته بودم، آنگاه به جای ۳۰ دقیقه، فقط ۵ دقیقه نرمش کششی سبک انجام می‌دهم.',
    badExample: 'سعی می‌کنم خستگی را شکست بدهم.',
    commonPitfall: 'ارائه راه‌حل‌های کلی مبتنی بر امید به‌جای برنامه عملیاتی مشخص.',
    researchCitation: 'Peter Gollwitzer (1999) - ساختارهای شناختی آماده‌باش و عبور از موانع.',
    guideTopicId: 'if_then_plans'
  }
};
