import { describe, it, expect } from 'vitest';
import { ReminderCoordinator } from '@/application/reminders/ReminderCoordinator';
import { IcsExportScheduler } from '@/application/reminders/strategies/IcsExportScheduler';

describe('Reminder System & RFC 5545 iCalendar (Phase 2 Package 1)', () => {
  describe('calculateNextOccurrence', () => {
    it('باید اگر ساعت فعلی قبل از موعد باشد، موعد را برای امروز تنظیم کند', () => {
      // ساعت ۱۰:۰۰ صبح
      const fixedNow = new Date('2026-11-01T10:00:00');
      const { targetDateStr, timestamp } = ReminderCoordinator.calculateNextOccurrence('20:00', fixedNow);

      expect(targetDateStr).toBe('2026-11-01');
      const targetDate = new Date(timestamp);
      expect(targetDate.getHours()).toBe(20);
      expect(targetDate.getMinutes()).toBe(0);
      expect(targetDate.getDate()).toBe(1);
    });

    it('باید اگر ساعت فعلی بعد از موعد باشد، موعد را برای فردا تنظیم کند', () => {
      // ساعت ۲۱:۳۰ شب
      const fixedNow = new Date('2026-11-01T21:30:00');
      const { targetDateStr, timestamp } = ReminderCoordinator.calculateNextOccurrence('20:00', fixedNow);

      expect(targetDateStr).toBe('2026-11-02');
      const targetDate = new Date(timestamp);
      expect(targetDate.getHours()).toBe(20);
      expect(targetDate.getMinutes()).toBe(0);
      expect(targetDate.getDate()).toBe(2);
    });
  });

  describe('IcsExportScheduler - RFC 5545 Escaping & Formatting', () => {
    it('باید نویسه‌های خاص ویرگول، سمیکولون، بک‌اسلش و اینتر را طبق استاندارد فرار دهد', () => {
      const rawText = 'مطالعه کتاب; فصل ۱, بخش ۲\\توضیح\nخط دوم';
      const escaped = IcsExportScheduler.escapeIcsText(rawText);

      expect(escaped).toContain('\\;');
      expect(escaped).toContain('\\,');
      expect(escaped).toContain('\\\\');
      expect(escaped).toContain('\\n');
      expect(escaped).not.toContain('\n');
    });

    it('باید خطوط طولانی‌تر از ۷۵ بایت را با CRLF و یک نویسه اسپیس بشکند (Line Folding)', () => {
      // متنی بسیار طولانی با حروف فارسی (هر حرف فارسی ۲ بایت در UTF-8 است)
      const longPersianLine = 'DESCRIPTION:این یک متن بسیار طولانی فارسی برای یادآور عادت روزانه است که طول بایت‌های آن قطعا از سقف استاندارد ۷۵ بایت تقویم فراتر می‌رود و باید شکسته شود.';
      const folded = IcsExportScheduler.foldLine(longPersianLine, 75);

      // باید شامل شکستگی باشد
      expect(folded).toContain('\r\n ');

      // هیچ سطری در خروجی نباید بیش از ۷۵ بایت UTF-8 باشد
      const encoder = new TextEncoder();
      const lines = folded.split('\r\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const byteLen = encoder.encode(line).length;
        expect(byteLen).toBeLessThanOrEqual(75);
      }
    });

    it('باید خطوط کوتاه کمتر از ۷۵ بایت را بدون تغییر بازگرداند', () => {
      const shortLine = 'SUMMARY:ورزش صبحگاهی';
      const folded = IcsExportScheduler.foldLine(shortLine, 75);
      expect(folded).toBe(shortLine);
    });
  });

  describe('IcsExportScheduler - RRULE Rules Mapping', () => {
    it('باید برای عادت روزانه قاعده RRULE:FREQ=DAILY تولید کند', () => {
      const { rrule, limitationNotice } = IcsExportScheduler.buildRRule({ type: 'daily' });
      expect(rrule).toBe('RRULE:FREQ=DAILY');
      expect(limitationNotice).toBeUndefined();
    });

    it('باید روزهای هفته فارسی (۰=شنبه، ۲=دوشنبه، ۴=چهارشنبه) را به SA,MO,WE تبدیل کند', () => {
      const { rrule } = IcsExportScheduler.buildRRule({
        type: 'weekly_days',
        daysOfWeek: [0, 2, 4]
      });
      expect(rrule).toBe('RRULE:FREQ=WEEKLY;BYDAY=SA,MO,WE');
    });

    it('باید برای قاعده شناور (n بار در هفته) هشدار محدودیت استاندارد تقویم درج کند', () => {
      const { rrule, limitationNotice } = IcsExportScheduler.buildRRule({
        type: 'frequency',
        frequencyCount: 3
      });
      expect(rrule).toBe('RRULE:FREQ=DAILY');
      expect(limitationNotice).toBeDefined();
      expect(limitationNotice).toContain('3 بار در هفته');
    });
  });

  describe('IcsExportScheduler - Full iCalendar Document with VALARM', () => {
    it('باید تقویم کامل شامل هدر استاندارد، VEVENT و هشدار صوتی VALARM تولید کند', () => {
      const ics = IcsExportScheduler.generateIcs({
        uid: 'test-habit-123',
        title: 'مطالعه ۳۰ دقیقه کتاب',
        description: 'محرک: بعد از نوشیدن چای عصرگاهی',
        startDate: new Date('2026-11-01T20:00:00'),
        durationMinutes: 30,
        rrule: 'RRULE:FREQ=DAILY',
        alarmMinutesBefore: 0
      });

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//Kavosh Habit Goal//FA');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('UID:test-habit-123@kavosh.local');
      expect(ics).toContain('RRULE:FREQ=DAILY');
      expect(ics).toContain('BEGIN:VALARM');
      expect(ics).toContain('ACTION:DISPLAY');
      expect(ics).toContain('TRIGGER:-PT0M');
      expect(ics).toContain('END:VALARM');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});
