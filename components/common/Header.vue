<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-4 sm:px-6"
  >
    <div class="mx-auto flex max-w-6xl items-center">
      <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold text-blue-600">
        🎸 BandPick
      </NuxtLink>

      <nav class="flex gap-1 rounded-lg bg-slate-100 p-1" aria-label="주요 메뉴">
        <NuxtLink to="/admin" :class="linkClass('admin')">
          기획자
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute();

function linkClass(section: string) {
  const isActive =
    section === "admin" ? route.path.startsWith("/admin") : route.path === "/";
  return isActive
    ? "rounded-lg px-3 py-2 text-sm font-semibold bg-white text-blue-600 shadow-sm"
    : "rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700";
}
</script>
