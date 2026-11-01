/**
 * موتور ریاضی تقویم هجری شمسی (جلالی)
 * پیاده‌سازی مستقل، دقیق و سبک بر اساس الگوریتم استاندارد کاظم بورکوفسکی
 * بدون هیچ وابستگی خارجی جهت حفظ بودجه حجم باندل و کارایی حداکثری
 */

export interface SolarDateTuple {
  readonly year: number;
  readonly month: number; // 1 to 12
  readonly day: number;   // 1 to 31
}

export interface GregorianDateTuple {
  readonly year: number;
  readonly month: number; // 1 to 12
  readonly day: number;   // 1 to 31
}

export const SOLAR_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
] as const;

export class SolarDateMath {
  /**
   * آیا سال شمسی کبیسه است؟
   */
  static isSolarLeap(jy: number): boolean {
    const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    let jp = breaks[0] ?? -61;
    let jm = 0;
    let jump = 0;
    const n = breaks.length;

    if (jy < jp || jy >= (breaks[n - 1] ?? 3178)) {
      throw new Error(`سال شمسی خارج از محدوده تحت پوشش است: ${jy}`);
    }

    for (let i = 1; i < n; i++) {
      jm = breaks[i] ?? 0;
      jump = jm - jp;
      if (jy < jm) break;
      jp = jm;
    }

    let nYears = jy - jp;
    if (jump - nYears < 6) {
      nYears = nYears - jump + Math.floor((jump + 4) / 33) * 33;
    }
    let leap = (nYears + 1) % 33 - 1;
    if (leap === -1) leap = 4;
    return leap % 4 === 0 && leap !== 0;
  }

  /**
   * تعداد روزهای هر ماه شمسی
   */
  static getDaysInSolarMonth(jy: number, jm: number): number {
    if (jm < 1 || jm > 12) throw new Error('شماره ماه باید بین ۱ تا ۱۲ باشد');
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return SolarDateMath.isSolarLeap(jy) ? 30 : 29;
  }

  /**
   * تبدیل میلادی به هجری شمسی
   */
  static gregorianToSolar(gy: number, gm: number, gd: number): SolarDateTuple {
    const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const isGLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    if (isGLeap) gDaysInMonth[1] = 29;

    let gy2 = gy - 1600;
    let gm2 = gm - 1;
    let gd2 = gd - 1;

    let gDayNo = 365 * gy2 + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400);
    for (let i = 0; i < gm2; ++i) {
      gDayNo += gDaysInMonth[i] ?? 0;
    }
    gDayNo += gd2;

    let jDayNo = gDayNo - 79;
    const jNp = Math.floor(jDayNo / 12053);
    jDayNo %= 12053;

    let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
    jDayNo %= 1461;

    if (jDayNo >= 366) {
      jy += Math.floor((jDayNo - 1) / 365);
      jDayNo = (jDayNo - 1) % 365;
    }

    let jm = 0;
    for (let i = 0; i < 11 && jDayNo >= (i < 6 ? 31 : 30); ++i) {
      jDayNo -= i < 6 ? 31 : 30;
      jm = i + 1;
    }
    jm += 1;
    const jd = jDayNo + 1;

    return { year: jy, month: jm, day: jd };
  }

  /**
   * تبدیل شمسی به میلادی
   */
  static solarToGregorian(jy: number, jm: number, jd: number): GregorianDateTuple {
    let jy2 = jy - 979;
    let jm2 = jm - 1;
    let jd2 = jd - 1;

    let jDayNo = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);
    for (let i = 0; i < jm2; ++i) {
      jDayNo += i < 6 ? 31 : 30;
    }
    jDayNo += jd2;

    let gDayNo = jDayNo + 79;
    let gy = 1600 + 400 * Math.floor(gDayNo / 146097);
    gDayNo %= 146097;

    let leap = true;
    if (gDayNo >= 36525) {
      gDayNo--;
      gy += 100 * Math.floor(gDayNo / 36524);
      gDayNo %= 36524;
      if (gDayNo >= 365) gDayNo++;
      else leap = false;
    }

    gy += 4 * Math.floor(gDayNo / 1461);
    gDayNo %= 1461;

    if (gDayNo >= 366) {
      leap = false;
      gDayNo--;
      gy += Math.floor(gDayNo / 365);
      gDayNo %= 365;
    }

    const gDaysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    for (let i = 0; i < 12 && gDayNo >= (gDaysInMonth[i] ?? 0); i++) {
      gDayNo -= gDaysInMonth[i] ?? 0;
      gm = i + 1;
    }
    gm += 1;
    const gd = gDayNo + 1;

    return { year: gy, month: gm, day: gd };
  }

  /**
   * تبدیل تاریخ Date به شیء شمسی با اعمال ساعت کات‌آف روز (EndOfDayHour)
   */
  static dateToSolar(date: Date, endOfDayHour = 0): SolarDateTuple {
    // اگر ساعت پایان روز مثلا ۴ صبح باشد و ساعت فعلی ۳ بامداد باشد،
    // این ساعت هنوز به عنوان روز قبل تلقی می‌شود.
    const workingDate = new Date(date);
    if (endOfDayHour > 0 && workingDate.getHours() < endOfDayHour) {
      workingDate.setDate(workingDate.getDate() - 1);
    }
    return SolarDateMath.gregorianToSolar(
      workingDate.getFullYear(),
      workingDate.getMonth() + 1,
      workingDate.getDate()
    );
  }

  /**
   * تبدیل شیء شمسی به تاریخ Date میلادی
   */
  static solarToDate(jy: number, jm: number, jd: number): Date {
    const g = SolarDateMath.solarToGregorian(jy, jm, jd);
    return new Date(g.year, g.month - 1, g.day);
  }

  /**
   * فرمت تاریخ شمسی به صورت رشته YYYY-MM-DD
   */
  static formatSolarIso(solar: SolarDateTuple): string {
    const m = String(solar.month).padStart(2, '0');
    const d = String(solar.day).padStart(2, '0');
    return `${solar.year}/${m}/${d}`;
  }

  /**
   * تبدیل ارقام انگلیسی به فارسی
   */
  static toPersianDigits(value: string | number): string {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(value).replace(/[0-9]/g, w => farsiDigits[Number(w)] ?? w);
  }

  /**
   * تبدیل ارقام فارسی به انگلیسی
   */
  static toLatinDigits(value: string): string {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    let result = value;
    for (let i = 0; i < 10; i++) {
      result = result.replaceAll(farsiDigits[i] ?? '', String(i));
    }
    return result;
  }
}
