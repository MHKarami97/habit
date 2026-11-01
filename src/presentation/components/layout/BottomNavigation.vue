<script setup lang="ts">
import { RouterLink } from 'vue-router';
import AppIcon from '../common/AppIcon.vue';

interface NavItem {
  to: string;
  label: string;
  icon: 'calendar' | 'target' | 'flame' | 'chart' | 'settings';
}

const navItems: readonly NavItem[] = [
  { to: '/', label: 'امروز', icon: 'calendar' },
  { to: '/goals', label: 'اهداف', icon: 'target' },
  { to: '/habits', label: 'عادت‌ها', icon: 'flame' },
  { to: '/analytics', label: 'آمار', icon: 'chart' },
  { to: '/settings', label: 'تنظیمات', icon: 'settings' }
];
</script>

<template>
  <nav class="bottom-nav-bar" aria-label="ناوبری اصلی">
    <div class="bottom-nav-container">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-tab-item touch-target"
        active-class="tab-active"
      >
        <AppIcon :name="item.icon" size="22" />
        <span class="tab-label">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav-bar {
  display: block;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--color-bg-surface);
  border-top: var(--border-width-hairline) solid var(--color-border-subtle);
  padding-bottom: max(var(--spacing-xxs), var(--safe-area-bottom));
  z-index: 50;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
}

@media (min-width: 768px) {
  .bottom-nav-bar {
    display: none; /* پنهان در تبلت و دسکتاپ به نفع سایدبار */
  }
}

.bottom-nav-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 56px;
  max-width: 600px;
  margin: 0 auto;
}

.nav-tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text-muted);
  flex: 1;
  transition: color var(--transition-fast);
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
}

.tab-active {
  color: var(--color-accent);
}
.tab-active .tab-label {
  font-weight: 700;
}
</style>
