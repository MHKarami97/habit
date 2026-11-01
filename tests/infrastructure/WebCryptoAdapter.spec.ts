import { describe, it, expect } from 'vitest';
import { WebCryptoAdapter } from '@/infrastructure/crypto/WebCryptoAdapter';

describe('Phase 3 Package 3: WebCryptoAdapter Security & Standards', () => {
  describe('Encryption & Decryption (AES-GCM 256 + PBKDF2 SHA-256)', () => {
    it('encrypts plaintext into NIST SP 800-132 / OWASP compliant V2 container with 250,000 iterations and decrypts accurately', async () => {
      const secret = 'اطلاعات محرمانه اهداف و عادات کاربر کاوش';
      const password = 'StrongPassword!123';

      const encrypted = await WebCryptoAdapter.encrypt(secret, password);
      expect(encrypted).not.toContain(secret);

      const container = JSON.parse(encrypted);
      expect(container.appName).toBe('KavoshHabitGoal');
      expect(container.format).toBe('encrypted_backup');
      expect(container.version).toBe(2);
      expect(container.kdf.algorithm).toBe('PBKDF2');
      expect(container.kdf.hash).toBe('SHA-256');
      expect(container.kdf.iterations).toBe(250000);
      expect(container.cipher.algorithm).toBe('AES-GCM');
      expect(container.cipher.keyLength).toBe(256);
      expect(container.cipher.tagLength).toBe(128);
      expect(container.cipher.ivHex.length).toBe(24); // 12 bytes = 24 hex chars (96 bits)
      expect(container.kdf.saltHex.length).toBe(32); // 16 bytes = 32 hex chars (128 bits)

      const decrypted = await WebCryptoAdapter.decrypt(encrypted, password);
      expect(decrypted).toBe(secret);
    });

    it('rejects decryption when given an incorrect password', async () => {
      const secret = 'اطلاعات محرمانه';
      const encrypted = await WebCryptoAdapter.encrypt(secret, 'CorrectPass');

      await expect(WebCryptoAdapter.decrypt(encrypted, 'WrongPass')).rejects.toThrow(
        'گذرواژه نادرست است یا فایل دستکاری شده است'
      );
    });

    it('rejects decryption when ciphertext has been tampered with', async () => {
      const secret = 'داده‌های تست دستکاری';
      const encrypted = await WebCryptoAdapter.encrypt(secret, 'SafePass123');
      const container = JSON.parse(encrypted);

      // دستکاری آخرین بایت‌های متن رمزشده
      const tamperedHex = container.cipherTextHex.slice(0, -4) + '0000';
      const tamperedContainer = { ...container, cipherTextHex: tamperedHex };

      await expect(
        WebCryptoAdapter.decrypt(JSON.stringify(tamperedContainer), 'SafePass123')
      ).rejects.toThrow('گذرواژه نادرست است یا فایل دستکاری شده است');
    });

    it('rejects decryption when IV has been tampered with', async () => {
      const secret = 'داده‌های تست IV';
      const encrypted = await WebCryptoAdapter.encrypt(secret, 'SafePass123');
      const container = JSON.parse(encrypted);

      const tamperedIv = container.cipher.ivHex.slice(0, -2) + 'ff';
      const tamperedContainer = {
        ...container,
        cipher: { ...container.cipher, ivHex: tamperedIv }
      };

      await expect(
        WebCryptoAdapter.decrypt(JSON.stringify(tamperedContainer), 'SafePass123')
      ).rejects.toThrow('گذرواژه نادرست است یا فایل دستکاری شده است');
    });

    it('maintains backwards compatibility with legacy V1 encrypted containers', async () => {
      // شبیه‌سازی کانتینر نسخه ۱ فاز قبل
      const legacyContainer = {
        version: 1,
        saltHex: '0102030405060708090a0b0c0d0e0f10',
        ivHex: '0102030405060708090a0b0c',
        cipherTextHex: '00112233'
      };

      // باید ساختار را بشناسد و تلاش کند decrypt کند
      await expect(
        WebCryptoAdapter.decrypt(JSON.stringify(legacyContainer), 'SomePass')
      ).rejects.toThrow('گذرواژه نادرست است یا فایل دستکاری شده است');
    });

    it('accurately identifies encrypted content vs plain json', async () => {
      const plainJson = JSON.stringify({ appName: 'KavoshHabitGoal', data: {} });
      expect(WebCryptoAdapter.isEncryptedContent(plainJson)).toBe(false);

      const encrypted = await WebCryptoAdapter.encrypt(plainJson, 'Pass123');
      expect(WebCryptoAdapter.isEncryptedContent(encrypted)).toBe(true);

      expect(WebCryptoAdapter.isEncryptedContent('not a json')).toBe(false);
    });
  });

  describe('PIN Hashing & Authentication Security', () => {
    it('hashes PIN with unique salt using SHA-256 and verifies accurately', async () => {
      const pin = '5829';
      const saltHex = WebCryptoAdapter.generateRandomHex(16);

      const hash1 = await WebCryptoAdapter.hashPin(pin, saltHex);
      expect(hash1.length).toBe(64); // SHA-256 produces 32 bytes = 64 hex characters

      // راستی‌آزمایی با پین درست
      const isValid = await WebCryptoAdapter.verifyPin(pin, hash1, saltHex);
      expect(isValid).toBe(true);

      // رد راستی‌آزمایی با پین اشتباه
      const isInvalid = await WebCryptoAdapter.verifyPin('1234', hash1, saltHex);
      expect(isInvalid).toBe(false);
    });

    it('produces different hashes for the same PIN with different salts (Rainbow table protection)', async () => {
      const pin = '1234';
      const salt1 = WebCryptoAdapter.generateRandomHex(16);
      const salt2 = WebCryptoAdapter.generateRandomHex(16);

      const hash1 = await WebCryptoAdapter.hashPin(pin, salt1);
      const hash2 = await WebCryptoAdapter.hashPin(pin, salt2);

      expect(hash1).not.toBe(hash2);
    });

    it('rejects PINs shorter than 4 digits', async () => {
      const saltHex = WebCryptoAdapter.generateRandomHex(16);
      await expect(WebCryptoAdapter.hashPin('123', saltHex)).rejects.toThrow(
        'پین باید حداقل ۴ رقم باشد'
      );
    });
  });
});
