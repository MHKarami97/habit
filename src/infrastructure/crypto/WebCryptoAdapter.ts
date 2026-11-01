/**
 * رمزنگاری کلاینت‌محور با استاندارد W3C Web Cryptography API
 * الگوریتم: AES-GCM 256-bit با کلید مشتق‌شده از PBKDF2 (SHA-256 با ۱۰۰,۰۰۰ دور)
 */

export interface EncryptedContainer {
  readonly version: 1;
  readonly saltHex: string;
  readonly ivHex: string;
  readonly cipherTextHex: string;
}

export class WebCryptoAdapter {
  private static bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * رمزگذاری متن با گذرواژه کاربر
   */
  static async encrypt(plainText: string, password: string): Promise<string> {
    if (!password) throw new Error('گذرواژه نباید خالی باشد');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await WebCryptoAdapter.deriveKey(password, salt);

    const enc = new TextEncoder();
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText)
    );

    const container: EncryptedContainer = {
      version: 1,
      saltHex: WebCryptoAdapter.bufferToHex(salt.buffer as ArrayBuffer),
      ivHex: WebCryptoAdapter.bufferToHex(iv.buffer as ArrayBuffer),
      cipherTextHex: WebCryptoAdapter.bufferToHex(cipherBuffer)
    };

    return JSON.stringify(container);
  }

  /**
   * رمزگشایی متن رمزگذاری‌شده با گذرواژه
   */
  static async decrypt(encryptedJson: string, password: string): Promise<string> {
    if (!password) throw new Error('گذرواژه الزامی است');
    let container: EncryptedContainer;
    try {
      container = JSON.parse(encryptedJson) as EncryptedContainer;
    } catch {
      throw new Error('قالب فایل رمزشده نامعتبر است');
    }

    if (container.version !== 1 || !container.saltHex || !container.ivHex || !container.cipherTextHex) {
      throw new Error('ساختار رمزنگاری ناشناخته یا آسیب‌دیده است');
    }

    const salt = WebCryptoAdapter.hexToBuffer(container.saltHex);
    const iv = WebCryptoAdapter.hexToBuffer(container.ivHex);
    const cipherBytes = WebCryptoAdapter.hexToBuffer(container.cipherTextHex);

    const key = await WebCryptoAdapter.deriveKey(password, salt);

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
        key,
        cipherBytes.buffer as ArrayBuffer
      );
      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    } catch {
      throw new Error('گذرواژه نادرست است یا فایل دستکاری شده است');
    }
  }
}
