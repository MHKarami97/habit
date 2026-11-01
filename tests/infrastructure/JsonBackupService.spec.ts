import { describe, it, expect } from 'vitest';
import { JsonBackupService } from '@/infrastructure/export/JsonBackupService';

describe('JsonBackupService Validation', () => {
  it('validates authentic backup json format and previews counts', async () => {
    const raw = JSON.stringify({
      appName: 'KavoshHabitGoal',
      schemaVersion: 1,
      exportedAt: '2026-11-01T08:00:00Z',
      data: {
        goals: [{ id: 'g1', title: 'هدف ۱' }, { id: 'g2', title: 'هدف ۲' }],
        milestones: [],
        actionLogs: [],
        obstacleLogs: [],
        habits: [{ id: 'h1', title: 'عادت ۱' }],
        habitLogs: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }],
        settings: {}
      }
    });

    const preview = await JsonBackupService.validateAndPreview(raw);
    expect(preview.isValid).toBe(true);
    expect(preview.schemaVersion).toBe(1);
    expect(preview.goalsCount).toBe(2);
    expect(preview.habitsCount).toBe(1);
    expect(preview.habitLogsCount).toBe(3);
  });

  it('rejects foreign or corrupted JSON', async () => {
    const badJson = '{"foo": "bar"}';
    const preview = await JsonBackupService.validateAndPreview(badJson);
    expect(preview.isValid).toBe(false);
    expect(preview.errorMessage).toContain('برنامه «کاوش» نیست');
  });

  it('handles syntax errors gracefully', async () => {
    const broken = '{invalid-json';
    const preview = await JsonBackupService.validateAndPreview(broken);
    expect(preview.isValid).toBe(false);
    expect(preview.errorMessage).toContain('معتبر JSON ندارد');
  });
});
