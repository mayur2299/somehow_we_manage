<script setup lang="ts">
const { data, status, error, refresh } = await useFetch('/api/health')
</script>

<template>
  <main class="wrap">
    <h1>Somehow We Manage</h1>
    <p>CREATE 2026 base project. Frontend and backend both in Nuxt.</p>

    <section class="card">
      <h2>Backend check</h2>
      <p v-if="status === 'pending'">Calling /api/health…</p>
      <p v-else-if="error">Server route failed: {{ error.message }}</p>
      <pre v-else>{{ data }}</pre>
      <button @click="refresh()">Re-check</button>
    </section>
  </main>
</template>

<style scoped>
.wrap { max-width: 640px; margin: 3rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-top: 1.5rem; }
pre { background: #f6f6f6; padding: 0.75rem; border-radius: 6px; overflow-x: auto; }
button { padding: 0.5rem 1rem; cursor: pointer; }
</style>
