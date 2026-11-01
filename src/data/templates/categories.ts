export interface TemplateCategory {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
  readonly isSensitive: boolean;
  readonly disclaimer?: string;
}

export const TEMPLATE_CATEGORIES: readonly TemplateCategory[] = [
  {
    id: 'health',
    label: 'سلامت و تندرستی',
    icon: 'flame',
    description: 'بهبود سطح انرژی، خواب، تغذیه سالم و تحرک بدنی مستمر',
    isSensitive: true,
    disclaimer:
      'یادداشت مهم: الگوهای این بخش صرفاً جهت ردیابی عادات و مدیریت فردی است و به هیچ عنوان جایگزین مشاوره پزشکی، تغذیه تخصصی یا توصیه‌های درمانی بالینی نمی‌باشد.'
  },
  {
    id: 'reading',
    label: 'مطالعه و رشد فردی',
    icon: 'target',
    description: 'کتاب‌خوانی عمیق، خلاصه‌نویسی و یادگیری مستمر در زندگی روزمره',
    isSensitive: false
  },
  {
    id: 'finance',
    label: 'مالی و پس‌انداز شخصی',
    icon: 'chart',
    description: 'انضباط مالی، کنترل هزینه‌ها و ایجاد صندوق پس‌انداز و اضطراری',
    isSensitive: true,
    disclaimer:
      'یادداشت مهم: قالب‌های مالی صرفاً جنبه خودانضباطی رفتاری دارند و به هیچ عنوان مشاوره سرمایه‌گذاری، بورسی، حقوقی یا مالی تخصصی محسوب نمی‌شوند.'
  },
  {
    id: 'learning',
    label: 'یادگیری مهارت و زبان',
    icon: 'check',
    description: 'توسعه مهارت‌های تخصصی، زبان‌های خارجی و توانمندی‌های شغلی',
    isSensitive: false
  },
  {
    id: 'personal',
    label: 'قالب‌های شخصی من',
    icon: 'settings',
    description: 'الگوهایی که شخصاً از اهداف یا عادات اختصاصی خود ذخیره کرده‌اید',
    isSensitive: false
  }
];

export const getTemplateCategory = (categoryId: string): TemplateCategory | undefined => {
  return TEMPLATE_CATEGORIES.find(c => c.id === categoryId);
};

export const getCategoryById = getTemplateCategory;

export const isSensitiveCategory = (categoryId: string): boolean => {
  const cat = getTemplateCategory(categoryId);
  return Boolean(cat?.isSensitive);
};
