<script setup lang="ts">
defineProps<{
  name:
    | 'check'
    | 'plus'
    | 'trash'
    | 'edit'
    | 'calendar'
    | 'target'
    | 'flame'
    | 'settings'
    | 'chart'
    | 'sun'
    | 'moon'
    | 'download'
    | 'upload'
    | 'pause'
    | 'play'
    | 'chevron-right'
    | 'chevron-left'
    | 'chevron-down'
    | 'info'
    | 'alert'
    | 'x'
    | 'snowflake'
    | 'refresh'
    | 'shield'
    | 'share';
  size?: number | string;
}>();
</script>

<template>
  <svg
    :width="size || 20"
    :height="size || 20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="app-icon"
  >
    <!-- check -->
    <path v-if="name === 'check'" d="M20 6L9 17l-5-5" />
    <!-- plus -->
    <path v-else-if="name === 'plus'" d="M12 5v14M5 12h14" />
    <!-- trash -->
    <path v-else-if="name === 'trash'" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
    <!-- edit -->
    <path v-else-if="name === 'edit'" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    <!-- calendar -->
    <g v-else-if="name === 'calendar'">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </g>
    <!-- target -->
    <g v-else-if="name === 'target'">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </g>
    <!-- flame -->
    <path v-else-if="name === 'flame'" d="M8.5 14.5A2.5 2.5 0 0011 17c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.07-2.73-1.74-3.5C11.3 10.47 11 9.77 11 9c0-1.5 1-3.5 3-4.5-1 3.5 2 4.5 2 7 0 2.76-2.24 5-5 5a5 5 0 01-5-5c0-2.4 1.5-4.5 2.5-5.5 0 1.5.5 3 0 3.5z" />
    <!-- settings -->
    <g v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </g>
    <!-- chart -->
    <path v-else-if="name === 'chart'" d="M18 20V10M12 20V4M6 20v-6" />
    <!-- sun -->
    <g v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
    <!-- moon -->
    <path v-else-if="name === 'moon'" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    <!-- download -->
    <path v-else-if="name === 'download'" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    <!-- upload -->
    <path v-else-if="name === 'upload'" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    <!-- pause -->
    <g v-else-if="name === 'pause'">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </g>
    <!-- play -->
    <polygon v-else-if="name === 'play'" points="5 3 19 12 5 21 5 3" />
    <!-- chevron-right -->
    <polyline v-else-if="name === 'chevron-right'" points="9 18 15 12 9 6" />
    <!-- chevron-left -->
    <polyline v-else-if="name === 'chevron-left'" points="15 18 9 12 15 6" />
    <!-- chevron-down -->
    <polyline v-else-if="name === 'chevron-down'" points="6 9 12 15 18 9" />
    <!-- info -->
    <g v-else-if="name === 'info'">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </g>
    <!-- alert -->
    <g v-else-if="name === 'alert'">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </g>
    <!-- x -->
    <line v-else-if="name === 'x'" x1="18" y1="6" x2="6" y2="18" />
    <line v-if="name === 'x'" x1="6" y1="6" x2="18" y2="18" />
    <!-- snowflake (روز فریز) -->
    <g v-else-if="name === 'snowflake'">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    </g>
    <!-- refresh -->
    <g v-else-if="name === 'refresh'">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </g>
    <!-- shield -->
    <path v-else-if="name === 'shield'" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <!-- share -->
    <g v-else-if="name === 'share'">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </g>
  </svg>
</template>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
