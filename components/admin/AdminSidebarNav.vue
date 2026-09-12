<template>
  <nav class="flex flex-col gap-1 text-sm">
    <NuxtLink v-for="item in nav" :key="item.to" :to="item.to"
      class="rounded-lg px-3 py-2 font-medium transition-colors" :class="isNavActive(item.to)
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-600 hover:bg-slate-50'
        " @click="emit('navigate')">
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute();

const emit = defineEmits<{
  navigate: [];
}>();

const nav = [
  { to: "/admin", label: "제출 현황" },
  { to: "/admin/teams", label: "팀 매칭-일반용" },
  { to: "/admin/team-system", label: "팀 매칭-팀제용" },
  { to: "/admin/schedule", label: "합주 스케줄 생성" },
  { to: "/admin/manager", label: "부원 정보 관리" },
  { to: "/admin/checklist", label: "체크리스트" },
  { to: "/admin/settings", label: "설정" },
] as const;

function isNavActive(to: string) {
  return route.path === to;
}
</script>
