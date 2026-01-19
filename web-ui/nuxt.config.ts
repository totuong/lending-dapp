import Aura from '@primevue/themes/aura';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@primevue/nuxt-module'
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark', // Use .dark class for dark mode
          cssLayer: {
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities'
          }
        }
      }
    }
  },
  css: [
    'primeicons/primeicons.css',
    '~/assets/css/main.css'
  ],
  tailwindcss: {
    exposeConfig: true,
    viewer: true
  },
  app: {
    head: {
      title: 'LendSphere - DeFi Protocol',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }
      ],
      meta: [
        { name: 'description', content: 'Next-Gen Decentralized Lending & Borrowing Protocol' },
        { name: 'theme-color', content: '#3b82f6' }
      ]
    }
  }
})
