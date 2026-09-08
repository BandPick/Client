<template>
  <div class="min-h-screen bg-slate-100 text-slate-900">
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold text-indigo-700">기획자</h1>
        </div>
      </div>
    </header>

    <div class="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <aside class="hidden w-52 shrink-0 rounded-xl border border-slate-200 bg-white p-3 md:block">
        <nav class="flex flex-col gap-1 text-sm">
          <NuxtLink v-for="item in nav" :key="item.to" :to="item.to"
            class="rounded-lg px-3 py-2 font-medium transition-colors" :class="isNavActive(item.to)
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-50'
              ">
            {{ item.label }}
          </NuxtLink>
        </nav>
      </aside>

      <div class="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const nav = [
  { to: "/admin", label: "제출 현황" },
  { to: "/admin/members", label: "부원 데이터" },
  { to: "/admin/teams", label: "팀 매칭" },
  { to: "/admin/schedule", label: "합주 스케줄 생성" },
  { to: "/admin/manager", label: "부원 정보 관리" },
  { to: "/admin/checklist", label: "체크리스트" },
  { to: "/admin/settings", label: "설정" },
] as const;

function isNavActive(to: string) {
  return route.path === to;
}
</script>
