<script setup lang="ts">
import { ref } from 'vue';
import { HABIT_EXAMPLE_TEMPLATES, type HabitExampleTemplate } from '../../data/interactiveExamples';
import AppModal from '../common/AppModal.vue';
import AppButton from '../common/AppButton.vue';
import AppIcon from '../common/AppIcon.vue';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select-template', templateData: HabitExampleTemplate['data']): void;
}>();

const activeTab = ref<'examples' | 'principles'>('examples');

const handleSelect = (tmpl: HabitExampleTemplate) => {
  emit('select-template', tmpl.data);
  emit('close');
};
</script>

<template>
  <AppModal
    :is-open="isOpen"
    title="راهنمای ساخت عادت ماندگار (Tiny Habits)"
    size="lg"
    @close="$emit('close')"
  >
    <div class="interactive-guide-modal-content">
      <!-- تب‌های ناوبری داخلی -->
      <div class="guide-nav-tabs">
        <button
          type="button"
          :class="['guide-tab-btn', { active: activeTab === 'examples' }]"
          @click="activeTab = 'examples'"
        >
          <AppIcon name="flame" size="16" />
          الگوها و مثال‌های تعاملی
        </button>
        <button
          type="button"
          :class="['guide-tab-btn', { active: activeTab === 'principles' }]"
          @click="activeTab = 'principles'"
        >
          <AppIcon name="info" size="16" />
          اصول علمی عادت‌سازی
        </button>
      </div>

      <!-- محتوای تب مثال‌های آماده -->
      <div v-if="activeTab === 'examples'" class="tab-body">
        <p class="tab-intro">
          یکی از عادات مهندسی‌شده زیر را انتخاب کنید تا تنظیمات بهینه (نوع عادت، هدف روزانه، و لنگر رفتاری) خودکار در فرم بارگذاری شود:
        </p>

        <div class="templates-grid">
          <div
            v-for="tmpl in HABIT_EXAMPLE_TEMPLATES"
            :key="tmpl.id"
            class="template-card"
          >
            <div class="tmpl-badge-row">
              <span class="tmpl-badge">{{ tmpl.badge }}</span>
              <span class="tmpl-duration">{{ tmpl.data.dailyTarget }} {{ tmpl.data.unit }}</span>
            </div>

            <h4 class="tmpl-title">{{ tmpl.title }}</h4>
            <p class="tmpl-tagline">{{ tmpl.tagline }}</p>
            <p class="tmpl-desc">{{ tmpl.description }}</p>

            <div class="cue-preview-box">
              <AppIcon name="target" size="14" class="text-accent" />
              <span><strong>لنگر محرک:</strong> {{ tmpl.data.cue }}</span>
            </div>

            <div class="why-works-box">
              <AppIcon name="check" size="14" class="text-success" />
              <span><strong>چرا کار می‌کند؟</strong> {{ tmpl.whyItWorks }}</span>
            </div>

            <div class="tmpl-action">
              <AppButton
                variant="primary"
                size="sm"
                @click="handleSelect(tmpl)"
              >
                استفاده از این مثال در فرم
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <!-- محتوای تب اصول علمی -->
      <div v-else class="tab-body">
        <div class="principles-list">
          <div class="principle-item">
            <span class="principle-num">۱</span>
            <div>
              <strong>قانون شروع زیر ۲ دقیقه (Tiny Habits - Stanford):</strong>
              <p>در ۲۱ روز اول، هدف شما پیشرفت بزرگ نیست؛ هدف شما خاموش کردن زنگ هشدار مقاومت در مغز است. حجم کار را چنان خرد کنید که نتوانید انجام ندهید.</p>
            </div>
          </div>

          <div class="principle-item">
            <span class="principle-num">۲</span>
            <div>
              <strong>پیوند به لنگر موجود (Habit Stacking):</strong>
              <p>عادت جدید را روی دوش عادتی بگذارید که هم‌اکنون به صورت خودکار انجام می‌دهید: «بلافاصله بعد از [ریختن قهوه / مسواک زدن]، [عادت جدید] را اجرا می‌کنم».</p>
            </div>
          </div>

          <div class="principle-item">
            <span class="principle-num">۳</span>
            <div>
              <strong>قانون طلایی «هرگز دو روز پیاپی فراموش نکن»:</strong>
              <p>یک روز فراموشی تصادفی به ساختار مسیرهای عصبی آسیبی نمی‌زند (پژوهش UCL، ۲۰۰۹)؛ اما دو روز وقفه به معنای آغاز غیررسمی یک عادت منفی است.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <AppButton variant="ghost" size="md" @click="$emit('close')">
        بستن راهنما
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.interactive-guide-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.guide-nav-tabs {
  display: flex;
  gap: var(--spacing-xs);
  border-bottom: var(--border-width-hairline) solid var(--color-border-subtle);
  padding-bottom: var(--spacing-xs);
}

.guide-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  background: none;
  border: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.guide-tab-btn:hover {
  background-color: var(--color-bg-surface-soft);
  color: var(--color-text-primary);
}

.guide-tab-btn.active {
  background-color: var(--color-accent-subtle);
  color: var(--color-accent);
}

.tab-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tab-intro {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.templates-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

@media (min-width: 640px) {
  .templates-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.template-card {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color var(--transition-fast);
}

.template-card:hover {
  border-color: var(--color-accent);
}

.tmpl-badge-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tmpl-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
}

.tmpl-duration {
  font-size: 11px;
  color: var(--color-text-muted);
}

.tmpl-title {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.tmpl-tagline {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tmpl-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.cue-preview-box {
  background-color: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  padding: 4px 8px;
  font-size: 11px;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.why-works-box {
  background-color: var(--color-bg-surface);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
  font-size: 11px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.5;
}

.tmpl-action {
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
}

.principles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.principle-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  background-color: var(--color-bg-surface-soft);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.principle-num {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: 700;
  flex-shrink: 0;
}

.principle-item div {
  font-size: var(--font-size-xs);
  line-height: 1.6;
}

.principle-item strong {
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 2px;
}

.principle-item p {
  color: var(--color-text-secondary);
}
</style>
