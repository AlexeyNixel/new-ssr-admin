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
  vite: {
    server: {
      proxy: {
        '/site': {
          target: 'http://192.168.0.41:10001',
          changeOrigin: true,
        },
        '/dev': {
          target: 'http://192.168.0.41:10001/',
          changeOrigin: true,
        },
        '/media': {
          target: 'http://192.168.0.41:10001/site',
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
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3300',
    },
  },
});
