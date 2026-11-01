import { describe, it, expect } from 'vitest';
import { BackupValidatorService, MAX_BACKUP_SIZE_BYTES } from '@/infrastructure/export/BackupValidatorService';
import { JsonBackupService } from '@/infrastructure/export/JsonBackupService';
import { WebCryptoAdapter } from '@/infrastructure/crypto/WebCryptoAdapter';

describe('Phase 3 Package 3: Backup Security, Strict Validation & PIN Protection', () => {
  describe('BackupValidatorService Strict Rules', () => {
    it('rejects backup files that exceed the maximum 15MB size limit', () => {
      const smallContent = JSON.stringify({ appName: 'KavoshHabitGoal' });
      const fakeLargeSizeBytes = MAX_BACKUP_SIZE_BYTES + 1024; // 15MB + 1KB

      const result = BackupValidatorService.validate(smallContent, fakeLargeSizeBytes);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('بیش از حد مجاز است');
    });

    it('rejects invalid or corrupted JSON strings', () => {
      const broken = '{"appName": "KavoshHabitGoal", data: {broken...';
      const result = BackupValidatorService.validate(broken);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('معتبر JSON ندارد');
    });

    it('sanitizes and neutralizes prototype pollution payloads', () => {
      const maliciousJson = JSON.stringify({
        appName: 'KavoshHabitGoal',
        schemaVersion: 1,
        "__proto__": { "polluted": true },
        data: {
          goals: [],
          habits: []
        }
      });

      const result = BackupValidatorService.validate(maliciousJson);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPayload).toBeDefined();
      // اطمینان از اینکه شیء گلوبال آلوده نشده است
      expect(({} as any).polluted).toBeUndefined();
    });

    it('rejects backup files lacking authentic appName identifier', () => {
      const foreignJson = JSON.stringify({
        appName: 'ForeignApp',
        schemaVersion: 1,
        data: { goals: [], habits: [] }
      });

      const result = BackupValidatorService.validate(foreignJson);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('متعلق به نسخه پشتیبان برنامه «کاوش» نیست');
    });

    it('rejects backup files with invalid schema version', () => {
      const invalidVersion = JSON.stringify({
        appName: 'KavoshHabitGoal',
        schemaVersion: -1,
        data: { goals: [], habits: [] }
      });

      const result = BackupValidatorService.validate(invalidVersion);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('شماره نسخه اسکیمای فایل پشتیبان نامعتبر است');
    });

    it('rejects goals or habits with missing mandatory fields', () => {
      const badGoal = JSON.stringify({
        appName: 'KavoshHabitGoal',
        schemaVersion: 1,
        data: {
          goals: [{ id: 'g1' /* missing title */ }],
          habits: []
        }
      });

      const result = BackupValidatorService.validate(badGoal);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('فاقد شناسه یا عنوان معتبر است');
    });

    it('approves clean authentic backup and provides sanitized payload', () => {
      const valid = JSON.stringify({
        appName: 'KavoshHabitGoal',
        schemaVersion: 1,
        exportedAt: '2026-11-01T10:00:00Z',
        data: {
          goals: [{ id: 'g1', title: 'هدف تاییدشده' }],
          habits: [{ id: 'h1', title: 'عادت تاییدشده' }],
          milestones: [],
          actionLogs: [],
          obstacleLogs: [],
          habitLogs: [],
          userTemplates: [{ id: 't1', title: 'قالب' }]
        }
      });

      const result = BackupValidatorService.validate(valid);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedPayload?.data.goals.length).toBe(1);
      expect(result.sanitizedPayload?.data.habits.length).toBe(1);
    });
  });

  describe('JsonBackupService Encrypted Export & Decrypt Preview', () => {
    it('encrypts valid backup with password and accurately previews statistical content after decryption', async () => {
      const plainBackup = JSON.stringify({
        appName: 'KavoshHabitGoal',
        schemaVersion: 1,
        exportedAt: '2026-11-01T10:00:00Z',
        data: {
          goals: [
            { id: 'g1', title: 'هدف اول' },
            { id: 'g2', title: 'هدف دوم' }
          ],
          habits: [{ id: 'h1', title: 'عادت اول' }],
          milestones: [],
          actionLogs: [],
          obstacleLogs: [],
          habitLogs: [{ id: 'hl1' }, { id: 'hl2' }],
          userTemplates: [{ id: 'ut1', title: 'قالب اول' }]
        }
      });

      const password = 'MySecretBackupPassword!2026';
      const encrypted = await WebCryptoAdapter.encrypt(plainBackup, password);

      // ۱. بدون ارسال گذرواژه: درخواست گذرواژه می‌دهد
      const lockedPreview = await JsonBackupService.validateAndPreview(encrypted);
      expect(lockedPreview.isValid).toBe(false);
      expect(lockedPreview.isEncrypted).toBe(true);
      expect(lockedPreview.requiresPassword).toBe(true);

      // ۲. با گذرواژه اشتباه: رد می‌شود
      const wrongPassPreview = await JsonBackupService.validateAndPreview(encrypted, 'WrongPassword');
      expect(wrongPassPreview.isValid).toBe(false);
      expect(wrongPassPreview.errorMessage).toContain('گذرواژه نادرست است');

      // ۳. با گذرواژه صحیح: رمزگشایی و آمار دقیق استخراج می‌شود
      const correctPreview = await JsonBackupService.validateAndPreview(encrypted, password);
      expect(correctPreview.isValid).toBe(true);
      expect(correctPreview.isEncrypted).toBe(true);
      expect(correctPreview.goalsCount).toBe(2);
      expect(correctPreview.habitsCount).toBe(1);
      expect(correctPreview.habitLogsCount).toBe(2);
      expect(correctPreview.userTemplatesCount).toBe(1);
      expect(correctPreview.decryptedPayload).toBeDefined();
    });
  });
});
