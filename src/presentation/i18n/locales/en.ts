import type { TranslationDictionary } from './fa';

export const en: TranslationDictionary = {
  nav: {
    today: 'Today',
    goals: 'Goals',
    habits: 'Habits',
    analytics: 'Analytics & Obstacles',
    guide: 'Guide',
    settings: 'Settings'
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    search: 'Search...',
    download: 'Download',
    upload: 'Upload',
    emptyList: 'No items found.',
    loading: 'Loading...',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive'
  },
  goals: {
    title: 'My Goals',
    newGoal: 'New Goal',
    hierarchyView: 'Tree View',
    kanbanView: 'Kanban View',
    cardView: 'Card View',
    status: {
      draft: 'Draft',
      scheduled: 'Scheduled',
      active: 'In Progress',
      paused: 'Paused',
      completed: 'Completed',
      abandoned: 'Abandoned'
    },
    levels: {
      annual: 'Annual Goal',
      quarterly: 'Quarterly Goal',
      monthly: 'Monthly Goal'
    },
    priority: {
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority'
    },
    progress: 'Progress',
    subgoals: 'Subgoals',
    dependencies: 'Dependencies & Prerequisites'
  },
  habits: {
    title: 'My Habits',
    newHabit: 'New Habit',
    streak: 'Current Streak',
    bestStreak: 'Best Streak',
    adherence: 'Adherence Rate',
    checkin: 'Check-in',
    habitLoop: 'Habit Loop',
    cue: 'Cue / Trigger',
    routine: 'Routine',
    reward: 'Reward'
  },
  security: {
    title: 'Security & Privacy',
    pinLock: 'PIN Lock',
    pinEnabled: 'Lock is Active',
    pinDisabled: 'Lock is Disabled',
    setupPin: 'Set PIN Lock',
    changePin: 'Change PIN',
    removePin: 'Remove PIN',
    lockNow: 'Lock App Now',
    disclaimerTitle: 'Security Notice',
    disclaimerText: 'This lock is a privacy screen against shoulder surfing and is not encrypted on-disk storage unless all IndexedDB records are encrypted.',
    encryptedBackup: 'Encrypted Backup (AES-GCM)',
    exportEncrypted: 'Export Encrypted Backup (AES-256)',
    backupWarning: 'Forgetting the password means permanent and irreversible loss of backup file data.'
  },
  settings: {
    language: 'App Language',
    theme: 'Appearance Theme',
    calendar: 'Calendar & Digits',
    persian: 'فارسی (تقویم خورشیدی)',
    english: 'English (Gregorian Calendar)'
  }
};
