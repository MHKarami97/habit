/**
 * سرویس رمزنگاری کلاینت‌محور با استاندارد W3C Web Cryptography API
 *
 * مستندات و استانداردهای مرجع:
 * ۱) NIST SP 800-132 (Recommendation for Password-Based Key Derivation):
 *    - مشتق‌سازی کلید با PBKDF2 و HMAC-SHA-256
 *    - نمک تصادفی (Salt) با حداقل ۱۲۸ بیت (۱۶ بایت) تولیدشده با CSPRNG (crypto.getRandomValues)
 * ۲) توصیه‌های OWASP Password Storage Cheat Sheet:
 *    - ۲۵۰,۰۰۰ دور (Iterations) برای PBKDF2-HMAC-SHA256 جهت مقاومت در برابر حملات جستجوی فراگیر GPU/ASIC
 *      و حفظ روانی رابط کاربری در محیط کلاینت.
 * ۳) NIST SP 800-38D (Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode - GCM):
 *    - رمزنگاری متقارن با AES-GCM 256-bit
 *    - بردار مقداردهی اولیه (IV / Nonce) دقیقاً ۹۶ بیت (۱۲ بایت) یکتا به ازای هر بار رمزنگاری
 *    - برچسب اصالت‌سنجی ۱۲۸ بیتی (Authentication Tag) جهت تشخیص هرگونه دستکاری یا فساد فایل
 */

export interface EncryptedContainerV1 {
  readonly version: 1;
  readonly saltHex: string;
  readonly ivHex: string;
  readonly cipherTextHex: string;
}

export interface EncryptedBackupContainerV2 {
  readonly appName: 'KavoshHabitGoal';
  readonly format: 'encrypted_backup';
  readonly version: 2;
  readonly kdf: {
    readonly algorithm: 'PBKDF2';
    readonly hash: 'SHA-256';
    readonly iterations: number;
    readonly saltHex: string;
  };
  readonly cipher: {
    readonly algorithm: 'AES-GCM';
    readonly keyLength: 256;
    readonly ivHex: string;
    readonly tagLength: 128;
  };
  readonly cipherTextHex: string;
  readonly exportedAt: string;
}

export type EncryptedContainer = EncryptedContainerV1 | EncryptedBackupContainerV2;

export const DEFAULT_PBKDF2_ITERATIONS = 250000; // مطابق با راهنمای امنیتی OWASP

export class WebCryptoAdapter {
  /**
   * تبدیل آرایه بایت به رشته هگزادسیمال
   */
  static bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * تبدیل رشته هگزادسیمال به آرایه بایت
   */
  static hexToBuffer(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
      throw new Error('رشته هگزادسیمال نامعتبر است');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      const byte = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      if (Number.isNaN(byte)) {
        throw new Error('رشته هگزادسیمال شامل کاراکترهای غیرمجاز است');
      }
      bytes[i] = byte;
    }
    return bytes;
  }

  /**
   * تولید رشته هگز تصادفی امن با CSPRNG
   */
  static generateRandomHex(bytesCount: number): string {
    const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
    return this.bufferToHex(bytes);
  }

  /**
   * مشتق‌سازی کلید با PBKDF2 و HMAC-SHA-256
   */
  private static async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number = DEFAULT_PBKDF2_ITERATIONS
  ): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * رمزگذاری متن پشتیبان با گذرواژه کاربر (تولید کانتینر امن استاندارد V2)
   */
  static async encrypt(
    plainText: string,
    password: string,
    iterations: number = DEFAULT_PBKDF2_ITERATIONS
  ): Promise<string> {
    if (!password || !password.trim()) {
      throw new Error('گذرواژه نباید خالی باشد');
    }

    // ۱۶ بایت (۱۲۸ بیت) Salt تصادفی
    const salt = crypto.getRandomValues(new Uint8Array(16));
    // ۱۲ بایت (۹۶ بیت) IV تصادفی استاندارد NIST برای AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(password, salt, iterations);

    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      enc.encode(plainText)
    );

    const container: EncryptedBackupContainerV2 = {
      appName: 'KavoshHabitGoal',
      format: 'encrypted_backup',
      version: 2,
      kdf: {
        algorithm: 'PBKDF2',
        hash: 'SHA-256',
        iterations,
        saltHex: this.bufferToHex(salt)
      },
      cipher: {
        algorithm: 'AES-GCM',
        keyLength: 256,
        ivHex: this.bufferToHex(iv),
        tagLength: 128
      },
      cipherTextHex: this.bufferToHex(cipherBuffer),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(container, null, 2);
  }

  /**
   * رمزگشایی متن رمزگذاری‌شده با گذرواژه (پشتیبانی همزمان از کانتینر نسخه ۱ و نسخه ۲)
   */
  static async decrypt(encryptedJson: string, password: string): Promise<string> {
    if (!password || !password.trim()) {
      throw new Error('گذرواژه الزامی است');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(encryptedJson);
    } catch {
      throw new Error('قالب فایل رمزشده نامعتبر است (خطای ساختار JSON)');
    }

    let saltHex: string;
    let ivHex: string;
    let cipherTextHex: string;
    let iterations = DEFAULT_PBKDF2_ITERATIONS;

    if (parsed.version === 2 && parsed.format === 'encrypted_backup') {
      const v2 = parsed as EncryptedBackupContainerV2;
      saltHex = v2.kdf.saltHex;
      ivHex = v2.cipher.ivHex;
      cipherTextHex = v2.cipherTextHex;
      iterations = v2.kdf.iterations || DEFAULT_PBKDF2_ITERATIONS;
    } else if (parsed.version === 1 && parsed.saltHex && parsed.ivHex && parsed.cipherTextHex) {
      const v1 = parsed as EncryptedContainerV1;
      saltHex = v1.saltHex;
      ivHex = v1.ivHex;
      cipherTextHex = v1.cipherTextHex;
      iterations = 100000; // سازگاری با فایل‌های آزمایشی فاز قبل
    } else {
      throw new Error('ساختار رمزنگاری ناشناخته یا فایل پشتیبان آسیب‌دیده است');
    }

    if (!saltHex || !ivHex || !cipherTextHex) {
      throw new Error('فایل پشتیبان فاقد مولفه‌های ضروری رمزنگاری است');
    }

    const salt = this.hexToBuffer(saltHex);
    const iv = this.hexToBuffer(ivHex);
    const cipherBytes = this.hexToBuffer(cipherTextHex);

    const key = await this.deriveKey(password, salt, iterations);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: 128 },
        key,
        cipherBytes.buffer as ArrayBuffer
      );
      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    } catch {
      throw new Error('گذرواژه نادرست است یا فایل دستکاری شده است');
    }
  }

  /**
   * بررسی اینکه آیا محتوای ورودی یک کانتینر رمزگذاری‌شده است یا خیر
   */
  static isEncryptedContent(raw: string): boolean {
    try {
      const obj = JSON.parse(raw);
      if (typeof obj !== 'object' || obj === null) return false;
      return (
        (obj.version === 2 && obj.format === 'encrypted_backup' && Boolean(obj.cipherTextHex)) ||
        (obj.version === 1 && Boolean(obj.saltHex && obj.ivHex && obj.cipherTextHex))
      );
    } catch {
      return false;
    }
  }

  /**
   * هش‌کردن پین ورود با Salt تصادفی اختصاصی و الگوریتم SHA-256
   * پین خام هرگز در دیتابیس یا حافظه ماندگار ذخیره نمی‌شود.
   */
  static async hashPin(pin: string, saltHex: string): Promise<string> {
    if (!pin || pin.trim().length < 4) {
      throw new Error('پین باید حداقل ۴ رقم باشد');
    }
    const enc = new TextEncoder();
    // ترکیب پین و سالت جهت جلوگیری از حملات جدول رنگین‌کمانی (Rainbow Tables)
    const combinedData = enc.encode(`${saltHex}:${pin.trim()}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', combinedData);
    return this.bufferToHex(hashBuffer);
  }

  /**
   * راستی‌آزمایی پین واردشده با هش ذخیره‌شده
   */
  static async verifyPin(enteredPin: string, storedHashHex: string, saltHex: string): Promise<boolean> {
    if (!enteredPin || !storedHashHex || !saltHex) return false;
    const computedHash = await this.hashPin(enteredPin, saltHex);
    return computedHash === storedHashHex;
  }
}
