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
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.API_BASE_URL || 'http://api2.infomania.ru',
    },
  },
});
