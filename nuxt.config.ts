// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Netlify: Nitro auto-detects the platform and ships server/api/* as Netlify Functions.
  nitro: {
    // Citizen flags live in Netlify Blobs in production...
    storage: {
      flags: { driver: 'netlify-blobs', name: 'ward-flags', consistency: 'strong' },
    },
    // ...and on the local filesystem during `npm run dev`.
    devStorage: {
      flags: { driver: 'fs', base: './.data/flags' },
    },
  },

  runtimeConfig: {
    aiApiKey: '',
    public: { appName: 'Where My Ward\'s Money Goes' },
  },

  app: {
    head: {
      title: 'Where My Ward\'s Money Goes — K/East Andheri',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
})
