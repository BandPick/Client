<template>
  <main class="page">
    <h1>BandPick Nuxt 환경이 준비되었습니다.</h1>
    <p>이제 Nuxt 기반으로 부원/관리자 화면을 구현할 수 있습니다.</p>
    <p class="api">API Base: {{ config.public.apiBase }}</p>
  </main>
</template>

<script setup>
const config = useRuntimeConfig();
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 0.5rem;
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 1.8rem;
}

p {
  margin: 0;
}

.api {
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
