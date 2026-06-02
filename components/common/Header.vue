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
