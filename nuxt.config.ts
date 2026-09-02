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
        { name: 'apple-mobile-web-app-title', content: 'JAG' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
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
