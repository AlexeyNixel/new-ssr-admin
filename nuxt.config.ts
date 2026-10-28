export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'dayjs-nuxt',
  ],
  css: ['~/assets/css/main.css', '~/assets/css/ck-content.css'],
  ssr: false,
  ui: {
    colorMode: false,
    fonts: false,
    theme: {
      colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'purple'],
    },
  },
  vite: {
    server: {
      proxy: {
        '/site': {
          target: 'https://s3.infomania.ru',
          changeOrigin: true,
        },
        '/dev': {
          target: 'https://s3.infomania.ru/',
          changeOrigin: true,
        },
        '/media': {
          target: 'https://s3.infomania.ru/site',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',
        '@nuxt/ui > prosemirror-gapcursor',
        '@nuxt/ui > prosemirror-tables',
      ],
    },
  },
  runtimeConfig: {
    // Приватная секция — доступна только на сервере (Nitro), в браузер не отдаётся.
    // Используется прокси-роутом server/api/ai/* для обращения к модели.
    ai: {
      baseUrl: process.env.NUXT_AI_BASE_URL || 'https://ai.infomania.ru',
      token: process.env.NUXT_AI_TOKEN || '',
      model: process.env.NUXT_AI_MODEL || 'qwen3:1.7b',
      // Модель эмбеддингов для подбора тегов по смыслу
      embedModel: process.env.NUXT_AI_EMBED_MODEL || 'bge-m3',
    },
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3300',
      // Публичный сайт — кнопка «На сайт» и ссылки «Открыть на сайте»
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://infomania.ru',
    },
  },
});
