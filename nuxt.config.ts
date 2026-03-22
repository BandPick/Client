export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: "2026-03-22",
  app: {
    head: {
      title: "BandPick Client",
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:8080/api/v1",
    },
  },
});
