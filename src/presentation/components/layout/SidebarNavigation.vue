<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppIcon from '../common/AppIcon.vue';
import { useI18n } from '../../i18n/useI18n';

const { t } = useI18n();

interface NavItem {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: 'calendar' | 'target' | 'flame' | 'chart' | 'settings' | 'info';
}

const navItems: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.today', defaultLabel: 'امروز و تمرکز', icon: 'calendar' },
  { to: '/goals', labelKey: 'nav.goals', defaultLabel: 'اهداف', icon: 'target' },
  { to: '/habits', labelKey: 'nav.habits', defaultLabel: 'ردیابی عادت‌ها', icon: 'flame' },
  { to: '/analytics', labelKey: 'nav.analytics', defaultLabel: 'آمار و پایبندی', icon: 'chart' },
  { to: '/guide', labelKey: 'nav.guide', defaultLabel: 'راهنمای علمی و عملی', icon: 'info' },
  { to: '/settings', labelKey: 'nav.settings', defaultLabel: 'تنظیمات و پشتیبان', icon: 'settings' }
];
</script>

<template>
  <aside class="sidebar-aside" :aria-label="t('nav.today', 'ناوبری جانبی')">
    <div class="sidebar-brand">
      <div class="brand-logo-mark">
        <AppIcon name="target" size="24" />
      </div>
      <div class="brand-info">
        <span class="brand-title">کاوش</span>
        <span class="brand-subtitle">اهداف و عادات</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar-nav-link"
        active-class="sidebar-link-active"
      >
        <AppIcon :name="item.icon" size="20" />
        <span class="link-text">{{ t(item.labelKey, item.defaultLabel) }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-footer">
      <span class="privacy-badge">
        <AppIcon name="shield" size="14" />
        ۱۰۰٪ محلی و آفلاین
      </span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-aside {
  display: none;
  width: 240px;
  background-color: var(--color-bg-surface);
  border-left: var(--border-width-hairline) solid var(--color-border-subtle);
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  padding: var(--spacing-lg) var(--spacing-md);
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .sidebar-aside {
    display: flex;
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  padding: 0 var(--spacing-xs);
}

.brand-logo-mark {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 11px;
  color: var(--color-text-muted);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xxs);
  flex: 1;
}

.sidebar-nav-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.sidebar-nav-link:hover {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-primary);
}

.sidebar-link-active {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
  font-weight: 700;
}

.sidebar-footer {
  padding-top: var(--spacing-md);
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
}

.privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xxs);
  font-size: 11px;
  color: var(--color-success);
  font-weight: 600;
}
</style>
