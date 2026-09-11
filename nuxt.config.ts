// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Netlify: Nitro auto-detects the platform at build time and ships
  // server/api/* as Netlify Functions. No preset needed.

  runtimeConfig: {
    // Server-only secrets. Set via NUXT_* env vars in Netlify, never committed.
    // e.g. NUXT_AI_API_KEY -> useRuntimeConfig().aiApiKey
    aiApiKey: '',
    public: {
      // Safe to expose to the browser.
      appName: 'Somehow We Manage',
    },
  },

  app: {
    head: {
      title: 'Somehow We Manage — CREATE 2026',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
