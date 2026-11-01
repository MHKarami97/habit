import { db } from '../db/AppDatabase';

export class CsvExportService {
  private static escapeCsvCell(val: any): string {
    if (val === undefined || val === null) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * تولید خروجی CSV برای اهداف همراه با UTF-8 BOM جهت باز شدن صحیح در اکسل
   */
  static async exportGoalsCsv(): Promise<string> {
    const goals = await db.goals.toArray();
    const headers = [
      'شناسه',
      'عنوان هدف',
      'چرایی و انگیزه',
      'اولویت',
      'وضعیت',
      'مهلت پایان',
      'مقدار شروع',
      'مقدار جاری',
      'مقدار هدف',
      'واحد'
    ];

    const rows = goals.map(g => [
      g.id,
      g.title,
      g.whyStatement,
      g.priority,
      g.status,
      g.deadline,
      g.startValue,
      g.currentValue,
      g.targetValue,
      g.unit
    ]);

    const csvContent = [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\r\n');

    // افزودن UTF-8 BOM (\uFEFF) برای پشتیبانی صحیح اکسل از حروف فارسی
    return '\uFEFF' + csvContent;
  }

  /**
   * تولید خروجی CSV برای عادات و تاریخچه لاگ‌ها
   */
  static async exportHabitsCsv(): Promise<string> {
    const habits = await db.habits.toArray();
    const headers = [
      'شناسه',
      'عنوان عادت',
      'نوع عادت',
      'قاعده تکرار',
      'هدف روزانه',
      'واحد',
      'محرک رفتاری (Cue)',
      'تاریخ شروع'
    ];

    const rows = habits.map(h => [
      h.id,
      h.title,
      h.habitType,
      h.recurrenceType,
      h.dailyTarget,
      h.unit,
      h.cue || '',
      h.startDate
    ]);

    const csvContent = [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\r\n');

    return '\uFEFF' + csvContent;
  }
}
