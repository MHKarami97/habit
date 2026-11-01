<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { GUIDE_ARTICLES } from '../data/guideArticles';
import { usePersianCalendar } from '../composables/usePersianCalendar';
import AppInput from '../components/common/AppInput.vue';
import AppIcon from '../components/common/AppIcon.vue';
import AppButton from '../components/common/AppButton.vue';

const route = useRoute();
const { localizeDigits } = usePersianCalendar();

const searchQuery = ref('');
const selectedCategory = ref<string>('all');
const expandedArticleId = ref<string | null>(null);

const categories = [
  { id: 'all', label: 'همه موضوعات' },
  { id: 'foundations', label: 'مفاهیم پایه' },
  { id: 'goals', label: 'مهارت هدف‌گذاری' },
  { id: 'habits', label: 'مهارت عادت‌سازی' },
  { id: 'obstacles', label: 'مدیریت موانع' },
  { id: 'science', label: 'روان‌شناسی رفتار' }
];

onMounted(() => {
  // اگر از صفحه دیگری با کوئری topic هدایت شده باشد، مقاله مربوطه باز شود
  const topicParam = String(route.query.topic || '');
  if (topicParam && GUIDE_ARTICLES.some(a => a.id === topicParam)) {
    expandedArticleId.value = topicParam;
    setTimeout(() => {
      const el = document.getElementById(`article-${topicParam}`);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  } else {
    // پیش‌فرض باز بودن مقاله اول
    expandedArticleId.value = GUIDE_ARTICLES[0]?.id || null;
  }
});

const filteredArticles = computed(() => {
  let list = GUIDE_ARTICLES;

  if (selectedCategory.value !== 'all') {
    list = list.filter(a => a.category === selectedCategory.value);
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    list = list.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.summary.toLowerCase().includes(query) ||
      a.keyTakeaways.some(k => k.toLowerCase().includes(query)) ||
      a.contentMarkdown.toLowerCase().includes(query)
    );
  }

  return list;
});

const toggleArticle = (id: string) => {
  if (expandedArticleId.value === id) {
    expandedArticleId.value = null;
  } else {
    expandedArticleId.value = id;
  }
};
</script>

<template>
  <div class="guide-view-container">
    <!-- هدر معرفی بخش راهنما -->
    <header class="guide-header-card">
      <div class="guide-header-text">
        <h2 class="guide-main-heading">پایگاه دانش و علم تغییر رفتار</h2>
        <p class="guide-subtitle">
          آموزش‌های کاربردی و مبتنی بر شواهد تجربی آزمایشگاه‌های روان‌شناسی دانشگاه‌های استنفورد، نیویورک و کالج لندن، بدون ادعاهای انگیزشی زرد.
        </p>
      </div>

      <div class="search-box-row">
        <AppInput
          v-model="searchQuery"
          placeholder="جست‌وجو در مباحث، پژوهش‌ها، موانع..."
        >
          <template #prefix>
            <AppIcon name="info" size="18" class="search-icon" />
          </template>
        </AppInput>
      </div>

      <!-- فیلترهای دسته‌بندی موضوعی -->
      <nav class="categories-filter-bar" aria-label="دسته‌بندی موضوعات راهنما">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          :class="['category-pill', { active: selectedCategory === cat.id }]"
          @click="selectedCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </nav>
    </header>

    <!-- فهرست مقالات دانشنامه -->
    <main class="articles-list">
      <div v-if="filteredArticles.length === 0" class="no-results-box">
        <AppIcon name="info" size="32" class="text-muted" />
        <p>مقاله‌ای مطابق با جست‌وجوی شما یافت نشد.</p>
        <AppButton variant="secondary" size="sm" @click="searchQuery = ''; selectedCategory = 'all'">
          نمایش همه مقالات
        </AppButton>
      </div>

      <article
        v-for="article in filteredArticles"
        :id="`article-${article.id}`"
        :key="article.id"
        :class="['article-card', { 'is-expanded': expandedArticleId === article.id }]"
      >
        <header class="article-header" @click="toggleArticle(article.id)">
          <div class="article-meta-row">
            <span class="article-category-badge">{{ article.categoryLabel }}</span>
            <span class="reading-time">
              <AppIcon name="clock" size="14" />
              {{ localizeDigits(article.readingTimeMinutes) }} دقیقه مطالعه
            </span>
          </div>

          <div class="title-toggle-row">
            <h3 class="article-title">{{ article.title }}</h3>
            <button
              type="button"
              class="expand-toggle-btn touch-target"
              :aria-expanded="expandedArticleId === article.id"
              :aria-label="expandedArticleId === article.id ? 'بستن مقاله' : 'مشاهده کامل مقاله'"
            >
              <AppIcon
                :name="expandedArticleId === article.id ? 'chevron-down' : 'chevron-left'"
                size="20"
              />
            </button>
          </div>

          <p class="article-summary">{{ article.summary }}</p>
        </header>

        <!-- محتوای کامل مقاله هنگام باز شدن -->
        <div v-if="expandedArticleId === article.id" class="article-full-body animate-slide-up">
          <!-- نکات کلیدی اجرایی -->
          <div class="takeaways-box">
            <h4 class="box-heading">
              <AppIcon name="check" size="16" class="text-success" />
              نکات کلیدی برای به خاطر سپردن:
            </h4>
            <ul class="takeaways-list">
              <li v-for="(takeaway, idx) in article.keyTakeaways" :key="idx">
                {{ takeaway }}
              </li>
            </ul>
          </div>

          <!-- بدنه متن توضیحی -->
          <div class="markdown-prose">
            <div
              v-for="(para, pIdx) in article.contentMarkdown.split('\n\n')"
              :key="pIdx"
              class="prose-paragraph"
            >
              <p v-if="para.trim()">{{ para.trim() }}</p>
            </div>
          </div>

          <!-- پیشنهادات کاربردی کاوش -->
          <div class="practical-tips-box">
            <h4 class="box-heading">
              <AppIcon name="target" size="16" class="text-accent" />
              پیشنهادات کاربردی در اپ کاوش:
            </h4>
            <ul class="tips-list">
              <li v-for="(tip, tIdx) in article.practicalSuggestions" :key="tIdx">
                {{ tip }}
              </li>
            </ul>
          </div>

          <!-- ارجاعات آکادمیک و منابع علمی -->
          <footer v-if="article.academicCitations.length > 0" class="citations-box">
            <h4 class="box-heading">
              <AppIcon name="shield" size="16" class="text-muted" />
              منابع علمی و پژوهش‌های مرجع:
            </h4>
            <div class="citations-list">
              <div
                v-for="(cit, cIdx) in article.academicCitations"
                :key="cIdx"
                class="citation-item"
              >
                <strong class="citation-authors">{{ cit.authors }} ({{ localizeDigits(cit.year) }}).</strong>
                <span class="citation-title">«{{ cit.title }}».</span>
                <span class="citation-pub">{{ cit.publication }}.</span>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </main>
  </div>
</template>

<style scoped>
.guide-view-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-2xl);
}

.guide-header-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.guide-main-heading {
  font-size: var(--font-size-lg);
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.guide-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.search-box-row {
  max-width: 500px;
}

.search-icon {
  color: var(--color-text-muted);
}

.categories-filter-bar {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.category-pill {
  background-color: var(--color-bg-surface-elevated);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  padding: var(--spacing-xxs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-pill:hover {
  border-color: var(--color-accent);
  color: var(--color-text-primary);
}

.category-pill.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #ffffff;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.no-results-box {
  background-color: var(--color-bg-surface);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  text-align: center;
  color: var(--color-text-muted);
}

.article-card {
  background-color: var(--color-bg-surface);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.article-card:hover {
  border-color: var(--color-accent-subtle);
}

.article-card.is-expanded {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-sm);
}

.article-header {
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.article-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-category-badge {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
  background-color: var(--color-accent-subtle);
  padding: 1px 8px;
  border-radius: var(--radius-full);
}

.reading-time {
  font-size: 11px;
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.title-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
}

.article-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--color-text-primary);
}

.expand-toggle-btn {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-summary {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.article-full-body {
  padding: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  border-top: var(--border-width-hairline) dashed var(--color-border-subtle);
  padding-top: var(--spacing-md);
}

.takeaways-box {
  background-color: var(--color-success-subtle);
  border: var(--border-width-hairline) solid var(--color-success);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.box-heading {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--spacing-xs);
}

.takeaways-list,
.tips-list {
  padding-right: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.markdown-prose {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.8;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.prose-paragraph p {
  margin: 0;
}

.practical-tips-box {
  background-color: var(--color-bg-surface-soft);
  border: var(--border-width-hairline) solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.citations-box {
  background-color: var(--color-bg-surface-elevated);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
}

.citations-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.citation-item {
  font-size: 11px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  direction: ltr;
  text-align: left;
  font-family: var(--font-family-mono, monospace);
}

.citation-authors {
  color: var(--color-text-primary);
}

.citation-title {
  font-style: italic;
}

.citation-pub {
  color: var(--color-text-muted);
}
</style>
