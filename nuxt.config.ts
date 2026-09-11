// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Netlify: Nitro auto-detects the platform and ships server/api/* as Netlify Functions.
  nitro: {
    // Citizen flags live in Netlify Blobs when built on Netlify (NETLIFY=true is set by
    // the Netlify build image), and on the local filesystem for dev and local builds.
    storage: {
      flags: process.env.NETLIFY
        ? { driver: 'netlify-blobs', name: 'ward-flags', consistency: 'strong' }
        : { driver: 'fs', base: './.data/flags' },
      petitions: process.env.NETLIFY
        ? { driver: 'netlify-blobs', name: 'ward-petitions', consistency: 'strong' }
        : { driver: 'fs', base: './.data/petitions' },
      comments: process.env.NETLIFY
        ? { driver: 'netlify-blobs', name: 'ward-comments', consistency: 'strong' }
        : { driver: 'fs', base: './.data/comments' },
      cache: process.env.NETLIFY
        ? { driver: 'netlify-blobs', name: 'ward-cache' }
        : { driver: 'fs', base: './.data/cache' },
    },
  },

  runtimeConfig: {
    aiApiKey: '',
    public: { appName: 'Where My Ward\'s Money Goes' },
  },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Where My Ward\'s Money Goes',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Your ward\'s budget, what was actually spent, and one tap to ask the BMC why.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800;900&display=swap' },
      ],
    },
  },
})
