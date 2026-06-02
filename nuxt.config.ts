export default defineNuxtConfig({
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss"],
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
      apiMemberSubmissionPath:
        process.env.NUXT_PUBLIC_API_MEMBER_SUBMISSION_PATH ||
        "members/submissions",
      /** 백엔드 호스트 (경로 없음). 예: http://localhost:8080 */
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:8080",
      apiHelloUrl:
        process.env.NUXT_PUBLIC_API_HELLO_URL || "http://localhost:8080/api/hello",
      /** POST 셋리스트: {apiBase}/api/v1/{apiSetlistPath} */
      apiSetlistPath: process.env.NUXT_PUBLIC_API_SETLIST_PATH || "setlists",
    },
  },
});
