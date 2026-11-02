import type { BackupFingerprint } from '@/domain/entities/CloudSync';
import { JsonBackupService, type BackupPayload } from '@/infrastructure/export/JsonBackupService';
import { hashSha256, stableStringify, deriveKey, encryptWithKey, decryptWithKey } from './cloudCrypto';
import { CLOUD_CONFIG } from './cloudConfig';
import { CloudSyncError } from './CloudSyncError';
import type { CloudKeyVault } from './CloudKeyVault';

export interface LocalSnapshot {
  payload: BackupPayload;
  fingerprint: BackupFingerprint;
}

export interface EncryptedCloudBackupContainer {
  format: 'hadaf-encrypted-backup';
  version: '1.0';
  algorithm: 'AES-GCM';
  kdf: 'PBKDF2';
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  checksum: string;
  meta: {
    createdAt: string;
    itemsCount: number;
    contentHash?: string;
    source?: 'manual' | 'cloud';
  };
}

export class CloudBackupCodec {
  constructor(private readonly vault: CloudKeyVault) {}

  async snapshotLocal(): Promise<LocalSnapshot> {
    const payload = await JsonBackupService.buildPayload({ excludeDeviceSettings: true });
    return { payload, fingerprint: await this.fingerprintOf(payload) };
  }

  async fingerprintOf(payload: BackupPayload): Promise<BackupFingerprint> {
    const goals = [...(payload.data.goals || [])].sort((a: any, b: any) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const habits = [...(payload.data.habits || [])].sort((a: any, b: any) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const habitLogs = [...(payload.data.habitLogs || [])].sort((a: any, b: any) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    );
    const contentHash = await hashSha256(
      stableStringify({ goals, habits, habitLogs, settings: payload.data.settings })
    );
    const itemsCount = goals.length + habits.length;
    return { contentHash, itemsCount };
  }

  async serialize(snapshot: LocalSnapshot, encrypt: boolean): Promise<string> {
    const json = JSON.stringify(snapshot.payload);
    if (!encrypt) return json;

    const record = await this.vault.getKey();
    if (!record) {
      throw new CloudSyncError(
        'KEY_MISSING',
        'کلید رمزنگاری روی این دستگاه موجود نیست؛ رمزنگاری را دوباره فعال کنید.'
      );
    }

    const encrypted = await encryptWithKey(json, record.key);
    const container: EncryptedCloudBackupContainer = {
      format: 'hadaf-encrypted-backup',
      version: '1.0',
      algorithm: 'AES-GCM',
      kdf: 'PBKDF2',
      iterations: record.iterations,
      salt: record.saltHex,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      checksum: await hashSha256(json),
      meta: {
        createdAt: snapshot.payload.exportedAt,
        itemsCount: snapshot.fingerprint.itemsCount,
        contentHash: snapshot.fingerprint.contentHash,
        source: 'cloud'
      }
    };
    return JSON.stringify(container);
  }

  async open(content: string, passphrase?: string): Promise<BackupPayload> {
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new CloudSyncError('INVALID_BACKUP', 'فایل پشتیبان ابری آسیب دیده است.');
    }

    if (parsed.format !== 'hadaf-encrypted-backup') {
      if (parsed.data && (Array.isArray(parsed.data.goals) || Array.isArray(parsed.data.habits))) {
        return parsed as BackupPayload;
      }
      throw new CloudSyncError('INVALID_BACKUP', 'فرمت فایل پشتیبان ابری معتبر نیست.');
    }

    const container = parsed as EncryptedCloudBackupContainer;
    const json = await this.decrypt(container, passphrase);
    if ((await hashSha256(json)) !== container.checksum) {
      throw new CloudSyncError('INVALID_BACKUP', 'یکپارچگی فایل پشتیبان ابری تأیید نشد.');
    }
    return JSON.parse(json) as BackupPayload;
  }

  private async decrypt(
    container: EncryptedCloudBackupContainer,
    passphrase?: string
  ): Promise<string> {
    if (!passphrase) {
      const record = await this.vault.getKey();
      const matches =
        !!record && record.saltHex === container.salt && record.iterations === container.iterations;
      if (!record || !matches) {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.');
      }
      try {
        return await decryptWithKey(container.ciphertext, container.iv, record.key);
      } catch {
        throw new CloudSyncError('PASSPHRASE_REQUIRED', 'برای باز کردن این پشتیبان، رمز عبور آن را وارد کنید.');
      }
    }

    if (passphrase.length < CLOUD_CONFIG.minPassphraseLength) {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور وارد شده کوتاه‌تر از حد مجاز است.');
    }

    const key = await deriveKey(passphrase, container.salt, container.iterations);
    try {
      const json = await decryptWithKey(container.ciphertext, container.iv, key);
      await this.vault.saveKey(key, container.salt, container.iterations);
      return json;
    } catch {
      throw new CloudSyncError('PASSPHRASE_INVALID', 'رمز عبور اشتباه است یا فایل پشتیبان دستکاری شده است.');
    }
  }
}
