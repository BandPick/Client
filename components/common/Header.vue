<template>
  <header
    class="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-4 sm:px-6"
  >
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <NuxtLink to="/" class="flex items-center gap-2 text-xl font-bold text-blue-600">
        🎸 BandPick
      </NuxtLink>

      <nav
        class="flex gap-1 rounded-lg bg-slate-100 p-1"
        aria-label="주요 메뉴"
      >
        <NuxtLink to="/member" :class="linkClass('member')">
          부원
        </NuxtLink>
        <NuxtLink to="/admin" :class="linkClass('admin')">
          기획자
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const { section } = useMode();

const base = "px-3 py-1.5 rounded-md text-sm font-medium transition-colors sm:px-4";
const active = "bg-white shadow-sm text-blue-600";
const inactive = "text-slate-500 hover:text-slate-700";

function linkClass(target: "member" | "admin") {
  const isActive = section.value === target;
  return [base, isActive ? active : inactive].join(" ");
}
</script>
