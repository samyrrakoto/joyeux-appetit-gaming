export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Joyeux Appétit Gaming',
      htmlAttrs: { lang: 'fr' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#26215C' },
      ],
    },
  },

  runtimeConfig: {
    rawgApiKey: '',
  },

  nitro: {
    externals: {
      inline: [],
    },
  },
})
