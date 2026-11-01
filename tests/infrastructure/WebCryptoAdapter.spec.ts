import { describe, it, expect } from 'vitest';
import { WebCryptoAdapter } from '@/infrastructure/crypto/WebCryptoAdapter';

describe('WebCryptoAdapter', () => {
  it('encrypts and decrypts text accurately with correct password', async () => {
    const secret = 'اطلاعات محرمانه اهداف و عادات کاربر';
    const password = 'StrongPassword!123';

    const encrypted = await WebCryptoAdapter.encrypt(secret, password);
    expect(encrypted).toContain('cipherTextHex');
    expect(encrypted).not.toContain(secret);

    const decrypted = await WebCryptoAdapter.decrypt(encrypted, password);
    expect(decrypted).toBe(secret);
  });

  it('rejects decryption with incorrect password', async () => {
    const secret = 'اطلاعات محرمانه';
    const encrypted = await WebCryptoAdapter.encrypt(secret, 'CorrectPass');

    await expect(WebCryptoAdapter.decrypt(encrypted, 'WrongPass')).rejects.toThrow(
      'گذرواژه نادرست است یا فایل دستکاری شده است'
    );
  });
});
