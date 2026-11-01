import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'today',
      component: () => import('../views/TodayView.vue')
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('../views/GoalsView.vue')
    },
    {
      path: '/goals/:id',
      name: 'goal-detail',
      component: () => import('../views/GoalDetailView.vue')
    },
    {
      path: '/habits',
      name: 'habits',
      component: () => import('../views/HabitsView.vue')
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/AnalyticsView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
  scrollBehavior() {
    return { top: 0 };
  }
});
